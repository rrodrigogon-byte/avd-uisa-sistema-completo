/**
 * Dashboard de Emails Admin/RH
 * Permite visualizar, filtrar e analisar todos os emails enviados para administradores e RH
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function AdminRhEmailDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [success, setSuccess] = useState<"all" | "true" | "false">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Buscar emails
  const { data: emailsData, isLoading: loadingEmails, refetch: refetchEmails } = trpc.adminRhEmailDashboard.list.useQuery({
    page,
    limit: 20,
    success,
    search,
    dateFrom,
    dateTo,
  });

  // Buscar estatísticas
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = trpc.adminRhEmailDashboard.stats.useQuery();

  // Buscar dados do gráfico
  const { data: chartData, isLoading: loadingChart } = trpc.adminRhEmailDashboard.chartData.useQuery();

  const handleRefresh = () => {
    refetchEmails();
    refetchStats();
    toast.success("Dashboard atualizado!");
  };

  const handleClearFilters = () => {
    setSearch("");
    setSuccess("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Emails Admin/RH</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os emails enviados para administradores e RH
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.recentEmails || 0} nos últimos 7 dias
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{stats?.sent || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.successRate || 0}% de taxa de sucesso
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Falhados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.total ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}% do total
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">{stats?.successRate || 0}%</div>
                <p className="text-xs text-muted-foreground">Média geral</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Emails por Dia (Últimos 30 Dias)
          </CardTitle>
          <CardDescription>Visualize o volume de emails enviados ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingChart ? (
            <Skeleton className="h-[300px] w-full" />
          ) : chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#10b981" name="Enviados" strokeWidth={2} />
                <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Falhados" strokeWidth={2} />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os emails por status, data e busca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Assunto ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={success} onValueChange={(value: any) => setSuccess(value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Enviados</SelectItem>
                  <SelectItem value="false">Falhados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data Início</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Data Fim</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleClearFilters} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Emails Enviados</CardTitle>
          <CardDescription>
            {emailsData?.pagination.total || 0} emails encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEmails ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : emailsData && emailsData.emails.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Destinatário</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Erro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailsData.emails.map((email) => (
                    <TableRow key={email.id}>
                      <TableCell>
                        {email.success ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Falhou
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{email.recipient}</TableCell>
                      <TableCell>{email.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(email.sentAt).toLocaleString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {email.error ? (
                          <span className="text-xs text-red-600">{email.error}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {emailsData.pagination.page} de {emailsData.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= emailsData.pagination.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum email encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros para ver mais resultados
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emails por Tipo */}
      {stats && stats.emailsByType && stats.emailsByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emails por Tipo</CardTitle>
            <CardDescription>Top 10 tipos de emails mais enviados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.emailsByType.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{item.type}</span>
                  <Badge variant="secondary">{item.count} emails</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
