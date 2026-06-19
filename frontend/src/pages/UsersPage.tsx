import { useState, useEffect } from "react";
import AppSidebar from "../components/AppSidebar";
import { useSidebar } from "../context/SidebarContext";
import {
  UsersRound, Plus, Trash2, Edit, Loader2
} from "lucide-react";
import { getApiUrl } from "@/config/api";

function authHeaders() {
  const token = localStorage.getItem("bento_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function UsersPage() {
  const { collapsed } = useSidebar();
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");

  // --- User Management state ---
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleSelect, setRoleSelect] = useState("employee");

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch(getApiUrl(`/users`), { headers: authHeaders() });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    try {
      const res = await fetch(getApiUrl(`/users`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: fullName,
          username: usernameInput,
          password: passwordInput,
          role: roleSelect,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess("User added successfully!");
        setShowAddModal(false);
        setFullName("");
        setUsernameInput("");
        setPasswordInput("");
        setRoleSelect("employee");
        fetchUsers();
      } else {
        setUserError(data.detail || "Failed to add user.");
      }
    } catch (err) {
      setUserError("Network error.");
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    if (!selectedUser) return;
    try {
      const res = await fetch(getApiUrl(`/users/${selectedUser.id}`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          name: fullName,
          username: usernameInput,
          role: roleSelect,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess("User updated successfully!");
        setShowEditModal(false);
        setSelectedUser(null);
        setFullName("");
        setUsernameInput("");
        fetchUsers();
      } else {
        setUserError(data.detail || "Failed to update user.");
      }
    } catch (err) {
      setUserError("Network error.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    setUserSuccess("");
    if (!selectedUser) return;
    try {
      const res = await fetch(getApiUrl(`/users/${selectedUser.id}/password`), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess("Password reset successfully!");
        setShowResetModal(false);
        setPasswordInput("");
        fetchUsers();
      } else {
        setUserError(data.detail || "Failed to reset password.");
      }
    } catch (err) {
      setUserError("Network error.");
    }
  };

  const handleDeleteUser = async () => {
    setUserError("");
    setUserSuccess("");
    if (!selectedUser) return;
    try {
      const res = await fetch(getApiUrl(`/users/${selectedUser.id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setUserSuccess("User deleted successfully!");
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        setUserError(data.detail || "Failed to delete user.");
      }
    } catch (err) {
      setUserError("Network error.");
    }
  };

  return (
    <div className={`min-h-screen bg-transparent transition-[padding] duration-200 ease-in-out ${collapsed ? "pl-0 md:pl-[68px]" : "pl-0 md:pl-56"}`}>
      <AppSidebar />
      <main className="flex-1 p-4 pl-12 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
              <UsersRound size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight font-heading">User Management</h1>
              <p className="text-gray-400 text-sm font-medium">Manage internal CANIT team members and access levels.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* User management card */}
            <div className="glass-panel p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3 mb-6 border-b border-white/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">Active Staff Directory</h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">List of all active administrative and operational office staff.</p>
                </div>
                <button
                  onClick={() => {
                    setFullName("");
                    setUsernameInput("");
                    setPasswordInput("");
                    setRoleSelect("employee");
                    setUserError("");
                    setUserSuccess("");
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#113a87] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#0c2a63] transition-all duration-200"
                >
                  <Plus size={16} /> Add User
                </button>
              </div>

              {userSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-700 text-sm px-4 py-3 rounded-2xl font-bold mb-4">
                  {userSuccess}
                </div>
              )}
              {userError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-sm px-4 py-3 rounded-2xl font-bold mb-4">
                  {userError}
                </div>
              )}

              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#113a87]/60" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-400 font-medium">
                  No office users configured.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 pl-2">Name</th>
                        <th className="pb-3">Username</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Created At</th>
                        <th className="pb-3 text-right pr-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {users.map((u) => {
                        const isSelf = u.id === currentUser.id;
                        let roleBadgeClass = "bg-slate-100 text-slate-600 border-slate-200/50";
                        if (u.role === "super_admin" || u.role === "admin") {
                          roleBadgeClass = "bg-[#113a87]/10 text-[#113a87] border-[#113a87]/20";
                        } else if (u.role === "csm") {
                          roleBadgeClass = "bg-purple-100 text-purple-800 border-purple-200/50";
                        } else if (u.role === "hr") {
                          roleBadgeClass = "bg-green-100 text-green-800 border-green-200/50";
                        }

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 pl-2 font-bold text-slate-800 text-sm">
                              {u.name} {isSelf && <span className="text-[10px] text-[#113a87] bg-[#113a87]/5 px-2 py-0.5 rounded-full font-bold ml-1">You</span>}
                            </td>
                            <td className="py-4 text-slate-500 text-sm font-medium">{u.username}</td>
                            <td className="py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${roleBadgeClass}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-4 text-slate-400 text-xs font-medium">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                            </td>
                            <td className="py-4 text-right pr-2">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setFullName(u.name);
                                    setUsernameInput(u.username);
                                    setRoleSelect(u.role);
                                    setUserError("");
                                    setUserSuccess("");
                                    setShowEditModal(true);
                                  }}
                                  className="p-2 text-slate-500 hover:text-[#113a87] hover:bg-slate-100 rounded-lg transition-all"
                                  title="Edit User"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setUserError("");
                                    setUserSuccess("");
                                    setShowDeleteConfirm(true);
                                  }}
                                  disabled={isSelf}
                                  className={`p-2 rounded-lg transition-all ${isSelf ? "text-slate-200 cursor-not-allowed" : "text-slate-500 hover:text-red-600 hover:bg-red-50"}`}
                                  title={isSelf ? "Cannot delete yourself" : "Delete User"}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ─── Add User Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 font-heading">Add New CANIT Staff User</h3>
            {userError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs px-4 py-3 rounded-xl font-bold mb-4">
                {userError}
              </div>
            )}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. raj_canit"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Password</label>
                <input
                  type="text"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Password (plain text)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Role</label>
                <select
                  value={roleSelect}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm font-medium"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="csm">CSM</option>
                  <option value="hr">HR</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#113a87] hover:bg-[#0c2a63] text-white rounded-xl font-bold text-sm transition-all shadow-md"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit User Modal ─── */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 font-heading">Edit Staff User</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setPasswordInput("");
                  setUserError("");
                  setUserSuccess("");
                  setShowResetModal(true);
                }}
                className="text-xs font-bold text-[#113a87] hover:text-[#0c2a63] hover:underline"
              >
                Reset Password
              </button>
            </div>
            {userError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs px-4 py-3 rounded-xl font-bold mb-4">
                {userError}
              </div>
            )}
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Username"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">Role</label>
                <select
                  value={roleSelect}
                  onChange={(e) => setRoleSelect(e.target.value)}
                  disabled={selectedUser.id === currentUser.id}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="csm">CSM</option>
                  <option value="hr">HR</option>
                  <option value="employee">Employee</option>
                </select>
                {selectedUser.id === currentUser.id && (
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">You cannot change your own role.</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#113a87] hover:bg-[#0c2a63] text-white rounded-xl font-bold text-sm transition-all shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Reset Password Modal ─── */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading">Reset Staff Password</h3>
            <p className="text-xs text-slate-400 mb-4 font-medium">Set a new password for <span className="font-bold text-slate-600">{selectedUser.name}</span>.</p>
            {userError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs px-4 py-3 rounded-xl font-bold mb-4">
                {userError}
              </div>
            )}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">New Password</label>
                <input
                  type="text"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="New Password (plain text)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] transition-all text-slate-800 text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setShowEditModal(true);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#113a87] hover:bg-[#0c2a63] text-white rounded-xl font-bold text-sm transition-all shadow-md"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 max-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading">Delete Staff Account?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium">Are you sure you want to permanently delete <span className="font-bold text-slate-700">{selectedUser.name} ({selectedUser.username})</span>? This action cannot be undone.</p>
            {userError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs px-4 py-3 rounded-xl font-bold mb-4">
                {userError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-md"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
