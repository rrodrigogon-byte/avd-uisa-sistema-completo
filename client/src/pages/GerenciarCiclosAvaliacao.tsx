import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2,
  PlayCircle,
  StopCircle,
  RefreshCw,
  Settings,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Gestão Completa de Ciclos de Avaliação
 * - Criar novos ciclos
 * - Configurar tipos de avaliação
 * - Gerar avaliações automaticamente
 * - Gerenciar ciclos ativos
 */

export default function GerenciarCiclosAvaliacao() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);

  // Form state para novo ciclo
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    evaluationType: "360" as "360" | "180" | "90",
    autoGenerate: true,
  });

  // Tipos de avaliação selecionados para geração
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["360"]);

  // Buscar ciclos
  const { data: cycles = [], refetch } = trpc.cycles.list.useQuery();

  // Criar ciclo
  const createCycle = trpc.cycles.create.useMutation({
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso!");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", startDate: "", endDate: "" });
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar ciclo", {
        description: error.message,
      });
    },
  });

  // Gerar avaliações
  const generateEvaluations = trpc.cycles.generateEvaluations.useMutation({
    onSuccess: (data: any) => {
      toast.success(`${data.count} avaliações geradas com sucesso!`);
      setGenerateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao gerar avaliações", {
        description: error.message,
      });
    },
  });

  // Finalizar ciclo
  const finalizeCycle = trpc.cycles.finalize.useMutation({
    onSuccess: () => {
      toast.success("Ciclo finalizado!");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao finalizar ciclo", {
        description: error.message,
      });
    },
  });

  // Reabrir ciclo
  const reopenCycle = trpc.cycles.reopen.useMutation({
    onSuccess: () => {
      toast.success("Ciclo reaberto!");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao reabrir ciclo", {
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      evaluationType: "360",
      autoGenerate: true,
    });
  };

  const handleCreateCycle = () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createCycle.mutate({
      name: formData.name,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      evaluationType: formData.evaluationType,
      autoGenerate: formData.autoGenerate,
    });
  };

  const handleGenerateEvaluations = () => {
    if (!selectedCycle) {
      toast.error("Selecione um ciclo");
      return;
    }

    if (selectedTypes.length === 0) {
      toast.error("Selecione pelo menos um tipo de avaliação");
      return;
    }

    generateEvaluations.mutate({
      cycleId: selectedCycle,
      types: selectedTypes as ("360" | "enhanced" | "integrated")[],
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      active: { label: "Ativo", variant: "default" },
      completed: { label: "Concluído", variant: "secondary" },
      draft: { label: "Rascunho", variant: "outline" },
    };

    const config = statusMap[status] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Ciclos de Avaliação</h1>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie ciclos de avaliação de desempenho
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ciclo
          </Button>
        </div>

        {/* Lista de Ciclos */}
        <Card>
          <CardHeader>
            <CardTitle>Ciclos de Avaliação</CardTitle>
            <CardDescription>
              Gerencie os ciclos de avaliação da organização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avaliações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum ciclo encontrado. Crie seu primeiro ciclo!
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((cycle: any) => (
                    <TableRow key={cycle.id}>
                      <TableCell className="font-medium">{cycle.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {format(new Date(cycle.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                          {format(new Date(cycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cycle.evaluationType || "360°"}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(cycle.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{cycle.evaluationsCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCycle(cycle.id);
                              setGenerateDialogOpen(true);
                            }}
                          >
                            <PlayCircle className="h-4 w-4 mr-1" />
                            Gerar
                          </Button>
                          {cycle.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => finalizeCycle.mutate({ cycleId: cycle.id })}
                            >
                              <StopCircle className="h-4 w-4 mr-1" />
                              Finalizar
                            </Button>
                          )}
                          {cycle.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reopenCycle.mutate({ cycleId: cycle.id })}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reabrir
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

        {/* Dialog: Criar Novo Ciclo */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Ciclo de Avaliação</DialogTitle>
              <DialogDescription>
                Configure o novo ciclo de avaliação de desempenho
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Ciclo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Avaliação de Desempenho 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva os objetivos e escopo deste ciclo..."
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

              <div className="space-y-2">
                <Label htmlFor="evaluationType">Tipo de Avaliação</Label>
                <Select
                  value={formData.evaluationType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, evaluationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="360">Avaliação 360° (Completa)</SelectItem>
                    <SelectItem value="180">Avaliação 180° (Gestor + Auto)</SelectItem>
                    <SelectItem value="90">Avaliação 90° (Apenas Gestor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoGenerate"
                  checked={formData.autoGenerate}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoGenerate: checked as boolean })
                  }
                />
                <Label htmlFor="autoGenerate" className="cursor-pointer">
                  Gerar avaliações automaticamente para todos os funcionários
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCycle} disabled={createCycle.isPending}>
                {createCycle.isPending ? "Criando..." : "Criar Ciclo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Gerar Avaliações */}
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Avaliações</DialogTitle>
              <DialogDescription>
                Selecione os tipos de avaliação para gerar automaticamente
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-360"
                    checked={selectedTypes.includes("360")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "360"]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "360"));
                      }
                    }}
                  />
                  <Label htmlFor="type-360" className="cursor-pointer">
                    Avaliação 360° (Autoavaliação + Gestor + Pares + Subordinados)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-enhanced"
                    checked={selectedTypes.includes("180")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "180"]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "180"));
                      }
                    }}
                  />
                  <Label htmlFor="type-enhanced" className="cursor-pointer">
                    Avaliação 180° (Gestor + Autoavaliação)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-integrated"
                    checked={selectedTypes.includes("90")}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTypes([...selectedTypes, "90"]);
                      } else {
                        setSelectedTypes(selectedTypes.filter((t) => t !== "90"));
                      }
                    }}
                  />
                  <Label htmlFor="type-integrated" className="cursor-pointer">
                    Avaliação 90° (Apenas Gestor)
                  </Label>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Atenção:</strong> As avaliações serão geradas para todos os funcionários ativos.
                  Este processo pode levar alguns minutos dependendo do número de colaboradores.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateEvaluations}
                disabled={generateEvaluations.isPending}
              >
                {generateEvaluations.isPending ? "Gerando..." : "Gerar Avaliações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
