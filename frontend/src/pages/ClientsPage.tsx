import { useEffect, useState } from "react";
import { RefreshCw, Copy, Check, Eye, EyeOff, Lock, Globe, ShieldCheck, ShieldAlert, KeyRound, Ban, CheckCircle2, Pencil } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import { useSidebar } from "@/context/SidebarContext";

function authHeaders() {
  const token = localStorage.getItem("bento_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const getAvatarColors = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: "bg-indigo-50/80 border-indigo-100 text-[#113a87]" },
    { bg: "bg-emerald-50/80 border-emerald-100 text-emerald-700" },
    { bg: "bg-amber-50/80 border-amber-100 text-amber-700" },
    { bg: "bg-sky-50/80 border-sky-100 text-sky-700" },
    { bg: "bg-violet-50/80 border-violet-100 text-violet-700" },
    { bg: "bg-rose-50/80 border-rose-100 text-rose-700" },
  ];
  return colors[hash % colors.length];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

export default function ClientsPage() {
  const { collapsed } = useSidebar();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Provision form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  
  // Password reset states
  const [isResetting, setIsResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  
  // Single-view generated credentials (cleared when closing panel)
  const [generatedCreds, setGeneratedCreds] = useState<{ username: string; code: string } | null>(null);
  
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameValue, setEditUsernameValue] = useState("");
  
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchClients = () => {
    fetch("/api/clients", { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setClients(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const generateRandomPassword = (target: "provision" | "reset") => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    const pass = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    if (target === "provision") {
      setPassword(pass);
    } else {
      setNewPassword(pass);
    }
  };

  const handleCreateLogin = async (e: React.FormEvent, client: any) => {
    e.preventDefault();
    setMessage("Provisioning access...");
    setGeneratedCreds(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/users`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ identifier, password, name: "Client User" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("");
        setGeneratedCreds({ username: identifier, code: password });
        setIdentifier("");
        setPassword("");
        fetchClients();
      } else {
        const errorText = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Unknown validation error";
        setMessage(`❌ ${errorText}`);
      }
    } catch (err: any) {
      setMessage(`❌ Server error: ${err.message || 'Network/Parse failed'}`);
    }
  };

  const handleResetPassword = async (client: any) => {
    if (!newPassword.trim()) {
      setMessage("❌ Access code cannot be empty.");
      return;
    }
    setMessage("Resetting access code...");
    setGeneratedCreds(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/reset-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("");
        setGeneratedCreds({ username: client.access_username, code: newPassword });
        setNewPassword("");
        setIsResetting(false);
        fetchClients();
      } else {
        const errorText = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Unknown reset error";
        setMessage(`❌ ${errorText}`);
      }
    } catch (err: any) {
      setMessage(`❌ Server error: ${err.message || 'Network/Parse failed'}`);
    }
  };

  const handleRevokeAccess = async (client: any) => {
    setMessage("Revoking client access...");
    setGeneratedCreds(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/revoke-access`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        setMessage("✅ Client access revoked instantly.");
        fetchClients();
      } else {
        const data = await res.json();
        setMessage(`❌ ${data.detail || "Failed to revoke access."}`);
      }
    } catch (err: any) {
      setMessage(`❌ Server error: ${err.message}`);
    }
  };

  const handleReactivateAccess = async (client: any) => {
    setMessage("Reactivating client access...");
    setGeneratedCreds(null);
    try {
      const res = await fetch(`/api/clients/${client.id}/reactivate-access`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        setMessage("✅ Client access reactivated.");
        fetchClients();
      } else {
        const data = await res.json();
        setMessage(`❌ ${data.detail || "Failed to reactivate access."}`);
      }
    } catch (err: any) {
      setMessage(`❌ Server error: ${err.message}`);
    }
  };

  const handleUpdateUsername = async (client: any) => {
    const username = (editUsernameValue as any).strip?.() || editUsernameValue.trim().toLowerCase();
    
    // Client-side validations:
    if (!username) {
      setMessage("❌ Username cannot be empty.");
      return;
    }
    if (username.includes(" ")) {
      setMessage("❌ Username cannot contain spaces.");
      return;
    }
    if (username.length < 3 || username.length > 30) {
      setMessage("❌ Username must be between 3 and 30 characters.");
      return;
    }
    
    setMessage("Updating username...");
    try {
      const res = await fetch(`/api/clients/${client.id}/update-username`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Username updated successfully.");
        setIsEditingUsername(false);
        fetchClients();
      } else {
        const errorText = data.detail ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)) : "Unknown validation error";
        setMessage(`❌ ${errorText}`);
      }
    } catch (err: any) {
      setMessage(`❌ Server error: ${err.message || 'Network/Parse failed'}`);
    }
  };
 
  const toggleSelect = (client: any) => {
    const isSelected = selectedId === client.id;
    if (isSelected) {
      // Clear panel states on close to eliminate raw credentials from state
      setSelectedId(null);
      setIdentifier("");
      setPassword("");
      setNewPassword("");
      setIsResetting(false);
      setIsEditingUsername(false);
      setEditUsernameValue("");
      setGeneratedCreds(null);
      setMessage("");
    } else {
      setSelectedId(client.id);
      setIdentifier("");
      setPassword("");
      setNewPassword("");
      setIsResetting(false);
      setIsEditingUsername(false);
      setEditUsernameValue(client.access_username || "");
      setGeneratedCreds(null);
      setMessage("");
    }
  };

  return (
    <div className={`min-h-screen bg-transparent transition-[padding] duration-200 ease-in-out ${collapsed ? "pl-[68px]" : "pl-56"}`}>
      <AppSidebar />
      <main className="flex-1 p-8 md:p-10 animate-fade-in">
        <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            Client Access Control Panel
          </h1>
          <div className="px-2 py-0.5 rounded bg-[#113a87]/8 border border-[#113a87]/15 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#113a87]" />
            <span className="text-[10px] font-bold text-[#113a87] uppercase tracking-wider">Access Provisioning Engine</span>
          </div>
        </div>
        <p className="text-sm font-medium text-slate-400 mb-8">
          Provision and manage secure access codes for client analytics report portals.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400 font-semibold animate-pulse mt-12">
            <RefreshCw className="w-4 h-4 animate-spin text-[#113a87]" />
            <span>Loading secure directories...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 stagger-children">
            {clients.map((client) => {
              const isSelected = selectedId === client.id;
              const avatar = getAvatarColors(client.name);
              const initials = getInitials(client.name);
              const hasAccess = !!client.access_username;
              const dynamicStatus = (client.access_username && (client.instagram_id || client.facebook_page_id)) ? "live" : "pending";

              return (
                <div
                  key={client.id}
                  className={`bg-white border border-slate-100 rounded-[28px] p-5 shadow-sm transition-all duration-300 flex flex-col justify-between relative overflow-hidden hover:border-[#113a87]/20 hover:shadow-[0_12px_24px_-8px_rgba(17,58,135,0.06)] hover:-translate-y-1 ${
                    isSelected ? "h-auto border-[#113a87]/25 shadow-md bg-gradient-to-b from-white to-slate-50/20" : "h-[225px]"
                  }`}
                >
                  {/* TOP: Avatar, Client Name, Industry & Status Badge */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Bubble */}
                      <div className={`w-10 h-10 rounded-2xl border ${avatar.bg} flex items-center justify-center font-bold text-sm tracking-wide shadow-sm shrink-0`}>
                        {initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h2 className="font-bold text-slate-800 text-base leading-snug tracking-tight truncate">
                          {client.name}
                        </h2>
                        {client.industry && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-fit mt-0.5">
                            {client.industry}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                        dynamicStatus === "live"
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm shadow-emerald-500/5"
                          : "bg-amber-50 border-amber-100 text-amber-600 shadow-sm shadow-amber-500/5"
                      }`}>
                        {dynamicStatus}
                      </span>
                    </div>
                  </div>

                  {/* MIDDLE: Web link & Integration pills & Username status */}
                  <div className="flex flex-col gap-2 my-3">
                    {client.website_url ? (
                      <a
                        href={client.website_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-[11px] text-slate-400 hover:text-[#113a87] hover:bg-slate-50/80 px-2.5 py-1 rounded-xl border border-slate-100/60 transition-all font-medium truncate max-w-full"
                      >
                        <Globe size={11} className="shrink-0 text-slate-300" />
                        <span className="truncate">{client.website_url.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ) : (
                      <div className="h-[24px] flex items-center">
                        <span className="text-[9px] italic text-slate-300 font-medium">No external link connected</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 h-5">
                      {(client.instagram_id || client.facebook_page_id || client.youtube_channel_id) ? (
                        <>
                          <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300 mr-0.5">Tied:</span>
                          {client.instagram_id && (
                            <span className="px-2 py-0.5 rounded bg-indigo-50/40 border border-indigo-100/40 text-[8px] text-[#113a87]/80 font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <span className="w-1 h-1 rounded-full bg-[#113a87]/60"></span>
                              + INSTAGRAM
                            </span>
                          )}
                          {client.facebook_page_id && (
                            <span className="px-2 py-0.5 rounded bg-blue-50/40 border border-blue-100/40 text-[8px] text-blue-600 font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <span className="w-1 h-1 rounded-full bg-blue-500/60"></span>
                              + FACEBOOK
                            </span>
                          )}
                          {client.youtube_channel_id && (
                            <span className="px-2 py-0.5 rounded bg-red-50/40 border border-red-100/40 text-[8px] text-red-600 font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <span className="w-1 h-1 rounded-full bg-red-500/60"></span>
                              + YOUTUBE
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-300">No active integrations</span>
                      )}
                    </div>

                    {/* Bind to access_username & access_active in the compact card */}
                    {hasAccess ? (
                      <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-100/80 rounded-xl px-2.5 py-1 text-[11px] mt-1 shrink-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Lock size={10} className="text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-600 truncate select-all">{client.access_username}</span>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border ${
                          client.access_active 
                            ? "bg-emerald-50/80 border-emerald-100/60 text-emerald-600" 
                            : "bg-red-50/80 border-red-100/60 text-red-600"
                        }`}>
                          {client.access_active ? "Active" : "Revoked"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-slate-50/40 border border-dashed border-slate-200/60 rounded-xl px-2.5 py-1 text-[11px] mt-1 text-slate-300 italic shrink-0">
                        <Lock size={10} className="text-slate-300 shrink-0" />
                        <span>No portal credentials provisioned</span>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM: Action Button & Forms */}
                  <div className="mt-auto">
                    <button
                      onClick={() => toggleSelect(client)}
                      className={`w-full py-2 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm ${
                        isSelected
                          ? "bg-slate-100 hover:bg-slate-200/60 text-slate-600"
                          : hasAccess
                            ? "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                            : "bg-[#113a87] hover:bg-[#113a87]/90 text-white hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      }`}
                    >
                      <Lock size={11} className="shrink-0" />
                      {isSelected ? "Close Panel" : hasAccess ? "Manage Access" : "Generate Access"}
                    </button>

                    {isSelected && (
                      <div className="mt-4 p-4 bg-slate-50/60 rounded-2xl border border-slate-200/50 space-y-4 animate-fade-in text-left">
                        {/* ─── CASE 1: Client has access credentials already provisioned ─── */}
                        {hasAccess ? (
                          <div className="space-y-3.5">
                            <div className="flex justify-between items-center text-xs font-semibold pb-2 border-b border-slate-200/40">
                              <div className="flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-[#113a87]" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Portal Credentials</span>
                              </div>
                              <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                client.access_active 
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                                  : "bg-red-50 border-red-100 text-red-600"
                              }`}>
                                {client.access_active ? "Active" : "Revoked"}
                              </span>
                            </div>

                            {/* Username View / Edit */}
                            <div className="flex justify-between items-center bg-white border border-slate-100 p-2.5 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Username</span>
                              {!isEditingUsername ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-700 select-all">{client.access_username}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsEditingUsername(true);
                                      setEditUsernameValue(client.access_username || "");
                                      setMessage("");
                                    }}
                                    className="p-1 hover:bg-slate-100 rounded text-[#113a87] transition-colors"
                                    title="Edit Username"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 w-2/3">
                                  <input
                                    type="text"
                                    value={editUsernameValue}
                                    onChange={(e) => setEditUsernameValue(e.target.value)}
                                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white outline-none focus:border-[#113a87] font-mono text-slate-800"
                                    placeholder="Enter username"
                                  />
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateUsername(client)}
                                      className="px-2.5 py-1 bg-[#113a87] text-white text-[10px] font-bold rounded hover:bg-[#113a87]/90 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsEditingUsername(false);
                                        setEditUsernameValue("");
                                        setMessage("");
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-200 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Reset Password Form / Action */}
                            {!isResetting ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsResetting(true);
                                  generateRandomPassword("reset");
                                  setMessage("");
                                  setGeneratedCreds(null);
                                }}
                                className="w-full py-2 bg-white border border-slate-200 text-[#113a87] text-xs font-bold rounded-xl hover:bg-[#113a87]/5 hover:border-[#113a87]/20 transition-all duration-300 flex items-center justify-center gap-1.5"
                              >
                                <RefreshCw size={11} className="shrink-0 text-[#113a87]" />
                                Reset Access Code
                              </button>
                            ) : (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2.5">
                                <div>
                                  <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1 px-0.5">
                                    New Access Code
                                  </label>
                                  <div className="relative">
                                    <input
                                      type={showNewPw ? "text" : "password"} required placeholder="Enter or generate code" value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      className="w-full px-3 py-2 pr-16 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/6 transition-all font-mono text-slate-800"
                                    />
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5 z-10">
                                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                        {showNewPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      </button>
                                      <button type="button" onClick={() => generateRandomPassword("reset")} className="p-1 text-[#113a87] hover:opacity-85 transition-opacity" title="Generate secure key">
                                        <RefreshCw className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleResetPassword(client)}
                                    className="flex-1 py-1.5 bg-[#113a87] hover:bg-[#113a87]/90 text-white text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Confirm Reset
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsResetting(false);
                                      setNewPassword("");
                                    }}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Revoke / Reactivate Action */}
                            <div>
                              {client.access_active ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeAccess(client)}
                                  className="w-full py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100 hover:border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5"
                                >
                                  <Ban size={11} className="shrink-0" />
                                  Revoke Client Access
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReactivateAccess(client)}
                                  className="w-full py-2 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5"
                                >
                                  <CheckCircle2 size={11} className="shrink-0" />
                                  Reactivate Access
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* ─── CASE 2: Client does NOT have credentials (needs provisioning) ─── */
                          <form onSubmit={(e) => handleCreateLogin(e, client)} className="space-y-3.5">
                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/40">
                              <KeyRound className="w-3.5 h-3.5 text-[#113a87]" />
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Provision New Access</span>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1 px-0.5">
                                  Client Username
                                </label>
                                <input
                                  type="text" required placeholder="e.g. OmnevumClient" value={identifier}
                                  onChange={(e) => setIdentifier(e.target.value)}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/6 transition-all font-medium text-slate-800"
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1 px-0.5">
                                  Secure Access Code
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPw ? "text" : "password"} required placeholder="Enter or generate code" value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 pr-16 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/6 transition-all font-mono text-slate-800"
                                  />
                                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5 z-10">
                                    <button type="button" onClick={() => setShowPw(!showPw)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                      {showPw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                    <button type="button" onClick={() => generateRandomPassword("provision")} className="p-1 text-[#113a87] hover:opacity-85 transition-opacity" title="Generate secure key">
                                      <RefreshCw className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <button type="submit" className="w-full py-2 bg-[#113a87] text-white text-xs font-bold rounded-lg hover:bg-[#113a87]/90 hover:shadow-md active:scale-[0.99] transition-all duration-300">
                              Authorize & Provision
                            </button>

                            <div className="text-center text-[8px] text-slate-400 font-medium">
                              No email format required. Credentials active instantly upon authorization.
                            </div>
                          </form>
                        )}

                        {/* ─── Success Box for Single-View generated credentials (Creation/Reset) ─── */}
                        {generatedCreds && (
                          <div className="p-3 bg-emerald-50/90 border border-emerald-100 rounded-2xl text-left space-y-2 animate-fade-in">
                            <div className="flex justify-between items-center pb-1.5 border-b border-emerald-200/30">
                              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Credentials Created — Copy Now</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`Username: ${generatedCreds.username}\nAccess Code: ${generatedCreds.code}`);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }}
                                className="p-1 hover:bg-emerald-100 rounded transition-colors text-emerald-700 flex items-center gap-1 shrink-0"
                              >
                                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                <span className="text-[9px] font-bold uppercase">{copied ? "Copied" : "Copy"}</span>
                              </button>
                            </div>
                            <div className="text-xs space-y-1 bg-white/60 p-2.5 rounded-xl border border-emerald-100/50">
                              <div>
                                <span className="text-[8px] font-bold text-slate-400 block uppercase">Username</span>
                                <span className="font-mono font-bold text-slate-700 select-all">{generatedCreds.username}</span>
                              </div>
                              <div className="mt-1">
                                <span className="text-[8px] font-bold text-slate-400 block uppercase">Access Code</span>
                                <span className="font-mono font-bold text-slate-700 select-all">{generatedCreds.code}</span>
                              </div>
                            </div>
                            <p className="text-[8px] text-emerald-600/90 font-bold leading-normal">
                              ⚠️ For absolute security, this access code is encrypted and cannot be viewed in plain text again. Copy it now!
                            </p>
                          </div>
                        )}

                        {message && (
                          <div className={`p-2 rounded-lg text-center text-[10px] font-semibold ${
                            message.includes("activated") || message.includes("success") || message.includes("✅")
                              ? "bg-emerald-50/60 border border-emerald-100/60 text-emerald-600"
                              : "bg-red-50/60 border border-red-100/60 text-red-600"
                          }`}>
                            {message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}