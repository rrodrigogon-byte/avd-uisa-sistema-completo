import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Send, Users, Building2, DollarSign, Mail, CheckCircle2 } from "lucide-react";

/**
 * Página de Criação de Pesquisa Pulse
 * Formulário completo com seleção de destinatários por grupos
 */

export default function CriarPesquisaPulse() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1); // 1: Dados básicos, 2: Destinatários, 3: Confirmação

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    question: "",
    description: "",
  });

  // Destinatários
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [targetDepartmentIds, setTargetDepartmentIds] = useState<number[]>([]);
  const [targetCostCenterIds, setTargetCostCenterIds] = useState<number[]>([]);
  const [targetEmails, setTargetEmails] = useState<string>("");

  // Buscar departamentos e centros de custo
  const { data: departments = [] } = trpc.departments.list.useQuery();
  const { data: costCenters = [] } = trpc.costCenters.list.useQuery();

  // Mutation para criar pesquisa
  const createMutation = trpc.pulse.create.useMutation({
    onSuccess: (data) => {
      toast.success("Pesquisa criada com sucesso!");
      setStep(3);
    },
    onError: (error) => {
      toast.error(`Erro ao criar pesquisa: ${error.message}`);
    },
  });

  // Mutation para enviar convites
  const sendInvitationsMutation = trpc.pulse.sendInvitations.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setLocation("/pesquisas-pulse");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar convites: ${error.message}`);
    },
  });

  const handleToggleGroup = (group: string) => {
    setTargetGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleToggleDepartment = (deptId: number) => {
    setTargetDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const handleToggleCostCenter = (ccId: number) => {
    setTargetCostCenterIds((prev) =>
      prev.includes(ccId) ? prev.filter((id) => id !== ccId) : [...prev, ccId]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.question) {
        toast.error("Preencha título e pergunta");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (targetGroups.length === 0 && targetDepartmentIds.length === 0 && targetCostCenterIds.length === 0 && !targetEmails) {
        toast.error("Selecione pelo menos um grupo de destinatários");
        return;
      }
      
      // Criar pesquisa
      createMutation.mutate({
        title: formData.title,
        question: formData.question,
        description: formData.description,
        targetGroups: targetGroups as any,
        targetDepartmentIds: targetDepartmentIds.length > 0 ? targetDepartmentIds : undefined,
        targetCostCenterIds: targetCostCenterIds.length > 0 ? targetCostCenterIds : undefined,
        targetEmails: targetEmails ? targetEmails.split(",").map((e) => e.trim()).filter(Boolean) : undefined,
      });
    }
  };

  const handleSendInvitations = (surveyId: number) => {
    sendInvitationsMutation.mutate({ surveyId });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/pesquisas-pulse")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Nova Pesquisa de Pulse</h1>
            <p className="text-muted-foreground">
              Crie uma pesquisa rápida para medir o clima organizacional
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-white" : "bg-muted"}`}>
              1
            </div>
            <span className="text-sm font-medium">Dados Básicos</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-white" : "bg-muted"}`}>
              2
            </div>
            <span className="text-sm font-medium">Destinatários</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-primary text-white" : "bg-muted"}`}>
              3
            </div>
            <span className="text-sm font-medium">Confirmação</span>
          </div>
        </div>

        {/* Step 1: Dados Básicos */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informações da Pesquisa</CardTitle>
              <CardDescription>Defina o título e a pergunta principal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Pesquisa *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Satisfação com Ambiente de Trabalho"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Pergunta *</Label>
                <Textarea
                  id="question"
                  placeholder="Ex: Como você avalia o ambiente de trabalho da empresa?"
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Contexto adicional sobre a pesquisa..."
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  Próximo
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Destinatários */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Selecionar Destinatários</CardTitle>
                <CardDescription>Escolha quem receberá a pesquisa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Grupos Gerais */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Grupos Gerais
                  </Label>
                  <div className="space-y-2 pl-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all"
                        checked={targetGroups.includes("all")}
                        onCheckedChange={() => handleToggleGroup("all")}
                      />
                      <label htmlFor="all" className="text-sm font-medium cursor-pointer">
                        Todos os Colaboradores
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="diretoria"
                        checked={targetGroups.includes("diretoria")}
                        onCheckedChange={() => handleToggleGroup("diretoria")}
                      />
                      <label htmlFor="diretoria" className="text-sm font-medium cursor-pointer">
                        Diretoria
                      </label>
                    </div>
                  </div>
                </div>

                {/* Departamentos */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Departamentos
                  </Label>
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    {departments.map((dept: any) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={targetDepartmentIds.includes(dept.id)}
                          onCheckedChange={() => handleToggleDepartment(dept.id)}
                        />
                        <label htmlFor={`dept-${dept.id}`} className="text-sm cursor-pointer">
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Centros de Custo */}
                {costCenters.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Centros de Custo
                    </Label>
                    <div className="grid grid-cols-2 gap-2 pl-6">
                      {costCenters.map((cc: any) => (
                        <div key={cc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cc-${cc.id}`}
                            checked={targetCostCenterIds.includes(cc.id)}
                            onCheckedChange={() => handleToggleCostCenter(cc.id)}
                          />
                          <label htmlFor={`cc-${cc.id}`} className="text-sm cursor-pointer">
                            {cc.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emails Específicos */}
                <div className="space-y-3">
                  <Label htmlFor="emails" className="text-base font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Emails Específicos
                  </Label>
                  <Textarea
                    id="emails"
                    placeholder="email1@example.com, email2@example.com"
                    rows={3}
                    value={targetEmails}
                    onChange={(e) => setTargetEmails(e.target.value)}
                    className="pl-6"
                  />
                  <p className="text-xs text-muted-foreground pl-6">
                    Separe múltiplos emails por vírgula
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button onClick={handleNext} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Pesquisa"}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmação */}
        {step === 3 && createMutation.data && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>Pesquisa Criada com Sucesso!</CardTitle>
                  <CardDescription>Agora você pode enviar os convites</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">{formData.title}</h3>
                <p className="text-sm text-muted-foreground">{formData.question}</p>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {targetGroups.map((group) => (
                    <Badge key={group} variant="secondary">
                      {group === "all" ? "Todos" : group === "diretoria" ? "Diretoria" : group}
                    </Badge>
                  ))}
                  {targetDepartmentIds.length > 0 && (
                    <Badge variant="secondary">
                      {targetDepartmentIds.length} departamento(s)
                    </Badge>
                  )}
                  {targetCostCenterIds.length > 0 && (
                    <Badge variant="secondary">
                      {targetCostCenterIds.length} centro(s) de custo
                    </Badge>
                  )}
                  {targetEmails && (
                    <Badge variant="secondary">
                      {targetEmails.split(",").length} email(s)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setLocation("/pesquisas-pulse")}>
                  Ir para Pesquisas
                </Button>
                <Button 
                  onClick={() => handleSendInvitations(createMutation.data.id)}
                  disabled={sendInvitationsMutation.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendInvitationsMutation.isPending ? "Enviando..." : "Enviar Convites"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
