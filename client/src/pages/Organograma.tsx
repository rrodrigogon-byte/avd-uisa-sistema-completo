import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { OrganizationalChartOptimized } from "@/components/OrganizationalChartOptimized";
import { OrgChartExporter } from "@/components/OrgChartExporter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Loader2, Building2, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // Não precisamos mais buscar todos os funcionários aqui - o componente otimizado faz isso

  // Buscar departamentos
  const { data: departments, isLoading: loadingDepartments } =
    trpc.departments.list.useQuery();

  // Buscar cargos
  const { data: positions, isLoading: loadingPositions } =
    trpc.positions.list.useQuery();

  // Buscar lista de funcionários para seleção de gestor
  const { data: allEmployeesData, isLoading: loadingEmployees } =
    trpc.employees.list.useQuery();
  
  const allEmployees = allEmployeesData?.employees || [];

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

  const isLoading = loadingDepartments || loadingPositions || loadingEmployees;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Removido check de employees vazios - o componente otimizado lida com isso

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
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar Visual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Exportar Organograma</DialogTitle>
              </DialogHeader>
              <OrgChartExporter 
                targetElementId="org-chart-container" 
                defaultFilename="organograma"
              />
            </DialogContent>
          </Dialog>
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
                  Profundidade Máxima
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.maxDepth}</div>
                <p className="text-xs text-muted-foreground">
                  Níveis hierárquicos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organograma */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
            <CardDescription>
              Visualização hierárquica da estrutura organizacional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationalChartOptimized
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
                    {safeFilter(allEmployees, (emp) => emp.id !== editingEmployee?.id)
                      .map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.nome} - {emp.cargo || "Sem cargo"}
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
                  {setManagerMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
