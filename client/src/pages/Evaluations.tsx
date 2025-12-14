import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ClipboardList, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const statusColors = {
  draft: 'bg-gray-500',
  submitted: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

const statusLabels = {
  draft: 'Rascunho',
  submitted: 'Enviada',
  approved: 'Aprovada',
  rejected: 'Rejeitada',
};

export default function Evaluations() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data, isLoading } = trpc.evaluation.list.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  const asEvaluated = data?.asEvaluated || [];
  const asEvaluator = data?.asEvaluator || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Avaliações de Desempenho</h1>
          <p className="text-muted-foreground">
            Gerencie suas avaliações recebidas e realizadas
          </p>
        </div>
        <Button onClick={() => setLocation('/evaluations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Avaliação
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="received">
            Recebidas ({asEvaluated.length})
          </TabsTrigger>
          <TabsTrigger value="given">
            Realizadas ({asEvaluator.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-6">
          {asEvaluated.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação recebida</h3>
                <p className="text-muted-foreground">
                  Você ainda não possui avaliações de desempenho
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {asEvaluated.map((evaluation) => (
                <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <ClipboardList className="h-8 w-8 text-primary" />
                      <Badge className={statusColors[evaluation.status]}>
                        {statusLabels[evaluation.status]}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">Período: {evaluation.period}</CardTitle>
                    <CardDescription>
                      {evaluation.score !== null && evaluation.score !== undefined
                        ? `Nota: ${evaluation.score}/100`
                        : 'Sem nota atribuída'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/evaluations/edit/${evaluation.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Editar Avaliação
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="given" className="mt-6">
          {asEvaluator.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação realizada</h3>
                <p className="text-muted-foreground mb-4">
                  Você ainda não realizou nenhuma avaliação de desempenho
                </p>
                <Button onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Avaliação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {asEvaluator.map((evaluation) => (
                <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <ClipboardList className="h-8 w-8 text-primary" />
                      <Badge className={statusColors[evaluation.status]}>
                        {statusLabels[evaluation.status]}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">Período: {evaluation.period}</CardTitle>
                    <CardDescription>
                      {evaluation.score !== null && evaluation.score !== undefined
                        ? `Nota: ${evaluation.score}/100`
                        : 'Sem nota atribuída'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
}
