import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
import { Download, Shield, Clock, User } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";

export default function HistoricoSenhas() {
  const [filters, setFilters] = useState({
    employeeId: undefined as number | undefined,
    startDate: "",
    endDate: "",
  });

  // Queries
  const { data: history, isLoading } = trpc.employees.getPasswordHistory.useQuery(filters);
  const { data: leaders } = trpc.employees.getLeaders.useQuery(undefined);

  // Função de exportação
  const handleExport = () => {
    if (!history) return;

    const rows = [
      ["Histórico de Alterações de Senha"],
      [""],
      ["Data/Hora", "Líder", "Email", "Alterado Por", "Motivo"],
      ...history.map((h: any) => [
        new Date(h.createdAt).toLocaleString("pt-BR"),
        h.employeeName,
        h.employeeEmail,
        h.changedByName,
        h.reason || "Não informado",
      ]),
    ];

    const csv = rows.map((row: any) => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-senhas-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-8 h-8 text-[#F39200]" />
                Histórico de Alterações de Senha
              </h1>
              <p className="text-gray-600">Auditoria de mudanças de senha de líderes</p>
            </div>
          </div>
          <Button onClick={handleExport} variant="outline" disabled={!history || history.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Líder</Label>
                <Select
                  value={filters.employeeId?.toString() || "all"}
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      employeeId: value === "all" ? undefined : parseInt(value),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {leaders?.map((leader: any) => (
                      <SelectItem key={leader.id} value={leader.id.toString()}>
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {history && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Alterações
                </CardTitle>
                <Shield className="w-4 h-4 text-[#F39200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{history.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Líderes Afetados
                </CardTitle>
                <User className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(history.map((h: any) => h.employeeId)).size}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Última Alteração
                </CardTitle>
                <Clock className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-semibold">
                  {history.length > 0
                    ? new Date(history[0].createdAt).toLocaleDateString("pt-BR")
                    : "N/A"}
                </div>
                <p className="text-xs text-gray-500">
                  {history.length > 0
                    ? new Date(history[0].createdAt).toLocaleTimeString("pt-BR")
                    : ""}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabela de Histórico */}
        <Card>
          <CardHeader>
            <CardTitle>Registro de Alterações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200] mx-auto"></div>
                <p className="mt-4 text-gray-600">Carregando histórico...</p>
              </div>
            ) : history && history.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Líder</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alterado Por</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {new Date(record.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(record.createdAt).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{record.employeeName}</TableCell>
                      <TableCell>{record.employeeEmail}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {record.changedByName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {record.reason || "Não informado"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500">
                          {record.ipAddress || "N/A"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum registro de alteração de senha encontrado</p>
                <p className="text-sm text-gray-500 mt-2">
                  As alterações de senha serão registradas automaticamente
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
