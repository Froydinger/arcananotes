import React from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PWAInstall } from "./components/pwa/PWAInstall";
import { PWAUpdateNotification } from "./components/pwa/PWAUpdateNotification";
import Index from "./pages/Index";
import NotePage from "./pages/NotePage";
import PromptsPage from "./pages/PromptsPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import RefundsPage from "./pages/RefundsPage";
import NotFound from "./pages/NotFound";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import LanderPage from "./pages/LanderPage";
import { PreferencesProvider } from "./contexts/PreferencesContext";
import { NotificationToastListener } from "./components/notifications/NotificationToastListener";
import { useAuth } from "./contexts/AuthContext";
import { LoadingSpinner } from "./components/ui/loading-spinner";
const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <PreferencesProvider>
      <NotificationToastListener />
      <AppLayout>{children}</AppLayout>
    </PreferencesProvider>
  );
}

function ForceDarkTheme({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const html = document.documentElement;
    const prevClasses = Array.from(html.classList);
    html.classList.remove('light', 'navy');
    if (!html.classList.contains('dark')) {
      html.classList.add('dark');
    }
    return () => {
      html.classList.remove('dark', 'light', 'navy');
      prevClasses.filter(c => ['dark', 'light', 'navy'].includes(c)).forEach(c => html.classList.add(c));
    };
  }, []);
  return <>{children}</>;
}

function RootRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <ForceDarkTheme><LanderPage /></ForceDarkTheme>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Sonner />
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/forgot-password" element={<ForceDarkTheme><ForgotPasswordPage /></ForceDarkTheme>} />
              <Route path="/reset-password" element={<ForceDarkTheme><ResetPasswordPage /></ForceDarkTheme>} />
              <Route path="/privacy" element={<ForceDarkTheme><PrivacyPage /></ForceDarkTheme>} />
              <Route path="/terms" element={<ForceDarkTheme><TermsPage /></ForceDarkTheme>} />
              <Route path="/refunds" element={<ForceDarkTheme><RefundsPage /></ForceDarkTheme>} />

              <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/note/:id" element={<ProtectedRoute><NotePage /></ProtectedRoute>} />
              <Route path="/prompts" element={<ProtectedRoute><PromptsPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <PWAInstall />
            <PWAUpdateNotification />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
