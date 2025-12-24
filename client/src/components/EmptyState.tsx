import { LucideIcon, FileText, Inbox, Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  /**
   * Ícone a ser exibido
   */
  icon?: LucideIcon;
  /**
   * Título do estado vazio
   */
  title: string;
  /**
   * Descrição opcional
   */
  description?: string;
  /**
   * Texto do botão de ação
   */
  actionLabel?: string;
  /**
   * Callback ao clicar no botão
   */
  onAction?: () => void;
  /**
   * Classe CSS adicional
   */
  className?: string;
  /**
   * Tipo de estado vazio (afeta o estilo)
   */
  variant?: "default" | "search" | "error";
}

/**
 * Componente de estado vazio para listagens
 * Exibe mensagem amigável quando não há dados
 */
export default function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
  variant = "default",
}: EmptyStateProps) {
  const iconColor = variant === "error" ? "text-red-400" : variant === "search" ? "text-blue-400" : "text-gray-400";
  const textColor = variant === "error" ? "text-red-600" : "text-gray-600";

  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <Icon className={`h-16 w-16 ${iconColor} mb-4 opacity-50`} />
        <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mb-6 max-w-md">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction} variant={variant === "error" ? "destructive" : "default"}>
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Estado vazio para resultados de busca
 */
export function EmptySearchState({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhum resultado encontrado"
      description={
        searchTerm
          ? `Não encontramos resultados para "${searchTerm}". Tente usar outros termos de busca.`
          : "Não há resultados para os filtros aplicados."
      }
      actionLabel={onClear ? "Limpar busca" : undefined}
      onAction={onClear}
      variant="search"
    />
  );
}

/**
 * Estado vazio para erros
 */
export function EmptyErrorState({
  title = "Erro ao carregar dados",
  description = "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      actionLabel={onRetry ? "Tentar novamente" : undefined}
      onAction={onRetry}
      variant="error"
    />
  );
}

/**
 * Estado vazio para listas vazias
 */
export function EmptyListState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}
