"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "./AuthProvider";
import { Loader2, HardHat, Mail, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onForgotPassword?: () => void;
}

/* Google icon SVG */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginForm({ onSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const { login, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data.email, data.password);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.errorMessage || "Error al iniciar sesión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError("Google login no está configurado. Contacta al administrador.");
        setIsGoogleLoading(false);
        return;
      }

      const w = window as any;
      if (!w.google?.accounts?.oauth2) {
        setError("Error cargando Google Sign-In. Recarga la página.");
        setIsGoogleLoading(false);
        return;
      }

      const tokenClient = w.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (response: any) => {
          if (response.error) {
            setError("Inicio con Google cancelado.");
            setIsGoogleLoading(false);
            return;
          }
          try {
            await googleLogin(response.access_token);
            onSuccess?.();
          } catch (err: any) {
            setError(err?.errorMessage || "Error al iniciar sesión con Google.");
          } finally {
            setIsGoogleLoading(false);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch {
      setError("Error al iniciar sesión con Google.");
      setIsGoogleLoading(false);
    }
  };

  // Load Google Identity Services script
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).google?.accounts) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <div
      className="w-full rounded-3xl p-8"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex flex-col items-center gap-3">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,146,60,0.1))",
              border: "1px solid rgba(245,158,11,0.3)",
              boxShadow: "0 0 24px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <HardHat className="h-7 w-7 text-amber-400" />
          </div>
          <div>
            <p
              className="text-base font-black tracking-tight"
              style={{
                background: "linear-gradient(90deg, #fbbf24, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              CLARIFICA
            </p>
            <p className="text-2xl font-bold text-white mt-0.5">Bienvenido de vuelta</p>
            <p className="text-sm text-muted-foreground mt-1">Inicia sesión para continuar</p>
          </div>
        </div>
      </div>

      {/* Google Sign-In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={anyLoading}
        className="relative w-full rounded-xl py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
        style={{
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "inherit",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
        }}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">o</span>
        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive" className="rounded-xl border-red-500/30 bg-red-500/8">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              {...register("email")}
              disabled={anyLoading}
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "inherit",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.4)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(245,158,11,0.08)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
            />
          </div>
          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
              Contraseña
            </label>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                disabled={anyLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={anyLoading}
              className="w-full rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "inherit",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.4)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 3px rgba(245,158,11,0.08)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
            />
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={anyLoading}
          className="relative w-full rounded-xl py-3 text-sm font-bold text-white overflow-hidden transition-all duration-200 active:scale-[0.98] mt-2 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #d97706, #f59e0b, #ea580c)",
            boxShadow: "0 4px 20px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.2)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.2)";
          }}
        >
          {/* Shimmer */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.2) 50%, transparent 80%)",
              backgroundSize: "200% 100%",
              animation: "shimmer-sweep 2.5s ease-in-out infinite",
            }}
            aria-hidden
          />
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Entrando..." : "Entrar"}
          </span>
        </button>

        {onSwitchToRegister && (
          <p className="text-center text-sm text-muted-foreground pt-1">
            ¿No tienes cuenta?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
              disabled={anyLoading}
            >
              Regístrate gratis
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
