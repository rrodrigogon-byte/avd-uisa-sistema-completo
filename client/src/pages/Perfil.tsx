import { useState } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Bell, Camera, History, Upload } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import FaceRegistration from "@/components/FaceRegistration";

export default function Perfil() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const handleSaveProfile = () => {
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleSaveNotifications = () => {
    toast.success("Preferências de notificação salvas!");
  };

  const handleUploadPhoto = () => {
    toast.info("Funcionalidade de upload em desenvolvimento");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>

        <Tabs defaultValue="dados" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">
              <User className="h-4 w-4 mr-2" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="foto">
              <Camera className="h-4 w-4 mr-2" />
              Foto e Facial
            </TabsTrigger>
            <TabsTrigger value="notificacoes">
              <Bell className="h-4 w-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="historico">
              <History className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* Dados Pessoais */}
          <TabsContent value="dados" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Atualize seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" defaultValue={user?.name || ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Data de Nascimento</Label>
                    <Input id="birthdate" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" defaultValue="Recursos Humanos" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input id="position" defaultValue="Analista de RH" disabled />
                </div>
                <Button onClick={handleSaveProfile}>Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Foto e Reconhecimento Facial */}
          <TabsContent value="foto" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>
                  Atualize sua foto de perfil
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.email ? `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}` : undefined} />
                    <AvatarFallback className="text-2xl">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button onClick={handleUploadPhoto}>
                      <Upload className="h-4 w-4 mr-2" />
                      Fazer Upload
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Formatos aceitos: JPG, PNG (máx. 2MB)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reconhecimento Facial</CardTitle>
                <CardDescription>
                  Configure o login por reconhecimento facial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FaceRegistration />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferências de Notificação */}
          <TabsContent value="notificacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como deseja receber notificações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas importantes por e-mail
                    </p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber notificações em tempo real no sistema
                    </p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Resumo Semanal</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber resumo semanal de atividades
                    </p>
                  </div>
                  <Switch checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Tipos de Notificação</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Novas metas atribuídas</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Avaliações pendentes</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">PDI aprovado/rejeitado</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Prazos próximos</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="font-normal">Feedback recebido</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveNotifications}>Salvar Preferências</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Histórico de Atividades */}
          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atividades</CardTitle>
                <CardDescription>
                  Suas atividades recentes no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Login no sistema", date: "Hoje às 14:30", type: "login" },
                    { action: "Atualização de meta", date: "Ontem às 16:45", type: "meta" },
                    { action: "Avaliação 360° concluída", date: "2 dias atrás", type: "avaliacao" },
                    { action: "PDI criado", date: "3 dias atrás", type: "pdi" },
                    { action: "Perfil atualizado", date: "1 semana atrás", type: "perfil" },
                  ].map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${
                        item.type === 'login' ? 'bg-blue-500' :
                        item.type === 'meta' ? 'bg-green-500' :
                        item.type === 'avaliacao' ? 'bg-purple-500' :
                        item.type === 'pdi' ? 'bg-orange-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
