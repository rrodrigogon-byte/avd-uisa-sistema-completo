import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Circle, 
  Users, 
  Shield, 
  FileSpreadsheet,
  Settings,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useLocation } from "wouter";

interface Step {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  completed: boolean;
  required: boolean;
}

export default function PrimeirosPassos() {
  const [, navigate] = useLocation();
  const [steps, setSteps] = useState<Step[]>([]);

  // Verificar status de configuração
  const statusQuery = trpc.importTai.checkImportStatus.useQuery();
  const dashboardQuery = trpc.approverMonitoring.getDashboard.useQuery();

  useEffect(() => {
    if (statusQuery.data && dashboardQuery.data) {
      const newSteps: Step[] = [
        {
          id: "import-employees",
          title: "1. Importar Funcionários",
          description: "Importe os dados dos funcionários da Diretoria TAI (154 funcionários)",
          icon: <FileSpreadsheet className="h-5 w-5" />,
          link: "/admin/importar-diretoria-tai",
          completed: !statusQuery.data.needsImport,
          required: true,
        },
        {
          id: "configure-approvers",
          title: "2. Configurar Aprovadores",
          description: "Atribua funcionários ativos aos 4 papéis de aprovação (Líder Imediato, RH Cargos e Salários, Gerente RH, Diretor)",
          icon: <Shield className="h-5 w-5" />,
          link: "/admin/gestao-aprovadores",
          completed: dashboardQuery.data.summary.rolesWithoutApprovers === 0 && dashboardQuery.data.summary.employeeInactive === 0,
          required: true,
        },
        {
          id: "monitor-approvers",
          title: "3. Monitorar Aprovadores",
          description: "Configure alertas automáticos para ser notificado quando um aprovador for desativado",
          icon: <Users className="h-5 w-5" />,
          link: "/admin/monitoramento-aprovadores",
          completed: false,
          required: false,
        },
        {
          id: "system-settings",
          title: "4. Configurações do Sistema",
          description: "Ajuste configurações gerais, notificações e preferências do sistema",
          icon: <Settings className="h-5 w-5" />,
          link: "/configuracoes",
          completed: false,
          required: false,
        },
      ];

      setSteps(newSteps);
    }
  }, [statusQuery.data, dashboardQuery.data]);

  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  const requiredSteps = steps.filter((s) => s.required);
  const completedRequired = requiredSteps.filter((s) => s.completed).length;
  const allRequiredCompleted = completedRequired === requiredSteps.length;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Primeiros Passos</h1>
        <p className="text-muted-foreground">
          Configure o sistema AVD UISA seguindo este guia passo a passo
        </p>
      </div>

      {/* Progress Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Progresso da Configuração</CardTitle>
          <CardDescription>
            {completedSteps} de {totalSteps} passos concluídos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {allRequiredCompleted ? (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-400">
                Configuração Mínima Completa!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-500">
                Todos os passos obrigatórios foram concluídos. O sistema está pronto para uso.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuração Necessária</AlertTitle>
              <AlertDescription>
                Complete os passos obrigatórios para ativar o sistema de aprovações dinâmico.
                <br />
                <strong>{completedRequired} de {requiredSteps.length}</strong> passos obrigatórios concluídos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-4">
        {statusQuery.isLoading || dashboardQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          steps.map((step, index) => (
            <Card
              key={step.id}
              className={step.completed ? "border-green-200 bg-green-50/50 dark:bg-green-950/10" : ""}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        step.completed
                          ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        {step.required && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatório
                          </Badge>
                        )}
                        {step.completed && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Concluído
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={step.completed ? "outline" : "default"}
                    size="sm"
                    onClick={() => navigate(step.link)}
                  >
                    {step.completed ? "Revisar" : "Configurar"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Detalhes específicos de cada passo */}
              {step.id === "import-employees" && statusQuery.data && (
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold">{statusQuery.data.total}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Importados</div>
                      <div className="text-lg font-semibold text-green-600">
                        {statusQuery.data.existing}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Faltando</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {statusQuery.data.missing}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}

              {step.id === "configure-approvers" && dashboardQuery.data && (
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="text-lg font-semibold">
                        {dashboardQuery.data.summary.total}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Ativos</div>
                      <div className="text-lg font-semibold text-green-600">
                        {dashboardQuery.data.summary.active}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Problemas</div>
                      <div className="text-lg font-semibold text-red-600">
                        {dashboardQuery.data.summary.employeeInactive +
                          dashboardQuery.data.summary.rolesWithoutApprovers}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Se você tiver dúvidas durante a configuração, consulte a documentação ou entre em
            contato com o suporte.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://help.manus.im" target="_blank" rel="noopener noreferrer">
                Documentação
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://help.manus.im" target="_blank" rel="noopener noreferrer">
                Suporte
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
