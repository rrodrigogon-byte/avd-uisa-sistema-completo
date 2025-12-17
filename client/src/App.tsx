import { Toaster } from "@/components/ui/sonner";
import { SessionTimeout } from "@/components/SessionTimeout";
import { OnboardingTour } from "@/components/OnboardingTour";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useErrorTracking } from "@/hooks/useErrorTracking";
import NotFound from "@/pages/NotFound";
import AcompanhamentoAvaliacoes from "@/pages/AcompanhamentoAvaliacoes";
import CriarMetasCiclo from "@/pages/CriarMetasCiclo";
import DashboardAprovacoesCiclos from "@/pages/DashboardAprovacoesCiclos";
import DashboardMetasCiclos from "@/pages/DashboardMetasCiclos";
import AprovacaoCiclos from "@/pages/AprovacaoCiclos";
import RelatoriosPDI from "@/pages/RelatoriosPDI";
import Alertas from "@/pages/Alertas";
import Discrepancias from "./pages/Discrepancias";
import Pendencias from "./pages/Pendencias";
import CustomReportBuilder from "./pages/CustomReportBuilder";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import ContinuousFeedback from "./pages/ContinuousFeedback";
import ResultadosIndividuais from "./pages/ResultadosIndividuais";
import DashboardAdmin from "./pages/DashboardAdmin";
import EmailMonitoring from "./pages/EmailMonitoring";
import Departamentos from "./pages/Departamentos";
import CentrosCustos from "./pages/CentrosCustos";
import SucessaoInteligente from "./pages/SucessaoInteligente";
import ImportacaoPonto from "@/pages/ImportacaoPonto";
import SecurityDashboard from "./pages/SecurityDashboard";
import TestMonitoringDashboard from "./pages/TestMonitoringDashboard";
import PsychometricResults from "./pages/PsychometricResults";
import TeamDISCProfiles from "./pages/TeamDISCProfiles";
import TeamProfiles from "./pages/TeamProfiles";
import FaceRegistration from "./pages/FaceRegistration";
import TemporalAnalysis from "./pages/TemporalAnalysis";
import PIRComparacao from "./pages/PIRComparacao";
import PIRExportacao from "./pages/PIRExportacao";
import PIRIntegridade from "./pages/PIRIntegridade";
import IntegridadeTestes from "./pages/IntegridadeTestes";
import IntegridadeResultados from "./pages/IntegridadeResultados";
import IntegridadeAnalises from "./pages/IntegridadeAnalises";
import AcessoPIR from "./pages/integridade/AcessoPIR";
import ResponderPIRIntegridade from "./pages/integridade/ResponderPIRIntegridade";
import ObrigadoTeste from "./pages/integridade/ObrigadoTeste";
import {
  DashboardPIRIntegridade,
  TestePIRIntegridade,
  ResultadoPIRIntegridade,
  GestaoQuestoesPIRIntegridade,
} from "./pages/PIRIntegridade/index";
import AprovacoesCargos from "./pages/AprovacoesCargos";
import ABTestDashboard from "./pages/ABTestDashboard";
import NPSDashboard from "./pages/NPSDashboard";
import ConsolidatedNpsReport from "./pages/ConsolidatedNpsReport";
import AdminConsolidatedNpsReport from "./pages/admin/ConsolidatedNpsReport";
import NpsScheduledTriggers from "./pages/admin/NpsScheduledTriggers";
import AbTestExperiments from "./pages/admin/AbTestExperiments";
import ValidacaoTestes from "./pages/ValidacaoTestes";
import DashboardTestes from "./pages/DashboardTestes";
import CompetenciasPorCargo from "./pages/CompetenciasPorCargo";
import MetasIndividuais from "./pages/MetasIndividuais";
import PesosAvaliacao from "./pages/PesosAvaliacao";
import BenchmarkDesempenho from "./pages/BenchmarkDesempenho";
import PilotSimulations from "./pages/PilotSimulations";
import SimuladosPiloto from "./pages/SimuladosPiloto";
import DashboardAlertasSeguranca from "./pages/DashboardAlertasSeguranca";
import DashboardMovimentacoes from "./pages/DashboardMovimentacoes";
import SuspiciousAccessDashboard from "./pages/SuspiciousAccessDashboard";
import IntegrityReport from "./pages/IntegrityReport";
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
import AvaliacoesRespostas from "./pages/AvaliacoesRespostas";
import ViewEvaluation from "./pages/ViewEvaluation";
import ManageEvaluations from "./pages/ManageEvaluations";
import PDI from "./pages/PDI";
import PDIImport from "./pages/PDIImport";
import PDIImportHistory from "./pages/PDIImportHistory";
import PDIImportEdit from "./pages/PDIImportEdit";
import PDIImportedList from "./pages/PDIImportedList";
import PDIComparativeReport from "./pages/PDIComparativeReport";
import PDIImportMetrics from "./pages/PDIImportMetrics";
import PDIVisualizar from "./pages/PDIVisualizar";
import PDIEditar from "./pages/PDIEditar";
import PDILista from "./pages/PDILista";
import DashboardPDI from "./pages/DashboardPDI";
import PDIList from "./pages/PDIList";
import PDIImportacao from "./pages/PDIImportacao";
import PDIListagem from "./pages/PDIListagem";
import OrganogramaDinamico from "./pages/OrganogramaDinamico";
import HistoricoMovimentacoes from "./pages/HistoricoMovimentacoes";
import HistoricoMudancas from "./pages/HistoricoMudancas";
import DashboardIntegridade from "./pages/DashboardIntegridade";
import ExportarOrganograma from "./pages/ExportarOrganograma";
import NineBox from "./pages/NineBox";
import Relatorios from "./pages/Relatorios";
import Calibracao from "./pages/Calibracao";
import Configuracoes from "./pages/Configuracoes";
import Perfil from "./pages/Perfil";
import History from "./pages/History";
import Funcionarios from "./pages/Funcionarios";
import FuncionarioDetalhes from "./pages/FuncionarioDetalhes";
import FuncionariosAtivos from "./pages/FuncionariosAtivos";
import FuncionariosGerenciar from "./pages/FuncionariosGerenciar";
import DesenvolvimentoFuncionarios from "./pages/DesenvolvimentoFuncionarios";
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
import PDIInteligenteImport from "./pages/PDIInteligenteImport";
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
import FerramentasAdmin from "./pages/FerramentasAdmin";
import ExportacaoDados from "./pages/ExportacaoDados";
import GerenciamentoNotificacoes from "./pages/GerenciamentoNotificacoes";
import AuditoriaCompleta from "./pages/AuditoriaCompleta";
import PsychometricTests from "./pages/PsychometricTests";
import TestDISC from "./pages/TestDISC";
import TestBigFive from "./pages/TestBigFive";
import TestMBTI from "./pages/TestMBTI";
import TestIE from "./pages/TestIE";
import TestVARK from "./pages/TestVARK";
import TestLeadership from "./pages/TestLeadership";
import TestCareerAnchors from "./pages/TestCareerAnchors";
import TestPIR from "./pages/TestPIR";
import Passo2PIR from "./pages/Passo2PIR";
import PIRDashboard from "./pages/PIRDashboard";
import PIRReport from "./pages/PIRReport";
import DetalhesResultadoTeste from "./pages/DetalhesResultadoTeste";
import ResultadoCandidato from "./pages/ResultadoCandidato";
import TestResponse from "./pages/TestResponse";
import PsychometricTestsAdmin from "./pages/PsychometricTestsAdmin";
import EnviarTestes from "./pages/EnviarTestes";
import ImportadorDescricoesCargo from "./pages/ImportadorDescricoesCargo";
import Notificacoes from "./pages/Notificacoes";
import DashboardComparativoTestes from "./pages/DashboardComparativoTestes";
import RelatoriosExecutivos from "./pages/RelatoriosExecutivos";
import DashboardRelatorios from "./pages/DashboardRelatorios";
import RelatoriosAvancados from "./pages/RelatoriosAvancados";
import CiclosAVD from "./pages/avd/CiclosAVD";
import MinhasAvaliacoes from "./pages/avd/MinhasAvaliacoes";
import FormularioAvaliacao from "./pages/avd/FormularioAvaliacao";
import DashboardAVD from "./pages/avd/DashboardAVD";
import RelatorioCompliance from "./pages/avd/RelatorioCompliance";
import Passo1DadosPessoais from "./pages/avd/Passo1DadosPessoais";
import ProcessoDashboard from "./pages/avd/ProcessoDashboard";
import Passo3Competencias from "./pages/Passo3Competencias";
import Passo4Desempenho from "./pages/Passo4Desempenho";
import Passo5PDI from "./pages/Passo5PDI";
import DashboardAdminAVD from "./pages/avd/DashboardAdminAVD";
import ProcessoDetalhes from "./pages/avd/ProcessoDetalhes";
import Relatorio360Consolidado from "./pages/Relatorio360Consolidado";
import Ciclos360VisaoGeral from "./pages/Ciclos360VisaoGeral";
import Ciclos360Detalhes from "./pages/Ciclos360Detalhes";
import AdminSmtp from "./pages/AdminSmtp";
import EmailMetrics from "./pages/EmailMetrics";
import AdminRhEmailDashboard from "./pages/AdminRhEmailDashboard";
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

// Testes Geriátricos
import Patients from "./pages/geriatric/Patients";
import PatientHistory from "./pages/geriatric/PatientHistory";
import KatzTest from "./pages/geriatric/KatzTest";
import LawtonTest from "./pages/geriatric/LawtonTest";
import MiniMentalTest from "./pages/geriatric/MiniMentalTest";
import GDSTest from "./pages/geriatric/GDSTest";
import ClockTest from "./pages/geriatric/ClockTest";
import TestesGeriatricosAnalises from "./pages/TestesGeriatricosAnalises";
import ImportacaoHTML from "./pages/ImportacaoHTML";
import ConstrutorFormularios from "./pages/ConstrutorFormularios";
import ProcessosAvaliativos from "./pages/ProcessosAvaliativos";
import DashboardsAnaliticos from "./pages/DashboardsAnaliticos";
import DashboardNotificacoes from "./pages/DashboardNotificacoes";
import DashboardAuditoria from "./pages/DashboardAuditoria";
import HierarchyView from "./pages/HierarchyView";
import Organograma from "./pages/Organograma";
import OrganogramaHierarchy from "./pages/OrganogramaHierarchy";
import RelatoriosHierarquia from "./pages/RelatoriosHierarquia";
import HierarquiaUISA from "./pages/HierarquiaUISA";
import AnaliseEvolucao from "./pages/AnaliseEvolucao";
import ExportacaoRelatorios from "./pages/ExportacaoRelatorios";
import DashboardAprovacoesCargos from "./pages/job-descriptions/DashboardAprovacoes";
import FormularioCargo from "./pages/job-descriptions/FormularioCargo";
import TestesIntegridade from "./pages/integrity-tests/TestesIntegridade";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/gestor" component={DashboardGestor} />
      <Route path="/configuracoes/smtp" component={ConfiguracoesSMTP} />
      <Route path="/configuracoes/notificacoes" component={NotificacoesConfig} />
      <Route path="/reconhecimento-facial/cadastro" component={FaceRegistration} />
      <Route path="/analise-temporal" component={TemporalAnalysis} />
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
      <Route path="/avaliacoes/respostas" component={AvaliacoesRespostas} />
      <Route path="/processos-avaliativos" component={ProcessosAvaliativos} />
      <Route path="/construtor-formularios" component={ConstrutorFormularios} />
      <Route path="/dashboards-analiticos" component={DashboardsAnaliticos} />
      <Route path="/avaliacoes/:id" component={ViewEvaluation} />
      <Route path="/gerenciar-avaliacoes" component={ManageEvaluations} />
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
      <Route path={"/pdi"} component={PDI} />
      <Route path={"/pdi/dashboard"} component={DashboardPDI} />
      <Route path={"/pdi/lista"} component={PDILista} />
      <Route path={"/pdi/listagem"} component={PDIList} />
      <Route path={"/pdi/visualizar/:id"} component={PDIVisualizar} />
      <Route path={"/pdi/editar/:id"} component={PDIEditar} />
      <Route path={"/pdi/import"} component={PDIImport} />
      <Route path={"/pdi/import/history"} component={PDIImportHistory} />
      <Route path={"/pdi/import/edit/:id"} component={PDIImportEdit} />
      <Route path={"/pdi/imported"} component={PDIImportedList} />
      <Route path={"/pdi/comparison"} component={PDIComparativeReport} />
      <Route path={"/pdi/metrics"} component={PDIImportMetrics} />
      <Route path={"/pdi/criar"} component={CriarPDI} />
      <Route path={"/produtividade/dashboard"} component={DashboardProdutividade} />
      <Route path={"/descricao-cargos/aprovar-superior"} component={AprovarDescricaoSuperior} />
      <Route path={"/descricao-cargos/aprovar-rh"} component={AprovarDescricaoRH} />      <Route path={"/nine-box"} component={NineBox} />
      <Route path={'/relatorios'} component={Relatorios} />
      <Route path={'/relatorios/avancados'} component={RelatoriosAvancados} />
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
      <Route path="/funcionarios/:id" component={FuncionarioDetalhes} />
      <Route path="/funcionarios/gerenciar" component={FuncionariosGerenciar} />
      <Route path="/desenvolvimento/funcionarios" component={DesenvolvimentoFuncionarios} />
      <Route path="/desenvolvimento/funcionarios/:id" component={PerfilFuncionario} />
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
      <Route path="/pdi-inteligente/import" component={PDIInteligenteImport} />
      <Route path="/pdi-inteligente/novo" component={PDIInteligenteNovo} />
      <Route path="/pdi-inteligente/:id/detalhes" component={PDIInteligenteDetalhes} />
      <Route path="/pdi-inteligente/:id" component={PDIInteligente} />
      <Route path="/pdi/importacao" component={PDIImportacao} />
      <Route path="/pdi/listagem" component={PDIListagem} />
      <Route path="/organograma-dinamico" component={OrganogramaDinamico} />
      <Route path="/historico-movimentacoes" component={HistoricoMovimentacoes} />
      <Route path="/organograma/historico" component={HistoricoMudancas} />
      <Route path="/organograma/integridade" component={DashboardIntegridade} />
      <Route path="/organograma/exportar" component={ExportarOrganograma} />
      <Route path="/testes-psicometricos/resultados" component={TestesResultadosRH} />
      <Route path="/equipe/perfis-disc" component={TeamDISCProfiles} />
      <Route path="/team-disc-profiles" component={TeamProfiles} />
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
      <Route path="/testes-psicometricos/resultado/:id" component={DetalhesResultadoTeste} />
      <Route path="/teste-disc" component={TestDISC} />
      <Route path="/teste-bigfive" component={TestBigFive} />
      <Route path="/teste-mbti" component={TestMBTI} />
      <Route path="/teste-ie" component={TestIE} />
      <Route path="/teste-vark" component={TestVARK} />
      <Route path="/teste-lideranca" component={TestLeadership} />
      <Route path="/teste-ancoras-carreira" component={TestCareerAnchors} />
      <Route path="/teste-pir/:token" component={TestPIR} />
      <Route path="/pir/dashboard" component={PIRDashboard} />
      <Route path="/pir/relatorio/:employeeId" component={PIRReport} />
      <Route path="/pir/comparacao" component={PIRComparacao} />
      <Route path="/pir/exportacao" component={PIRExportacao} />
      <Route path="/pir/integridade" component={PIRIntegridade} />
      
      {/* Rotas PIR Integridade - Sistema Completo */}
      <Route path="/pir-integridade" component={DashboardPIRIntegridade} />
      <Route path="/pir-integridade/teste/:id" component={TestePIRIntegridade} />
      <Route path="/pir-integridade/resultado/:id" component={ResultadoPIRIntegridade} />
      <Route path="/pir-integridade/questoes" component={GestaoQuestoesPIRIntegridade} />
      
      {/* Rotas de Integridade - 3 páginas */}
      <Route path="/integridade/testes" component={IntegridadeTestes} />
      <Route path="/integridade/resultados" component={IntegridadeResultados} />
      <Route path="/integridade/analises" component={IntegridadeAnalises} />
      
      {/* Rotas públicas de teste de integridade (sem autenticação) */}
      <Route path="/integridade/pir/acesso/:token" component={AcessoPIR} />
      <Route path="/integridade/pir/responder/:token" component={ResponderPIRIntegridade} />
      <Route path="/integridade/obrigado" component={ObrigadoTeste} />
      
      {/* Rota de Aprovações de Cargos com workflow de 4 níveis */}
      <Route path="/aprovacoes/cargos" component={AprovacoesCargos} />
      <Route path="/resultado-candidato/:id" component={ResultadoCandidato} />
      <Route path="/testes/enviar" component={EnviarTestes} />
      <Route path="/testes-psicometricos/enviar" component={EnviarTestes} />
      <Route path="/testes-psicometricos/admin" component={PsychometricTestsAdmin} />
      <Route path="/testes-psicometricos/meus-resultados" component={PsychometricResults} />
      <Route path="/validacao-testes" component={ValidacaoTestes} />
      <Route path="/dashboard-testes" component={DashboardTestes} />
      <Route path="/teste/:token" component={TestResponse} />
      <Route path="/descricao-cargos/importar" component={ImportadorDescricoesCargo} />
      <Route path="/descricao-cargos" component={DescricaoCargos} />
      <Route path="/descricao-cargos-uisa" component={DescricaoCargosUISA} />
      <Route path="/descricao-cargos-uisa/criar" component={CriarDescricaoCargo} />
      <Route path="/descricao-cargos-uisa/:id" component={DetalhesDescricaoCargo} />
      <Route path="/minhas-atividades" component={MinhasAtividades} />
      <Route path="/relatorios-produtividade" component={RelatoriosProdutividade} />
      <Route path="/alertas" component={Alertas} />
      <Route path="/discrepancias" component={Discrepancias} />
      <Route path="/pendencias" component={Pendencias} />
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
      <Route path="/hierarquia-organizacional" component={HierarquiaOrganizacional} />
      <Route path="/hierarquia-import" component={HierarquiaImport} />
      <Route path="/hierarquia" component={HierarquiaUISA} />
      <Route path="/hierarquia-busca" component={HierarchyView} />
      <Route path="/organograma" component={Organograma} />
      <Route path="/organograma/hierarquia" component={OrganogramaHierarchy} />
      <Route path="/dashboard/notificacoes" component={DashboardNotificacoes} />
      <Route path="/dashboard/auditoria" component={DashboardAuditoria} />
      <Route path="/relatorios/hierarquia" component={RelatoriosHierarquia} />
      <Route path="/admin/emails" component={DashboardEmails} />
      <Route path="/admin/emails-admin-rh" component={AdminRhEmailDashboard} />
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
      {/* Processo AVD - 5 Passos */}
      <Route path="/avd/processo/dashboard" component={ProcessoDashboard} />
      <Route path="/avd/processo/passo1/:processId?" component={Passo1DadosPessoais} />
      <Route path="/avd/processo/passo2/:processId?" component={Passo2PIR} />
      <Route path="/avd/processo/passo3/:processId?" component={Passo3Competencias} />
      <Route path="/avd/processo/passo4/:processId?" component={Passo4Desempenho} />
      <Route path="/avd/processo/passo5/:processId?" component={Passo5PDI} />
      
      {/* Dashboard Administrativo AVD */}
      <Route path="/avd/admin" component={DashboardAdminAVD} />
      <Route path="/avd/processo/detalhes/:processId" component={ProcessoDetalhes} />
      
      {/* Rotas antigas (manter compatibilidade) */}
      <Route path="/avd/passo3/:processId/:employeeId" component={Passo3Competencias} />
      <Route path="/avd/passo4/:processId/:employeeId" component={Passo4Desempenho} />
      <Route path="/avd/passo5/:processId/:employeeId" component={Passo5PDI} />
      
      {/* Rotas Testes Geriátricos */}
      <Route path="/geriatric/patients" component={Patients} />
      <Route path="/geriatric/patient/:id" component={PatientHistory} />
      <Route path="/geriatric/katz-test" component={KatzTest} />
      <Route path="/geriatric/lawton-test" component={LawtonTest} />
      <Route path="/geriatric/minimental-test" component={MiniMentalTest} />
      <Route path="/geriatric/gds-test" component={GDSTest} />
      <Route path="/geriatric/clock-test" component={ClockTest} />
      <Route path="/geriatric/analises" component={TestesGeriatricosAnalises} />
      <Route path="/importacao-html" component={ImportacaoHTML} />
      
      {/* Novos módulos - Três próximos passos */}
      <Route path="/relatorios/personalizados" component={CustomReportBuilder} />
      <Route path="/analytics/preditiva" component={PredictiveAnalytics} />
      <Route path="/feedback/continuo" component={ContinuousFeedback} />
      
      {/* Novos recursos - Exportação e Análise de Evolução */}
      <Route path="/relatorios/exportacao" component={ExportacaoRelatorios} />
      <Route path="/analytics/evolucao" component={AnaliseEvolucao} />
      
      {/* Novas rotas - Dashboard de Aprovações de Cargos e Testes de Integridade */}
      <Route path="/job-descriptions/dashboard" component={DashboardAprovacoesCargos} />
      <Route path="/job-descriptions/novo" component={FormularioCargo} />
      <Route path="/job-descriptions/editar/:id" component={FormularioCargo} />
      <Route path="/integrity-tests" component={TestesIntegridade} />
      
      {/* Passos 4, 5 e 6 - Resultados e Dashboard Admin */}
      <Route path="/resultados/:participantId" component={ResultadosIndividuais} />
      <Route path="/admin/dashboard-processos" component={DashboardAdmin} />
      <Route path="/admin/email-monitoring" component={EmailMonitoring} />
      <Route path="/admin/test-monitoring" component={TestMonitoringDashboard} />
      
      {/* Testes A/B e NPS */}
      <Route path="/admin/ab-tests" component={ABTestDashboard} />
      <Route path="/admin/nps" component={NPSDashboard} />
      <Route path="/admin/nps/consolidated-report" component={AdminConsolidatedNpsReport} />
      <Route path="/admin/nps/scheduled-triggers" component={NpsScheduledTriggers} />
      
      {/* Competências por Cargo, Metas Individuais e Pesos de Avaliação */}
      <Route path="/admin/competencias-por-cargo" component={CompetenciasPorCargo} />
      <Route path="/admin/metas-individuais" component={MetasIndividuais} />
      <Route path="/admin/pesos-avaliacao" component={PesosAvaliacao} />
      <Route path="/admin/benchmark-desempenho" component={BenchmarkDesempenho} />
      <Route path="/admin/ab-experiments" component={AbTestExperiments} />
      
      {/* Dashboard de Movimentações */}
      <Route path="/admin/movimentacoes" component={DashboardMovimentacoes} />
      
      {/* Ferramentas Administrativas */}
      <Route path="/admin/ferramentas" component={FerramentasAdmin} />
      <Route path="/admin/exportacao-dados" component={ExportacaoDados} />
      <Route path="/admin/notificacoes" component={GerenciamentoNotificacoes} />
      <Route path="/admin/auditoria" component={AuditoriaCompleta} />
      
      {/* Simulados do Piloto e Alertas de Segurança */}
      <Route path="/piloto/simulados" component={PilotSimulations} />
      <Route path="/piloto/simulados-gerenciar" component={SimuladosPiloto} />
      <Route path="/seguranca/alertas" component={SuspiciousAccessDashboard} />
      <Route path="/seguranca/alertas-dashboard" component={DashboardAlertasSeguranca} />
      <Route path="/relatorio-integridade/:assessmentId?" component={IntegrityReport} />
      
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Ativar tracking de erros global
  useErrorTracking();
  
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