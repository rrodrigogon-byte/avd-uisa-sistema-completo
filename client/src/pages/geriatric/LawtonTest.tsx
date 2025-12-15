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
 * Teste de Lawton - Avaliação de Atividades Instrumentais de Vida Diária (AIVD)
 * 
 * Avalia 8 atividades instrumentais:
 * - Usar telefone
 * - Fazer compras
 * - Preparar refeições
 * - Cuidar da casa
 * - Lavar roupa
 * - Usar transporte
 * - Controlar medicação
 * - Controlar finanças
 * 
 * Pontuação: 0 = Dependente, 1 = Independente
 * Total: 0-8 pontos
 */

interface LawtonFormData {
  usarTelefone: number;
  fazerCompras: number;
  prepararRefeicoes: number;
  cuidarCasa: number;
  lavarRoupa: number;
  usarTransporte: number;
  controlarMedicacao: number;
  controlarFinancas: number;
  observacoes: string;
}

export default function LawtonTest() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  
  const searchParams = new URLSearchParams(window.location.search);
  const pacienteId = parseInt(searchParams.get("pacienteId") || "0");

  const [formData, setFormData] = useState<LawtonFormData>({
    usarTelefone: 0,
    fazerCompras: 0,
    prepararRefeicoes: 0,
    cuidarCasa: 0,
    lavarRoupa: 0,
    usarTransporte: 0,
    controlarMedicacao: 0,
    controlarFinancas: 0,
    observacoes: "",
  });

  const { data: paciente, isLoading: loadingPaciente } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId },
    { enabled: pacienteId > 0 }
  );

  const createTest = trpc.geriatric.lawton.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Teste salvo com sucesso! Pontuação: ${data.pontuacaoTotal}/8 - ${data.classificacao}`);
      utils.geriatric.lawton.listByPatient.invalidate();
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

  const handleFieldChange = (field: keyof LawtonFormData, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    return (
      formData.usarTelefone +
      formData.fazerCompras +
      formData.prepararRefeicoes +
      formData.cuidarCasa +
      formData.lavarRoupa +
      formData.usarTransporte +
      formData.controlarMedicacao +
      formData.controlarFinancas
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
          <CardTitle>Teste de Lawton - Atividades Instrumentais de Vida Diária</CardTitle>
          <CardDescription>
            Paciente: <strong>{paciente.nome}</strong> | Data de Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Usar Telefone */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">1. Usar Telefone</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de usar o telefone (discar, atender, fazer chamadas)
              </p>
              <RadioGroup
                value={formData.usarTelefone.toString()}
                onValueChange={(value) => handleFieldChange("usarTelefone", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="telefone-1" />
                  <Label htmlFor="telefone-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="telefone-0" />
                  <Label htmlFor="telefone-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Fazer Compras */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">2. Fazer Compras</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de fazer compras sozinho
              </p>
              <RadioGroup
                value={formData.fazerCompras.toString()}
                onValueChange={(value) => handleFieldChange("fazerCompras", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="compras-1" />
                  <Label htmlFor="compras-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="compras-0" />
                  <Label htmlFor="compras-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Preparar Refeições */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">3. Preparar Refeições</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de planejar e preparar refeições adequadas
              </p>
              <RadioGroup
                value={formData.prepararRefeicoes.toString()}
                onValueChange={(value) => handleFieldChange("prepararRefeicoes", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="refeicoes-1" />
                  <Label htmlFor="refeicoes-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="refeicoes-0" />
                  <Label htmlFor="refeicoes-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Cuidar da Casa */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">4. Cuidar da Casa</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de realizar tarefas domésticas
              </p>
              <RadioGroup
                value={formData.cuidarCasa.toString()}
                onValueChange={(value) => handleFieldChange("cuidarCasa", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="casa-1" />
                  <Label htmlFor="casa-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="casa-0" />
                  <Label htmlFor="casa-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Lavar Roupa */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">5. Lavar Roupa</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de lavar roupas sozinho
              </p>
              <RadioGroup
                value={formData.lavarRoupa.toString()}
                onValueChange={(value) => handleFieldChange("lavarRoupa", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="roupa-1" />
                  <Label htmlFor="roupa-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="roupa-0" />
                  <Label htmlFor="roupa-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Usar Transporte */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">6. Usar Transporte</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de usar transporte público ou dirigir
              </p>
              <RadioGroup
                value={formData.usarTransporte.toString()}
                onValueChange={(value) => handleFieldChange("usarTransporte", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="transporte-1" />
                  <Label htmlFor="transporte-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="transporte-0" />
                  <Label htmlFor="transporte-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Controlar Medicação */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">7. Controlar Medicação</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de tomar medicamentos corretamente
              </p>
              <RadioGroup
                value={formData.controlarMedicacao.toString()}
                onValueChange={(value) => handleFieldChange("controlarMedicacao", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="medicacao-1" />
                  <Label htmlFor="medicacao-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="medicacao-0" />
                  <Label htmlFor="medicacao-0" className="font-normal cursor-pointer">
                    Dependente (0 pontos)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Controlar Finanças */}
            <div className="space-y-3 p-4 border rounded-lg">
              <Label className="text-base font-semibold">8. Controlar Finanças</Label>
              <p className="text-sm text-muted-foreground">
                Avalia a capacidade de gerenciar dinheiro e contas
              </p>
              <RadioGroup
                value={formData.controlarFinancas.toString()}
                onValueChange={(value) => handleFieldChange("controlarFinancas", parseInt(value))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="1" id="financas-1" />
                  <Label htmlFor="financas-1" className="font-normal cursor-pointer">
                    Independente (1 ponto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="0" id="financas-0" />
                  <Label htmlFor="financas-0" className="font-normal cursor-pointer">
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
                Pontuação Total: {calculateTotal()}/8 pontos
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                0-2 = Dependência total | 3-5 = Dependência moderada | 6-8 = Independente
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
