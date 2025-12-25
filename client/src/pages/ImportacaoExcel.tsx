import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ImportacaoExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationData, setValidationData] = useState<any>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateMutation = trpc.excelUpload.validateExcel.useMutation();
  const importMutation = trpc.excelUpload.importExcel.useMutation();
  const downloadTemplateMutation = trpc.excelUpload.downloadTemplate.useMutation();

  // Converter arquivo para base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remover prefixo "data:...;base64,"
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = async (selectedFile: File) => {
    // Validar tipo de arquivo
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Tipo de arquivo inválido. Por favor, selecione um arquivo Excel (.xlsx ou .xls)");
      return;
    }

    setFile(selectedFile);
    setValidationData(null);
    setIsValidating(true);

    try {
      // Converter para base64
      const base64Data = await fileToBase64(selectedFile);

      // Validar arquivo
      const result = await validateMutation.mutateAsync({
        base64Data,
        fileName: selectedFile.name,
      });

      setValidationData(result);
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error.message || "Erro ao validar arquivo");
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!file || !validationData) return;

    try {
      const base64Data = await fileToBase64(file);

      const result = await importMutation.mutateAsync({
        base64Data,
        fileName: file.name,
        updateExisting,
      });

      toast.success(result.message);

      // Limpar estado
      setFile(null);
      setValidationData(null);
      setUpdateExisting(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao importar dados");
    }
  };

  // Handle download template
  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplateMutation.mutateAsync();

      // Converter base64 para blob
      const byteCharacters = atob(result.base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Template baixado com sucesso");
    } catch (error: any) {
      toast.error(error.message || "Erro ao baixar template");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Importação de Dados via Excel</h1>
          <p className="text-muted-foreground mt-2">
            Importe colaboradores, departamentos e hierarquia através de planilhas Excel
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDownloadTemplate}
          disabled={downloadTemplateMutation.isPending}
        >
          {downloadTemplateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Baixar Template
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Instruções de Importação</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Baixe o template Excel e preencha com os dados dos colaboradores</li>
            <li>Colunas obrigatórias: nome, email, cpf, cargo, departamento</li>
            <li>Colunas opcionais: telefone, data_nascimento, data_admissao</li>
            <li>O sistema criará automaticamente os departamentos que não existirem</li>
            <li>CPFs duplicados serão ignorados ou atualizados conforme sua escolha</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Arraste e solte o arquivo Excel ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileInputChange}
              disabled={isValidating}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                  <p className="text-lg font-medium">Validando arquivo...</p>
                </>
              ) : file ? (
                <>
                  <FileSpreadsheet className="h-16 w-16 text-primary" />
                  <div>
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  {validationData && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Arquivo validado com sucesso</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <Upload className="h-16 w-16 text-muted-foreground" />
                  <div>
                    <p className="text-lg font-medium">
                      Arraste e solte o arquivo Excel aqui
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ou clique para selecionar
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>

          {file && !isValidating && (
            <div className="mt-4 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setValidationData(null);
                }}
              >
                Remover Arquivo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {validationData && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Arquivo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Registros</p>
                  <p className="text-2xl font-bold">{validationData.totalRows}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Colunas Detectadas</p>
                  <p className="text-2xl font-bold">{validationData.headers.length}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Colunas:</p>
                <div className="flex flex-wrap gap-2">
                  {validationData.headers.map((header: string) => (
                    <span
                      key={header}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview dos Dados</CardTitle>
              <CardDescription>
                Primeiros 10 registros do arquivo (para conferência)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {validationData.headers.map((header: string) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationData.preview.map((row: any, index: number) => (
                      <TableRow key={index}>
                        {validationData.headers.map((header: string) => (
                          <TableCell key={header} className="whitespace-nowrap">
                            {row[header] || "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Opções de Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
                />
                <Label htmlFor="update-existing" className="cursor-pointer">
                  Atualizar colaboradores existentes (identificados por CPF)
                </Label>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  size="lg"
                  className="flex-1"
                >
                  {importMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Dados
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
