import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";

/**
 * Página de Reuniões de Calibração
 * Permite agendar e gerenciar reuniões de calibração de avaliações
 */
export default function CalibrationMeetings() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reuniões de Calibração</h1>
          <p className="text-gray-600 mt-1">
            Agende e gerencie reuniões para calibração de avaliações de desempenho
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reuniões Agendadas</CardTitle>
          <CardDescription>Gerencie todas as reuniões de calibração</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma reunião agendada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira reunião de calibração
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reunião
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
