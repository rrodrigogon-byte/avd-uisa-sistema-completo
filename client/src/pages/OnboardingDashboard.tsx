import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  FileCheck,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  Download,
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Dashboard de Onboarding
 * Acompanhamento de novos colaboradores e processo de integração
 */

export default function OnboardingDashboard() {
  const [, navigate] = useLocation();
  const [selectedPeriod, setSelectedPeriod] = useState<"7" | "30" | "90">("30");

  // Queries
  const { data: onboardingStats, isLoading: loadingStats } = trpc.onboarding.getStats.useQuery({
    days: parseInt(selectedPeriod),
  });

  const { data: newEmployees, isLoading: loadingEmployees } = trpc.onboarding.getNewEmployees.useQuery({
    days: parseInt(selectedPeriod),
  });

  const { data: onboardingProgress, isLoading: loadingProgress } = trpc.onboarding.getProgress.useQuery({
    days: parseInt(selectedPeriod),
  });

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pendente", icon: Clock },
      in_progress: { variant: "default", label: "Em Andamento", icon: TrendingUp },
      completed: { variant: "default", label: "Concluído", icon: CheckCircle2 },
      delayed: { variant: "destructive", label: "Atrasado", icon: AlertCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Onboarding</h1>
            <p className="text-muted-foreground mt-1">
              Acompanhamento de novos colaboradores e processo de integração
            </p>
          </div>
          <div className="flex gap-2">
            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
              <TabsList>
                <TabsTrigger value="7">7 dias</TabsTrigger>
                <TabsTrigger value="30">30 dias</TabsTrigger>
                <TabsTrigger value="90">90 dias</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novos Colaboradores</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{onboardingStats?.newEmployeesCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimos {selectedPeriod} dias
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentação Pendente</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{onboardingStats?.pendingDocsCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Documentos aguardando
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integração em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{onboardingStats?.inProgressCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Processos ativos
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {onboardingStats?.completionRate || 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Onboardings concluídos
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Evolução */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Onboarding</CardTitle>
            <CardDescription>
              Progresso médio de integração nos últimos {selectedPeriod} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProgress ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : isEmpty(onboardingProgress) ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de progresso disponível
              </div>
            ) : (
              <div className="space-y-4">
                {safeMap(onboardingProgress, (item) => (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.stageName}</span>
                      <span className="text-muted-foreground">
                        {item.completedCount}/{item.totalCount} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabela de Novos Colaboradores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Novos Colaboradores</CardTitle>
                <CardDescription>
                  Lista de colaboradores admitidos nos últimos {selectedPeriod} dias
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : isEmpty(newEmployees) ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nenhum novo colaborador no período selecionado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Data de Admissão</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeMap(newEmployees, (employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.positionName || "-"}</TableCell>
                      <TableCell>{employee.departmentName || "-"}</TableCell>
                      <TableCell>{formatDate(employee.hireDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={employee.onboardingProgress || 0}
                            className="h-2 w-24"
                          />
                          <span className="text-xs text-muted-foreground">
                            {employee.onboardingProgress || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(employee.onboardingStatus || "pending")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/funcionarios/${employee.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Checklist de Integração */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist de Integração</CardTitle>
            <CardDescription>
              Etapas padrão do processo de onboarding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Documentação Inicial", description: "CPF, RG, comprovante de residência" },
                { name: "Cadastro no Sistema", description: "Criação de usuário e perfil" },
                { name: "Entrega de Equipamentos", description: "Computador, celular, acessórios" },
                { name: "Treinamento Inicial", description: "Apresentação da empresa e processos" },
                { name: "Integração com Equipe", description: "Apresentação aos colegas e gestores" },
                { name: "Definição de Metas", description: "Estabelecimento de objetivos iniciais" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
