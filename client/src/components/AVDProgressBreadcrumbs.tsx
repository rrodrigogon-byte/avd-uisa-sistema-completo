import { CheckCircle2, Circle, Lock, ArrowRight } from "lucide-react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface AVDProgressBreadcrumbsProps {
  currentStep: number;
  completedSteps: number[];
  processId: number;
  onStepClick?: (step: number) => void;
}

const STEPS: Step[] = [
  { number: 1, title: "Dados Pessoais", description: "Informações básicas" },
  { number: 2, title: "PIR", description: "Perfil de Identidade de Relacionamento" },
  { number: 3, title: "Competências", description: "Avaliação de competências" },
  { number: 4, title: "Desempenho", description: "Avaliação consolidada" },
  { number: 5, title: "PDI", description: "Plano de Desenvolvimento Individual" },
];

/**
 * Componente de breadcrumbs com indicador de progresso visual para os 5 passos AVD
 * 
 * Funcionalidades:
 * - Mostra progresso visual de cada passo
 * - Indica passo atual, concluídos e bloqueados
 * - Permite navegação para passos concluídos ou atual
 * - Design responsivo para mobile
 * - Cores e ícones intuitivos
 */
export default function AVDProgressBreadcrumbs({
  currentStep,
  completedSteps,
  processId,
  onStepClick,
}: AVDProgressBreadcrumbsProps) {
  const [, navigate] = useLocation();

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    if (stepNumber < currentStep) return "available";
    return "locked";
  };

  const canNavigateToStep = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    return status === "completed" || status === "current" || status === "available";
  };

  const handleStepClick = (stepNumber: number) => {
    if (!canNavigateToStep(stepNumber)) return;
    
    if (onStepClick) {
      onStepClick(stepNumber);
    } else if (processId > 0) {
      navigate(`/avd/processo/passo${stepNumber}/${processId}`);
    }
  };

  const getStepIcon = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    
    if (status === "completed") {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    }
    if (status === "current") {
      return <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />;
    }
    if (status === "locked") {
      return <Lock className="w-5 h-5 text-gray-400" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const progressPercentage = Math.round((completedSteps.length / STEPS.length) * 100);

  return (
    <div className="w-full bg-white border-b shadow-sm">
      <div className="container py-6">
        {/* Header com título e progresso */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Processo de Avaliação AVD</h2>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep} de {STEPS.length}: {STEPS[currentStep - 1]?.title}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-xs text-muted-foreground">Concluído</div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.number);
            const isLast = index === STEPS.length - 1;
            const isClickable = canNavigateToStep(step.number);

            return (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center transition-all",
                    isClickable && "cursor-pointer hover:opacity-80",
                    !isClickable && "cursor-not-allowed"
                  )}
                >
                  {/* Ícone e número */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                      status === "completed" && "border-green-600 bg-green-50",
                      status === "current" && "border-blue-600 bg-blue-50 ring-4 ring-blue-100",
                      status === "available" && "border-gray-300 bg-white",
                      status === "locked" && "border-gray-200 bg-gray-50"
                    )}
                  >
                    {getStepIcon(step.number)}
                  </div>

                  {/* Título e descrição */}
                  <div className="mt-2 text-center">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        status === "completed" && "text-green-700",
                        status === "current" && "text-blue-700",
                        status === "available" && "text-gray-700",
                        status === "locked" && "text-gray-400"
                      )}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 max-w-[120px]">
                      {step.description}
                    </div>
                  </div>
                </button>

                {/* Linha conectora */}
                {!isLast && (
                  <div className="flex-1 mx-4 mt-[-40px]">
                    <div
                      className={cn(
                        "h-1 transition-all rounded-full",
                        completedSteps.includes(step.number) ? "bg-green-600" : "bg-gray-200"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Lista de passos */}
          <div className="space-y-2">
            {STEPS.map((step) => {
              const status = getStepStatus(step.number);
              const isClickable = canNavigateToStep(step.number);
              
              return (
                <button
                  key={step.number}
                  onClick={() => handleStepClick(step.number)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg w-full text-left transition-all",
                    status === "current" && "bg-blue-50 border border-blue-200",
                    status === "completed" && "bg-green-50 border border-green-200",
                    isClickable && "hover:bg-gray-50",
                    !isClickable && "opacity-60"
                  )}
                >
                  {getStepIcon(step.number)}
                  <div className="flex-1">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        status === "completed" && "text-green-700",
                        status === "current" && "text-blue-700",
                        status === "locked" && "text-gray-400"
                      )}
                    >
                      Passo {step.number}: {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {step.description}
                    </div>
                  </div>
                  {status === "completed" && (
                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                      Concluído
                    </span>
                  )}
                  {status === "current" && (
                    <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                      Em andamento
                    </span>
                  )}
                  {status === "locked" && (
                    <span className="text-xs text-gray-400 font-medium">
                      Bloqueado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Botão de navegação rápida */}
        {currentStep < 5 && completedSteps.includes(currentStep) && (
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => handleStepClick(currentStep + 1)}
              className="gap-2"
            >
              Próximo Passo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
