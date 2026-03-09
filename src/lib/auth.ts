import { SignJWT, jwtVerify } from "jose";
import { AUTH_CODE, DURATION_EXPIRE_TIME } from "@/constants/auth";
import { ACCESS_TOKEN_EXPIRE_TIME, CACHE_DURATION } from "@/constants/auth";
import { User } from "@/types/auth";
import CrudOperations from '@/lib/crud-operations';
import { JWTPayload } from "./api-utils";

interface CachedAuthCrud {
  usersCrud: CrudOperations;
  sessionsCrud: CrudOperations;
  refreshTokensCrud: CrudOperations;
  userPasscodeCrud: CrudOperations;
  createdAt: number;
}

// JWT config
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

let cachedAuthCrud: CachedAuthCrud | null = null;

/**
 *crud instances of system auth operations
 *crud instances that are not operated by the system auth need to be created by oneself and this method is not allowed
 */
export async function authCrudOperations(): Promise<{
  usersCrud: CrudOperations;
  sessionsCrud: CrudOperations;
  refreshTokensCrud: CrudOperations;
  userPasscodeCrud: CrudOperations;
}> {
  const now = Date.now();
  if (!cachedAuthCrud || now - cachedAuthCrud.createdAt > CACHE_DURATION * 1000) {
    // Use Supabase service role key for admin CRUD operations.
    // This bypasses RLS and gives full access to all tables.
    const serviceRoleKey = process.env.POSTGREST_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!serviceRoleKey) {
      console.warn("[auth] No service role key found — falling back to generated admin JWT");
    }

    const adminToken = serviceRoleKey || await generateAdminUserToken();

    cachedAuthCrud = {
      usersCrud: new CrudOperations("users", adminToken),
      sessionsCrud: new CrudOperations("sessions", adminToken),
      refreshTokensCrud: new CrudOperations("refresh_tokens", adminToken),
      userPasscodeCrud: new CrudOperations("user_passcode", adminToken),
      createdAt: now,
    };
  }
  return cachedAuthCrud;
}

// Create an admin token
export async function generateAdminUserToken() {
  const adminUserToken = await generateToken({
    sub: "",
    email: "",
    role: process.env.SCHEMA_ADMIN_USER || "",
  }, DURATION_EXPIRE_TIME);

  return adminUserToken;
}

// Generate access token
export async function generateToken(user: Omit<User, "isAdmin"> & { name?: string }, expiresIn: number = ACCESS_TOKEN_EXPIRE_TIME): Promise<string> {
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    sub: user.sub.toString(),
    email: user.email,
    role: user.role,
    isAdmin: user.role === process.env.SCHEMA_ADMIN_USER,
    ...(user.name ? { name: user.name } : {}),
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`)
    .sign(JWT_SECRET);

  return token;
}

// Verify JWT token
export async function verifyToken(
  token?: string | null
): Promise<{ valid: boolean; code: string; payload: JWTPayload | null }> {
  if (!token) {
    return {
      valid: false,
      code: AUTH_CODE.TOKEN_MISSING,
      payload: null,
    };
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return {
      valid: true,
      code: AUTH_CODE.SUCCESS,
      payload: payload as unknown as JWTPayload,
    };
  } catch (error: any) {
    // Expired - notify client to refresh token
    if (error.code === "ERR_JWT_EXPIRED") {
      return { valid: false, code: AUTH_CODE.TOKEN_EXPIRED, payload: null };
    }
    // All other cases treated as invalid signature - require re-login
    return { valid: false, code: AUTH_CODE.TOKEN_MISSING, payload: null };
  }
}
