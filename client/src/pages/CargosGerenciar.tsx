import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Briefcase } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Gestão de Cargos
 * CRUD completo de cargos com descrições detalhadas
 */
export default function CargosGerenciar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    level: "",
    mission: "",
    responsibilities: [] as string[],
    technicalCompetencies: [] as string[],
    behavioralCompetencies: [] as string[],
  });

  // Queries
  const { data: positions = [], isLoading, refetch } = trpc.positionsManagement.list.useQuery({});
  const { data: stats } = trpc.positionsManagement.stats.useQuery({});

  // Mutations
  const createMutation = trpc.positionsManagement.create.useMutation({
    onSuccess: () => {
      toast.success("Cargo criado com sucesso!");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao criar cargo: ${error.message}`);
    },
  });

  const updateMutation = trpc.positionsManagement.update.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!");
      refetch();
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar cargo: ${error.message}`);
    },
  });

  const deactivateMutation = trpc.positionsManagement.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Cargo desativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao desativar cargo: ${error.message}`);
    },
  });

  // Handlers
  const openDialog = (position?: any) => {
    if (position) {
      setEditingPosition(position);
      setFormData({
        code: position.code || "",
        title: position.title || "",
        description: position.description || "",
        level: position.level || "",
        mission: position.mission || "",
        responsibilities: position.responsibilities || [],
        technicalCompetencies: position.technicalCompetencies || [],
        behavioralCompetencies: position.behavioralCompetencies || [],
      });
    } else {
      setEditingPosition(null);
      setFormData({
        code: "",
        title: "",
        description: "",
        level: "",
        mission: "",
        responsibilities: [],
        technicalCompetencies: [],
        behavioralCompetencies: [],
      });
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPosition(null);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.title) {
      toast.error("Código e título são obrigatórios");
      return;
    }

    if (editingPosition) {
      updateMutation.mutate({
        id: editingPosition.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDeactivate = (id: number) => {
    if (confirm("Tem certeza que deseja desativar este cargo?")) {
      deactivateMutation.mutate({ id });
    }
  };

  // Filtrar cargos
  const filteredPositions = positions.filter((pos: any) =>
    pos.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      junior: "bg-blue-100 text-blue-800",
      pleno: "bg-green-100 text-green-800",
      senior: "bg-purple-100 text-purple-800",
      especialista: "bg-orange-100 text-orange-800",
      coordenador: "bg-yellow-100 text-yellow-800",
      gerente: "bg-red-100 text-red-800",
      diretor: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={colors[level] || "bg-gray-100 text-gray-800"}>
        {level}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-8 w-8" />
            Gestão de Cargos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os cargos e suas descrições completas
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cargo
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cargos Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cargos Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Níveis Diferentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byLevel).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Cargos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os cargos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : filteredPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cargo encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPositions.map((position: any) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-mono">{position.code}</TableCell>
                    <TableCell className="font-medium">{position.title}</TableCell>
                    <TableCell>
                      {position.level ? getLevelBadge(position.level) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={position.active ? "default" : "secondary"}>
                        {position.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDialog(position)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeactivate(position.id)}
                          disabled={!position.active}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPosition ? "Editar Cargo" : "Novo Cargo"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do cargo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: DEV-001"
                />
              </div>
              <div>
                <Label htmlFor="level">Nível</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="pleno">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="especialista">Especialista</SelectItem>
                    <SelectItem value="coordenador">Coordenador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="diretor">Diretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Desenvolvedor Full Stack"
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição geral do cargo"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="mission">Missão do Cargo</Label>
              <Textarea
                id="mission"
                value={formData.mission}
                onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                placeholder="Qual é a missão principal deste cargo?"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingPosition ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
