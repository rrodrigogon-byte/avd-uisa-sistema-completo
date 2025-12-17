import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Target, 
  Award, 
  CheckCircle2,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  User,
  Mail,
  Briefcase
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";

/**
 * Dashboard Executivo Consolidado
 * 
 * Agrega KPIs de todos os módulos do sistema:
 * - Nine Box (distribuição por quadrante)
 * - PDI (em desenvolvimento, concluídos)
 * - Sucessão (posições críticas, cobertura)
 * - Avaliação 360° (em andamento, concluídas)
 * - Metas (atingidas, em risco)
 * - Benchmarking (gaps significativos)
 */

export default function DashboardExecutivoConsolidado() {
  const [, navigate] = useLocation();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("todos");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("2025");
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const [quadrantModalOpen, setQuadrantModalOpen] = useState(false);

  // Queries para buscar KPIs de cada módulo
  // TODO: Implementar endpoints getDistribution e getStats nos routers
  const nineBoxData = { total: 150, altoDesempenho: 45, q1: 5, q2: 10, q3: 15, q4: 12, q5: 25, q6: 18, q7: 8, q8: 12, q9: 45 };
  const pdiData = { total: 78, percentualConclusao: 65 };
  const successionData = { posicoesCriticas: 12, cobertura: 75 };
  const goalsData = { total: 120, avgAlignmentGeral: 82 };
  const isLoading = false;

  // Dados simulados para demonstração (substituir por dados reais)
  const evaluation360Stats = {
    total: 45,
    emAndamento: 18,
    concluidas: 27,
    percentualConclusao: 60,
  };

  const benchmarkingStats = {
    gapsSignificativos: 5,
    dimensoesAnalisadas: 9,
    percentualAcimaMercado: 55,
  };

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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Executivo Consolidado</h1>
            <p className="text-sm text-muted-foreground">
              Visão estratégica consolidada de todos os módulos de gestão de talentos
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Departamentos</SelectItem>
                <SelectItem value="ti">TI</SelectItem>
                <SelectItem value="rh">RH</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/nine-box")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Nine Box</CardTitle>
                <PieChart className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{nineBoxData?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Colaboradores mapeados</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {nineBoxData?.altoDesempenho || 0} Alto Desempenho
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/pdi-inteligente")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">PDI Ativos</CardTitle>
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pdiData?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Planos em desenvolvimento</p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">
                  {pdiData?.percentualConclusao || 0}% concluídos
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/mapa-sucessao-completo")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Sucessão</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{successionData?.posicoesCriticas || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Posições críticas</p>
              <div className="mt-3 flex items-center gap-2">
                {(successionData?.cobertura || 0) >= 70 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${(successionData?.cobertura || 0) >= 70 ? "text-green-600" : "text-red-600"}`}>
                  {successionData?.cobertura || 0}% cobertura
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/metas-cascata")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Metas em Cascata</CardTitle>
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{goalsData?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Metas ativas</p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">
                  {goalsData?.avgAlignmentGeral || 0}% alinhamento
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Avaliação 360° e Benchmarking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/avaliacoes")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Avaliação 360°
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total de Avaliações</span>
                  <span className="text-2xl font-bold">{evaluation360Stats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Em Andamento</span>
                  <Badge variant="secondary">{evaluation360Stats.emAndamento}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Concluídas</span>
                  <Badge className="bg-green-100 text-green-800">{evaluation360Stats.concluidas}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Percentual de Conclusão</span>
                    <span className="font-semibold text-green-600">{evaluation360Stats.percentualConclusao}%</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${evaluation360Stats.percentualConclusao}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/benchmarking")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Benchmarking de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dimensões Analisadas</span>
                  <span className="text-2xl font-bold">{benchmarkingStats.dimensoesAnalisadas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gaps Significativos</span>
                  <Badge variant="destructive">{benchmarkingStats.gapsSignificativos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Acima do Mercado</span>
                  <Badge className="bg-green-100 text-green-800">{benchmarkingStats.percentualAcimaMercado}%</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Posição Competitiva</span>
                    <span className="font-semibold text-green-600">
                      {benchmarkingStats.percentualAcimaMercado >= 60 ? "Forte" : benchmarkingStats.percentualAcimaMercado >= 40 ? "Moderada" : "Fraca"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Distribuição Nine Box */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição Nine Box - Talentos por Quadrante</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* Linha 3 (Alto Potencial) */}
              <Card 
                className="bg-green-50 border-green-200 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q7");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-700">{nineBoxData?.q7 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Baixo Desempenho<br />Alto Potencial</div>
                </CardContent>
              </Card>
              <Card 
                className="bg-green-100 border-green-300 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q8");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-800">{nineBoxData?.q8 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Médio Desempenho<br />Alto Potencial</div>
                </CardContent>
              </Card>
              <Card 
                className="bg-green-200 border-green-400 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q9");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-900">{nineBoxData?.q9 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Alto Desempenho<br />Alto Potencial</div>
                  <Badge className="mt-2 bg-yellow-500">Estrelas</Badge>
                </CardContent>
              </Card>

              {/* Linha 2 (Médio Potencial) */}
              <Card 
                className="bg-yellow-50 border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q4");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-700">{nineBoxData?.q4 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Baixo Desempenho<br />Médio Potencial</div>
                </CardContent>
              </Card>
              <Card 
                className="bg-yellow-100 border-yellow-300 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q5");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-800">{nineBoxData?.q5 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Médio Desempenho<br />Médio Potencial</div>
                </CardContent>
              </Card>
              <Card 
                className="bg-yellow-200 border-yellow-400 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q6");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-900">{nineBoxData?.q6 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Alto Desempenho<br />Médio Potencial</div>
                </CardContent>
              </Card>

              {/* Linha 1 (Baixo Potencial) */}
              <Card 
                className="bg-red-50 border-red-200 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q1");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-700">{nineBoxData?.q1 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Baixo Desempenho<br />Baixo Potencial</div>
                  <Badge variant="destructive" className="mt-2">Atenção</Badge>
                </CardContent>
              </Card>
              <Card 
                className="bg-red-100 border-red-300 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q2");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-800">{nineBoxData?.q2 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Médio Desempenho<br />Baixo Potencial</div>
                </CardContent>
              </Card>
              <Card 
                className="bg-red-200 border-red-400 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedQuadrant("q3");
                  setQuadrantModalOpen(true);
                }}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-900">{nineBoxData?.q3 || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Alto Desempenho<br />Baixo Potencial</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Insights e Recomendações */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Insights Estratégicos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Nine Box:</strong> {nineBoxData?.altoDesempenho || 0} colaboradores identificados como alto desempenho - foco em retenção e desenvolvimento</span>
              </li>
              <li className="flex items-start gap-2">
                {(successionData?.cobertura || 0) >= 70 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <span><strong>Sucessão:</strong> {successionData?.cobertura || 0}% de cobertura - {(successionData?.cobertura || 0) >= 70 ? "cobertura adequada" : "necessário aumentar pipeline de sucessores"}</span>
              </li>
              <li className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <span><strong>Metas:</strong> {goalsData?.avgAlignmentGeral || 0}% de alinhamento geral na cascata - {(goalsData?.avgAlignmentGeral || 0) >= 80 ? "excelente alinhamento estratégico" : "oportunidade de melhorar alinhamento"}</span>
              </li>
              <li className="flex items-start gap-2">
                <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span><strong>Avaliação 360°:</strong> {evaluation360Stats.percentualConclusao}% de conclusão - {evaluation360Stats.percentualConclusao >= 80 ? "ótima adesão" : "incentivar conclusão das avaliações pendentes"}</span>
              </li>
              <li className="flex items-start gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span><strong>Benchmarking:</strong> {benchmarkingStats.gapsSignificativos} gaps significativos identificados - priorizar ações de desenvolvimento nessas dimensões</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Quadrante */}
        <QuadrantDetailsModal
          open={quadrantModalOpen}
          onOpenChange={setQuadrantModalOpen}
          quadrant={selectedQuadrant}
        />
      </div>
    </DashboardLayout>
  );
}

// Componente Modal de Detalhes do Quadrante
function QuadrantDetailsModal({
  open,
  onOpenChange,
  quadrant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quadrant: string | null;
}) {
  const [, navigate] = useLocation();

  // Dados simulados de profissionais por quadrante
  // TODO: Substituir por query real ao backend
  const employeesByQuadrant: Record<string, any[]> = {
    q1: [
      { id: 1, name: "João Silva", position: "Analista Jr", performance: 2.1, potential: 2.3, email: "joao@empresa.com" },
      { id: 2, name: "Maria Santos", position: "Assistente", performance: 2.5, potential: 2.1, email: "maria@empresa.com" },
    ],
    q2: [
      { id: 3, name: "Pedro Costa", position: "Analista", performance: 3.2, potential: 2.4, email: "pedro@empresa.com" },
      { id: 4, name: "Ana Paula", position: "Coordenador", performance: 3.5, potential: 2.2, email: "ana@empresa.com" },
    ],
    q3: [
      { id: 5, name: "Carlos Mendes", position: "Especialista Sr", performance: 4.2, potential: 2.5, email: "carlos@empresa.com" },
      { id: 6, name: "Juliana Lima", position: "Gerente", performance: 4.5, potential: 2.8, email: "juliana@empresa.com" },
    ],
    q4: [
      { id: 7, name: "Roberto Alves", position: "Analista", performance: 2.3, potential: 3.1, email: "roberto@empresa.com" },
      { id: 8, name: "Fernanda Rocha", position: "Coordenador", performance: 2.6, potential: 3.4, email: "fernanda@empresa.com" },
    ],
    q5: [
      { id: 9, name: "Lucas Ferreira", position: "Analista Sr", performance: 3.3, potential: 3.2, email: "lucas@empresa.com" },
      { id: 10, name: "Patricia Souza", position: "Especialista", performance: 3.6, potential: 3.5, email: "patricia@empresa.com" },
    ],
    q6: [
      { id: 11, name: "Ricardo Gomes", position: "Gerente", performance: 4.3, potential: 3.3, email: "ricardo@empresa.com" },
      { id: 12, name: "Camila Dias", position: "Coordenador Sr", performance: 4.6, potential: 3.6, email: "camila@empresa.com" },
    ],
    q7: [
      { id: 13, name: "Bruno Martins", position: "Analista Jr", performance: 2.4, potential: 4.1, email: "bruno@empresa.com" },
      { id: 14, name: "Larissa Oliveira", position: "Trainee", performance: 2.7, potential: 4.3, email: "larissa@empresa.com" },
    ],
    q8: [
      { id: 15, name: "Thiago Barbosa", position: "Analista", performance: 3.4, potential: 4.2, email: "thiago@empresa.com" },
      { id: 16, name: "Renata Castro", position: "Especialista", performance: 3.7, potential: 4.5, email: "renata@empresa.com" },
    ],
    q9: [
      { id: 17, name: "Gabriel Ribeiro", position: "Gerente Sr", performance: 4.7, potential: 4.6, email: "gabriel@empresa.com" },
      { id: 18, name: "Beatriz Carvalho", position: "Diretor", performance: 4.9, potential: 4.8, email: "beatriz@empresa.com" },
      { id: 19, name: "Felipe Araújo", position: "Coordenador", performance: 4.5, potential: 4.4, email: "felipe@empresa.com" },
    ],
  };

  const quadrantLabels: Record<string, { title: string; description: string; color: string }> = {
    q1: { title: "Baixo Desempenho / Baixo Potencial", description: "Requer atenção imediata", color: "text-red-700" },
    q2: { title: "Médio Desempenho / Baixo Potencial", description: "Desenvolvimento limitado", color: "text-red-600" },
    q3: { title: "Alto Desempenho / Baixo Potencial", description: "Especialistas técnicos", color: "text-red-500" },
    q4: { title: "Baixo Desempenho / Médio Potencial", description: "Necessita coaching", color: "text-yellow-700" },
    q5: { title: "Médio Desempenho / Médio Potencial", description: "Maioria sólida", color: "text-yellow-600" },
    q6: { title: "Alto Desempenho / Médio Potencial", description: "Profissionais chave", color: "text-yellow-500" },
    q7: { title: "Baixo Desempenho / Alto Potencial", description: "Talentos a desenvolver", color: "text-green-700" },
    q8: { title: "Médio Desempenho / Alto Potencial", description: "Futuros líderes", color: "text-green-600" },
    q9: { title: "Alto Desempenho / Alto Potencial", description: "Estrelas da organização", color: "text-green-500" },
  };

  const employees = quadrant ? employeesByQuadrant[quadrant] || [] : [];
  const quadrantInfo = quadrant ? quadrantLabels[quadrant] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={quadrantInfo?.color}>
            {quadrantInfo?.title}
          </DialogTitle>
          <DialogDescription>{quadrantInfo?.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {employees.length} profissiona{employees.length === 1 ? "l" : "is"} neste quadrante
            </p>
          </div>

          {employees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                  <TableHead className="text-center">Potencial</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {emp.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        {emp.position}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{emp.performance.toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{emp.potential.toFixed(1)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {emp.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate(`/funcionarios/${emp.id}`);
                          onOpenChange(false);
                        }}
                      >
                        Ver Perfil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum profissional neste quadrante
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
