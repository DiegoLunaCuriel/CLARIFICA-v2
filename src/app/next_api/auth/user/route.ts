import { NextRequest } from "next/server";
import { requestMiddleware, ApiParams } from "@/lib/api-utils";
import { createSuccessResponse, createErrorResponse } from "@/lib/create-response";
import { AUTH_ENABLED } from "@/config/auth-config";

export const GET = requestMiddleware(async (request: NextRequest, params: ApiParams) => {
  // If auth is disabled, return a mock user so the app works
  if (!AUTH_ENABLED) {
    return createSuccessResponse({
      sub: "0",
      email: "invitado@clarifica.mx",
      role: "guest",
      isAdmin: false,
    });
  }

  // Auth enabled: payload is set by requestMiddleware after JWT verification
  if (!params.payload) {
    return createErrorResponse({
      errorMessage: "No autenticado",
      status: 401,
    });
  }

  return createSuccessResponse({
    sub: params.payload.sub,
    email: params.payload.email,
    role: params.payload.role,
    isAdmin: params.payload.isAdmin || false,
    name: params.payload.name,
  });
}, true); // checkToken = true
