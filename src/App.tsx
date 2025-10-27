import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Backlog from "./pages/Backlog";
import SprintPlanning from "./pages/SprintPlanning";
import Daily from "./pages/Daily";
import HistoricoDaily from "./pages/HistoricoDaily";
import Retrospectiva from "./pages/Retrospectiva";
import Projetos from "./pages/Projetos";
import Auth from "./pages/Auth";
import Administracao from "./pages/Administracao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/backlog" element={<ProtectedRoute><Backlog /></ProtectedRoute>} />
          <Route path="/sprint-planning" element={<ProtectedRoute><SprintPlanning /></ProtectedRoute>} />
          <Route path="/daily" element={<ProtectedRoute><Daily /></ProtectedRoute>} />
          <Route path="/daily/historico" element={<ProtectedRoute><HistoricoDaily /></ProtectedRoute>} />
          <Route path="/retrospectiva" element={<ProtectedRoute><Retrospectiva /></ProtectedRoute>} />
          <Route path="/projetos" element={<ProtectedRoute><Projetos /></ProtectedRoute>} />
          <Route path="/administracao" element={<ProtectedRoute><Administracao /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
