import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, FileText, User, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AprovarDescricaoSuperior() {
  const { user } = useAuth();
  const [descricaoSelecionada, setDescricaoSelecionada] = useState<any>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [acao, setAcao] = useState<"aprovar" | "rejeitar">("aprovar");
  const [comentario, setComentario] = useState("");

  // Mock data - substituir por endpoint real
  const descricoesPendentes = [
    {
      id: 1,
      cargo: "Analista de Sistemas Sênior",
      funcionario: "João Silva",
      departamento: "TI",
      dataSubmissao: "2024-11-20",
      descricao: "Responsável por desenvolver e manter sistemas corporativos, realizar análise de requisitos e propor soluções tecnológicas.",
      responsabilidades: [
        "Desenvolver aplicações web e mobile",
        "Realizar code reviews",
        "Mentoria de desenvolvedores júnior",
        "Participar de reuniões de planejamento",
      ],
      competencias: [
        "React, Node.js, TypeScript",
        "Arquitetura de Software",
        "Metodologias Ágeis",
        "Liderança Técnica",
      ],
    },
    {
      id: 2,
      cargo: "Coordenador de Marketing",
      funcionario: "Maria Santos",
      departamento: "Marketing",
      dataSubmissao: "2024-11-22",
      descricao: "Coordenar estratégias de marketing digital, gerenciar equipe e campanhas publicitárias.",
      responsabilidades: [
        "Planejar campanhas de marketing",
        "Gerenciar redes sociais",
        "Analisar métricas de performance",
        "Coordenar equipe de 5 pessoas",
      ],
      competencias: [
        "Marketing Digital",
        "Google Analytics",
        "Gestão de Equipes",
        "Copywriting",
      ],
    },
  ];

  const abrirModal = (descricao: any, tipo: "aprovar" | "rejeitar") => {
    setDescricaoSelecionada(descricao);
    setAcao(tipo);
    setModalAberto(true);
    setComentario("");
  };

  const confirmarAcao = () => {
    if (!descricaoSelecionada) return;

    // TODO: Chamar endpoint real
    toast.success(
      acao === "aprovar"
        ? `Descrição de cargo aprovada com sucesso!`
        : `Descrição de cargo rejeitada. O funcionário será notificado.`
    );

    setModalAberto(false);
    setDescricaoSelecionada(null);
    setComentario("");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aprovação de Descrições de Cargos</h1>
          <p className="text-gray-600 mt-1">Revise e aprove as descrições de cargos da sua equipe</p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pendentes de Aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{descricoesPendentes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Aprovadas este Mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">12</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rejeitadas este Mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">2</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Descrições Pendentes */}
        <div className="space-y-4">
          {descricoesPendentes.map((desc) => (
            <Card key={desc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {desc.cargo}
                    </CardTitle>
                    <CardDescription className="mt-2 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {desc.funcionario}
                      </span>
                      <span>•</span>
                      <span>{desc.departamento}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(desc.dataSubmissao).toLocaleDateString("pt-BR")}
                      </span>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Descrição */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Descrição do Cargo</h4>
                  <p className="text-gray-600 text-sm">{desc.descricao}</p>
                </div>

                {/* Responsabilidades */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Responsabilidades</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {desc.responsabilidades.map((resp, idx) => (
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
                    {desc.competencias.map((comp, idx) => (
                      <Badge key={idx} variant="secondary">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => abrirModal(desc, "aprovar")}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => abrirModal(desc, "rejeitar")}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
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
                {acao === "aprovar" ? "Aprovar Descrição de Cargo" : "Rejeitar Descrição de Cargo"}
              </DialogTitle>
              <DialogDescription>
                {acao === "aprovar"
                  ? "Ao aprovar, a descrição será enviada para aprovação final do RH."
                  : "Ao rejeitar, o funcionário será notificado e poderá revisar a descrição."}
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
                    Comentário {acao === "rejeitar" && "(obrigatório)"}
                  </label>
                  <Textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder={
                      acao === "aprovar"
                        ? "Adicione um comentário opcional..."
                        : "Explique o motivo da rejeição..."
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
                {acao === "aprovar" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
