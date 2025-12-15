import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Edit, Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

export default function GestaoQuestoesPIRIntegridade() {
  const [, navigate] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [filterDimension, setFilterDimension] = useState<string>("all");

  const { data: questionsData, isLoading, refetch } = trpc.pirIntegrity.listQuestions.useQuery({
    dimensionId: filterDimension === "all" ? undefined : parseInt(filterDimension),
    limit: 100,
  });
  const { data: dimensionsData } = trpc.pirIntegrity.listDimensions.useQuery();
  
  const createQuestion = trpc.pirIntegrity.createQuestion.useMutation({
    onSuccess: () => { toast.success("Questão criada!"); refetch(); setIsDialogOpen(false); },
    onError: () => toast.error("Erro ao criar questão"),
  });
  const updateQuestion = trpc.pirIntegrity.updateQuestion.useMutation({
    onSuccess: () => { toast.success("Questão atualizada!"); refetch(); setIsDialogOpen(false); },
    onError: () => toast.error("Erro ao atualizar questão"),
  });

  const [form, setForm] = useState({
    dimensionId: 1,
    questionType: "scenario" as const,
    title: "",
    scenario: "",
    question: "",
    difficulty: "medium" as const,
    requiresJustification: false,
    options: [
      { value: "a", label: "", score: 0, moralLevel: "conventional" as const },
      { value: "b", label: "", score: 0, moralLevel: "conventional" as const },
      { value: "c", label: "", score: 0, moralLevel: "conventional" as const },
      { value: "d", label: "", score: 0, moralLevel: "conventional" as const },
    ],
  });

  const handleSubmit = () => {
    if (!form.title || !form.question) {
      toast.error("Preencha título e questão");
      return;
    }
    if (editingQuestion) {
      updateQuestion.mutate({ id: editingQuestion.id, ...form });
    } else {
      createQuestion.mutate(form);
    }
  };

  const openEditDialog = (q: any) => {
    setEditingQuestion(q);
    const opts = q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [];
    setForm({
      dimensionId: q.dimensionId,
      questionType: q.questionType,
      title: q.title,
      scenario: q.scenario || "",
      question: q.question,
      difficulty: q.difficulty,
      requiresJustification: q.requiresJustification,
      options: opts.length > 0 ? opts : form.options,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingQuestion(null);
    setForm({
      dimensionId: 1,
      questionType: "scenario",
      title: "",
      scenario: "",
      question: "",
      difficulty: "medium",
      requiresJustification: false,
      options: [
        { value: "a", label: "", score: 0, moralLevel: "conventional" },
        { value: "b", label: "", score: 0, moralLevel: "conventional" },
        { value: "c", label: "", score: 0, moralLevel: "conventional" },
        { value: "d", label: "", score: 0, moralLevel: "conventional" },
      ],
    });
    setIsDialogOpen(true);
  };

  const updateOption = (idx: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === idx ? { ...o, [field]: value } : o),
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate("/pir-integridade")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Gestão de Questões PIR Integridade
            </h1>
          </div>
          <div className="flex gap-2">
            <Select value={filterDimension} onValueChange={setFilterDimension}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar dimensão" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Dimensões</SelectItem>
                {dimensionsData?.dimensions.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openNewDialog}><Plus className="h-4 w-4 mr-2" />Nova Questão</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {questionsData?.questions.map(q => {
              const dim = dimensionsData?.dimensions.find(d => d.id === q.dimensionId);
              return (
                <Card key={q.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>{dim?.code || "?"}</Badge>
                        <Badge variant={q.difficulty === "easy" ? "outline" : q.difficulty === "hard" ? "destructive" : "secondary"}>
                          {q.difficulty}
                        </Badge>
                        <CardTitle className="text-lg">{q.title}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(q)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {q.scenario && <p className="text-sm text-gray-600 mb-2 p-2 bg-gray-50 rounded">{q.scenario}</p>}
                    <p className="font-medium">{q.question}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Editar Questão" : "Nova Questão"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Dimensão</Label>
                  <Select value={form.dimensionId.toString()} onValueChange={v => setForm(p => ({ ...p, dimensionId: parseInt(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dimensionsData?.dimensions.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dificuldade</Label>
                  <Select value={form.difficulty} onValueChange={v => setForm(p => ({ ...p, difficulty: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <Label>Cenário (opcional)</Label>
                <Textarea value={form.scenario} onChange={e => setForm(p => ({ ...p, scenario: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>Questão</Label>
                <Textarea value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.requiresJustification} onCheckedChange={v => setForm(p => ({ ...p, requiresJustification: v }))} />
                <Label>Requer justificativa</Label>
              </div>
              <div className="space-y-3">
                <Label>Opções de Resposta</Label>
                {form.options.map((opt, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <span className="col-span-1 font-bold">{opt.value.toUpperCase()})</span>
                    <Input className="col-span-5" placeholder="Texto da opção" value={opt.label} onChange={e => updateOption(idx, "label", e.target.value)} />
                    <Input className="col-span-2" type="number" placeholder="Score" value={opt.score} onChange={e => updateOption(idx, "score", parseInt(e.target.value) || 0)} />
                    <Select value={opt.moralLevel} onValueChange={v => updateOption(idx, "moralLevel", v)}>
                      <SelectTrigger className="col-span-4"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pre_conventional">Pré-Conv.</SelectItem>
                        <SelectItem value="conventional">Convencional</SelectItem>
                        <SelectItem value="post_conventional">Pós-Conv.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={createQuestion.isPending || updateQuestion.isPending}>
                {(createQuestion.isPending || updateQuestion.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingQuestion ? "Salvar Alterações" : "Criar Questão"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
