import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Users, TrendingUp, AlertTriangle, Plus, Edit, Eye, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Mapa de Sucessão UISA - Versão Completa
 * Inspirado no design do PowerPoint fornecido
 * 
 * Features:
 * - Dashboard one-page para visualizar sucessor
 * - Botão Editar completamente funcional
 * - Clicar no card abre o dashboard completo
 * - Botão Incluir para novos planos
 * - Layout profissional com cores UISA (laranja #F39200)
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

// Helper functions (movidas para fora do componente para serem acessíveis globalmente)
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
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [selectedSuccessor, setSelectedSuccessor] = useState<SuccessorData | null>(null);

  // Queries
  const { data: plansRaw, isLoading, refetch } = trpc.succession.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: positions } = trpc.positions.list.useQuery();

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

  const handleEditClick = (successor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSuccessor(successor);
    setShowEditModal(true);
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
            <h1 className="text-3xl font-bold text-gray-900">Mapa de Sucessão</h1>
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
                      {plan.position?.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.position?.name || "Posição"}</CardTitle>
                      <p className="text-sm text-gray-600">{plan.position?.department || "Departamento"}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className={getRiskBadgeColor(plan.lossRisk || "baixo")}>
                          Risco: {plan.lossRisk || "Baixo"}
                        </Badge>
                        <Badge variant="outline" className={getRiskBadgeColor(plan.lossImpact || "baixo")}>
                          Impacto: {plan.lossImpact || "Baixo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
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
                              <p className="text-sm font-medium">{successor.employee?.name}</p>
                              <p className="text-xs text-gray-600">{getReadinessLabel(successor.readinessLevel)}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => handleEditClick(successor, e)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!plan.successors || plan.successors.length === 0) && (
                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50 rounded-lg">
                      Nenhum sucessor identificado
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
              onEdit={(successor) => {
                setSelectedSuccessor(successor);
                setShowEditModal(true);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sucessor</DialogTitle>
          </DialogHeader>
          {selectedSuccessor && (
            <EditSuccessorForm 
              successor={selectedSuccessor}
              onSave={(data) => {
                updateSuccessorMutation.mutate({
                  successorId: selectedSuccessor.id,
                  ...data,
                });
              }}
              onCancel={() => setShowEditModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Incluir Plano */}
      <Dialog open={showAddPlanModal} onOpenChange={setShowAddPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Incluir Novo Plano de Sucessão</DialogTitle>
          </DialogHeader>
          <AddPlanForm 
            positions={positions || []}
            onSave={(data) => createPlanMutation.mutate(data)}
            onCancel={() => setShowAddPlanModal(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Componente: Dashboard One-Page
function SuccessionDashboard({ plan, onClose, onEdit }: any) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="text-2xl">Mapa Sucessório - {plan.position?.name}</SheetTitle>
      </SheetHeader>

      {/* Titular da Posição */}
      <Card className="border-l-4 border-l-[#F39200]">
        <CardHeader className="bg-gradient-to-r from-[#F39200]/10 to-transparent">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F39200] to-[#d97f00] flex items-center justify-center text-white text-3xl font-bold">
              {plan.position?.name?.charAt(0) || "?"}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{plan.position?.name}</h3>
              <p className="text-gray-600">{plan.currentHolder?.name || "Vago"}</p>
              <div className="flex gap-2 mt-3">
                <Badge className="bg-emerald-600">9Box: 24/25 BA</Badge>
                <Badge variant="outline">Med: R$ 15.000</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Risco de Perda</p>
                  <Badge className={getRiskBadgeColor(plan.lossRisk || "baixo")}>
                    {plan.lossRisk || "Baixo"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Impacto da Perda</p>
                  <Badge className={getRiskBadgeColor(plan.lossImpact || "baixo")}>
                    {plan.lossImpact || "Baixo"}
                  </Badge>
                </div>
              </div>
            </div>
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
                        {successor.employee?.name?.charAt(0) || "?"}
                      </div>
                      <div className={`mt-2 text-center text-xs font-semibold px-2 py-1 rounded ${getReadinessColor(successor.readinessLevel)} text-white`}>
                        {index + 1}º
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{successor.employee?.name}</h4>
                          <p className="text-sm text-gray-600">{successor.employee?.position || "Cargo Atual"}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {successor.employee?.timeInCompany || "X anos de uisa"} • 
                            {successor.employee?.timeInPosition || "Y anos na função"}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => onEdit(successor)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                      </div>

                      {/* 9Box e Mediana */}
                      <div className="flex gap-4 mt-3">
                        <Badge className="bg-emerald-600">
                          9Box: {successor.nineBoxScore || "24/25"} {successor.nineBoxCategory || "BA"}
                        </Badge>
                        <Badge variant="outline">
                          Med: R$ {successor.marketMedian || "12.000"}
                        </Badge>
                      </div>

                      {/* Prontidão */}
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getReadinessColor(successor.readinessLevel)}`} />
                          <span className="text-sm font-medium">{getReadinessLabel(successor.readinessLevel)}</span>
                        </div>
                      </div>

                      {/* Risco e Impacto */}
                      <div className="flex gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Risco de Perda</p>
                          <Badge variant="outline" className={getRiskBadgeColor(successor.lossRisk || "baixo")}>
                            {successor.lossRisk || "Baixo"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Impacto da Perda</p>
                          <Badge variant="outline" className={getRiskBadgeColor(successor.lossImpact || "baixo")}>
                            {successor.lossImpact || "Baixo"}
                          </Badge>
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
              <p>Nenhum sucessor identificado para esta posição</p>
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
              <div className="w-4 h-4 rounded bg-amber-700" />
              <span>Prazo superior a 36 meses</span>
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
function EditSuccessorForm({ successor, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    readinessLevel: successor.readinessLevel || "1_ano",
    performance: successor.performance || 3,
    potential: successor.potential || 3,
    nineBoxScore: successor.nineBoxScore || "",
    nineBoxCategory: successor.nineBoxCategory || "",
    lossRisk: successor.lossRisk || "medio",
    lossImpact: successor.lossImpact || "medio",
    gapAnalysis: successor.gapAnalysis || "",
    developmentActions: successor.developmentActions || "",
    notes: successor.notes || "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nível de Prontidão</Label>
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
          <Label>9Box Score</Label>
          <Input 
            value={formData.nineBoxScore} 
            onChange={(e) => setFormData({...formData, nineBoxScore: e.target.value})}
            placeholder="24/25"
          />
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
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button className="bg-[#F39200] hover:bg-[#d97f00]" onClick={() => onSave(formData)}>
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}

// Componente: Formulário de Adicionar Plano
function AddPlanForm({ positions, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    positionId: "",
    lossRisk: "medio",
    lossImpact: "medio",
    notes: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Posição Crítica</Label>
        <Select value={formData.positionId} onValueChange={(v) => setFormData({...formData, positionId: v})}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a posição" />
          </SelectTrigger>
          <SelectContent>
            {positions.map((pos: any) => (
              <SelectItem key={pos.id} value={pos.id.toString()}>
                {pos.name} - {pos.department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <Label>Observações</Label>
        <Textarea 
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
          placeholder="Observações sobre a posição..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          className="bg-[#F39200] hover:bg-[#d97f00]" 
          onClick={() => onSave({
            positionId: parseInt(formData.positionId),
            lossRisk: formData.lossRisk,
            lossImpact: formData.lossImpact,
            notes: formData.notes,
          })}
          disabled={!formData.positionId}
        >
          Criar Plano
        </Button>
      </div>
    </div>
  );
}


