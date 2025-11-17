import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow } from "lucide-react";

export default function Workflows() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Workflow className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Workflows</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Em desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Sistema de workflows de aprovação em desenvolvimento.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
