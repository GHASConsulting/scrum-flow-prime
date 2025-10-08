import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Backlog from "./pages/Backlog";
import SprintPlanning from "./pages/SprintPlanning";
import Daily from "./pages/Daily";
import Review from "./pages/Review";
import Retrospectiva from "./pages/Retrospectiva";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/backlog" element={<Backlog />} />
        <Route path="/sprint-planning" element={<SprintPlanning />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/review" element={<Review />} />
        <Route path="/retrospectiva" element={<Retrospectiva />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
