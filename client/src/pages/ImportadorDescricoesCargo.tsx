import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export default function ImportadorDescricoesCargo() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin';

  // Buscar descrições já importadas
  const { data: jobDescriptions, refetch } = trpc.jobDescription.list.useQuery();

  const uploadMutation = trpc.jobDescription.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.success} descrições importadas com sucesso!`);
      setUploadResults(data.results);
      setUploading(false);
      setFiles([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao importar: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const docxFiles = selectedFiles.filter(f => f.name.endsWith('.docx') || f.name.endsWith('.doc'));
    
    if (docxFiles.length !== selectedFiles.length) {
      toast.warning("Apenas arquivos .docx são aceitos");
    }
    
    setFiles(docxFiles);
    setUploadResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Selecione pelo menos um arquivo");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Converter arquivos para base64
      const filesData = await Promise.all(
        files.map(async (file) => {
          const buffer = await file.arrayBuffer();
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          return {
            name: file.name,
            content: base64,
            size: file.size,
          };
        })
      );

      // Simular progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      await uploadMutation.mutateAsync({ files: filesData });

      clearInterval(progressInterval);
      setUploadProgress(100);
    } catch (error) {
      console.error("Erro no upload:", error);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem importar descrições de cargo</CardDescription>
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
            <Upload className="h-8 w-8" />
            Importador em Lote de Descrições de Cargo
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe múltiplos documentos .docx de descrições de cargo de uma vez
          </p>
        </div>

        {/* Card de Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivos</CardTitle>
            <CardDescription>
              Selecione um ou mais arquivos .docx contendo descrições de cargo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept=".docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  Clique para selecionar arquivos
                </p>
                <p className="text-sm text-muted-foreground">
                  Ou arraste e solte arquivos .docx aqui
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{files.length} arquivo(s) selecionado(s)</p>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar Todos
                      </>
                    )}
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-muted-foreground text-center">
                      {uploadProgress}% concluído
                    </p>
                  </div>
                )}

                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {files.map((file: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      {!uploading && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
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
                Status de cada arquivo processado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Cargo Detectado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadResults.map((result: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.fileName}</TableCell>
                      <TableCell>{result.positionTitle || "N/A"}</TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle2 className="h-3 w-3" />
                            Sucesso
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

        {/* Descrições Importadas */}
        <Card>
          <CardHeader>
            <CardTitle>Descrições de Cargo Importadas</CardTitle>
            <CardDescription>
              Total de {jobDescriptions?.length || 0} descrições no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobDescriptions && jobDescriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Data de Importação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobDescriptions.map((desc: any) => (
                    <TableRow key={desc.id}>
                      <TableCell className="font-medium">{desc.positionTitle}</TableCell>
                      <TableCell>{desc.department || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(desc.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={desc.status === 'aprovado' ? 'default' : 'secondary'}>
                          {desc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma descrição de cargo importada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
