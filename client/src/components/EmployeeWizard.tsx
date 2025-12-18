import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronLeft, ChevronRight, User, Briefcase, Users, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { z } from "zod";

/**
 * Schema de validação para cada step
 */
const step1Schema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const step2Schema = z.object({
  employeeCode: z.string().min(1, "Código do funcionário é obrigatório"),
  departmentId: z.number({ required_error: "Departamento é obrigatório" }),
  positionId: z.number({ required_error: "Cargo é obrigatório" }),
  hireDate: z.string().min(1, "Data de admissão é obrigatória"),
  salary: z.number().optional(),
});

const step3Schema = z.object({
  managerId: z.number().optional().nullable(),
});

interface EmployeeWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

interface WizardData {
  // Step 1: Dados Pessoais
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone: string;
  address: string;
  
  // Step 2: Dados Profissionais
  employeeCode: string;
  departmentId: number | null;
  positionId: number | null;
  hireDate: string;
  salary: string;
  
  // Step 3: Hierarquia
  managerId: number | null;
}

const INITIAL_DATA: WizardData = {
  name: "",
  email: "",
  cpf: "",
  birthDate: "",
  phone: "",
  address: "",
  employeeCode: "",
  departmentId: null,
  positionId: null,
  hireDate: "",
  salary: "",
  managerId: null,
};

const STEPS = [
  { id: 1, title: "Dados Pessoais", icon: User, description: "Informações básicas do funcionário" },
  { id: 2, title: "Dados Profissionais", icon: Briefcase, description: "Cargo, departamento e salário" },
  { id: 3, title: "Hierarquia", icon: Users, description: "Posicionamento organizacional" },
  { id: 4, title: "Revisão", icon: FileCheck, description: "Confirme os dados" },
];

export function EmployeeWizard({ onComplete, onCancel }: EmployeeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<WizardData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries
  const { data: departmentsData } = trpc.departments.list.useQuery();
  const { data: positionsData } = trpc.positions.list.useQuery();
  const { data: employeesData } = trpc.employees.list.useQuery();

  const departments = departmentsData?.departments || [];
  const positions = positionsData?.positions || [];
  const employees = employeesData?.employees || [];

  // Mutation
  const createEmployee = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Funcionário cadastrado com sucesso!");
      onComplete?.();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar funcionário: ${error.message}`);
    },
  });

  const updateField = (field: keyof WizardData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao editar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    setErrors({});
    
    try {
      if (step === 1) {
        step1Schema.parse({
          name: formData.name,
          email: formData.email || "",
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          phone: formData.phone,
          address: formData.address,
        });
      } else if (step === 2) {
        step2Schema.parse({
          employeeCode: formData.employeeCode,
          departmentId: formData.departmentId,
          positionId: formData.positionId,
          hireDate: formData.hireDate,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
        });
      } else if (step === 3) {
        step3Schema.parse({
          managerId: formData.managerId,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    const employeeData = {
      name: formData.name,
      email: formData.email || undefined,
      cpf: formData.cpf || undefined,
      birthDate: formData.birthDate || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      employeeCode: formData.employeeCode,
      departmentId: formData.departmentId!,
      positionId: formData.positionId!,
      hireDate: formData.hireDate,
      salary: formData.salary ? Math.round(parseFloat(formData.salary) * 100) : undefined,
      managerId: formData.managerId || undefined,
      active: true,
    };

    createEmployee.mutate(employeeData);
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cadastro de Funcionário</CardTitle>
          <CardDescription>
            Preencha os dados do novo funcionário em {STEPS.length} etapas
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="pt-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1 flex-1",
                    step.id === currentStep && "text-primary font-medium"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                      step.id < currentStep && "bg-primary border-primary text-primary-foreground",
                      step.id === currentStep && "border-primary text-primary",
                      step.id > currentStep && "border-muted text-muted-foreground"
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs text-center hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {/* Step 1: Dados Pessoais */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Digite o nome completo"
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="email@exemplo.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => updateField("cpf", e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Rua, número, complemento, bairro, cidade - UF"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 2: Dados Profissionais */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Código do Funcionário *</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => updateField("employeeCode", e.target.value)}
                  placeholder="Ex: EMP001"
                  className={errors.employeeCode ? "border-destructive" : ""}
                />
                {errors.employeeCode && <p className="text-sm text-destructive">{errors.employeeCode}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Departamento *</Label>
                  <Select
                    value={formData.departmentId?.toString() || ""}
                    onValueChange={(value) => updateField("departmentId", parseInt(value))}
                  >
                    <SelectTrigger className={errors.departmentId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.departmentId && <p className="text-sm text-destructive">{errors.departmentId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="positionId">Cargo *</Label>
                  <Select
                    value={formData.positionId?.toString() || ""}
                    onValueChange={(value) => updateField("positionId", parseInt(value))}
                  >
                    <SelectTrigger className={errors.positionId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.id} value={pos.id.toString()}>
                          {pos.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.positionId && <p className="text-sm text-destructive">{errors.positionId}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Data de Admissão *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => updateField("hireDate", e.target.value)}
                    className={errors.hireDate ? "border-destructive" : ""}
                  />
                  {errors.hireDate && <p className="text-sm text-destructive">{errors.hireDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salário (R$)</Label>
                  <Input
                    id="salary"
                    type="number"
                    step="0.01"
                    value={formData.salary}
                    onChange={(e) => updateField("salary", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Hierarquia */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="managerId">Gestor Direto</Label>
                <Select
                  value={formData.managerId?.toString() || "none"}
                  onValueChange={(value) => updateField("managerId", value === "none" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o gestor direto (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem gestor direto</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.name} - {emp.position?.title || "Sem cargo"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Defina quem será o supervisor direto deste funcionário na hierarquia organizacional.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Informações Hierárquicas</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Funcionários sem gestor aparecem no topo do organograma</li>
                  <li>• Você pode alterar o gestor posteriormente</li>
                  <li>• O gestor deve estar cadastrado no sistema</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Revisão */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Dados Pessoais</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Nome:</dt>
                      <dd className="font-medium">{formData.name}</dd>
                    </div>
                    {formData.email && (
                      <div>
                        <dt className="text-muted-foreground">Email:</dt>
                        <dd className="font-medium">{formData.email}</dd>
                      </div>
                    )}
                    {formData.cpf && (
                      <div>
                        <dt className="text-muted-foreground">CPF:</dt>
                        <dd className="font-medium">{formData.cpf}</dd>
                      </div>
                    )}
                    {formData.phone && (
                      <div>
                        <dt className="text-muted-foreground">Telefone:</dt>
                        <dd className="font-medium">{formData.phone}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Dados Profissionais</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Código:</dt>
                      <dd className="font-medium">{formData.employeeCode}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Departamento:</dt>
                      <dd className="font-medium">
                        {departments.find(d => d.id === formData.departmentId)?.name || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Cargo:</dt>
                      <dd className="font-medium">
                        {positions.find(p => p.id === formData.positionId)?.title || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Data de Admissão:</dt>
                      <dd className="font-medium">
                        {formData.hireDate ? new Date(formData.hireDate).toLocaleDateString("pt-BR") : "-"}
                      </dd>
                    </div>
                    {formData.salary && (
                      <div>
                        <dt className="text-muted-foreground">Salário:</dt>
                        <dd className="font-medium">
                          R$ {parseFloat(formData.salary).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Hierarquia</h3>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Gestor Direto:</dt>
                      <dd className="font-medium">
                        {formData.managerId
                          ? employees.find(e => e.id === formData.managerId)?.name || "-"
                          : "Sem gestor direto"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length && (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {currentStep === STEPS.length && (
              <Button onClick={handleSubmit} disabled={createEmployee.isPending}>
                {createEmployee.isPending ? "Salvando..." : "Cadastrar Funcionário"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
