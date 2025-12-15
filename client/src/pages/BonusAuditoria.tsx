import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileSearch, Download, Filter, Clock, User, FileText } from "lucide-react";
import { toast } from "sonner";
import ExcelJS from "exceljs";

export default function BonusAuditoria() {
  const [filterEntityType, setFilterEntityType] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  // Query
  const { data: auditLogs, isLoading } = trpc.bonus.getAuditLogs.useQuery({
    entityType: filterEntityType === "all" ? undefined : (filterEntityType as any),
    action: filterAction === "all" ? undefined : (filterAction as any),
    limit: 200,
  });

  const { data: metrics } = trpc.bonus.getApprovalMetrics.useQuery();

  const handleExportToExcel = async () => {
    try {
      if (!auditLogs || auditLogs.length === 0) {
        toast.error("Nenhum dado para exportar");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Histórico de Auditoria");

      // Cabeçalhos
      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Data/Hora", key: "createdAt", width: 20 },
        { header: "Tipo", key: "entityType", width: 15 },
        { header: "ID Entidade", key: "entityId", width: 12 },
        { header: "Ação", key: "action", width: 15 },
        { header: "Usuário", key: "userName", width: 25 },
        { header: "Campo", key: "fieldName", width: 20 },
        { header: "Valor Anterior", key: "oldValue", width: 20 },
        { header: "Valor Novo", key: "newValue", width: 20 },
        { header: "Comentário", key: "comment", width: 40 },
      ];

      // Estilizar cabeçalho
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };

      // Adicionar dados
      auditLogs.forEach((log: any) => {
        worksheet.addRow({
          id: log.id,
          createdAt: new Date(log.createdAt).toLocaleString("pt-BR"),
          entityType: log.entityType === "policy" ? "Política" : "Cálculo",
          entityId: log.entityId,
          action: getActionLabel(log.action),
          userName: log.userName || "Sistema",
          fieldName: log.fieldName || "-",
          oldValue: log.oldValue || "-",
          newValue: log.newValue || "-",
          comment: log.comment || "-",
        });
      });

      // Adicionar bordas
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Gerar arquivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `auditoria-bonus-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success("Histórico exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar histórico");
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: "Criado",
      updated: "Atualizado",
      deleted: "Excluído",
      approved: "Aprovado",
      rejected: "Rejeitado",
      paid: "Pago",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      created: "bg-blue-100 text-blue-800",
      updated: "bg-yellow-100 text-yellow-800",
      deleted: "bg-red-100 text-red-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-orange-100 text-orange-800",
      paid: "bg-purple-100 text-purple-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileSearch className="w-8 h-8 text-indigo-600" />
            Histórico de Auditoria
          </h1>
          <p className="text-gray-500 mt-1">
            Rastreamento completo de todas as alterações em políticas e cálculos de bônus
          </p>
        </div>
        <Button onClick={handleExportToExcel} className="gap-2">
          <Download className="w-4 h-4" />
          Exportar para Excel
        </Button>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Aprovações</p>
                  <p className="text-3xl font-bold text-green-600">{metrics.totalApprovals}</p>
                </div>
                <FileText className="w-10 h-10 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Rejeições</p>
                  <p className="text-3xl font-bold text-red-600">{metrics.totalRejections}</p>
                </div>
                <FileText className="w-10 h-10 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Aprovação</p>
                  <p className="text-3xl font-bold text-blue-600">{metrics.approvalRate}%</p>
                </div>
                <FileText className="w-10 h-10 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio (horas)</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {metrics.avgApprovalTimeHours}h
                  </p>
                </div>
                <Clock className="w-10 h-10 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Entidade</label>
              <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="policy">Políticas</SelectItem>
                  <SelectItem value="calculation">Cálculos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ação</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="created">Criado</SelectItem>
                  <SelectItem value="updated">Atualizado</SelectItem>
                  <SelectItem value="deleted">Excluído</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterEntityType("all");
                  setFilterAction("all");
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Auditoria */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
          <CardDescription>
            {auditLogs?.length || 0} registros encontrados (últimos 200)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Comentário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : auditLogs && auditLogs.length > 0 ? (
                  auditLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.createdAt).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.entityType === "policy" ? "Política" : "Cálculo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">#{log.entityId}</TableCell>
                      <TableCell>
                        <Badge className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {log.userName || "Sistema"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.fieldName ? (
                          <div className="space-y-1">
                            <div className="font-medium">{log.fieldName}</div>
                            {log.oldValue && (
                              <div className="text-red-600">
                                Antes: {log.oldValue.substring(0, 30)}
                                {log.oldValue.length > 30 && "..."}
                              </div>
                            )}
                            {log.newValue && (
                              <div className="text-green-600">
                                Depois: {log.newValue.substring(0, 30)}
                                {log.newValue.length > 30 && "..."}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {log.comment || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Nenhum registro de auditoria encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
