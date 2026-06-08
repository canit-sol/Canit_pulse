import { useState, useEffect } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

/* ── Types ─────────────────────────────────────────── */

interface RadarDataPoint {
  axis: string;
  client: number;
  industry: number;
  rawValue?: string;
}

interface RadarResponse {
  client: Record<string, number>;
  industry: Record<string, number>;
  raw_values: Record<string, string>;
  industry_name: string;
  brand_name: string;
  found: boolean;
}

interface Props {
  clientId?: string;
  brandName: string;
}

const AXIS_MAP: { key: string; label: string }[] = [
  { key: "engagement", label: "Engagement" },
  { key: "frequency",  label: "Frequency" },
  { key: "reach",      label: "Reach" },
  { key: "quality",    label: "Quality" },
  { key: "growth",     label: "Growth" },
];

function authHeaders() {
  const token = localStorage.getItem("bento_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ── Custom Tooltip ────────────────────────────────── */

function RadarTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 text-sm min-w-[160px]">
      <p className="font-black text-[#1a1a1a] mb-2 text-xs uppercase tracking-wider">{d.axis}</p>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full bg-[#113a87]" />
        <span className="text-gray-500 text-xs">You</span>
        <span className="ml-auto font-black text-[#113a87]">{d.client}</span>
        {d.rawValue && <span className="text-[10px] text-gray-400">({d.rawValue})</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-transparent" />
        <span className="text-gray-500 text-xs">Industry</span>
        <span className="ml-auto font-bold text-gray-400">{d.industry}</span>
      </div>
    </div>
  );
}

/* ── Custom Axis Tick ──────────────────────────────── */

function CustomAxisTick({ x, y, payload }: any) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        textAnchor="middle"
        dy={4}
        className="fill-gray-500"
        style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}
      >
        {payload.value}
      </text>
    </g>
  );
}

/* ── Main Component ────────────────────────────────── */

export default function PerformanceBenchmark({ clientId, brandName }: Props) {
  const [data, setData] = useState<RadarDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [industryName, setIndustryName] = useState("");

  useEffect(() => {
    if (!clientId) { setLoading(false); return; }

    fetch(`/api/clients/${clientId}/radar`, { headers: authHeaders() })
      .then(res => res.json())
      .then((resp: RadarResponse) => {
        const points = AXIS_MAP.map(({ key, label }) => ({
          axis: label,
          client: resp.client[key] ?? 0,
          industry: resp.industry[key] ?? 0,
          rawValue: resp.raw_values?.[key] ?? "",
        }));
        setData(points);
        setFound(resp.found);
        setIndustryName(resp.industry_name);
      })
      .catch(err => {
        console.error("Radar fetch failed:", err);
        setData(AXIS_MAP.map(({ label }) => ({ axis: label, client: 0, industry: 0 })));
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm col-span-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#113a87]/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#113a87]" />
          </div>
          <div>
            <h3 className="font-black text-[#1a1a1a] leading-none">Performance Radar</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {found
                ? `vs ${industryName} industry standard`
                : loading
                  ? "Fetching metrics..."
                  : "Industry benchmark not configured yet"}
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="h-72 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 animate-spin text-[#113a87] mb-3" />
          <p className="font-bold text-gray-400 text-sm">Loading Benchmarks...</p>
          <p className="text-xs text-gray-300 mt-1">Computing performance metrics</p>
        </div>
      )}

      {/* Chart */}
      {!loading && data.length > 0 && (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
                <PolarGrid
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  gridType="polygon"
                />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={<CustomAxisTick />}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />

                {/* Industry Standard — grey dashed outline */}
                <Radar
                  name="Industry Standard"
                  dataKey="industry"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="transparent"
                  dot={false}
                />

                {/* Client — vibrant blue fill */}
                <Radar
                  name={brandName || "You"}
                  dataKey="client"
                  stroke="#113a87"
                  strokeWidth={2.5}
                  fill="rgba(17,58,135,0.2)"
                  fillOpacity={1}
                  dot={{ r: 4, fill: "#113a87", stroke: "#fff", strokeWidth: 2 }}
                />

                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-8 mt-1 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#113a87] shadow-md shadow-[#113a87]/30" />
              <span className="text-xs font-bold text-[#1a1a1a]">{brandName || "Your Brand"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-gray-300 bg-transparent" />
              <span className="text-xs text-gray-400 font-medium">Industry Standard</span>
            </div>
          </div>

          {/* No industry data notice */}
          {!found && (
            <p className="text-center text-[10px] text-gray-300 mt-2">
              Industry benchmark data not available yet — showing client metrics only
            </p>
          )}
        </>
      )}

      {/* Empty — no client ID */}
      {!loading && !clientId && (
        <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <TrendingUp className="w-10 h-10 text-gray-200 mb-3" />
          <p className="font-bold text-gray-400 text-sm">Performance data unavailable</p>
        </div>
      )}
    </div>
  );
}
