import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProfileFilterProvider } from "@/hooks/useProfileFilter";
import { AppLayout } from "@/components/AppLayout";
import { isNativeApp } from "@/lib/platform";
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
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Leads from "./pages/Leads";
import MarketingDashboard from "./pages/MarketingDashboard";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import { HomeRedirect } from "./components/HomeRedirect";
import { ScrollToTop } from "./components/ScrollToTop";

// Stripe pages — lazy-loaded and only rendered on web (never on Capacitor/native)
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
          <ProfileFilterProvider>
            <TooltipProvider>
              {/* Toasters removed — no notifications */}
              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/landing" element={<Landing />} />
                  {!isNativeApp() && (
                    <>
                      <Route path="/checkout" element={<Suspense fallback={null}><Checkout /></Suspense>} />
                      <Route path="/checkout/sucesso" element={<Suspense fallback={null}><CheckoutSuccess /></Suspense>} />
                    </>
                  )}
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/politica-de-privacidade" element={<PoliticaPrivacidade />} />

                  {/* Free routes */}
                  <Route path="/" element={<HomeRedirect><AppLayout><Dashboard /></AppLayout></HomeRedirect>} />
                  <Route path="/categorias" element={<AppLayout><Categorias /></AppLayout>} />
                  <Route path="/pagamentos" element={<AppLayout><Pagamentos /></AppLayout>} />
                  <Route path="/lembretes" element={<AppLayout><Lembretes /></AppLayout>} />
                  <Route path="/configuracoes" element={<AppLayout><Configuracoes /></AppLayout>} />
                  <Route path="/suporte" element={<AppLayout><Suporte /></AppLayout>} />
                  <Route path="/pesquisa" element={<AppLayout><Pesquisa /></AppLayout>} />
                  <Route path="/perfil" element={<AppLayout><Perfil /></AppLayout>} />
                  <Route path="/categoria-transacoes" element={<AppLayout><CategoriaTransacoes /></AppLayout>} />
                  <Route path="/graficos" element={<AppLayout><Graficos /></AppLayout>} />
                  <Route path="/chat-ia" element={<AppLayout><ChatIA /></AppLayout>} />
                  <Route path="/metas" element={<AppLayout><Metas /></AppLayout>} />
                  <Route path="/limites" element={<AppLayout><Limites /></AppLayout>} />
                  <Route path="/cartoes" element={<AppLayout><Cartoes /></AppLayout>} />
                  <Route path="/dividas" element={<AppLayout><Dividas /></AppLayout>} />
                  <Route path="/parcelas" element={<AppLayout><Parcelas /></AppLayout>} />
                  <Route path="/exportar-dados" element={<AppLayout><ExportarDados /></AppLayout>} />
                  <Route path="/importar-dados" element={<AppLayout><ImportarDados /></AppLayout>} />
                  <Route path="/backup" element={<AppLayout><BackupDados /></AppLayout>} />
                  <Route path="/admin-ia" element={<AppLayout><AdminIA /></AppLayout>} />
                  <Route path="/dashboard/leads" element={<AppLayout><Leads /></AppLayout>} />
                  <Route path="/marketing" element={<AppLayout><MarketingDashboard /></AppLayout>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ProfileFilterProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
