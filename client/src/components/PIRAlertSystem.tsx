import { useState, useEffect, useCallback } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  Clock, 
  Eye, 
  EyeOff, 
  Users, 
  Zap, 
  X,
  Bell,
  Shield,
  Activity
} from "lucide-react";
import { toast } from "sonner";

/**
 * Sistema de Alertas em Tempo Real para o Teste PIR
 * Monitora comportamentos suspeitos durante a realização do teste
 */

export interface PIRAlert {
  id: string;
  type: 'speed' | 'pattern' | 'pause' | 'face' | 'focus' | 'time';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  details?: string;
}

interface PIRAlertSystemProps {
  elapsedTime: number;
  answeredCount: number;
  totalQuestions: number;
  isPaused: boolean;
  pauseCount: number;
  isRecording: boolean;
  onAlertGenerated?: (alert: PIRAlert) => void;
}

const severityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const severityIcons = {
  low: Activity,
  medium: AlertTriangle,
  high: AlertTriangle,
  critical: Shield,
};

export default function PIRAlertSystem({
  elapsedTime,
  answeredCount,
  totalQuestions,
  isPaused,
  pauseCount,
  isRecording,
  onAlertGenerated,
}: PIRAlertSystemProps) {
  const [alerts, setAlerts] = useState<PIRAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(true);
  const [lastAlertTime, setLastAlertTime] = useState<Record<string, number>>({});

  // Gerar ID único para alerta
  const generateAlertId = () => `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Adicionar novo alerta
  const addAlert = useCallback((alert: Omit<PIRAlert, 'id' | 'timestamp'>) => {
    // Evitar alertas duplicados em curto período (30 segundos)
    const now = Date.now();
    const lastTime = lastAlertTime[alert.type] || 0;
    if (now - lastTime < 30000) return;

    const newAlert: PIRAlert = {
      ...alert,
      id: generateAlertId(),
      timestamp: new Date(),
    };

    setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Manter últimos 10 alertas
    setLastAlertTime(prev => ({ ...prev, [alert.type]: now }));

    // Notificar componente pai
    if (onAlertGenerated) {
      onAlertGenerated(newAlert);
    }

    // Toast para alertas críticos
    if (alert.severity === 'critical') {
      toast.error(alert.message, { duration: 5000 });
    } else if (alert.severity === 'high') {
      toast.warning(alert.message, { duration: 4000 });
    }
  }, [lastAlertTime, onAlertGenerated]);

  // Monitorar velocidade de resposta
  useEffect(() => {
    if (answeredCount >= 5 && elapsedTime > 0) {
      const avgTimePerAnswer = elapsedTime / answeredCount;
      
      // Muito rápido (menos de 3 segundos por questão)
      if (avgTimePerAnswer < 3) {
        addAlert({
          type: 'speed',
          severity: 'critical',
          message: 'Velocidade de resposta extremamente alta detectada',
          details: `Média de ${avgTimePerAnswer.toFixed(1)} segundos por questão. Isso pode indicar respostas aleatórias.`,
        });
      }
      // Rápido (menos de 5 segundos por questão)
      else if (avgTimePerAnswer < 5) {
        addAlert({
          type: 'speed',
          severity: 'high',
          message: 'Respostas muito rápidas detectadas',
          details: `Média de ${avgTimePerAnswer.toFixed(1)} segundos por questão. Recomendamos ler cada questão com atenção.`,
        });
      }
      // Moderadamente rápido (menos de 10 segundos)
      else if (avgTimePerAnswer < 10 && answeredCount >= 20) {
        addAlert({
          type: 'speed',
          severity: 'medium',
          message: 'Ritmo de resposta acelerado',
          details: `Média de ${avgTimePerAnswer.toFixed(1)} segundos por questão.`,
        });
      }
    }
  }, [answeredCount, elapsedTime, addAlert]);

  // Monitorar pausas excessivas
  useEffect(() => {
    if (pauseCount >= 5) {
      addAlert({
        type: 'pause',
        severity: 'high',
        message: 'Múltiplas pausas detectadas',
        details: `O teste foi pausado ${pauseCount} vezes. Pausas frequentes podem afetar a validade do teste.`,
      });
    } else if (pauseCount >= 3) {
      addAlert({
        type: 'pause',
        severity: 'medium',
        message: 'Pausas frequentes detectadas',
        details: `O teste foi pausado ${pauseCount} vezes.`,
      });
    }
  }, [pauseCount, addAlert]);

  // Monitorar tempo total excessivo
  useEffect(() => {
    const expectedTime = totalQuestions * 30; // 30 segundos por questão
    
    if (elapsedTime > expectedTime * 3 && answeredCount < totalQuestions * 0.5) {
      addAlert({
        type: 'time',
        severity: 'medium',
        message: 'Tempo de teste prolongado',
        details: 'O tempo de realização está muito acima do esperado para o número de questões respondidas.',
      });
    }
  }, [elapsedTime, answeredCount, totalQuestions, addAlert]);

  // Monitorar se gravação de vídeo está ativa
  useEffect(() => {
    if (!isRecording && answeredCount > 10) {
      addAlert({
        type: 'face',
        severity: 'low',
        message: 'Gravação de vídeo não ativa',
        details: 'A gravação de vídeo não está ativa. Considere ativar para validação adicional.',
      });
    }
  }, [isRecording, answeredCount, addAlert]);

  // Remover alerta
  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  // Limpar todos os alertas
  const clearAllAlerts = () => {
    setAlerts([]);
    toast.success("Todos os alertas foram limpos");
  };

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-600" />
            Alertas do Sistema
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAlerts(!showAlerts)}
            >
              {showAlerts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllAlerts}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {showAlerts && (
        <CardContent className="py-2 space-y-2">
          {alerts.map((alert) => {
            const Icon = severityIcons[alert.severity];
            return (
              <Alert
                key={alert.id}
                className={`${severityColors[alert.severity]} border`}
              >
                <Icon className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium flex items-center justify-between">
                  {alert.message}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => dismissAlert(alert.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </AlertTitle>
                {alert.details && (
                  <AlertDescription className="text-xs mt-1">
                    {alert.details}
                  </AlertDescription>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {alert.timestamp.toLocaleTimeString('pt-BR')}
                </div>
              </Alert>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Hook para usar o sistema de alertas
 */
export function usePIRAlerts() {
  const [alerts, setAlerts] = useState<PIRAlert[]>([]);

  const addAlert = useCallback((alert: PIRAlert) => {
    setAlerts(prev => [alert, ...prev]);
  }, []);

  const getAlertsSummary = useCallback(() => {
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length,
      types: {
        speed: alerts.filter(a => a.type === 'speed').length,
        pattern: alerts.filter(a => a.type === 'pattern').length,
        pause: alerts.filter(a => a.type === 'pause').length,
        face: alerts.filter(a => a.type === 'face').length,
        focus: alerts.filter(a => a.type === 'focus').length,
        time: alerts.filter(a => a.type === 'time').length,
      },
    };
  }, [alerts]);

  return {
    alerts,
    addAlert,
    getAlertsSummary,
    clearAlerts: () => setAlerts([]),
  };
}
