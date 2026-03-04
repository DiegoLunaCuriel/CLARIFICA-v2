import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import {
  createErrorResponse,
  createAuthResponse,
} from "@/lib/create-response";
import { requestMiddleware, validateRequestBody, getRequestIp } from "@/lib/api-utils";
import { generateToken, authCrudOperations } from "@/lib/auth";
import { verifyHashString, generateRandomString, pbkdf2Hash } from "@/lib/server-utils";
import { userRegisterCallback } from "@/lib/user-register";
import { REFRESH_TOKEN_EXPIRE_TIME } from "@/constants/auth";

export const POST = requestMiddleware(
  async (request: NextRequest) => {
    try {
      const body = await validateRequestBody(request);
      const { email, password, passcode, name, userType } = body;

      if (!email || !password) {
        return createErrorResponse({
          errorMessage: "Email y contraseña son requeridos",
          status: 400,
        });
      }

      const { usersCrud, userPasscodeCrud, sessionsCrud, refreshTokensCrud } =
        await authCrudOperations();

      // Check if user already exists
      const existingUsers = await usersCrud.findMany({ email });
      if (existingUsers && existingUsers.length > 0) {
        return createErrorResponse({
          errorMessage: "Este correo ya está registrado",
          status: 400,
        });
      }

      // ── Verify passcode ──
      // In dev mode, "000000" bypasses email verification
      const isDev = process.env.NODE_ENV !== "production";
      const devBypass = isDev && passcode === "000000";

      if (!devBypass) {
        if (!passcode) {
          return createErrorResponse({
            errorMessage: "Código de verificación requerido",
            status: 400,
          });
        }

        const passcodes = await userPasscodeCrud.findMany({
          pass_object: email,
          revoked: false,
        });

        if (!passcodes || passcodes.length === 0) {
          return createErrorResponse({
            errorMessage: "Código de verificación inválido o expirado",
            status: 400,
          });
        }

        // The passcode stored in DB is hashed with bcrypt — compare properly
        let validPasscode = null;
        for (const p of passcodes) {
          const isMatch = await verifyHashString(passcode, p.passcode);
          const notExpired = !p.valid_until || new Date(p.valid_until) > new Date();
          const notRevoked = !p.revoked;

          if (isMatch && notExpired && notRevoked) {
            validPasscode = p;
            break;
          }
        }

        if (!validPasscode) {
          return createErrorResponse({
            errorMessage: "Código de verificación inválido o expirado",
            status: 400,
          });
        }

        // Revoke used passcode
        await userPasscodeCrud.update(validPasscode.id, { revoked: true });
      } else {
        console.log("[DEV] Bypassing email verification for:", email);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await usersCrud.create({
        email,
        password: hashedPassword,
        role: process.env.SCHEMA_USER || "authenticated",
      });

      // Call user register callback with additional data (profile creation)
      await userRegisterCallback({
        id: newUser.id.toString(),
        email: newUser.email,
        role: newUser.role,
        name,
        userType,
      });

      // Generate access token
      const accessToken = await generateToken({
        sub: newUser.id.toString(),
        email: newUser.email,
        role: newUser.role,
      });

      // Generate refresh token + session (so login persists)
      const ip = getRequestIp(request);
      const userAgent = request.headers.get("user-agent") || "unknown";
      const refreshToken = generateRandomString();
      const hashedRefreshToken = pbkdf2Hash(refreshToken);

      const session = await sessionsCrud.create({
        user_id: newUser.id,
        ip,
        user_agent: userAgent,
      });

      await refreshTokensCrud.create({
        user_id: newUser.id,
        session_id: session.id,
        token: hashedRefreshToken,
        expires_at: new Date(
          Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000
        ).toISOString(),
      });

      return createAuthResponse({ accessToken, refreshToken });
    } catch (error: any) {
      console.error("Register error:", error);
      return createErrorResponse({
        errorMessage: error?.message || "Error al registrar. Intenta de nuevo.",
        status: 500,
      });
    }
  },
  false
);
