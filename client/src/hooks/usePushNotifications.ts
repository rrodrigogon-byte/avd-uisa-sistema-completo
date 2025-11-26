import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Hook para gerenciar notificações push
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const utils = trpc.useUtils();
  const { data: publicKeyData } = trpc.pushNotifications.getPublicKey.useQuery();
  const { data: subscriptionStatus } = trpc.pushNotifications.hasSubscription.useQuery();
  const subscribeMutation = trpc.pushNotifications.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushNotifications.unsubscribe.useMutation();
  const testNotificationMutation = trpc.pushNotifications.sendTestNotification.useMutation();

  useEffect(() => {
    // Verificar se o navegador suporta notificações push
    if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (subscriptionStatus) {
      setIsSubscribed(subscriptionStatus.hasSubscription);
    }
  }, [subscriptionStatus]);

  /**
   * Registrar service worker
   */
  const registerServiceWorker = async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker não suportado");
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registrado:", registration);
      return registration;
    } catch (error) {
      console.error("Erro ao registrar Service Worker:", error);
      throw error;
    }
  };

  /**
   * Converter chave VAPID para Uint8Array
   */
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  /**
   * Solicitar permissão e inscrever-se para notificações
   */
  const subscribe = async () => {
    if (!isSupported) {
      toast.error("Notificações push não são suportadas neste navegador");
      return false;
    }

    if (!publicKeyData?.publicKey) {
      toast.error("Chave pública não disponível");
      return false;
    }

    setIsLoading(true);

    try {
      // Solicitar permissão
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        toast.error("Permissão de notificação negada");
        setIsLoading(false);
        return false;
      }

      // Registrar service worker
      const registration = await registerServiceWorker();

      // Aguardar service worker estar pronto
      await navigator.serviceWorker.ready;

      // Inscrever-se para push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKeyData.publicKey),
      });

      const subscriptionJSON = subscription.toJSON();

      // Enviar subscription para o backend
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: subscriptionJSON.keys?.p256dh || "",
        auth: subscriptionJSON.keys?.auth || "",
        userAgent: navigator.userAgent,
        deviceType: /mobile/i.test(navigator.userAgent)
          ? "mobile"
          : /tablet/i.test(navigator.userAgent)
          ? "tablet"
          : "desktop",
      });

      setIsSubscribed(true);
      toast.success("Notificações push ativadas com sucesso!");
      utils.pushNotifications.hasSubscription.invalidate();

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("Erro ao inscrever-se para notificações:", error);
      toast.error("Erro ao ativar notificações: " + error.message);
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Cancelar inscrição de notificações
   */
  const unsubscribe = async () => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notificar backend
        await unsubscribeMutation.mutateAsync({
          endpoint: subscription.endpoint,
        });
      }

      setIsSubscribed(false);
      toast.success("Notificações push desativadas");
      utils.pushNotifications.hasSubscription.invalidate();

      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("Erro ao cancelar inscrição:", error);
      toast.error("Erro ao desativar notificações: " + error.message);
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Enviar notificação de teste
   */
  const sendTestNotification = async () => {
    if (!isSubscribed) {
      toast.error("Você precisa ativar as notificações primeiro");
      return;
    }

    try {
      const result = await testNotificationMutation.mutateAsync();

      if (result.success) {
        toast.success(result.message || `${result.successCount} notificações enviadas`);
      } else {
        toast.error(result.message || "Erro ao enviar notificação");
      }
    } catch (error: any) {
      console.error("Erro ao enviar notificação de teste:", error);
      toast.error("Erro ao enviar notificação de teste");
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
