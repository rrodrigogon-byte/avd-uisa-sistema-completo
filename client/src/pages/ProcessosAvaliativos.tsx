import { useState } from "react";
import { Plus, Search, Filter, Play, CheckCircle, XCircle, Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useNavigate } from "wouter";

export default function ProcessosAvaliativos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const { data: processes, isLoading, refetch } = trpc.evaluationProcesses.list.useQuery();
  const startMutation = trpc.evaluationProcesses.start.useMutation();
  const completeMutation = trpc.evaluationProcesses.complete.useMutation();
  const cancelMutation = trpc.evaluationProcesses.cancel.useMutation();
  const duplicateMutation = trpc.evaluationProcesses.duplicate.useMutation();
  const deleteMutation = trpc.evaluationProcesses.delete.useMutation();

  const filteredProcesses = processes?.filter((process) => {
    const matchesSearch =
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || process.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStart = async (id: number) => {
    try {
      await startMutation.mutateAsync({ id });
      toast.success("Processo iniciado com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao iniciar processo");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id });
      toast.success("Processo concluído com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao concluir processo");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelMutation.mutateAsync({ id });
      toast.success("Processo cancelado com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao cancelar processo");
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const result = await duplicateMutation.mutateAsync({ id });
      toast.success("Processo duplicado com sucesso!");
      refetch();
      navigate(`/processos-avaliativos/${result.id}/editar`);
    } catch (error) {
      toast.error("Erro ao duplicar processo");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este processo?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Processo deletado com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao deletar processo");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      rascunho: { variant: "secondary", label: "Rascunho" },
      em_andamento: { variant: "default", label: "Em Andamento" },
      concluido: { variant: "success", label: "Concluído" },
      cancelado: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status] || variants.rascunho;
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      "360": "360°",
      "180": "180°",
      "90": "90°",
      autoavaliacao: "Autoavaliação",
      gestor: "Gestor",
      pares: "Pares",
      subordinados: "Subordinados",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Processos Avaliativos</h1>
          <p className="text-muted-foreground">
            Gerencie processos completos de avaliação de desempenho
          </p>
        </div>
        <Button onClick={() => navigate("/processos-avaliativos/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Processos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes?.filter((p) => p.status === "em_andamento").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes?.filter((p) => p.status === "concluido").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes?.filter((p) => p.status === "rascunho").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busque e filtre processos avaliativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum processo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProcesses?.map((process) => (
                  <TableRow key={process.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{process.name}</div>
                        {process.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {process.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(process.type)}</TableCell>
                    <TableCell>{getStatusBadge(process.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(process.startDate).toLocaleDateString()}</div>
                        <div className="text-muted-foreground">
                          até {new Date(process.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(process.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {process.status === "rascunho" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStart(process.id)}
                            title="Iniciar"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        {process.status === "em_andamento" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleComplete(process.id)}
                              title="Concluir"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(process.id)}
                              title="Cancelar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/processos-avaliativos/${process.id}`)}
                          title="Ver Detalhes"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicate(process.id)}
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {process.status === "rascunho" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(process.id)}
                            title="Deletar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
