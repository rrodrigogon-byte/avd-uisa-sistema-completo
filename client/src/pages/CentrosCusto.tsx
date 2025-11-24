import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function CentrosCusto() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Centros de Custo</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Em desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Página de gestão de centros de custo em desenvolvimento.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
