import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DraftRecoveryDialogProps {
  open: boolean;
  onRestore: () => void;
  onDiscard: () => void;
  lastSaved: Date | null;
}

export function DraftRecoveryDialog({ open, onRestore, onDiscard, lastSaved }: DraftRecoveryDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rascunho Encontrado</AlertDialogTitle>
          <AlertDialogDescription>
            Encontramos um rascunho salvo anteriormente.
            {lastSaved && (
              <span className="block mt-2 text-sm font-medium">
                Salvo {formatDistanceToNow(lastSaved, { addSuffix: true, locale: ptBR })}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDiscard}>
            Descartar Rascunho
          </AlertDialogCancel>
          <AlertDialogAction onClick={onRestore}>
            Restaurar Rascunho
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
