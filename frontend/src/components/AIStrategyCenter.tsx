import React from 'react';
import { 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Sparkles, 
  Zap, 
  Activity, 
  ChevronRight, 
  BarChart2, 
  ShieldAlert, 
  LineChart
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
  next_month_prediction: {
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

  const scoreColor = data.overall_score.score >= 80 ? 'text-emerald-500' : data.overall_score.score >= 60 ? 'text-amber-500' : 'text-rose-500';
  const scoreBg = data.overall_score.score >= 80 ? 'bg-emerald-500/10' : data.overall_score.score >= 60 ? 'bg-amber-500/10' : 'bg-rose-500/10';

  return (
    <div className="bg-[#0A0F1C] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/20 border border-slate-800">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight">AI Strategy Center</h2>
          <p className="text-xs text-slate-400 font-medium">Executive Marketing Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Score & Predictions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Overall Score */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50" />
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Overall Marketing Score</p>
            
            <div className="relative flex items-center justify-center mb-4">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                <circle 
                  cx="64" cy="64" r="58" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="364" 
                  strokeDashoffset={364 - (364 * data.overall_score.score) / 100}
                  strokeLinecap="round"
                  className={scoreColor} 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${scoreColor}`}>{data.overall_score.score}</span>
                <span className="text-[10px] text-slate-500 font-bold mt-1">/ 100</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded-md ${scoreBg} ${scoreColor}`}>
                {data.overall_score.trend.startsWith('+') ? '▲' : '▼'} {data.overall_score.trend}
              </span>
              <span className="text-sm font-bold text-white">{data.overall_score.label}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed px-4">{data.overall_score.description}</p>
          </div>

          {/* Next Month Prediction */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <LineChart className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">Next Month Prediction</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Est. Reach</p>
                <p className="text-lg font-black text-emerald-400">{data.next_month_prediction.reach_trend}</p>
              </div>
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Est. Engagement</p>
                <p className="text-lg font-black text-emerald-400">{data.next_month_prediction.engagement_trend}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-[10px] mb-2">
              <span className="text-slate-400 font-bold">AI Confidence</span>
              <span className="text-indigo-400 font-bold">{data.next_month_prediction.confidence}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mb-3">
              <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${data.next_month_prediction.confidence}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed italic border-l-2 border-indigo-500/30 pl-2">
              "{data.next_month_prediction.reasoning}"
            </p>
          </div>
        </div>

        {/* Middle Column: Noticed & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* What AI Noticed */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-5 border border-slate-800 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-200">What the AI Noticed</h3>
            </div>
            <ul className="space-y-3">
              {data.ai_noticed.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500/50 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended Actions */}
          <div className="bg-indigo-500/10 backdrop-blur-md rounded-2xl p-5 border border-indigo-500/20 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-indigo-200">Recommended Actions</h3>
            </div>
            <ul className="space-y-3">
              {data.recommended_actions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-indigo-100 font-medium leading-relaxed bg-indigo-500/10 rounded-lg p-2 border border-indigo-500/10">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right Column: Opportunity & Risk */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Opportunity Radar */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/5 backdrop-blur-md rounded-2xl p-5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-200">Opportunity Radar</h3>
              </div>
              <div className="flex text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <Sparkles className="w-3.5 h-3.5" />
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            
            <div className="mb-3">
              <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-wider">High Opportunity</span>
              <p className="text-base font-black text-amber-400 mt-0.5">{data.opportunity_radar.title}</p>
            </div>
            
            <div className="flex items-center gap-2 mb-3 bg-black/20 rounded-lg p-2 w-fit">
              <span className="text-[10px] text-slate-400 font-bold">Est. Impact:</span>
              <span className="text-[10px] text-amber-400 font-black uppercase bg-amber-400/10 px-2 py-0.5 rounded">{data.opportunity_radar.impact}</span>
            </div>
            
            <p className="text-xs text-amber-100/70 leading-relaxed border-l-2 border-amber-500/30 pl-3">
              {data.opportunity_radar.reason}
            </p>
          </div>

          {/* Risk Detection */}
          <div className="bg-rose-500/5 backdrop-blur-md rounded-2xl p-5 border border-rose-500/10 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-rose-200">Risk Detection</h3>
            </div>
            <ul className="space-y-3">
              {data.risk_detection.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-rose-200/80 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500/50 shrink-0 mt-1.5" />
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
