import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, FileText, BarChart3, Bell } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12" />}
              </div>
              <CardTitle className="text-2xl">{APP_TITLE}</CardTitle>
              <CardDescription>Sistema de Avaliação de Desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6 text-center">
                Gerencie metas SMART, monitore alertas críticos e exporte relatórios avançados.
              </p>
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                size="lg"
                className="w-full"
              >
                Entrar no Sistema
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />}
              <h1 className="text-2xl font-bold text-gray-900">{APP_TITLE}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Bem-vindo,</p>
              <p className="font-semibold text-gray-900">{user?.name || "Usuário"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Principal</h2>
          <p className="text-gray-600">Acesse as funcionalidades do sistema de avaliação de desempenho</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card: Alertas de Metas Críticas */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/alertas")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Alertas Críticos</CardTitle>
              </div>
              <CardDescription>
                Monitore metas com progresso baixo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Receba notificações em tempo real sobre metas críticas que precisam de atenção imediata.
              </p>
              <Button variant="outline" className="w-full">
                Acessar Dashboard →
              </Button>
            </CardContent>
          </Card>

          {/* Card: Relatórios Agendados */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/relatorios")}>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Relatórios</CardTitle>
              </div>
              <CardDescription>
                Gerencie relatórios agendados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Crie e agende relatórios em PDF, Excel ou CSV com envio automático para stakeholders.
              </p>
              <Button variant="outline" className="w-full">
                Gerenciar Relatórios →
              </Button>
            </CardContent>
          </Card>

          {/* Card: Monitoramento de Metas */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Monitoramento</CardTitle>
              </div>
              <CardDescription>
                Job cron de monitoramento ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Sistema executando monitoramento automático de metas críticas a cada hora.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-medium">Ativo</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex gap-4">
            <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Sobre as Funcionalidades</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ <strong>Job Cron:</strong> Executa a cada hora para monitorar metas críticas (progresso &lt; 20%)</li>
                <li>✓ <strong>Dashboard de Alertas:</strong> Visualize, filtre e resolva alertas em tempo real</li>
                <li>✓ <strong>Exportação Avançada:</strong> Exporte relatórios em PDF, Excel ou CSV com agendamento automático</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
