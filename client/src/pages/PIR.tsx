import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import FilterBar, { FilterConfig } from "@/components/FilterBar";
import StatusBadge from "@/components/StatusBadge";

export default function PIR() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: pirData, isLoading } = trpc.pir.list.useQuery();
  
  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'todos',
    department: 'todos',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const myPirs = pirData?.asUser || [];
  const managedPirs = pirData?.asManager || [];

  // Extrair departamentos únicos dos PIRs
  const departments = useMemo(() => {
    const allPirs = [...myPirs, ...managedPirs];
    const uniqueDepts = new Set(
      allPirs
        .map((pir: any) => pir.department)
        .filter((dept: any) => dept && dept.trim() !== '')
    );
    return Array.from(uniqueDepts).sort().map((dept: any) => ({
      value: dept,
      label: dept,
    }));
  }, [myPirs, managedPirs]);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'rascunho', label: 'Rascunho' },
        { value: 'em_analise', label: 'Em Análise' },
        { value: 'aprovado', label: 'Aprovado' },
        { value: 'rejeitado', label: 'Rejeitado' },
      ],
    },
    {
      key: 'department',
      label: 'Departamento',
      type: 'select',
      options: departments,
    },
    {
      key: 'dateRange',
      label: 'Período',
      type: 'dateRange',
      placeholder: 'Selecionar período',
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: 'todos', department: 'todos' });
    setSearchQuery('');
    setDateRange({});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const filteredMyPirs = useMemo(() => {
    return myPirs.filter((pir: any) => {
      // Filtro de status
      if (filters.status !== 'todos' && pir.status !== filters.status) {
        return false;
      }
      
      // Filtro de departamento
      if (filters.department !== 'todos' && pir.department !== filters.department) {
        return false;
      }
      
      // Filtro de busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          pir.title?.toLowerCase().includes(query) ||
          pir.period?.toLowerCase().includes(query) ||
          pir.description?.toLowerCase().includes(query) ||
          pir.department?.toLowerCase().includes(query)
        );
      }
      
      // Filtro de período
      if (dateRange.from || dateRange.to) {
        const pirDate = new Date(pir.createdAt);
        if (dateRange.from && pirDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (pirDate > endOfDay) return false;
        }
      }
      
      return true;
    });
  }, [myPirs, filters, searchQuery, dateRange]);

  const filteredManagedPirs = useMemo(() => {
    return managedPirs.filter((pir: any) => {
      // Filtro de status
      if (filters.status !== 'todos' && pir.status !== filters.status) {
        return false;
      }
      
      // Filtro de departamento
      if (filters.department !== 'todos' && pir.department !== filters.department) {
        return false;
      }
      
      // Filtro de busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          pir.title?.toLowerCase().includes(query) ||
          pir.period?.toLowerCase().includes(query) ||
          pir.description?.toLowerCase().includes(query) ||
          pir.department?.toLowerCase().includes(query)
        );
      }
      
      // Filtro de período
      if (dateRange.from || dateRange.to) {
        const pirDate = new Date(pir.createdAt);
        if (dateRange.from && pirDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (pirDate > endOfDay) return false;
        }
      }
      
      return true;
    });
  }, [managedPirs, filters, searchQuery]);



  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">PIR - Plano Individual de Resultados</h1>
            <p className="text-muted-foreground mt-2">Gerencie seus planos e acompanhe o progresso das metas</p>
          </div>
          <Button onClick={() => setLocation("/pir/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo PIR
          </Button>
        </div>

        {/* Barra de Filtros */}
        <div className="mb-6">
          <FilterBar
            filters={filterConfigs}
            activeFilters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Buscar PIRs..."
            resultCount={filteredMyPirs.length + filteredManagedPirs.length}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>

        {/* Meus PIRs */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Meus PIRs ({filteredMyPirs.length})
          </h2>
          {filteredMyPirs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não possui PIRs cadastrados</p>
                <Button variant="outline" className="mt-4" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                  Criar meu primeiro PIR
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMyPirs.map((pir: any) => (
                <Card key={pir.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/pir/${pir.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pir.title}</CardTitle>
                      <StatusBadge status={pir.status} />
                    </div>
                    <CardDescription>{pir.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {pir.description && (
                        <p className="text-muted-foreground line-clamp-2">{pir.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(pir.startDate).toLocaleDateString('pt-BR')} - {new Date(pir.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* PIRs que eu gerencio */}
        {filteredManagedPirs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              PIRs sob minha gestão ({filteredManagedPirs.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredManagedPirs.map((pir: any) => (
                <Card key={pir.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/pir/${pir.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pir.title}</CardTitle>
                      <StatusBadge status={pir.status} />
                    </div>
                    <CardDescription>{pir.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {pir.description && (
                        <p className="text-muted-foreground line-clamp-2">{pir.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(pir.startDate).toLocaleDateString('pt-BR')} - {new Date(pir.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
