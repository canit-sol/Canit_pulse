import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";
import { useSidebar } from "../context/SidebarContext";
import {
  Settings, Plug, Shield, BrainCircuit, BarChart3,
  RefreshCw, Lock, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, Save, Zap, TrendingUp, Sparkles, UsersRound,
  Plus, Trash2, Edit
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import ApiStatusWidget from "@/components/ApiStatusWidget";

import { authHeaders } from "../lib/auth";

const YoutubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Base API URL handled via getApiUrl

type TabKey = "general" | "integrations" | "security" | "users";

const PERSONALITIES = [
  { value: "analytical", label: "📊 Analytical", desc: "Data-driven, precise, metrics-focused. Uses numbers and percentages." },
  { value: "creative", label: "🎨 Creative", desc: "Bold, imaginative, trend-forward. Unconventional strategies." },
  { value: "executive", label: "📋 Executive Summary", desc: "Concise, high-level. ROI and bottom-line focused." },
];

export default function SettingsPage() {
  const { collapsed } = useSidebar();
  const [activeTab, setActiveTab] = useState<TabKey>("general");

  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isSuperAdmin = currentUser.role === "super_admin" || currentUser.role === "admin";

  const tabs = [
    { key: "general" as TabKey, label: "General", icon: Settings },
    { key: "integrations" as TabKey, label: "Integrations", icon: Plug },
    { key: "security" as TabKey, label: "Security", icon: Shield },
  ];

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

  // --- Health state ---
  const [health, setHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // --- Quota state ---
  const [quota, setQuota] = useState<any>(null);

  // --- Supabase Usage state ---
  const [supabaseUsage, setSupabaseUsage] = useState<any>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);

  // --- AI Personality state ---
  const [personality, setPersonality] = useState("analytical");
  const [personalitySaving, setPersonalitySaving] = useState(false);
  const [personalitySaved, setPersonalitySaved] = useState(false);

  // --- YouTube API Key state ---
  const [ytKey, setYtKey] = useState("");
  const [showYtKey, setShowYtKey] = useState(false);
  const [ytSaving, setYtSaving] = useState(false);
  const [ytSaved, setYtSaved] = useState(false);

  // --- Password state ---
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSupabaseUsage = async () => {
    setSupabaseLoading(true);
    try {
      const res = await fetch(getApiUrl(`/settings/supabase-usage`), { headers: authHeaders() });
      setSupabaseUsage(await res.json());
    } catch { setSupabaseUsage(null); }
    finally { setSupabaseLoading(false); }
  };

  useEffect(() => {
    fetchHealth();
    fetchQuota();
    fetchPersonality();
    fetchYtKey();
    fetchSupabaseUsage();
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, []);

  const fetchHealth = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch(getApiUrl(`/settings/health`), { headers: authHeaders() });
      setHealth(await res.json());
    } catch { setHealth(null); }
    finally { setHealthLoading(false); }
  };

  const fetchQuota = async () => {
    try {
      const res = await fetch(getApiUrl(`/settings/quota`), { headers: authHeaders() });
      setQuota(await res.json());
    } catch { setQuota(null); }
  };

  const fetchPersonality = async () => {
    try {
      const res = await fetch(getApiUrl(`/settings/ai-personality`), { headers: authHeaders() });
      const data = await res.json();
      setPersonality(data.personality || "analytical");
    } catch {}
  };

  const savePersonality = async () => {
    setPersonalitySaving(true);
    setPersonalitySaved(false);
    try {
      await fetch(getApiUrl(`/settings/ai-personality`), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ personality }),
      });
      setPersonalitySaved(true);
      setTimeout(() => setPersonalitySaved(false), 2500);
    } catch {}
    finally { setPersonalitySaving(false); }
  };

  const fetchYtKey = async () => {
    try {
      const res = await fetch(getApiUrl(`/settings/youtube-api-key`), { headers: authHeaders() });
      const data = await res.json();
      setYtKey(data.youtube_api_key || "");
    } catch {}
  };

  const saveYtKey = async () => {
    setYtSaving(true);
    setYtSaved(false);
    try {
      const res = await fetch(getApiUrl(`/settings/youtube-api-key`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ youtube_api_key: ytKey }),
      });
      if (res.ok) {
        setYtSaved(true);
        setTimeout(() => setYtSaved(false), 2500);
      }
    } catch {}
    finally {
      setYtSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPw.length < 6) {
      setPwMsg({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch(getApiUrl(`/settings/change-password`), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: "success", text: "Password updated successfully!" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setPwMsg({ type: "error", text: data.detail || "Failed to update password." });
      }
    } catch { setPwMsg({ type: "error", text: "Network error." }); }
    finally { setPwSaving(false); }
  };

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

  // --- Quota progress ---
  const quotaPct = quota ? Math.min((quota.reports_generated / quota.monthly_cap) * 100, 100) : 0;
  const quotaColor = quotaPct > 80 ? "#ef4444" : quotaPct > 50 ? "#f59e0b" : "#22c55e";

  return (
    <div className={`min-h-screen bg-transparent transition-[padding] duration-200 ease-in-out ${collapsed ? "pl-0 md:pl-[68px]" : "pl-0 md:pl-56"}`}>
      <AppSidebar />
      <main className="flex-1 p-4 pl-12 md:p-10">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1a1a1a] tracking-tight font-heading">Command Center</h1>
              <p className="text-gray-400 text-sm font-medium">System health, AI configuration & security.</p>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="flex gap-1 bg-white/40 border border-white/60 backdrop-blur-md p-1.5 rounded-2xl mb-8 shadow-soft">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center gap-2 flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-white/85 text-[#113a87] shadow-glass border border-white/80"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/20"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════ TAB: General ═══════════ */}
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* AI Configuration Card */}
              <div className="glass-panel p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-6 border-b border-white/40 pb-4">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-[#113a87]">
                    <BrainCircuit size={20} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">Report Personality</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Controls the tone and style of AI-generated insights</p>
                  </div>
                  {personalitySaved && (
                    <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50/80 border border-green-200/50 backdrop-blur-sm px-3 py-1.5 rounded-full animate-in fade-in duration-200">
                      <CheckCircle2 size={14} /> Saved
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {PERSONALITIES.map((p) => (
                    <label
                      key={p.value}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        personality === p.value
                          ? "border-[#113a87] bg-white/70 shadow-sm"
                          : "border-white/40 hover:border-white/70 bg-white/30 hover:bg-white/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="personality"
                        value={p.value}
                        checked={personality === p.value}
                        onChange={() => setPersonality(p.value)}
                        className="mt-1.5 accent-[#113a87]"
                      />
                      <div>
                        <div className="font-bold text-[#1a1a1a] text-sm font-heading">{p.label}</div>
                        <div className="text-xs text-gray-400 font-medium mt-1 leading-relaxed">{p.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={savePersonality}
                  disabled={personalitySaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#113a87] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#113a87]/15 hover:shadow-xl hover:bg-[#0c2a63] active:scale-95 transition-all duration-200 disabled:opacity-60 font-heading"
                >
                  {personalitySaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {personalitySaving ? "Saving..." : "Save Personality"}
                </button>
              </div>

              {/* Monthly Quota Card */}
              <div className="glass-panel p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-6 border-b border-white/40 pb-4">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600">
                    <BarChart3 size={20} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">Monthly Quota</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {quota ? `${quota.month} ${quota.year}` : "Loading..."}
                    </p>
                  </div>
                </div>

                {quota ? (
                  <div className="space-y-5">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2 font-heading">
                        <span className="font-bold text-gray-700">Reports Generated</span>
                        <span className="font-black" style={{ color: quotaColor }}>
                          {quota.reports_generated} / {quota.monthly_cap}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-white/40 border border-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${quotaPct}%`,
                            background: `linear-gradient(90deg, ${quotaColor}88, ${quotaColor})`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Reports", value: quota.reports_generated, icon: TrendingUp },
                        { label: "API Calls", value: quota.estimated_api_calls, icon: Zap },
                        { label: "Remaining", value: quota.monthly_cap - quota.reports_generated, icon: Sparkles },
                      ].map((s) => (
                        <div key={s.label} className="glass-card p-4 text-center bg-white/40 border-white/50 hover:border-white/70">
                          <s.icon size={16} className="mx-auto text-gray-400 mb-2" />
                          <div className="text-xl font-black text-[#1a1a1a] font-heading">{s.value}</div>
                          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                  </div>
                )}
              </div>


            </div>
          )}

          {/* ═══════════ TAB: Integrations ═══════════ */}
          {activeTab === "integrations" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Test Connection Button */}
              <div className="flex justify-end">
                <button
                  onClick={fetchHealth}
                  disabled={healthLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#113a87] bg-white/60 border border-white/70 rounded-xl hover:bg-white/80 active:scale-95 transition-all disabled:opacity-60 shadow-soft"
                >
                  <RefreshCw size={14} className={healthLoading ? "animate-spin" : ""} />
                  {healthLoading ? "Testing..." : "Test All Connections"}
                </button>
              </div>

              {/* API Status Overview Widget */}
              <ApiStatusWidget />

              {/* Instagram Graph API */}
              <IntegrationCard
                title="Instagram Graph API"
                subtitle="Instagram Business analytics pipeline"
                iconBg="bg-pink-50"
                iconColor="text-pink-600"
                status={health?.meta?.status}
                latency={health?.meta?.latency_ms}
                loading={healthLoading}
                details={[
                  { label: "Endpoint", value: "graph.facebook.com/v19.0" },
                  { label: "Scopes", value: "instagram_basic, pages_show_list" },
                ]}
              />

              {/* Groq AI Card */}
              <IntegrationCard
                title="Groq AI Engine"
                subtitle="Llama-3 powered report insights"
                iconBg="bg-orange-50"
                iconColor="text-orange-600"
                status={health?.groq?.status}
                latency={health?.groq?.latency_ms}
                loading={healthLoading}
                details={[
                  { label: "Model", value: "llama-3.3-70b-versatile" },
                  { label: "Provider", value: "Groq Cloud" },
                ]}
              />

              {/* Gemini AI Card */}
              <IntegrationCard
                title="Gemini AI Engine"
                subtitle="Gemini-2.5 flash powered chatbot"
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                status={health?.gemini?.status}
                latency={health?.gemini?.latency_ms}
                loading={healthLoading}
                details={[
                  { label: "Model", value: "gemini-2.5-flash" },
                  { label: "Provider", value: "Google AI" },
                ]}
              />

              {/* Gemini Usage Quota Card */}
              <div className="glass-panel p-6 shadow-soft animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-5 border-b border-white/40 pb-4">
                  <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">Gemini API Usage</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Free tier rate limits (per project)</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${
                    health?.gemini?.status === "connected"
                      ? "bg-green-500/10 border-green-500/20 text-green-700"
                      : "bg-red-500/10 border-red-500/20 text-red-700"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${health?.gemini?.status === "connected" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-xs font-bold font-heading">
                      {health?.gemini?.status === "connected" ? "Connected" : health?.gemini?.status ? "Offline" : "Not tested"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Rate Limit", value: "10 RPM", desc: "Requests per minute" },
                    { label: "Token Limit", value: "250K TPM", desc: "Tokens per minute" },
                    { label: "Daily Limit", value: "1,500 RPD", desc: "Requests per day" },
                    { label: "Chat Calls", value: quota?.gemini_chat_calls ?? 0, desc: "This session" },
                  ].map((s) => (
                    <div key={s.label} className="glass-card p-4 text-center bg-white/40 border-white/50 hover:border-white/70">
                      <div className="text-xs font-black text-[#1a1a1a] font-heading mb-1">{s.value}</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</div>
                      <div className="text-[9px] text-gray-400 mt-1">{s.desc}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 text-center">
                  Upgrade to paid tier for 2,000 RPM and 4M TPM. Enable billing in Google AI Studio.
                </p>
              </div>

              {/* Supabase Usage Card */}
              <IntegrationCard
                title="Supabase"
                subtitle="Database, storage & auth infrastructure"
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                status={supabaseUsage?.status}
                loading={supabaseLoading}
                details={[
                  { label: "Plan", value: supabaseUsage?.plan ?? "—" },
                  { label: "Database Size", value: supabaseUsage?.db_size_mb != null ? `${supabaseUsage.db_size_mb} MB` : "—" },
                  { label: "Tables", value: supabaseUsage?.tables ?? "—" },
                  { label: "Total Rows", value: supabaseUsage?.total_rows != null ? supabaseUsage.total_rows.toLocaleString() : "—" },
                ]}
              />

              {/* YouTube API Key Card */}
              <div className="glass-panel p-6 shadow-soft animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6 border-b border-white/40 pb-4">
                  <div className="p-2.5 bg-red-500/10 rounded-xl text-[#FF0000]">
                    <YoutubeIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">YouTube API Configuration</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Global API key for fetching public channel metrics</p>
                  </div>
                  {ytSaved && (
                    <div className="flex items-center gap-1.5 text-green-700 text-xs font-bold bg-green-50/80 border border-green-200/50 backdrop-blur-sm px-3 py-1.5 rounded-full animate-in fade-in duration-200">
                      <CheckCircle2 size={14} /> Saved
                    </div>
                  )}
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-heading">
                      YouTube API Key
                    </label>
                    <div className="relative">
                      <input
                        type={showYtKey ? "text" : "password"}
                        value={ytKey}
                        onChange={(e) => setYtKey(e.target.value)}
                        placeholder="Enter your YouTube Data API v3 key"
                        className="w-full px-4 py-2.5 pr-10 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF0000]/20 focus:border-[#FF0000] focus:bg-white/60 transition-all text-gray-800 placeholder:text-gray-400 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowYtKey(!showYtKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showYtKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                      One API key is shared globally to fetch stats. Failures will gracefully fall back to mock metrics.
                    </p>
                  </div>

                  <button
                    onClick={saveYtKey}
                    disabled={ytSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#FF0000] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#FF0000]/15 hover:shadow-xl hover:bg-[#cc0000] active:scale-95 transition-all duration-200 disabled:opacity-60 font-heading"
                  >
                    {ytSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {ytSaving ? "Saving..." : "Save Key"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ TAB: Security ═══════════ */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="glass-panel p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-6 border-b border-white/40 pb-4">
                  <div className="p-2.5 bg-gray-100/50 rounded-xl text-gray-600 border border-white/40">
                    <Lock size={20} />
                  </div>
                  <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">Change Admin Password</h2>
                </div>

                <form onSubmit={changePassword} className="space-y-4 max-w-md">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-heading">Current Password</label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        required
                        placeholder="Enter current password"
                        className="w-full px-4 py-2.5 pr-10 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] focus:bg-white/60 transition-all text-gray-800 placeholder:text-gray-400"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-heading">New Password</label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        required
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 pr-10 bg-white/40 border border-white/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] focus:bg-white/60 transition-all text-gray-800 placeholder:text-gray-400"
                      />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 font-heading">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#113a87]/20 focus:border-[#113a87] focus:bg-white/60 transition-all text-gray-800 placeholder:text-gray-400 ${
                        confirmPw && confirmPw !== newPw ? "border-red-300/60 bg-red-50/40" : "border-white/60 bg-white/40"
                      }`}
                    />
                    {confirmPw && confirmPw !== newPw && (
                      <p className="text-xs text-red-500 mt-1 font-semibold">Passwords do not match</p>
                    )}
                  </div>

                  {/* Status Message */}
                  {pwMsg && (
                    <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${
                      pwMsg.type === "success"
                        ? "bg-green-500/10 border border-green-500/20 text-green-700"
                        : "bg-red-500/10 border border-red-500/20 text-red-700"
                    }`}>
                      {pwMsg.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                      {pwMsg.text}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#113a87] text-white rounded-xl font-bold shadow-lg shadow-[#113a87]/15 hover:shadow-xl hover:bg-[#0c2a63] active:scale-95 transition-all duration-200 disabled:opacity-60 font-heading"
                  >
                    {pwSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    {pwSaving ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ═══════════ TAB: User Management ═══════════ */}
          {activeTab === "users" && isSuperAdmin && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* User management card */}
              <div className="glass-panel p-6 shadow-soft">
                <div className="flex items-center justify-between gap-3 mb-6 border-b border-white/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-[#113a87]">
                      <UsersRound size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">User Management</h2>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Manage internal CANIT team members and access levels.</p>
                    </div>
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
          )}
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
          <div className="bg-white rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2 font-heading">Delete Staff Account?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed font-medium font-medium">Are you sure you want to permanently delete <span className="font-bold text-slate-700">{selectedUser.name} ({selectedUser.username})</span>? This action cannot be undone.</p>
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

/* ──── Integration Status Card Component ──── */
function IntegrationCard({
  title, subtitle, iconBg, iconColor, status, latency, loading, details,
}: {
  title: string; subtitle: string; iconBg: string; iconColor: string;
  status?: string; latency?: number; loading: boolean;
  details: { label: string; value: string }[];
}) {
  const isConnected = status === "connected";

  // Translate standard background strings into premium spatial ones
  const premiumBg = iconBg.includes("pink") ? "bg-pink-500/10 text-pink-600" : "bg-orange-500/10 text-orange-600";

  return (
    <div className="glass-panel p-6 shadow-soft animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${premiumBg}`}>
            <Plug size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1a1a1a] font-heading">{title}</h2>
            <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
          </div>
        </div>

        {/* Status Badge */}
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 border border-white/50 rounded-full">
            <Loader2 size={14} className="animate-spin text-gray-400" />
            <span className="text-xs font-bold text-gray-400 font-heading">Checking...</span>
          </div>
        ) : status ? (
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full ${
            isConnected
              ? "bg-green-500/10 border-green-500/20 text-green-700"
              : "bg-red-500/10 border-red-500/20 text-red-700"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs font-bold font-heading">
              {isConnected ? "Connected" : "Offline"}
            </span>
            {isConnected && latency != null && (
              <span className="text-[10px] opacity-75 font-mono">{latency}ms</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/40 border border-white/50 rounded-full">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            <span className="text-xs font-bold text-gray-400 font-heading">Not tested</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3">
        {details.map((d) => (
          <div key={d.label} className="glass-card px-4 py-3 bg-white/30 border-white/50 hover:border-white/70">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 font-heading">{d.label}</div>
            <div className="text-sm font-semibold text-gray-700 font-mono">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}