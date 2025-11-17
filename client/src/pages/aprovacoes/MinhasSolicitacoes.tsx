import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox } from "lucide-react";

export default function MinhasSolicitacoes() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Inbox className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Em desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Página de minhas solicitações em desenvolvimento.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
