import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, Brain, TrendingUp, Target, Lightbulb, AlertCircle, Users, Briefcase, Home } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Página de Resultados para Candidatos Externos
 * Exibe o resultado completo do Teste PIR para candidatos que não são funcionários
 */

interface PIRResult {
  profileType: string;
  profileDescription: string;
  strengths: string;
  developmentAreas: string;
  workStyle: string;
  communicationStyle: string;
  motivators: string;
  stressors: string;
  teamContribution: string;
  careerRecommendations: string;
  normalizedScores: {
    IP: number;
    ID: number;
    IC: number;
    RM: number;
    RP: number;
    AU: number;
  };
  classifications: {
    IP: 'Baixo' | 'Médio' | 'Alto';
    ID: 'Baixo' | 'Médio' | 'Alto';
    IC: 'Baixo' | 'Médio' | 'Alto';
    RM: 'Baixo' | 'Médio' | 'Alto';
    RP: 'Baixo' | 'Médio' | 'Alto';
    AU: 'Baixo' | 'Médio' | 'Alto';
  };
}

export default function ResultadoCandidato() {
  const params = useParams();
  const [, navigate] = useLocation();
  const resultId = params.id;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PIRResult | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [error, setError] = useState("");

  // Dimensões do PIR
  const dimensions = [
    { key: 'IP', label: 'Interesse em Pessoas', icon: Users, description: 'Trabalhar com e para pessoas' },
    { key: 'ID', label: 'Interesse em Dados', icon: TrendingUp, description: 'Análise e organização de informações' },
    { key: 'IC', label: 'Interesse em Coisas', icon: Target, description: 'Trabalho prático e manual' },
    { key: 'RM', label: 'Reação a Mudanças', icon: Lightbulb, description: 'Adaptabilidade e flexibilidade' },
    { key: 'RP', label: 'Reação a Pressão', icon: AlertCircle, description: 'Resiliência sob estresse' },
    { key: 'AU', label: 'Autonomia', icon: Briefcase, description: 'Independência e autogestão' },
  ];

  const getClassificationColor = (classification: 'Baixo' | 'Médio' | 'Alto') => {
    switch (classification) {
      case 'Alto':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'Médio':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'Baixo':
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  // Simular carregamento de dados (em produção, buscar do backend via API pública)
  useEffect(() => {
    // TODO: Implementar busca real dos resultados via API pública
    // Por enquanto, dados mockados para demonstração
    setTimeout(() => {
      setResult({
        profileType: "Orientado a Pessoas + Adaptável",
        profileDescription: "**Perfil: Orientado a Pessoas + Adaptável**\n\nVocê demonstra forte interesse em trabalhar com pessoas, possui alta capacidade de empatia e comunicação. Sente-se energizado em ambientes colaborativos e tem facilidade para construir relacionamentos.\n\nVocê é altamente adaptável e flexível. Lida bem com mudanças, novidades e situações inesperadas. Possui abertura para experimentar novas abordagens e aprender rapidamente.",
        strengths: "• Excelente em trabalho em equipe e colaboração\n• Alta capacidade de comunicação e empatia\n• Facilidade para construir relacionamentos\n• Habilidade para ensinar e desenvolver outras pessoas\n\n• Alta adaptabilidade e flexibilidade\n• Abertura para inovação e mudanças\n• Capacidade de aprendizado rápido\n• Facilidade para lidar com situações novas",
        developmentAreas: "• Desenvolver habilidades práticas e manuais\n• Buscar atividades que gerem resultados tangíveis\n• Explorar ferramentas e tecnologias físicas\n• Praticar resolução prática de problemas",
        workStyle: "Você trabalha melhor em ambientes colaborativos, com interação frequente com colegas e clientes. Prefere projetos que envolvam trabalho em equipe e comunicação constante. Ambientes sociais e dinâmicos potencializam sua produtividade.",
        communicationStyle: "Você possui um estilo de comunicação aberto, empático e colaborativo. Valoriza o diálogo, a escuta ativa e a construção de consenso. Prefere comunicação face a face e ambientes de discussão em grupo.",
        motivators: "• Trabalhar com pessoas e fazer diferença na vida dos outros\n• Enfrentar novos desafios e aprender constantemente",
        stressors: "• Trabalhos manuais ou que exigem habilidades técnicas práticas",
        teamContribution: "Você contribui para a equipe facilitando a comunicação, construindo relacionamentos e promovendo um ambiente colaborativo. Você contribui para a equipe trazendo flexibilidade, inovação e capacidade de adaptação a mudanças.",
        careerRecommendations: "**Áreas recomendadas:** Recursos Humanos, Vendas, Atendimento ao Cliente, Educação, Psicologia, Assistência Social, Relações Públicas, Marketing de Relacionamento\n\n**Áreas recomendadas:** Startups, Consultoria, Gestão de Projetos, Inovação, Transformação Digital, Gestão de Mudanças, Desenvolvimento de Negócios",
        normalizedScores: {
          IP: 85,
          ID: 55,
          IC: 35,
          RM: 80,
          RP: 60,
          AU: 70,
        },
        classifications: {
          IP: 'Alto',
          ID: 'Médio',
          IC: 'Baixo',
          RM: 'Alto',
          RP: 'Médio',
          AU: 'Médio',
        },
      });
      setCandidateName("Candidato Exemplo");
      setLoading(false);
    }, 1500);
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#F39200]" />
            <p className="text-gray-600">Carregando seus resultados...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-2 border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Erro ao Carregar Resultados
                </h2>
                <p className="text-gray-600">
                  {error || "Não foi possível encontrar os resultados do teste. Por favor, verifique o link ou entre em contato com o RH."}
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-[#F39200]">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Brain className="w-12 h-12 text-[#F39200]" />
              <div>
                <CardTitle className="text-3xl">Resultados do Teste PIR</CardTitle>
                <CardDescription className="text-lg mt-1">
                  Perfil de Interesses e Reações
                </CardDescription>
              </div>
            </div>
            {candidateName && (
              <p className="text-gray-700 font-medium mt-4">
                Candidato: <span className="text-[#F39200]">{candidateName}</span>
              </p>
            )}
          </CardHeader>
        </Card>

        {/* Perfil Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Seu Perfil: {result.profileType}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {result.profileDescription.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 mb-3">
                  {paragraph.replace(/\*\*/g, '')}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pontuações por Dimensão */}
        <Card>
          <CardHeader>
            <CardTitle>Pontuações por Dimensão</CardTitle>
            <CardDescription>
              Suas pontuações nas 6 dimensões do PIR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {dimensions.map((dimension) => {
              const DimensionIcon = dimension.icon;
              const score = result.normalizedScores[dimension.key as keyof typeof result.normalizedScores];
              const classification = result.classifications[dimension.key as keyof typeof result.classifications];

              return (
                <div key={dimension.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DimensionIcon className="w-5 h-5 text-[#F39200]" />
                      <div>
                        <p className="font-semibold text-gray-900">{dimension.label}</p>
                        <p className="text-sm text-gray-600">{dimension.description}</p>
                      </div>
                    </div>
                    <Badge className={`${getClassificationColor(classification)} border`}>
                      {classification}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={score} className="flex-1 h-3" />
                    <span className="text-sm font-medium text-gray-700 w-12 text-right">{score}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Pontos Fortes */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <TrendingUp className="w-6 h-6" />
              Seus Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-800 whitespace-pre-line">
              {result.strengths}
            </div>
          </CardContent>
        </Card>

        {/* Áreas de Desenvolvimento */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Target className="w-6 h-6" />
              Áreas de Desenvolvimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-800 whitespace-pre-line">
              {result.developmentAreas}
            </div>
          </CardContent>
        </Card>

        {/* Estilo de Trabalho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-[#F39200]" />
              Seu Estilo de Trabalho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{result.workStyle}</p>
          </CardContent>
        </Card>

        {/* Estilo de Comunicação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#F39200]" />
              Seu Estilo de Comunicação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{result.communicationStyle}</p>
          </CardContent>
        </Card>

        {/* Motivadores e Estressores */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Lightbulb className="w-5 h-5" />
                Principais Motivadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 whitespace-pre-line text-sm">
                {result.motivators}
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="w-5 h-5" />
                Principais Estressores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700 whitespace-pre-line text-sm">
                {result.stressors}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contribuição para Equipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#F39200]" />
              Sua Contribuição para a Equipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{result.teamContribution}</p>
          </CardContent>
        </Card>

        {/* Recomendações de Carreira */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Briefcase className="w-6 h-6" />
              Recomendações de Carreira
            </CardTitle>
            <CardDescription>
              Áreas profissionais que se alinham ao seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-800 whitespace-pre-line">
              {result.careerRecommendations}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Este relatório é confidencial e foi gerado especificamente para você. Para mais informações ou dúvidas, entre em contato com o RH.
            </p>
            <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Voltar para o Início
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
