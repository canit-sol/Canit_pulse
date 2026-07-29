import { getAccessToken } from "../lib/auth";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, TrendingUp, Heart, MessageCircle, Bookmark, Users, Eye, Loader2, Play } from "lucide-react";

export default function ReportView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isInternalStaff = ["super_admin", "csm", "hr", "employee", "admin"].includes(currentUser.role);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken();
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

  const [activePlatform, setActivePlatform] = useState("instagram");

  const rawData = report?.ig_data || {};
  const ig = rawData.platforms?.instagram || rawData.instagram || (rawData.total_reach !== undefined ? rawData : {});
  const fb = rawData.platforms?.facebook || rawData.facebook || {};
  const yt = rawData.platforms?.youtube || rawData.youtube || {};

  // Check which platforms are connected and have data
  const hasIg = !!(ig.total_likes || ig.followers || ig.total_reach || ig.status === "success");
  const hasFb = !!(fb.total_likes || fb.followers || fb.total_reach || fb.status === "success");
  const hasYt = !!(yt.subscribers || yt.viewCount || yt.total_views || yt.status === "success");

  // Select default platform
  useEffect(() => {
    if (report) {
      if (hasIg) setActivePlatform("instagram");
      else if (hasFb) setActivePlatform("facebook");
      else if (hasYt) setActivePlatform("youtube");
    }
  }, [report, hasIg, hasFb, hasYt]);

  const currentData = activePlatform === "facebook" ? fb : activePlatform === "instagram" ? ig : activePlatform === "youtube" ? yt : {};
  const paid = currentData.paid || {};
  const organic = currentData.organic || {};

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


  const statsList = activePlatform === "youtube"
    ? [
        { icon: Eye,           label: "Total Views", value: yt.total_views || yt.viewCount, color: "text-red-500",   bg: "bg-red-500/10" },
        { icon: Play,          label: "Total Videos",value: yt.total_videos || yt.videoCount, color: "text-orange-500",bg: "bg-orange-500/10" },
        { icon: Users,         label: "Subscribers", value: yt.subscribers,                 color: "text-red-600",   bg: "bg-red-600/10" },
      ]
    : activePlatform === "facebook"
    ? [
        { icon: Heart,         label: "Reactions",   value: fb.total_likes || fb.total_reactions, color: "text-blue-600",   bg: "bg-blue-600/10" },
        { icon: MessageCircle, label: "Comments",    value: fb.total_comments,                    color: "text-cyan-500",   bg: "bg-cyan-500/10" },
        { icon: Bookmark,      label: "Shares",      value: fb.total_shares || fb.shares,         color: "text-indigo-500", bg: "bg-indigo-500/10" },
        { icon: Users,         label: "Followers",   value: fb.followers,                         color: "text-blue-500",   bg: "bg-blue-500/10" },
      ]
    : [
        { icon: Heart,         label: "Likes",       value: ig.total_likes,         color: "text-pink-500",   bg: "bg-pink-500/10" },
        { icon: MessageCircle, label: "Comments",    value: ig.total_comments,      color: "text-blue-500",   bg: "bg-blue-500/10" },
        { icon: Bookmark,      label: "Saves",       value: ig.total_saves,         color: "text-yellow-500", bg: "bg-yellow-500/10" },
        { icon: Users,         label: "Followers",   value: ig.followers,           color: "text-orange-500", bg: "bg-orange-500/10" },
      ];

  const performanceMetrics = activePlatform === "youtube"
    ? [
        { label: "Total Videos", value: yt.total_videos || yt.videoCount },
        { label: "Total Views", value: yt.total_views || yt.viewCount },
        { label: "Subscribers", value: yt.subscribers },
      ]
    : [
        { label: "Total Posts", value: currentData.total_posts },
        { label: "Total Reach (Org+Paid)", value: currentData.total_reach },
        { label: "Total Impressions (Org+Paid)", value: currentData.total_impressions },
        { label: "Engagement", value: currentData.engagement_rate },
      ];

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
              <span className="font-brand font-black text-xs text-slate-800 leading-none">CANIT Pulse</span>
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

        {/* Platform Tabs Selector */}
        {(hasIg || hasFb || hasYt) && (
          <div className="flex gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm w-fit">
            {hasIg && (
              <button
                onClick={() => setActivePlatform("instagram")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activePlatform === "instagram"
                    ? "bg-gradient-to-r from-[#E1306C]/10 to-[#833AB4]/10 border border-pink-100 text-[#E1306C] shadow-sm"
                    : "border border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50"
                }`}
              >
                Instagram
              </button>
            )}
            {hasFb && (
              <button
                onClick={() => setActivePlatform("facebook")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activePlatform === "facebook"
                    ? "bg-blue-50 border border-blue-100 text-[#1877F2] shadow-sm"
                    : "border border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50"
                }`}
              >
                Facebook
              </button>
            )}
            {hasYt && (
              <button
                onClick={() => setActivePlatform("youtube")}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activePlatform === "youtube"
                    ? "bg-red-50 border border-red-100 text-[#FF0000] shadow-sm"
                    : "border border-transparent text-gray-500 hover:text-gray-700 hover:bg-slate-50"
                }`}
              >
                YouTube
              </button>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          {statsList.map(({ icon: Icon, label, value, color, bg }) => (
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
                <h2 className="font-black text-[#1a1a1a] leading-none">AI Analysis</h2>
                <p className="text-xs text-gray-400 font-medium">Data-driven performance insights</p>
              </div>
            </div>
            {(() => {
              const raw = report?.ai_insight || "";
              const lines = raw.split("\n");
              const blocks: { title: string; body: string }[] = [];
              let current: { title: string; body: string } | null = null;
              for (const line of lines) {
                const trimmed = line.trim();
                const titleMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
                if (titleMatch) {
                  if (current) blocks.push(current);
                  current = { title: titleMatch[1], body: "" };
                } else if (current && trimmed) {
                  current.body += (current.body ? " " : "") + trimmed;
                }
              }
              if (current) blocks.push(current);
              if (blocks.length === 0) {
                return <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">{raw || "No insight available."}</p>;
              }
              return (
                <div className="space-y-3">
                  {blocks.map((block, i) => (
                    <div key={i} className="bg-[#113a87]/5 border border-[#113a87]/10 rounded-xl p-4">
                      <p className="text-[11px] font-black text-[#113a87] uppercase tracking-wide mb-1">{block.title}</p>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{block.body}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
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
            <div className={`grid gap-3 ${activePlatform === "youtube" ? "grid-cols-1" : "grid-cols-2"}`}>
              {performanceMetrics.map(({ label, value }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3.5 border border-white/10 transition-all hover:bg-white/15">
                  <p className="text-[10px] opacity-60 uppercase tracking-widest mb-1 font-semibold">{label}</p>
                  <p className="text-lg font-black">{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reach Breakdown — Organic vs Paid */}
          {activePlatform !== "youtube" && currentData.bifurcation_available && (
            <div className="glass-card p-7 col-span-full animate-fade-in">
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
                  <p className="text-2xl font-black">{currentData.total_reach ?? "—"}</p>
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
                  <p className="text-xl font-black text-[#1a1a1a]">{currentData.total_impressions ?? "—"}</p>
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
                  <p className="text-xl font-black text-[#1a1a1a]">{currentData.engagement_rate ?? "—"}</p>
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

        {/* YouTube Videos List */}
        {activePlatform === "youtube" && (yt.videos && yt.videos.length > 0) && (
          <div className="glass-card p-7 animate-fade-in">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Play className="w-4 h-4 text-[#FF0000]" />
              </div>
              <div>
                <h2 className="font-black text-[#1a1a1a] leading-none">YouTube Videos</h2>
                <p className="text-xs text-gray-400 font-medium font-heading">Videos uploaded during this period</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              {yt.videos.map((video: any, idx: number) => (
                <div key={idx} className="bg-white/40 border border-white/50 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-glass transition duration-200">
                  <div className="space-y-2">
                    {video.thumbnail && (
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-[#FF0000] bg-red-50 px-2 py-0.5 rounded-full uppercase">
                        Video
                      </span>
                      {video.published_at && (
                        <span className="text-[9px] text-gray-400 font-medium">
                          {new Date(video.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <h5 className="font-black text-[#1a1a1a] text-xs leading-snug line-clamp-2" title={video.title}>
                      {video.title}
                    </h5>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100/80">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-gray-500">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{(video.views ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-gray-500">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{(video.likes ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Post (Instagram / Facebook) */}
        {activePlatform !== "youtube" && currentData.top_post?.caption && (
          <div className="glass-card p-7 hover:scale-[1.005] animate-fade-in">
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
              {currentData.top_post.media_url && (
                <img src={currentData.top_post.media_url} alt="Top post" className="w-32 h-32 rounded-xl object-cover shrink-0 shadow-soft border border-white/50" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-600 leading-relaxed mb-4 font-medium">{currentData.top_post.caption}</p>
                <div className="flex flex-wrap gap-6 text-sm mb-4">
                  {[
                    { label: "Likes",       value: currentData.top_post.likes },
                    { label: "Comments",    value: currentData.top_post.comments },
                    { label: "Saves",       value: currentData.top_post.saves || currentData.top_post.shares },
                    { label: "Impressions", value: currentData.top_post.impressions },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/40 border border-white/50 rounded-xl px-3 py-1.5 shadow-soft">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">{label}</p>
                      <p className="font-black text-[#1a1a1a] text-base">{value ?? 0}</p>
                    </div>
                  ))}
                </div>
                {currentData.top_post.permalink && (
                  <a href={currentData.top_post.permalink} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#113a87] font-bold hover:underline">
                    View on {activePlatform === "facebook" ? "Facebook" : "Instagram"} →
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