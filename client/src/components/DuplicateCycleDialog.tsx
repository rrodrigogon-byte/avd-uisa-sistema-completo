import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { useLocation } from "wouter";

interface DuplicateCycleDialogProps {
  cycle: {
    id: number;
    name: string;
    year: number;
    type: "anual" | "semestral" | "trimestral";
    description?: string | null;
  };
  trigger?: React.ReactNode;
}

export function DuplicateCycleDialog({ cycle, trigger }: DuplicateCycleDialogProps) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    name: `${cycle.name} (Cópia)`,
    year: new Date().getFullYear(),
    type: cycle.type,
    startDate: "",
    endDate: "",
    description: cycle.description || "",
  });

  const duplicateMutation = trpc.cycles.duplicateCycle.useMutation({
    onSuccess: (data) => {
      toast.success("Ciclo duplicado com sucesso!");
      utils.cycles.list.invalidate();
      setOpen(false);
      // Navegar para o novo ciclo
      navigate(`/ciclos-avaliacao/${data.newCycleId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao duplicar ciclo: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      toast.error("Por favor, preencha as datas de início e fim");
      return;
    }

    duplicateMutation.mutate({
      sourceCycleId: cycle.id,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Duplicar Ciclo de Avaliação</DialogTitle>
            <DialogDescription>
              Crie um novo ciclo baseado nas configurações de "{cycle.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Novo Ciclo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Avaliação 2025"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Ano *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min={2020}
                  max={2050}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Data de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do ciclo (opcional)"
                rows={3}
              />
            </div>

            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">O que será copiado:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Tipo e estrutura do ciclo</li>
                <li>Prazos de avaliação (proporcionais)</li>
                <li>Descrição (editável acima)</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                <strong>Nota:</strong> Participantes e avaliações não serão copiados.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={duplicateMutation.isPending}>
              {duplicateMutation.isPending ? "Duplicando..." : "Criar Ciclo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
