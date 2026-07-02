import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import { SidebarProvider } from "./context/SidebarContext";
import ClientPortal from "./pages/ClientPortal";
import LoginPage from "./pages/LoginPage";
import ClientsPage from "./pages/ClientsPage";
import ReportsArchive from "./pages/ReportsArchive";
import ReportView from "./pages/ReportView";
import SettingsPage from "./pages/SettingsPage";
import UsersPage from "./pages/UsersPage";
import TermsOfUse from "./pages/settings/TermsOfUse";
import PrivacyPolicy from "./pages/settings/PrivacyPolicy";
import ContactSupport from "./pages/settings/ContactSupport";
import PlatformInfo from "./pages/settings/PlatformInfo";
import EmployeeDashboard from "./pages/EmployeeDashboard";


import { setAccessToken, getAccessToken, setUser, clearAuth, getUser } from "./lib/auth";

let authReadyResolve: (() => void) | null = null;
export const authReady = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});
// If auth already initialized (non-refresh navigation), resolve immediately
if (getAccessToken()) {
  authReadyResolve?.();
  authReadyResolve = null;
}

// Dynamic Session Refresher & Token Rotation Engine
function TokenRefresher() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const checkAndRefreshToken = async () => {
      if (window.location.pathname === "/login") {
        authReadyResolve?.();
        authReadyResolve = null;
        return;
      }

      const existingToken = getAccessToken();
      if (existingToken) {
        // Token already present (SPA navigation), just resolve
        authReadyResolve?.();
        authReadyResolve = null;
        return;
      }

      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          setAccessToken(data.access_token);
          const userData = {
            id: data.id || "admin-id",
            name: data.name || "Admin",
            role: data.role || "admin",
            client_id: data.client_id || null,
          };
          localStorage.setItem("bento_user", JSON.stringify(userData));
        } else {
          clearAuth();
          localStorage.removeItem("bento_user");
        }
      } catch {
      } finally {
        authReadyResolve?.();
        authReadyResolve = null;
      }
    };

    checkAndRefreshToken();

    const interval = setInterval(checkAndRefreshToken, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

// Internal team roles that can access admin zone
const INTERNAL_ROLES = ["super_admin", "csm", "hr", "employee", "admin"];

// Logic to protect routes based on login status and user role with multi-tenant isolation
function ProtectedRoute({ children, role, requirePermission }: { children: React.ReactNode; role?: string; requirePermission?: string }) {
  const [ready, setReady] = useState(getAccessToken() !== null);
  const token = getAccessToken();
  const user = getUser();
  const params = useParams();

  useEffect(() => {
    if (!ready) {
      authReady.then(() => setReady(true));
    }
  }, [ready]);

  if (!ready) return null;

  if (!token || !user) return <Navigate to="/login" replace />;
  
  // Enforce employee isolation: only allowed to view reports archive and specific reports
  if (user.role === "employee" && window.location.pathname !== "/admin/reports" && !window.location.pathname.startsWith("/report/")) {
    return <Navigate to="/admin/reports" replace />;
  }

  if (role === "admin") {
    // Allow any internal team role
    if (!INTERNAL_ROLES.includes(user.role)) return <Navigate to="/login" replace />;
  } else if (role && user.role !== role && !INTERNAL_ROLES.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Enforce clients-only page access (CSM and Super Admin)
  if (requirePermission === "clients" && !["super_admin", "admin", "csm"].includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Enforce super_admin-only routes
  if (requirePermission === "manage_users" && user.role !== "super_admin" && user.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (requirePermission === "settings" && user.role !== "super_admin" && user.role !== "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  // Enforce zero-trust client boundary isolation at the routing layer
  const isReportPath = window.location.pathname.startsWith("/report/");
  if (user.role === "client" && params.id && params.id !== user.client_id && !isReportPath) {
    console.error(`🚨 Tenant breach attempt blocked: Client user tried accessing tenant portal ${params.id}`);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Logic to send users to the right home page after login
function RootRedirect() {
  const [ready, setReady] = useState(getAccessToken() !== null);
  const token = getAccessToken();
  const user = getUser();

  useEffect(() => {
    if (!ready) {
      authReady.then(() => setReady(true));
    }
  }, [ready]);

  if (!ready) return null;

  if (!token || !user) return <Navigate to="/login" replace />;

  if (user.role === "employee") {
    return <Navigate to="/admin/reports" replace />;
  }
  if (INTERNAL_ROLES.includes(user.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user.role === "client") {
    return <Navigate to={`/client/${user.client_id}`} replace />;
  }
  
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        {/* Dynamic Session Handler */}
        <TokenRefresher />
        
        <Routes>
          {/* Main Entry Points */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ─── ADMIN ZONE ────────────────────────────────────────────── */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          
          <Route path="/admin/clients" element={
            <ProtectedRoute role="admin" requirePermission="clients"><ClientsPage /></ProtectedRoute>
          } />
          
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin"><ReportsArchive /></ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute role="admin" requirePermission="manage_users"><UsersPage /></ProtectedRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedRoute role="admin" requirePermission="settings"><SettingsPage /></ProtectedRoute>
          } />

          {/* ─── EMPLOYEE WORKSPACE ZONE ───────────────────────────────── */}
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />

          {/* ─── CLIENT ZONE ───────────────────────────────────────────── */}
          <Route path="/client/:id" element={
            <ProtectedRoute><ClientPortal /></ProtectedRoute>
          } />

          {/* ─── REPORT VIEWER ZONE (The dynamic viewer route) ──────────── */}
          <Route path="/report/:id" element={
            <ProtectedRoute><ReportView /></ProtectedRoute>
          } />

          {/* ─── PLATFORM COMPLIANCE SETTINGS ZONE ─────────────────────── */}
          <Route path="/settings/terms" element={
            <ProtectedRoute><TermsOfUse /></ProtectedRoute>
          } />
          <Route path="/settings/privacy" element={
            <ProtectedRoute><PrivacyPolicy /></ProtectedRoute>
          } />
          <Route path="/settings/support" element={
            <ProtectedRoute><ContactSupport /></ProtectedRoute>
          } />
          <Route path="/settings/info" element={
            <ProtectedRoute><PlatformInfo /></ProtectedRoute>
          } />

          {/* ─── FALLBACK ──────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
}