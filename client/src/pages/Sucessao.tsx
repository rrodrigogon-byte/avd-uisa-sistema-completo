import { useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, TrendingUp, AlertCircle, GitBranch, User, Crown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

/**
 * Página de Mapa de Sucessão
 * Organograma interativo com ReactFlow mostrando titular → sucessores
 */

// Componente customizado para nós do organograma
const CustomNode = ({ data }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 shadow-md bg-background min-w-[200px] ${
      data.type === "titular" ? "border-primary" : "border-muted-foreground/30"
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {data.type === "titular" ? (
          <Crown className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
      <p className="text-xs text-muted-foreground">{data.position}</p>
      {data.readiness && (
        <Badge variant="outline" className="mt-2 text-xs">
          Prontidão: {data.readiness}
        </Badge>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export default function Sucessao() {
  const { data: plans, isLoading } = trpc.successionPlans.list.useQuery();

  // Gerar nós e arestas para o organograma
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!plans || plans.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 0;

    plans.forEach((plan: any, planIdx: number) => {
      const planId = `plan-${plan.id}`;
      
      // Nó do cargo (posição crítica)
      nodes.push({
        id: planId,
        type: "custom",
        position: { x: 0, y: yOffset },
        data: {
          label: plan.positionName,
          position: plan.departmentName || "Departamento não especificado",
          type: "position",
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      // Nó do titular atual
      if (plan.currentHolderName) {
        const titularId = `titular-${plan.id}`;
        nodes.push({
          id: titularId,
          type: "custom",
          position: { x: 300, y: yOffset },
          data: {
            label: plan.currentHolderName,
            position: "Titular Atual",
            type: "titular",
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });

        edges.push({
          id: `edge-${planId}-${titularId}`,
          source: planId,
          target: titularId,
          animated: false,
          style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
        });

        // Sucessores
        if (plan.successors && plan.successors.length > 0) {
          plan.successors.forEach((successor: any, idx: number) => {
            const successorId = `successor-${plan.id}-${idx}`;
            const successorY = yOffset + (idx - (plan.successors.length - 1) / 2) * 100;

            nodes.push({
              id: successorId,
              type: "custom",
              position: { x: 600, y: successorY },
              data: {
                label: successor.name,
                position: successor.currentPosition || "Cargo não especificado",
                readiness: successor.readiness,
                type: "successor",
              },
              targetPosition: Position.Left,
            });

            edges.push({
              id: `edge-${titularId}-${successorId}`,
              source: titularId,
              target: successorId,
              animated: true,
              style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1.5 },
              label: `#${idx + 1}`,
            });
          });
        }
      }

      yOffset += 250; // Espaçamento entre planos
    });

    return { nodes, edges };
  }, [plans]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GitBranch className="h-8 w-8" />
              Mapa de Sucessão
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualize o pipeline de talentos para posições críticas
            </p>
          </div>
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Criar Plano de Sucessão
          </Button>
        </div>

        {!plans || plans.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum plano de sucessão encontrado</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Crie planos de sucessão para posições críticas da organização
                </p>
                <Button className="mt-4">Criar Plano de Sucessão</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Organograma Interativo */}
            <Card>
              <CardHeader>
                <CardTitle>Organograma de Sucessão</CardTitle>
                <CardDescription>
                  Visualização hierárquica: Posição → Titular → Sucessores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border rounded-lg bg-muted/10">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    attributionPosition="bottom-left"
                  >
                    <Background />
                    <Controls />
                    <MiniMap
                      nodeColor={(node) => {
                        if (node.data.type === "titular") return "hsl(var(--primary))";
                        if (node.data.type === "successor") return "hsl(var(--muted-foreground))";
                        return "hsl(var(--muted))";
                      }}
                      nodeStrokeWidth={3}
                    />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>

            {/* Resumo dos Planos */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo dos Planos de Sucessão</CardTitle>
                <CardDescription>
                  {plans.length} posição(ões) crítica(s) identificada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan: any) => (
                    <div key={plan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{plan.positionName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Titular: {plan.currentHolderName || "Não especificado"} •{" "}
                          {plan.successors?.length || 0} sucessor(es)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={plan.priority === "alta" ? "destructive" : plan.priority === "media" ? "default" : "secondary"}>
                          {plan.priority}
                        </Badge>
                        <Button variant="outline" size="sm">Ver Detalhes</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
