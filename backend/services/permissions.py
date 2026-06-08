"""
CANIT Pulse — RBAC Permissions Engine

Roles:
  • super_admin — Full platform access (Raj, Sharmu, Jaishree)
  • csm         — Client management, reports, social (no delete/settings/users)
  • hr          — View-only access (dashboard, reports, client info)
  • employee    — View-only access (dashboard, reports, calendar, analytics)
  • client      — Own dashboard only (assigned via Client Access Portal)
  • admin       — Legacy alias → maps to super_admin capabilities
"""


def can_create_client(role: str) -> bool:
    return role in ("super_admin", "csm", "admin")

def can_edit_client(role: str) -> bool:
    return role in ("super_admin", "csm", "admin")

def can_delete_client(role: str) -> bool:
    return role in ("super_admin", "admin")

def can_archive_client(role: str) -> bool:
    return role in ("super_admin", "admin")

def can_generate_reports(role: str) -> bool:
    return role in ("super_admin", "csm", "admin")

def can_access_settings(role: str) -> bool:
    return role in ("super_admin", "admin")

def can_manage_users(role: str) -> bool:
    return role in ("super_admin", "admin")

def can_connect_social(role: str) -> bool:
    return role in ("super_admin", "csm", "admin")

def can_access_client_portal(role: str) -> bool:
    return role in ("super_admin", "csm", "client", "admin")

def can_view_all_clients(role: str) -> bool:
    return role in ("super_admin", "csm", "hr", "admin")

def can_view_reports(role: str) -> bool:
    return role in ("super_admin", "csm", "hr", "employee", "admin")

def can_delete_report(role: str) -> bool:
    return role in ("super_admin", "admin")

def is_internal(role: str) -> bool:
    """Returns True for all internal team roles (NOT client)."""
    return role in ("super_admin", "csm", "hr", "employee", "admin")

def can_use_ai(role: str) -> bool:
    return role in ("super_admin", "csm", "hr", "employee", "client", "admin")
