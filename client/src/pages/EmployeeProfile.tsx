import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  Building2,
  User,
  Users,
  TrendingUp,
} from "lucide-react";

export default function EmployeeProfile() {
  const params = useParams();
  const [, navigate] = useLocation();
  const employeeId = parseInt(params.id as string);

  const { data: employee, isLoading } = trpc.hrEmployees.profile.useQuery({ id: employeeId });
  const { data: positions } = trpc.hrPositions.list.useQuery(undefined);
  const { data: departments } = trpc.departments.list.useQuery(undefined);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ativo: "default",
      afastado: "secondary",
      desligado: "destructive",
    };
    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Funcionário não encontrado</h2>
          <Button onClick={() => navigate("/employees")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Button>
        </div>
      </div>
    );
  }

  const position = positions?.find((p) => p.id === employee.positionId);
  const department = departments?.find((d) => d.id === employee.departmentId);

  return (
    <div className="container mx-auto py-8 px-4">
      <Button variant="ghost" onClick={() => navigate("/employees")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para lista
      </Button>

      {/* Header do Perfil */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={employee.photoUrl || undefined} />
              <AvatarFallback className="text-3xl">{getInitials(employee.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{employee.name}</h1>
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {employee.employeeCode}
                    </code>
                    {getStatusBadge(employee.status || "ativo")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                {position && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{position.title}</span>
                  </div>
                )}
                {department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{department.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="position">Cargo</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        {/* Aba: Informações Pessoais */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>CPF</Label>
                  <p className="text-sm text-muted-foreground">{employee.cpf || "-"}</p>
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(employee.birthDate)}
                  </div>
                </div>
                <div>
                  <Label>Data de Admissão</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(employee.hireDate)}
                  </div>
                </div>
                <div>
                  <Label>Salário</Label>
                  <p className="text-sm text-muted-foreground">
                    {employee.salary ? `R$ ${employee.salary.toLocaleString()}` : "-"}
                  </p>
                </div>
              </div>

              {employee.address && (
                <div>
                  <Label>Endereço</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {employee.address}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Cargo */}
        <TabsContent value="position" className="space-y-6">
          {position ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {position.title}
                </CardTitle>
                <CardDescription>
                  Código: {position.code}
                  {position.level && (
                    <Badge variant="outline" className="ml-2">
                      {position.level}
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {position.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descrição</h4>
                    <p className="text-sm text-muted-foreground">{position.description}</p>
                  </div>
                )}

                {position.mission && (
                  <div>
                    <h4 className="font-semibold mb-2">Missão do Cargo</h4>
                    <p className="text-sm text-muted-foreground">{position.mission}</p>
                  </div>
                )}

                {position.responsibilities && position.responsibilities.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Responsabilidades</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {position.responsibilities.map((resp: string, idx: number) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          {resp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Separator />

                {position.technicalCompetencies && position.technicalCompetencies.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Competências Técnicas</h4>
                    <div className="flex flex-wrap gap-2">
                      {position.technicalCompetencies.map((comp: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {position.behavioralCompetencies &&
                  position.behavioralCompetencies.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Competências Comportamentais</h4>
                      <div className="flex flex-wrap gap-2">
                        {position.behavioralCompetencies.map((comp: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {position.kpis && position.kpis.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      KPIs (Indicadores de Performance)
                    </h4>
                    <div className="space-y-2">
                      {position.kpis.map((kpi: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-primary pl-3">
                          <p className="text-sm font-medium">{kpi.name}</p>
                          <p className="text-sm text-muted-foreground">{kpi.description}</p>
                          {kpi.target && (
                            <p className="text-xs text-muted-foreground">Meta: {kpi.target}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Nenhum cargo atribuído</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba: Hierarquia */}
        <TabsContent value="hierarchy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura Hierárquica</CardTitle>
              <CardDescription>Posição na hierarquia organizacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.manager ? (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gestor Direto
                  </h4>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.manager.photoUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(employee.manager.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{employee.manager.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.manager.employeeCode}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Sem gestor direto atribuído</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Equipe */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Subordinados Diretos
              </CardTitle>
              <CardDescription>
                {employee.subordinates?.length || 0} colaborador(es)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employee.subordinates && employee.subordinates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.subordinates.map((sub: any) => (
                    <Card key={sub.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={sub.photoUrl || undefined} />
                            <AvatarFallback>{getInitials(sub.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-sm text-muted-foreground">{sub.employeeCode}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/employees/${sub.id}`)}
                          >
                            Ver perfil
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Nenhum subordinado direto</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold mb-1">{children}</p>;
}
