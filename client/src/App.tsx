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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/metas"} component={Metas} />
      <Route path={"/avaliacoes"} component={Avaliacoes} />
      <Route path={"/pdi"} component={PDI} />
      <Route path={"/nine-box"} component={() => <div>Matriz 9-Box (em desenvolvimento)</div>} />
      <Route path={"/relatorios"} component={() => <div>Relatórios (em desenvolvimento)</div>} />
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
