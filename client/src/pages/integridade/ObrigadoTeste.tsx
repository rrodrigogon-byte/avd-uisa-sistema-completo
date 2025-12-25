import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

/**
 * Página de agradecimento após conclusão do teste de integridade
 */
export default function ObrigadoTeste() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Teste Concluído com Sucesso!</CardTitle>
          <CardDescription>
            Obrigado por dedicar seu tempo para responder ao Teste de Integridade PIR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-medium mb-2">O que acontece agora?</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Suas respostas foram enviadas com sucesso</li>
              <li>Os resultados serão analisados pela equipe responsável</li>
              <li>Você será contatado em breve sobre os próximos passos</li>
            </ul>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Se você tiver alguma dúvida, entre em contato com a pessoa que enviou o convite.
            </p>
          </div>

          <Button onClick={() => navigate("/")} className="w-full" variant="outline">
            Voltar para Página Inicial
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
