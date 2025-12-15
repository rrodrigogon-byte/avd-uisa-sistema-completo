import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface PreviewData {
  totalRecords: number;
  data: any[];
  errors: Array<{
    row: number;
    field: string;
    message: string;
    value?: string;
  }>;
  hasErrors: boolean;
}

export default function PDIImport() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  const downloadTemplate = trpc.pdi.downloadTemplate.useQuery(
    selectedLevel ? { level: selectedLevel as any } : undefined,
    {
      enabled: false, // Não executar automaticamente
    }
  );
  const utils = trpc.useUtils();
  const previewMutation = trpc.pdi.previewImport.useMutation();
  const uploadMutation = trpc.pdi.uploadImportFile.useMutation();

  // Download do template
  const handleDownloadTemplate = async (level?: string) => {
    if (level) {
      setSelectedLevel(level);
    }
    try {
      const result = await downloadTemplate.refetch();
      if (result.data) {
        // Converter base64 para Uint8Array
        const binaryString = atob(result.data.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob(
          [bytes],
          { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Template baixado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao baixar template');
      console.error(error);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  // Validar e processar arquivo
  const handleFileSelect = async (selectedFile: File) => {
    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv', // csv
      'text/plain', // txt
      'text/html', // html
      'application/octet-stream' // fallback para arquivos sem tipo específico
    ];
    
    // Validar extensão do arquivo
    const fileName = selectedFile.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv', '.txt', '.html'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
      toast.error('Tipo de arquivo inválido. Use XLSX, XLS, CSV, TXT ou HTML.');
      return;
    }

    // Validar tamanho (máx 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Tamanho máximo: 10MB');
      return;
    }

    setFile(selectedFile);
    setPreviewData(null);
    setImportResult(null);

    // Gerar preview
    try {
      setIsProcessing(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // Converter ArrayBuffer para base64 usando Uint8Array
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
        const fileName = selectedFile.name.toLowerCase();
        const fileType = fileName.endsWith('.csv') ? 'csv' : 
                        fileName.endsWith('.xls') ? 'xls' : 
                        fileName.endsWith('.txt') ? 'txt' :
                        fileName.endsWith('.html') ? 'html' : 'xlsx';

        const result = await previewMutation.mutateAsync({
          fileData: base64,
          fileType,
        });

        setPreviewData(result);
        setIsProcessing(false);

        if (result.hasErrors) {
          toast.warning(`Arquivo contém ${result.errors.length} erro(s). Corrija antes de importar.`);
        } else {
          toast.success('Arquivo validado com sucesso!');
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
      setIsProcessing(false);
      toast.error('Erro ao processar arquivo');
      console.error(error);
    }
  };

  // Importar arquivo
  const handleImport = async () => {
    if (!file || !previewData || previewData.hasErrors) {
      return;
    }

    try {
      setIsProcessing(true);
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          // Converter ArrayBuffer para base64 usando Uint8Array
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          
          const fileName = file.name.toLowerCase();
          const fileType = fileName.endsWith('.csv') ? 'csv' : 
                          fileName.endsWith('.xls') ? 'xls' : 
                          fileName.endsWith('.txt') ? 'txt' :
                          fileName.endsWith('.html') ? 'html' : 'xlsx';

          const result = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileSize: file.size,
            fileType,
            fileData: base64,
          });

          setImportResult(result);
          setIsProcessing(false);

          // Invalidar cache para atualizar lista de PDIs
          await utils.pdi.getPlans.invalidate();
          await utils.pdi.getImportHistory.invalidate();

          if (result.success) {
            toast.success(`Importação concluída! ${result.successCount} PDI(s) importado(s).`);
          } else if (result.successCount > 0) {
            toast.warning(`Importação parcial: ${result.successCount} sucesso, ${result.errorCount} erro(s).`);
          } else {
            toast.error('Falha na importação. Verifique os erros.');
          }
        } catch (error) {
          setIsProcessing(false);
          toast.error('Erro ao importar arquivo');
          console.error(error);
        }
      };

      reader.onerror = () => {
        setIsProcessing(false);
        toast.error('Erro ao ler arquivo');
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setIsProcessing(false);
      toast.error('Erro ao importar arquivo');
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/pdi')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para PDI
          </Button>
          <h1 className="text-3xl font-bold">Importação de PDI</h1>
          <p className="text-muted-foreground">
            Importe múltiplos PDIs de uma vez usando arquivo Excel, CSV, TXT ou HTML
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleDownloadTemplate()}
            disabled={downloadTemplate.isFetching}
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadTemplate.isFetching ? 'Gerando...' : 'Template Genérico'}
          </Button>
          <select
            className="px-3 py-2 border rounded-md text-sm"
            onChange={(e) => {
              if (e.target.value) {
                handleDownloadTemplate(e.target.value);
              }
            }}
            disabled={downloadTemplate.isFetching}
          >
            <option value="">Templates por Nível</option>
            <option value="analista">Analista</option>
            <option value="especialista">Especialista</option>
            <option value="supervisor">Supervisor</option>
            <option value="coordenador">Coordenador</option>
            <option value="gerente">Gerente</option>
            <option value="gerente_executivo">Gerente Executivo</option>
            <option value="diretor">Diretor</option>
            <option value="ceo">CEO</option>
          </select>
        </div>
      </div>

      {/* Instruções */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Como importar:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Baixe o template de exemplo</li>
            <li>Preencha com os dados dos PDIs (um PDI pode ter múltiplas linhas de ações)</li>
            <li>Faça upload do arquivo preenchido</li>
            <li>Revise o preview e corrija erros se necessário</li>
            <li>Confirme a importação</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Arraste e solte o arquivo ou clique para selecionar (XLSX, XLS, CSV, TXT ou HTML)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.html"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  handleFileSelect(selectedFile);
                }
              }}
            />
            
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Arraste o arquivo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: XLSX, XLS, CSV (máx. 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <Progress value={50} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Processando arquivo...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview de Dados */}
      {previewData && !importResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview dos Dados</CardTitle>
                <CardDescription>
                  {previewData.totalRecords} registro(s) encontrado(s)
                  {previewData.data.length < previewData.totalRecords && 
                    ` (mostrando primeiros ${previewData.data.length})`
                  }
                </CardDescription>
              </div>
              
              {previewData.hasErrors ? (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {previewData.errors.length} Erro(s)
                </Badge>
              ) : (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Validado
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Erros */}
            {previewData.hasErrors && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erros encontrados:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {previewData.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-sm">
                        Linha {error.row}, campo "{error.field}": {error.message}
                                              {error.value && ` (valor: "${error.value}")`}
                      </li>
                    ))}
                    {previewData.errors.length > 10 && (
                      <li className="text-sm font-medium">
                        ... e mais {previewData.errors.length - 10} erro(s)
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Tabela de Preview */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data Início</TableHead>
                    <TableHead>Data Fim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.data.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.nome_colaborador}</TableCell>
                      <TableCell>{row.ciclo}</TableCell>
                      <TableCell>{row.competencia}</TableCell>
                      <TableCell>{row.acao_desenvolvimento}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.categoria}</Badge>
                      </TableCell>
                      <TableCell>{row.data_inicio_acao}</TableCell>
                      <TableCell>{row.data_fim_acao}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setPreviewData(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={previewData.hasErrors || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Confirmar Importação
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Importação */}
      {importResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resultado da Importação</CardTitle>
              {importResult.success ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sucesso
                </Badge>
              ) : importResult.successCount > 0 ? (
                <Badge variant="default" className="bg-yellow-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Parcial
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{importResult.totalRecords}</p>
                    <p className="text-sm text-muted-foreground">Total de Registros</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.successCount}</p>
                    <p className="text-sm text-muted-foreground">Importados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.errorCount}</p>
                    <p className="text-sm text-muted-foreground">Erros</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Erros durante a importação:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {importResult.errors.slice(0, 10).map((error: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        {error.field}: {error.message}
                        {error.value && ` (valor: "${error.value}")`}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-sm font-medium">
                        ... e mais {importResult.errors.length - 10} erro(s)
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation('/pdi/import/history')}
              >
                Ver Histórico
              </Button>
              <Button
                onClick={() => {
                  setFile(null);
                  setPreviewData(null);
                  setImportResult(null);
                }}
              >
                Nova Importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
