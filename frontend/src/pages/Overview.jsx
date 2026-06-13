import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOverview, simulateAnomaly } from "../lib/api";
import { Spinner } from "../components/UI";
import DigitalTwin3D from "../components/DigitalTwin3D";
import {
  Cpu, CheckCircle, AlertTriangle, AlertOctagon, Zap, Activity, Sparkles,
  ArrowUpRight, Radio, Boxes, Wrench, Bot,
} from "lucide-react";

function ringPath(r, percent) {
  const c = 2 * Math.PI * r;
  return { c, offset: c * (1 - percent / 100) };
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const load = async () => setData(await getOverview());
  useEffect(() => { load(); const id = setInterval(load, 15000); return () => clearInterval(id); }, []);

  if (!data) return <Spinner />;
  const { kpis, assets, recent_alerts } = data;
  const { offset } = ringPath(58, kpis.avg_health);

  const simulate = async () => { setBusy(true); await simulateAnomaly(); await load(); setBusy(false); };
  const pickAsset = (code) => {
    const a = assets.find((x) => x.code === code);
    if (a) nav(`/equipment/${a.id}`);
  };

  return (
    <div className="px-8 py-6 max-w-[1700px] mx-auto relative z-10" data-testid="overview-page">
      {/* HUD header — diagonal split */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-1 h-12 rounded-full" style={{background: "linear-gradient(180deg, #22D3EE, #8B5CF6)"}} />
          <div>
            <div className="font-mono text-[10px] tracking-[0.32em] text-cyan uppercase">TATA · STEEL · OPS · COMMAND</div>
            <h1 className="text-3xl font-black text-pri">Plant Dashboard <span className="text-cyan-400">/</span> Live</h1>
          </div>
        </div>
        <button onClick={simulate} disabled={busy} className="btn btn-secondary" data-testid="simulate-anomaly-btn">
          <Sparkles size={13} /> Simulate
        </button>
      </div>

      {/* BENTO MOSAIC */}
      <div className="grid grid-cols-12 grid-rows-[auto_auto_auto] gap-4">
        {/* 3D Digital Twin — wide hero */}
        <div className="col-span-12 lg:col-span-8 row-span-2 card !p-0 overflow-hidden relative" style={{ height: 460 }} data-testid="digital-twin-3d">
          <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 pulse-dot text-cyan-400" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-cyan uppercase">DIGITAL TWIN · 3D PLANT VIEW</span>
          </div>
          <div className="absolute top-3 right-4 z-10 flex items-center gap-3 text-mut font-mono text-[10px]">
            <span>DRAG · ROTATE</span><span>·</span><span>SCROLL · ZOOM</span><span>·</span><span>CLICK · INSPECT</span>
          </div>
          <DigitalTwin3D assets={assets} onPick={pickAsset} />
          <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3">
            <span className="badge badge-healthy">{kpis.healthy} OPERATIONAL</span>
            <span className="badge badge-warning">{kpis.warning} DEGRADED</span>
            <span className="badge badge-critical">{kpis.critical} CRITICAL</span>
          </div>
        </div>

        {/* Plant Health ring — tall right */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 card card-glow-purple p-6 row-span-2 flex flex-col items-center justify-center text-center" data-testid="plant-health">
          <div className="label mb-2">PLANT HEALTH INDEX</div>
          <div className="relative">
            <svg width="200" height="200">
              <defs>
                <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="58" stroke="#1E293B" strokeWidth="10" fill="none" />
              <circle cx="100" cy="100" r="58" stroke="url(#hg)" strokeWidth="10" fill="none"
                strokeDasharray={2*Math.PI*58} strokeDashoffset={offset} strokeLinecap="round"
                transform="rotate(-90 100 100)" />
              {/* Tick marks */}
              {Array.from({length: 24}).map((_,i) => (
                <line key={i} x1="100" y1="20" x2="100" y2="26"
                      stroke="#334155" strokeWidth="1"
                      transform={`rotate(${i*15} 100 100)`} />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-mono text-5xl font-bold text-pri">{kpis.avg_health}</div>
              <div className="font-mono text-[10px] tracking-widest text-mut">/ 100</div>
            </div>
          </div>
          <div className="text-sec text-sm mt-4">
            {kpis.warning + kpis.critical} asset{kpis.warning + kpis.critical !== 1 ? "s" : ""} need attention
          </div>
          <Link to="/wizard" className="btn btn-primary mt-4" data-testid="ask-wizard-cta">
            <Bot size={14} /> Consult MAESTRO
          </Link>
        </div>

        {/* KPI strip — 4 micro tiles */}
        {[
          { l: "TOTAL ASSETS", v: kpis.total_assets, Icon: Cpu, c: "text-info", bg: "rgba(59,130,246,0.12)" },
          { l: "HEALTHY",      v: kpis.healthy,      Icon: CheckCircle, c: "text-healthy", bg: "rgba(16,185,129,0.12)" },
          { l: "WARNING",      v: kpis.warning,      Icon: AlertTriangle, c: "text-warning", bg: "rgba(245,158,11,0.12)" },
          { l: "ACTIVE ALERTS", v: kpis.open_alerts, Icon: AlertOctagon, c: "text-critical", bg: "rgba(239,68,68,0.12)" },
        ].map((k, i) => {
          const { Icon } = k;
          return (
            <div key={i} className="col-span-6 sm:col-span-3 lg:col-span-2 card p-4 flex items-center gap-3" data-testid={`kpi-${k.l.toLowerCase().replace(" ","-")}`}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background: k.bg}}>
                <Icon size={18} className={k.c} />
              </div>
              <div>
                <div className="font-mono text-2xl text-pri font-bold leading-none">{k.v}</div>
                <div className="label mt-1">{k.l}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lower row: floating insight panels */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* Critical assets attention — angled stripe */}
        <div className="col-span-12 lg:col-span-5 card !p-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1" style={{background:"linear-gradient(90deg, #EF4444, #F97316, transparent)"}} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-critical" />
                <span className="label text-critical">CRITICAL ATTENTION</span>
              </div>
              <Link to="/alerts" className="text-[10px] text-info font-mono uppercase tracking-wider">View all →</Link>
            </div>
            <div className="space-y-2">
              {assets.filter(a => a.status !== "healthy").slice(0, 4).map((a) => (
                <Link to={`/equipment/${a.id}`} key={a.id} data-testid={`critical-asset-${a.code}`}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#0B1224] border-l-2 hover:bg-[#131C33] transition"
                      style={{borderLeftColor: a.status === "critical" ? "#EF4444" : "#F59E0B"}}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full pulse-dot"
                          style={{ background: a.status === "critical" ? "#EF4444" : "#F59E0B",
                                   color: a.status === "critical" ? "#EF4444" : "#F59E0B" }} />
                    <div className="min-w-0">
                      <div className="text-pri text-sm font-semibold truncate">{a.name}</div>
                      <div className="font-mono text-[10px] text-mut">{a.location} · RUL {a.rul_days}d</div>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-bold ${a.status === "critical" ? "text-critical" : "text-warning"}`}>{a.health}%</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Live ticker — long horizontal scroll */}
        <div className="col-span-12 lg:col-span-7 card !p-0 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1" style={{background:"linear-gradient(90deg, #22D3EE, #3B82F6, #8B5CF6)"}} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-cyan" />
                <span className="label text-cyan">LIVE TELEMETRY · STREAM</span>
              </div>
              <span className="font-mono text-[10px] text-mut">refresh · 15s</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recent_alerts.slice(0, 4).map((al) => (
                <div key={al.id} data-testid={`alert-row-${al.id}`} className="bg-[#0B1224] border border-d rounded p-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${al.severity === "critical" ? "bg-red-400" : al.severity === "warning" ? "bg-amber-400" : "bg-blue-400"}`} />
                      <span className="font-mono text-[10px] text-mut uppercase truncate">{al.asset_name}</span>
                    </div>
                    <div className="text-sm text-pri truncate">{al.title}</div>
                  </div>
                  <div className="font-mono text-[10px] text-mut shrink-0">
                    {new Date(al.created_at).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
