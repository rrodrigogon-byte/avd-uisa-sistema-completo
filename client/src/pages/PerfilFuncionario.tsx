import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Briefcase, Target, FileText, TrendingUp, Award } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Página de Perfil do Funcionário
 * Exibe informações completas: dados pessoais, avaliações, metas, PDI, Nine Box
 */

export default function PerfilFuncionario() {
  const params = useParams();
  const [, navigate] = useLocation();
  const employeeId = parseInt(params.id || "0");

  // Queries
  const { data: employee, isLoading: loadingEmployee } = trpc.employees.getById.useQuery({ id: employeeId });
  const { data: evaluations, isLoading: loadingEvaluations } = trpc.performance.listByEmployee.useQuery({ employeeId });
  const { data: goals, isLoading: loadingGoals } = trpc.goals.listByEmployee.useQuery({ employeeId });
  const { data: pdiPlans, isLoading: loadingPDI } = trpc.pdi.listByEmployee.useQuery({ employeeId });
  const { data: nineBoxData } = trpc.nineBox.getEmployeePosition.useQuery({ employeeId });

  if (loadingEmployee) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-gray-600">Funcionário não encontrado</p>
          <Button onClick={() => navigate("/nine-box")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Nine Box
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/nine-box")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Perfil do Funcionário</h1>
            <p className="text-gray-600 mt-1">Visão completa de performance e desenvolvimento</p>
          </div>
        </div>

        {/* Card de Informações Básicas */}
        <Card className="border-l-4 border-l-[#F39200]">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              {/* Foto */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F39200] to-[#d97f00] flex items-center justify-center text-white text-4xl font-bold">
                  {employee.name?.charAt(0) || "?"}
                </div>
              </div>

              {/* Informações */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
                  <p className="text-lg text-gray-600 mt-1">{employee.position?.title || "Cargo não definido"}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {employee.employeeCode}
                    </Badge>
                    <Badge variant="outline" className={
                      employee.status === "ativo" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"
                    }>
                      {employee.status || "Ativo"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {employee.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  {employee.department?.name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{employee.department.name}</span>
                    </div>
                  )}
                  {employee.hireDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Admissão: {new Date(employee.hireDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Nine Box Position */}
              {nineBoxData && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm text-gray-600 mb-2">Posição Nine Box</p>
                  <div className="inline-flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border-2 border-emerald-200">
                    <div className="text-3xl font-bold text-emerald-700">
                      {nineBoxData.performance}/{nineBoxData.potential}
                    </div>
                    <Badge className="bg-emerald-600 text-white">
                      {nineBoxData.category || "Alto Potencial"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="pdi">PDI</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card: Avaliações */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#F39200]" />
                    Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {evaluations?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Total de avaliações</p>
                </CardContent>
              </Card>

              {/* Card: Metas */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    Metas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {goals?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Metas ativas</p>
                </CardContent>
              </Card>

              {/* Card: PDI */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    PDI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {pdiPlans?.length || 0}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Planos de desenvolvimento</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Performance (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F39200]" />
                  Evolução de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Gráfico de evolução de performance será exibido aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Avaliações */}
          <TabsContent value="evaluations" className="space-y-4">
            {loadingEvaluations ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
              </div>
            ) : evaluations && evaluations.length > 0 ? (
              <div className="space-y-4">
                {evaluations.map((evaluation: any) => (
                  <Card key={evaluation.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{evaluation.cycle?.name || "Ciclo de Avaliação"}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Período: {evaluation.cycle?.startDate ? new Date(evaluation.cycle.startDate).toLocaleDateString('pt-BR') : "N/A"}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          evaluation.status === "concluida" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }>
                          {evaluation.status || "Em andamento"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Autoavaliação</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {evaluation.selfScore || "-"}/5
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Avaliação Gestor</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {evaluation.managerScore || "-"}/5
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Score Final</p>
                          <p className="text-2xl font-bold text-[#F39200]">
                            {evaluation.finalScore || "-"}/5
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma avaliação registrada</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Metas */}
          <TabsContent value="goals" className="space-y-4">
            {loadingGoals ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal: any) => (
                  <Card key={goal.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{goal.title || goal.specific}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                        </div>
                        <Badge variant="outline" className={
                          goal.status === "concluida" ? "bg-green-50 text-green-700 border-green-200" : 
                          goal.status === "em_andamento" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }>
                          {goal.status || "Pendente"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progresso</span>
                            <span className="font-semibold">{goal.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#F39200] h-2 rounded-full transition-all"
                              style={{ width: `${goal.progress || 0}%` }}
                            />
                          </div>
                        </div>
                        {goal.deadline && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Nenhuma meta registrada</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: PDI */}
          <TabsContent value="pdi" className="space-y-4">
            {loadingPDI ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
              </div>
            ) : pdiPlans && pdiPlans.length > 0 ? (
              <div className="space-y-4">
                {pdiPlans.map((pdi: any) => (
                  <Card key={pdi.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Plano de Desenvolvimento Individual</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Criado em: {pdi.createdAt ? new Date(pdi.createdAt).toLocaleDateString('pt-BR') : "N/A"}
                          </p>
                        </div>
                        <Badge variant="outline" className={
                          pdi.status === "concluido" ? "bg-green-50 text-green-700 border-green-200" : 
                          pdi.status === "em_andamento" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-gray-50 text-gray-700 border-gray-200"
                        }>
                          {pdi.status || "Ativo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pdi.developmentGoals && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700">Objetivos de Desenvolvimento:</p>
                            <p className="text-sm text-gray-600">{pdi.developmentGoals}</p>
                          </div>
                        )}
                        {pdi.actions && pdi.actions.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Ações:</p>
                            <ul className="space-y-1">
                              {pdi.actions.map((action: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                  <span className="text-[#F39200]">•</span>
                                  <span>{action.description || action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum PDI registrado</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history" className="space-y-4">
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p>Histórico completo será exibido aqui</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
