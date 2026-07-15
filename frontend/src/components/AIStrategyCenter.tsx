import React from 'react';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  Activity, 
  ShieldAlert, 
  Lightbulb,
  CheckCircle2
} from 'lucide-react';

export interface PulseIntelligenceData {
  pulse_sees: Array<{
    observation: string;
    why_it_matters: string;
  }>;
  pulse_recommends: Array<{
    recommended_action: string;
    expected_impact: string;
    priority_badge: string;
  }>;
  growth_opportunity: {
    title: string;
    observation: string;
    action: string;
    expected_impact: string;
    confidence_score: number;
  };
  watch_closely: Array<{
    observation: string;
    why_it_matters: string;
    recommended_action: string;
    risk_level: string;
  }>;
}

interface Props {
  data: PulseIntelligenceData;
}

export function AIStrategyCenter({ data }: Props) {
  if (!data || !data.pulse_sees) return null;

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#113a87] to-[#1e56b8] flex items-center justify-center shadow-md">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1a1a1a] tracking-tight">Pulse Intelligence</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Your Personal AI Marketing Strategist</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          
          {/* What Pulse Sees */}
          <div className="rounded-2xl p-6 border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-lg bg-sky-100 flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 text-sky-600" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">What Pulse Sees</h3>
            </div>
            <div className="space-y-5">
              {data.pulse_sees.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 relative group">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-2 shadow-sm" />
                  <div>
                    <p className="text-[13px] text-slate-900 font-bold leading-relaxed mb-1">{item.observation}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.why_it_matters}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pulse Recommends - HERO CARD */}
          <div className="rounded-2xl p-6 border-0 bg-gradient-to-br from-[#113a87] to-[#172852] text-white shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
              <Zap className="w-40 h-40" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center border border-white/10">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Pulse Recommends</h3>
              </div>
              <div className="space-y-4">
                {data.pulse_recommends.map((item, idx) => (
                  <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-sm transition-all hover:bg-white/15">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <span className="w-fit shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-white text-[#113a87] shadow-sm">
                        {item.priority_badge}
                      </span>
                      <span className="text-[10px] font-bold text-blue-100 sm:text-right leading-relaxed bg-[#113a87]/30 px-2.5 py-1 rounded-md border border-white/10">
                        <span className="opacity-70 mr-1">IMPACT:</span> 
                        {item.expected_impact}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5 mt-1">
                      <CheckCircle2 className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                      <p className="text-[13px] text-white font-semibold leading-relaxed tracking-wide">{item.recommended_action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          
          {/* Growth Opportunity */}
          <div className="rounded-2xl p-6 border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <TrendingUp className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shadow-sm">
                    <Target className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest">Growth Opportunity</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 shadow-sm">
                    {data.growth_opportunity.confidence_score}% Confidence
                  </span>
                </div>
              </div>
              
              <h4 className="text-base font-black text-slate-900 mb-2">{data.growth_opportunity.title}</h4>
              <p className="text-[13px] text-slate-600 font-medium leading-relaxed mb-4">{data.growth_opportunity.observation}</p>
              
              <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm mb-4">
                <p className="text-[13px] text-amber-900 font-semibold leading-relaxed">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block mb-1">Action Plan</span>
                  {data.growth_opportunity.action}
                </p>
              </div>
              
              <div className="flex items-center gap-2 bg-amber-100/50 p-2.5 rounded-lg border border-amber-200/50">
                <span className="text-[10px] text-amber-700/70 font-bold uppercase tracking-wider">Expected Impact:</span>
                <span className="text-[11px] text-amber-900 font-black">{data.growth_opportunity.expected_impact}</span>
              </div>
            </div>
          </div>

          {/* Watch Closely */}
          <div className="rounded-2xl p-6 border border-rose-100 bg-gradient-to-br from-rose-50/40 to-white shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center shadow-sm">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-widest">Watch Closely</h3>
            </div>
            <div className="space-y-5">
              {data.watch_closely.map((item, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-rose-300">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <p className="text-[13px] text-slate-800 font-bold leading-relaxed">{item.observation}</p>
                    <span className={`shrink-0 text-[9px] font-black uppercase px-2.5 py-1 rounded-md border shadow-sm ${
                      item.risk_level === 'High' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      item.risk_level === 'Medium' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {item.risk_level} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-3">{item.why_it_matters}</p>
                  <p className="text-[11px] text-slate-700 font-semibold bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
                    <span className="text-rose-500 mr-1.5">Action:</span>
                    {item.recommended_action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
