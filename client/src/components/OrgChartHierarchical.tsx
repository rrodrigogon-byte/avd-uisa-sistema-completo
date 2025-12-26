import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { safeMap, isEmpty } from "@/lib/arrayHelpers";
import { Loader2, Users, Building2, Briefcase, ChevronDown, ChevronRight, MinusCircle, PlusCircle } from "lucide-react";

interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string | null;
  managerId: number | null;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionTitle: string | null;
  photoUrl: string | null;
  active: boolean;
  subordinates?: Employee[];
}

// Cores por nível hierárquico
const LEVEL_COLORS = {
  0: { bg: "bg-purple-100 dark:bg-purple-950", border: "border-purple-500", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-500" },
  1: { bg: "bg-blue-100 dark:bg-blue-950", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-500" },
  2: { bg: "bg-green-100 dark:bg-green-950", border: "border-green-500", text: "text-green-700 dark:text-green-300", badge: "bg-green-500" },
  3: { bg: "bg-orange-100 dark:bg-orange-950", border: "border-orange-500", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-500" },
  4: { bg: "bg-pink-100 dark:bg-pink-950", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300", badge: "bg-pink-500" },
  default: { bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-400", text: "text-gray-700 dark:text-gray-300", badge: "bg-gray-500" },
};

const getLevelColor = (level: number) => {
  return LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS.default;
};

interface EmployeeNodeProps {
  employee: Employee;
  level: number;
  expandedNodes: Set<number>;
  onToggleExpand: (id: number) => void;
}

function EmployeeNode({ employee, level, expandedNodes, onToggleExpand }: EmployeeNodeProps) {
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
  const isExpanded = expandedNodes.has(employee.id);
  const colors = getLevelColor(level);

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col items-center">
      {/* Card do funcionário */}
      <Card className={`w-72 transition-all hover:shadow-xl ${colors.bg} border-2 ${colors.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-white dark:ring-gray-800">
              <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
              <AvatarFallback className={`${colors.badge} text-white font-bold text-lg`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className={`text-base font-bold ${colors.text}`}>
                {employee.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-mono">
                {employee.employeeCode}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {employee.positionTitle && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className={`h-4 w-4 ${colors.text}`} />
              <span className="font-medium truncate">{employee.positionTitle}</span>
            </div>
          )}
          {employee.departmentName && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className={`h-4 w-4 ${colors.text}`} />
              <span className="truncate">{employee.departmentName}</span>
            </div>
          )}
          {employee.email && (
            <div className="text-xs text-muted-foreground truncate">
              {employee.email}
            </div>
          )}
          
          {hasSubordinates && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2 text-sm">
                <Users className={`h-4 w-4 ${colors.text}`} />
                <span className="font-medium">
                  {employee.subordinates!.length} subordinado{employee.subordinates!.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${colors.text} hover:${colors.bg}`}
                onClick={() => onToggleExpand(employee.id)}
              >
                {isExpanded ? (
                  <MinusCircle className="h-5 w-5" />
                ) : (
                  <PlusCircle className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linha conectora vertical */}
      {hasSubordinates && isExpanded && (
        <div className={`w-0.5 h-12 ${colors.badge} my-2`} />
      )}

      {/* Subordinados */}
      {hasSubordinates && isExpanded && (
        <div className="relative">
          {/* Linha horizontal conectando subordinados */}
          {employee.subordinates!.length > 1 && (
            <div
              className={`absolute h-0.5 ${colors.badge}`}
              style={{
                top: 0,
                left: "50%",
                right: "50%",
                width: `${(employee.subordinates!.length - 1) * 320}px`,
                transform: "translateX(-50%)",
              }}
            />
          )}

          <div className="flex gap-6 pt-12">
            {safeMap(employee.subordinates, (sub) => (
              <div key={sub.id} className="flex flex-col items-center">
                {/* Linha vertical para cada subordinado */}
                <div className={`w-0.5 h-12 ${colors.badge} -mt-12`} />
                <EmployeeNode
                  employee={sub}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrgChartHierarchical() {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [autoExpandLevel, setAutoExpandLevel] = useState(2);

  const { data: orgData, isLoading } = trpc.orgChart.getOrgChart.useQuery({});

  // Auto-expandir primeiros níveis
  const handleToggleExpand = (id: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Expandir todos os nós até um determinado nível
  const expandToLevel = (employees: Employee[], currentLevel: number, maxLevel: number, expanded: Set<number>) => {
    employees.forEach((emp) => {
      if (currentLevel < maxLevel && emp.subordinates && emp.subordinates.length > 0) {
        expanded.add(emp.id);
        expandToLevel(emp.subordinates, currentLevel + 1, maxLevel, expanded);
      }
    });
  };

  const handleExpandAll = (level: number) => {
    if (!orgData?.tree) return;
    const expanded = new Set<number>();
    expandToLevel(orgData.tree, 0, level, expanded);
    setExpandedNodes(expanded);
    setAutoExpandLevel(level);
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set());
    setAutoExpandLevel(0);
  };

  // Auto-expandir primeiros 2 níveis na carga inicial
  if (orgData?.tree && expandedNodes.size === 0 && autoExpandLevel > 0) {
    const expanded = new Set<number>();
    expandToLevel(orgData.tree, 0, autoExpandLevel, expanded);
    setExpandedNodes(expanded);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orgData || !orgData.tree || isEmpty(orgData.tree)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg font-medium">
          Nenhum organograma encontrado
        </p>
        <p className="text-sm text-muted-foreground">
          Configure a hierarquia de funcionários para visualizar o organograma
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Organograma Hierárquico</h2>
          <p className="text-muted-foreground mt-1">
            Visualização multinível da estrutura organizacional
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-base px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            {orgData.totalEmployees} funcionários
          </Badge>
        </div>
      </div>

      {/* Controles de expansão */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium mr-2">Expandir até nível:</span>
        {[1, 2, 3, 4, 5].map((level) => (
          <Button
            key={level}
            variant={autoExpandLevel === level ? "default" : "outline"}
            size="sm"
            onClick={() => handleExpandAll(level)}
            className="min-w-[80px]"
          >
            Nível {level}
          </Button>
        ))}
        <Button variant="outline" size="sm" onClick={handleCollapseAll}>
          Recolher Tudo
        </Button>
      </div>

      {/* Legenda de cores */}
      <div className="flex items-center gap-4 flex-wrap p-4 bg-muted/50 rounded-lg">
        <span className="text-sm font-medium">Legenda:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500" />
          <span className="text-sm">Nível 1 (Conselho/CEO)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span className="text-sm">Nível 2 (Diretores)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-sm">Nível 3 (Gerentes)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500" />
          <span className="text-sm">Nível 4 (Coordenadores)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-pink-500" />
          <span className="text-sm">Nível 5 (Supervisores)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-500" />
          <span className="text-sm">Nível 6+</span>
        </div>
      </div>

      {/* Organograma */}
      <div className="overflow-x-auto pb-8">
        <div className="inline-flex gap-8 min-w-full justify-center p-8">
          {safeMap(orgData.tree, (employee) => (
            <EmployeeNode
              key={employee.id}
              employee={employee}
              level={0}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
