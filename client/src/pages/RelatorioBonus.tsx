import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { DollarSign, Download, TrendingUp, Users, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";

export default function RelatorioBonus() {
  const [filterStatus, setFilterStatus] = useState<string>("pago");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar dados de bônus
  const { data: calculations, isLoading } = trpc.bonus.listCalculations.useQuery({
    status: filterStatus as any,
  });

  // Buscar estatísticas
  const { data: stats } = trpc.bonus.getStats.useQuery();

  // Filtrar por termo de busca
  const filteredCalculations = calculations?.filter((calc: any) => {
    const matchesSearch = searchTerm === "" || 
      calc.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = filterMonth === "" || 
      calc.referenceMonth === filterMonth;
    return matchesSearch && matchesMonth;
  });

  const handleExportToExcel = () => {
    // Implementar exportação para Excel
    toast.info("Exportação para Excel em desenvolvimento");
  };

  const totalPaid = filteredCalculations?.reduce(
    (sum: number, calc: any) => sum + Number(calc.bonusAmount || 0),
    0
  ) || 0;

  const avgBonus = filteredCalculations && filteredCalculations.length > 0
    ? totalPaid / filteredCalculations.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-green-600" />
            Relatório de Bônus
          </h1>
          <p className="text-gray-500 mt-1">
            Histórico completo de bônus calculados, aprovados e pagos
          </p>
        </div>
        <Button onClick={handleExportToExcel} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar para Excel
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Média por Colaborador</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {avgBonus.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Colaboradores Beneficiados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredCalculations?.length || 0}
                </p>
              </div>
              <Users className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Políticas Ativas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats?.activePolicies || 0}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calculado">Calculado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mês de Referência</label>
              <Input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                placeholder="Selecione o mês"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar Colaborador</label>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do colaborador..."
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterStatus("pago");
                  setFilterMonth("");
                  setSearchTerm("");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Bônus */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Bônus</CardTitle>
          <CardDescription>
            {filteredCalculations?.length || 0} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCalculations && filteredCalculations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Política</TableHead>
                    <TableHead className="text-right">Salário Base</TableHead>
                    <TableHead className="text-center">Multiplicador</TableHead>
                    <TableHead className="text-right">Valor do Bônus</TableHead>
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Calculado em</TableHead>
                    <TableHead>Aprovado em</TableHead>
                    <TableHead>Pago em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculations.map((calc: any) => (
                    <TableRow key={calc.id}>
                      <TableCell className="font-medium">
                        {calc.employeeName || `Funcionário #${calc.employeeId}`}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.policyName || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {Number(calc.baseSalary || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {Number(calc.appliedMultiplier || 0).toFixed(1)}x
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        R$ {Number(calc.bonusAmount || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{calc.referenceMonth || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            calc.status === "pago"
                              ? "outline"
                              : calc.status === "aprovado"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {calc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.calculatedAt
                          ? new Date(calc.calculatedAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.approvedAt
                          ? new Date(calc.approvedAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {calc.paidAt
                          ? new Date(calc.paidAt).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12">
              <DollarSign className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                Não há bônus com os filtros selecionados. Tente ajustar os critérios de busca.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
