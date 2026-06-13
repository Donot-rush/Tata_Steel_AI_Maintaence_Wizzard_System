import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { listAssets, getAsset, getRecommendations } from "../lib/api";
import { Card, StatusBadge, Spinner } from "../components/UI";
import { SensorChart, HealthGauge } from "../components/Charts";
import { Cpu, MapPin, Factory, Calendar, Zap, ArrowRight, Search, Filter, Radio } from "lucide-react";

const SECTOR_FILTERS = [
  { id: "all", label: "All" },
  { id: "Blast Furnace", label: "Blast Furnace" },
  { id: "Steel Melting Shop", label: "Steel Melting" },
  { id: "Rolling Mill", label: "Rolling Mill" },
  { id: "Coke Oven", label: "Coke Oven" },
  { id: "Sinter Plant", label: "Sinter Plant" },
  { id: "Power Plant", label: "Power Plant" },
];

function statusLabel(s) {
  if (s === "healthy") return "OPERATIONAL";
  if (s === "warning") return "DEGRADED";
  return "CRITICAL";
}

function healthGradient(h) {
  // 0 -> red, 50 -> amber, 100 -> green/teal
  if (h >= 70) return "linear-gradient(90deg, #10B981, #22D3EE)";
  if (h >= 50) return "linear-gradient(90deg, #F59E0B, #F97316)";
  return "linear-gradient(90deg, #EF4444, #F97316)";
}

function FleetCard({ a }) {
  return (
    <Link to={`/equipment/${a.id}`} data-testid={`fleet-card-${a.code}`}
          className="bg-[#0F172A] border border-d rounded-xl p-4 hover:border-blue-500/40 transition relative overflow-hidden">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <Cpu size={14} className="text-info" />
          </div>
          <div className="font-semibold text-pri">{a.name}</div>
        </div>
        <span className={`badge ${a.status === "healthy" ? "badge-healthy" : a.status === "warning" ? "badge-warning" : "badge-critical"}`}>
          {statusLabel(a.status)}
        </span>
      </div>
      <div className="text-xs text-sec mb-4">{a.location} · {a.category}</div>

      <div className="flex items-center justify-between text-xs text-sec">
        <span>Health Score</span>
        <span className={`font-mono font-bold ${
          a.health >= 70 ? "text-healthy" : a.health >= 50 ? "text-warning" : "text-critical"
        }`}>{a.health}.0%</span>
      </div>
      <div className="h-2 bg-[#1E293B] rounded-full mt-1.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${a.health}%`, background: healthGradient(a.health) }} />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
        <div>
          <div className="label">Criticality</div>
          <div className="text-critical font-semibold mt-1 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-red-500" /> {a.criticality.toUpperCase()}
          </div>
        </div>
        <div>
          <div className="label">Risk Level</div>
          <div className="mt-1">
            <span className={`badge ${a.status === "healthy" ? "badge-healthy" : a.status === "warning" ? "badge-warning" : "badge-critical"} !text-[9px] !py-0.5`}>
              {a.status === "critical" ? "CRITICAL" : a.status === "warning" ? "HIGH" : "LOW"}
            </span>
          </div>
        </div>
        <div>
          <div className="label">Asset ID</div>
          <div className="font-mono text-pri mt-1">{a.code}</div>
        </div>
      </div>
    </Link>
  );
}

export default function Equipment() {
  const { id } = useParams();
  const nav = useNavigate();
  const [assets, setAssets] = useState([]);
  const [detail, setDetail] = useState(null);
  const [recs, setRecs] = useState(null);
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [liveTick, setLiveTick] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => { listAssets().then(setAssets); }, []);

  useEffect(() => {
    if (!id) return;
    setDetail(null); setRecs(null); setLiveTick(null);
    getAsset(id).then(setDetail);
    getRecommendations(id).then(setRecs);
    const t = setInterval(() => getAsset(id).then(setDetail), 15000);

    // Open WebSocket for live sensor ticks
    try {
      const url = process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws") + `/api/ws/sensors/${id}`;
      const ws = new WebSocket(url);
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.type === "tick") setLiveTick(m);
        } catch (e) { /* noop */ }
      };
      wsRef.current = ws;
    } catch (e) { console.warn("WS open failed", e); }

    return () => {
      clearInterval(t);
      try { wsRef.current?.close(); } catch { /* noop */ }
    };
  }, [id]);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (sector !== "all" && a.sector !== sector) return false;
      if (q && !`${a.name} ${a.code} ${a.category} ${a.sector || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [assets, q, sector]);

  // If a detail asset is requested, show the detail layout below the fleet
  return (
    <div className="p-8 max-w-[1600px] mx-auto relative z-10" data-testid="equipment-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight" style={{
            background: "linear-gradient(90deg, #60A5FA, #A78BFA)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Equipment Fleet</h1>
          <p className="text-sec text-sm mt-2">{assets.length} assets monitoring active across 6 sectors</p>
        </div>
        {/* Quick-jump asset selector */}
        <div className="flex items-center gap-2">
          <span className="label">JUMP TO ASSET</span>
          <select
            data-testid="asset-quick-jump"
            value={id || ""}
            onChange={(e) => e.target.value && nav(`/equipment/${e.target.value}`)}
            className="input !py-2 !w-80 bg-[#0B1224] border-blue-500/40 hover:border-blue-400"
          >
            <option value="">— Select asset —</option>
            {[...assets].sort((a, b) => a.code.localeCompare(b.code)).map((a) => {
              const ind = a.status === "critical" ? "🔴" : a.status === "warning" ? "🟡" : "🟢";
              return (
                <option key={a.id} value={a.id}>
                  {ind} {a.code} · {a.name} ({a.sector || a.category})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Search + sector pills */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input
              data-testid="fleet-search"
              className="input pl-9"
              placeholder="Search fleet (ID, Name, Type)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Filter size={14} className="text-mut" />
          {SECTOR_FILTERS.map((f) => {
            const cnt = f.id === "all" ? assets.length : assets.filter((a) => a.sector === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setSector(f.id)}
                data-testid={`sector-pill-${f.id}`}
                className={`btn !px-3 !py-1.5 !text-xs ${sector === f.id ? "btn-primary" : "btn-secondary"}`}
              >
                {f.label} ({cnt})
              </button>
            );
          })}
        </div>
      </Card>

      {/* Fleet grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {filtered.map((a) => <FleetCard key={a.id} a={a} />)}
        {filtered.length === 0 && (
          <div className="col-span-full text-sec text-sm text-center py-10">No assets match filters.</div>
        )}
      </div>

      {/* Asset detail (when selected via URL) */}
      {id && detail && (
        <div className="space-y-6 mt-2" data-testid="asset-detail">
          <Card>
            <div className="flex flex-wrap gap-6 items-start">
              <HealthGauge value={detail.asset.health} />
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="label">{detail.asset.code}</span>
                  <StatusBadge status={detail.asset.status} />
                  <span className="badge badge-info">{detail.asset.criticality} criticality</span>
                </div>
                <h2 className="text-2xl font-bold text-pri">{detail.asset.name}</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-sec"><MapPin size={14} /> <span>{detail.asset.location}</span></div>
                  <div className="flex items-center gap-2 text-sec"><Factory size={14} /> <span>{detail.asset.manufacturer}</span></div>
                  <div className="flex items-center gap-2 text-sec"><Cpu size={14} /> <span className="font-mono">{detail.asset.model}</span></div>
                  <div className="flex items-center gap-2 text-sec"><Calendar size={14} /> <span className="font-mono">Installed {detail.asset.installed}</span></div>
                </div>
              </div>
              <div className="text-right">
                <div className="label">Remaining Useful Life</div>
                <div className="font-mono text-4xl font-light text-pri mt-1">
                  {detail.asset.rul_days}<span className="text-mut text-base">d</span>
                </div>
                <Link to={`/wizard?asset=${detail.asset.id}`} className="btn btn-primary mt-4" data-testid="ask-wizard-btn">
                  <Zap size={14} /> Ask AI Wizard
                </Link>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: "Vibration", unit: "mm/s", color: "#EF4444", data: detail.sensors.vibration, live: liveTick?.vibration },
              { title: "Temperature", unit: "°C", color: "#F59E0B", data: detail.sensors.temperature, live: liveTick?.temperature },
              { title: "Pressure", unit: "bar", color: "#3B82F6", data: detail.sensors.pressure, live: liveTick?.pressure },
              { title: "Current", unit: "A", color: "#10B981", data: detail.sensors.current, live: liveTick?.current },
            ].map((s) => (
              <Card key={s.title}
                    title={
                      <span className="flex items-center gap-2">
                        {s.title} · {s.unit}
                        {liveTick && (
                          <span className="badge badge-healthy !text-[9px] !py-0.5">
                            <Radio size={10} /> LIVE
                          </span>
                        )}
                      </span>
                    }
                    data-testid={`sensor-${s.title.toLowerCase()}`}>
                {s.data && s.data.length > 0 ? (
                  <>
                    <SensorChart data={s.data} color={s.color} unit={s.unit} label={s.title} />
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-d">
                      <div className="label">{s.live != null ? "LIVE TICK" : "LATEST"}</div>
                      <div className="font-mono text-pri">
                        {s.live != null ? s.live : s.data[s.data.length - 1].v} <span className="text-mut text-xs">{s.unit}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-mut text-sm py-8 text-center font-mono">No data</div>
                )}
              </Card>
            ))}
          </div>

          {recs && (
            <Card title="RECOMMENDED ACTIONS" testid="recommendations-card">
              <div className="space-y-3">
                {recs.plan.map((p, i) => (
                  <div key={i} className="bg-[#131C33] border border-d rounded-lg p-4" data-testid={`rec-${p.priority}`}>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`badge ${
                        p.priority === "immediate" ? "badge-critical" :
                        p.priority === "short-term" ? "badge-warning" :
                        p.priority === "long-term" ? "badge-info" : "badge-healthy"
                      }`}>{p.priority}</span>
                      <ArrowRight size={14} className="text-mut" />
                      <span className="text-pri font-semibold">{p.title}</span>
                    </div>
                    <div className="text-sec text-sm ml-1">{p.detail}</div>
                    <div className="label mt-2">ETA · {p.eta_hours}h</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
