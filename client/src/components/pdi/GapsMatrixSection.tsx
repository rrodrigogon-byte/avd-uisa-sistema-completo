import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface GapsMatrixSectionProps {
  pdiId: number | null;
  gaps: any[];
}

export default function GapsMatrixSection({ pdiId, gaps }: GapsMatrixSectionProps) {
  const [showAddGap, setShowAddGap] = useState(false);
  const [gapForm, setGapForm] = useState({
    competencyId: 0,
    currentLevel: 1,
    targetLevel: 5,
    priority: "media" as "alta" | "media" | "baixa",
  });

  const utils = trpc.useUtils();
  const { data: competencies } = trpc.competencies.list.useQuery({});

  const addGapMutation = trpc.pdiIntelligent.addGap.useMutation({
    onSuccess: () => {
      toast.success("Gap adicionado com sucesso!");
      utils.pdiIntelligent.getById.invalidate({ id: pdiId! });
      setShowAddGap(false);
      setGapForm({
        competencyId: 0,
        currentLevel: 1,
        targetLevel: 5,
        priority: "media",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar gap: ${error.message}`);
    },
  });

  const handleAddGap = () => {
    if (!pdiId || !gapForm.competencyId) {
      toast.error("Selecione uma competência");
      return;
    }
    
    const gap = gapForm.targetLevel - gapForm.currentLevel;
    if (gap <= 0) {
      toast.error("O nível alvo deve ser maior que o nível atual");
      return;
    }

    addGapMutation.mutate({
      planId: pdiId,
      competencyId: gapForm.competencyId,
      currentLevel: gapForm.currentLevel,
      targetLevel: gapForm.targetLevel,
      priority: gapForm.priority,
    });
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      alta: { label: "Alta", variant: "destructive" },
      media: { label: "Média", variant: "default" },
      baixa: { label: "Baixa", variant: "secondary" },
    };
    const config = variants[priority] || variants.media;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      identificado: { label: "Identificado", variant: "secondary" },
      em_desenvolvimento: { label: "Em Desenvolvimento", variant: "default" },
      superado: { label: "Superado", variant: "outline" },
    };
    const config = variants[status] || variants.identificado;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showAddGap} onOpenChange={setShowAddGap}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Gap
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Gap de Competência</DialogTitle>
              <DialogDescription>
                Identifique uma nova competência a ser desenvolvida
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="competencyId">Competência</Label>
                <Select
                  value={gapForm.competencyId.toString()}
                  onValueChange={(value) => setGapForm({ ...gapForm, competencyId: parseInt(value) })}
                >
                  <SelectTrigger id="competencyId">
                    <SelectValue placeholder="Selecione a competência" />
                  </SelectTrigger>
                  <SelectContent>
                    {competencies?.map((comp) => (
                      <SelectItem key={comp.id} value={comp.id.toString()}>
                        {comp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="currentLevel">Nível Atual (1-5)</Label>
                  <Select
                    value={gapForm.currentLevel.toString()}
                    onValueChange={(value) => setGapForm({ ...gapForm, currentLevel: parseInt(value) })}
                  >
                    <SelectTrigger id="currentLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetLevel">Nível Alvo (1-5)</Label>
                  <Select
                    value={gapForm.targetLevel.toString()}
                    onValueChange={(value) => setGapForm({ ...gapForm, targetLevel: parseInt(value) })}
                  >
                    <SelectTrigger id="targetLevel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((level) => (
                        <SelectItem key={level} value={level.toString()}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={gapForm.priority}
                  onValueChange={(value: "alta" | "media" | "baixa") => setGapForm({ ...gapForm, priority: value })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddGap(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddGap} disabled={addGapMutation.isPending}>
                {addGapMutation.isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {gaps && gaps.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competência</TableHead>
              <TableHead className="text-center">Nível Atual</TableHead>
              <TableHead className="text-center">Nível Alvo</TableHead>
              <TableHead className="text-center">Gap</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gaps.map((gap: any) => (
              <TableRow key={gap.id}>
                <TableCell className="font-medium">{gap.competencyName || `Competência #${gap.competencyId}`}</TableCell>
                <TableCell className="text-center">{gap.currentLevel}</TableCell>
                <TableCell className="text-center">{gap.targetLevel}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline">{gap.gap}</Badge>
                </TableCell>
                <TableCell>{getPriorityBadge(gap.priority)}</TableCell>
                <TableCell>{getStatusBadge(gap.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum gap identificado. Clique em "Adicionar Gap" para começar.
        </div>
      )}
    </div>
  );
}
