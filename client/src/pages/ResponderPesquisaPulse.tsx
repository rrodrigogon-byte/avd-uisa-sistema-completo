import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function ResponderPesquisaPulse() {
  const [rating, setRating] = useState<string>("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Dados mock da pesquisa (em produção viriam da URL)
  const survey = {
    id: 1,
    title: "Satisfação com Ambiente de Trabalho",
    question: "Como você avalia o ambiente de trabalho da empresa?",
    description: "Sua opinião é muito importante para melhorarmos continuamente nosso ambiente de trabalho.",
  };

  const handleSubmit = () => {
    if (!rating) {
      toast.error("Por favor, selecione uma nota antes de enviar");
      return;
    }

    // Aqui seria feita a chamada tRPC para salvar a resposta
    console.log({
      surveyId: survey.id,
      rating: parseInt(rating),
      comment,
    });

    toast.success("Resposta enviada com sucesso! Obrigado pela participação.");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Resposta Enviada!</h2>
            <p className="text-muted-foreground mb-6">
              Obrigado por participar da nossa pesquisa de pulse. Sua opinião é muito importante para nós.
            </p>
            <p className="text-sm text-muted-foreground">
              Você pode fechar esta janela agora.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12" />
          </div>
          <CardTitle className="text-2xl">{survey.title}</CardTitle>
          <CardDescription className="text-base">{survey.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <p className="font-medium text-lg">{survey.question}</p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">
                Selecione uma nota de 0 a 10:
              </Label>
              <RadioGroup value={rating} onValueChange={setRating} className="grid grid-cols-11 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value: any) => (
                  <div key={value} className="flex flex-col items-center">
                    <RadioGroupItem
                      value={value.toString()}
                      id={`rating-${value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`rating-${value}`}
                      className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 border-muted bg-background hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-500 peer-data-[state=checked]:text-white transition-all"
                    >
                      {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Muito insatisfeito</span>
                <span>Muito satisfeito</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-base font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentário (opcional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Compartilhe mais detalhes sobre sua avaliação..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              className="flex-1 h-12 text-base"
              disabled={!rating}
            >
              Enviar Resposta
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Suas respostas são confidenciais e serão usadas apenas para melhorar nosso ambiente de trabalho.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
