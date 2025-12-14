import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ApprovalHistoryEntry {
  id: number;
  action: string;
  approverName: string | null;
  comments: string | null;
  createdAt: Date;
}

interface ApprovalHistoryProps {
  history: ApprovalHistoryEntry[];
  title?: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  submitted: { label: 'Enviado para Análise', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  reopened: { label: 'Reaberto', color: 'bg-yellow-100 text-yellow-800' },
  archived: { label: 'Arquivado', color: 'bg-gray-100 text-gray-800' },
};

export default function ApprovalHistory({ history, title = "Histórico de Aprovações" }: ApprovalHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Nenhuma ação registrada ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            O histórico de aprovações aparecerá aqui quando houver ações realizadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Registro de todas as ações de aprovação realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry) => {
            const actionConfig = actionLabels[entry.action] || { 
              label: entry.action, 
              color: 'bg-gray-100 text-gray-800' 
            };

            return (
              <div
                key={entry.id}
                className="border-l-2 border-muted pl-4 pb-4 last:pb-0"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge className={actionConfig.color}>
                    {actionConfig.label}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>

                {entry.approverName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span>{entry.approverName}</span>
                  </div>
                )}

                {entry.comments && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{entry.comments}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
