import { Badge } from "@/components/ui/badge";

type Status = 'rascunho' | 'em_analise' | 'aprovado' | 'rejeitado' | 'arquivado' | 'ativo' | 'concluido' | 'cancelado';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  rascunho: {
    label: 'Rascunho',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  },
  em_analise: {
    label: 'Em Análise',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  aprovado: {
    label: 'Aprovado',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  rejeitado: {
    label: 'Rejeitado',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
  arquivado: {
    label: 'Arquivado',
    variant: 'outline',
    className: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
  },
  ativo: {
    label: 'Ativo',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  concluido: {
    label: 'Concluído',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  cancelado: {
    label: 'Cancelado',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 hover:bg-red-200',
  },
};

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.rascunho;
  
  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
