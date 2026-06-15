import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getAsset, getRecommendations, listAssets } from "../lib/api";
import { Card, Spinner, StatusBadge } from "../components/UI";
import { HealthGauge, SensorChart } from "../components/Charts";
import {
  ArrowRight,
  Calendar,
  Cpu,
  Factory,
  Filter,
  MapPin,
  Radio,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Wrench,
  Zap,
} from "lucide-react";

const SECTOR_FILTERS = [
  { id: "all", label: "All" },
  { id: "Blast Furnace", label: "Blast Furnace" },
  { id: "Steel Melting Shop", label: "Steel Melting" },
  { id: "Rolling Mill", label: "Rolling Mill" },
  { id: "Coke Oven", label: "Coke Oven" },
  { id: "Sinter Plant", label: "Sinter Plant" },
  { id: "Power Plant", label: "Power Plant" },
];

function statusLabel(status) {
  if (status === "healthy") return "Stable";
  if (status === "warning") return "Watch";
  return "Critical";
}

function healthTone(health) {
  if (health >= 70) return "text-healthy";
  if (health >= 50) return "text-warning";
  return "text-critical";
}

function statusBorder(status) {
  if (status === "critical") return "border-red-500/45 bg-red-500/10";
  if (status === "warning") return "border-amber-500/45 bg-amber-500/10";
  return "border-emerald-500/35 bg-emerald-500/10";
}

function FleetRow({ asset }) {
  return (
    <Link
      to={`/equipment/${asset.id}`}
      data-testid={`fleet-card-${asset.code}`}
      className={`grid gap-3 rounded-md border px-4 py-3 transition hover:translate-x-1 hover:border-cyan-400/60 md:grid-cols-[1.7fr_1fr_90px_110px_90px] ${statusBorder(asset.status)}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-700 bg-[#08111f]">
            <Cpu size={14} className="text-cyan" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-pri">{asset.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-mut">
              {asset.code} - {asset.category}
            </div>
          </div>
        </div>
      </div>
      <div className="truncate text-sm text-sec">{asset.location}</div>
      <div className={`font-mono text-sm font-bold ${healthTone(asset.health)}`}>
        {asset.health}.0%
      </div>
      <div className="h-2 self-center overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${
            asset.health >= 70 ? "bg-emerald-400" : asset.health >= 50 ? "bg-amber-400" : "bg-red-400"
          }`}
          style={{ width: `${asset.health}%` }}
        />
      </div>
      <div className="text-right">
        <span className={`badge ${asset.status === "healthy" ? "badge-healthy" : asset.status === "warning" ? "badge-warning" : "badge-critical"}`}>
          {statusLabel(asset.status)}
        </span>
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

  useEffect(() => {
    listAssets().then(setAssets);
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    setDetail(null);
    setRecs(null);
    setLiveTick(null);
    getAsset(id).then(setDetail);
    getRecommendations(id).then(setRecs);
    const t = setInterval(() => getAsset(id).then(setDetail), 15000);

    try {
      const url = process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws") + `/api/ws/sensors/${id}`;
      const ws = new WebSocket(url);
      ws.onmessage = (ev) => {
        try {
          const m = JSON.parse(ev.data);
          if (m.type === "tick") setLiveTick(m);
        } catch (e) {
          /* noop */
        }
      };
      wsRef.current = ws;
    } catch (e) {
      console.warn("WS open failed", e);
    }

    return () => {
      clearInterval(t);
      try {
        wsRef.current?.close();
      } catch {
        /* noop */
      }
    };
  }, [id]);

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (sector !== "all" && a.sector !== sector) return false;
      if (q && !`${a.name} ${a.code} ${a.category} ${a.sector || ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [assets, q, sector]);

  const totals = useMemo(() => ({
    total: assets.length,
    healthy: assets.filter((a) => a.status === "healthy").length,
    warning: assets.filter((a) => a.status === "warning").length,
    critical: assets.filter((a) => a.status === "critical").length,
  }), [assets]);

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="equipment-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="label mb-2 flex items-center gap-2 text-cyan">
              <Wrench size={14} /> Fleet Reliability Registry
            </div>
            <h1 className="text-3xl font-black text-pri md:text-4xl">Equipment Command Board</h1>
            <p className="mt-2 text-sm text-sec">
              {assets.length} active assets across plant sectors with live health, RUL and risk routing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["Total", totals.total, "text-info"],
              ["Stable", totals.healthy, "text-healthy"],
              ["Watch", totals.warning, "text-warning"],
              ["Critical", totals.critical, "text-critical"],
            ].map(([label, value, tone]) => (
              <div key={label} className="min-w-[110px] rounded border border-slate-700 bg-[#101827] px-3 py-2">
                <div className="label">{label}</div>
                <div className={`font-mono text-2xl font-bold ${tone}`}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[260px_1fr_360px]">
        <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={14} className="text-cyan" />
            <span className="label text-cyan">Sector Filter</span>
          </div>
          <div className="grid gap-2">
            {SECTOR_FILTERS.map((f) => {
              const cnt = f.id === "all" ? assets.length : assets.filter((a) => a.sector === f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setSector(f.id)}
                  data-testid={`sector-pill-${f.id}`}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-left text-sm transition ${
                    sector === f.id
                      ? "border-cyan-400/60 bg-cyan-400/10 text-pri"
                      : "border-slate-700 bg-[#08111f] text-sec hover:border-cyan-400/40"
                  }`}
                >
                  <span>{f.label}</span>
                  <span className="font-mono text-xs text-mut">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
              <input
                data-testid="fleet-search"
                className="input pl-9"
                placeholder="Search asset code, name, category or sector..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              data-testid="asset-quick-jump"
              value={id || ""}
              onChange={(e) => e.target.value && nav(`/equipment/${e.target.value}`)}
              className="input !w-full md:!w-80"
            >
              <option value="">Jump to asset</option>
              {[...assets].sort((a, b) => a.code.localeCompare(b.code)).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name} ({a.sector || a.category})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-2 hidden grid-cols-[1.7fr_1fr_90px_110px_90px] gap-3 px-4 py-2 label md:grid">
            <span>Asset</span><span>Location</span><span>Health</span><span>Load Bar</span><span className="text-right">State</span>
          </div>
          <div className="max-h-[580px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {filtered.map((a) => <FleetRow key={a.id} asset={a} />)}
            {filtered.length === 0 && (
              <div className="py-10 text-center font-mono text-sm text-sec">No assets match filters.</div>
            )}
          </div>
        </div>

        <div className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-warning" />
            <span className="label text-warning">Selected Dossier</span>
          </div>
          {detail ? (
            <div className="space-y-4" data-testid="asset-detail">
              <div className="rounded border border-slate-700 bg-[#08111f] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="label">{detail.asset.code}</div>
                    <h2 className="mt-1 text-xl font-black text-pri">{detail.asset.name}</h2>
                  </div>
                  <StatusBadge status={detail.asset.status} />
                </div>
                <div className="mt-4 flex justify-center">
                  <HealthGauge value={detail.asset.health} size={130} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-sec">
                  <div className="flex items-center gap-2"><MapPin size={13} />{detail.asset.location}</div>
                  <div className="flex items-center gap-2"><Factory size={13} />{detail.asset.manufacturer}</div>
                  <div className="flex items-center gap-2"><Cpu size={13} />{detail.asset.model}</div>
                  <div className="flex items-center gap-2"><Calendar size={13} />{detail.asset.installed}</div>
                </div>
                <div className="mt-4 rounded border border-slate-700 bg-[#101827] p-3">
                  <div className="label">Remaining Useful Life</div>
                  <div className="mt-1 font-mono text-3xl text-pri">
                    {detail.asset.rul_days}<span className="text-sm text-mut"> days</span>
                  </div>
                </div>
                <Link to={`/wizard?asset=${detail.asset.id}`} className="btn btn-primary mt-4 w-full" data-testid="ask-wizard-btn">
                  <Zap size={14} /> Ask FORGEOPS Sentinel
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded border border-slate-700 bg-[#08111f] p-5 text-sm leading-6 text-sec">
              Select any asset row to open its telemetry dossier, recommendations, and AI handoff.
            </div>
          )}
        </div>
      </div>

      {id && detail && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              { title: "Vibration", unit: "mm/s", color: "#EF4444", data: detail.sensors.vibration, live: liveTick?.vibration },
              { title: "Temperature", unit: "C", color: "#F59E0B", data: detail.sensors.temperature, live: liveTick?.temperature },
              { title: "Pressure", unit: "bar", color: "#3B82F6", data: detail.sensors.pressure, live: liveTick?.pressure },
              { title: "Current", unit: "A", color: "#10B981", data: detail.sensors.current, live: liveTick?.current },
            ].map((s) => (
              <Card
                key={s.title}
                title={
                  <span className="flex items-center gap-2">
                    {s.title} - {s.unit}
                    {liveTick && <span className="badge badge-healthy !py-0.5 !text-[9px]"><Radio size={10} /> LIVE</span>}
                  </span>
                }
                testid={`sensor-${s.title.toLowerCase()}`}
              >
                {s.data && s.data.length > 0 ? (
                  <>
                    <SensorChart data={s.data} color={s.color} unit={s.unit} label={s.title} />
                    <div className="mt-3 flex items-center justify-between border-t border-d pt-3">
                      <div className="label">{s.live != null ? "Live Tick" : "Latest"}</div>
                      <div className="font-mono text-pri">
                        {s.live != null ? s.live : s.data[s.data.length - 1].v} <span className="text-xs text-mut">{s.unit}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center font-mono text-sm text-mut">No data</div>
                )}
              </Card>
            ))}
          </div>

          {recs && (
            <Card title={<span className="flex items-center gap-2"><ShieldAlert size={14} className="text-warning" /> SENTINEL RECOMMENDED ACTIONS</span>} testid="recommendations-card">
              <div className="grid gap-3 md:grid-cols-2">
                {recs.plan.map((p, i) => (
                  <div key={i} className="rounded-md border border-slate-700 bg-[#08111f] p-4" data-testid={`rec-${p.priority}`}>
                    <div className="mb-2 flex items-center gap-3">
                      <span className={`badge ${
                        p.priority === "immediate" ? "badge-critical" :
                        p.priority === "short-term" ? "badge-warning" :
                        p.priority === "long-term" ? "badge-info" : "badge-healthy"
                      }`}>{p.priority}</span>
                      <ArrowRight size={14} className="text-mut" />
                    </div>
                    <div className="font-semibold text-pri">{p.title}</div>
                    <div className="mt-2 text-sm text-sec">{p.detail}</div>
                    <div className="label mt-3">ETA - {p.eta_hours}h</div>
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
