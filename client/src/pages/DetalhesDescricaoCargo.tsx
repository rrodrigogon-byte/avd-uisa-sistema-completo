import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";

export default function DetalhesDescricaoCargo({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [comments, setComments] = useState("");
  const [selectedApprovalId, setSelectedApprovalId] = useState<number | null>(null);

  const { data: jobDesc, refetch } = trpc.jobDescriptions.getById.useQuery({ id: parseInt(params.id) });
  
  const exportPDFMutation = trpc.jobDescriptionsPDF.exportPDF.useMutation({
    onSuccess: (data) => {
      // Converter base64 para blob e fazer download
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF gerado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao gerar PDF: ' + error.message);
    },
  });

  const approveMutation = trpc.jobDescriptions.approve.useMutation({
    onSuccess: () => {
      toast.success("Aprovado com sucesso!");
      setApprovalDialog(false);
      setComments("");
      refetch();
    },
  });

  const rejectMutation = trpc.jobDescriptions.reject.useMutation({
    onSuccess: () => {
      toast.success("Rejeitado");
      setRejectDialog(false);
      setComments("");
      refetch();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500" },
      approved: { label: "Aprovado", color: "bg-green-500" },
      rejected: { label: "Rejeitado", color: "bg-red-500" },
    };
    return statusMap[status] || { label: status, color: "bg-gray-500" };
  };

  const getLevelLabel = (level: string) => {
    const levelMap: Record<string, string> = {
      basico: "Básico",
      intermediario: "Intermediário",
      avancado: "Avançado",
      obrigatorio: "Obrigatório",
    };
    return levelMap[level] || level;
  };

  if (!jobDesc) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-8">Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => navigate("/descricao-cargos-uisa")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{jobDesc.positionTitle}</h1>
            <p className="text-muted-foreground">{jobDesc.departmentName}</p>
          </div>
          {jobDesc.status === 'approved' && (
            <Button 
              onClick={() => exportPDFMutation.mutate({ jobDescriptionId: jobDesc.id })}
              disabled={exportPDFMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {exportPDFMutation.isPending ? 'Gerando PDF...' : 'Exportar PDF'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="col-span-2 space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Cargo:</span> {jobDesc.positionTitle}
                  </div>
                  <div>
                    <span className="font-semibold">Departamento:</span> {jobDesc.departmentName}
                  </div>
                  <div>
                    <span className="font-semibold">CBO:</span> {jobDesc.cbo || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Divisão:</span> {jobDesc.division || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Reporta para:</span> {jobDesc.reportsTo || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Revisão:</span> {jobDesc.revision || "-"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Objetivo Principal */}
            <Card>
              <CardHeader>
                <CardTitle>Objetivo Principal do Cargo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{jobDesc.mainObjective}</p>
              </CardContent>
            </Card>

            {/* Responsabilidades */}
            <Card>
              <CardHeader>
                <CardTitle>Responsabilidades</CardTitle>
              </CardHeader>
              <CardContent>
                {jobDesc.responsibilities?.map((resp: any, index: number) => (
                  <div key={index} className="mb-4">
                    <Badge className="mb-2">{resp.category}</Badge>
                    <p className="text-sm">{resp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Conhecimentos Técnicos */}
            <Card>
              <CardHeader>
                <CardTitle>Conhecimentos Técnicos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobDesc.knowledge?.map((k: any, index: number) => (
                    <div key={index} className="flex justify-between items-center border-b pb-2">
                      <span className="text-sm">{k.name}</span>
                      <Badge variant="outline">{getLevelLabel(k.level)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Competências e Habilidades */}
            <Card>
              <CardHeader>
                <CardTitle>Competências e Habilidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {jobDesc.competencies?.map((comp: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{comp.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Qualificação Desejada */}
            <Card>
              <CardHeader>
                <CardTitle>Qualificação Desejada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-semibold">Formação:</span> {jobDesc.educationLevel || "-"}
                </div>
                <div>
                  <span className="font-semibold">Experiência:</span> {jobDesc.requiredExperience || "-"}
                </div>
              </CardContent>
            </Card>

            {/* e-Social */}
            {jobDesc.eSocialSpecs && (
              <Card>
                <CardHeader>
                  <CardTitle>e-Social</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{jobDesc.eSocialSpecs}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Lateral - Timeline de Aprovações */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Aprovações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobDesc.approvals?.map((approval: any, index: number) => {
                    const status = getStatusBadge(approval.status);
                    const isPending = approval.status === "pending";

                    return (
                      <div key={index} className="relative">
                        {index < jobDesc.approvals.length - 1 && (
                          <div className="absolute left-4 top-8 w-0.5 h-full bg-border" />
                        )}
                        <div className="flex gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status.color}`}>
                            {approval.status === "approved" && <CheckCircle className="w-5 h-5 text-white" />}
                            {approval.status === "rejected" && <XCircle className="w-5 h-5 text-white" />}
                            {approval.status === "pending" && <Clock className="w-5 h-5 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-sm">
                              {approval.approvalLevel === "occupant" && "Ocupante do Cargo"}
                              {approval.approvalLevel === "manager" && "Superior Imediato"}
                              {approval.approvalLevel === "hr" && "Gerente de RH"}
                            </div>
                            <div className="text-xs text-muted-foreground">{approval.approverName}</div>
                            <Badge variant="outline" className="mt-1">
                              {status.label}
                            </Badge>
                            {approval.comments && (
                              <p className="text-xs mt-2 text-muted-foreground">{approval.comments}</p>
                            )}
                            {isPending && (
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedApprovalId(approval.id);
                                    setApprovalDialog(true);
                                  }}
                                >
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedApprovalId(approval.id);
                                    setRejectDialog(true);
                                  }}
                                >
                                  Rejeitar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Aprovação */}
        <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aprovar Descrição de Cargo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Comentários (opcional)</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Adicione comentários..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApprovalDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedApprovalId) {
                    approveMutation.mutate({ approvalId: selectedApprovalId, comments });
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Rejeição */}
        <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Descrição de Cargo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Motivo da Rejeição *</Label>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Descreva o motivo..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedApprovalId && comments.trim()) {
                    rejectMutation.mutate({ approvalId: selectedApprovalId, comments });
                  } else {
                    toast.error("Comentário obrigatório");
                  }
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
