import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { FileText, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Templates() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [, setLocation] = useLocation();
  
  const { data: templates, isLoading, refetch } = trpc.template.list.useQuery();
  const deleteMutation = trpc.template.delete.useMutation({
    onSuccess: () => {
      toast.success('Template removido com sucesso');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover template');
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Templates de Avaliação</h1>
          <p className="text-muted-foreground">
            Gerencie templates reutilizáveis para avaliações de desempenho
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setLocation('/templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        )}
      </div>

      {templates && templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin 
                ? 'Comece criando seu primeiro template de avaliação'
                : 'Não há templates disponíveis no momento'}
            </p>
            {isAdmin && (
              <Button onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates?.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="h-8 w-8 text-primary" />
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/templates/edit/${template.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover este template?')) {
                            deleteMutation.mutate({ id: template.id });
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
                <CardDescription>{template.description || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {template.isActive ? (
                      <span className="text-green-600">Ativo</span>
                    ) : (
                      <span className="text-gray-500">Inativo</span>
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
