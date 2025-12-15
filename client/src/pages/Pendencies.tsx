import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle } from "lucide-react";

export default function Pendencies() {
  const { data: pendencies, isLoading } = trpc.pendency.list.useQuery();

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertCircle className="h-8 w-8" />
              Pendências
            </h1>
            <p className="text-muted-foreground mt-2">
              Acompanhe suas pendências e prazos
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : pendencies && pendencies.length > 0 ? (
          <div className="grid gap-4">
            {pendencies.map((pendency) => (
              <Card key={pendency.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{pendency.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{pendency.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge>{pendency.type}</Badge>
                        <Badge variant={pendency.priority === "urgente" ? "destructive" : "default"}>
                          {pendency.priority}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={pendency.status === "pendente" ? "destructive" : "outline"}>
                      {pendency.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhuma pendência</p>
              <p className="text-sm text-muted-foreground">Você está em dia!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
