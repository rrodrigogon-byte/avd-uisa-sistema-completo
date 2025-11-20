import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Página de Importação UISA - /admin/import-uisa
 * Permite importação em massa de descrições de cargo com preview e estatísticas
 */

interface ImportStats {
  total: number;
  success: number;
  errors: number;
  warnings: number;
  byDepartment: Record<string, number>;
  byLevel: Record<string, number>;
}

interface PreviewItem {
  positionTitle: string;
  departmentName: string;
  cbo?: string;
  mainObjective?: string;
  responsibilitiesCount: number;
  knowledgeCount: number;
  competenciesCount: number;
  status: "valid" | "warning" | "error";
  issues?: string[];
}

export default function ImportUISA() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewItem[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [importing, setImporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPreviewItem, setSelectedPreviewItem] = useState<PreviewItem | null>(null);

  const importMutation = trpc.uisaImport.importBatch.useMutation({
    onSuccess: (data) => {
      setStats({
        total: data.total,
        success: data.imported,
        errors: data.errors.length,
        warnings: 0,
        byDepartment: data.stats.byDepartment,
        byLevel: data.stats.byLevel,
      });
      toast.success(`Importação concluída! ${data.imported} de ${data.total} registros importados.`);
      setImporting(false);
    },
    onError: (error) => {
      toast.error(`Erro na importação: ${error.message}`);
      setImporting(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Por favor, selecione um arquivo JSON válido.");
      return;
    }

    setSelectedFile(file);
    
    // Ler arquivo e gerar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validar estrutura e gerar preview
        const preview: PreviewItem[] = data.map((item: any) => {
          const issues: string[] = [];
          let status: "valid" | "warning" | "error" = "valid";

          if (!item.positionTitle) {
            issues.push("Título do cargo ausente");
            status = "error";
          }
          if (!item.departmentName) {
            issues.push("Departamento ausente");
            status = "error";
          }
          if (!item.mainObjective || item.mainObjective.length < 50) {
            issues.push("Objetivo principal muito curto (mínimo 50 caracteres)");
            status = status === "error" ? "error" : "warning";
          }
          if (!item.responsibilities || item.responsibilities.length < 3) {
            issues.push("Menos de 3 responsabilidades definidas");
            status = status === "error" ? "error" : "warning";
          }
          if (!item.knowledge || item.knowledge.length < 1) {
            issues.push("Nenhum conhecimento técnico definido");
            status = status === "error" ? "error" : "warning";
          }
          if (!item.competencies || item.competencies.length < 3) {
            issues.push("Menos de 3 competências definidas");
            status = status === "error" ? "error" : "warning";
          }

          return {
            positionTitle: item.positionTitle || "Sem título",
            departmentName: item.departmentName || "Sem departamento",
            cbo: item.cbo,
            mainObjective: item.mainObjective?.substring(0, 100),
            responsibilitiesCount: item.responsibilities?.length || 0,
            knowledgeCount: item.knowledge?.length || 0,
            competenciesCount: item.competencies?.length || 0,
            status,
            issues,
          };
        });

        setPreviewData(preview);
        
        // Calcular estatísticas
        const validCount = preview.filter(p => p.status === "valid").length;
        const warningCount = preview.filter(p => p.status === "warning").length;
        const errorCount = preview.filter(p => p.status === "error").length;

        setStats({
          total: preview.length,
          success: validCount,
          errors: errorCount,
          warnings: warningCount,
          byDepartment: {},
          byLevel: {},
        });

        toast.success(`Preview gerado: ${preview.length} registros encontrados.`);
      } catch (error) {
        toast.error("Erro ao processar arquivo JSON. Verifique o formato.");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo para importar.");
      return;
    }

    const errorCount = previewData.filter(p => p.status === "error").length;
    if (errorCount > 0) {
      toast.error(`Existem ${errorCount} registros com erros. Corrija antes de importar.`);
      return;
    }

    setImporting(true);

    // Ler arquivo novamente para enviar ao backend
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        await importMutation.mutateAsync({ jobDescriptions: data });
      } catch (error) {
        toast.error("Erro ao processar arquivo para importação.");
        console.error(error);
        setImporting(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge className="bg-green-100 text-green-800">Válido</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Importação de Descrições de Cargo UISA</h1>
            <p className="text-muted-foreground mt-2">
              Importe descrições de cargo em massa a partir de arquivos JSON processados
            </p>
          </div>
        </div>

        {/* Card de Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Selecionar Arquivo
            </CardTitle>
            <CardDescription>
              Faça upload de um arquivo JSON contendo as descrições de cargo processadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  {selectedFile.name}
                </div>
              )}
            </div>

            {stats && (
              <Alert>
                <AlertDescription className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span><strong>{stats.total}</strong> registros encontrados</span>
                    <span className="text-green-600"><strong>{stats.success}</strong> válidos</span>
                    {stats.warnings > 0 && (
                      <span className="text-yellow-600"><strong>{stats.warnings}</strong> avisos</span>
                    )}
                    {stats.errors > 0 && (
                      <span className="text-red-600"><strong>{stats.errors}</strong> erros</span>
                    )}
                  </div>
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    size="sm"
                    disabled={!previewData.length}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Preview
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-4">
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importing || (stats?.errors ?? 0) > 0}
                className="flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Iniciar Importação
                  </>
                )}
              </Button>

              {importing && (
                <div className="flex-1">
                  <Progress value={45} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de Importação */}
        {stats && stats.byDepartment && Object.keys(stats.byDepartment).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byDepartment).map(([dept, count]) => (
                    <div key={dept} className="flex items-center justify-between">
                      <span className="text-sm">{dept}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Nível</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.byLevel).map(([level, count]) => (
                    <div key={level} className="flex items-center justify-between">
                      <span className="text-sm">{level}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dialog de Preview */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview de Importação</DialogTitle>
              <DialogDescription>
                Visualize os dados antes de importar. Registros com erros devem ser corrigidos antes da importação.
              </DialogDescription>
            </DialogHeader>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>CBO</TableHead>
                  <TableHead className="text-center">Resp.</TableHead>
                  <TableHead className="text-center">Conhec.</TableHead>
                  <TableHead className="text-center">Comp.</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{getStatusIcon(item.status)}</TableCell>
                    <TableCell className="font-medium">{item.positionTitle}</TableCell>
                    <TableCell>{item.departmentName}</TableCell>
                    <TableCell>{item.cbo || "-"}</TableCell>
                    <TableCell className="text-center">{item.responsibilitiesCount}</TableCell>
                    <TableCell className="text-center">{item.knowledgeCount}</TableCell>
                    <TableCell className="text-center">{item.competenciesCount}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPreviewItem(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes do Item */}
        <Dialog open={!!selectedPreviewItem} onOpenChange={() => setSelectedPreviewItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedPreviewItem?.positionTitle}</DialogTitle>
              <DialogDescription>{selectedPreviewItem?.departmentName}</DialogDescription>
            </DialogHeader>

            {selectedPreviewItem && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  {getStatusBadge(selectedPreviewItem.status)}
                </div>

                {selectedPreviewItem.issues && selectedPreviewItem.issues.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Problemas Encontrados</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {selectedPreviewItem.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Objetivo Principal</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPreviewItem.mainObjective || "Não definido"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Responsabilidades</h3>
                    <p className="text-2xl font-bold">{selectedPreviewItem.responsibilitiesCount}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Conhecimentos</h3>
                    <p className="text-2xl font-bold">{selectedPreviewItem.knowledgeCount}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Competências</h3>
                    <p className="text-2xl font-bold">{selectedPreviewItem.competenciesCount}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
