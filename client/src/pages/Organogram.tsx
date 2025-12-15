import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Users, Building2, Briefcase, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EmployeeNode {
  id: number;
  fullName: string;
  email: string;
  employeeId: string;
  departmentId: number;
  positionId: number;
  supervisorId: number | null;
  status: string;
  subordinates: EmployeeNode[];
}

function EmployeeCard({ employee, departments, positions, level = 0 }: {
  employee: EmployeeNode;
  departments: any[];
  positions: any[];
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const department = departments?.find(d => d.id === employee.departmentId);
  const position = positions?.find(p => p.id === employee.positionId);
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-2">
        {hasSubordinates && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 mt-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
        
        <Card className={`flex-1 ${!hasSubordinates ? 'ml-10' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{employee.fullName}</h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    <Briefcase className="h-3 w-3" />
                    {position?.title || "N/A"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                    <Building2 className="h-3 w-3" />
                    {department?.name || "N/A"}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    ID: {employee.employeeId}
                  </span>
                </div>
              </div>
              
              {hasSubordinates && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium">
                  <Users className="h-3 w-3" />
                  {employee.subordinates.length}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subordinates */}
      {hasSubordinates && isExpanded && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-muted pl-4">
          {employee.subordinates.map((subordinate) => (
            <EmployeeCard
              key={subordinate.id}
              employee={subordinate}
              departments={departments}
              positions={positions}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Organogram() {
  const { isAuthenticated } = useAuth();
  
  // Queries
  const { data: hierarchy, isLoading } = trpc.employee.getOrganizationHierarchy.useQuery();
  const { data: departments } = trpc.department.list.useQuery();
  const { data: positions } = trpc.position.list.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Faça login para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organograma</h1>
        <p className="text-muted-foreground">
          Visualização hierárquica da organização
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estrutura Organizacional
          </CardTitle>
          <CardDescription>
            Hierarquia de funcionários e suas relações de supervisão
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : hierarchy && hierarchy.length > 0 ? (
            <div className="space-y-4">
              {hierarchy.map((employee: EmployeeNode) => (
                <EmployeeCard
                  key={employee.id}
                  employee={employee}
                  departments={departments || []}
                  positions={positions || []}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma estrutura hierárquica encontrada
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Cadastre funcionários e defina seus supervisores para visualizar o organograma
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">Cargo do funcionário</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              <span className="text-muted-foreground">Departamento</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Número de subordinados diretos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
