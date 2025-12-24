import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";

/**
 * Teste de Katz - Avaliação de Atividades Básicas de Vida Diária (AVD)
 * 
 * Avalia 6 atividades básicas:
 * - Banho
 * - Vestir-se
 * - Higiene pessoal
 * - Transferência
 * - Continência
 * - Alimentação
 * 
 * Pontuação: 0 = Dependente, 1 = Independente
 * Total: 0-6 pontos
 */

interface KatzFormData {
  banho: number;
  vestir: number;
  higienePessoal: number;
  transferencia: number;
  continencia: number;
  alimentacao: number;
  observacoes: string;
}

export default function KatzTest() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  
  // Obter pacienteId da URL
  const searchParams = new URLSearchParams(window.location.search);
  const pacienteId = parseInt(searchParams.get("pacienteId") || "0");

  const [formData, setFormData] = useState<KatzFormData>({
    banho: 0,
    vestir: 0,
    higienePessoal: 0,
    transferencia: 0,
    continencia: 0,
    alimentacao: 0,
    observacoes: "",
  });

  const { data: paciente, isLoading: loadingPaciente } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId },
    { enabled: pacienteId > 0 }
  );

  const createTest = trpc.geriatric.katz.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Teste salvo com sucesso! Pontuação: ${data.pontuacaoTotal}/6 - ${data.classificacao}`);
      utils.geriatric.katz.listByPatient.invalidate();
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

    createTest.mutate({
      pacienteId,
      dataAvaliacao: new Date().toISOString(),
      ...formData,
    });
  };

  const handleFieldChange = (field: keyof KatzFormData, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return (
      formData.banho +
      formData.vestir +
      formData.higienePessoal +
      formData.transferencia +
      formData.continencia +
      formData.alimentacao
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
          <CardTitle>Teste de Katz - Atividades Básicas de Vida Diária</CardTitle>
          <CardDescription>
            Paciente: <strong>{paciente.nome}</strong> | Data de Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Banho */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">1. Banho</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de tomar banho sozinho (chuveiro, banheira ou esponja)
              </p>
              <RadioGroup
                value={formData.banho.toString()}
                onValueChange={(value) => handleFieldChange("banho", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="banho-1" />
                  <Label htmlFor="banho-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="banho-0" />
                  <Label htmlFor="banho-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Vestir */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">2. Vestir-se</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de pegar roupas e vestir-se completamente
              </p>
              <RadioGroup
                value={formData.vestir.toString()}
                onValueChange={(value) => handleFieldChange("vestir", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="vestir-1" />
                  <Label htmlFor="vestir-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="vestir-0" />
                  <Label htmlFor="vestir-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Higiene Pessoal */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">3. Higiene Pessoal</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de lavar o rosto, pentear cabelos, escovar dentes, fazer barba
              </p>
              <RadioGroup
                value={formData.higienePessoal.toString()}
                onValueChange={(value) => handleFieldChange("higienePessoal", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="higiene-1" />
                  <Label htmlFor="higiene-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="higiene-0" />
                  <Label htmlFor="higiene-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Transferência */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">4. Transferência</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de deitar/levantar da cama e sentar/levantar da cadeira
              </p>
              <RadioGroup
                value={formData.transferencia.toString()}
                onValueChange={(value) => handleFieldChange("transferencia", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="transferencia-1" />
                  <Label htmlFor="transferencia-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="transferencia-0" />
                  <Label htmlFor="transferencia-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Continência */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">5. Continência</Label>
              <p className="text-sm text-muted-foreground">
                Avalia o controle de esfíncteres (urina e fezes)
              </p>
              <RadioGroup
                value={formData.continencia.toString()}
                onValueChange={(value) => handleFieldChange("continencia", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="continencia-1" />
                  <Label htmlFor="continencia-1" className="font-normal cursor-pointer">
                    Continente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="continencia-0" />
                  <Label htmlFor="continencia-0" className="font-normal cursor-pointer">
                    Incontinente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Alimentação */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">6. Alimentação</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de se alimentar sozinho
              </p>
              <RadioGroup
                value={formData.alimentacao.toString()}
                onValueChange={(value) => handleFieldChange("alimentacao", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="alimentacao-1" />
                  <Label htmlFor="alimentacao-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="alimentacao-0" />
                  <Label htmlFor="alimentacao-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
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
                Pontuação Total: {calculateTotal()}/6 pontos
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                0 = Dependente total | 1-2 = Dependência grave | 3-4 = Dependência moderada | 5-6 = Independente
              </p>
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
