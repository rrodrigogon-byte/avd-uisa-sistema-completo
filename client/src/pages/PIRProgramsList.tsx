import { useState } from 'react';
import { useNavigate } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Users, Calendar, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function PIRProgramsList() {
  const [, navigate] = useNavigate();
  const [search, setSearch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const { data: programs, isLoading } = trpc.pirPrograms.list.useQuery({
    search: search || undefined,
    active: showActiveOnly ? true : undefined,
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Programas PIR</h1>
          <p className="text-muted-foreground">
            Gerenciamento de Programas de Integridade Respiratória
          </p>
        </div>
        <Button onClick={() => navigate('/pir/programs/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Programa
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome do programa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              variant={showActiveOnly ? 'default' : 'outline'}
              onClick={() => setShowActiveOnly(!showActiveOnly)}
            >
              {showActiveOnly ? 'Apenas Ativos' : 'Todos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Programas */}
      <Card>
        <CardHeader>
          <CardTitle>Programas Cadastrados</CardTitle>
          <CardDescription>
            {programs?.length || 0} programa(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : programs && programs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Programa</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Data Término</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>Frequência de Testes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">
                      {program.name}
                    </TableCell>
                    <TableCell>{formatDate(program.startDate)}</TableCell>
                    <TableCell>{formatDate(program.endDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{program.participantCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{program.testFrequencyMonths} meses</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={program.active ? 'default' : 'secondary'}>
                        {program.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pir/programs/${program.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/pir/programs/${program.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum programa encontrado.
              </p>
              <Button
                className="mt-4"
                onClick={() => navigate('/pir/programs/new')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Programa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
