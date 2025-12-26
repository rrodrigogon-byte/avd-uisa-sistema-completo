import { useState, useMemo } from "react";
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
import { Loader2, Search, Filter, Calendar, ArrowRight, User } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const changeTypeLabels = {
  promocao: { label: "Promoção", variant: "default" as const },
  transferencia: { label: "Transferência", variant: "secondary" as const },
  reorganizacao: { label: "Reorganização", variant: "outline" as const },
  desligamento_gestor: { label: "Desligamento de Gestor", variant: "destructive" as const },
  ajuste_hierarquico: { label: "Ajuste Hierárquico", variant: "secondary" as const },
  outro: { label: "Outro", variant: "outline" as const },
};

export default function HistoricoMudancas() {
  const [filters, setFilters] = useState({
    employeeId: undefined as number | undefined,
    departmentId: undefined as number | undefined,
    startDate: "",
    endDate: "",
    changeType: undefined as string | undefined,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const { data: historyData, isLoading } = trpc.orgChart.getManagerHistory.useQuery({
    ...filters,
    limit: 100,
  });

  const { data: departments } = trpc.departments.list.useQuery(undefined);

  // Filtrar por termo de busca
  const filteredHistory = useMemo(() => {
    if (!historyData?.history) return [];

    if (!searchTerm) return historyData.history;

    const term = searchTerm.toLowerCase();
    return historyData.history.filter(
      (item) =>
        item.employeeName?.toLowerCase().includes(term) ||
        item.employeeCode?.toLowerCase().includes(term) ||
        item.oldManagerName?.toLowerCase().includes(term) ||
        item.newManagerName?.toLowerCase().includes(term) ||
        item.departmentName?.toLowerCase().includes(term)
    );
  }, [historyData, searchTerm]);

  const handleClearFilters = () => {
    setFilters({
      employeeId: undefined,
      departmentId: undefined,
      startDate: "",
      endDate: "",
      changeType: undefined,
    });
    setSearchTerm("");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Mudanças de Gestor</h1>
          <p className="text-muted-foreground mt-2">
            Rastreamento completo de alterações na hierarquia organizacional
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <CardDescription>
              Refine sua busca no histórico de mudanças
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, código, gestor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Select
                  value={filters.departmentId?.toString() || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      departmentId: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os departamentos</SelectItem>
                    {departments?.departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="changeType">Tipo de Mudança</Label>
                <Select
                  value={filters.changeType || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      changeType: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger id="changeType">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(changeTypeLabels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Período</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>
              Histórico de Mudanças
              {filteredHistory.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {filteredHistory.length} registro(s)
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Todas as alterações hierárquicas registradas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Calendar className="h-16 w-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma mudança encontrada</p>
                <p className="text-sm mt-2">
                  Tente ajustar os filtros ou realizar uma nova busca
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Mudança</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Alterado por</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {item.effectiveDate
                            ? format(new Date(item.effectiveDate), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{item.employeeName}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.employeeCode}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              {item.oldManagerName || "Sem gestor"}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {item.newManagerName || "Sem gestor"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              changeTypeLabels[
                                item.changeType as keyof typeof changeTypeLabels
                              ]?.variant || "outline"
                            }
                          >
                            {changeTypeLabels[
                              item.changeType as keyof typeof changeTypeLabels
                            ]?.label || item.changeType}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.departmentName || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.changedByName}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.changedByRole}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm text-muted-foreground truncate">
                            {item.reason || "-"}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
