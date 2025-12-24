import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Brain, ArrowLeft, ArrowRight } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Página do Teste PIR (Perfil de Interesses e Reações)
 * Interface para responder as 60 questões do teste
 */

interface Question {
  id: number;
  questionNumber: number;
  questionText: string;
  dimension: string;
  reverse: boolean;
}

export default function TestPIR() {
  const params = useParams();
  const [, navigate] = useLocation();
  const token = params.token;

  const [currentPage, setCurrentPage] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const questionsPerPage = 10;

  // Buscar questões do PIR
  const { data: questions, isLoading: loadingQuestions } = trpc.psychometric.getQuestionsPublic.useQuery({
    testType: "pir",
  });

  // Mutation para submeter teste
  const submitMutation = trpc.psychometric.submitTestPublic.useMutation({
    onSuccess: () => {
      setIsCompleted(true);
      toast.success("Teste concluído com sucesso! Você receberá os resultados por email.");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar teste: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Calcular progresso
  const totalQuestions = questions?.length || 60;
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / totalQuestions) * 100;

  // Questões da página atual
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = questions?.slice(startIndex, endIndex) || [];

  // Verificar se todas as questões da página atual foram respondidas
  const isCurrentPageComplete = currentQuestions.every(q => responses[q.id] !== undefined);

  // Verificar se todas as questões foram respondidas
  const isAllQuestionsAnswered = answeredCount === totalQuestions;

  const handleResponse = (questionId: number, value: number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalQuestions / questionsPerPage) - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    if (!isAllQuestionsAnswered) {
      toast.error("Por favor, responda todas as questões antes de enviar");
      return;
    }

    setIsSubmitting(true);

    // Formatar respostas para o backend
    const formattedResponses = Object.entries(responses).map(([questionId, score]) => ({
      questionId: parseInt(questionId),
      score,
    }));

    submitMutation.mutate({
      testType: "pir",
      email,
      responses: formattedResponses,
    });
  };

  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#F39200]" />
            <p className="text-gray-600">Carregando teste...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-2 border-green-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Teste Concluído com Sucesso!
                </h2>
                <p className="text-gray-600 mb-4">
                  Obrigado por completar o Teste PIR. Seus resultados foram processados e enviados para o email <strong>{email}</strong>.
                </p>
                <p className="text-sm text-gray-500">
                  Você receberá um relatório completo com seu perfil de interesses e reações, incluindo pontos fortes, áreas de desenvolvimento e recomendações de carreira.
                </p>
              </div>
              <Button onClick={() => navigate("/")} className="bg-[#F39200] hover:bg-[#d97f00]">
                Voltar para o Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-[#F39200]" />
            <h1 className="text-3xl font-bold text-gray-900">
              Teste PIR
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Perfil de Interesses e Reações
          </p>
          <p className="text-sm text-gray-500 mt-2">
            60 questões • Tempo estimado: 15-20 minutos
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progresso: {answeredCount} de {totalQuestions} questões</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Email Input (apenas na primeira página) */}
        {currentPage === 0 && (
          <Card className="mb-6 border-2 border-[#F39200]">
            <CardHeader>
              <CardTitle>Informações do Participante</CardTitle>
              <CardDescription>
                Insira seu email para receber os resultados do teste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F39200] focus:border-transparent"
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questões */}
        <Card>
          <CardHeader>
            <CardTitle>
              Questões {startIndex + 1} - {Math.min(endIndex, totalQuestions)}
            </CardTitle>
            <CardDescription>
              Responda cada questão de acordo com sua concordância, sendo 1 = Discordo Totalmente e 5 = Concordo Totalmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {currentQuestions.map((question, index) => (
              <div key={question.id} className="space-y-4 pb-6 border-b last:border-b-0">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#F39200] text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {startIndex + index + 1}
                  </div>
                  <p className="text-gray-900 font-medium flex-1 pt-1">
                    {question.questionText}
                  </p>
                </div>

                <RadioGroup
                  value={responses[question.id]?.toString() || ""}
                  onValueChange={(value) => handleResponse(question.id, parseInt(value))}
                  className="flex justify-between gap-2"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center gap-2 flex-1">
                      <RadioGroupItem
                        value={value.toString()}
                        id={`q${question.id}-${value}`}
                        className="w-6 h-6"
                      />
                      <Label
                        htmlFor={`q${question.id}-${value}`}
                        className="text-xs text-center cursor-pointer"
                      >
                        {value === 1 && "Discordo Totalmente"}
                        {value === 2 && "Discordo"}
                        {value === 3 && "Neutro"}
                        {value === 4 && "Concordo"}
                        {value === 5 && "Concordo Totalmente"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-6 gap-4">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          <div className="text-sm text-gray-600">
            Página {currentPage + 1} de {Math.ceil(totalQuestions / questionsPerPage)}
          </div>

          {currentPage < Math.ceil(totalQuestions / questionsPerPage) - 1 ? (
            <Button
              onClick={handleNextPage}
              disabled={!isCurrentPageComplete}
              className="flex items-center gap-2 bg-[#F39200] hover:bg-[#d97f00]"
            >
              Próxima
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isAllQuestionsAnswered || isSubmitting || !email}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar Teste
                </>
              )}
            </Button>
          )}
        </div>

        {/* Instruções */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Dicas para responder:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Responda de forma honesta e espontânea</li>
              <li>• Não há respostas certas ou erradas</li>
              <li>• Pense em como você realmente é, não em como gostaria de ser</li>
              <li>• Suas respostas são confidenciais</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
