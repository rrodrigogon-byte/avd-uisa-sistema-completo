import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, User, DollarSign, Calendar, FileText, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function BonusWorkflowApproval() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const instanceId = Number(params.id);
  
  const [comments, setComments] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Buscar detalhes da instância de workflow
  const { data: instance, isLoading, refetch } = trpc.bonusWorkflow.getInstance.useQuery({ instanceId });
  
  const approveMutation = trpc.bonusWorkflow.approveLevel.useMutation({
    onSuccess: () => {
      toast.success("Nível aprovado com sucesso!");
      refetch();
      setComments("");
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectMutation = trpc.bonusWorkflow.rejectLevel.useMutation({
    onSuccess: () => {
      toast.success("Bônus rejeitado");
      setLocation("/aprovacoes/bonus-workflow");
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!instance?.currentApproval) return;
    setIsApproving(true);
    approveMutation.mutate({
      approvalId: instance.currentApproval.id,
      comments,
    });
  };

  const handleReject = () => {
    if (!instance?.currentApproval) return;
    if (!comments.trim() || comments.length < 10) {
      toast.error("Comentário obrigatório para rejeição (mínimo 10 caracteres)");
      return;
    }
    setIsApproving(false);
    rejectMutation.mutate({
      approvalId: instance.currentApproval.id,
      comments,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!instance) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-96 gap-4">
          <XCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold">Workflow não encontrado</h2>
          <Button onClick={() => setLocation("/aprovacoes/bonus-workflow")}>
            Voltar para aprovações
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
  };

  const statusIcons = {
    pending: <Clock className="h-4 w-4" />,
    approved: <CheckCircle2 className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
  };

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Aprovação de Bônus - Workflow Multinível</h1>
            <p className="text-muted-foreground mt-1">
              Instância #{instanceId} - {instance.workflow.name}
            </p>
          </div>
          <Badge className={statusColors[instance.status]}>
            {statusIcons[instance.status]}
            <span className="ml-2">{instance.status === 'pending' ? 'Pendente' : instance.status === 'approved' ? 'Aprovado' : 'Rejeitado'}</span>
          </Badge>
        </div>

        <div className="grid gap-6">
          {/* Informações do Bônus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Informações do Bônus
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Colaborador</div>
                <div className="font-medium flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  {instance.employee.name}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Valor do Bônus</div>
                <div className="font-medium text-lg mt-1">
                  R$ {(instance.bonusCalculation.totalAmount / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Ciclo</div>
                <div className="font-medium mt-1">{instance.bonusCalculation.cycleName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Data de Solicitação</div>
                <div className="font-medium flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(instance.startedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Níveis de Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle>Níveis de Aprovação</CardTitle>
              <CardDescription>
                Progresso: Nível {instance.currentLevel} de {instance.levels.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instance.levels.map((level, index) => {
                  const approval = instance.approvals.find(a => a.levelOrder === level.levelOrder);
                  const isCurrent = level.levelOrder === instance.currentLevel;
                  const isPast = level.levelOrder < instance.currentLevel;
                  
                  return (
                    <div key={level.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          approval?.status === 'approved' ? 'bg-green-500 text-white' :
                          approval?.status === 'rejected' ? 'bg-red-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-gray-600'
                        }`}>
                          {approval?.status === 'approved' ? <CheckCircle2 className="h-5 w-5" /> :
                           approval?.status === 'rejected' ? <XCircle className="h-5 w-5" /> :
                           level.levelOrder}
                        </div>
                        {index < instance.levels.length - 1 && (
                          <div className={`w-0.5 h-12 ${isPast || isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">Nível {level.levelOrder}: {level.approverRole}</div>
                            {approval && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Aprovador: {approval.approverName}
                              </div>
                            )}
                          </div>
                          {approval && (
                            <Badge variant={
                              approval.status === 'approved' ? 'default' :
                              approval.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {approval.status === 'approved' ? 'Aprovado' :
                               approval.status === 'rejected' ? 'Rejeitado' :
                               'Pendente'}
                            </Badge>
                          )}
                        </div>
                        
                        {approval?.comments && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <div className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Comentários:
                            </div>
                            <div className="text-sm mt-1">{approval.comments}</div>
                          </div>
                        )}
                        
                        {approval?.decidedAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(approval.decidedAt).toLocaleString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ações de Aprovação */}
          {instance.currentApproval && instance.status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle>Sua Aprovação</CardTitle>
                <CardDescription>
                  Você é o aprovador do nível {instance.currentLevel}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Comentários</label>
                  <Textarea
                    placeholder="Adicione comentários sobre sua decisão..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comentários são opcionais para aprovação, mas obrigatórios para rejeição (mínimo 10 caracteres)
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
