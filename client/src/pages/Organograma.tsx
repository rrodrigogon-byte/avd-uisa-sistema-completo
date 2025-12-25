import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";
import { OrganogramaContainer } from "@/components/OrganogramaInterativo";

export default function Organograma() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="mb-4">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Organograma Interativo</h1>
          <p className="text-muted-foreground">
            Visualização hierárquica completa da estrutura organizacional com funcionalidade de drag-and-drop
          </p>
        </div>

        {/* Organograma Interativo */}
        <OrganogramaContainer />
      </div>
    </DashboardLayout>
  );
}
