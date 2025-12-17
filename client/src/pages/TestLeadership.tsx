import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Users, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { APP_LOGO } from "@/const";

/**
 * Página de Teste de Estilos de Liderança
 * Baseado em teorias de Lewin, Bass e Goleman
 * 30 perguntas avaliando 6 estilos: Autocrático, Democrático, Transformacional, Transacional, Coaching, Laissez-faire
 */

export default function TestLeadership() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Buscar perguntas de Liderança
  const { data: questions, isLoading } = trpc.psychometric.getQuestionsPublic.useQuery({ testType: "leadership" });

  // Mutation para submeter teste
  const submitMutation = trpc.psychometric.submitTestPublic.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setTestCompleted(true);
      setIsSubmitting(false);
      toast.success(`Parabéns! Teste de Estilos de Liderança concluído!`);
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

    const unanswered = questions.filter(q => !responses[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Ainda faltam ${unanswered.length} pergunta(s) para responder`);
      return;
    }

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
      testType: "leadership",
      email: email,
      responses: formattedResponses,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando teste...</p>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Teste de Estilos de Liderança</CardTitle>
            <CardDescription>Nenhuma pergunta encontrada</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Tela de resultado
  if (testCompleted && result) {
    const leadershipStyles = [
      { key: 'autocratico', label: 'Autocrático', color: 'text-red-600', bg: 'bg-red-50' },
      { key: 'democratico', label: 'Democrático', color: 'text-blue-600', bg: 'bg-blue-50' },
      { key: 'transformacional', label: 'Transformacional', color: 'text-purple-600', bg: 'bg-purple-50' },
      { key: 'transacional', label: 'Transacional', color: 'text-orange-600', bg: 'bg-orange-50' },
      { key: 'coaching', label: 'Coaching', color: 'text-green-600', bg: 'bg-green-50' },
      { key: 'laissez_faire', label: 'Laissez-faire', color: 'text-gray-600', bg: 'bg-gray-50' },
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Teste Concluído com Sucesso!</CardTitle>
            <CardDescription className="text-base mt-2">
              Obrigado por completar o Teste de Estilos de Liderança!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Seu Perfil de Liderança
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadershipStyles.map((style: any) => {
                  const score = result.profile?.[style.key] || 0;
                  return (
                    <div key={style.key} className={`${style.bg} p-4 rounded-lg border`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{style.label}</span>
                        <span className={`text-2xl font-bold ${style.color}`}>{score.toFixed(1)}</span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📊 Interpretação dos Resultados</h4>
              <p className="text-sm text-muted-foreground">
                Seu perfil de liderança foi calculado com base em teorias consolidadas (Lewin, Bass, Goleman). 
                Pontuações mais altas indicam maior tendência para aquele estilo. A maioria dos líderes eficazes 
                combina múltiplos estilos conforme a situação.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2">✉️ Próximos Passos</h4>
              <p className="text-sm text-muted-foreground">
                Os resultados foram enviados para <strong>{email}</strong>. 
                O RH da sua empresa terá acesso aos resultados para apoiar seu desenvolvimento de liderança.
              </p>
            </div>

            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
              size="lg"
            >
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de email
  if (showEmailForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Users className="w-12 h-12 text-purple-600 mx-auto mb-2" />
            <CardTitle>Quase lá!</CardTitle>
            <CardDescription>
              Insira seu email para receber os resultados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(false)}
                className="flex-1"
              >
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
                  'Enviar Teste'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questionário
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const answeredCount = Object.keys(responses).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt="Logo" className="h-8 w-8" />}
              <div>
                <h1 className="text-xl font-bold">Teste de Estilos de Liderança</h1>
                <p className="text-sm text-muted-foreground">Baseado em Lewin, Bass e Goleman</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                Pergunta {currentQuestion + 1} de {questions.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {answeredCount} respondidas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Question Card */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 font-bold">{currentQuestion + 1}</span>
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{currentQ.questionText}</CardTitle>
                <CardDescription>
                  Selecione o quanto você concorda com a afirmação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={responses[currentQ.id]?.toString()}
              onValueChange={(value) => handleResponseChange(currentQ.id, parseInt(value))}
            >
              <div className="space-y-3">
                {[
                  { value: 1, label: "Discordo Totalmente", color: "border-red-200 hover:bg-red-50" },
                  { value: 2, label: "Discordo", color: "border-orange-200 hover:bg-orange-50" },
                  { value: 3, label: "Neutro", color: "border-gray-200 hover:bg-gray-50" },
                  { value: 4, label: "Concordo", color: "border-blue-200 hover:bg-blue-50" },
                  { value: 5, label: "Concordo Totalmente", color: "border-green-200 hover:bg-green-50" },
                ].map((option: any) => (
                  <div key={option.value} className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${option.color} ${responses[currentQ.id] === option.value ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
                    <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                    <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              {currentQuestion < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1"
                >
                  Próxima
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Finalizar Teste
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
