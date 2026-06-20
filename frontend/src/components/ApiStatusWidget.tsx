import { Info } from "lucide-react";

export default function ApiStatusWidget() {
  const apis = [
    {
      name: "Meta",
      status: "🟢 Active",
      created: "12 Jun 2026",
      lastUsed: "5 mins ago",
      expires: "Never / Token Expiry",
      usage: "1,248 calls",
      features: "Facebook Insights, Instagram Insights, Ad Performance"
    },
    {
      name: "Groq",
      status: "🟢 Active",
      created: "15 Jun 2026",
      lastUsed: "2 mins ago",
      expires: "N/A",
      usage: "842 calls",
      features: "AI Reports, SEO Analysis, Content Generation"
    },
    {
      name: "GNews",
      status: "🟢 Active",
      created: "15 Jun 2026",
      lastUsed: "10 mins ago",
      expires: "N/A",
      usage: "154 calls",
      features: "Industry News, Competitor Intelligence"
    },
    {
      name: "YouTube",
      status: "🟢 Active",
      created: "16 Jun 2026",
      lastUsed: "1 hour ago",
      expires: "N/A",
      usage: "42 calls",
      features: "Channel Preview, Video Analytics"
    },
    {
      name: "RapidAPI",
      status: "🟢 Active",
      created: "18 Jun 2026",
      lastUsed: "12 mins ago",
      expires: "N/A",
      usage: "315 calls",
      features: "Instagram Scraper, Competitor Intelligence"
    }
  ];

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#1a1a1a] font-heading tracking-wide">API STATUS</h2>
      </div>
      <div className="divide-y divide-slate-50">
        {apis.map((api, idx) => (
          <div key={idx} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-bold text-[#1a1a1a] text-sm">{api.name}</span>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">{api.status}</span>
                <span className="text-xs font-bold text-slate-500 ml-auto md:hidden">{api.usage}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs font-medium text-slate-400">
                <div><span className="text-slate-500">Last Used:</span> {api.lastUsed}</div>
                <div className="hidden sm:block text-slate-300">•</div>
                <div><span className="text-slate-500">Expires:</span> {api.expires}</div>
              </div>
              <div className="group relative inline-flex items-center gap-1 mt-1.5 cursor-help w-max">
                <Info size={12} className="text-slate-400 group-hover:text-[#113a87] transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#113a87] transition-colors">Features</span>
                <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-medium">
                  <div className="font-bold mb-1 text-slate-200">Connected Features:</div>
                  <div className="text-slate-300 leading-relaxed">{api.features}</div>
                  <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              </div>
            </div>
            <div className="hidden md:block text-right">
              <div className="text-sm font-bold text-slate-700 bg-slate-100/50 px-3 py-1.5 rounded-lg border border-slate-100">{api.usage}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
