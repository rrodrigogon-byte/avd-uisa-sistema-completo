import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function OrganogramaSimples() {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Buscar funcionários - CORRIGIDO: extrair array do objeto retornado
  const { data: employeesData, isLoading } = trpc.employees.list.useQuery();
  const employees = employeesData?.employees || [];

  // Construir árvore hierárquica
  const buildTree = () => {
    if (!employees || employees.length === 0) return [];

    const employeeMap = new Map();
    employees.forEach((emp: any) => {
      employeeMap.set(emp.id, { ...emp, children: [] });
    });

    const roots: any[] = [];
    employeeMap.forEach((node: any) => {
      if (node.managerId && employeeMap.has(node.managerId)) {
        const parent = employeeMap.get(node.managerId);
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const hierarchyTree = buildTree();

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderNode = (node: any, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    const initials = node.nome
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "??";

    const levelColors = [
      "border-purple-500 bg-purple-50",
      "border-blue-500 bg-blue-50",
      "border-green-500 bg-green-50",
      "border-yellow-500 bg-yellow-50",
      "border-orange-500 bg-orange-50",
      "border-gray-500 bg-gray-50",
    ];

    const colorClass = levelColors[Math.min(level, levelColors.length - 1)];

    return (
      <div key={node.id} className="mb-4">
        <Card className={`w-64 border-2 ${colorClass}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{node.nome}</div>
                {node.cargo && (
                  <div className="text-xs text-muted-foreground truncate">
                    {node.cargo}
                  </div>
                )}
                {node.departamento && (
                  <div className="text-xs text-muted-foreground truncate">
                    {node.departamento}
                  </div>
                )}
                {hasChildren && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    <Users className="h-3 w-3 mr-1" />
                    {node.children.length}
                  </Badge>
                )}
              </div>
              {hasChildren && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleNode(node.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Renderizar filhos se expandido */}
        {isExpanded && hasChildren && (
          <div className="ml-8 mt-2 border-l-2 border-gray-300 pl-4">
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Organograma (Teste Simples)
          </h1>
          <p className="text-muted-foreground mt-2">
            Total de funcionários: {employees.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estrutura Organizacional</CardTitle>
          </CardHeader>
          <CardContent>
            {hierarchyTree.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum funcionário encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {hierarchyTree.map((root) => renderNode(root, 0))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
