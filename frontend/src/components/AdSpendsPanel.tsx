import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2, DollarSign, CheckCircle, MousePointerClick, Users,
  ChevronLeft, ChevronRight, Upload, Download, X, FileSpreadsheet,
  AlertCircle
} from "lucide-react";

interface AdSpendRow {
  campaign_name: string;
  platform: string;
  kpi: string;
  month: string;
  year: string;
  value: number;
}

interface AdSpendResponse {
  rows: AdSpendRow[];
  months: string[];
  stats: {
    allocated_budget: number;
    amount_spent: number;
    total_clicks: number;
    total_leads: number;
  };
}

const CAMPAIGN_SCHEMA: { campaign: string; platform: string; kpis: string[] }[] = [
  {
    campaign: "Website visits for leads",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Reach", "Clicks", "CPC", "Website Visits"],
  },
  {
    campaign: "Instant Form leads (with OTP)",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Clicks", "CPC", "Leads", "CPL"],
  },
  {
    campaign: "Retargeting leads - Instant form",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Clicks", "CPC", "Leads", "CPL"],
  },
  {
    campaign: "FB page likes",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Clicks", "Likes / follows", "Cost per result"],
  },
  {
    campaign: "Instagram profile visits",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Reach", "Clicks", "CPC", "Visits"],
  },
  {
    campaign: "PMax with retargeting",
    platform: "Google",
    kpis: ["Allocated Budget", "Amount spent", "Clicks", "CPC", "Leads", "Phone calls"],
  },
  {
    campaign: "Boosting",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Reach", "Clicks", "CPC", "Leads"],
  },
  {
    campaign: "Custom Audience",
    platform: "Meta",
    kpis: ["Allocated Budget", "Amount spent", "Reach", "Clicks", "CPC", "Leads"],
  },
];

const RATE_KPIS = new Set(["CPC", "CPL", "Cost per result"]);

function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatNumber(n: number): string {
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthIndex(m: string): number {
  return MONTH_NAMES.indexOf(m);
}

function metaIcon(platform: string) {
  if (platform === "Meta")
    return (
      <svg className="w-4 h-4" viewBox="0 0 36 36" fill="currentColor">
        <path d="M18 2.3c-8.7 0-15.7 7-15.7 15.7 0 7.9 5.8 14.4 13.4 15.6v-11H11v-4.6h4.7v-3.5c0-4.7 2.8-7.2 7-7.2 2 0 4.2.4 4.2.4v4.6h-2.4c-2.3 0-3 1.5-3 3v2.7h5.2l-.8 4.6h-4.3V33.6c7.6-1.2 13.4-7.7 13.4-15.6 0-8.7-7-15.7-15.7-15.7z"/>
      </svg>
    );
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function AdSpendsPanel({ clientId, month, year }: { clientId: string; month: string; year: string }) {
  const [view, setView] = useState<"grid" | "visual" | "import">("grid");
  const [selMonth, setSelMonth] = useState(monthIndex(month));
  const [selYear, setSelYear] = useState(parseInt(year));
  const [data, setData] = useState<AdSpendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const fetchAdSpends = useCallback(async () => {
    setLoading(true);
    const mName = MONTH_NAMES[selMonth];
    try {
      const res = await fetch(`/api/clients/${clientId}/ad-spends?month=${mName}&year=${selYear}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch ad spends", err);
    } finally {
      setLoading(false);
    }
  }, [clientId, selMonth, selYear]);

  useEffect(() => {
    fetchAdSpends();
  }, [fetchAdSpends]);

  const months = data?.months ?? [];
  const mIdx = months.indexOf(MONTH_NAMES[selMonth]);
  const prevMonth = () => {
    if (selMonth === 0) {
      setSelMonth(11);
      setSelYear(y => y - 1);
    } else {
      setSelMonth(m => m - 1);
    }
  };
  const nextMonth = () => {
    if (selMonth === 11) {
      setSelMonth(0);
      setSelYear(y => y + 1);
    } else {
      setSelMonth(m => m + 1);
    }
  };

  const stats = data?.stats ?? { allocated_budget: 0, amount_spent: 0, total_clicks: 0, total_leads: 0 };

  const getVal = (campaign: string, kpi: string, m: string, y: number): number | null => {
    if (!data) return null;
    const match = data.rows.find(
      r => r.campaign_name === campaign && r.kpi === kpi && r.month === m && r.year === String(y)
    );
    return match ? match.value : null;
  };

  const totalForKpi = (campaign: string, kpi: string): number => {
    if (!data || !months.length) return 0;
    const vals = months.map(m => getVal(campaign, kpi, m, selYear)).filter(v => v !== null) as number[];
    if (RATE_KPIS.has(kpi) && vals.length > 0) {
      return vals.reduce((s, v) => s + v, 0) / vals.length;
    }
    return vals.reduce((s, v) => s + v, 0);
  };

  const displayVal = (v: number | null, kpi: string): string => {
    if (v === null || v === undefined) return "\u2014";
  const isCurrency = kpi === "Allocated Budget" || kpi === "Amount spent" || kpi === "Cost per result";
  const isRate = RATE_KPIS.has(kpi);
  if (isCurrency) return formatCurrency(v);
  if (isRate) return `₹${v.toFixed(2)}`;
    return formatNumber(v);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErrors([]);
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/clients/${clientId}/ad-spends/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
        body: formData,
      });
      if (res.ok) {
        setView("grid");
        fetchAdSpends();
      } else {
        const err = await res.json();
        setImportErrors(err.detail || ["Import failed"]);
      }
    } catch (err) {
      setImportErrors(["Network error during import"]);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const headers = ["campaign_name", "platform", "kpi", "month", "year", "value"];
    const rows = CAMPAIGN_SCHEMA.flatMap(c =>
      c.kpis.map(k => `${c.campaign},${c.platform},${k},${MONTH_NAMES[selMonth]},${selYear},`)
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ad_spend_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] animate-fade-in">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-black font-heading text-slate-800 leading-tight tracking-tight">
            <span className="text-emerald-600">₹</span> Ad Spend Budget Planner
          </h2>
          <p className="text-[10px] text-emerald-600/80 font-bold tracking-wider uppercase mt-0.5">
            CAMPAIGN BUDGET TIMELINES
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggles */}
          <div className="flex rounded-xl bg-slate-100 p-0.5 gap-0.5">
            {(["grid", "visual"] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                  view === v
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v === "grid" && "Timeline Grid"}
                {v === "visual" && "Visual"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setView("import")}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-700 hover:border-emerald-300 shadow-sm transition-all whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <button onClick={prevMonth} className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-700 tabular-nums min-w-[80px] text-center">
              {MONTH_NAMES[selMonth].slice(0, 3)} {selYear}
            </span>
            <button onClick={nextMonth} className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Allocated Budget (Month)", icon: DollarSign, value: formatCurrency(stats.allocated_budget), color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Amount Spent (Month)", icon: CheckCircle, value: formatCurrency(stats.amount_spent), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Clicks (Month)", icon: MousePointerClick, value: formatNumber(stats.total_clicks), color: "text-violet-600", bg: "bg-violet-50" },
          { label: "Total Leads / Results (Month)", icon: Users, value: formatNumber(stats.total_leads), color: "text-amber-600", bg: "bg-amber-50" },
        ].map(card => (
          <div key={card.label} className="group p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center">
              <div className="text-[26px] font-black leading-none tracking-tight text-slate-900 tabular-nums">
                {card.value}
              </div>
              <div className={`w-7 h-7 rounded-md ${card.bg} flex items-center justify-center ${card.color} transition-transform group-hover:scale-110 shrink-0`}>
                <card.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-[13px] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-slate-300 opacity-70 shrink-0" />
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Grid view */}
      {view === "grid" && (
        loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600/80" />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-1 md:px-4 py-2 md:py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Campaign
                  </th>
                  <th className="text-left px-1 md:px-4 py-2 md:py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Platform
                  </th>
                  <th className="text-left px-1 md:px-4 py-2 md:py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    KPI
                  </th>
                  {months.map(m => (
                    <th
                      key={m}
                      className={`text-right px-1 md:px-4 py-2 md:py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        m === MONTH_NAMES[selMonth]
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-50 text-slate-500 hidden md:table-cell"
                      }`}
                    >
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="text-right px-1 md:px-4 py-2 md:py-3 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {CAMPAIGN_SCHEMA.map((campaign, ci) =>
                  campaign.kpis.map((kpi, ki) => {
                    const isFirst = ki === 0;
                    const isLast = ki === campaign.kpis.length - 1;
                    return (
                      <tr
                        key={`${campaign.campaign}-${kpi}`}
                        className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                          isLast ? "border-b-2 border-b-slate-200" : ""
                        }`}
                      >
                        {isFirst && (
                          <td
                            rowSpan={campaign.kpis.length}
                            className="px-1 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm font-bold text-slate-800 align-top leading-tight md:leading-normal"
                          >
                            {campaign.campaign}
                          </td>
                        )}
                        {isFirst && (
                          <td
                            rowSpan={campaign.kpis.length}
                            className="px-1 md:px-4 py-1.5 md:py-2 align-top"
                          >
                            <div className="flex items-center gap-0.5 md:gap-1.5 text-xs md:text-sm font-semibold text-slate-600">
                              {metaIcon(campaign.platform)}
                              <span className="hidden md:inline">{campaign.platform}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-1 md:px-4 py-1.5 md:py-2 text-[9px] md:text-xs text-slate-500 font-medium whitespace-nowrap">
                          {kpi}
                        </td>
                        {months.map(m => {
                          const v = getVal(campaign.campaign, kpi, m, selYear);
                          const isCurrent = m === MONTH_NAMES[selMonth];
                          return (
                            <td
                              key={m}
                              className={`text-right px-1 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm font-bold tabular-nums ${
                                isCurrent ? "bg-emerald-50/60 text-emerald-800" : "text-slate-700 hidden md:table-cell"
                              }`}
                            >
                              {displayVal(v, kpi)}
                            </td>
                          );
                        })}
                        <td className="text-right px-1 md:px-4 py-1.5 md:py-2 text-[10px] md:text-sm font-bold tabular-nums text-slate-800">
                          {displayVal(totalForKpi(campaign.campaign, kpi), kpi)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Visual view placeholder */}
      {view === "visual" && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <BarChart3 className="w-12 h-12 mb-3 text-slate-300" />
          <p className="text-sm font-bold">Visual view coming soon</p>
          <p className="text-xs mt-1">Switch to Timeline Grid to view data</p>
        </div>
      )}

      {/* Import area (hidden file input) */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Import modal / errors */}
      {importErrors.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">Import Errors</span>
          </div>
          <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
            {importErrors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Import modal (when view is "import" and file not yet picked) */}
      {view === "import" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">Import Ad Spends</h3>
                  <p className="text-[10px] text-emerald-600/80 font-bold tracking-wider uppercase mt-0.5">CSV upload</p>
                </div>
              </div>
              <button onClick={() => setView("grid")} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Upload a CSV file matching the campaign/KPI structure. Columns: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">campaign_name, platform, kpi, month, year, value</code>
            </p>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 w-full mb-4 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-bold text-slate-600 transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4" />
              Download template
            </button>

            <label className="flex flex-col items-center justify-center w-full py-8 px-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50 cursor-pointer transition-colors">
              <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2" />
              <span className="text-sm font-bold text-emerald-700">Click to select CSV</span>
              <span className="text-xs text-slate-500 mt-1">or drag and drop</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={importing}
              />
            </label>

            {importing && (
              <div className="flex items-center gap-2 mt-4 text-sm text-emerald-700 font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}
