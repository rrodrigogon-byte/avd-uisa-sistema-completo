import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Mail, Send, Users, Building2, CheckCircle2, XCircle, Brain } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Página de Envio de Testes Psicométricos
 * Permite RH enviar convites de testes para funcionários, equipes ou departamentos
 */

const TESTS = [
  { value: "disc", label: "DISC - Avaliação Comportamental", time: "10-15 min", questions: 40 },
  { value: "bigfive", label: "Big Five (OCEAN) - Personalidade", time: "12-18 min", questions: 50 },
  { value: "mbti", label: "MBTI - Tipo de Personalidade", time: "8-12 min", questions: 40 },
  { value: "ie", label: "Inteligência Emocional (Goleman)", time: "15-20 min", questions: 40 },
  { value: "vark", label: "VARK - Estilos de Aprendizagem", time: "8-10 min", questions: 40 },
  { value: "leadership", label: "Estilos de Liderança", time: "10-12 min", questions: 30 },
  { value: "careeranchors", label: "Âncoras de Carreira (Schein)", time: "12-15 min", questions: 40 },
];

export default function EnviarTestes() {
  const { user } = useAuth();
  const [selectedTest, setSelectedTest] = useState<string>("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [sendingIndividual, setSendingIndividual] = useState(false);
  const [sendingTeam, setSendingTeam] = useState(false);
  const [sendingDepartment, setSendingDepartment] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Buscar funcionários
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery();

  // Buscar departamentos
  const { data: departments, isLoading: loadingDepartments } = trpc.departments.list.useQuery();

  // Buscar centros de custo
  const { data: costCenters, isLoading: loadingCostCenters } = trpc.costCenters.list.useQuery();

  // Mutation para enviar convites
  const sendInviteMutation = trpc.psychometric.sendTestInvite.useMutation({
    onSuccess: (data) => {
      setResults(data.results);
      const successCount = data.results.filter((r: any) => r.success).length;
      toast.success(`${successCount} convite(s) enviado(s) com sucesso!`);
      setSendingIndividual(false);
      setSendingTeam(false);
      setSendingDepartment(false);
      setSelectedEmails([]);
      setManualEmail("");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar convites: ${error.message}`);
      setSendingIndividual(false);
      setSendingTeam(false);
      setSendingDepartment(false);
    },
  });

  const handleSendIndividual = () => {
    if (!selectedTest) {
      toast.error("Selecione um teste");
      return;
    }
    if (!manualEmail || !manualEmail.includes('@')) {
      toast.error("Insira um email válido");
      return;
    }

    setSendingIndividual(true);
    sendInviteMutation.mutate({
      testType: selectedTest as any,
      emails: [manualEmail],
    });
  };

  const handleSendToSelected = () => {
    if (!selectedTest) {
      toast.error("Selecione um teste");
      return;
    }
    if (selectedEmails.length === 0) {
      toast.error("Selecione pelo menos um funcionário");
      return;
    }

    setSendingTeam(true);
    sendInviteMutation.mutate({
      testType: selectedTest as any,
      emails: selectedEmails,
    });
  };

  const handleSendToDepartment = (departmentId: number) => {
    if (!selectedTest) {
      toast.error("Selecione um teste");
      return;
    }

    const deptEmployees = employees?.filter(e => e.employee.departmentId === departmentId && e.employee.status === 'ativo') || [];
    const emails = deptEmployees.map(e => e.employee.email).filter(Boolean) as string[];

    if (emails.length === 0) {
      toast.error("Nenhum funcionário ativo com email neste departamento");
      return;
    }

    setSendingDepartment(true);
    sendInviteMutation.mutate({
      testType: selectedTest as any,
      emails,
    });
  };

  const toggleEmployeeSelection = (email: string) => {
    setSelectedEmails(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const selectAllEmployees = () => {
    const allEmails = employees?.filter(e => e.employee.status === 'ativo' && e.employee.email).map(e => e.employee.email) as string[];
    setSelectedEmails(allEmails || []);
  };

  const deselectAllEmployees = () => {
    setSelectedEmails([]);
  };

  if (user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem enviar testes</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Enviar Testes Psicométricos
          </h1>
          <p className="text-muted-foreground mt-2">
            Envie convites de testes para funcionários, equipes ou departamentos
          </p>
        </div>

        {/* Seleção de Teste */}
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-600" />
              Selecione o Teste
            </CardTitle>
            <CardDescription>Escolha qual teste psicométrico deseja enviar</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTest} onValueChange={setSelectedTest}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um teste..." />
              </SelectTrigger>
              <SelectContent>
                {TESTS.map(test => (
                  <SelectItem key={test.value} value={test.value}>
                    {test.label} · {test.questions} perguntas · {test.time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tabs de Envio */}
        <Tabs defaultValue="individual" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="team">Equipe/Múltiplos</TabsTrigger>
            <TabsTrigger value="department">Departamento</TabsTrigger>
            <TabsTrigger value="diretoria">Diretoria</TabsTrigger>
            <TabsTrigger value="costcenter">Centro de Custos</TabsTrigger>
          </TabsList>

          {/* Envio Individual */}
          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle>Enviar para Funcionário Individual</CardTitle>
                <CardDescription>Insira o email do colaborador</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email do Colaborador</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colaborador@empresa.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSendIndividual}
                  disabled={sendingIndividual || !selectedTest}
                  className="w-full"
                >
                  {sendingIndividual ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Envio para Equipe/Múltiplos */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Enviar para Múltiplos Funcionários</CardTitle>
                <CardDescription>
                  Selecione os colaboradores que receberão o teste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllEmployees}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllEmployees}
                  >
                    Limpar Seleção
                  </Button>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedEmails.length} selecionados
                  </Badge>
                </div>

                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <div className="divide-y">
                      {employees?.filter(e => e.employee.status === 'ativo' && e.employee.email).map(employee => (
                        <div
                          key={employee.employee.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          onClick={() => toggleEmployeeSelection(employee.employee.email!)}
                        >
                          <Checkbox
                            checked={selectedEmails.includes(employee.employee.email!)}
                            onCheckedChange={() => toggleEmployeeSelection(employee.employee.email!)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{employee.employee.name}</div>
                            <div className="text-sm text-muted-foreground">{employee.employee.email}</div>
                          </div>
                          <Badge variant="outline">{employee.position?.title}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSendToSelected}
                  disabled={sendingTeam || !selectedTest || selectedEmails.length === 0}
                  className="w-full"
                >
                  {sendingTeam ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para {selectedEmails.length} Funcionário(s)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Envio para Departamento */}
          <TabsContent value="department">
            <Card>
              <CardHeader>
                <CardTitle>Enviar para Departamento Inteiro</CardTitle>
                <CardDescription>
                  Todos os funcionários ativos do departamento receberão o teste
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDepartments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {departments?.map(dept => {
                      const deptEmployees = employees?.filter(
                        e => e.employee.departmentId === dept.id && e.employee.status === 'ativo' && e.employee.email
                      ) || [];
                      return (
                        <Card key={dept.id} className="border-gray-200">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-gray-500" />
                              <div>
                                <div className="font-medium">{dept.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {deptEmployees.length} funcionário(s) ativo(s)
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleSendToDepartment(dept.id)}
                              disabled={sendingDepartment || !selectedTest || deptEmployees.length === 0}
                              size="sm"
                            >
                              {sendingDepartment ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Enviar
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Envio para Diretoria */}
          <TabsContent value="diretoria">
            <Card>
              <CardHeader>
                <CardTitle>Enviar para Diretoria</CardTitle>
                <CardDescription>
                  Todos os membros da diretoria receberão o teste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => {
                    if (!selectedTest) {
                      toast.error("Selecione um teste");
                      return;
                    }
                    const diretoriaEmployees = employees?.filter(
                      e => e.employee.status === 'ativo' && 
                           e.employee.email && 
                           (e.position?.title.toLowerCase().includes('diretor') || 
                            e.position?.title.toLowerCase().includes('ceo') ||
                            e.position?.title.toLowerCase().includes('presidente'))
                    ) || [];
                    const emails = diretoriaEmployees.map(e => e.employee.email).filter(Boolean) as string[];
                    
                    if (emails.length === 0) {
                      toast.error("Nenhum membro da diretoria encontrado");
                      return;
                    }
                    
                    setSendingDepartment(true);
                    sendInviteMutation.mutate({
                      testType: selectedTest as any,
                      emails,
                    });
                  }}
                  disabled={sendingDepartment || !selectedTest}
                  className="w-full"
                >
                  {sendingDepartment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para Diretoria
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground">
                  Serão enviados convites para todos os cargos que contêm "Diretor", "CEO" ou "Presidente" no título.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Envio para Centro de Custos */}
          <TabsContent value="costcenter">
            <Card>
              <CardHeader>
                <CardTitle>Enviar para Centro de Custos</CardTitle>
                <CardDescription>
                  Todos os funcionários ativos do centro de custos receberão o teste
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingEmployees ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {costCenters?.map((cc: any) => {
                      const ccEmployees = employees?.filter(
                        e => e.employee.costCenterId === cc.id && e.employee.status === 'ativo' && e.employee.email
                      ) || [];
                      return (
                        <Card key={cc.id} className="border-gray-200">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5 text-gray-500" />
                              <div>
                                <div className="font-medium">{cc.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {ccEmployees.length} funcionário(s) ativo(s)
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => {
                                if (!selectedTest) {
                                  toast.error("Selecione um teste");
                                  return;
                                }
                                const emails = ccEmployees.map(e => e.employee.email).filter(Boolean) as string[];
                                if (emails.length === 0) {
                                  toast.error("Nenhum funcionário ativo com email neste centro de custos");
                                  return;
                                }
                                setSendingDepartment(true);
                                sendInviteMutation.mutate({
                                  testType: selectedTest as any,
                                  emails,
                                });
                              }}
                              disabled={sendingDepartment || !selectedTest || ccEmployees.length === 0}
                              size="sm"
                            >
                              {sendingDepartment ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Enviar
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resultados do Envio */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Resultados do Envio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">{result.email}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{result.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
