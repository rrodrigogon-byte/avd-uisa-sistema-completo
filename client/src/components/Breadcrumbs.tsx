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
      "metas": "Metas",
      "avaliacoes": "Avaliações",
      "pdi": "PDI",
      "minhas-atividades": "Minhas Atividades",
      "relatorios-produtividade": "Relatórios de Produtividade",
      "alertas": "Alertas",
      "discrepancias": "Discrepâncias",
      "importacao-ponto": "Importação de Ponto",
      "descricao-cargos-uisa": "Descrição de Cargos UISA",
      "validacao-lider": "Validação do Líder",
      "analise-gaps": "Análise de Gaps",
      "importacao-descricoes": "Importação de Descrições",
      "pesquisas-pulse": "Pesquisas Pulse",
      "dashboard-executivo": "Dashboard Executivo",
      "analytics-rh": "Analytics de RH",
      "performance-integrada": "Performance Integrada",
      "avaliacao-360": "Avaliação 360°",
      "360-enhanced": "360° Enhanced",
      "calibracao": "Calibração",
      "nine-box": "Nine Box",
      "nine-box-comparativo": "Nine Box Comparativo",
      "pdi-inteligente": "PDI Inteligente",
      "mapa-sucessao": "Mapa de Sucessão",
      "trilhas-desenvolvimento": "Trilhas de Desenvolvimento",
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
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {index === 0 && <Home className="h-4 w-4 mr-2" />}
          {index === breadcrumbs.length - 1 ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
