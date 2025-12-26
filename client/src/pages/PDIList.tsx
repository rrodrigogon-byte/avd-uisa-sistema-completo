import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  Users,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLocation } from "wouter";

/**
 * Listagem de PDIs com Filtros Avançados
 * Tabela completa com busca, filtros e paginação
 */
export default function PDIList() {
  const [, setLocation] = useLocation();

  // Estados de filtros
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Estados de paginação e ordenação
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [orderBy, setOrderBy] = useState<'createdAt' | 'employeeName' | 'status' | 'progress'>('createdAt');
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc');

  // Buscar PDIs com filtros
  const { data, isLoading } = trpc.pdi.listWithFilters.useQuery({
    status: selectedStatus as any,
    employeeId: selectedEmployee,
    departmentId: selectedDepartment,
    searchText: searchText || undefined,
    startDate,
    endDate,
    page,
    pageSize,
    orderBy,
    orderDirection,
  });

  // Buscar departamentos para filtro
  const { data: departments } = trpc.departments.list.useQuery({});

  const handleSort = (column: typeof orderBy) => {
    if (orderBy === column) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(column);
      setOrderDirection('desc');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      'em_andamento': { variant: 'default', label: 'Em Andamento' },
      'concluido': { variant: 'success', label: 'Concluído' },
      'rascunho': { variant: 'secondary', label: 'Rascunho' },
      'cancelado': { variant: 'destructive', label: 'Cancelado' },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const resetFilters = () => {
    setSearchText("");
    setSelectedStatus(undefined);
    setSelectedDepartment(undefined);
    setSelectedEmployee(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos de Desenvolvimento Individual</h1>
          <p className="text-gray-600 mt-1">
            Gerencie e acompanhe todos os PDIs cadastrados
          </p>
        </div>
        <Button onClick={() => setLocation("/pdi/novo")}>
          Novo PDI
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
          <CardDescription>
            Refine sua busca usando os filtros abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca por texto */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, cargo, departamento..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus || "all"} onValueChange={(v) => setSelectedStatus(v === "all" ? undefined : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por departamento */}
            <div>
              <label className="text-sm font-medium mb-2 block">Departamento</label>
              <Select 
                value={selectedDepartment?.toString() || "all"} 
                onValueChange={(v) => setSelectedDepartment(v === "all" ? undefined : parseInt(v))}
              >
                <SelectTrigger>
                  <Users className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por período - Data Início */}
            <div>
              <label className="text-sm font-medium mb-2 block">Data Início</label>
              <Input
                type="date"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>

            {/* Filtro por período - Data Fim */}
            <div>
              <label className="text-sm font-medium mb-2 block">Data Fim</label>
              <Input
                type="date"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button variant="outline" onClick={resetFilters}>
              Limpar Filtros
            </Button>
            <div className="text-sm text-gray-600">
              {data?.pagination.total || 0} PDIs encontrados
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de PDIs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              Página {data?.pagination.page || 1} de {data?.pagination.totalPages || 1}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Carregando...
            </div>
          ) : data?.pdis && data.pdis.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('employeeName')}
                        className="flex items-center gap-1"
                      >
                        Colaborador
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1"
                      >
                        Status
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('progress')}
                        className="flex items-center gap-1"
                      >
                        Progresso
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1"
                      >
                        Criado em
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pdis.map((pdi) => (
                    <TableRow key={pdi.id}>
                      <TableCell className="font-medium">{pdi.employeeName}</TableCell>
                      <TableCell>{pdi.employeePosition}</TableCell>
                      <TableCell>{pdi.departmentName}</TableCell>
                      <TableCell>{getStatusBadge(pdi.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pdi.overallProgress || 0} className="w-20 h-2" />
                          <span className="text-sm font-medium">{pdi.overallProgress || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pdi.createdAt ? format(new Date(pdi.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/pdi/${pdi.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, data.pagination.total)} de {data.pagination.total} resultados
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <div className="text-sm text-gray-600">
                    Página {page} de {data.pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum PDI encontrado</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou criar um novo PDI</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
