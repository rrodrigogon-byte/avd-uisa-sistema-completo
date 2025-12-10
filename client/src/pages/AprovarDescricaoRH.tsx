import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar, History } from "lucide-react";
import { toast } from "sonner";

export default function AprovarDescricaoRH() {
  const { user } = useAuth();
  const [descricaoSelecionada, setDescricaoSelecionada] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [acao, setAcao] = useState<"aprovar" | "rejeitar">("aprovar");
  const [comentario, setComentario] = useState("");

  // Buscar descrições pendentes de aprovação do RH
  const { data: pendingDescriptions, isLoading, refetch } = trpc.jobDescriptions.list.useQuery(
    { status: "pending_hr" },
    { enabled: !!user }
  );

  // Mutations para aprovar/rejeitar
  const approveMutation = trpc.jobDescriptions.approve.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo aprovada com sucesso!");
      setModalAberto(false);
      setComentario("");
      setDescricaoSelecionada(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao aprovar: ${error.message}`);
    },
  });

  const rejectMutation = trpc.jobDescriptions.reject.useMutation({
    onSuccess: () => {
      toast.success("Descrição de cargo rejeitada");
      setModalAberto(false);
      setComentario("");
      setDescricaoSelecionada(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao rejeitar: ${error.message}`);
    },
  });

  const abrirModal = (descricao: any, tipo: "aprovar" | "rejeitar") => {
    setDescricaoSelecionada(descricao);
    setAcao(tipo);
    setModalAberto(true);
    setComentario("");
  };

  const abrirHistorico = (descricao: any) => {
    setDescricaoSelecionada(descricao);
    setHistoricoAberto(true);
  };

  const confirmarAcao = () => {
    if (!descricaoSelecionada) return;

    if (acao === "aprovar") {
      approveMutation.mutate({
        approvalId: descricaoSelecionada.id,
        comments: comentario || undefined,
      });
    } else {
      if (!comentario.trim()) {
        toast.error("Por favor, forneça um comentário explicando a rejeição");
        return;
      }
      rejectMutation.mutate({
        approvalId: descricaoSelecionada.id,
        comments: comentario,
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Clock className="animate-spin h-8 w-8 text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aprovação Final - RH</h1>
          <p className="text-gray-600 mt-1">
            Revise e aprove as descrições de cargos já validadas pelos superiores
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aguardando Aprovação RH</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{descricoesAprovadas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aprovadas este Mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">25</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Devolvidas para Revisão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tempo Médio de Aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">2.5d</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Descrições */}
        <div className="space-y-4">
          {descricoesAprovadas.map((desc: any) => (
            <Card key={desc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {desc.cargo}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {desc.funcionario}
                      </span>
                      <span>•</span>
                      <span>{desc.departamento}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Submetido em {new Date(desc.dataSubmissao).toLocaleDateString("pt-BR")}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Aprovado pelo Superior
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Aprovação do Superior */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-sm text-green-900">
                      Aprovado por {desc.superior}
                    </span>
                    <span className="text-sm text-green-700">
                      em {new Date(desc.dataAprovacaoSuperior).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-sm text-green-800 italic">"{desc.comentarioSuperior}"</p>
                </div>

                {/* Descrição */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Descrição do Cargo</h4>
                  <p className="text-gray-600 text-sm">{desc.descricao}</p>
                </div>

                {/* Responsabilidades */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Responsabilidades</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {desc.responsabilidades.map((resp: any, idx: number) => (
                      <li key={idx} className="text-gray-600 text-sm">
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Competências */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Competências Requeridas</h4>
                  <div className="flex flex-wrap gap-2">
                    {desc.competencias.map((comp: any, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => abrirHistorico(desc)} variant="outline" className="flex-1">
                    <History className="w-4 h-4 mr-2" />
                    Ver Histórico
                  </Button>
                  <Button
                    onClick={() => abrirModal(desc, "aprovar")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar Definitivamente
                  </Button>
                  <Button
                    onClick={() => abrirModal(desc, "rejeitar")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Devolver para Revisão
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal de Confirmação */}
        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {acao === "aprovar" ? "Aprovação Final - RH" : "Devolver para Revisão"}
              </DialogTitle>
              <DialogDescription>
                {acao === "aprovar"
                  ? "Esta é a aprovação final. O cargo será oficialmente atualizado no sistema."
                  : "A descrição será devolvida para o funcionário e superior revisarem."}
              </DialogDescription>
            </DialogHeader>

            {descricaoSelecionada && (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-sm">Cargo: {descricaoSelecionada.cargo}</p>
                  <p className="text-sm text-gray-600">Funcionário: {descricaoSelecionada.funcionario}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Comentário do RH {acao === "rejeitar" && "(obrigatório)"}
                  </label>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder={
                      acao === "aprovar"
                        ? "Adicione observações finais..."
                        : "Explique o que precisa ser revisado..."
                    }
                    rows={4}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button
                onClick={confirmarAcao}
                disabled={acao === "rejeitar" && !comentario.trim()}
                className={acao === "aprovar" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={acao === "rejeitar" ? "destructive" : "default"}
              >
                {acao === "aprovar" ? "Aprovar Definitivamente" : "Devolver para Revisão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico */}
        <Dialog open={historicoAberto} onOpenChange={setHistoricoAberto}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de Aprovações</DialogTitle>
              <DialogDescription>
                Timeline completa de todas as ações realizadas nesta descrição de cargo
              </DialogDescription>
            </DialogHeader>

            {descricaoSelecionada && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">{descricaoSelecionada.cargo}</p>
                  <p className="text-sm text-gray-600">{descricaoSelecionada.funcionario}</p>
                </div>

                <div className="space-y-4">
                  {descricaoSelecionada.historico.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.acao.includes("Aprovado")
                              ? "bg-green-100"
                              : item.acao.includes("Rejeitado")
                              ? "bg-red-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {item.acao.includes("Aprovado") ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : item.acao.includes("Rejeitado") ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        {idx < descricaoSelecionada.historico.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm">{item.acao}</p>
                          <span className="text-xs text-gray-500">
                            {new Date(item.data).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{item.responsavel}</p>
                        <p className="text-sm text-gray-500 italic">"{item.comentario}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setHistoricoAberto(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
