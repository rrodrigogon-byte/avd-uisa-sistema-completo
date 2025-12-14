import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, FileText, Building } from "lucide-react";
import FilterBar, { FilterConfig } from "@/components/FilterBar";
import { useLocation } from "wouter";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";

export default function JobDescriptions() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: jobDescriptions, isLoading } = trpc.jobDescription.list.useQuery();
  
  const [filters, setFilters] = useState<Record<string, string>>({
    status: 'todos',
    department: 'todos',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Extrair departamentos únicos das descrições de cargo
  const departments = useMemo(() => {
    if (!jobDescriptions) return [];
    const uniqueDepts = new Set(
      jobDescriptions
        .map((job: any) => job.department)
        .filter((dept: any) => dept && dept.trim() !== '')
    );
    return Array.from(uniqueDepts).sort().map((dept: any) => ({
      value: dept,
      label: dept,
    }));
  }, [jobDescriptions]);

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
        { value: 'arquivado', label: 'Arquivado' },
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

  const filteredJobDescriptions = useMemo(() => {
    if (!jobDescriptions) return [];
    
    return jobDescriptions.filter((job: any) => {
      // Filtro de status
      if (filters.status !== 'todos' && job.status !== filters.status) {
        return false;
      }
      
      // Filtro de departamento
      if (filters.department !== 'todos' && job.department !== filters.department) {
        return false;
      }
      
      // Filtro de busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          job.title?.toLowerCase().includes(query) ||
          job.code?.toLowerCase().includes(query) ||
          job.department?.toLowerCase().includes(query) ||
          job.summary?.toLowerCase().includes(query)
        );
      }
      
      // Filtro de período
      if (dateRange.from || dateRange.to) {
        const jobDate = new Date(job.createdAt);
        if (dateRange.from && jobDate < dateRange.from) return false;
        if (dateRange.to) {
          const endOfDay = new Date(dateRange.to);
          endOfDay.setHours(23, 59, 59, 999);
          if (jobDate > endOfDay) return false;
        }
      }
      
      return true;
    });
  }, [jobDescriptions, filters, searchQuery, dateRange]);

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

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Descrições de Cargo UISA</h1>
            <p className="text-muted-foreground mt-2">Consulte e gerencie descrições de cargos da organização</p>
          </div>
          {user?.role === 'admin' && (
            <Button onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Descrição
            </Button>
          )}
        </div>

        <FilterBar
          filters={filterConfigs}
          activeFilters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por título, código, departamento..."
          resultCount={filteredJobDescriptions.length}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {filteredJobDescriptions.length === 0 && jobDescriptions && jobDescriptions.length > 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma descrição de cargo encontrada com os filtros aplicados</p>
              <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : jobDescriptions && jobDescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma descrição de cargo cadastrada</p>
              {user?.role === 'admin' && (
                <Button variant="outline" className="mt-4" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                  Criar primeira descrição
                </Button>
              )}
            </CardContent>
          </Card>
        ) : filteredJobDescriptions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobDescriptions.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/job-descriptions/${job.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-mono text-xs">{job.code}</span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={job.status || 'rascunho'} />
                      <Badge variant="default">v{job.version}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.department && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span>{job.department}</span>
                      </div>
                    )}
                    {job.level && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>Nível: {job.level}</span>
                      </div>
                    )}
                    {job.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{job.summary}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
      </div>
    </DashboardLayout>
  );
}
