import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Plus, Eye, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const reportTypeLabels = {
  performance_overview: 'Visão Geral de Desempenho',
  team_comparison: 'Comparação de Equipes',
  individual_progress: 'Progresso Individual',
  custom: 'Personalizado',
};

export default function Reports() {
  const { data: reports, isLoading, refetch } = trpc.report.list.useQuery();
  
  const deleteMutation = trpc.report.delete.useMutation({
    onSuccess: () => {
      toast.success('Relatório removido com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover relatório');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Gere e visualize relatórios de desempenho
          </p>
        </div>
        <Button onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Relatório
        </Button>
      </div>

      {reports && reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece gerando seu primeiro relatório de desempenho
            </p>
            <Button onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
              <Plus className="mr-2 h-4 w-4" />
              Gerar Primeiro Relatório
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports?.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este relatório?')) {
                          deleteMutation.mutate({ id: report.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="mt-4">{report.name}</CardTitle>
                <CardDescription>
                  {reportTypeLabels[report.type]}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Período:</span>
                    <span className="font-medium">{report.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gerado em:</span>
                    <span className="font-medium">
                      {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                >
                  Ver Relatório Completo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
