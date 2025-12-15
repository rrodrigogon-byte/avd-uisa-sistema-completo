import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useLocation } from "wouter";

interface ErrorDisplayProps {
  error: Error | string;
  title?: string;
  showHomeButton?: boolean;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

/**
 * Componente para exibir erros de forma amigável
 * Converte erros técnicos em mensagens compreensíveis para o usuário
 */
export function ErrorDisplay({
  error,
  title = "Ops! Algo deu errado",
  showHomeButton = false,
  showRetryButton = false,
  onRetry,
}: ErrorDisplayProps) {
  const [, setLocation] = useLocation();

  const errorMessage = typeof error === "string" ? error : error.message;

  // Mapear erros técnicos para mensagens amigáveis
  const getFriendlyMessage = (message: string): string => {
    const errorMap: Record<string, string> = {
      "Network error": "Erro de conexão. Verifique sua internet e tente novamente.",
      "Failed to fetch": "Não foi possível conectar ao servidor. Tente novamente em alguns instantes.",
      "Unauthorized": "Você não tem permissão para acessar este recurso.",
      "Forbidden": "Acesso negado. Entre em contato com o administrador.",
      "Not found": "O recurso solicitado não foi encontrado.",
      "Internal server error": "Erro no servidor. Nossa equipe já foi notificada.",
      "Bad request": "Dados inválidos. Verifique as informações e tente novamente.",
      "Timeout": "A operação demorou muito. Tente novamente.",
      "Database not available": "Banco de dados temporariamente indisponível. Tente novamente em alguns instantes.",
    };

    // Procurar por palavras-chave no erro
    for (const [key, value] of Object.entries(errorMap)) {
      if (message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    // Se não encontrar mapeamento, retornar mensagem genérica
    return "Ocorreu um erro inesperado. Por favor, tente novamente.";
  };

  const friendlyMessage = getFriendlyMessage(errorMessage);

  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{friendlyMessage}</p>

        {/* Mensagem técnica (colapsável) */}
        <details className="text-xs text-muted-foreground mt-2">
          <summary className="cursor-pointer hover:underline">
            Detalhes técnicos
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
            {errorMessage}
          </pre>
        </details>

        {/* Botões de ação */}
        <div className="flex gap-2 mt-4">
          {showRetryButton && onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}

          {showHomeButton && (
            <Button onClick={() => setLocation("/")} variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Componente de erro para páginas inteiras
 */
export function ErrorPage({
  error,
  title = "Página não encontrada",
  description = "A página que você está procurando não existe ou foi movida.",
}: {
  error?: Error | string;
  title?: string;
  description?: string;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full px-6">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">{description}</p>

          {error && (
            <details className="text-xs text-muted-foreground mb-6 text-left">
              <summary className="cursor-pointer hover:underline text-center">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                {typeof error === "string" ? error : error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            <Button onClick={() => setLocation("/")} size="lg">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para tratamento de erros com mensagens amigáveis
 */
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string): string => {
    console.error(`[${context || "Error"}]`, error);

    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "Ocorreu um erro inesperado";
  };

  return { handleError };
}
