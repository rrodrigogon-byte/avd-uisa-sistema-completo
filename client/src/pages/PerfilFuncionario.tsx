import { useState } from "react";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Briefcase, Target, FileText, TrendingUp, Award, Pencil, Paperclip } from "lucide-react";
import { trpc } from "@/lib/trpc";
import TestesResultados from "@/components/TestesResultados";
import HistoricoFuncionario from "@/components/HistoricoFuncionario";
import EditPersonalInfoDialog from "@/components/EditPersonalInfoDialog";
import CompetenciesManager from "@/components/CompetenciesManager";
import GoalsManager from "@/components/GoalsManager";
import EvaluationsTab from "@/components/EvaluationsTab";
import AnexosFuncionario from "@/components/AnexosFuncionario";

/**
 * Página de Perfil do Funcionário - Versão Completa com CRUD
 * Todas as abas permitem edição, inclusão, modificação e exclusão
 */

export default function PerfilFuncionario() {
  const params = useParams();
  const [, navigate] = useLocation();
  const employeeId = parseInt(params.id || "0");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Queries
  const { data: employee, isLoading: loadingEmployee, refetch: refetchEmployee } = trpc.employees.getById.useQuery({ id: employeeId });
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
          <Button onClick={() => navigate("/funcionarios")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Adaptar estrutura de dados - a procedure retorna dados em formato plano
  const employeeName = employee?.name || "Nome não disponível";
  const employeeCode = employee?.employeeCode || "N/A";
  const employeeEmail = employee?.email;
  const employeePhone = (employee as any)?.phone;
  const employeeStatus = employee?.status || "ativo";
  const employeeHireDate = employee?.hireDate;
  const departmentName = employee?.departmentName;
  const positionTitle = employee?.positionTitle || "Cargo não definido";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate("/funcionarios")}>
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
                  {employeeName?.charAt(0) || "?"}
                </div>
              </div>

              {/* Informações */}
              <div className="flex-1 grid grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-gray-900">{employeeName}</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditDialogOpen(true)}
                      className="text-[#F39200] hover:text-[#d97f00]"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-lg text-gray-600 mt-1">{positionTitle}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {employeeCode}
                    </Badge>
                    <Badge variant="outline" className={
                      employeeStatus === "ativo" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"
                    }>
                      {employeeStatus}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {employeeEmail && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{employeeEmail}</span>
                    </div>
                  )}
                  {employeePhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{employeePhone}</span>
                    </div>
                  )}
                  {departmentName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>{departmentName}</span>
                    </div>
                  )}
                  {employeeHireDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Admissão: {new Date(employeeHireDate).toLocaleDateString('pt-BR')}</span>
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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="competencies">Competências</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
            <TabsTrigger value="tests">Testes</TabsTrigger>
            <TabsTrigger value="attachments">
              <Paperclip className="w-4 h-4 mr-2" />
              Anexos
            </TabsTrigger>
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

          {/* Tab: Competências */}
          <TabsContent value="competencies" className="space-y-4">
            <CompetenciesManager employeeId={employeeId} />
          </TabsContent>

          {/* Tab: Metas */}
          <TabsContent value="goals" className="space-y-4">
            <GoalsManager employeeId={employeeId} goals={goals || []} isLoading={loadingGoals} />
          </TabsContent>

          {/* Tab: Avaliações */}
          <TabsContent value="evaluations" className="space-y-4">
            <EvaluationsTab employeeId={employeeId} />
          </TabsContent>

          {/* Tab: Testes Psicométricos */}
          <TabsContent value="tests" className="space-y-4">
            <TestesResultados employeeId={employeeId} />
          </TabsContent>

          {/* Tab: Anexos */}
          <TabsContent value="attachments" className="space-y-4">
            <AnexosFuncionario employeeId={employeeId} />
          </TabsContent>

          {/* Tab: Histórico */}
          <TabsContent value="history" className="space-y-4">
            <HistoricoFuncionario employeeId={employeeId} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Edição de Dados Pessoais */}
      {employee && (
        <EditPersonalInfoDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          employee={{
            id: employee.id,
            name: employeeName,
            email: employeeEmail,
            phone: employeePhone,
            departmentId: employee.departmentId,
            positionId: employee.positionId,
            hireDate: employeeHireDate,
          }}
          onSuccess={() => refetchEmployee()}
        />
      )}
    </DashboardLayout>
  );
}
