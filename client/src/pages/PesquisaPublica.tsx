import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { APP_LOGO, APP_TITLE } from "@/const";

/**
 * Página Pública de Resposta de Pesquisa Pulse
 * Acessível sem login via link único
 */

export default function PesquisaPublica() {
  const { id } = useParams();
  const surveyId = parseInt(id || "0");
  
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Buscar dados da pesquisa
  const { data: survey, isLoading } = trpc.pulse.getPublicSurvey.useQuery(
    { surveyId },
    { enabled: surveyId > 0 }
  );

  // Mutation para enviar resposta
  const submitMutation = trpc.pulse.submitResponse.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Resposta enviada com sucesso! Obrigado pela participação.");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar resposta: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (rating === null) {
      toast.error("Por favor, selecione uma nota de 0 a 10");
      return;
    }

    submitMutation.mutate({
      surveyId,
      rating,
      comment: comment.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Pesquisa não encontrada ou não está mais ativa.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-muted-foreground text-center">
              Sua resposta foi registrada com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={APP_LOGO} 
            alt={APP_TITLE} 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pesquisa Pulse
          </h1>
          <p className="text-muted-foreground mt-2">
            Sua opinião é muito importante para nós
          </p>
        </div>

        {/* Formulário de Resposta */}
        <Card>
          <CardHeader>
            <CardTitle>{survey.title}</CardTitle>
            <CardDescription>{survey.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pergunta */}
            <div className="bg-orange-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-orange-500">
              <p className="text-lg font-medium">{survey.question}</p>
            </div>

            {/* Escala de Avaliação 0-10 */}
            <div className="space-y-3">
              <Label className="text-base">
                Avalie de 0 a 10 (0 = Discordo totalmente, 10 = Concordo totalmente)
              </Label>
              <div className="grid grid-cols-11 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className={`
                      h-12 rounded-lg font-bold transition-all
                      ${rating === value
                        ? "bg-orange-500 text-white scale-110 shadow-lg"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-gray-600"
                      }
                      border-2 ${rating === value ? "border-orange-600" : "border-gray-300 dark:border-gray-600"}
                    `}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Discordo totalmente</span>
                <span>Concordo totalmente</span>
              </div>
            </div>

            {/* Comentário Opcional */}
            <div className="space-y-2">
              <Label htmlFor="comment">
                Comentário (opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Compartilhe sua opinião ou sugestões..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Botão de Envio */}
            <Button
              onClick={handleSubmit}
              disabled={rating === null || submitMutation.isPending}
              className="w-full h-12 text-base"
              size="lg"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Sistema AVD UISA - Avaliação de Desempenho</p>
        </div>
      </div>
    </div>
  );
}
