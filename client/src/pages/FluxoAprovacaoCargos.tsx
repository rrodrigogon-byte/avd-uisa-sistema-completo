import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRight, 
  FileText, 
  Users, 
  Building2,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  GitBranch,
  Workflow,
  UserCheck,
  Shield,
  FileCheck
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";

/**
 * Página de Demonstração: Fluxo Completo de Aprovação de Descrições de Cargos UISA
 * 
 * Demonstra:
 * 1. Fluxo de aprovação multinível (4 níveis)
 * 2. Carga de dados (funcionários, hierarquias, departamentos)
 * 3. Visualização de status e métricas
 * 4. Integração com sistema AVD
 */
export default function FluxoAprovacaoCargos() {
  const [selectedTab, setSelectedTab] = useState("fluxo");

  // Dados de exemplo do fluxo de aprovação
  const approvalLevels = [
    {
      level: 1,
      name: "Ocupante do Cargo",
      approver: "João Silva",
      status: "approved",
      date: "2025-12-20 10:30",
      comments: "Descrição revisada e aprovada. Todas as responsabilidades estão corretas.",
    },
    {
      level: 2,
      name: "Gestor Direto",
      approver: "Maria Santos",
      status: "approved",
      date: "2025-12-21 14:15",
      comments: "Aprovado. Competências alinhadas com as necessidades da equipe.",
    },
    {
      level: 3,
      name: "RH - Cargos e Salários",
      approver: "Alexsandra Oliveira",
      status: "pending",
      date: null,
      comments: null,
    },
    {
      level: 4,
      name: "Diretoria",
      approver: "Rodrigo Ribeiro Gonçalves",
      status: "pending",
      date: null,
      comments: null,
    },
  ];

  // Dados de exemplo de carga de dados
  const dataImports = [
    {
      type: "Funcionários",
      total: 1250,
      imported: 1250,
      errors: 0,
      status: "completed",
      date: "2025-12-15 09:00",
      icon: Users,
    },
    {
      type: "Hierarquias",
      total: 850,
      imported: 850,
      errors: 0,
      status: "completed",
      date: "2025-12-15 09:30",
      icon: GitBranch,
    },
    {
      type: "Departamentos",
      total: 45,
      imported: 45,
      errors: 0,
      status: "completed",
      date: "2025-12-15 08:45",
      icon: Building2,
    },
    {
      type: "Descrições de Cargos",
      total: 120,
      imported: 98,
      errors: 2,
      status: "in_progress",
      date: "2025-12-25 12:00",
      icon: FileText,
    },
  ];

  // Métricas gerais
  const metrics = {
    totalDescriptions: 120,
    approved: 65,
    pending: 43,
    rejected: 12,
    avgApprovalTime: "3.5 dias",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20"><Clock className="h-3 w-3 mr-1" />Em Progresso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Sistema de Descrições de Cargos UISA
          </h1>
          <p className="text-muted-foreground text-lg">
            Gestão completa de descrições de cargos, aprovações e carga de dados
          </p>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Descrições</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.totalDescriptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aprovadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{metrics.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.avgApprovalTime}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fluxo" className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              Fluxo de Aprovação
            </TabsTrigger>
            <TabsTrigger value="carga" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Carga de Dados
            </TabsTrigger>
            <TabsTrigger value="hierarquia" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Hierarquia
            </TabsTrigger>
            <TabsTrigger value="integracao" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Integração AVD
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Fluxo de Aprovação */}
          <TabsContent value="fluxo" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Fluxo de Aprovação - 4 Níveis
                </CardTitle>
                <CardDescription>
                  Exemplo: Descrição de Cargo "Analista de Planejamento e Custos"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progresso Geral */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progresso da Aprovação</span>
                    <span className="text-muted-foreground">50% (2 de 4 níveis)</span>
                  </div>
                  <Progress value={50} className="h-2" />
                </div>

                <Separator />

                {/* Níveis de Aprovação */}
                <div className="space-y-4">
                  {approvalLevels.map((level, index) => (
                    <div key={level.level} className="relative">
                      {/* Linha conectora */}
                      {index < approvalLevels.length - 1 && (
                        <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-border" />
                      )}

                      <div className="flex gap-4">
                        {/* Ícone de Status */}
                        <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          level.status === "approved" 
                            ? "bg-green-500/10 border-green-500" 
                            : level.status === "pending"
                            ? "bg-yellow-500/10 border-yellow-500"
                            : "bg-gray-500/10 border-gray-300"
                        }`}>
                          {level.status === "approved" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : level.status === "pending" ? (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                          )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 pb-8">
                          <Card className={level.status === "pending" ? "border-yellow-500/30" : ""}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">
                                    Nível {level.level}: {level.name}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    Aprovador: {level.approver}
                                  </CardDescription>
                                </div>
                                {getStatusBadge(level.status)}
                              </div>
                            </CardHeader>
                            {level.date && (
                              <CardContent className="space-y-2">
                                <div className="text-sm text-muted-foreground">
                                  {level.date}
                                </div>
                                {level.comments && (
                                  <div className="text-sm bg-muted/50 p-3 rounded-md">
                                    <p className="font-medium mb-1">Comentários:</p>
                                    <p className="text-muted-foreground">{level.comments}</p>
                                  </div>
                                )}
                              </CardContent>
                            )}
                            {level.status === "pending" && (
                              <CardContent>
                                <div className="flex gap-2">
                                  <Button size="sm" className="flex-1">
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Aprovar
                                  </Button>
                                  <Button size="sm" variant="outline" className="flex-1">
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Ações */}
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Descrição Completa
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Estatísticas de Aprovação */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aprovações por Nível</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 1 - Ocupante</span>
                    <Badge variant="outline">98% aprovação</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 2 - Gestor</span>
                    <Badge variant="outline">95% aprovação</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 3 - RH C&amp;S</span>
                    <Badge variant="outline">88% aprovação</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 4 - Diretoria</span>
                    <Badge variant="outline">92% aprovação</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tempo Médio por Nível</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 1 - Ocupante</span>
                    <Badge variant="outline">1.2 dias</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 2 - Gestor</span>
                    <Badge variant="outline">1.8 dias</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 3 - RH C&amp;S</span>
                    <Badge variant="outline">2.5 dias</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Nível 4 - Diretoria</span>
                    <Badge variant="outline">3.0 dias</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 2: Carga de Dados */}
          <TabsContent value="carga" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Status de Importações
                </CardTitle>
                <CardDescription>
                  Acompanhamento de carga de dados mestres no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataImports.map((item) => {
                  const Icon = item.icon;
                  const progress = (item.imported / item.total) * 100;
                  
                  return (
                    <div key={item.type} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{item.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.imported} de {item.total} registros
                              {item.errors > 0 && (
                                <span className="text-red-600 ml-2">
                                  ({item.errors} erros)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          <span className="text-sm text-muted-foreground">{item.date}</span>
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                      {item.errors > 0 && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-500/10 p-2 rounded-md">
                          <AlertCircle className="h-4 w-4" />
                          <span>{item.errors} registros com erro - clique para ver detalhes</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Templates de Importação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Templates de Importação</CardTitle>
                <CardDescription>
                  Baixe os templates para importar dados em lote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Template - Funcionários (CSV/Excel)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Template - Hierarquias (CSV/Excel)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Template - Departamentos (CSV/Excel)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Template - Descrições de Cargos (CSV/Excel)
                </Button>
              </CardContent>
            </Card>

            {/* Validações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validações Realizadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>CPF válido e único</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Email corporativo válido</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Hierarquia sem ciclos</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Departamentos existentes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>Cargos cadastrados</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Hierarquia */}
          <TabsContent value="hierarquia" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Visualização de Hierarquia Organizacional
                </CardTitle>
                <CardDescription>
                  Estrutura completa de gestores e subordinados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exemplo de Hierarquia */}
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <div className="flex items-center gap-2 font-semibold">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <span>Rodrigo Ribeiro Gonçalves - Diretor</span>
                  </div>
                  
                  <div className="space-y-2 pl-6 border-l-2 border-primary/20 ml-2">
                    <div className="flex items-center gap-2 font-medium">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <span>André - Gerente de RH</span>
                    </div>
                    
                    <div className="space-y-2 pl-6 border-l-2 border-primary/20 ml-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        <span>Alexsandra Oliveira - RH Cargos e Salários</span>
                      </div>
                      
                      <div className="space-y-1 pl-6 border-l-2 border-primary/20 ml-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Maria Santos - Coordenadora</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>João Silva - Analista de Planejamento</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>Pedro Costa - Analista de Custos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Estatísticas da Hierarquia */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">5</div>
                    <div className="text-sm text-muted-foreground">Níveis Hierárquicos</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">85</div>
                    <div className="text-sm text-muted-foreground">Gestores</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">1250</div>
                    <div className="text-sm text-muted-foreground">Funcionários</div>
                  </div>
                </div>

                <Button className="w-full">
                  <GitBranch className="h-4 w-4 mr-2" />
                  Ver Organograma Completo
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Integração AVD */}
          <TabsContent value="integracao" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Integração com Sistema AVD
                </CardTitle>
                <CardDescription>
                  Como as descrições de cargos se integram ao processo de avaliação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fluxo de Integração */}
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border-2 border-blue-500">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">1. Descrição de Cargo Aprovada</h4>
                      <p className="text-sm text-muted-foreground">
                        Após aprovação nos 4 níveis, a descrição é publicada e vinculada ao cargo
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500">
                      <FileCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">2. Competências Extraídas</h4>
                      <p className="text-sm text-muted-foreground">
                        Competências técnicas e comportamentais são usadas no Passo 3 do AVD
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10 border-2 border-purple-500">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">3. Avaliação de Desempenho</h4>
                      <p className="text-sm text-muted-foreground">
                        Responsabilidades e KPIs são usados no Passo 4 para avaliar desempenho
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10 border-2 border-orange-500">
                      <TrendingUp className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">4. PDI Personalizado</h4>
                      <p className="text-sm text-muted-foreground">
                        Gaps identificados geram sugestões automáticas de desenvolvimento no Passo 5
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Benefícios */}
                <div>
                  <h4 className="font-semibold mb-3">Benefícios da Integração</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Avaliação baseada em critérios objetivos do cargo</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Competências alinhadas com necessidades reais</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>PDI focado em gaps específicos do cargo</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Histórico de evolução profissional documentado</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exemplo de Uso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exemplo Prático</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Cargo: Analista de Planejamento e Custos</p>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <p><strong>Competências Requeridas:</strong></p>
                    <ul className="list-disc list-inside text-muted-foreground ml-2">
                      <li>Análise de Processos (Avançado)</li>
                      <li>Excel e Power BI (Avançado)</li>
                      <li>Planejamento Estratégico (Intermediário)</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <p><strong>Avaliação do Colaborador:</strong></p>
                    <ul className="list-disc list-inside text-muted-foreground ml-2">
                      <li>Análise de Processos: <Badge className="ml-2" variant="outline">Atende (4/5)</Badge></li>
                      <li>Excel e Power BI: <Badge className="ml-2 bg-yellow-500/10 text-yellow-600">Gap (3/5)</Badge></li>
                      <li>Planejamento Estratégico: <Badge className="ml-2" variant="outline">Supera (5/5)</Badge></li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <p><strong>PDI Sugerido:</strong></p>
                    <ul className="list-disc list-inside text-muted-foreground ml-2">
                      <li>Curso avançado de Power BI (40h)</li>
                      <li>Certificação Microsoft Excel Expert</li>
                      <li>Mentoria com analista sênior</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start gap-1">
                <FileText className="h-5 w-5 mb-1" />
                <span className="font-semibold">Nova Descrição</span>
                <span className="text-xs text-muted-foreground">Criar descrição de cargo</span>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start gap-1">
                <Upload className="h-5 w-5 mb-1" />
                <span className="font-semibold">Importar Dados</span>
                <span className="text-xs text-muted-foreground">Upload em lote</span>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start gap-1">
                <CheckCircle2 className="h-5 w-5 mb-1" />
                <span className="font-semibold">Aprovar Pendentes</span>
                <span className="text-xs text-muted-foreground">{metrics.pending} aguardando</span>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto py-4">
              <div className="flex flex-col items-start gap-1">
                <BarChart3 className="h-5 w-5 mb-1" />
                <span className="font-semibold">Relatórios</span>
                <span className="text-xs text-muted-foreground">Análises e métricas</span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
