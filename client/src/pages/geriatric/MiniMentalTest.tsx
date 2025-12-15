import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";

/**
 * Minimental (MEEM) - Avaliação Cognitiva
 * 
 * Avalia 7 domínios cognitivos:
 * - Orientação Temporal (5 pontos)
 * - Orientação Espacial (5 pontos)
 * - Memória Imediata (3 pontos)
 * - Atenção e Cálculo (5 pontos)
 * - Evocação (3 pontos)
 * - Linguagem (8 pontos)
 * - Praxia Construtiva (1 ponto)
 * 
 * Total: 0-30 pontos
 * Interpretação varia com escolaridade
 */

interface MiniMentalFormData {
  orientacaoTemporal: number;
  orientacaoEspacial: number;
  memoriaImediata: number;
  atencaoCalculo: number;
  evocacao: number;
  linguagem: number;
  praxiaConstrutiva: number;
  escolaridade: string;
  observacoes: string;
}

export default function MiniMentalTest() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  
  const searchParams = new URLSearchParams(window.location.search);
  const pacienteId = parseInt(searchParams.get("pacienteId") || "0");

  const [formData, setFormData] = useState<MiniMentalFormData>({
    orientacaoTemporal: 0,
    orientacaoEspacial: 0,
    memoriaImediata: 0,
    atencaoCalculo: 0,
    evocacao: 0,
    linguagem: 0,
    praxiaConstrutiva: 0,
    escolaridade: "",
    observacoes: "",
  });

  const { data: paciente, isLoading: loadingPaciente } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId },
    { enabled: pacienteId > 0 }
  );

  const createTest = trpc.geriatric.miniMental.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Teste salvo com sucesso! Pontuação: ${data.pontuacaoTotal}/30 - ${data.classificacao}`);
      utils.geriatric.miniMental.listByPatient.invalidate();
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

    if (!formData.escolaridade) {
      toast.error("Selecione a escolaridade do paciente");
      return;
    }

    createTest.mutate({
      pacienteId,
      dataAvaliacao: new Date().toISOString(),
      ...formData,
      orientacaoTemporal: Number(formData.orientacaoTemporal),
      orientacaoEspacial: Number(formData.orientacaoEspacial),
      memoriaImediata: Number(formData.memoriaImediata),
      atencaoCalculo: Number(formData.atencaoCalculo),
      evocacao: Number(formData.evocacao),
      linguagem: Number(formData.linguagem),
      praxiaConstrutiva: Number(formData.praxiaConstrutiva),
    });
  };

  const handleFieldChange = (field: keyof MiniMentalFormData, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return (
      Number(formData.orientacaoTemporal) +
      Number(formData.orientacaoEspacial) +
      Number(formData.memoriaImediata) +
      Number(formData.atencaoCalculo) +
      Number(formData.evocacao) +
      Number(formData.linguagem) +
      Number(formData.praxiaConstrutiva)
    );
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
          <CardTitle>Minimental (MEEM) - Avaliação Cognitiva</CardTitle>
          <CardDescription>
            Paciente: <strong>{paciente.nome}</strong> | Data de Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Escolaridade */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="escolaridade" className="text-base font-semibold">
                Escolaridade do Paciente *
              </Label>
              <Select value={formData.escolaridade} onValueChange={(value) => handleFieldChange("escolaridade", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escolaridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analfabeto">Analfabeto</SelectItem>
                  <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                  <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                  <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                  <SelectItem value="medio_completo">Médio Completo</SelectItem>
                  <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                  <SelectItem value="superior_completo">Superior Completo</SelectItem>
                  <SelectItem value="pos_graduacao">Pós-Graduação</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                A escolaridade é importante para interpretar corretamente a pontuação
              </p>
            </div>

            {/* Orientação Temporal */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="orientacaoTemporal" className="text-base font-semibold">
                1. Orientação Temporal (0-5 pontos)
              </Label>
              <p className="text-sm text-muted-foreground">
                Perguntar: Dia da semana, dia do mês, mês, ano, hora aproximada
              </p>
              <Input
                id="orientacaoTemporal"
                type="number"
                min="0"
                max="5"
                value={formData.orientacaoTemporal}
                onChange={(e) => handleFieldChange("orientacaoTemporal", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Orientação Espacial */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="orientacaoEspacial" className="text-base font-semibold">
                2. Orientação Espacial (0-5 pontos)
              </Label>
              <p className="text-sm text-muted-foreground">
                Perguntar: Local específico, instituição, bairro, cidade, estado
              </p>
              <Input
                id="orientacaoEspacial"
                type="number"
                min="0"
                max="5"
                value={formData.orientacaoEspacial}
                onChange={(e) => handleFieldChange("orientacaoEspacial", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Memória Imediata */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="memoriaImediata" className="text-base font-semibold">
                3. Memória Imediata (0-3 pontos)
              </Label>
              <p className="text-sm text-muted-foreground">
                Repetir 3 palavras (ex: VASO, CARRO, TIJOLO)
              </p>
              <Input
                id="memoriaImediata"
                type="number"
                min="0"
                max="3"
                value={formData.memoriaImediata}
                onChange={(e) => handleFieldChange("memoriaImediata", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Atenção e Cálculo */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="atencaoCalculo" className="text-base font-semibold">
                4. Atenção e Cálculo (0-5 pontos)
              </Label>
              <p className="text-sm text-muted-foreground">
                Subtrair 7 de 100, sucessivamente (100-7, 93-7, 86-7, 79-7, 72-7)
              </p>
              <Input
                id="atencaoCalculo"
                type="number"
                min="0"
                max="5"
                value={formData.atencaoCalculo}
                onChange={(e) => handleFieldChange("atencaoCalculo", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Evocação */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="evocacao" className="text-base font-semibold">
                5. Evocação (0-3 pontos)
              </Label>
              <p className="text-sm text-muted-foreground">
                Lembrar as 3 palavras ditas anteriormente
              </p>
              <Input
                id="evocacao"
                type="number"
                min="0"
                max="3"
                value={formData.evocacao}
                onChange={(e) => handleFieldChange("evocacao", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Linguagem */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="linguagem" className="text-base font-semibold">
                6. Linguagem (0-8 pontos)
              </Label>
              <p className="text-sm text-muted-foreground">
                Nomear objetos (2), repetir frase (1), comando de 3 estágios (3), ler e obedecer (1), escrever frase (1)
              </p>
              <Input
                id="linguagem"
                type="number"
                min="0"
                max="8"
                value={formData.linguagem}
                onChange={(e) => handleFieldChange("linguagem", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Praxia Construtiva */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label htmlFor="praxiaConstrutiva" className="text-base font-semibold">
                7. Praxia Construtiva (0-1 ponto)
              </Label>
              <p className="text-sm text-muted-foreground">
                Copiar desenho de dois pentágonos interseccionados
              </p>
              <Input
                id="praxiaConstrutiva"
                type="number"
                min="0"
                max="1"
                value={formData.praxiaConstrutiva}
                onChange={(e) => handleFieldChange("praxiaConstrutiva", parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Observações */}
            <div className="space-y-3">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais sobre a avaliação..."
                value={formData.observacoes}
                onChange={(e) => handleFieldChange("observacoes", e.target.value)}
                rows={4}
              />
            </div>

            {/* Pontuação Total */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-lg font-semibold">
                Pontuação Total: {calculateTotal()}/30 pontos
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Interpretação depende da escolaridade:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Analfabeto: &lt;20 = déficit cognitivo</li>
                <li>• 1-4 anos: &lt;25 = déficit cognitivo</li>
                <li>• 5-8 anos: &lt;26 = déficit cognitivo</li>
                <li>• 9-11 anos: &lt;28 = déficit cognitivo</li>
                <li>• &gt;11 anos: &lt;29 = déficit cognitivo</li>
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
              <Button type="submit" disabled={createTest.isPending}>
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
