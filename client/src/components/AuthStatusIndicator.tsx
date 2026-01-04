import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { AlertCircle, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

interface AuthStatusIndicatorProps {
  /**
   * Mostrar apenas quando houver erro (padrão: true)
   */
  showOnlyOnError?: boolean;
  /**
   * Posição do indicador
   */
  position?: 'top' | 'bottom' | 'inline';
  /**
   * Callback quando o usuário clicar em "Fazer login"
   */
  onLoginClick?: () => void;
}

/**
 * Componente visual para indicar o status de autenticação
 * Mostra feedback claro sobre loading, erro ou sucesso
 */
export function AuthStatusIndicator({ 
  showOnlyOnError = true,
  position = 'top',
  onLoginClick
}: AuthStatusIndicatorProps) {
  const { user, loading, error, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = () => {
    if (onLoginClick) {
      onLoginClick();
    } else {
      // Salvar URL atual para retornar após login
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      window.location.href = getLoginUrl();
    }
  };

  // Não mostrar nada se está autenticado e showOnlyOnError é true
  if (showOnlyOnError && isAuthenticated && !error) {
    return null;
  }

  // Determinar classes de posicionamento
  const positionClasses = {
    top: 'fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4',
    bottom: 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4',
    inline: 'w-full'
  };

  // Loading state
  if (loading) {
    return (
      <div className={positionClasses[position]}>
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Verificando autenticação</AlertTitle>
          <AlertDescription>
            Aguarde enquanto verificamos suas credenciais...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Offline state
  if (!isOnline) {
    return (
      <div className={positionClasses[position]}>
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sem conexão</AlertTitle>
          <AlertDescription>
            Você está offline. Verifique sua conexão com a internet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Error state (não autenticado ou erro)
  if (!isAuthenticated || error) {
    return (
      <div className={positionClasses[position]}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Autenticação necessária</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              {error 
                ? 'Sua sessão expirou ou houve um erro de autenticação.' 
                : 'Você precisa estar autenticado para acessar este conteúdo.'}
            </span>
            <Button 
              onClick={handleLogin}
              size="sm"
              variant="outline"
              className="w-fit"
            >
              Fazer login
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Success state (autenticado)
  if (!showOnlyOnError) {
    return (
      <div className={positionClasses[position]}>
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Autenticado
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            Você está conectado como <strong>{user?.name || user?.email}</strong>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}

/**
 * Componente compacto para mostrar status de autenticação inline
 */
export function AuthStatusBadge() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-3 w-3" />
        <span>Não autenticado</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <CheckCircle2 className="h-3 w-3" />
      <span>{user?.name || user?.email}</span>
    </div>
  );
}
