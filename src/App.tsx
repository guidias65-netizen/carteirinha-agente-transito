import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import NewAgent from "@/pages/NewAgent";
import EditAgent from "@/pages/EditAgent";
import PreviewDemo from "@/pages/PreviewDemo";
import AgentPublicView from "@/pages/AgentPublicView";
import LoginPage from "@/pages/LoginPage";
import AcessoAgente from "@/pages/AcessoAgente";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { loggedIn } = useAuth();
  return (
    <Switch>
      {/* Public routes — no auth needed */}
      <Route path="/consulta/:id" component={AgentPublicView} />
      <Route path="/acesso" component={AcessoAgente} />
      <Route path="/login">
        {loggedIn ? <Redirect to="/" /> : <LoginPage />}
      </Route>

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/novo">
        <ProtectedRoute component={NewAgent} />
      </Route>
      <Route path="/agente/:id">
        <ProtectedRoute component={EditAgent} />
      </Route>
      <Route path="/preview-demo">
        <ProtectedRoute component={PreviewDemo} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
