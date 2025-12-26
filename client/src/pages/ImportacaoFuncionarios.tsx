import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ParsedEmployee {
  name: string;
  email?: string | null;
  cpf?: string | null;
  employeeCode: string;
  departmentName?: string | null;
  positionName?: string | null;
  hireDate?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  active: boolean;
}

/**
 * Página de Importação em Lote de Funcionários
 * Permite importar funcionários via CSV ou Excel
 */
export default function ImportacaoFuncionarios() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEmployee[]>([]);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: template } = trpc.employeeBulkImport.getImportTemplate.useQuery(undefined);
  const { data: options } = trpc.employeeBulkImport.getAvailableOptions.useQuery(undefined);
  const validateMutation = trpc.employeeBulkImport.validateImport.useMutation();
  const importMutation = trpc.employeeBulkImport.bulkImport.useMutation();

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setParsedData([]);
    setValidationResults(null);
    setImportResults(null);

    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();

    try {
      if (fileExtension === "csv") {
        // Parse CSV
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data.map((row: any) => ({
              name: row.name || row.Nome || "",
              email: row.email || row.Email || null,
              cpf: row.cpf || row.CPF || null,
              employeeCode: row.employeeCode || row["Código"] || "",
              departmentName: row.departmentName || row.Departamento || null,
              positionName: row.positionName || row.Cargo || null,
              hireDate: row.hireDate || row["Data Admissão"] || null,
              birthDate: row.birthDate || row["Data Nascimento"] || null,
              phone: row.phone || row.Telefone || null,
              active: row.active === "true" || row.active === true || row.Ativo === "Sim",
            }));
            setParsedData(data);
            toast.success(`${data.length} registros carregados do CSV`);
          },
          error: (error) => {
            toast.error(`Erro ao ler CSV: ${error.message}`);
          },
        });
      } else if (fileExtension === "xlsx" || fileExtension === "xls") {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            const parsedEmployees = jsonData.map((row: any) => ({
              name: row.name || row.Nome || "",
              email: row.email || row.Email || null,
              cpf: row.cpf || row.CPF || null,
              employeeCode: row.employeeCode || row["Código"] || "",
              departmentName: row.departmentName || row.Departamento || null,
              positionName: row.positionName || row.Cargo || null,
              hireDate: row.hireDate || row["Data Admissão"] || null,
              birthDate: row.birthDate || row["Data Nascimento"] || null,
              phone: row.phone || row.Telefone || null,
              active: row.active === "true" || row.active === true || row.Ativo === "Sim",
            }));

            setParsedData(parsedEmployees);
            toast.success(`${parsedEmployees.length} registros carregados do Excel`);
          } catch (error: any) {
            toast.error(`Erro ao ler Excel: ${error.message}`);
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      } else {
        toast.error("Formato de arquivo não suportado. Use CSV ou Excel (.xlsx, .xls)");
      }
    } catch (error: any) {
      toast.error(`Erro ao processar arquivo: ${error.message}`);
    }
  };

  const handleValidate = async () => {
    if (parsedData.length === 0) {
      toast.error("Nenhum dado para validar");
      return;
    }

    try {
      const result = await validateMutation.mutateAsync({ employees: parsedData });
      setValidationResults(result);
      
      if (result.invalid === 0) {
        toast.success(`Todos os ${result.valid} registros são válidos!`);
      } else {
        toast.warning(`${result.valid} válidos, ${result.invalid} com erros`);
      }
    } catch (error: any) {
      toast.error(`Erro ao validar: ${error.message}`);
    }
  };

  const handleImport = async () => {
    if (!validationResults || validationResults.invalid > 0) {
      toast.error("Corrija os erros antes de importar");
      return;
    }

    setImporting(true);
    try {
      const result = await importMutation.mutateAsync({ employees: parsedData });
      setImportResults(result);
      
      if (result.failed === 0) {
        toast.success(`${result.success} funcionários importados com sucesso!`);
      } else {
        toast.warning(`${result.success} importados, ${result.failed} falharam`);
      }
    } catch (error: any) {
      toast.error(`Erro ao importar: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    if (!template) return;

    const csv = Papa.unparse([template.example]);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template_importacao_funcionarios.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container py-8 space-y-8">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Importação em Lote de Funcionários
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Importe funcionários via CSV ou Excel de forma rápida e segura
          </p>
        </div>

        {/* Instruções e Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Como Importar
            </CardTitle>
            <CardDescription>
              Siga os passos abaixo para importar seus funcionários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Baixe o Template</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Baixe o arquivo modelo com as colunas corretas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Preencha os Dados</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Complete o arquivo com os dados dos funcionários
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Faça o Upload</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Arraste o arquivo ou clique para selecionar
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={downloadTemplate} variant="outline" className="w-full md:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Baixar Template CSV
            </Button>

            {options && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Departamentos disponíveis:</strong> {options.departments.join(", ") || "Nenhum"}
                  <br />
                  <strong>Cargos disponíveis:</strong> {options.positions.slice(0, 10).join(", ")}
                  {options.positions.length > 10 && ` e mais ${options.positions.length - 10}...`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-500" />
              Upload de Arquivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                  : "border-slate-300 dark:border-slate-700"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <p className="text-lg font-semibold mb-2">
                Arraste seu arquivo aqui ou clique para selecionar
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Suporta CSV, XLSX e XLS (máximo 10MB)
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild variant="outline">
                  <span>Selecionar Arquivo</span>
                </Button>
              </label>
              {file && (
                <p className="mt-4 text-sm text-green-600 dark:text-green-400">
                  ✓ Arquivo selecionado: {file.name}
                </p>
              )}
            </div>

            {parsedData.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {parsedData.length} registros carregados
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleValidate} disabled={validateMutation.isPending}>
                      {validateMutation.isPending ? "Validando..." : "Validar Dados"}
                    </Button>
                    {validationResults && validationResults.invalid === 0 && (
                      <Button onClick={handleImport} disabled={importing}>
                        {importing ? "Importando..." : "Importar Agora"}
                      </Button>
                    )}
                  </div>
                </div>

                {importing && (
                  <div className="space-y-2">
                    <Progress value={50} />
                    <p className="text-sm text-center text-slate-600">Importando funcionários...</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados da Validação */}
        {validationResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validationResults.invalid === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                Resultados da Validação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {validationResults.total}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{validationResults.valid}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Válidos</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{validationResults.invalid}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Com Erros</p>
                </div>
              </div>

              {validationResults.invalid > 0 && (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Erros</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationResults.results
                        .filter((r: any) => !r.valid)
                        .map((result: any) => (
                          <TableRow key={result.index}>
                            <TableCell>{result.index + 1}</TableCell>
                            <TableCell>{result.data.name}</TableCell>
                            <TableCell>{result.data.employeeCode}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inválido
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <ul className="text-sm text-red-600 list-disc list-inside">
                                {result.errors.map((err: string, i: number) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resultados da Importação */}
        {importResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {importResults.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                Resultados da Importação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {importResults.total}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{importResults.success}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Sucesso</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{importResults.failed}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Falhas</p>
                </div>
              </div>

              {importResults.failed > 0 && (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResults.results
                        .filter((r: any) => !r.success)
                        .map((result: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{result.name}</TableCell>
                            <TableCell>{result.employeeCode}</TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Falhou
                              </Badge>
                            </TableCell>
                            <TableCell className="text-red-600">{result.error}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
