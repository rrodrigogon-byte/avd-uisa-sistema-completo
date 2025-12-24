import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, TrendingUp, AlertTriangle, Plus, Download, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

/**
 * Mapa de Sucessão Completo
 * Implementação conforme imagens fornecidas pelo usuário
 * 
 * Features:
 * - Estatísticas no topo (Posições Críticas, Sucessores Prontos, Sem Sucessor, % Cobertura)
 * - Cards de posição com badges de risco/impacto
 * - Formulário completo de adicionar sucessor com todos os campos
 * - Filtros por departamento, nível de risco, impacto e cobertura
 */

export default function MapaSucessaoCompleto() {
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isAddSuccessorOpen, setIsAddSuccessorOpen] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("todos");
  const [riskFilter, setRiskFilter] = useState("todos");
  const [impactFilter, setImpactFilter] = useState("todos");
  const [coverageFilter, setCoverageFilter] = useState("todos");

  // Form state para adicionar sucessor
  const [formData, setFormData] = useState({
    employeeId: "",
    readinessLevel: "1_ano" as "imediato" | "1_ano" | "2_3_anos" | "mais_3_anos",
    priority: 1,
    performanceRating: "medio" as "baixo" | "medio" | "alto" | "excepcional",
    potentialRating: "medio" as "baixo" | "medio" | "alto" | "excepcional",
    nineBoxPosition: "",
    gapAnalysis: "",
    developmentActions: "",
    notes: "",
  });

  // Queries
  const { data: plansRaw, isLoading, refetch } = trpc.succession.list.useQuery();
  const { employees, isLoading: loadingEmployees, search: employeeSearch, setSearch: setEmployeeSearch } = useEmployeeSearch();
  
  // Mutation para adicionar sucessor
  const addSuccessorMutation = trpc.succession.addSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor adicionado com sucesso!");
      setIsAddSuccessorOpen(false);
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar sucessor: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      employeeId: "",
      readinessLevel: "1_ano",
      priority: 1,
      performanceRating: "medio",
      potentialRating: "medio",
      nineBoxPosition: "",
      gapAnalysis: "",
      developmentActions: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!selectedPlanId) {
      toast.error("Selecione uma posição primeiro");
      return;
    }
    if (!formData.employeeId) {
      toast.error("Selecione um candidato");
      return;
    }

    addSuccessorMutation.mutate({
      planId: selectedPlanId,
      employeeId: parseInt(formData.employeeId),
      readinessLevel: formData.readinessLevel,
      priority: formData.priority,
      performanceRating: formData.performanceRating,
      potentialRating: formData.potentialRating,
      nineBoxPosition: formData.nineBoxPosition || undefined,
      gapAnalysis: formData.gapAnalysis || undefined,
      developmentActions: formData.developmentActions || undefined,
      notes: formData.notes || undefined,
    });
  };

  // Processar dados e calcular estatísticas
  const plans = plansRaw || [];
  const critical = plans.filter((p: any) => p.isCritical).length;
  const ready = plans.filter((p: any) => p.successors?.some((s: any) => s.readinessLevel === "imediato")).length;
  const noSuccessor = plans.filter((p: any) => !p.successors || p.successors.length === 0).length;
  const coverage = plans.length > 0 ? Math.round(((plans.length - noSuccessor) / plans.length) * 100) : 0;
  const stats = { critical, ready, noSuccessor, coverage };

  // Filtrar planos
  const filteredPlans = plans.filter((p: any) => {
    if (riskFilter !== "todos" && p.riskLevel !== riskFilter) return false;
    if (coverageFilter === "sem-sucessor" && p.successors && p.successors.length > 0) return false;
    if (coverageFilter === "com-sucessor" && (!p.successors || p.successors.length === 0)) return false;
    return true;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Mapa de Sucessão</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Planejamento estratégico de sucessão - UISA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Posição
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Posições Críticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sucessores Prontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.ready}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sem Sucessor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.noSuccessor}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                % Cobertura
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.coverage}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Departamento</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nível de Risco</Label>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="critico">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Impacto</Label>
                <Select value={impactFilter} onValueChange={setImpactFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cobertura</Label>
                <Select value={coverageFilter} onValueChange={setCoverageFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="sem-sucessor">Sem Sucessor</SelectItem>
                    <SelectItem value="com-sucessor">Com Sucessor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Posições */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlans.map((plan: any) => {
            const successors = plan.successors || [];

            return (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{plan.positionTitle || "Posição"}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.currentHolderName || "Sem ocupante"}
                      </p>
                    </div>
                    {successors.length === 0 && (
                      <Badge variant="destructive" className="ml-2">
                        Sem Sucessor
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Risco: {plan.riskLevel || "undefined"}</span>
                    <span className="text-xs ml-auto">Impacto: {plan.exitRisk || "undefined"}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Sucessores ({successors.length})
                      </p>
                      {successors.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhum sucessor identificado
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {successors.slice(0, 2).map((s: any) => (
                            <div key={s.id} className="text-sm">
                              • {s.employeeName || "Desconhecido"}
                            </div>
                          ))}
                          {successors.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{successors.length - 2} mais
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // TODO: Ver detalhes
                        }}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Dialog
                        open={isAddSuccessorOpen && selectedPlanId === plan.id}
                        onOpenChange={(open) => {
                          setIsAddSuccessorOpen(open);
                          if (open) {
                            setSelectedPlanId(plan.id);
                          } else {
                            setSelectedPlanId(null);
                            resetForm();
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => setSelectedPlanId(plan.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Adicionar Sucessor</DialogTitle>
                            <div className="flex items-center gap-2 mt-2 p-3 bg-blue-50 rounded-md">
                              <Info className="h-5 w-5 text-blue-600" />
                              <p className="text-sm text-blue-900">
                                <strong>Posição:</strong> {plan.positionTitle || "Gerente"}
                              </p>
                            </div>
                          </DialogHeader>

                          <div className="space-y-4 mt-4">
                            {/* Candidato/Sucessor */}
                            <div>
                              <Label>Candidato/Sucessor *</Label>
                              <Select
                                value={formData.employeeId}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, employeeId: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o candidato..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees?.map((emp: any) => (
                                    <SelectItem key={emp.employee.id} value={emp.employee.id.toString()}>
                                      {emp.employee.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground mt-1">
                                Selecione um colaborador ativo do sistema
                              </p>
                            </div>

                            {/* Nível de Prontidão e Prioridade */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Nível de Prontidão *</Label>
                                <Select
                                  value={formData.readinessLevel}
                                  onValueChange={(value: any) =>
                                    setFormData({ ...formData, readinessLevel: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="imediato">Pronto agora</SelectItem>
                                    <SelectItem value="1_ano">Pronto em 1-2 anos</SelectItem>
                                    <SelectItem value="2_3_anos">Pronto em 2-3 anos</SelectItem>
                                    <SelectItem value="mais_3_anos">Pronto em 3+ anos</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Prioridade *</Label>
                                <Select
                                  value={formData.priority.toString()}
                                  onValueChange={(value) =>
                                    setFormData({ ...formData, priority: parseInt(value) })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">1 - Principal</SelectItem>
                                    <SelectItem value="2">2 - Secundário</SelectItem>
                                    <SelectItem value="3">3 - Backup</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Avaliação de Desempenho e Potencial */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Avaliação de Desempenho</Label>
                                <Select
                                  value={formData.performanceRating}
                                  onValueChange={(value: any) =>
                                    setFormData({ ...formData, performanceRating: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="baixo">Baixo</SelectItem>
                                    <SelectItem value="medio">Médio</SelectItem>
                                    <SelectItem value="alto">Alto</SelectItem>
                                    <SelectItem value="excepcional">Excepcional</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Avaliação de Potencial</Label>
                                <Select
                                  value={formData.potentialRating}
                                  onValueChange={(value: any) =>
                                    setFormData({ ...formData, potentialRating: value })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="baixo">Baixo</SelectItem>
                                    <SelectItem value="medio">Médio</SelectItem>
                                    <SelectItem value="alto">Alto</SelectItem>
                                    <SelectItem value="excepcional">Excepcional</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Posição Nine Box */}
                            <div>
                              <Label>Posição Nine Box</Label>
                              <Select
                                value={formData.nineBoxPosition}
                                onValueChange={(value) =>
                                  setFormData({ ...formData, nineBoxPosition: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a posição..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="alto-potencial">Alto Potencial</SelectItem>
                                  <SelectItem value="alto-desempenho">Alto Desempenho</SelectItem>
                                  <SelectItem value="estrela">Estrela</SelectItem>
                                  <SelectItem value="talento-chave">Talento Chave</SelectItem>
                                  <SelectItem value="solido">Sólido</SelectItem>
                                  <SelectItem value="enigma">Enigma</SelectItem>
                                  <SelectItem value="baixo-desempenho">Baixo Desempenho</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Análise de Gaps */}
                            <div>
                              <Label>Análise de Gaps (Lacunas)</Label>
                              <Textarea
                                placeholder="Descreva as competências ou experiências que o candidato ainda precisa desenvolver..."
                                value={formData.gapAnalysis}
                                onChange={(e) =>
                                  setFormData({ ...formData, gapAnalysis: e.target.value })
                                }
                                rows={3}
                              />
                            </div>

                            {/* Ações de Desenvolvimento Recomendadas */}
                            <div>
                              <Label>Ações de Desenvolvimento Recomendadas</Label>
                              <Textarea
                                placeholder="Liste as ações de desenvolvimento recomendadas (treinamentos, projetos, mentoria, etc.)..."
                                value={formData.developmentActions}
                                onChange={(e) =>
                                  setFormData({ ...formData, developmentActions: e.target.value })
                                }
                                rows={3}
                              />
                            </div>

                            {/* Notas */}
                            <div>
                              <Label>Notas Adicionais</Label>
                              <Textarea
                                placeholder="Observações adicionais..."
                                value={formData.notes}
                                onChange={(e) =>
                                  setFormData({ ...formData, notes: e.target.value })
                                }
                                rows={2}
                              />
                            </div>

                            {/* Botões */}
                            <div className="flex items-center gap-3 pt-4 border-t">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                  setIsAddSuccessorOpen(false);
                                  resetForm();
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                className="flex-1"
                                onClick={handleSubmit}
                                disabled={addSuccessorMutation.isPending}
                              >
                                {addSuccessorMutation.isPending && (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Salvar Alterações
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPlans.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma posição encontrada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece adicionando a primeira posição crítica ao mapa de sucessão
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeira Posição
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
