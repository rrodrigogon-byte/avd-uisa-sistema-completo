import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { FileDown, TrendingUp, Target, AlertTriangle, Loader2, BarChart3 } from "lucide-react";
import { exportPDIReportPDF } from "@/lib/pdfExport";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Relatórios Consolidados de PDI
 * 
 * Exibe evolução de:
 * - Gaps de competências ao longo do tempo
 * - Progresso das ações 70-20-10
 * - Status dos riscos identificados
 */

export default function RelatoriosPDI() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>(undefined);
  const [selectedPlan, setSelectedPlan] = useState<number | undefined>(undefined);

  // Buscar funcionários
  const { data: employees } = trpc.employees.list.useQuery({});

  // Buscar PDIs do funcionário selecionado
  const { data: pdiPlans } = trpc.pdiIntelligent.list.useQuery(
    { employeeId: selectedEmployee },
    { enabled: !!selectedEmployee }
  );

  // Buscar detalhes do PDI selecionado
  const { data: pdiDetails, isLoading } = trpc.pdiIntelligent.getById.useQuery(
    { id: selectedPlan! },
    { enabled: !!selectedPlan }
  );

  // Dados para gráfico de evolução de gaps
  const gapsChartData = {
    labels: pdiDetails?.gaps?.map((g: any) => g.competencyName || `Competência ${g.competencyId}`) || [],
    datasets: [
      {
        label: "Nível Atual",
        data: pdiDetails?.gaps?.map((g: any) => g.currentLevel) || [],
        backgroundColor: "rgba(239, 68, 68, 0.5)",
        borderColor: "rgba(239, 68, 68, 1)",
        borderWidth: 2,
      },
      {
        label: "Nível Alvo",
        data: pdiDetails?.gaps?.map((g: any) => g.targetLevel) || [],
        backgroundColor: "rgba(34, 197, 94, 0.5)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de ações 70-20-10 (simulado - você pode buscar do banco)
  const actionsChartData = {
    labels: ["Experiência (70%)", "Exposição (20%)", "Educação (10%)"],
    datasets: [
      {
        label: "Ações Concluídas",
        data: [12, 5, 3], // Substituir por dados reais
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(168, 85, 247, 0.7)",
          "rgba(236, 72, 153, 0.7)",
        ],
        borderColor: [
          "rgba(59, 130, 246, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(236, 72, 153, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Dados para gráfico de riscos
  const risksChartData = {
    labels: pdiDetails?.risks?.map((r: any) => r.type) || [],
    datasets: [
      {
        label: "Status dos Riscos",
        data: pdiDetails?.risks?.map((r: any) => {
          if (r.status === "identificado") return 1;
          if (r.status === "mitigado") return 2;
          if (r.status === "resolvido") return 3;
          return 0;
        }) || [],
        backgroundColor: [
          "rgba(239, 68, 68, 0.7)",
          "rgba(251, 191, 36, 0.7)",
          "rgba(34, 197, 94, 0.7)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const handleExportPDF = async () => {
    if (!pdiDetails || !selectedPlan) {
      toast.error("Selecione um PDI para exportar");
      return;
    }

    try {
      // Preparar dados para exportação
      const exportData = {
        employeeName: pdiDetails.employeeName || 'N/A',
        pdiId: selectedPlan,
        gaps: pdiDetails.gaps || [],
        actions: pdiDetails.actions || [],
        revisions: pdiDetails.revisions || [],
        risks: pdiDetails.risks || [],
        stats: {
          totalGaps: pdiDetails.gaps?.length || 0,
          averageProgress: pdiDetails.overallProgress || 0,
          totalActions: pdiDetails.actions?.length || 0,
          completedActions: pdiDetails.actions?.filter((a: any) => a.status === 'completed').length || 0,
        },
      };

      await exportPDIReportPDF(exportData);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error("Erro ao exportar PDF. Tente novamente.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Relatórios Consolidados de PDI</h1>
            <p className="text-muted-foreground mt-2">
              Evolução de gaps, ações 70-20-10 e status de riscos
            </p>
          </div>
          <Button onClick={handleExportPDF} disabled={!selectedPlan}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o funcionário e o PDI para visualizar os relatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Funcionário</label>
                <Select
                  value={selectedEmployee?.toString()}
                  onValueChange={(value) => {
                    setSelectedEmployee(parseInt(value));
                    setSelectedPlan(undefined);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">PDI</label>
                <Select
                  value={selectedPlan?.toString()}
                  onValueChange={(value) => setSelectedPlan(parseInt(value))}
                  disabled={!selectedEmployee}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um PDI" />
                  </SelectTrigger>
                  <SelectContent>
                    {pdiPlans?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.targetPositionTitle || `PDI #${plan.id}`} - {plan.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !selectedPlan ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Selecione um PDI para visualizar os relatórios</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Estatísticas Gerais */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gaps Identificados</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pdiDetails?.gaps?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Competências a desenvolver</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pdiDetails?.pdiPlans?.overallProgress || 0}%</div>
                  <p className="text-xs text-muted-foreground">Do plano concluído</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ações Totais</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">20</div>
                  <p className="text-xs text-muted-foreground">70-20-10 planejadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Riscos Ativos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pdiDetails?.risks?.filter((r: any) => r.status === "identificado").length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Requerem atenção</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Evolução de Gaps */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Gaps de Competências</CardTitle>
                <CardDescription>
                  Comparação entre nível atual e nível alvo por competência
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdiDetails?.gaps && pdiDetails.gaps.length > 0 ? (
                  <div className="h-[400px]">
                    <Bar
                      data={gapsChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "top" as const,
                          },
                          title: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 5,
                            ticks: {
                              stepSize: 1,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum gap identificado neste PDI
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Ações 70-20-10 */}
            <Card>
              <CardHeader>
                <CardTitle>Progresso das Ações 70-20-10</CardTitle>
                <CardDescription>
                  Distribuição e conclusão das ações de desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center">
                  <div className="w-full max-w-md">
                    <Doughnut
                      data={actionsChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom" as const,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Status de Riscos */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Riscos ao Longo do Tempo</CardTitle>
                <CardDescription>
                  Evolução dos riscos identificados no PDI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdiDetails?.risks && pdiDetails.risks.length > 0 ? (
                  <div className="h-[400px]">
                    <Bar
                      data={risksChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 3,
                            ticks: {
                              stepSize: 1,
                              callback: function(value) {
                                const labels = ["", "Identificado", "Mitigado", "Resolvido"];
                                return labels[value as number];
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum risco identificado neste PDI
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabela de Histórico de Alterações */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Revisões</CardTitle>
                <CardDescription>
                  Acompanhamento das revisões e feedback recebidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pdiDetails?.reviews && pdiDetails.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {pdiDetails.reviews.map((review: any) => (
                      <div key={review.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{review.reviewerName}</p>
                            <p className="text-sm text-muted-foreground">{review.reviewerRole}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(review.reviewDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><strong>Progresso:</strong> {review.overallProgress}%</p>
                          <p><strong>Pontos Fortes:</strong> {review.strengths}</p>
                          <p><strong>Melhorias:</strong> {review.improvements}</p>
                          <p><strong>Próximos Passos:</strong> {review.nextSteps}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma revisão registrada ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
