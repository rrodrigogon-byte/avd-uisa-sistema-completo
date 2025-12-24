import DashboardLayout from "@/components/DashboardLayout";
import PushNotificationManager from "@/components/PushNotificationManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

/**
 * Página de Configurações de Notificações
 * Permite gerenciar notificações push e preferências
 */
export default function NotificacoesConfig() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-[#F39200]" />
          <div>
            <h1 className="text-3xl font-bold">Configurações de Notificações</h1>
            <p className="text-muted-foreground">
              Gerencie como você recebe notificações do sistema
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Notificações Push */}
          <PushNotificationManager />

          {/* Preferências de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Em breve você poderá personalizar quais notificações deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-[#F39200] mt-1.5" />
                <div>
                  <strong>Avaliações 360°:</strong> Notificações sobre novas avaliações,
                  consenso pendente e resultados
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-[#F39200] mt-1.5" />
                <div>
                  <strong>Metas:</strong> Alertas sobre metas corporativas, aprovações e
                  prazos próximos
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-[#F39200] mt-1.5" />
                <div>
                  <strong>PDI:</strong> Lembretes de ações de desenvolvimento e marcos
                  importantes
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-[#F39200] mt-1.5" />
                <div>
                  <strong>Feedbacks:</strong> Notificações quando você receber um novo
                  feedback
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações sobre Notificações */}
        <Card>
          <CardHeader>
            <CardTitle>Como funcionam as notificações push?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">🔔 Notificações em tempo real</h3>
              <p className="text-muted-foreground">
                Você receberá notificações instantâneas no navegador, mesmo quando não estiver
                com a aba do sistema aberta. As notificações aparecem na área de notificações
                do seu sistema operacional.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">🔒 Privacidade e segurança</h3>
              <p className="text-muted-foreground">
                Suas notificações são criptografadas e enviadas diretamente para o seu
                dispositivo. Você pode desativar as notificações a qualquer momento.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📱 Suporte multiplataforma</h3>
              <p className="text-muted-foreground">
                As notificações funcionam em navegadores modernos (Chrome, Firefox, Edge,
                Safari) tanto em desktop quanto em dispositivos móveis.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">⚙️ Gerenciamento de dispositivos</h3>
              <p className="text-muted-foreground">
                Você pode ativar notificações em múltiplos dispositivos. Cada dispositivo pode
                ser gerenciado independentemente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
