import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Bônus
 * 
 * Features:
 * - Formulário de solicitação de bônus
 * - KPIs: Orçamento disponível, Solicitações aprovadas
 * - Lista de solicitações de bônus pendentes
 * - Aprovação/Rejeição rápida
 */

export default function Bonus() {
  const [employee, setEmployee] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState("");

  // Mock data - TODO: integrar com backend
  const kpis = {
    orcamentoDisponivel: 150000,
    solicitacoesAprovadas: 25,
    totalDistribuido: 85000,
  };

  const bonusRequests = [
    {
      id: 1,
      employee: "Maria Silva",
      amount: 5000,
      type: "Performance",
      reason: "Superou metas do Q4 em 150%",
      requestDate: "2025-01-10",
      status: "pendente",
    },
    {
      id: 2,
      employee: "João Santos",
      amount: 3000,
      type: "Projeto",
      reason: "Conclusão antecipada do Projeto Alpha",
      requestDate: "2025-01-08",
      status: "pendente",
    },
    {
      id: 3,
      employee: "Ana Costa",
      amount: 4000,
      type: "Performance",
      reason: "Excelente avaliação 360°",
      requestDate: "2025-01-05",
      status: "pendente",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Solicitação de bônus enviada com sucesso!");
    // Reset form
    setEmployee("");
    setAmount("");
    setReason("");
    setType("");
  };

  const handleApprove = (id: number) => {
    toast.success("Bônus aprovado!");
  };

  const handleReject = (id: number) => {
    toast.error("Bônus rejeitado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestão de Bônus</h1>
          <p className="text-muted-foreground">Solicitação e aprovação de bônus</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Orçamento Disponível
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {kpis.orcamentoDisponivel.toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ciclo 2025</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Distribuído
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {kpis.totalDistribuido.toLocaleString("pt-BR")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {((kpis.totalDistribuido / kpis.orcamentoDisponivel) * 100).toFixed(0)}% do
                orçamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Solicitações Aprovadas
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.solicitacoesAprovadas}</div>
              <p className="text-xs text-muted-foreground mt-1">Este ano</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Solicitação */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Solicitação de Bônus</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employee">Colaborador</Label>
                  <Input
                    id="employee"
                    placeholder="Nome do colaborador"
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Bônus</Label>
                  <Select value={type} onValueChange={setType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="projeto">Conclusão de Projeto</SelectItem>
                      <SelectItem value="retencao">Retenção de Talento</SelectItem>
                      <SelectItem value="anual">Bônus Anual</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Justificativa</Label>
                  <Textarea
                    id="reason"
                    placeholder="Descreva o motivo da solicitação..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Enviar Solicitação
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Solicitações Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes ({bonusRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bonusRequests.map((request: any) => (
                  <div key={request.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{request.employee}</p>
                        <p className="text-2xl font-bold text-primary mt-1">
                          R$ {request.amount.toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="outline">{request.type}</Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{request.reason}</p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <span>Solicitado em: {new Date(request.requestDate).toLocaleDateString("pt-BR")}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleApprove(request.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleReject(request.id)}
                      >
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
