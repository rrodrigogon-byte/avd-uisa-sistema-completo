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
import { BarChart3, FileText, Goal, LayoutDashboard, LogOut, PanelLeft, Settings, Target, TrendingUp, User as UserIcon, Users, History as HistoryIcon, ChevronDown, ChevronRight, Activity, RefreshCw, Star, Scale, Grid3x3, GraduationCap, Lightbulb, GitBranch, CheckSquare, UsersRound, Building2, DollarSign, Workflow, Gift, Inbox, BarChart, Brain, Mail, FileSearch, MessageSquare, Trophy, Calendar, Clock, CheckCircle, AlertTriangle, Upload, Search, UserCheck, Gauge, Award, BookOpen, Briefcase, ClipboardList, Timer, UserCog, Shield, PieChart, LineChart, Zap, UserPlus, Edit3, ListTodo, AlertCircle, Home, Sparkles, Users2, TrendingDown, FileBarChart, Database, Bell, Megaphone, FlaskConical } from "lucide-react";
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
import { trpc } from "@/lib/trpc";

// Componente de seção com submenu
function MenuSection({ item, location, setLocation, badgeCounts }: { item: any; location: string; setLocation: (path: string) => void; badgeCounts?: Record<string, number> }) {
  const [isOpen, setIsOpen] = useState(true);
  const hasActiveChild = item.children?.some((child: any) => location === child.path);
  
  return (
    <div className="space-y-1">
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setIsOpen(!isOpen)}
          className={`h-11 transition-all duration-200 font-semibold group hover:bg-accent/60 rounded-lg ${
            hasActiveChild ? 'bg-accent/40 text-primary shadow-sm' : ''
          }`}
        >
          <item.icon className={`h-5 w-5 transition-all duration-200 ${
            hasActiveChild ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
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
                className={`h-10 transition-all duration-200 font-normal text-sm group relative rounded-md ${
                  isActive 
                    ? 'bg-primary/15 text-primary font-semibold border-l-3 border-primary shadow-sm' 
                    : 'hover:bg-accent/60 hover:translate-x-1.5 hover:shadow-sm'
                }`}
              >
                <child.icon className={`h-4 w-4 transition-all duration-200 ${
                  isActive 
                    ? 'text-primary scale-115' 
                    : 'text-muted-foreground group-hover:text-foreground group-hover:scale-110'
                }`} />
                <span className="transition-all duration-200">{child.label}</span>
                {child.badge && badgeCounts && badgeCounts[child.badge] > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                    {badgeCounts[child.badge]}
                  </span>
                )}
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
  // 🏠 INÍCIO
  {
    icon: Home,
    label: "Início",
    isSection: true,
    children: [
      { icon: LayoutDashboard, label: "Dashboard Principal", path: "/" },
      { icon: Gauge, label: "Dashboard Executivo", path: "/dashboard-executivo" },
      { icon: Activity, label: "Visão Integrada", path: "/performance-integrada" },
    ],
  },
  
  // 📋 PROCESSO AVD (5 PASSOS)
  {
    icon: ClipboardList,
    label: "Processo AVD",
    isSection: true,
    children: [
      { icon: UserIcon, label: "Passo 1: Dados Pessoais", path: "/avd/processo/passo1" },
      { icon: Brain, label: "Passo 2: PIR", path: "/avd/processo/passo2" },
      { icon: Award, label: "Passo 3: Competências", path: "/avd/processo/passo3" },
      { icon: TrendingUp, label: "Passo 4: Desempenho", path: "/avd/processo/passo4" },
      { icon: Lightbulb, label: "Passo 5: PDI", path: "/avd/processo/passo5" },
      { icon: BarChart, label: "Acompanhamento", path: "/avd/processo/dashboard" },
    ],
  },
  
  // 🎯 METAS E PERFORMANCE
  {
    icon: Target,
    label: "Metas",
    isSection: true,
    children: [
      { icon: Target, label: "Minhas Metas", path: "/metas" },
      { icon: Building2, label: "Metas Corporativas", path: "/metas/corporativas" },
      { icon: CheckCircle, label: "Adesão de Metas", path: "/metas/corporativas/adesao" },
      { icon: GitBranch, label: "Metas em Cascata", path: "/metas-cascata" },
    ],
  },
  
  // ⭐ AVALIAÇÕES
  {
    icon: Star,
    label: "Avaliações",
    isSection: true,
    children: [
      { icon: Sparkles, label: "360° Enhanced", path: "/360-enhanced" },
      { icon: ClipboardList, label: "Minhas Avaliações", path: "/avaliacoes" },
      { icon: Calendar, label: "Ciclos Ativos", path: "/ciclos/ativos" },
      { icon: Scale, label: "Calibração", path: "/calibracao" },
      { icon: Shield, label: "Calibração Diretoria", path: "/admin/calibracao-diretoria" },
      { icon: Grid3x3, label: "Nine Box", path: "/nine-box" },
      { icon: PieChart, label: "Nine Box Comparativo", path: "/nine-box-comparativo" },
      { icon: Settings, label: "Configurar", path: "/avaliacoes/configurar" },
    ],
  },
  
  // 🎓 DESENVOLVIMENTO
  {
    icon: GraduationCap,
    label: "Desenvolvimento",
    isSection: true,
    children: [
      { icon: Lightbulb, label: "PDI Inteligente", path: "/pdi" },
      { icon: Upload, label: "Importar PDI", path: "/pdi/import" },
      { icon: Target, label: "PIR - Dashboard", path: "/pir/dashboard" },
      { icon: Users, label: "Perfis de Funcionários", path: "/desenvolvimento/funcionarios" },
      { icon: Brain, label: "Testes Psicométricos", path: "/testes-psicometricos" },
      { icon: PieChart, label: "Comparativo de Testes", path: "/testes/comparativo" },
      { icon: Users, label: "Perfis da Equipe", path: "/team-disc-profiles" },
      { icon: MessageSquare, label: "Feedback Contínuo", path: "/feedback" },
      { icon: Trophy, label: "Conquistas", path: "/badges" },
      { icon: Megaphone, label: "Pesquisas Pulse", path: "/pesquisas-pulse" },
    ],
  },
  
  // 🔄 SUCESSÃO
  {
    icon: Users2,
    label: "Sucessão",
    isSection: true,
    children: [
      { icon: GitBranch, label: "Mapa de Sucessão", path: "/sucessao" },
      { icon: TrendingUp, label: "Sucessão UISA", path: "/mapa-sucessao-uisa" },
      { icon: LineChart, label: "Sucessão Inteligente", path: "/sucessao-inteligente" },
    ],
  },
  
  // 👥 PESSOAS
  {
    icon: Users,
    label: "Pessoas",
    isSection: true,
    children: [
      { icon: Users, label: "Funcionários", path: "/funcionarios" },
      { icon: Edit3, label: "Gerenciar", path: "/funcionarios/gerenciar" },
      { icon: UserCheck, label: "Ativos", path: "/funcionarios-ativos" },
      { icon: Building2, label: "Departamentos", path: "/departamentos" },
      { icon: Briefcase, label: "Centros de Custo", path: "/centros-custos" },
      { icon: FileText, label: "Descrição de Cargos", path: "/descricao-cargos" },
      { icon: ClipboardList, label: "Descrição UISA", path: "/descricao-cargos-uisa" },
      { icon: Upload, label: "Importação", path: "/importacao-descricoes" },
    ],
  },
  
  // 🏛️ HIERARQUIA E ORGANOGRAMA
  {
    icon: GitBranch,
    label: "Hierarquia",
    isSection: true,
    children: [
      { icon: GitBranch, label: "Organograma", path: "/organograma" },
      { icon: FileBarChart, label: "Relatórios Hierárquicos", path: "/relatorios/hierarquia" },
    ],
  },
  
  // ⏰ TEMPO E PRODUTIVIDADE
  {
    icon: Clock,
    label: "Tempo",
    isSection: true,
    children: [
      { icon: Clock, label: "Minhas Atividades", path: "/minhas-atividades" },
      { icon: Upload, label: "Importar Ponto", path: "/importacao-ponto" },
      { icon: AlertTriangle, label: "Discrepâncias", path: "/discrepancias" },
      { icon: CheckCircle, label: "Validação Líder", path: "/validacao-lider" },
      { icon: FileSearch, label: "Análise de Gaps", path: "/analise-gaps" },
      { icon: Bell, label: "Alertas", path: "/alertas" },
    ],
  },
  
  // 📋 PENDÊNCIAS
  {
    icon: ListTodo,
    label: "Pendências",
    isSection: true,
    children: [
      { icon: ListTodo, label: "Todas", path: "/pendencias", badge: "pendencias" },
      { icon: Clock, label: "Pendentes", path: "/pendencias?status=pendente", badge: "pendentes" },
      { icon: AlertCircle, label: "Em Andamento", path: "/pendencias?status=em_andamento" },
      { icon: CheckCircle, label: "Concluídas", path: "/pendencias?status=concluida" },
    ],
  },
  
  // ✅ APROVAÇÕES
  {
    icon: CheckSquare,
    label: "Aprovações",
    isSection: true,
    children: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/aprovacoes/dashboard", badge: "aprovacoes" },
      { icon: Inbox, label: "Minhas Solicitações", path: "/aprovacoes/solicitacoes" },
      { icon: CheckSquare, label: "PDIs", path: "/aprovacoes/pdi", badge: "pdi_pendentes" },
      { icon: Star, label: "Avaliações", path: "/aprovacoes/avaliacoes", badge: "avaliacoes_pendentes" },
      { icon: Gift, label: "Bônus", path: "/aprovacoes/bonus", badge: "bonus_pendentes" },
      { icon: Calendar, label: "Ciclos", path: "/aprovacoes/ciclos-avaliacao" },
      { icon: Workflow, label: "Workflows", path: "/aprovacoes/workflows" },
      { icon: Briefcase, label: "Descrições de Cargo", path: "/aprovacoes/cargos" },
    ],
  },
  
  // 🛡️ TESTES DE INTEGRIDADE
  {
    icon: Shield,
    label: "Integridade",
    isSection: true,
    children: [
      { icon: Brain, label: "PIR de Integridade", path: "/pir/integridade" },
      { icon: Shield, label: "Testes Disponíveis", path: "/integridade/testes" },
      { icon: FileSearch, label: "Resultados", path: "/integridade/resultados" },
      { icon: BarChart, label: "Análises", path: "/integridade/analises" },
    ],
  },
  
  // 💰 BÔNUS
  {
    icon: DollarSign,
    label: "Bônus",
    isSection: true,
    children: [
      { icon: DollarSign, label: "Políticas", path: "/bonus" },
      { icon: TrendingUp, label: "Previsão", path: "/previsao-bonus" },
      { icon: CheckSquare, label: "Aprovação Lote", path: "/aprovacoes/bonus-lote" },
      { icon: Workflow, label: "Workflows", path: "/admin/bonus-workflows" },
      { icon: CheckCircle, label: "Compliance", path: "/compliance/bonus" },
      { icon: FileSearch, label: "Auditoria", path: "/bonus/auditoria" },
      { icon: Upload, label: "Exportar Folha", path: "/folha-pagamento/exportar" },
    ],
  },
  
  // 📊 ANALYTICS E RELATÓRIOS
  {
    icon: BarChart3,
    label: "Analytics",
    isSection: true,
    children: [
      { icon: BarChart3, label: "Analytics de RH", path: "/analytics" },
      { icon: TrendingUp, label: "Analytics Avançado", path: "/analytics/avancado" },
      { icon: Scale, label: "Benchmarking", path: "/benchmarking" },
      { icon: BarChart, label: "Relatórios", path: "/relatorios-produtividade" },
      { icon: GitBranch, label: "Testes A/B", path: "/admin/ab-tests" },
      { icon: FlaskConical, label: "Experimentos A/B", path: "/admin/ab-experiments" },
      { icon: Star, label: "Pesquisa NPS", path: "/admin/nps" },
      { icon: Clock, label: "Triggers NPS", path: "/admin/nps/scheduled-triggers" },
      { icon: FileBarChart, label: "Relatório Consolidado", path: "/admin/nps/consolidated-report" },
    ],
  },
  
  // 📄 RELATÓRIOS
  {
    icon: FileBarChart,
    label: "Relatórios",
    isSection: true,
    children: [
      { icon: Sparkles, label: "Relatórios Avançados", path: "/relatorios/avancados" },
      { icon: FileText, label: "Relatórios Gerais", path: "/relatorios" },
      { icon: Gauge, label: "Executivos", path: "/relatorios-executivos" },
      { icon: Calendar, label: "Progresso Ciclos", path: "/relatorios/ciclos" },
      { icon: Lightbulb, label: "PDI", path: "/relatorios/pdi" },
      { icon: DollarSign, label: "Bônus", path: "/relatorios/bonus" },
      { icon: HistoryIcon, label: "Histórico", path: "/historico" },
    ],
  },
  
  // 🔧 ADMINISTRAÇÃO
  {
    icon: Shield,
    label: "Administração",
    isSection: true,
    requiredRole: ["admin", "rh"],
    children: [
      { icon: Users, label: "Usuários", path: "/admin/usuarios" },
      { icon: UserCheck, label: "Aprovadores", path: "/admin/gestao-aprovadores" },
      { icon: GitBranch, label: "Hierarquia", path: "/hierarquia" },
      { icon: FileSearch, label: "Auditoria", path: "/admin/audit-log" },
      { icon: Shield, label: "Histórico Senhas", path: "/admin/historico-senhas" },
      { icon: UserCog, label: "Senhas Líderes", path: "/admin/gerenciar-senhas-lideres" },
      { icon: Mail, label: "Dashboard Emails", path: "/admin/emails" },
      { icon: Mail, label: "Emails Admin/RH", path: "/admin/emails-admin-rh" },
      { icon: LineChart, label: "Métricas Email", path: "/admin/email-metrics" },
      { icon: Upload, label: "Importar UISA", path: "/admin/import-uisa" },
      { icon: Briefcase, label: "Competências por Cargo", path: "/admin/competencias-por-cargo" },
      { icon: Target, label: "Metas Individuais", path: "/admin/metas-individuais" },
      { icon: Scale, label: "Pesos de Avaliação", path: "/admin/pesos-avaliacao" },
      { icon: BarChart3, label: "Benchmark Desempenho", path: "/admin/benchmark-desempenho" },
    ],
  },
  
  // ⚙️ CONFIGURAÇÕES
  {
    icon: Settings,
    label: "Configurações",
    isSection: true,
    children: [
      { icon: Settings, label: "Gerais", path: "/configuracoes" },
      { icon: Bell, label: "Notificações", path: "/configuracoes/notificacoes" },
      { icon: Mail, label: "SMTP", path: "/configuracoes/smtp" },
      { icon: Calendar, label: "Relatórios Agendados", path: "/admin/scheduled-reports" },
      { icon: Database, label: "Report Builder", path: "/admin/report-builder" },
      { icon: TrendingUp, label: "Report Analytics", path: "/admin/report-analytics" },
      { icon: FileText, label: "Templates Avaliação", path: "/admin/templates-avaliacao" },
      { icon: BarChart, label: "Notificações Analytics", path: "/admin/notificacoes-analytics" },
    ],
  },
  
  // 🧪 PILOTO
  {
    icon: FlaskConical,
    label: "Piloto",
    isSection: true,
    requiredRole: ["admin", "rh"],
    children: [
      { icon: FlaskConical, label: "Simulados", path: "/piloto/simulados" },
      { icon: Shield, label: "Alertas de Segurança", path: "/seguranca/alertas" },
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
      defaultOpen={false}
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
  
  // Buscar contagem de pendências para badges
  const { data: pendenciasStats } = trpc.pendencias.countByStatus.useQuery(undefined, {
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
  
  // Calcular badges
  const badgeCounts = {
    pendencias: (pendenciasStats?.pendente || 0) + (pendenciasStats?.em_andamento || 0),
  };
  
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
                  return <MenuSection key={idx} item={item} location={location} setLocation={setLocation} badgeCounts={badgeCounts} />;
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
