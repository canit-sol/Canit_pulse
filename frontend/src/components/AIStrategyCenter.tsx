import React from 'react';
import { 
  Bot, 
  TrendingUp, 
  Target, 
  Sparkles, 
  Zap, 
  Activity, 
  ChevronRight, 
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
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#113a87] to-[#1e56b8] flex items-center justify-center shadow-sm">
          <Lightbulb className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-[#1a1a1a] tracking-tight">Pulse Intelligence</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Your Personal AI Marketing Strategist</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Column */}
        <div className="flex flex-col gap-4">
          
          {/* What Pulse Sees */}
          <div className="rounded-2xl p-5 border border-slate-200/80 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-sky-50 border border-sky-100 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <h3 className="text-xs font-black text-[#1a1a1a] uppercase tracking-wider">What Pulse Sees</h3>
            </div>
            <div className="space-y-4">
              {data.pulse_sees.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-xs text-slate-800 font-semibold leading-relaxed mb-0.5">{item.observation}</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.why_it_matters}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pulse Recommends */}
          <div className="rounded-2xl p-5 border border-slate-200/80 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-[#113a87]/5 border border-[#113a87]/10 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-[#113a87]" />
              </div>
              <h3 className="text-xs font-black text-[#113a87] uppercase tracking-wider">Pulse Recommends</h3>
            </div>
            <div className="space-y-3">
              {data.pulse_recommends.map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 mb-2">
                    <span className="w-fit shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-slate-200 text-[#113a87]">
                      {item.priority_badge}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 xl:text-right leading-relaxed">
                      <span className="text-slate-300 mr-1">IMPACT:</span> 
                      {item.expected_impact}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 font-semibold leading-relaxed">{item.recommended_action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4">
          
          {/* Growth Opportunity */}
          <div className="rounded-2xl p-5 border border-slate-200/80 bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
              <TrendingUp className="w-24 h-24" />
            </div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">Growth Opportunity</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    {data.growth_opportunity.confidence_score}% Confidence
                  </span>
                </div>
              </div>
              
              <h4 className="text-sm font-black text-slate-900 mb-2">{data.growth_opportunity.title}</h4>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">{data.growth_opportunity.observation}</p>
              
              <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/50 mb-3">
                <p className="text-xs text-amber-900 font-semibold leading-relaxed">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block mb-0.5">Action Plan</span>
                  {data.growth_opportunity.action}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Expected Impact:</span>
                <span className="text-[10px] text-slate-700 font-black">{data.growth_opportunity.expected_impact}</span>
              </div>
            </div>
          </div>

          {/* Watch Closely */}
          <div className="rounded-2xl p-5 border border-slate-200/80 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <h3 className="text-xs font-black text-rose-700 uppercase tracking-wider">Watch Closely</h3>
            </div>
            <div className="space-y-4">
              {data.watch_closely.map((item, idx) => (
                <div key={idx} className="relative pl-3 border-l-2 border-rose-200">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-xs text-slate-800 font-bold leading-relaxed">{item.observation}</p>
                    <span className={`shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      item.risk_level === 'High' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                      item.risk_level === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {item.risk_level} Risk
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-2">{item.why_it_matters}</p>
                  <p className="text-[10px] text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 mr-1">Action:</span>
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
