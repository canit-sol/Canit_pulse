import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { setAccessToken } from "../lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (typeof data.detail === "string") setError(data.detail);
        else if (Array.isArray(data.detail)) setError(data.detail[0].msg || "Validation error");
        else setError("Login failed");
        return;
      }

      setAccessToken(data.access_token);
      const userData = {
        id: data.id || "admin-id",
        name: data.name || "Admin",
        role: data.role || "admin",
        client_id: data.client_id || null,
      };
      localStorage.setItem("bento_user", JSON.stringify(userData));

      // 🚀 Clean Navigation (Only fires once!)
      const adminRoles = ["super_admin", "csm", "hr", "employee", "admin"];
      if (adminRoles.includes(data.role)) {
        navigate("/admin/dashboard");
      } else {
        navigate(`/client/${data.client_id}`);
      }
      
    } catch (err) {
      setError("Refresh and try again within 20 seconds");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-slate-50/20">
      {/* Soft animated pulse/glass background effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#113a87]/6 to-[#4f46e9]/4 blur-[120px] top-[-10%] right-[-10%] animate-pulse duration-[10000ms] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-br from-[#4f46e9]/5 to-[#113a87]/5 blur-[100px] bottom-[-15%] left-[-5%] animate-pulse duration-[8000ms] pointer-events-none" />
      
      {/* Subtle floating glass ornament behind the login card */}
      <div className="absolute w-80 h-80 rounded-full bg-[#113a87]/[0.02] border border-[#113a87]/[0.05] blur-[8px] animate-pulse duration-[6000ms] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10 flex flex-col items-center">
        {/* Large centered Canit logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          {!logoError ? (
            <img
              src="/cai.png"
              alt="CANIT Pulse Logo"
              onError={() => setLogoError(true)}
              className="h-24 w-auto mb-4 object-contain p-1 opacity-95 transition-all duration-500"
            />
          ) : (
            <div className="h-16 flex items-center justify-center mb-4">
              <span className="font-brand font-extrabold text-2xl tracking-[0.2em] text-[#113a87] uppercase">
                CANIT PULSE
              </span>
            </div>
          )}
          
          <h1 className="font-brand font-bold text-3xl text-slate-900 tracking-tight">
            CANIT Pulse
          </h1>
          <p className="text-[10px] font-heading font-bold tracking-[0.2em] text-[#113a87]/75 uppercase mt-1.5">
            AI Brand Intelligence Suite
          </p>
        </div>

        {/* Minimal clean login card (Linear/Stripe style) */}
        <div className="w-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 md:p-10 shadow-2xl hover:shadow-3xl hover:border-white/80 transition-all duration-500">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 font-heading">Welcome back</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">Enter your credentials to access the intelligence platform.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 block mb-2 px-1 font-heading">
                Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin@canit.co"
                className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-slate-200/70 outline-none focus:bg-white/80 focus:ring-4 focus:ring-[#113a87]/6 focus:border-[#113a87] transition-all text-slate-800 font-medium placeholder:text-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 block mb-2 px-1 font-heading">
                Access Code
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/40 border border-slate-200/70 outline-none focus:bg-white/80 focus:ring-4 focus:ring-[#113a87]/6 focus:border-[#113a87] transition-all pr-12 text-slate-800 font-medium placeholder:text-slate-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#113a87] transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/60 border border-red-100/50 text-red-600 text-xs px-4 py-3 rounded-2xl font-medium animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#113a87] to-[#1e56b8] text-white font-bold hover:shadow-lg active:scale-[0.99] transition-all duration-300 disabled:opacity-60 mt-3 font-heading tracking-wide text-sm shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <> Sign In <ArrowRight className="w-4 h-4" /> </>}
            </button>
          </form>
        </div>

        {/* Very subtle watermark / footer in low emphasis */}
        <div className="text-center text-[10px] text-slate-400/60 mt-8 font-medium tracking-wide">
          Powered by <span className="text-slate-500/70 font-semibold">Canit Solutions</span>
        </div>
      </div>
    </div>
  );
}