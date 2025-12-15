import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, History, AlertTriangle } from "lucide-react";
import CreateEditRuleModal from "@/components/CreateEditRuleModal";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function GestaoAprovadores() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Filtros
  const [filterRuleType, setFilterRuleType] = useState<string>("todos");
  const [filterContext, setFilterContext] = useState<string>("todos");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  // Queries
  const { data: rules = [], isLoading, refetch } = trpc.approvalRules.list.useQuery({
    ruleType: filterRuleType as any,
    approvalContext: filterContext as any,
    isActive: filterActive,
  });

  const { data: history = [] } = trpc.approvalRules.getHistory.useQuery(
    { ruleId: selectedRuleId || undefined },
    { enabled: showHistoryDialog }
  );

  const { data: departments = [] } = trpc.approvalRules.getDepartments.useQuery();
  const { data: costCenters = [] } = trpc.approvalRules.getCostCenters.useQuery();
  const { data: employees = [] } = trpc.approvalRules.getEmployees.useQuery({ search: "" });

  // Mutations
  const deleteMutation = trpc.approvalRules.delete.useMutation({
    onSuccess: () => {
      toast.success("Regra excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir regra: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta regra?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleViewHistory = (ruleId: number) => {
    setSelectedRuleId(ruleId);
    setShowHistoryDialog(true);
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingRule(null);
  };

  const getContextLabel = (context: string) => {
    const labels: Record<string, string> = {
      metas: "Metas",
      avaliacoes: "Avaliações",
      pdi: "PDI",
      descricao_cargo: "Descrição de Cargo",
      ciclo_360: "Ciclo 360°",
      bonus: "Bônus",
      promocao: "Promoção",
      todos: "Todos",
    };
    return labels[context] || context;
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      departamento: "Departamento",
      centro_custo: "Centro de Custo",
      individual: "Individual",
    };
    return labels[type] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      criado: "Criado",
      atualizado: "Atualizado",
      desativado: "Desativado",
      excluido: "Excluído",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      criado: "bg-green-500",
      atualizado: "bg-blue-500",
      desativado: "bg-yellow-500",
      excluido: "bg-red-500",
    };
    return colors[action] || "bg-gray-500";
  };

  // Detectar conflitos (múltiplas regras para mesmo contexto)
  const detectConflicts = () => {
    const conflicts: Record<string, any[]> = {};
    
    rules.forEach((rule) => {
      if (!rule.isActive) return;
      
      const key = `${rule.ruleType}-${rule.approvalContext}-${rule.departmentId || rule.costCenterId || rule.employeeId}`;
      
      if (!conflicts[key]) {
        conflicts[key] = [];
      }
      conflicts[key].push(rule);
    });

    return Object.values(conflicts).filter((group) => group.length > 1);
  };

  const conflicts = detectConflicts();

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Aprovadores</h1>
            <p className="text-muted-foreground mt-1">
              Configure regras de aprovação por departamento, centro de custo ou funcionário individual
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>

        {/* Alertas de Conflitos */}
        {conflicts.length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                Conflitos Detectados
              </CardTitle>
              <CardDescription className="text-yellow-600">
                Foram encontradas {conflicts.length} regras conflitantes. Múltiplas regras ativas para o mesmo contexto podem causar comportamento inesperado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conflicts.map((group: any, idx: number) => (
                  <div key={idx} className="text-sm text-yellow-700">
                    • {group.length} regras ativas para{" "}
                    <strong>{getContextLabel(group[0].approvalContext)}</strong> em{" "}
                    <strong>{getRuleTypeLabel(group[0].ruleType)}</strong>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Regra</Label>
                <Select value={filterRuleType} onValueChange={setFilterRuleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="departamento">Departamento</SelectItem>
                    <SelectItem value="centro_custo">Centro de Custo</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contexto</Label>
                <Select value={filterContext} onValueChange={setFilterContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="metas">Metas</SelectItem>
                    <SelectItem value="avaliacoes">Avaliações</SelectItem>
                    <SelectItem value="pdi">PDI</SelectItem>
                    <SelectItem value="descricao_cargo">Descrição de Cargo</SelectItem>
                    <SelectItem value="ciclo_360">Ciclo 360°</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                    <SelectItem value="promocao">Promoção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filterActive === undefined ? "todos" : filterActive ? "ativo" : "inativo"}
                  onValueChange={(v) =>
                    setFilterActive(v === "todos" ? undefined : v === "ativo")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Regras */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Cadastradas</CardTitle>
            <CardDescription>
              {rules.length} regra(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Contexto</TableHead>
                    <TableHead>Vinculação</TableHead>
                    <TableHead>Aprovador</TableHead>
                    <TableHead>Nível</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule: any) => (
                    <TableRow key={rule.id}>
                      <TableCell>{getRuleTypeLabel(rule.ruleType)}</TableCell>
                      <TableCell>{getContextLabel(rule.approvalContext)}</TableCell>
                      <TableCell>{rule.departmentName || "Individual"}</TableCell>
                      <TableCell>{rule.approverName}</TableCell>
                      <TableCell>{rule.approverLevel}</TableCell>
                      <TableCell>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(rule)}
                            title="Editar regra"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(rule.id)}
                            title="Ver histórico"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(rule.id)}
                            title="Excluir regra"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal de Criação/Edição */}
        <CreateEditRuleModal
          open={showCreateDialog || showEditDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              handleCloseEditDialog();
            }
          }}
          editingRule={editingRule}
          onSuccess={refetch}
        />

        {/* Dialog de Histórico */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Histórico de Alterações</DialogTitle>
              <DialogDescription>
                Visualize todas as alterações realizadas nesta regra
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum histórico encontrado
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-6">
                    {history.map((item: any) => (
                      <div key={item.id} className="relative pl-10">
                        {/* Bolinha da timeline */}
                        <div
                          className={`absolute left-2.5 w-3 h-3 rounded-full ${getActionColor(
                            item.action
                          )}`}
                        />

                        <Card>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {getActionLabel(item.action)}
                              </CardTitle>
                              <Badge variant="outline">
                                {format(new Date(item.changedAt), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </Badge>
                            </div>
                            <CardDescription>
                              Por: {item.changedByName}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {item.previousData && (
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Dados Anteriores:</div>
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                  {JSON.stringify(JSON.parse(item.previousData), null, 2)}
                                </pre>
                              </div>
                            )}
                            {item.newData && (
                              <div className="space-y-2 mt-2">
                                <div className="text-sm font-medium">Novos Dados:</div>
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                  {JSON.stringify(JSON.parse(item.newData), null, 2)}
                                </pre>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
