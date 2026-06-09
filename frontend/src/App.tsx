import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
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

// Dynamic Session Refresher & Token Rotation Engine
function TokenRefresher() {
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      // Skip entirely on the login page to prevent 401 console spam
      if (window.location.pathname === "/login") return;

      const token = localStorage.getItem("bento_token");
      const refreshToken = localStorage.getItem("bento_refresh_token");
      if (!token || !refreshToken) return;

      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("bento_token", data.access_token);
          localStorage.setItem("bento_refresh_token", data.refresh_token);
          localStorage.setItem("bento_user", JSON.stringify({
            id: data.id || "admin-id",
            name: data.name || "Admin",
            role: data.role || "admin",
            client_id: data.client_id || null,
          }));
        } else {
          // Silently clear stale session without triggering redirect loops
          localStorage.removeItem("bento_token");
          localStorage.removeItem("bento_refresh_token");
          localStorage.removeItem("bento_user");
        }
      } catch {
        // Network error — do not crash or spam console
      }
    };

    // Validate/refresh session immediately on mount
    checkAndRefreshToken();

    // 10-minute rotation interval (15-minute access token lifespan)
    const interval = setInterval(checkAndRefreshToken, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return null;
}

// Internal team roles that can access admin zone
const INTERNAL_ROLES = ["super_admin", "csm", "hr", "employee", "admin"];

// Logic to protect routes based on login status and user role with multi-tenant isolation
function ProtectedRoute({ children, role, requirePermission }: { children: React.ReactNode; role?: string; requirePermission?: string }) {
  const token = localStorage.getItem("bento_token");
  const user = JSON.parse(localStorage.getItem("bento_user") || "null");
  const params = useParams();

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
// If role is super_admin, csm, hr, or employee -> redirect to /admin/dashboard
// If role is client -> redirect to /client/{client_id}
function RootRedirect() {
  const token = localStorage.getItem("bento_token");
  const user = JSON.parse(localStorage.getItem("bento_user") || "null");

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