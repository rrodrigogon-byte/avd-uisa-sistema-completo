import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  User,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Status = "pendente" | "em_andamento" | "concluida" | "cancelada";
type Prioridade = "baixa" | "media" | "alta" | "urgente";

interface PendenciaFormData {
  titulo: string;
  descricao: string;
  status: Status;
  prioridade: Prioridade;
  responsavelId: number;
  dataVencimento: string;
  dataInicio: string;
  categoria: string;
  progresso: number;
  observacoes: string;
}

const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: AlertCircle,
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  concluida: {
    label: "Concluída",
    icon: CheckCircle2,
    color: "bg-green-500/10 text-green-700 border-green-500/20",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  },
};

const prioridadeConfig = {
  baixa: {
    label: "Baixa",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  },
  media: {
    label: "Média",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  alta: {
    label: "Alta",
    color: "bg-orange-500/10 text-orange-700 border-orange-500/20",
  },
  urgente: {
    label: "Urgente",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
  },
};

export default function Pendencias() {
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState<Prioridade | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPendencia, setSelectedPendencia] = useState<any>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: pendencias, isLoading } = trpc.pendencias.list.useQuery({
    status: statusFilter !== "all" ? statusFilter : undefined,
    prioridade: prioridadeFilter !== "all" ? prioridadeFilter : undefined,
  });

  const { data: stats } = trpc.pendencias.countByStatus.useQuery();
  const { data: employees } = trpc.employees.list.useQuery();

  // Mutations
  const createMutation = trpc.pendencias.create.useMutation({
    onSuccess: () => {
      toast.success("Pendência criada com sucesso!");
      utils.pendencias.list.invalidate();
      utils.pendencias.countByStatus.invalidate();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar pendência");
    },
  });

  const updateMutation = trpc.pendencias.update.useMutation({
    onSuccess: () => {
      toast.success("Pendência atualizada com sucesso!");
      utils.pendencias.list.invalidate();
      utils.pendencias.countByStatus.invalidate();
      setIsEditDialogOpen(false);
      setSelectedPendencia(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar pendência");
    },
  });

  const deleteMutation = trpc.pendencias.delete.useMutation({
    onSuccess: () => {
      toast.success("Pendência excluída com sucesso!");
      utils.pendencias.list.invalidate();
      utils.pendencias.countByStatus.invalidate();
      setIsDeleteDialogOpen(false);
      setSelectedPendencia(null);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir pendência");
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      titulo: formData.get("titulo") as string,
      descricao: formData.get("descricao") as string,
      status: formData.get("status") as Status,
      prioridade: formData.get("prioridade") as Prioridade,
      responsavelId: Number(formData.get("responsavelId")),
      dataVencimento: formData.get("dataVencimento") as string,
      dataInicio: formData.get("dataInicio") as string,
      categoria: formData.get("categoria") as string,
      progresso: Number(formData.get("progresso")),
      observacoes: formData.get("observacoes") as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPendencia) return;
    
    const formData = new FormData(e.currentTarget);
    
    updateMutation.mutate({
      id: selectedPendencia.id,
      titulo: formData.get("titulo") as string,
      descricao: formData.get("descricao") as string,
      status: formData.get("status") as Status,
      prioridade: formData.get("prioridade") as Prioridade,
      responsavelId: Number(formData.get("responsavelId")),
      dataVencimento: formData.get("dataVencimento") as string,
      dataInicio: formData.get("dataInicio") as string,
      categoria: formData.get("categoria") as string,
      progresso: Number(formData.get("progresso")),
      observacoes: formData.get("observacoes") as string,
    });
  };

  const handleDelete = () => {
    if (!selectedPendencia) return;
    deleteMutation.mutate({ id: selectedPendencia.id });
  };

  const filteredPendencias = pendencias?.filter((p) =>
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pendências</h1>
          <p className="text-muted-foreground">
            Gerencie suas tarefas e pendências
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pendência
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendente || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.em_andamento || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.concluida || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cancelada || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pendências..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={prioridadeFilter} onValueChange={(v) => setPrioridadeFilter(v as Prioridade | "all")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pendências List */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_: any, i: number) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))
        ) : filteredPendencias && filteredPendencias.length > 0 ? (
          filteredPendencias.map((pendencia: any) => {
            const StatusIcon = statusConfig[pendencia.status as Status].icon;
            const employee = employees?.find(e => e.id === pendencia.responsavelId);
            
            return (
              <Card key={pendencia.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{pendencia.titulo}</CardTitle>
                        <Badge className={statusConfig[pendencia.status as Status].color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusConfig[pendencia.status as Status].label}
                        </Badge>
                        <Badge className={prioridadeConfig[pendencia.prioridade as Prioridade].color}>
                          {prioridadeConfig[pendencia.prioridade as Prioridade].label}
                        </Badge>
                      </div>
                      {pendencia.descricao && (
                        <CardDescription className="text-base">
                          {pendencia.descricao}
                        </CardDescription>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {employee && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {employee.name}
                          </div>
                        )}
                        {pendencia.dataVencimento && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Vence em: {format(new Date(pendencia.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                        {pendencia.categoria && (
                          <div className="flex items-center gap-1">
                            <Tag className="h-4 w-4" />
                            {pendencia.categoria}
                          </div>
                        )}
                      </div>
                      {pendencia.progresso > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{pendencia.progresso}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${pendencia.progresso}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPendencia(pendencia);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPendencia(pendencia);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma pendência encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Pendência</DialogTitle>
            <DialogDescription>
              Crie uma nova tarefa ou pendência
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input id="titulo" name="titulo" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" name="descricao" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue="pendente" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade *</Label>
                <Select name="prioridade" defaultValue="media" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavelId">Responsável *</Label>
                <Select name="responsavelId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((emp: any) => emp.id ? (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name}
                      </SelectItem>
                    ) : null)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input id="categoria" name="categoria" placeholder="Ex: Avaliação, Meta, PDI" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input id="dataInicio" name="dataInicio" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Data de Vencimento</Label>
                <Input id="dataVencimento" name="dataVencimento" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="progresso">Progresso (%)</Label>
                <Input id="progresso" name="progresso" type="number" min="0" max="100" defaultValue="0" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea id="observacoes" name="observacoes" rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Pendência"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Pendência</DialogTitle>
            <DialogDescription>
              Atualize as informações da pendência
            </DialogDescription>
          </DialogHeader>
          {selectedPendencia && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-titulo">Título *</Label>
                  <Input id="edit-titulo" name="titulo" defaultValue={selectedPendencia.titulo} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea id="edit-descricao" name="descricao" rows={3} defaultValue={selectedPendencia.descricao || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status *</Label>
                  <Select name="status" defaultValue={selectedPendencia.status} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prioridade">Prioridade *</Label>
                  <Select name="prioridade" defaultValue={selectedPendencia.prioridade} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-responsavelId">Responsável *</Label>
                  <Select name="responsavelId" defaultValue={selectedPendencia.responsavelId ? selectedPendencia.responsavelId.toString() : ""} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((emp: any) => emp.id ? (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ) : null)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-categoria">Categoria</Label>
                  <Input id="edit-categoria" name="categoria" defaultValue={selectedPendencia.categoria || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataInicio">Data de Início</Label>
                  <Input
                    id="edit-dataInicio"
                    name="dataInicio"
                    type="date"
                    defaultValue={selectedPendencia.dataInicio ? format(new Date(selectedPendencia.dataInicio), "yyyy-MM-dd") : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dataVencimento">Data de Vencimento</Label>
                  <Input
                    id="edit-dataVencimento"
                    name="dataVencimento"
                    type="date"
                    defaultValue={selectedPendencia.dataVencimento ? format(new Date(selectedPendencia.dataVencimento), "yyyy-MM-dd") : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progresso">Progresso (%)</Label>
                  <Input id="edit-progresso" name="progresso" type="number" min="0" max="100" defaultValue={selectedPendencia.progresso} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-observacoes">Observações</Label>
                  <Textarea id="edit-observacoes" name="observacoes" rows={2} defaultValue={selectedPendencia.observacoes || ""} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a pendência "{selectedPendencia?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
