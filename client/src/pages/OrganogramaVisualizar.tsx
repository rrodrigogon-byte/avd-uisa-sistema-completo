import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OrganogramaInterativo from "@/components/OrganogramaInterativo";
import { Network } from "lucide-react";

export default function OrganogramaVisualizar() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organograma da Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Visualize a estrutura hierárquica da organização de forma interativa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Organograma Interativo
          </CardTitle>
          <CardDescription>
            Visualização hierárquica com zoom, filtros e busca de colaboradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganogramaInterativo />
        </CardContent>
      </Card>
    </div>
  );
}
