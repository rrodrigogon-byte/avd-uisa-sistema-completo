import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

/**
 * Confirm Dialog Component
 * Dialog de confirmação para ações destrutivas com variantes visuais
 */

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const icons = {
    default: <Info className="h-6 w-6 text-blue-500" />,
    destructive: <XCircle className="h-6 w-6 text-red-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    info: <CheckCircle2 className="h-6 w-6 text-green-500" />,
  };

  const buttonVariants = {
    default: undefined,
    destructive: 'destructive' as const,
    warning: 'default' as const,
    info: 'default' as const,
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {icons[variant]}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            variant={buttonVariants[variant]}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Processando...
              </div>
            ) : (
              confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook para usar o ConfirmDialog
 */
import { useState } from "react";

interface UseConfirmDialogReturn {
  ConfirmDialog: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>>;
  confirm: () => Promise<boolean>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
    setIsOpen(false);
  };

  const ConfirmDialogComponent: React.FC<Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>> = (props) => (
    <ConfirmDialog
      {...props}
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      onConfirm={async () => {
        await props.onConfirm();
        handleConfirm();
      }}
    />
  );

  return {
    ConfirmDialog: ConfirmDialogComponent,
    confirm,
    isOpen,
    setIsOpen,
  };
}
