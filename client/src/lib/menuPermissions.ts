/**
 * Sistema de permissões para itens de menu baseado em roles
 */

type UserRole = "admin" | "rh" | "gestor" | "colaborador";

interface MenuItem {
  path?: string;
  label: string;
  icon: any;
  isSection?: boolean;
  children?: MenuItem[];
  allowedRoles?: UserRole[];
}

/**
 * Define quais roles têm acesso a cada rota
 * Se não especificado, a rota é acessível a todos os usuários autenticados
 */
const routePermissions: Record<string, UserRole[]> = {
  // Admin apenas
  "/admin/hierarquia": ["admin"],
  "/admin/calibracao-diretoria": ["admin", "rh"],
  "/admin/email-metrics": ["admin"],
  "/admin/emails": ["admin"],
  "/admin/scheduled-reports": ["admin"],
  "/admin/report-builder": ["admin", "rh"],
  "/admin/report-analytics": ["admin", "rh"],
  "/admin/import-uisa": ["admin"],
  "/admin/audit-log": ["admin"],
  "/admin/historico-senhas": ["admin"],
  "/admin/gerenciar-senhas-lideres": ["admin"],
  "/admin/templates-avaliacao": ["admin", "rh"],
  "/admin/notificacoes-analytics": ["admin"],
  "/admin/gestao-aprovadores": ["admin", "rh"],
  "/admin/bonus-workflows": ["admin", "rh"],
  
  // RH e Admin
  "/dashboard-executivo": ["admin", "rh"],
  "/analytics": ["admin", "rh", "gestor"],
  "/analytics/avancado": ["admin", "rh"],
  "/funcionarios": ["admin", "rh", "gestor"],
  "/funcionarios-ativos": ["admin", "rh", "gestor"],
  "/departamentos": ["admin", "rh"],
  "/centros-custos": ["admin", "rh"],
  "/descricao-cargos": ["admin", "rh", "gestor"],
  "/descricao-cargos-uisa": ["admin", "rh"],
  "/importacao-ponto": ["admin", "rh"],
  "/discrepancias": ["admin", "rh", "gestor"],
  "/alertas": ["admin", "rh", "gestor"],
  "/relatorios-produtividade": ["admin", "rh", "gestor"],
  "/validacao-lider": ["admin", "rh", "gestor"],
  "/analise-gaps": ["admin", "rh", "gestor"],
  "/importacao-descricoes": ["admin", "rh"],
  "/aprovacoes/dashboard": ["admin", "rh", "gestor"],
  "/aprovacoes/avaliacoes": ["admin", "rh", "gestor"],
  "/bonus": ["admin", "rh"],
  "/previsao-bonus": ["admin", "rh", "gestor"],
  "/aprovacoes/bonus-lote": ["admin", "rh"],
  "/compliance/bonus": ["admin", "rh"],
  "/bonus/auditoria": ["admin", "rh"],
  "/relatorios/bonus": ["admin", "rh", "gestor"],
  "/folha-pagamento/exportar": ["admin", "rh"],
  "/relatorios-executivos": ["admin", "rh"],
  "/benchmarking": ["admin", "rh"],
  "/testes/comparativo": ["admin", "rh", "gestor"],
  "/testes-psicometricos": ["admin", "rh", "gestor"],
  "/pesquisas-pulse": ["admin", "rh", "gestor"],
  
  // Gestores, RH e Admin
  "/metas/corporativas": ["admin", "rh", "gestor"],
  "/metas/corporativas/adesao": ["admin", "rh", "gestor"],
  "/metas-cascata": ["admin", "rh", "gestor"],
  "/performance-integrada": ["admin", "rh", "gestor"],
  "/avaliacoes/configurar": ["admin", "rh", "gestor"],
  "/ciclos/ativos": ["admin", "rh", "gestor"],
  "/calibracao": ["admin", "rh", "gestor"],
  "/nine-box": ["admin", "rh", "gestor"],
  "/nine-box-comparativo": ["admin", "rh", "gestor"],
  "/relatorios/pdi": ["admin", "rh", "gestor"],
  "/sucessao": ["admin", "rh", "gestor"],
  "/mapa-sucessao-uisa": ["admin", "rh", "gestor"],
  "/sucessao-inteligente": ["admin", "rh", "gestor"],
  "/feedback": ["admin", "rh", "gestor"],
  "/aprovacoes/ciclos-avaliacao": ["admin", "rh", "gestor"],
  "/aprovacoes/pdi": ["admin", "rh", "gestor"],
  "/aprovacoes/workflows": ["admin", "rh", "gestor"],
  "/relatorios": ["admin", "rh", "gestor"],
  "/relatorios/ciclos": ["admin", "rh", "gestor"],
  "/configuracoes/smtp": ["admin"],
  
  // Todos os usuários autenticados (não precisa especificar)
  "/": [],
  "/metas": [],
  "/avaliacoes": [],
  "/360-enhanced": [],
  "/pdi": [],
  "/badges": [],
  "/minhas-atividades": [],
  "/aprovacoes/solicitacoes": [],
  "/aprovacoes/bonus": [],
  "/historico": [],
  "/configuracoes": [],
  "/configuracoes/notificacoes": [],
  "/perfil": [],
};

/**
 * Verifica se o usuário tem permissão para acessar uma rota
 */
export function hasRoutePermission(userRole: UserRole | undefined, route: string): boolean {
  if (!userRole) return false;
  
  const allowedRoles = routePermissions[route];
  
  // Se não há restrição definida, permite acesso
  if (!allowedRoles || allowedRoles.length === 0) return true;
  
  // Verifica se o role do usuário está na lista de permitidos
  return allowedRoles.includes(userRole);
}

/**
 * Filtra itens de menu baseado no role do usuário
 */
export function filterMenuItems(menuItems: MenuItem[], userRole: UserRole | undefined): MenuItem[] {
  if (!userRole) return [];
  
  return menuItems.filter(item => {
    // Se é uma seção com filhos
    if (item.isSection && item.children) {
      const filteredChildren = item.children.filter(child => {
        if (!child.path) return true;
        return hasRoutePermission(userRole, child.path);
      });
      
      // Só mostra a seção se tiver pelo menos um filho visível
      if (filteredChildren.length === 0) return false;
      
      // Atualiza os filhos filtrados
      item.children = filteredChildren;
      return true;
    }
    
    // Se é um item simples com path
    if (item.path) {
      return hasRoutePermission(userRole, item.path);
    }
    
    // Se não tem path, mostra
    return true;
  });
}

/**
 * Verifica se o usuário é admin
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return userRole === "admin";
}

/**
 * Verifica se o usuário é RH (admin ou rh)
 */
export function isRH(userRole: UserRole | undefined): boolean {
  return userRole === "admin" || userRole === "rh";
}

/**
 * Verifica se o usuário é gestor (admin, rh ou gestor)
 */
export function isGestor(userRole: UserRole | undefined): boolean {
  return userRole === "admin" || userRole === "rh" || userRole === "gestor";
}
