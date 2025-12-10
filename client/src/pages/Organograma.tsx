import { OrganizationalChart } from "@/components/OrganizationalChart";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Organograma() {
  // Buscar todos os funcionários
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery({
    page: 1,
    limit: 10000, // Buscar todos
    search: "",
  });

  // Buscar departamentos
  const { data: departments, isLoading: loadingDepartments } =
    trpc.departments.list.useQuery();

  // Buscar cargos
  const { data: positions, isLoading: loadingPositions } =
    trpc.positions.list.useQuery();

  const isLoading = loadingEmployees || loadingDepartments || loadingPositions;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employees?.employees || employees.employees.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Nenhum funcionário cadastrado. Cadastre funcionários para visualizar o
            organograma.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Organograma</h1>
          <p className="text-muted-foreground">
            Visualização hierárquica da estrutura organizacional
          </p>
        </div>

        <OrganizationalChart
          employees={employees.employees}
          departments={departments || []}
          positions={positions || []}
        />
      </div>
    </div>
  );
}
