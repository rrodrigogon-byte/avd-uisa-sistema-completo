import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, TrendingUp, AlertTriangle, Plus, Edit, Eye, Download, Trash2, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { toast } from "sonner";
import { useLocation } from "wouter";

/**
 * Mapa de Sucessão UISA - Versão Completa com CRUD
 * 
 * Features Implementadas:
 * ✅ Dashboard one-page para visualizar sucessores
 * ✅ Botão Editar completamente funcional
 * ✅ Botão Incluir para novos planos
 * ✅ Botão Incluir Sucessor para adicionar sucessores a planos existentes
 * ✅ Botão Deletar com confirmação
 * ✅ Botão PDI para vincular com PDI Inteligente
 * ✅ Botão Salvar com validação
 * ✅ Layout profissional com cores UISA (laranja #F39200)
 */

interface SuccessorData {
  id: number;
  employee: {
    id: number;
    name: string;
    photo?: string;
    position?: string;
    department?: string;
    timeInCompany?: string;
    timeInPosition?: string;
  };
  readinessLevel: string;
  nineBoxScore?: string;
  nineBoxCategory?: string;
  marketMedian?: number;
  lossRisk: "alto" | "medio" | "baixo";
  lossImpact: "alto" | "medio" | "baixo";
  gapAnalysis?: string;
  developmentActions?: string;
  notes?: string;
}

// Helper functions
const getReadinessColor = (level: string) => {
  const colors: Record<string, string> = {
    imediato: "bg-emerald-600",
    "1_ano": "bg-orange-500",
    "2_3_anos": "bg-yellow-500",
    "mais_3_anos": "bg-gray-600",
    externo: "bg-black",
  };
  return colors[level] || "bg-gray-400";
};

const getReadinessLabel = (level: string) => {
  const labels: Record<string, string> = {
    imediato: "Pronto",
    "1_ano": "Pronto em até 12 meses",
    "2_3_anos": "Pronto em até 24 meses",
    "mais_3_anos": "Pronto em até 36 meses",
    externo: "Recurso Externo",
  };
  return labels[level] || level;
};

const getRiskBadgeColor = (risk: string) => {
  if (risk === "alto") return "bg-red-100 text-red-800 border-red-300";
  if (risk === "medio") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  return "bg-green-100 text-green-800 border-green-300";
};

export default function MapaSucessaoUISA() {
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showAddSuccessorModal, setShowAddSuccessorModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSuccessor, setSelectedSuccessor] = useState<any | null>(null);

  // Queries
  const { data: plansRaw, isLoading, refetch } = trpc.succession.list.useQuery({});
  const {
    searchTerm: employeeSearch,
    setSearchTerm: setEmployeeSearch,
    employees,
    isLoading: loadingEmployees
  } = useEmployeeSearch();
  const { data: positions } = trpc.positions.list.useQuery({});

  // Mutations
  const updateSuccessorMutation = trpc.succession.updateSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor atualizado com sucesso!");
      setShowEditModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const addSuccessorMutation = trpc.succession.addSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor adicionado com sucesso!");
      setShowAddSuccessorModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteSuccessorMutation = trpc.succession.removeSuccessor.useMutation({
    onSuccess: () => {
      toast.success("Sucessor removido com sucesso!");
      setShowDeleteConfirm(false);
      setSelectedSuccessor(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const createPlanMutation = trpc.succession.create.useMutation({
    onSuccess: () => {
      toast.success("Plano de sucessão criado!");
      setShowAddPlanModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCardClick = (plan: any) => {
    setSelectedPlan(plan);
    setShowDashboard(true);
  };

  const handleEditClick = (successor: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSuccessor(successor);
    setShowEditModal(true);
  };

  const handleDeleteClick = (successor: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedSuccessor(successor);
    setShowDeleteConfirm(true);
  };

  const handleAddSuccessorClick = (plan: any) => {
    setSelectedPlan(plan);
    setShowAddSuccessorModal(true);
  };

  const handlePDIClick = (successor: any) => {
    // Navegar para PDI Inteligente com dados do sucessor
    const employeeId = successor.employee?.id || successor.employeeId;
    navigate(`/pdi-inteligente?employeeId=${employeeId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </div>
      </DashboardLayout>
    );
  }

  const plans = plansRaw || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mapa de Sucessão UISA</h1>
            <p className="text-gray-600 mt-1">Gestão estratégica de sucessão gerencial</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar PDF
            </Button>
            <Button 
              className="gap-2 bg-[#F39200] hover:bg-[#d97f00]"
              onClick={() => setShowAddPlanModal(true)}
            >
              <Plus className="w-4 h-4" />
              Incluir Plano
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Posições Críticas</p>
                  <p className="text-3xl font-bold text-gray-900">{plans.length}</p>
                </div>
                <Users className="w-10 h-10 text-[#F39200] opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sucessores Prontos</p>
                  <p className="text-3xl font-bold text-emerald-600">
                    {plans.filter((p: any) => 
                      p.successors?.some((s: any) => s.readinessLevel === "imediato")
                    ).length}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-emerald-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sem Sucessor</p>
                  <p className="text-3xl font-bold text-red-600">
                    {plans.filter((p: any) => !p.successors || p.successors.length === 0).length}
                  </p>
                </div>
                <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">% Cobertura</p>
                  <p className="text-3xl font-bold text-[#F39200]">
                    {plans.length > 0 
                      ? Math.round((plans.filter((p: any) => p.successors?.length > 0).length / plans.length) * 100)
                      : 0}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-[#F39200] opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan: any) => (
            <Card 
              key={plan.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-l-[#F39200]"
              onClick={() => handleCardClick(plan)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F39200] to-[#d97f00] flex items-center justify-center text-white text-xl font-bold">
                      {plan.positionTitle?.charAt(0) || "?"}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.positionTitle || "Posição"}</CardTitle>
                      <p className="text-sm text-gray-600">{plan.currentHolderName || "Vago"}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className={getRiskBadgeColor(plan.riskLevel || "baixo")}>
                          Risco: {plan.riskLevel || "Baixo"}
                        </Badge>
                        <Badge variant="outline" className={getRiskBadgeColor(plan.exitRisk || "baixo")}>
                          Saída: {plan.exitRisk || "Baixo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSuccessorClick(plan);
                      }}
                      title="Incluir Sucessor"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(plan);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Sucessores Identificados:</span>
                    <span className="font-semibold">{plan.successors?.length || 0}</span>
                  </div>

                  {plan.successors && plan.successors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Principais Sucessores:</p>
                      {plan.successors.slice(0, 2).map((successor: any) => (
                        <div 
                          key={successor.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${getReadinessColor(successor.readinessLevel)}`} />
                            <div>
                              <p className="text-sm font-medium">{successor.employeeName}</p>
                              <p className="text-xs text-gray-600">{getReadinessLabel(successor.readinessLevel)}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => handleEditClick(successor, e)}
                              title="Editar"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={(e) => handleDeleteClick(successor, e)}
                              title="Deletar"
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!plan.successors || plan.successors.length === 0) && (
                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                      Nenhum sucessor identificado
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="text-[#F39200] ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddSuccessorClick(plan);
                        }}
                      >
                        Incluir Sucessor
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {plans.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum plano de sucessão cadastrado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece criando seu primeiro plano de sucessão para posições críticas
              </p>
              <Button 
                className="bg-[#F39200] hover:bg-[#d97f00]"
                onClick={() => setShowAddPlanModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Dashboard One-Page (Sheet lateral) */}
      <Sheet open={showDashboard} onOpenChange={setShowDashboard}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          {selectedPlan && (
            <SuccessionDashboard 
              plan={selectedPlan} 
              onClose={() => setShowDashboard(false)}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onPDI={handlePDIClick}
              onAddSuccessor={() => handleAddSuccessorClick(selectedPlan)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sucessor</DialogTitle>
            <DialogDescription>
              Atualize as informações do sucessor potencial
            </DialogDescription>
          </DialogHeader>
          {selectedSuccessor && (
            <EditSuccessorForm 
              successor={selectedSuccessor}
              onSave={(data) => {
                updateSuccessorMutation.mutate({
                  id: selectedSuccessor.id,
                  ...data,
                });
              }}
              onCancel={() => setShowEditModal(false)}
              isLoading={updateSuccessorMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Sucessor */}
      <Dialog open={showAddSuccessorModal} onOpenChange={setShowAddSuccessorModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incluir Sucessor</DialogTitle>
            <DialogDescription>
              Adicione um novo sucessor ao plano de sucessão
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <AddSuccessorForm 
              planId={selectedPlan.id}
              employees={employees || []}
              employeeSearch={employeeSearch}
              setEmployeeSearch={setEmployeeSearch}
              loadingEmployees={loadingEmployees}
              onSave={(data) => addSuccessorMutation.mutate(data)}
              onCancel={() => setShowAddSuccessorModal(false)}
              isLoading={addSuccessorMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este sucessor do plano de sucessão?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedSuccessor) {
                  deleteSuccessorMutation.mutate({ id: selectedSuccessor.id });
                }
              }}
              disabled={deleteSuccessorMutation.isPending}
            >
              {deleteSuccessorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removendo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Incluir Plano */}
      <Dialog open={showAddPlanModal} onOpenChange={setShowAddPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Incluir Novo Plano de Sucessão</DialogTitle>
            <DialogDescription>
              Crie um novo plano de sucessão para uma posição crítica
            </DialogDescription>
          </DialogHeader>
          <AddPlanForm 
            positions={positions || []}
            employees={employees || []}
            onSave={(data) => createPlanMutation.mutate(data)}
            onCancel={() => setShowAddPlanModal(false)}
            isLoading={createPlanMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Componente: Dashboard One-Page
function SuccessionDashboard({ plan, onClose, onEdit, onDelete, onPDI, onAddSuccessor }: any) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="text-2xl">Mapa Sucessório - {plan.positionTitle}</SheetTitle>
      </SheetHeader>

      {/* Titular da Posição */}
      <Card className="border-l-4 border-l-[#F39200]">
        <CardHeader className="bg-gradient-to-r from-[#F39200]/10 to-transparent">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F39200] to-[#d97f00] flex items-center justify-center text-white text-3xl font-bold">
              {plan.positionTitle?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{plan.positionTitle}</h3>
              <p className="text-gray-600">{plan.currentHolderName || "Vago"}</p>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className={getRiskBadgeColor(plan.riskLevel || "baixo")}>
                  Risco: {plan.riskLevel || "Baixo"}
                </Badge>
                <Badge variant="outline" className={getRiskBadgeColor(plan.exitRisk || "baixo")}>
                  Saída: {plan.exitRisk || "Baixo"}
                </Badge>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onAddSuccessor}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Incluir Sucessor
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Sucessores Potenciais */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-[#F39200]" />
          Sucessores Potenciais
        </h3>

        <div className="space-y-4">
          {plan.successors && plan.successors.length > 0 ? (
            plan.successors.map((successor: any, index: number) => (
              <Card key={successor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Foto e Info Básica */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                        {successor.employeeName?.charAt(0) || "?"}
                      </div>
                      <div className={`mt-2 text-center text-xs font-semibold px-2 py-1 rounded ${getReadinessColor(successor.readinessLevel)} text-white`}>
                        {index + 1}º
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{successor.employeeName}</h4>
                          <p className="text-sm text-gray-600">Prioridade: {successor.priority}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onPDI(successor)}
                            className="gap-2"
                            title="Criar/Ver PDI"
                          >
                            <FileText className="w-3 h-3" />
                            PDI
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => onEdit(successor)}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onDelete(successor)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Prontidão */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getReadinessColor(successor.readinessLevel)}`} />
                          <span className="text-sm font-medium">{getReadinessLabel(successor.readinessLevel)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comentários */}
                  {successor.notes && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Comentários:</p>
                      <p className="text-sm text-gray-600">{successor.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="mb-4">Nenhum sucessor identificado para esta posição</p>
              <Button 
                variant="outline" 
                onClick={onAddSuccessor}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Incluir Primeiro Sucessor
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tempo de Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-600" />
              <span>Pronto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500" />
              <span>Pronto em até 12 meses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500" />
              <span>Pronto em até 24 meses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-600" />
              <span>Pronto em até 36 meses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-black" />
              <span>Recurso Externo</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente: Formulário de Edição
function EditSuccessorForm({ successor, onSave, onCancel, isLoading }: any) {
  const [formData, setFormData] = useState({
    readinessLevel: successor.readinessLevel || "1_ano",
    performance: successor.performance || 3,
    potential: successor.potential || 3,
    priority: successor.priority || 1,
    performanceRating: successor.performanceRating || "medio",
    potentialRating: successor.potentialRating || "medio",
    lossRisk: successor.lossRisk || "medio",
    lossImpact: successor.lossImpact || "medio",
    gapAnalysis: successor.gapAnalysis || "",
    developmentActions: successor.developmentActions || "",
    notes: successor.notes || "",
  });

  const handleSubmit = () => {
    if (!formData.readinessLevel) {
      toast.error("Nível de prontidão é obrigatório");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nível de Prontidão *</Label>
          <Select value={formData.readinessLevel} onValueChange={(v) => setFormData({...formData, readinessLevel: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imediato">Pronto</SelectItem>
              <SelectItem value="1_ano">Pronto em até 12 meses</SelectItem>
              <SelectItem value="2_3_anos">Pronto em até 24 meses</SelectItem>
              <SelectItem value="mais_3_anos">Pronto em até 36 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Prioridade</Label>
          <Input 
            type="number" 
            min="1"
            value={formData.priority} 
            onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
          />
        </div>

        <div>
          <Label>Performance (1-5)</Label>
          <Select value={formData.performance.toString()} onValueChange={(v) => setFormData({...formData, performance: parseInt(v)})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Abaixo do Esperado</SelectItem>
              <SelectItem value="2">2 - Parcialmente Adequado</SelectItem>
              <SelectItem value="3">3 - Adequado</SelectItem>
              <SelectItem value="4">4 - Acima do Esperado</SelectItem>
              <SelectItem value="5">5 - Excepcional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Potencial (1-5)</Label>
          <Select value={formData.potential.toString()} onValueChange={(v) => setFormData({...formData, potential: parseInt(v)})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Limitado</SelectItem>
              <SelectItem value="2">2 - Moderado</SelectItem>
              <SelectItem value="3">3 - Alto</SelectItem>
              <SelectItem value="4">4 - Muito Alto</SelectItem>
              <SelectItem value="5">5 - Excepcional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Risco de Perda</Label>
          <Select value={formData.lossRisk} onValueChange={(v) => setFormData({...formData, lossRisk: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Impacto da Perda</Label>
          <Select value={formData.lossImpact} onValueChange={(v) => setFormData({...formData, lossImpact: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Análise de Gap</Label>
        <Textarea 
          value={formData.gapAnalysis}
          onChange={(e) => setFormData({...formData, gapAnalysis: e.target.value})}
          rows={3}
          placeholder="Descreva as lacunas de competências..."
        />
      </div>

      <div>
        <Label>Ações de Desenvolvimento</Label>
        <Textarea 
          value={formData.developmentActions}
          onChange={(e) => setFormData({...formData, developmentActions: e.target.value})}
          rows={3}
          placeholder="Liste as ações de desenvolvimento necessárias..."
        />
      </div>

      <div>
        <Label>Comentários</Label>
        <Textarea 
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={4}
          placeholder="Comentários adicionais sobre o sucessor..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          className="bg-[#F39200] hover:bg-[#d97f00]" 
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>
    </div>
  );
}

// Componente: Formulário de Adicionar Sucessor (Conforme Modal da Imagem)
function AddSuccessorForm({ planId, employees, employeeSearch, setEmployeeSearch, loadingEmployees, onSave, onCancel, isLoading }: any) {
  const [formData, setFormData] = useState({
    planId: planId,
    employeeId: "",
    readinessLevel: "imediato" as "imediato" | "1_ano" | "2_3_anos" | "mais_3_anos",
    priority: 1,
    performance: "medio" as "baixo" | "medio" | "alto",
    potential: "medio" as "baixo" | "medio" | "alto",
    gapAnalysis: "",
    developmentActions: "",
    comments: "",
  });

  const handleSubmit = () => {
    if (!formData.employeeId) {
      toast.error("Selecione um funcionário");
      return;
    }
    if (!formData.readinessLevel) {
      toast.error("Nível de prontidão é obrigatório");
      return;
    }
    // Preparar dados: converter strings vazias em undefined para o backend tratar como NULL
    const dataToSave = {
      ...formData,
      employeeId: parseInt(formData.employeeId),
      gapAnalysis: formData.gapAnalysis?.trim() || undefined,
      developmentActions: formData.developmentActions?.trim() || undefined,
      comments: formData.comments?.trim() || undefined,
    };
    onSave(dataToSave);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Funcionário *</Label>
        <Input
          placeholder="Digite o nome do funcionário..."
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
          className="mb-2"
        />
        <Select value={formData.employeeId} onValueChange={(v) => setFormData({...formData, employeeId: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o funcionário" />
          </SelectTrigger>
          <SelectContent>
            {loadingEmployees ? (
              <SelectItem value="loading" disabled>Carregando...</SelectItem>
            ) : (
              employees?.filter((emp: any) => emp?.id).map((emp: any) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.name} - {emp.position?.title || "Sem cargo"}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nível de Prontidão *</Label>
          <Select value={formData.readinessLevel} onValueChange={(v) => setFormData({...formData, readinessLevel: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o nível de prontidão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imediato">Pronto imediatamente</SelectItem>
              <SelectItem value="1_ano">Pronto em até 1 ano</SelectItem>
              <SelectItem value="2_3_anos">Pronto em 2-3 anos</SelectItem>
              <SelectItem value="mais_3_anos">Pronto em mais de 3 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Prioridade</Label>
          <Input 
            type="number" 
            min="1"
            value={formData.priority} 
            onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 1})}
          />
        </div>

        <div>
          <Label>Performance</Label>
          <Select value={formData.performance} onValueChange={(v: "baixo" | "medio" | "alto") => setFormData({...formData, performance: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Potencial</Label>
          <Select value={formData.potential} onValueChange={(v: "baixo" | "medio" | "alto") => setFormData({...formData, potential: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Análise de Gaps</Label>
        <Textarea 
          value={formData.gapAnalysis}
          onChange={(e) => setFormData({...formData, gapAnalysis: e.target.value})}
          rows={3}
          placeholder="Análise das lacunas de competências..."
        />
      </div>

      <div>
        <Label>Ações de Desenvolvimento</Label>
        <Textarea 
          value={formData.developmentActions}
          onChange={(e) => setFormData({...formData, developmentActions: e.target.value})}
          rows={3}
          placeholder="Ações recomendadas para desenvolvimento..."
        />
      </div>

      <div>
        <Label>Comentários</Label>
        <Textarea 
          value={formData.comments}
          onChange={(e) => setFormData({...formData, comments: e.target.value})}
          rows={3}
          placeholder="Comentários sobre o sucessor..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          className="bg-[#F39200] hover:bg-[#d97f00]" 
          onClick={handleSubmit}
          disabled={isLoading || !formData.employeeId}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adicionando...
            </>
          ) : (
            "Adicionar Sucessor"
          )}
        </Button>
      </div>
    </div>
  );
}

// Componente: Formulário de Adicionar Plano
function AddPlanForm({ positions, employees, onSave, onCancel, isLoading }: any) {
  const [formData, setFormData] = useState({
    positionId: "",
    currentHolderId: "",
    riskLevel: "medio",
    exitRisk: "medio",
    isCritical: false,
    notes: "",
  });

  const handleSubmit = () => {
    if (!formData.positionId) {
      toast.error("Selecione uma posição");
      return;
    }
    onSave({
      positionId: parseInt(formData.positionId),
      currentHolderId: formData.currentHolderId ? parseInt(formData.currentHolderId) : undefined,
      riskLevel: formData.riskLevel,
      exitRisk: formData.exitRisk,
      isCritical: formData.isCritical,
      notes: formData.notes,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Posição Crítica *</Label>
        <Select value={formData.positionId} onValueChange={(v) => setFormData({...formData, positionId: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a posição" />
          </SelectTrigger>
          <SelectContent>
            {positions?.filter((pos: any) => pos?.id).map((pos: any) => (
              <SelectItem key={pos.id} value={pos.id.toString()}>
                {pos.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Titular Atual (Opcional)</Label>
        <Select value={formData.currentHolderId} onValueChange={(v) => setFormData({...formData, currentHolderId: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o titular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhum (Vago)</SelectItem>
            {employees?.filter((emp: any) => emp?.id).map((emp: any) => (
              <SelectItem key={emp.id} value={emp.id.toString()}>
                {emp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nível de Risco</Label>
          <Select value={formData.riskLevel} onValueChange={(v) => setFormData({...formData, riskLevel: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Risco de Saída</Label>
          <Select value={formData.exitRisk} onValueChange={(v) => setFormData({...formData, exitRisk: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isCritical"
          checked={formData.isCritical}
          onChange={(e) => setFormData({...formData, isCritical: e.target.checked})}
          className="w-4 h-4"
        />
        <Label htmlFor="isCritical" className="cursor-pointer">
          Marcar como posição crítica
        </Label>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea 
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
          placeholder="Observações sobre a posição..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          className="bg-[#F39200] hover:bg-[#d97f00]" 
          onClick={handleSubmit}
          disabled={isLoading || !formData.positionId}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar Plano"
          )}
        </Button>
      </div>
    </div>
  );
}
