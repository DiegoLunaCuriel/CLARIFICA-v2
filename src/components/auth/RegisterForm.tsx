"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "./AuthProvider";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "Ingresa tu nombre"),
  userType: z.enum(["homeowner", "contractor", "builder"], {
    required_error: "Selecciona un tipo de usuario",
  }),
});

const verificationSchema = z.object({
  passcode: z
    .string()
    .min(6, "Ingresa el código de 6 dígitos")
    .max(6, "El código debe tener 6 dígitos"),
});

type CredentialsFormData = z.infer<typeof credentialsSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) {
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPassword, setUserPassword] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userType, setUserType] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const firstOtpRef = useRef<HTMLInputElement>(null);

  const credentialsForm = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsSchema),
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const sendVerificationCode = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await api.post("/auth/send-verification", {
        email,
        type: "register",
      });

      return true;
    } catch (err: any) {
      setError(
        err.errorMessage ||
          "No se pudo enviar el código de verificación. Intenta de nuevo."
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialsSubmit = async (data: CredentialsFormData) => {
    setUserEmail(data.email);
    setUserPassword(data.password);
    setUserName(data.name);
    setUserType(data.userType);

    // Try to send verification email (may fail if Resend not configured)
    const success = await sendVerificationCode(data.email);

    // Always go to step 2 — clear any send error so user can try "000000" in dev
    setError(null);
    setCurrentStep(2);

    if (success) {
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    if (currentStep === 2 && firstOtpRef.current) {
      setTimeout(() => {
        firstOtpRef.current?.focus();
      }, 100);
    }
  }, [currentStep]);

  const handleVerificationSubmit = async (data: VerificationFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await registerUser(
        userEmail,
        userPassword,
        data.passcode,
        userName,
        userType
      );
      onSuccess?.();
    } catch (err: any) {
      setError(
        err.errorMessage || "Error al registrar. Intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    const success = await sendVerificationCode(userEmail);
    if (success) {
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const goBackToCredentials = () => {
    setCurrentStep(1);
    setError(null);
    verificationForm.reset();
  };

  return (
    <div className="sm:rounded-lg sm:border sm:bg-card sm:text-card-foreground sm:shadow-sm w-full max-w-md mx-auto">
      <div className="flex flex-col items-center justify-center gap-[10px] py-[20px]">
        <div className="flex items-center gap-2">
          {currentStep === 2 && (
            <button
              type="button"
              onClick={goBackToCredentials}
              className="p-[5px] hover:bg-accent rounded cursor-pointer"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="text-center text-2xl font-semibold">
            {currentStep === 1 ? "Crear cuenta" : "Código de verificación"}
          </div>
        </div>
      </div>
      <div className="p-6 pt-0">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {currentStep === 1 && (
          <form
            onSubmit={credentialsForm.handleSubmit(handleCredentialsSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">Nombre</div>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                {...credentialsForm.register("name")}
                disabled={isLoading}
              />
              {credentialsForm.formState.errors.name && (
                <p className="text-sm text-red-500">
                  {credentialsForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">Correo electrónico</div>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                {...credentialsForm.register("email")}
                disabled={isLoading}
              />
              {credentialsForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {credentialsForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">
                Contraseña
              </div>
              <Input
                id="password"
                type="password"
                placeholder="mínimo 6 caracteres"
                {...credentialsForm.register("password")}
                disabled={isLoading}
              />
              {credentialsForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {credentialsForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="mb-[4px] h-[22px] text-sm font-medium">
                Tipo de usuario
              </div>
              <Select
                onValueChange={(value) =>
                  credentialsForm.setValue("userType", value as any)
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homeowner">Dueño de casa</SelectItem>
                  <SelectItem value="contractor">Contratista</SelectItem>
                  <SelectItem value="builder">Constructor</SelectItem>
                </SelectContent>
              </Select>
              {credentialsForm.formState.errors.userType && (
                <p className="text-sm text-red-500">
                  {credentialsForm.formState.errors.userType.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full my-[10px]"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear cuenta
            </Button>

            {onSwitchToLogin && (
              <div className="text-center text-sm flex items-center justify-center gap-2">
                <span className="text-center text-muted-foreground">
                  ¿Ya tienes cuenta?
                </span>
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="cursor-pointer hover:underline"
                  disabled={isLoading}
                >
                  Inicia sesión
                </button>
              </div>
            )}
          </form>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground mb-6">
              Enviamos un código de verificación a{" "}
              <span className="font-medium">{userEmail}</span>
            </div>

            {/* Dev mode hint */}
            {process.env.NODE_ENV !== "production" && (
              <div className="text-center text-xs text-amber-500 bg-amber-500/10 rounded-md px-3 py-2 mb-2">
                Modo desarrollo: usa <strong>000000</strong> como código
              </div>
            )}

            <form
              onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    disabled={isLoading}
                    value={verificationForm.watch("passcode") || ""}
                    onChange={(value) =>
                      verificationForm.setValue("passcode", value)
                    }
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot
                        ref={firstOtpRef}
                        index={0}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={1}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={2}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={3}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={4}
                        className="rounded-md border border-input"
                      />
                      <InputOTPSlot
                        index={5}
                        className="rounded-md border border-input"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Ingresa el código de verificación
                </div>
                {verificationForm.formState.errors.passcode && (
                  <p className="text-sm text-red-500 text-center">
                    {verificationForm.formState.errors.passcode.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full my-[10px]"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  ¿No recibiste el código?{" "}
                </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="cursor-pointer hover:underline"
                  disabled={isLoading || resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Reenviar (${resendCooldown}s)`
                    : "Reenviar código"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
