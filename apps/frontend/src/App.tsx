import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthInitializer } from './components/AuthInitializer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToasterProvider } from './components/ui/ToasterProvider';

// Layouts (small — always loaded)
import { PrivateLayout } from './layouts/PrivateLayout';
import { PublicLayout } from './layouts/PublicLayout';

// Lazy-loaded pages (code splitting)
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite').then((m) => ({ default: m.AcceptInvite })));
const EmailVerified = lazy(() => import('./pages/EmailVerified').then((m) => ({ default: m.EmailVerified })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const Team = lazy(() => import('./pages/Team').then((m) => ({ default: m.Team })));
const Valuation = lazy(() => import('./pages/Valuation').then((m) => ({ default: m.Valuation })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const ImportPage = lazy(() => import('./pages/ImportPage').then((m) => ({ default: m.ImportPage })));
const WaitingSetup = lazy(() => import('./pages/WaitingSetup').then((m) => ({ default: m.WaitingSetup })));

/* Suspense fallback — reuses design tokens */
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[200px]">
    <Loader2 className="w-6 h-6 text-brand animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthInitializer>
          <ToasterProvider />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/accept-invite" element={<AcceptInvite />} />
                <Route path="/email-verified" element={<EmailVerified />} />
              </Route>

              {/* Private Routes */}
              <Route element={<PrivateLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/import" element={<ImportPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/team" element={<Team />} />
                <Route path="/valuation" element={<Valuation />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* Standalone (no sidebar/topbar) */}
              <Route path="/waiting-setup" element={<WaitingSetup />} />
              <Route path="/" element={<LandingPage />} />

              {/* Fallbacks */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthInitializer>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;