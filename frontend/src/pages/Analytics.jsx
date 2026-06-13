import React, { useEffect, useState } from "react";
import { getAnalytics } from "../lib/api";
import { Card, Spinner } from "../components/UI";
import { Clock, TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";

function TrendIcon({ trend }) {
  if (trend === "worsening") return <span className="flex items-center gap-1 text-critical font-mono text-[11px]"><TrendingDown size={12} /> worsening</span>;
  if (trend === "improving") return <span className="flex items-center gap-1 text-healthy font-mono text-[11px]"><TrendingUp size={12} /> improving</span>;
  return <span className="flex items-center gap-1 text-healthy font-mono text-[11px]"><Minus size={12} /> stable</span>;
}

// Synthetic leaderboard data — 15 rows
function buildLeaderboard(rows) {
  const sectorMap = {
    "Furnace": "Blast Furnace", "Cooling System": "Blast Furnace",
    "Rolling Mill": "Rolling Mill", "Gearbox": "Rolling Mill",
    "Hydraulic Pump": "Rolling Mill",
    "Conveyor": "Steel Melting Shop", "Motor": "Rolling Mill",
    "Crane": "Steel Melting Shop",
  };
  const extra = [
    { name: "Blast Furnace Cooling Pump #1", area: "Blast Furnace", rul: 2509 },
    { name: "Blast Furnace Cooling Pump #2", area: "Blast Furnace", rul: 2509 },
    { name: "Hot Blast Blower", area: "Blast Furnace", rul: 3333 },
    { name: "BF Hydraulic System", area: "Blast Furnace", rul: 2083 },
    { name: "Raw Material Conveyor Belt", area: "Blast Furnace", rul: 1875 },
    { name: "LD Converter Vessel #1", area: "Steel Melting Shop", rul: 4166 },
    { name: "Continuous Caster #1", area: "Steel Melting Shop", rul: 2916 },
    { name: "Ladle Furnace", area: "Steel Melting Shop", rul: 2708 },
    { name: "EOT Crane #1 (250T)", area: "Steel Melting Shop", rul: 3750 },
    { name: "Argon Stirring Pump", area: "Steel Melting Shop", rul: 1666 },
    { name: "Rolling Mill Drive Motor", area: "Rolling Mill", rul: 3125 },
    { name: "Mill Gearbox #1", area: "Rolling Mill", rul: 2291 },
    { name: "Roughing Stand", area: "Rolling Mill", rul: 2083 },
    { name: "Finishing Stand #1", area: "Rolling Mill", rul: 2083 },
    { name: "Cooling Bed System", area: "Rolling Mill", rul: 1875 },
  ];
  return extra.map((e, i) => ({
    rank: i + 1, name: e.name, area: e.area, health: 88,
    degradation: 0, trend: "stable", fail_pct: 10, rul: e.rul,
  }));
}

export default function Analytics() {
  const [data, setData] = useState(null);
  useEffect(() => { getAnalytics().then(setData); }, []);
  if (!data) return <Spinner />;

  const leaderboard = buildLeaderboard(data.rows);

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative z-10" data-testid="analytics-page">
      <div className="mb-6">
        <div className="label mb-1">PERFORMANCE INTELLIGENCE</div>
        <h1 className="text-4xl font-black tracking-tight" style={{
          background: "linear-gradient(90deg, #60A5FA, #A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Analytics & ROI</h1>
        <p className="text-sec text-sm mt-1">Predictive maintenance impact, fleet scoring, and downtime cost analysis.</p>
      </div>

      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 lg:col-span-8">
          <Card title={<span className="flex items-center gap-2"><BarChart3 size={14} className="text-info" /> ASSET HEALTH SCORES</span>}>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.rows.map((r) => (
                <div key={r.asset_id} className="bg-[#131C33] border border-d rounded-xl p-4" data-testid={`analytics-${r.code}`}>
                  <div className="flex items-center justify-between">
                    <div className="text-pri font-semibold text-sm truncate pr-2">{r.asset_name}</div>
                    <span className="w-2 h-2 rounded-full bg-info pulse-dot text-info" />
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <div className="font-mono text-3xl font-light text-pri">{r.score}</div>
                    <TrendIcon trend={r.trend} />
                  </div>
                  <div className="bar-tiny mt-3">
                    {r.bars.map((v, i) => (
                      <div key={i} style={{ height: `${v}%`, opacity: 0.3 + i * 0.1 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card title="PREVENTED IMPACT" className="card-glow-teal">
            <div className="font-mono text-5xl font-light text-healthy">
              ${data.cost.avoided_losses_usd.toLocaleString()}
            </div>
            <div className="label mt-1">avoided losses · last 30d</div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <div className="font-mono text-2xl text-pri">{data.cost.prevented_downtime_hours}h</div>
                <div className="label">Prevented downtime</div>
              </div>
              <div>
                <div className="font-mono text-2xl text-pri">${(data.cost.avoided_losses_usd/1000).toFixed(0)}K</div>
                <div className="label">Avoided losses</div>
              </div>
              <div>
                <div className="font-mono text-2xl text-pri">${(data.cost.maintenance_cost_usd/1000).toFixed(0)}K</div>
                <div className="label">Maint. cost</div>
              </div>
            </div>
          </Card>

          <Card title={<span className="flex items-center gap-2"><Clock size={14} className="text-info" /> COST ANALYSIS BREAKDOWN</span>}>
            <div className="space-y-3">
              <div className="bg-[#1C0F18] border border-red-500/30 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sec text-sm">Unplanned Downtime Cost/Hr</span>
                <span className="font-mono text-xl text-critical">${data.cost.unplanned_per_hr.toLocaleString()}</span>
              </div>
              <div className="bg-[#0F1C18] border border-emerald-500/30 rounded-lg p-4 flex items-center justify-between">
                <span className="text-sec text-sm">Avg Planned Maint. Cost</span>
                <span className="font-mono text-xl text-healthy">${data.cost.avg_planned_cost.toLocaleString()}</span>
              </div>
              <div className="bg-[#131C33] border border-d rounded-lg p-4 flex items-center justify-between">
                <span className="text-sec text-sm">ROI Multiplier</span>
                <span className="font-mono text-xl text-info">{data.cost.roi_multiplier}x</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Health Degradation Leaderboard */}
      <Card title={<span className="flex items-center gap-2"><TrendingDown size={14} className="text-critical" /> HEALTH DEGRADATION LEADERBOARD</span>}
            action={<span className="text-mut text-xs font-mono">Top 15 fastest degrading assets</span>}>
        <div className="grid grid-cols-[40px_2fr_1.5fr_1fr_120px_120px_80px_80px] gap-3 label py-3 border-b border-d">
          <span>#</span><span>ASSET</span><span>AREA</span><span>HEALTH</span>
          <span>DEGRADATION</span><span>TREND</span><span>30D FAIL %</span><span>RUL</span>
        </div>
        {leaderboard.map((r) => (
          <div key={r.rank} className="grid grid-cols-[40px_2fr_1.5fr_1fr_120px_120px_80px_80px] gap-3 py-3 border-b border-d/40 items-center text-sm"
               data-testid={`leaderboard-${r.rank}`}>
            <span className="font-mono text-critical font-bold">{r.rank}</span>
            <span className="text-pri font-semibold">{r.name}</span>
            <span className="text-sec text-xs">{r.area}</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#1E293B] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.health}%` }} />
              </div>
              <span className="font-mono text-healthy text-xs">{r.health}%</span>
            </div>
            <span className="font-mono text-mut">{r.degradation}</span>
            <TrendIcon trend={r.trend} />
            <span className="font-mono text-healthy text-xs">{r.fail_pct}%</span>
            <span className="font-mono text-healthy text-xs">{r.rul}d</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
