import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Question } from "./QuestionBuilder";
import { Calendar, Clock, Users, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EvaluationPreviewProps {
  title: string;
  description?: string;
  questions: Question[];
  startDate?: Date;
  endDate?: Date;
  targetAudience?: string;
  estimatedTime?: number;
}

export function EvaluationPreview({
  title,
  description,
  questions,
  startDate,
  endDate,
  targetAudience,
  estimatedTime,
}: EvaluationPreviewProps) {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  const requiredQuestions = questions.filter(q => q.required).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Avaliação */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <Badge variant="outline">Preview</Badge>
              </div>
              <CardTitle className="text-2xl">{title || "Título da Avaliação"}</CardTitle>
              {description && (
                <CardDescription className="text-base">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Início</p>
                  <p className="text-muted-foreground">
                    {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
            {endDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Término</p>
                  <p className="text-muted-foreground">
                    {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            )}
            {estimatedTime && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Tempo estimado</p>
                  <p className="text-muted-foreground">{estimatedTime} minutos</p>
                </div>
              </div>
            )}
            {targetAudience && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Público</p>
                  <p className="text-muted-foreground">{targetAudience}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>{questions.length} questões</span>
            <span>•</span>
            <span>{requiredQuestions} obrigatórias</span>
            <span>•</span>
            <span>Peso total: {totalWeight.toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Questões */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle className="text-lg flex items-start gap-2">
                <span className="text-muted-foreground font-normal">
                  {index + 1}.
                </span>
                <div className="flex-1">
                  {question.title}
                  {question.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Peso: {question.weight}
                </Badge>
              </CardTitle>
              {question.description && (
                <CardDescription>{question.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {/* Múltipla Escolha */}
              {question.type === "multipla_escolha" && (
                <RadioGroup disabled>
                  {question.options?.map((option, idx) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={`${question.id}-${option.id}`} />
                      <Label htmlFor={`${question.id}-${option.id}`} className="font-normal">
                        {option.text || `Opção ${idx + 1}`}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Escala Likert */}
              {question.type === "escala" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{question.minLabel}</span>
                    <span className="text-muted-foreground">{question.maxLabel}</span>
                  </div>
                  <Slider
                    disabled
                    min={question.minValue || 1}
                    max={question.maxValue || 5}
                    step={1}
                    defaultValue={[Math.floor(((question.maxValue || 5) + (question.minValue || 1)) / 2)]}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {Array.from(
                      { length: (question.maxValue || 5) - (question.minValue || 1) + 1 },
                      (_, i) => (question.minValue || 1) + i
                    ).map(value => (
                      <span key={value}>{value}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dissertativa */}
              {question.type === "dissertativa" && (
                <Textarea
                  placeholder="Escreva sua resposta aqui..."
                  disabled
                  className="min-h-[120px]"
                />
              )}

              {/* Sim/Não */}
              {question.type === "sim_nao" && (
                <RadioGroup disabled>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id={`${question.id}-sim`} />
                    <Label htmlFor={`${question.id}-sim`} className="font-normal">
                      Sim
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id={`${question.id}-nao`} />
                    <Label htmlFor={`${question.id}-nao`} className="font-normal">
                      Não
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {/* Nota */}
              {question.type === "nota" && (
                <div className="space-y-4">
                  <Slider
                    disabled
                    min={0}
                    max={10}
                    step={0.5}
                    defaultValue={[5]}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {[0, 2, 4, 6, 8, 10].map(value => (
                      <span key={value}>{value}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhuma questão para visualizar
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Adicione questões para ver o preview da avaliação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
