import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Building2, Briefcase, ChevronRight, ChevronDown, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Página de Organograma com Hierarquia Completa
 * Visualização da estrutura organizacional: Presidente → Diretor → Gestor → Coordenador → Funcionário
 */
export default function OrganogramaHierarchy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
  const [selectedSecao, setSelectedSecao] = useState<string>("");
  const [selectedFuncao, setSelectedFuncao] = useState<string>("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Buscar opções de filtro
  const { data: filterOptions, isLoading: loadingFilters } = trpc.organogramaHierarchy.getFilterOptions.useQuery({});

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats } = trpc.organogramaHierarchy.getHierarchyStats.useQuery({});

  // Buscar hierarquia completa
  const { data: hierarchyData, isLoading: loadingHierarchy } = trpc.organogramaHierarchy.getFullHierarchy.useQuery({
    empresa: selectedEmpresa || undefined,
    secao: selectedSecao || undefined,
    funcao: selectedFuncao || undefined,
    searchTerm: searchTerm || undefined,
  });

  const toggleNode = (chapa: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(chapa)) {
      newExpanded.delete(chapa);
    } else {
      newExpanded.add(chapa);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    if (hierarchyData?.employees) {
      const allChapas = new Set(hierarchyData.employees.map(e => e.chapa).filter(Boolean) as string[]);
      setExpandedNodes(allChapas);
    }
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getHierarchyLevel = (employee: any): string => {
    if (!employee.chapaPresidente) return "Presidente";
    if (!employee.chapaDiretor) return "Diretor";
    if (!employee.chapaGestor) return "Gestor";
    if (!employee.chapaCoordenador) return "Coordenador";
    return "Funcionário";
  };

  const getLevelColor = (level: string): string => {
    switch (level) {
      case "Presidente": return "bg-purple-100 text-purple-800 border-purple-300";
      case "Diretor": return "bg-blue-100 text-blue-800 border-blue-300";
      case "Gestor": return "bg-green-100 text-green-800 border-green-300";
      case "Coordenador": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderEmployeeCard = (employee: any) => {
    const level = getHierarchyLevel(employee);
    const isExpanded = expandedNodes.has(employee.chapa);
    
    // Encontrar subordinados diretos
    const subordinates = hierarchyData?.employees.filter(e => 
      e.chapaCoordenador === employee.chapa ||
      e.chapaGestor === employee.chapa ||
      e.chapaDiretor === employee.chapa ||
      e.chapaPresidente === employee.chapa
    ) || [];

    const hasSubordinates = subordinates.length > 0;

    return (
      <div key={employee.chapa} className="mb-2">
        <div className={`border rounded-lg p-3 hover:shadow-md transition-shadow ${getLevelColor(level)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {hasSubordinates && (
                <button
                  onClick={() => toggleNode(employee.chapa)}
                  className="hover:bg-white/50 rounded p-1"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasSubordinates && <div className="w-6" />}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{employee.name}</span>
                  <Badge variant="outline" className="text-xs">{employee.chapa}</Badge>
                </div>
                <div className="text-sm mt-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" />
                    <span>{employee.funcao}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    <span>{employee.secao}</span>
                  </div>
                  {employee.email && (
                    <div className="text-xs text-muted-foreground mt-0.5">{employee.email}</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <Badge className={getLevelColor(level)}>{level}</Badge>
              {hasSubordinates && (
                <div className="text-xs text-muted-foreground mt-1">
                  {subordinates.length} subordinado{subordinates.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </div>

        {isExpanded && hasSubordinates && (
          <div className="ml-8 mt-2 border-l-2 border-gray-300 pl-4">
            {subordinates.map(sub => renderEmployeeCard(sub))}
          </div>
        )}
      </div>
    );
  };

  // Encontrar funcionários raiz (presidentes ou sem superior)
  const rootEmployees = hierarchyData?.employees.filter(e => 
    !e.chapaPresidente || e.chapa === e.chapaPresidente
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organograma Hierárquico</h1>
        <p className="text-muted-foreground mt-1">
          Visualização completa da estrutura organizacional
        </p>
      </div>

      {/* Estatísticas */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Funcionários</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Presidentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comPresidente}</div>
              <p className="text-xs text-muted-foreground">Com presidente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Diretores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comDiretor}</div>
              <p className="text-xs text-muted-foreground">Com diretor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Gestores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comGestor}</div>
              <p className="text-xs text-muted-foreground">Com gestor</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Coordenadores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.comCoordenador}</div>
              <p className="text-xs text-muted-foreground">Com coordenador</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a visualização do organograma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, chapa ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Empresa</label>
              <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {filterOptions?.empresas.map((empresa) => (
                    <SelectItem key={empresa} value={empresa}>
                      {empresa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Seção</label>
              <Select value={selectedSecao} onValueChange={setSelectedSecao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {filterOptions?.secoes.slice(0, 50).map((secao) => (
                    <SelectItem key={secao} value={secao}>
                      {secao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Função</label>
              <Select value={selectedFuncao} onValueChange={setSelectedFuncao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {filterOptions?.funcoes.slice(0, 50).map((funcao) => (
                    <SelectItem key={funcao} value={funcao}>
                      {funcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={expandAll}>
              Expandir Todos
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Recolher Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedEmpresa("");
                setSelectedSecao("");
                setSelectedFuncao("");
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hierarquia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estrutura Hierárquica
          </CardTitle>
          <CardDescription>
            {hierarchyData?.total || 0} funcionário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHierarchy ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : hierarchyData?.employees.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum funcionário encontrado com os filtros aplicados.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {rootEmployees.map(employee => renderEmployeeCard(employee))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
