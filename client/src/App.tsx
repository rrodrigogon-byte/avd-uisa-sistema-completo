import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/metas"} component={() => <div>Metas (em desenvolvimento)</div>} />
      <Route path={"/avaliacoes"} component={() => <div>Avaliações 360° (em desenvolvimento)</div>} />
      <Route path={"/pdi"} component={() => <div>PDI (em desenvolvimento)</div>} />
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
