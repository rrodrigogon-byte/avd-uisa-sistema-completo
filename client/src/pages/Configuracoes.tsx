import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Database, Mail, Building2, Award, Calendar } from "lucide-react";

export default function Configuracoes() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [totvsEnabled, setTotvsEnabled] = useState(false);

  const handleSaveGeneral = () => {
    toast.success("Configurações gerais salvas com sucesso!");
  };

  const handleSaveEmail = () => {
    toast.success("Configurações de e-mail salvas com sucesso!");
  };

  const handleSaveTOTVS = () => {
    toast.success("Configurações TOTVS salvas com sucesso!");
  };

  const handleTestEmail = () => {
    toast.info("Enviando e-mail de teste...");
    setTimeout(() => {
      toast.success("E-mail de teste enviado com sucesso!");
    }, 2000);
  };

  const handleTestTOTVS = () => {
    toast.info("Testando conexão TOTVS...");
    setTimeout(() => {
      toast.success("Conexão TOTVS estabelecida com sucesso!");
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações gerais do sistema AVD UISA
          </p>
        </div>

        <Tabs defaultValue="geral" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="geral">
              <Settings className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="ciclos">
              <Calendar className="h-4 w-4 mr-2" />
              Ciclos
            </TabsTrigger>
            <TabsTrigger value="competencias">
              <Award className="h-4 w-4 mr-2" />
              Competências
            </TabsTrigger>
            <TabsTrigger value="departamentos">
              <Building2 className="h-4 w-4 mr-2" />
              Departamentos
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              E-mail
            </TabsTrigger>
            <TabsTrigger value="totvs">
              <Database className="h-4 w-4 mr-2" />
              TOTVS RM
            </TabsTrigger>
          </TabsList>

          {/* Configurações Gerais */}
          <TabsContent value="geral" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configure os parâmetros gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" defaultValue="UISA - Usina Itamarati S/A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="system-name">Nome do Sistema</Label>
                  <Input id="system-name" defaultValue="Sistema AVD UISA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">E-mail de Suporte</Label>
                  <Input id="support-email" type="email" defaultValue="suporte@uisa.com.br" />
                </div>
                <Button onClick={handleSaveGeneral}>Salvar Configurações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ciclos de Avaliação */}
          <TabsContent value="ciclos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ciclos de Avaliação</CardTitle>
                <CardDescription>
                  Gerencie os ciclos de avaliação de desempenho
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cycle-name">Nome do Ciclo</Label>
                  <Input id="cycle-name" placeholder="Ex: Ciclo 2025" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cycle-start">Data de Início</Label>
                    <Input id="cycle-start" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cycle-end">Data de Término</Label>
                    <Input id="cycle-end" type="date" />
                  </div>
                </div>
                <Button>Criar Novo Ciclo</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competências */}
          <TabsContent value="competencias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Competências</CardTitle>
                <CardDescription>
                  Gerencie as competências avaliadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="competency-name">Nome da Competência</Label>
                  <Input id="competency-name" placeholder="Ex: Liderança" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="competency-desc">Descrição</Label>
                  <Input id="competency-desc" placeholder="Descrição da competência" />
                </div>
                <Button>Adicionar Competência</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departamentos */}
          <TabsContent value="departamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Departamentos</CardTitle>
                <CardDescription>
                  Gerencie os departamentos da organização
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dept-code">Código</Label>
                  <Input id="dept-code" placeholder="Ex: DEPT001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept-name">Nome do Departamento</Label>
                  <Input id="dept-name" placeholder="Ex: Recursos Humanos" />
                </div>
                <Button>Adicionar Departamento</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações de E-mail */}
          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de E-mail</CardTitle>
                <CardDescription>
                  Configure o servidor SMTP para envio de e-mails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Ativar envio automático de notificações
                    </p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>

                {emailEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Servidor SMTP</Label>
                      <Input id="smtp-host" defaultValue="smtp.gmail.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port">Porta</Label>
                        <Input id="smtp-port" defaultValue="587" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-secure">Segurança</Label>
                        <Input id="smtp-secure" defaultValue="TLS" disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">Usuário</Label>
                      <Input id="smtp-user" defaultValue="avd@uisa.com.br" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass">Senha de App</Label>
                      <Input id="smtp-pass" type="password" defaultValue="••••••••••••••••" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEmail}>Salvar Configurações</Button>
                      <Button variant="outline" onClick={handleTestEmail}>
                        Testar Conexão
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configurações TOTVS RM */}
          <TabsContent value="totvs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Integração TOTVS RM</CardTitle>
                <CardDescription>
                  Configure a integração com o sistema TOTVS RM
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar dados automaticamente com TOTVS RM
                    </p>
                  </div>
                  <Switch checked={totvsEnabled} onCheckedChange={setTotvsEnabled} />
                </div>

                {totvsEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="totvs-url">URL da API</Label>
                      <Input id="totvs-url" placeholder="https://api.totvs.com.br/rm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totvs-tenant">Tenant ID</Label>
                      <Input id="totvs-tenant" placeholder="CNPJ da empresa" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totvs-key">App Key</Label>
                      <Input id="totvs-key" type="password" placeholder="Chave de aplicação" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totvs-secret">App Secret</Label>
                      <Input id="totvs-secret" type="password" placeholder="Secret da aplicação" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveTOTVS}>Salvar Configurações</Button>
                      <Button variant="outline" onClick={handleTestTOTVS}>
                        Testar Conexão
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
