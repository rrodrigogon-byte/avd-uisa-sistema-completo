import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";

/**
 * Workflows
 * 
 * Features:
 * - Visualização de processos de aprovação
 * - Status de cada etapa do workflow
 * - Tempo médio por etapa
 * - Fluxos configuráveis
 */

export default function Workflows() {
  // Mock data - TODO: integrar com backend
  const workflows = [
    {
      id: 1,
      name: "Aprovação de Bônus",
      description: "Fluxo de aprovação para solicitações de bônus",
      steps: [
        { name: "Solicitação", status: "completed", avgTime: "0.5h" },
        { name: "Gestor Direto", status: "completed", avgTime: "1d" },
        { name: "RH", status: "in_progress", avgTime: "2d" },
        { name: "Diretoria", status: "pending", avgTime: "3d" },
        { name: "Finalizado", status: "pending", avgTime: "-" },
      ],
      activeRequests: 8,
      avgTotalTime: "6.5 dias",
    },
    {
      id: 2,
      name: "Aprovação de Férias",
      description: "Fluxo de aprovação para solicitações de férias",
      steps: [
        { name: "Solicitação", status: "completed", avgTime: "0.5h" },
        { name: "Gestor Direto", status: "completed", avgTime: "0.5d" },
        { name: "RH", status: "completed", avgTime: "1d" },
        { name: "Finalizado", status: "completed", avgTime: "-" },
      ],
      activeRequests: 15,
      avgTotalTime: "2 dias",
    },
    {
      id: 3,
      name: "Aprovação de Promoção",
      description: "Fluxo de aprovação para promoções e mudanças de cargo",
      steps: [
        { name: "Solicitação", status: "completed", avgTime: "0.5h" },
        { name: "Gestor Direto", status: "completed", avgTime: "2d" },
        { name: "Gerência", status: "in_progress", avgTime: "3d" },
        { name: "Diretoria", status: "pending", avgTime: "5d" },
        { name: "RH", status: "pending", avgTime: "2d" },
        { name: "Finalizado", status: "pending", avgTime: "-" },
      ],
      activeRequests: 3,
      avgTotalTime: "12 dias",
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500">Em Andamento</Badge>;
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="destructive">Erro</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Workflows de Aprovação</h1>
          <p className="text-muted-foreground">
            Visualização e gerenciamento de fluxos de aprovação
          </p>
        </div>

        {/* Workflows */}
        <div className="space-y-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch className="h-5 w-5 text-primary" />
                      <CardTitle>{workflow.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">{workflow.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Solicitações Ativas</p>
                    <p className="text-2xl font-bold">{workflow.activeRequests}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Steps */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-4">
                  {workflow.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="flex items-center justify-center mb-2">
                          {getStatusIcon(step.status)}
                        </div>
                        <p className="text-sm font-semibold text-center mb-1">{step.name}</p>
                        <p className="text-xs text-muted-foreground text-center mb-2">
                          Média: {step.avgTime}
                        </p>
                        {getStatusBadge(step.status)}
                      </div>
                      {idx < workflow.steps.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      <strong>Tempo Médio Total:</strong> {workflow.avgTotalTime}
                    </span>
                    <span>
                      <strong>Etapas:</strong> {workflow.steps.length}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
