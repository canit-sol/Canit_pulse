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
  Lightbulb
} from 'lucide-react';

export interface AIStrategyData {
  overall_score: {
    score: number;
    trend: string;
    label: string;
    description: string;
  };
  ai_noticed: string[];
  recommended_actions: string[];
  risk_detection: string[];
  opportunity_radar: {
    title: string;
    impact: string;
    reason: string;
  };
  next_month_prediction?: {
    reach_trend: string;
    engagement_trend: string;
    confidence: number;
    reasoning: string;
  };
}

interface Props {
  data: AIStrategyData;
}

export function AIStrategyCenter({ data }: Props) {
  if (!data || !data.overall_score) return null;

  const score = data.overall_score.score;
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const scoreLabelColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = score >= 80 ? 'bg-emerald-50' : score >= 60 ? 'bg-amber-50' : 'bg-rose-50';
  const scoreBorder = score >= 80 ? 'border-emerald-200' : score >= 60 ? 'border-amber-200' : 'border-rose-200';

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#113a87] to-[#1e56b8] flex items-center justify-center shadow-sm">
          <Lightbulb className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-black text-[#1a1a1a] tracking-tight">AI Strategy Center</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">How to Improve Your Social Media Presence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Overall Score */}
        <div className="lg:col-span-3">
          <div className={`rounded-2xl p-5 border ${scoreBorder} ${scoreBg} flex flex-col items-center justify-center text-center h-full`}>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Marketing Score</p>
            
            <div className="relative flex items-center justify-center mb-3">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="50" stroke="#e5e7eb" strokeWidth="7" fill="transparent" />
                <circle 
                  cx="56" cy="56" r="50" 
                  stroke={scoreColor}
                  strokeWidth="7" 
                  fill="transparent" 
                  strokeDasharray="314" 
                  strokeDashoffset={314 - (314 * score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${scoreLabelColor}`}>{score}</span>
                <span className="text-[9px] text-gray-400 font-bold">/ 100</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${scoreBg} ${scoreLabelColor} border ${scoreBorder}`}>
                {data.overall_score.trend.startsWith('+') ? '▲' : data.overall_score.trend === '0' ? '—' : '▼'} {data.overall_score.trend}
              </span>
              <span className="text-xs font-black text-[#1a1a1a]">{data.overall_score.label}</span>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed mt-1">{data.overall_score.description}</p>
          </div>
        </div>

        {/* Middle: Noticed + Actions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* What AI Noticed */}
          <div className="rounded-2xl p-4 border border-slate-200/80 bg-slate-50/50 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-sky-100 flex items-center justify-center">
                <Activity className="w-3 h-3 text-sky-600" />
              </div>
              <h3 className="text-[11px] font-black text-[#1a1a1a] uppercase tracking-wider">What the AI Noticed</h3>
            </div>
            <ul className="space-y-2">
              {data.ai_noticed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Actions */}
          <div className="rounded-2xl p-4 border border-[#113a87]/15 bg-[#113a87]/5 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-[#113a87]/10 flex items-center justify-center">
                <Zap className="w-3 h-3 text-[#113a87]" />
              </div>
              <h3 className="text-[11px] font-black text-[#113a87] uppercase tracking-wider">What You Should Do Next</h3>
            </div>
            <ul className="space-y-2">
              {data.recommended_actions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-[#1a1a1a] font-semibold leading-relaxed bg-white/60 rounded-lg p-2.5 border border-[#113a87]/10">
                  <ChevronRight className="w-3.5 h-3.5 text-[#113a87] shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Opportunity + Risk */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Opportunity Radar */}
          <div className="rounded-2xl p-4 border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center">
                  <Target className="w-3 h-3 text-amber-600" />
                </div>
                <h3 className="text-[11px] font-black text-amber-800 uppercase tracking-wider">Opportunity</h3>
              </div>
              <div className="flex text-amber-400 gap-0.5">
                <Sparkles className="w-3 h-3" />
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
            
            <p className="text-sm font-black text-amber-900 mb-1.5">{data.opportunity_radar.title}</p>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] text-gray-500 font-bold">Impact:</span>
              <span className="text-[9px] text-amber-700 font-black uppercase bg-amber-100 px-1.5 py-0.5 rounded">{data.opportunity_radar.impact}</span>
            </div>
            
            <p className="text-[10px] text-amber-800/70 leading-relaxed border-l-2 border-amber-300 pl-2.5">
              {data.opportunity_radar.reason}
            </p>
          </div>

          {/* Risk Detection */}
          <div className="rounded-2xl p-4 border border-rose-200/60 bg-rose-50/30 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
              </div>
              <h3 className="text-[11px] font-black text-rose-700 uppercase tracking-wider">Risk Alerts</h3>
            </div>
            <ul className="space-y-2">
              {data.risk_detection.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-rose-800/70 leading-relaxed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
