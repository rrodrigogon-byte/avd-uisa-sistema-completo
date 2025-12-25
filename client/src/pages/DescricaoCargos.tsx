import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Eye, Briefcase, FileText, Loader2, Search, Filter } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function DescricaoCargos() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Buscar descrições de cargos
  const { data: jobDescriptions, isLoading } = trpc.jobDescriptions.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
    departmentId: departmentFilter === "all" ? undefined : parseInt(departmentFilter),
  });

  // Buscar departamentos para filtro
  const { data: departments } = trpc.departments.list.useQuery({});

  const descriptions = jobDescriptions || [];

  // Filtrar por termo de busca
  const filteredDescriptions = descriptions.filter(desc =>
    desc.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (desc.departmentName && desc.departmentName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Rascunho" },
      pending_approval: { variant: "default", label: "Pendente" },
      approved: { variant: "default", label: "Aprovado" },
      rejected: { variant: "destructive", label: "Rejeitado" },
    };
    const config = colors[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Estatísticas
  const totalDescriptions = descriptions.length;
  const approvedCount = descriptions.filter(d => d.status === 'approved').length;
  const pendingCount = descriptions.filter(d => d.status === 'pending_approval').length;
  const uniqueDepartments = new Set(descriptions.map(d => d.departmentName).filter(Boolean)).size;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Descrição de Cargos</h1>
            <p className="text-muted-foreground">
              Gerencie descrições de cargos, responsabilidades e competências
            </p>
          </div>
          <Button onClick={() => setLocation("/descricao-cargos/criar")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Descrição
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Descrições</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDescriptions}</div>
              <p className="text-xs text-muted-foreground">
                Cargos cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">
                {totalDescriptions > 0 ? Math.round((approvedCount / totalDescriptions) * 100) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueDepartments}</div>
              <p className="text-xs text-muted-foreground">
                Com descrições cadastradas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cargo ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="pending_approval">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os departamentos</SelectItem>
                  {departments?.map(dept => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Descrições */}
        <Card>
          <CardHeader>
            <CardTitle>Descrições de Cargos</CardTitle>
            <CardDescription>
              {filteredDescriptions.length} descrição(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDescriptions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma descrição de cargo encontrada
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setLocation("/descricao-cargos/criar")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Descrição
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDescriptions.map((desc) => (
                      <TableRow key={desc.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{desc.positionTitle}</div>
                            {desc.positionCode && (
                              <div className="text-sm text-muted-foreground">
                                {desc.positionCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{desc.departmentName || "-"}</TableCell>
                        <TableCell>{getStatusBadge(desc.status)}</TableCell>
                        <TableCell>
                          {new Date(desc.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setLocation(`/descricao-cargos/${desc.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {desc.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setLocation(`/descricao-cargos/editar/${desc.id}`)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
