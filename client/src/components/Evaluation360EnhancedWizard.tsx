import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4;

export default function Evaluation360EnhancedWizard() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { number: 1, title: "Dados do Ciclo", description: "Informações básicas" },
    { number: 2, title: "Configuração de Pesos", description: "Dimensões de avaliação" },
    { number: 3, title: "Competências", description: "Seleção de competências" },
    { number: 4, title: "Participantes", description: "Adicionar participantes" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Criar Ciclo 360° Enhanced</h1>
        <p className="text-muted-foreground">Siga as 4 etapas para criar um novo ciclo de avaliação</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex flex-col items-center cursor-pointer transition-all ${
                currentStep >= step.number ? "opacity-100" : "opacity-50"
              }`}
              onClick={() => currentStep > step.number && setCurrentStep(step.number as Step)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                  currentStep === step.number
                    ? "bg-blue-600 text-white"
                    : currentStep > step.number
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {currentStep > step.number ? "✓" : step.number}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 h-1 rounded-full">
          <div
            className="bg-blue-600 h-1 rounded-full transition-all"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Etapa {currentStep} - Em desenvolvimento
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as Step)}
          disabled={currentStep === 1 || isLoading}
        >
          ← Anterior
        </Button>

        {currentStep < 4 ? (
          <Button onClick={() => setCurrentStep(Math.min(4, currentStep + 1) as Step)} disabled={isLoading}>
            Próximo →
          </Button>
        ) : (
          <Button disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? "Finalizando..." : "Finalizar Ciclo"}
          </Button>
        )}
      </div>
    </div>
  );
}
