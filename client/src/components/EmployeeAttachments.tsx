import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, Image, Download, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmployeeAttachmentsProps {
  employeeId: number;
  canUpload?: boolean;
  canDelete?: boolean;
}

const CATEGORY_LABELS = {
  certificado: "Certificado",
  documento: "Documento",
  foto: "Foto",
  curriculo: "Currículo",
  diploma: "Diploma",
  comprovante: "Comprovante",
  contrato: "Contrato",
  outro: "Outro",
};

const CATEGORY_COLORS = {
  certificado: "bg-blue-100 text-blue-800",
  documento: "bg-gray-100 text-gray-800",
  foto: "bg-purple-100 text-purple-800",
  curriculo: "bg-green-100 text-green-800",
  diploma: "bg-yellow-100 text-yellow-800",
  comprovante: "bg-orange-100 text-orange-800",
  contrato: "bg-red-100 text-red-800",
  outro: "bg-slate-100 text-slate-800",
};

export function EmployeeAttachments({ employeeId, canUpload = false, canDelete = false }: EmployeeAttachmentsProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("documento");
  const [description, setDescription] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const utils = trpc.useUtils();

  // Buscar anexos
  const { data: attachments, isLoading } = trpc.attachments.list.useQuery({
    employeeId,
    category: filterCategory !== "all" ? (filterCategory as any) : undefined,
  });

  // Upload mutation
  const uploadMutation = trpc.attachments.upload.useMutation({
    onSuccess: () => {
      toast.success("Anexo enviado com sucesso!");
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setDescription("");
      utils.attachments.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar anexo");
    },
  });

  // Delete mutation
  const deleteMutation = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      toast.success("Anexo deletado com sucesso!");
      utils.attachments.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao deletar anexo");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamanho (10MB)
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

    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(",")[1]; // Remover prefixo data:...

        await uploadMutation.mutateAsync({
          employeeId,
          fileName: selectedFile.name,
          fileData: base64Data,
          fileType: selectedFile.type,
          category: category as any,
          description: description || undefined,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este anexo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Anexos</CardTitle>
            <CardDescription>
              Documentos, certificados e outros arquivos do funcionário
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canUpload && (
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar Anexo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enviar Anexo</DialogTitle>
                    <DialogDescription>
                      Envie documentos, certificados ou outros arquivos relacionados ao funcionário
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file">Arquivo (máx. 10MB)</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Adicione uma descrição para o arquivo..."
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploadMutation.isPending}
                      className="w-full"
                    >
                      {uploadMutation.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Carregando anexos...</p>
        ) : !attachments || attachments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum anexo encontrado
          </p>
        ) : (
          <div className="space-y-2">
            {safeMap(ensureArray(attachments), ((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(attachment.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.fileName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className={CATEGORY_COLORS[attachment.category as keyof typeof CATEGORY_COLORS]}
                      >
                        {CATEGORY_LABELS[attachment.category as keyof typeof CATEGORY_LABELS]}
                      </Badge>
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>•</span>
                      <span>
                        {new Date(attachment.uploadedAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {attachment.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(attachment.fileUrl, "_blank")}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = attachment.fileUrl;
                      link.download = attachment.fileName;
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
