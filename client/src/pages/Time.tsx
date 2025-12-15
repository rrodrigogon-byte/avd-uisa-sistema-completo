import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Clock } from "lucide-react";

export default function Time() {
  const { data: records, isLoading } = trpc.timeRecord.list.useQuery();

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Gestão de Tempo
            </h1>
            <p className="text-muted-foreground mt-2">
              Registros de ponto e banco de horas
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Registrar Ponto
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : records && records.length > 0 ? (
          <div className="grid gap-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">
                        {record.date ? new Date(record.date).toLocaleDateString('pt-BR') : "-"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.totalMinutes ? `${Math.floor(record.totalMinutes / 60)}h ${record.totalMinutes % 60}m` : "Sem registro"}
                      </p>
                    </div>
                    <span className="text-sm">{record.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum registro de ponto</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
