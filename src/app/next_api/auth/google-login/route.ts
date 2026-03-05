import { NextRequest } from "next/server";
import { requestMiddleware, getRequestIp, validateRequestBody } from "@/lib/api-utils";
import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { generateToken, authCrudOperations } from "@/lib/auth";
import { generateRandomString, pbkdf2Hash } from "@/lib/server-utils";
import { REFRESH_TOKEN_EXPIRE_TIME } from "@/constants/auth";
import { z } from "zod";
import { userRegisterCallback } from "@/lib/user-register";

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const ip = getRequestIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const body = await validateRequestBody(request);

    const googleAccessToken = body.access_token;

    if (!googleAccessToken) {
      return createErrorResponse({
        errorMessage: "No se proporcionó token de Google",
        status: 400,
      });
    }

    // Use Google's userinfo endpoint to get user data from the access token
    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!googleRes.ok) {
      return createErrorResponse({
        errorMessage: "Token de Google inválido o expirado",
        status: 401,
      });
    }

    const googleUser = await googleRes.json();
    const email = googleUser.email;
    const name = googleUser.name || "";

    if (!email) {
      return createErrorResponse({
        errorMessage: "No se pudo obtener el email de la cuenta de Google",
        status: 400,
      });
    }

    const { usersCrud, sessionsCrud, refreshTokensCrud } =
      await authCrudOperations();

    const users = await usersCrud.findMany({ email });

    let user = users?.[0];

    if (!user) {
      const userData = {
        email,
        password: "GOOGLE-OAUTH",
        name,
      };

      user = await usersCrud.create(userData);

      // Custom extension hooks after user registration.
      await userRegisterCallback(user);
    }

    const accessToken = await generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await generateRandomString();
    const hashedRefreshToken = await pbkdf2Hash(refreshToken);

    const sessionData = {
      user_id: user.id,
      ip: ip,
      user_agent: userAgent,
    };
    const session = await sessionsCrud.create(sessionData);
    const sessionId = session.id;

    const refreshTokenData = {
      user_id: user.id,
      session_id: sessionId,
      token: hashedRefreshToken,
      expires_at: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000
      ).toISOString(),
    };

    await refreshTokensCrud.create(refreshTokenData);

    return createAuthResponse({ accessToken, refreshToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    return createErrorResponse({
      errorMessage: "Login failed. Please try again later",
      status: 500,
    });
  }
}, false);
