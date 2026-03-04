import { AUTH_ENABLED, authConfig } from "../config/auth-config";
import { AUTH_CODE } from "@/constants/auth";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorMessage?: string;
  errorCode?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public errorMessage: string,
    public errorCode?: string
  ) {
    super(errorMessage);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(authConfig.refreshPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) return false;

    const result: ApiResponse = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit,
  isRetry = false
): Promise<T> {
  try {
    const response = await fetch(`/next_api${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    const result: ApiResponse<T> = await response.json();

    // Auth-enabled: token missing
    if (AUTH_ENABLED && result.errorCode === AUTH_CODE.TOKEN_MISSING) {
      throw new ApiError(401, "need login", AUTH_CODE.TOKEN_MISSING);
    }

    // Auth-enabled: token expired -> try refresh once
    if (
      AUTH_ENABLED &&
      response.status === 401 &&
      result.errorCode === AUTH_CODE.TOKEN_EXPIRED &&
      !isRetry
    ) {
      if (isRefreshing && refreshPromise) {
        const ok = await refreshPromise;
        if (ok) return apiRequest<T>(endpoint, options, true);
        throw new ApiError(401, "need login", AUTH_CODE.TOKEN_EXPIRED);
      }

      isRefreshing = true;
      refreshPromise = refreshToken();
      try {
        const ok = await refreshPromise;
        if (ok) return apiRequest<T>(endpoint, options, true);
        throw new ApiError(401, "need login", AUTH_CODE.TOKEN_EXPIRED);
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    }

    if (!response.ok || !result.success) {
      throw new ApiError(
        response.status,
        result.errorMessage || "API request failed",
        result.errorCode
      );
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    console.error("API request error:", error);
    throw new ApiError(500, "Network error or invalid response");
  }
}

export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: "GET" });
  },

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};

export { ApiError };
export type { ApiResponse };
