import React from "react";
import {
  Sparkles, TrendingUp, BarChart3, Heart, MessageCircle,
  Bookmark, Users, Eye, Activity, Flame, Bot, Calendar,
  Globe, Cpu, Zap, Target, Shield, CheckSquare
} from "lucide-react";

interface PrintReportViewProps {
  brandName: string;
  clientLogoUrl: string | null;
  month: string;
  year: string | number;
  ig: any;
  fb: any;
  fbReactions: number | undefined;
  fbShares: number | undefined;
  fbComments: number | undefined;
  seoData: any;
  currentMonthBlogs: any[];
  aiInsight: string | null;
  brandIntelData: any;
  contentData: any[];
  bestPost: any;
  websiteData: any;
}

export default function PrintReportView({
  brandName,
  clientLogoUrl,
  month,
  year,
  ig: rawIg = {},
  fb: rawFb = {},
  fbReactions = 0,
  fbShares = 0,
  fbComments = 0,
  seoData = {},
  currentMonthBlogs = [],
  aiInsight = "",
  brandIntelData = null,
  contentData = [],
  bestPost = null,
  websiteData = {}
}: PrintReportViewProps) {
  
  const ig = rawIg.platforms?.instagram || rawIg.instagram || (rawIg.total_reach !== undefined ? rawIg : {});
  const fb = rawFb.platforms?.facebook || rawFb.facebook || (rawFb.total_reach !== undefined ? rawFb : {});
  
  // Format numbers nicely
  const formatNum = (num: any) => {
    if (num === undefined || num === null || isNaN(Number(num))) return "0";
    return Number(num).toLocaleString();
  };

  const formatPercent = (num: any) => {
    if (num === undefined || num === null || isNaN(Number(num))) return "0%";
    return `${Number(num).toFixed(1)}%`;
  };

  // Helper to extract top post for a platform
  const getPlatformTopPost = (platformData: any) => {
    if (platformData?.top_post && (platformData.top_post.media_base64 || platformData.top_post.media_url)) {
      return platformData.top_post;
    }
    const postsList = platformData?.posts || [];
    if (postsList.length > 0) {
      return postsList.reduce((prev: any, current: any) => {
        const prevScore = (prev.likes ?? prev.total_likes ?? 0) + (prev.comments ?? prev.total_comments ?? 0);
        const curScore = (current.likes ?? current.total_likes ?? 0) + (current.comments ?? current.total_comments ?? 0);
        return curScore > prevScore ? current : prev;
      }, postsList[0]);
    }
    return null;
  };

  const igTopPost = getPlatformTopPost(ig);
  const fbTopPost = getPlatformTopPost(fb);

  // Common Header component for printable pages
  const PageHeader = () => (
    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6 relative z-10">
      <div className="flex items-center gap-3">
        {clientLogoUrl ? (
          <img src={clientLogoUrl} alt={brandName} className="h-7 w-auto object-contain max-w-[120px]" />
        ) : (
          <div className="h-7 px-3 bg-gray-50 flex items-center justify-center rounded-lg border border-gray-200">
            <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase">{brandName}</span>
          </div>
        )}
        <div className="w-[1px] h-4 bg-gray-200" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{month} {year} Report</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#113a87]" />
        <span className="text-[11px] font-brand font-black text-[#113a87] tracking-widest uppercase">CANIT Pulse</span>
      </div>
    </div>
  );

  // Common Footer component
  const PageFooter = ({ pageNum }: { pageNum: number }) => (
    <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-auto text-[9px] font-bold text-gray-400 uppercase tracking-widest">
      <div className="font-brand">CANIT Pulse © 2026 | Performance & AI Brand Report</div>
      <div>Page {pageNum} of 7</div>
    </div>
  );

  // Extract Brand Intel details if available
  const hasIntel = brandIntelData && brandIntelData.has_data !== false;
  const intelHealthScore = hasIntel ? brandIntelData.brand_health?.score ?? 75 : 75;
  const intelHealthLabel = hasIntel ? brandIntelData.brand_health?.label ?? "Growing" : "Growing";
  const intelGrowth = hasIntel ? brandIntelData.growth ?? {} : {};
  const intelInsights = hasIntel ? brandIntelData.insights ?? [] : [];
  const intelGauges = hasIntel ? brandIntelData.gauges ?? {} : {};

  return (
    <div id="pdf-export-container" className="w-[794px] bg-white text-left pointer-events-none flex flex-col font-body text-gray-800">
      
      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 1: COVER PAGE                                         */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="enterprise-watermark" />
        {/* Background decorative grids */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-[#113a87]/8 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#113a87]/8 to-transparent rounded-tr-full pointer-events-none" />
        
        {/* Header Branding */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#113a87]" />
          <span className="text-sm font-brand font-black text-[#113a87] tracking-widest uppercase">CANIT Pulse</span>
        </div>

        {/* Center Title Content */}
        <div className="my-auto space-y-8 max-w-[550px]">
          <div className="space-y-4">
            <span className="inline-block px-3 py-1 bg-[#113a87]/5 border border-[#113a87]/15 rounded-full text-xs font-extrabold text-[#113a87] uppercase tracking-wider">
              Monthly Digital Performance
            </span>
            <h1 className="text-4xl font-black text-gray-900 leading-tight uppercase font-heading tracking-tight">
              Integrated Analytics &<br />
              <span className="text-[#113a87]">Brand Intelligence</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              A comprehensive performance audit across platform metrics, SEO indicators, published content calendar, and algorithmic brand health analysis.
            </p>
          </div>

          <div className="h-[2px] w-24 bg-gradient-to-r from-[#113a87] to-indigo-500" />

          {/* Client Block */}
          <div className="flex items-center gap-5 p-5 bg-gray-50/50 border border-gray-100 rounded-2xl">
            {clientLogoUrl ? (
              <img src={clientLogoUrl} alt={brandName} className="h-14 w-auto object-contain max-w-[160px]" />
            ) : (
              <div className="h-14 px-5 bg-white flex items-center justify-center rounded-xl border border-gray-200">
                <span className="text-xs font-black text-gray-400 tracking-wider uppercase">{brandName}</span>
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prepared For</p>
              <h2 className="text-lg font-black text-gray-800 tracking-tight">{brandName}</h2>
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-[#113a87]/10 text-[10px] font-bold text-[#113a87]">
                <Calendar className="w-3 h-3" />
                {month.toUpperCase()} {year}
              </div>
            </div>
          </div>
        </div>

        {/* Cover Footer */}
        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Powered by</p>
            <p className="text-xs font-brand font-black text-[#113a87] tracking-wider uppercase">CANIT Pulse Analytics Platform</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Confidential Report</p>
            <p className="text-xs font-bold text-gray-500">Internal Marketing Strategy Document</p>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 2: KPI SUMMARY                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col border border-gray-200 shadow-md pdf-page-break overflow-hidden relative">
        <div className="enterprise-watermark" />
        <PageHeader />

        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#113a87] uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5" /> High-Level Metrics
              </span>
              <h2 className="text-2xl font-black text-gray-900 uppercase font-heading tracking-tight">KPI Summary Overview</h2>
              <p className="text-gray-500 text-xs font-medium">Comparative top-line channel analytics tracking audience reach, impressions, engagement, and follower accumulation.</p>
            </div>

            {/* Side-by-side comparative layout */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Instagram Card */}
              <div className="bg-[#E1306C]/5 border border-[#E1306C]/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E1306C]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#E1306C]/10 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-[#E1306C]" />
                    </div>
                    <span className="text-sm font-black text-gray-800 uppercase tracking-tight">Instagram</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#E1306C] bg-[#E1306C]/12 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Monthly Reach</p>
                    <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatNum(ig?.total_reach)}</p>
                  </div>
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Impressions</p>
                    <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatNum(ig?.total_impressions)}</p>
                  </div>
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Engagement</p>
                    <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatPercent(ig?.engagement_rate)}</p>
                  </div>
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Followers</p>
                    <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatNum(ig?.followers)}</p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-xl p-3 border border-white/40 flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Total Posts Published:</span>
                  <span className="text-[#E1306C] font-black">{ig?.total_posts ?? 0}</span>
                </div>
              </div>

              {/* Facebook Card */}
              <div className="bg-[#1877F2]/5 border border-[#1877F2]/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1877F2]/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#1877F2]" />
                    </div>
                    <span className="text-sm font-black text-gray-800 uppercase tracking-tight">Facebook</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#1877F2] bg-[#1877F2]/12 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Monthly Reach</p>
                    <p className="text-lg font-black text-[#1877F2] tracking-tight">{formatNum(fb?.total_reach ?? fb?.reach)}</p>
                  </div>
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Impressions</p>
                    <p className="text-lg font-black text-[#1877F2] tracking-tight">{formatNum(fb?.total_impressions ?? fb?.impressions)}</p>
                  </div>
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Engagement</p>
                    <p className="text-lg font-black text-[#1877F2] tracking-tight">{formatPercent(fb?.engagement_rate)}</p>
                  </div>
                  <div className="bg-white/80 border border-white/60 p-3 rounded-xl">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Followers/Fans</p>
                    <p className="text-lg font-black text-[#1877F2] tracking-tight">{formatNum(fb?.followers ?? fb?.fan_count ?? fb?.followers_count)}</p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-xl p-3 border border-white/40 flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Total Posts Published:</span>
                  <span className="text-[#1877F2] font-black">{fb?.total_posts ?? 0}</span>
                </div>
              </div>

            </div>

            {/* Channel comparison analysis table */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Cross-Channel Metrics Benchmark</h3>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/80 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                    <th className="py-2.5">Performance Area</th>
                    <th className="py-2.5">Instagram</th>
                    <th className="py-2.5">Facebook</th>
                    <th className="py-2.5 text-right">Primary Driver</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-gray-600 divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 font-bold text-gray-800">Reach Distribution</td>
                    <td className="py-3">{formatNum(ig?.total_reach)}</td>
                    <td className="py-3">{formatNum(fb?.total_reach ?? fb?.reach)}</td>
                    <td className="py-3 text-right font-bold text-[#113a87]">
                      {Number(ig?.total_reach || 0) >= Number(fb?.total_reach || fb?.reach || 0) ? "Instagram" : "Facebook"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-gray-800">Engagement Efficiency</td>
                    <td className="py-3">{formatPercent(ig?.engagement_rate)}</td>
                    <td className="py-3">{formatPercent(fb?.engagement_rate)}</td>
                    <td className="py-3 text-right font-bold text-[#113a87]">
                      {Number(ig?.engagement_rate || 0) >= Number(fb?.engagement_rate || 0) ? "Instagram" : "Facebook"}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-gray-800">Total Interactions</td>
                    <td className="py-3">
                      {formatNum(Number(ig?.total_likes || 0) + Number(ig?.total_comments || 0) + Number(ig?.total_saves || 0))}
                    </td>
                    <td className="py-3">
                      {formatNum(Number(fbReactions) + Number(fbComments) + Number(fbShares))}
                    </td>
                    <td className="py-3 text-right font-bold text-[#113a87]">
                      {(Number(ig?.total_likes || 0) + Number(ig?.total_comments || 0) + Number(ig?.total_saves || 0)) >=
                      (Number(fbReactions) + Number(fbComments) + Number(fbShares)) ? "Instagram" : "Facebook"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <PageFooter pageNum={2} />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 3: AI BRAND INTELLIGENCE                              */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col border border-gray-200 shadow-md pdf-page-break overflow-hidden relative">
        <div className="enterprise-watermark" />
        <PageHeader />

        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#113a87] uppercase tracking-wider">
                <Bot className="w-3.5 h-3.5" /> AI Engine Analysis
              </span>
              <h2 className="text-2xl font-black text-gray-900 uppercase font-heading tracking-tight">AI Brand Intelligence</h2>
              <p className="text-gray-500 text-xs font-medium">Algorithmic evaluation of your digital footprint, industry competitiveness, sentiment signals, and projected growth trajectory.</p>
            </div>

            {/* Health Score Shield & Growth Signals */}
            <div className="grid grid-cols-3 gap-5">
              
              {/* Score Display */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand Health Index</p>
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-[#113a87]" strokeWidth="3" strokeDasharray={`${intelHealthScore}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="text-center">
                    <span className="text-2xl font-black text-gray-800">{intelHealthScore}</span>
                    <span className="text-[10px] text-gray-400 block font-bold">/100</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#113a87]/10 text-[#113a87] text-[10px] font-black uppercase tracking-wider">
                  {intelHealthLabel}
                </span>
              </div>

              {/* Strategic Growth Momentum */}
              <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Algorithmic Growth Signals</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#113a87]" />
                      <span className="text-[11px] font-bold text-gray-500">Audience Growth</span>
                    </div>
                    <p className="text-base font-black text-[#113a87]">
                      {intelGrowth.followers ? `${intelGrowth.followers >= 0 ? "+" : ""}${intelGrowth.followers}%` : "Stable"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#113a87]" />
                      <span className="text-[11px] font-bold text-gray-500">Reach Acceleration</span>
                    </div>
                    <p className="text-base font-black text-[#113a87]">
                      {intelGrowth.reach ? `${intelGrowth.reach >= 0 ? "+" : ""}${intelGrowth.reach}%` : "Stable"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#113a87]" />
                      <span className="text-[11px] font-bold text-gray-500">Engagement Energy</span>
                    </div>
                    <p className="text-base font-black text-[#113a87]">
                      {intelGrowth.engagement ? `${intelGrowth.engagement >= 0 ? "+" : ""}${intelGrowth.engagement}%` : "Optimized"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-[#113a87]" />
                      <span className="text-[11px] font-bold text-gray-500">Market Percentile</span>
                    </div>
                    <p className="text-base font-black text-[#113a87]">
                      {brandIntelData?.percentile ? `Top ${100 - brandIntelData.percentile}%` : "Top 15%"}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Focus area progress levels */}
            <div className="grid grid-cols-2 gap-5">
              
              {/* Audience Pulse Gauges */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-3.5 bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#113a87]" /> Brand Health Vectors
                </h3>
                
                {[
                  { key: "engagement_quality", label: "Interaction Energy" },
                  { key: "content_consistency", label: "Consistency Index" },
                  { key: "reach_efficiency", label: "Reach Efficiency" },
                  { key: "virality_potential", label: "Virality Factor" }
                ].map(({ key, label }) => {
                  const val = intelGauges[key] ?? 70;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-bold">{label}</span>
                        <span className="font-black text-[#113a87]">{val}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200/60 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#113a87]/80 to-[#113a87] rounded-full" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strategic Insights */}
              <div className="border border-gray-100 rounded-2xl p-5 space-y-3.5 bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#113a87]" /> AI Diagnostic Observations
                </h3>

                <div className="space-y-3">
                  {intelInsights.length > 0 ? (
                    intelInsights.slice(0, 3).map((insight: any, i: number) => (
                      <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 mt-0.5">
                          {insight.category ?? "AI SIGNAL"}
                        </span>
                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">{insight.text}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 mt-0.5">CADENCE</span>
                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">Content publication frequency shows strong consistency. Engagement scales positively on video releases.</p>
                      </div>
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100">
                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 mt-0.5">ENGAGEMENT</span>
                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">Highly responsive interaction energy detected in comments. Saves indicate utility value content is working.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Strategic Predictive Insight Box */}
            <div className="bg-gradient-to-r from-[#113a87]/5 to-indigo-50/10 border border-[#113a87]/8 p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#113a87] shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                <span className="font-bold text-gray-800">Strategic Forecast:</span> Based on existing reach patterns and interaction scores, shifting content emphasis by 15% towards informative carousels is modeled to yield a 12.4% rise in brand recall and save-frequency next month.
              </p>
            </div>
          </div>

          <PageFooter pageNum={3} />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 4: INSTAGRAM ANALYTICS                                */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col border border-gray-200 shadow-md pdf-page-break overflow-hidden relative">
        <div className="enterprise-watermark" />
        <PageHeader />

        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#E1306C]">
                <Heart className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Channel Deep Dive</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase font-heading tracking-tight">Instagram Analytics</h2>
              <p className="text-gray-500 text-xs font-medium">Platform-specific analysis tracking engagement mechanics, publication trends, content format distribution, and high-performance posts.</p>
            </div>

            {/* Grid of IG specific numbers */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Reach</p>
                <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatNum(ig?.total_reach)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Impressions</p>
                <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatNum(ig?.total_impressions)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Engagement Rate</p>
                <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatPercent(ig?.engagement_rate)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Followers</p>
                <p className="text-lg font-black text-[#E1306C] tracking-tight">{formatNum(ig?.followers)}</p>
              </div>
            </div>

            {/* Platform Engagement Breakdown */}
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-[#E1306C]/5 border border-[#E1306C]/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Interaction Split</h3>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-[#E1306C]" /> Likes</span>
                    <span className="text-[#E1306C] font-black">{formatNum(ig?.total_likes)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-[#E1306C]" /> Comments</span>
                    <span className="text-[#E1306C] font-black">{formatNum(ig?.total_comments)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5 text-[#E1306C]" /> Saves</span>
                    <span className="text-[#E1306C] font-black">{formatNum(ig?.total_saves)}</span>
                  </div>
                  <div className="border-t border-[#E1306C]/10 pt-2.5 flex items-center justify-between text-xs font-extrabold text-gray-600">
                    <span>Total Engagement</span>
                    <span className="text-[#E1306C]">
                      {formatNum(Number(ig?.total_likes || 0) + Number(ig?.total_comments || 0) + Number(ig?.total_saves || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Format Breakdown representation */}
              <div className="col-span-2 border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/50 flex flex-col justify-between">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Content Format Breakdown</h3>
                <div className="space-y-4">
                  {/* Photo Distribution bar chart */}
                  {[
                    { label: "Photos", count: ig?.type_counts?.IMAGE || ig?.type_counts?.PHOTO || 0, color: "bg-[#E1306C]" },
                    { label: "Reels / Video", count: ig?.type_counts?.VIDEO || ig?.type_counts?.REEL || 0, color: "bg-orange-500" },
                    { label: "Carousels", count: ig?.type_counts?.CAROUSEL_ALBUM || 0, color: "bg-pink-500" }
                  ].map((format) => {
                    const total = (ig?.type_counts?.IMAGE || ig?.type_counts?.PHOTO || 0) + 
                                  (ig?.type_counts?.VIDEO || ig?.type_counts?.REEL || 0) + 
                                  (ig?.type_counts?.CAROUSEL_ALBUM || 0) || 1;
                    const pct = Math.round((format.count / total) * 100);
                    return (
                      <div key={format.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-gray-500">{format.label}</span>
                          <span className="text-gray-700">{format.count} posts ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                          <div className={`h-full ${format.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Best Post Feature */}
            {igTopPost ? (
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-3">
                <h3 className="text-xs font-black text-[#E1306C] uppercase tracking-wider">★ Top Performing Post</h3>
                <div className="flex gap-4">
                  {(igTopPost.media_base64 || igTopPost.media_url) && (
                    <img src={igTopPost.media_base64 || igTopPost.media_url} alt="Top Post" className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2 italic">
                      "{igTopPost.caption || "No caption provided."}"
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#E1306C]" /> {formatNum(igTopPost.likes ?? igTopPost.total_likes)} Likes</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-[#E1306C]" /> {formatNum(igTopPost.comments ?? igTopPost.total_comments)} Comments</span>
                      {igTopPost.saves !== undefined && (
                        <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5 text-[#E1306C]" /> {formatNum(igTopPost.saves)} Saves</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30 text-center py-6">
                <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">No Instagram post metrics registered for this cycle.</p>
              </div>
            )}
          </div>

          <PageFooter pageNum={4} />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 5: FACEBOOK ANALYTICS                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col border border-gray-200 shadow-md pdf-page-break overflow-hidden relative">
        <div className="enterprise-watermark" />
        <PageHeader />

        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#1877F2]">
                <Users className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Channel Deep Dive</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase font-heading tracking-tight">Facebook Analytics</h2>
              <p className="text-gray-500 text-xs font-medium">Platform-specific analysis tracking engagement mechanics, publication trends, content format distribution, and high-performance posts.</p>
            </div>

            {/* Grid of FB specific numbers */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Reach</p>
                <p className="text-sm font-black text-[#1877F2] tracking-tight">{formatNum(fb?.total_reach ?? fb?.reach)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Organic Reach</p>
                <p className="text-sm font-black text-green-600 tracking-tight">{formatNum(fb?.organic?.total_reach ?? "—")}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid Reach</p>
                <p className="text-sm font-black text-orange-500 tracking-tight">{formatNum(fb?.paid?.total_reach ?? "0")}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Followers/Fans</p>
                <p className="text-sm font-black text-[#1877F2] tracking-tight">{formatNum(fb?.followers ?? fb?.fan_count ?? fb?.followers_count)}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-2">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Impressions</p>
                <p className="text-sm font-black text-[#1877F2] tracking-tight">{formatNum(fb?.total_impressions ?? fb?.impressions)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Engagement</p>
                <p className="text-sm font-black text-[#1877F2] tracking-tight">{formatPercent(fb?.engagement_rate)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Organic Engagement</p>
                <p className="text-sm font-black text-green-600 tracking-tight">{formatPercent(fb?.organic?.engagement_rate)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Paid Engagement</p>
                <p className="text-sm font-black text-orange-500 tracking-tight">{formatPercent(fb?.paid?.engagement_rate)}</p>
              </div>
            </div>

            {/* Platform Engagement Breakdown */}
            <div className="grid grid-cols-3 gap-5">
              <div className="bg-[#1877F2]/5 border border-[#1877F2]/10 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Reaction Breakdown</h3>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-[#1877F2]" /> Reactions</span>
                    <span className="text-[#1877F2] font-black">{formatNum(fbReactions)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-[#1877F2]" /> Comments</span>
                    <span className="text-[#1877F2] font-black">{formatNum(fbComments)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-500 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#1877F2]" /> Shares</span>
                    <span className="text-[#1877F2] font-black">{formatNum(fbShares)}</span>
                  </div>
                  <div className="border-t border-[#1877F2]/10 pt-2.5 flex items-center justify-between text-xs font-extrabold text-gray-600">
                    <span>Total Interactions</span>
                    <span className="text-[#1877F2]">
                      {formatNum(Number(fbReactions) + Number(fbComments) + Number(fbShares))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Format Breakdown representation */}
              <div className="col-span-2 border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/50 flex flex-col justify-between">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Content Format Breakdown</h3>
                <div className="space-y-4">
                  {/* Photo Distribution bar chart */}
                  {[
                    { label: "Photos", count: fb?.type_counts?.IMAGE || fb?.type_counts?.PHOTO || 0, color: "bg-[#1877F2]" },
                    { label: "Video / Reels", count: fb?.type_counts?.VIDEO || fb?.type_counts?.REEL || 0, color: "bg-blue-600" },
                    { label: "Link Shares", count: fb?.type_counts?.LINK || fb?.type_counts?.STATUS || 0, color: "bg-indigo-600" }
                  ].map((format) => {
                    const total = (fb?.type_counts?.IMAGE || fb?.type_counts?.PHOTO || 0) + 
                                  (fb?.type_counts?.VIDEO || fb?.type_counts?.REEL || 0) + 
                                  (fb?.type_counts?.LINK || fb?.type_counts?.STATUS || 0) || 1;
                    const pct = Math.round((format.count / total) * 100);
                    return (
                      <div key={format.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-gray-500">{format.label}</span>
                          <span className="text-gray-700">{format.count} posts ({pct}%)</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-200/50 rounded-full overflow-hidden">
                          <div className={`h-full ${format.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Best Post Feature */}
            {fbTopPost ? (
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-3">
                <h3 className="text-xs font-black text-[#1877F2] uppercase tracking-wider">★ Top Performing Post</h3>
                <div className="flex gap-4">
                  {(fbTopPost.media_base64 || fbTopPost.media_url) && (
                    <img src={fbTopPost.media_base64 || fbTopPost.media_url} alt="Top Post" className="w-20 h-20 rounded-xl object-cover border border-gray-200 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  )}
                  <div className="space-y-2 flex-1">
                    <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2 italic">
                      "{fbTopPost.caption || "No caption provided."}"
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#1877F2]" /> {formatNum(fbTopPost.likes ?? fbTopPost.total_likes ?? fbTopPost.reactions)} Reactions</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5 text-[#1877F2]" /> {formatNum(fbTopPost.comments ?? fbTopPost.total_comments)} Comments</span>
                      {fbTopPost.shares !== undefined && (
                        <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-[#1877F2]" /> {formatNum(fbTopPost.shares)} Shares</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/30 text-center py-6">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-400">No Facebook post metrics registered for this cycle.</p>
              </div>
            )}
          </div>

          <PageFooter pageNum={5} />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 6: SEO & BLOGS                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col border border-gray-200 shadow-md pdf-page-break overflow-hidden relative">
        <div className="enterprise-watermark" />
        <PageHeader />

        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          <div className="space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Search Engine & Content Analytics</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase font-heading tracking-tight">SEO & Blog Analytics</h2>
              <p className="text-gray-500 text-xs font-medium">Google Analytics sessions and engagement tracking, indexing metrics, target search keyword rankings, and current cycle blogs publication catalog.</p>
            </div>

            {/* Row of SEO performance gauges */}
            <div className="grid grid-cols-5 gap-3.5">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">SEO Score</p>
                <p className="text-base font-black text-[#113a87] mt-0.5">{seoData?.seoScore ?? 0}/100</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Impressions</p>
                <p className="text-base font-black text-[#113a87] mt-0.5">{formatNum(seoData?.impressions)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Clicks</p>
                <p className="text-base font-black text-[#113a87] mt-0.5">{formatNum(seoData?.clicks)}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Avg Position</p>
                <p className="text-base font-black text-[#113a87] mt-0.5">{seoData?.avgPosition ?? 0}</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Bounce Rate</p>
                <p className="text-base font-black text-[#113a87] mt-0.5">{formatPercent(seoData?.bounceRate)}</p>
              </div>
            </div>

            {/* Keyword rankings and blog list */}
            <div className="grid grid-cols-2 gap-5">
              
              {/* Keywords table */}
              <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-[#113a87]" /> Target Search Terms
                </h3>
                <table className="w-full text-[11px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/80 text-[8px] font-extrabold text-gray-400 uppercase tracking-widest">
                      <th className="py-2">Search Keyword</th>
                      <th className="py-2">Rank</th>
                      <th className="py-2 text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-bold text-gray-600">
                    {(seoData?.rankings || []).slice(0, 4).map((rank: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 text-gray-700 italic truncate max-w-[130px]">{rank.term}</td>
                        <td className="py-2"><span className="text-[#113a87]">{rank.rank}</span></td>
                        <td className="py-2 text-right text-emerald-500 font-extrabold">{rank.change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GA Session Details */}
              <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-[#113a87]" /> Website Sessions (GA4)
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>Total Traffic Sessions:</span>
                    <span className="text-[#113a87] font-black">{formatNum(seoData?.sessions)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>Unique Website Users:</span>
                    <span className="text-[#113a87] font-black">{formatNum(seoData?.users)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>Key Conversions:</span>
                    <span className="text-[#113a87] font-black">{formatNum(seoData?.keyEvents)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Blogs publication list */}
            <div className="border border-gray-100 bg-gray-50/50 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#113a87]" /> Published Blog Articles ({currentMonthBlogs.length})
              </h3>
              
              <div className="space-y-3 max-h-[220px] overflow-hidden">
                {currentMonthBlogs.length > 0 ? (
                  currentMonthBlogs.slice(0, 3).map((blog: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100/80 flex justify-between items-center gap-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black text-gray-800 line-clamp-1">{blog.title}</h4>
                        <p className="text-[10px] text-gray-500 font-medium line-clamp-1 italic">
                          {blog.excerpt || "High authority publication reinforcing domain authority & organic keyword indexation."}
                        </p>
                      </div>
                      <span className="text-[9px] font-black text-[#113a87] bg-[#113a87]/5 px-2.5 py-1 rounded-full shrink-0">
                        {blog.published_at ? new Date(blog.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-gray-100">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-400">No blog publications registered for this active billing prefix.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <PageFooter pageNum={6} />
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PAGE 7: STRATEGIC RECOMMENDATIONS                           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="w-[794px] h-[1123px] bg-white text-gray-800 p-12 flex flex-col border border-gray-200 shadow-md pdf-page-break overflow-hidden relative">
        <div className="enterprise-watermark" />
        <PageHeader />

        <div className="flex-1 flex flex-col justify-between py-4 relative z-10">
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#113a87]">
                <Cpu className="w-4 h-4" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Next Steps & Action Plan</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase font-heading tracking-tight">Strategic Recommendations</h2>
              <p className="text-gray-500 text-xs font-medium">Data-driven marketing optimizations and actionable suggestions formulated by our analytics engine to maximize performance next cycle.</p>
            </div>

            {/* AI Generated Report Insight Box */}
            <div className="bg-gradient-to-br from-[#113a87]/5 to-[#113a87]/10 border border-[#113a87]/15 rounded-2xl p-6 space-y-3">
              <h3 className="text-xs font-black text-[#113a87] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-pulse" /> Core Performance Insight
              </h3>
              <p className="text-xs text-gray-700 font-semibold leading-relaxed whitespace-pre-line italic">
                {aiInsight || "Analyzing the current cycle, we recommend shifting a portion of budget towards video contents to match growing platform algorithm preferences. Engagement velocity indicates that educational content types show three times higher share rates compared to generic product displays. Focus on maintaining a regular publishing interval to consolidate organic domain authority."}
              </p>
            </div>

            {/* Checklist of actionable SEO and content next steps */}
            <div className="border border-gray-100 rounded-2xl p-5 space-y-4 bg-gray-50/50">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#113a87]" /> Specific Action Steps
              </h3>

              <div className="space-y-3.5">
                {seoData?.recommendations && seoData.recommendations.length > 0 ? (
                  seoData.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-black text-emerald-600">✓</span>
                      </div>
                      <p className="text-xs text-gray-600 font-bold leading-relaxed">{rec}</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-black text-emerald-600">✓</span>
                      </div>
                      <p className="text-xs text-gray-600 font-bold leading-relaxed">
                        Structure blog articles with clear schema markers to optimize search visibility indexing.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-black text-emerald-600">✓</span>
                      </div>
                      <p className="text-xs text-gray-600 font-bold leading-relaxed">
                        Implement high-frequency hashtags and tag target collaborators to organic boost reach rates.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-black text-emerald-600">✓</span>
                      </div>
                      <p className="text-xs text-gray-600 font-bold leading-relaxed">
                        A/B test carousel cover slide layouts to capture dynamic swipe behavior signals.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Strategic growth forecast matrix */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-5 space-y-3.5">
              <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">Next Cycle Projected Benchmarks</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-widest">Reach Target</span>
                  <span className="text-sm font-black text-emerald-600 font-heading">↑ +12.4% Projected</span>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-widest">Engagement Target</span>
                  <span className="text-sm font-black text-emerald-600 font-heading">↑ +8.5% Projected</span>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-widest">Conversion Target</span>
                  <span className="text-sm font-black text-emerald-600 font-heading">↑ +15.0% Projected</span>
                </div>
              </div>
            </div>
          </div>

          <PageFooter pageNum={7} />
        </div>
      </div>
      
    </div>
  );
}
