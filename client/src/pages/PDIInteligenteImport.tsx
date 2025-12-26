import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Upload, Eye, CheckCircle2, Clock, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PDIInteligenteImport() {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<number>(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Queries
  const { data: availableImports, isLoading: isLoadingImports } = 
    trpc.pdiHtmlImport.listAvailableImports.useQuery({});

  const { data: cycles, isLoading: isLoadingCycles } = 
    trpc.cycles.list.useQuery({});

  const { data: preview, isLoading: isLoadingPreview } = 
    trpc.pdiHtmlImport.previewImport.useQuery(
      { htmlFilename: selectedFile as any },
      { enabled: !!selectedFile && isPreviewOpen }
    );

  // Mutations
  const importMutation = trpc.pdiHtmlImport.importFromHtml.useMutation({
    onSuccess: (data) => {
      toast.success("PDI importado com sucesso!", {
        description: `PDI de ${data.employeeName} foi criado com sucesso.`,
      });
      setSelectedFile("");
      setSelectedCycle(0);
    },
    onError: (error) => {
      toast.error("Erro ao importar PDI", {
        description: error.message,
      });
    },
  });

  const handleImport = () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para importar");
      return;
    }
    if (selectedCycle === 0) {
      toast.error("Selecione um ciclo de avaliação");
      return;
    }

    importMutation.mutate({
      htmlFilename: selectedFile as any,
      cycleId: selectedCycle,
    });
  };

  const handlePreview = () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para visualizar");
      return;
    }
    setIsPreviewOpen(true);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-uisa-blue">PDI Inteligente</h1>
          <p className="text-muted-foreground mt-2">
            Importação de Planos de Desenvolvimento Individual a partir de arquivos HTML
          </p>
        </div>
        <FileText className="h-12 w-12 text-uisa-orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Importação */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-uisa-blue" />
              Importar PDI de HTML
            </CardTitle>
            <CardDescription>
              Selecione um arquivo HTML de PDI e um ciclo de avaliação para importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Arquivo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo HTML</label>
              <Select value={selectedFile} onValueChange={setSelectedFile}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um arquivo..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingImports ? (
                    <div className="p-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    availableImports?.map((item) => (
                      <SelectItem key={item.htmlFilename} value={item.htmlFilename}>
                        {item.nome} - {item.cargo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção de Ciclo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciclo de Avaliação</label>
              <Select 
                value={selectedCycle.toString()} 
                onValueChange={(val) => setSelectedCycle(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um ciclo..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCycles ? (
                    <div className="p-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    cycles?.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id.toString()}>
                        {cycle.name} ({new Date(cycle.startDate).getFullYear()})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3">
              <Button
                onClick={handlePreview}
                variant="outline"
                disabled={!selectedFile}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || selectedCycle === 0 || importMutation.isPending}
                className="flex-1 bg-uisa-blue hover:bg-uisa-blue/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importando..." : "Importar PDI"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card de Informações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Arquivos Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingImports ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : (
              availableImports?.map((item) => (
                <div
                  key={item.htmlFilename}
                  className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedFile(item.htmlFilename)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.nome}</h4>
                      <p className="text-xs text-muted-foreground">{item.cargo}</p>
                    </div>
                    {selectedFile === item.htmlFilename && (
                      <CheckCircle2 className="h-5 w-5 text-uisa-green" />
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />
                      {item.gaps_count} gaps
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.acoes_count} ações
                    </Badge>
                  </div>
                  {item.kpis && (
                    <div className="text-xs text-muted-foreground">
                      {item.kpis["Plano de Performance"] && (
                        <span>Duração: {item.kpis["Plano de Performance"]}</span>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Preview */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pré-visualização do PDI</DialogTitle>
            <DialogDescription>
              Revise os dados antes de importar
            </DialogDescription>
          </DialogHeader>

          {isLoadingPreview ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{preview.nome}</h3>
                <p className="text-sm text-muted-foreground">{preview.cargo}</p>
                {preview.diretor_sponsor && (
                  <p className="text-sm">
                    <span className="font-medium">Sponsor:</span> {preview.diretor_sponsor}
                  </p>
                )}
              </div>

              {/* KPIs */}
              {preview.kpis && Object.keys(preview.kpis).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">KPIs</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(preview.kpis).map(([key, value]) => (
                      <div key={key} className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground">{key}</p>
                        <p className="font-semibold">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps Prioritários */}
              {preview.gaps_prioritarios && preview.gaps_prioritarios.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Gaps Prioritários</h4>
                  <div className="space-y-3">
                    {preview.gaps_prioritarios.map((gap: any, idx: number) => (
                      <div key={idx} className="p-3 border rounded-lg space-y-1">
                        <p className="font-medium text-sm">{gap.titulo}</p>
                        <p className="text-xs text-muted-foreground">{gap.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plano de Ação 70-20-10 */}
              <div className="space-y-3">
                <h4 className="font-semibold">Plano de Ação (70-20-10)</h4>
                
                {preview.plano_acao["70_pratica"] && preview.plano_acao["70_pratica"].length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-uisa-blue">70% - Aprendizado na Prática</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {preview.plano_acao["70_pratica"].map((action: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {preview.plano_acao["20_social"] && preview.plano_acao["20_social"].length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-uisa-green">20% - Aprendizado Social</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {preview.plano_acao["20_social"].map((action: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {preview.plano_acao["10_formal"] && preview.plano_acao["10_formal"].length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-uisa-orange">10% - Aprendizado Formal</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {preview.plano_acao["10_formal"].map((action: string, idx: number) => (
                        <li key={idx} className="text-muted-foreground">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
