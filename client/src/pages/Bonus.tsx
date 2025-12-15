import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

export default function Bonus() {
  const [, setLocation] = useLocation();
  const { data: programs, isLoading } = trpc.bonus.listPrograms.useQuery();

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Programas de Bônus
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie programas de bonificação
            </p>
          </div>
          <Button onClick={() => setLocation("/bonus/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Programa
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : programs && programs.length > 0 ? (
          <div className="grid gap-4">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/bonus/${program.id}`)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{program.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{program.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge>{program.type}</Badge>
                        <Badge>{program.period}</Badge>
                      </div>
                    </div>
                    <Badge variant={program.status === "ativo" ? "default" : "secondary"}>
                      {program.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum programa de bônus</p>
              <Button onClick={() => setLocation("/bonus/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Programa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
