import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "wouter";

export default function GeriatricPatients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: patients, isLoading, refetch } = trpc.geriatric.patients.list.useQuery({
    activeOnly: true,
  });

  const createPatient = trpc.geriatric.patients.create.useMutation({
    onSuccess: () => {
      toast.success("Paciente cadastrado com sucesso!");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar paciente: ${error.message}`);
    },
  });

  const deletePatient = trpc.geriatric.patients.delete.useMutation({
    onSuccess: () => {
      toast.success("Paciente removido com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao remover paciente: ${error.message}`);
    },
  });

  const filteredPatients = patients?.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf?.includes(searchTerm)
  );

  const handleCreatePatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createPatient.mutate({
      nome: formData.get("nome") as string,
      dataNascimento: formData.get("dataNascimento") as string,
      cpf: formData.get("cpf") as string || undefined,
      rg: formData.get("rg") as string || undefined,
      sexo: formData.get("sexo") as any || undefined,
      telefone: formData.get("telefone") as string || undefined,
      email: formData.get("email") as string || undefined,
      endereco: formData.get("endereco") as string || undefined,
      escolaridade: formData.get("escolaridade") as any || undefined,
      historicoMedico: formData.get("historicoMedico") as string || undefined,
      medicamentosEmUso: formData.get("medicamentosEmUso") as string || undefined,
      nomeResponsavel: formData.get("nomeResponsavel") as string || undefined,
      telefoneResponsavel: formData.get("telefoneResponsavel") as string || undefined,
      parentescoResponsavel: formData.get("parentescoResponsavel") as string || undefined,
      observacoes: formData.get("observacoes") as string || undefined,
    });
  };

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
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">
            Gerenciamento de pacientes para testes geriátricos
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input id="nome" name="nome" required />
                </div>

                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input id="dataNascimento" name="dataNascimento" type="date" required />
                </div>

                <div>
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select name="sexo">
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

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" name="cpf" placeholder="000.000.000-00" />
                </div>

                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input id="rg" name="rg" />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" name="email" type="email" />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Textarea id="endereco" name="endereco" rows={2} />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="escolaridade">Escolaridade</Label>
                  <Select name="escolaridade">
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

                <div className="col-span-2">
                  <Label htmlFor="historicoMedico">Histórico Médico</Label>
                  <Textarea id="historicoMedico" name="historicoMedico" rows={3} />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="medicamentosEmUso">Medicamentos em Uso</Label>
                  <Textarea id="medicamentosEmUso" name="medicamentosEmUso" rows={2} />
                </div>

                <div className="col-span-2">
                  <h3 className="font-semibold text-lg mt-4">Responsável</h3>
                </div>

                <div>
                  <Label htmlFor="nomeResponsavel">Nome do Responsável</Label>
                  <Input id="nomeResponsavel" name="nomeResponsavel" />
                </div>

                <div>
                  <Label htmlFor="telefoneResponsavel">Telefone do Responsável</Label>
                  <Input
                    id="telefoneResponsavel"
                    name="telefoneResponsavel"
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="parentescoResponsavel">Parentesco</Label>
                  <Input
                    id="parentescoResponsavel"
                    name="parentescoResponsavel"
                    placeholder="Ex: Filho(a), Cônjuge, etc."
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea id="observacoes" name="observacoes" rows={3} />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Cadastrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients?.map((patient: any) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.nome}</TableCell>
                    <TableCell>{calculateAge(patient.dataNascimento)} anos</TableCell>
                    <TableCell>{patient.cpf || "-"}</TableCell>
                    <TableCell>{patient.telefone || "-"}</TableCell>
                    <TableCell>{patient.nomeResponsavel || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/geriatric/patients/${patient.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("Deseja realmente remover este paciente?")) {
                              deletePatient.mutate({ id: patient.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
