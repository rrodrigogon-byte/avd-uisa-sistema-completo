import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function Employees() {
  const [, setLocation] = useLocation();
  const { data: employees, isLoading } = trpc.employee.list.useQuery();

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8" />
              Gestão de Pessoas
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie informações de funcionários
            </p>
          </div>
          <Button onClick={() => setLocation("/employees/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Funcionário
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : employees && employees.length > 0 ? (
          <div className="grid gap-4">
            {employees.map((emp) => (
              <Card key={emp.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/employees/${emp.id}`)}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{emp.employeeNumber || `ID: ${emp.id}`}</h3>
                      <p className="text-sm text-muted-foreground">{emp.position || "Sem cargo"}</p>
                      <p className="text-sm text-muted-foreground">{emp.department || "Sem departamento"}</p>
                    </div>
                    <span className="text-sm font-medium">{emp.status}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum funcionário cadastrado</p>
              <Button onClick={() => setLocation("/employees/new")}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Funcionário
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
