import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Building2, Search, Edit, ChevronRight, ChevronDown, User, Upload, Download } from "lucide-react";

interface TreeNode {
  employee: any;
  subordinates: TreeNode[];
  isExpanded: boolean;
}

export default function HierarquiaOrganizacional() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [newManagerId, setNewManagerId] = useState<string>("");
  const [newCostCenter, setNewCostCenter] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Queries
  const { data: hierarchy, isLoading: loadingHierarchy, refetch } = trpc.employees.getHierarchy.useQuery();
  const { data: departments } = trpc.employees.getDepartments.useQuery();
  const { data: managers } = trpc.employees.getManagers.useQuery();

  // Queries para relatório
  const { data: reportData, refetch: refetchReport } = trpc.employees.exportHierarchyReport.useQuery(undefined, {
    enabled: false,
  });

  const handleDownloadReport = async () => {
    try {
      const result = await refetchReport();
      if (!result.data) {
        toast.error("Erro ao gerar relatório");
        return;
      }

      // Gerar relatório em formato texto
      const report = result.data;
      let content = `RELATÓRIO DE HIERARQUIA ORGANIZACIONAL\n`;
      content += `Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      content += `=== ESTATÍSTICAS GERAIS ===\n`;
      content += `Total de Colaboradores: ${report.totalEmployees}\n`;
      content += `Colaboradores com Gestor: ${report.employeesWithManager}\n`;
      content += `Colaboradores sem Gestor: ${report.employeesWithoutManager}\n`;
      content += `Total de Gestores: ${report.uniqueManagers}\n`;
      content += `Span of Control Médio: ${report.avgSpanOfControl}\n\n`;
      
      content += `=== DISTRIBUIÇÃO POR DEPARTAMENTO ===\n`;
      report.departmentStats.forEach((dept: any) => {
        content += `${dept.departmentName}: ${dept.count} colaboradores\n`;
      });
      
      content += `\n=== COLABORADORES SEM GESTOR DEFINIDO ===\n`;
      if (report.employeesWithoutManagerList.length === 0) {
        content += `Nenhum colaborador sem gestor.\n`;
      } else {
        report.employeesWithoutManagerList.forEach((emp: any) => {
          content += `- ${emp.name} (${emp.email})\n`;
          content += `  Departamento: ${emp.department} | Cargo: ${emp.position} | CC: ${emp.costCenter}\n`;
        });
      }

      // Download do arquivo
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio-hierarquia-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    }
  };

  // Mutations
  const updateEmployeeMutation = trpc.employees.updateEmployee.useMutation({
    onSuccess: () => {
      toast.success("Hierarquia atualizada com sucesso!");
      setEditingEmployee(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setNewManagerId(employee.managerId?.toString() || "");
    setNewCostCenter(employee.costCenter || "");
  };

  const handleSave = () => {
    if (!editingEmployee) return;

    updateEmployeeMutation.mutate({
      id: editingEmployee.id,
      managerId: newManagerId ? parseInt(newManagerId) : undefined,
      costCenter: newCostCenter || undefined,
    });
  };

  const toggleNode = (employeeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildTree = (employees: any[]): TreeNode[] => {
    const employeeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    // Criar nós
    employees.forEach(emp => {
      employeeMap.set(emp.id, {
        employee: emp,
        subordinates: [],
        isExpanded: expandedNodes.has(emp.id),
      });
    });

    // Construir árvore
    employees.forEach(emp => {
      const node = employeeMap.get(emp.id)!;
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        employeeMap.get(emp.managerId)!.subordinates.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const renderTree = (nodes: TreeNode[], level: number = 0) => {
    return nodes.map(node => {
      const hasSubordinates = node.subordinates.length > 0;
      const isExpanded = expandedNodes.has(node.employee.id);

      return (
        <div key={node.employee.id} style={{ marginLeft: `${level * 24}px` }}>
          <div className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg group">
            {hasSubordinates ? (
              <button
                onClick={() => toggleNode(node.employee.id)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{node.employee.name}</span>
                  {hasSubordinates && (
                    <Badge variant="secondary" className="text-xs">
                      {node.subordinates.length} subordinado{node.subordinates.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{typeof node.employee.position === 'object' ? (node.employee.position as any)?.title : node.employee.position || "Sem cargo"}</span>
                  <span>•</span>
                  <span>{typeof node.employee.department === 'object' ? (node.employee.department as any)?.name : node.employee.department || "Sem departamento"}</span>
                  {node.employee.costCenter && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {node.employee.costCenter}
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(node.employee)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isExpanded && hasSubordinates && (
            <div className="border-l-2 border-gray-200 ml-3">
              {renderTree(node.subordinates, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Acesso Negado</h2>
          <p className="mt-2 text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </DashboardLayout>
    );
  }

  const filteredEmployees = hierarchy?.filter((emp: any) => {
    const positionStr = typeof emp.position === 'object' ? emp.position?.title : emp.position;
    const departmentStr = typeof emp.department === 'object' ? emp.department?.name : emp.department;
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         positionStr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.costCenter?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || departmentStr === selectedDepartment;
    return matchesSearch && matchesDepartment;
  }) || [];

  const tree = buildTree(filteredEmployees);
  const totalEmployees = hierarchy?.length || 0;
  const totalManagers = hierarchy?.filter((e: any) => e.subordinateCount > 0).length || 0;
  const totalDepartments = new Set(hierarchy?.map((e: any) => typeof e.department === 'object' ? e.department?.name : e.department).filter(Boolean)).size;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hierarquia Organizacional</h1>
            <p className="mt-2 text-gray-600">
              Visualize e gerencie a estrutura hierárquica da organização
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleDownloadReport} variant="outline" size="lg">
              <Download className="mr-2 h-4 w-4" />
              Baixar Relatório
            </Button>
            <Button onClick={() => setLocation("/admin/hierarquia/importar")} size="lg">
              <Upload className="mr-2 h-4 w-4" />
              Importar em Massa
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEmployees}</div>
              <p className="text-xs text-gray-600 mt-1">Ativos no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestores</CardTitle>
              <User className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalManagers}</div>
              <p className="text-xs text-gray-600 mt-1">Com subordinados diretos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <Building2 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDepartments}</div>
              <p className="text-xs text-gray-600 mt-1">Áreas ativas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Refine a visualização da hierarquia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, cargo ou centro de custos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map((dept: string) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Árvore Hierárquica */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
            <CardDescription>
              {filteredEmployees.length} colaborador(es) • Clique nas setas para expandir/recolher
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHierarchy ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando hierarquia...</p>
              </div>
            ) : tree.length > 0 ? (
              <div className="space-y-1">
                {renderTree(tree)}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum colaborador encontrado com os filtros aplicados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={!!editingEmployee} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Hierarquia</DialogTitle>
              <DialogDescription>
                Atualize o gestor direto e centro de custos de {editingEmployee?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="manager">Gestor Direto</Label>
                <Select value={newManagerId} onValueChange={setNewManagerId}>
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Selecione o gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (Nível mais alto)</SelectItem>
                    {managers?.filter((m: any) => m.id !== editingEmployee?.id).map((manager: any) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} - {typeof manager.position === 'object' ? manager.position?.title : manager.position || "Sem cargo"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costCenter">Centro de Custos</Label>
                <Input
                  id="costCenter"
                  placeholder="Ex: CC-001-TI"
                  value={newCostCenter}
                  onChange={(e) => setNewCostCenter(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Formato sugerido: CC-XXX-DEPARTAMENTO
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateEmployeeMutation.isPending}>
                {updateEmployeeMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
