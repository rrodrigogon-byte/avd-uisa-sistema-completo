import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, FileText } from "lucide-react";

export default function PatientHistory() {
  const [, navigate] = useLocation();
  
  const searchParams = new URLSearchParams(window.location.search);
  const pacienteIdParam = searchParams.get("pacienteId");
  const pacienteId = pacienteIdParam ? parseInt(pacienteIdParam) : 0;

  const { data: paciente, isLoading: loadingPaciente } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId },
    { enabled: pacienteId > 0 }
  );

  const { data: fullHistory, isLoading: loadingHistory } = trpc.geriatric.patients.getFullHistory.useQuery(
    { pacienteId },
    { enabled: pacienteId > 0 }
  );

  if (loadingPaciente || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Paciente não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/geriatric/patients")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/geriatric/patients")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Pacientes
        </Button>
      </div>

      {/* Informações do Paciente */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{paciente.nome}</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div>Data de Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")} ({calculateAge(paciente.dataNascimento)} anos)</div>
                {paciente.cpf && <div>CPF: {paciente.cpf}</div>}
                {paciente.telefone && <div>Telefone: {paciente.telefone}</div>}
                {paciente.email && <div>Email: {paciente.email}</div>}
              </CardDescription>
            </div>
            <Badge variant={paciente.active ? "default" : "secondary"}>
              {paciente.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Testes Realizados */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
          <CardDescription>
            Todos os testes geriátricos realizados para este paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="katz" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="katz">Katz</TabsTrigger>
              <TabsTrigger value="lawton">Lawton</TabsTrigger>
              <TabsTrigger value="minimental">Minimental</TabsTrigger>
              <TabsTrigger value="gds">GDS-15</TabsTrigger>
              <TabsTrigger value="clock">Relógio</TabsTrigger>
            </TabsList>

            {/* Teste de Katz */}
            <TabsContent value="katz" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Teste de Katz (AVD Básicas)</h3>
                <Button onClick={() => navigate(`/geriatric/katz-test?pacienteId=${pacienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Avaliação
                </Button>
              </div>
              
              {fullHistory?.katzTests && fullHistory.katzTests.length > 0 ? (
                <div className="space-y-3">
                  {fullHistory.katzTests.map((test: any) => (
                    <Card key={test.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(test.dataAvaliacao).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-lg font-semibold">
                              Pontuação: {test.pontuacaoTotal}/6
                            </p>
                            <Badge>{test.classificacao}</Badge>
                            {test.observacoes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Obs: {test.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum teste de Katz realizado ainda
                </p>
              )}
            </TabsContent>

            {/* Teste de Lawton */}
            <TabsContent value="lawton" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Teste de Lawton (AVD Instrumentais)</h3>
                <Button onClick={() => navigate(`/geriatric/lawton-test?pacienteId=${pacienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Avaliação
                </Button>
              </div>
              
              {fullHistory?.lawtonTests && fullHistory.lawtonTests.length > 0 ? (
                <div className="space-y-3">
                  {fullHistory.lawtonTests.map((test: any) => (
                    <Card key={test.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(test.dataAvaliacao).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-lg font-semibold">
                              Pontuação: {test.pontuacaoTotal}/8
                            </p>
                            <Badge>{test.classificacao}</Badge>
                            {test.observacoes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Obs: {test.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum teste de Lawton realizado ainda
                </p>
              )}
            </TabsContent>

            {/* Minimental */}
            <TabsContent value="minimental" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Minimental (MEEM)</h3>
                <Button onClick={() => navigate(`/geriatric/minimental-test?pacienteId=${pacienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Avaliação
                </Button>
              </div>
              
              {fullHistory?.miniMentalTests && fullHistory.miniMentalTests.length > 0 ? (
                <div className="space-y-3">
                  {fullHistory.miniMentalTests.map((test: any) => (
                    <Card key={test.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(test.dataAvaliacao).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-lg font-semibold">
                              Pontuação: {test.pontuacaoTotal}/30
                            </p>
                            <Badge>{test.classificacao}</Badge>
                            {test.observacoes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Obs: {test.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum teste Minimental realizado ainda
                </p>
              )}
            </TabsContent>

            {/* GDS-15 */}
            <TabsContent value="gds" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Escala de Depressão Geriátrica (GDS-15)</h3>
                <Button onClick={() => navigate(`/geriatric/gds-test?pacienteId=${pacienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Avaliação
                </Button>
              </div>
              
              {fullHistory?.gdsTests && fullHistory.gdsTests.length > 0 ? (
                <div className="space-y-3">
                  {fullHistory.gdsTests.map((test: any) => (
                    <Card key={test.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(test.dataAvaliacao).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-lg font-semibold">
                              Pontuação: {test.pontuacaoTotal}/15
                            </p>
                            <Badge>{test.classificacao}</Badge>
                            {test.observacoes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Obs: {test.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum teste GDS-15 realizado ainda
                </p>
              )}
            </TabsContent>

            {/* Teste do Relógio */}
            <TabsContent value="clock" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Teste do Relógio</h3>
                <Button onClick={() => navigate(`/geriatric/clock-test?pacienteId=${pacienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Avaliação
                </Button>
              </div>
              
              {fullHistory?.clockTests && fullHistory.clockTests.length > 0 ? (
                <div className="space-y-3">
                  {fullHistory.clockTests.map((test: any) => (
                    <Card key={test.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              Data: {new Date(test.dataAvaliacao).toLocaleDateString("pt-BR")}
                            </p>
                            <p className="text-lg font-semibold">
                              Pontuação: {test.pontuacaoTotal}/10
                            </p>
                            {test.imagemUrl && (
                              <div className="mt-3">
                                <img
                                  src={test.imagemUrl}
                                  alt="Desenho do relógio"
                                  className="max-w-xs rounded-lg border"
                                />
                              </div>
                            )}
                            {test.observacoes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Obs: {test.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum teste do Relógio realizado ainda
                </p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
