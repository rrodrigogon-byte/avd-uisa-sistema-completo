import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Users, Target, Award, CheckCircle2, AlertCircle, Edit, Plus, Save, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SucessaoInteligente() {
  const { user } = useAuth();
  const [selectedPosition, setSelectedPosition] = useState<number | undefined>(undefined);
  const [editingSuccessor, setEditingSuccessor] = useState<any>(null);
  const [editingNineBox, setEditingNineBox] = useState<any>(null);
  const [addingSuccessor, setAddingSuccessor] = useState(false);
  const [newSuccessor, setNewSuccessor] = useState({
    employeeId: 0,
    readinessLevel: "2_3_anos",
    developmentNeeds: "",
  });

  const utils = trpc.useUtils();
  const isAdmin = user?.role === 'admin';

  // Buscar dados reais do banco
  const { data: positions } = trpc.positionsManagement.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: successorsData } = trpc.succession.listCandidates.useQuery(
    { positionId: selectedPosition },
    { enabled: !!selectedPosition }
  );
  const { data: pdiPlans } = trpc.pdiIntelligent.list.useQuery();
  const { data: nineBoxData } = trpc.nineBox.list.useQuery();
  const { data: performanceData } = trpc.evaluations.list.useQuery();

  // Mutations
  const addSuccessorMutation = trpc.succession.addCandidate.useMutation({
    onSuccess: () => {
      toast.success("Sucessor adicionado com sucesso!");
      utils.succession.listCandidates.invalidate();
      setAddingSuccessor(false);
      setNewSuccessor({ employeeId: 0, readinessLevel: "2_3_anos", developmentNeeds: "" });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar sucessor: ${error.message}`);
    },
  });

  const updateSuccessorMutation = trpc.succession.updateCandidate.useMutation({
    onSuccess: () => {
      toast.success("Sucessor atualizado com sucesso!");
      utils.succession.listCandidates.invalidate();
      setEditingSuccessor(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar sucessor: ${error.message}`);
    },
  });

  const removeSuccessorMutation = trpc.succession.removeCandidate.useMutation({
    onSuccess: () => {
      toast.success("Sucessor removido com sucesso!");
      utils.succession.listCandidates.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao remover sucessor: ${error.message}`);
    },
  });

  const updateNineBoxMutation = trpc.nineBox.update.useMutation({
    onSuccess: () => {
      toast.success("Matriz 9-Box atualizada!");
      utils.nineBox.list.invalidate();
      setEditingNineBox(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar 9-Box: ${error.message}`);
    },
  });

  // Processar dados de sucessores com informações integradas
  const successors = successorsData?.map((candidate: any) => {
    const pdi = pdiPlans?.find((p: any) => p.employeeId === candidate.employeeId);
    const pdiItems = pdi?.items || [];
    const completedItems = pdiItems.filter((item: any) => item.status === 'completed').length;
    const totalItems = pdiItems.length;
    const pdiProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const nineBox = nineBoxData?.find((nb: any) => nb.employeeId === candidate.employeeId);
    const nineBoxLabel = nineBox ? `${nineBox.performance} / ${nineBox.potential}` : "Não avaliado";

    const performance = performanceData?.find((p: any) => p.employeeId === candidate.employeeId);
    const performanceRating = (performance as any)?.overallRating || "atende_expectativas";

    return {
      id: candidate.id,
      employeeId: candidate.employeeId,
      name: candidate.employeeName || "Candidato",
      currentPosition: candidate.currentPosition || "Não informado",
      readinessLevel: candidate.readinessLevel || "2_3_anos",
      readinessScore: candidate.readinessScore || 0,
      developmentNeeds: candidate.developmentNeeds || "",
      pdi: {
        progress: Math.round(pdiProgress),
        completedActions: completedItems,
        totalActions: totalItems,
        keyAreas: pdiItems.slice(0, 3).map((item: any) => item.title || "N/A"),
      },
      performance: {
        rating: performanceRating,
        trend: "estavel",
      },
      nineBox: nineBoxLabel,
      nineBoxData: nineBox,
      competencyGaps: candidate.developmentNeeds?.split(',') || [],
    };
  }) || [];

  const getReadinessLabel = (level: string) => {
    const labels: Record<string, string> = {
      imediato: "Imediato",
      "1_ano": "1 Ano",
      "2_3_anos": "2-3 Anos",
      "mais_3_anos": "+3 Anos",
    };
    return labels[level] || level;
  };

  const getReadinessColor = (level: string) => {
    const colors: Record<string, string> = {
      imediato: "bg-green-500",
      "1_ano": "bg-blue-500",
      "2_3_anos": "bg-yellow-500",
      "mais_3_anos": "bg-orange-500",
    };
    return colors[level] || "bg-gray-500";
  };

  const getPerformanceLabel = (rating: string) => {
    const labels: Record<string, string> = {
      excepcional: "Excepcional",
      supera_expectativas: "Supera Expectativas",
      atende_expectativas: "Atende Expectativas",
      abaixo_expectativas: "Abaixo das Expectativas",
    };
    return labels[rating] || rating;
  };

  const handleAddSuccessor = () => {
    if (!selectedPosition || !newSuccessor.employeeId) {
      toast.error("Selecione um funcionário");
      return;
    }

    addSuccessorMutation.mutate({
      positionId: selectedPosition,
      employeeId: newSuccessor.employeeId,
      readinessLevel: newSuccessor.readinessLevel as any,
      developmentNeeds: newSuccessor.developmentNeeds,
    });
  };

  const handleUpdateSuccessor = () => {
    if (!editingSuccessor) return;

    updateSuccessorMutation.mutate({
      id: editingSuccessor.id,
      readinessLevel: editingSuccessor.readinessLevel,
      developmentNeeds: editingSuccessor.developmentNeeds,
    });
  };

  const handleRemoveSuccessor = (id: number) => {
    if (confirm("Tem certeza que deseja remover este sucessor?")) {
      removeSuccessorMutation.mutate({ id });
    }
  };

  const handleUpdateNineBox = () => {
    if (!editingNineBox) return;

    updateNineBoxMutation.mutate({
      employeeId: editingNineBox.employeeId,
      performance: editingNineBox.performance,
      potential: editingNineBox.potential,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Sucessão Inteligente
          </h1>
          <p className="text-muted-foreground mt-1">
            Pipeline de talentos e planejamento de sucessão baseado em dados
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posições Críticas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{positions?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Posições cadastradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sucessores Prontos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {successorsData?.filter((s: any) => s.readinessLevel === 'imediato').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Prontos imediatamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PDIs Ativos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pdiPlans?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Planos de desenvolvimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cobertura</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {positions?.length && successorsData?.length
                  ? Math.round((successorsData.length / positions.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Posições com sucessores</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro de Posição */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Posição</CardTitle>
            <CardDescription>
              Escolha uma posição para visualizar e gerenciar o pipeline de sucessores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedPosition?.toString() || ""}
              onValueChange={(value) => setSelectedPosition(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma posição" />
              </SelectTrigger>
              <SelectContent>
                {positions?.map((pos: any) => (
                  <SelectItem key={pos.id} value={pos.id.toString()}>
                    {pos.title} - {pos.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedPosition && (
          <Tabs defaultValue="pipeline" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline de Sucessores</TabsTrigger>
              <TabsTrigger value="matrix">Matriz 9-Box</TabsTrigger>
              <TabsTrigger value="development">Planos de Desenvolvimento</TabsTrigger>
            </TabsList>

            {/* ABA 1: PIPELINE DE SUCESSORES (EDITÁVEL) */}
            <TabsContent value="pipeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Candidatos a Sucessão</CardTitle>
                      <CardDescription>
                        Ordenados por score de prontidão (performance + potencial + PDI + metas)
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <Dialog open={addingSuccessor} onOpenChange={setAddingSuccessor}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Sucessor
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adicionar Novo Sucessor</DialogTitle>
                            <DialogDescription>
                              Selecione um funcionário para adicionar ao pipeline de sucessão
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Funcionário</Label>
                              <Select
                                value={newSuccessor.employeeId.toString()}
                                onValueChange={(value) => setNewSuccessor({ ...newSuccessor, employeeId: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um funcionário" />
                                </SelectTrigger>
                                <SelectContent>
                                  {employees?.map((emp: any) => (
                                    <SelectItem key={emp.id} value={emp.id.toString()}>
                                      {emp.name} - {emp.positionTitle}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Nível de Prontidão</Label>
                              <Select
                                value={newSuccessor.readinessLevel}
                                onValueChange={(value) => setNewSuccessor({ ...newSuccessor, readinessLevel: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="imediato">Imediato</SelectItem>
                                  <SelectItem value="1_ano">1 Ano</SelectItem>
                                  <SelectItem value="2_3_anos">2-3 Anos</SelectItem>
                                  <SelectItem value="mais_3_anos">+3 Anos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Necessidades de Desenvolvimento</Label>
                              <Textarea
                                value={newSuccessor.developmentNeeds}
                                onChange={(e) => setNewSuccessor({ ...newSuccessor, developmentNeeds: e.target.value })}
                                placeholder="Ex: Liderança, Gestão Estratégica, Negociação"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setAddingSuccessor(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleAddSuccessor}>Adicionar</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {successors.map((successor: any) => (
                      <div key={successor.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{successor.name}</h3>
                              <Badge variant="outline">{successor.currentPosition}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Nine Box: {successor.nineBox}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <>
                                <Dialog open={editingSuccessor?.id === successor.id} onOpenChange={(open) => !open && setEditingSuccessor(null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingSuccessor(successor)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Editar Sucessor</DialogTitle>
                                      <DialogDescription>
                                        Atualize as informações do candidato a sucessão
                                      </DialogDescription>
                                    </DialogHeader>
                                    {editingSuccessor && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Nível de Prontidão</Label>
                                          <Select
                                            value={editingSuccessor.readinessLevel}
                                            onValueChange={(value) => setEditingSuccessor({ ...editingSuccessor, readinessLevel: value })}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="imediato">Imediato</SelectItem>
                                              <SelectItem value="1_ano">1 Ano</SelectItem>
                                              <SelectItem value="2_3_anos">2-3 Anos</SelectItem>
                                              <SelectItem value="mais_3_anos">+3 Anos</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Necessidades de Desenvolvimento</Label>
                                          <Textarea
                                            value={editingSuccessor.developmentNeeds}
                                            onChange={(e) => setEditingSuccessor({ ...editingSuccessor, developmentNeeds: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setEditingSuccessor(null)}>
                                        Cancelar
                                      </Button>
                                      <Button onClick={handleUpdateSuccessor}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Salvar
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveSuccessor(successor.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Nível de Prontidão</span>
                              <Badge className={getReadinessColor(successor.readinessLevel)}>
                                {getReadinessLabel(successor.readinessLevel)}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Performance</span>
                              <Badge variant="secondary">
                                {getPerformanceLabel(successor.performance.rating)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Progresso do PDI</span>
                            <span className="text-muted-foreground">
                              {successor.pdi.completedActions}/{successor.pdi.totalActions} ações
                            </span>
                          </div>
                          <Progress value={successor.pdi.progress} className="h-2" />
                        </div>

                        {successor.competencyGaps.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm font-medium">Gaps de Competências</span>
                            <div className="flex flex-wrap gap-2">
                              {successor.competencyGaps.map((gap: any, idx: any) => (
                                <Badge key={idx} variant="destructive" className="text-xs">
                                  {gap}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: MATRIZ 9-BOX (EDITÁVEL) */}
            <TabsContent value="matrix">
              <Card>
                <CardHeader>
                  <CardTitle>Matriz 9-Box - Candidatos</CardTitle>
                  <CardDescription>
                    Visualização e edição de performance vs potencial dos candidatos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 p-4">
                    {[3, 2, 1].map((potencial) =>
                      [1, 2, 3].map((performance) => {
                        const candidatesInBox = successors.filter((s: any) => {
                          const nb = s.nineBoxData;
                          return nb?.performance === performance && nb?.potential === potencial;
                        });

                        const boxColors: Record<string, string> = {
                          '3-3': 'bg-green-100 border-green-500',
                          '3-2': 'bg-green-50 border-green-400',
                          '3-1': 'bg-yellow-50 border-yellow-400',
                          '2-3': 'bg-blue-100 border-blue-500',
                          '2-2': 'bg-blue-50 border-blue-400',
                          '2-1': 'bg-yellow-100 border-yellow-500',
                          '1-3': 'bg-orange-50 border-orange-400',
                          '1-2': 'bg-orange-100 border-orange-500',
                          '1-1': 'bg-red-100 border-red-500',
                        };

                        const boxKey = `${potencial}-${performance}`;
                        const boxColor = boxColors[boxKey] || 'bg-gray-50 border-gray-300';

                        return (
                          <div
                            key={boxKey}
                            className={`border-2 rounded-lg p-3 min-h-[120px] ${boxColor}`}
                          >
                            <div className="text-xs font-semibold mb-2 text-gray-700">
                              P:{performance} / Pot:{potencial}
                            </div>
                            <div className="space-y-1">
                              {candidatesInBox.map((c: any) => (
                                <div
                                  key={c.id}
                                  className="text-xs bg-white rounded px-2 py-1 shadow-sm flex items-center justify-between group"
                                >
                                  <span>{c.name}</span>
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                                      onClick={() => setEditingNineBox({ employeeId: c.employeeId, performance, potential: potencial })}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              {candidatesInBox.length === 0 && (
                                <div className="text-xs text-gray-400 italic">Vazio</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                      <span>Alto Potencial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border-2 border-blue-500 rounded"></div>
                      <span>Médio Potencial</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                      <span>Baixo Potencial</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dialog para editar posição na matriz */}
              <Dialog open={!!editingNineBox} onOpenChange={(open) => !open && setEditingNineBox(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Editar Posição na Matriz 9-Box</DialogTitle>
                    <DialogDescription>
                      Ajuste a performance e potencial do candidato
                    </DialogDescription>
                  </DialogHeader>
                  {editingNineBox && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Performance (1-3)</Label>
                        <Select
                          value={editingNineBox.performance.toString()}
                          onValueChange={(value) => setEditingNineBox({ ...editingNineBox, performance: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Baixa</SelectItem>
                            <SelectItem value="2">2 - Média</SelectItem>
                            <SelectItem value="3">3 - Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Potencial (1-3)</Label>
                        <Select
                          value={editingNineBox.potential.toString()}
                          onValueChange={(value) => setEditingNineBox({ ...editingNineBox, potential: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 - Baixo</SelectItem>
                            <SelectItem value="2">2 - Médio</SelectItem>
                            <SelectItem value="3">3 - Alto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingNineBox(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateNineBox}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ABA 3: PLANOS DE DESENVOLVIMENTO (EDITÁVEL) */}
            <TabsContent value="development">
              <Card>
                <CardHeader>
                  <CardTitle>Planos de Desenvolvimento</CardTitle>
                  <CardDescription>
                    Ações de desenvolvimento para preparar sucessores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidato</TableHead>
                        <TableHead>Ações Planejadas</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Status</TableHead>
                        {isAdmin && <TableHead>Ações</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {successors.map((successor: any) => (
                        <TableRow key={successor.id}>
                          <TableCell className="font-medium">{successor.name}</TableCell>
                          <TableCell>{successor.pdi.totalActions} ações</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={successor.pdi.progress} className="h-2 w-24" />
                              <span className="text-sm">{successor.pdi.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={successor.pdi.progress >= 70 ? "default" : "secondary"}>
                              {successor.pdi.progress >= 70 ? "No prazo" : "Atenção"}
                            </Badge>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar PDI
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!selectedPosition && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma posição acima para visualizar o pipeline de sucessores</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
