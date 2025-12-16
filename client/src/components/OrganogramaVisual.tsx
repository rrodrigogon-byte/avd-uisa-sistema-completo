import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Building2, Users } from 'lucide-react';

/**
 * Nó customizado para departamento
 */
function DepartmentNode({ data }: { data: any }) {
  return (
    <Card className="p-4 min-w-[200px] border-2 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          {data.employeeCount !== undefined && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Users className="h-3 w-3" />
              {data.employeeCount} colaboradores
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Nó customizado para cargo
 */
function PositionNode({ data }: { data: any }) {
  return (
    <Card className="p-3 min-w-[180px] border hover:shadow-lg transition-shadow">
      <div className="space-y-2">
        <div className="font-medium text-sm">{data.label}</div>
        {data.employees && data.employees.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.employees.slice(0, 3).map((emp: any) => (
              <div key={emp.id} className="flex items-center gap-1 text-xs">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={emp.photoUrl} />
                  <AvatarFallback className="text-[10px]">
                    {emp.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[80px] truncate">{emp.name}</span>
              </div>
            ))}
            {data.employees.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{data.employees.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Nó customizado para colaborador individual
 */
function EmployeeNode({ data }: { data: any }) {
  return (
    <Card className="p-3 min-w-[160px] border hover:shadow-lg transition-shadow cursor-move">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={data.photoUrl} />
          <AvatarFallback>
            {data.label?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.label}</div>
          {data.position && (
            <div className="text-xs text-muted-foreground truncate">
              {data.position}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

const nodeTypes: NodeTypes = {
  department: DepartmentNode,
  position: PositionNode,
  employee: EmployeeNode,
};

interface OrganogramaVisualProps {
  structure: any[];
  onNodeMove?: (nodeId: number, parentId: number | null) => void;
  onEmployeeMove?: (employeeId: number, newDepartmentId?: number, newPositionId?: number) => void;
}

/**
 * Componente de Organograma Visual com Drag-and-Drop
 * Usa ReactFlow para visualização hierárquica interativa
 */
export default function OrganogramaVisual({
  structure,
  onNodeMove,
  onEmployeeMove,
}: OrganogramaVisualProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Converter estrutura para nós e arestas do ReactFlow
  useEffect(() => {
    if (!structure || structure.length === 0) return;

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Calcular layout hierárquico
    const levelGroups: Record<number, any[]> = {};
    structure.forEach((node) => {
      const level = node.level || 0;
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(node);
    });

    const levelHeight = 150;
    const nodeWidth = 250;
    const horizontalSpacing = 50;

    // Criar nós
    structure.forEach((node) => {
      const level = node.level || 0;
      const levelNodes = levelGroups[level];
      const indexInLevel = levelNodes.indexOf(node);
      const totalInLevel = levelNodes.length;

      // Calcular posição
      const x = (indexInLevel - totalInLevel / 2) * (nodeWidth + horizontalSpacing);
      const y = level * levelHeight;

      flowNodes.push({
        id: `node-${node.id}`,
        type: node.nodeType,
        position: { x: node.positionX || x, y: node.positionY || y },
        data: {
          label: node.displayName,
          employeeCount: node.employeeCount,
          employees: node.employees,
          nodeId: node.id,
          departmentId: node.departmentId,
          positionId: node.positionId,
        },
        draggable: true,
      });

      // Criar aresta para o pai
      if (node.parentId) {
        flowEdges.push({
          id: `edge-${node.parentId}-${node.id}`,
          source: `node-${node.parentId}`,
          target: `node-${node.id}`,
          type: 'smoothstep',
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
            stroke: '#94a3b8',
          },
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [structure, setNodes, setEdges]);

  // Callback para quando uma conexão é criada (drag-and-drop)
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));

      // Extrair IDs dos nós
      const sourceId = parseInt(params.source?.replace('node-', '') || '0');
      const targetId = parseInt(params.target?.replace('node-', '') || '0');

      if (onNodeMove && sourceId && targetId) {
        onNodeMove(targetId, sourceId);
      }
    },
    [setEdges, onNodeMove]
  );

  // Callback para quando um nó é arrastado
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeId = parseInt(node.id.replace('node-', ''));
      
      // Aqui você pode implementar lógica para detectar sobre qual nó o item foi solto
      // e chamar onNodeMove ou onEmployeeMove conforme apropriado
      
      console.log('Node dropped:', nodeId, node.position);
    },
    [onNodeMove, onEmployeeMove]
  );

  return (
    <div className="w-full h-[600px] border rounded-lg bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
