import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Upload } from "lucide-react";

/**
 * Teste do Relógio
 * 
 * Avalia função cognitiva através do desenho de um relógio
 * O paciente deve desenhar um relógio com todos os números
 * e ponteiros indicando uma hora específica (ex: 11h10)
 * 
 * Pontuação: 0-10 pontos (avaliação manual)
 * 
 * Critérios:
 * - Círculo (1 ponto)
 * - Números 1-12 (2 pontos)
 * - Números na posição correta (2 pontos)
 * - Dois ponteiros (2 pontos)
 * - Ponteiros no tamanho correto (2 pontos)
 * - Hora correta (1 ponto)
 */

interface ClockFormData {
  pontuacaoTotal: number;
  imagemUrl: string;
  observacoes: string;
}

export default function ClockTest() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const pacienteId = parseInt(searchParams.get("pacienteId") || "0");

  const [formData, setFormData] = useState<ClockFormData>({
    pontuacaoTotal: 0,
    imagemUrl: "",
    observacoes: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const { data: paciente, isLoading: loadingPaciente } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId },
    { enabled: pacienteId > 0 }
  );

  const createTest = trpc.geriatric.clock.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Teste salvo com sucesso! Pontuação: ${data.pontuacaoTotal}/10`);
      utils.geriatric.clock.listByPatient.invalidate();
      navigate(`/geriatric/patient/${pacienteId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar teste: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pacienteId === 0) {
      toast.error("Paciente não identificado");
      return;
    }

    if (!formData.imagemUrl) {
      toast.error("Por favor, faça upload da imagem do desenho do relógio");
      return;
    }

    createTest.mutate({
      pacienteId,
      dataAvaliacao: new Date().toISOString(),
      pontuacaoTotal: Number(formData.pontuacaoTotal),
      imagemUrl: formData.imagemUrl,
      observacoes: formData.observacoes,
    });
  };

  const handleFieldChange = (field: keyof ClockFormData, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload para S3
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const data = await response.json();
      handleFieldChange("imagemUrl", data.url);
      toast.success("Imagem carregada com sucesso");
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload da imagem");
      setImagePreview("");
    } finally {
      setUploadingImage(false);
    }
  };

  if (loadingPaciente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Paciente não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/geriatric/patients")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Pacientes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/geriatric/patient/${pacienteId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teste do Relógio</CardTitle>
          <CardDescription>
            Paciente: <strong>{paciente.nome}</strong> | Data de Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Instruções */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-semibold">Instruções para o paciente:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Desenhe um relógio completo com todos os números</li>
                <li>Coloque os ponteiros indicando 11 horas e 10 minutos (11h10)</li>
              </ol>
              <p className="text-sm text-muted-foreground mt-3">
                Após o paciente desenhar, tire uma foto ou escaneie o desenho e faça o upload abaixo.
              </p>
            </div>

            {/* Upload de Imagem */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">Imagem do Desenho *</Label>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Fazer Upload da Imagem
                    </>
                  )}
                </Button>
                
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview do desenho"
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Critérios de Avaliação */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-base font-semibold">Critérios de Avaliação (0-10 pontos)</Label>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Círculo desenhado (1 ponto)</li>
                <li>• Todos os números de 1-12 presentes (2 pontos)</li>
                <li>• Números na posição correta (2 pontos)</li>
                <li>• Dois ponteiros presentes (2 pontos)</li>
                <li>• Ponteiros no tamanho correto (ponteiro das horas menor) (2 pontos)</li>
                <li>• Hora correta (11h10) (1 ponto)</li>
              </ul>
            </div>

            {/* Pontuação */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="pontuacaoTotal" className="text-base font-semibold">
                Pontuação Total (0-10) *
              </Label>
              <p className="text-sm text-muted-foreground">
                Avalie o desenho de acordo com os critérios acima
              </p>
              <Input
                id="pontuacaoTotal"
                type="number"
                min="0"
                max="10"
                value={formData.pontuacaoTotal}
                onChange={(e) => handleFieldChange("pontuacaoTotal", parseInt(e.target.value) || 0)}
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre o desenho e a execução do teste..."
                value={formData.observacoes}
                onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                rows={4}
              />
            </div>

            {/* Interpretação */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-sm font-semibold mb-2">Interpretação:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 10 pontos: Normal</li>
                <li>• 7-9 pontos: Leve comprometimento</li>
                <li>• 4-6 pontos: Comprometimento moderado</li>
                <li>• 0-3 pontos: Comprometimento grave</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/geriatric/patient/${pacienteId}`)}
                disabled={createTest.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createTest.isPending || !formData.imagemUrl}>
                {createTest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Avaliação
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
