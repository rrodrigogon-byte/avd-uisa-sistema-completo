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
import { ArrowLeft, Edit, Loader2, Plus, Shield, Trash2, Upload, Video, X } from "lucide-react";
import { useState } from "react";
import { safeMap, ensureArray } from "@/lib/arrayHelpers";

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
    // Campos de vídeo
    videoUrl: "",
    videoThumbnailUrl: "",
    videoDuration: 0,
    requiresVideoWatch: false,
  });
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  
  const uploadVideo = trpc.pirVideoUpload.uploadVideo.useMutation();
  const uploadThumbnail = trpc.pirVideoUpload.uploadThumbnail.useMutation();

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
                {safeMap(dimensionsData?.dimensions, d => (
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
            {safeMap(questionsData?.questions, q => {
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
                      {safeMap(dimensionsData?.dimensions, d => (
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
              
              {/* Seção de Upload de Vídeo */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Vídeo da Questão (Opcional)
                  </Label>
                  {form.videoUrl && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setForm(p => ({ ...p, videoUrl: "", videoThumbnailUrl: "", videoDuration: 0 }))}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover Vídeo
                    </Button>
                  )}
                </div>
                
                {form.videoUrl ? (
                  <div className="space-y-2">
                    <video 
                      src={form.videoUrl} 
                      controls 
                      className="w-full rounded-lg border"
                      poster={form.videoThumbnailUrl || undefined}
                    />
                    <p className="text-sm text-gray-600">
                      Duração: {Math.floor(form.videoDuration / 60)}:{(form.videoDuration % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label>Upload de Vídeo</Label>
                      <Input 
                        type="file" 
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setVideoFile(file);
                            // Obter duração do vídeo
                            const video = document.createElement('video');
                            video.preload = 'metadata';
                            video.onloadedmetadata = () => {
                              setForm(p => ({ ...p, videoDuration: Math.floor(video.duration) }));
                            };
                            video.src = URL.createObjectURL(file);
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Formatos aceitos: MP4, WebM, MOV. Tamanho máximo: 50MB
                      </p>
                    </div>
                    
                    <div>
                      <Label>Thumbnail (Opcional)</Label>
                      <Input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setThumbnailFile(file);
                        }}
                      />
                    </div>
                    
                    {videoFile && (
                      <Button 
                        type="button"
                        onClick={async () => {
                          setUploadingVideo(true);
                          try {
                            // Upload vídeo
                            const videoBase64 = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64 = (reader.result as string).split(',')[1];
                                resolve(base64);
                              };
                              reader.readAsDataURL(videoFile);
                            });
                            
                            const videoResult = await uploadVideo.mutateAsync({
                              questionId: editingQuestion?.id || 0,
                              videoBase64,
                              fileName: videoFile.name,
                              mimeType: videoFile.type,
                              duration: form.videoDuration,
                            });
                            
                            // Upload thumbnail se houver
                            let thumbnailUrl = "";
                            if (thumbnailFile) {
                              const thumbnailBase64 = await new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = (reader.result as string).split(',')[1];
                                  resolve(base64);
                                };
                                reader.readAsDataURL(thumbnailFile);
                              });
                              
                              const thumbnailResult = await uploadThumbnail.mutateAsync({
                                questionId: editingQuestion?.id || 0,
                                thumbnailBase64,
                                fileName: thumbnailFile.name,
                                mimeType: thumbnailFile.type,
                              });
                              thumbnailUrl = thumbnailResult.thumbnailUrl;
                            }
                            
                            setForm(p => ({
                              ...p,
                              videoUrl: videoResult.videoUrl,
                              videoThumbnailUrl: thumbnailUrl,
                              videoDuration: videoResult.duration || p.videoDuration,
                            }));
                            
                            toast.success("Vídeo enviado com sucesso!");
                            setVideoFile(null);
                            setThumbnailFile(null);
                          } catch (error) {
                            toast.error("Erro ao enviar vídeo");
                          } finally {
                            setUploadingVideo(false);
                          }
                        }}
                        disabled={uploadingVideo}
                      >
                        {uploadingVideo ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                        ) : (
                          <><Upload className="h-4 w-4 mr-2" />Enviar Vídeo</>
                        )}
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={form.requiresVideoWatch} 
                    onCheckedChange={v => setForm(p => ({ ...p, requiresVideoWatch: v }))} 
                    disabled={!form.videoUrl}
                  />
                  <Label className={!form.videoUrl ? "text-gray-400" : ""}>
                    Obrigar assistir vídeo completo antes de responder
                  </Label>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Opções de Resposta</Label>
                {safeMap(form.options, (opt, idx) => (
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
