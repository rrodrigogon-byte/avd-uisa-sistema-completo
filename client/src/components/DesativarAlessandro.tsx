import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2, UserX } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function DesativarAlessandro() {
  const [reason, setReason] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [deactivatedCount, setDeactivatedCount] = useState(0);

  const deactivateMutation = trpc.orgChart.deactivateEmployeeAndSubordinates.useMutation({
    onSuccess: (data) => {
      setDeactivatedCount(data.deactivatedCount);
      setShowSuccess(true);
      toast.success(data.message);
      setReason("");
    },
    onError: (error) => {
      toast.error(`Erro ao desativar funcionários: ${error.message}`);
    },
  });

  const handleDeactivate = () => {
    // ID de Alessandro obtido do banco de dados
    // Você precisará substituir este ID pelo ID correto após a query
    const alessandroId = 0; // SUBSTITUIR PELO ID CORRETO
    
    deactivateMutation.mutate({
      employeeId: alessandroId,
      reason: reason || "Desativação solicitada pelo administrador",
    });
  };

  if (showSuccess) {
    return (
      <Card className="border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-6 w-6" />
            Desativação Concluída com Sucesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <AlertDescription className="text-green-700">
              <strong>{deactivatedCount} funcionário(s)</strong> foram desativados com sucesso.
              <br />
              Alessandro e todos os seus subordinados foram removidos do organograma ativo.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={() => {
              setShowSuccess(false);
              window.location.reload();
            }}
            className="w-full"
          >
            Atualizar Organograma
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <UserX className="h-6 w-6" />
          Desativar Alessandro e Subordinados
        </CardTitle>
        <CardDescription>
          Esta ação irá desativar Alessandro Marcello Carl Von Arco Gardemann e todos os seus 28 subordinados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Esta ação irá desativar 29 funcionários no total (Alessandro + 28 subordinados).
            Os funcionários não serão deletados permanentemente, apenas marcados como inativos.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="reason">Motivo da Desativação (Opcional)</Label>
          <Textarea
            id="reason"
            placeholder="Ex: Reestruturação organizacional, encerramento de departamento, etc."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Desativar Alessandro e Subordinados
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Desativação em Cascata</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Você está prestes a desativar <strong>Alessandro Marcello Carl Von Arco Gardemann</strong> e
                  todos os seus <strong>28 subordinados</strong>.
                </p>
                <p className="text-red-600 font-semibold">
                  Total: 29 funcionários serão desativados
                </p>
                <p>
                  Esta ação pode ser revertida posteriormente reativando os funcionários no banco de dados.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivate}
                className="bg-red-600 hover:bg-red-700"
              >
                Confirmar Desativação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <p className="text-xs text-muted-foreground text-center">
          Os funcionários serão marcados como inativos e não aparecerão mais no organograma.
          O histórico será mantido no banco de dados.
        </p>
      </CardContent>
    </Card>
  );
}
