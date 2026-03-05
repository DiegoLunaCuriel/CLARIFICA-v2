import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "./create-response";
import { AUTH_ENABLED, authConfig } from "../config/auth-config";
import { AUTH_CODE } from "@/constants/auth";
import { User } from "@/types/auth";

export interface JWTPayload extends User {
  iat: number;
  exp: number;
}

export interface ApiParams {
  token?: string;
  payload?: JWTPayload | null;
}

export function getCookies(request: NextRequest, names: string[]): string[] {
  const cookies = request.cookies.getAll();
  return (
    cookies
      .filter((cookie) => names.includes(cookie.name))
      .map((cookie) => cookie.value) || []
  );
}

export function validateEnv(): void {
  const requiredVars = ["POSTGREST_URL", "POSTGREST_SCHEMA", "POSTGREST_API_KEY"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return {
    limit: parseInt(searchParams.get("limit") || "10"),
    offset: parseInt(searchParams.get("offset") || "0"),
    id: searchParams.get("id"),
    search: searchParams.get("search"),
    project_id: searchParams.get("project_id"),
  };
}

export async function validateRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      throw new Error("Invalid request body");
    }

    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Higher-order function to verify token - use this to protect API routes
 * When AUTH_ENABLED is false, token verification is skipped
 *
 * @param handler - The request handler function
 * @param checkToken - Whether to check the token (only effective when AUTH_ENABLED is true)
 */
export function requestMiddleware(
  handler: (request: NextRequest, params: ApiParams) => Promise<Response>,
  checkToken: boolean = true
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      const params: ApiParams = {};

      // Only verify token when AUTH_ENABLED is true and checkToken is true
      if (AUTH_ENABLED && checkToken) {
        // Dynamic import to avoid loading auth module when not needed
        const { verifyToken } = await import("./auth");

        const [token] = getCookies(request, [authConfig.tokenCookieName]);
        const { code, payload } = await verifyToken(token);

        if (code === AUTH_CODE.TOKEN_EXPIRED) {
          return createErrorResponse({
            errorCode: AUTH_CODE.TOKEN_EXPIRED,
            errorMessage: "need login",
            status: 401,
          });
        } else if (code === AUTH_CODE.TOKEN_MISSING) {
          return createErrorResponse({
            errorCode: AUTH_CODE.TOKEN_MISSING,
            errorMessage: "need login",
            status: 401,
          });
        }

        params.token = token;
        params.payload = payload;
      }

      return await handler(request, params);
    } catch (error: unknown) {
      // Pass through Response objects as-is
      if (error instanceof Response) {
        return error;
      }

      console.error("Request middleware error:", error);

      const anyError = error as any;
      const errorMessage: string =
        typeof anyError?.message === "string"
          ? anyError.message
          : "Request failed";
      const status: number =
        typeof anyError?.status === "number"
          ? anyError.status
          : typeof anyError?.statusCode === "number"
            ? anyError.statusCode
            : 500;
      const errorCode: string | undefined =
        typeof anyError?.code === "string" ? anyError.code : undefined;

      return createErrorResponse({
        errorCode,
        errorMessage,
        status,
      });
    }
  };
}

export function responseRedirect(url: string, callbackUrl?: string) {
  const redirectUrl = new URL(url);
  if (callbackUrl) {
    redirectUrl.searchParams.set("redirect", callbackUrl);
  }
  return NextResponse.redirect(redirectUrl);
}

export function getRequestIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-client-ip") ||
    "unknown"
  );
}

export async function sendVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  const htmlTemplate = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Verificación — CLARIFICA</title>
</head>
<body style="margin:0;padding:0;background-color:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Preheader (invisible preview text) -->
  <span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#0c0a09;max-height:0;max-width:0;opacity:0;overflow:hidden;">Tu código de verificación para CLARIFICA: ${code}</span>

  <!-- Outer wrapper -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#0c0a09;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <!-- Card -->
        <table width="560" border="0" cellpadding="0" cellspacing="0" role="presentation"
          style="width:560px;max-width:560px;background-color:#111118;border-radius:20px;overflow:hidden;border:1px solid rgba(245,158,11,0.18);box-shadow:0 0 60px rgba(245,158,11,0.08),0 24px 64px rgba(0,0,0,0.6);">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1c1408 0%,#251a05 60%,#1a1020 100%);padding:40px 32px 36px;text-align:center;border-bottom:1px solid rgba(245,158,11,0.15);">

              <!-- HardHat icon placeholder (emoji fallback for email clients) -->
              <div style="display:inline-block;width:52px;height:52px;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.35);border-radius:14px;line-height:52px;font-size:26px;margin-bottom:16px;">🪖</div>

              <h1 style="margin:0 0 4px 0;font-size:22px;font-weight:900;letter-spacing:2px;
                background:linear-gradient(90deg,#fbbf24,#fb923c);
                -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                background-clip:text;color:#fbbf24;">CLARIFICA</h1>

              <p style="margin:0;color:#6b7280;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">Hub de Construcción Inteligente</p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:40px 40px 32px;text-align:center;">

              <h2 style="margin:0 0 12px 0;color:#f9fafb;font-size:20px;font-weight:700;">Verifica tu correo</h2>

              <p style="margin:0 0 32px 0;color:#9ca3af;font-size:15px;line-height:1.6;">
                Usa el siguiente código para completar tu registro.<br>
                <strong style="color:#d1d5db;">No lo compartas con nadie.</strong>
              </p>

              <!-- Code box -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin:0 auto 28px auto;">
                <tr>
                  <td style="background:rgba(245,158,11,0.08);border:2px solid rgba(245,158,11,0.5);border-radius:14px;padding:20px 44px;
                    font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;
                    letter-spacing:10px;color:#fbbf24;text-align:center;
                    box-shadow:0 0 30px rgba(245,158,11,0.15),inset 0 1px 0 rgba(255,255,255,0.05);">
                    ${code}
                  </td>
                </tr>
              </table>

              <!-- Expiry -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;margin:0 auto 24px auto;">
                <tr>
                  <td style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;
                    padding:10px 20px;color:#f87171;font-size:13px;font-weight:600;text-align:center;">
                    ⏱ Expira en <strong>3 minutos</strong>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#4b5563;font-size:12px;line-height:1.6;">
                Si no creaste una cuenta en CLARIFICA, puedes ignorar este correo.
              </p>

            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding:0 32px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(245,158,11,0.2),transparent);"></div>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:20px 32px 28px;text-align:center;">
              <p style="margin:0 0 4px 0;color:#374151;font-size:11px;">
                © 2025 CLARIFICA — Hub de Construcción Inteligente
              </p>
              <p style="margin:0;color:#374151;font-size:11px;">
                Este es un correo automático, por favor no respondas.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  if (process.env.RESEND_KEY) {
    const fromAddress = process.env.RESEND_FROM || "CLARIFICA <noreply@clarifica.site>";
    const resend = new Resend(process.env.RESEND_KEY);
    await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: "🪖 Tu código de verificación — CLARIFICA",
      html: htmlTemplate,
    });
    return true;

  }

  // En desarrollo sin RESEND_KEY no bloqueamos el flujo
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[DEV] RESEND_KEY no configurada. Email de verificacion NO enviado.",
      { email, code }
    );
    return true;
  }

  throw new Error("RESEND_KEY es requerida en produccion para enviar verificacion.");
}

export function setCookie(
  response: Response,
  name: string,
  value: string,
  options: {
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
  } = {}
): void {
  const { path = "/", maxAge, httpOnly = true } = options;

  const secureFlag = "Secure; ";
  const sameSite = "None";
  const httpOnlyFlag = httpOnly ? "HttpOnly; " : "";
  const maxAgeFlag = maxAge !== undefined ? `Max-Age=${maxAge}; ` : "";

  const cookieValue = `${name}=${value}; ${httpOnlyFlag}${secureFlag}SameSite=${sameSite}; ${maxAgeFlag}Path=${path}`;

  response.headers.append("Set-Cookie", cookieValue);
}

export function clearCookie(
  response: Response,
  name: string,
  path: string = "/"
): void {
  setCookie(response, name, "", { path, maxAge: 0 });
}

