import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, TrendingUp, Heart, MessageCircle, Bookmark, Users, Eye, Loader2 } from "lucide-react";

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isInternalStaff = ["super_admin", "csm", "hr", "employee", "admin"].includes(currentUser.role);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("bento_token");
    fetch(`/api/reports/${id}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) { setError(data.detail); return; }
        setReport(data);
      })
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="w-8 h-8 animate-spin text-[#113a87]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="text-center">
        <p className="text-red-500 mb-4 font-semibold">{error}</p>
        <button onClick={() => navigate(-1)} className="text-[#113a87] font-bold hover:underline">← Go back</button>
      </div>
    </div>
  );

  const rawData = report?.ig_data || {};
  const ig = rawData.platforms?.instagram || rawData.instagram || (rawData.total_reach !== undefined ? rawData : {});
  const fb = rawData.platforms?.facebook || rawData.facebook || {};
  const paid = ig.paid || {};
  const organic = ig.organic || {};

  return (
    <div className="min-h-screen bg-transparent">
      <nav className="nav-glass px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-soft">
        <div className="flex items-center gap-4 md:gap-5">
          <button onClick={() => navigate("/admin/reports")} className="flex items-center gap-2 text-gray-500 hover:text-[#113a87] transition-colors font-bold text-xs uppercase tracking-wider shrink-0">
            <ArrowLeft size={14} /> Back to Archive
          </button>
          
          <div className="h-6 w-px bg-slate-200" />
          
          {/* Platform Branding (CANIT Pulse) */}
          <div
            onClick={() => {
              if (isInternalStaff) {
                navigate("/admin/dashboard");
              }
            }}
            className={`flex items-center gap-2 ${isInternalStaff ? "cursor-pointer" : ""}`}
          >
            <img
              src="/cai.png"
              alt="CANIT Pulse"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
              className="h-16 w-auto object-contain p-1"
            />
            <div className="flex flex-col">
              <span className="font-heading font-black text-xs text-slate-800 leading-none">CANIT Pulse</span>
              <span className="text-[7px] font-heading font-bold tracking-wider text-[#113a87]/75 uppercase mt-0.5 whitespace-nowrap">AI Suite</span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Dynamic Client Logo */}
          <div className="flex items-center gap-2 animate-fade-in">
            {report?.client_logo_url ? (
              <img
                src={report.client_logo_url}
                alt={`${report.brand_name} Logo`}
                className="h-6 max-w-[80px] object-contain rounded bg-slate-50/50 p-0.5 border border-slate-100"
              />
            ) : (
              <div className="h-6 px-1.5 rounded bg-slate-100 flex items-center justify-center border border-slate-200/50">
                <span className="font-heading font-black text-[9px] text-slate-500 uppercase">
                  {report?.brand_name?.substring(0, 8)}
                </span>
              </div>
            )}
            <span className="font-black text-sm text-[#1a1a1a]">{report?.brand_name}</span>
            <span className="text-gray-400 text-xs font-semibold">— {report?.month} {report?.year}</span>
          </div>
        </div>
      </nav>
      <div className="gradient-accent" />

      <main className="max-w-6xl mx-auto px-8 py-8 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {[
            { icon: Heart,         label: "Likes",     value: ig.total_likes,         color: "text-pink-500",   bg: "bg-pink-500/10" },
            { icon: MessageCircle, label: "Comments",  value: ig.total_comments,      color: "text-blue-500",   bg: "bg-blue-500/10" },
            { icon: Bookmark,      label: "Saves",     value: ig.total_saves,         color: "text-yellow-500", bg: "bg-yellow-500/10" },
            { icon: Users,         label: "Followers", value: ig.followers,           color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bento-metric group">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
              </div>
              <p className="text-2xl font-black text-[#1a1a1a] tabular-nums leading-none">
                {value == null || value === '' ? <span className="text-gray-200">—</span> : value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-7">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#113a87]/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-[#113a87]" />
              </div>
              <div>
                <h2 className="font-black text-[#1a1a1a] leading-none">AI Strategy</h2>
                <p className="text-xs text-gray-400 font-medium">Llama-3 analysis</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {report?.ai_insight || "No insight available."}
            </p>
          </div>

          <div className="bg-[#113a87]/90 backdrop-blur-md rounded-2xl p-7 text-white shadow-lg border border-[#113a87]/30">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black leading-none">Performance</h2>
                <p className="text-xs opacity-60 font-semibold">Key metrics</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Posts",  value: ig.total_posts },
                { label: "Total Reach (Org+Paid)",        value: ig.total_reach },
                { label: "Total Impressions (Org+Paid)",  value: ig.total_impressions },
                { label: "Engagement",   value: ig.engagement_rate },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3.5 border border-white/10 transition-all hover:bg-white/15">
                  <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-semibold">{label}</p>
                  <p className="text-lg font-black">{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reach Breakdown — Organic vs Paid */}
          {ig.bifurcation_available && (
            <div className="glass-card p-7 col-span-full">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h2 className="font-black text-[#1a1a1a] leading-none">Reach Breakdown</h2>
                  <p className="text-xs text-gray-400 font-medium">Organic vs Paid (Inorganic)</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#113a87]/90 backdrop-blur-sm rounded-2xl p-4 text-white border border-[#113a87]/30 shadow-soft">
                  <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1">Total Reach</p>
                  <p className="text-2xl font-black">{ig.total_reach ?? "—"}</p>
                  <p className="text-[10px] opacity-60 mt-1 font-semibold">Organic + Paid</p>
                </div>
                <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold mb-1">Organic Reach</p>
                  <p className="text-2xl font-black text-green-700">{organic.total_reach ?? "—"}</p>
                  <p className="text-[10px] text-green-500 mt-1 font-semibold">Unpaid / Natural</p>
                </div>
                <div className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-orange-600 uppercase tracking-widest font-bold mb-1">Paid Reach</p>
                  <p className="text-2xl font-black text-orange-600">{paid.total_reach ?? "0"}</p>
                  <p className="text-[10px] text-orange-400 mt-1 font-semibold">Boosted / Ads</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="bg-white/40 border border-white/50 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Total Impressions</p>
                  <p className="text-xl font-black text-[#1a1a1a]">{ig.total_impressions ?? "—"}</p>
                </div>
                <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold mb-1">Organic Impressions</p>
                  <p className="text-xl font-black text-green-700">{organic.total_impressions ?? "—"}</p>
                </div>
                <div className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-orange-600 uppercase tracking-widest font-bold mb-1">Paid Impressions</p>
                  <p className="text-xl font-black text-orange-600">{paid.total_impressions ?? "0"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div className="bg-white/40 border border-white/50 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Total Engagement Rate</p>
                  <p className="text-xl font-black text-[#1a1a1a]">{ig.engagement_rate ?? "—"}</p>
                </div>
                <div className="bg-green-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-green-600 uppercase tracking-widest font-bold mb-1">Organic Engagement Rate</p>
                  <p className="text-xl font-black text-green-700">{organic.engagement_rate ?? "—"}</p>
                </div>
                <div className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-4 shadow-soft">
                  <p className="text-[10px] text-orange-600 uppercase tracking-widest font-bold mb-1">Paid Engagement Rate</p>
                  <p className="text-xl font-black text-orange-600">{paid.engagement_rate ?? "—"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Post */}
        {ig.top_post?.caption && (
          <div className="glass-card p-7 hover:scale-[1.005]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#113a87]/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-[#113a87]" />
              </div>
              <div>
                <h2 className="font-black text-[#1a1a1a] leading-none">Top Performing Post</h2>
                <p className="text-xs text-gray-400 font-medium">Most engaging content</p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              {(ig.top_post.media_base64 || ig.top_post.media_url) && (
                <img src={ig.top_post.media_base64 || ig.top_post.media_url} alt="Top post" className="w-32 h-32 rounded-xl object-cover shrink-0 shadow-soft border border-white/50" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-600 leading-relaxed mb-4 font-medium">{ig.top_post.caption}</p>
                <div className="flex flex-wrap gap-6 text-sm mb-4">
                  {[
                    { label: "Likes",       value: ig.top_post.likes },
                    { label: "Comments",    value: ig.top_post.comments },
                    { label: "Saves",       value: ig.top_post.saves },
                    { label: "Impressions", value: ig.top_post.impressions },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/40 border border-white/50 rounded-xl px-3 py-1.5 shadow-soft">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">{label}</p>
                      <p className="font-black text-[#1a1a1a] text-base">{value ?? 0}</p>
                    </div>
                  ))}
                </div>
                {ig.top_post.permalink && (
                  <a href={ig.top_post.permalink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#113a87] font-bold hover:underline">
                    View on Instagram →
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Subtle Watermark Footer */}
      <footer className="text-center text-[10px] text-slate-400/50 pb-8 mt-12 font-medium tracking-wide">
        Powered by <span className="text-slate-500/70 font-semibold">Canit Solutions</span>
      </footer>
    </div>
  );
}