import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppShell } from './components/layout/AppShell';
import { ToastStack } from './components/shared/ToastStack';
import { DashboardPage } from './pages/DashboardPage';
import { DeliverablesPage } from './pages/DeliverablesPage';
import { MyWorkPage } from './pages/MyWorkPage';
import { MyReviewsPage } from './pages/MyReviewsPage';
import { AlertHistoryPage } from './pages/AlertHistoryPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { useActiveRole } from './hooks/useActiveRole';
import type { Role } from './api/types';

function homeForRole(role: Role | null): string {
  if (role === 'ENGINEER') return '/my-work';
  return '/dashboard';
}

function HomeRedirect() {
  const role = useActiveRole();
  return <Navigate to={homeForRole(role)} replace />;
}

/**
 * Route-level UX guard. Real authorization lives in the backend / SSO mapping
 * (see ACT MVP Spec v5 §8). This guard exists to keep the URL bar honest with
 * the active membership — it bounces a user away from a page their current
 * role cannot meaningfully use, rather than rendering a broken view.
 */
function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const role = useActiveRole();
  if (role === null) return null; // resolving membership
  if (!allow.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ProjectProvider>
            <BrowserRouter>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route
                    path="/dashboard"
                    element={
                      <RoleGuard allow={['LEAD', 'PM']}>
                        <DashboardPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/deliverables"
                    element={
                      <RoleGuard allow={['LEAD', 'PM', 'ENGINEER']}>
                        <DeliverablesPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/my-work"
                    element={
                      <RoleGuard allow={['LEAD', 'ENGINEER']}>
                        <MyWorkPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/my-reviews"
                    element={
                      <RoleGuard allow={['LEAD', 'ENGINEER', 'PM']}>
                        <MyReviewsPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/alert-history"
                    element={
                      <RoleGuard allow={['LEAD', 'PM']}>
                        <AlertHistoryPage />
                      </RoleGuard>
                    }
                  />
                  <Route path="/alerts" element={<Navigate to="/alert-history" replace />} />
                  <Route
                    path="/settings"
                    element={
                      <RoleGuard allow={['LEAD', 'PM']}>
                        <PlaceholderPage title="Settings" />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/project/:projectId/deliverables/:deliverableId"
                    element={<PlaceholderPage title="Deliverable Deep Link" />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
              <ToastStack />
            </BrowserRouter>
          </ProjectProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
