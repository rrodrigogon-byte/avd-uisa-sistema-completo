import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, FileText, Goal, LayoutDashboard, LogOut, PanelLeft, Settings, Target, TrendingUp, User as UserIcon, Users, History as HistoryIcon, ChevronDown, ChevronRight, Activity, RefreshCw, Star, Scale, Grid3x3, GraduationCap, Lightbulb, GitBranch, CheckSquare, UsersRound, Building2, DollarSign, Workflow, Gift, Inbox, BarChart, Brain, Mail, FileSearch, MessageSquare, Trophy, Calendar, Clock, CheckCircle, AlertTriangle, Upload, Search, UserCheck } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import NotificationCenter from "./NotificationCenter";
import { GlobalSearch, useGlobalSearchShortcut } from "./GlobalSearch";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { useDashboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Breadcrumbs } from "./Breadcrumbs";
import NotificationBell from "./NotificationBell";
import { InAppNotifications } from "./InAppNotifications";
import { filterMenuItems } from "@/lib/menuPermissions";

// Componente de seção com submenu
function MenuSection({ item, location, setLocation }: { item: any; location: string; setLocation: (path: string) => void }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasActiveChild = item.children?.some((child: any) => location === child.path);
  
  return (
    <div className="space-y-1">
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 transition-all duration-200 font-medium group hover:bg-accent/50 ${
            hasActiveChild ? 'bg-accent/30 text-primary' : ''
          }`}
        >
          <item.icon className={`h-4 w-4 transition-colors ${
            hasActiveChild ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          }`} />
          <span className="transition-colors">{item.label}</span>
          {isOpen ? 
            <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-200" /> : 
            <ChevronRight className="h-4 w-4 ml-auto transition-transform duration-200" />
          }
        </SidebarMenuButton>
      </SidebarMenuItem>
      <div className={`ml-4 space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {item.children.map((child: any) => {
          const isActive = location === child.path;
          return (
            <SidebarMenuItem key={child.path}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => setLocation(child.path)}
                tooltip={child.label}
                className={`h-9 transition-all duration-200 font-normal text-sm group relative ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' 
                    : 'hover:bg-accent/50 hover:translate-x-1'
                }`}
              >
                <child.icon className={`h-3.5 w-3.5 transition-all duration-200 ${
                  isActive 
                    ? 'text-primary scale-110' 
                    : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                }`} />
                <span className="transition-all duration-200">{child.label}</span>
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </div>
    </div>
  );
}

const menuItems = [
  // 📊 Visão Geral
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BarChart, label: "Dashboard Executivo", path: "/dashboard-executivo" },
  
  // 🎯 Gestão de Performance
  {
    icon: TrendingUp,
    label: "Performance",
    isSection: true,
    children: [
      { icon: Activity, label: "Visão Integrada", path: "/performance-integrada" },
      { icon: Target, label: "Minhas Metas", path: "/metas" },
      { icon: Building2, label: "Metas Corporativas", path: "/metas/corporativas" },
      { icon: CheckCircle, label: "Adesão de Metas", path: "/metas/corporativas/adesao" },
      { icon: GitBranch, label: "Metas em Cascata", path: "/metas-cascata" },
    ],
  },
  
  // 🔄 Avaliações 360°
  {
    icon: RefreshCw,
    label: "Avaliações 360°",
    isSection: true,
    children: [
      { icon: Star, label: "360° Enhanced", path: "/360-enhanced" },
      { icon: RefreshCw, label: "Avaliações", path: "/avaliacoes" },
      { icon: Settings, label: "Configurar", path: "/avaliacoes/configurar" },
      { icon: Calendar, label: "Ciclos Ativos", path: "/ciclos/ativos" },
      { icon: Scale, label: "Calibração", path: "/calibracao" },
      { icon: Scale, label: "Calibração Diretoria", path: "/admin/calibracao-diretoria" },
      { icon: Grid3x3, label: "Nine Box", path: "/nine-box" },
      { icon: BarChart3, label: "Nine Box Comparativo", path: "/nine-box-comparativo" },
    ],
  },
  
  // 🎓 Desenvolvimento e Sucessão
  {
    icon: GraduationCap,
    label: "Desenvolvimento",
    isSection: true,
    children: [
      { icon: Lightbulb, label: "PDI Inteligente", path: "/pdi" },
      { icon: FileText, label: "Relatórios de PDI", path: "/relatorios/pdi" },
      { icon: GitBranch, label: "Mapa de Sucessão", path: "/sucessao" },
      { icon: GitBranch, label: "Sucessão UISA", path: "/mapa-sucessao-uisa" },
      { icon: TrendingUp, label: "Sucessão Inteligente", path: "/sucessao-inteligente" },
      { icon: Brain, label: "Testes Psicométricos", path: "/testes-psicometricos" },
      { icon: BarChart, label: "Comparativo de Testes", path: "/testes/comparativo" },
      { icon: MessageSquare, label: "Feedback Contínuo", path: "/feedback" },
      { icon: Trophy, label: "Conquistas e Badges", path: "/badges" },
      { icon: BarChart3, label: "Pesquisas Pulse", path: "/pesquisas-pulse" },
    ],
  },
  
  // 👥 Gestão de Pessoas
  {
    icon: UsersRound,
    label: "Pessoas",
    isSection: true,
    children: [
      { icon: Users, label: "Funcionários", path: "/funcionarios" },
      { icon: Users, label: "Funcionários Ativos", path: "/funcionarios-ativos" },
      { icon: Building2, label: "Departamentos", path: "/departamentos" },
      { icon: DollarSign, label: "Centros de Custo", path: "/centros-custos" },
      { icon: FileText, label: "Descrição de Cargos", path: "/descricao-cargos" },
      { icon: FileText, label: "Descrição UISA", path: "/descricao-cargos-uisa" },
      { icon: Upload, label: "Importação em Massa", path: "/importacao-descricoes" },
    ],
  },
  
  // ⏰ Gestão de Tempo
  {
    icon: Clock,
    label: "Gestão de Tempo",
    isSection: true,
    children: [
      { icon: Clock, label: "Minhas Atividades", path: "/minhas-atividades" },
      { icon: Upload, label: "Importar Ponto", path: "/importacao-ponto" },
      { icon: AlertTriangle, label: "Discrepâncias", path: "/discrepancias" },
      { icon: CheckCircle, label: "Validação por Líder", path: "/validacao-lider" },
      { icon: BarChart3, label: "Relatórios", path: "/relatorios-produtividade" },
      { icon: AlertTriangle, label: "Alertas", path: "/alertas" },
      { icon: AlertTriangle, label: "Análise de Gaps", path: "/analise-gaps" },
    ],
  },
  
  // ✅ Aprovações
  {
    icon: CheckSquare,
    label: "Aprovações",
    isSection: true,
    children: [
      { icon: BarChart, label: "Dashboard", path: "/aprovacoes/dashboard" },
      { icon: Inbox, label: "Minhas Solicitações", path: "/aprovacoes/solicitacoes" },
      { icon: Calendar, label: "Ciclos de Avaliação", path: "/aprovacoes/ciclos-avaliacao" },
      { icon: CheckSquare, label: "PDIs Pendentes", path: "/aprovacoes/pdi" },
      { icon: Users, label: "Avaliações Pendentes", path: "/aprovacoes/avaliacoes" },
      { icon: Gift, label: "Bônus", path: "/aprovacoes/bonus" },
      { icon: Workflow, label: "Workflows", path: "/aprovacoes/workflows" },
    ],
  },
  
  // 💰 Bônus e Remuneração
  {
    icon: DollarSign,
    label: "Bônus",
    isSection: true,
    children: [
      { icon: DollarSign, label: "Políticas", path: "/bonus" },
      { icon: TrendingUp, label: "Previsão", path: "/previsao-bonus" },
      { icon: CheckSquare, label: "Aprovação em Lote", path: "/aprovacoes/bonus-lote" },
      { icon: Workflow, label: "Workflows", path: "/admin/bonus-workflows" },
      { icon: CheckCircle, label: "Compliance e SLA", path: "/compliance/bonus" },
      { icon: FileSearch, label: "Auditoria", path: "/bonus/auditoria" },
      { icon: FileText, label: "Relatórios", path: "/relatorios/bonus" },
      { icon: Upload, label: "Exportar Folha", path: "/folha-pagamento/exportar" },
    ],
  },
  
  // 📊 Analytics e Relatórios
  {
    icon: BarChart3,
    label: "Analytics",
    isSection: true,
    children: [
      { icon: BarChart3, label: "Analytics de RH", path: "/analytics" },
      { icon: TrendingUp, label: "Analytics Avançado", path: "/analytics/avancado" },
      { icon: Scale, label: "Benchmarking", path: "/benchmarking" },
      { icon: FileText, label: "Relatórios Gerais", path: "/relatorios" },
      { icon: Calendar, label: "Progresso de Ciclos", path: "/relatorios/ciclos" },
      { icon: BarChart3, label: "Relatórios Executivos", path: "/relatorios-executivos" },
    ],
  },
  
  // 📜 Histórico
  { icon: HistoryIcon, label: "Histórico", path: "/historico" },
  
  // 🔧 Administração
  {
    icon: UserIcon,
    label: "Administração",
    isSection: true,
    requiredRole: ["admin", "rh"],
    children: [
      { icon: Users, label: "Gestão de Usuários", path: "/admin/usuarios" },
      { icon: UserCheck, label: "Gestão de Aprovadores", path: "/admin/gestao-aprovadores" },
      { icon: GitBranch, label: "Hierarquia Organizacional", path: "/admin/hierarquia" },
      { icon: FileSearch, label: "Histórico de Alterações", path: "/admin/audit-log" },
      { icon: FileSearch, label: "Histórico de Senhas", path: "/admin/historico-senhas" },
      { icon: Users, label: "Gerenciar Senhas Líderes", path: "/admin/gerenciar-senhas-lideres" },
      { icon: Mail, label: "Dashboard de Emails", path: "/admin/emails" },
      { icon: BarChart, label: "Métricas de E-mail", path: "/admin/email-metrics" },
      { icon: Inbox, label: "Importar Dados UISA", path: "/admin/import-uisa" },
    ],
  },
  
  // ⚙️ Configurações
  {
    icon: Settings,
    label: "Configurações",
    isSection: true,
    children: [
      { icon: Settings, label: "Gerais", path: "/configuracoes" },
      { icon: Settings, label: "Notificações Push", path: "/configuracoes/notificacoes" },
      { icon: Mail, label: "SMTP (Admin)", path: "/configuracoes/smtp" },
      { icon: Calendar, label: "Relatórios Agendados", path: "/admin/scheduled-reports" },
      { icon: BarChart3, label: "Report Builder", path: "/admin/report-builder" },
      { icon: TrendingUp, label: "Analytics (Reports)", path: "/admin/report-analytics" },
      { icon: FileText, label: "Templates de Avaliação", path: "/admin/templates-avaliacao" },
      { icon: Mail, label: "Notificações Analytics", path: "/admin/notificacoes-analytics" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Atalhos de teclado
  useDashboardShortcuts({
    onHome: () => setLocation('/'),
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Filtrar itens de menu baseado no role do usuário
  const filteredMenuItems = user ? filterMenuItems(menuItems, user.role as any) : [];
  
  const activeMenuItem = filteredMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // Ativar atalho de teclado Ctrl+K / Cmd+K
  useGlobalSearchShortcut(() => setSearchOpen(true));

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 pl-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-8 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-8 w-8 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-8 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {filteredMenuItems.map((item, idx) => {
                if (item.isSection && item.children) {
                  return <MenuSection key={idx} item={item} location={location} setLocation={setLocation} />;
                }
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path || idx}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => item.path && setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all duration-200 font-normal group relative ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary' 
                          : 'hover:bg-accent/50 hover:translate-x-1'
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 transition-all duration-200 ${
                          isActive 
                            ? 'text-primary scale-110' 
                            : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                        }`}
                      />
                      <span className="transition-all duration-200">{item.label}</span>
                      {isActive && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setLocation('/perfil')}
                  className="cursor-pointer"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="h-9 w-9"
              >
                <Search className="h-4 w-4" />
              </Button>
              <InAppNotifications />
              <NotificationBell />
              <NotificationCenter />
            </div>
          </div>
        )}
        {!isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <h1 className="text-lg font-semibold">{activeMenuItem?.label ?? APP_TITLE}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSearchOpen(true)}
                className="h-9 gap-2 px-3"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Buscar...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <InAppNotifications />
              <NotificationBell />
              <NotificationCenter />
            </div>
          </div>
        )}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        <ShortcutsHelp />
        <main className="flex-1 p-4">
          <Breadcrumbs />
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
