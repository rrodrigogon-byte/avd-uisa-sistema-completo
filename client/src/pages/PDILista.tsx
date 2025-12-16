import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, FileText, Eye, Edit, Trash2, Upload } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PDILista() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: pdis, isLoading, refetch } = trpc.pdi.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter as any,
  });

  const deleteMutation = trpc.pdi.delete.useMutation({
    onSuccess: () => {
      toast.success("PDI excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir PDI: ${error.message}`);
    },
  });

  const handleDelete = (id: number, employeeName: string) => {
    if (confirm(`Tem certeza que deseja excluir o PDI de ${employeeName}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho" },
      pendente_aprovacao: { variant: "default", label: "Pendente Aprovação" },
      aprovado: { variant: "default", label: "Aprovado" },
      em_andamento: { variant: "default", label: "Em Andamento" },
      concluido: { variant: "default", label: "Concluído" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredPdis = pdis?.filter((pdi) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      pdi.employeeName?.toLowerCase().includes(query) ||
      pdi.employeePosition?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Planos de Desenvolvimento Individual (PDI)
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie os PDIs dos colaboradores
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pdi/importar">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar HTML
              </Button>
            </Link>
            <Link href="/pdi/criar">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo PDI
              </Button>
            </Link>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre os PDIs por status ou busque por nome</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou cargo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="pendente_aprovacao">Pendente Aprovação</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de PDIs */}
        <Card>
          <CardHeader>
            <CardTitle>PDIs Cadastrados</CardTitle>
            <CardDescription>
              {filteredPdis?.length || 0} PDI(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredPdis && filteredPdis.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Início</TableHead>
                      <TableHead>Término</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPdis.map((pdi) => (
                      <TableRow key={pdi.id}>
                        <TableCell className="font-medium">
                          {pdi.employeeName || "N/A"}
                        </TableCell>
                        <TableCell>{pdi.employeePosition || "N/A"}</TableCell>
                        <TableCell>{getStatusBadge(pdi.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${pdi.overallProgress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {pdi.overallProgress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {pdi.startDate
                            ? format(new Date(pdi.startDate), "dd/MM/yyyy", { locale: ptBR })
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {pdi.endDate
                            ? format(new Date(pdi.endDate), "dd/MM/yyyy", { locale: ptBR })
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/pdi/${pdi.id}`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/pdi/${pdi.id}/editar`}>
                              <Button variant="ghost" size="sm" className="gap-1">
                                <Edit className="h-4 w-4" />
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(pdi.id, pdi.employeeName || "este funcionário")}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum PDI encontrado
                </h3>
                <p className="text-gray-600 mb-4">
                  Comece criando um novo PDI ou importe de um arquivo HTML
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/pdi/importar">
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Importar HTML
                    </Button>
                  </Link>
                  <Link href="/pdi/criar">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Criar PDI
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
