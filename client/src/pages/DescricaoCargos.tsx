import { useState } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Briefcase, DollarSign, FileText } from "lucide-react";
import { toast } from "sonner";

interface Cargo {
  id: number;
  code: string;
  title: string;
  description: string;
  level: string;
  department: string;
  salaryMin: number;
  salaryMax: number;
  active: boolean;
}

export default function DescricaoCargos() {
  const [cargos] = useState<Cargo[]>([
    {
      id: 1,
      code: "DEV-001",
      title: "Desenvolvedor Full Stack",
      description: "Responsável pelo desenvolvimento de aplicações web completas, desde o frontend até o backend.",
      level: "pleno",
      department: "Tecnologia",
      salaryMin: 8000,
      salaryMax: 12000,
      active: true,
    },
    {
      id: 2,
      code: "GER-001",
      title: "Gerente de Projetos",
      description: "Gerencia projetos de TI, coordena equipes e garante a entrega dentro do prazo e orçamento.",
      level: "gerente",
      department: "Tecnologia",
      salaryMin: 15000,
      salaryMax: 20000,
      active: true,
    },
    {
      id: 3,
      code: "ANA-001",
      title: "Analista de RH",
      description: "Realiza processos de recrutamento, seleção e desenvolvimento de pessoas.",
      level: "pleno",
      department: "Recursos Humanos",
      salaryMin: 6000,
      salaryMax: 9000,
      active: true,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const handleAddCargo = () => {
    setShowForm(true);
  };

  const handleSaveCargo = () => {
    toast.success("Cargo salvo com sucesso!");
    setShowForm(false);
  };

  const handleDeleteCargo = (id: number) => {
    toast.success("Cargo excluído com sucesso!");
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      junior: "bg-green-500",
      pleno: "bg-blue-500",
      senior: "bg-purple-500",
      especialista: "bg-orange-500",
      coordenador: "bg-yellow-500",
      gerente: "bg-red-500",
      diretor: "bg-gray-800",
    };
    return <Badge className={colors[level] || "bg-gray-500"}>{level.toUpperCase()}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Descrição de Cargos e Salários</h1>
            <p className="text-muted-foreground">
              Gerencie cargos, responsabilidades e faixas salariais
            </p>
          </div>
          <Button onClick={handleAddCargo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cargo
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cargos.length}</div>
              <p className="text-xs text-muted-foreground">
                {cargos.filter((c) => c.active).length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faixa Salarial Média</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {((cargos.reduce((acc, c) => acc + c.salaryMin + c.salaryMax, 0) / (cargos.length * 2)) / 1000).toFixed(1)}k
              </div>
              <p className="text-xs text-muted-foreground">Média geral</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(cargos.map((c: any) => c.department)).size}
              </div>
              <p className="text-xs text-muted-foreground">Com cargos cadastrados</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulário de Novo Cargo */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Novo Cargo</CardTitle>
              <CardDescription>Preencha as informações do cargo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" placeholder="DEV-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Cargo</Label>
                  <Input id="title" placeholder="Desenvolvedor Full Stack" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva as responsabilidades e atribuições do cargo..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="level">Nível</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                      <SelectItem value="especialista">Especialista</SelectItem>
                      <SelectItem value="coordenador">Coordenador</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="diretor">Diretor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMin">Salário Mínimo (R$)</Label>
                  <Input id="salaryMin" type="number" placeholder="8000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMax">Salário Máximo (R$)</Label>
                  <Input id="salaryMax" type="number" placeholder="12000" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCargo}>Salvar Cargo</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabela de Cargos */}
        <Card>
          <CardHeader>
            <CardTitle>Cargos Cadastrados</CardTitle>
            <CardDescription>Lista completa de cargos e faixas salariais</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Faixa Salarial</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargos.map((cargo: any) => (
                  <TableRow key={cargo.id}>
                    <TableCell className="font-medium">{cargo.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{cargo.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {cargo.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getLevelBadge(cargo.level)}</TableCell>
                    <TableCell>{cargo.department}</TableCell>
                    <TableCell>
                      R$ {(cargo.salaryMin / 1000).toFixed(1)}k - R${" "}
                      {(cargo.salaryMax / 1000).toFixed(1)}k
                    </TableCell>
                    <TableCell>
                      <Badge variant={cargo.active ? "default" : "secondary"}>
                        {cargo.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCargo(cargo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
