import { useEffect, useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, Pause, Play, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

/**
 * Componente de Rastreamento Automático de Tempo
 * Monitora atividade do usuário e registra tempo de trabalho automaticamente
 */

interface ActivitySession {
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  idleTime: number; // em segundos
  activeTime: number; // em segundos
}

export function AutoTimeTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<ActivitySession | null>(null);
  const [idleThreshold] = useState(300); // 5 minutos em segundos
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [isIdle, setIsIdle] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveMutation = trpc.timeTracking.saveSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão de trabalho salva!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar sessão: " + error.message);
    },
  });

  // Detectar atividade do usuário
  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(Date.now());
      if (isIdle) {
        setIsIdle(false);
        toast.info("Atividade detectada - rastreamento retomado");
      }
    };

    // Eventos que indicam atividade do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isIdle]);

  // Monitorar inatividade
  useEffect(() => {
    if (!isTracking || !currentSession) return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = Math.floor((now - lastActivityTime) / 1000);

      if (timeSinceLastActivity >= idleThreshold && !isIdle) {
        setIsIdle(true);
        toast.warning("Inatividade detectada - rastreamento pausado");
        
        setCurrentSession(prev => prev ? {
          ...prev,
          idleTime: prev.idleTime + timeSinceLastActivity
        } : null);
      } else if (!isIdle && currentSession) {
        // Atualizar tempo ativo
        setCurrentSession(prev => prev ? {
          ...prev,
          activeTime: prev.activeTime + 1
        } : null);
      }
    }, 1000); // Verificar a cada segundo

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTracking, lastActivityTime, isIdle, idleThreshold, currentSession]);

  const handleStartTracking = () => {
    const session: ActivitySession = {
      startTime: new Date(),
      isActive: true,
      idleTime: 0,
      activeTime: 0,
    };
    
    setCurrentSession(session);
    setIsTracking(true);
    setLastActivityTime(Date.now());
    toast.success("Rastreamento de tempo iniciado!");
  };

  const handleStopTracking = () => {
    if (!currentSession) return;

    const endedSession = {
      ...currentSession,
      endTime: new Date(),
      isActive: false,
    };

    setCurrentSession(endedSession);
    setIsTracking(false);

    // Salvar sessão no backend
    saveMutation.mutate({
      startTime: endedSession.startTime.toISOString(),
      endTime: endedSession.endTime.toISOString(),
      activeMinutes: Math.floor(endedSession.activeTime / 60),
      idleMinutes: Math.floor(endedSession.idleTime / 60),
    });

    toast.success("Rastreamento de tempo finalizado!");
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getTotalSessionTime = () => {
    if (!currentSession) return 0;
    
    const endTime = currentSession.endTime || new Date();
    const duration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
    return duration;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rastreamento Automático
            </CardTitle>
            <CardDescription>
              Monitora automaticamente seu tempo de trabalho e atividade
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="tracking-toggle" className="text-sm">
              {isTracking ? "Ativo" : "Inativo"}
            </Label>
            <Switch
              id="tracking-toggle"
              checked={isTracking}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleStartTracking();
                } else {
                  handleStopTracking();
                }
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTracking && currentSession ? (
          <>
            {/* Status Atual */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {isIdle ? (
                  <Pause className="h-8 w-8 text-orange-500 animate-pulse" />
                ) : (
                  <Activity className="h-8 w-8 text-green-500 animate-pulse" />
                )}
                <div>
                  <p className="font-semibold">
                    {isIdle ? "Pausado (Inativo)" : "Rastreando Atividade"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Iniciado às {currentSession.startTime.toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              </div>
              <Badge variant={isIdle ? "secondary" : "default"} className="text-lg px-4 py-2">
                {formatTime(getTotalSessionTime())}
              </Badge>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-muted-foreground">Tempo Ativo</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatTime(currentSession.activeTime)}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <EyeOff className="h-4 w-4 text-orange-600" />
                  <p className="text-sm font-medium text-muted-foreground">Tempo Inativo</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatTime(currentSession.idleTime)}
                </p>
              </div>
            </div>

            {/* Produtividade */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Taxa de Produtividade</p>
                <p className="text-2xl font-bold text-blue-600">
                  {getTotalSessionTime() > 0
                    ? Math.round((currentSession.activeTime / getTotalSessionTime()) * 100)
                    : 0}%
                </p>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-900 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${getTotalSessionTime() > 0
                      ? (currentSession.activeTime / getTotalSessionTime()) * 100
                      : 0}%`
                  }}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleStopTracking}
              >
                <Pause className="h-4 w-4 mr-2" />
                Finalizar Sessão
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Rastreamento de tempo não está ativo
            </p>
            <Button onClick={handleStartTracking}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Rastreamento
            </Button>
          </div>
        )}

        {/* Informações */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p>• O rastreamento detecta automaticamente quando você está inativo</p>
          <p>• Após 5 minutos sem atividade, o tempo é pausado</p>
          <p>• Todos os dados são salvos automaticamente ao finalizar</p>
        </div>
      </CardContent>
    </Card>
  );
}
