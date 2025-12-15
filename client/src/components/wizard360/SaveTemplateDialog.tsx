import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  weights: {
    selfWeight: number;
    peerWeight: number;
    subordinateWeight: number;
    managerWeight: number;
  };
  competencyIds: number[];
}

export function SaveTemplateDialog({ open, onClose, weights, competencyIds }: SaveTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const createTemplateMutation = trpc.cycles360Templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template salvo com sucesso!");
      setName("");
      setDescription("");
      setIsPublic(false);
      onClose();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar template: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Nome do template é obrigatório");
      return;
    }

    if (competencyIds.length === 0) {
      toast.error("Selecione pelo menos uma competência");
      return;
    }

    createTemplateMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      selfWeight: weights.selfWeight,
      peerWeight: weights.peerWeight,
      subordinateWeight: weights.subordinateWeight,
      managerWeight: weights.managerWeight,
      competencyIds,
      isPublic,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar como Template</DialogTitle>
          <DialogDescription>
            Salve esta configuração de pesos e competências para reutilizar em futuros ciclos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nome do Template *</Label>
            <Input
              id="template-name"
              placeholder="Ex: Avaliação Padrão 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Descrição (opcional)</Label>
            <Textarea
              id="template-description"
              placeholder="Descreva quando este template deve ser usado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="template-public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            <Label
              htmlFor="template-public"
              className="text-sm font-normal cursor-pointer"
            >
              Tornar este template público (outros usuários poderão usá-lo)
            </Label>
          </div>

          {/* Preview dos pesos */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <p className="text-sm font-medium mb-2">Configuração a ser salva:</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Autoavaliação: <span className="font-semibold">{weights.selfWeight}%</span></div>
              <div>Gestor: <span className="font-semibold">{weights.managerWeight}%</span></div>
              <div>Pares: <span className="font-semibold">{weights.peerWeight}%</span></div>
              <div>Subordinados: <span className="font-semibold">{weights.subordinateWeight}%</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {competencyIds.length} competência(s) selecionada(s)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createTemplateMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={createTemplateMutation.isPending}>
            {createTemplateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar Template'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
