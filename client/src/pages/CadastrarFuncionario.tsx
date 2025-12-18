import DashboardLayout from "@/components/DashboardLayout";
import { EmployeeWizard } from "@/components/EmployeeWizard";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CadastrarFuncionario() {
  const [, setLocation] = useLocation();

  const handleComplete = () => {
    setLocation("/funcionarios");
  };

  const handleCancel = () => {
    setLocation("/funcionarios");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/funcionarios")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Novo Funcionário
            </h1>
            <p className="text-muted-foreground mt-1">
              Cadastre um novo funcionário no sistema
            </p>
          </div>
        </div>

        <EmployeeWizard
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}
