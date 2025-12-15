import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface SessionTimeoutProps {
  /**
   * Tempo de inatividade em minutos antes de mostrar o aviso
   * @default 25
   */
  warningTime?: number;

  /**
   * Tempo total de inatividade em minutos antes de fazer logout
   * @default 30
   */
  logoutTime?: number;

  /**
   * Intervalo de verificação em segundos
   * @default 60
   */
  checkInterval?: number;
}

export function SessionTimeout({
  warningTime = 25,
  logoutTime = 30,
  checkInterval = 60,
}: SessionTimeoutProps) {
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Eventos que indicam atividade do usuário
  const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"];

  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    setShowWarning(false);
  }, []);

  // Registrar atividade do usuário
  useEffect(() => {
    if (!isAuthenticated) return;

    activityEvents.forEach((event) => {
      window.addEventListener(event, updateActivity);
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [isAuthenticated, updateActivity]);

  // Verificar inatividade periodicamente
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const inactiveMinutes = (now - lastActivity) / 1000 / 60;

      if (inactiveMinutes >= logoutTime) {
        // Tempo esgotado, fazer logout
        logout();
        setShowWarning(false);
      } else if (inactiveMinutes >= warningTime) {
        // Mostrar aviso
        const secondsLeft = Math.floor((logoutTime - inactiveMinutes) * 60);
        setTimeLeft(secondsLeft);
        setShowWarning(true);
      }
    }, checkInterval * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, lastActivity, warningTime, logoutTime, checkInterval, logout]);

  // Atualizar contador regressivo
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning, logout]);

  const handleContinue = () => {
    updateActivity();
    setShowWarning(false);
  };

  const handleLogout = () => {
    logout();
    setShowWarning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Sessão Inativa</DialogTitle>
          </div>
          <DialogDescription>
            Sua sessão está prestes a expirar devido à inatividade.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 text-center">
          <div className="text-4xl font-bold text-primary mb-2">{formatTime(timeLeft)}</div>
          <p className="text-sm text-muted-foreground">
            Você será desconectado automaticamente quando o tempo acabar.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Sair Agora
          </Button>
          <Button onClick={handleContinue} className="w-full sm:w-auto">
            Continuar Conectado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para monitorar tempo de sessão
 */
export function useSessionMonitor() {
  const [sessionStart] = useState(Date.now());
  const [sessionDuration, setSessionDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStart) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return {
    sessionDuration,
    formattedDuration: formatDuration(sessionDuration),
  };
}
