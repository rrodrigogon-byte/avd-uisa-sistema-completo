import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Componente de Tabela de Logs de Auditoria com Paginação e Ordenação
 */
export function AuditLogsTable() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState<'createdAt' | 'activityType' | 'userId'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterAction, setFilterAction] = useState<string | undefined>(undefined);
  const [filterEntityType, setFilterEntityType] = useState<string | undefined>(undefined);

  const { data, isLoading } = trpc.audit.list.useQuery({
    page,
    limit,
    sortBy,
    sortOrder,
    action: filterAction,
    entityType: filterEntityType,
  });

  const handleSort = (column: 'createdAt' | 'activityType' | 'userId') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const logs = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Ação:</label>
          <Input
            type="text"
            placeholder="Filtrar por ação..."
            value={filterAction || ''}
            onChange={(e) => setFilterAction(e.target.value || undefined)}
            className="w-[200px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Tipo de Entidade:</label>
          <Input
            type="text"
            placeholder="Filtrar por entidade..."
            value={filterEntityType || ''}
            onChange={(e) => setFilterEntityType(e.target.value || undefined)}
            className="w-[200px]"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm font-medium">Por página:</label>
          <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('userId')}
                  className="flex items-center gap-1"
                >
                  Usuário
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('activityType')}
                  className="flex items-center gap-1"
                >
                  Ação
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Tipo de Entidade</TableHead>
              <TableHead>ID da Entidade</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-1"
                >
                  Data/Hora
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum log de auditoria encontrado
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    Usuário #{log.userId}
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-sm">
                      {log.activityType}
                    </code>
                  </TableCell>
                  <TableCell>{log.entityType || '-'}</TableCell>
                  <TableCell>{log.entityId || '-'}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.activityDescription || '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} logs
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
