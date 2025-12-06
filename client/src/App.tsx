import { Toaster } from "@/components/ui/sonner";
import { SessionTimeout } from "@/components/SessionTimeout";
import { OnboardingTour } from "@/components/OnboardingTour";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import AcompanhamentoAvaliacoes from "@/pages/AcompanhamentoAvaliacoes";
import CriarMetasCiclo from "@/pages/CriarMetasCiclo";
import DashboardAprovacoesCiclos from "@/pages/DashboardAprovacoesCiclos";
import DashboardMetasCiclos from "@/pages/DashboardMetasCiclos";
import AprovacaoCiclos from "@/pages/AprovacaoCiclos";
import RelatoriosPDI from "@/pages/RelatoriosPDI";
import Alertas from "@/pages/Alertas";
import Discrepancias from "./pages/Discrepancias";
import Departamentos from "./pages/Departamentos";
import CentrosCustos from "./pages/CentrosCustos";
import SucessaoInteligente from "./pages/SucessaoInteligente";
import ImportacaoPonto from "@/pages/ImportacaoPonto";
import SecurityDashboard from "@/pages/SecurityDashboard";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Home from "./pages/Home";
import TemplatesAnalytics from "./pages/TemplatesAnalytics";
import DashboardGestor from "./pages/DashboardGestor";
import ConfiguracoesSMTP from "./pages/ConfiguracoesSMTP";
import Metas from "./pages/Metas";
import Avaliacoes from "./pages/Avaliacoes";
import PDI from "./pages/PDI";
import NineBox from "./pages/NineBox";
import Relatorios from "./pages/Relatorios";
import Calibracao from "./pages/Calibracao";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import History from "./pages/History";
import Funcionarios from "./pages/Funcionarios";
import FuncionariosAtivos from "./pages/FuncionariosAtivos";
import AprovacoesD from "./pages/aprovacoes/Dashboard";
import MinhasSolicitacoes from "./pages/aprovacoes/MinhasSolicitacoes";
import BonusAprovacoes from "./pages/aprovacoes/Bonus";
import Workflows from "./pages/aprovacoes/Workflows";
import PDIPendentes from "./pages/aprovacoes/PDIPendentes";
import Sucessao from "./pages/Sucessao";
import SucessaoMelhorado from "./pages/SucessaoMelhorado";
import MapaSucessaoCompleto from "./pages/MapaSucessaoCompleto";
import MapaSucessaoUISA from "./pages/MapaSucessaoUISA";
import PDIInteligente from "./pages/PDIInteligente";
import PDIInteligenteNovo from "./pages/PDIInteligenteNovo";
import PDIInteligenteDetalhes from "./pages/PDIInteligenteDetalhes";
import TestesResultadosRH from "./pages/TestesResultadosRH";
import NineBoxComparativo from "./pages/NineBoxComparativo";
import ReportBuilder from "./pages/ReportBuilder";
import ReportAnalytics from "./pages/ReportAnalytics";
import GestaoAprovadores from "./pages/GestaoAprovadores";
import DashboardAprovacoes from "./pages/DashboardAprovacoes";
import GerenciarUsuarios from "./pages/GerenciarUsuarios";
import SuccessionImport from "./pages/SuccessionImport";
import PerformanceIntegrada from "./pages/PerformanceIntegrada";
import Avaliacao360Enhanced from "./pages/Avaliacao360Enhanced";
import Evaluation360EnhancedWizard from "./components/Evaluation360EnhancedWizard";
import Avaliacao360Autoavaliacao from "./pages/Avaliacao360Autoavaliacao";
import Avaliacao360Gestor from "./pages/Avaliacao360Gestor";
import Avaliacao360Consenso from "./pages/Avaliacao360Consenso";
import BenchmarkingMercado from "./pages/BenchmarkingMercado";
import MetasCascata from "./pages/MetasCascata";
import DashboardExecutivoConsolidado from "./pages/DashboardExecutivoConsolidado";
import CiclosAvaliacao from "./pages/CiclosAvaliacao";
import AuditTrail from "./pages/AuditTrail";
import Analytics from "./pages/Analytics";
import AnalyticsAvancado from "./pages/AnalyticsAvancado";
import DescricaoCargos from "./pages/DescricaoCargos";
import DescricaoCargosUISA from "./pages/DescricaoCargosUISA";
import CriarDescricaoCargo from "./pages/CriarDescricaoCargo";
import DetalhesDescricaoCargo from "./pages/DetalhesDescricaoCargo";
import MinhasAtividades from "./pages/MinhasAtividades";
import RelatoriosProdutividade from "./pages/RelatoriosProdutividade";
import ValidacaoLider from "./pages/ValidacaoLider";
import AnaliseGaps from "./pages/AnaliseGaps";
import ImportacaoDescricoes from "./pages/ImportacaoDescricoes";
import PesquisasPulse from "./pages/PesquisasPulse";
import CriarPesquisaPulse from "./pages/CriarPesquisaPulse";
import ResponderPesquisaPulse from "./pages/ResponderPesquisaPulse";
import PesquisaPublica from "./pages/PesquisaPublica";
import ResultadosPesquisaPulse from "./pages/ResultadosPesquisaPulse";
import Feedbacks from "./pages/Feedbacks";
import Badges from "./pages/Badges";
import PsychometricTests from "./pages/PsychometricTests";
import TestDISC from "./pages/TestDISC";
import TestBigFive from "./pages/TestBigFive";
import TestMBTI from "./pages/TestMBTI";
import TestIE from "./pages/TestIE";
import TestVARK from "./pages/TestVARK";
import TestLeadership from "./pages/TestLeadership";
import TestCareerAnchors from "./pages/TestCareerAnchors";
import EnviarTestes from "./pages/EnviarTestes";
import ImportadorDescricoesCargo from "./pages/ImportadorDescricoesCargo";
import Notificacoes from "./pages/Notificacoes";
import DashboardComparativoTestes from "./pages/DashboardComparativoTestes";
import RelatoriosExecutivos from "./pages/RelatoriosExecutivos";
import DashboardRelatorios from "./pages/DashboardRelatorios";
import CiclosAVD from "./pages/avd/CiclosAVD";
import MinhasAvaliacoes from "./pages/avd/MinhasAvaliacoes";
import FormularioAvaliacao from "./pages/avd/FormularioAvaliacao";
import DashboardAVD from "./pages/avd/DashboardAVD";
import RelatorioCompliance from "./pages/avd/RelatorioCompliance";
import Relatorio360Consolidado from "./pages/Relatorio360Consolidado";
import Ciclos360VisaoGeral from "./pages/Ciclos360VisaoGeral";
import Ciclos360Detalhes from "./pages/Ciclos360Detalhes";
import AdminSmtp from "./pages/AdminSmtp";
import EmailMetrics from "./pages/EmailMetrics";
import NotificationTemplates from "./pages/admin/NotificationTemplates";
import Aprovadores from "./pages/admin/Aprovadores";
import ScheduledReports from "./pages/ScheduledReports";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import DashboardExecutivo from "./pages/DashboardExecutivo";
import Avaliar360 from "./pages/Avaliar360";
import MetasSMART from "./pages/MetasSMART";
import CriarMetaSMART from "./pages/CriarMetaSMART";
import CriarPDI from "./pages/CriarPDI";
import DashboardProdutividade from "./pages/DashboardProdutividade";
import AprovarDescricaoSuperior from "./pages/AprovarDescricaoSuperior";
import AprovarDescricaoRH from "./pages/AprovarDescricaoRH";
import DetalhesMeta from "./pages/DetalhesMeta";
import EditarMeta from "./pages/EditarMeta";
import AtualizarProgressoMeta from "./pages/AtualizarProgressoMeta";
import AnalyticsMetas from "./pages/AnalyticsMetas";
import AprovarMetas from "./pages/AprovarMetas";
import ConfiguracaoBonus from "@/pages/ConfiguracaoBonus";
import ConfiguracaoWorkflowsBonus from "@/pages/ConfiguracaoWorkflowsBonus";
import DashboardBonusRH from "./pages/DashboardBonusRH";
import MovimentacaoNineBox from "./pages/MovimentacaoNineBox";
import AprovacaoCalibracoes from "./pages/AprovacaoCalibracoes";

import CiclosAvaliacaoLista from "@/pages/CiclosAvaliacaoLista";
import CriarCicloAvaliacao from "@/pages/CriarCicloAvaliacao";
import AderirCicloAvaliacao from "@/pages/AderirCicloAvaliacao";
import AprovarMetasGestor from "@/pages/AprovarMetasGestor";
import AcompanharCicloAvaliacao from "@/pages/AcompanharCicloAvaliacao";
import AprovacaoGeralCiclo from "@/pages/AprovacaoGeralCiclo";
import RankingGamificacao from "./pages/RankingGamificacao";
import ConfiguracaoIntegracoes from "./pages/ConfiguracaoIntegracoes";
import BonusPolicies from "@/pages/Bonus";
import AprovacaoBonus from "@/pages/AprovacaoBonus";
import RelatorioBonus from "./pages/RelatorioBonus";
import PrevisaoBonus from "./pages/PrevisaoBonus";
import AprovacaoBonusLote from "./pages/AprovacaoBonusLote";
import BonusAuditoria from "./pages/BonusAuditoria";
import AvaliacoesPendentes from "./pages/AvaliacoesPendentes";
import AvaliacoesAprovacao from "./pages/AvaliacoesAprovacao";
import HierarquiaOrganizacional from "./pages/HierarquiaOrganizacional";
import HierarquiaImport from "./pages/HierarquiaImport";
import PerfilFuncionario from "./pages/PerfilFuncionario";
import DashboardEmails from "./pages/DashboardEmails";
// import BonusWorkflows from "./pages/admin/BonusWorkflows"; // Temporariamente desabilitado
// import ImportUISA from "./pages/admin/ImportUISA"; // Temporariamente desabilitado
import GerenciarSenhasLideres from "./pages/admin/GerenciarSenhasLideres";
import HistoricoSenhas from "./pages/admin/HistoricoSenhas";
import GestaoUsuarios from "./pages/admin/GestaoUsuarios";
import MetasCorporativas from "./pages/MetasCorporativas";
// import AdesaoMetasCorporativas from "./pages/metas/AdesaoMetasCorporativas"; // Temporariamente desabilitado
import TemplatesAvaliacao from "./pages/admin/TemplatesAvaliacao";
import CriarTemplateAvaliacao from "./pages/admin/CriarTemplateAvaliacao";
import VisualizarTemplateAvaliacao from "./pages/admin/VisualizarTemplateAvaliacao";
import EditarTemplateAvaliacao from "./pages/admin/EditarTemplateAvaliacao";
import TemplatesManagement from "./pages/TemplatesManagement";
import CalibracaoDiretoria from "./pages/admin/CalibracaoDiretoria";
import NotificacoesAnalytics from "./pages/admin/NotificacoesAnalytics";
import EmailsFalhados from "./pages/admin/EmailsFalhados";
import ConfigurarAvaliacoes from "./pages/avaliacoes/ConfigurarAvaliacoes";
// import BonusWorkflowApproval from "@/pages/aprovacoes/BonusWorkflowApproval"; // Temporariamente desabilitado
// import BonusCompliance from "./pages/compliance/BonusCompliance"; // Temporariamente desabilitado
// import ExportarFolha from "./pages/folha-pagamento/ExportarFolha"; // Temporariamente desabilitado
import NotificacoesConfig from "./pages/configuracoes/Notificacoes";
import AnalyticsAvancadoPage from "./pages/analytics/AnalyticsAvancado";
import ProgressoCiclos from "./pages/relatorios/ProgressoCiclos";
import DashboardSucessaoFiltros from "./pages/sucessao/DashboardSucessaoFiltros";
import DashboardTempoReal from "./pages/metas/DashboardTempoReal";
import CalibrationMeetingsList from "./pages/calibracao/CalibrationMeetingsList";
import CalibrationMeetingRoom from "./pages/calibracao/CalibrationMeetingRoom";
import CiclosAtivos from "./pages/CiclosAtivos";
import GerenciarCiclosAvaliacao from "./pages/GerenciarCiclosAvaliacao";
import AdesaoMetasCorporativas from "./pages/metas/AdesaoMetasCorporativas";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/gestor" component={DashboardGestor} />
      <Route path="/configuracoes/smtp" component={ConfiguracoesSMTP} />
      <Route path="/configuracoes/notificacoes" component={NotificacoesConfig} />
      {/* Rotas de metas - específicas ANTES das parametrizadas */}
      <Route path={"/metas"} component={MetasSMART} />
      <Route path={"/metas/criar"} component={CriarMetaSMART} />
      <Route path="/metas/corporativas" component={MetasCorporativas} />
      <Route path="/metas/corporativas/dashboard-tempo-real" component={DashboardTempoReal} />
      <Route path="/metas/corporativas/adesao" component={AdesaoMetasCorporativas} />
      <Route path="/metas/dashboard-ciclos" component={DashboardMetasCiclos} />
      <Route path={"/metas/:id"} component={DetalhesMeta} />
      <Route path={"/metas/:id/editar"} component={EditarMeta} />
      <Route path="/metas/:id/progresso" component={AtualizarProgressoMeta} />
      <Route path="/analytics/metas" component={AnalyticsMetas} />
      <Route path="/executivo/calibracao" component={MovimentacaoNineBox} />
      <Route path="/executivo/aprovacoes" component={AprovacaoCalibracoes} />
      <Route path="/gamificacao/ranking" component={RankingGamificacao} />
      <Route path="/configuracoes/integracoes" component={ConfiguracaoIntegracoes} />
      <Route path="/bonus" component={BonusPolicies} />
      <Route path="/aprovacoes/bonus" component={AprovacaoBonus} />
      <Route path="/relatorios/bonus" component={RelatorioBonus} />
      <Route path="/previsao-bonus" component={PrevisaoBonus} />
      <Route path="/aprovacoes/bonus-lote" component={AprovacaoBonusLote} />
      <Route path="/bonus/auditoria" component={BonusAuditoria} />
      <Route path="/avaliacoes-pendentes" component={AvaliacoesPendentes} />


          {/* Ciclo de Avaliação de Desempenho */}
          <Route path="/ciclos-avaliacao" component={CiclosAvaliacaoLista} />
          <Route path="/ciclos-avaliacao/criar" component={CriarCicloAvaliacao} />
          <Route path="/ciclos-avaliacao/:id/aderir" component={AderirCicloAvaliacao} />
          <Route path="/ciclos-avaliacao/:id/acompanhar" component={AcompanharCicloAvaliacao} />
          <Route path="/ciclos-avaliacao/aprovar" component={AprovarMetasGestor} />
          <Route path="/ciclos-avaliacao/aprovacao-geral" component={AprovacaoGeralCiclo} />
      {/* <Route path="/admin/bonus-workflows" component={BonusWorkflows} /> */}
      {/* <Route path="/admin/import-uisa" component={ImportUISA} /> */}
      <Route path="/admin/gerenciar-senhas-lideres" component={GerenciarSenhasLideres} />
      <Route path="/admin/historico-senhas" component={HistoricoSenhas} />
      {/* <Route path="/metas/corporativas/adesao" component={AdesaoMetasCorporativas} /> */}
      {/* <Route path="/aprovacoes/bonus-workflow/:id" component={BonusWorkflowApproval} /> */}
      {/* <Route path="/compliance/bonus" component={BonusCompliance} /> */}
      {/* <Route path="/folha-pagamento/exportar" component={ExportarFolha} /> */}
       <Route path="/avaliacoes" component={Avaliacoes} />
      <Route path="/avaliacoes/criar" component={Avaliacao360Enhanced} />
      <Route path="/avaliacoes/configurar" component={ConfigurarAvaliacoes} />
       <Route path="/avaliacoes/360/:id" component={Avaliacao360Enhanced} />
       <Route path="/avaliacoes/360/:id/autoavaliacao" component={Avaliacao360Autoavaliacao} />
       <Route path="/avaliacoes/360/:id/gestor" component={Avaliacao360Gestor} />
       <Route path="/avaliacoes/360/:id/consenso" component={Avaliacao360Consenso} />
       <Route path="/avaliacoes/autoavaliacao/:id" component={Avaliacao360Autoavaliacao} />
       <Route path="/avaliacoes/gestor/:id" component={Avaliacao360Gestor} />
       <Route path="/avaliacoes/consenso/:id" component={Avaliacao360Consenso} />
      <Route path="/benchmarking" component={BenchmarkingMercado} />
      <Route path="/metas-cascata" component={MetasCascata} />
      <Route path="/dashboard-executivo" component={DashboardExecutivoConsolidado} />
      <Route path="/ciclos-avaliacao" component={CiclosAvaliacao} />
      <Route path="/ciclos-avaliacao/gerenciar" component={GerenciarCiclosAvaliacao} />
      <Route path="/ciclos/ativos" component={CiclosAtivos} />
      <Route path={"/pdi"} component={PDI} />      <Route path={"/pdi/criar"} component={CriarPDI} />
      <Route path={"/produtividade/dashboard"} component={DashboardProdutividade} />
      <Route path={"/descricao-cargos/aprovar-superior"} component={AprovarDescricaoSuperior} />
      <Route path={"/descricao-cargos/aprovar-rh"} component={AprovarDescricaoRH} />      <Route path={"/nine-box"} component={NineBox} />
      <Route path={'/relatorios'} component={Relatorios} />
      <Route path={'/relatorios/dashboard'} component={DashboardRelatorios} />
      <Route path={'/relatorios/360-consolidado'} component={Relatorio360Consolidado} />
      <Route path="/relatorios/ciclos" component={ProgressoCiclos} />
      <Route path="/calibracao" component={Calibracao} />
      <Route path="/calibracao/reunioes" component={CalibrationMeetingsList} />
      <Route path="/calibracao/reuniao/:id" component={CalibrationMeetingRoom} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/historico" component={History} />
      <Route path="/funcionarios" component={Funcionarios} />
      <Route path="/funcionarios/:id" component={PerfilFuncionario} />
      <Route path="/funcionarios-ativos" component={FuncionariosAtivos} />
      <Route path="/departamentos" component={Departamentos} />
      <Route path="/centros-custo" component={CentrosCustos} />
      <Route path="/aprovacoes/dashboard" component={AprovacoesD} />
      <Route path="/aprovacoes/solicitacoes" component={MinhasSolicitacoes} />      <Route path={"/aprovacoes/bonus"} component={BonusAprovacoes} />
      <Route path="/aprovacoes/metas" component={AprovarMetas} />
      <Route path="/configuracoes/bonus" component={ConfiguracaoBonus} />
      <Route path="/configuracoes/workflows-bonus" component={ConfiguracaoWorkflowsBonus} />
      <Route path="/rh/dashboard-bonus" component={DashboardBonusRH} />
      <Route path="/aprovacoes/workflows" component={Workflows} />
      <Route path="/aprovacoes/pdi" component={PDIPendentes} />
      <Route path="/aprovacoes/avaliacoes" component={AvaliacoesPendentes} />
      <Route path="/sucessao" component={Sucessao} />
      <Route path="/mapa-sucessao" component={SucessaoMelhorado} />
      <Route path="/mapa-sucessao-completo" component={MapaSucessaoCompleto} />
      <Route path="/mapa-sucessao-uisa" component={MapaSucessaoUISA} />
      <Route path="/pdi-inteligente/novo" component={PDIInteligenteNovo} />
      <Route path="/pdi-inteligente/:id/detalhes" component={PDIInteligenteDetalhes} />
      <Route path="/pdi-inteligente/:id" component={PDIInteligente} />
      <Route path="/testes-psicometricos/resultados" component={TestesResultadosRH} />
      <Route path="/nine-box-comparativo" component={NineBoxComparativo} />
      <Route path="/admin/report-builder" component={ReportBuilder} />
      <Route path="/admin/report-analytics" component={ReportAnalytics} />
      <Route path="/admin/templates-avaliacao" component={TemplatesAvaliacao} />
      <Route path="/admin/templates-avaliacao/criar" component={CriarTemplateAvaliacao} />
      <Route path="/admin/templates-avaliacao/:id" component={VisualizarTemplateAvaliacao} />
      <Route path="/admin/templates-avaliacao/:id/editar" component={EditarTemplateAvaliacao} />
      <Route path="/admin/templates-360" component={TemplatesManagement} />
      <Route path="/admin/templates-360/analytics" component={TemplatesAnalytics} />
      <Route path="/admin/calibracao-diretoria" component={CalibracaoDiretoria} />
      <Route path="/admin/notificacoes-analytics" component={NotificacoesAnalytics} />
      <Route path="/admin/emails-falhados" component={EmailsFalhados} />
      <Route path={"/admin/succession-import"} component={SuccessionImport} />
      <Route path="/performance-integrada" component={PerformanceIntegrada} />
       <Route path="/360-enhanced" component={Avaliacao360Enhanced} />
       <Route path="/ciclos/360-enhanced/criar" component={Evaluation360EnhancedWizard} />
       <Route path="/ciclos-360/visao-geral" component={Ciclos360VisaoGeral} />
       <Route path="/ciclos-360/detalhes/:id" component={Ciclos360Detalhes} />
      <Route path="/testes-psicometricos" component={PsychometricTests} />
      <Route path="/teste-disc" component={TestDISC} />
      <Route path="/teste-bigfive" component={TestBigFive} />
      <Route path="/teste-mbti" component={TestMBTI} />
      <Route path="/teste-ie" component={TestIE} />
      <Route path="/teste-vark" component={TestVARK} />
      <Route path="/teste-lideranca" component={TestLeadership} />
      <Route path="/teste-ancoras-carreira" component={TestCareerAnchors} />
      <Route path="/testes/enviar" component={EnviarTestes} />
      <Route path="/testes-psicometricos/enviar" component={EnviarTestes} />
      <Route path="/descricao-cargos/importar" component={ImportadorDescricoesCargo} />
      <Route path="/descricao-cargos" component={DescricaoCargos} />
      <Route path="/descricao-cargos-uisa" component={DescricaoCargosUISA} />
      <Route path="/descricao-cargos-uisa/criar" component={CriarDescricaoCargo} />
      <Route path="/descricao-cargos-uisa/:id" component={DetalhesDescricaoCargo} />
      <Route path="/minhas-atividades" component={MinhasAtividades} />
      <Route path="/relatorios-produtividade" component={RelatoriosProdutividade} />
      <Route path="/alertas" component={Alertas} />
      <Route path="/discrepancias" component={Discrepancias} />
      <Route path="/departamentos" component={Departamentos} />
      <Route path="/centros-custos" component={CentrosCustos} />
      <Route path="/sucessao-inteligente" component={SucessaoInteligente} />
      <Route path="/sucessao/dashboard-filtros" component={DashboardSucessaoFiltros} />
      <Route path="/importacao-ponto" component={ImportacaoPonto} />
      <Route path="/validacao-lider" component={ValidacaoLider} />
      <Route path="/analise-gaps" component={AnaliseGaps} />
      <Route path="/importacao-descricoes" component={ImportacaoDescricoes} />
      <Route path="/pesquisas-pulse" component={PesquisasPulse} />
      <Route path="/pesquisas-pulse/criar" component={CriarPesquisaPulse} />
      <Route path="/pesquisas-pulse/resultados/:id" component={ResultadosPesquisaPulse} />
      <Route path="/pesquisa/:id" component={PesquisaPublica} />
      <Route path="/pesquisas/pulse/responder/:id" component={ResponderPesquisaPulse} />
      <Route path="/notificacoes" component={Notificacoes} />
      <Route path="/testes/comparativo" component={DashboardComparativoTestes} />
      <Route path="/relatorios-executivos" component={RelatoriosExecutivos} />
      <Route path="/admin/smtp" component={AdminSmtp} />
      <Route path="/admin/hierarquia" component={HierarquiaOrganizacional} />
      <Route path="/admin/hierarquia/importar" component={HierarquiaImport} />
      <Route path="/admin/emails" component={DashboardEmails} />
      <Route path="/admin/email-metrics" component={EmailMetrics} />
      <Route path="/admin/seguranca" component={SecurityDashboard} />
      <Route path="/admin/notification-templates" component={NotificationTemplates} />
      <Route path="/admin/aprovadores" component={GestaoAprovadores} />
      <Route path="/admin/dashboard-aprovacoes" component={DashboardAprovacoes} />
      <Route path="/admin/usuarios" component={GestaoUsuarios} />
      <Route path="/admin/scheduled-reports" component={ScheduledReports} />
      <Route path="/executive-dashboard" component={ExecutiveDashboard} />
      <Route path="/dashboard-executivo" component={DashboardExecutivo} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/analytics/avancado" component={AnalyticsAvancadoPage} />
      <Route path="/avaliar-360/:id" component={Avaliar360} />
      <Route path="/admin/audit-log" component={AuditTrail} />
      <Route path="/admin/gestao-aprovadores" component={GestaoAprovadores} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/feedback" component={Feedbacks} />
      <Route path="/ciclos/:cycleId/criar-metas" component={CriarMetasCiclo} />
      <Route path="/aprovacoes/ciclos" component={DashboardAprovacoesCiclos} />
      <Route path="/aprovacoes/ciclos-avaliacao" component={AprovacaoCiclos} />
      <Route path="/relatorios/pdi" component={RelatoriosPDI} />
      <Route path="/rh/acompanhamento-avaliacoes" component={AcompanhamentoAvaliacoes} />
      {/* Rotas AVD UISA */}
      <Route path="/avd/ciclos" component={CiclosAVD} />
      <Route path="/avd/minhas-avaliacoes" component={MinhasAvaliacoes} />
      <Route path="/avd/avaliar/:id" component={FormularioAvaliacao} />
      <Route path="/avd/dashboard" component={DashboardAVD} />
      <Route path="/avd/compliance" component={RelatorioCompliance} />
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <SessionTimeout />
            <OnboardingTour />
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;