import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { FileText, ClipboardList, Bell, BarChart3, ArrowRight, Target, Briefcase, LayoutDashboard } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {APP_TITLE}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Sistema completo de Avaliação de Desempenho com notificações automatizadas, 
              relatórios gerenciais e templates personalizáveis
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Crie e gerencie templates de avaliação reutilizáveis
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <ClipboardList className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Avaliações</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Realize avaliações de desempenho estruturadas
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <Bell className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Notificações</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Receba lembretes automáticos de prazos
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Gere relatórios gerenciais detalhados
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>
                  Entrar no Sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user?.name || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground">
            Acesse as funcionalidades do sistema através do menu abaixo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Link href="/dashboard">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <LayoutDashboard className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>
                  Visão geral e gráficos
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/templates">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Templates</CardTitle>
                <CardDescription>
                  Gerenciar templates de avaliação
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/evaluations">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <ClipboardList className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Avaliações</CardTitle>
                <CardDescription>
                  Minhas avaliações de desempenho
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/notifications">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Bell className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configurações e histórico
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reports">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>
                  Relatórios gerenciais
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/pir">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>PIR</CardTitle>
                <CardDescription>
                  Plano Individual de Resultados
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/job-descriptions">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <Briefcase className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Descrições de Cargo</CardTitle>
                <CardDescription>
                  Consultar descrições UISA
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
