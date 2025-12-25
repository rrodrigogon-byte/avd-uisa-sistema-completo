/**
 * Hook para captura e tracking de erros no frontend
 */

import { useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Envia erro para o backend
 */
// Variável global para armazenar a função de mutation
let logErrorMutation: any = null;

export function setLogErrorMutation(mutation: any) {
  logErrorMutation = mutation;
}

async function sendErrorToBackend(errorInfo: ErrorInfo): Promise<void> {
  try {
    console.error("[Error Tracking]", errorInfo);
    
    // Enviar para backend via tRPC
    if (logErrorMutation) {
      await logErrorMutation({
        message: errorInfo.message,
        stack: errorInfo.stack,
        url: errorInfo.url,
        userAgent: errorInfo.userAgent,
      });
    }
  } catch (err) {
    // Falha silenciosa para não quebrar a aplicação
    console.error("[Error Tracking] Failed to send error:", err);
  }
}

/**
 * Hook para capturar erros globais
 */
export function useErrorTracking() {
  const utils = trpc.useUtils();
  const logClientError = trpc.errorMonitoring.logClientError.useMutation();
  
  useEffect(() => {
    // Configurar mutation para uso global
    setLogErrorMutation(logClientError.mutateAsync);
    // Capturar erros não tratados
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      
      const errorInfo: ErrorInfo = {
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      
      sendErrorToBackend(errorInfo);
      
      // Mostrar toast apenas em desenvolvimento
      if (process.env.NODE_ENV === "development") {
        toast.error("Erro detectado", {
          description: event.message,
        });
      }
    };

    // Capturar promises rejeitadas não tratadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      
      const errorInfo: ErrorInfo = {
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      
      sendErrorToBackend(errorInfo);
      
      // Mostrar toast apenas em desenvolvimento
      if (process.env.NODE_ENV === "development") {
        toast.error("Promise rejeitada", {
          description: errorInfo.message,
        });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}

/**
 * Função utilitária para capturar erros em try-catch
 */
export function captureError(
  error: Error,
  context?: Record<string, any>
): void {
  const errorInfo: ErrorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
  
  sendErrorToBackend({
    ...errorInfo,
    ...context,
  } as ErrorInfo);
  
  // Mostrar toast apenas em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    toast.error("Erro capturado", {
      description: error.message,
    });
  }
}
