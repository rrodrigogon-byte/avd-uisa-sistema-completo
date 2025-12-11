import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditImportedActionDialogProps {
  actionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function EditImportedActionDialog({
  actionId,
  open,
  onOpenChange,
  onSuccess,
}: EditImportedActionDialogProps) {
  const [formData, setFormData] = useState({
    description: '',
    developmentArea: '',
    responsible: '',
    dueDate: '',
    successMetric: '',
    status: 'nao_iniciado' as 'nao_iniciado' | 'em_andamento' | 'concluido',
  });
  const [editReason, setEditReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar dados da ação
  const { data: actionData, isLoading } = trpc.pdi.getActionById.useQuery(
    { actionId: actionId! },
    { enabled: !!actionId && open }
  );

  // Mutation para atualizar ação
  const updateMutation = trpc.pdi.updateImportedAction.useMutation({
    onSuccess: () => {
      toast.success('Ação atualizada com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar ação');
    },
  });

  // Carregar dados quando dialog abre
  useEffect(() => {
    if (actionData && open) {
      setFormData({
        description: actionData.description || '',
        developmentArea: actionData.developmentArea || '',
        responsible: actionData.responsible || '',
        dueDate: actionData.dueDate ? new Date(actionData.dueDate).toISOString().split('T')[0] : '',
        successMetric: actionData.successMetric || '',
        status: actionData.status || 'nao_iniciado',
      });
      setEditReason('');
      setErrors({});
    }
  }, [actionData, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }
    if (!formData.developmentArea.trim()) {
      newErrors.developmentArea = 'Área de desenvolvimento é obrigatória';
    }
    if (!formData.responsible.trim()) {
      newErrors.responsible = 'Responsável é obrigatório';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Data de conclusão é obrigatória';
    }
    if (!formData.successMetric.trim()) {
      newErrors.successMetric = 'Métrica de sucesso é obrigatória';
    }
    if (!editReason.trim()) {
      newErrors.editReason = 'Motivo da edição é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !actionId) return;

    updateMutation.mutate({
      actionId,
      updates: {
        description: formData.description,
        developmentArea: formData.developmentArea,
        responsible: formData.responsible,
        dueDate: formData.dueDate,
        successMetric: formData.successMetric,
        status: formData.status,
      },
      editReason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ação de PDI Importado</DialogTitle>
          <DialogDescription>
            Ajuste os dados da ação conforme necessário. Todos os campos são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição da Ação <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setErrors({ ...errors, description: '' });
                }}
                placeholder="Descreva a ação de desenvolvimento"
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Área de Desenvolvimento */}
            <div className="space-y-2">
              <Label htmlFor="developmentArea">
                Área de Desenvolvimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="developmentArea"
                value={formData.developmentArea}
                onChange={(e) => {
                  setFormData({ ...formData, developmentArea: e.target.value });
                  setErrors({ ...errors, developmentArea: '' });
                }}
                placeholder="Ex: Liderança, Comunicação, Técnica"
                className={errors.developmentArea ? 'border-red-500' : ''}
              />
              {errors.developmentArea && (
                <p className="text-sm text-red-500">{errors.developmentArea}</p>
              )}
            </div>

            {/* Responsável */}
            <div className="space-y-2">
              <Label htmlFor="responsible">
                Responsável <span className="text-red-500">*</span>
              </Label>
              <Input
                id="responsible"
                value={formData.responsible}
                onChange={(e) => {
                  setFormData({ ...formData, responsible: e.target.value });
                  setErrors({ ...errors, responsible: '' });
                }}
                placeholder="Nome do responsável pela ação"
                className={errors.responsible ? 'border-red-500' : ''}
              />
              {errors.responsible && (
                <p className="text-sm text-red-500">{errors.responsible}</p>
              )}
            </div>

            {/* Data de Conclusão */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Data de Conclusão <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData({ ...formData, dueDate: e.target.value });
                  setErrors({ ...errors, dueDate: '' });
                }}
                className={errors.dueDate ? 'border-red-500' : ''}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate}</p>
              )}
            </div>

            {/* Métrica de Sucesso */}
            <div className="space-y-2">
              <Label htmlFor="successMetric">
                Métrica de Sucesso <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="successMetric"
                value={formData.successMetric}
                onChange={(e) => {
                  setFormData({ ...formData, successMetric: e.target.value });
                  setErrors({ ...errors, successMetric: '' });
                }}
                placeholder="Como será medido o sucesso desta ação?"
                rows={2}
                className={errors.successMetric ? 'border-red-500' : ''}
              />
              {errors.successMetric && (
                <p className="text-sm text-red-500">{errors.successMetric}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Motivo da Edição */}
            <div className="space-y-2">
              <Label htmlFor="editReason">
                Motivo da Edição <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="editReason"
                value={editReason}
                onChange={(e) => {
                  setEditReason(e.target.value);
                  setErrors({ ...errors, editReason: '' });
                }}
                placeholder="Explique o motivo desta edição"
                rows={2}
                className={errors.editReason ? 'border-red-500' : ''}
              />
              {errors.editReason && (
                <p className="text-sm text-red-500">{errors.editReason}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || isLoading}
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
