import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EvaluationFormProps {
  evaluationId: number;
  type: "self" | "manager" | "peer" | "subordinate";
  onComplete?: () => void;
}

const competencies = [
  {
    id: 1,
    name: "Comunicação",
    description: "Capacidade de se expressar claramente e ouvir ativamente",
  },
  {
    id: 2,
    name: "Trabalho em Equipe",
    description: "Colaboração efetiva com colegas e contribuição para objetivos comuns",
  },
  {
    id: 3,
    name: "Liderança",
    description: "Capacidade de inspirar, motivar e guiar outros",
  },
  {
    id: 4,
    name: "Resolução de Problemas",
    description: "Habilidade de identificar e resolver desafios de forma criativa",
  },
  {
    id: 5,
    name: "Adaptabilidade",
    description: "Flexibilidade para lidar com mudanças e novas situações",
  },
  {
    id: 6,
    name: "Orientação para Resultados",
    description: "Foco em atingir metas e entregar resultados de qualidade",
  },
  {
    id: 7,
    name: "Iniciativa",
    description: "Proatividade e autonomia para tomar ações sem supervisão constante",
  },
  {
    id: 8,
    name: "Conhecimento Técnico",
    description: "Domínio das habilidades e conhecimentos necessários para a função",
  },
];

const scaleLabels = [
  "Insatisfatório",
  "Abaixo do Esperado",
  "Atende Expectativas",
  "Supera Expectativas",
  "Excepcional",
];

export default function EvaluationForm({ evaluationId, type, onComplete }: EvaluationFormProps) {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [generalComments, setGeneralComments] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // TODO: Implement API call when endpoint is ready

  const getTypeLabel = () => {
    const labels = {
      self: "Autoavaliação",
      manager: "Avaliação do Gestor",
      peer: "Avaliação de Pares",
      subordinate: "Avaliação da Equipe",
    };
    return labels[type];
  };

  const handleRatingChange = (competencyId: number, value: string) => {
    setRatings({ ...ratings, [competencyId]: Number(value) });
  };

  const handleCommentChange = (competencyId: number, value: string) => {
    setComments({ ...comments, [competencyId]: value });
  };

  const handleSubmit = async () => {
    // Validate all competencies are rated
    const missingRatings = competencies.filter((c) => !ratings[c.id]);
    if (missingRatings.length > 0) {
      toast.error("Por favor, avalie todas as competências antes de enviar");
      return;
    }

    // TODO: Replace with actual API call
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    toast.success("Avaliação enviada com sucesso!");
    onComplete?.();
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="font-semibold text-xl mb-2">Avaliação Enviada!</h3>
          <p className="text-muted-foreground text-center">
            Obrigado por completar sua {getTypeLabel().toLowerCase()}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{getTypeLabel()}</CardTitle>
          <CardDescription>
            Avalie cada competência usando a escala de 1 a 5. Seus comentários são opcionais mas
            muito valiosos.
          </CardDescription>
        </CardHeader>
      </Card>

      {competencies.map((competency) => (
        <Card key={competency.id}>
          <CardHeader>
            <CardTitle className="text-base">{competency.name}</CardTitle>
            <CardDescription>{competency.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Avaliação *</Label>
              <RadioGroup
                value={ratings[competency.id]?.toString()}
                onValueChange={(value) => handleRatingChange(competency.id, value)}
                className="flex flex-col space-y-2"
              >
                {[1, 2, 3, 4, 5].map((rating) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <RadioGroupItem value={rating.toString()} id={`${competency.id}-${rating}`} />
                    <Label
                      htmlFor={`${competency.id}-${rating}`}
                      className="flex items-center gap-2 cursor-pointer font-normal"
                    >
                      <span className="font-semibold w-4">{rating}</span>
                      <span className="text-muted-foreground">- {scaleLabels[rating - 1]}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`comment-${competency.id}`}>
                Comentários (opcional)
              </Label>
              <Textarea
                id={`comment-${competency.id}`}
                placeholder="Adicione observações ou exemplos específicos..."
                value={comments[competency.id] || ""}
                onChange={(e) => handleCommentChange(competency.id, e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comentários Gerais</CardTitle>
          <CardDescription>
            Adicione quaisquer observações adicionais sobre o desempenho geral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Pontos fortes, áreas de melhoria, conquistas notáveis..."
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          Enviar Avaliação
        </Button>
      </div>
    </div>
  );
}
