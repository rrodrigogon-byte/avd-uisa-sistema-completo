import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { ArrowLeft, Download, Edit, FileText, Calendar, User, Target, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { exportPDIToPDF } from "@/lib/pdiPdfExport";

/**
 * Página de Visualização Profissional do PDI
 * Replica o design dos PDIs HTML com layout moderno e responsivo
 */

export default function PDIVisualizar() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const pdiId = parseInt(id || "0");

  const { data: pdi, isLoading } = trpc.pdi.getById.useQuery({ id: pdiId });

  const handleExportPDF = async () => {
    if (!pdi) {
      toast.error("N\u00e3o h\u00e1 dados para exportar");
      return;
    }

    try {
      toast.info("Gerando PDF...");
      await exportPDIToPDF(pdi);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho", className: "bg-gray-100 text-gray-800" },
      pendente_aprovacao: { variant: "default", label: "Pendente Aprovação", className: "bg-yellow-100 text-yellow-800" },
      aprovado: { variant: "default", label: "Aprovado", className: "bg-green-100 text-green-800" },
      em_andamento: { variant: "default", label: "Em Andamento", className: "bg-blue-100 text-blue-800" },
      concluido: { variant: "default", label: "Concluído", className: "bg-purple-100 text-purple-800" },
      cancelado: { variant: "destructive", label: "Cancelado", className: "bg-red-100 text-red-800" },
    };

    const config = variants[status] || { variant: "secondary", label: status, className: "bg-gray-100 text-gray-800" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pdi) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">PDI não encontrado</p>
              <Button onClick={() => navigate("/pdi")} className="mt-4">
                Voltar para lista
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/pdi")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Plano de Desenvolvimento Individual
                </h1>
                <p className="text-gray-600 mt-1">
                  {pdi.employee?.name || "Colaborador"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/pdi/editar/${pdiId}`)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
              <Button
                onClick={handleExportPDF}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {/* Informações do Funcionário */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Informações do Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nome</p>
                  <p className="font-semibold">{pdi.employee?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cargo Atual</p>
                  <p className="font-semibold">{pdi.employee?.cargo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  {getStatusBadge(pdi.plan.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Progresso Geral</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${pdi.plan.overallProgress || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{pdi.plan.overallProgress || 0}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          {pdi.kpis && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Indicadores de Performance (KPIs)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {pdi.kpis.currentPosition && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Posição Atual</p>
                      <p className="text-2xl font-bold text-blue-700">{pdi.kpis.currentPosition}</p>
                    </div>
                  )}
                  {pdi.kpis.reframing && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Reenquadramento</p>
                      <p className="text-2xl font-bold text-green-700">{pdi.kpis.reframing}</p>
                    </div>
                  )}
                  {pdi.kpis.newPosition && (
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Nova Posição</p>
                      <p className="text-2xl font-bold text-purple-700">{pdi.kpis.newPosition}</p>
                    </div>
                  )}
                  {pdi.kpis.performancePlanMonths && (
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Plano de Performance</p>
                      <p className="text-2xl font-bold text-orange-700">{pdi.kpis.performancePlanMonths} meses</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráfico de Competências */}
          {pdi.competencies && pdi.competencies.length > 0 && (
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Mapa de Competências e Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico Radar */}
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={pdi.competencies.map((comp: any) => ({
                        competency: comp.competency.length > 20 ? comp.competency.substring(0, 20) + '...' : comp.competency,
                        'Nível Atual': comp.currentLevel,
                        'Nível Alvo': comp.targetLevel,
                      }))}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis 
                          dataKey="competency" 
                          tick={{ fill: '#6b7280', fontSize: 11 }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 5]}
                          tick={{ fill: '#6b7280' }}
                        />
                        <Radar
                          name="Nível Atual"
                          dataKey="Nível Atual"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.3}
                        />
                        <Radar
                          name="Nível Alvo"
                          dataKey="Nível Alvo"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.3}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px'
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Tabela de Competências */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-3 text-left text-sm font-semibold">Competência</th>
                          <th className="border p-3 text-center text-sm font-semibold">Atual</th>
                          <th className="border p-3 text-center text-sm font-semibold">Alvo</th>
                          <th className="border p-3 text-center text-sm font-semibold">Gap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdi.competencies.map((comp: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border p-3 text-sm">{comp.competency}</td>
                            <td className="border p-3 text-center text-sm">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold">
                                {comp.currentLevel}
                              </span>
                            </td>
                            <td className="border p-3 text-center text-sm">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold">
                                {comp.targetLevel}
                              </span>
                            </td>
                            <td className="border p-3 text-center text-sm">
                              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                                comp.gap > 2 ? 'bg-red-100 text-red-700' :
                                comp.gap > 1 ? 'bg-orange-100 text-orange-700' :
                                comp.gap > 0 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {comp.gap}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Legenda de Gaps */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Legenda de Gaps:</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-700"></span>
                      <span className="text-gray-600">Gap Alto (3+): Prioridade Máxima</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-orange-100 border-2 border-orange-700"></span>
                      <span className="text-gray-600">Gap Médio (2): Prioridade Alta</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-yellow-100 border-2 border-yellow-700"></span>
                      <span className="text-gray-600">Gap Baixo (1): Prioridade Média</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-gray-100 border-2 border-gray-700"></span>
                      <span className="text-gray-600">Sem Gap (0): Mantido</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plano de Ação 70-20-10 */}
          {pdi.actionPlan && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Plano de Ação 70-20-10
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 70% - Prática */}
                {pdi.actionPlan.practice70Items && pdi.actionPlan.practice70Items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-purple-700 mb-3">
                      {pdi.actionPlan.practice70Title}
                    </h3>
                    <ul className="space-y-2">
                      {pdi.actionPlan.practice70Items.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 20% - Social */}
                {pdi.actionPlan.social20Items && pdi.actionPlan.social20Items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-700 mb-3">
                      {pdi.actionPlan.social20Title}
                    </h3>
                    <ul className="space-y-2">
                      {pdi.actionPlan.social20Items.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 10% - Formal */}
                {pdi.actionPlan.formal10Items && pdi.actionPlan.formal10Items.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">
                      {pdi.actionPlan.formal10Title}
                    </h3>
                    <ul className="space-y-2">
                      {pdi.actionPlan.formal10Items.map((item: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estratégia de Remuneração */}
          {pdi.remunerationStrategy && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  {pdi.remunerationStrategy.title || "Estratégia de Remuneração"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pdi.remunerationStrategy.description && (
                  <p className="text-gray-700 mb-4">{pdi.remunerationStrategy.description}</p>
                )}
                {pdi.remunerationStrategy.midpoint && (
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>Ponto Médio:</strong> {pdi.remunerationStrategy.midpoint}
                  </p>
                )}

                {pdi.remunerationMovements && pdi.remunerationMovements.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-3 text-left text-sm font-semibold">Nível</th>
                          <th className="border p-3 text-left text-sm font-semibold">Prazo</th>
                          <th className="border p-3 text-left text-sm font-semibold">Gatilho/Meta</th>
                          <th className="border p-3 text-left text-sm font-semibold">Mecanismo</th>
                          <th className="border p-3 text-left text-sm font-semibold">Salário Projetado</th>
                          <th className="border p-3 text-left text-sm font-semibold">Posição na Faixa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pdi.remunerationMovements.map((movement: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border p-3 text-sm">{movement.level}</td>
                            <td className="border p-3 text-sm">{movement.deadline}</td>
                            <td className="border p-3 text-sm">{movement.trigger}</td>
                            <td className="border p-3 text-sm">{movement.mechanism}</td>
                            <td className="border p-3 text-sm font-semibold">{movement.projectedSalary}</td>
                            <td className="border p-3 text-sm">{movement.positionInRange}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {pdi.timeline && pdi.timeline.length > 0 && (
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                  Timeline de Acompanhamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pdi.timeline.map((milestone: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          milestone.status === "concluido" ? "bg-green-500" :
                          milestone.status === "em_andamento" ? "bg-blue-500" :
                          milestone.status === "atrasado" ? "bg-red-500" :
                          "bg-gray-300"
                        }`} />
                        {index < pdi.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                            {milestone.description && (
                              <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(milestone.targetDate), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              {milestone.completedDate && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Concluído em {format(new Date(milestone.completedDate), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={
                            milestone.status === "concluido" ? "bg-green-100 text-green-800" :
                            milestone.status === "em_andamento" ? "bg-blue-100 text-blue-800" :
                            milestone.status === "atrasado" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {milestone.status === "concluido" ? "Concluído" :
                             milestone.status === "em_andamento" ? "Em Andamento" :
                             milestone.status === "atrasado" ? "Atrasado" :
                             "Pendente"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assinaturas */}
          {pdi.signatures && (
            <Card className="border-l-4 border-l-gray-500">
              <CardHeader>
                <CardTitle>Assinaturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pdi.signatures.employeeName && (
                    <div className="border-t-2 pt-4">
                      <p className="font-semibold">{pdi.signatures.employeeName}</p>
                      <p className="text-sm text-gray-600">Colaborador</p>
                      {pdi.signatures.employeeSignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assinado em {format(new Date(pdi.signatures.employeeSignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}
                  {pdi.signatures.sponsorName && (
                    <div className="border-t-2 pt-4">
                      <p className="font-semibold">{pdi.signatures.sponsorName}</p>
                      <p className="text-sm text-gray-600">Sponsor</p>
                      {pdi.signatures.sponsorSignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assinado em {format(new Date(pdi.signatures.sponsorSignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}
                  {pdi.signatures.mentorName && (
                    <div className="border-t-2 pt-4">
                      <p className="font-semibold">{pdi.signatures.mentorName}</p>
                      <p className="text-sm text-gray-600">Mentor</p>
                      {pdi.signatures.mentorSignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assinado em {format(new Date(pdi.signatures.mentorSignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}
                  {pdi.signatures.dhoName && (
                    <div className="border-t-2 pt-4">
                      <p className="font-semibold">{pdi.signatures.dhoName}</p>
                      <p className="text-sm text-gray-600">DHO (Guardião)</p>
                      {pdi.signatures.dhoSignedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assinado em {format(new Date(pdi.signatures.dhoSignedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
