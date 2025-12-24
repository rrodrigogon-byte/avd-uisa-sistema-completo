import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface FivePercentRuleValidatorProps {
  totalEmployees: number;
  evaluatedEmployees: number;
  showDetails?: boolean;
  className?: string;
}

/**
 * Componente de validação da regra 5%
 * 
 * A regra 5% estabelece que pelo menos 5% dos funcionários devem ser avaliados
 * para que o ciclo de avaliação seja considerado válido.
 * 
 * Este componente:
 * - Calcula automaticamente o mínimo necessário (5% do total)
 * - Mostra indicador visual de progresso
 * - Alerta quando a regra não é cumprida
 * - Bloqueia ações quando necessário
 */
export function FivePercentRuleValidator({
  totalEmployees,
  evaluatedEmployees,
  showDetails = true,
  className = "",
}: FivePercentRuleValidatorProps) {
  // Calcular mínimo necessário (5% do total, arredondado para cima)
  const minimumRequired = Math.ceil(totalEmployees * 0.05);
  
  // Verificar se a regra foi cumprida
  const isRuleMet = evaluatedEmployees >= minimumRequired;
  
  // Calcular porcentagem atual
  const currentPercentage = totalEmployees > 0 
    ? (evaluatedEmployees / totalEmployees) * 100 
    : 0;
  
  // Calcular progresso em relação ao mínimo
  const progressToMinimum = minimumRequired > 0
    ? Math.min((evaluatedEmployees / minimumRequired) * 100, 100)
    : 100;

  return (
    <div className={className}>
      <Alert variant={isRuleMet ? "default" : "destructive"} className="border-2">
        <div className="flex items-start gap-3">
          {isRuleMet ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          )}
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <AlertTitle className="mb-0 flex items-center gap-2">
                Regra 5% de Avaliações
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        A regra 5% estabelece que pelo menos 5% dos funcionários 
                        devem ser avaliados para garantir a representatividade 
                        estatística do ciclo de avaliação.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </AlertTitle>
              
              <Badge variant={isRuleMet ? "default" : "destructive"}>
                {isRuleMet ? "✓ Cumprida" : "✗ Não Cumprida"}
              </Badge>
            </div>

            <AlertDescription>
              {isRuleMet ? (
                <span className="text-green-700 dark:text-green-300 font-medium">
                  Mínimo de avaliações atingido! O ciclo pode ser finalizado.
                </span>
              ) : (
                <span className="font-medium">
                  Atenção: O mínimo de avaliações ainda não foi atingido. 
                  São necessárias mais {minimumRequired - evaluatedEmployees} avaliações.
                </span>
              )}
            </AlertDescription>

            {showDetails && (
              <div className="space-y-3 mt-4">
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-background/50 p-3 rounded-md border">
                    <p className="text-muted-foreground text-xs mb-1">Total de Funcionários</p>
                    <p className="text-lg font-bold">{totalEmployees}</p>
                  </div>
                  
                  <div className="bg-background/50 p-3 rounded-md border">
                    <p className="text-muted-foreground text-xs mb-1">Avaliados</p>
                    <p className="text-lg font-bold text-blue-600">{evaluatedEmployees}</p>
                  </div>
                  
                  <div className="bg-background/50 p-3 rounded-md border">
                    <p className="text-muted-foreground text-xs mb-1">Mínimo Necessário (5%)</p>
                    <p className="text-lg font-bold text-orange-600">{minimumRequired}</p>
                  </div>
                  
                  <div className="bg-background/50 p-3 rounded-md border">
                    <p className="text-muted-foreground text-xs mb-1">Porcentagem Atual</p>
                    <p className="text-lg font-bold text-purple-600">
                      {currentPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progresso em relação ao mínimo:
                    </span>
                    <span className="font-semibold">
                      {progressToMinimum.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={progressToMinimum} 
                    className="h-3"
                    indicatorClassName={isRuleMet ? "bg-green-600" : "bg-orange-600"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {isRuleMet 
                      ? `${evaluatedEmployees - minimumRequired} avaliações acima do mínimo` 
                      : `Faltam ${minimumRequired - evaluatedEmployees} avaliações para atingir o mínimo`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}
