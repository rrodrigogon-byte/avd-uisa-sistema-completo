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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Plus,
  ThermometerSun,
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
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

export default function ClimaSurveysList() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [allowMultipleResponses, setAllowMultipleResponses] = useState(false);

  // Queries
  const { data: surveys, isLoading, refetch } = trpc.clima.listSurveys.useQuery({
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  });

  // Mutations
  const createSurvey = trpc.clima.createSurvey.useMutation({
    onSuccess: () => {
      toast.success("Pesquisa criada com sucesso!");
      setCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar pesquisa: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setIsAnonymous(true);
    setAllowMultipleResponses(false);
  };

  const handleCreateSurvey = () => {
    if (!title || !startDate || !endDate) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    createSurvey.mutate({
      title,
      description,
      startDate,
      endDate,
      isAnonymous,
      allowMultipleResponses,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      draft: { variant: "secondary", icon: Clock, label: "Rascunho" },
      active: { variant: "default", icon: Play, label: "Ativa" },
      closed: { variant: "outline", icon: Archive, label: "Encerrada" },
    };

    const config = variants[status] || variants.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pesquisa de Clima Organizacional</h1>
            <p className="text-muted-foreground">
              Avalie e monitore o clima organizacional da empresa
            </p>
          </div>
          {user.role === "admin" && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pesquisa
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="closed">Encerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pesquisas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : surveys && surveys.length > 0 ? (
          <div className="grid gap-4">
            {surveys.map((survey) => (
              <Card key={survey.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <ThermometerSun className="h-5 w-5 text-primary" />
                        <CardTitle className="text-xl">{survey.title}</CardTitle>
                      </div>
                      {survey.description && (
                        <CardDescription className="text-sm">
                          {survey.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(survey.status)}
                      {survey.isAnonymous && (
                        <Badge variant="outline">Anônima</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Início</p>
                        <p className="font-medium">
                          {format(new Date(survey.startDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Término</p>
                        <p className="font-medium">
                          {format(new Date(survey.endDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Respostas</p>
                        <p className="font-medium">{survey.responseCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Questões</p>
                        <p className="font-medium">{survey.questionCount || 0}</p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      {survey.status === "active" && (
                        <Link href={`/clima/responder/${survey.id}`}>
                          <Button variant="default" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Responder
                          </Button>
                        </Link>
                      )}
                      <Link href={`/clima/${survey.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </Link>
                      {user.role === "admin" && (
                        <>
                          <Link href={`/clima/${survey.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </Link>
                          <Link href={`/clima/${survey.id}/resultados`}>
                            <Button variant="outline" size="sm">
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Resultados
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ThermometerSun className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma pesquisa encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {user.role === "admin"
                  ? "Comece criando sua primeira pesquisa de clima"
                  : "Aguarde a criação de pesquisas pela administração"}
              </p>
              {user.role === "admin" && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Pesquisa
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Criação (apenas para admins) */}
      {user.role === "admin" && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Pesquisa de Clima</DialogTitle>
              <DialogDescription>
                Configure uma nova pesquisa para avaliar o clima organizacional
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Título da Pesquisa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pesquisa de Clima Q1 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo da pesquisa..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Data de Início <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">
                    Data de Término <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isAnonymous">Pesquisa Anônima</Label>
                    <p className="text-sm text-muted-foreground">
                      As respostas não serão vinculadas aos participantes
                    </p>
                  </div>
                  <Switch
                    id="isAnonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowMultiple">Permitir Múltiplas Respostas</Label>
                    <p className="text-sm text-muted-foreground">
                      Participantes podem responder mais de uma vez
                    </p>
                  </div>
                  <Switch
                    id="allowMultiple"
                    checked={allowMultipleResponses}
                    onCheckedChange={setAllowMultipleResponses}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSurvey} disabled={createSurvey.isPending}>
                {createSurvey.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Pesquisa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
