import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LEVELS = [
  { level: 0, label: "Conselho", color: "bg-purple-500" },
  { level: 1, label: "CEO", color: "bg-blue-500" },
  { level: 2, label: "Diretoria", color: "bg-green-500" },
  { level: 3, label: "Gerência", color: "bg-yellow-500" },
  { level: 4, label: "Coordenação", color: "bg-orange-500" },
  { level: 5, label: "Supervisão", color: "bg-red-500" },
  { level: 6, label: "Operacional", color: "bg-gray-500" },
];

export default function OrganogramaLegend() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Legenda de Níveis Hierárquicos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {LEVELS.map((item) => (
            <div key={item.level} className="flex items-center gap-2">
              <Badge className={`${item.color} text-white`}>
                Nível {item.level + 1}
              </Badge>
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Arraste e solte funcionários para reorganizar a hierarquia. As mudanças serão validadas automaticamente.
        </p>
      </CardContent>
    </Card>
  );
}
