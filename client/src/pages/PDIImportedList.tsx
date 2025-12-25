import { useState } from 'react';
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
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
  ArrowLeft, 
  FileText, 
  Filter,
  Eye,
  Calendar,
  User,
  Target,
  TrendingUp,
  Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditImportedActionDialog from '@/components/EditImportedActionDialog';

export default function PDIImportedList() {
  const [, setLocation] = useLocation();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [selectedPDI, setSelectedPDI] = useState<number | null>(null);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Buscar funcionários para filtro
  const { data: employees } = trpc.employees.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  // Buscar ciclos para filtro
  const { data: cycles } = trpc.evaluationCycles.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Buscar PDIs importados com filtros
  const { data: importedPDIs, isLoading } = trpc.pdi.listImported.useQuery({
    employeeId: selectedEmployeeId || undefined,
    cycleId: selectedCycleId || undefined,
  });

  // Buscar detalhes de um PDI específico
  const { data: pdiDetails } = trpc.pdi.getImportedDetails.useQuery(
    { pdiId: selectedPDI! },
    { enabled: !!selectedPDI }
  );

  const formatDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/pdi')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para PDI
          </Button>
          <h1 className="text-3xl font-bold">PDIs Importados</h1>
          <p className="text-muted-foreground">
            Visualize todos os PDIs importados via HTML
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os PDIs por funcionário e ciclo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Funcionário
              </label>
              <Select
                value={selectedEmployeeId?.toString() || 'all'}
                onValueChange={(value) => 
                  setSelectedEmployeeId(value === 'all' ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os funcionários</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Ciclo
              </label>
              <Select
                value={selectedCycleId?.toString() || 'all'}
                onValueChange={(value) => 
                  setSelectedCycleId(value === 'all' ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os ciclos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ciclos</SelectItem>
                  {cycles?.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de PDIs Importados */}
      <Card>
        <CardHeader>
          <CardTitle>PDIs Importados via HTML</CardTitle>
          <CardDescription>
            {importedPDIs?.length || 0} PDI(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando PDIs...
            </div>
          ) : !importedPDIs || importedPDIs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum PDI importado encontrado
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Data de Importação</TableHead>
                    <TableHead className="text-center">Gaps</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                    <TableHead className="text-right">Visualizar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedPDIs.map((pdi) => (
                    <TableRow key={pdi.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{pdi.employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {pdi.positionName || 'Cargo não informado'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{pdi.cycleName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {pdi.importedAt ? formatDate(pdi.importedAt) : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-50">
                          <Target className="h-3 w-3 mr-1" />
                          {pdi.gapsCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {pdi.actionsCount || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPDI(pdi.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
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

      {/* Dialog de Detalhes do PDI */}
      <Dialog open={!!selectedPDI} onOpenChange={() => setSelectedPDI(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do PDI Importado</DialogTitle>
            <DialogDescription>
              Informações completas sobre o PDI selecionado
            </DialogDescription>
          </DialogHeader>

          {pdiDetails && (
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
                      <p className="font-medium">{pdiDetails.employeeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ciclo</p>
                      <p className="font-medium">{pdiDetails.cycleName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Importação</p>
                      <p className="font-medium">
                        {pdiDetails.importedAt ? formatDate(pdiDetails.importedAt) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge>{pdiDetails.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gaps Identificados */}
              {pdiDetails.gaps && pdiDetails.gaps.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Gaps Identificados ({pdiDetails.gaps.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pdiDetails.gaps.map((gap: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-muted-foreground mt-1">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Ações de Desenvolvimento */}
              {pdiDetails.actions && pdiDetails.actions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ações de Desenvolvimento ({pdiDetails.actions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pdiDetails.actions.map((action: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2 relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setEditingActionId(action.id)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <h4 className="font-medium">{action.description}</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Área: </span>
                              <span>{action.developmentArea || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Responsável: </span>
                              <span>{action.responsible || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prazo: </span>
                              <span>
                                {action.dueDate ? formatDate(action.dueDate) : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status: </span>
                              <Badge variant="outline">{action.status || 'N/A'}</Badge>
                            </div>
                          </div>
                          {action.successMetric && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Métrica de Sucesso: </span>
                              <span>{action.successMetric}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição de Ação */}
      <EditImportedActionDialog
        actionId={editingActionId}
        open={!!editingActionId}
        onOpenChange={(open) => !open && setEditingActionId(null)}
        onSuccess={() => {
          utils.pdi.getImportedDetails.invalidate();
          utils.pdi.listImported.invalidate();
        }}
      />
    </div>
  );
}
