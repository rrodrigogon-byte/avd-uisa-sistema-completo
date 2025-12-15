import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";
import { toast } from "sonner";

interface ParsedRecord {
  employeeId: number;
  employeeCode?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalMinutes?: number;
  breakMinutes?: number;
  recordType?: "normal" | "overtime" | "absence" | "late" | "early_leave" | "holiday";
  location?: string;
  notes?: string;
}

export default function ImportacaoPonto() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = trpc.useUtils();

  const importMutation = trpc.timeClock.importRecords.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      toast.success(`${result.success} registros importados com sucesso!`);
      utils.timeClock.listRecords.invalidate();
      setParsedData([]);
      setFile(null);
    },
    onError: (error) => {
      toast.error(`Erro na importação: ${error.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportResult(null);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const records = parseCSV(text);
      setParsedData(records);
      toast.success(`${records.length} registros encontrados no arquivo`);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (text: string): ParsedRecord[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    // Assumir formato: employeeId,employeeCode,date,clockIn,clockOut,breakMinutes
    // Exemplo: 1,EMP001,2025-01-19,08:00,17:00,60
    const records: ParsedRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map(p => p.trim());
      if (parts.length < 3) continue;

      const employeeId = parseInt(parts[0]);
      if (isNaN(employeeId)) continue;

      const date = parts[2];
      const clockIn = parts[3] ? `${date}T${parts[3]}:00` : undefined;
      const clockOut = parts[4] ? `${date}T${parts[4]}:00` : undefined;
      const breakMinutes = parts[5] ? parseInt(parts[5]) : 60;

      records.push({
        employeeId,
        employeeCode: parts[1] || undefined,
        date,
        clockIn,
        clockOut,
        breakMinutes,
        recordType: "normal",
      });
    }

    return records;
  };

  const handleImport = () => {
    if (parsedData.length === 0) {
      toast.error("Nenhum registro para importar");
      return;
    }

    importMutation.mutate({
      records: parsedData,
      importSource: "csv",
    });
  };

  const downloadTemplate = () => {
    const template = `employeeId,employeeCode,date,clockIn,clockOut,breakMinutes
1,EMP001,2025-01-19,08:00,17:00,60
2,EMP002,2025-01-19,09:00,18:00,60
3,EMP003,2025-01-19,08:30,17:30,60`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_ponto.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Importação de Registros de Ponto</h1>
        <p className="text-muted-foreground">
          Faça upload de arquivos CSV com registros de ponto eletrônico
        </p>
      </div>

      {/* Instruções */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato do arquivo CSV:</strong> employeeId, employeeCode, date (YYYY-MM-DD), clockIn (HH:MM), clockOut (HH:MM), breakMinutes
          <br />
          <Button variant="link" className="p-0 h-auto" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-1" />
            Baixar template de exemplo
          </Button>
        </AlertDescription>
      </Alert>

      {/* Upload */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>Selecione um arquivo CSV para importar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              disabled={isProcessing || importMutation.isPending}
            />
            {file && (
              <Badge variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview dos dados */}
      {parsedData.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Preview dos Dados ({parsedData.length} registros)</CardTitle>
            <CardDescription>Revise os dados antes de importar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">ID</th>
                    <th className="text-left py-2 px-4">Código</th>
                    <th className="text-left py-2 px-4">Data</th>
                    <th className="text-left py-2 px-4">Entrada</th>
                    <th className="text-left py-2 px-4">Saída</th>
                    <th className="text-right py-2 px-4">Intervalo (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 100).map((record: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-accent/50">
                      <td className="py-2 px-4">{record.employeeId}</td>
                      <td className="py-2 px-4">{record.employeeCode || "-"}</td>
                      <td className="py-2 px-4">{record.date}</td>
                      <td className="py-2 px-4">{record.clockIn?.split("T")[1]?.slice(0, 5) || "-"}</td>
                      <td className="py-2 px-4">{record.clockOut?.split("T")[1]?.slice(0, 5) || "-"}</td>
                      <td className="text-right py-2 px-4">{record.breakMinutes || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 100 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Mostrando 100 de {parsedData.length} registros
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setParsedData([]);
                  setFile(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={importMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {importMutation.isPending ? "Importando..." : `Importar ${parsedData.length} Registros`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da importação */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{importResult.success} Sucessos</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">{importResult.failed} Falhas</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{importResult.total} Total</span>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Erros:</h4>
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md max-h-48 overflow-y-auto">
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {importResult.errors.map((error: string, idx: number) => (
                        <li key={idx} className="text-red-800 dark:text-red-200">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <Button
                onClick={() => {
                  setImportResult(null);
                  setParsedData([]);
                  setFile(null);
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
