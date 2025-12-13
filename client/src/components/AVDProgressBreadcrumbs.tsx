import { CheckCircle2, Circle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface AVDProgressBreadcrumbsProps {
  currentStep: number;
  completedSteps: number[];
  processId: number;
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
 * - Design responsivo para mobile
 * - Cores e ícones intuitivos
 */
export default function AVDProgressBreadcrumbs({
  currentStep,
  completedSteps,
  processId,
}: AVDProgressBreadcrumbsProps) {
  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) return "completed";
    if (stepNumber === currentStep) return "current";
    if (stepNumber < currentStep) return "available";
    return "locked";
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

  return (
    <div className="w-full bg-white border-b">
      <div className="container py-6">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between">
          {STEPS.map((step, index) => {
            const status = getStepStatus(step.number);
            const isLast = index === STEPS.length - 1;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  {/* Ícone e número */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                      status === "completed" && "border-green-600 bg-green-50",
                      status === "current" && "border-blue-600 bg-blue-50",
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
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>

                {/* Linha conectora */}
                {!isLast && (
                  <div className="flex-1 mx-4 mt-[-40px]">
                    <div
                      className={cn(
                        "h-0.5 transition-all",
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-gray-900">
                Passo {currentStep} de {STEPS.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {STEPS[currentStep - 1]?.title}
              </div>
            </div>
            <div className="text-sm font-medium text-blue-600">
              {Math.round((completedSteps.length / STEPS.length) * 100)}% concluído
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${(completedSteps.length / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Lista de passos */}
          <div className="mt-4 space-y-2">
            {STEPS.map((step) => {
              const status = getStepStatus(step.number);
              
              return (
                <div
                  key={step.number}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    status === "current" && "bg-blue-50 border border-blue-200"
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
                      {step.title}
                    </div>
                  </div>
                  {status === "completed" && (
                    <span className="text-xs text-green-600 font-medium">Concluído</span>
                  )}
                  {status === "current" && (
                    <span className="text-xs text-blue-600 font-medium">Em andamento</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
