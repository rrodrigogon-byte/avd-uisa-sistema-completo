import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Loader2,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PDIAprovacao() {
  const [, navigate] = useLocation();
  const [selectedPdi, setSelectedPdi] = useState<number | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [currentPdiId, setCurrentPdiId] = useState<number | null>(null);

  // Query para listar PDIs pendentes de aprovação
  const { data: pendingPdis, isLoading, refetch } = trpc.pdi.listPendingApproval.useQuery();

  // Query para detalhes do PDI selecionado
  const { data: pdiDetails } = trpc.pdi.getImportedDetails.useQuery(
    { pdiId: selectedPdi! },
    { enabled: !!selectedPdi }
  ) as { data: { employeeName: string; cycleName: string; actions: Array<{ description: string; developmentArea: string; responsible: string; dueDate: Date | null }> } | undefined };

  // Mutation para aprovar/rejeitar
  const reviewMutation = trpc.pdi.reviewApproval.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowApprovalDialog(false);
      setShowRejectDialog(false);
      setFeedback('');
      setCurrentPdiId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleApprove = () => {
    if (!currentPdiId) return;
    reviewMutation.mutate({
      pdiId: currentPdiId,
      decision: 'aprovado',
      feedback: feedback || undefined,
    });
  };

  const handleReject = () => {
    if (!currentPdiId) return;
    if (!feedback.trim()) {
      toast.error('Por favor, forneça um feedback para a rejeição');
      return;
    }
    reviewMutation.mutate({
      pdiId: currentPdiId,
      decision: 'rejeitado',
      feedback,
    });
  };

  const openApprovalDialog = (pdiId: number) => {
    setCurrentPdiId(pdiId);
    setFeedback('');
    setShowApprovalDialog(true);
  };

  const openRejectDialog = (pdiId: number) => {
    setCurrentPdiId(pdiId);
    setFeedback('');
    setShowRejectDialog(true);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/aprovacoes')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard de Aprovações
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Aprovação de PDIs</h1>
            <p className="text-gray-600 mt-1">
              Revise e aprove os Planos de Desenvolvimento Individual pendentes
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pendentes</p>
                  <p className="text-2xl font-bold">{pendingPdis?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aprovados Hoje</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rejeitados Hoje</p>
                  <p className="text-2xl font-bold">-</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de PDIs Pendentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#F39200]" />
              PDIs Aguardando Aprovação
            </CardTitle>
            <CardDescription>
              Revise cada PDI e aprove ou rejeite com feedback
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#F39200]" />
              </div>
            ) : !pendingPdis || pendingPdis.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Nenhum PDI pendente</AlertTitle>
                <AlertDescription>
                  Não há PDIs aguardando aprovação no momento.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Data de Envio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPdis.map((pdi) => (
                      <TableRow key={pdi.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{pdi.employeeName || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{pdi.employeeEmail || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{pdi.cycleName || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(pdi.startDate)} - {formatDate(pdi.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatDate(pdi.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPdi(pdi.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openApprovalDialog(pdi.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRejectDialog(pdi.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <ThumbsDown className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes do PDI */}
        <Dialog open={!!selectedPdi} onOpenChange={() => setSelectedPdi(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do PDI</DialogTitle>
              <DialogDescription>
                Revise as informações do plano de desenvolvimento
              </DialogDescription>
            </DialogHeader>

            {pdiDetails && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Funcionário</Label>
                    <p className="font-medium">{pdiDetails.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">Ciclo</Label>
                    <p className="font-medium">{pdiDetails.cycleName}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">Ações de Desenvolvimento</Label>
                  <div className="mt-2 space-y-2">
                    {pdiDetails.actions?.length > 0 ? (
                      pdiDetails.actions.map((action, index) => (
                        <Card key={index} className="border-l-4 border-l-[#F39200]">
                          <CardContent className="pt-4">
                            <p className="font-medium">{action.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>Área: {action.developmentArea}</span>
                              <span>Responsável: {action.responsible}</span>
                              <span>Prazo: {formatDate(action.dueDate)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500">Nenhuma ação cadastrada</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedPdi(null)}>
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPdi(null);
                  if (selectedPdi) openApprovalDialog(selectedPdi);
                }}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Aprovar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedPdi(null);
                  if (selectedPdi) openRejectDialog(selectedPdi);
                }}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Rejeitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Aprovação */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <ThumbsUp className="h-5 w-5" />
                Aprovar PDI
              </DialogTitle>
              <DialogDescription>
                Confirme a aprovação do Plano de Desenvolvimento Individual
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Feedback (opcional)</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Adicione comentários ou sugestões para o funcionário..."
                  rows={3}
                />
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  Ao aprovar, o funcionário será notificado e poderá iniciar a execução do PDI.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                disabled={reviewMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Confirmar Aprovação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rejeição */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <ThumbsDown className="h-5 w-5" />
                Rejeitar PDI
              </DialogTitle>
              <DialogDescription>
                Forneça feedback sobre os motivos da rejeição
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Feedback (obrigatório) *</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Explique os motivos da rejeição e o que precisa ser corrigido..."
                  rows={4}
                  className="border-red-200 focus:border-red-500"
                />
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O funcionário será notificado e precisará fazer as correções antes de reenviar para aprovação.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleReject}
                disabled={reviewMutation.isPending || !feedback.trim()}
                variant="destructive"
              >
                {reviewMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
