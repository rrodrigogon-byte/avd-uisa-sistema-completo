import { safeMap, isEmpty } from "@/lib/arrayHelpers";

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Search, Eye, Edit, Trash2, FileText } from "lucide-react";

interface PatientFormData {
  nome: string;
  dataNascimento: string;
  cpf: string;
  rg: string;
  sexo: "masculino" | "feminino" | "outro" | "";
  telefone: string;
  email: string;
  endereco: string;
  escolaridade: string;
  historicoMedico: string;
  medicamentosEmUso: string;
  nomeResponsavel: string;
  telefoneResponsavel: string;
  parentescoResponsavel: string;
  observacoes: string;
}

const initialFormData: PatientFormData = {
  nome: "",
  dataNascimento: "",
  cpf: "",
  rg: "",
  sexo: "",
  telefone: "",
  email: "",
  endereco: "",
  escolaridade: "",
  historicoMedico: "",
  medicamentosEmUso: "",
  nomeResponsavel: "",
  telefoneResponsavel: "",
  parentescoResponsavel: "",
  observacoes: "",
};

export default function Patients() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<number | null>(null);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);

  const { data: patients, isLoading } = trpc.geriatric.patients.list.useQuery({ activeOnly: true });

  const createPatient = trpc.geriatric.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso");
      utils.geriatric.patients.list.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar paciente: ${error.message}`);
    },
  });

  const updatePatient = trpc.geriatric.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Paciente atualizado com sucesso");
      utils.geriatric.patients.list.invalidate();
      setIsDialogOpen(false);
      setEditingPatient(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar paciente: ${error.message}`);
    },
  });

  const deletePatient = trpc.geriatric.patients.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente removido com sucesso");
      utils.geriatric.patients.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao remover paciente: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.dataNascimento) {
      toast.error("Nome e data de nascimento são obrigatórios");
      return;
    }

    const submitData = {
      ...formData,
      sexo: formData.sexo || undefined,
      escolaridade: formData.escolaridade || undefined,
    };

    if (editingPatient) {
      updatePatient.mutate({ id: editingPatient, ...submitData } as any);
    } else {
      createPatient.mutate(submitData as any);
    }
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient.id);
    setFormData({
      nome: patient.nome || "",
      dataNascimento: patient.dataNascimento ? new Date(patient.dataNascimento).toISOString().split("T")[0] : "",
      cpf: patient.cpf || "",
      rg: patient.rg || "",
      sexo: patient.sexo || "",
      telefone: patient.telefone || "",
      email: patient.email || "",
      endereco: patient.endereco || "",
      escolaridade: patient.escolaridade || "",
      historicoMedico: patient.historicoMedico || "",
      medicamentosEmUso: patient.medicamentosEmUso || "",
      nomeResponsavel: patient.nomeResponsavel || "",
      telefoneResponsavel: patient.telefoneResponsavel || "",
      parentescoResponsavel: patient.parentescoResponsavel || "",
      observacoes: patient.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o paciente ${nome}?`)) {
      deletePatient.mutate({ id });
    }
  };

  const handleNewPatient = () => {
    setEditingPatient(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const filteredPatients = patients?.filter((patient: any) =>
    patient.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf?.includes(searchTerm)
  );

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pacientes - Testes Geriátricos</CardTitle>
              <CardDescription>
                Gerencie os pacientes e seus testes de avaliação geriátrica
              </CardDescription>
            </div>
            <Button onClick={handleNewPatient}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPatients && filteredPatients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient: any) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.nome}</TableCell>
                    <TableCell>{calculateAge(patient.dataNascimento)} anos</TableCell>
                    <TableCell>{patient.cpf || "-"}</TableCell>
                    <TableCell>{patient.telefone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={patient.active ? "default" : "secondary"}>
                        {patient.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/geriatric/patient/${patient.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(patient.id, patient.nome)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum paciente encontrado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPatient ? "Editar Paciente" : "Novo Paciente"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do paciente
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="font-semibold">Dados Pessoais</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select value={formData.sexo} onValueChange={(value: any) => setFormData({ ...formData, sexo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="escolaridade">Escolaridade</Label>
                <Select value={formData.escolaridade} onValueChange={(value) => setFormData({ ...formData, escolaridade: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              </div>
            </div>

            {/* Informações Médicas */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informações Médicas</h3>
              
              <div className="space-y-2">
                <Label htmlFor="historicoMedico">Histórico Médico</Label>
                <Textarea
                  id="historicoMedico"
                  value={formData.historicoMedico}
                  onChange={(e) => setFormData({ ...formData, historicoMedico: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicamentosEmUso">Medicamentos em Uso</Label>
                <Textarea
                  id="medicamentosEmUso"
                  value={formData.medicamentosEmUso}
                  onChange={(e) => setFormData({ ...formData, medicamentosEmUso: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Responsável */}
            <div className="space-y-4">
              <h3 className="font-semibold">Responsável</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                  <Input
                    id="nomeResponsavel"
                    value={formData.nomeResponsavel}
                    onChange={(e) => setFormData({ ...formData, nomeResponsavel: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefoneResponsavel">Telefone do Responsável</Label>
                  <Input
                    id="telefoneResponsavel"
                    value={formData.telefoneResponsavel}
                    onChange={(e) => setFormData({ ...formData, telefoneResponsavel: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentescoResponsavel">Parentesco</Label>
                <Input
                  id="parentescoResponsavel"
                  value={formData.parentescoResponsavel}
                  onChange={(e) => setFormData({ ...formData, parentescoResponsavel: e.target.value })}
                />
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createPatient.isPending || updatePatient.isPending}
              >
                {(createPatient.isPending || updatePatient.isPending) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
