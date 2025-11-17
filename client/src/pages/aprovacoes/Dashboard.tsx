import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Dashboard de Aprovações</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Em desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Dashboard consolidado de aprovações em desenvolvimento.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
