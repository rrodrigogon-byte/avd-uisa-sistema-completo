import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  ArrowRight, 
  Award, 
  BarChart, 
  Brain, 
  CheckCircle, 
  Clock, 
  Lightbulb, 
  TrendingUp, 
  User,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Dashboard do Processo AVD
 * Acompanhamento do progresso nos 5 passos
 */
export default function ProcessoDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Buscar dados do funcionário
  const { data: employeeData } = trpc.employees.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Buscar progresso do processo
  const { data: processProgress, isLoading } = trpc.avd.getProcessProgress.useQuery(
    { employeeId: employeeData?.id || 0 },
    { enabled: !!employeeData?.id }
  );

  const steps = [
    {
      id: 1,
      title: "Dados Pessoais",
      description: "Informações pessoais e profissionais",
      icon: User,
      path: "/avd/processo/passo1",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      id: 2,
      title: "PIR",
      description: "Perfil de Identidade de Relacionamento",
      icon: Brain,
      path: "/avd/processo/passo2",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      id: 3,
      title: "Competências",
      description: "Avaliação de competências técnicas e comportamentais",
      icon: Award,
      path: "/avd/processo/passo3",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      id: 4,
      title: "Desempenho",
      description: "Consolidação e análise de desempenho",
      icon: TrendingUp,
      path: "/avd/processo/passo4",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      id: 5,
      title: "PDI",
      description: "Plano de Desenvolvimento Individual",
      icon: Lightbulb,
      path: "/avd/processo/passo5",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
  ];

  const completedSteps = processProgress?.completedSteps || 0;
  const currentStep = processProgress?.currentStep || 1;
  const progressPercentage = (completedSteps / 5) * 100;

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "pending";
  };

  const handleStepClick = (stepId: number, path: string) => {
    // Só permite acessar o passo atual ou passos já completados
    if (stepId <= currentStep) {
      if (processProgress?.processId) {
        setLocation(`${path}/${processProgress.processId}`);
      } else {
        setLocation(path);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando progresso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Processo de Avaliação AVD</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso no processo de avaliação de desempenho em 5 passos
        </p>
      </div>

      {/* Card de Progresso Geral */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Progresso Geral
          </CardTitle>
          <CardDescription>
            Você completou {completedSteps} de 5 passos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {progressPercentage.toFixed(0)}% Concluído
              </span>
              <span className="text-sm text-muted-foreground">
                {completedSteps === 5 ? "Processo Finalizado! 🎉" : `Passo ${currentStep} de 5`}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            {completedSteps === 5 ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  Parabéns! Você completou todas as etapas do processo de avaliação.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Continue para o próximo passo para avançar no processo.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Passos */}
      <div className="grid gap-4">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          const isAccessible = step.id <= currentStep;

          return (
            <Card
              key={step.id}
              className={`transition-all ${
                status === "current"
                  ? "border-primary shadow-lg"
                  : status === "completed"
                  ? "border-green-500"
                  : "opacity-60"
              } ${isAccessible ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}`}
              onClick={() => isAccessible && handleStepClick(step.id, step.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full ${step.bgColor} ${step.color}`}
                    >
                      {status === "completed" ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Passo {step.id}: {step.title}
                        {status === "current" && (
                          <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                            Atual
                          </span>
                        )}
                        {status === "completed" && (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 rounded-full">
                            Concluído
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>

                  {isAccessible && (
                    <Button
                      variant={status === "current" ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStepClick(step.id, step.path);
                      }}
                    >
                      {status === "completed" ? "Revisar" : "Continuar"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  
                  {!isAccessible && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      Bloqueado
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Informações Adicionais */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Progresso Sequencial</p>
              <p className="text-sm text-muted-foreground">
                Os passos devem ser completados em ordem. Você pode revisar passos anteriores a qualquer momento.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">Salvamento Automático</p>
              <p className="text-sm text-muted-foreground">
                Seus dados são salvos automaticamente ao avançar para o próximo passo.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div>
              <p className="font-medium">Prazo de Conclusão</p>
              <p className="text-sm text-muted-foreground">
                Recomendamos completar todo o processo em até 7 dias corridos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
