"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; cause?: any };
  reset?: () => void;
}) {
  const [errorDetails, setErrorDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    const details: Record<string, any> = {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };

    details.url = window.location.href;
    details.timestamp = new Date().toISOString();

    setErrorDetails(details);
  }, [error]);

  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-4 p-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-2xl font-semibold text-destructive">
        Algo salió mal
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-md">
        Ocurrió un error inesperado. Puedes intentar recargar la página o
        volver al inicio.
      </p>

      <div className="flex gap-3 mt-2">
        <Button
          onClick={() => {
            if (reset) {
              reset();
            } else {
              window.location.reload();
            }
          }}
          variant="default"
          className="cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>

        <Button
          onClick={() => {
            window.location.href = "/";
          }}
          variant="outline"
          className="cursor-pointer"
        >
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}
