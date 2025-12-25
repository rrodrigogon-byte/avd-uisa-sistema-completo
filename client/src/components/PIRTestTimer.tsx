import { useState, useEffect, useCallback } from "react";
import { Clock, AlertTriangle, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PIRTestTimerProps {
  /** Tempo máximo em segundos (padrão: 30 minutos = 1800s) */
  maxTime?: number;
  /** Callback quando o tempo acabar */
  onTimeUp?: () => void;
  /** Callback para atualizar o tempo (a cada segundo) */
  onTimeUpdate?: (elapsedSeconds: number) => void;
  /** Tempo inicial em segundos (para retomar teste) */
  initialTime?: number;
  /** Se o timer está pausado */
  isPaused?: boolean;
  /** Número da questão atual */
  currentQuestion?: number;
  /** Total de questões */
  totalQuestions?: number;
  /** Mostrar tempo por questão */
  showQuestionTime?: boolean;
  /** Tempo gasto na questão atual (em segundos) */
  questionTime?: number;
  /** Tempo médio esperado por questão (em segundos) */
  expectedTimePerQuestion?: number;
  /** Estilo compacto */
  compact?: boolean;
}

export default function PIRTestTimer({
  maxTime = 1800, // 30 minutos
  onTimeUp,
  onTimeUpdate,
  initialTime = 0,
  isPaused = false,
  currentQuestion = 1,
  totalQuestions = 1,
  showQuestionTime = true,
  questionTime = 0,
  expectedTimePerQuestion = 60, // 1 minuto por questão
  compact = false,
}: PIRTestTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(initialTime);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Formatar tempo em MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Calcular tempo restante
  const remainingSeconds = maxTime - elapsedSeconds;
  const remainingPercentage = (remainingSeconds / maxTime) * 100;

  // Calcular tempo médio por questão
  const avgTimePerQuestion = currentQuestion > 0 ? Math.round(elapsedSeconds / currentQuestion) : 0;

  // Calcular tempo estimado para conclusão
  const estimatedTotalTime = avgTimePerQuestion * totalQuestions;
  const isOnTrack = estimatedTotalTime <= maxTime;

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newTime = prev + 1;
        
        // Verificar limites de tempo
        if (newTime >= maxTime) {
          clearInterval(interval);
          onTimeUp?.();
          return maxTime;
        }

        // Atualizar callback
        onTimeUpdate?.(newTime);

        // Verificar alertas
        const remaining = maxTime - newTime;
        const warningThreshold = maxTime * 0.25; // 25% do tempo restante
        const criticalThreshold = maxTime * 0.1; // 10% do tempo restante

        setIsWarning(remaining <= warningThreshold && remaining > criticalThreshold);
        setIsCritical(remaining <= criticalThreshold);

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, maxTime, onTimeUp, onTimeUpdate]);

  // Determinar cor baseada no status
  const getStatusColor = () => {
    if (isCritical) return "text-red-600 bg-red-50 border-red-200";
    if (isWarning) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-gray-700 bg-white border-gray-200";
  };

  // Determinar cor da barra de progresso
  const getProgressColor = () => {
    if (isCritical) return "bg-red-500";
    if (isWarning) return "bg-amber-500";
    if (remainingPercentage > 50) return "bg-green-500";
    return "bg-blue-500";
  };

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
              getStatusColor()
            )}
          >
            {isPaused ? (
              <Pause className="h-4 w-4" />
            ) : isCritical ? (
              <AlertTriangle className="h-4 w-4 animate-pulse" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="font-mono font-medium text-sm">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p>Tempo decorrido: {formatTime(elapsedSeconds)}</p>
            <p>Tempo restante: {formatTime(remainingSeconds)}</p>
            {showQuestionTime && (
              <p>Tempo nesta questão: {formatTime(questionTime)}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        getStatusColor()
      )}
    >
      {/* Cabeçalho com tempo principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isPaused ? (
            <Pause className="h-5 w-5" />
          ) : isCritical ? (
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
          <span className="font-medium">Tempo do Teste</span>
        </div>
        <div className="flex items-center gap-2">
          {isPaused && (
            <Badge variant="outline" className="text-xs">
              PAUSADO
            </Badge>
          )}
          {isCritical && !isPaused && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              TEMPO CRÍTICO
            </Badge>
          )}
          {isWarning && !isCritical && !isPaused && (
            <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
              ATENÇÃO
            </Badge>
          )}
        </div>
      </div>

      {/* Tempo principal */}
      <div className="flex items-baseline justify-center gap-4 mb-3">
        <div className="text-center">
          <div className="font-mono text-3xl font-bold">
            {formatTime(elapsedSeconds)}
          </div>
          <div className="text-xs text-muted-foreground">Decorrido</div>
        </div>
        <div className="text-muted-foreground">/</div>
        <div className="text-center">
          <div className="font-mono text-xl text-muted-foreground">
            {formatTime(maxTime)}
          </div>
          <div className="text-xs text-muted-foreground">Limite</div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={cn("h-full transition-all duration-1000", getProgressColor())}
          style={{ width: `${100 - remainingPercentage}%` }}
        />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="p-2 bg-white/50 rounded">
          <div className="font-mono font-medium">{formatTime(remainingSeconds)}</div>
          <div className="text-xs text-muted-foreground">Restante</div>
        </div>
        {showQuestionTime && (
          <div className="p-2 bg-white/50 rounded">
            <div className="font-mono font-medium">{formatTime(questionTime)}</div>
            <div className="text-xs text-muted-foreground">Esta questão</div>
          </div>
        )}
        <div className="p-2 bg-white/50 rounded">
          <div className="font-mono font-medium">{formatTime(avgTimePerQuestion)}</div>
          <div className="text-xs text-muted-foreground">Média/questão</div>
        </div>
      </div>

      {/* Indicador de ritmo */}
      {currentQuestion > 1 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <div className="flex items-center justify-between text-sm">
            <span>Ritmo:</span>
            <span className={cn("font-medium", isOnTrack ? "text-green-600" : "text-amber-600")}>
              {isOnTrack ? "✓ No ritmo" : "⚠ Acelerando..."}
            </span>
          </div>
          {!isOnTrack && (
            <p className="text-xs text-muted-foreground mt-1">
              Estimativa: {formatTime(estimatedTotalTime)} (limite: {formatTime(maxTime)})
            </p>
          )}
        </div>
      )}
    </div>
  );
}
