import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Building2, Calendar, Mail, Phone, User, Briefcase, MapPin, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import AVDStepGuard from "@/components/AVDStepGuard";
import AVDProgressBreadcrumbs from "@/components/AVDProgressBreadcrumbs";

/**
 * Passo 1: Dados Pessoais e Profissionais
 * Primeira etapa do processo de avaliação AVD
 */
export default function Passo1DadosPessoais() {
  const { processId } = useParams<{ processId?: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Estado do formulário
  const [formData, setFormData] = useState({
    // Dados Pessoais
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    address: "",
    city: "",
    state: "",
    
    // Dados Profissionais
    employeeCode: "",
    department: "",
    position: "",
    admissionDate: "",
    currentSalary: "",
    workLocation: "",
    
    // Informações Adicionais
    education: "",
    certifications: "",
    languages: "",
    previousExperience: "",
  });

  // Buscar dados do funcionário
  const { data: employeeData, isLoading: loadingEmployee } = trpc.employees.getByUserId.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Buscar dados salvos do processo (se existir)
  const { data: processData } = trpc.avd.getProcessData.useQuery(
    { processId: processId || "", step: 1 },
    { enabled: !!processId }
  );

  // Preencher formulário com dados existentes
  useEffect(() => {
    if (employeeData) {
      setFormData(prev => ({
        ...prev,
        fullName: employeeData.name || "",
        email: employeeData.email || "",
        phone: employeeData.phone || "",
        employeeCode: employeeData.employeeCode || "",
        department: employeeData.departmentName || "",
        position: employeeData.positionTitle || "",
        admissionDate: employeeData.admissionDate ? new Date(employeeData.admissionDate).toISOString().split('T')[0] : "",
      }));
    }
  }, [employeeData]);

  useEffect(() => {
    if (processData?.data) {
      setFormData(prev => ({
        ...prev,
        ...processData.data,
      }));
    }
  }, [processData]);

  // Mutation para salvar dados
  const saveDataMutation = trpc.avd.saveProcessData.useMutation({
    onSuccess: (data) => {
      toast.success("Dados salvos com sucesso!");
      // Navegar para o próximo passo
      setLocation(`/avd/processo/passo2/${data.processId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao salvar dados: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações básicas
    if (!formData.fullName || !formData.email) {
      toast.error("Por favor, preencha os campos obrigatórios");
      setIsLoading(false);
      return;
    }

    try {
      await saveDataMutation.mutateAsync({
        processId: processId || undefined,
        step: 1,
        data: formData,
        employeeId: employeeData?.id || 0,
      });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loadingEmployee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const numericProcessId = processId ? parseInt(processId, 10) : 0;

  return (
    <AVDStepGuard currentStep={1} processId={numericProcessId}>
      <AVDProgressBreadcrumbs 
        currentStep={1} 
        completedSteps={[]} 
        processId={numericProcessId}
      />
      
      <div className="container max-w-5xl py-8">

      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Passo 1: Dados Pessoais e Profissionais</h1>
        <p className="text-muted-foreground">
          Confirme e complete suas informações pessoais e profissionais para iniciar o processo de avaliação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
            <CardDescription>
              Informações básicas sobre você
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seu.email@empresa.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Rua, número, complemento"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Sua cidade"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Dados Profissionais
            </CardTitle>
            <CardDescription>
              Informações sobre sua posição na empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCode">Código do Funcionário</Label>
                <Input
                  id="employeeCode"
                  value={formData.employeeCode}
                  onChange={(e) => handleChange("employeeCode", e.target.value)}
                  placeholder="Código"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admissionDate">Data de Admissão</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => handleChange("admissionDate", e.target.value)}
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    placeholder="Seu departamento"
                    className="pl-10"
                    disabled
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                  placeholder="Seu cargo"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workLocation">Local de Trabalho</Label>
                <Input
                  id="workLocation"
                  value={formData.workLocation}
                  onChange={(e) => handleChange("workLocation", e.target.value)}
                  placeholder="Escritório, remoto, híbrido..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Informações Adicionais
            </CardTitle>
            <CardDescription>
              Dados complementares sobre sua formação e experiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="education">Formação Acadêmica</Label>
              <Textarea
                id="education"
                value={formData.education}
                onChange={(e) => handleChange("education", e.target.value)}
                placeholder="Ex: Graduação em Administração, MBA em Gestão..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certifications">Certificações</Label>
              <Textarea
                id="certifications"
                value={formData.certifications}
                onChange={(e) => handleChange("certifications", e.target.value)}
                placeholder="Ex: PMP, SCRUM Master, Six Sigma..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="languages">Idiomas</Label>
              <Input
                id="languages"
                value={formData.languages}
                onChange={(e) => handleChange("languages", e.target.value)}
                placeholder="Ex: Português (nativo), Inglês (fluente), Espanhol (intermediário)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousExperience">Experiência Anterior Relevante</Label>
              <Textarea
                id="previousExperience"
                value={formData.previousExperience}
                onChange={(e) => handleChange("previousExperience", e.target.value)}
                placeholder="Descreva brevemente suas experiências profissionais anteriores relevantes..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="min-w-[200px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                Salvar e Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
    </AVDStepGuard>
  );
}
