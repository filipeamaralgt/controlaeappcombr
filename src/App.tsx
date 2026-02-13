import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProfileFilterProvider } from "@/hooks/useProfileFilter";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AppLayout } from "@/components/AppLayout";
import { PremiumGuard } from "@/components/PremiumGuard";
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
import Parcelas from "./pages/Parcelas";
import Dividas from "./pages/Dividas";
import Auth from "./pages/Auth";
import CategoriaTransacoes from "./pages/CategoriaTransacoes";
import AdminIA from "./pages/AdminIA";
import ExportarDados from "./pages/ExportarDados";
import ImportarDados from "./pages/ImportarDados";
import BackupDados from "./pages/BackupDados";
import Assinatura from "./pages/Assinatura";
import Paywall from "./pages/Paywall";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <ProfileFilterProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />

                  {/* Free routes */}
                  <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
                  <Route path="/categorias" element={<AppLayout><Categorias /></AppLayout>} />
                  <Route path="/pagamentos" element={<AppLayout><Pagamentos /></AppLayout>} />
                  <Route path="/lembretes" element={<AppLayout><Lembretes /></AppLayout>} />
                  <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
                  <Route path="/suporte" element={<AppLayout><Suporte /></AppLayout>} />
                  <Route path="/pesquisa" element={<AppLayout><Pesquisa /></AppLayout>} />
                  <Route path="/perfil" element={<AppLayout><Perfil /></AppLayout>} />
                  <Route path="/categoria-transacoes" element={<AppLayout><CategoriaTransacoes /></AppLayout>} />
                  <Route path="/assinatura" element={<AppLayout><Assinatura /></AppLayout>} />
                  <Route path="/paywall" element={<AppLayout><Paywall /></AppLayout>} />

                  {/* Premium routes */}
                  <Route path="/graficos" element={<AppLayout><PremiumGuard><Graficos /></PremiumGuard></AppLayout>} />
                  <Route path="/chat-ia" element={<AppLayout><PremiumGuard><ChatIA /></PremiumGuard></AppLayout>} />
                  <Route path="/metas" element={<AppLayout><PremiumGuard><Metas /></PremiumGuard></AppLayout>} />
                  <Route path="/limites" element={<AppLayout><PremiumGuard><Limites /></PremiumGuard></AppLayout>} />
                  <Route path="/cartoes" element={<AppLayout><PremiumGuard><Cartoes /></PremiumGuard></AppLayout>} />
                  <Route path="/dividas" element={<AppLayout><PremiumGuard><Dividas /></PremiumGuard></AppLayout>} />
                  <Route path="/parcelas" element={<AppLayout><PremiumGuard><Parcelas /></PremiumGuard></AppLayout>} />
                  <Route path="/exportar-dados" element={<AppLayout><PremiumGuard><ExportarDados /></PremiumGuard></AppLayout>} />
                  <Route path="/importar-dados" element={<AppLayout><PremiumGuard><ImportarDados /></PremiumGuard></AppLayout>} />
                  <Route path="/backup" element={<AppLayout><PremiumGuard><BackupDados /></PremiumGuard></AppLayout>} />
                  <Route path="/admin-ia" element={<AppLayout><PremiumGuard><AdminIA /></PremiumGuard></AppLayout>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ProfileFilterProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
