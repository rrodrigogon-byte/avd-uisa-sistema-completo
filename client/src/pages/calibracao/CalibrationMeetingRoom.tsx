import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import io, { Socket } from "socket.io-client";

interface Participant {
  id: number;
  userId: number;
  role: string;
  isOnline: boolean;
  user?: {
    name: string;
  };
}

interface Evaluation {
  id: number;
  employeeId: number;
  selfScore: number;
  managerScore: number;
  peerScores: number[];
  consensusScore?: number;
  hasDiscrepancy: boolean;
  employee?: {
    name: string;
    position?: string;
  };
}

interface Vote {
  id: number;
  voterId: number;
  proposedScore: number;
  justification: string;
  voteType: string;
  voter?: {
    name: string;
  };
}

interface Message {
  id: number;
  senderId: number;
  message: string;
  createdAt: Date;
  sender?: {
    name: string;
  };
}

export default function CalibrationMeetingRoom() {
  const [, params] = useRoute("/calibracao/reuniao/:id");
  const [, setLocation] = useLocation();
  const meetingId = params?.id ? parseInt(params.id) : null;

  const [selectedEvaluation, setSelectedEvaluation] = useState<number | null>(null);
  const [proposedScore, setProposedScore] = useState<number>(0);
  const [justification, setJustification] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: meeting } = trpc.calibrationMeeting.getMeetingDetails.useQuery(
    { sessionId: meetingId! },
    { enabled: !!meetingId }
  );

  const { data: evaluations, refetch: refetchEvaluations } =
    trpc.calibrationMeeting.getEvaluationsForCalibration.useQuery(
      { cycleId: meeting?.cycleId! },
      { enabled: !!meeting?.cycleId }
    );

  const { data: votes, refetch: refetchVotes } =
    trpc.calibrationMeeting.getVotes.useQuery(
      { sessionId: meetingId!, evaluationId: selectedEvaluation! },
      { enabled: !!meetingId && !!selectedEvaluation }
    );

  const { data: chatMessages } = trpc.calibrationMeeting.getMessages.useQuery(
    { sessionId: meetingId! },
    { enabled: !!meetingId }
  );

  const joinMeeting = trpc.calibrationMeeting.joinMeeting.useMutation();
  const submitVote = trpc.calibrationMeeting.submitVote.useMutation({
    onSuccess: () => {
      toast.success("Voto registrado com sucesso!");
      setProposedScore(0);
      setJustification("");
      refetchVotes();
    },
  });

  const registerConsensus = trpc.calibrationMeeting.registerConsensus.useMutation({
    onSuccess: () => {
      toast.success("Consenso registrado! Nota atualizada.");
      refetchEvaluations();
      setSelectedEvaluation(null);
    },
  });

  const sendMessage = trpc.calibrationMeeting.sendMessage.useMutation({
    onSuccess: () => {
      setChatMessage("");
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!meetingId) return;

    const newSocket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("[WebSocket] Conectado à sala de calibração");
      newSocket.emit("join-calibration", { meetingId });
      joinMeeting.mutate({ sessionId: meetingId });
    });

    newSocket.on("new-vote", () => {
      refetchVotes();
    });

    newSocket.on("consensus-reached", () => {
      refetchEvaluations();
    });

    newSocket.on("new-message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [meetingId]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat messages
  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages as Message[]);
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !meetingId) return;

    sendMessage.mutate({
      sessionId: meetingId,
      message: chatMessage,
    });

    socket?.emit("send-message", {
      meetingId,
      message: chatMessage,
    });
  };

  const handleSubmitVote = (voteType: "approve" | "reject") => {
    if (!selectedEvaluation || !meetingId) return;

    if (!proposedScore || proposedScore < 1 || proposedScore > 5) {
      toast.error("Informe uma nota entre 1 e 5");
      return;
    }

    if (!justification.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }

    submitVote.mutate({
      sessionId: meetingId,
      evaluationId: selectedEvaluation,
      proposedScore,
      justification,
      voteType,
    });

    socket?.emit("new-vote", { meetingId, evaluationId: selectedEvaluation });
  };

  const handleRegisterConsensus = () => {
    if (!selectedEvaluation || !meetingId) return;

    if (!proposedScore || proposedScore < 1 || proposedScore > 5) {
      toast.error("Informe a nota de consenso entre 1 e 5");
      return;
    }

    registerConsensus.mutate({
      sessionId: meetingId,
      evaluationId: selectedEvaluation,
      consensusScore: proposedScore,
      justification,
    });

    socket?.emit("consensus-reached", { meetingId, evaluationId: selectedEvaluation });
  };

  const selectedEvaluation_data = evaluations?.find((e: Evaluation) => e.id === selectedEvaluation);
  const avgPeerScore =
    selectedEvaluation_data?.peerScores && selectedEvaluation_data.peerScores.length > 0
      ? selectedEvaluation_data.peerScores.reduce((a: number, b: number) => a + b, 0) / selectedEvaluation_data.peerScores.length
      : 0;

  const getDiscrepancyIcon = (diff: number) => {
    if (diff > 1) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (diff < -1) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  if (!meetingId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p>ID da reunião inválido</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/calibracao/reunioes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Reunião de Calibração</h1>
              <p className="text-sm text-muted-foreground">
                {meeting?.scheduledFor && format(new Date(meeting.scheduledFor), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Badge variant={meeting?.status === "em_andamento" ? "default" : "secondary"}>
            {meeting?.status === "em_andamento" ? "Em Andamento" : meeting?.status}
          </Badge>
        </div>

        {/* Participantes Online */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes ({meeting?.participants?.filter((p: Participant) => p.isOnline).length || 0} online)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {meeting?.participants?.map((p: Participant) => (
                <Badge key={p.id} variant={p.isOnline ? "default" : "outline"}>
                  {p.user?.name || `Usuário ${p.userId}`}
                  {p.role === "facilitator" && " (Facilitador)"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Layout 3 Colunas */}
        <div className="grid grid-cols-12 gap-6">
          {/* Coluna 1: Lista de Avaliações */}
          <div className="col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>Avaliações para Calibrar</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[520px]">
                  {evaluations?.map((evaluation: Evaluation) => (
                    <div
                      key={evaluation.id}
                      className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
                        selectedEvaluation === evaluation.id ? "bg-accent" : ""
                      }`}
                      onClick={() => setSelectedEvaluation(evaluation.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{evaluation.employee?.name || `Funcionário ${evaluation.employeeId}`}</p>
                          <p className="text-xs text-muted-foreground">{evaluation.employee?.position || "Cargo"}</p>
                        </div>
                        {evaluation.hasDiscrepancy && (
                          <Badge variant="destructive" className="text-xs">
                            Discrepância
                          </Badge>
                        )}
                      </div>
                      {evaluation.consensusScore && (
                        <div className="mt-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Consenso: {evaluation.consensusScore}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Coluna 2: Comparação e Votação */}
          <div className="col-span-6">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>Comparação de Notas</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEvaluation_data ? (
                  <div className="space-y-6">
                    {/* Comparação de Notas */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Autoavaliação</p>
                        <div className="text-3xl font-bold text-blue-600">{selectedEvaluation_data.selfScore.toFixed(1)}</div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Gestor</p>
                        <div className="text-3xl font-bold text-purple-600">{selectedEvaluation_data.managerScore.toFixed(1)}</div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Pares (média)</p>
                        <div className="text-3xl font-bold text-orange-600">{avgPeerScore.toFixed(1)}</div>
                      </div>
                    </div>

                    {/* Indicadores de Discrepância */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">Autoavaliação vs Gestor</span>
                        <div className="flex items-center gap-2">
                          {getDiscrepancyIcon(selectedEvaluation_data.selfScore - selectedEvaluation_data.managerScore)}
                          <span className="text-sm font-medium">
                            {(selectedEvaluation_data.selfScore - selectedEvaluation_data.managerScore).toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">Gestor vs Pares</span>
                        <div className="flex items-center gap-2">
                          {getDiscrepancyIcon(selectedEvaluation_data.managerScore - avgPeerScore)}
                          <span className="text-sm font-medium">
                            {(selectedEvaluation_data.managerScore - avgPeerScore).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Votação */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Registrar Voto</h3>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nota Proposta (1-5)</label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          step="0.1"
                          value={proposedScore || ""}
                          onChange={(e) => setProposedScore(parseFloat(e.target.value))}
                          placeholder="Ex: 4.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Justificativa</label>
                        <Textarea
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          placeholder="Explique o motivo da sua avaliação..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSubmitVote("approve")} className="flex-1">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button onClick={() => handleSubmitVote("reject")} variant="destructive" className="flex-1">
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Votos Registrados */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Votos Registrados ({votes?.length || 0})</h3>
                      <ScrollArea className="h-[120px]">
                        {votes?.map((vote: Vote) => (
                          <div key={vote.id} className="p-2 border rounded mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{vote.voter?.name || `Votante ${vote.voterId}`}</span>
                              <Badge variant={vote.voteType === "approve" ? "default" : "destructive"}>
                                {vote.proposedScore.toFixed(1)}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{vote.justification}</p>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>

                    {/* Registrar Consenso (apenas facilitador) */}
                    {meeting?.participants?.find(
                      (p: Participant) => p.role === "facilitator" && p.userId === 1 // TODO: usar ctx.user.id
                    ) && (
                      <>
                        <Separator />
                        <Button onClick={handleRegisterConsensus} className="w-full" size="lg">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Registrar Consenso Final
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Selecione uma avaliação para começar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna 3: Chat */}
          <div className="col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  {messages.map((msg: any, idx: number) => (
                    <div key={idx} className="mb-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {msg.sender?.name || `Usuário ${msg.senderId}`}
                          </p>
                          <p className="text-sm mt-1">{msg.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.createdAt), "HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
