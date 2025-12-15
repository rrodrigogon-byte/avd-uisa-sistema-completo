import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, ThumbsUp, Meh, ThumbsDown, CheckCircle2, Loader2 } from "lucide-react";

interface NPSSurveyProps {
  surveyId: number;
  employeeId: number;
  processId?: number;
  onComplete?: () => void;
}

export default function NPSSurvey({ surveyId, employeeId, processId, onComplete }: NPSSurveyProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState(Date.now());
  const [category, setCategory] = useState<"promoter" | "passive" | "detractor" | null>(null);

  const { data: survey, isLoading: surveyLoading } = trpc.nps.getById.useQuery({ surveyId });
  const { data: hasResponded } = trpc.nps.hasResponded.useQuery({ surveyId, employeeId, processId });

  const submitResponse = trpc.nps.submitResponse.useMutation({
    onSuccess: (data) => {
      setCategory(data.category);
      setSubmitted(true);
      toast.success("Obrigado pelo seu feedback!");
      onComplete?.();
    },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (hasResponded?.hasResponded) {
      setSubmitted(true);
    }
  }, [hasResponded]);

  const handleSubmit = () => {
    if (score === null) {
      toast.error("Por favor, selecione uma nota");
      return;
    }

    const responseTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    submitResponse.mutate({
      surveyId,
      employeeId,
      processId,
      score,
      followUpComment: comment || undefined,
      responseTimeSeconds,
      deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "mobile" : "desktop",
    });
  };

  const getScoreColor = (value: number) => {
    if (value >= 9) return "bg-green-500 hover:bg-green-600 text-white";
    if (value >= 7) return "bg-yellow-500 hover:bg-yellow-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  const getSelectedColor = (value: number) => {
    if (value >= 9) return "ring-2 ring-green-500 ring-offset-2";
    if (value >= 7) return "ring-2 ring-yellow-500 ring-offset-2";
    return "ring-2 ring-red-500 ring-offset-2";
  };

  const getFollowUpQuestion = () => {
    if (score === null) return null;
    if (score >= 9) return survey?.promoterFollowUp || "O que voce mais gostou?";
    if (score >= 7) return survey?.passiveFollowUp || "O que podemos melhorar?";
    return survey?.detractorFollowUp || "O que causou sua insatisfacao?";
  };

  if (surveyLoading) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="text-center py-12">
          <div className="mb-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 animate-pulse" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Obrigado!</h3>
          <p className="text-muted-foreground mb-4">Seu feedback e muito importante para nos.</p>
          {category && (
            <div className="flex items-center justify-center gap-2">
              {category === "promoter" && <ThumbsUp className="h-5 w-5 text-green-500" />}
              {category === "passive" && <Meh className="h-5 w-5 text-yellow-500" />}
              {category === "detractor" && <ThumbsDown className="h-5 w-5 text-red-500" />}
              <span className="text-sm text-muted-foreground">
                {category === "promoter" && "Voce e um promotor!"}
                {category === "passive" && "Obrigado pelo feedback neutro."}
                {category === "detractor" && "Vamos trabalhar para melhorar."}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Star className="h-6 w-6 text-yellow-500" />
          Pesquisa de Satisfacao
        </CardTitle>
        <CardDescription>{survey?.mainQuestion || "Em uma escala de 0 a 10, o quanto voce recomendaria nosso sistema?"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Nada provavel</span>
            <span>Muito provavel</span>
          </div>
          <div className="grid grid-cols-11 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <button
                key={value}
                onClick={() => setScore(value)}
                className={`p-2 rounded-lg text-sm font-medium transition-all ${
                  score === value ? getSelectedColor(value) : ""
                } ${getScoreColor(value)}`}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Detratores (0-6)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Neutros (7-8)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Promotores (9-10)</span>
            </div>
          </div>
        </div>

        {score !== null && (
          <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
            <label className="text-sm font-medium">{getFollowUpQuestion()}</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Seu comentario (opcional)..."
              rows={3}
            />
          </div>
        )}

        <Button onClick={handleSubmit} className="w-full" disabled={score === null || submitResponse.isPending}>
          {submitResponse.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Feedback"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
