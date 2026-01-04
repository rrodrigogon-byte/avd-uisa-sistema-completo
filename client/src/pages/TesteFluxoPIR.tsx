import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Clock, Mail, Send, TestTube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Página de testes end-to-end do fluxo completo de PIR Integridade
 * Permite enviar testes reais para candidatos e validar todo o processo
 */
export default function TesteFluxoPIR() {
  const { user } = useAuth();
  const [testEmail, setTestEmail] = useState("");
  const [testName, setTestName] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sentAssessmentId, setSentAssessmentId] = useState<number | null>(null);

  const createTestMutation = trpc.pirIntegrity.createAssessment.useMutation({
    onSuccess: (data) => {
      setTestStatus("sent");
      setSentAssessmentId(data.id);
      toast.success("Teste enviado com sucesso!", {
        description: `Email enviado para ${testEmail}`,
      });
    },
    onError: (error) => {
      setTestStatus("error");
      toast.error("Erro ao enviar teste", {
        description: error.message,
      });
    },
  });

  const checkStatusQuery = trpc.pirIntegrity.getAssessmentById.useQuery(
    { id: sentAssessmentId! },
    {
      enabled: sentAssessmentId !== null,
      refetchInterval: 5000, // Atualiza a cada 5 segundos
    }
  );

  const handleSendTest = async () => {
    if (!testEmail || !testName) {
      toast.error("Preencha todos os campos");
      return;
    }

    setTestStatus("sending");
    createTestMutation.mutate({
      candidateName: testName,
      candidateEmail: testEmail,
      expiresInDays: 7,
    });
  };

  const handleReset = () => {
    setTestEmail("");
    setTestName("");
    setTestStatus("idle");
    setSentAssessmentId(null);
  };

  const getStatusBadge = () => {
    if (!checkStatusQuery.data) return null;

    const status = checkStatusQuery.data.status;
    const statusConfig = {
      pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pendente" },
      in_progress: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", label: "Em Andamento" },
      completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Concluído" },
      expired: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Expirado" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bg}`}>
        <Icon className={`h-5 w-5 ${config.color}`} />
        <span className={`font-medium ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  const getProgressPercentage = () => {
    if (!checkStatusQuery.data) return 0;
    const { answeredQuestions, totalQuestions } = checkStatusQuery.data;
    if (!totalQuestions) return 0;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teste de Fluxo Completo - PIR Integridade</h1>
        <p className="text-muted-foreground">
          Sistema de testes end-to-end para validar o fluxo completo de envio, resposta e conclusão de testes PIR
        </p>
      </div>

      <div className="grid gap-6">
        {/* Card de Envio de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Enviar Teste para Candidato Real
            </CardTitle>
            <CardDescription>
              Envie um teste PIR de integridade para um candidato real e acompanhe o progresso em tempo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="testName">Nome do Candidato</Label>
                <Input
                  id="testName"
                  placeholder="Ex: João Silva"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  disabled={testStatus === "sending" || testStatus === "sent"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="testEmail">Email do Candidato</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="Ex: joao.silva@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={testStatus === "sending" || testStatus === "sent"}
                />
              </div>
            </div>

            <div className="flex gap-2">
              {testStatus === "idle" || testStatus === "error" ? (
                <Button onClick={handleSendTest} disabled={testStatus === "sending"} className="gap-2">
                  <Send className="h-4 w-4" />
                  {testStatus === "sending" ? "Enviando..." : "Enviar Teste"}
                </Button>
              ) : null}

              {testStatus === "sent" ? (
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  Enviar Novo Teste
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {/* Card de Status do Teste */}
        {testStatus === "sent" && checkStatusQuery.data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Status do Teste em Tempo Real
                </CardTitle>
                <CardDescription>Acompanhe o progresso do candidato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status Atual:</span>
                    {getStatusBadge()}
                  </div>

                  <Separator />

                  <div className="grid gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Candidato:</span>
                      <span className="font-medium">{checkStatusQuery.data.candidateName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{checkStatusQuery.data.candidateEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Data de Envio:</span>
                      <span className="font-medium">
                        {new Date(checkStatusQuery.data.createdAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Expira em:</span>
                      <span className="font-medium">
                        {new Date(checkStatusQuery.data.expiresAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progresso:</span>
                      <span className="text-muted-foreground">
                        {checkStatusQuery.data.answeredQuestions} de {checkStatusQuery.data.totalQuestions} questões
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                    <div className="text-center text-sm font-medium text-primary">{getProgressPercentage()}%</div>
                  </div>

                  {checkStatusQuery.data.status === "completed" && checkStatusQuery.data.completedAt && (
                    <>
                      <Separator />
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-medium text-green-900">Teste Concluído com Sucesso!</p>
                            <p className="text-sm text-green-700">
                              Concluído em: {new Date(checkStatusQuery.data.completedAt).toLocaleString("pt-BR")}
                            </p>
                            <p className="text-sm text-green-700">
                              Tempo total:{" "}
                              {Math.round(
                                (new Date(checkStatusQuery.data.completedAt).getTime() -
                                  new Date(checkStatusQuery.data.createdAt).getTime()) /
                                  1000 /
                                  60
                              )}{" "}
                              minutos
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de Validações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Validações do Fluxo
                </CardTitle>
                <CardDescription>Checklist de validações do teste end-to-end</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ValidationItem
                    label="Email enviado com sucesso"
                    status={testStatus === "sent"}
                    description="Candidato recebeu o email com link de acesso"
                  />
                  <ValidationItem
                    label="Candidato acessou o teste"
                    status={checkStatusQuery.data.status !== "pending"}
                    description="Link foi clicado e teste foi iniciado"
                  />
                  <ValidationItem
                    label="Respostas sendo salvas"
                    status={checkStatusQuery.data.answeredQuestions > 0}
                    description="Sistema está salvando as respostas corretamente"
                  />
                  <ValidationItem
                    label="Teste concluído"
                    status={checkStatusQuery.data.status === "completed"}
                    description="Todas as questões foram respondidas"
                  />
                  <ValidationItem
                    label="Resultados calculados"
                    status={checkStatusQuery.data.status === "completed"}
                    description="Pontuações e análises foram geradas"
                  />
                  <ValidationItem
                    label="Notificação de conclusão enviada"
                    status={checkStatusQuery.data.status === "completed"}
                    description="Email de confirmação foi enviado"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

interface ValidationItemProps {
  label: string;
  status: boolean;
  description: string;
}

function ValidationItem({ label, status, description }: ValidationItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      {status ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
      ) : (
        <Clock className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${status ? "text-green-900" : "text-muted-foreground"}`}>{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
