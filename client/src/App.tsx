import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Alertas from "@/pages/Alertas";
import Discrepancias from "./pages/Discrepancias";
import Departamentos from "./pages/Departamentos";
import CentrosCustos from "./pages/CentrosCustos";
import SucessaoInteligente from "./pages/SucessaoInteligente";
import ImportacaoPonto from "@/pages/ImportacaoPonto";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Home from "./pages/Home";
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
import Bonus from "./pages/aprovacoes/Bonus";
import Workflows from "./pages/aprovacoes/Workflows";
import Sucessao from "./pages/Sucessao";
import SucessaoMelhorado from "./pages/SucessaoMelhorado";
import MapaSucessaoCompleto from "./pages/MapaSucessaoCompleto";
import PDIInteligente from "./pages/PDIInteligente";
import PDIInteligenteNovo from "./pages/PDIInteligenteNovo";
import PDIInteligenteDetalhes from "./pages/PDIInteligenteDetalhes";
import TestesResultadosRH from "./pages/TestesResultadosRH";
import NineBoxComparativo from "./pages/NineBoxComparativo";
import ReportBuilder from "./pages/ReportBuilder";
import ReportAnalytics from "./pages/ReportAnalytics";
import SuccessionImport from "./pages/SuccessionImport";
import PerformanceIntegrada from "./pages/PerformanceIntegrada";
import Avaliacao360Enhanced from "./pages/Avaliacao360Enhanced";
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
import ResponderPesquisaPulse from "./pages/ResponderPesquisaPulse";
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
import Notificacoes from "./pages/Notificacoes";
import DashboardComparativoTestes from "./pages/DashboardComparativoTestes";
import RelatoriosExecutivos from "./pages/RelatoriosExecutivos";
import AdminSmtp from "./pages/AdminSmtp";
import EmailMetrics from "./pages/EmailMetrics";
import ScheduledReports from "./pages/ScheduledReports";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import DashboardExecutivo from "./pages/DashboardExecutivo";
import Avaliar360 from "./pages/Avaliar360";
import MetasSMART from "./pages/MetasSMART";
import CriarMetaSMART from "./pages/CriarMetaSMART";
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
import RankingGamificacao from "./pages/RankingGamificacao";
import ConfiguracaoIntegracoes from "./pages/ConfiguracaoIntegracoes";
import BonusPage from "./pages/Bonus";
import AvaliacoesPendentes from "./pages/AvaliacoesPendentes";
import HierarquiaOrganizacional from "./pages/HierarquiaOrganizacional";
import HierarquiaImport from "./pages/HierarquiaImport";
import DashboardEmails from "./pages/DashboardEmails";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />          <Route path="/gestor" component={DashboardGestor} />
          <Route path="/configuracoes/smtp" component={ConfiguracoesSMTP} />      <Route path={"/metas"} component={MetasSMART} />
      <Route path={"/metas/criar"} component={CriarMetaSMART} />
      <Route path={"/metas/:id"} component={DetalhesMeta} />
      <Route path={"/metas/:id/editar"} component={EditarMeta} />
      <Route path="/metas/:id/progresso" component={AtualizarProgressoMeta} />
      <Route path="/analytics/metas" component={AnalyticsMetas} />
      <Route path="/executivo/calibracao" component={MovimentacaoNineBox} />
      <Route path="/executivo/aprovacoes" component={AprovacaoCalibracoes} />
      <Route path="/gamificacao/ranking" component={RankingGamificacao} />
      <Route path="/configuracoes/integracoes" component={ConfiguracaoIntegracoes} />
      <Route path="/bonus" component={BonusPage} />
      <Route path="/avaliacoes-pendentes" component={AvaliacoesPendentes} />
       <Route path="/avaliacoes" component={Avaliacoes} />
      <Route path="/avaliacoes/autoavaliacao/:id" component={Avaliacao360Autoavaliacao} />
      <Route path="/avaliacoes/gestor/:id" component={Avaliacao360Gestor} />
      <Route path="/avaliacoes/consenso/:id" component={Avaliacao360Consenso} />
      <Route path="/benchmarking" component={BenchmarkingMercado} />
      <Route path="/metas-cascata" component={MetasCascata} />
      <Route path="/dashboard-executivo" component={DashboardExecutivoConsolidado} />
      <Route path="/ciclos-avaliacao" component={CiclosAvaliacao} />
      <Route path={"/pdi"} component={PDI} />
      <Route path={"/nine-box"} component={NineBox} />
      <Route path={'/relatorios'} component={Relatorios} />
      <Route path="/calibracao" component={Calibracao} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/historico" component={History} />
      <Route path="/funcionarios" component={Funcionarios} />
      <Route path="/funcionarios-ativos" component={FuncionariosAtivos} />
      <Route path="/departamentos" component={Departamentos} />
      <Route path="/centros-custo" component={CentrosCustos} />
      <Route path="/aprovacoes/dashboard" component={AprovacoesD} />
      <Route path="/aprovacoes/solicitacoes" component={MinhasSolicitacoes} />      <Route path={"/aprovacoes/bonus"} component={Bonus} />
      <Route path="/aprovacoes/metas" component={AprovarMetas} />
      <Route path="/configuracoes/bonus" component={ConfiguracaoBonus} />
      <Route path="/configuracoes/workflows-bonus" component={ConfiguracaoWorkflowsBonus} />
      <Route path="/rh/dashboard-bonus" component={DashboardBonusRH} />
      <Route path="/aprovacoes/workflows" component={Workflows} />
      <Route path="/sucessao" component={Sucessao} />
      <Route path="/mapa-sucessao" component={SucessaoMelhorado} />
      <Route path="/mapa-sucessao-completo" component={MapaSucessaoCompleto} />
      <Route path="/pdi-inteligente/novo" component={PDIInteligenteNovo} />
      <Route path="/pdi-inteligente/:id/detalhes" component={PDIInteligenteDetalhes} />
      <Route path="/pdi-inteligente/:id" component={PDIInteligente} />
      <Route path="/testes-psicometricos/resultados" component={TestesResultadosRH} />
      <Route path="/nine-box-comparativo" component={NineBoxComparativo} />
      <Route path="/admin/report-builder" component={ReportBuilder} />
      <Route path="/admin/report-analytics" component={ReportAnalytics} />
      <Route path={"/admin/succession-import"} component={SuccessionImport} />
      <Route path="/performance-integrada" component={PerformanceIntegrada} />
      <Route path="/360-enhanced" component={Avaliacao360Enhanced} />
      <Route path="/testes-psicometricos" component={PsychometricTests} />
      <Route path="/teste-disc" component={TestDISC} />
      <Route path="/teste-bigfive" component={TestBigFive} />
      <Route path="/teste-mbti" component={TestMBTI} />
      <Route path="/teste-ie" component={TestIE} />
      <Route path="/teste-vark" component={TestVARK} />
      <Route path="/teste-lideranca" component={TestLeadership} />
      <Route path="/teste-ancoras-carreira" component={TestCareerAnchors} />
      <Route path="/testes/enviar" component={EnviarTestes} />
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
      <Route path="/importacao-ponto" component={ImportacaoPonto} />
      <Route path="/validacao-lider" component={ValidacaoLider} />
      <Route path="/analise-gaps" component={AnaliseGaps} />
      <Route path="/importacao-descricoes" component={ImportacaoDescricoes} />
      <Route path="/pesquisas-pulse" component={PesquisasPulse} />
      <Route path="/pesquisa/:id" component={ResponderPesquisaPulse} />
      <Route path="/pesquisas-pulse/resultados/:id" component={ResultadosPesquisaPulse} />
      <Route path="/notificacoes" component={Notificacoes} />
      <Route path="/testes/comparativo" component={DashboardComparativoTestes} />
      <Route path="/relatorios-executivos" component={RelatoriosExecutivos} />
      <Route path="/admin/smtp" component={AdminSmtp} />
      <Route path="/admin/hierarquia" component={HierarquiaOrganizacional} />
      <Route path="/admin/hierarquia/importar" component={HierarquiaImport} />
      <Route path="/admin/emails" component={DashboardEmails} />
      <Route path="/admin/email-metrics" component={EmailMetrics} />
      <Route path="/admin/scheduled-reports" component={ScheduledReports} />
      <Route path="/executive-dashboard" component={ExecutiveDashboard} />
      <Route path="/dashboard-executivo" component={DashboardExecutivo} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/analytics/avancado" component={AnalyticsAvancado} />
                <Route path="/avaliar-360/:id" component={Avaliar360} />
          <Route path="/admin/audit-log" component={AuditTrail} />
          <Route path="/admin/analytics" component={Analytics} />
          <Route path="/feedback" component={Feedbacks} />
          <Route path="/badges" component={Badges} />
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
            <Router />
          </TooltipProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;