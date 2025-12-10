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
 * Escala de Depressão Geriátrica (GDS-15)
 * 
 * 15 perguntas com respostas Sim/Não
 * Pontuação: 0-15 pontos
 * 
 * Interpretação:
 * - 0-5: Normal
 * - 6-10: Depressão leve
 * - 11-15: Depressão grave
 */

interface GDSFormData {
  q1_satisfeitoVida: number;
  q2_abandonouAtividades: number;
  q3_vidaVazia: number;
  q4_aborrece: number;
  q5_bomHumor: number;
  q6_medoCoisaRuim: number;
  q7_felizMaiorTempo: number;
  q8_desamparado: number;
  q9_prefereFicarCasa: number;
  q10_problemasMemoria: number;
  q11_bomEstarVivo: number;
  q12_seSenteInutil: number;
  q13_cheioEnergia: number;
  q14_situacaoSemEsperanca: number;
  q15_maioriaMelhorSituacao: number;
  observacoes: string;
}

const questions = [
  { key: "q1_satisfeitoVida", text: "Está satisfeito(a) com a sua vida?", inverted: true },
  { key: "q2_abandonouAtividades", text: "Abandonou muitas das suas atividades e interesses?", inverted: false },
  { key: "q3_vidaVazia", text: "Sente que a sua vida está vazia?", inverted: false },
  { key: "q4_aborrece", text: "Aborrece-se com frequência?", inverted: false },
  { key: "q5_bomHumor", text: "Está de bom humor a maior parte do tempo?", inverted: true },
  { key: "q6_medoCoisaRuim", text: "Tem medo que algo de mal lhe vá acontecer?", inverted: false },
  { key: "q7_felizMaiorTempo", text: "Sente-se feliz a maior parte do tempo?", inverted: true },
  { key: "q8_desamparado", text: "Sente-se frequentemente desamparado(a)?", inverted: false },
  { key: "q9_prefereFicarCasa", text: "Prefere ficar em casa em vez de sair e fazer coisas novas?", inverted: false },
  { key: "q10_problemasMemoria", text: "Sente que tem mais problemas de memória que a maioria?", inverted: false },
  { key: "q11_bomEstarVivo", text: "Acha que é bom estar vivo(a)?", inverted: true },
  { key: "q12_seSenteInutil", text: "Sente-se inútil?", inverted: false },
  { key: "q13_cheioEnergia", text: "Sente-se cheio(a) de energia?", inverted: true },
  { key: "q14_situacaoSemEsperanca", text: "Sente que a sua situação é sem esperança?", inverted: false },
  { key: "q15_maioriaMelhorSituacao", text: "Acha que a maioria das pessoas está em melhor situação?", inverted: false },
];

export default function GDSTest() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  
  const searchParams = new URLSearchParams(window.location.search);
  const pacienteId = parseInt(searchParams.get("pacienteId") || "0");

  const [formData, setFormData] = useState<GDSFormData>({
    q1_satisfeitoVida: 0,
    q2_abandonouAtividades: 0,
    q3_vidaVazia: 0,
    q4_aborrece: 0,
    q5_bomHumor: 0,
    q6_medoCoisaRuim: 0,
    q7_felizMaiorTempo: 0,
    q8_desamparado: 0,
    q9_prefereFicarCasa: 0,
    q10_problemasMemoria: 0,
    q11_bomEstarVivo: 0,
    q12_seSenteInutil: 0,
    q13_cheioEnergia: 0,
    q14_situacaoSemEsperanca: 0,
    q15_maioriaMelhorSituacao: 0,
    observacoes: "",
  });

  const { data: paciente, isLoading: loadingPaciente } = trpc.geriatric.patients.getById.useQuery(
    { id: pacienteId },
    { enabled: pacienteId > 0 }
  );

  const createTest = trpc.geriatric.gds.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Teste salvo com sucesso! Pontuação: ${data.pontuacaoTotal}/15 - ${data.classificacao}`);
      utils.geriatric.gds.listByPatient.invalidate();
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

  const handleFieldChange = (field: keyof GDSFormData, value: number | string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    let total = 0;
    questions.forEach((q) => {
      const value = formData[q.key as keyof GDSFormData] as number;
      // Perguntas invertidas: resposta "Não" (0) conta como ponto
      // Perguntas normais: resposta "Sim" (1) conta como ponto
      if (q.inverted) {
        total += value === 0 ? 1 : 0;
      } else {
        total += value;
      }
    });
    return total;
  };

  const getClassification = (total: number) => {
    if (total <= 5) return { text: "Normal", color: "text-green-600" };
    if (total <= 10) return { text: "Depressão Leve", color: "text-yellow-600" };
    return { text: "Depressão Grave", color: "text-red-600" };
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

  const totalScore = calculateTotal();
  const classification = getClassification(totalScore);

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
          <CardTitle>Escala de Depressão Geriátrica (GDS-15)</CardTitle>
          <CardDescription>
            Paciente: <strong>{paciente.nome}</strong> | Data de Nascimento: {new Date(paciente.dataNascimento).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Instruções:</strong> Responda como você se sentiu na <strong>última semana</strong>. Escolha a resposta que melhor descreve como você se sentiu.
              </p>
            </div>

            {questions.map((question: any, index: number) => (
              <div key={question.key} className="space-y-3 p-4 border rounded-lg">
                <Label className="text-base font-semibold">
                  {index + 1}. {question.text}
                </Label>
                <RadioGroup
                  value={formData[question.key as keyof GDSFormData].toString()}
                  onValueChange={(value) => handleFieldChange(question.key as keyof GDSFormData, parseInt(value))}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1" id={`${question.key}-sim`} />
                    <Label htmlFor={`${question.key}-sim`} className="font-normal cursor-pointer">
                      Sim
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0" id={`${question.key}-nao`} />
                    <Label htmlFor={`${question.key}-nao`} className="font-normal cursor-pointer">
                      Não
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            ))}

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
                Pontuação Total: {totalScore}/15 pontos
              </p>
              <p className={`text-lg font-semibold mt-2 ${classification.color}`}>
                Classificação: {classification.text}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                0-5 = Normal | 6-10 = Depressão Leve | 11-15 = Depressão Grave
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
