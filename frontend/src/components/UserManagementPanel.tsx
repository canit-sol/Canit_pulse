import { useEffect, useState } from "react";
import {
  Plus, Edit2, Trash2, RefreshCw, Search, X,
  Shield, UserCheck, UserX, Eye, EyeOff, Loader2,
  Users, ShieldCheck, Briefcase, HeartHandshake, AlertCircle
} from "lucide-react";

const API = "http://localhost:8000/api";

interface TeamUser {
  id: string;
  username: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  super_admin: { label: "Super Admin", icon: ShieldCheck, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  csm:         { label: "CSM",         icon: HeartHandshake, color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  hr:          { label: "HR",          icon: Users, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  employee:    { label: "Employee",    icon: Briefcase, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  admin:       { label: "Admin",       icon: Shield, color: "text-slate-700", bg: "bg-slate-50 border-slate-200" },
};

function authHeaders() {
  const token = localStorage.getItem("bento_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<TeamUser | null>(null);
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formRole, setFormRole] = useState("employee");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Reset password modal
  const [resetTarget, setResetTarget] = useState<TeamUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);

  // Custom Alert Modal State
  const [alertState, setAlertState] = useState<{ title: string; message: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { headers: authHeaders() });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error("Failed to fetch users", e); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setFormName(""); setFormUsername(""); setFormRole("employee"); setFormPassword("");
    setError(""); setShowModal(true);
  };

  const openEdit = (u: TeamUser) => {
    setEditUser(u);
    setFormName(u.name); setFormUsername(u.username); setFormRole(u.role); setFormPassword("");
    setError(""); setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formUsername.trim()) { setError("Name and username are required."); return; }
    if (!editUser && !formPassword.trim()) { setError("Password is required for new users."); return; }
    setSaving(true); setError("");
    try {
      const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
      const method = editUser ? "PUT" : "POST";
      const body: any = { name: formName, username: formUsername, role: formRole };
      if (!editUser) body.password = formPassword;
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to save user.");
        setSaving(false); return;
      }
      setShowModal(false);
      fetchUsers();
    } catch { setError("Network error."); }
    setSaving(false);
  };

  const handleToggleActive = async (u: TeamUser) => {
    const action = u.is_active ? "deactivate" : "activate";
    try {
      const res = await fetch(`/api/users/${u.id}/${action}`, { method: "POST", headers: authHeaders() });
      if (res.ok) fetchUsers();
      else {
        const data = await res.json();
        setAlertState({ title: "Action Failed", message: data.detail || `Failed to ${action} user.` });
      }
    } catch { setAlertState({ title: "Network Error", message: "Failed to connect to the server." }); }
  };

  const handleResetPassword = async () => {
    if (!resetPassword.trim() || !resetTarget) return;
    setResetSaving(true);
    try {
      const res = await fetch(`/api/users/${resetTarget.id}/reset-password`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ password: resetPassword }),
      });
      if (res.ok) { setResetTarget(null); setResetPassword(""); }
      else { const data = await res.json(); setAlertState({ title: "Reset Failed", message: data.detail || "Failed to reset password." }); }
    } catch { setAlertState({ title: "Network Error", message: "Failed to connect to the server." }); }
    setResetSaving(false);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#1a1a1a] font-heading">User Management</h1>
          <p className="text-sm text-gray-400 mt-1 font-heading">Manage internal team access and roles</p>
        </div>
        <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#113a87] text-white rounded-xl font-bold text-sm hover:bg-[#0e2f6e] transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, username, or role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87]/40 transition-all font-heading"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#113a87]" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-slate-50/60">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">User</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Created</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const meta = ROLE_META[u.role] || ROLE_META.employee;
                    const RoleIcon = meta.icon;
                    return (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#113a87] to-[#1e56b8] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                              {u.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1a1a1a] font-heading">{u.name}</p>
                              <p className="text-xs text-gray-400 font-heading">{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-bold ${meta.bg} ${meta.color}`}>
                            <RoleIcon className="w-3.5 h-3.5" />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 font-heading">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(u)} title="Edit" className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setResetTarget(u); setResetPassword(""); }} title="Reset Password" className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleToggleActive(u)} title={u.is_active ? "Deactivate" : "Activate"} className={`p-2 rounded-lg transition-colors ${u.is_active ? "hover:bg-red-50 text-gray-400 hover:text-red-600" : "hover:bg-green-50 text-gray-400 hover:text-green-600"}`}>
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-gray-400 font-heading text-sm">
                        {search ? "No users match your search." : "No internal users found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-black text-[#1a1a1a] font-heading mb-4">
                {editUser ? "Edit User" : "Create User"}
              </h2>
              {error && <div className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2 mb-4 font-heading">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Full Name</label>
                  <input value={formName} onChange={e => setFormName(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 font-heading" placeholder="e.g. Raj Kumar" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Username</label>
                  <input value={formUsername} onChange={e => setFormUsername(e.target.value)} type="text" className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 font-heading" placeholder="e.g. raj.admin" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Role</label>
                  <select value={formRole} onChange={e => setFormRole(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 font-heading bg-white">
                    <option value="super_admin">Super Admin</option>
                    <option value="csm">CSM</option>
                    <option value="hr">HR</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                {!editUser && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider font-heading">Password</label>
                    <div className="relative">
                      <input value={formPassword} onChange={e => setFormPassword(e.target.value)} type={showPassword ? "text" : "password"} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 font-heading pr-10" placeholder="Temporary password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors font-heading">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#113a87] hover:bg-[#0e2f6e] transition-colors shadow-md font-heading disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editUser ? "Save Changes" : "Create User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setResetTarget(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-black text-[#1a1a1a] font-heading mb-1">Reset Password</h2>
              <p className="text-sm text-gray-400 font-heading mb-4">for <span className="font-bold text-gray-600">{resetTarget.name}</span></p>
              <div className="relative">
                <input value={resetPassword} onChange={e => setResetPassword(e.target.value)} type={showPassword ? "text" : "password"} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 font-heading pr-10" placeholder="New password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setResetTarget(null)} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors font-heading">Cancel</button>
                <button onClick={handleResetPassword} disabled={resetSaving || !resetPassword.trim()} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-md font-heading disabled:opacity-50 flex items-center gap-2">
                  {resetSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Alert Modal */}
        {alertState && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAlertState(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center animate-fade-in border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-[#1a1a1a] font-heading mb-2">{alertState.title}</h2>
              <p className="text-sm text-gray-500 font-medium mb-6 font-heading">{alertState.message}</p>
              <button onClick={() => setAlertState(null)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#113a87] hover:bg-[#0e2f6e] transition-colors shadow-md font-heading">
                Okay
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
