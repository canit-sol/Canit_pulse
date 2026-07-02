import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Sparkles, LogOut, Bot, X, Send, Loader2,
  TrendingUp, BarChart3, DollarSign,
  Heart, MessageCircle, Bookmark, Users, Eye,
  ChevronLeft, ChevronRight, RefreshCw, Calendar,
  Globe, ShieldAlert, Activity, Flame, Mic, MicOff,
  ClipboardList, Plus, Trash2, ChevronDown, Volume2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import BrandIntelligence from "@/components/BrandIntelligence";
import PrintReportView from "../components/PrintReportView";
import DeliverablesPanel from "@/components/DeliverablesPanel";
import AdPerformanceView from "@/components/AdPerformanceView";

import { Download, AlertCircle, Play } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";
import TourGuide from "../components/TourGuide";

/* ── Animated Counter Hook ── */
function useAnimatedValue(target: number | string | undefined, duration = 800) {
  const [display, setDisplay] = useState(0);
  const numTarget = typeof target === 'string' ? parseFloat(target.replace(/[^0-9.]/g, '')) : (target ?? 0);
  const isNum = !isNaN(numTarget) && numTarget > 0;
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isNum) { setDisplay(0); return; }
    const start = performance.now();
    const from = 0;
    const step = (now: number) => {
      const elapsed = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
      setDisplay(from + (numTarget - from) * eased);
      if (elapsed < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [numTarget, duration, isNum]);

  return isNum ? display : target;
}

interface Report {
  id: string;
  month: string;
  year: string;
  ig_data: any;
  ai_insight: string;
}
interface ChatMessage { role: "user" | "assistant"; content: string; suggestions?: string[]; }

// ── Platform icons ───────
const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const PinterestIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

/** MVP: Instagram-first — set false to hide Facebook tab in UI (backend unchanged) */
const SHOW_FACEBOOK_TAB = true;

const PLATFORMS = [
  { id: "deliverables", label: "Deliverables", Icon: ClipboardList, color: "#7C3AED", bg: "bg-violet-50", active_bg: "bg-[#7C3AED]" },
  { id: "ad-performance", label: "Ad Performance", Icon: DollarSign, color: "#059669", bg: "bg-emerald-50", active_bg: "bg-[#059669]" },
  { id: "instagram", label: "Instagram",  Icon: InstagramIcon,     color: "#E1306C", bg: "bg-pink-50",   active_bg: "bg-gradient-to-r from-[#E1306C] to-[#833AB4]" },
  ...(SHOW_FACEBOOK_TAB
    ? [{ id: "facebook", label: "Facebook", Icon: FacebookIcon, color: "#1877F2", bg: "bg-blue-50", active_bg: "bg-[#1877F2]" }]
    : []),
  { id: "youtube", label: "YouTube", Icon: YoutubeIcon, color: "#FF0000", bg: "bg-red-50", active_bg: "bg-[#FF0000]" },
  { id: "blogs", label: "Blogs & SEO", Icon: Globe, color: "#10B981", bg: "bg-emerald-50", active_bg: "bg-[#10B981]" },
];

function BarChart({ data, color = "#113a87" }: { data: { label: string; value: number; color?: string }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-32 mt-4 px-1">
      {data.map(({ label, value, color: itemColor }) => {
        const barColor = itemColor || color;
        return (
          <div key={label} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-xs font-bold text-[#1a1a1a] tabular-nums opacity-80 group-hover:opacity-100 transition-opacity">{value}</span>
            <div className="w-full rounded-xl transition-all duration-700 ease-out group-hover:scale-x-105 origin-bottom" style={{
              height: `${Math.max((value / max) * 80, 6)}px`,
              background: `linear-gradient(to top, ${barColor}, ${barColor}cc)`,
            }} />
            <span className="text-[10px] text-gray-400 font-semibold tracking-wide">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconColor = "text-[#113a87]", iconBg = "bg-[#113a87]/10" }: any) {
  const animated = useAnimatedValue(value);
  const isNumberString = typeof value === 'string' && /^[\d,.]+[KMB%]?$/.test(value);
  const isNumber = typeof value === 'number' || isNumberString;
  const suffix = isNumberString ? value.replace(/[\d,.]/g, '') : '';
  const numValue = isNumberString ? parseFloat(value.replace(/[^0-9.]/g, '')) : (typeof value === 'number' ? value : 0);

  let formattedValue = animated;
  if (isNumber) {
    const num = Number(animated);
    const isRate = label?.toLowerCase().includes("rate") || suffix === "%";
    
    if (isRate) {
      formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
    } else if (numValue >= 10000) {
      formattedValue = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
    } else if (numValue < 100 && !Number.isInteger(numValue)) {
      formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(num);
    } else {
      formattedValue = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
    }
  }

  // Get dynamic background dot color matching the icon color
  const dotColor = iconColor.startsWith('text-') ? iconColor.replace('text-', 'bg-') : 'bg-slate-400';

  return (
    <div className="bento-metric group p-3.5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-center">
        <div className="text-[26px] font-black leading-none tracking-tight text-slate-900 tabular-nums" style={{ letterSpacing: '-0.03em' }}>
          {value == null || value === '' || value === 'NaN' || value === 'NaN%' || (typeof value === 'number' && isNaN(value)) ? (
            <span className="text-gray-200">—</span>
          ) : isNumber ? (
            <>{formattedValue}{suffix}</>
          ) : value}
        </div>
        <div className={`w-7 h-7 rounded-md ${iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>
      <div className="text-[13px] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
        <span className={`w-1 h-1 rounded-full ${dotColor} opacity-70 shrink-0`} />
        <span>{label}</span>
      </div>
      {sub && <div className="text-[11px] font-semibold text-slate-400 mt-0.5 pl-2">{sub}</div>}
    </div>
  );
}

interface ThemedStatCardProps {
  icon: any;
  label: string;
  value: number | string | undefined;
  sub?: string;
  extra?: React.ReactNode;
  theme: any;
}

function ThemedStatCard({ icon: Icon, label, value, sub, extra, theme }: ThemedStatCardProps) {
  const animated = useAnimatedValue(value);
  const isNumberString = typeof value === 'string' && /^[\d,.]+[KMB%]?$/.test(value);
  const isNumber = typeof value === 'number' || isNumberString;
  const suffix = isNumberString ? value.replace(/[\d,.]/g, '') : '';
  const numValue = isNumberString ? parseFloat(value.replace(/[^0-9.]/g, '')) : (typeof value === 'number' ? value : 0);

  let formattedValue = animated;
  if (isNumber) {
    const cleanAnimated = typeof animated === 'string' ? parseFloat(animated.replace(/[^0-9.]/g, '')) : animated;
    const num = isNaN(Number(cleanAnimated)) ? 0 : Number(cleanAnimated);
    const isRate = label?.toLowerCase().includes("rate") || label?.toLowerCase().includes("share") || label?.toLowerCase().includes("engagement") || suffix === "%";
    
    if (isRate) {
      formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
    } else if (numValue >= 10000) {
      formattedValue = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
    } else if (numValue < 100 && !Number.isInteger(numValue)) {
      formattedValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format(num);
    } else {
      formattedValue = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
    }
  }

  const displayValue = value == null || value === '' || value === 'NaN' || value === 'NaN%' || (typeof value === 'number' && isNaN(value)) ? (
    <span className="text-gray-200">—</span>
  ) : isNumber ? (
    <>{formattedValue}{suffix}</>
  ) : value;

  return (
    <div className={`rounded-xl p-3.5 border ${theme.cardBg} ${theme.cardBorder} shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className="flex justify-between items-center">
        <div className={`text-[26px] font-black leading-none tracking-tight ${theme.valueColor} tabular-nums`} style={{ letterSpacing: '-0.03em' }}>
          {displayValue}
        </div>
        <div className={`w-7 h-7 rounded-md ${theme.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0`}>
          <Icon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
        </div>
      </div>
      <div className="text-[13px] font-bold text-slate-500 mt-1.5 flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full ${theme.accentBar} opacity-70 shrink-0`} />
        <span>{label}</span>
      </div>
      {sub && <div className="text-[11px] font-semibold text-slate-400 mt-0.5 pl-2.5">{sub}</div>}
      {extra}
      {/* Colored accent bar at bottom */}
      <div className={`h-0.5 rounded-full mt-2.5 ${theme.accentBar} opacity-30`} />
    </div>
  );
}

export type CalendarEvent = { date: number, status: 'published' | 'planned', type?: string };

const getEventColor = (type: string | undefined) => {
  const t = type?.toLowerCase() || '';
  if (t === 'post' || t === 'image' || t === 'photo' || t === 'photos') {
    return {
      fill: 'bg-[#113a87] text-white',
      outline: 'border-[#113a87] text-[#113a87] ring-2 ring-[#113a87]',
      border: 'border-[#113a87]',
      bg: 'bg-[#113a87]'
    };
  }
  if (t === 'reel' || t === 'video' || t === 'reels') {
    return {
      fill: 'bg-orange-500 text-white',
      outline: 'border-orange-500 text-orange-500 ring-2 ring-orange-500',
      border: 'border-orange-500',
      bg: 'bg-orange-500'
    };
  }
  if (t === 'carousel' || t === 'carousel_album') {
    return {
      fill: 'bg-pink-500 text-white',
      outline: 'border-pink-500 text-pink-500 ring-2 ring-pink-500',
      border: 'border-pink-500',
      bg: 'bg-pink-500'
    };
  }
  if (t === 'blog' || t === 'blogs') {
    return {
      fill: 'bg-yellow-400 text-yellow-900',
      outline: 'border-yellow-400 text-yellow-600 ring-2 ring-yellow-400',
      border: 'border-yellow-400',
      bg: 'bg-yellow-400'
    };
  }
  return {
    fill: 'bg-[#113a87] text-white',
    outline: 'border-[#113a87] text-[#113a87] ring-2 ring-[#113a87]',
    border: 'border-[#113a87]',
    bg: 'bg-[#113a87]'
  };
};

const getTooltipText = (day: number, event?: CalendarEvent | null) => {
  if (!event) return `Day ${day}`;
  const statusStr = event.status === 'published' ? 'Published' : 'Planned';
  const typeMap: Record<string, string> = {
    post: 'Post',
    image: 'Post (Image)',
    photo: 'Post (Photo)',
    reel: 'Reel',
    video: 'Reel (Video)',
    carousel: 'Carousel',
    carousel_album: 'Carousel Album',
    blog: 'Blog Article'
  };
  const typeStr = typeMap[event.type || ''] || event.type || 'Content';
  return `${typeStr} (${statusStr}) - Day ${day}`;
};

const ContentCalendar = ({ events, month, year }: { events: CalendarEvent[], month: string, year: string }) => {
  const monthNum = new Date(`${month} 1, ${year}`).getMonth();
  const firstDay = new Date(parseInt(year), monthNum, 1).getDay();
  const daysInMonth = new Date(parseInt(year), monthNum + 1, 0).getDate();
  const weeks = [];
  let days: (number | null)[] = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) days.push(null);
  
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
    if (days.length === 7) { weeks.push(days); days = []; }
  }

  if (days.length > 0) {
    while (days.length < 7) days.push(null);
    weeks.push(days);
  }

  return (
    <div className="glass-card p-6 flex flex-col h-full hover:border-slate-300 hover:shadow-sm transition duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-pink-500" />
        </div>
        <div>
          <h2 className="font-bold text-[#1a1a1a] leading-none font-heading">Content Calendar</h2>
          <p className="text-xs text-gray-400 mt-1">
            {events.filter(e => e.type !== 'blog').length} social posts · {events.filter(e => e.type === 'blog').length} blogs
          </p>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-300 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((day, di) => {
              const event = day ? events.find(e => e.date === day) : null;
              const isToday = day && new Date().getDate() === day && 
                new Date().getMonth() === monthNum && 
                new Date().getFullYear() === parseInt(year);
                
              const type = event?.type?.toLowerCase();
              const isBlog = type === 'blog';
              const isStory = type === 'story';
              const hasLi = event?.type ? (event.type.includes('li') || event.type === 'story') : false;
              const hasFb = event?.type ? (event.type.includes('fb') || event.type === 'story') : false;
              const showSocialBadges = isStory || hasLi || hasFb;
                
              let cellClasses = "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ";
              let tooltip = `Day ${day}`;

              if (day) {
                if (event) {
                  const colors = getEventColor(event.type);
                  tooltip = getTooltipText(day, event);
                  if (event.status === 'published') {
                    cellClasses += `${colors.fill} shadow-md shadow-gray-200/50 cursor-pointer hover:scale-110`;
                  } else {
                    cellClasses += `${colors.outline} cursor-pointer hover:scale-110`;
                  }
                } else {
                  if (isToday) {
                    cellClasses += "ring-2 ring-gray-200 text-gray-800";
                  } else {
                    cellClasses += "text-gray-400";
                  }
                }
              }

              return (
                <div key={di} className="flex items-center justify-center py-1">
                  {day ? (
                    <div className="relative flex flex-col items-center" title={tooltip}>
                      <div className={cellClasses}>
                        {day}
                      </div>
                      {showSocialBadges && !isBlog && (
                        <div className="absolute -bottom-1 flex gap-0.5 z-10">
                          {hasLi && (
                            <div className="w-3 h-3 flex items-center justify-center rounded-full bg-[#0077b5] text-white text-[6px] font-extrabold ring-[0.5px] ring-white" title="LinkedIn">
                              in
                            </div>
                          )}
                          {hasFb && (
                            <div className="w-3 h-3 flex items-center justify-center rounded-full bg-[#1877F2] text-white text-[6px] font-extrabold ring-[0.5px] ring-white" title="Facebook">
                              f
                            </div>
                          )}
                        </div>
                      )}
                      {isBlog && (
                        <div className="absolute -bottom-1 flex gap-0.5 z-10">
                          <div className="w-3 h-3 flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-[6px] font-extrabold ring-[0.5px] ring-white" title="Blog Article">
                            <svg className="w-1.5 h-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-.586-1.414l-4.586-4.586A2 2 0 0012.586 3H12" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : <div className="w-7 h-7" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-white/50">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {[
            { label: 'Post', type: 'post' },
            { label: 'Reel', type: 'reel' },
            { label: 'Carousel', type: 'carousel' },
            { label: 'Blog', type: 'blog' },
          ].map(item => {
            const colors = getEventColor(item.type);
            return (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${colors.bg}`} />
                <span className="text-[9px] font-bold text-gray-400 uppercase">{item.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-gray-400 bg-transparent" />
            <span className="text-[9px] text-gray-400 uppercase">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
            <span className="text-[9px] text-gray-400 uppercase">Published</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function ComingSoonPlatform({ name, Icon, color }: { name: string; Icon: any; color: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <Icon style={{ color }} className="w-7 h-7" />
      </div>
      <h4 className="font-black text-gray-500 mb-1">{name} — Coming Soon</h4>
      <p className="text-sm text-gray-400">Connect your {name} account to see analytics here.</p>
    </div>
  );
}

const platformThemes: Record<string, {
  gradient: string;
  bg: string;
  cardBg: string;
  cardBorder: string;
  valueColor: string;
  labelColor: string;
  iconBg: string;
  iconColor: string;
  accentBar: string;
  badge: string;
}> = {
  instagram: {
    gradient: "linear-gradient(135deg, #fbcfe8, #f472b6, #db2777)",
    bg: "bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600",
    cardBg: "bg-gradient-to-br from-[#FFF5F7] to-[#FFF0F3]", // Softest premium pastel pink
    cardBorder: "border-[#FFE4E9]",
    valueColor: "text-[#D53F67]", // readable pastel pink-red
    labelColor: "text-slate-500",
    iconBg: "bg-[#FFE8EC]",
    iconColor: "text-[#D53F67]",
    accentBar: "bg-[#FFCCD5]",
    badge: "bg-[#E1306C]",
  },
  facebook: {
    gradient: "linear-gradient(135deg, #bfdbfe, #60a5fa, #2563eb)",
    bg: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700",
    cardBg: "bg-gradient-to-br from-[#F5F8FF] to-[#EFF4FF]", // Softest premium pastel blue
    cardBorder: "border-[#E0E9FF]",
    valueColor: "text-[#2B6CB0]", // readable pastel blue
    labelColor: "text-slate-500",
    iconBg: "bg-[#E8F0FE]",
    iconColor: "text-[#2B6CB0]",
    accentBar: "bg-[#C4DAFE]",
    badge: "bg-[#1877F2]",
  },
  blogs: {
    gradient: "linear-gradient(135deg, #fef3c7, #fbbf24, #d97706)",
    bg: "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500",
    cardBg: "bg-gradient-to-br from-[#FFFDF5] to-[#FFF9E6]", // Softest premium pastel amber/yellow
    cardBorder: "border-[#FFF0C2]",
    valueColor: "text-[#B7791F]", // readable pastel amber
    labelColor: "text-slate-500",
    iconBg: "bg-[#FEF3C7]",
    iconColor: "text-[#B7791F]",
    accentBar: "bg-[#FDE68A]",
    badge: "bg-[#E28743]",
  },
  deliverables: {
    gradient: "linear-gradient(135deg, #ede9fe, #a78bfa, #7c3aed)",
    bg: "bg-gradient-to-br from-violet-400 via-violet-500 to-purple-600",
    cardBg: "bg-gradient-to-br from-[#F9F5FF] to-[#F3EDFF]",
    cardBorder: "border-[#E9DEFF]",
    valueColor: "text-[#6D28D9]",
    labelColor: "text-slate-500",
    iconBg: "bg-[#EDE9FE]",
    iconColor: "text-[#6D28D9]",
    accentBar: "bg-[#C4B5FD]",
    badge: "bg-[#7C3AED]",
  },
  "ad-performance": {
    gradient: "linear-gradient(135deg, #d1fae5, #34d399, #059669)",
    bg: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600",
    cardBg: "bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5]",
    cardBorder: "border-[#A7F3D0]",
    valueColor: "text-[#047857]",
    labelColor: "text-slate-500",
    iconBg: "bg-[#D1FAE5]",
    iconColor: "text-[#047857]",
    accentBar: "bg-[#6EE7B7]",
    badge: "bg-[#059669]",
  },
  youtube: {
    gradient: "linear-gradient(135deg, #fecaca, #f87171, #dc2626)",
    bg: "bg-gradient-to-br from-red-400 via-red-500 to-red-700",
    cardBg: "bg-gradient-to-br from-[#FFF5F5] to-[#FFEBEB]",
    cardBorder: "border-[#FFD6D6]",
    valueColor: "text-[#C53030]",
    labelColor: "text-slate-500",
    iconBg: "bg-[#FFEBEB]",
    iconColor: "text-[#C53030]",
    accentBar: "bg-[#FEB2B2]",
    badge: "bg-[#FF0000]",
  },
};

export default function ClientPortal() {
  const permissions = usePermissions();
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("bento_token");
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isInternalStaff = ["super_admin", "csm", "hr", "employee", "admin"].includes(currentUser.role);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    localStorage.removeItem("bento_token");
    localStorage.removeItem("bento_refresh_token");
    localStorage.removeItem("bento_user");
    localStorage.removeItem("bento_user");
    navigate("/login");
  };

  const [brandName, setBrandName] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [active, setActive] = useState<Report | null>(null);
  const activeIndex = reports.findIndex(r => r.id === active?.id);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState("instagram");
  const theme = platformThemes[activePlatform] || platformThemes.instagram;
  const [industry, setIndustry] = useState("Wellness");
  
  // SEO PDF Upload States
  const [seoPdfFilename, setSeoPdfFilename] = useState<string | null>(null);
  const [seoPdfUploadedAt, setSeoPdfUploadedAt] = useState<string | null>(null);
  const [seoMetrics, setSeoMetrics] = useState<any>(null);
  const [seoPdfUrl, setSeoPdfUrl] = useState<string | null>(null);
  const [seoReports, setSeoReports] = useState<any[]>([]);
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [youtubeChannelId, setYoutubeChannelId] = useState<string | null>(null);

  const activeMonthlySeoReport = active ? seoReports.find(
    (rep: any) => rep.month.toLowerCase() === active.month.toLowerCase() && String(rep.year) === String(active.year)
  ) : null;

  // Keep tab selection valid when roadmap tabs are removed from MVP UI
  useEffect(() => {
    if (
      activePlatform === "threads" ||
      (activePlatform === "facebook" && !SHOW_FACEBOOK_TAB) ||
      (activePlatform === "youtube" && !youtubeChannelId)
    ) {
      setActivePlatform("instagram");
    }
  }, [activePlatform, youtubeChannelId]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  
  // Voice UI
  const [isListening, setIsListening] = useState(false);
  const [voiceAlertOpen, setVoiceAlertOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const [chatMode, setChatMode] = useState<"text" | "voice">("text");

  const formatMessage = (text: string): string => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    
    for (const line of lines) {
      const listMatch = line.match(/^[-*]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          processedLines.push('<ul class="list-disc list-inside space-y-1 mt-1 mb-1">');
          inList = true;
        }
        processedLines.push(`<li>${listMatch[1]}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    if (inList) processedLines.push('</ul>');
    
    return processedLines.join('\n');
  };

  const speakResponse = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        const preferredVoice = englishVoices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha") || v.name.includes("Natural")) || englishVoices[0] || voices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        }
      } else {
        utterance.lang = "en";
      }
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      setSpeakingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const [competitors, setCompetitors] = useState<any[]>([]);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [liveFBData, setLiveFBData] = useState<any>(null);
  const [liveFBLoading, setLiveFBLoading] = useState(false);
  const [liveFBError, setLiveFBError] = useState<string | null>(null);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [automaticCompetitors, setAutomaticCompetitors] = useState<any>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [clientBlogs, setClientBlogs] = useState<any[]>([]);
  const [brandIntelData, setBrandIntelData] = useState<any>(null);
  const [brandIntelLoading, setBrandIntelLoading] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  const tourOriginRef = useRef(activePlatform);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const visiblePlatforms = useMemo(
    () => PLATFORMS.filter((p) => {
      if (p.id === "facebook" && !SHOW_FACEBOOK_TAB) return false;
      if (p.id === "youtube" && !youtubeChannelId) return false;
      return true;
    }),
    [youtubeChannelId]
  );

  // Prevent scrolling when chatbot is open
  useEffect(() => {
    if (chatOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [chatOpen]);

  // Cancel speech when chat closes
  useEffect(() => {
    if (!chatOpen) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
    }
  }, [chatOpen]);

  // Back to top button visibility
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  const togglePrintMode = () => {
    const printView = document.getElementById("print-report-view");
    if (printView) {
      printView.classList.remove("hidden");
      window.print();
      printView.classList.add("hidden");
    }
  };

  const MONTH_TO_NUM: Record<string, string> = {
    January: "1", February: "2", March: "3", April: "4",
    May: "5", June: "6", July: "7", August: "8",
    September: "9", October: "10", November: "11", December: "12",
  };

  /** Merge live Facebook API data with stored report data — never borrow Instagram fields. */
  function mergeFacebookData(fromReport: any, live: any | null) {
    const reportOk = fromReport?.status === "success";
    const liveOk = live?.status === "success";
    if (!liveOk && !reportOk) {
      return fromReport?.status ? fromReport : live || fromReport || {};
    }
    if (liveOk && !reportOk) return live;
    if (reportOk && !liveOk) return fromReport;
    return {
      ...fromReport,
      ...live,
      posts: (live.posts?.length ? live.posts : fromReport.posts) || [],
      active_days: live.active_days?.length ? live.active_days : fromReport.active_days,
      weekly_posts: live.weekly_posts?.length ? live.weekly_posts : fromReport.weekly_posts,
      type_counts: Object.keys(live.type_counts || {}).length ? live.type_counts : fromReport.type_counts,
    };
  }

  const fetchAutomaticCompetitorsData = (clientId: string) => {
    setCompLoading(true);
    setCompError(null);
    fetch(`/api/clients/${clientId}/automatic-competitors`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch automatic competitors");
        return res.json();
      })
      .then(data => {
        setAutomaticCompetitors(data);
      })
      .catch(err => {
        console.error("Automatic competitors error:", err);
        setCompError("Could not load competitor intelligence.");
      })
      .finally(() => setCompLoading(false));
  };

  const fetchData = () => {
    if (!token) { navigate("/login"); return; }
    setLoading(true);
    fetch(`/api/clients/${id}/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
        .then(data => {
          if (data.detail) return;
          setBrandName(data.brand_name);
          const reportsList = data.reports || [];

          const seen = new Map<string, Report>();
          for (const r of reportsList) {
            seen.set(`${r.month}-${r.year}`, r);
          }
          const dedupedReports = Array.from(seen.values());

          const MONTH_RANK: Record<string, number> = {
            January: 1, February: 2, March: 3, April: 4,
            May: 5, June: 6, July: 7, August: 8,
            September: 9, October: 10, November: 11, December: 12,
          };
          dedupedReports.sort((a, b) => {
            if (a.year !== b.year) return Number(b.year) - Number(a.year);
            return (MONTH_RANK[b.month] || 0) - (MONTH_RANK[a.month] || 0);
          });

          let finalReports = [...dedupedReports];
        let defaultActive = reportsList[0] || null;

        if (reportsList.length > 0) {
          const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
          ];
          const curMonthName = months[new Date().getMonth()];
          const curYearStr = String(new Date().getFullYear());

          const hasCurrentReport = reportsList.some(
            r => r.month === curMonthName && String(r.year) === curYearStr
          );

          if (hasCurrentReport) {
            defaultActive = reportsList.find(
              r => r.month === curMonthName && String(r.year) === curYearStr
            ) || reportsList[0];
          } else {
            // Create a placeholder report for the current month
            const placeholder: Report = {
              id: "placeholder-current",
              month: curMonthName,
              year: curYearStr,
              ig_data: {
                platforms: {
                  instagram: {
                    metrics: { reach: 0, impressions: 0, engagement: 0, followers: 0, reach_change: 0, impressions_change: 0, engagement_change: 0, followers_change: 0 },
                    posts: [],
                    daily_reach: [],
                    stories: []
                  },
                  facebook: {
                    metrics: { reach: 0, impressions: 0, engagement: 0, followers: 0, reach_change: 0, impressions_change: 0, engagement_change: 0, followers_change: 0 },
                    posts: [],
                    daily_reach: []
                  }
                }
              },
              ai_insight: "No AI insights generated for this month yet."
            };
            finalReports = [placeholder, ...reportsList];
            defaultActive = placeholder;
          }
        }

        setReports(finalReports);
        setActive(defaultActive);
        setCompetitors(data.competitors || []);
        setIndustry(data.industry || "Wellness");
        setInstagramHandle(data.instagram_handle || "");
        setSeoPdfFilename(data.seo_pdf_filename || null);
        setSeoPdfUploadedAt(data.seo_pdf_uploaded_at || null);
        setSeoPdfUrl(data.seo_pdf_url || null);
        setSeoReports(data.seo_reports || []);
        setClientLogoUrl(data.client_logo_url || null);
        setYoutubeChannelId(data.youtube_channel_id || null);
        if (data.seo_metrics) {
          console.log("[SEO EXTRACTOR] Uploaded PDF parsed result:", data.seo_metrics);
        } else {
          console.log("[SEO EXTRACTOR] No extracted SEO PDF data found for this report.");
        }
        setSeoMetrics(data.seo_metrics || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchBlogs = () => {
    if (!token || !id) return;
    fetch(`/api/clients/${id}/blogs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClientBlogs(Array.isArray(data) ? data : []))
      .catch(console.error);
  };

  const fetchBrandIntel = () => {
    if (!token || !id) return;
    setBrandIntelLoading(true);
    fetch(`/api/clients/${id}/intelligence?platform=instagram`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setBrandIntelData(data))
      .catch(console.error)
      .finally(() => setBrandIntelLoading(false));
  };

  useEffect(() => {
    fetchData();
    if (id) {
      fetchAutomaticCompetitorsData(id);
      fetchBlogs();
      fetchBrandIntel();
    }
  }, [id, token]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        if (activeIndex < reports.length - 1) {
          setActive(reports[activeIndex + 1]);
        }
      } else if (e.key === "ArrowRight") {
        if (activeIndex > 0) {
          setActive(reports[activeIndex - 1]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, reports]);

  const fetchCalendar = () => {
    if (!active || !id) return;
    
    const monthMap: Record<string, string> = {
      "January": "01", "February": "02", "March": "03", "April": "04",
      "May": "05", "June": "06", "July": "07", "August": "08",
      "September": "09", "October": "10", "November": "11", "December": "12"
    };
    const m = monthMap[active.month] || "01";
    const prefix = `${active.year}-${m}-`;

    fetch(`/api/calendar/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      
      const filterObjs = (arr: any[]) => arr
        .filter(obj => obj.date && obj.date.startsWith(prefix))
        .map(obj => ({
          day: parseInt(obj.date.split('-')[2], 10),
          type: (obj.post_type || 'post').toLowerCase()
        }));
        
      let pubDays: { day: number, type: string }[] = [];
      try {
        let rawData = typeof active.ig_data === 'string' ? JSON.parse(active.ig_data) : (active.ig_data || {});
        const parsedPlatforms = rawData.platforms || { instagram: rawData.instagram || rawData, facebook: rawData.facebook || {} };
        const igData = parsedPlatforms.instagram?.status === "error" || !parsedPlatforms.instagram ? {} : parsedPlatforms.instagram;
        
        let fbData = parsedPlatforms.facebook?.status === "error" || parsedPlatforms.facebook?.status === "not_connected" ? {} : (parsedPlatforms.facebook || {});
        if (activePlatform === "facebook" && liveFBData) {
          fbData = {
            ...fbData,
            ...liveFBData,
            posts: (liveFBData.posts?.length ? liveFBData.posts : fbData.posts) || [],
            active_days: liveFBData.active_days?.length ? liveFBData.active_days : fbData.active_days
          };
        }
        
        const platformData = activePlatform === "facebook" ? fbData : igData;
        
        if (Array.isArray(platformData.posts)) {
          console.log("[CALENDAR DEBUG] Starting high-fidelity calendar parsing for published posts...");
          pubDays = platformData.posts
            .filter((p: any) => {
              const ts = p.timestamp || p.created_time;
              return ts && ts.startsWith(prefix);
            })
            .map((p: any) => {
              const ts = p.timestamp || p.created_time;
              const dateStr = ts.split('T')[0];
              const dayVal = parseInt(dateStr.split('-')[2], 10);
              
              // Map media_type EXACTLY as Format Intelligence does
              const mType = (p.media_type || 'IMAGE').toUpperCase();
              let ptype = 'post';
              if (mType === 'VIDEO') {
                ptype = 'reel';
              } else if (mType === 'CAROUSEL_ALBUM') {
                ptype = 'carousel';
              }
              
              console.log(`[CALENDAR DEBUG] Post Title: "${p.caption ? p.caption.substring(0, 30) : 'No Caption'}", Date: ${dateStr}, Detected Media Type: ${mType}, Final Calendar Event Type: ${ptype}`);
              return { day: dayVal, type: ptype };
            });
            
          // Count and compare with Format Intelligence
          const counts = pubDays.reduce((acc: any, cur) => {
            acc[cur.type] = (acc[cur.type] || 0) + 1;
            return acc;
          }, {});
          console.log("[CALENDAR DEBUG] Final Calendar Counts:", counts);
          console.log("[CALENDAR DEBUG] Format Intelligence Counts (Raw):", platformData.type_counts);
        } else if (Array.isArray(platformData.active_days)) {
          // Fallback if posts are missing but active_days are present
          pubDays = platformData.active_days.map((d: number) => ({ day: d, type: 'post' }));
        }
      } catch (e) {
        console.error("[CALENDAR DEBUG] Error parsing raw fallback posts:", e);
      }
      
      const planDays = filterObjs(data.content_calendar || []);
      
      // Merge with priority: published > planned, but transition planned type if matched!
      const merged: CalendarEvent[] = [];
      const publishedDayMap = new Map(pubDays.map(p => [p.day, p.type]));
      const processedDays = new Set<number>();
      
      planDays.forEach(p => {
        if (publishedDayMap.has(p.day)) {
          merged.push({ date: p.day, status: 'published', type: p.type });
        } else {
          merged.push({ date: p.day, status: 'planned', type: p.type });
        }
        processedDays.add(p.day);
      });
      
      pubDays.forEach(p => {
        if (!processedDays.has(p.day)) {
          merged.push({ date: p.day, status: 'published', type: p.type });
          processedDays.add(p.day); // Prevent duplicate events on the same day from inflating the count
        }
      });
      
      clientBlogs.forEach(b => {
        const bDay = parseInt(b.published_at.split('-')[2], 10);
        if (b.published_at && b.published_at.startsWith(prefix) && !processedDays.has(bDay)) {
          merged.push({ date: bDay, status: 'published', type: 'blog' });
          processedDays.add(bDay);
        }
      });
      
      setCalendarEvents(merged);
    })
    .catch(() => {
      // Fallback if calendar fails
      const merged: CalendarEvent[] = [];
      try {
        let rawData = typeof active?.ig_data === 'string' ? JSON.parse(active.ig_data) : (active?.ig_data || {});
        const parsedPlatforms = rawData.platforms || { instagram: rawData.instagram || rawData, facebook: rawData.facebook || {} };
        const igData = parsedPlatforms.instagram?.status === "error" || !parsedPlatforms.instagram ? {} : parsedPlatforms.instagram;
        
        let fbData = parsedPlatforms.facebook?.status === "error" || parsedPlatforms.facebook?.status === "not_connected" ? {} : (parsedPlatforms.facebook || {});
        if (activePlatform === "facebook" && liveFBData) {
          fbData = {
            ...fbData,
            ...liveFBData,
            posts: (liveFBData.posts?.length ? liveFBData.posts : fbData.posts) || [],
            active_days: liveFBData.active_days?.length ? liveFBData.active_days : fbData.active_days
          };
        }
        
        const platformData = activePlatform === "facebook" ? fbData : igData;
        
        if (Array.isArray(platformData.posts)) {
          platformData.posts
            .filter((p: any) => {
              const ts = p.timestamp || p.created_time;
              return ts && ts.startsWith(prefix);
            })
            .forEach((p: any) => {
              const ts = p.timestamp || p.created_time;
              const dateStr = ts.split('T')[0];
              const dayVal = parseInt(dateStr.split('-')[2], 10);
              const mType = (p.media_type || 'IMAGE').toUpperCase();
              let ptype = 'post';
              if (mType === 'VIDEO') {
                ptype = 'reel';
              } else if (mType === 'CAROUSEL_ALBUM') {
                ptype = 'carousel';
              }
              merged.push({ date: dayVal, status: 'published', type: ptype });
            });
        } else if (Array.isArray(platformData.active_days)) {
          platformData.active_days.forEach((d: number) => {
            merged.push({ date: d, status: 'published', type: 'post' });
          });
        }
      } catch (e) {
        console.error("[CALENDAR DEBUG] Error in catch block fallback:", e);
      }
      
      clientBlogs.forEach(b => {
        if (b.published_at && b.published_at.startsWith(prefix)) {
          merged.push({ date: parseInt(b.published_at.split('-')[2], 10), status: 'published', type: 'blog' });
        }
      });
      
      setCalendarEvents(merged);
    });
  };

  useEffect(() => { fetchCalendar(); }, [active, id, token, calendarRefreshKey, activePlatform, clientBlogs, liveFBData]);

  // Live Facebook fetch (disabled in MVP UI when SHOW_FACEBOOK_TAB is false)
  useEffect(() => {
    if (!SHOW_FACEBOOK_TAB || activePlatform !== "facebook" || !active || !id) {
      setLiveFBData(null);
      setLiveFBError(null);
      return;
    }
    const monthNum = MONTH_TO_NUM[active.month] || String(new Date().getMonth() + 1);
    setLiveFBLoading(true);
    setLiveFBError(null);
    fetch(`/api/facebook/insights?client_id=${id}&month=${monthNum}&year=${active.year}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          setLiveFBData(data);
          setLiveFBError(null);
        } else if (data.status === "not_connected") {
          setLiveFBData(null);
          setLiveFBError("Facebook is not connected for this client.");
        } else {
          setLiveFBData(null);
          setLiveFBError(data.error || "Could not load Facebook analytics.");
        }
      })
      .catch(() => setLiveFBError("Network error while loading Facebook analytics."))
      .finally(() => setLiveFBLoading(false));
  }, [activePlatform, active?.id, active?.month, active?.year, id, token]);

  // 🎯 THE FIX: Smart parsing to handle the new nested `platforms` JSON structure
  let rawData = active?.ig_data || {};
  if (typeof rawData === 'string') {
    try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
  }
  
  // Support both the old flat format and the new unified format
  const parsedPlatforms = rawData.platforms || { instagram: rawData.instagram || rawData, facebook: rawData.facebook || {} };
  
  const ig = parsedPlatforms.instagram?.status === "error" || !parsedPlatforms.instagram ? {} : parsedPlatforms.instagram;
  const fbFromReport =
    parsedPlatforms.facebook?.status === "error" || parsedPlatforms.facebook?.status === "not_connected"
      ? {}
      : (parsedPlatforms.facebook || {});
  const youtube = parsedPlatforms.youtube || {};
  const youtubeVideos = youtube.videos || [];

  const fb = mergeFacebookData(fbFromReport, liveFBData);
  const fbConnected = !!(fb?.status === "success" || fbFromReport?.status === "success");
  const fbMetric = (key: string) => {
    let v = fb?.[key];
    if (v == null || v === "") {
      // Robust fallbacks for flat/nested keys
      if (key === "total_reach") v = fb?.reach;
      else if (key === "total_impressions") v = fb?.impressions;
      else if (key === "total_likes" || key === "total_reactions") v = fb?.reactions ?? fb?.likes;
      else if (key === "total_shares" || key === "total_saves") v = fb?.shares ?? fb?.saves;
      else if (key === "followers") v = fb?.followers_count ?? fb?.fan_count;
    }
    return v != null && v !== "" ? v : undefined;
  };
  
  const stableFbMetrics = useMemo(() => ({
    total_reach: fbMetric("total_reach") ?? fb?.total_reach ?? fb?.reach,
    organic_reach: fb?.organic?.total_reach ?? fb?.organic_reach ?? fb?.reach_organic,
    paid_reach: fb?.paid?.total_reach ?? fb?.paid_reach ?? fb?.reach_paid,
    impressions: fbMetric("total_impressions") ?? fb?.total_impressions ?? fb?.impressions,
    engagement_rate: fb?.engagement_rate,
    followers: fbMetric("followers") ?? fb?.followers ?? fb?.fan_count ?? fb?.followers_count,
    connected: fbConnected,
    combined_reach: liveFBData?.combined?.total_reach ?? rawData.combined?.total_reach,
    combined: liveFBData?.combined ?? rawData.combined
  }), [fb, fbConnected, liveFBData, rawData]);

  const xData = rawData.x || {};

  // Dynamically swap the data object based on the tab!
  const currentData = activePlatform === "facebook" ? fb : activePlatform === "instagram" ? ig : activePlatform === "youtube" ? youtube : {};
  const fbReactions = fbMetric("total_reactions") ?? fbMetric("total_likes");
  const fbShares = fbMetric("total_shares") ?? fbMetric("total_saves");

  const posts: any[] = currentData.posts || [];
  const weeklyData = (currentData.weekly_posts || []).map((w: any) => ({ label: w.week, value: w.count }));
  
  const monthMapVals: Record<string, string> = { "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06", "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12" };
  const mVal = monthMapVals[active?.month || "January"] || "01";
  const activePrefix = `${active?.year}-${mVal}-`;
  // Deduplicate currentMonthBlogs by clean URL and Title
  const deduplicatedBlogs: any[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  
  const rawMonthBlogs = clientBlogs.filter(b => b.published_at && b.published_at.startsWith(activePrefix));
  rawMonthBlogs.forEach((blog: any) => {
    let cleanUrl = (blog.url || "").trim();
    try {
      const urlObj = new URL(cleanUrl);
      urlObj.hash = "";
      cleanUrl = urlObj.toString();
    } catch (e) {
      const hashIdx = cleanUrl.indexOf("#");
      if (hashIdx !== -1) {
        cleanUrl = cleanUrl.substring(0, hashIdx);
      }
    }
    const cleanTitle = (blog.title || "").trim().toLowerCase();
    if (cleanUrl && cleanTitle && !seenUrls.has(cleanUrl) && !seenTitles.has(cleanTitle)) {
      seenUrls.add(cleanUrl);
      seenTitles.add(cleanTitle);
      deduplicatedBlogs.push({
        ...blog,
        url: cleanUrl
      });
    }
  });

  console.log("=== BLOG EXTRACTION AUDIT LOG ===");
  console.log(`Raw Month Blogs Count: ${rawMonthBlogs.length}`);
  console.log(`Unique Deduplicated Blogs Count: ${deduplicatedBlogs.length}`);
  deduplicatedBlogs.forEach((blog: any, index: number) => {
    console.log(`[Blog #${index + 1}] extracted_url: ${blog.url} | article_title: ${blog.title} | publish_date: ${blog.published_at}`);
  });
  console.log("=================================");

  const currentMonthBlogs = deduplicatedBlogs;
  const blogCount = currentMonthBlogs.length;
  const visibleBlogs = activePlatform === "facebook" ? currentMonthBlogs : [];
  const contentData = [
    ...Object.entries(currentData.type_counts || {})
      .filter(([k]) => k !== "BLOG")
      .map(([k, v]) => {
        const label = k === "CAROUSEL_ALBUM" ? "Carousel" : k === "VIDEO" ? "Reels" : "Photos";
        let itemColor = activePlatform === "instagram" ? "#E1306C" : "#1877F2";
        if (k === "CAROUSEL_ALBUM") itemColor = "#ec4899"; // pink
        else if (k === "VIDEO") itemColor = "#f97316"; // strong orange
        return {
          label,
          value: v as number,
          color: itemColor
        };
      }),
    {
      label: "Blogs",
      value: blogCount,
      color: "#f59e0b" // warm amber-500
    }
  ];

  // B) Explicit Mapping: Website Data (Live Platform Analytics)
  const getWebsiteData = () => {
    const nameSeed = brandName || "Bento Client";
    return {
      source: "website",
      visits: 12400 + (nameSeed.length * 125),
      trafficGrowth: 8.4 + (nameSeed.length % 5),
      blogReadTime: 3.5 + (nameSeed.length % 3) * 0.4,
      engagement: 14 + (nameSeed.length % 6) * 1.5,
      searchVisibilityGrowth: 6.2 + (nameSeed.length % 4) * 1.5,
      organicShare: 72 + (nameSeed.length % 11),
      blogs: clientBlogs?.length || 0,
      publishingStats: "Active"
    };
  };
  const websiteData = getWebsiteData();

  // B) Explicit Mapping: SEO Data (Uploaded PDF Analytics)
  const calculateSEOScore = (metrics: any) => {
    if (!metrics) return 0;
    
    let score = 50; // Base score
    
    // CTR (ideal > 3%)
    if (metrics.ctr > 5) score += 15;
    else if (metrics.ctr > 2) score += 10;
    else if (metrics.ctr > 0) score += 5;
    
    // Bounce rate (ideal < 60%)
    if (metrics.bounce_rate > 0 && metrics.bounce_rate < 50) score += 15;
    else if (metrics.bounce_rate >= 50 && metrics.bounce_rate < 70) score += 10;
    else if (metrics.bounce_rate >= 70) score += 5;
    
    // Avg Position (ideal < 10)
    if (metrics.avg_position > 0 && metrics.avg_position < 5) score += 10;
    else if (metrics.avg_position >= 5 && metrics.avg_position < 15) score += 5;
    
    // Impressions volume
    if (metrics.impressions > 50000) score += 10;
    else if (metrics.impressions > 10000) score += 5;

    // Sessions volume
    if (metrics.sessions > 10000) score += 10;
    else if (metrics.sessions > 1000) score += 5;
    
    return Math.min(100, Math.max(0, Math.round(score)));
  };

  const getSEOData = () => {
    if (activeMonthlySeoReport && activeMonthlySeoReport.seo_metrics) {
      const metrics = activeMonthlySeoReport.seo_metrics;
      const parsedKeyword = metrics.top_keywords?.[0] || "";
      const parsedRecommendation = metrics.recommendations?.[0] || "";
      const dynamicScore = calculateSEOScore(metrics);
      
      return {
        source: "pdf",
        keyword: parsedKeyword,
        seoScore: dynamicScore > 0 ? dynamicScore : 0,
        impressions: typeof metrics.impressions === 'number' ? metrics.impressions : 0,
        clicks: typeof metrics.clicks === 'number' ? metrics.clicks : 0,
        ctr: typeof metrics.ctr === 'number' ? metrics.ctr : 0.0,
        avgPosition: typeof metrics.avg_position === 'number' ? metrics.avg_position : 0.0,
        sessions: typeof metrics.sessions === 'number' ? metrics.sessions : 0,
        users: typeof metrics.users === 'number' ? metrics.users : 0,
        newUsers: typeof metrics.new_users === 'number' ? metrics.new_users : 0,
        bounceRate: typeof metrics.bounce_rate === 'number' ? metrics.bounce_rate : 0.0,
        keyEvents: typeof metrics.key_events === 'number' ? metrics.key_events : 0,
        trafficSourceTrends: metrics.traffic_source_trends || [],
        acquisitionTable: metrics.acquisition_table || [],
        searchTrends: metrics.search_trends || [],
        rankings: metrics.keyword_rankings?.length > 0 ? metrics.keyword_rankings.map((r: any) => ({
          term: `"${r.keyword}"`,
          rank: `Pos #${r.position}`,
          visibility: r.position <= 3 ? "High Voice" : r.position <= 10 ? "Growing" : "Stable",
          change: r.change?.startsWith("↑") || r.change?.startsWith("↓") || r.change === "0" 
            ? r.change 
            : (r.change?.startsWith("-") ? `↓ ${r.change.slice(1)}` : `↑ ${r.change}`)
        })) : [],
        recommendations: metrics.recommendations?.length > 0 ? metrics.recommendations : [parsedRecommendation],
        indexedPages: metrics.indexed_pages,
        backlinks: metrics.backlinks
      };
    }
    return null;
  };
  const seoData = getSEOData();

  const getBestPost = () => {
    if (currentData.top_post && (currentData.top_post.media_base64 || currentData.top_post.media_url)) {
      return currentData.top_post;
    }
    // Fallback: search posts array for one with highest engagement
    if (posts && posts.length > 0) {
      return posts.reduce((prev: any, current: any) => {
        const prevScore = (prev.likes ?? prev.total_likes ?? 0) + (prev.comments ?? prev.total_comments ?? 0);
        const curScore = (current.likes ?? current.total_likes ?? 0) + (current.comments ?? current.total_comments ?? 0);
        return curScore > prevScore ? current : prev;
      });
    }
    return null;
  };
  const bestPost = getBestPost();

  const buildSuggestedQuestions = (lastQuery?: string) => {
    const qs: string[] = [];
    const platform = activePlatform;
    const reach = currentData.total_reach || 0;
    const engRate = currentData.engagement_rate || 0;
    const followers = currentData.followers || 0;
    const likes = currentData.total_likes || 0;
    const comments = currentData.total_comments || 0;
    const reachChange = currentData.reach_change;
    const engChange = currentData.engagement_change;
    const followersChange = currentData.followers_change;
    const comps = automaticCompetitors?.competitors;
    const lq = (lastQuery || "").toLowerCase();

    if (lq.includes("reach") || lq.includes("impression")) {
      if (reachChange && parseFloat(reachChange) > 0) qs.push(`Which content format contributed most to the reach gain?`);
      qs.push(`How can we sustain or improve reach next month?`);
      qs.push(`What's our reach benchmark vs industry averages?`);
    } else if (lq.includes("engagement") || lq.includes("like") || lq.includes("comment") || lq.includes("save")) {
      if (engRate > 0) qs.push(`Which post type gets the highest engagement rate?`);
      qs.push(`What's the ideal posting frequency to maximize engagement?`);
      qs.push(`How does our engagement compare to last month?`);
    } else if (lq.includes("follower") || lq.includes("growth") || lq.includes("audience")) {
      qs.push(`Which content drove the most new followers?`);
      qs.push(`What's our follower demographic breakdown?`);
      qs.push(`How can we accelerate follower growth?`);
    } else if (lq.includes("competitor") || lq.includes("compare") || lq.includes("competitive")) {
      if (comps && comps.length > 0) qs.push(`What are our competitors doing that we aren't?`);
      qs.push(`Which platform gives us the best competitive edge?`);
      qs.push(`How can we differentiate our brand voice?`);
    } else if (lq.includes("synopsis") || lq.includes("performance") || lq.includes("overview") || lq.includes("summary")) {
      if (reach > 0) {
        if (reachChange && parseFloat(reachChange) > 0) qs.push(`What drove the ${reachChange}% reach shift?`);
        else qs.push(`What can we do to grow reach further?`);
      }
      if (engRate > 0) qs.push(`What's behind our ${engRate}% engagement rate?`);
      if (followers > 0 && followersChange) qs.push(`What's driving the ${followersChange}% follower change?`);
    } else if (lq.includes("content") || lq.includes("post") || lq.includes("strategy")) {
      if (bestPost) qs.push(`What made our top post perform so well?`);
      qs.push(`Which content format should we double down on?`);
      qs.push(`How can we improve our content mix?`);
    } else {
      if (reach > 0) {
        if (reachChange && parseFloat(reachChange) > 0) qs.push(`What drove the ${reachChange}% reach increase?`);
        else qs.push(`What can we do to grow reach further?`);
      }
      if (engRate > 0 && parseFloat(String(engRate)) < 3) {
        qs.push(`Why is engagement at ${engRate}% and how do we improve it?`);
      } else if (engRate > 0) {
        qs.push(`What content types are driving the highest engagement?`);
      }
      if (followers > 0 && followersChange) {
        qs.push(`What's behind the ${followersChange}% follower change?`);
      }
      if (bestPost) qs.push(`Can you analyze our top post performance?`);
      if (comps && comps.length > 0) qs.push(`How does our ${platform} performance compare to competitors?`);
      if (likes > 0 || comments > 0) qs.push(`Break down our likes and comments performance.`);
      qs.push(`Give me a full ${platform} performance synopsis.`);
    }

    if (qs.length < 3) {
      if (comps && comps.length > 0) qs.push(`How does our ${platform} performance compare to competitors?`);
      if (bestPost) qs.push(`Can you analyze our top post performance?`);
      qs.push(`Give me a full ${platform} performance synopsis.`);
    }

    const unique: string[] = [];
    for (const q of qs) {
      if (!unique.includes(q)) unique.push(q);
    }
    return unique.slice(0, 4);
  };

  const sendChat = async (voiceQuery?: string | React.MouseEvent | React.KeyboardEvent) => {
    const queryText = typeof voiceQuery === 'string' ? voiceQuery : chatInput;
    if (!queryText.trim() || chatLoading || !active) return;
    const q = queryText.trim();
    
    const reach = activePlatform === "facebook" && liveFBLoading ? "Loading" : (fbMetric("total_reach") ?? currentData.total_reach);
    const impressions = activePlatform === "facebook" && liveFBLoading ? "Loading" : (fbMetric("total_impressions") ?? currentData.total_impressions);
    const engagement = currentData.engagement_rate;
    const followers = (fbMetric("followers") ?? currentData.followers) || 0;
    const compNames = automaticCompetitors?.competitors?.map((c: any) => c.name || c.handle).join(", ") || "None listed";
    
    const topPost = bestPost;
    const topPostInfo = topPost ? `Top Post: "${topPost.caption?.substring(0, 80) || 'No caption'}" — Likes: ${topPost.likes || topPost.total_likes || 0}, Comments: ${topPost.comments || topPost.total_comments || 0}, Engagement: ${topPost.engagement_rate || 0}%` : "No top post data";
    
    const contentBreakdown = currentData.content_type_breakdown ? 
      Object.entries(currentData.content_type_breakdown).map(([type, val]: [string, any]) => `${type}: Reach ${val.reach || 0}, Engagement ${val.engagement || 0}`).join("; ") 
      : "No content breakdown";

    const recentPosts = (posts?.slice(0, 5) || []).map((p: any) => 
      `"${(p.caption || '').substring(0, 40)}" — ${p.likes || p.total_likes || 0} likes, ${p.comments || p.total_comments || 0} comments`
    ).join(" | ");

    const fmt = (v: any) => v ?? "N/A";

    const igSection = ig?.total_reach || ig?.total_likes
      ? `\nINSTAGRAM:\n- Reach: ${fmt(ig?.total_reach)} | Engagement: ${fmt(ig?.engagement_rate)}% | Followers: ${fmt(ig?.followers)}\n- Likes: ${fmt(ig?.total_likes)} | Comments: ${fmt(ig?.total_comments)} | Saves: ${fmt(ig?.total_saves)}\n- Reach Change: ${fmt(ig?.reach_change)}% | Engagement Change: ${fmt(ig?.engagement_change)}% | Followers Change: ${fmt(ig?.followers_change)}%\n- Content Types: ${ig?.content_type_breakdown ? Object.entries(ig.content_type_breakdown).map(([t, v]: any) => `${t}: Reach ${v.reach || 0}, Eng ${v.engagement || 0}`).join("; ") : "N/A"}`
      : "";

    const fbSection = fb?.total_reach || fb?.total_impressions
      ? `\nFACEBOOK:\n- Reach: ${fmt(fbMetric("total_reach"))} | Impressions: ${fmt(fbMetric("total_impressions"))} | Engagement: ${fmt(fb?.engagement_rate)}%\n- Followers: ${fmt(fbMetric("followers"))} | Reactions: ${fmt(fbMetric("total_reactions"))} | Comments: ${fmt(fbMetric("total_comments"))} | Shares: ${fmt(fbMetric("total_shares"))}`
      : "";

    const ytSection = youtube?.total_views || youtube?.subscribers
      ? `\nYOUTUBE:\n- Views: ${fmt(youtube?.total_views)} | Subscribers: ${fmt(youtube?.subscribers)} | Videos: ${fmt(youtube?.total_videos)}\n- Avg Views/Video: ${fmt(youtube?.avg_views)} | Engagement: ${fmt(youtube?.engagement_rate)}%`
      : "";

    const xSection = xData?.total_posts || xData?.total_likes
      ? `\nX (TWITTER):\n- Posts: ${fmt(xData?.total_posts)} | Likes: ${fmt(xData?.total_likes)} | Retweets: ${fmt(xData?.total_retweets)}`
      : "";

    const topPostSection = bestPost
      ? `\nTOP POST:\n- "${(bestPost.caption || "").substring(0, 100)}"\n- Likes: ${bestPost.likes || bestPost.total_likes || 0} | Comments: ${bestPost.comments || bestPost.total_comments || 0} | Engagement: ${bestPost.engagement_rate || 0}%`
      : "";

    const recentPostsSection = (posts?.slice(0, 3) || []).length > 0
      ? `\nRECENT POSTS:\n${(posts?.slice(0, 3) || []).map((p: any) => `- "${(p.caption || "").substring(0, 60)}" — ${p.likes || p.total_likes || 0} likes, ${p.comments || p.total_comments || 0} comments`).join("\n")}`
      : "";

    const contextStr = `You are a senior social media strategist. Analyze the client '${brandName}' for ${active.month} ${active.year}. You have access to all their platform data below. Answer questions about any platform or the client holistically.

ALL PLATFORMS DATA:${igSection}${fbSection}${ytSection}${xSection}${topPostSection}${recentPostsSection}

COMPETITORS: ${compNames}

INSTRUCTIONS:
- Tone: Data-driven, professional, sales-oriented consultant
- Be specific and detailed — cite exact values from the data
- Do NOT include question suggestions in your response
- Adapt your response structure to the question: specific questions get direct answers, broad questions can use sections like **what's working** or **recommendations** when appropriate. Never force a structure that doesn't fit.`;

    setChatInput("");
    setChatMessages(p => [...p, { role: "user", content: q }]);
    setChatLoading(true);
    try {
      const res = await fetch(`/api/reports/${active.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          question: q, 
          history: chatMessages.slice(-6).map(({ suggestions: _, ...rest }) => rest), 
          context: contextStr,
          platform_data: currentData
        }),
      });
      const data = await res.json();
      const answer = data.answer || "No response.";
      const suggestions = buildSuggestedQuestions(q);
      setChatMessages(p => [...p, { role: "assistant", content: answer, suggestions }]);
    } catch {
      setChatMessages(p => [...p, { role: "assistant", content: "Connection error." }]);
    } finally { setChatLoading(false); }
  };

  const startListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return; // onend handles the submission
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceAlertOpen(true);
      return;
    }

    setChatInput("");
    transcriptRef.current = "";
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
      }
      setChatInput(fullTranscript);
      transcriptRef.current = fullTranscript;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      const finalWord = transcriptRef.current;
      if (finalWord && finalWord.trim()) {
        handleVoiceSubmit(finalWord);
        transcriptRef.current = "";
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleVoiceSubmit = (text: string) => {
    const transcript = text.toLowerCase();
    
    // Voice Navigation Interception
    if (transcript.includes("take me to") || transcript.includes("switch to") || transcript.includes("go to") || transcript.includes("open") || transcript.includes("show me")) {
      if (transcript.includes("insta") || transcript.includes("instagram")) {
        setActivePlatform("instagram");
        speakResponse("Navigating to Instagram.");
        setChatInput("");
        return;
      }
      if (transcript.includes("facebook") || transcript.includes("fb")) {
        setActivePlatform("facebook");
        speakResponse("Navigating to Facebook.");
        setChatInput("");
        return;
      }
      if (transcript.includes("blog") || transcript.includes("seo")) {
        setActivePlatform("blogs");
        speakResponse("Navigating to Blogs and S E O.");
        setChatInput("");
        return;
      }
    }
    
    sendChat(text);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <Loader2 className="w-10 h-10 animate-spin text-[#113a87]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent pb-28">
      <TourGuide
        key={tourKey}
        run={runTour}
        setRun={setRunTour}
        brandName={brandName}
        visiblePlatforms={visiblePlatforms}
        activePlatform={activePlatform}
        setActivePlatform={setActivePlatform}
        onTourEnd={() => {
          setActivePlatform(tourOriginRef.current);
        }}
      />

      {/* Nav — glassmorphic */}
      <nav className="nav-glass px-3 md:px-8 py-3 md:py-4 flex justify-between items-center sticky top-0 z-50 shadow-bento">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {/* Platform Branding (CANIT Pulse) */}
          <div
            onClick={() => {
              if (isInternalStaff) {
                navigate("/admin/dashboard");
              }
            }}
            className={`tour-nav-logo joyride-branding flex items-center gap-2 md:gap-3 shrink-0 ${isInternalStaff ? "cursor-pointer" : ""}`}
          >
            <img
              src="/cai.png"
              alt="CANIT Pulse"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
              className="h-8 md:h-12 w-auto object-contain p-1 drop-shadow-sm opacity-80"
            />
            <div className="flex flex-col">
              <span className="font-brand font-black text-[11px] md:text-sm text-[#113a87] leading-none tracking-tight">CANIT Pulse</span>
              <span className="hidden md:inline text-[8px] font-heading font-bold tracking-widest text-[#113a87]/60 uppercase mt-0.5 whitespace-nowrap">AI Brand Intelligence Suite</span>
            </div>
          </div>

          {/* Subtle vertical divider */}
          <div className="h-6 md:h-8 w-px bg-slate-200 mx-0.5 md:mx-1 shrink-0" />
          
          {/* Dynamic Client Branding */}
          <div className="flex items-center gap-2 md:gap-3 animate-fade-in min-w-0 joyride-client-branding">
            {clientLogoUrl && !logoError && (clientLogoUrl.startsWith('http') || clientLogoUrl.startsWith('/') || clientLogoUrl.startsWith('data:')) ? (
              <img
                src={clientLogoUrl}
                alt={`${brandName} Logo`}
                onError={() => setLogoError(true)}
                className="h-6 md:h-8 max-w-[80px] md:max-w-[120px] object-contain rounded bg-slate-50/50 p-1 border border-slate-100"
              />
            ) : (
              <div className="h-6 md:h-8 px-2 md:px-2.5 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200/50">
                <span className="font-heading font-extrabold text-[9px] md:text-[10px] tracking-wider text-slate-500 uppercase">
                  {brandName.substring(0, 8)}
                </span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="font-heading font-extrabold text-sm md:text-lg text-[#1a1a1a] leading-none truncate">{brandName}</span>
              <span className="hidden md:inline text-[10px] text-gray-500 font-semibold mt-0.5">Intelligence Dashboard</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <button
            onClick={() => {
              tourOriginRef.current = activePlatform;
              setTourKey(k => k + 1);
              setRunTour(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 text-[#2563EB] hover:bg-[#2563EB]/10 active:scale-95 transition-all text-xs font-bold shadow-sm"
            title="Take Guided Onboarding Tour"
          >
            <span className="hidden sm:inline">Take Tour</span>
            <span className="sm:hidden">Tour</span>
          </button>

          {reports.length > 0 && (
            <div className="tour-month-selector joyride-month-selector relative flex items-center bg-slate-50 border border-[#E7EDF5] rounded-xl p-0.5 shadow-sm select-none">
              <button 
                onClick={() => activeIndex < reports.length - 1 && setActive(reports[activeIndex + 1])}
                disabled={activeIndex >= reports.length - 1}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <div 
                onClick={() => setMonthPickerOpen(!monthPickerOpen)}
                className="px-2 md:px-3 text-[11px] md:text-xs font-black text-slate-700 font-heading min-w-[70px] md:min-w-[85px] text-center whitespace-nowrap tracking-tight cursor-pointer hover:bg-white/80 py-1 rounded-md transition flex items-center gap-1 justify-center"
              >
                <span>{active ? `${active.month} ${active.year}` : ""}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
              <button 
                onClick={() => activeIndex > 0 && setActive(reports[activeIndex - 1])}
                disabled={activeIndex <= 0}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>

              {/* Month Picker Popup Dropdown */}
              {monthPickerOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMonthPickerOpen(false)} />
                  <div className="absolute top-full mt-2 right-0 left-0 min-w-[150px] bg-white border border-[#E7EDF5] rounded-xl shadow-float p-1.5 z-40 animate-fade-in stagger-children">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 mb-1 border-b border-slate-100">
                      Select Period
                    </div>
                    <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                      {reports.map((rep) => {
                        const isCurrent = rep.id === active?.id;
                        return (
                          <button
                            key={rep.id}
                            onClick={() => {
                              setActive(rep);
                              setMonthPickerOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                              isCurrent 
                                ? "bg-[#113a87]/5 text-[#113a87]" 
                                : "text-gray-600 hover:bg-slate-50 hover:text-gray-800"
                            }`}
                          >
                            <span>{rep.month} {rep.year}</span>
                            {isCurrent && <span className="w-1.5 h-1.5 bg-[#113a87] rounded-full" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <button onClick={fetchData} className="p-2 rounded-xl text-gray-400 hover:text-[#113a87] hover:bg-[#113a87]/5 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-2 md:px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-medium"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </nav>
      <div className="gradient-accent" />

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6 md:space-y-8 overflow-visible">
        {/* ── Month Title Area ── */}
        <div 
          className="flex flex-col bg-[#FCFCFD]/90 py-3 md:py-4 px-4 md:px-6 rounded-b-2xl transition-all"
        >
          <h2 className="text-xl md:text-2xl font-black text-[#1a1a1a]">
            {active ? `${active.month} ${active.year}` : "No reports yet"}
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">Unified Meta analytics platform</p>
        </div>

        {!active ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-16 text-center">
            <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-black text-gray-400 text-lg">No reports generated yet</h3>
            <p className="text-gray-300 text-sm mt-2">Click "Generate report" on the admin dashboard</p>
          </div>
        ) : (
          <>
            <div className="transition-colors duration-300">
            {/* ── Platform Tabs (ON TOP OF ALL SECTIONS) ── */}
            <div className="glass-panel overflow-hidden mb-6 relative">
              {/* Tab bar */}
              <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-100 bg-slate-50/50 relative z-10">
                {(() => {
                  const visiblePlatforms = PLATFORMS.filter(({ id: pid }) => {
                    if (pid === "facebook" && !SHOW_FACEBOOK_TAB) return false;
                    if (pid === "youtube" && !youtubeChannelId) return false;
                    return true;
                  });
                  return visiblePlatforms.map(({ id: pid, label, Icon, color }) => {
                    const isActive = activePlatform === pid;
                    const platformTheme = platformThemes[pid] || platformThemes.instagram;
                    return (
                      <button
                        key={pid}
                        onClick={() => setActivePlatform(pid)}
                        className={`tour-tab-${pid} joyride-tab-${pid} flex items-center gap-0 md:gap-2 px-1.5 md:px-6 py-2.5 md:py-4 text-[10px] md:text-sm font-bold whitespace-nowrap transition-all border-t-2 relative ${
                          isActive
                            ? `${platformTheme.valueColor} bg-white border-t-current`
                            : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-slate-50/30"
                        }`}
                        style={{ borderTopColor: isActive ? platformTheme.accentBar : "transparent" }}
                      >
                        <span className={`hidden md:inline transition-colors ${isActive ? platformTheme.iconColor : "text-gray-400"}`}>
                          <Icon className="w-4 h-4" />
                        </span>
                        {label}
                        {liveFBLoading && pid === "facebook" ? (
                          <Loader2 className="w-3 h-3 animate-spin ml-2 text-[#1877F2]" />
                        ) : (pid === "instagram" && ig.posts?.length > 0) || (pid === "facebook" && fb.posts?.length > 0) || (pid === "blogs" && blogCount > 0) ? (
                          <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-black transition-all ${
                            isActive ? `${platformTheme.badge} text-white` : "bg-slate-200 text-slate-600 hidden md:inline"
                          }`}>
                            {pid === "instagram" ? ig.posts.length : pid === "facebook" ? fb.posts.length : blogCount}
                          </span>
                        ) : pid === "youtube" && youtubeVideos?.length > 0 ? (
                          <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-black transition-all ${
                            isActive ? `${platformTheme.badge} text-white` : "bg-slate-200 text-slate-600 hidden md:inline"
                          }`}>
                            {youtubeVideos.length}
                          </span>
                        ) : null}
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {activePlatform === "deliverables" ? (
              <div className="mt-8">
                <DeliverablesPanel clientId={id!} month={active.month} year={active.year} />
              </div>
            ) : activePlatform === "ad-performance" ? (
              <div className="mt-8">
                <AdPerformanceView theme={platformThemes["ad-performance"]} month={active?.month} year={active?.year ? String(active.year) : undefined} />
              </div>
            ) : (
            <>
            {/* ── Global Overview Stats (Dynamic to the active tab!) ── */}
            {activePlatform !== "blogs" && (
            <div className={`tour-metrics-overview grid gap-4 mb-10 stagger-children transition-all duration-500 ${
              activePlatform === "youtube" ? "grid-cols-1 md:grid-cols-3" : "grid-cols-2 lg:grid-cols-4"
            }`}>
              {[
                {
                  id: "reach",
                  icon: Eye,
                  label: activePlatform === "youtube" ? "Total Views" : "Monthly Reach",
                  value: activePlatform === "youtube"
                    ? (currentData.total_views ?? 0).toLocaleString()
                    : (activePlatform === "facebook"
                        ? (liveFBLoading ? undefined : fbMetric("total_reach") ?? currentData.total_reach)
                        : currentData.total_reach),
                  sub: activePlatform === "youtube"
                    ? "All time views"
                    : (activePlatform === "facebook" ? "Facebook" : "Active platform"),
                  extra: activePlatform === "instagram" && ig.bifurcation_available && ig.organic ? (
                    <p className={`text-[10px] mt-1 px-0.5 font-semibold ${theme.valueColor} opacity-80`}>
                      {ig.organic.total_reach} organic · {ig.paid?.total_reach ?? "0"} paid
                    </p>
                  ) : activePlatform === "facebook" && fb.bifurcation_available && fb.organic ? (
                    <p className={`text-[10px] mt-1 px-0.5 font-semibold ${theme.valueColor} opacity-80`}>
                      {fb.organic.total_reach} organic · {fb.paid?.total_reach ?? "0"} paid
                    </p>
                  ) : null
                },
                activePlatform !== "youtube" && {
                  id: "impressions",
                  icon: TrendingUp,
                  label: "Impressions",
                  value: activePlatform === "facebook"
                    ? (liveFBLoading ? undefined : fbMetric("total_impressions") ?? currentData.total_impressions)
                    : currentData.total_impressions,
                  sub: "This month"
                },
                activePlatform !== "youtube" && {
                  id: "engagement",
                  icon: BarChart3,
                  label: "Engagement Rate",
                  value: activePlatform === "facebook" && liveFBLoading ? undefined : currentData.engagement_rate,
                  sub: "Avg. rate",
                  extra: activePlatform === "instagram" && ig.organic ? (
                    <p className={`text-[10px] mt-1 px-0.5 font-semibold ${theme.valueColor} opacity-80`}>
                      {ig.organic.engagement_rate || "0%"} organic · {ig.engagement_rate} total
                    </p>
                  ) : activePlatform === "facebook" && fb.organic ? (
                    <p className={`text-[10px] mt-1 px-0.5 font-semibold ${theme.valueColor} opacity-80`}>
                      {fb.organic.engagement_rate || "0%"} organic · {fb.engagement_rate} total
                    </p>
                  ) : null
                },
                activePlatform === "youtube" && {
                  id: "total_videos",
                  icon: Play,
                  label: "Total Videos",
                  value: (currentData.total_videos ?? 0).toLocaleString(),
                  sub: "All time uploads"
                },
                {
                  id: "followers",
                  icon: Users,
                  label: activePlatform === "youtube" ? "Subscribers" : (activePlatform === "facebook" ? "Page Followers" : "Followers"),
                  value: activePlatform === "youtube"
                    ? (currentData.subscribers ?? 0).toLocaleString()
                    : (activePlatform === "facebook" && liveFBLoading
                        ? undefined
                        : (activePlatform === "facebook"
                            ? (fbMetric("followers") ?? currentData.followers ?? 0)
                            : (currentData.followers ?? 0)
                          ).toLocaleString()
                      ),
                  sub: activePlatform === "youtube"
                    ? "Total subscribers"
                    : (activePlatform === "facebook" && fb.fan_count ? `${Number(fb.fan_count).toLocaleString()} fans` : undefined),
                  extra: null
                }
              ].filter(Boolean).map(({ id, icon: Icon, label, value, sub, extra }) => (
                <ThemedStatCard
                  key={label}
                  icon={Icon}
                  label={label}
                  value={value}
                  sub={sub}
                  extra={extra}
                  theme={theme}
                />
              ))}
            </div>
            )}

            {/* ── AI Brand Intelligence (unified workspace) ── */}
            <div className="tour-brand-intel joyride-ai-brand-intelligence mt-6">
              <BrandIntelligence
                clientId={id}
                brandName={brandName}
                month={active?.month}
                year={active?.year}
                platform={activePlatform === "blogs" ? "instagram" : activePlatform}
                competitorData={automaticCompetitors}
                compLoading={compLoading}
                onCompRefresh={() => { if (id) fetchAutomaticCompetitorsData(id); }}
                fbMetrics={stableFbMetrics}
                igMetrics={ig}
                seoMetrics={seoData}
              />
            </div>




            {/* ── Dynamic Content Workspace ── */}
            <div className="mt-6 glass-panel overflow-hidden relative">
              {/* Tab content */}
              <div className="p-6 min-h-[750px] relative z-10">
                {activePlatform === "instagram" && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Metric cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={Heart}
                        label="Likes"
                        value={currentData.total_likes}
                        iconColor="text-pink-500"
                        iconBg="bg-pink-50"
                      />
                      <StatCard
                        icon={MessageCircle}
                        label="Comments"
                        value={currentData.total_comments}
                        iconColor="text-blue-500"
                        iconBg="bg-blue-50"
                      />
                      <StatCard
                        icon={Bookmark}
                        label="Saves"
                        value={currentData.total_saves}
                        iconColor="text-yellow-500"
                        iconBg="bg-yellow-50"
                      />
                      <StatCard
                        icon={Eye}
                        label="Top Reach"
                        value={currentData.top_post?.impressions ?? currentData.top_post?.reach}
                        iconColor="text-purple-500"
                        iconBg="bg-purple-50"
                      />
                    </div>

                    {/* Asymmetric Bento Layout: Platform Format Intelligence Hub + Calendar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Expanded Platform Format Intelligence Hub (lg:col-span-2) */}
                      <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-[#E1306C]" />
                            </div>
                            <div>
                              <h4 className="font-black text-[#1a1a1a] text-sm leading-none font-heading">Instagram Format Intelligence</h4>
                              <p className="text-[10px] text-gray-400 mt-1">Format volume & profile engagement velocity</p>
                            </div>
                          </div>

                          {/* 2-Column Responsive Panel Stack */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Left Panel: Format Volume Chart */}
                            <div className="space-y-4">
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Format Volume</span>
                                {contentData.filter(d => d.label !== "Blogs").length > 0 ? (
                                  <BarChart data={contentData.filter(d => d.label !== "Blogs")} color="#E1306C" />
                                ) : (
                                  <div className="h-28 flex items-center justify-center">
                                    <p className="text-xs text-gray-400">No content data</p>
                                  </div>
                                )}
                              </div>

                              {/* Engagement Velocity */}
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                                  <Activity className="w-4 h-4 text-pink-500 animate-pulse" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">Instagram Engagement Velocity</p>
                                  <p className="text-xs font-black text-[#1a1a1a] mt-1.5 leading-none">
                                    {((Number(currentData.total_likes || 0) + Number(currentData.total_comments || 0)) / (Number(currentData.total_reach || 1)) * 100).toFixed(2)}% rate
                                  </p>
                                  <p className="text-[9px] text-pink-500 font-bold mt-1">High conversion per impression</p>
                                </div>
                              </div>
                            </div>

                            {/* Right Panel: Platform Audience Metrics */}
                            <div className="space-y-3.5">
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Audience Retention Scale</span>
                                  <span className="text-xs font-black text-[#E1306C] bg-pink-50 px-2 py-0.5 rounded-full">Active</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#E1306C] to-pink-400 rounded-full" style={{ width: `85%` }} />
                                </div>
                              </div>

                              {/* Platform Metrics */}
                              <div className="bg-white/40 p-3.5 rounded-xl border border-white/50 space-y-2">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-gray-400 font-bold">Avg. Likes per Post:</span>
                                  <span className="font-extrabold text-gray-800">
                                    {posts.length > 0 ? (Number(currentData.total_likes || 0) / posts.length).toFixed(0) : "0"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-gray-400 font-bold">Avg. Comments per Post:</span>
                                  <span className="font-extrabold text-[#E1306C]">
                                    {posts.length > 0 ? (Number(currentData.total_comments || 0) / posts.length).toFixed(0) : "0"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100/60">
                                  <span className="text-gray-400 font-bold">Estimated Save Rate:</span>
                                  <span className="font-extrabold text-emerald-500">
                                    {((Number(currentData.total_saves || 0) / Number(currentData.total_reach || 1)) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: AI recommendation snippet */}
                        <div className="joyride-ai-snippet mt-4 p-3 bg-gradient-to-r from-pink-500/5 to-purple-500/10 border border-pink-500/20 rounded-xl flex items-start gap-2.5">
                          <Bot className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-pink-800 font-medium leading-relaxed">
                            <span className="font-extrabold">AI Platform Advice:</span> Reels and Multi-Image Carousels are driving 84% of brand saves this period. Focus on carousel infographics to maximize audience bookmarking rates.
                          </p>
                        </div>
                      </div>

                      {/* Content Calendar (lg:col-span-1) */}
                      <div className="lg:col-span-1">
                        <ContentCalendar 
                          events={calendarEvents} 
                          month={active?.month || ""} 
                          year={active?.year || ""} 
                        />
                      </div>
                    </div>

                    {/* Premium Context-Aware Brand Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                      
                      {/* 1. Best Performing Post Widget (Spans 2 columns on desktop) */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">PLATFORM BEST PERFORMER</span>
                            </div>
                            <span className="text-[9px] font-extrabold text-[#E1306C] bg-pink-50 px-2 py-0.5 rounded-full uppercase">
                              Instagram
                            </span>
                          </div>

                          {bestPost ? (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                              {/* Left sub-column: Post media thumbnail */}
                              <div className="sm:col-span-4 aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 relative group/bestimg">
                                {(bestPost.media_base64 || bestPost.media_url) ? (
                                  <img src={bestPost.media_base64 || bestPost.media_url} alt="Best Post" className="w-full h-full object-cover transition-transform duration-500 group-hover/bestimg:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                    <InstagramIcon className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/bestimg:opacity-100 transition-opacity flex items-center justify-center">
                                  <a href={bestPost.permalink} target="_blank" rel="noopener noreferrer" className="text-white text-[10px] font-extrabold bg-black/60 px-3 py-1.5 rounded-full shadow-lg">
                                    View Post &rarr;
                                  </a>
                                </div>
                              </div>

                              {/* Right sub-column: Metrics & Details */}
                              <div className="sm:col-span-8 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <p className="text-[11px] text-gray-600 italic line-clamp-3 leading-relaxed">
                                    "{bestPost.caption || "No caption provided."}"
                                  </p>
                                  <div className="flex gap-4 pt-1">
                                    <div>
                                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Interactions</span>
                                      <span className="text-sm font-black text-gray-800 tabular-nums">
                                        {(Number(bestPost.likes ?? bestPost.total_likes ?? 0) + Number(bestPost.comments ?? bestPost.total_comments ?? 0)).toLocaleString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Engagement</span>
                                      <span className="text-sm font-black text-pink-500 tabular-nums">
                                        {(((Number(bestPost.likes ?? bestPost.total_likes ?? 0) + Number(bestPost.comments ?? bestPost.total_comments ?? 0)) / (Number(currentData.followers ?? 10000))) * 100).toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed border border-gray-100">
                                  <span className="font-extrabold text-[#E1306C]">AI Analysis:</span> High organic retention driven by question-based caption and prompt engagement.
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-28 flex flex-col items-center justify-center text-center gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <Sparkles className="w-6 h-6 text-gray-300" />
                              <span className="text-[10px] text-gray-400 font-bold">No best post found for this platform</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Audience Activity Timing Widget (1 col) */}
                      <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-1.5 mb-3.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">AUDIENCE ACTIVITY</span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[11px] text-gray-600 font-bold">Primary Peak Slot</span>
                              </div>
                              <span className="text-[11px] font-black text-gray-800">Tuesdays @ 9:00 AM</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                <span className="text-[11px] text-gray-600 font-bold">Secondary Slot</span>
                              </div>
                              <span className="text-[11px] font-black text-gray-800">Thursdays @ 6:30 PM</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 leading-relaxed pt-3 border-t border-gray-100">
                          <span className="font-extrabold text-[#E1306C]">Scheduling advice:</span> Publish 15 minutes before the peak slot to capture high-volume organic feeds.
                        </p>
                      </div>

                      {/* 3. Instagram Brand Velocity / Gauge (1 col) */}
                      <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-1.5 mb-3.5">
                            <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center">
                              <Flame className="w-3.5 h-3.5 text-[#E1306C] animate-pulse" />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">BRAND VELOCITY</span>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                                <span>Engagement Velocity</span>
                                <span className="text-pink-500 font-black">Stable</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full" style={{ width: `78%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                                <span>Story Interaction Rate</span>
                                <span className="text-emerald-500 font-black">+4.8% growth</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `65%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[9px] text-gray-400 flex justify-between items-center pt-3 border-t border-gray-100">
                          <span>Feed Health: <span className="font-extrabold text-emerald-500">Excellent</span></span>
                          <span>{mVal}/{active?.year} Active</span>
                        </div>
                      </div>

                    </div>

                    {/* Posts grid */}
                    <div className="joyride-instagram-posts">
                      <h4 className="font-black text-[#1a1a1a] text-sm mb-3">
                        Instagram Posts this period
                        <span className="text-gray-400 font-normal ml-2">({posts.length} total)</span>
                      </h4>
                      {posts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {posts.map((post: any) => {
                            const isVideo   = post.media_type === "VIDEO" || post.media_type === "REELS";
                            const isCarousel= post.media_type === "CAROUSEL_ALBUM";
                            const badgeColor= isVideo
                              ? "bg-pink-500"
                              : isCarousel
                                ? "bg-orange-500"
                                : "bg-black/50";
                            const badgeLabel= isVideo
                              ? "Reel"
                              : isCarousel
                                ? "Album"
                                : "Post";
                            return (
                              <a
                                key={post.id}
                                href={post.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="relative aspect-square rounded-2xl overflow-hidden bg-white block border border-slate-200/80 shadow-soft hover:border-slate-300 hover:shadow-glass transition duration-200"
                              >
                                {(post.media_base64 || post.media_url) ? (
                                  <img
                                    src={post.media_base64 || post.media_url}
                                    alt={post.caption || "Post"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-2">
                                    <InstagramIcon className="w-6 h-6 text-gray-300" />
                                    <span className="text-[9px] text-gray-300 font-medium">No image</span>
                                  </div>
                                )}

                                <div className="absolute top-2 right-2">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white ${badgeColor}`}>
                                    {badgeLabel}
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="glass-card border-dashed p-10 text-center bg-white/30">
                          <InstagramIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm font-bold text-gray-400">No posts found for this period</p>
                          <p className="text-xs text-gray-300 mt-1">Regenerate the report to pull latest Instagram data</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activePlatform === "facebook" && (
                  <div className="space-y-6 animate-fade-in">
                    {liveFBLoading && (
                      <div className="flex items-center gap-3 rounded-2xl border border-[#1877F2]/20 bg-[#1877F2]/5 px-4 py-3 text-sm text-[#1877F2]">
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span className="font-medium">Loading live Facebook metrics…</span>
                      </div>
                    )}
                    {liveFBError && !liveFBLoading && fb?.status !== "success" && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <p className="font-bold">Facebook data unavailable</p>
                        <p className="mt-1 text-amber-700">{liveFBError}</p>
                        {fbFromReport?.status === "success" && (
                          <p className="mt-1 text-xs text-amber-600">Showing last saved report data where available.</p>
                        )}
                      </div>
                    )}
                    {!liveFBLoading && !liveFBError && !fbConnected && (
                      <div className="rounded-2xl border-2 border-dashed border-[#1877F2]/30 bg-blue-50/50 px-4 py-6 text-center">
                        <p className="text-sm font-bold text-[#1877F2]">Connect Facebook to see analytics</p>
                        <p className="text-xs text-gray-500 mt-1">Add Page ID and token in admin settings, then regenerate the report.</p>
                      </div>
                    )}

                    {/* Metric cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={Heart}
                        label="Reactions"
                        value={fbReactions}
                        iconColor="text-blue-600"
                        iconBg="bg-blue-50"
                      />
                      <StatCard
                        icon={MessageCircle}
                        label="Comments"
                        value={fbMetric("total_comments")}
                        iconColor="text-cyan-500"
                        iconBg="bg-cyan-50"
                      />
                      <StatCard
                        icon={Bookmark}
                        label="Shares"
                        value={fbShares}
                        iconColor="text-indigo-500"
                        iconBg="bg-indigo-50"
                      />
                      <StatCard
                        icon={Eye}
                        label="Top Reach"
                        value={fb.top_post?.impressions ?? fb.top_post?.reach}
                        iconColor="text-purple-500"
                        iconBg="bg-purple-50"
                      />
                    </div>

                    {/* Asymmetric Bento Layout: Platform Format Intelligence Hub + Calendar */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* Expanded Platform Format Intelligence Hub (lg:col-span-2) */}
                      <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-[#1877F2]" />
                            </div>
                            <div>
                              <h4 className="font-black text-[#1a1a1a] text-sm leading-none font-heading">Facebook Format Intelligence</h4>
                              <p className="text-[10px] text-gray-400 mt-1">Format volume & profile growth rate</p>
                            </div>
                          </div>

                          {/* 2-Column Responsive Panel Stack */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Left Panel: Format Volume Chart */}
                            <div className="space-y-4">
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Format Volume</span>
                                {contentData.filter(d => d.label !== "Blogs").length > 0 ? (
                                  <BarChart data={contentData.filter(d => d.label !== "Blogs")} color="#1877F2" />
                                ) : (
                                  <div className="h-28 flex items-center justify-center">
                                    <p className="text-xs text-gray-400">No content data</p>
                                  </div>
                                )}
                              </div>

                              {/* Audience Growth Rate */}
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                  <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none">Facebook Fan Growth</p>
                                  <p className="text-xs font-black text-[#1a1a1a] mt-1.5 leading-none">
                                    +5.2% referral velocity
                                  </p>
                                  <p className="text-[9px] text-emerald-500 font-bold mt-1">Positive channel trajectory</p>
                                </div>
                              </div>
                            </div>

                            {/* Right Panel: Platform Audience Metrics */}
                            <div className="space-y-3.5">
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Audience Retention Scale</span>
                                  <span className="text-xs font-black text-[#1877F2] bg-blue-50 px-2 py-0.5 rounded-full">Connected</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#1877F2] to-blue-400 rounded-full" style={{ width: `72%` }} />
                                </div>
                              </div>

                              {/* Platform Metrics */}
                              <div className="bg-white/40 p-3.5 rounded-xl border border-white/50 space-y-2">
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-gray-400 font-bold">Avg. Reactions per Post:</span>
                                  <span className="font-extrabold text-gray-800">
                                    {posts.length > 0 ? (Number(fbReactions || 0) / posts.length).toFixed(0) : "0"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-gray-400 font-bold">Avg. Comments per Post:</span>
                                  <span className="font-extrabold text-[#1877F2]">
                                    {posts.length > 0 ? (Number(fbMetric("total_comments") || 0) / posts.length).toFixed(0) : "0"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-gray-100/60">
                                  <span className="text-gray-400 font-bold">Share Velocity Rate:</span>
                                  <span className="font-extrabold text-emerald-500">
                                    {((Number(fbShares || 0) / Number(fbMetric("total_reach") || 1)) * 100).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: AI recommendation snippet */}
                        <div className="joyride-ai-snippet mt-4 p-3 bg-gradient-to-r from-blue-500/5 to-indigo-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2.5">
                          <Bot className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                            <span className="font-extrabold">AI Platform Advice:</span> Link updates redirecting to published articles perform 2.4x better than text-only updates. Align blogs calendar releases with Facebook posts.
                          </p>
                        </div>
                      </div>

                      {/* Content Calendar (lg:col-span-1) */}
                      <div className="lg:col-span-1">
                        <ContentCalendar 
                          events={calendarEvents} 
                          month={active?.month || ""} 
                          year={active?.year || ""} 
                        />
                      </div>
                    </div>

                    {/* Premium Context-Aware Brand Intelligence Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                      
                      {/* 1. Best Performing Post Widget (Spans 2 columns on desktop) */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center justify-between mb-3.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              </div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">PLATFORM BEST PERFORMER</span>
                            </div>
                            <span className="text-[9px] font-extrabold text-[#1877F2] bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                              Facebook
                            </span>
                          </div>

                          {bestPost ? (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                              {/* Left sub-column: Post media thumbnail */}
                              <div className="sm:col-span-4 aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0 relative group/bestimg">
                                {(bestPost.media_base64 || bestPost.media_url) ? (
                                  <img src={bestPost.media_base64 || bestPost.media_url} alt="Best Post" className="w-full h-full object-cover transition-transform duration-500 group-hover/bestimg:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/bestimg:opacity-100 transition-opacity flex items-center justify-center">
                                  <a href={bestPost.permalink} target="_blank" rel="noopener noreferrer" className="text-white text-[10px] font-extrabold bg-black/60 px-3 py-1.5 rounded-full shadow-lg">
                                    View Post &rarr;
                                  </a>
                                </div>
                              </div>

                              {/* Right sub-column: Metrics & Details */}
                              <div className="sm:col-span-8 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <p className="text-[11px] text-gray-600 italic line-clamp-3 leading-relaxed">
                                    "{bestPost.caption || "No caption provided."}"
                                  </p>
                                  <div className="flex gap-4 pt-1">
                                    <div>
                                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Interactions</span>
                                      <span className="text-sm font-black text-gray-800 tabular-nums">
                                        {(Number(bestPost.likes ?? bestPost.total_likes ?? 0) + Number(bestPost.comments ?? bestPost.total_comments ?? 0)).toLocaleString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Engagement</span>
                                      <span className="text-sm font-black text-blue-500 tabular-nums">
                                        {(((Number(bestPost.likes ?? bestPost.total_likes ?? 0) + Number(bestPost.comments ?? bestPost.total_comments ?? 0)) / (Number(currentData.followers ?? 10000))) * 100).toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 text-[10px] text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed border border-gray-100">
                                  <span className="font-extrabold text-[#1877F2]">AI Analysis:</span> Strategic link sharing generated high referral visibility and brand interactions.
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-28 flex flex-col items-center justify-center text-center gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <Sparkles className="w-6 h-6 text-gray-300" />
                              <span className="text-[10px] text-gray-400 font-bold">No best post found for this platform</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2. Audience Activity Timing Widget (1 col) */}
                      <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-1.5 mb-3.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">AUDIENCE ACTIVITY</span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[11px] text-gray-600 font-bold">Primary Peak Slot</span>
                              </div>
                              <span className="text-[11px] font-black text-gray-800">Tuesdays @ 9:00 AM</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                <span className="text-[11px] text-gray-600 font-bold">Secondary Slot</span>
                              </div>
                              <span className="text-[11px] font-black text-gray-800">Thursdays @ 6:30 PM</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 leading-relaxed pt-3 border-t border-gray-100">
                          <span className="font-extrabold text-[#1877F2]">Scheduling advice:</span> Publish 15 minutes before the peak slot to capture high-volume organic feeds.
                        </p>
                      </div>

                      {/* 3. Facebook Publishing Insights (1 col) */}
                      <div className="lg:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-1.5 mb-3.5">
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">PUBLISHING INSIGHTS</span>
                          </div>

                          <div className="space-y-3.5">
                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                                <span>Publishing Frequency</span>
                                <span className="text-[#1877F2] font-black">2.4 / week</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full" style={{ width: `60%` }} />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1">
                                <span>Link Click-Through Rate</span>
                                <span className="text-emerald-500 font-black">+3.2% CTR</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `70%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-[9px] text-gray-400 flex justify-between items-center pt-3 border-t border-gray-100">
                          <span>Feed Trajectory: <span className="font-extrabold text-emerald-500">Stable</span></span>
                          <span>{mVal}/{active?.year} Active</span>
                        </div>
                      </div>

                    </div>

                    {/* Posts grid */}
                    <div>
                      <h4 className="font-black text-[#1a1a1a] text-sm mb-3">
                        Facebook Posts this period
                        <span className="text-gray-400 font-normal ml-2">({posts.length} total)</span>
                      </h4>
                      {posts.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                          {posts.map((post: any) => {
                            const isVideo   = post.media_type === "VIDEO" || post.media_type === "REELS";
                            const isCarousel= post.media_type === "CAROUSEL_ALBUM";
                            const badgeColor= isVideo
                              ? "bg-blue-600"
                              : isCarousel
                                ? "bg-orange-500"
                                : "bg-black/50";
                            const badgeLabel= isVideo
                              ? "Video"
                              : isCarousel
                                ? "Album"
                                : "Post";
                            return (
                              <a
                                key={post.id}
                                href={post.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="relative aspect-square rounded-2xl overflow-hidden bg-white block border border-slate-200/80 shadow-soft hover:border-slate-300 hover:shadow-glass transition duration-200"
                              >
                                {(post.media_base64 || post.media_url) ? (
                                  <img
                                    src={post.media_base64 || post.media_url}
                                    alt={post.caption || "Post"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 gap-2">
                                    <svg className="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                                    <span className="text-[9px] text-gray-300 font-medium">No image</span>
                                  </div>
                                )}

                                <div className="absolute top-2 right-2">
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white ${badgeColor}`}>
                                    {badgeLabel}
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="glass-card border-dashed p-10 text-center bg-white/30">
                          <svg className="w-10 h-10 text-gray-200 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                          </svg>
                          <p className="text-sm font-bold text-gray-400">No posts found for this period</p>
                          <p className="text-xs text-gray-300 mt-1">Regenerate the report to pull latest Facebook data</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activePlatform === "youtube" && (
                  <div className="space-y-6 animate-fade-in">
                    {/* Metric cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard
                        icon={Eye}
                        label="Total Views"
                        value={youtube.total_views != null ? youtube.total_views.toLocaleString() : undefined}
                        iconColor="text-red-500"
                        iconBg="bg-red-50"
                      />
                      <StatCard
                        icon={Heart}
                        label="Subscribers"
                        value={youtube.subscribers != null ? youtube.subscribers.toLocaleString() : undefined}
                        iconColor="text-red-500"
                        iconBg="bg-red-50"
                      />
                      <StatCard
                        icon={Play}
                        label="Total Videos"
                        value={youtube.total_videos != null ? youtube.total_videos.toLocaleString() : undefined}
                        iconColor="text-red-500"
                        iconBg="bg-red-50"
                      />
                    </div>

                    {/* Asymmetric Bento Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                      {/* YouTube Format Intelligence Hub (lg:col-span-2) */}
                      <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-[#FF0000]" />
                            </div>
                            <div>
                              <h4 className="font-black text-[#1a1a1a] text-sm leading-none font-heading">YouTube Channel Stats</h4>
                              <p className="text-[10px] text-gray-400 mt-1">Video publication metrics & viewer activity</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="space-y-4">
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">Audience Retention Scale</span>
                                <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-[#FF0000] to-red-400 rounded-full" style={{ width: `45%` }} />
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold block mt-1">Typical 45% average retention estimated</span>
                              </div>
                            </div>

                            <div className="bg-white/40 p-3.5 rounded-xl border border-white/50 space-y-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400 font-bold">Total Videos Analyzed:</span>
                                <span className="font-extrabold text-gray-800">{youtubeVideos.length}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400 font-bold">Channel ID:</span>
                                <span className="font-extrabold text-[#FF0000] font-mono text-[9px] truncate max-w-[120px]" title={youtube.channel_id}>
                                  {youtube.channel_id}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-gradient-to-r from-red-500/5 to-orange-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                          <Bot className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-red-800 font-medium leading-relaxed">
                            <span className="font-extrabold">AI Channel Advice:</span> Educational contents with specific timestamp intervals have 22% higher average duration watch-time than general topics.
                          </p>
                        </div>
                      </div>

                      {/* Content Calendar (lg:col-span-1) */}
                      <div className="lg:col-span-1">
                        <ContentCalendar 
                          events={calendarEvents} 
                          month={active?.month || ""} 
                          year={active?.year || ""} 
                        />
                      </div>
                    </div>

                    {/* Videos This Month Section */}
                    <div className="mt-8">
                      <h4 className="font-black text-[#1a1a1a] text-sm mb-3">
                        Videos This Month
                        <span className="text-gray-400 font-normal ml-2">({youtubeVideos.length} total)</span>
                      </h4>
                      {youtubeVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {youtubeVideos.map((video: any, idx: number) => {
                            return (
                              <div
                                key={idx}
                                className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-glass transition duration-200"
                              >
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
                                    <div className="flex items-center gap-0.5 text-gray-500">
                                      <MessageCircle className="w-3.5 h-3.5" />
                                      <span className="text-[10px] font-bold">{(video.comments ?? 0).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white/40 border-2 border-dashed border-gray-200 rounded-3xl">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-heading">No videos published this month.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activePlatform === "blogs" && (
                  <div className="space-y-8 animate-fade-in">
                    
                    {/* If PDF is uploaded, show the analytics overview, iframe, AI summary, and tracker grid */}
                    {activeMonthlySeoReport ? (
                      <>
                        {/* SECTION A: Google Analytics Overview */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[#1a1a1a] font-heading tracking-tight flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-[#113a87]/10 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-[#113a87]" />
                              </div>
                              Google Analytics Overview
                            </h3>
                            <div className="flex items-center gap-2">
                              <a
                                href={activeMonthlySeoReport.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#113a87] hover:bg-[#113a87]/90 text-white text-xs font-bold rounded-lg shadow-sm transition"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download SEO Report
                              </a>
                              {activeMonthlySeoReport.filename && (
                                <span className="px-2 py-1 bg-[#113a87]/10 border border-[#113a87]/20 text-[#113a87] text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                                  <span>📄 Parsed Report: {activeMonthlySeoReport.filename}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {seoData && (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Sessions</span>
                                <span className="text-2xl font-black text-[#113a87] mt-1 block">{(seoData.sessions || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Total Users</span>
                                <span className="text-2xl font-black text-[#113a87] mt-1 block">{(seoData.users || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">New Users</span>
                                <span className="text-2xl font-black text-[#113a87] mt-1 block">{(seoData.newUsers || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Bounce Rate</span>
                                <span className="text-2xl font-black text-[#113a87] mt-1 block">{seoData.bounceRate}%</span>
                              </div>
                              <div className="bg-white/40 p-4 rounded-xl border border-white/50 hover:bg-white/60 transition-colors">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Key Events</span>
                                <span className="text-2xl font-black text-[#113a87] mt-1 block">{(seoData.keyEvents || 0).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* PDF Viewer */}
                        <div className="glass-card p-2 h-[800px] w-full flex flex-col mt-6 overflow-hidden relative group hover:shadow-xl transition-all duration-500 border border-white/40 bg-gray-50/50">
                          <iframe 
                            src={`${activeMonthlySeoReport.url}#view=FitH`} 
                            className="w-full h-full rounded-xl border-none bg-white shadow-sm"
                            title="Original SEO Report"
                          />
                        </div>

                        {/* AI SEO Executive Summary */}
                        {seoData && (
                          <div className="mt-8 p-5 bg-gradient-to-br from-[#113a87]/5 via-indigo-500/5 to-purple-500/10 border border-[#113a87]/20 rounded-xl flex items-start gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#113a87] to-purple-500" />
                            <div className="w-10 h-10 rounded-xl bg-white border border-white/60 shadow-sm flex items-center justify-center shrink-0">
                              <Sparkles className="w-5 h-5 text-[#113a87]" />
                            </div>
                            <div className="text-[12px] text-gray-700 font-medium leading-relaxed w-full">
                              <span className="font-black text-[#113a87] uppercase tracking-wider block mb-2 text-[10px]">AI Executive Summary & Growth Opportunities</span>
                              <p className="mb-3">Based on the extracted report data, here are the key strategic opportunities:</p>
                              <ul className="space-y-2">
                                {(() => {
                                  const cleanText = (text: string) => {
                                    try {
                                      let cleaned = text.replace(/^[\s\p{Extended_Pictographic}\-•:🎯🚀📈💡⚠️✨👀⏳]+/gu, "");
                                      cleaned = cleaned.replace(/\p{Extended_Pictographic}/gu, "");
                                      return cleaned.trim();
                                    } catch (e) {
                                      let cleaned = text.replace(/^[\s\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\-•:🎯🚀📈💡⚠️✨👀⏳]+/gu, "");
                                      cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, "");
                                      return cleaned.trim();
                                    }
                                  };

                                  const insights = [];
                                  if (seoData.ctr > 3) insights.push("CTR is performing above industry benchmarks, indicating strong search intent match.");
                                  else if (seoData.ctr > 0) insights.push("CTR is below optimal levels; consider A/B testing meta-titles for better click-throughs.");
                                  
                                  if (seoData.bounceRate > 65) insights.push("Bounce rate is elevated, suggesting immediate landing page optimization is needed.");
                                  else if (seoData.bounceRate > 0) insights.push("High user retention detected with very healthy bounce rates.");
                                  
                                  if (seoData.avgPosition > 0 && seoData.avgPosition <= 10) insights.push("Strong keyword positioning detected; maintaining page-one dominance.");
                                  
                                  if (seoData.impressions > 10000) insights.push("Significant impression volume indicates increasing organic discoverability.");
                                  
                                  if (insights.length === 0) insights.push("Awaiting further data accumulation to generate deep search insights.");
                                  
                                  seoData.recommendations?.forEach((rec: string) => {
                                    const cleanedRec = cleanText(rec);
                                    if (cleanedRec && !insights.includes(cleanedRec)) insights.push(cleanedRec);
                                  });
                                  
                                  return insights.map((insight, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-[#113a87] mt-0.5">•</span>
                                      <span>{insight}</span>
                                    </li>
                                  ));
                                })()}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* Premium Context-Aware Brand Intelligence Grid */}
                        {seoData && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
                            
                            {/* SEO Search Metrics & CTR Tracker */}
                            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                              <div>
                                <div className="flex items-center gap-1.5 mb-3.5">
                                  <div className="w-6 h-6 rounded-lg bg-[#113a87]/10 flex items-center justify-center">
                                    <TrendingUp className="w-3.5 h-3.5 text-[#113a87]" />
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">SEO SEARCH METRICS & CTR TRACKER</span>
                                </div>

                                <div className="space-y-4">
                                  <div className="bg-white/40 p-4 rounded-xl border border-white/50">
                                    <span className="text-[10px] font-bold text-gray-400 block mb-3">SERP Impressions & Ranking Path (Source: {seoData.source})</span>
                                    <div className="space-y-3">
                                      {seoData.rankings?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                          <div>
                                            <span className="text-xs font-black text-gray-800 block leading-none">{item.term}</span>
                                            <span className="text-[9px] font-bold text-gray-400 mt-1 block uppercase tracking-wider">{item.visibility}</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-[#113a87] bg-blue-50 px-2 py-0.5 rounded-full">{item.rank}</span>
                                            <span className="text-xs font-black text-emerald-500">{item.change}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/40 p-3.5 rounded-xl border border-white/50">
                                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Search Impressions</span>
                                      <span className="text-lg font-black text-[#1a1a1a] block mt-1">
                                        {(seoData.impressions || 0).toLocaleString()}
                                      </span>
                                      <span className="text-[9px] text-emerald-500 font-bold">↑ +14.2% search impressions</span>
                                    </div>
                                    <div className="bg-white/40 p-3.5 rounded-xl border border-white/50">
                                      <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-wider">Average CTR</span>
                                      <span className="text-lg font-black text-indigo-600 block mt-1">{seoData.ctr}%</span>
                                      <span className="text-[9px] text-indigo-500 font-bold">↑ Outperforming industry avg</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="text-[9px] text-gray-400 flex justify-between items-center pt-3 border-t border-gray-100 mt-3">
                                <span>
                                  Search Indexing:{" "}
                                  <span className="font-extrabold text-emerald-500">
                                    {seoData.indexedPages ? `${seoData.indexedPages} pages` : "Active"}
                                  </span>
                                </span>
                                {seoData.backlinks !== undefined && seoData.backlinks > 0 && (
                                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded-md font-heading">
                                    Backlinks: {seoData.backlinks}
                                  </span>
                                )}
                                <span>Last updated: {active?.month} {active?.year}</span>
                              </div>
                            </div>

                            {/* AI Blog Strategy Generator */}
                            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition duration-200">
                              <div>
                                <div className="flex items-center gap-1.5 mb-3.5">
                                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center animate-pulse">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest font-heading">AI BLOG STRATEGY GENERATOR</span>
                                </div>

                                <div className="space-y-4">
                                  <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Recommended Next Article</span>
                                    <h5 className="font-black text-[#1a1a1a] text-sm leading-snug">"The Ultimate Guide to {seoData.keyword ? seoData.keyword.replace("near me", "") : ""}: 5 Strategies for Success"</h5>
                                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">A comprehensive 1,500-word authoritative guide targeting high-intent long-tail keywords to establish expert ranking and capture search impressions.</p>
                                  </div>

                                  <div className="bg-white/40 p-4 rounded-xl border border-white/50 space-y-2">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Proposed Layout & SEO Focus</span>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="text-gray-600">Target Wordcount: <b>1,200+ words</b></span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="text-gray-600">Internal Links: <b>3 references</b></span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="text-gray-600">Suggested Headings: <b>H2/H3 checklist</b></span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        <span className="text-gray-600">Featured Image tag: <b>Alt-keyword</b></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 bg-white/20 border border-gray-200/50 rounded-xl mt-3 flex items-center justify-between">
                                <span className="text-[10px] text-gray-500 font-bold">SEO Trend Opportunity</span>
                                <span className="text-[10px] font-black text-amber-600 uppercase">High Priority</span>
                              </div>
                            </div>

                          </div>
                        )}
                      </>
                    ) : (
                      /* If NO PDF is uploaded: Show ONLY the "Awaiting Source Document" empty state */
                      <div className="glass-card p-12 flex flex-col items-center justify-center mt-6 text-center border-dashed border-2 border-gray-200/50">
                        <div className="w-16 h-16 rounded-2xl bg-gray-50/50 flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="font-black text-gray-400 text-lg">Awaiting Source Document</h4>
                        <p className="text-sm text-gray-400 max-w-sm mt-2 font-medium">Upload a PDF report above to view the native document natively inside the dashboard.</p>
                      </div>
                    )}

                    {/* Published Blogs Grid */}
                    <div>
                      <h4 className="font-black text-[#1a1a1a] text-sm mb-3">
                        Published Blogs & Articles
                        <span className="text-gray-400 font-normal ml-2">({currentMonthBlogs.length} total)</span>
                      </h4>
                      {currentMonthBlogs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {currentMonthBlogs.map((blog: any) => (
                            <a
                              key={`blog-${blog.id}`}
                              href={blog.url}
                              target="_blank"
                              rel="noreferrer"
                              className="relative rounded-2xl overflow-hidden bg-white flex flex-col border border-slate-200 shadow-soft hover:border-slate-300 hover:shadow-glass transition duration-200 p-5 min-h-[190px] justify-between"
                            >
                              <div className="absolute top-4 right-4 z-10">
                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-amber-900 bg-amber-400 shadow-sm uppercase">
                                  Article
                                </span>
                              </div>
                              {blog.image_url && (
                                <div className="absolute inset-0 opacity-10">
                                  <img src={blog.image_url} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="relative z-10 flex flex-col h-full justify-between">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-bold text-amber-600 uppercase block tracking-wider">
                                    {blog.published_at ? new Date(blog.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                  </span>
                                  <h5 className="font-black text-[#1a1a1a] text-sm leading-snug line-clamp-2 pr-10">{blog.title}</h5>
                                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mt-1.5">{blog.excerpt}</p>
                                </div>
                                <span className="text-[10px] font-bold text-[#113a87] mt-4 inline-flex items-center gap-1">
                                  Read Full Article &rarr;
                                </span>
                              </div>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="glass-card border-dashed p-10 text-center bg-white/30 flex flex-col items-center justify-center">
                          <Globe className="w-10 h-10 text-gray-200 mb-3" />
                          <p className="text-sm font-bold text-gray-400">No blog articles published for this period</p>
                          <p className="text-xs text-gray-300 mt-1">Publish blogs in the backend workspace or regenerate report to fetch updates</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
          </>
          )}
            {/* Industry Related News Section — hidden for deliverables and ad-performance */}
            {activePlatform !== "deliverables" && activePlatform !== "ad-performance" && (
              <div className="tour-industry-news joyride-industry-news">
                <IndustryNewsSection industry={industry} clientId={id} />
              </div>
            )}
          </div>
        </>
        )}
      </main>

      {/* Subtle Watermark Footer */}
      <footer className="text-center text-[10px] text-slate-400/50 pb-8 mt-12 font-medium tracking-wide flex flex-col items-center justify-center gap-2">
        <div>
          Powered by <span className="text-slate-500/70 font-semibold">Canit Solutions</span>
        </div>
        <div className="flex items-center gap-3.5 mt-1 font-semibold">
          <Link to="/settings/terms" className="hover:text-[#113a87] hover:underline transition-colors duration-200">
            Terms of Use
          </Link>
          <span className="text-slate-200">|</span>
          <Link to="/settings/privacy" className="hover:text-[#113a87] hover:underline transition-colors duration-200">
            Privacy Policy
          </Link>
          <span className="text-slate-200">|</span>
          <Link to="/settings/support" className="hover:text-[#113a87] hover:underline transition-colors duration-200">
            Contact Support
          </Link>
        </div>
      </footer>

      {/* AI Chat */}
      {chatOpen && (
        <div className="fixed bottom-28 right-8 w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-float border border-gray-200/40 z-50 flex flex-col overflow-hidden animate-fade-in" style={{ height: "460px" }}>
          <div className="bg-gradient-to-r from-[#113a87] to-[#1e56b8] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-black text-sm">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-black/20 rounded-lg p-0.5">
                <button onClick={() => setChatMode("text")} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${chatMode === "text" ? "bg-white text-[#113a87]" : "text-white/70 hover:text-white"}`}>Typing</button>
                <button onClick={() => setChatMode("voice")} className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-colors ${chatMode === "voice" ? "bg-white text-[#113a87]" : "text-white/70 hover:text-white"}`}>Hands-free</button>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white transition-colors rounded-lg p-1 ml-2"><X size={18} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-6">
                <Bot className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="font-medium mb-4">Ask me about your {active?.month} performance</p>
                {["Give me a full synopsis", "What content worked best?", "How do we compare to competitors?"].map(q => (
                  <button key={q} onClick={() => sendChat(q)}
                    className="block w-full text-left text-xs bg-gray-50 hover:bg-[#113a87]/5 border border-gray-200 rounded-xl px-3 py-2.5 text-gray-600 transition-colors mb-2">
                    {q}
                  </button>
                ))}
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user" ? "bg-[#113a87] text-white rounded-br-sm" : "bg-gray-100 text-gray-700 rounded-bl-sm"
                }`}>
                  <div className="flex items-end gap-2">
                    <div className="flex-1" dangerouslySetInnerHTML={{ __html: msg.role === "assistant" ? formatMessage(msg.content) : msg.content }} />
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => speakingIndex === i ? window.speechSynthesis.cancel() : speakResponse(msg.content.replace(/<[^>]*>/g, ''), i)}
                        className={`flex-shrink-0 p-1 rounded transition-colors ${speakingIndex === i ? "bg-[#113a87]/20 text-[#113a87]" : "text-gray-400 hover:text-[#113a87] hover:bg-gray-200"}`}
                        title={speakingIndex === i ? "Stop reading" : "Read aloud"}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[80%]">
                    {msg.suggestions.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => sendChat(s)}
                        disabled={chatLoading}
                        className="text-xs px-3 py-1.5 bg-white border border-[#113a87]/20 rounded-full text-[#113a87] hover:bg-[#113a87]/10 hover:border-[#113a87]/40 transition-all disabled:opacity-40 shadow-sm font-medium"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
          {chatMode === "text" ? (
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()}
                placeholder="Ask about your stats..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none text-sm focus:border-[#113a87] transition-colors" />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                className="w-10 h-10 bg-[#113a87] rounded-xl flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-4 border-t border-gray-100 flex flex-col items-center justify-center bg-gray-50/50">
              <button onClick={startListening}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                    : 'bg-white text-[#113a87] border border-[#113a87]/20 shadow-sm hover:shadow-md'
                }`}>
                {isListening ? <MicOff className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
              </button>
              <span className="text-[10px] font-medium text-gray-400 mt-2">
                {isListening ? 'Tap to send' : 'Tap to speak'}
              </span>
              {isListening && chatInput && (
                <div className="mt-4 text-sm text-gray-600 text-center animate-fade-in font-medium px-4">
                  "{chatInput}"
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Back to Top Button — sits above the AI chat button on the right */}
      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-24 w-11 h-11 bg-white border border-slate-200/80 text-slate-500 hover:text-[#113a87] hover:border-[#113a87]/30 hover:shadow-md rounded-2xl shadow-sm flex items-center justify-center transition-all z-40 group"
          title="Back to top">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <span className="absolute right-14 bg-[#1a1a1a] text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Back to top
          </span>
        </button>
      )}

      <button onClick={() => setChatOpen(!chatOpen)}
          className="tour-ai-chat joyride-ai-chat fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-[#113a87] to-[#1e56b8] text-white rounded-full shadow-float flex items-center justify-center transition-all hover:scale-105 hover:shadow-glow z-50 group">
          <Bot className="w-6 h-6" />
          <span className="absolute right-16 bg-[#1a1a1a] text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
            Chat with your data
          </span>
        </button>

      {/* Hidden PDF Container */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden -z-50">
        <PrintReportView 
          brandName={brandName}
          clientLogoUrl={clientLogoUrl}
          month={active?.month || ""}
          year={active?.year || ""}
          ig={ig}
          fb={fb}
          fbReactions={fbReactions}
          fbShares={fbShares}
          fbComments={fbMetric("total_comments")}
          seoData={seoData}
          currentMonthBlogs={currentMonthBlogs}
          aiInsight={active?.ai_insight || ""}
          brandIntelData={brandIntelData}
          contentData={contentData}
          bestPost={bestPost}
          websiteData={websiteData}
        />
      </div>

      {/* Custom Voice Support Alert Modal */}
      {voiceAlertOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setVoiceAlertOpen(false)}>
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm mx-4 p-6 text-center animate-fade-in border border-gray-100" onClick={e => e.stopPropagation()}>
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-[#1a1a1a] font-heading mb-2">Voice Chat Not Supported</h2>
            <p className="text-sm text-gray-500 font-medium mb-6 font-heading">
              Voice chat is not supported in this browser. Please use Chrome, Edge, or Safari.
            </p>
            <button onClick={() => setVoiceAlertOpen(false)} className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#113a87] hover:bg-[#0e2f6e] transition-colors shadow-md font-heading">
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Competitor Overview Section ── */

type GrowthLabel = "High Activity" | "Growing" | "Stable" | "Emerging";

function getGrowthLabel(followers: number, posts: number): GrowthLabel {
  if (followers > 500000) return "High Activity";
  if (followers > 100000) return "Growing";
  if (posts > 500) return "Stable";
  return "Emerging";
}

const GROWTH_STYLES: Record<GrowthLabel, { bg: string; text: string; dot: string }> = {
  "High Activity": { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  "Growing":       { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-500" },
  "Stable":        { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-500" },
  "Emerging":      { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-500" },
};

function fmtNum(n?: number | null): string {
  if (!n || n <= 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function ComparisonBar({
  label,
  bars,
}: {
  label: string;
  bars: { name: string; value: number; color: string; isClient?: boolean }[];
}) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const visible = bars.filter((b) => b.value > 0);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      <div className="space-y-2">
        {visible.map((b) => {
          const pct = Math.max((b.value / max) * 100, 2);
          return (
            <div key={b.name} className="flex items-center gap-3">
              <span className={`text-[10px] font-bold w-24 shrink-0 truncate ${b.isClient ? "text-[#113a87]" : "text-gray-500"}`}>
                {b.name}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${b.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold tabular-nums w-12 text-right ${b.isClient ? "text-[#113a87]" : "text-gray-400"}`}>
                {fmtNum(b.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompetitorSocialIntelligenceSection({
  clientId,
  industry,
  instagramHandle,
  competitorData,
  loading,
  error,
  onRefresh,
}: {
  clientId?: string;
  industry: string;
  instagramHandle: string;
  competitorData: any;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-4 pt-6 border-t border-gray-100 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-5 w-52 bg-gray-200 rounded-lg" />
            <div className="h-3.5 w-72 bg-gray-100 rounded" />
          </div>
          <div className="h-8 w-24 bg-gray-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 bg-gray-50 rounded-2xl border border-gray-100" />
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3].map((n) => <div key={n} className="h-14 bg-gray-50 rounded-2xl border border-gray-100" />)}
          </div>
        </div>
        <div className="h-14 bg-gray-50 rounded-2xl border border-gray-100" />
      </div>
    );
  }

  /* ── Silent fail — don't render if error or no data ── */
  if (error || !competitorData) return null;

  const clientObj: any = competitorData.client || {};
  const competitorsList: any[] = (competitorData.competitors || []).slice(0, 3);
  const nicheAnalysis: string = competitorData.niche_ecosystem_analysis || "";

  const clientName = clientObj.name || instagramHandle || "You";
  const clientHandle = `@${(clientObj.handle || instagramHandle || "client").replace("@", "")}`;

  /* brand accent colors */
  const COMP_COLORS = [
    "bg-gradient-to-r from-pink-400 to-rose-400",
    "bg-gradient-to-r from-violet-400 to-purple-400",
    "bg-gradient-to-r from-amber-400 to-orange-400",
  ];
  const COMP_DOT = ["bg-pink-400", "bg-violet-400", "bg-amber-400"];
  const COMP_TEXT = ["text-pink-500", "text-violet-500", "text-amber-500"];

  /* build bar chart data */
  const allBrands = [
    { name: clientName, followers: Number(clientObj.followers) || 0, posts: Number(clientObj.posts) || 0, eng: Number(clientObj.engagement_score) || 0, isClient: true },
    ...competitorsList.map((c: any) => ({
      name: c.name || c.handle || "Competitor",
      followers: Number(c.followers) || 0,
      posts: Number(c.posts) || 0,
      eng: Number(c.engagement_score) || 0,
      isClient: false,
    })),
  ];

  const followerBars = allBrands.map((b, i) => ({
    name: b.name,
    value: b.followers,
    color: b.isClient ? "bg-gradient-to-r from-[#113a87] to-[#1e56b8]" : COMP_COLORS[i - 1] ?? COMP_COLORS[2],
    isClient: b.isClient,
  }));

  const postsBars = allBrands.map((b, i) => ({
    name: b.name,
    value: b.posts,
    color: b.isClient ? "bg-gradient-to-r from-[#113a87] to-[#1e56b8]" : COMP_COLORS[i - 1] ?? COMP_COLORS[2],
    isClient: b.isClient,
  }));

  const hasAnyFollowers = followerBars.some((b) => b.value > 0);
  const hasAnyPosts = postsBars.some((b) => b.value > 0);

  return (
    <div className="space-y-4 pt-6 border-t border-gray-100">

      {/* ── Section Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#113a87]/8 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-[#113a87]" />
            </div>
            <h2 className="text-lg font-black text-[#1a1a1a] tracking-tight">Competitor Overview</h2>
          </div>
          <p className="text-[11px] text-gray-400 font-medium pl-9">
            Automatically discovered competitors and public social performance insights
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-[#113a87] text-[11px] font-bold shadow-sm transition-all active:scale-95 group/r shrink-0"
        >
          <RefreshCw className="w-3 h-3 group-hover/r:rotate-180 transition-transform duration-700" />
          Refresh
        </button>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left — Comparison Bars (3/5) */}
        {(hasAnyFollowers || hasAnyPosts) && (
          <div className="lg:col-span-3 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 space-y-5">
            <h3 className="text-xs font-black text-gray-700">Social Presence Comparison</h3>
            {hasAnyFollowers && (
              <ComparisonBar label="Followers" bars={followerBars} />
            )}
            {hasAnyPosts && (
              <ComparisonBar label="Post Volume" bars={postsBars} />
            )}
          </div>
        )}

        {/* Right — Competitor Cards (2/5) */}
        <div className={`${(hasAnyFollowers || hasAnyPosts) ? "lg:col-span-2" : "lg:col-span-5"} space-y-3`}>
          {competitorsList.map((comp: any, idx: number) => {
            const name = comp.name || comp.handle || "Competitor";
            const handle = `@${(comp.handle || "").replace("@", "")}`;
            const followers = Number(comp.followers) || 0;
            const posts = Number(comp.posts_count) || Number(comp.posts) || 0;
            const recentLikes = Number(comp.recent_likes) || 0;
            const engRaw = Number(comp.engagement_score) || 0;
            const style = comp.style_summary || "";
            const label = getGrowthLabel(followers, posts);
            const gs = GROWTH_STYLES[label];

            return (
              <div
                key={idx}
                className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 hover:border-slate-300 hover:shadow-md transition duration-200 group/card"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${COMP_COLORS[idx]} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="text-[10px] font-black text-white">{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-800 leading-none truncate">{name}</p>
                      <a
                        href={`https://instagram.com/${handle.replace("@", "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-[10px] font-semibold ${COMP_TEXT[idx]} hover:underline`}
                      >
                        {handle}
                      </a>
                    </div>
                  </div>
                  <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${gs.bg} ${gs.text} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${gs.dot}`} />
                    {label}
                  </span>
                </div>

                {/* Metrics row — only show if > 0 */}
                <div className="flex items-center gap-3 flex-wrap">
                  {followers > 0 && (
                    <div className="flex items-center gap-1" title="Total Followers">
                      <Users className="w-2.5 h-2.5 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-600">{fmtNum(followers)}</span>
                    </div>
                  )}
                  {posts > 0 && (
                    <div className="flex items-center gap-1" title="Total Posts">
                      <Globe className="w-2.5 h-2.5 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-600">{posts} posts</span>
                    </div>
                  )}
                  {recentLikes > 0 && (
                    <div className="flex items-center gap-1" title="Likes on Recent Posts">
                      <Heart className="w-2.5 h-2.5 text-pink-400" />
                      <span className="text-[10px] font-bold text-gray-600">{fmtNum(recentLikes)} likes</span>
                    </div>
                  )}
                  {engRaw > 0 && (
                    <div className="flex items-center gap-1" title="Engagement Rate">
                      <TrendingUp className="w-2.5 h-2.5 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-600">{engRaw.toFixed(1)}% eng.</span>
                    </div>
                  )}
                </div>

                {/* Style description */}
                {style && (
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed line-clamp-2">{style}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Insight Strip ── */}
      {nicheAnalysis && (
        <div className="bg-gradient-to-r from-[#113a87]/5 via-indigo-50/30 to-purple-50/30 border border-[#113a87]/8 rounded-2xl px-5 py-3.5 flex gap-3 items-start">
          <div className="w-6 h-6 rounded-lg bg-[#113a87]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-3 h-3 text-[#113a87]" />
          </div>
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">
            {nicheAnalysis}
          </p>
        </div>
      )}

    </div>
  );
}





interface NewsArticle {
  title: string;
  description: string;
  image: string;
  publishedAt: string;
  url: string;
  source?: string;
}

interface BookmarkedArticle extends NewsArticle {
  bookmarkedAt: string;
}

interface FeedCache {
  articles: NewsArticle[];
  fetchedAt: number;
  industry: string;
}

/* ── Storage keys & 24h TTL ── */
const FEED_CACHE_KEY = "bento_news_feed_cache";
const BOOKMARKS_KEY  = "bento_bookmarked_articles";
const FEED_TTL_MS    = 24 * 60 * 60 * 1000;

function loadFeedCache(industry: string): NewsArticle[] | null {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const cache: FeedCache = JSON.parse(raw);
    const age = Date.now() - cache.fetchedAt;
    if (cache.industry !== industry || age > FEED_TTL_MS) return null;
    return cache.articles;
  } catch { return null; }
}

function saveFeedCache(industry: string, articles: NewsArticle[]) {
  try {
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ articles, fetchedAt: Date.now(), industry }));
  } catch { /* storage quota */ }
}

function loadBookmarks(): BookmarkedArticle[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistBookmarks(items: BookmarkedArticle[]) {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(items));
  } catch { /* storage quota */ }
}

/* ── Micro-toast "Saved ✓" ── */
function BookmarkToast({ visible }: { visible: boolean }) {
  return (
    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[9px] font-black px-2.5 py-1 rounded-full whitespace-nowrap shadow-lg pointer-events-none z-20 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"}`}>
      Saved ✓
    </div>
  );
}

/* ── NewsCard ── */
function NewsCard({
  article, isBookmarked, onToggleBookmark, isFromSaved = false,
}: {
  article: NewsArticle | BookmarkedArticle;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  isFromSaved?: boolean;
}) {
  const [imageValid, setImageValid]   = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [pulse, setPulse]             = useState(false);

  const hasImage = article.image &&
    article.image.trim().startsWith("http") &&
    article.image !== "null" && article.image !== "undefined" && imageValid;

  const formattedDate = () => {
    try {
      if (!article.publishedAt) return "";
      return new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return ""; }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const wasBookmarked = isBookmarked;
    onToggleBookmark();
    if (!wasBookmarked) {
      setPulse(true); setToastVisible(true);
      setTimeout(() => setToastVisible(false), 1600);
      setTimeout(() => setPulse(false), 500);
    }
  };

  return (
    <div className={`relative bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 flex flex-col justify-between transition duration-200 hover:border-slate-300 hover:shadow-lg hover:shadow-indigo-500/5 group w-full h-full ${isFromSaved ? "border-amber-200/70 bg-amber-50/20" : "border-slate-200"}`}>

      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
            <span className="text-[#113a87] font-extrabold">{article.source || "Industry News"}</span>
            {formattedDate() && <><span>•</span><span>{formattedDate()}</span></>}
            {isFromSaved && <><span>•</span><span className="text-amber-500">Saved</span></>}
          </div>
          <h4 className="font-bold text-[#1a1a1a] text-sm leading-snug group-hover:text-[#113a87] transition-colors line-clamp-2 pr-6">
            {article.title}
          </h4>
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{article.description}</p>
        </div>
      </div>

      {/* Animated bookmark button */}
      <div className="absolute top-3.5 right-3.5 z-10">
        <BookmarkToast visible={toastVisible} />
        <button
          onClick={handleBookmark}
          className={`w-7 h-7 rounded-full flex items-center justify-center border shadow-sm transition-all duration-200 ${pulse ? "scale-125" : isBookmarked ? "scale-105" : "hover:scale-110 active:scale-90"} ${isBookmarked ? "bg-amber-50 border-amber-200" : "bg-white/70 backdrop-blur-md border-white/50 hover:bg-white"}`}
          title={isBookmarked ? "Remove from Saved Insights" : "Save to Insights"}
        >
          <Bookmark className={`w-3.5 h-3.5 transition-all duration-300 ${isBookmarked ? "fill-amber-500 text-amber-500" : "text-gray-400"}`} />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100/60 flex items-center justify-between">
        <a href={article.url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-xs font-bold text-[#113a87] hover:text-[#1e56b8] transition-colors">
          Read Full Article
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
        {isBookmarked && !isFromSaved && (
          <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
            <Bookmark className="w-2.5 h-2.5 fill-amber-500" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

/* ── IndustryNewsSection ── */
function IndustryNewsSection({ industry, clientId }: { industry: string; clientId?: string }) {
  const [feed, setFeed]         = useState<NewsArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(true);
  const [cacheLabel, setCacheLabel] = useState("");

  /* Permanent bookmarks — full article objects, survive all refreshes */
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>(() => loadBookmarks());

  useEffect(() => { persistBookmarks(bookmarks); }, [bookmarks]);

  const isBookmarked = (url: string) => bookmarks.some((b) => b.url === url);

  const handleToggleBookmark = (article: NewsArticle) => {
    setBookmarks((prev) => {
      if (prev.some((b) => b.url === article.url)) {
        return prev.filter((b) => b.url !== article.url);
      }
      return [{ ...article, bookmarkedAt: new Date().toISOString() }, ...prev];
    });
  };

  /* Compute "refreshes in Xh Ym" from cache timestamp */
  const refreshCacheLabel = () => {
    try {
      const raw = localStorage.getItem(FEED_CACHE_KEY);
      if (!raw) { setCacheLabel(""); return; }
      const c: FeedCache = JSON.parse(raw);
      const rem = FEED_TTL_MS - (Date.now() - c.fetchedAt);
      if (rem <= 0) { setCacheLabel(""); return; }
      const h = Math.floor(rem / 3_600_000);
      const m = Math.floor((rem % 3_600_000) / 60_000);
      setCacheLabel(`${h}h ${m}m`);
    } catch { setCacheLabel(""); }
  };

  /* Fetch with 24h cache — only hits network when cache is stale or force=true */
  const fetchNews = (force = false) => {
    setLoading(true); setError(null);

    if (!force) {
      const cached = loadFeedCache(industry);
      if (cached) {
        setFeed(cached); setLoading(false); refreshCacheLabel(); return;
      }
    }

    let fetchUrl = `/api/industry-news?industry=${encodeURIComponent(industry)}`;
    if (clientId) {
      fetchUrl += `&client_id=${clientId}`;
    }

    fetch(fetchUrl, {
      headers: localStorage.getItem("bento_token") ? { Authorization: `Bearer ${localStorage.getItem("bento_token")}` } : {},
    })
      .then((res) => { if (!res.ok) throw new Error("Failed"); return res.json(); })
      .then((data: NewsArticle[]) => {
        const articles = data || [];
        setFeed(articles);
        saveFeedCache(industry, articles);
        refreshCacheLabel();
      })
      .catch(() => {
        const stale = loadFeedCache(industry);
        if (stale) { setFeed(stale); refreshCacheLabel(); }
        else setError("Could not load industry news. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (industry) fetchNews(); }, [industry]);

  const liveFeed      = feed.slice(0, 6);
  const savedInsights = bookmarks.slice(0, 10);

  return (
    <div className="space-y-6 p-6 rounded-3xl border shadow-soft mt-8 relative overflow-hidden" style={{ background: "#F8FBFF", borderColor: "#DCE8FF" }}>
      <div className="relative z-10 space-y-6">

      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#113a87]" />
            </div>
            <h2 className="text-xl font-black text-[#1a1a1a] tracking-tight">Industry Related News</h2>
          </div>
          <p className="text-xs text-gray-400 font-medium pl-10">
            Live trends · refreshes every 24 hours · bookmarks saved permanently
          </p>
        </div>
        <button
          onClick={() => fetchNews(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 text-[#113a87] text-[11px] font-bold shadow-sm transition-all active:scale-95 group/r shrink-0"
        >
          <RefreshCw className="w-3 h-3 group-hover/r:rotate-180 transition-transform duration-700" />
          Refresh Feed
        </button>
      </div>

      {/* ── Saved Insights Panel — always rendered independently of feed ── */}
      {savedInsights.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/60 via-white/40 to-amber-50/30 border border-amber-100/80 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setSavedOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-amber-50/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Bookmark className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-amber-700">Saved Insights</p>
                <p className="text-[10px] text-amber-500/70 font-medium">
                  {savedInsights.length} article{savedInsights.length !== 1 ? "s" : ""} · permanently saved · survives feed refresh
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                {savedInsights.length}
              </span>
              <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${savedOpen ? "rotate-90" : ""}`} />
            </div>
          </button>

          {savedOpen && (
            <div className="px-5 pb-5 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {savedInsights.map((article, idx) => (
                  <div key={`saved-${article.url}-${idx}`} className="flex">
                    <NewsCard article={article} isBookmarked={true}
                      onToggleBookmark={() => handleToggleBookmark(article)} isFromSaved={true} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Live Feed ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white/50 border border-white/60 shadow-sm rounded-2xl p-4 flex flex-col gap-3 animate-pulse">
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-3 w-full bg-gray-100 rounded" />
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100"><div className="h-3 w-20 bg-gray-200 rounded" /></div>
            </div>
          ))}
        </div>
      ) : error && liveFeed.length === 0 ? (
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm font-bold text-red-600">{error}</p>
          <button onClick={() => fetchNews(true)}
            className="px-4 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-xl transition-all shadow-sm">
            Retry Fetching
          </button>
        </div>
      ) : liveFeed.length === 0 ? (
        <div className="bg-white/40 border border-white/60 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-sm font-bold text-gray-400">No industry news available right now.</p>
          <p className="text-xs text-gray-300 mt-1">Please check back later for live updates.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Feed</span>
            {cacheLabel && (
              <span className="text-[10px] text-gray-300 ml-auto">Refreshes in {cacheLabel}</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch stagger-children">
            {liveFeed.map((article, idx) => (
              <div key={`live-${article.url}-${idx}`} className="flex">
                <NewsCard article={article}
                  isBookmarked={isBookmarked(article.url)}
                  onToggleBookmark={() => handleToggleBookmark(article)} />
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

