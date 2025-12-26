/**
 * Página Administrativa de Gestão de Ciclos
 * 
 * Permite:
 * - Criar novos ciclos de avaliação
 * - Executar ciclo completo simulado
 * - Monitorar progresso dos ciclos
 * - Visualizar estatísticas
 * - Enviar lembretes
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Play,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Download,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CycleManagement() {
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [testEmails, setTestEmails] = useState(
    "rodrigo.goncalves@uisa.com.br\nbernardo.mendes@uisa.com.br\nrodrigo.dias@uisa.com.br"
  );

  // Queries
  const { data: cycles, refetch: refetchCycles } = trpc.cycles.list.useQuery(undefined);

  // Mutations
  const runCompleteCycle = trpc.evaluationCycle.runCompleteCycle.useMutation({
    onSuccess: (data) => {
      toast.success("Ciclo completo executado com sucesso!", {
        description: `${data.summary.evaluationsCompleted} avaliações concluídas, ${data.summary.pdisGenerated} PDIs gerados`,
      });
      setIsRunningCycle(false);
      refetchCycles();
    },
    onError: (error) => {
      toast.error("Erro ao executar ciclo", {
        description: error.message,
      });
      setIsRunningCycle(false);
    },
  });

  const sendEmails = trpc.evaluationCycle.sendEvaluationEmails.useMutation({
    onSuccess: (data) => {
      toast.success("Emails enviados!", {
        description: `${data.totalSent} enviados, ${data.totalFailed} falharam`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao enviar emails", {
        description: error.message,
      });
    },
  });

  const handleRunCompleteCycle = () => {
    if (!selectedCycleId) {
      toast.error("Selecione um ciclo");
      return;
    }

    const emails = testEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error("Adicione pelo menos um email");
      return;
    }

    setIsRunningCycle(true);
    runCompleteCycle.mutate({
      cycleId: selectedCycleId,
      emails,
    });
  };

  const handleSendEmails = () => {
    if (!selectedCycleId) {
      toast.error("Selecione um ciclo");
      return;
    }

    const emails = testEmails
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      toast.error("Adicione pelo menos um email");
      return;
    }

    sendEmails.mutate({
      cycleId: selectedCycleId,
      emails,
    });
  };

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestão de Ciclos</h1>
          <p className="text-muted-foreground">
            Administre ciclos de avaliação e execute testes automáticos
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ciclo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Ciclo</DialogTitle>
              <DialogDescription>
                Configure um novo ciclo de avaliação de desempenho
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome do Ciclo</Label>
                <Input placeholder="Ex: Avaliação Anual 2025" />
              </div>
              <div>
                <Label>Ano</Label>
                <Input type="number" placeholder="2025" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea placeholder="Descrição do ciclo..." />
              </div>
            </div>
            <DialogFooter>
              <Button>Criar Ciclo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ação Rápida: Executar Ciclo Completo */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Executar Ciclo Completo Simulado
          </CardTitle>
          <CardDescription>
            Execute um ciclo completo de avaliação de forma automática para testes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selecione o Ciclo</Label>
            <select
              className="w-full mt-1 p-2 border rounded-md"
              value={selectedCycleId || ""}
              onChange={(e) => setSelectedCycleId(parseInt(e.target.value))}
            >
              <option value="">Selecione um ciclo...</option>
              {cycles?.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name} - {cycle.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Emails para Teste (um por linha)</Label>
            <Textarea
              value={testEmails}
              onChange={(e) => setTestEmails(e.target.value)}
              rows={5}
              placeholder="email1@example.com&#10;email2@example.com"
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {testEmails.split("\n").filter((e) => e.trim().length > 0).length} emails
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">O que será executado:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✅ Criar avaliações para os funcionários</li>
              <li>✅ Enviar emails de notificação</li>
              <li>✅ Preencher autoavaliações automaticamente</li>
              <li>✅ Preencher avaliações do gestor automaticamente</li>
              <li>✅ Calcular notas finais</li>
              <li>✅ Gerar PDIs automáticos</li>
              <li>✅ Calcular quartis e estatísticas</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRunCompleteCycle}
              disabled={isRunningCycle || !selectedCycleId}
              className="flex-1"
            >
              {isRunningCycle ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Ciclo Completo
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSendEmails}
              disabled={!selectedCycleId}
            >
              <Mail className="h-4 w-4 mr-2" />
              Apenas Enviar Emails
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ciclos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Ciclos Ativos</h2>
        <div className="grid grid-cols-1 gap-4">
          {cycles?.map((cycle) => (
            <Card key={cycle.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{cycle.name}</CardTitle>
                    <CardDescription>
                      {cycle.year} • {cycle.type}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      cycle.status === "ativo"
                        ? "default"
                        : cycle.status === "concluido"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {cycle.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Início</div>
                    <div className="font-semibold">
                      {cycle.startDate
                        ? new Date(cycle.startDate).toLocaleDateString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Término</div>
                    <div className="font-semibold">
                      {cycle.endDate
                        ? new Date(cycle.endDate).toLocaleDateString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Autoavaliação</div>
                    <div className="font-semibold">
                      {cycle.selfEvaluationDeadline
                        ? new Date(cycle.selfEvaluationDeadline).toLocaleDateString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Gestor</div>
                    <div className="font-semibold">
                      {cycle.managerEvaluationDeadline
                        ? new Date(cycle.managerEvaluationDeadline).toLocaleDateString("pt-BR")
                        : "-"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Ver Participantes
                  </Button>
                  <Button variant="outline" size="sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Dashboard PIR
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
