import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Download, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface ImportRow {
  employeeId: number;
  name: string;
  newManagerId?: number;
  newCostCenter?: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function HierarquiaImport() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateEmployeeMutation = trpc.employees.updateEmployee.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("Arquivo vazio ou inválido");
        return;
      }

      // Assumindo CSV com cabeçalho: employeeId,name,newManagerId,newCostCenter
      const headers = lines[0].split(',').map(h => h.trim());
      const data: ImportRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2) {
          data.push({
            employeeId: parseInt(values[0]),
            name: values[1],
            newManagerId: values[2] ? parseInt(values[2]) : undefined,
            newCostCenter: values[3] || undefined,
            status: 'pending',
          });
        }
      }

      setPreviewData(data);
      toast.success(`${data.length} registros carregados para preview`);
    } catch (error) {
      toast.error("Erro ao processar arquivo");
      console.error(error);
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    const updatedData = [...previewData];

    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      try {
        const updateData: any = { id: row.employeeId };
        if (row.newManagerId) updateData.managerId = row.newManagerId;
        if (row.newCostCenter) updateData.costCenter = row.newCostCenter;

        await updateEmployeeMutation.mutateAsync(updateData);
        updatedData[i].status = 'success';
      } catch (error: any) {
        updatedData[i].status = 'error';
        updatedData[i].error = error.message || 'Erro desconhecido';
      }
      setPreviewData([...updatedData]);
    }

    setIsProcessing(false);
    const successCount = updatedData.filter(r => r.status === 'success').length;
    const errorCount = updatedData.filter(r => r.status === 'error').length;
    
    if (errorCount === 0) {
      toast.success(`✅ Importação concluída! ${successCount} registros atualizados.`);
    } else {
      toast.warning(`⚠️ Importação concluída com erros: ${successCount} sucessos, ${errorCount} falhas.`);
    }
  };

  const downloadTemplate = () => {
    const template = "employeeId,name,newManagerId,newCostCenter\n1,João Silva,2,CC-001-TI\n3,Maria Santos,2,CC-002-RH";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_importacao_hierarquia.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template baixado com sucesso!");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin/hierarquia")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Hierarquia
            </Button>
            <h1 className="text-3xl font-bold">Importação em Massa de Hierarquia</h1>
            <p className="text-muted-foreground">
              Atualize gestores e centros de custos de múltiplos colaboradores via CSV
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Card de Upload */}
          <Card>
            <CardHeader>
              <CardTitle>1. Upload do Arquivo CSV</CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV com os dados de atualização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={downloadTemplate} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Template CSV
                </Button>
                
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild variant="default">
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        {file ? file.name : "Selecionar Arquivo CSV"}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Formato do CSV:</strong> employeeId, name, newManagerId, newCostCenter
                  <br />
                  Exemplo: 1,João Silva,2,CC-001-TI
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Card de Preview */}
          {previewData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>2. Preview das Alterações</CardTitle>
                <CardDescription>
                  Revise os dados antes de importar ({previewData.length} registros)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={isProcessing}
                    size="lg"
                  >
                    {isProcessing ? "Importando..." : "Confirmar Importação"}
                  </Button>
                </div>

                <div className="max-h-[500px] overflow-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Novo Gestor ID</TableHead>
                        <TableHead>Novo Centro de Custos</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            {row.status === 'pending' && (
                              <AlertCircle className="h-4 w-4 text-gray-400" />
                            )}
                            {row.status === 'success' && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {row.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>{row.employeeId}</TableCell>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.newManagerId || '-'}</TableCell>
                          <TableCell>{row.newCostCenter || '-'}</TableCell>
                          <TableCell className="text-red-600 text-sm">
                            {row.error || ''}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
