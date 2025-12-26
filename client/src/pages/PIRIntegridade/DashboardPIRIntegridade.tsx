import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardList, FileText, Loader2, Plus, Settings, Shield, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function DashboardPIRIntegridade() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: stats } = trpc.pirIntegrity.getDashboardStats.useQuery(undefined);
  const { data: assessmentsData, isLoading: loadingAssessments } = trpc.pirIntegrity.listAssessments.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    limit: 10,
  });
  const { data: dimensionsData } = trpc.pirIntegrity.listDimensions.useQuery(undefined);

  const getRiskBadge = (level: string | null) => {
    switch (level) {
      case "low": return <Badge className="bg-green-100 text-green-700">Baixo</Badge>;
      case "moderate": return <Badge className="bg-yellow-100 text-yellow-700">Moderado</Badge>;
      case "high": return <Badge className="bg-orange-100 text-orange-700">Alto</Badge>;
      case "critical": return <Badge className="bg-red-100 text-red-700">Crítico</Badge>;
      default: return <Badge variant="outline">-</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="outline">Rascunho</Badge>;
      case "in_progress": return <Badge className="bg-blue-100 text-blue-700">Em Andamento</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-700">Concluída</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              PIR Integridade
            </h1>
            <p className="text-gray-500 mt-1">Sistema de Avaliação de Integridade Ética</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/pir-integridade/questoes")}>
              <Settings className="h-4 w-4 mr-2" />
              Gestão de Questões
            </Button>
            <Button onClick={() => toast.info("Selecione um colaborador para iniciar")}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Avaliação
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total</CardTitle>
              <ClipboardList className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats?.total || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Concluídas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Em Andamento</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Score Médio</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-purple-600">{stats?.avgScore || 0}/100</div></CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>6 Dimensões de Integridade</CardTitle>
            <CardDescription>Baseado na teoria de Kohlberg</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {safeMap(dimensionsData?.dimensions, (dim) => (
                <div key={dim.id} className="p-4 border rounded-lg text-center">
                  <div className="font-semibold text-blue-600">{dim.code}</div>
                  <div className="text-sm text-gray-600">{dim.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Avaliações Recentes</CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingAssessments ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-6 w-12" />
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isEmpty(assessmentsData?.assessments) ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma avaliação encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {safeMap(assessmentsData?.assessments, (a) => (
                  <div key={a.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => a.status === "completed" ? navigate(`/pir-integridade/resultado/${a.id}`) : navigate(`/pir-integridade/teste/${a.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{a.employee?.name || "Colaborador"}</p>
                        <p className="text-sm text-gray-500">{a.assessmentType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {a.overallScore !== null && <span className="font-semibold">{a.overallScore}/100</span>}
                      {getRiskBadge(a.riskLevel)}
                      {getStatusBadge(a.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
