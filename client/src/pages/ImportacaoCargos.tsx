import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Download, AlertCircle, Eye, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface PreviewData {
  headers: string[];
  rows: string[][];
  valid: boolean;
  errors: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
}

export default function ImportacaoCargos() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin' || user?.role === 'rh';

  // Buscar cargos já importados
  const { data: positions, refetch } = trpc.positionsManagement.list.useQuery(undefined);

  const uploadMutation = trpc.positionsManagement.bulkImportCSV.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.success} cargos importados com sucesso!`);
      setUploadResults(data.results);
      setUploading(false);
      setFile(null);
      setPreviewData(null);
      setValidationResult(null);
      setShowPreview(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    // Validar extensão
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Apenas arquivos .csv são aceitos");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    setFile(selectedFile);
    setUploadResults([]);
    
    // Ler e validar arquivo
    await validateAndPreviewFile(selectedFile);
  };

  const validateAndPreviewFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        toast.error("Arquivo vazio");
        setFile(null);
        return;
      }

      // Parsear CSV
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      // Validar headers obrigatórios
      const requiredHeaders = ['codigo', 'titulo', 'nivel'];
      const missingHeaders = requiredHeaders.filter(h => 
        !headers.some(header => header.toLowerCase() === h)
      );

      const errors: string[] = [];
      const warnings: string[] = [];

      if (missingHeaders.length > 0) {
        errors.push(`Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}`);
      }

      // Validar dados
      rows.forEach((row, index) => {
        const rowNum = index + 2; // +2 porque linha 1 é header e arrays começam em 0
        
        if (row.length !== headers.length) {
          errors.push(`Linha ${rowNum}: Número de colunas incorreto (esperado ${headers.length}, encontrado ${row.length})`);
        }

        // Validar campos obrigatórios
        const codigoIndex = headers.findIndex(h => h.toLowerCase() === 'codigo');
        const tituloIndex = headers.findIndex(h => h.toLowerCase() === 'titulo');
        const nivelIndex = headers.findIndex(h => h.toLowerCase() === 'nivel');

        if (codigoIndex >= 0 && !row[codigoIndex]) {
          errors.push(`Linha ${rowNum}: Código é obrigatório`);
        }

        if (tituloIndex >= 0 && !row[tituloIndex]) {
          errors.push(`Linha ${rowNum}: Título é obrigatório`);
        }

        if (nivelIndex >= 0 && !row[nivelIndex]) {
          warnings.push(`Linha ${rowNum}: Nível não informado`);
        }
      });

      // Verificar duplicatas
      const codigoIndex = headers.findIndex(h => h.toLowerCase() === 'codigo');
      if (codigoIndex >= 0) {
        const codigos = rows.map(r => r[codigoIndex]).filter(Boolean);
        const duplicates = codigos.filter((item, index) => codigos.indexOf(item) !== index);
        if (duplicates.length > 0) {
          errors.push(`Códigos duplicados encontrados: ${[...new Set(duplicates)].join(', ')}`);
        }
      }

      const preview: PreviewData = {
        headers,
        rows: rows.slice(0, 5), // Mostrar apenas 5 primeiras linhas
        valid: errors.length === 0,
        errors,
      };

      const validation: ValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
        rowCount: rows.length,
      };

      setPreviewData(preview);
      setValidationResult(validation);

      if (errors.length > 0) {
        toast.error(`${errors.length} erro(s) encontrado(s) no arquivo`);
      } else if (warnings.length > 0) {
        toast.warning(`${warnings.length} aviso(s) encontrado(s)`);
      } else {
        toast.success("Arquivo validado com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao validar arquivo:", error);
      toast.error("Erro ao processar arquivo CSV");
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !validationResult?.valid) {
      toast.error("Corrija os erros antes de importar");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage("Lendo arquivo...");

    try {
      const text = await file.text();
      
      setUploadProgress(30);
      setUploadStage("Validando dados...");

      await new Promise(resolve => setTimeout(resolve, 500));

      setUploadProgress(60);
      setUploadStage("Importando cargos...");

      await uploadMutation.mutateAsync({ csvContent: text });

      setUploadProgress(100);
      setUploadStage("Concluído!");
    } catch (error) {
      console.error("Erro no upload:", error);
      setUploadStage("Erro na importação");
    }
  };

  const downloadTemplate = () => {
    const template = `codigo,titulo,descricao,nivel,missao,responsabilidades,competencias_tecnicas,competencias_comportamentais
CARGO001,Analista de RH,Responsável pela gestão de pessoas,Pleno,Gerenciar processos de RH,"Recrutamento e seleção;Treinamento;Avaliação de desempenho","Excel avançado;Legislação trabalhista","Comunicação;Organização"
CARGO002,Desenvolvedor Full Stack,Desenvolvimento de sistemas web,Sênior,Desenvolver soluções tecnológicas,"Desenvolvimento frontend;Desenvolvimento backend;Code review","React;Node.js;TypeScript","Trabalho em equipe;Proatividade"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_importacao_cargos.csv';
    link.click();
    
    toast.success("Template baixado com sucesso!");
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores e RH podem importar cargos</CardDescription>
          </CardHeader>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8" />
            Importação de Cargos (CSV)
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe múltiplos cargos de uma vez usando arquivo CSV
          </p>
        </div>

        {/* Instruções e Template */}
        <Card>
          <CardHeader>
            <CardTitle>Como Importar</CardTitle>
            <CardDescription>
              Siga estas instruções para uma importação bem-sucedida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Formato do Arquivo</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Arquivo deve ser .csv (separado por vírgulas)</li>
                <li>Primeira linha deve conter os cabeçalhos</li>
                <li>Colunas obrigatórias: <strong>codigo</strong>, <strong>titulo</strong>, <strong>nivel</strong></li>
                <li>Colunas opcionais: descricao, missao, responsabilidades, competencias_tecnicas, competencias_comportamentais</li>
                <li>Para listas (responsabilidades, competências), separe itens com ponto e vírgula (;)</li>
                <li>Tamanho máximo: 5MB</li>
              </ul>
            </div>

            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar Template CSV
            </Button>
          </CardContent>
        </Card>

        {/* Card de Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Selecione um arquivo .csv contendo os cargos a serem importados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Clique para selecionar arquivo CSV
                </p>
                <p className="text-sm text-muted-foreground">
                  Ou arraste e solte o arquivo aqui
                </p>
              </label>
            </div>

            {file && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  {!uploading && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFile(null);
                        setPreviewData(null);
                        setValidationResult(null);
                      }}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Resultado da Validação */}
                {validationResult && (
                  <div className="space-y-3">
                    {validationResult.valid ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Arquivo Válido</AlertTitle>
                        <AlertDescription>
                          {validationResult.rowCount} cargo(s) pronto(s) para importação.
                          {validationResult.warnings.length > 0 && (
                            <span className="block mt-2 text-amber-600">
                              {validationResult.warnings.length} aviso(s) encontrado(s)
                            </span>
                          )}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erros Encontrados</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {validationResult.errors.map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationResult.warnings.length > 0 && validationResult.valid && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Avisos</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            {validationResult.warnings.map((warning, index) => (
                              <li key={index} className="text-sm">{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-2">
                  {previewData && (
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar Preview
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !validationResult?.valid}
                    className="flex-1"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Confirmar Importação
                      </>
                    )}
                  </Button>
                </div>

                {/* Progresso do Upload */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{uploadStage}</span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados da Importação */}
        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados da Importação</CardTitle>
              <CardDescription>
                Status de cada cargo processado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadResults.map((result: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono">{result.code}</TableCell>
                      <TableCell className="font-medium">{result.title}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Importado
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <XCircle className="h-3 w-3" />
                            Erro
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.message || result.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Cargos no Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Cargos Cadastrados</CardTitle>
            <CardDescription>
              Total de {positions?.length || 0} cargos no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positions && positions.length > 0 ? (
              <div className="text-sm text-muted-foreground">
                <p>Use a página "Gerenciar Cargos" para visualizar e editar os cargos cadastrados.</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cargo cadastrado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview dos Dados</DialogTitle>
            <DialogDescription>
              Primeiras 5 linhas do arquivo (total: {validationResult?.rowCount} linhas)
            </DialogDescription>
          </DialogHeader>
          
          {previewData && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData.headers.map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="text-sm">
                          {cell || <span className="text-muted-foreground italic">vazio</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
