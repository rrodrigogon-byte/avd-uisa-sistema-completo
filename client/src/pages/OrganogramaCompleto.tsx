import { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import DashboardLayout from "@/components/DashboardLayout";
import OrganogramaInterativoAvancado from "@/components/OrganogramaInterativoAvancado";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  Building2,
  Briefcase,
  RefreshCw,
  Loader2,
  Info,
  Settings,
  Eye,
  Edit,
} from "lucide-react";

/**
 * Página Completa de Organograma
 * Visualização e edição interativa da estrutura organizacional
 */
export default function OrganogramaCompleto() {
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");

  // Buscar todos os funcionários ativos
  const { data: employeesData, isLoading, refetch } = trpc.employees.list.useQuery({
    active: true,
    pageSize: 1000,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.employees.stats.useQuery();

  // Mutation para mover funcionário
  const moveEmployeeMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      toast.success("Hierarquia atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar hierarquia: ${error.message}`);
    },
  });

  // Mutation para editar funcionário
  const editEmployeeMutation = trpc.employees.updateComplete.useMutation({
    onSuccess: () => {
      toast.success("Funcionário atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar funcionário: ${error.message}`);
    },
  });

  // Handler para movimentação de funcionário
  const handleEmployeeMove = (employeeId: number, newManagerId: number | null) => {
    moveEmployeeMutation.mutate({
      id: employeeId,
      data: { managerId: newManagerId },
    });
  };

  // Handler para edição de funcionário
  const handleEmployeeEdit = (employeeId: number, data: any) => {
    editEmployeeMutation.mutate({
      id: employeeId,
      data,
    });
  };

  const employees = employeesData?.data || [];

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Organograma Organizacional</h1>
            <p className="text-muted-foreground mt-2">
              Visualize e gerencie a estrutura hierárquica da empresa
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              variant={viewMode === "edit" ? "default" : "outline"}
              onClick={() => setViewMode(viewMode === "edit" ? "view" : "edit")}
            >
              {viewMode === "edit" ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Modo Visualização
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Modo Edição
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Colaboradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.totalActive}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Departamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.byDepartment.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cargos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{stats.byPosition.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="text-sm">
                  {viewMode === "edit" ? "Edição Ativa" : "Visualização"}
                </Badge>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alert de modo de edição */}
        {viewMode === "edit" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Modo de Edição Ativo:</strong> Você pode arrastar os cards dos
              funcionários para reorganizar a hierarquia. Clique no ícone de edição para
              alterar informações inline. Todas as mudanças serão salvas automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs de Visualização */}
        <Tabs defaultValue="organograma" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organograma">Organograma Interativo</TabsTrigger>
            <TabsTrigger value="departamentos">Por Departamento</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="organograma" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="text-muted-foreground">Carregando organograma...</p>
                    </div>
                  </div>
                ) : employees.length === 0 ? (
                  <div className="h-[600px] flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhum funcionário encontrado
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px]">
                    <ReactFlowProvider>
                      <OrganogramaInterativoAvancado
                        employees={employees}
                        onEmployeeMove={handleEmployeeMove}
                        onEmployeeEdit={handleEmployeeEdit}
                        editable={viewMode === "edit"}
                      />
                    </ReactFlowProvider>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departamentos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats?.byDepartment.map((dept) => (
                <Card key={dept.departmentId || "sem-dept"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {dept.departmentName}
                    </CardTitle>
                    <CardDescription>
                      {dept.count} colaborador{dept.count !== 1 ? "es" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {employees
                        .filter((emp) => emp.departmentId === dept.departmentId)
                        .slice(0, 5)
                        .map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center gap-2 text-sm p-2 rounded-md hover:bg-muted/50"
                          >
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="flex-1 truncate">{emp.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {emp.positionTitle || "Sem cargo"}
                            </Badge>
                          </div>
                        ))}
                      {dept.count > 5 && (
                        <div className="text-xs text-muted-foreground text-center pt-2">
                          +{dept.count - 5} mais
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribuição por Cargo */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Cargo</CardTitle>
                  <CardDescription>
                    Quantidade de colaboradores por cargo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.byPosition
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 10)
                      .map((pos) => (
                        <div key={pos.positionId || "sem-cargo"} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate flex-1">
                              {pos.positionTitle}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {pos.count}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(pos.count / stats.totalActive) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Departamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Departamento</CardTitle>
                  <CardDescription>
                    Quantidade de colaboradores por departamento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.byDepartment
                      .sort((a, b) => b.count - a.count)
                      .map((dept) => (
                        <div key={dept.departmentId || "sem-dept"} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium truncate flex-1">
                              {dept.departmentName}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {dept.count}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(dept.count / stats.totalActive) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
