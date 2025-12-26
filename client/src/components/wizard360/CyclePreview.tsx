import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CycleData } from "./CycleDataForm";
import { WeightsData } from "./WeightsConfiguration";
import { CompetenciesData } from "./CompetenciesSelector";
import { ParticipantsData } from "./ParticipantsManager";
import { trpc } from "@/lib/trpc";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

interface CyclePreviewProps {
  cycleData: CycleData;
  weightsData: WeightsData;
  competenciesData: CompetenciesData;
  participantsData: ParticipantsData;
  onEditStep: (step: 1 | 2 | 3 | 4) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function CyclePreview({
  cycleData,
  weightsData,
  competenciesData,
  participantsData,
  onEditStep,
  onBack,
  onSubmit,
  isSubmitting
}: CyclePreviewProps) {
  const { data: competencies } = trpc.competencies.list.useQuery({});
  const { employees } = useEmployeeSearch("");

  const selectedCompetenciesDetails = competencies?.filter(c => 
    competenciesData.selectedCompetencies.includes(c.id)
  ) || [];

  const participantsWithNames = participantsData.participants.map((p: { employeeId: number; role: string }) => {
    const employee = employees?.find((e: { id: number; name: string }) => e.id === p.employeeId);
    return {
      ...p,
      name: employee?.name || `Funcionário #${p.employeeId}`
    };
  });

  const roleLabels: Record<string, string> = {
    'self': 'Autoavaliação',
    'peer': 'Par',
    'subordinate': 'Subordinado',
    'manager': 'Gestor'
  };

  return (
    <div className="space-y-6">
      {/* Dados do Ciclo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dados do Ciclo</CardTitle>
            <CardDescription>Informações básicas do ciclo de avaliação</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(1)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nome do Ciclo</p>
            <p className="text-base font-semibold">{cycleData.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Descrição</p>
            <p className="text-base">{cycleData.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Início</p>
              <p className="text-base font-semibold">
                {cycleData.startDate ? format(cycleData.startDate, "dd/MM/yyyy", { locale: ptBR }) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data de Término</p>
              <p className="text-base font-semibold">
                {cycleData.endDate ? format(cycleData.endDate, "dd/MM/yyyy", { locale: ptBR }) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prazo de Avaliação</p>
              <p className="text-base font-semibold">
                {cycleData.evaluationDeadline ? format(cycleData.evaluationDeadline, "dd/MM/yyyy", { locale: ptBR }) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pesos Configurados */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pesos das Avaliações</CardTitle>
            <CardDescription>Distribuição dos pesos entre os avaliadores</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(2)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Avaliação</TableHead>
                <TableHead className="text-right">Peso (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Autoavaliação</TableCell>
                <TableCell className="text-right font-semibold">{weightsData.selfWeight}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Avaliação do Gestor</TableCell>
                <TableCell className="text-right font-semibold">{weightsData.managerWeight}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Avaliação de Pares</TableCell>
                <TableCell className="text-right font-semibold">{weightsData.peerWeight}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Avaliação de Subordinados</TableCell>
                <TableCell className="text-right font-semibold">{weightsData.subordinateWeight}%</TableCell>
              </TableRow>
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="text-right font-bold">
                  {weightsData.selfWeight + weightsData.managerWeight + weightsData.peerWeight + weightsData.subordinateWeight}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Competências Selecionadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Competências Selecionadas</CardTitle>
            <CardDescription>
              {selectedCompetenciesDetails.length} competência(s) selecionada(s)
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(3)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          {selectedCompetenciesDetails.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma competência selecionada</p>
          ) : (
            <div className="space-y-3">
              {selectedCompetenciesDetails.map((comp) => (
                <div key={comp.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{comp.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{comp.description}</p>
                    </div>
                    <Badge variant="secondary">ID: {comp.id}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participantes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Participantes</CardTitle>
            <CardDescription>
              {participantsWithNames.length} participante(s) adicionado(s)
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStep(4)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </CardHeader>
        <CardContent>
          {participantsWithNames.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum participante adicionado</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Papel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participantsWithNames.map((participant, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{participant.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {roleLabels[participant.role] || participant.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Botões de Ação */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gap-2"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Confirmar e Criar Ciclo
        </Button>
      </div>
    </div>
  );
}
