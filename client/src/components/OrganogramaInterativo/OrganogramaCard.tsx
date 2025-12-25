import { useDrag, useDrop } from "react-dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Users, GripVertical } from "lucide-react";
import type { Employee } from "./OrganogramaContainer";

const ITEM_TYPE = "EMPLOYEE";

// Cores por nível hierárquico
const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; badge: string }> = {
  0: { bg: "bg-purple-50 dark:bg-purple-950", border: "border-purple-400", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-500" },
  1: { bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-400", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-500" },
  2: { bg: "bg-green-50 dark:bg-green-950", border: "border-green-400", text: "text-green-700 dark:text-green-300", badge: "bg-green-500" },
  3: { bg: "bg-yellow-50 dark:bg-yellow-950", border: "border-yellow-400", text: "text-yellow-700 dark:text-yellow-300", badge: "bg-yellow-500" },
  4: { bg: "bg-orange-50 dark:bg-orange-950", border: "border-orange-400", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-500" },
  5: { bg: "bg-red-50 dark:bg-red-950", border: "border-red-400", text: "text-red-700 dark:text-red-300", badge: "bg-red-500" },
  6: { bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-400", text: "text-gray-700 dark:text-gray-300", badge: "bg-gray-500" },
};

interface OrganogramaCardProps {
  employee: Employee;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
  onDrop: (draggedId: number, targetId: number) => void;
  onSelect: () => void;
  isHighlighted: boolean;
}

export default function OrganogramaCard({
  employee,
  level,
  isExpanded,
  onToggle,
  onDrop,
  onSelect,
  isHighlighted,
}: OrganogramaCardProps) {
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[6];
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Drag source
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: employee.id, name: employee.name },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [employee.id]);

  // Drop target
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    canDrop: (item: { id: number }) => item.id !== employee.id,
    drop: (item: { id: number }) => {
      onDrop(item.id, employee.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [employee.id, onDrop]);

  // Combine refs
  const combinedRef = (node: HTMLDivElement | null) => {
    drag(node);
    drop(node);
  };

  return (
    <Card
      ref={combinedRef}
      className={`${colors.bg} border-2 ${colors.border} hover:shadow-lg transition-all cursor-move ${
        isHighlighted ? "ring-4 ring-yellow-400" : ""
      } ${
        isDragging ? "opacity-50" : ""
      } ${
        isOver && canDrop ? "ring-4 ring-green-400 scale-105" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
            <AvatarFallback className={`${colors.badge} text-white`}>
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-sm ${colors.text} truncate`}>
                {employee.name}
              </h3>
              {hasSubordinates && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-2">
              {employee.employeeCode}
            </p>

            {employee.positionTitle && (
              <p className="text-xs font-medium mb-2 truncate">
                {employee.positionTitle}
              </p>
            )}

            {employee.departmentName && (
              <Badge variant="secondary" className={`text-xs ${colors.badge} text-white`}>
                {employee.departmentName}
              </Badge>
            )}

            {hasSubordinates && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t">
                <Users className="h-3 w-3" />
                <span>
                  {employee.subordinateCount} subordinado{employee.subordinateCount !== 1 ? "s" : ""}
                </span>
                {employee.totalTeamSize !== undefined && employee.totalTeamSize > 0 && (
                  <span className="ml-2">
                    (Time total: {employee.totalTeamSize})
                  </span>
                )}
              </div>
            )}

            <Badge variant="outline" className="text-xs mt-2">
              Nível {level + 1}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
