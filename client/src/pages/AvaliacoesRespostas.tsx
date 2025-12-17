import { useState } from 'react';
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from '@/components/DashboardLayout';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Search,
  User,
  Calendar,
  Award,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function AvaliacoesRespostas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEvaluation, setSelectedEvaluation] = useState<number | null>(null);

  // Buscar todas as avaliações (admin/RH vê todas)
  const { data: allEvaluations, isLoading } = trpc.evaluations.listAll.useQuery();

  // Buscar detalhes da avaliação selecionada
  const { data: evaluationDetails } = trpc.evaluations.getById.useQuery(
    { id: selectedEvaluation! },
    { enabled: !!selectedEvaluation }
  );

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: 'secondary', label: 'Pendente', icon: Clock },
      em_andamento: { variant: 'outline', label: 'Em Andamento', icon: Clock },
      concluida: { variant: 'default', label: 'Concluída', icon: CheckCircle2 },
      cancelada: { variant: 'destructive', label: 'Cancelada', icon: Clock },
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Filtrar avaliações
  const filteredEvaluations = allEvaluations?.filter((evaluation: any) => {
    const matchesSearch =
      evaluation.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.evaluatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.cycleName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || evaluation.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Respostas de Avaliações
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize todas as avaliações preenchidas e suas respostas
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por funcionário, avaliador ou ciclo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle>Avaliações Registradas</CardTitle>
            <CardDescription>
              {filteredEvaluations?.length || 0} avaliação(ões) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando avaliações...
              </div>
            ) : !filteredEvaluations || filteredEvaluations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma avaliação encontrada
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Avaliador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Conclusão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvaluations.map((evaluation: any) => (
                      <TableRow key={evaluation.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {evaluation.employeeName || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{evaluation.evaluatorName || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{evaluation.evaluationType || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{evaluation.cycleName || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(evaluation.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatDate(evaluation.completedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedEvaluation(evaluation.id)}
                            disabled={evaluation.status === 'pendente'}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Respostas
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Detalhes da Avaliação */}
        <Dialog open={!!selectedEvaluation} onOpenChange={() => setSelectedEvaluation(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Avaliação</DialogTitle>
              <DialogDescription>
                Respostas e pontuações da avaliação selecionada
              </DialogDescription>
            </DialogHeader>

            {evaluationDetails && (
              <div className="space-y-6">
                {/* Informações Gerais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Informações Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Funcionário</p>
                        <p className="font-medium">{evaluationDetails.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Avaliador</p>
                        <p className="font-medium">{evaluationDetails.evaluatorName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Avaliação</p>
                        <Badge variant="outline">{evaluationDetails.evaluationType}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        {getStatusBadge(evaluationDetails.status)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Início</p>
                        <p className="font-medium">{formatDate(evaluationDetails.startedAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Conclusão</p>
                        <p className="font-medium">
                          {formatDate(evaluationDetails.completedAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Respostas */}
                {evaluationDetails.responses && evaluationDetails.responses.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Respostas ({evaluationDetails.responses.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {evaluationDetails.responses.map((response: any, idx: number) => (
                          <div
                            key={idx}
                            className="border-l-4 border-blue-500 pl-4 py-2 bg-muted/30 rounded-r"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{response.criteriaName}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {response.criteriaDescription}
                                </p>
                              </div>
                              <Badge variant="default" className="ml-4">
                                {response.score} / {response.maxScore || 5}
                              </Badge>
                            </div>
                            {response.comment && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-sm text-muted-foreground">Comentário:</p>
                                <p className="text-sm mt-1">{response.comment}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pontuação Final */}
                {evaluationDetails.finalScore && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Pontuação Final</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{evaluationDetails.finalScore}</p>
                          <p className="text-sm text-muted-foreground">Pontos</p>
                        </div>
                        {evaluationDetails.finalRating && (
                          <Badge variant="default" className="text-lg px-4 py-2">
                            {evaluationDetails.finalRating}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
