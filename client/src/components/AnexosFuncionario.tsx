import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, FileText, Download, Trash2, Eye, Paperclip, File, Image as ImageIcon, Award } from "lucide-react";
import { toast } from "sonner";

interface AnexosFuncionarioProps {
  employeeId: number;
}

const categoryLabels: Record<string, string> = {
  certificado: "Certificado",
  documento: "Documento",
  foto: "Foto",
  curriculo: "Currículo",
  diploma: "Diploma",
  comprovante: "Comprovante",
  contrato: "Contrato",
  outro: "Outro",
};

const categoryIcons: Record<string, any> = {
  certificado: Award,
  documento: FileText,
  foto: ImageIcon,
  curriculo: File,
  diploma: Award,
  comprovante: FileText,
  contrato: FileText,
  outro: File,
};

export default function AnexosFuncionario({ employeeId }: AnexosFuncionarioProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("documento");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: attachments, isLoading, refetch } = trpc.attachments.list.useQuery({ employeeId });

  // Mutations
  const uploadMutation = trpc.attachments.upload.useMutation({
    onSuccess: () => {
      toast.success("Anexo enviado com sucesso!");
      refetch();
      setUploadDialogOpen(false);
      resetUploadForm();
    },
    onError: (error) => {
      toast.error(`Erro ao enviar anexo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      toast.success("Anexo deletado com sucesso!");
      refetch();
      setDeleteDialogOpen(false);
      setSelectedAttachment(null);
    },
    onError: (error) => {
      toast.error(`Erro ao deletar anexo: ${error.message}`);
    },
  });

  const resetUploadForm = () => {
    setSelectedFile(null);
    setCategory("documento");
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Tamanho máximo: 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    if (!category) {
      toast.error("Selecione uma categoria");
      return;
    }

    setUploading(true);

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remover prefixo "data:..."

        await uploadMutation.mutateAsync({
          employeeId,
          fileName: selectedFile.name,
          fileData: base64Data,
          fileType: selectedFile.type,
          category: category as any,
          description: description || undefined,
          isPublic: false,
          visibleToEmployee: true,
          visibleToManager: true,
          visibleToHR: true,
        });

        setUploading(false);
      };

      reader.onerror = () => {
        toast.error("Erro ao ler arquivo");
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      setUploading(false);
    }
  };

  const handlePreview = (attachment: any) => {
    setSelectedAttachment(attachment);
    setPreviewDialogOpen(true);
  };

  const handleDelete = (attachment: any) => {
    setSelectedAttachment(attachment);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAttachment) {
      deleteMutation.mutate({ id: selectedAttachment.id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  const isPDFFile = (fileType: string) => {
    return fileType === "application/pdf";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5 text-[#F39200]" />
            Anexos do Funcionário
          </CardTitle>
          <Button onClick={() => setUploadDialogOpen(true)} className="bg-[#F39200] hover:bg-[#d97f00]">
            <Upload className="w-4 h-4 mr-2" />
            Enviar Anexo
          </Button>
        </CardHeader>
        <CardContent>
          {!attachments || attachments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum anexo encontrado</p>
              <p className="text-sm mt-2">Clique em "Enviar Anexo" para adicionar certificados, diplomas ou documentos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attachments.map((attachment) => {
                const Icon = categoryIcons[attachment.category] || File;
                return (
                  <Card key={attachment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-[#F39200]/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#F39200]" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{attachment.fileName}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {categoryLabels[attachment.category]}
                            </Badge>
                            <span className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</span>
                          </div>
                          {attachment.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{attachment.description}</p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreview(attachment)}
                              className="flex-1"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(attachment.fileUrl, "_blank")}
                              className="flex-1"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Baixar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(attachment)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enviar Anexo</DialogTitle>
            <DialogDescription>
              Envie certificados, diplomas, documentos ou outros arquivos do funcionário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo (máximo 10MB)</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Arquivo selecionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificado">Certificado</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="documento">Documento</SelectItem>
                  <SelectItem value="curriculo">Currículo</SelectItem>
                  <SelectItem value="comprovante">Comprovante</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="foto">Foto</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição para o anexo..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="bg-[#F39200] hover:bg-[#d97f00]">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Preview */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedAttachment?.fileName}</DialogTitle>
            <DialogDescription>
              {categoryLabels[selectedAttachment?.category]} • {formatFileSize(selectedAttachment?.fileSize || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedAttachment && isImageFile(selectedAttachment.fileType) && (
              <img
                src={selectedAttachment.fileUrl}
                alt={selectedAttachment.fileName}
                className="w-full h-auto rounded-lg"
              />
            )}
            {selectedAttachment && isPDFFile(selectedAttachment.fileType) && (
              <iframe
                src={selectedAttachment.fileUrl}
                className="w-full h-[600px] rounded-lg border"
                title={selectedAttachment.fileName}
              />
            )}
            {selectedAttachment && !isImageFile(selectedAttachment.fileType) && !isPDFFile(selectedAttachment.fileType) && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">Pré-visualização não disponível para este tipo de arquivo</p>
                <Button onClick={() => window.open(selectedAttachment.fileUrl, "_blank")}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Arquivo
                </Button>
              </div>
            )}
            {selectedAttachment?.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Descrição</h4>
                <p className="text-sm text-gray-700">{selectedAttachment.description}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => window.open(selectedAttachment?.fileUrl, "_blank")}>
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o anexo "{selectedAttachment?.fileName}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                "Deletar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
