import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DollarSign, BarChart3, TrendingUp, Target, RefreshCw, AlertTriangle, Settings, Check, Pencil, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { getAccessToken } from "../lib/auth";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function AdPerformanceView({ theme, month, year }: { theme: any, month?: string, year?: string }) {
  const { id } = useParams();
  const token = getAccessToken();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  useEffect(() => {
    if (month && year) {
      const monthIdx = MONTH_NAMES.indexOf(month);
      if (monthIdx !== -1) {
        const d = new Date(parseInt(year), monthIdx, 15);
        setDateRange({
          from: startOfMonth(d),
          to: endOfMonth(d),
        });
      }
    }
  }, [month, year]);

  const fetchPerformance = async () => {
    try {
      const start = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      const end = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
      const res = await fetch(`/api/clients/${id}/ad-performance?start=${start}&end=${end}&t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        setBudgetInput(json.budget.toString());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [id, token, dateRange]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const start = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
      const end = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
      await fetch(`/api/clients/${id}/sync-ads?start=${start}&end=${end}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchPerformance();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  const saveBudget = async () => {
    try {
      const parsed = parseFloat(budgetInput);
      if (isNaN(parsed)) return;
      await fetch(`/api/clients/${id}/ad-budget`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ budget: parsed })
      });
      setEditingBudget(false);
      fetchPerformance();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-400 font-bold animate-pulse">Loading Ad Performance...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {data.ad_account_error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-red-900">Meta Account Disconnected</h4>
            <p className="text-sm text-red-700 mt-1">{data.ad_account_error}</p>
          </div>
          <button 
            className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition"
            onClick={() => alert("Please navigate to Client Settings to reconnect the Meta Account.")}
          >
            Reconnect Meta
          </button>
        </div>
      )}

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Budget Card */}
        <div className={`col-span-1 md:col-span-2 rounded-xl p-5 border ${theme.cardBg} ${theme.cardBorder} shadow-sm relative overflow-hidden group`}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest font-heading">Monthly Budget</span>
              </div>
              {editingBudget ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[32px] font-black ${theme.valueColor}`}>₹</span>
                  <input 
                    type="number"
                    className="text-[32px] font-black bg-white border border-emerald-200 rounded-lg w-32 px-2 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    autoFocus
                  />
                  <button onClick={saveBudget} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check className="w-5 h-5"/></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`text-[42px] font-black leading-none tracking-tight ${theme.valueColor}`}>
                    ₹{data.budget.toLocaleString('en-IN')}
                  </div>
                  <button onClick={() => setEditingBudget(true)} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white/50 hover:bg-white rounded-md transition opacity-0 group-hover:opacity-100">
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
              <DollarSign className={`w-6 h-6 ${theme.iconColor}`} />
            </div>
          </div>
          
          <div className="mt-6 relative z-10">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Spent: ₹{data.total_spend.toLocaleString('en-IN')}</span>
              <span>Remaining: ₹{data.remaining_budget.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-2.5 w-full bg-white/60 rounded-full overflow-hidden border border-white">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000" 
                style={{ width: `${data.budget > 0 ? min(100, (data.total_spend / data.budget) * 100) : 0}%` }} 
              />
            </div>
          </div>
          
          <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none">
            <DollarSign className="w-48 h-48" />
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className={`rounded-xl p-5 border bg-white border-slate-100 shadow-sm flex flex-col justify-between`}>
          <div className="flex justify-between items-center">
            <div className="text-[28px] font-black text-slate-800">{data.metrics.leads.toLocaleString()}</div>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><Target className="w-4 h-4 text-orange-500"/></div>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Leads</div>
          <div className="mt-4 text-sm font-semibold text-slate-400">
            CPL: <span className="text-orange-500 font-bold">₹{data.metrics.cpl}</span>
          </div>
        </div>

        <div className={`rounded-xl p-5 border bg-white border-slate-100 shadow-sm flex flex-col justify-between`}>
          <div className="flex justify-between items-center">
            <div className="text-[28px] font-black text-slate-800">{data.metrics.clicks.toLocaleString()}</div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-500"/></div>
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Total Clicks</div>
          <div className="mt-4 text-sm font-semibold text-slate-400">
            CPC: <span className="text-blue-500 font-bold">₹{data.metrics.cpc}</span>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-black text-[#1a1a1a] text-lg">Active Campaigns</h4>
          <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex items-center gap-2 px-4 py-2 ${theme.cardBg} ${theme.cardBorder} border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition`}>
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {data?.campaigns?.length > 0 && (
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2 ${theme.cardBg} ${theme.cardBorder} border rounded-lg text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}
        </div>
        </div>

        {data.campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="font-bold text-slate-600">No campaigns found</p>
            <p className="text-sm text-slate-400 mt-1">Click sync or verify your Meta Ads connection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.campaigns.map((camp: any) => {
              const isBoosted = camp.campaign_name.startsWith("Post:") || 
                                camp.campaign_name.startsWith("SM Boosting");

              const statusStyle = isBoosted ? "bg-purple-100 text-purple-700" : ({
                ACTIVE:      "bg-emerald-100 text-emerald-700",
                PAUSED:      "bg-amber-100 text-amber-700",
                ARCHIVED:    "bg-slate-100 text-slate-500",
                DELETED:     "bg-red-100 text-red-500",
                WITH_ISSUES: "bg-red-100 text-red-600",
                IN_PROCESS:  "bg-blue-100 text-blue-600",
              } as Record<string, string>)[camp.status] ?? "bg-slate-100 text-slate-400";

              const statusLabel = isBoosted ? "Boosted" : camp.status;
              const isLeadCampaign = camp.objective === "OUTCOME_LEADS";
              const isAwareness = camp.objective === "OUTCOME_AWARENESS";

              return (
              <div key={camp.campaign_id} className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition group ${
                isBoosted ? 'border-purple-100' : 'border-slate-100'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-bold text-slate-800 text-sm leading-tight pr-4 line-clamp-2" title={camp.campaign_name}>
                    {camp.campaign_name}
                  </h5>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${statusStyle}`}>
                    {statusLabel}
                  </span>
                </div>
                
                <div className="text-[24px] font-black text-slate-900 mb-4">
                  ₹{camp.spend.toLocaleString('en-IN')} <span className="text-[10px] font-bold text-slate-400 uppercase">Spent</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-50">
                  <div className="text-center">
                    <div className="text-xs font-black text-slate-700">
                      {isLeadCampaign ? camp.leads : isAwareness ? camp.reach?.toLocaleString() : camp.clicks?.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">
                      {isLeadCampaign ? "Leads" : isAwareness ? "Reach" : "Clicks"}
                    </div>
                  </div>
                  <div className="text-center border-l border-slate-100">
                    <div className="text-xs font-black text-slate-700">
                      {isLeadCampaign ? `₹${camp.cpl}` : `₹${camp.cpc}`}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">
                      {isLeadCampaign ? "CPL" : "CPC"}
                    </div>
                  </div>
                  <div className="text-center border-l border-slate-100">
                    <div className="text-xs font-black text-slate-700">{camp.ctr}%</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">CTR</div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Utility
function min(a: number, b: number) { return a < b ? a : b; }
