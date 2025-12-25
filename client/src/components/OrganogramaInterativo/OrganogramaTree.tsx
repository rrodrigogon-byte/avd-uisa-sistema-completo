import { safeMap } from "@/lib/arrayHelpers";
import OrganogramaCard from "./OrganogramaCard";
import type { Employee } from "./OrganogramaContainer";

interface OrganogramaTreeProps {
  employees: Employee[];
  expandedNodes: Set<number>;
  onToggleNode: (nodeId: number) => void;
  onDrop: (draggedId: number, targetId: number) => void;
  searchTerm: string;
  departmentFilter: string;
  levelFilter: string;
  onSelectEmployee: (employee: Employee) => void;
}

export default function OrganogramaTree({
  employees,
  expandedNodes,
  onToggleNode,
  onDrop,
  searchTerm,
  departmentFilter,
  levelFilter,
  onSelectEmployee,
}: OrganogramaTreeProps) {
  const filterEmployee = (emp: Employee): boolean => {
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesName = emp.name.toLowerCase().includes(search);
      const matchesCode = emp.employeeCode.toLowerCase().includes(search);
      const matchesDept = emp.departmentName?.toLowerCase().includes(search);
      const matchesPosition = emp.positionTitle?.toLowerCase().includes(search);
      
      if (!matchesName && !matchesCode && !matchesDept && !matchesPosition) {
        return false;
      }
    }

    // Filtro de departamento
    if (departmentFilter !== "all" && emp.departmentName !== departmentFilter) {
      return false;
    }

    // Filtro de nível
    if (levelFilter !== "all" && emp.hierarchyLevel !== levelFilter) {
      return false;
    }

    return true;
  };

  const renderEmployee = (emp: Employee, level: number = 0) => {
    const isExpanded = expandedNodes.has(emp.id);
    const hasSubordinates = emp.subordinates && emp.subordinates.length > 0;
    const matchesFilter = filterEmployee(emp);

    if (!matchesFilter && !hasSubordinates) {
      return null;
    }

    return (
      <div key={emp.id} className="flex flex-col">
        <OrganogramaCard
          employee={emp}
          level={level}
          isExpanded={isExpanded}
          onToggle={() => onToggleNode(emp.id)}
          onDrop={onDrop}
          onSelect={() => onSelectEmployee(emp)}
          isHighlighted={matchesFilter && searchTerm !== ""}
        />

        {hasSubordinates && isExpanded && (
          <div className="ml-8 mt-4 space-y-4 border-l-2 border-gray-300 dark:border-gray-700 pl-4">
            {safeMap(emp.subordinates, (subordinate) =>
              renderEmployee(subordinate, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {safeMap(employees, (emp) => renderEmployee(emp, 0))}
    </div>
  );
}
