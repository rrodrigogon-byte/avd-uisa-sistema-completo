import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Search, Filter, Eye, TrendingUp, Users, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

export default function DashboardTestes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [testTypeFilter, setTestTypeFilter] = useState<string>("todos");
  const [, setLocation] = useLocation();

  // Buscar testes pendentes
  const { data: pendingTests } = trpc.psychometricTests.listPendingValidation.useQuery({});

  // Buscar testes validados
  const { data: validatedTests } = trpc.psychometricTests.listValidatedTests.useQuery({});

  // Buscar estatísticas
  const { data: stats } = trpc.psychometricTests.getValidationStats.useQuery({});

  // Buscar estatísticas de conclusão
  const { data: completionStats } = trpc.psychometricTests.getCompletionStats.useQuery({});

  // Buscar resultados por tipo
  const { data: resultsByType } = trpc.psychometricTests.getResultsByType.useQuery({});

  const testTypeNames: Record<string, string> = {
    disc: "DISC",
    bigfive: "Big Five",
    mbti: "MBTI",
    ie: "Inteligência Emocional",
    vark: "VARK",
    leadership: "Liderança",
    careeranchors: "Âncoras de Carreira",
    pir: "PIR",
  };

  // Combinar todos os testes
  const allTests = [
    ...(pendingTests || []).map(t => ({ ...t, validationStatus: "pendente" as const })),
    ...(validatedTests || []),
  ];

  // Filtrar testes
  const filteredTests = allTests.filter((test) => {
    const matchesSearch =
      test.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.employeeEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "todos" || test.validationStatus === statusFilter;

    const matchesTestType =
      testTypeFilter === "todos" || test.testType === testTypeFilter;

    return matchesSearch && matchesStatus && matchesTestType;
  });

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard de Testes Psicométricos</h1>
          <p className="text-muted-foreground">
            Visão geral e gerenciamento de todos os testes psicométricos
          </p>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                Todos os testes realizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando validação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total ? `${Math.round(((stats.approved || 0) / stats.total) * 100)}%` : "0%"} do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {completionStats?.completionRate
                  ? `${Math.round(completionStats.completionRate)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">
                {completionStats?.completed || 0} de {completionStats?.total || 0} convites
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Estatísticas por Tipo de Teste */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Testes por Tipo</CardTitle>
            <CardDescription>Distribuição de testes psicométricos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {resultsByType && resultsByType.length > 0 ? (
                resultsByType.map((item) => (
                  <div key={item.testType} className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {testTypeNames[item.testType] || item.testType}
                      </span>
                      <span className="text-sm font-bold">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${stats?.total ? (item.count / stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-4">
                  Nenhum teste realizado ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtros e Busca */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Teste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="disc">DISC</SelectItem>
                  <SelectItem value="bigfive">Big Five</SelectItem>
                  <SelectItem value="mbti">MBTI</SelectItem>
                  <SelectItem value="ie">Inteligência Emocional</SelectItem>
                  <SelectItem value="vark">VARK</SelectItem>
                  <SelectItem value="leadership">Liderança</SelectItem>
                  <SelectItem value="careeranchors">Âncoras de Carreira</SelectItem>
                  <SelectItem value="pir">PIR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Testes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todos os Testes</CardTitle>
                <CardDescription>
                  {filteredTests.length} teste(s) encontrado(s)
                </CardDescription>
              </div>
              <Button onClick={() => setLocation("/validacao-testes")}>
                Ir para Validação
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tipo de Teste</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Data de Conclusão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">
                          {test.employeeName || "N/A"}
                        </TableCell>
                        <TableCell>{test.employeeEmail || "N/A"}</TableCell>
                        <TableCell>
                          {testTypeNames[test.testType] || test.testType}
                        </TableCell>
                        <TableCell>{test.profileType || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(test.completedAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              test.validationStatus === "pendente"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : test.validationStatus === "aprovado"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }
                          >
                            {test.validationStatus === "pendente" && (
                              <Clock className="h-3 w-3 mr-1" />
                            )}
                            {test.validationStatus === "aprovado" && (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            {test.validationStatus === "reprovado" && (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {test.validationStatus === "pendente"
                              ? "Pendente"
                              : test.validationStatus === "aprovado"
                              ? "Aprovado"
                              : "Reprovado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (test.employeeId) {
                                setLocation(`/desenvolvimento/funcionarios/${test.employeeId}`);
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum teste encontrado com os filtros aplicados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
