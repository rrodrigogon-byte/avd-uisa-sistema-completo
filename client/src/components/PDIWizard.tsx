import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Loader2, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PDIWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function PDIWizard({ onComplete, onCancel }: PDIWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [targetPositionId, setTargetPositionId] = useState<string>("");
  const [competencyGaps, setCompetencyGaps] = useState<any[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string>("");
  const [selectedActions, setSelectedActions] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Use employee search hook for better performance
  const { employees: employeesData } = useEmployeeSearch("");
  const positions = employeesData?.reduce((acc: any[], emp) => {
    if (emp.position && !acc.find(p => p.id === emp.position!.id)) {
      acc.push(emp.position);
    }
    return acc;
  }, []) || [];
  const { data: employee } = trpc.employees.getCurrent.useQuery();

  const totalSteps = 6;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Mock competency gaps (in production, this would come from API)
  const mockCompetencyGaps = [
    { id: 1, name: "Liderança", current: 6, required: 9, gap: 3 },
    { id: 2, name: "Gestão de Projetos", current: 5, required: 8, gap: 3 },
    { id: 3, name: "Comunicação Estratégica", current: 7, required: 9, gap: 2 },
    { id: 4, name: "Visão de Negócio", current: 6, required: 9, gap: 3 },
    { id: 5, name: "Gestão de Pessoas", current: 5, required: 8, gap: 3 },
  ];

  // Mock AI recommendations
  const mockAIRecommendations = `
Com base na análise de suas competências atuais e nas exigências do cargo de Gerente de Projetos, identifiquei as seguintes oportunidades de desenvolvimento:

**Prioridades Críticas:**
1. **Liderança** (Gap: 3 pontos) - Fundamental para o cargo-alvo
2. **Gestão de Projetos** (Gap: 3 pontos) - Competência core da posição
3. **Gestão de Pessoas** (Gap: 3 pontos) - Essencial para liderar equipes

**Recomendações Personalizadas:**

**70% - Experiência Prática:**
- Liderar projeto de reestruturação do departamento (6 meses)
- Assumir mentoria de 2-3 analistas júnior
- Participar do comitê de planejamento estratégico

**20% - Aprendizado Social:**
- Mentoria com Gerente Sênior de Projetos
- Job rotation com área de Planejamento (2 semanas)
- Participação em grupo de estudos de liderança

**10% - Educação Formal:**
- Curso: "Gestão Avançada de Projetos" (40h)
- Certificação PMP ou equivalente
- Workshop de Liderança Situacional

**Cronograma Sugerido:** 12 meses
**Investimento Estimado:** R$ 8.500
**Probabilidade de Sucesso:** 85% (baseado em histórico similar)
  `.trim();

  const handleAnalyzeGaps = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setCompetencyGaps(mockCompetencyGaps);
      setIsGenerating(false);
      setCurrentStep(3);
    }, 2000);
  };

  const handleGenerateRecommendations = () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setAiRecommendations(mockAIRecommendations);
      setIsGenerating(false);
      setCurrentStep(5);
    }, 3000);
  };

  const handleSubmit = () => {
    toast.success("PDI criado com sucesso!");
    onComplete?.();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Selecione seu Cargo-Alvo
              </CardTitle>
              <CardDescription>
                Escolha a posição que você deseja alcançar em sua carreira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo-Alvo</Label>
                <Select value={targetPositionId} onValueChange={setTargetPositionId}>
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions?.map((pos: any) => (
                      <SelectItem key={pos.id} value={pos.id.toString()}>
                        {pos.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">💡 Dica</p>
                <p className="text-sm text-muted-foreground">
                  Escolha um cargo que represente o próximo passo natural em sua carreira, 
                  considerando suas aspirações e o plano de sucessão da empresa.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => setCurrentStep(2)} 
                  disabled={!targetPositionId}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Análise de Competências
              </CardTitle>
              <CardDescription>
                Vamos analisar as competências necessárias para o cargo-alvo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 rounded-lg border">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-full">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Análise Inteligente com IA</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Nossa IA vai comparar suas competências atuais (baseadas em avaliações 360°) 
                      com as competências necessárias para o cargo-alvo e identificar os gaps de desenvolvimento.
                    </p>
                    <Button 
                      onClick={handleAnalyzeGaps}
                      disabled={isGenerating}
                      className="w-full sm:w-auto"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Iniciar Análise
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Gaps de Competências Identificados</CardTitle>
              <CardDescription>
                Visualize as competências que precisam ser desenvolvidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spider Chart Placeholder */}
              <div className="bg-muted p-8 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <div className="text-4xl">📊</div>
                  <p className="text-sm text-muted-foreground">
                    Gráfico Spider de Competências
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Implementação com biblioteca de charts)
                  </p>
                </div>
              </div>

              {/* Competency Gaps List */}
              <div className="space-y-3">
                {competencyGaps.map((comp) => (
                  <div key={comp.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{comp.name}</span>
                      <span className="text-muted-foreground">
                        Atual: {comp.current}/10 → Meta: {comp.required}/10 (Gap: {comp.gap})
                      </span>
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-blue-200 dark:bg-blue-900"
                        style={{ width: `${(comp.current / 10) * 100}%` }}
                      />
                      <div
                        className="absolute h-full bg-blue-600"
                        style={{ width: `${(comp.required / 10) * 100}%`, opacity: 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setCurrentStep(4)}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recomendações Personalizadas
              </CardTitle>
              <CardDescription>
                A IA vai gerar recomendações de ações de desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 p-6 rounded-lg border">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-full">
                    <Lightbulb className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">Recomendações com IA Gemini</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Com base nos gaps identificados, nossa IA vai sugerir ações de desenvolvimento 
                      seguindo o modelo 70-20-10 (70% prática, 20% mentoria, 10% cursos).
                    </p>
                    <Button 
                      onClick={handleGenerateRecommendations}
                      disabled={isGenerating}
                      className="w-full sm:w-auto"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Gerando recomendações...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar Recomendações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Plano de Desenvolvimento Sugerido</CardTitle>
              <CardDescription>
                Revise as recomendações geradas pela IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {aiRecommendations}
                </pre>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium mb-2">✨ Próximo Passo</p>
                <p className="text-sm text-muted-foreground">
                  Você pode personalizar estas recomendações na próxima etapa, adicionando ou removendo ações conforme necessário.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={() => setCurrentStep(6)}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Revisão e Submissão
              </CardTitle>
              <CardDescription>
                Revise seu PDI antes de enviar para aprovação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Cargo-Alvo</p>
                  <p className="text-sm text-muted-foreground">
                    {positions?.find((p: any) => p.id === Number(targetPositionId))?.title}
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Competências a Desenvolver</p>
                  <div className="space-y-1">
                    {competencyGaps.slice(0, 3).map((comp) => (
                      <p key={comp.id} className="text-sm text-muted-foreground">
                        • {comp.name} (Gap: {comp.gap} pontos)
                      </p>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Duração Estimada</p>
                  <p className="text-sm text-muted-foreground">12 meses</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações Adicionais (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione quaisquer observações ou ajustes que gostaria de fazer..."
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium mb-1">⚠️ Atenção</p>
                <p className="text-sm text-muted-foreground">
                  Após a submissão, seu PDI será enviado para aprovação do seu gestor. 
                  Você poderá fazer ajustes após o feedback.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(5)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleSubmit}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enviar para Aprovação
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Passo {currentStep} de {totalSteps}</span>
              <span className="text-muted-foreground">{Math.round(progressPercentage)}% completo</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStep()}
    </div>
  );
}
