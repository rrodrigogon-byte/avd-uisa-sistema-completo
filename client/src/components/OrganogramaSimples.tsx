import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Users, Loader2, Building2, Search, Filter, Maximize2, Minimize2, Download, FileText } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { trpc } from "@/lib/trpc";

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
const LEVEL_COLORS = [
  { bg: "bg-purple-50 dark:bg-purple-950", border: "border-purple-400", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-500" },
  { bg: "bg-blue-50 dark:bg-blue-950", border: "border-blue-400", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-500" },
  { bg: "bg-green-50 dark:bg-green-950", border: "border-green-400", text: "text-green-700 dark:text-green-300", badge: "bg-green-500" },
  { bg: "bg-orange-50 dark:bg-orange-950", border: "border-orange-400", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-500" },
  { bg: "bg-pink-50 dark:bg-pink-950", border: "border-pink-400", text: "text-pink-700 dark:text-pink-300", badge: "bg-pink-500" },
  { bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-400", text: "text-gray-700 dark:text-gray-300", badge: "bg-gray-500" },
];

function EmployeeCard({ employee, level = 0, onToggle, isExpanded, isHighlighted }: {
  employee: Employee;
  level?: number;
  onToggle?: () => void;
  isExpanded?: boolean;
  isHighlighted?: boolean;
}) {
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[LEVEL_COLORS.length - 1];
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
  
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <Card className={`${colors.bg} border-2 ${colors.border} hover:shadow-lg transition-all ${isHighlighted ? 'ring-4 ring-yellow-400' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={employee.photoUrl || undefined} alt={employee.name} />
            <AvatarFallback className={`${colors.badge} text-white`}>
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold text-sm ${colors.text} truncate`}>
                {employee.name}
              </h3>
              {hasSubordinates && onToggle && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={onToggle}
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
                <span>{employee.subordinates!.length} subordinado{employee.subordinates!.length !== 1 ? 's' : ''}</span>
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

function EmployeeNode({ 
  employee, 
  level = 0, 
  globalExpanded, 
  searchTerm,
  departmentFilter,
  positionFilter 
}: { 
  employee: Employee; 
  level?: number;
  globalExpanded: boolean | null;
  searchTerm: string;
  departmentFilter: string;
  positionFilter: string;
}) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;

  // Aplicar expansão global
  const effectiveExpanded = globalExpanded !== null ? globalExpanded : isExpanded;

  // Verificar se o funcionário corresponde aos filtros
  const matchesSearch = searchTerm === '' || 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesDepartment = departmentFilter === 'all' || 
    employee.departmentName === departmentFilter;
  
  const matchesPosition = positionFilter === 'all' || 
    employee.positionTitle === positionFilter;

  const isHighlighted = searchTerm !== '' && matchesSearch;
  const shouldShow = matchesSearch && matchesDepartment && matchesPosition;

  if (!shouldShow) return null;

  return (
    <div className="flex flex-col items-center">
      <EmployeeCard
        employee={employee}
        level={level}
        onToggle={hasSubordinates ? () => setIsExpanded(!effectiveExpanded) : undefined}
        isExpanded={effectiveExpanded}
        isHighlighted={isHighlighted}
      />
      
      {hasSubordinates && effectiveExpanded && (
        <div className="mt-4 pl-8 border-l-2 border-gray-300 dark:border-gray-700">
          <div className="space-y-4">
            {employee.subordinates!.map((subordinate) => (
              <div key={subordinate.id} className="relative">
                <div className="absolute left-0 top-6 w-8 h-px bg-gray-300 dark:bg-gray-700" />
                <div className="ml-8">
                  <EmployeeNode 
                    employee={subordinate} 
                    level={level + 1}
                    globalExpanded={globalExpanded}
                    searchTerm={searchTerm}
                    departmentFilter={departmentFilter}
                    positionFilter={positionFilter}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrganogramaSimples() {
  const { data, isLoading } = trpc.orgChart.getOrgChart.useQuery({});
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [globalExpanded, setGlobalExpanded] = useState<boolean | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Função para exportar como PNG
  const exportToPNG = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('organograma-container');
      if (!element) {
        alert('Erro: Elemento do organograma não encontrado');
        return;
      }
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.download = `organograma-uisa-${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Erro ao exportar PNG:', error);
      alert('Erro ao exportar organograma como PNG');
    } finally {
      setIsExporting(false);
    }
  };

  // Função para exportar como PDF
  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('organograma-container');
      if (!element) {
        alert('Erro: Elemento do organograma não encontrado');
        return;
      }
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`organograma-uisa-${date}.pdf`);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar organograma como PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Extrair departamentos e cargos únicos
  const { departments, positions } = useMemo(() => {
    if (!data?.tree) return { departments: [], positions: [] };
    
    const depts = new Set<string>();
    const pos = new Set<string>();
    
    const extractData = (employees: Employee[]) => {
      employees.forEach(emp => {
        if (emp.departmentName) depts.add(emp.departmentName);
        if (emp.positionTitle) pos.add(emp.positionTitle);
        if (emp.subordinates) extractData(emp.subordinates);
      });
    };
    
    extractData(data.tree);
    
    return {
      departments: Array.from(depts).sort(),
      positions: Array.from(pos).sort()
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.tree || data.tree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Nenhum organograma encontrado</p>
        <p className="text-sm text-muted-foreground">
          Configure a hierarquia de funcionários para visualizar o organograma
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Organograma Hierárquico</h2>
            <p className="text-muted-foreground">
              Visualização multinível da estrutura organizacional
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {data.totalEmployees} funcionários
          </Badge>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              {positions.map(pos => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalExpanded(true)}
              className="flex-1"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Expandir Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalExpanded(false)}
              className="flex-1"
            >
              <Minimize2 className="h-4 w-4 mr-2" />
              Recolher Todos
            </Button>
          </div>
        </div>

        {/* Botões de Exportação */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPNG}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exportar PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Exportar PDF
          </Button>
        </div>

        {/* Legenda de Cores por Nível */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Legenda de Níveis Hierárquicos</h3>
          <div className="flex flex-wrap gap-3">
            {LEVEL_COLORS.map((color, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color.badge}`} />
                <span className="text-xs">Nível {index + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Organograma */}
      <div id="organograma-container" className="overflow-x-auto pb-4">
        <div className="space-y-6 min-w-max">
          {data.tree.map((employee) => (
            <EmployeeNode 
              key={employee.id} 
              employee={employee} 
              level={0}
              globalExpanded={globalExpanded}
              searchTerm={searchTerm}
              departmentFilter={departmentFilter}
              positionFilter={positionFilter}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
