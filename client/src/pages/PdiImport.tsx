import { useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PdiImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Queries
  const { data: cycles } = trpc.cycles.list.useQuery(undefined);
  const { data: importedPDIs, refetch: refetchImported } = trpc.pdiHtmlImport.listImportedPDIs.useQuery(undefined);
  
  // Mutations
  const previewMutation = trpc.pdiHtmlImport.previewHtml.useMutation();
  const importMutation = trpc.pdiHtmlImport.importFromHtml.useMutation();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      toast.error("Por favor, selecione um arquivo HTML");
      return;
    }

    setSelectedFile(file);
    
    // Ler conteúdo do arquivo
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlContent(content);
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!htmlContent) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await previewMutation.mutateAsync({ htmlContent });
      setPreviewData(result);
      setShowPreview(true);
      toast.success("Preview gerado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao gerar preview: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!htmlContent) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    if (!selectedCycle) {
      toast.error("Selecione um ciclo de avaliação");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await importMutation.mutateAsync({
        htmlContent,
        cycleId: parseInt(selectedCycle),
        filename: selectedFile?.name,
      });

      toast.success(`PDI importado com sucesso para ${result.employeeName}!`);
      
      // Limpar formulário
      setSelectedFile(null);
      setHtmlContent("");
      setSelectedCycle("");
      setPreviewData(null);
      
      // Atualizar lista de importados
      refetchImported();
    } catch (error: any) {
      toast.error(`Erro ao importar PDI: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Importar PDI de HTML</h1>
        <p className="text-muted-foreground mt-2">
          Faça upload de arquivos HTML de PDI para importar os dados para o sistema
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Arquivo
            </CardTitle>
            <CardDescription>
              Selecione um arquivo HTML de PDI para importar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Arquivo HTML</Label>
              <div className="mt-2">
                <input
                  id="file-upload"
                  type="file"
                  accept=".html"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            {selectedFile && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <strong>Arquivo selecionado:</strong> {selectedFile.name}
                  <br />
                  <strong>Tamanho:</strong> {(selectedFile.size / 1024).toFixed(2)} KB
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="cycle-select">Ciclo de Avaliação</Label>
              <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                <SelectTrigger id="cycle-select">
                  <SelectValue placeholder="Selecione um ciclo" />
                </SelectTrigger>
                <SelectContent>
                  {cycles?.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.name} ({new Date(cycle.startDate).getFullYear()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={!htmlContent || isProcessing}
                variant="outline"
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Preview
              </Button>
              <Button
                onClick={handleImport}
                disabled={!htmlContent || !selectedCycle || isProcessing}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isProcessing ? "Importando..." : "Importar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card de PDIs Importados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              PDIs Importados
            </CardTitle>
            <CardDescription>
              Lista de PDIs já importados de arquivos HTML
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {importedPDIs && importedPDIs.length > 0 ? (
                <div className="space-y-3">
                  {importedPDIs.map((pdi) => (
                    <div
                      key={pdi.planId}
                      className="p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{pdi.employeeName}</h3>
                          <p className="text-sm text-muted-foreground">{pdi.position}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Importado em: {pdi.importedAt ? new Date(pdi.importedAt).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum PDI importado ainda</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview do PDI</DialogTitle>
            <DialogDescription>
              Dados extraídos do arquivo HTML
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            {previewData && (
              <div className="space-y-4 p-4">
                {/* Perfil */}
                <div>
                  <h3 className="font-bold text-lg mb-2">Perfil do Colaborador</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Nome:</strong> {previewData.employeeName}</div>
                    <div><strong>Cargo:</strong> {previewData.position}</div>
                    <div className="col-span-2"><strong>Foco:</strong> {previewData.developmentFocus}</div>
                    <div className="col-span-2"><strong>Sponsor:</strong> {previewData.sponsorName}</div>
                  </div>
                </div>

                {/* KPIs */}
                <div>
                  <h3 className="font-bold text-lg mb-2">KPIs</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Posição Atual:</strong> {previewData.kpis.currentPosition}</div>
                    <div><strong>Reenquadramento:</strong> {previewData.kpis.reframing}</div>
                    <div><strong>Nova Posição:</strong> {previewData.kpis.newPosition}</div>
                    <div><strong>Duração:</strong> {previewData.kpis.planDuration}</div>
                  </div>
                </div>

                {/* Gaps de Competências */}
                {previewData.competencyGaps && previewData.competencyGaps.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-2">Gaps de Competências ({previewData.competencyGaps.length})</h3>
                    <div className="space-y-2">
                      {previewData.competencyGaps.map((gap: any, index: number) => (
                        <div key={index} className="p-2 bg-accent rounded">
                          <strong className="text-sm">{gap.title}</strong>
                          <p className="text-xs text-muted-foreground mt-1">{gap.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plano de Ação 70-20-10 */}
                <div>
                  <h3 className="font-bold text-lg mb-2">Plano de Ação (70-20-10)</h3>
                  <div className="space-y-3">
                    {previewData.actionPlan.onTheJob && previewData.actionPlan.onTheJob.length > 0 && (
                      <div>
                        <strong className="text-sm text-orange-600">70% - Prática</strong>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                          {previewData.actionPlan.onTheJob.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {previewData.actionPlan.social && previewData.actionPlan.social.length > 0 && (
                      <div>
                        <strong className="text-sm text-blue-600">20% - Social</strong>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                          {previewData.actionPlan.social.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {previewData.actionPlan.formal && previewData.actionPlan.formal.length > 0 && (
                      <div>
                        <strong className="text-sm text-green-600">10% - Formal</strong>
                        <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                          {previewData.actionPlan.formal.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trilha de Remuneração */}
                {previewData.compensationTrack && previewData.compensationTrack.length > 0 && (
                  <div>
                    <h3 className="font-bold text-lg mb-2">Trilha de Remuneração</h3>
                    <div className="space-y-2">
                      {previewData.compensationTrack.map((track: any, index: number) => (
                        <div key={index} className="p-2 border rounded text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div><strong>Nível:</strong> {track.level}</div>
                            <div><strong>Prazo:</strong> {track.timeline}</div>
                            <div className="col-span-2"><strong>Gatilho:</strong> {track.trigger}</div>
                            <div><strong>Salário:</strong> {track.projectedSalary}</div>
                            <div><strong>Posição:</strong> {track.positionInRange}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
