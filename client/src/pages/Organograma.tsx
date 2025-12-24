import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";
import { OrganogramaDraggable } from "@/components/OrganogramaDraggable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function Organograma() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-4">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
          <p className="text-muted-foreground">
            Visualização hierárquica da estrutura organizacional
          </p>
        </div>

        {/* Organograma */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
            <CardDescription>
              Visualização multinível com cores por nível hierárquico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganogramaDraggable />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
