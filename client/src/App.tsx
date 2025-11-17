import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Metas from "./pages/Metas";
import Avaliacoes from "./pages/Avaliacoes";
import PDI from "./pages/PDI";
import NineBox from "./pages/NineBox";
import Relatorios from "./pages/Relatorios";
import Calibracao from "./pages/Calibracao";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/metas"} component={Metas} />
      <Route path={"/avaliacoes"} component={Avaliacoes} />
      <Route path={"/pdi"} component={PDI} />
      <Route path={"/nine-box"} component={NineBox} />
      <Route path={'/relatorios'} component={Relatorios} />
      <Route path={'/calibracao'} component={Calibracao} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
