import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  Users, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Configuração do layout hierárquico com dagre
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 200;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction, 
    nodesep: 120, 
    ranksep: 180,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    // Centralizar o nó
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

interface EmployeeNodeData {
  id: number;
  name: string;
  position: string;
  department: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  subordinatesCount?: number;
  isManager?: boolean;
  level?: number;
  location?: string;
}

interface OrganogramaInterativoProps {
  data: {
    nodes: Array<{
      id: number;
      nodeType: 'department' | 'position';
      departmentId?: number;
      positionId?: number;
      parentId?: number | null;
      level: number;
      displayName: string;
      color?: string;
      icon?: string;
      employees?: EmployeeNodeData[];
      employeeCount?: number;
    }>;
  };
  onEmployeeClick?: (employeeId: number) => void;
  onNodeMove?: (nodeId: number, parentId: number | null) => void;
  editable?: boolean;
}

// Componente customizado para nó de funcionário
const EmployeeNode = ({ data }: { data: EmployeeNodeData }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = data.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="w-full h-full p-4 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary hover:scale-105 bg-gradient-to-br from-background to-muted/20">
      <div className="flex flex-col h-full">
        {/* Header com Avatar e Nome */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
            <AvatarImage src={data.photoUrl} alt={data.name} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3 className="font-bold text-base truncate cursor-help">{data.name}</h3>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{data.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {data.employeeCode && (
              <p className="text-xs text-muted-foreground font-mono">#{data.employeeCode}</p>
            )}
            {data.isManager && (
              <Badge variant="default" className="text-xs mt-1">
                👑 Gestor
              </Badge>
            )}
          </div>
        </div>

        {/* Cargo e Departamento */}
        <div className="space-y-2 mb-3 flex-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs bg-primary/5 p-2 rounded cursor-help">
                  <Building2 className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="truncate font-medium">{data.position}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{data.position}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded cursor-help">
                  <Users className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{data.department}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{data.department}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Email e Telefone (quando expandido) */}
          {expanded && (
            <div className="space-y-1 pt-2 border-t animate-in fade-in slide-in-from-top-2">
              {data.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{data.email}</span>
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{data.phone}</span>
                </div>
              )}
              {data.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{data.location}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer com Subordinados e Nível */}
        <div className="mt-auto space-y-2">
          {data.subordinatesCount !== undefined && data.subordinatesCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs h-8 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              <span className="font-medium">{data.subordinatesCount} subordinado(s)</span>
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          )}

          {data.level !== undefined && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <span>Nível Hierárquico</span>
              <Badge variant="outline" className="text-xs">
                {data.level}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const nodeTypes = {
  employee: EmployeeNode,
};

function OrganogramaInterativoFlow({
  data,
  onEmployeeClick,
  onNodeMove,
  editable = false,
}: OrganogramaInterativoProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Converter dados para formato React Flow
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const employeeMap = new Map<number, number>(); // employeeId -> nodeId

    // Processar cada nó da estrutura
    data.nodes.forEach((node) => {
      // Se o nó tem funcionários, criar um nó para cada um
      if (node.employees && node.employees.length > 0) {
        node.employees.forEach((employee, index) => {
          const nodeId = `employee-${employee.id}`;
          
          nodes.push({
            id: nodeId,
            type: 'employee',
            position: { x: 0, y: 0 }, // Será calculado pelo layout
            data: {
              ...employee,
              level: node.level,
            },
          });

          employeeMap.set(employee.id, node.id);

          // Criar edge para o pai (se existir)
          if (node.parentId) {
            // Encontrar o funcionário pai
            const parentNode = data.nodes.find(n => n.id === node.parentId);
            if (parentNode && parentNode.employees && parentNode.employees.length > 0) {
              // Conectar ao primeiro funcionário do nó pai (geralmente o gestor)
              const parentEmployee = parentNode.employees[0];
              edges.push({
                id: `edge-${parentEmployee.id}-${employee.id}`,
                source: `employee-${parentEmployee.id}`,
                target: nodeId,
                type: 'smoothstep',
                animated: false,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  width: 20,
                  height: 20,
                  color: node.color || '#3b82f6',
                },
                style: {
                  strokeWidth: 2,
                  stroke: node.color || '#3b82f6',
                },
              });
            }
          }
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  // Aplicar layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(initialNodes, initialEdges, layoutDirection);
  }, [initialNodes, initialEdges, layoutDirection]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Atualizar nodes quando o layout mudar
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      layoutDirection
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => fitView({ duration: 500, padding: 0.2 }), 100);
  }, [layoutDirection, initialNodes, initialEdges, setNodes, setEdges, fitView]);

  // Filtrar nós por busca, departamento e nível
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const nodeData = node.data as EmployeeNodeData;
      
      // Filtro de busca
      const matchesSearch = searchTerm === '' || 
        nodeData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nodeData.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nodeData.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nodeData.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de departamento
      const matchesDepartment = departmentFilter === 'all' || 
        nodeData.department === departmentFilter;

      // Filtro de nível
      const matchesLevel = levelFilter === 'all' || 
        (nodeData.level !== undefined && nodeData.level.toString() === levelFilter);

      return matchesSearch && matchesDepartment && matchesLevel;
    });
  }, [nodes, searchTerm, departmentFilter, levelFilter]);

  // Extrair departamentos únicos para filtro
  const departments = useMemo(() => {
    const depts = new Set<string>();
    nodes.forEach((node) => {
      const nodeData = node.data as EmployeeNodeData;
      if (nodeData.department) {
        depts.add(nodeData.department);
      }
    });
    return Array.from(depts).sort();
  }, [nodes]);

  // Extrair níveis únicos para filtro
  const levels = useMemo(() => {
    const lvls = new Set<number>();
    nodes.forEach((node) => {
      const nodeData = node.data as EmployeeNodeData;
      if (nodeData.level !== undefined) {
        lvls.add(nodeData.level);
      }
    });
    return Array.from(lvls).sort((a, b) => a - b);
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as EmployeeNodeData;
      if (nodeData.id && onEmployeeClick) {
        onEmployeeClick(nodeData.id);
      }
    },
    [onEmployeeClick]
  );

  const handleFitView = useCallback(() => {
    fitView({ duration: 500, padding: 0.2 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 300 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 300 });
  }, [zoomOut]);

  const handleExport = useCallback(async () => {
    try {
      // Implementar exportação usando html2canvas ou similar
      toast.info('Exportação será implementada em breve');
    } catch (error) {
      toast.error('Erro ao exportar organograma');
    }
  }, []);

  const toggleLayout = useCallback(() => {
    setLayoutDirection((prev) => (prev === 'TB' ? 'LR' : 'TB'));
    toast.success(`Layout alterado para ${layoutDirection === 'TB' ? 'Horizontal' : 'Vertical'}`);
  }, [layoutDirection]);

  return (
    <div className="w-full h-[800px] border-2 rounded-lg bg-gradient-to-br from-background to-muted/20 shadow-xl">
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={true}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <Background color="#94a3b8" gap={16} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const nodeData = node.data as EmployeeNodeData;
            return nodeData.isManager ? '#3b82f6' : '#94a3b8';
          }}
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-background border-2 rounded"
        />

        {/* Painel de Controles */}
        <Panel position="top-left" className="bg-background/95 backdrop-blur-sm p-4 rounded-lg shadow-2xl space-y-3 border-2">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Controles do Organograma
          </h3>

          {/* Busca */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Buscar</label>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome, cargo, código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>

          {/* Filtro de Departamento */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Departamento</label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Nível */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Nível Hierárquico</label>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                {levels.map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    Nível {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Controles de Visualização */}
          <div className="pt-3 border-t space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4 mr-1" />
                Zoom +
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4 mr-1" />
                Zoom -
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={toggleLayout} className="w-full">
              {layoutDirection === 'TB' ? '↔️ Horizontal' : '↕️ Vertical'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleFitView} className="w-full">
              <Maximize className="h-4 w-4 mr-1" />
              Ajustar Tela
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full">
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="pt-3 border-t text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold">{nodes.length} funcionários</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exibindo:</span>
              <span className="font-bold text-primary">{filteredNodes.length}</span>
            </div>
            {departments.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departamentos:</span>
                <span className="font-bold">{departments.length}</span>
              </div>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function OrganogramaInterativo(props: OrganogramaInterativoProps) {
  return (
    <ReactFlowProvider>
      <OrganogramaInterativoFlow {...props} />
    </ReactFlowProvider>
  );
}
