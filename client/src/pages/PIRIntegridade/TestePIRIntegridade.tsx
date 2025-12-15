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
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function TestePIRIntegridade() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const assessmentId = parseInt(params.id || "0");
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<number, { option?: string; justification?: string }>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const timeRef = useRef<number>(Date.now());

  const { data: questionsData, isLoading: loadingQuestions } = trpc.pirIntegrity.listQuestions.useQuery({ active: true, limit: 100 });
  const { data: existingResponses } = trpc.pirIntegrity.getResponses.useQuery({ assessmentId });
  
  const saveResponse = trpc.pirIntegrity.saveResponse.useMutation();
  const completeAssessment = trpc.pirIntegrity.completeAssessment.useMutation();
  const startAssessment = trpc.pirIntegrity.startAssessment.useMutation();

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
    const timeSpent = Math.round((Date.now() - timeRef.current) / 1000);
    
    await saveResponse.mutateAsync({
      assessmentId,
      questionId: currentQuestion.id,
      selectedOption: response?.option,
      justification: response?.justification,
      timeSpent,
    });
    
    timeRef.current = Date.now();
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

  const options = currentQuestion?.options ? (typeof currentQuestion.options === 'string' ? JSON.parse(currentQuestion.options) : currentQuestion.options) : [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Avaliação PIR Integridade
            </h1>
            <p className="text-gray-500">Questão {currentIndex + 1} de {questions.length}</p>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Tempo: {Math.round((Date.now() - startTime) / 60000)} min</span>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <Card>
          <CardHeader>
            <CardTitle>{currentQuestion?.title}</CardTitle>
            {currentQuestion?.scenario && (
              <CardDescription className="text-base mt-2 p-4 bg-gray-50 rounded-lg">
                {currentQuestion.scenario}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg font-medium">{currentQuestion?.question}</p>

            {currentQuestion?.questionType === "scenario" || currentQuestion?.questionType === "multiple_choice" ? (
              <RadioGroup value={responses[currentQuestion?.id]?.option || ""} onValueChange={handleOptionChange}>
                <div className="space-y-3">
                  {options.map((opt: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
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
