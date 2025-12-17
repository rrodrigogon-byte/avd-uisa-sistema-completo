import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Brain, CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Página de Teste Big Five (Versão Pública - sem necessidade de login)
 * Questionário interativo com 50 perguntas
 */

export default function TestBigFive() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Buscar perguntas DISC (endpoint público)
  const { data: questions, isLoading } = trpc.psychometric.getQuestionsPublic.useQuery({ testType: "bigfive" });

  // Mutation para submeter teste (endpoint público)
  const submitMutation = trpc.psychometric.submitTestPublic.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setTestCompleted(true);
      setIsSubmitting(false);
      toast.success(`Parabéns, ${data.employeeName}! Teste Big Five concluído com sucesso!`);
    },
    onError: (error) => {
      toast.error(`Erro ao submeter teste: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleResponseChange = (questionId: number, score: number) => {
    setResponses({ ...responses, [questionId]: score });
  };

  const handleNext = () => {
    if (!questions) return;
    
    const currentQuestionId = questions[currentQuestion].id;
    if (!responses[currentQuestionId]) {
      toast.error("Por favor, selecione uma resposta antes de continuar");
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = () => {
    if (!questions) return;

    // Verificar se todas as perguntas foram respondidas
    const unanswered = questions.filter(q => !responses[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Ainda faltam ${unanswered.length} pergunta(s) para responder`);
      return;
    }

    // Mostrar formulário de email
    setShowEmailForm(true);
  };

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsSubmitting(true);
    const formattedResponses = Object.entries(responses).map(([questionId, score]) => ({
      questionId: parseInt(questionId),
      score,
    }));

    submitMutation.mutate({
      testType: "bigfive",
      email: email,
      responses: formattedResponses,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando teste...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Teste Big Five</CardTitle>
            <CardDescription>Nenhuma pergunta encontrada</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Tela de resultado
  if (testCompleted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Teste Concluído com Sucesso!</CardTitle>
            <CardDescription className="text-base mt-2">
              Obrigado por completar o Teste Big Five, {result.employeeName}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">Seu Perfil Big Five</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-muted-foreground">Abertura (O)</div>
                  <div className="text-2xl font-bold text-orange-600">{result.profile.O?.toFixed(1) || '0.0'}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-muted-foreground">Conscienciosidade (C)</div>
                  <div className="text-2xl font-bold text-orange-600">{result.profile.A?.toFixed(1) || '0.0'}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-muted-foreground">Extroversão (E)</div>
                  <div className="text-2xl font-bold text-orange-600">{result.profile.E?.toFixed(1) || '0.0'}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-muted-foreground">Amabilidade (A)</div>
                  <div className="text-2xl font-bold text-orange-600">{result.profile.A?.toFixed(1) || '0.0'}</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-muted-foreground">Neuroticismo (N)</div>
                  <div className="text-2xl font-bold text-orange-600">{result.profile.N?.toFixed(1) || '0.0'}</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Seus resultados foram salvos e estão disponíveis para análise pela equipe de RH.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de email
  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-orange-600" />
            </div>
            <CardTitle className="text-center">Quase lá!</CardTitle>
            <CardDescription className="text-center">
              Para finalizar, precisamos do seu email para associar os resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@uisa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use o mesmo email que recebeu o convite para este teste
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(false)}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Finalizar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (Object.keys(responses).length / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-3xl mx-auto p-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="h-10 w-10 text-orange-600" />
            <h1 className="text-3xl font-bold tracking-tight">Teste Big Five</h1>
          </div>
          <p className="text-muted-foreground">
            Avalie cada afirmação de acordo com o quanto você concorda
          </p>
        </div>

        {/* Barra de Progresso */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Object.keys(responses).length} de {questions.length} perguntas</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Pergunta Atual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pergunta {currentQuestion + 1} de {questions.length}
            </CardTitle>
            <CardDescription className="text-base mt-4">
              {currentQ.questionText}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[currentQ.id]?.toString()}
              onValueChange={(value) => handleResponseChange(currentQ.id, parseInt(value))}
            >
              <div className="space-y-3">
                {[
                  { value: 1, label: "1 - Discordo totalmente" },
                  { value: 2, label: "2 - Discordo parcialmente" },
                  { value: 3, label: "3 - Neutro" },
                  { value: 4, label: "4 - Concordo parcialmente" },
                  { value: 5, label: "5 - Concordo totalmente" },
                ].map((option: any) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value={option.value.toString()} id={`q${currentQ.id}-${option.value}`} />
                    <Label htmlFor={`q${currentQ.id}-${option.value}`} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button onClick={handleNext}>
              Próxima
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={Object.keys(responses).length < questions.length}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Concluir Teste
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
