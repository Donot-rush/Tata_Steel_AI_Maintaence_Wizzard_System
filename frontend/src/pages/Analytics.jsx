import React, { useEffect, useState } from "react";
import { getAnalytics } from "../lib/api";
import { Spinner } from "../components/UI";
import { BarChart3, Clock, Minus, TrendingDown, TrendingUp } from "lucide-react";

function TrendIcon({ trend }) {
  if (trend === "worsening") return <span className="flex items-center gap-1 text-critical"><TrendingDown size={12} /> worsening</span>;
  if (trend === "improving") return <span className="flex items-center gap-1 text-healthy"><TrendingUp size={12} /> improving</span>;
  return <span className="flex items-center gap-1 text-cyan"><Minus size={12} /> stable</span>;
}

function buildLeaderboard() {
  const rows = [
    ["Blast Furnace Cooling Pump #1", "Blast Furnace", 47, "worsening", 41, 18],
    ["Main Drive Motor MD-12", "Rolling Mill", 36, "worsening", 52, 8],
    ["Steam Turbine Generator", "Power Plant", 33, "worsening", 58, 6],
    ["Coke Conveyor C-07", "Coke Oven", 41, "worsening", 45, 12],
    ["Sintering Strand #1", "Sinter Plant", 44, "worsening", 39, 14],
    ["Hot Blast Blower", "Blast Furnace", 62, "stable", 21, 45],
    ["Hydraulic Pump HP-04", "Rolling Mill", 58, "stable", 28, 22],
    ["LD Converter Vessel #1", "Steel Melting", 54, "stable", 24, 28],
  ];
  return rows.map(([name, area, health, trend, fail_pct, rul], i) => ({
    rank: i + 1,
    name,
    area,
    health,
    trend,
    fail_pct,
    rul,
    degradation: Math.max(0, 100 - health),
  }));
}

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  if (!data) return <Spinner />;

  const leaderboard = buildLeaderboard();

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="analytics-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="label mb-2 flex items-center gap-2 text-cyan">
          <BarChart3 size={14} /> Performance Intelligence
        </div>
        <h1 className="text-3xl font-black text-pri md:text-4xl">ROI Control Tower</h1>
        <p className="mt-2 text-sm text-sec">
          Fleet scoring, avoided-loss economics, and degradation ranking for maintenance decisions.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="label text-cyan">Health Scoreboard</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-mut">{data.rows.length} assets</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.rows.map((r) => (
              <div key={r.asset_id} className="rounded-md border border-slate-700 bg-[#08111f] p-3" data-testid={`analytics-${r.code}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-pri">{r.asset_name}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mut">{r.code}</div>
                  </div>
                  <div className="font-mono text-2xl text-pri">{r.score}</div>
                </div>
                <div className="mt-3 h-12 border-l border-b border-slate-700 px-1">
                  <div className="bar-tiny !h-10">
                    {r.bars.map((v, i) => (
                      <div key={i} style={{ height: `${v}%`, opacity: 0.45 + i * 0.07 }} />
                    ))}
                  </div>
                </div>
                <div className="mt-3 font-mono text-[11px]"><TrendIcon trend={r.trend} /></div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-md border border-emerald-400/35 bg-emerald-400/10 p-5">
            <div className="label text-healthy">Prevented Impact</div>
            <div className="mt-3 font-mono text-5xl text-healthy">
              ${data.cost.avoided_losses_usd.toLocaleString()}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mut">avoided losses - last 30d</div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded border border-slate-700 bg-[#08111f] p-3">
                <div className="font-mono text-xl text-pri">{data.cost.prevented_downtime_hours}h</div>
                <div className="label mt-1">Downtime</div>
              </div>
              <div className="rounded border border-slate-700 bg-[#08111f] p-3">
                <div className="font-mono text-xl text-pri">${(data.cost.maintenance_cost_usd / 1000).toFixed(0)}K</div>
                <div className="label mt-1">Maint.</div>
              </div>
              <div className="rounded border border-slate-700 bg-[#08111f] p-3">
                <div className="font-mono text-xl text-info">{data.cost.roi_multiplier}x</div>
                <div className="label mt-1">ROI</div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Clock size={14} className="text-warning" />
              <span className="label text-warning">Cost Assumptions</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded border border-red-500/30 bg-red-500/10 p-3">
                <span className="text-sm text-sec">Unplanned downtime/hr</span>
                <span className="font-mono text-critical">${data.cost.unplanned_per_hr.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded border border-emerald-500/30 bg-emerald-500/10 p-3">
                <span className="text-sm text-sec">Planned maintenance</span>
                <span className="font-mono text-healthy">${data.cost.avg_planned_cost.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-5 rounded-md border border-slate-700/70 bg-[#101827] p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label text-critical">Degradation Queue</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-mut">highest intervention value first</span>
        </div>
        <div className="hidden grid-cols-[50px_2fr_1fr_110px_110px_100px_90px] gap-3 border-b border-d px-3 py-2 label md:grid">
          <span>#</span><span>Asset</span><span>Area</span><span>Health</span><span>Trend</span><span>30d Fail</span><span>RUL</span>
        </div>
        <div className="space-y-2">
          {leaderboard.map((r) => (
            <div key={r.rank} className="grid gap-3 rounded border border-slate-700 bg-[#08111f] px-3 py-3 text-sm md:grid-cols-[50px_2fr_1fr_110px_110px_100px_90px]" data-testid={`leaderboard-${r.rank}`}>
              <span className="font-mono font-bold text-critical">{r.rank}</span>
              <span className="font-semibold text-pri">{r.name}</span>
              <span className="text-sec">{r.area}</span>
              <span className={r.health < 50 ? "font-mono text-critical" : "font-mono text-warning"}>{r.health}%</span>
              <span className="font-mono text-[11px]"><TrendIcon trend={r.trend} /></span>
              <span className="font-mono text-warning">{r.fail_pct}%</span>
              <span className="font-mono text-pri">{r.rul}d</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
