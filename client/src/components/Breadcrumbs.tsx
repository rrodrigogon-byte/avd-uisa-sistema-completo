import { Link, useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const [location] = useLocation();

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.split("/").filter(Boolean);
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Início", href: "/" },
    ];

    // Mapeamento de rotas para labels legíveis
    const routeLabels: Record<string, string> = {
      // Performance e Metas
      "metas": "Metas",
      "performance-integrada": "Performance Integrada",
      "metas-cascata": "Metas em Cascata",
      "corporativas": "Corporativas",
      "adesao": "Adesão",
      
      // Avaliações
      "avaliacoes": "Avaliações",
      "avaliacao-360": "Avaliação 360°",
      "360-enhanced": "360° Enhanced",
      "calibracao": "Calibração",
      "nine-box": "Nine Box",
      "nine-box-comparativo": "Nine Box Comparativo",
      "configurar": "Configurar",
      "ciclos": "Ciclos",
      "ativos": "Ativos",
      
      // Desenvolvimento
      "pdi": "PDI",
      "pdi-inteligente": "PDI Inteligente",
      "sucessao": "Sucessão",
      "mapa-sucessao": "Mapa de Sucessão",
      "mapa-sucessao-uisa": "Sucessão UISA",
      "sucessao-inteligente": "Sucessão Inteligente",
      "trilhas-desenvolvimento": "Trilhas de Desenvolvimento",
      "testes-psicometricos": "Testes Psicométricos",
      "testes": "Testes",
      "comparativo": "Comparativo",
      "feedback": "Feedback Contínuo",
      "badges": "Conquistas e Badges",
      "pesquisas-pulse": "Pesquisas Pulse",
      
      // Pessoas
      "funcionarios": "Funcionários",
      "funcionarios-ativos": "Funcionários Ativos",
      "departamentos": "Departamentos",
      "centros-custos": "Centros de Custo",
      "descricao-cargos": "Descrição de Cargos",
      "descricao-cargos-uisa": "Descrição UISA",
      "importacao-descricoes": "Importação em Massa",
      
      // Tempo e Produtividade
      "minhas-atividades": "Minhas Atividades",
      "importacao-ponto": "Importar Ponto",
      "discrepancias": "Discrepâncias",
      "validacao-lider": "Validação por Líder",
      "relatorios-produtividade": "Relatórios",
      "alertas": "Alertas",
      "analise-gaps": "Análise de Gaps",
      
      // Aprovações
      "aprovacoes": "Aprovações",
      "dashboard": "Dashboard",
      "solicitacoes": "Minhas Solicitações",
      "ciclos-avaliacao": "Ciclos de Avaliação",
      "workflows": "Workflows",
      
      // Bônus
      "bonus": "Bônus",
      "previsao-bonus": "Previsão",
      "bonus-lote": "Aprovação em Lote",
      "compliance": "Compliance e SLA",
      "auditoria": "Auditoria",
      "folha-pagamento": "Folha de Pagamento",
      "exportar": "Exportar",
      
      // Analytics e Relatórios
      "analytics": "Analytics",
      "analytics-rh": "Analytics de RH",
      "avancado": "Avançado",
      "benchmarking": "Benchmarking",
      "relatorios": "Relatórios",
      "relatorios-executivos": "Relatórios Executivos",
      "dashboard-executivo": "Dashboard Executivo",
      
      // Administração
      "admin": "Administração",
      "usuarios": "Usuários",
      "gestao-aprovadores": "Aprovadores",
      "hierarquia": "Hierarquia",
      "audit-log": "Histórico de Alterações",
      "historico-senhas": "Histórico de Senhas",
      "gerenciar-senhas-lideres": "Gerenciar Senhas Líderes",
      "emails": "Dashboard de Emails",
      "email-metrics": "Métricas de E-mail",
      "import-uisa": "Importar Dados UISA",
      
      // Configurações
      "configuracoes": "Configurações",
      "notificacoes": "Notificações",
      "smtp": "SMTP",
      "scheduled-reports": "Relatórios Agendados",
      "report-builder": "Report Builder",
      "report-analytics": "Analytics (Reports)",
      "templates-avaliacao": "Templates de Avaliação",
      "notificacoes-analytics": "Notificações Analytics",
      
      // Outros
      "historico": "Histórico",
      "novo": "Novo",
    };

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Pular IDs numéricos
      if (/^\d+$/.test(segment)) {
        breadcrumbs.push({
          label: `#${segment}`,
          href: currentPath,
        });
        return;
      }

      // Pular ações como "criar", "editar"
      if (["criar", "editar", "detalhes"].includes(segment)) {
        const actionLabels: Record<string, string> = {
          "criar": "Criar",
          "editar": "Editar",
          "detalhes": "Detalhes",
        };
        breadcrumbs.push({
          label: actionLabels[segment] || segment,
          href: currentPath,
        });
        return;
      }

      breadcrumbs.push({
        label: routeLabels[segment] || segment.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        href: currentPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6 animate-fade-in">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center group">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1.5 text-muted-foreground/50" />}
          {index === 0 && <Home className="h-4 w-4 mr-2 text-primary" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-semibold text-foreground px-2 py-1 bg-accent/50 rounded-md">{crumb.label}</span>
          ) : (
            <Link 
              href={crumb.href} 
              className="hover:text-foreground transition-all duration-200 px-2 py-1 rounded-md hover:bg-accent/30 font-medium"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
