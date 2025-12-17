import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Página intermediária de acesso ao PIR Integridade via token
 * Faz auto-login e redireciona para o teste
 */
export default function AcessoPIR() {
  const params = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const token = params.token || "";

  const autoLogin = trpc.integrityPIR.autoLoginPIR.useMutation({
    onSuccess: (data) => {
      // Salvar dados do convite no sessionStorage para usar no teste
      sessionStorage.setItem("pir_invitation", JSON.stringify(data.invitation));
      if (data.employee) {
        sessionStorage.setItem("pir_employee", JSON.stringify(data.employee));
      }
      
      // Redirecionar para o teste após 1 segundo
      setTimeout(() => {
        navigate(`/integridade/pir/responder/${token}`);
      }, 1000);
    },
    onError: (error) => {
      console.error("Erro no auto-login:", error);
    },
  });

  useEffect(() => {
    if (token && !autoLogin.isLoading && !autoLogin.isSuccess && !autoLogin.isError) {
      autoLogin.mutate({ token });
    }
  }, [token]);

  // Estado de carregamento
  if (autoLogin.isLoading || autoLogin.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            {autoLogin.isSuccess ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Acesso Validado!</h2>
                <p className="text-muted-foreground mb-4">
                  Redirecionando para o teste...
                </p>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Validando Acesso</h2>
                <p className="text-muted-foreground">
                  Aguarde enquanto verificamos seu convite...
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de erro
  if (autoLogin.isError) {
    const errorMessage = autoLogin.error.message || "Erro desconhecido";
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            
            <div className="space-y-2 text-sm text-left bg-muted p-4 rounded-lg mb-6">
              <p className="font-semibold">Possíveis causas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>O link pode ter expirado</li>
                <li>O teste já foi completado</li>
                <li>O link está incorreto ou foi alterado</li>
              </ul>
            </div>

            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado inicial (não deveria chegar aqui)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Teste de Integridade PIR</h2>
          <p className="text-muted-foreground">
            Preparando acesso ao teste...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
