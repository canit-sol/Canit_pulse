import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Target } from 'lucide-react';

export interface AIInsight {
  category: 'performance' | 'growth' | 'risk';
  title: string;
  detail: string;
  metric: string;
}

interface AIInsightsGridProps {
  insights: AIInsight[];
}

export function AIInsightsGrid({ insights }: AIInsightsGridProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {insights.map((insight, idx) => {
        let bgColor = "bg-gray-50";
        let headerColor = "text-gray-800";
        let metricColor = "text-gray-800";
        let Icon = Sparkles;
        let label = insight.category;

        if (insight.category === 'performance') {
          bgColor = "bg-emerald-50";
          headerColor = "text-emerald-800";
          metricColor = "text-emerald-600";
          Icon = Target;
        } else if (insight.category === 'growth') {
          bgColor = "bg-amber-50";
          headerColor = "text-amber-800";
          metricColor = "text-amber-600";
          Icon = TrendingUp;
        } else if (insight.category === 'risk') {
          bgColor = "bg-red-50";
          headerColor = "text-red-800";
          metricColor = "text-red-600";
          Icon = AlertTriangle;
        }

        return (
          <div key={idx} className={`p-4 rounded-xl flex flex-col justify-between border border-transparent hover:border-black/5 transition-all ${bgColor}`}>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={`w-3.5 h-3.5 ${headerColor}`} />
                <span className={`text-[10px] font-black uppercase tracking-wider ${headerColor}`}>
                  {label}
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1 leading-snug">
                {insight.title}
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed mb-4">
                {insight.detail}
              </p>
            </div>
            
            <div className={`text-lg font-black tracking-tight ${metricColor} mt-auto`}>
              {insight.metric}
            </div>
          </div>
        );
      })}
    </div>
  );
}
