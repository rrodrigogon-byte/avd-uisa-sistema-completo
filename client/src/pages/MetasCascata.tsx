import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Plus, Target, TrendingUp, Users, User, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";

/**
 * Metas em Cascata Hierárquico
 * 
 * Visualização em árvore mostrando propagação de metas:
 * Organizacional → Departamental → Individual
 */

interface GoalNode {
  id: number;
  title: string;
  type: "individual" | "equipe" | "organizacional";
  status: string;
  progress: number;
  alignmentPercentage: number;
  employeeId: number;
  departmentId: number | null;
  children: GoalNode[];
}

function GoalTreeNode({ node, level = 0 }: { node: GoalNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "organizacional":
        return <Building2 className="h-4 w-4" />;
      case "equipe":
        return <Users className="h-4 w-4" />;
      case "individual":
        return <User className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "organizacional":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "equipe":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "individual":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluida":
        return "bg-green-500";
      case "em_andamento":
        return "bg-blue-500";
      case "aprovada":
        return "bg-yellow-500";
      case "rascunho":
        return "bg-gray-400";
      default:
        return "bg-gray-300";
    }
  };

  const getAlignmentColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="relative">
      {/* Linha vertical conectando ao pai */}
      {level > 0 && (
        <div className="absolute left-0 top-0 w-px h-6 bg-gray-300" style={{ marginLeft: `${(level - 1) * 40 + 20}px` }} />
      )}

      {/* Card da meta */}
      <div className="flex items-start gap-2 mb-4" style={{ marginLeft: `${level * 40}px` }}>
        {/* Botão de expandir/colapsar */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-3 p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-600" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        {/* Card */}
        <Card className="flex-1 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              {/* Informações principais */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${getTypeColor(node.type)} border`}>
                    <span className="flex items-center gap-1">
                      {getTypeIcon(node.type)}
                      {node.type === "organizacional" ? "Organizacional" : node.type === "equipe" ? "Departamental" : "Individual"}
                    </span>
                  </Badge>
                  <span className="text-sm text-gray-500">#{node.id}</span>
                </div>

                <h4 className="font-semibold text-sm">{node.title}</h4>

                {/* Barra de progresso */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-medium">{node.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${getStatusColor(node.status)} h-2 rounded-full transition-all`}
                      style={{ width: `${node.progress}%` }}
                    />
                  </div>
                </div>

                {/* Alinhamento com meta pai */}
                {level > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-600">Alinhamento:</span>
                    <span className={`font-semibold ${getAlignmentColor(node.alignmentPercentage || 0)}`}>
                      {node.alignmentPercentage || 0}%
                    </span>
                  </div>
                )}
              </div>

              {/* Indicador de filhos */}
              {hasChildren && (
                <div className="flex-shrink-0 text-center">
                  <div className="text-2xl font-bold text-gray-700">{node.children.length}</div>
                  <div className="text-xs text-gray-500">
                    {node.children.length === 1 ? "meta filha" : "metas filhas"}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Renderizar filhos */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {node.children.map((child: any) => (
            <GoalTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MetasCascata() {
  const [, navigate] = useLocation();
  const [selectedCycleId] = useState(1); // TODO: Implementar seletor de ciclo

  // Query para buscar árvore de metas
  const { data: tree, isLoading } = trpc.goalsCascade.getTree.useQuery({
    cycleId: selectedCycleId,
  });

  // Query para buscar estatísticas
  const { data: stats } = trpc.goalsCascade.getStats.useQuery({
    cycleId: selectedCycleId,
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/metas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Metas em Cascata Hierárquico</h1>
            <p className="text-sm text-muted-foreground">
              Visualização em árvore da propagação de metas organizacionais → departamentais → individuais
            </p>
          </div>
          <Button onClick={() => navigate("/metas/criar")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Organizacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.organizacional}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Alinhamento: {stats.avgAlignmentOrganizacional}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Departamentais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.departamental}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Alinhamento: {stats.avgAlignmentDepartamental}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Individuais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.individual}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Alinhamento: {stats.avgAlignmentIndividual}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alinhamento Geral */}
        {stats && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Alinhamento Geral da Cascata</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Média de alinhamento entre todos os níveis hierárquicos
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-blue-600">{stats.avgAlignmentGeral}%</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {stats.avgAlignmentGeral >= 80 ? "Excelente" : stats.avgAlignmentGeral >= 60 ? "Bom" : "Precisa melhorar"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Árvore de Metas */}
        <Card>
          <CardHeader>
            <CardTitle>Visualização Hierárquica</CardTitle>
          </CardHeader>
          <CardContent>
            {tree && tree.length > 0 ? (
              <div className="space-y-4">
                {tree.map((rootNode: GoalNode) => (
                  <GoalTreeNode key={rootNode.id} node={rootNode} level={0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">Nenhuma meta encontrada</p>
                <p className="text-sm mt-2">Crie uma meta organizacional para começar a cascata</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Meta Organizacional
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Tipos de Meta</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <span>Organizacional (raiz)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Departamental (equipe)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span>Individual (colaborador)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Concluída</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>Em andamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span>Aprovada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span>Rascunho</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Alinhamento</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">≥80%</span>
                    <span>Excelente alinhamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600 font-semibold">50-79%</span>
                    <span>Alinhamento moderado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-semibold">&lt;50%</span>
                    <span>Baixo alinhamento</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
