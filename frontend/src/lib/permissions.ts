// CANIT Pulse — Frontend RBAC Permissions Engine
// Maps roles to specific UI capabilities

export type UserRole = "super_admin" | "csm" | "hr" | "employee" | "client" | "admin";

export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  super_admin: "Super Admin",
  csm: "CSM",
  hr: "HR",
  employee: "Employee",
  client: "Client",
  admin: "Super Admin", // Legacy alias
};

// ── Permission Helpers ──────────────────────────────────

export const canCreateClient = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "admin"].includes(role);

export const canEditClient = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "admin"].includes(role);

export const canDeleteClient = (role: string | undefined): boolean =>
  !!role && ["super_admin", "admin"].includes(role);

export const canArchiveClient = (role: string | undefined): boolean =>
  !!role && ["super_admin", "admin"].includes(role);

export const canGenerateReports = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "admin"].includes(role);

export const canAccessSettings = (role: string | undefined): boolean =>
  !!role && ["super_admin", "admin"].includes(role);

export const canManageUsers = (role: string | undefined): boolean =>
  !!role && ["super_admin", "admin"].includes(role);

export const canConnectSocial = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "admin"].includes(role);

export const canAccessClientPortal = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "client", "admin"].includes(role);

export const canViewAllClients = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "hr", "admin"].includes(role);

export const canViewReports = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "hr", "employee", "admin"].includes(role);

export const canViewArchive = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "hr", "employee", "admin"].includes(role);

export const canDeleteReport = (role: string | undefined): boolean =>
  !!role && ["super_admin", "admin"].includes(role);

export const isInternal = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "hr", "employee", "admin"].includes(role);

export const canUseAi = (role: string | undefined): boolean =>
  !!role && ["super_admin", "csm", "hr", "employee", "client", "admin"].includes(role);
