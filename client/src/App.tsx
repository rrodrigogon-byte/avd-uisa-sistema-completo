import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import TemplateForm from "./pages/TemplateForm";
import Evaluations from "./pages/Evaluations";
import EvaluationForm from "./pages/EvaluationForm";
import Notifications from "./pages/Notifications";
import Reports from "./pages/Reports";
import PIR from "./pages/PIR";
import JobDescriptions from "./pages/JobDescriptions";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/templates"} component={Templates} />
      <Route path={"/templates/new"} component={TemplateForm} />
      <Route path={"/evaluations"} component={Evaluations} />
      <Route path={"/evaluations/new"} component={EvaluationForm} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/pir"} component={PIR} />
      <Route path={"/job-descriptions"} component={JobDescriptions} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
