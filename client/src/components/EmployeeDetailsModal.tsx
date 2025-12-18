import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { safeMap } from "@/lib/arrayHelpers";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  Building2,
  Users,
  TrendingUp,
  MapPin,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmployeeDetailsModalProps {
  employeeId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionClick?: (action: "promote" | "transfer" | "terminate", employeeId: number) => void;
}

export function EmployeeDetailsModal({
  employeeId,
  open,
  onOpenChange,
  onActionClick,
}: EmployeeDetailsModalProps) {
  const { data: employeeData, isLoading } = trpc.employeesAdvanced.getFullDetails.useQuery(
    { id: employeeId! },
    { enabled: !!employeeId && open }
  );

  if (!employeeId) return null;

  const employee = employeeData?.employee;
  const department = employeeData?.department;
  const position = employeeData?.position;
  const manager = employeeData?.manager;
  const subordinates = employeeData?.subordinates || [];
  const recentMovements = employeeData?.recentMovements || [];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Funcionário</DialogTitle>
          <DialogDescription>
            Informações completas e histórico de movimentações
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !employee ? (
          <div className="text-center py-12 text-muted-foreground">
            Funcionário não encontrado
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header com foto e informações principais */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={employee.photoUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{employee.name}</h3>
                    <p className="text-muted-foreground">
                      {employee.employeeCode}
                    </p>
                  </div>
                  <Badge variant={employee.active ? "default" : "secondary"}>
                    {employee.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  {position && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      {position.title}
                    </div>
                  )}
                  {department && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {department.name}
                    </div>
                  )}
                  {employee.hireDate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Desde {format(new Date(employee.hireDate), "MMM/yyyy", { locale: ptBR })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Ações Rápidas */}
            {employee.active && onActionClick && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick("promote", employee.id)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Promover
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick("transfer", employee.id)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Transferir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onActionClick("terminate", employee.id)}
                >
                  Desligar
                </Button>
              </div>
            )}

            {/* Tabs com informações detalhadas */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="professional">Profissional</TabsTrigger>
                <TabsTrigger value="hierarchy">Hierarquia</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* Tab: Informações Pessoais */}
              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações de Contato</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    {employee.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Telefone</p>
                          <p className="text-sm text-muted-foreground">{employee.phone}</p>
                        </div>
                      </div>
                    )}
                    {employee.address && (
                      <div className="flex items-start gap-3 md:col-span-2">
                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Endereço</p>
                          <p className="text-sm text-muted-foreground">{employee.address}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    {employee.cpf && (
                      <div>
                        <p className="text-sm font-medium">CPF</p>
                        <p className="text-sm text-muted-foreground">{employee.cpf}</p>
                      </div>
                    )}
                    {employee.birthDate && (
                      <div>
                        <p className="text-sm font-medium">Data de Nascimento</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(employee.birthDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Informações Profissionais */}
              <TabsContent value="professional" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cargo e Departamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Cargo</p>
                        <p className="text-sm text-muted-foreground">
                          {position?.title || "Não definido"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Departamento</p>
                        <p className="text-sm text-muted-foreground">
                          {department?.name || "Não definido"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Data de Admissão</p>
                        <p className="text-sm text-muted-foreground">
                          {employee.hireDate
                            ? format(new Date(employee.hireDate), "dd/MM/yyyy", { locale: ptBR })
                            : "Não informada"}
                        </p>
                      </div>
                      {employee.salary && (
                        <div>
                          <p className="text-sm font-medium">Salário</p>
                          <p className="text-sm text-muted-foreground">
                            R$ {(employee.salary / 100).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Hierarquia */}
              <TabsContent value="hierarchy" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Posição Hierárquica</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {manager ? (
                      <div>
                        <p className="text-sm font-medium mb-2">Gestor Direto</p>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Avatar>
                            <AvatarFallback>{getInitials(manager.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{manager.name}</p>
                            <p className="text-sm text-muted-foreground">{manager.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sem gestor direto</p>
                    )}

                    {subordinates.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Subordinados Diretos ({subordinates.length})
                        </p>
                        <div className="space-y-2">
                          {safeMap(subordinates, (sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getInitials(sub.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{sub.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sub.position?.title || "Sem cargo"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Histórico */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Movimentações Recentes</CardTitle>
                    <CardDescription>
                      Últimas 5 mudanças hierárquicas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentMovements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma movimentação registrada
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {safeMap(recentMovements, (movement) => (
                          <div
                            key={movement.id}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{movement.movementType}</p>
                              {movement.reason && (
                                <p className="text-sm text-muted-foreground">{movement.reason}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(movement.effectiveDate), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                            <Badge variant="secondary">{movement.approvalStatus}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
