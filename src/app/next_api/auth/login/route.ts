import { NextRequest } from "next/server";
import { requestMiddleware, validateRequestBody, getRequestIp } from "@/lib/api-utils";
import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { generateToken, authCrudOperations } from "@/lib/auth";
import { generateRandomString, pbkdf2Hash, verifyHashString } from "@/lib/server-utils";
import { REFRESH_TOKEN_EXPIRE_TIME } from "@/constants/auth";
import { z } from "zod";
import CrudOperations from "@/lib/crud-operations";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const ip = getRequestIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    const body = await validateRequestBody(request);
    const validatedData = loginSchema.parse(body);

    const { usersCrud, sessionsCrud, refreshTokensCrud } =
      await authCrudOperations();

    const users = await usersCrud.findMany({ email: validatedData.email });
    const user = users?.[0];

    if (!user) {
      return createErrorResponse({
        errorMessage: "Correo o contraseña incorrectos",
        status: 401,
      });
    }

    const isValidPassword = await verifyHashString(
      validatedData.password,
      user.password
    );

    if (!isValidPassword) {
      return createErrorResponse({
        errorMessage: "Correo o contraseña incorrectos",
        status: 401,
      });
    }

    const serviceRoleKey = process.env.POSTGREST_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const profilesCrud = new CrudOperations("user_profiles", serviceRoleKey);
    const profiles = await profilesCrud.findMany({ user_id: parseInt(user.id) }).catch(() => null);
    const name: string | undefined = profiles?.[0]?.name;

    const accessToken = await generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
      name,
    });

    const refreshToken = generateRandomString();
    const hashedRefreshToken = pbkdf2Hash(refreshToken);

    const session = await sessionsCrud.create({
      user_id: user.id,
      ip: ip,
      user_agent: userAgent,
    });

    await refreshTokensCrud.create({
      user_id: user.id,
      session_id: session.id,
      token: hashedRefreshToken,
      expires_at: new Date(
        Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000
      ).toISOString(),
    });

    console.log(`[login] User ${validatedData.email} logged in successfully`);
    return createAuthResponse({ accessToken, refreshToken });
  } catch (error: any) {
    console.error("[login] Error:", error?.message || error);
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    return createErrorResponse({
      errorMessage: "Error al iniciar sesión. Intenta de nuevo.",
      status: 500,
    });
  }
}, false);
