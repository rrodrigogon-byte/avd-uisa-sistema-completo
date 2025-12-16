import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function FerramentasAdmin() {
  const { user } = useAuth();
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const seedEmployeesMutation = trpc.employees.seedSampleEmployees.useMutation({
    onSuccess: (data) => {
      setSeedResult(data);
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
      setSeedResult({ success: false, message: error.message });
    },
  });

  const handleSeedEmployees = () => {
    if (confirm("Deseja criar funcionários de exemplo? Esta ação só pode ser executada uma vez.")) {
      seedEmployeesMutation.mutate();
    }
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ferramentas Administrativas</h1>
          <p className="text-muted-foreground mt-2">
            Ferramentas de configuração e manutenção do sistema
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card de Seed de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Criar Funcionários de Exemplo
              </CardTitle>
              <CardDescription>
                Popula o banco de dados com 15 funcionários de exemplo em uma estrutura hierárquica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Esta ferramenta criará:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>1 CEO</li>
                  <li>3 Diretores (RH, TI, Comercial)</li>
                  <li>3 Gerentes</li>
                  <li>2 Coordenadores</li>
                  <li>6 Analistas (Sênior, Pleno, Júnior)</li>
                </ul>
                <p className="mt-3 text-amber-600 dark:text-amber-500 font-medium">
                  ⚠️ Só pode ser executado uma vez (quando não há funcionários cadastrados)
                </p>
              </div>

              <Button
                onClick={handleSeedEmployees}
                disabled={seedEmployeesMutation.isPending}
                className="w-full"
              >
                {seedEmployeesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Criar Funcionários de Exemplo
                  </>
                )}
              </Button>

              {seedResult && (
                <Alert variant={seedResult.success ? "default" : "destructive"}>
                  {seedResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {seedResult.message}
                    {seedResult.count !== undefined && ` (${seedResult.count} funcionários)`}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Card de Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Informações do Sistema
              </CardTitle>
              <CardDescription>
                Status e configurações do banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usuário:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Perfil:</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  💡 Após criar os funcionários de exemplo, você poderá visualizá-los no organograma
                  e nas demais funcionalidades do sistema.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
