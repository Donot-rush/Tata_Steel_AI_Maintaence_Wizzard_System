import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle,
  Cpu,
  Gauge,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { getOverview, simulateAnomaly } from "../lib/api";
import { Spinner } from "../components/UI";
import DigitalTwin3D from "../components/DigitalTwin3D";

const EMPTY_ASSETS = [];
const EMPTY_ALERTS = [];
const EMPTY_KPIS = {};

function ringPath(r, percent) {
  const c = 2 * Math.PI * r;
  return { c, offset: c * (1 - Math.max(0, Math.min(percent, 100)) / 100) };
}

function statusTone(status) {
  if (status === "critical") return "text-critical border-red-500/45 bg-red-500/10";
  if (status === "warning") return "text-warning border-amber-500/45 bg-amber-500/10";
  return "text-healthy border-emerald-500/35 bg-emerald-500/10";
}

function severityDot(severity) {
  if (severity === "critical") return "bg-red-400";
  if (severity === "warning") return "bg-amber-400";
  return "bg-blue-400";
}

function buildSectorSummary(assets) {
  const groups = assets.reduce((acc, asset) => {
    const key = asset.sector || "Plant";
    if (!acc[key]) {
      acc[key] = { sector: key, total: 0, healthy: 0, warning: 0, critical: 0, health: 0 };
    }
    acc[key].total += 1;
    acc[key][asset.status] = (acc[key][asset.status] || 0) + 1;
    acc[key].health += asset.health || 0;
    return acc;
  }, {});

  return Object.values(groups)
    .map((g) => ({ ...g, avg: Math.round(g.health / Math.max(g.total, 1)) }))
    .sort((a, b) => a.avg - b.avg);
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const load = async () => setData(await getOverview());

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const simulate = async () => {
    setBusy(true);
    await simulateAnomaly();
    await load();
    setBusy(false);
  };

  const assets = data?.assets || EMPTY_ASSETS;
  const kpis = data?.kpis || EMPTY_KPIS;
  const recent_alerts = data?.recent_alerts || EMPTY_ALERTS;
  const sectorSummary = useMemo(() => buildSectorSummary(assets), [assets]);

  if (!data) return <Spinner />;

  const { c, offset } = ringPath(46, kpis.avg_health);
  const degradedCount = kpis.warning + kpis.critical;

  const criticalAssets = assets
    .filter((a) => a.status !== "healthy")
    .sort((a, b) => {
      const rank = { critical: 0, warning: 1, healthy: 2 };
      return rank[a.status] - rank[b.status] || a.health - b.health;
    })
    .slice(0, 5);

  const lowestHealth = [...assets].sort((a, b) => a.health - b.health).slice(0, 4);
  const pickAsset = (code) => {
    const asset = assets.find((x) => x.code === code);
    if (asset) nav(`/equipment/${asset.id}`);
  };

  const metrics = [
    { label: "Assets", value: kpis.total_assets, Icon: Cpu, tone: "text-info", testid: "kpi-total-assets" },
    { label: "Healthy", value: kpis.healthy, Icon: CheckCircle, tone: "text-healthy", testid: "kpi-healthy" },
    { label: "Warning", value: kpis.warning, Icon: AlertTriangle, tone: "text-warning", testid: "kpi-warning" },
    { label: "Active Alerts", value: kpis.open_alerts, Icon: AlertOctagon, tone: "text-critical", testid: "kpi-active-alerts" },
  ];

  return (
    <div className="relative z-10 min-h-screen px-6 py-6 lg:px-8" data-testid="overview-page">
      <div className="mx-auto max-w-[1760px] space-y-5">
        <header className="grid gap-4 xl:grid-cols-[1fr_460px]">
          <section className="relative overflow-hidden rounded-md border border-slate-700/70 bg-[#08111f] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-cyan-300 via-emerald-300 to-red-400" />
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.26em] text-cyan">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 pulse-dot text-cyan-300" />
                  Tata Steel AI Platform / Plant Reliability Desk
                </div>
                <h1 className="text-3xl font-black leading-tight text-pri md:text-4xl">
                  Maintenance Command Dashboard
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-sec">
                  Live asset health, alerts, sector risk and MAESTRO actions in one operational board.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={simulate}
                  disabled={busy}
                  className="btn btn-secondary"
                  data-testid="simulate-anomaly-btn"
                >
                  <Sparkles size={14} />
                  {busy ? "Simulating" : "Simulate"}
                </button>
                <Link to="/wizard" className="btn btn-primary" data-testid="ask-wizard-cta">
                  <Bot size={15} />
                  Ask MAESTRO
                </Link>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, Icon, tone, testid }) => (
                <div
                  key={label}
                  className="rounded-md border border-slate-700/70 bg-[#0d1a2d] p-3"
                  data-testid={testid}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="label">{label}</span>
                    <Icon size={16} className={tone} />
                  </div>
                  <div className={`mt-3 font-mono text-3xl font-bold leading-none ${tone}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-5" data-testid="plant-health">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="label">Plant Health Index</div>
                <div className="mt-2 text-sm text-sec">
                  {degradedCount} asset{degradedCount !== 1 ? "s" : ""} need attention
                </div>
              </div>
              <span className="badge badge-info">15s refresh</span>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <div className="relative h-[124px] w-[124px] shrink-0">
                <svg width="124" height="124" viewBox="0 0 124 124">
                  <circle cx="62" cy="62" r="46" stroke="#1E293B" strokeWidth="12" fill="none" />
                  <circle
                    cx="62"
                    cy="62"
                    r="46"
                    stroke="#14B8A6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={c}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 62 62)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-bold text-pri">{kpis.avg_health}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-mut">/ 100</span>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div className="rounded border border-slate-700/70 bg-[#08111f] p-3">
                  <div className="label">MTBF</div>
                  <div className="mt-2 font-mono text-xl text-pri">{kpis.mtbf_hours}h</div>
                </div>
                <div className="rounded border border-slate-700/70 bg-[#08111f] p-3">
                  <div className="label">Uptime</div>
                  <div className="mt-2 font-mono text-xl text-healthy">{kpis.uptime_pct}%</div>
                </div>
              </div>
            </div>
          </section>
        </header>

        <section className="grid gap-5 2xl:grid-cols-[300px_1fr_390px]">
          <aside className="space-y-5">
            <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Route size={15} className="text-cyan" />
                  <span className="label text-cyan">Sector Pulse</span>
                </div>
                <Link to="/analytics" className="text-info" title="Open analytics">
                  <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="space-y-3">
                {sectorSummary.map((sector) => (
                  <div key={sector.sector}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-sec">{sector.sector}</span>
                      <span className="font-mono text-pri">{sector.avg}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-300 to-emerald-400"
                        style={{ width: `${sector.avg}%` }}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-mut">
                      <span>{sector.total} assets</span>
                      <span>{sector.critical} critical</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
              <div className="mb-4 flex items-center gap-2">
                <Gauge size={15} className="text-warning" />
                <span className="label text-warning">Lowest Health</span>
              </div>
              <div className="space-y-2">
                {lowestHealth.map((asset) => (
                  <Link
                    to={`/equipment/${asset.id}`}
                    key={asset.id}
                    className="block rounded border border-slate-700/70 bg-[#08111f] px-3 py-2 transition hover:border-cyan-400/60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-pri">{asset.code}</span>
                      <span className={`font-mono text-sm ${asset.health < 50 ? "text-critical" : "text-warning"}`}>
                        {asset.health}%
                      </span>
                    </div>
                    <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-mut">
                      {asset.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <main className="min-h-[520px] overflow-hidden rounded-md border border-slate-700/70 bg-[#08111f]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <Radio size={15} className="text-cyan" />
                <span className="label text-cyan">Interactive Digital Twin</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-healthy">{kpis.healthy} Operational</span>
                <span className="badge badge-warning">{kpis.warning} Watch</span>
                <span className="badge badge-critical">{kpis.critical} Critical</span>
              </div>
            </div>
            <div className="relative h-[480px]" data-testid="digital-twin-3d">
              <DigitalTwin3D assets={assets} onPick={pickAsset} />
            </div>
          </main>

          <aside className="space-y-5">
            <div className="rounded-md border border-red-500/35 bg-[#180f16] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-critical" />
                  <span className="label text-critical">Critical Attention</span>
                </div>
                <Link to="/alerts" className="font-mono text-[10px] uppercase tracking-wider text-info">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {criticalAssets.map((asset) => (
                  <Link
                    to={`/equipment/${asset.id}`}
                    key={asset.id}
                    data-testid={`critical-asset-${asset.code}`}
                    className={`block rounded border px-3 py-3 transition hover:translate-x-1 ${statusTone(asset.status)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-pri">{asset.name}</div>
                        <div className="mt-1 truncate font-mono text-[10px] uppercase tracking-wider text-mut">
                          {asset.location}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-lg font-bold">{asset.health}%</div>
                        <div className="font-mono text-[10px] uppercase text-mut">RUL {asset.rul_days}d</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck size={15} className="text-healthy" />
                <span className="label text-healthy">Action Stack</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/scheduler" className="rounded border border-slate-700/70 bg-[#08111f] p-3 hover:border-cyan-400/60">
                  <Wrench size={16} className="mb-3 text-cyan" />
                  <div className="text-sm font-semibold text-pri">Plan Work</div>
                  <div className="mt-1 text-xs text-mut">Scheduler</div>
                </Link>
                <Link to="/inventory" className="rounded border border-slate-700/70 bg-[#08111f] p-3 hover:border-cyan-400/60">
                  <Zap size={16} className="mb-3 text-warning" />
                  <div className="text-sm font-semibold text-pri">Spares Risk</div>
                  <div className="mt-1 text-xs text-mut">Inventory</div>
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={15} className="text-cyan" />
                <span className="label text-cyan">Live Telemetry Stream</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-mut">Refresh / 15s</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {recent_alerts.slice(0, 6).map((alert) => (
                <Link
                  to="/alerts"
                  key={alert.id}
                  data-testid={`alert-row-${alert.id}`}
                  className="rounded border border-slate-700/70 bg-[#08111f] p-3 transition hover:border-cyan-400/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${severityDot(alert.severity)}`} />
                        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-mut">
                          {alert.asset_name}
                        </span>
                      </div>
                      <div className="truncate text-sm font-semibold text-pri">{alert.title}</div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-[10px] uppercase text-mut">
                      {new Date(alert.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Bot size={15} className="text-purple" />
              <span className="label text-purple">MAESTRO Readiness</span>
            </div>
            <div className="space-y-3 text-sm text-sec">
              <div className="flex items-center justify-between rounded border border-slate-700/70 bg-[#08111f] p-3">
                <span>Open critical alerts</span>
                <span className="font-mono text-critical">{kpis.critical_alerts}</span>
              </div>
              <div className="flex items-center justify-between rounded border border-slate-700/70 bg-[#08111f] p-3">
                <span>Assets under watch</span>
                <span className="font-mono text-warning">{degradedCount}</span>
              </div>
              <Link to="/wizard" className="btn btn-secondary mt-1 w-full">
                <Bot size={14} />
                Start Diagnostic Session
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
