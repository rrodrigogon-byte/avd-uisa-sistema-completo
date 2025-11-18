import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Home from "./pages/Home";
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
import Departamentos from "./pages/Departamentos";
import CentrosCusto from "./pages/CentrosCusto";
import AprovacoesD from "./pages/aprovacoes/Dashboard";
import MinhasSolicitacoes from "./pages/aprovacoes/MinhasSolicitacoes";
import Bonus from "./pages/aprovacoes/Bonus";
import Workflows from "./pages/aprovacoes/Workflows";
import Sucessao from "./pages/Sucessao";
import PerformanceIntegrada from "./pages/PerformanceIntegrada";
import Avaliacao360Enhanced from "./pages/Avaliacao360Enhanced";
import AuditTrail from "./pages/AuditTrail";
import Analytics from "./pages/Analytics";
import PsychometricTests from "./pages/PsychometricTests";
import TestDISC from "./pages/TestDISC";
import TestBigFive from "./pages/TestBigFive";
import TestMBTI from "./pages/TestMBTI";
import TestIE from "./pages/TestIE";
import TestVARK from "./pages/TestVARK";
import AdminSmtp from "./pages/AdminSmtp";
import EmailMetrics from "./pages/EmailMetrics";
import Avaliar360 from "./pages/Avaliar360";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/metas"} component={Metas} />
      <Route path={"/avaliacoes"} component={Avaliacoes} />
      <Route path={"/pdi"} component={PDI} />
      <Route path={"/nine-box"} component={NineBox} />
      <Route path={'/relatorios'} component={Relatorios} />
      <Route path="/calibracao" component={Calibracao} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/perfil" component={Perfil} />
      <Route path="/historico" component={History} />
      <Route path="/funcionarios" component={Funcionarios} />
      <Route path="/departamentos" component={Departamentos} />
      <Route path="/centros-custo" component={CentrosCusto} />
      <Route path="/aprovacoes/dashboard" component={AprovacoesD} />
      <Route path="/aprovacoes/solicitacoes" component={MinhasSolicitacoes} />
      <Route path="/aprovacoes/bonus" component={Bonus} />
      <Route path="/aprovacoes/workflows" component={Workflows} />
      <Route path="/sucessao" component={Sucessao} />
      <Route path="/performance-integrada" component={PerformanceIntegrada} />
      <Route path="/360-enhanced" component={Avaliacao360Enhanced} />
      <Route path="/testes-psicometricos" component={PsychometricTests} />
      <Route path="/teste-disc" component={TestDISC} />
      <Route path="/teste-bigfive" component={TestBigFive} />
      <Route path="/teste-mbti" component={TestMBTI} />
      <Route path="/teste-ie" component={TestIE} />
      <Route path="/teste-vark" component={TestVARK} />
      <Route path="/admin/smtp" component={AdminSmtp} />
      <Route path="/admin/email-metrics" component={EmailMetrics} />
                <Route path="/avaliar-360/:id" component={Avaliar360} />
          <Route path="/admin/audit-log" component={AuditTrail} />
          <Route path="/admin/analytics" component={Analytics} />
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