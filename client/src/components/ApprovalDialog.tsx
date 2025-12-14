import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'approve' | 'reject';
  title: string;
  description: string;
  onConfirm: (comments?: string) => void;
  isLoading?: boolean;
}

export default function ApprovalDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  onConfirm,
  isLoading = false,
}: ApprovalDialogProps) {
  const [comments, setComments] = useState('');

  const handleConfirm = () => {
    onConfirm(comments || undefined);
    setComments('');
  };

  const handleCancel = () => {
    setComments('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'approve' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comments">
              {type === 'reject' ? 'Motivo da Rejeição *' : 'Comentários (opcional)'}
            </Label>
            <Textarea
              id="comments"
              placeholder={
                type === 'reject'
                  ? 'Descreva o motivo da rejeição...'
                  : 'Adicione comentários sobre a aprovação...'
              }
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || (type === 'reject' && !comments.trim())}
            variant={type === 'approve' ? 'default' : 'destructive'}
          >
            {isLoading ? 'Processando...' : type === 'approve' ? 'Aprovar' : 'Rejeitar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
