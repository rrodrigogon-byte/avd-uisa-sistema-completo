import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DollarSign, Percent } from "lucide-react";
import { toast } from "sonner";

/**
 * Página de Configuração de Bônus por Função
 * Permite cadastrar quantos salários cada função tem direito + bônus extra em %
 */
export default function ConfiguracaoBonus() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  // Form state
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  const [baseSalaryMultiplier, setBaseSalaryMultiplier] = useState("");
  const [extraBonusPercentage, setExtraBonusPercentage] = useState("");

  // Queries
  const { data: configs = [], refetch } = trpc.bonus.listConfigs.useQuery();
  const { data: positions = [] } = trpc.positions.list.useQuery();

  // Mutations
  const createMutation = trpc.bonus.createConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração de bônus criada com sucesso!");
      refetch();
      closeDialog();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar configuração", {
        description: error.message,
      });
    },
  });

  const updateMutation = trpc.bonus.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração atualizada com sucesso!");
      refetch();
      closeDialog();
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar configuração", {
        description: error.message,
      });
    },
  });

  const deleteMutation = trpc.bonus.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração excluída com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir configuração", {
        description: error.message,
      });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
    setSelectedPositionId("");
    setBaseSalaryMultiplier("");
    setExtraBonusPercentage("");
  };

  const openEditDialog = (config: any) => {
    setEditingConfig(config);
    setSelectedPositionId(config.positionId.toString());
    setBaseSalaryMultiplier(config.baseSalaryMultiplier);
    setExtraBonusPercentage(config.extraBonusPercentage);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedPositionId || !baseSalaryMultiplier || !extraBonusPercentage) {
      toast.error("Preencha todos os campos");
      return;
    }

    const position = positions.find((p: any) => p.id === Number(selectedPositionId));
    if (!position) {
      toast.error("Função não encontrada");
      return;
    }

    if (editingConfig) {
      updateMutation.mutate({
        id: editingConfig.id,
        baseSalaryMultiplier: parseFloat(baseSalaryMultiplier),
        extraBonusPercentage: parseFloat(extraBonusPercentage),
      });
    } else {
      createMutation.mutate({
        positionId: Number(selectedPositionId),
        positionName: position.title,
        baseSalaryMultiplier: parseFloat(baseSalaryMultiplier),
        extraBonusPercentage: parseFloat(extraBonusPercentage),
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta configuração?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração de Bônus</h1>
          <p className="text-gray-600 mt-1">
            Defina quantos salários cada função tem direito e o percentual de bônus extra
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F39200] hover:bg-[#d67e00]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Configuração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? "Editar Configuração" : "Nova Configuração de Bônus"}
              </DialogTitle>
              <DialogDescription>
                Configure o multiplicador de salário e o bônus extra para a função
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="position">Função</Label>
                <Select
                  value={selectedPositionId}
                  onValueChange={setSelectedPositionId}
                  disabled={!!editingConfig}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position: any) => (
                      <SelectItem key={position.id} value={position.id.toString()}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="multiplier">Multiplicador de Salário</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="multiplier"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Ex: 1.5 (1.5 salários)"
                    value={baseSalaryMultiplier}
                    onChange={(e) => setBaseSalaryMultiplier(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Quantos salários a função tem direito (ex: 1.5 = um salário e meio)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="extra">Bônus Extra (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="extra"
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="Ex: 10 (10% adicional)"
                    value={extraBonusPercentage}
                    onChange={(e) => setExtraBonusPercentage(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Percentual adicional sobre o valor calculado
                </p>
              </div>

              {/* Exemplo de cálculo */}
              {baseSalaryMultiplier && extraBonusPercentage && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Exemplo de Cálculo:
                    </p>
                    <p className="text-xs text-blue-700">
                      Salário Base: R$ 5.000,00
                      <br />
                      Bônus Base: R$ {(5000 * parseFloat(baseSalaryMultiplier)).toFixed(2)}
                      <br />
                      Bônus Extra ({extraBonusPercentage}%): R${" "}
                      {(
                        5000 *
                        parseFloat(baseSalaryMultiplier) *
                        (parseFloat(extraBonusPercentage) / 100)
                      ).toFixed(2)}
                      <br />
                      <strong>
                        Total: R${" "}
                        {(
                          5000 * parseFloat(baseSalaryMultiplier) +
                          5000 *
                            parseFloat(baseSalaryMultiplier) *
                            (parseFloat(extraBonusPercentage) / 100)
                        ).toFixed(2)}
                      </strong>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#F39200] hover:bg-[#d67e00]"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingConfig
                    ? "Atualizar"
                    : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela de Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Cadastradas</CardTitle>
          <CardDescription>
            {configs.length} {configs.length === 1 ? "função configurada" : "funções configuradas"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma configuração cadastrada
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando a primeira configuração de bônus por função
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead className="text-center">Multiplicador</TableHead>
                  <TableHead className="text-center">Bônus Extra</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config: any) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.positionName}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {parseFloat(config.baseSalaryMultiplier).toFixed(1)}x salário
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        +{parseFloat(config.extraBonusPercentage).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {config.isActive ? (
                        <Badge className="bg-green-500">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Informações */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900">ℹ️ Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 space-y-2">
          <p>
            <strong>Multiplicador de Salário:</strong> Define quantos salários a função tem direito.
            Exemplo: 1.5 significa que o colaborador receberá 1.5 vezes seu salário base como bônus.
          </p>
          <p>
            <strong>Bônus Extra (%):</strong> Percentual adicional aplicado sobre o valor calculado.
            Exemplo: 10% de bônus extra sobre R$ 7.500 = R$ 750 adicionais.
          </p>
          <p>
            <strong>Cálculo Final:</strong> (Salário Base × Multiplicador) + (Valor Calculado ×
            Bônus Extra %)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
