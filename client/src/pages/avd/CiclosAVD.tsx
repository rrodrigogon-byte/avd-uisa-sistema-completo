import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, CheckCircle, Clock, Play, Plus, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CiclosAVD() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedStatus, setSelectedStatus] = useState<string>();

  const { data: cycles, isLoading, refetch } = trpc.avdUisa.listCycles.useQuery({
    year: selectedYear,
    status: selectedStatus as any,
  });

  const createCycleMutation = trpc.avdUisa.createCycle.useMutation({
    onSuccess: () => {
      toast.success("Ciclo criado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar ciclo");
    },
  });

  const activateCycleMutation = trpc.avdUisa.activateCycle.useMutation({
    onSuccess: () => {
      toast.success("Ciclo ativado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao ativar ciclo");
    },
  });

  const handleCreateCycle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const selfDeadline = formData.get("selfEvaluationDeadline") ? new Date(formData.get("selfEvaluationDeadline") as string) : undefined;
    const managerDeadline = formData.get("managerEvaluationDeadline") ? new Date(formData.get("managerEvaluationDeadline") as string) : undefined;
    const consensusDeadline = formData.get("consensusDeadline") ? new Date(formData.get("consensusDeadline") as string) : undefined;

    createCycleMutation.mutate({
      name: formData.get("name") as string,
      year: parseInt(formData.get("year") as string),
      type: formData.get("type") as "anual" | "semestral" | "trimestral",
      startDate,
      endDate,
      description: formData.get("description") as string || undefined,
      selfEvaluationDeadline: selfDeadline,
      managerEvaluationDeadline: managerDeadline,
      consensusDeadline: consensusDeadline,
    });
  };

  const handleActivateCycle = (cycleId: number) => {
    if (confirm("Tem certeza que deseja ativar este ciclo? Isso iniciará o processo de avaliação.")) {
      activateCycleMutation.mutate({ cycleId });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      planejado: { variant: "outline", icon: Clock },
      ativo: { variant: "default", icon: Play },
      concluido: { variant: "secondary", icon: CheckCircle },
      cancelado: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.planejado;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ciclos de Avaliação AVD</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os períodos de avaliação de desempenho da instituição
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ciclo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleCreateCycle}>
                <DialogHeader>
                  <DialogTitle>Criar Novo Ciclo de Avaliação</DialogTitle>
                  <DialogDescription>
                    Configure o período e prazos para o novo ciclo de avaliação
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Ciclo *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Ex: Avaliação Anual 2024"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Ano *</Label>
                      <Select name="year" required defaultValue={currentYear.toString()}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year: any) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Ciclo *</Label>
                    <Select name="type" required defaultValue="anual">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anual">Anual</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de Início *</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data de Término *</Label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Descreva os objetivos e características deste ciclo..."
                      rows={3}
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Prazos das Etapas</h4>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="selfEvaluationDeadline">Prazo para Autoavaliação</Label>
                        <Input
                          id="selfEvaluationDeadline"
                          name="selfEvaluationDeadline"
                          type="date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="managerEvaluationDeadline">Prazo para Avaliação do Gestor</Label>
                        <Input
                          id="managerEvaluationDeadline"
                          name="managerEvaluationDeadline"
                          type="date"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="consensusDeadline">Prazo para Consenso</Label>
                        <Input
                          id="consensusDeadline"
                          name="consensusDeadline"
                          type="date"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCycleMutation.isPending}>
                    {createCycleMutation.isPending ? "Criando..." : "Criar Ciclo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select
                  value={selectedYear?.toString() || "all"}
                  onValueChange={(value) => setSelectedYear(value === "all" ? undefined : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map((year: any) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus || "all"}
                  onValueChange={(value) => setSelectedStatus(value === "all" ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="planejado">Planejado</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ciclos */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando ciclos...</p>
          </div>
        ) : cycles && cycles.length > 0 ? (
          <div className="grid gap-4">
            {cycles.map((cycle: any) => (
              <Card key={cycle.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle>{cycle.name}</CardTitle>
                        {getStatusBadge(cycle.status)}
                      </div>
                      <CardDescription>
                        {cycle.type.charAt(0).toUpperCase() + cycle.type.slice(1)} • Ano {cycle.year}
                      </CardDescription>
                    </div>

                    {cycle.status === "planejado" && (
                      <Button
                        size="sm"
                        onClick={() => handleActivateCycle(cycle.id)}
                        disabled={activateCycleMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Ativar Ciclo
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Período</span>
                      </div>
                      <p className="text-sm font-medium">
                        {format(new Date(cycle.startDate), "dd/MM/yyyy", { locale: ptBR })} até{" "}
                        {format(new Date(cycle.endDate), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    {cycle.selfEvaluationDeadline && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Autoavaliação até</span>
                        </div>
                        <p className="text-sm font-medium">
                          {format(new Date(cycle.selfEvaluationDeadline), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    )}

                    {cycle.managerEvaluationDeadline && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Avaliação Gestor até</span>
                        </div>
                        <p className="text-sm font-medium">
                          {format(new Date(cycle.managerEvaluationDeadline), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>

                  {cycle.description && (
                    <p className="text-sm text-muted-foreground mt-4">{cycle.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ciclo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {selectedYear || selectedStatus
                  ? "Tente ajustar os filtros ou criar um novo ciclo."
                  : "Comece criando o primeiro ciclo de avaliação."}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Ciclo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
