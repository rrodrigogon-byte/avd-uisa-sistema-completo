/**
 * Página de Pesquisas Pulse - Dashboard de Pesquisas de Clima Organizacional
 * 
 * FLUXO FUNCIONAL:
 * 1. Admin/RH acessa /pesquisas-pulse (esta página)
 * 2. Clica em "Nova Pesquisa" → Redireciona para /pesquisas-pulse/criar
 * 3. Preenche formulário em 3 etapas (CriarPesquisaPulse.tsx):
 *    - Etapa 1: Título, pergunta, descrição
 *    - Etapa 2: Seleciona destinátrios (todos, diretoria, departamentos, centros de custo, emails)
 *    - Etapa 3: Confirma e envia convites por email
 * 4. Colaboradores recebem email com link: /pesquisa/:id
 * 5. Colaboradores respondem (nota 0-10 + comentário opcional) - ResponderPesquisaPulse.tsx
 * 6. Admin/RH visualiza resultados em /pesquisas-pulse/resultados/:id
 * 
 * ROTAS:
 * - /pesquisas-pulse - Dashboard de pesquisas (esta página)
 * - /pesquisas-pulse/criar - Criar nova pesquisa
 * - /pesquisa/:id - Responder pesquisa (PÚB LICA - sem autenticação)
 * - /pesquisas-pulse/resultados/:id - Ver resultados
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Send, BarChart3, Users, TrendingUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface PulseSurvey {
  id: number;
  title: string;
  question: string;
  status: "draft" | "active" | "closed";
  responses: number;
  totalEmployees: number;
  avgScore: number;
  createdAt: string;
}

export default function PesquisasPulse() {
  const [, setLocation] = useLocation();
  const { data: surveys = [], isLoading } = trpc.pulse.list.useQuery();
  const createSurveyMutation = trpc.pulse.create.useMutation({
    onSuccess: () => {
      toast.success("Pesquisa criada e enviada com sucesso!");
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [surveys_mock] = useState<PulseSurvey[]>([
    {
      id: 1,
      title: "Satisfação com Ambiente de Trabalho",
      question: "Como você avalia o ambiente de trabalho da empresa?",
      status: "active",
      responses: 45,
      totalEmployees: 50,
      avgScore: 8.5,
      createdAt: "2025-11-15",
    },
    {
      id: 2,
      title: "Comunicação Interna",
      question: "A comunicação entre as áreas é eficiente?",
      status: "active",
      responses: 38,
      totalEmployees: 50,
      avgScore: 7.2,
      createdAt: "2025-11-10",
    },
    {
      id: 3,
      title: "Reconhecimento e Valorização",
      question: "Você se sente reconhecido pelo seu trabalho?",
      status: "closed",
      responses: 50,
      totalEmployees: 50,
      avgScore: 6.8,
      createdAt: "2025-11-01",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleCreateSurvey = () => {
    console.log("[DEBUG] Botão Nova Pesquisa clicado - Redirecionando para /pesquisas-pulse/criar");
    try {
      setLocation("/pesquisas-pulse/criar");
      toast.success("Redirecionando para criar pesquisa...");
    } catch (error) {
      console.error("[ERROR] Erro ao redirecionar:", error);
      toast.error("Erro ao redirecionar. Tente novamente.");
    }
  };

  // Removido - agora usa página dedicada /pesquisas-pulse/criar

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      active: "bg-green-500",
      closed: "bg-blue-500",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      active: "Ativa",
      closed: "Encerrada",
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  // Dados para o gráfico de tendência
  const trendData = [
    { month: "Jul", score: 7.5 },
    { month: "Ago", score: 7.8 },
    { month: "Set", score: 7.2 },
    { month: "Out", score: 7.9 },
    { month: "Nov", score: 8.1 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pesquisas de Pulse</h1>
            <p className="text-muted-foreground">
              Meça o engajamento e satisfação da equipe em tempo real
            </p>
          </div>
          <Button onClick={handleCreateSurvey}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pesquisa
          </Button>
        </div>

        {/* Card de Ajuda - Fluxo Funcional */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Como Funciona?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Criar Pesquisa:</strong> Clique em "Nova Pesquisa" e preencha título, pergunta e selecione destinátrios</li>
              <li><strong>Enviar Convites:</strong> Escolha grupos (todos, diretoria, departamentos, centros de custo ou emails específicos)</li>
              <li><strong>Colaboradores Respondem:</strong> Recebem email com link direto para responder (nota 0-10 + comentário)</li>
              <li><strong>Visualizar Resultados:</strong> Acompanhe estatísticas, média de satisfação e comentários em tempo real</li>
            </ol>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pesquisas Ativas</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {surveys.filter((s) => s.status === "active").length}
              </div>
              <p className="text-xs text-muted-foreground">
                {surveys.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  (surveys.reduce((acc, s) => acc + s.responses, 0) /
                    surveys.reduce((acc, s) => acc + s.totalEmployees, 0)) *
                    100
                )}
                %
              </div>
              <p className="text-xs text-muted-foreground">Média geral</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfação Média</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(surveys.reduce((acc, s) => acc + s.avgScore, 0) / surveys.length).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Escala de 0 a 10</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tendência</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+0.6</div>
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Tendência */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Satisfação</CardTitle>
            <CardDescription>Evolução da satisfação nos últimos 5 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" fill="#f97316" name="Satisfação Média" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Formulário de Nova Pesquisa */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Nova Pesquisa de Pulse</CardTitle>
              <CardDescription>Crie uma pergunta rápida para medir o clima organizacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Pesquisa</Label>
                <Input id="title" placeholder="Ex: Satisfação com Ambiente de Trabalho" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Pergunta</Label>
                <Textarea
                  id="question"
                  placeholder="Ex: Como você avalia o ambiente de trabalho da empresa?"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSurvey}>
                  <Send className="mr-2 h-4 w-4" />
                  Criar e Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Pesquisas */}
        <Card>
          <CardHeader>
            <CardTitle>Pesquisas Recentes</CardTitle>
            <CardDescription>Acompanhe o status e resultados das pesquisas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Nota Média</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((survey: any) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{survey.question}</TableCell>
                    <TableCell>{getStatusBadge(survey.status)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {survey.responses}/{survey.totalEmployees}
                        </div>
                        <Progress
                          value={(survey.responses / survey.totalEmployees) * 100}
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{survey.avgScore.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">/10</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(survey.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Link href={`/pesquisas-pulse/resultados/${survey.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Resultados
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
