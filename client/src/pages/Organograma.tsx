import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { OrganizationalChart } from "@/components/OrganizationalChart";
import { trpc } from "@/lib/trpc";
import { Loader2, Building2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Organograma() {
  const { user } = useAuth();
  const [editingEmployee, setEditingEmployee] = useState<{ id: number; currentManagerId: number | null } | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>("");

  // Buscar árvore organizacional
  const { data: orgTree, refetch: refetchTree } = trpc.hierarchy.getOrganizationTree.useQuery();

  // Buscar estatísticas
  const { data: stats } = trpc.hierarchy.getHierarchyStats.useQuery();

  // Buscar todos os funcionários
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery({
    page: 1,
    limit: 10000,
    search: "",
  });

  // Buscar departamentos
  const { data: departments, isLoading: loadingDepartments } =
    trpc.departments.list.useQuery();

  // Buscar cargos
  const { data: positions, isLoading: loadingPositions } =
    trpc.positions.list.useQuery();

  // Mutation para atualizar gestor
  const setManagerMutation = trpc.hierarchy.setManager.useMutation({
    onSuccess: () => {
      toast.success("Gestor atualizado com sucesso!");
      refetchTree();
      setEditingEmployee(null);
      setSelectedManagerId("");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar gestor: ${error.message}`);
    },
  });

  const handleSaveManager = () => {
    if (!editingEmployee) return;

    setManagerMutation.mutate({
      employeeId: editingEmployee.id,
      managerId: selectedManagerId ? parseInt(selectedManagerId) : null,
    });
  };

  const isLoading = loadingEmployees || loadingDepartments || loadingPositions;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employees?.employees || employees.employees.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <Alert>
            <AlertDescription>
              Nenhum funcionário cadastrado. Cadastre funcionários para visualizar o
              organograma.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8" />
              Organograma
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualização completa da hierarquia organizacional
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Líderes de Topo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withoutManager}</div>
                <p className="text-xs text-muted-foreground">
                  Sem gestor direto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Gestores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalManagers}</div>
                <p className="text-xs text-muted-foreground">
                  Com subordinados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Span of Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgSpanOfControl}</div>
                <p className="text-xs text-muted-foreground">
                  Subordinados por gestor
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Níveis Hierárquicos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.byLevel.length}</div>
                <p className="text-xs text-muted-foreground">
                  Diferentes níveis
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Distribuição por Nível */}
        {stats && stats.byLevel.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Nível Hierárquico</CardTitle>
              <CardDescription>Quantidade de funcionários em cada nível</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byLevel.map((level) => (
                  <div key={level.level || 'undefined'} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{level.level || 'Não definido'}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{
                            width: `${(Number(level.count) / stats.byLevel.reduce((sum, l) => sum + Number(l.count), 0)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{level.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Visualização do Organograma */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
            <CardDescription>
              Visualização hierárquica da estrutura organizacional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationalChart
              employees={employees.employees}
              departments={departments || []}
              positions={positions || []}
            />
          </CardContent>
        </Card>

        {/* Dialog de Edição de Gestor */}
        <Dialog open={editingEmployee !== null} onOpenChange={(open) => !open && setEditingEmployee(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Alterar Gestor Direto</DialogTitle>
              <DialogDescription>
                Selecione o novo gestor direto para este funcionário
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manager">Gestor Direto</Label>
                <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem gestor (CEO/Diretor)</SelectItem>
                    {employees?.employees.filter(emp => emp.employee.id !== editingEmployee?.id).map((emp) => (
                      <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                        {emp.employee.name} {emp.employee.hierarchyLevel && `(${emp.employee.hierarchyLevel})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveManager} disabled={setManagerMutation.isPending}>
                  {setManagerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
