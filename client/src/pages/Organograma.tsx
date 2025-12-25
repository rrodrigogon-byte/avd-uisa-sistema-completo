import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import BackButton from "@/components/BackButton";
import { OrgChartAdvanced } from "@/components/OrgChartAdvanced";

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
        </div>

        {/* Organograma Avançado com todas as funcionalidades */}
        <OrgChartAdvanced />
      </div>
    </DashboardLayout>
  );
}
