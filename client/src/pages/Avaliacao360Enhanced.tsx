import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Users } from "lucide-react";

export default function Avaliacao360Enhanced() {
  const stages = [
    { name: "Autoavaliação", status: "concluida", count: "100%" },
    { name: "Avaliação do Gestor", status: "concluida", count: "95%" },
    { name: "Avaliação de Pares", status: "em_andamento", count: "78%" },
    { name: "Avaliação de Subordinados", status: "em_andamento", count: "65%" },
    { name: "Consenso", status: "pendente", count: "0%" },
    { name: "Calibração", status: "pendente", count: "0%" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">360° Enhanced</h1>
          <p className="text-muted-foreground mt-2">
            Avaliação 360° aprimorada com consenso e calibração
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Etapas da Avaliação 360°</CardTitle>
            <CardDescription>Acompanhe o progresso de cada etapa do ciclo de avaliação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stages.map((stage, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {stage.status === "concluida" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : stage.status === "em_andamento" ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <Users className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {stage.count} de conclusão
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      stage.status === "concluida" ? "default" :
                      stage.status === "em_andamento" ? "secondary" : "outline"
                    }
                  >
                    {stage.status === "concluida" ? "Concluída" :
                     stage.status === "em_andamento" ? "Em Andamento" : "Pendente"}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <Button>Iniciar Consenso</Button>
              <Button variant="outline">Iniciar Calibração</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
