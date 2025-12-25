import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Users, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (template: {
    selfWeight: number;
    peerWeight: number;
    subordinateWeight: number;
    managerWeight: number;
    competencyIds: number[];
  }) => void;
}

export function TemplateSelector({ open, onClose, onSelect }: TemplateSelectorProps) {
  const { data: templates, isLoading } = trpc.cycles360Templates.list.useQuery({}, {
    enabled: open,
  });

  const incrementUsageMutation = trpc.cycles360Templates.incrementUsage.useMutation();

  const handleSelectTemplate = (template: NonNullable<typeof templates>[0]) => {
    onSelect({
      selfWeight: template.selfWeight,
      peerWeight: template.peerWeight,
      subordinateWeight: template.subordinateWeight,
      managerWeight: template.managerWeight,
      competencyIds: template.competencyIds,
    });

    incrementUsageMutation.mutate({ id: template.id });
    toast.success(`Template "${template.name}" carregado com sucesso!`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carregar Template de Configuração</DialogTitle>
          <DialogDescription>
            Selecione um template para preencher automaticamente os pesos e competências
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : templates && templates.length > 0 ? (
            templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription className="mt-1">{template.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {template.isPublic && <Badge variant="secondary">Público</Badge>}
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {template.usageCount} usos
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Pesos */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Distribuição de Pesos:</p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Auto</p>
                          <p className="text-lg font-bold">{template.selfWeight}%</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Gestor</p>
                          <p className="text-lg font-bold">{template.managerWeight}%</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Pares</p>
                          <p className="text-lg font-bold">{template.peerWeight}%</p>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">Subord.</p>
                          <p className="text-lg font-bold">{template.subordinateWeight}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Competências */}
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Competências: {template.competencyIds.length} selecionadas
                      </p>
                    </div>

                    {/* Metadados */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Criado por: {template.creatorName || 'Sistema'}</span>
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        disabled={incrementUsageMutation.isPending}
                      >
                        {incrementUsageMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Carregando...
                          </>
                        ) : (
                          'Usar Template'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum template disponível</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie seu primeiro template ao finalizar o wizard
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
