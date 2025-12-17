import { useState } from 'react';
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { useRoute, useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  Target,
  TrendingUp,
  Award,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { ReportExportButtons } from '@/components/ReportExportButtons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FuncionarioDetalhes() {
  const [, params] = useRoute('/funcionarios/:id');
  const [, setLocation] = useLocation();
  const employeeId = params?.id ? parseInt(params.id) : null;

  // Buscar dados do funcionário
  const { data: employee, isLoading } = trpc.employees.getById.useQuery(
    { id: employeeId! },
    { enabled: !!employeeId }
  );

  // Buscar metas do funcionário
  const { data: goals } = trpc.goals.list.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  // Buscar avaliações do funcionário
  const { data: evaluations } = trpc.evaluations.list.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  // Buscar PDIs do funcionário
  const { data: pdis } = trpc.pdi.list.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  // Buscar testes psicométricos do funcionário
  const { data: psychometricTests } = trpc.psychometricTests.getResultsByEmployee.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  if (!employeeId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Funcionário não encontrado</p>
          <Button onClick={() => setLocation('/funcionarios')} className="mt-4">
            Voltar para Funcionários
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!employee) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Funcionário não encontrado</p>
          <Button onClick={() => setLocation('/funcionarios')} className="mt-4">
            Voltar para Funcionários
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ativo: 'default',
      afastado: 'secondary',
      desligado: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/funcionarios')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Funcionários
          </Button>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={(employee as any)?.avatarUrl} />
              <AvatarFallback className="text-2xl">
                {employee?.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{employee?.name || 'Nome não disponível'}</h1>
                  <p className="text-muted-foreground text-lg">
                    {employee?.positionTitle || 'Cargo não informado'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(employee?.status || 'ativo')}
                    <span className="text-sm text-muted-foreground">
                      Matrícula: {employee?.employeeCode || 'N/A'}
                    </span>
                  </div>
                </div>
                <ReportExportButtons employeeId={employeeId} variant="individual" />
              </div>
            </div>
          </div>
        </div>

        {/* Informações Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{employee?.email || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Departamento</p>
                  <p className="font-medium">{employee?.departmentName || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data de Admissão</p>
                  <p className="font-medium">{formatDate(employee?.hireDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo de Casa</p>
                  <p className="font-medium">
                    {employee?.hireDate
                      ? `${Math.floor(
                          (new Date().getTime() - new Date(employee.hireDate).getTime()) /
                            (1000 * 60 * 60 * 24 * 365)
                        )} anos`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Informações Detalhadas */}
        <Tabs defaultValue="metas" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="metas">
              <Target className="h-4 w-4 mr-2" />
              Metas ({goals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="avaliacoes">
              <Award className="h-4 w-4 mr-2" />
              Avaliações ({evaluations?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pdi">
              <TrendingUp className="h-4 w-4 mr-2" />
              PDI ({pdis?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="testes">
              <FileText className="h-4 w-4 mr-2" />
              Testes ({psychometricTests?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="dados">
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
          </TabsList>

          {/* Tab Metas */}
          <TabsContent value="metas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metas do Funcionário</CardTitle>
                <CardDescription>
                  Acompanhe o progresso das metas individuais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!goals || goals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma meta cadastrada
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prazo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {goals.map((goal: any) => (
                        <TableRow key={goal.id}>
                          <TableCell className="font-medium">{goal.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{goal.category}</Badge>
                          </TableCell>
                          <TableCell>{goal.progress || 0}%</TableCell>
                          <TableCell>
                            <Badge>{goal.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(goal.endDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Avaliações */}
          <TabsContent value="avaliacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  Avaliações de desempenho realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!evaluations || evaluations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma avaliação encontrada
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ciclo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nota Final</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluations.map((evaluation: any) => (
                        <TableRow key={evaluation.id}>
                          <TableCell>{evaluation.cycleName || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{evaluation.type}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {evaluation.finalScore || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge>{evaluation.status}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(evaluation.evaluationDate)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab PDI */}
          <TabsContent value="pdi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Planos de Desenvolvimento Individual</CardTitle>
                <CardDescription>
                  Acompanhe o desenvolvimento profissional
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!pdis || pdis.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum PDI cadastrado
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Período</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pdis.map((pdi: any) => (
                        <TableRow key={pdi.id}>
                          <TableCell className="font-medium">{pdi.title}</TableCell>
                          <TableCell>{pdi.progress || 0}%</TableCell>
                          <TableCell>
                            <Badge>{pdi.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(pdi.startDate)} - {formatDate(pdi.endDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Testes Psicométricos */}
          <TabsContent value="testes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testes Psicométricos Realizados</CardTitle>
                <CardDescription>
                  Histórico de testes e resultados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!psychometricTests || psychometricTests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum teste realizado
                  </p>
                ) : (
                  <div className="space-y-4">
                    {psychometricTests.map((test: any) => (
                      <Card key={test.id} className="border-l-4 border-blue-500">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {test.testType === 'disc' && 'DISC'}
                                {test.testType === 'bigfive' && 'Big Five'}
                                {test.testType === 'mbti' && 'MBTI'}
                                {test.testType === 'ie' && 'Inteligência Emocional'}
                                {test.testType === 'vark' && 'VARK'}
                                {test.testType === 'leadership' && 'Estilos de Liderança'}
                                {test.testType === 'careeranchors' && 'Âncoras de Carreira'}
                              </CardTitle>
                              <CardDescription>
                                Realizado em {formatDate(test.completedAt)}
                              </CardDescription>
                            </div>
                            <Badge variant="default">
                              {test.status || 'Concluído'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Perfil Principal */}
                          {test.profileType && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Perfil:</p>
                              <p className="font-medium text-lg">{test.profileType}</p>
                            </div>
                          )}

                          {/* Descrição */}
                          {test.profileDescription && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Descrição:</p>
                              <p className="text-sm">{test.profileDescription}</p>
                            </div>
                          )}

                          {/* Pontos Fortes */}
                          {test.strengths && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Pontos Fortes:</p>
                              <p className="text-sm">{test.strengths}</p>
                            </div>
                          )}

                          {/* Áreas de Desenvolvimento */}
                          {test.developmentAreas && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Áreas de Desenvolvimento:</p>
                              <p className="text-sm">{test.developmentAreas}</p>
                            </div>
                          )}

                          {/* Estilo de Trabalho */}
                          {test.workStyle && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Estilo de Trabalho:</p>
                              <p className="text-sm">{test.workStyle}</p>
                            </div>
                          )}

                          {/* Pontuações DISC */}
                          {test.testType === 'disc' && (test.dominance || test.influence || test.steadiness || test.conscientiousness) && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground mb-2">Pontuações:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {test.dominance && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Dominância (D)</span>
                                    <Badge variant="outline">{test.dominance}</Badge>
                                  </div>
                                )}
                                {test.influence && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Influência (I)</span>
                                    <Badge variant="outline">{test.influence}</Badge>
                                  </div>
                                )}
                                {test.steadiness && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Estabilidade (S)</span>
                                    <Badge variant="outline">{test.steadiness}</Badge>
                                  </div>
                                )}
                                {test.conscientiousness && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Conformidade (C)</span>
                                    <Badge variant="outline">{test.conscientiousness}</Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Pontuações Big Five */}
                          {test.testType === 'bigfive' && (test.openness || test.conscientiousnessScore || test.extraversion || test.agreeableness || test.neuroticism) && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground mb-2">Pontuações:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {test.openness && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Abertura</span>
                                    <Badge variant="outline">{test.openness}</Badge>
                                  </div>
                                )}
                                {test.conscientiousnessScore && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Conscienciosidade</span>
                                    <Badge variant="outline">{test.conscientiousnessScore}</Badge>
                                  </div>
                                )}
                                {test.extraversion && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Extroversão</span>
                                    <Badge variant="outline">{test.extraversion}</Badge>
                                  </div>
                                )}
                                {test.agreeableness && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Amabilidade</span>
                                    <Badge variant="outline">{test.agreeableness}</Badge>
                                  </div>
                                )}
                                {test.neuroticism && (
                                  <div className="flex items-center justify-between p-2 bg-muted rounded">
                                    <span className="text-sm">Neuroticismo</span>
                                    <Badge variant="outline">{test.neuroticism}</Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Recomendações */}
                          {test.recommendations && (
                            <div>
                              <p className="text-sm font-semibold text-muted-foreground">Recomendações:</p>
                              <p className="text-sm">{test.recommendations}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Dados Pessoais */}
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Dados cadastrais do funcionário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{employee.employee?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{employee.employee?.cpf || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">{formatDate(employee.employee?.birthDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{employee.employee?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{employee.employee?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salário</p>
                    <p className="font-medium">
                      {employee.employee?.salary
                        ? `R$ ${employee.employee.salary.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
