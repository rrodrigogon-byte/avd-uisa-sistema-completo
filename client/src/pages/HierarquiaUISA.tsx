import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Users, 
  ChevronDown, 
  ChevronRight, 
  Search,
  Mail,
  User,
  Briefcase,
  Target
} from "lucide-react";
import { toast } from "sonner";

interface HierarchyNode {
  id: number;
  chapa: string;
  name: string;
  function: string;
  email?: string;
  level: "presidente" | "diretor" | "gestor" | "coordenador" | "funcionario";
  children: HierarchyNode[];
  subordinatesCount?: number;
}

export default function HierarquiaUISA() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar estatísticas
  const { data: stats, isLoading: statsLoading } = trpc.hierarchy.getStats.useQuery();

  // Buscar hierarquia completa
  const { data: fullHierarchy, isLoading: hierarchyLoading } = trpc.hierarchy.getFullTree.useQuery();

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    if (!fullHierarchy) return;
    const allNodes = new Set<string>();
    const collectNodes = (node: HierarchyNode) => {
      allNodes.add(`${node.level}-${node.chapa}`);
      node.children?.forEach(collectNodes);
    };
    fullHierarchy.forEach(collectNodes);
    setExpandedNodes(allNodes);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "presidente":
        return "bg-purple-100 text-purple-700 border-purple-500";
      case "diretor":
        return "bg-blue-100 text-blue-700 border-blue-500";
      case "gestor":
        return "bg-green-100 text-green-700 border-green-500";
      case "coordenador":
        return "bg-yellow-100 text-yellow-700 border-yellow-500";
      case "funcionario":
        return "bg-gray-100 text-gray-700 border-gray-500";
      default:
        return "bg-gray-100 text-gray-700 border-gray-500";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "presidente":
        return <Building2 className="h-4 w-4" />;
      case "diretor":
        return <Briefcase className="h-4 w-4" />;
      case "gestor":
        return <Target className="h-4 w-4" />;
      case "coordenador":
        return <User className="h-4 w-4" />;
      case "funcionario":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "presidente":
        return "Reitoria";
      case "diretor":
        return "Pró-Reitoria";
      case "gestor":
        return "Diretoria";
      case "coordenador":
        return "Coordenação";
      case "funcionario":
        return "Setor";
      default:
        return level;
    }
  };

  const renderNode = (node: HierarchyNode, depth: number = 0) => {
    const nodeId = `${node.level}-${node.chapa}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = searchTerm === "" || 
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.chapa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.function.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch && searchTerm !== "") {
      return null;
    }

    return (
      <div key={nodeId} className="mb-2">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${getLevelColor(node.level)} hover:shadow-md transition-all cursor-pointer`}
          style={{ marginLeft: `${depth * 24}px` }}
          onClick={() => hasChildren && toggleNode(nodeId)}
        >
          {hasChildren && (
            <button className="flex-shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          <div className="flex items-center gap-2 flex-shrink-0">
            {getLevelIcon(node.level)}
            <Badge variant="secondary" className={getLevelColor(node.level)}>
              {getLevelLabel(node.level)}
            </Badge>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{node.name}</p>
              <span className="text-xs text-muted-foreground">({node.chapa})</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">{node.function}</p>
            {node.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {node.email}
              </p>
            )}
          </div>

          {hasChildren && (
            <Badge variant="outline" className="flex-shrink-0">
              {node.subordinatesCount || node.children.length} subordinado(s)
            </Badge>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-2">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Hierarquia Organizacional UISA</h1>
        <p className="text-muted-foreground mt-2">
          Visualização completa da estrutura hierárquica: Reitoria → Pró-Reitorias → Diretorias → Coordenações → Setores
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalEmployees || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coordenações</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.uniqueCoordinators || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diretorias</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.uniqueManagers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pró-Reitorias</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.uniqueDirectors || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Visualização</CardTitle>
          <CardDescription>
            Busque por nome, chapa ou função, e expanda/recolha a hierarquia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, chapa ou função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={expandAll} variant="outline">
                Expandir Tudo
              </Button>
              <Button onClick={collapseAll} variant="outline">
                Recolher Tudo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Árvore Hierárquica */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura Organizacional</CardTitle>
          <CardDescription>
            Clique nos itens para expandir/recolher os níveis hierárquicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hierarchyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full ml-6" />
              <Skeleton className="h-20 w-full ml-12" />
              <Skeleton className="h-20 w-full ml-18" />
            </div>
          ) : fullHierarchy && fullHierarchy.length > 0 ? (
            <div className="space-y-2">
              {fullHierarchy.map((node) => renderNode(node))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma hierarquia encontrada. Importe os dados de hierarquia para visualizar a estrutura organizacional.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
