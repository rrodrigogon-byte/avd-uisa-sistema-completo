import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Users, Calendar, Award, Building2, FileText } from "lucide-react";
import { useLocation } from "wouter";

export default function Admin() {
  const [, setLocation] = useLocation();

  const adminModules = [
    {
      icon: Users,
      title: "Usuários",
      description: "Gerencie usuários e permissões",
      path: "/admin/users",
    },
    {
      icon: Calendar,
      title: "Ciclos de Avaliação",
      description: "Configure ciclos e períodos",
      path: "/admin/cycles",
    },
    {
      icon: Award,
      title: "Competências",
      description: "Biblioteca de competências",
      path: "/admin/competencies",
    },
    {
      icon: Building2,
      title: "Departamentos",
      description: "Estrutura organizacional",
      path: "/admin/departments",
    },
    {
      icon: FileText,
      title: "Logs do Sistema",
      description: "Auditoria e monitoramento",
      path: "/admin/logs",
    },
    {
      icon: Settings,
      title: "Configurações",
      description: "Configurações gerais do sistema",
      path: "/admin/settings",
    },
  ];

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Administração
            </h1>
            <p className="text-muted-foreground mt-2">
              Configurações e gestão do sistema
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.path}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(module.path)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
