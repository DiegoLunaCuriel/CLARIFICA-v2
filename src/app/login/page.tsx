"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { HardHat, LogIn, ArrowRight } from "lucide-react";

type AuthMode = "login" | "register" | "reset";

function AuthContent() {
  const [mode, setMode] = useState<AuthMode>("login");
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* ── Aurora background ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          style={{
            position: "absolute",
            width: "80%",
            height: "70%",
            top: "-20%",
            left: "-20%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "aurora-1 12s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "70%",
            height: "70%",
            top: "-10%",
            right: "-20%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "aurora-2 15s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "50%",
            height: "50%",
            bottom: "0",
            left: "30%",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
            filter: "blur(50px)",
            animation: "aurora-3 18s ease-in-out infinite",
          }}
        />
        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Forms */}
        {mode === "login" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LoginForm
              onSuccess={() => router.push("/")}
              onSwitchToRegister={() => setMode("register")}
              onForgotPassword={() => setMode("reset")}
            />
          </div>
        )}
        {mode === "register" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <RegisterForm
              onSuccess={() => router.push("/")}
              onSwitchToLogin={() => setMode("login")}
            />
          </div>
        )}
        {mode === "reset" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ResetPasswordForm
              onSuccess={() => setMode("login")}
            />
          </div>
        )}

        {/* Explore link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            onClick={() => router.push("/")}
          >
            <LogIn className="h-3.5 w-3.5" />
            Explorar sin cuenta
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="h-12 w-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <HardHat className="h-6 w-6 text-amber-400 animate-pulse" />
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
