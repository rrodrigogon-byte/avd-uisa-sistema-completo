import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface AVDStepGuardProps {
  currentStep: number;
  processId: number;
  children: React.ReactNode;
}

/**
 * Componente de proteção de rotas para garantir fluxo sequencial dos 5 passos AVD
 * 
 * Funcionalidades:
 * - Verifica se o passo anterior foi concluído antes de permitir acesso
 * - Redireciona automaticamente para o passo correto se usuário tentar pular
 * - Mostra loading enquanto valida permissões
 * 
 * Uso:
 * <AVDStepGuard currentStep={2} processId={processId}>
 *   <ConteudoDoPasso2 />
 * </AVDStepGuard>
 */
export default function AVDStepGuard({ currentStep, processId, children }: AVDStepGuardProps) {
  const [, navigate] = useLocation();
  
  // Buscar status do processo
  const { data: processStatus, isLoading } = trpc.avd.getProcessStatus.useQuery(
    { processId },
    { enabled: !!processId }
  );

  useEffect(() => {
    if (!isLoading && processStatus) {
      const { currentStep: allowedStep } = processStatus;
      
      // Se usuário está tentando acessar passo futuro, redirecionar para passo atual
      if (currentStep > allowedStep) {
        navigate(`/avd/processo/${processId}/passo${allowedStep}`);
      }
    }
  }, [isLoading, processStatus, currentStep, processId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não conseguiu carregar status, não bloquear (fail-safe)
  if (!processStatus) {
    return <>{children}</>;
  }

  // Se passo está liberado, renderizar conteúdo
  return <>{children}</>;
}
