import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { Download, FileText, Filter, Loader2, Eye, Search } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

/**
 * Página de Listagem de PDIs com Exportação CSV
 */
export default function PDIListagem() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    employeeId: undefined as number | undefined,
    departmentId: undefined as number | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });

  const { data: pdis, isLoading } = trpc.pdi.listWithFilters.useQuery({
    status: filters.status as any,
    employeeId: filters.employeeId,
    departmentId: filters.departmentId,
    page: 1,
    pageSize: 50,
  });

  const exportMutation = trpc.pdi.exportToCSV.useQuery(
    {
      status: filters.status as any,
      employeeId: filters.employeeId,
      departmentId: filters.departmentId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    },
    {
      enabled: false, // Só executa quando chamado manualmente
    }
  );

  const handleExportCSV = async () => {
    try {
      const result = await exportMutation.refetch();
      
      if (result.data) {
        // Criar blob e fazer download
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = result.data.filename;
        link.click();
        
        toast.success(`${result.data.count} PDIs exportados com sucesso!`);
      }
    } catch (error) {
      toast.error("Erro ao exportar PDIs");
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho" },
      pendente_aprovacao: { variant: "outline", label: "Pendente Aprovação" },
      aprovado: { variant: "default", label: "Aprovado" },
      em_andamento: { variant: "default", label: "Em Andamento" },
      concluido: { variant: "default", label: "Concluído" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">PDIs - Planos de Desenvolvimento</h1>
            <p className="text-muted-foreground mt-2">
              Visualize e exporte Planos de Desenvolvimento Individual
            </p>
          </div>
          <Button onClick={() => setLocation("/pdi/importacao")}>
            <FileText className="mr-2 h-4 w-4" />
            Importar PDI
          </Button>
        </div>

        {/* Card de Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre os PDIs por status, colaborador ou período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value === "todos" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="pendente_aprovacao">Pendente Aprovação</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={handleExportCSV}
                  variant="outline"
                  className="w-full"
                  disabled={exportMutation.isFetching}
                >
                  {exportMutation.isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar CSV
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Listagem */}
        <Card>
          <CardHeader>
            <CardTitle>
              PDIs Cadastrados
              {pdis && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({pdis.pagination.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !pdis || pdis.pdis.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum PDI encontrado</p>
                <p className="text-sm mt-2">
                  Ajuste os filtros ou importe um novo PDI
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Cargo Atual</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pdis.pdis.map((pdi) => (
                      <TableRow key={pdi.id}>
                        <TableCell className="font-medium">{pdi.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{pdi.employeeName}</div>
                            {pdi.employeePosition && (
                              <div className="text-sm text-muted-foreground">
                                {pdi.employeePosition}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{pdi.employeePosition || "-"}</TableCell>
                        <TableCell>{pdi.departmentName || "-"}</TableCell>
                        <TableCell>{getStatusBadge(pdi.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all"
                                style={{ width: `${pdi.overallProgress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium min-w-[3rem] text-right">
                              {pdi.overallProgress || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {pdi.startDate
                            ? new Date(pdi.startDate).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setLocation(`/pdi/${pdi.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
