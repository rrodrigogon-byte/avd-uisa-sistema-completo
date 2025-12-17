import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Shield, Video } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import VideoRecorder from "@/components/VideoRecorder";
import PIRTestTimer from "@/components/PIRTestTimer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { safeMap, ensureArray } from "@/lib/arrayHelpers";

export default function TestePIRIntegridade() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(params.id || "0");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, { option?: string; justification?: string }>>({});
  const [startTime] = useState<number>(Date.now());
  const questionStartTime = useRef<number>(Date.now());
  const [questionElapsedTime, setQuestionElapsedTime] = useState(0);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  const { data: questionsData, isLoading: loadingQuestions } = trpc.pirIntegrity.listQuestions.useQuery({ active: true, limit: 100 });
  const { data: existingResponses } = trpc.pirIntegrity.getResponses.useQuery({ assessmentId });
  
  const saveResponse = trpc.pirIntegrity.saveResponse.useMutation();
  const completeAssessment = trpc.pirIntegrity.completeAssessment.useMutation();
  const startAssessment = trpc.pirIntegrity.startAssessment.useMutation();
  const uploadVideo = trpc.videoUpload.upload.useMutation();

  // Timer para tempo da questão atual
  useEffect(() => {
    const interval = setInterval(() => {
      setQuestionElapsedTime(Math.round((Date.now() - questionStartTime.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset timer quando muda de questão
  useEffect(() => {
    questionStartTime.current = Date.now();
    setQuestionElapsedTime(0);
  }, [currentIndex]);

  // Handler para upload de vídeo gravado
  const handleVideoRecorded = async (videoBlob: Blob) => {
    setIsUploadingVideo(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const durationSeconds = Math.round(videoBlob.size / (1024 * 1024) * 10);
        
        try {
          await uploadVideo.mutateAsync({
            processId: assessmentId,
            employeeId: 0,
            stepNumber: 2,
            videoData: base64Data,
            mimeType: videoBlob.type || "video/webm",
            durationSeconds,
          });
          
          setVideoUploaded(true);
          toast.success("Vídeo enviado com sucesso!");
        } catch (error) {
          console.error("Erro ao enviar vídeo:", error);
          toast.error("Erro ao enviar vídeo. Tente novamente.");
        }
        setIsUploadingVideo(false);
      };
      reader.readAsDataURL(videoBlob);
    } catch (error) {
      console.error("Erro ao processar vídeo:", error);
      toast.error("Erro ao processar vídeo");
      setIsUploadingVideo(false);
    }
  };

  const questions = questionsData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (assessmentId) {
      startAssessment.mutate({ id: assessmentId });
    }
  }, [assessmentId]);

  useEffect(() => {
    if (existingResponses?.responses) {
      const mapped: Record<number, { option?: string; justification?: string }> = {};
      existingResponses.responses.forEach(r => {
        mapped[r.questionId] = { option: r.selectedOption || undefined, justification: r.justification || undefined };
      });
      setResponses(mapped);
    }
  }, [existingResponses]);

  const handleOptionChange = (value: string) => {
    if (!currentQuestion) return;
    setResponses(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], option: value } }));
  };

  const handleJustificationChange = (value: string) => {
    if (!currentQuestion) return;
    setResponses(prev => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], justification: value } }));
  };

  const saveCurrentResponse = async () => {
    if (!currentQuestion) return;
    const response = responses[currentQuestion.id];
    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);
    
    await saveResponse.mutateAsync({
      assessmentId,
      questionId: currentQuestion.id,
      selectedOption: response?.option,
      justification: response?.justification,
      timeSpent,
    });
    
    questionStartTime.current = Date.now();
  };

  const handleNext = async () => {
    await saveCurrentResponse();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleTimeUp = useCallback(() => {
    toast.warning("Tempo esgotado! Finalizando avaliação...");
    handleComplete();
  }, []);

  const handleComplete = async () => {
    await saveCurrentResponse();
    try {
      const result = await completeAssessment.mutateAsync({ id: assessmentId });
      toast.success("Avaliação concluída com sucesso!");
      navigate(`/pir-integridade/resultado/${assessmentId}`);
    } catch (error) {
      toast.error("Erro ao finalizar avaliação");
    }
  };

  if (loadingQuestions) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold">Nenhuma questão disponível</h2>
          <p className="text-gray-500 mt-2">Configure as questões do PIR Integridade primeiro.</p>
          <Button className="mt-4" onClick={() => navigate("/pir-integridade/questoes")}>
            Gerenciar Questões
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Garantir que options seja sempre um array válido
  let options: any[] = [];
  try {
    if (currentQuestion?.options) {
      if (typeof currentQuestion.options === 'string') {
        const parsed = JSON.parse(currentQuestion.options);
        options = Array.isArray(parsed) ? parsed : [];
      } else if (Array.isArray(currentQuestion.options)) {
        options = currentQuestion.options;
      }
    }
  } catch (error) {
    console.error('Erro ao fazer parse das opções:', error);
    options = [];
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabeçalho com Timer */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Avaliação PIR Integridade
            </h1>
            <p className="text-gray-500">Questão {currentIndex + 1} de {questions.length}</p>
          </div>
          
          {/* Timer Compacto no Header */}
          <PIRTestTimer
            maxTime={1800} // 30 minutos
            onTimeUp={handleTimeUp}
            onTimeUpdate={setTotalElapsedTime}
            currentQuestion={currentIndex + 1}
            totalQuestions={questions.length}
            questionTime={questionElapsedTime}
            showQuestionTime={true}
            compact={true}
          />
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progresso: {Math.round(progress)}%</span>
            <span>Tempo nesta questão: {Math.floor(questionElapsedTime / 60)}:{(questionElapsedTime % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        {/* Timer Detalhado */}
        <PIRTestTimer
          maxTime={1800}
          initialTime={totalElapsedTime}
          currentQuestion={currentIndex + 1}
          totalQuestions={questions.length}
          questionTime={questionElapsedTime}
          showQuestionTime={true}
          expectedTimePerQuestion={60}
        />

        {/* Seção de Gravação de Vídeo */}
        <Collapsible open={showVideoRecorder} onOpenChange={setShowVideoRecorder}>
          <Card className="border-[#F39200]">
            <CardHeader className="pb-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-[#F39200]" />
                    <CardTitle className="text-lg">Gravação de Vídeo (Opcional)</CardTitle>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {showVideoRecorder ? "Ocultar" : "Expandir"}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CardDescription>
                Grave um vídeo durante a avaliação para análise comportamental
                {videoUploaded && (
                  <span className="ml-2 text-green-600 font-medium">✓ Vídeo enviado</span>
                )}
              </CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <VideoRecorder
                  onVideoRecorded={handleVideoRecorded}
                  maxDuration={600}
                  disabled={isUploadingVideo || videoUploaded}
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Questão Atual */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{currentQuestion?.title}</CardTitle>
              <span className="text-sm text-muted-foreground">
                Tempo: {Math.floor(questionElapsedTime / 60)}:{(questionElapsedTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
            {currentQuestion?.scenario && (
              <CardDescription className="text-base mt-2 p-4 bg-gray-50 rounded-lg">
                {currentQuestion.scenario}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion?.question}</p>

            {currentQuestion?.questionType === "scenario" || currentQuestion?.questionType === "multiple_choice" ? (
              <RadioGroup value={responses[currentQuestion?.id]?.option} onValueChange={handleOptionChange}>
                <div className="space-y-3">
                  {safeMap(options, (opt: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <RadioGroupItem value={opt.value} id={`opt-${idx}`} />
                      <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : null}

            {currentQuestion?.requiresJustification && (
              <div className="space-y-2">
                <Label>Justifique sua resposta (opcional)</Label>
                <Textarea
                  placeholder="Explique o raciocínio por trás da sua escolha..."
                  value={responses[currentQuestion?.id]?.justification || ""}
                  onChange={(e) => handleJustificationChange(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          {currentIndex === questions.length - 1 ? (
            <Button onClick={handleComplete} disabled={completeAssessment.isPending}>
              {completeAssessment.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Finalizar Avaliação
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Próxima
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
