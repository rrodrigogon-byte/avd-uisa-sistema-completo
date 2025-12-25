import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { History, Filter, Loader2, ArrowRight, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Página de Histórico de Movimentações
 * Exibe todas as movimentações de colaboradores com impacto em todo o sistema
 */
export default function HistoricoMovimentacoes() {
  const [filters, setFilters] = useState({
    employeeId: undefined as number | undefined,
    movementType: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: movements, isLoading } = trpc.orgChart.listMovements.useQuery({
    employeeId: filters.employeeId,
    movementType: filters.movementType as any,
    startDate: filters.startDate,
    endDate: filters.endDate,
    limit: 100,
  });

  const getMovementTypeBadge = (type: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      promocao: { variant: "default", label: "Promoção" },
      transferencia: { variant: "secondary", label: "Transferência" },
      mudanca_gestor: { variant: "outline", label: "Mudança de Gestor" },
      reorganizacao: { variant: "secondary", label: "Reorganização" },
      outro: { variant: "outline", label: "Outro" },
    };

    const config = variants[type] || { variant: "secondary" as const, label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (movement: any) => {
    setSelectedMovement(movement);
    setDetailsDialogOpen(true);
  };

  const handleExportCSV = () => {
    if (!movements || movements.movements.length === 0) {
      toast.error("Nenhuma movimentação para exportar");
      return;
    }

    // Gerar CSV
    const headers = [
      'ID',
      'Colaborador',
      'Matrícula',
      'Departamento Anterior',
      'Novo Departamento',
      'Cargo Anterior',
      'Novo Cargo',
      'Tipo de Movimentação',
      'Motivo',
      'Data Efetiva',
      'Data de Registro'
    ];

    const rows = movements.movements.map(m => [
      m.id?.toString() || '',
      m.employeeName || '',
      m.employeeCode || '',
      m.previousDepartment || '',
      m.newDepartment || '',
      m.previousPosition || '',
      m.newPosition || '',
      m.movementType || '',
      m.reason || '',
      m.effectiveDate ? new Date(m.effectiveDate).toLocaleDateString('pt-BR') : '',
      m.createdAt ? new Date(m.createdAt).toLocaleDateString('pt-BR') : ''
    ]);

    const escapeCsvValue = (value: string) => {
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(`${movements.movements.length} movimentações exportadas!`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe todas as mudanças organizacionais e seus impactos
            </p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Card de Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Filtre as movimentações por tipo, período ou colaborador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Tipo de Movimentação</Label>
                <Select
                  value={filters.movementType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, movementType: value === "todos" ? undefined : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="promocao">Promoção</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="mudanca_gestor">Mudança de Gestor</SelectItem>
                    <SelectItem value="reorganizacao">Reorganização</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ID do Colaborador</Label>
                <Input
                  type="number"
                  placeholder="Ex: 123"
                  value={filters.employeeId || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, employeeId: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Listagem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Movimentações Registradas
              {movements && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({movements.total} total)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !movements || movements.movements.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma movimentação encontrada</p>
                <p className="text-sm mt-2">
                  Ajuste os filtros ou aguarde novas movimentações
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Mudança</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data Efetiva</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.employeeName}</div>
                            {movement.employeeCode && (
                              <div className="text-sm text-muted-foreground">
                                Mat: {movement.employeeCode}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {movement.previousDepartment !== movement.newDepartment && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {movement.previousDepartment || "N/A"}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium">{movement.newDepartment || "N/A"}</span>
                              </div>
                            )}
                            {movement.previousPosition !== movement.newPosition && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">
                                  {movement.previousPosition || "N/A"}
                                </span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium">{movement.newPosition || "N/A"}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getMovementTypeBadge(movement.movementType)}</TableCell>
                        <TableCell>
                          {movement.effectiveDate
                            ? new Date(movement.effectiveDate).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate text-sm">
                            {movement.reason || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(movement)}
                          >
                            Ver Detalhes
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

        {/* Dialog de Detalhes */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Movimentação</DialogTitle>
              <DialogDescription>
                Informações completas sobre a movimentação de{" "}
                <strong>{selectedMovement?.employeeName}</strong>
              </DialogDescription>
            </DialogHeader>

            {selectedMovement && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Colaborador</Label>
                    <div className="font-medium">{selectedMovement.employeeName}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Matrícula</Label>
                    <div className="font-medium">{selectedMovement.employeeCode || "N/A"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Departamento Anterior</Label>
                    <div className="font-medium">{selectedMovement.previousDepartment || "N/A"}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Novo Departamento</Label>
                    <div className="font-medium">{selectedMovement.newDepartment || "N/A"}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Cargo Anterior</Label>
                    <div className="font-medium">{selectedMovement.previousPosition || "N/A"}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Novo Cargo</Label>
                    <div className="font-medium">{selectedMovement.newPosition || "N/A"}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Tipo de Movimentação</Label>
                  <div className="mt-1">{getMovementTypeBadge(selectedMovement.movementType)}</div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Motivo</Label>
                  <div className="font-medium mt-1">{selectedMovement.reason || "Não informado"}</div>
                </div>

                {selectedMovement.notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <div className="font-medium mt-1">{selectedMovement.notes}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Data Efetiva</Label>
                    <div className="font-medium">
                      {selectedMovement.effectiveDate
                        ? new Date(selectedMovement.effectiveDate).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Registrado em</Label>
                    <div className="font-medium">
                      {selectedMovement.createdAt
                        ? new Date(selectedMovement.createdAt).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
