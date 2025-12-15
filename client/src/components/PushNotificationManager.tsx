import { Bell, BellOff, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Badge } from "@/components/ui/badge";

/**
 * Componente para gerenciar notificações push
 * Permite ativar/desativar e testar notificações
 */
export default function PushNotificationManager() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
          {isSubscribed && (
            <Badge variant="default" className="ml-2">
              Ativo
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Receba notificações em tempo real sobre avaliações, metas e feedbacks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            <strong>Status:</strong>{" "}
            {permission === "granted" ? (
              <span className="text-green-600">Permissão concedida</span>
            ) : permission === "denied" ? (
              <span className="text-red-600">Permissão negada</span>
            ) : (
              <span className="text-yellow-600">Permissão não solicitada</span>
            )}
          </div>

          {permission === "denied" && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Você bloqueou as notificações. Para ativá-las, vá nas configurações do navegador
              e permita notificações para este site.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button
              onClick={subscribe}
              disabled={isLoading || permission === "denied"}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? "Ativando..." : "Ativar Notificações"}
            </Button>
          ) : (
            <>
              <Button
                onClick={unsubscribe}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BellOff className="h-4 w-4" />
                {isLoading ? "Desativando..." : "Desativar Notificações"}
              </Button>
              <Button
                onClick={sendTestNotification}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                Enviar Teste
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>📱 Você receberá notificações sobre:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li>Novas avaliações 360° pendentes</li>
            <li>Consenso de avaliação aguardando sua ação</li>
            <li>Metas corporativas sem atualização de progresso</li>
            <li>Feedbacks recebidos</li>
            <li>Aprovações de metas e PDI</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
