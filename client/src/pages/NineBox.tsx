import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Users, TrendingUp, Star, AlertCircle, Target, Zap, Clock, Award, Grid3x3 } from "lucide-react";

/**
 * Página de Matriz 9-Box
 * Visualização gráfica com calibração e ajustes manuais
 */

type Employee9Box = {
  id: number;
  name: string;
  position: string;
  department: string;
  performance: number;
  potential: number;
  category: string;
  lastCalibration?: string;
};

const QUADRANT_LABELS = {
  "3-3": { label: "Estrelas", icon: Star, color: "bg-green-500", desc: "Alto desempenho e alto potencial" },
  "3-2": { label: "Talentos", icon: TrendingUp, color: "bg-green-400", desc: "Alto desempenho, potencial médio" },
  "3-1": { label: "Especialistas", icon: Target, color: "bg-yellow-400", desc: "Alto desempenho, baixo potencial" },
  "2-3": { label: "Promessas", icon: Zap, color: "bg-blue-400", desc: "Desempenho médio, alto potencial" },
  "2-2": { label: "Sólidos", icon: Users, color: "bg-gray-400", desc: "Desempenho e potencial médios" },
  "2-1": { label: "Eficazes", icon: Clock, color: "bg-gray-300", desc: "Desempenho médio, baixo potencial" },
  "1-3": { label: "Enigmas", icon: AlertCircle, color: "bg-orange-400", desc: "Baixo desempenho, alto potencial" },
  "1-2": { label: "Dilemmas", icon: AlertCircle, color: "bg-orange-300", desc: "Baixo desempenho, potencial médio" },
  "1-1": { label: "Críticos", icon: AlertCircle, color: "bg-red-500", desc: "Baixo desempenho e baixo potencial" },
};

export default function NineBox() {
  const { user } = useAuth();
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee9Box | null>(null);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [newPerformance, setNewPerformance] = useState(2);
  const [newPotential, setNewPotential] = useState(2);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  // Buscar ciclos de avaliação (mock - TODO: criar endpoint)
  const cycles = [{ id: 1, name: 'Ciclo 2025', year: 2025 }];
  const loadingCycles = false;

  // Buscar posições da matriz 9-box
  const { data: positions, isLoading: loadingPositions, refetch } = trpc.nineBox.list.useQuery(
    { cycleId: selectedCycle! },
    { enabled: !!selectedCycle }
  );

  // Mutation para ajustar posição
  const adjustMutation = trpc.nineBox.adjust.useMutation({
    onSuccess: () => {
      toast.success("Posição ajustada com sucesso!");
      refetch();
      setIsAdjustDialogOpen(false);
      setSelectedEmployee(null);
      setAdjustmentReason("");
    },
    onError: (error) => {
      toast.error(`Erro ao ajustar posição: ${error.message}`);
    },
  });

  const handleEmployeeClick = (emp: Employee9Box) => {
    setSelectedEmployee(emp);
    setNewPerformance(emp.performance);
    setNewPotential(emp.potential);
    setIsAdjustDialogOpen(true);
  };

  const handleAdjust = () => {
    if (!selectedEmployee || !selectedCycle) return;

    adjustMutation.mutate({
      cycleId: selectedCycle,
      employeeId: selectedEmployee.id,
      performance: newPerformance,
      potential: newPotential,
      reason: adjustmentReason,
    });
  };

  // Agrupar colaboradores por quadrante
  const groupedEmployees: Record<string, Employee9Box[]> = {};
  positions?.forEach((pos) => {
    const key = `${pos.performance}-${pos.potential}`;
    if (!groupedEmployees[key]) groupedEmployees[key] = [];
    groupedEmployees[key].push({
      id: pos.employeeId,
      name: pos.employeeName || "Sem nome",
      position: pos.positionName || "Sem cargo",
      department: pos.departmentName || "Sem departamento",
      performance: pos.performance,
      potential: pos.potential,
      category: QUADRANT_LABELS[key as keyof typeof QUADRANT_LABELS]?.label || "Indefinido",
      lastCalibration: pos.calibratedAt?.toLocaleDateString("pt-BR"),
    });
  });

  if (loadingCycles) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Grid3x3 className="h-8 w-8" />
              Matriz 9-Box
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualização gráfica de desempenho × potencial
            </p>
          </div>
        </div>

        {/* Seleção de Ciclo */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Ciclo de Avaliação</CardTitle>
            <CardDescription>Escolha o ciclo para visualizar a matriz</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCycle?.toString()}
              onValueChange={(value) => setSelectedCycle(parseInt(value))}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Selecione um ciclo" />
              </SelectTrigger>
              <SelectContent>
                {cycles?.map((cycle: any) => (
                  <SelectItem key={cycle.id} value={cycle.id.toString()}>
                    {cycle.name} ({cycle.year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Matriz 9-Box */}
        {selectedCycle && (
          <Card>
            <CardHeader>
              <CardTitle>Matriz 9-Box - Desempenho × Potencial</CardTitle>
              <CardDescription>
                Clique em um colaborador para ajustar sua posição (apenas RH e Diretoria)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPositions ? (
                <div className="flex items-center justify-center h-96">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Legenda */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Eixo Y:</span> Potencial (1=Baixo, 2=Médio, 3=Alto)
                    <span className="mx-4">|</span>
                    <span className="font-semibold">Eixo X:</span> Desempenho (1=Baixo, 2=Médio, 3=Alto)
                  </div>

                  {/* Grid 3x3 */}
                  <div className="grid grid-cols-3 gap-2 border rounded-lg p-4 bg-muted/20">
                    {/* Linha 3 (Alto Potencial) */}
                    {[3, 2, 1].map((perf) => {
                      const key = `${perf}-3`;
                      const quadrant = QUADRANT_LABELS[key as keyof typeof QUADRANT_LABELS];
                      const employees = groupedEmployees[key] || [];
                      const Icon = quadrant?.icon || Users;

                      return (
                        <div
                          key={key}
                          className={`${quadrant?.color} bg-opacity-10 border-2 border-opacity-30 rounded-lg p-4 min-h-[180px] hover:bg-opacity-20 transition-all`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-5 h-5" />
                            <div>
                              <h3 className="font-bold text-sm">{quadrant?.label}</h3>
                              <p className="text-xs text-muted-foreground">{quadrant?.desc}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {employees.map((emp, idx) => (
                              <button
                                key={`${key}-emp-${emp.id}-${idx}`}
                                onClick={() => handleEmployeeClick(emp)}
                                className="w-full text-left p-2 bg-background rounded border hover:border-primary hover:shadow-sm transition-all text-xs"
                              >
                                <div className="font-semibold truncate">{emp.name}</div>
                                <div className="text-muted-foreground truncate">{emp.position}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Linha 2 (Médio Potencial) */}
                    {[3, 2, 1].map((perf) => {
                      const key = `${perf}-2`;
                      const quadrant = QUADRANT_LABELS[key as keyof typeof QUADRANT_LABELS];
                      const employees = groupedEmployees[key] || [];
                      const Icon = quadrant?.icon || Users;

                      return (
                        <div
                          key={key}
                          className={`${quadrant?.color} bg-opacity-10 border-2 border-opacity-30 rounded-lg p-4 min-h-[180px] hover:bg-opacity-20 transition-all`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-5 h-5" />
                            <div>
                              <h3 className="font-bold text-sm">{quadrant?.label}</h3>
                              <p className="text-xs text-muted-foreground">{quadrant?.desc}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {employees.map((emp, idx) => (
                              <button
                                key={`${key}-emp-${emp.id}-${idx}`}
                                onClick={() => handleEmployeeClick(emp)}
                                className="w-full text-left p-2 bg-background rounded border hover:border-primary hover:shadow-sm transition-all text-xs"
                              >
                                <div className="font-semibold truncate">{emp.name}</div>
                                <div className="text-muted-foreground truncate">{emp.position}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Linha 1 (Baixo Potencial) */}
                    {[3, 2, 1].map((perf) => {
                      const key = `${perf}-1`;
                      const quadrant = QUADRANT_LABELS[key as keyof typeof QUADRANT_LABELS];
                      const employees = groupedEmployees[key] || [];
                      const Icon = quadrant?.icon || Users;

                      return (
                        <div
                          key={key}
                          className={`${quadrant?.color} bg-opacity-10 border-2 border-opacity-30 rounded-lg p-4 min-h-[180px] hover:bg-opacity-20 transition-all`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-5 h-5" />
                            <div>
                              <h3 className="font-bold text-sm">{quadrant?.label}</h3>
                              <p className="text-xs text-muted-foreground">{quadrant?.desc}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {employees.map((emp, idx) => (
                              <button
                                key={`${key}-emp-${emp.id}-${idx}`}
                                onClick={() => handleEmployeeClick(emp)}
                                className="w-full text-left p-2 bg-background rounded border hover:border-primary hover:shadow-sm transition-all text-xs"
                              >
                                <div className="font-semibold truncate">{emp.name}</div>
                                <div className="text-muted-foreground truncate">{emp.position}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{groupedEmployees["3-3"]?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Estrelas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{groupedEmployees["2-3"]?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Promessas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-500" />
                          <div>
                            <p className="text-2xl font-bold">{groupedEmployees["1-3"]?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Enigmas</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-2xl font-bold">{positions?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog de Ajuste */}
        <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Posição na Matriz 9-Box</DialogTitle>
              <DialogDescription>
                Colaborador: {selectedEmployee?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Desempenho</Label>
                <Select
                  value={newPerformance.toString()}
                  onValueChange={(value) => setNewPerformance(parseInt(value))}
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

              <div>
                <Label>Potencial</Label>
                <Select
                  value={newPotential.toString()}
                  onValueChange={(value) => setNewPotential(parseInt(value))}
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

              <div>
                <Label>Justificativa do Ajuste</Label>
                <Textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Explique o motivo do ajuste..."
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdjustDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdjust}
                disabled={!adjustmentReason.trim() || adjustMutation.isPending}
              >
                {adjustMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Ajuste
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
