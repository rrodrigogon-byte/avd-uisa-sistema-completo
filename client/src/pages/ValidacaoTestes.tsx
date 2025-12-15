import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Eye, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ValidacaoTestes() {
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [validationDialog, setValidationDialog] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"aprovado" | "reprovado">("aprovado");
  const [comments, setComments] = useState("");
  const [detailsDialog, setDetailsDialog] = useState(false);

  const utils = trpc.useUtils();

  // Buscar testes pendentes
  const { data: pendingTests, isLoading: loadingPending } = trpc.psychometricTests.listPendingValidation.useQuery();

  // Buscar testes validados
  const { data: validatedTests, isLoading: loadingValidated } = trpc.psychometricTests.listValidatedTests.useQuery({});

  // Buscar estatísticas
  const { data: stats } = trpc.psychometricTests.getValidationStats.useQuery();

  // Mutation para validar teste
  const validateMutation = trpc.psychometricTests.validateTest.useMutation({
    onSuccess: () => {
      toast.success("Teste validado com sucesso!");
      setValidationDialog(false);
      setComments("");
      utils.psychometricTests.listPendingValidation.invalidate();
      utils.psychometricTests.listValidatedTests.invalidate();
      utils.psychometricTests.getValidationStats.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao validar teste: ${error.message}`);
    },
  });

  const handleValidate = () => {
    if (!selectedTest) return;

    validateMutation.mutate({
      testResultId: selectedTest.id,
      status: validationStatus,
      comments: comments || undefined,
    });
  };

  const openValidationDialog = (test: any, status: "aprovado" | "reprovado") => {
    setSelectedTest(test);
    setValidationStatus(status);
    setValidationDialog(true);
  };

  const openDetailsDialog = (test: any) => {
    setSelectedTest(test);
    setDetailsDialog(true);
  };

  const testTypeNames: Record<string, string> = {
    disc: "DISC",
    bigfive: "Big Five",
    mbti: "MBTI",
    ie: "Inteligência Emocional",
    vark: "VARK",
    leadership: "Liderança",
    careeranchors: "Âncoras de Carreira",
    pir: "PIR",
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Validação de Testes Psicométricos</h1>
          <p className="text-muted-foreground">
            Revise e valide os testes psicométricos concluídos pelos funcionários
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Testes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.rejected || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Testes */}
        <Tabs defaultValue="pendentes" className="w-full">
          <TabsList>
            <TabsTrigger value="pendentes">
              Pendentes ({stats?.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="validados">
              Validados ({(stats?.approved || 0) + (stats?.rejected || 0)})
            </TabsTrigger>
          </TabsList>

          {/* Testes Pendentes */}
          <TabsContent value="pendentes" className="space-y-4">
            {loadingPending ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Carregando testes pendentes...</p>
                </CardContent>
              </Card>
            ) : pendingTests && pendingTests.length > 0 ? (
              pendingTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {test.employeeName || "Funcionário não identificado"}
                        </CardTitle>
                        <CardDescription>
                          {test.employeeEmail || "Email não disponível"}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        <Clock className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo de Teste</p>
                        <p className="text-base font-semibold">{testTypeNames[test.testType] || test.testType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Perfil Identificado</p>
                        <p className="text-base font-semibold">{test.profileType || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
                        <p className="text-base">{new Date(test.completedAt).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailsDialog(test)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openValidationDialog(test, "aprovado")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openValidationDialog(test, "reprovado")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Nenhum teste pendente de validação.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Testes Validados */}
          <TabsContent value="validados" className="space-y-4">
            {loadingValidated ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Carregando testes validados...</p>
                </CardContent>
              </Card>
            ) : validatedTests && validatedTests.length > 0 ? (
              validatedTests.map((test) => (
                <Card key={test.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {test.employeeName || "Funcionário não identificado"}
                        </CardTitle>
                        <CardDescription>
                          {test.employeeEmail || "Email não disponível"}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          test.validationStatus === "aprovado"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }
                      >
                        {test.validationStatus === "aprovado" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {test.validationStatus === "aprovado" ? "Aprovado" : "Reprovado"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 mb-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tipo de Teste</p>
                        <p className="text-base font-semibold">{testTypeNames[test.testType] || test.testType}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Perfil Identificado</p>
                        <p className="text-base font-semibold">{test.profileType || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
                        <p className="text-base">{new Date(test.completedAt).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Validado em</p>
                        <p className="text-base">{test.validatedAt ? new Date(test.validatedAt).toLocaleDateString("pt-BR") : "N/A"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">Validado por</p>
                        <p className="text-base">{test.validatorName || "N/A"}</p>
                      </div>
                      {test.validationComments && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Comentários</p>
                          <p className="text-base">{test.validationComments}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailsDialog(test)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">Nenhum teste validado ainda.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Validação */}
        <Dialog open={validationDialog} onOpenChange={setValidationDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {validationStatus === "aprovado" ? "Aprovar Teste" : "Reprovar Teste"}
              </DialogTitle>
              <DialogDescription>
                Você está prestes a {validationStatus === "aprovado" ? "aprovar" : "reprovar"} o teste de{" "}
                <strong>{selectedTest?.employeeName}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="comments">Comentários (opcional)</Label>
                <Textarea
                  id="comments"
                  placeholder="Adicione comentários sobre a validação..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setValidationDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleValidate}
                disabled={validateMutation.isPending}
                className={
                  validationStatus === "aprovado"
                    ? "bg-green-600 hover:bg-green-700"
                    : ""
                }
                variant={validationStatus === "aprovado" ? "default" : "destructive"}
              >
                {validateMutation.isPending ? "Processando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes */}
        <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Teste</DialogTitle>
              <DialogDescription>
                Informações completas sobre o teste psicométrico
              </DialogDescription>
            </DialogHeader>

            {selectedTest && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Funcionário</p>
                    <p className="text-base font-semibold">{selectedTest.employeeName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base">{selectedTest.employeeEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Teste</p>
                    <p className="text-base font-semibold">
                      {testTypeNames[selectedTest.testType] || selectedTest.testType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Perfil</p>
                    <p className="text-base font-semibold">{selectedTest.profileType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Conclusão</p>
                    <p className="text-base">
                      {new Date(selectedTest.completedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={
                        selectedTest.validationStatus === "pendente"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : selectedTest.validationStatus === "aprovado"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {selectedTest.validationStatus === "pendente"
                        ? "Pendente"
                        : selectedTest.validationStatus === "aprovado"
                        ? "Aprovado"
                        : "Reprovado"}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(`/desenvolvimento/funcionarios/${selectedTest.employeeId}`, "_blank");
                    }}
                  >
                    Ver Perfil Completo do Funcionário
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailsDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
