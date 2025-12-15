import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Brain, CheckCircle, AlertCircle, Shield, TrendingUp, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

/**
 * PIR de Integridade - Perfil de Identidade de Relacionamento focado em Integridade e Ética
 * 
 * Metodologia:
 * - 60 questões divididas em 6 dimensões de integridade
 * - Escala Likert de 1 a 5 (Discordo Totalmente a Concordo Totalmente)
 * - Cálculo de scores por dimensão e score geral
 * - Análise comportamental e recomendações
 * 
 * Dimensões Avaliadas:
 * 1. IP - Integridade Pessoal (honestidade, valores, coerência)
 * 2. ID - Integridade nas Decisões (ética, transparência, responsabilidade)
 * 3. IC - Integridade nas Comunicações (verdade, clareza, respeito)
 * 4. ES - Estabilidade Emocional (controle, resiliência, equilíbrio)
 * 5. FL - Flexibilidade (adaptação, abertura, aprendizado)
 * 6. AU - Autenticidade (genuinidade, consistência, autoconhecimento)
 */

interface Question {
  id: number;
  text: string;
  dimension: "IP" | "ID" | "IC" | "ES" | "FL" | "AU";
  reverse?: boolean; // Questão reversa (pontuação invertida)
}

const questions: Question[] = [
  // IP - Integridade Pessoal (10 questões)
  { id: 1, text: "Sempre ajo de acordo com meus valores, mesmo quando ninguém está observando", dimension: "IP" },
  { id: 2, text: "Admito meus erros e assumo responsabilidade por minhas ações", dimension: "IP" },
  { id: 3, text: "Mantenho minhas promessas, mesmo quando é difícil", dimension: "IP" },
  { id: 4, text: "Sou honesto(a) sobre minhas limitações e peço ajuda quando necessário", dimension: "IP" },
  { id: 5, text: "Respeito as regras e normas, mesmo quando discordo delas", dimension: "IP" },
  { id: 6, text: "Evito fofocas e conversas que possam prejudicar outras pessoas", dimension: "IP" },
  { id: 7, text: "Trato todas as pessoas com respeito, independentemente de sua posição", dimension: "IP" },
  { id: 8, text: "Sou consistente em minhas atitudes e comportamentos", dimension: "IP" },
  { id: 9, text: "Valorizo a confiança que as pessoas depositam em mim", dimension: "IP" },
  { id: 10, text: "Busco fazer o que é certo, mesmo quando é mais difícil", dimension: "IP" },

  // ID - Integridade nas Decisões (10 questões)
  { id: 11, text: "Considero o impacto ético de minhas decisões antes de agir", dimension: "ID" },
  { id: 12, text: "Busco informações completas antes de tomar decisões importantes", dimension: "ID" },
  { id: 13, text: "Evito conflitos de interesse em minhas decisões profissionais", dimension: "ID" },
  { id: 14, text: "Sou transparente sobre os critérios que uso para tomar decisões", dimension: "ID" },
  { id: 15, text: "Considero o bem-estar de todas as partes envolvidas em minhas decisões", dimension: "ID" },
  { id: 16, text: "Resisto a pressões para tomar decisões antiéticas", dimension: "ID" },
  { id: 17, text: "Documento e justifico minhas decisões importantes", dimension: "ID" },
  { id: 18, text: "Reviso minhas decisões quando recebo novas informações", dimension: "ID" },
  { id: 19, text: "Aceito as consequências de minhas decisões", dimension: "ID" },
  { id: 20, text: "Busco feedback sobre minhas decisões para melhorar", dimension: "ID" },

  // IC - Integridade nas Comunicações (10 questões)
  { id: 21, text: "Comunico informações de forma clara e precisa", dimension: "IC" },
  { id: 22, text: "Evito distorcer fatos para benefício próprio", dimension: "IC" },
  { id: 23, text: "Mantenho confidencialidade de informações sensíveis", dimension: "IC" },
  { id: 24, text: "Sou direto(a) e honesto(a) em minhas comunicações", dimension: "IC" },
  { id: 25, text: "Corrijo informações incorretas que comuniquei", dimension: "IC" },
  { id: 26, text: "Ouço ativamente antes de responder", dimension: "IC" },
  { id: 27, text: "Evito manipular informações para influenciar outros", dimension: "IC" },
  { id: 28, text: "Comunico más notícias de forma respeitosa e honesta", dimension: "IC" },
  { id: 29, text: "Dou crédito às ideias e contribuições de outros", dimension: "IC" },
  { id: 30, text: "Sou consistente entre o que digo e o que faço", dimension: "IC" },

  // ES - Estabilidade Emocional (10 questões)
  { id: 31, text: "Mantenho a calma em situações de pressão", dimension: "ES" },
  { id: 32, text: "Lido bem com críticas e feedback negativo", dimension: "ES" },
  { id: 33, text: "Não deixo emoções negativas afetarem minhas decisões", dimension: "ES" },
  { id: 34, text: "Recupero-me rapidamente de contratempos", dimension: "ES" },
  { id: 35, text: "Mantenho equilíbrio emocional mesmo em conflitos", dimension: "ES" },
  { id: 36, text: "Não tomo decisões impulsivas quando estou estressado(a)", dimension: "ES" },
  { id: 37, text: "Consigo separar problemas pessoais do trabalho", dimension: "ES" },
  { id: 38, text: "Lido bem com mudanças inesperadas", dimension: "ES" },
  { id: 39, text: "Mantenho atitude positiva mesmo em situações difíceis", dimension: "ES" },
  { id: 40, text: "Busco apoio quando me sinto sobrecarregado(a)", dimension: "ES" },

  // FL - Flexibilidade (10 questões)
  { id: 41, text: "Estou aberto(a) a novas ideias e perspectivas", dimension: "FL" },
  { id: 42, text: "Adapto-me facilmente a mudanças de planos", dimension: "FL" },
  { id: 43, text: "Aprendo com meus erros e ajusto meu comportamento", dimension: "FL" },
  { id: 44, text: "Considero pontos de vista diferentes dos meus", dimension: "FL" },
  { id: 45, text: "Experimento novas abordagens para resolver problemas", dimension: "FL" },
  { id: 46, text: "Aceito feedback e faço mudanças quando necessário", dimension: "FL" },
  { id: 47, text: "Não me apego rigidamente a uma única forma de fazer as coisas", dimension: "FL" },
  { id: 48, text: "Busco continuamente aprender e me desenvolver", dimension: "FL" },
  { id: 49, text: "Colaboro bem com pessoas de diferentes estilos", dimension: "FL" },
  { id: 50, text: "Vejo mudanças como oportunidades de crescimento", dimension: "FL" },

  // AU - Autenticidade (10 questões)
  { id: 51, text: "Sou verdadeiro(a) comigo mesmo(a) sobre quem sou", dimension: "AU" },
  { id: 52, text: "Não finjo ser alguém que não sou para agradar outros", dimension: "AU" },
  { id: 53, text: "Expresso minhas opiniões genuínas, mesmo quando impopulares", dimension: "AU" },
  { id: 54, text: "Reconheço e aceito minhas forças e fraquezas", dimension: "AU" },
  { id: 55, text: "Ajo de acordo com meus valores, não apenas por conveniência", dimension: "AU" },
  { id: 56, text: "Sou consistente em diferentes contextos (trabalho, casa, amigos)", dimension: "AU" },
  { id: 57, text: "Não comprometo minha integridade por benefícios pessoais", dimension: "AU" },
  { id: 58, text: "Reflito regularmente sobre meus valores e comportamentos", dimension: "AU" },
  { id: 59, text: "Busco alinhamento entre o que penso, digo e faço", dimension: "AU" },
  { id: 60, text: "Sou honesto(a) sobre minhas motivações e intenções", dimension: "AU" },
];

const dimensionInfo = {
  IP: {
    name: "Integridade Pessoal",
    description: "Honestidade, valores, coerência e responsabilidade pessoal",
    color: "bg-blue-500",
  },
  ID: {
    name: "Integridade nas Decisões",
    description: "Ética, transparência e responsabilidade nas decisões",
    color: "bg-green-500",
  },
  IC: {
    name: "Integridade nas Comunicações",
    description: "Verdade, clareza e respeito nas comunicações",
    color: "bg-purple-500",
  },
  ES: {
    name: "Estabilidade Emocional",
    description: "Controle emocional, resiliência e equilíbrio",
    color: "bg-orange-500",
  },
  FL: {
    name: "Flexibilidade",
    description: "Adaptação, abertura e aprendizado contínuo",
    color: "bg-pink-500",
  },
  AU: {
    name: "Autenticidade",
    description: "Genuinidade, consistência e autoconhecimento",
    color: "bg-indigo-500",
  },
};

export default function PIRIntegridade() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [notes, setNotes] = useState("");

  const progress = (Object.keys(answers).length / questions.length) * 100;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    // Calcular scores por dimensão
    const dimensionScores: Record<string, number[]> = {
      IP: [],
      ID: [],
      IC: [],
      ES: [],
      FL: [],
      AU: [],
    };

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        const score = q.reverse ? 6 - answer : answer;
        dimensionScores[q.dimension].push(score);
      }
    });

    // Calcular médias
    const dimensionAverages: Record<string, number> = {};
    Object.keys(dimensionScores).forEach((dim) => {
      const scores = dimensionScores[dim];
      dimensionAverages[dim] = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 20) // Converter para escala 0-100
        : 0;
    });

    console.log("Dimension Scores:", dimensionAverages);
    setShowResults(true);
    toast.success("PIR de Integridade concluído com sucesso!");
  };

  const getDimensionScores = () => {
    const dimensionScores: Record<string, number[]> = {
      IP: [],
      ID: [],
      IC: [],
      ES: [],
      FL: [],
      AU: [],
    };

    questions.forEach((q) => {
      const answer = answers[q.id];
      if (answer) {
        const score = q.reverse ? 6 - answer : answer;
        dimensionScores[q.dimension].push(score);
      }
    });

    const dimensionAverages: Record<string, number> = {};
    Object.keys(dimensionScores).forEach((dim) => {
      const scores = dimensionScores[dim];
      dimensionAverages[dim] = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 20)
        : 0;
    });

    return dimensionAverages;
  };

  const getOverallScore = () => {
    const dimScores = getDimensionScores();
    const scores = Object.values(dimScores);
    return scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  };

  const getClassification = (score: number) => {
    if (score >= 80) return { label: "Muito Alto", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { label: "Alto", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 40) return { label: "Médio", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (score >= 20) return { label: "Baixo", color: "text-orange-600", bg: "bg-orange-100" };
    return { label: "Muito Baixo", color: "text-red-600", bg: "bg-red-100" };
  };

  const currentQ = questions[currentQuestion];
  const isAnswered = answers[currentQ?.id] !== undefined;

  if (showResults) {
    const overallScore = getOverallScore();
    const classification = getClassification(overallScore);
    const dimScores = getDimensionScores();

    return (
      <div className="container max-w-5xl py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              PIR de Integridade - Resultados
            </h1>
            <p className="text-muted-foreground mt-1">
              Perfil de Identidade de Relacionamento focado em Integridade e Ética
            </p>
          </div>
          <Button onClick={() => {
            setShowResults(false);
            setCurrentQuestion(0);
            setAnswers({});
            setNotes("");
          }}>
            Refazer Teste
          </Button>
        </div>

        {/* Score Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Pontuação Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-6xl font-bold text-primary">{overallScore}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Nível de Integridade</span>
                  <Badge className={classification.bg + " " + classification.color}>
                    {classification.label}
                  </Badge>
                </div>
                <Progress value={overallScore} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scores por Dimensão */}
        <Card>
          <CardHeader>
            <CardTitle>Análise por Dimensão</CardTitle>
            <CardDescription>
              Pontuações detalhadas em cada dimensão de integridade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(dimensionInfo).map(([key, info]) => {
              const score = dimScores[key] || 0;
              const dimClass = getClassification(score);
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{info.name}</div>
                      <div className="text-sm text-muted-foreground">{info.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={dimClass.bg + " " + dimClass.color}>
                        {dimClass.label}
                      </Badge>
                      <div className="text-2xl font-bold w-12 text-right">{score}</div>
                    </div>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Interpretação e Recomendações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Interpretação e Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Pontos Fortes</AlertTitle>
              <AlertDescription>
                {Object.entries(dimScores)
                  .filter(([_, score]) => score >= 70)
                  .map(([dim]) => dimensionInfo[dim as keyof typeof dimensionInfo].name)
                  .join(", ") || "Continue desenvolvendo suas competências de integridade"}
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Áreas de Desenvolvimento</AlertTitle>
              <AlertDescription>
                {Object.entries(dimScores)
                  .filter(([_, score]) => score < 60)
                  .map(([dim]) => dimensionInfo[dim as keyof typeof dimensionInfo].name)
                  .join(", ") || "Mantenha seus altos padrões de integridade"}
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Recomendações Gerais</h4>
              <ul className="space-y-2 text-sm">
                {overallScore >= 80 && (
                  <li>• Excelente! Continue sendo um exemplo de integridade para sua equipe</li>
                )}
                {overallScore >= 60 && overallScore < 80 && (
                  <li>• Bom nível de integridade. Foque em fortalecer as dimensões com scores mais baixos</li>
                )}
                {overallScore < 60 && (
                  <li>• Desenvolva práticas de reflexão ética e busque mentoria em integridade</li>
                )}
                <li>• Participe de treinamentos sobre ética e compliance</li>
                <li>• Pratique comunicação transparente e honesta no dia a dia</li>
                <li>• Busque feedback regular sobre seu comportamento ético</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          PIR de Integridade
        </h1>
        <p className="text-muted-foreground mt-1">
          Perfil de Identidade de Relacionamento focado em Integridade e Ética
        </p>
      </div>

      {/* Informações sobre o teste */}
      {currentQuestion === 0 && Object.keys(answers).length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Sobre este teste</AlertTitle>
          <AlertDescription>
            Este teste avalia 6 dimensões de integridade através de 60 questões. Responda com honestidade
            usando a escala de 1 (Discordo Totalmente) a 5 (Concordo Totalmente). Não há respostas certas
            ou erradas - o objetivo é entender seu perfil de integridade.
          </AlertDescription>
        </Alert>
      )}

      {/* Progresso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progresso</CardTitle>
            <span className="text-sm text-muted-foreground">
              {Object.keys(answers).length} de {questions.length} questões respondidas
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Questão Atual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Questão {currentQuestion + 1} de {questions.length}</CardTitle>
            <Badge className={dimensionInfo[currentQ.dimension].color + " text-white"}>
              {dimensionInfo[currentQ.dimension].name}
            </Badge>
          </div>
          <CardDescription className="mt-2">
            {dimensionInfo[currentQ.dimension].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium">{currentQ.text}</div>

          <RadioGroup
            value={answers[currentQ.id]?.toString()}
            onValueChange={(value) => handleAnswer(currentQ.id, parseInt(value))}
          >
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((value) => {
                const labels = [
                  "Discordo Totalmente",
                  "Discordo",
                  "Neutro",
                  "Concordo",
                  "Concordo Totalmente",
                ];
                return (
                  <div key={value} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <RadioGroupItem value={value.toString()} id={`q${currentQ.id}-${value}`} />
                    <Label htmlFor={`q${currentQ.id}-${value}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>{labels[value - 1]}</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {/* Observações (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre esta questão..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              disabled={!isAnswered}
            >
              {currentQuestion === questions.length - 1 ? "Finalizar" : "Próxima"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dimensões Info */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensões Avaliadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dimensionInfo).map(([key, info]) => (
              <div key={key} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full mt-1 ${info.color}`} />
                <div>
                  <div className="font-semibold">{info.name}</div>
                  <div className="text-sm text-muted-foreground">{info.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
