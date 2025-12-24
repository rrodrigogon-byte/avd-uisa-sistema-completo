import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface WeightsData {
  selfWeight: number;
  peerWeight: number;
  subordinateWeight: number;
  managerWeight: number;
}

interface WeightsConfigurationProps {
  data: WeightsData;
  onChange: (data: WeightsData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WeightsConfiguration({ data, onChange, onNext, onBack }: WeightsConfigurationProps) {
  const totalWeight = data.selfWeight + data.peerWeight + data.subordinateWeight + data.managerWeight;
  const isValid = totalWeight === 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      alert("A soma dos pesos deve ser exatamente 100%");
      return;
    }
    
    onNext();
  };

  const handleSliderChange = (key: keyof WeightsData, value: number[]) => {
    onChange({ ...data, [key]: value[0] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <Alert variant={isValid ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isValid 
              ? "✓ A soma dos pesos está correta (100%)" 
              : `A soma atual é ${totalWeight}%. Ajuste os pesos para totalizar 100%.`
            }
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Autoavaliação</CardTitle>
            <CardDescription>Peso da avaliação do próprio colaborador</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Peso</Label>
                <span className="text-2xl font-bold text-primary">{data.selfWeight}%</span>
              </div>
              <Slider
                value={[data.selfWeight]}
                onValueChange={(value) => handleSliderChange('selfWeight', value)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliação de Pares</CardTitle>
            <CardDescription>Peso da avaliação de colegas do mesmo nível hierárquico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Peso</Label>
                <span className="text-2xl font-bold text-primary">{data.peerWeight}%</span>
              </div>
              <Slider
                value={[data.peerWeight]}
                onValueChange={(value) => handleSliderChange('peerWeight', value)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliação de Subordinados</CardTitle>
            <CardDescription>Peso da avaliação da equipe liderada</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Peso</Label>
                <span className="text-2xl font-bold text-primary">{data.subordinateWeight}%</span>
              </div>
              <Slider
                value={[data.subordinateWeight]}
                onValueChange={(value) => handleSliderChange('subordinateWeight', value)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avaliação do Gestor</CardTitle>
            <CardDescription>Peso da avaliação do superior direto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Peso</Label>
                <span className="text-2xl font-bold text-primary">{data.managerWeight}%</span>
              </div>
              <Slider
                value={[data.managerWeight]}
                onValueChange={(value) => handleSliderChange('managerWeight', value)}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" disabled={!isValid}>
          Próximo: Selecionar Competências
        </Button>
      </div>
    </form>
  );
}
