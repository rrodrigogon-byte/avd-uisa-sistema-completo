import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading, error, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6 text-center">
          <h1 className="text-3xl font-bold">{APP_TITLE}</h1>
          <div className="bg-card p-6 rounded-lg border">
            <p className="text-lg mb-2">Bem-vindo, {user.name}!</p>
            <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
            <Button onClick={() => logout()} variant="outline">
              Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">{APP_TITLE}</h1>
        <p className="text-muted-foreground">
          Sistema de Avaliação de Desempenho
        </p>
        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            {error}
          </div>
        )}
        <Button
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
          size="lg"
          className="w-full"
        >
          Fazer Login
        </Button>
      </div>
    </div>
  );
}
