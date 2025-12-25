import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Edit,
  Play,
  Pause,
  Archive,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Feedback360Cycles() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: cycles, isLoading, refetch } = trpc.feedback360New.listCycles.useQuery();
  const createCycleMutation = trpc.feedback360New.createCycle.useMutation();
  const updateCycleMutation = trpc.feedback360New.updateCycleStatus.useMutation();

  const filteredCycles = cycles?.filter((c) =>
    statusFilter === "all" ? true : c.status === statusFilter
  );

  const handleCreateCycle = async (data: any) => {
    try {
      await createCycleMutation.mutateAsync(data);
      toast.success("Ciclo criado com sucesso!");
      setCreateDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao criar ciclo");
    }
  };

  const handleUpdateStatus = async (cycleId: number, newStatus: string) => {
    try {
      await updateCycleMutation.mutateAsync({
        cycleId,
        status: newStatus as "draft" | "active" | "closed",
      });
      toast.success("Status atualizado com sucesso!");
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: "secondary", label: "Rascunho", icon: FileText },
      active: { variant: "default", label: "Ativo", icon: Play },
      closed: { variant: "outline", label: "Encerrado", icon: Pause },
      archived: { variant: "destructive", label: "Arquivado", icon: Archive },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (user?.role !== "admin" && user?.role !== "rh") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-4">
            <BackButton />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Feedback 360° - Ciclos</h1>
              <p className="text-muted-foreground">
                Gerencie ciclos de avaliação de feedback 360 graus
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ciclo
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="closed">Encerrado</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ciclos */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCycles && filteredCycles.length > 0 ? (
          <div className="grid gap-4">
            {filteredCycles.map((cycle) => (
              <Card key={cycle.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{cycle.name}</CardTitle>
                      {cycle.description && (
                        <CardDescription>{cycle.description}</CardDescription>
                      )}
                    </div>
                    {getStatusBadge(cycle.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Início</p>
                        <p className="text-sm font-medium">
                          {format(new Date(cycle.startDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Término</p>
                        <p className="text-sm font-medium">
                          {format(new Date(cycle.endDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Participantes</p>
                        <p className="text-sm font-medium">{cycle.totalParticipants}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Conclusão</p>
                        <p className="text-sm font-medium">{cycle.completionRate}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/feedback360/ciclo/${cycle.id}`;
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>

                    {cycle.status === "draft" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUpdateStatus(cycle.id, "active")}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ativar
                      </Button>
                    )}

                    {cycle.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(cycle.id, "closed")}
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Encerrar
                      </Button>
                    )}

                    {cycle.status === "closed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(cycle.id, "archived")}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Arquivar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg font-semibold">
                Nenhum ciclo encontrado
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Crie seu primeiro ciclo de feedback 360°
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Ciclo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação */}
      <CreateCycleDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateCycle}
        isLoading={createCycleMutation.isPending}
      />
    </DashboardLayout>
  );
}

interface CreateCycleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function CreateCycleDialog({ open, onClose, onSubmit, isLoading }: CreateCycleDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    allowSelfAssessment: true,
    minEvaluators: 3,
    maxEvaluators: 10,
    anonymousResponses: true,
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Ciclo de Feedback 360°</DialogTitle>
          <DialogDescription>
            Configure um novo ciclo de avaliação de feedback 360 graus
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Ciclo *</Label>
            <Input
              id="name"
              placeholder="Ex: Feedback 360° - 1º Semestre 2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o objetivo deste ciclo..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Término *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minEvaluators">Mínimo de Avaliadores</Label>
              <Input
                id="minEvaluators"
                type="number"
                min="1"
                value={formData.minEvaluators}
                onChange={(e) =>
                  setFormData({ ...formData, minEvaluators: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxEvaluators">Máximo de Avaliadores</Label>
              <Input
                id="maxEvaluators"
                type="number"
                min="1"
                value={formData.maxEvaluators}
                onChange={(e) =>
                  setFormData({ ...formData, maxEvaluators: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allowSelfAssessment"
              checked={formData.allowSelfAssessment}
              onChange={(e) =>
                setFormData({ ...formData, allowSelfAssessment: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="allowSelfAssessment" className="cursor-pointer">
              Permitir autoavaliação
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymousResponses"
              checked={formData.anonymousResponses}
              onChange={(e) =>
                setFormData({ ...formData, anonymousResponses: e.target.checked })
              }
              className="h-4 w-4"
            />
            <Label htmlFor="anonymousResponses" className="cursor-pointer">
              Respostas anônimas
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Criar Ciclo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
