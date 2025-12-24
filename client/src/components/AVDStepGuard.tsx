import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AVDStepGuardProps {
  currentStep: number;
  processId: number;
  children: React.ReactNode;
}

const STEP_NAMES = {
  1: "Dados Pessoais",
  2: "PIR - Perfil de Identidade de Relacionamento",
  3: "Avaliação de Competências",
  4: "Avaliação de Desempenho",
  5: "Plano de Desenvolvimento Individual (PDI)",
};

/**
 * Componente de proteção de rotas para garantir fluxo sequencial dos 5 passos AVD
 * 
 * Funcionalidades:
 * - Verifica se o passo anterior foi concluído antes de permitir acesso
 * - Redireciona automaticamente para o passo correto se usuário tentar pular
 * - Mostra loading enquanto valida permissões
 * - Exibe mensagem informativa quando passo não está disponível
 * 
 * Uso:
 * <AVDStepGuard currentStep={2} processId={processId}>
 *   <ConteudoDoPasso2 />
 * </AVDStepGuard>
 */
export default function AVDStepGuard({ currentStep, processId, children }: AVDStepGuardProps) {
  const [, navigate] = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState<number | null>(null);
  
  // Buscar status do processo
  const { data: processStatus, isLoading, error } = trpc.avd.getProcessStatus.useQuery(
    { processId },
    { 
      enabled: !!processId && processId > 0,
      retry: 1,
    }
  );

  useEffect(() => {
    if (!isLoading && processStatus && processId > 0) {
      const { currentStep: allowedStep, completedSteps } = processStatus;
      
      // Verificar se o passo atual está disponível
      // Passo está disponível se:
      // 1. É o passo atual do processo (allowedStep)
      // 2. Ou é um passo já concluído (para revisão)
      // 3. Ou é o passo 1 (sempre disponível para iniciar)
      const isStepAvailable = 
        currentStep === 1 || 
        currentStep <= allowedStep ||
        completedSteps.includes(currentStep);
      
      if (!isStepAvailable) {
        setShouldRedirect(true);
        setRedirectTarget(allowedStep);
      }
    }
  }, [isLoading, processStatus, currentStep, processId]);

  // Redirecionar se necessário
  useEffect(() => {
    if (shouldRedirect && redirectTarget && processId > 0) {
      const timer = setTimeout(() => {
        navigate(`/avd/processo/passo${redirectTarget}/${processId}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect, redirectTarget, processId, navigate]);

  // Loading state
  if (isLoading && processId > 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se processId é 0 ou inválido, permitir acesso (novo processo)
  if (!processId || processId <= 0) {
    return <>{children}</>;
  }

  // Erro ao carregar status
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Erro ao Verificar Acesso
            </CardTitle>
            <CardDescription>
              Não foi possível verificar suas permissões para este passo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/avd/processo/dashboard")} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Passo não disponível - mostrar mensagem e redirecionar
  if (shouldRedirect && redirectTarget) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Passo Não Disponível
            </CardTitle>
            <CardDescription>
              Você precisa completar os passos anteriores antes de acessar o{" "}
              <strong>Passo {currentStep}: {STEP_NAMES[currentStep as keyof typeof STEP_NAMES]}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Você será redirecionado automaticamente para o{" "}
                <strong>Passo {redirectTarget}: {STEP_NAMES[redirectTarget as keyof typeof STEP_NAMES]}</strong>
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/avd/processo/dashboard")}
                className="flex-1"
              >
                Ir ao Dashboard
              </Button>
              <Button 
                onClick={() => navigate(`/avd/processo/passo${redirectTarget}/${processId}`)}
                className="flex-1"
              >
                Ir ao Passo {redirectTarget}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não conseguiu carregar status mas não há erro, permitir acesso (fail-safe)
  if (!processStatus) {
    return <>{children}</>;
  }

  // Passo está liberado, renderizar conteúdo
  return <>{children}</>;
}
