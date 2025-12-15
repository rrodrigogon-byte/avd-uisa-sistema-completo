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
  AlertCircle,
  Play,
  RefreshCw,
  Loader2,
  UserPlus
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

/**
 * Dashboard do Processo AVD
 * Acompanhamento do progresso nos 5 passos
 */
export default function ProcessoDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Buscar dados do funcionário
  const { data: employeeData, isLoading: loadingEmployee, refetch: refetchEmployee } = trpc.employees.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Buscar progresso do processo
  const { data: processProgress, isLoading: loadingProgress, refetch } = trpc.avd.getProcessProgress.useQuery(
    { employeeId: employeeData?.id || 0 },
    { enabled: !!employeeData?.id }
  );

  // Mutation para criar funcionário automaticamente
  const createEmployeeForUser = trpc.avd.createEmployeeForCurrentUser.useMutation({
    onSuccess: () => {
      toast.success("Perfil de funcionário criado com sucesso!");
      refetchEmployee();
    },
    onError: (error) => {
      toast.error(`Erro ao criar perfil: ${error.message}`);
    },
  });

  // Mutation para criar ou obter processo
  const getOrCreateProcess = trpc.avd.getOrCreateProcess.useMutation({
    onSuccess: (data) => {
      if (data.isNew) {
        toast.success("Processo de avaliação iniciado!");
      }
      // Navegar para o passo atual
      setLocation(`/avd/processo/passo${data.currentStep}/${data.processId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao iniciar processo: ${error.message}`);
    },
  });

  const steps = [
    {
      id: 1,
      title: "Dados Pessoais",
      description: "Informações pessoais e profissionais",
      icon: User,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      borderColor: "border-blue-500",
    },
    {
      id: 2,
      title: "PIR",
      description: "Perfil de Identidade de Relacionamento",
      icon: Brain,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      borderColor: "border-purple-500",
    },
    {
      id: 3,
      title: "Competências",
      description: "Avaliação de competências técnicas e comportamentais",
      icon: Award,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      borderColor: "border-green-500",
    },
    {
      id: 4,
      title: "Desempenho",
      description: "Consolidação e análise de desempenho",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      borderColor: "border-orange-500",
    },
    {
      id: 5,
      title: "PDI",
      description: "Plano de Desenvolvimento Individual",
      icon: Lightbulb,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      borderColor: "border-amber-500",
    },
  ];

  const completedSteps = processProgress?.completedSteps || 0;
  const currentStep = processProgress?.currentStep || 1;
  const processId = processProgress?.processId;
  const progressPercentage = (completedSteps / 5) * 100;
  const isProcessStarted = !!processId;

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "pending";
  };

  const handleCreateEmployee = () => {
    createEmployeeForUser.mutate();
  };

  const handleStartProcess = () => {
    if (!employeeData?.id) {
      toast.error("Erro: Dados do funcionário não encontrados");
      return;
    }
    getOrCreateProcess.mutate({ employeeId: employeeData.id });
  };

  const handleStepClick = (stepId: number) => {
    // Só permite acessar o passo atual ou passos já completados
    if (stepId <= currentStep && processId) {
      setLocation(`/avd/processo/passo${stepId}/${processId}`);
    }
  };

  const isLoading = loadingEmployee || loadingProgress;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando progresso...</p>
        </div>
      </div>
    );
  }

  // Se o usuário não tem funcionário associado, mostrar tela para criar
  if (!employeeData) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-6 w-6" />
              Perfil de Funcionário Necessário
            </CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-300">
              Para iniciar o processo de avaliação, é necessário ter um perfil de funcionário associado à sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <UserPlus className="h-10 w-10 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-center max-w-md">
                <h3 className="text-lg font-semibold mb-2">Bem-vindo ao Sistema AVD!</h3>
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para criar automaticamente seu perfil de funcionário 
                  e começar o processo de avaliação de desempenho.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  <strong>Usuário:</strong> {user?.name || user?.email || 'Não identificado'}
                </p>
              </div>
              <Button 
                size="lg" 
                onClick={handleCreateEmployee}
                disabled={createEmployeeForUser.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {createEmployeeForUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando Perfil...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Meu Perfil de Funcionário
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Processo de Avaliação AVD</h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso no processo de avaliação de desempenho em 5 passos
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Card de Progresso Geral */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Progresso Geral
          </CardTitle>
          <CardDescription>
            {isProcessStarted 
              ? `Você completou ${completedSteps} de 5 passos`
              : "Inicie seu processo de avaliação"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isProcessStarted ? (
              <>
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
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Continue para o próximo passo para avançar no processo.
                      </p>
                    </div>
                    <Button onClick={() => handleStepClick(currentStep)}>
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Pronto para começar?</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Inicie seu processo de avaliação de desempenho. Você passará por 5 etapas 
                    que ajudarão a identificar seus pontos fortes e áreas de desenvolvimento.
                  </p>
                </div>
                <Button 
                  size="lg" 
                  onClick={handleStartProcess}
                  disabled={getOrCreateProcess.isPending}
                >
                  {getOrCreateProcess.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Avaliação
                    </>
                  )}
                </Button>
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
          const isAccessible = isProcessStarted && step.id <= currentStep;

          return (
            <Card
              key={step.id}
              className={`transition-all ${
                status === "current"
                  ? `border-2 ${step.borderColor} shadow-lg`
                  : status === "completed"
                  ? "border-green-500 bg-green-50/30 dark:bg-green-950/30"
                  : "opacity-60"
              } ${isAccessible ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}`}
              onClick={() => isAccessible && handleStepClick(step.id)}
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
                          <span className="px-2 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full animate-pulse">
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
                        handleStepClick(step.id);
                      }}
                    >
                      {status === "current" ? "Continuar" : "Revisar"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  {!isAccessible && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Não iniciado</span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
