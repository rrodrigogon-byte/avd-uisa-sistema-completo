import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Maximize2, Minimize2, RefreshCw, Download } from "lucide-react";

interface OrganogramaToolbarProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onRefresh: () => void;
  onExport: () => void;
}

export default function OrganogramaToolbar({
  onExpandAll,
  onCollapseAll,
  onRefresh,
  onExport,
}: OrganogramaToolbarProps) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExpandAll}
              className="flex items-center gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              Expandir Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onCollapseAll}
              className="flex items-center gap-2"
            >
              <Minimize2 className="h-4 w-4" />
              Recolher Todos
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
