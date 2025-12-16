import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Users,
  Search,
  Building2,
  Briefcase,
  Mail,
  Phone,
  ChevronRight,
  UserCircle,
  Network,
  FileText,
  Target,
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  Eye,
  BarChart3,
  Filter,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { toast } from "sonner";

/**
 * Página Meus Subordinados
 * 
 * Permite ao líder visualizar e gerenciar sua equipe baseado na hierarquia TOTVS
 * - Lista de subordinados diretos (coordenador)
 * - Lista de subordinados de gestão
 * - Lista de subordinados de diretoria
 * - Busca e filtros
 * - Ações rápidas (avaliar, ver perfil, etc)
 */

interface Subordinate {
  id: number;
  employeeId: number;
  employeeChapa: string;
  employeeName: string;
  employeeEmail: string | null;
  employeeFunction: string;
  employeeFunctionCode: string | null;
  employeeSection: string;
  employeeSectionCode: string | null;
  coordinatorChapa: string | null;
  coordinatorName: string | null;
  managerChapa: string | null;
  managerName: string | null;
  directorChapa: string | null;
  directorName: string | null;
}

export default function MeusSubordinados() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("diretos");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedSubordinate, setSelectedSubordinate] = useState<Subordinate | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Buscar informações do líder atual
  const { data: leaderInfo, isLoading: loadingLeader } = trpc.hierarchyTotvs.getMyLeaderInfo.useQuery();

  // Buscar todos os subordinados
  const { data: allSubordinates, isLoading: loadingSubordinates } = trpc.hierarchyTotvs.getAllSubordinatesByChapa.useQuery(
    { leaderEmail: user?.email },
    { enabled: !!user?.email }
  );

  // Buscar estatísticas
  const { data: stats } = trpc.hierarchyTotvs.getTotvsStats.useQuery();

  // Buscar seções para filtro
  const { data: sections } = trpc.hierarchyTotvs.listSections.useQuery({ limit: 200 });

  // Filtrar subordinados
  const filterSubordinates = (subordinates: Subordinate[] | undefined) => {
    if (!subordinates) return [];
    
    return subordinates.filter(sub => {
      const matchesSearch = !searchQuery || 
        sub.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.employeeEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.employeeChapa?.includes(searchQuery) ||
        sub.employeeFunction?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSection = selectedSection === "all" || 
        sub.employeeSection === selectedSection;
      
      return matchesSearch && matchesSection;
    });
  };

  const directReports = filterSubordinates(allSubordinates?.directReports);
  const managedReports = filterSubordinates(allSubordinates?.managedReports);
  const directedReports = filterSubordinates(allSubordinates?.directedReports);

  // Obter seções únicas dos subordinados
  const uniqueSections = new Set<string>();
  allSubordinates?.directReports?.forEach(s => s.employeeSection && uniqueSections.add(s.employeeSection));
  allSubordinates?.managedReports?.forEach(s => s.employeeSection && uniqueSections.add(s.employeeSection));
  allSubordinates?.directedReports?.forEach(s => s.employeeSection && uniqueSections.add(s.employeeSection));

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleViewProfile = (subordinate: Subordinate) => {
    setSelectedSubordinate(subordinate);
    setShowDetails(true);
  };

  const SubordinateCard = ({ subordinate }: { subordinate: Subordinate }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewProfile(subordinate)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(subordinate.employeeName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm truncate">{subordinate.employeeName}</h4>
              <Badge variant="outline" className="text-xs">
                {subordinate.employeeChapa}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-1">
              {subordinate.employeeFunction}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{subordinate.employeeSection}</span>
            </div>
            {subordinate.employeeEmail && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate">{subordinate.employeeEmail}</span>
              </div>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  const SubordinateTable = ({ subordinates, title }: { subordinates: Subordinate[], title: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
          <Badge variant="secondary" className="ml-2">{subordinates.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subordinates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum subordinado encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Chapa</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Seção</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subordinates.map((sub) => (
                <TableRow key={sub.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewProfile(sub)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(sub.employeeName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{sub.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{sub.employeeChapa}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.employeeFunction}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.employeeSection}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sub.employeeEmail || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleViewProfile(sub); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Link href={`/funcionario/${sub.employeeId || sub.employeeChapa}`}>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  if (loadingLeader || loadingSubordinates) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!leaderInfo?.isLeader) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground max-w-md">
            Esta página é exclusiva para líderes. Você não possui subordinados cadastrados na hierarquia organizacional.
          </p>
          <Link href="/">
            <Button className="mt-6">Voltar ao Início</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-7 w-7 text-primary" />
              Meus Subordinados
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie sua equipe e acompanhe o desenvolvimento dos colaboradores
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm py-1 px-3">
              <UserCircle className="h-4 w-4 mr-1" />
              {leaderInfo?.employeeName}
            </Badge>
            <Badge className="text-sm py-1 px-3 capitalize">
              {leaderInfo?.hierarchyLevel}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Subordinados Diretos</p>
                  <p className="text-3xl font-bold text-primary">{leaderInfo?.subordinatesCount?.direct || 0}</p>
                </div>
                <Users className="h-10 w-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Equipe de Gestão</p>
                  <p className="text-3xl font-bold text-blue-600">{leaderInfo?.subordinatesCount?.managed || 0}</p>
                </div>
                <Briefcase className="h-10 w-10 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Equipe de Diretoria</p>
                  <p className="text-3xl font-bold text-purple-600">{leaderInfo?.subordinatesCount?.directed || 0}</p>
                </div>
                <Building2 className="h-10 w-10 text-purple-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total da Equipe</p>
                  <p className="text-3xl font-bold text-green-600">{allSubordinates?.total || 0}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, chapa ou função..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por seção" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as seções</SelectItem>
                  {Array.from(uniqueSections).sort().map(section => (
                    <SelectItem key={section} value={section}>{section}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diretos" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Diretos ({directReports.length})
            </TabsTrigger>
            <TabsTrigger value="gestao" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Gestão ({managedReports.length})
            </TabsTrigger>
            <TabsTrigger value="diretoria" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Diretoria ({directedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="diretos" className="mt-6">
            <SubordinateTable subordinates={directReports} title="Subordinados Diretos (Coordenação)" />
          </TabsContent>

          <TabsContent value="gestao" className="mt-6">
            <SubordinateTable subordinates={managedReports} title="Equipe de Gestão" />
          </TabsContent>

          <TabsContent value="diretoria" className="mt-6">
            <SubordinateTable subordinates={directedReports} title="Equipe de Diretoria" />
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhes */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(selectedSubordinate?.employeeName || null)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <span>{selectedSubordinate?.employeeName}</span>
                  <Badge variant="outline" className="ml-2">{selectedSubordinate?.employeeChapa}</Badge>
                </div>
              </DialogTitle>
              <DialogDescription>
                Informações detalhadas do colaborador
              </DialogDescription>
            </DialogHeader>
            
            {selectedSubordinate && (
              <div className="space-y-6 mt-4">
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Função</label>
                    <p className="text-sm">{selectedSubordinate.employeeFunction}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Código Função</label>
                    <p className="text-sm">{selectedSubordinate.employeeFunctionCode || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Seção</label>
                    <p className="text-sm">{selectedSubordinate.employeeSection}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Código Seção</label>
                    <p className="text-sm">{selectedSubordinate.employeeSectionCode || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedSubordinate.employeeEmail || "-"}</p>
                  </div>
                </div>

                {/* Hierarquia */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Cadeia Hierárquica
                  </h4>
                  <div className="space-y-2">
                    {selectedSubordinate.coordinatorName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-24">Coordenador</Badge>
                        <span>{selectedSubordinate.coordinatorName}</span>
                        <span className="text-muted-foreground">({selectedSubordinate.coordinatorChapa})</span>
                      </div>
                    )}
                    {selectedSubordinate.managerName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-24">Gestor</Badge>
                        <span>{selectedSubordinate.managerName}</span>
                        <span className="text-muted-foreground">({selectedSubordinate.managerChapa})</span>
                      </div>
                    )}
                    {selectedSubordinate.directorName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="w-24">Diretor</Badge>
                        <span>{selectedSubordinate.directorName}</span>
                        <span className="text-muted-foreground">({selectedSubordinate.directorChapa})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t pt-4 flex flex-wrap gap-2">
                  <Link href={`/funcionario/${selectedSubordinate.employeeId || selectedSubordinate.employeeChapa}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Perfil Completo
                    </Button>
                  </Link>
                  <Link href={`/avaliacoes?funcionario=${selectedSubordinate.employeeChapa}`}>
                    <Button variant="outline" size="sm">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Avaliações
                    </Button>
                  </Link>
                  <Link href={`/metas?funcionario=${selectedSubordinate.employeeChapa}`}>
                    <Button variant="outline" size="sm">
                      <Target className="h-4 w-4 mr-2" />
                      Metas
                    </Button>
                  </Link>
                  <Link href={`/pdi?funcionario=${selectedSubordinate.employeeChapa}`}>
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      PDI
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
