import * as permissions from '../lib/permissions';

export const usePermissions = () => {
  const stored = localStorage.getItem('bento_user');
  let role: string | undefined;

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      role = parsed?.role;
    } catch {
      // ignore parse errors
    }
  }

  return {
    role,
    displayName: role ? permissions.ROLE_DISPLAY_NAMES[role] || role : 'Guest',

    // Action permissions
    canCreateClient: permissions.canCreateClient(role),
    canEditClient: permissions.canEditClient(role),
    canDeleteClient: permissions.canDeleteClient(role),
    canArchiveClient: permissions.canArchiveClient(role),
    canGenerateReports: permissions.canGenerateReports(role),
    canAccessSettings: permissions.canAccessSettings(role),
    canManageUsers: permissions.canManageUsers(role),
    canConnectSocial: permissions.canConnectSocial(role),
    canAccessClientPortal: permissions.canAccessClientPortal(role),
    canUseAi: permissions.canUseAi(role),

    // View permissions
    canViewAllClients: permissions.canViewAllClients(role),
    canViewReports: permissions.canViewReports(role),
    canViewArchive: permissions.canViewArchive(role),
    canDeleteReport: permissions.canDeleteReport(role),

    // Role category
    isInternal: permissions.isInternal(role),
  };
};
