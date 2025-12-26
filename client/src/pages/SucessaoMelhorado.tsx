import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Users, TrendingUp, AlertCircle, Plus, Download, Search, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Link } from "wouter";
import { exportMapaSucessao } from "@/lib/exportPDF";
import { toast } from "sonner";

/**
 * Mapa de Sucessão - Versão Melhorada
 * Baseado nas telas de referência UISA
 * 
 * Features:
 * - KPIs no topo (Posições Críticas, Sucessores Prontos, Alto Risco, Cobertura Média)
 * - Filtros avançados (Departamento, Nível de Risco, Impacto, Cobertura)
 * - Visualização em tabela com indicadores visuais
 * - Botão "Adicionar Primeira Posição" quando vazio
 * - Botão "Exportar" relatório
 */

export default function SucessaoMelhorado() {
  const [departmentFilter, setDepartmentFilter] = useState<string>("todos");
  const [riskFilter, setRiskFilter] = useState<string>("todos");
  const [impactFilter, setImpactFilter] = useState<string>("todos");
  const [coverageFilter, setCoverageFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Queries
  const { data: plans, isLoading } = trpc.succession.list.useQuery({});
  const { data: kpis } = trpc.executive.getKPIs.useQuery({});

  // Calcular KPIs específicos de sucessão
  const posicoescriticas = plans?.filter((p) => p.isCritical).length || 0;
  const sucessoresProntos = 0; // TODO: calcular baseado em readinessLevel
  const altoRisco = plans?.filter((p) => p.riskLevel === "alto" || p.riskLevel === "critico").length || 0;
  const coberturaMedia = plans?.length ? ((sucessoresProntos / plans.length) * 100).toFixed(0) : "0";

  // Filtrar planos
  const filteredPlans = plans?.filter((plan) => {
    if (departmentFilter !== "todos") {
      // TODO: adicionar filtro de departamento quando disponível
    }
    if (riskFilter !== "todos" && plan.riskLevel !== riskFilter) return false;
    if (searchQuery && !plan.positionTitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" id="mapa-sucessao-content">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Mapa de Sucessão</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Planejamento estratégico de sucessão - UISA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={async () => {
                try {
                  toast.info("Gerando PDF...");
                  await exportMapaSucessao();
                  toast.success("PDF exportado com sucesso!");
                } catch (error) {
                  toast.error("Erro ao exportar PDF");
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Link href="/sucessao">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Posição
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Posições Críticas
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{posicoescriticas}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {plans?.length || 0} posições totais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sucessores Prontos
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sucessoresProntos}</div>
              <p className="text-xs text-muted-foreground mt-1">Prontidão imediata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alto Risco
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{altoRisco}</div>
              <p className="text-xs text-red-600 mt-1">Requer atenção</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cobertura Média
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coberturaMedia}%</div>
              <p className="text-xs text-muted-foreground mt-1">Índice de cobertura</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar posição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="ti">TI</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="operacoes">Operações</SelectItem>
                </SelectContent>
              </Select>

              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Nível de Risco" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                </SelectContent>
              </Select>

              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={coverageFilter} onValueChange={setCoverageFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Cobertura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="sem">Sem Cobertura</SelectItem>
                  <SelectItem value="minima">Mínima</SelectItem>
                  <SelectItem value="adequada">Adequada</SelectItem>
                  <SelectItem value="excelente">Excelente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Planos ou Empty State */}
        {!filteredPlans || filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma posição cadastrada</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                  Comece adicionando posições críticas para o plano de sucessão
                </p>
                <Link href="/sucessao">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Posição
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Posições Mapeadas ({filteredPlans.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredPlans.map((plan: any) => (
                  <Link key={plan.id} href={`/sucessao?id=${plan.id}`}>
                    <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{plan.positionTitle || "Posição"}</h4>
                          {plan.isCritical && (
                            <Badge variant="destructive" className="text-xs">
                              Crítica
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          Titular: {plan.currentHolderName || "Não definido"}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Risco</p>
                          <Badge
                            variant={
                              plan.riskLevel === "critico" || plan.riskLevel === "alto"
                                ? "destructive"
                                : plan.riskLevel === "medio"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-1"
                          >
                            {plan.riskLevel === "critico"
                              ? "Crítico"
                              : plan.riskLevel === "alto"
                              ? "Alto"
                              : plan.riskLevel === "medio"
                              ? "Médio"
                              : "Baixo"}
                          </Badge>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Sucessores</p>
                          <p className="text-lg font-bold mt-1">{plan.successors?.length || 0}</p>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Status</p>
                          <Badge variant="outline" className="mt-1">
                            {plan.status === "ativo" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
