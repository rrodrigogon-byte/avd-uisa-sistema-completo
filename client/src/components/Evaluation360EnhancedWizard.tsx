import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Save, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import CycleDataForm, { CycleData } from "./wizard360/CycleDataForm";
import WeightsConfiguration, { WeightsData } from "./wizard360/WeightsConfiguration";
import CompetenciesSelector, { CompetenciesData } from "./wizard360/CompetenciesSelector";
import ParticipantsManager, { ParticipantsData } from "./wizard360/ParticipantsManager";
import CyclePreview from "./wizard360/CyclePreview";
import { useWizardDraft } from "@/hooks/useWizardDraft";
import { DraftRecoveryDialog } from "./wizard/DraftRecoveryDialog";
import { TemplateSelector } from "./wizard360/TemplateSelector";
import { SaveTemplateDialog } from "./wizard360/SaveTemplateDialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const steps = [
  { number: 1, title: "Dados do Ciclo", description: "Informações básicas" },
  { number: 2, title: "Pesos", description: "Configurar pesos das avaliações" },
  { number: 3, title: "Competências", description: "Selecionar competências" },
  { number: 4, title: "Participantes", description: "Adicionar avaliadores" },
  { number: 5, title: "Revisão", description: "Confirmar e criar ciclo" }
];

export default function Evaluation360EnhancedWizard() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const { draft, hasDraft, lastSaved, saveDraft, clearDraft, restoreDraft } = useWizardDraft();
  
  // Estado de cada etapa
  const [cycleData, setCycleData] = useState<CycleData>({
    name: "",
    description: "",
    year: new Date().getFullYear(),
    type: "anual",
    startDate: undefined,
    endDate: undefined,
    evaluationDeadline: undefined
  });

  const [weightsData, setWeightsData] = useState<WeightsData>({
    selfWeight: 20,
    peerWeight: 30,
    subordinateWeight: 20,
    managerWeight: 30
  });

  const [competenciesData, setCompetenciesData] = useState<CompetenciesData>({
    selectedCompetencies: []
  });

  const [participantsData, setParticipantsData] = useState<ParticipantsData>({
    participants: []
  });

  // Verificar rascunho ao montar
  useEffect(() => {
    if (hasDraft) {
      setShowDraftDialog(true);
    }
  }, [hasDraft]);

  // Salvar automaticamente ao mudar de etapa
  useEffect(() => {
    if (currentStep > 1) {
      handleSaveDraft(false);
    }
  }, [currentStep]);

  const handleSaveDraft = (showToast = true) => {
    const success = saveDraft({
      step: currentStep,
      cycleData: {
        name: cycleData.name,
        description: cycleData.description,
        year: cycleData.year,
        type: cycleData.type,
        startDate: cycleData.startDate?.toISOString() || '',
        endDate: cycleData.endDate?.toISOString() || '',
      },
      weights: {
        autoAvaliacaoWeight: weightsData.selfWeight,
        avaliacaoGerenteWeight: weightsData.managerWeight,
        avaliacaoPares: weightsData.peerWeight,
        avaliacaoSubordinados: weightsData.subordinateWeight,
      },
      competencies: competenciesData.selectedCompetencies.map(id => ({
        id,
        name: '',
        description: '',
        requiredLevel: 3,
      })),
      participants: participantsData.participants.map(p => ({
        employeeId: p.employeeId,
        role: p.role,
        name: p.name,
      })),
      savedAt: new Date().toISOString(),
    });

    if (success && showToast) {
      toast.success("Rascunho salvo com sucesso!");
    }
  };

  const handleRestoreDraft = () => {
    const restored = restoreDraft();
    if (restored) {
      setCurrentStep(restored.step as WizardStep);
      setCycleData({
        name: restored.cycleData.name,
        description: restored.cycleData.description,
        year: restored.cycleData.year || new Date().getFullYear(),
        type: restored.cycleData.type || "anual",
        startDate: restored.cycleData.startDate ? new Date(restored.cycleData.startDate) : undefined,
        endDate: restored.cycleData.endDate ? new Date(restored.cycleData.endDate) : undefined,
        evaluationDeadline: undefined,
      });
      setWeightsData({
        selfWeight: restored.weights.autoAvaliacaoWeight,
        managerWeight: restored.weights.avaliacaoGerenteWeight,
        peerWeight: restored.weights.avaliacaoPares,
        subordinateWeight: restored.weights.avaliacaoSubordinados,
      });
      setCompetenciesData({
        selectedCompetencies: restored.competencies.map(c => c.id),
      });
      setParticipantsData({
        participants: restored.participants.map(p => ({
          employeeId: p.employeeId,
          role: p.role,
          name: p.name,
        })),
      });
      toast.success("Rascunho restaurado!");
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftDialog(false);
    toast.info("Rascunho descartado");
  };

  const createCycleMutation = trpc.evaluationCycles.create.useMutation({
    onSuccess: () => {
      clearDraft();
      toast.success("Ciclo 360° Enhanced criado com sucesso!");
      setLocation("/360-enhanced");
    },
    onError: (error) => {
      toast.error(`Erro ao criar ciclo: ${error.message}`);
    }
  });

  const handleFinalSubmit = () => {
    if (!cycleData.startDate || !cycleData.endDate || !cycleData.evaluationDeadline) {
      toast.error("Datas inválidas");
      return;
    }

    createCycleMutation.mutate({
      name: cycleData.name,
      description: cycleData.description,
      year: cycleData.year,
      type: cycleData.type,
      startDate: cycleData.startDate.toISOString(),
      endDate: cycleData.endDate.toISOString(),
      evaluationDeadline: cycleData.evaluationDeadline.toISOString(),
      selfWeight: weightsData.selfWeight,
      peerWeight: weightsData.peerWeight,
      subordinateWeight: weightsData.subordinateWeight,
      managerWeight: weightsData.managerWeight,
      competencyIds: competenciesData.selectedCompetencies,
      participants: participantsData.participants.map(p => ({
        employeeId: p.employeeId,
        role: p.role
      }))
    });
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Criar Ciclo 360° Enhanced</h1>
        <p className="text-muted-foreground">
          Configure um novo ciclo de avaliação 360 graus com pesos personalizados
        </p>
      </div>

      {/* Draft Recovery Dialog */}
      <DraftRecoveryDialog
        open={showDraftDialog}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
        lastSaved={lastSaved}
      />

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Etapa {currentStep} de {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}% concluído
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Template Selector Dialog */}
      <TemplateSelector
        open={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={(template) => {
          setWeightsData({
            selfWeight: template.selfWeight,
            peerWeight: template.peerWeight,
            subordinateWeight: template.subordinateWeight,
            managerWeight: template.managerWeight,
          });
          setCompetenciesData({
            selectedCompetencies: template.competencyIds,
          });
        }}
      />

      {/* Save Template Dialog */}
      <SaveTemplateDialog
        open={showSaveTemplate}
        onClose={() => setShowSaveTemplate(false)}
        weights={weightsData}
        competencyIds={competenciesData.selectedCompetencies}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateSelector(true)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Carregar Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveDraft(true)}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Rascunho
          </Button>
          {(currentStep === 3 || currentStep === 4 || currentStep === 5) && competenciesData.selectedCompetencies.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSaveTemplate(true)}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              Salvar como Template
            </Button>
          )}
        </div>
        {lastSaved && (
          <span className="text-xs text-muted-foreground">
            Salvo {formatDistanceToNow(lastSaved, { addSuffix: true, locale: ptBR })}
          </span>
        )}
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          
          return (
            <div
              key={step.number}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isCurrent 
                  ? 'border-primary bg-primary/5' 
                  : isCompleted 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                isCurrent 
                  ? 'bg-primary text-primary-foreground' 
                  : isCompleted 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : step.number}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${
                  isCurrent ? 'text-primary' : isCompleted ? 'text-green-700' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <CycleDataForm
              data={cycleData}
              onChange={setCycleData}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <WeightsConfiguration
              data={weightsData}
              onChange={setWeightsData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <CompetenciesSelector
              data={competenciesData}
              onChange={setCompetenciesData}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <ParticipantsManager
              data={participantsData}
              onChange={setParticipantsData}
              onBack={() => setCurrentStep(3)}
              onSubmit={() => setCurrentStep(5)}
              isSubmitting={false}
            />
          )}

          {currentStep === 5 && (
            <CyclePreview
              cycleData={cycleData}
              weightsData={weightsData}
              competenciesData={competenciesData}
              participantsData={participantsData}
              onEditStep={(step) => setCurrentStep(step)}
              onBack={() => setCurrentStep(4)}
              onSubmit={handleFinalSubmit}
              isSubmitting={createCycleMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
