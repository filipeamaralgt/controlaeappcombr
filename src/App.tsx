import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Graficos from "./pages/Graficos";
import Categorias from "./pages/Categorias";
import Pagamentos from "./pages/Pagamentos";
import Lembretes from "./pages/Lembretes";
import Configuracoes from "./pages/Configuracoes";
import Suporte from "./pages/Suporte";
import Pesquisa from "./pages/Pesquisa";
import ChatIA from "./pages/ChatIA";
import Perfil from "./pages/Perfil";
import Metas from "./pages/Metas";
import Limites from "./pages/Limites";
import Cartoes from "./pages/Cartoes";
import Auth from "./pages/Auth";
import CategoriaTransacoes from "./pages/CategoriaTransacoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/graficos"
                element={
                  <AppLayout>
                    <Graficos />
                  </AppLayout>
                }
              />
              <Route
                path="/categorias"
                element={
                  <AppLayout>
                    <Categorias />
                  </AppLayout>
                }
              />
              <Route
                path="/pagamentos"
                element={
                  <AppLayout>
                    <Pagamentos />
                  </AppLayout>
                }
              />
              <Route
                path="/lembretes"
                element={
                  <AppLayout>
                    <Lembretes />
                  </AppLayout>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <AppLayout>
                    <Configuracoes />
                  </AppLayout>
                }
              />
              <Route
                path="/suporte"
                element={
                  <AppLayout>
                    <Suporte />
                  </AppLayout>
                }
              />
              <Route
                path="/pesquisa"
                element={
                  <AppLayout>
                    <Pesquisa />
                  </AppLayout>
                }
              />
              <Route
                path="/chat-ia"
                element={
                  <AppLayout>
                    <ChatIA />
                  </AppLayout>
                }
              />
              <Route
                path="/perfil"
                element={
                  <AppLayout>
                    <Perfil />
                  </AppLayout>
                }
              />
              <Route
                path="/metas"
                element={
                  <AppLayout>
                    <Metas />
                  </AppLayout>
                }
              />
              <Route
                path="/limites"
                element={
                  <AppLayout>
                    <Limites />
                  </AppLayout>
                }
              />
              <Route
                path="/categoria-transacoes"
                element={
                  <AppLayout>
                    <CategoriaTransacoes />
                  </AppLayout>
                }
              />
              <Route
                path="/cartoes"
                element={
                  <AppLayout>
                    <Cartoes />
                  </AppLayout>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
