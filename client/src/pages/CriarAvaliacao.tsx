import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionBuilder, Question } from "@/components/QuestionBuilder";
import { EvaluationPreview } from "@/components/EvaluationPreview";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Send, 
  FileText,
  Calendar,
  Users,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EvaluationStatus = "rascunho" | "ativa" | "encerrada";

export default function CriarAvaliacao() {
  const [, setLocation] = useLocation();
  const [currentTab, setCurrentTab] = useState("informacoes");
  const [showPreview, setShowPreview] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "desempenho",
    startDate: "",
    endDate: "",
    targetAudience: "todos",
    estimatedTime: 15,
    status: "rascunho" as EvaluationStatus,
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  // Mutations
  const saveDraftMutation = trpc.evaluations.saveDraft.useMutation({
    onSuccess: () => {
      toast.success("Rascunho salvo com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const publishMutation = trpc.evaluations.publish.useMutation({
    onSuccess: () => {
      toast.success("Avaliação publicada com sucesso!");
      setLocation("/avaliacoes");
    },
    onError: (error) => {
      toast.error(`Erro ao publicar: ${error.message}`);
    },
  });

  const handleSaveDraft = () => {
    if (!formData.title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    saveDraftMutation.mutate({
      ...formData,
      questions: JSON.stringify(questions),
      status: "rascunho",
    });
  };

  const handlePublish = () => {
    // Validações
    if (!formData.title.trim()) {
      toast.error("O título é obrigatório");
      setCurrentTab("informacoes");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error("As datas de início e término são obrigatórias");
      setCurrentTab("informacoes");
      return;
    }

    if (questions.length === 0) {
      toast.error("Adicione pelo menos uma questão");
      setCurrentTab("questoes");
      return;
    }

    const incompleteQuestions = questions.filter(q => !q.title.trim());
    if (incompleteQuestions.length > 0) {
      toast.error("Todas as questões devem ter um título");
      setCurrentTab("questoes");
      return;
    }

    setShowPublishDialog(true);
  };

  const confirmPublish = () => {
    publishMutation.mutate({
      ...formData,
      questions: JSON.stringify(questions),
      status: "ativa",
    });
    setShowPublishDialog(false);
  };

  const getStatusBadge = (status: EvaluationStatus) => {
    const config = {
      rascunho: { variant: "outline" as const, label: "Rascunho" },
      ativa: { variant: "default" as const, label: "Ativa" },
      encerrada: { variant: "secondary" as const, label: "Encerrada" },
    };
    const { variant, label } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.startDate &&
      formData.endDate &&
      questions.length > 0 &&
      questions.every(q => q.title.trim())
    );
  };

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/avaliacoes")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Nova Avaliação</h1>
                <p className="text-muted-foreground">
                  Crie uma avaliação de desempenho personalizada
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(formData.status)}
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={questions.length === 0}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!formData.title.trim() || saveDraftMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!isFormValid() || publishMutation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informacoes" className="gap-2">
              <FileText className="h-4 w-4" />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger value="questoes" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Questões ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="gap-2">
              <Users className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações Básicas */}
          <TabsContent value="informacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Avaliação</CardTitle>
                <CardDescription>
                  Defina o título, descrição e período da avaliação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Título da Avaliação <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ex: Avaliação de Desempenho 2025"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva o objetivo e contexto desta avaliação..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Avaliação</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desempenho">Desempenho</SelectItem>
                        <SelectItem value="competencias">Competências</SelectItem>
                        <SelectItem value="360">360 Graus</SelectItem>
                        <SelectItem value="metas">Metas</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      min="5"
                      max="120"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">
                      Data de Início <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">
                      Data de Término <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Questões */}
          <TabsContent value="questoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Questões da Avaliação</CardTitle>
                <CardDescription>
                  Adicione e configure as questões que farão parte desta avaliação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionBuilder
                  questions={questions}
                  onChange={setQuestions}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Configurações */}
          <TabsContent value="configuracoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Público-Alvo e Notificações</CardTitle>
                <CardDescription>
                  Configure quem receberá esta avaliação e como serão notificados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Público-Alvo</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                  >
                    <SelectTrigger id="targetAudience">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Colaboradores</SelectItem>
                      <SelectItem value="gestores">Apenas Gestores</SelectItem>
                      <SelectItem value="equipe">Equipe Específica</SelectItem>
                      <SelectItem value="departamento">Departamento</SelectItem>
                      <SelectItem value="custom">Seleção Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium">Notificações Automáticas</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Email de convite ao publicar a avaliação</p>
                    <p>✓ Lembrete 3 dias antes do prazo</p>
                    <p>✓ Lembrete 1 dia antes do prazo</p>
                    <p>✓ Notificação de conclusão para gestores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview da Avaliação</DialogTitle>
            <DialogDescription>
              Visualize como a avaliação será apresentada aos colaboradores
            </DialogDescription>
          </DialogHeader>
          <EvaluationPreview
            title={formData.title}
            description={formData.description}
            questions={questions}
            startDate={formData.startDate ? new Date(formData.startDate) : undefined}
            endDate={formData.endDate ? new Date(formData.endDate) : undefined}
            targetAudience={formData.targetAudience}
            estimatedTime={formData.estimatedTime}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Publicação */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Publicação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja publicar esta avaliação? Após publicada, ela será enviada para os colaboradores selecionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Resumo:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {questions.length} questões</li>
                <li>• Período: {formData.startDate} até {formData.endDate}</li>
                <li>• Público: {formData.targetAudience}</li>
                <li>• Tempo estimado: {formData.estimatedTime} minutos</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmPublish} disabled={publishMutation.isPending}>
              {publishMutation.isPending ? "Publicando..." : "Confirmar Publicação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
