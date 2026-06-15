import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ackAlert, getRiskMatrix, listAlerts, simulateAnomaly } from "../lib/api";
import { Spinner, StatusBadge } from "../components/UI";
import { Check, Radar, Sparkles } from "lucide-react";

const SEV = ["all", "critical", "warning", "info"];

function RiskMatrix({ data }) {
  if (!data) return null;
  const cells = {};
  data.points.forEach((p) => {
    const key = `${p.severity}-${p.urgency}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(p);
  });
  const sevRows = [3, 2, 1];
  const urgCols = [1, 2, 3];
  const cellColor = (s, u) => {
    const score = s + u;
    if (score >= 6) return "border-red-500/40 bg-red-500/10";
    if (score >= 5) return "border-amber-500/40 bg-amber-500/10";
    if (score >= 3) return "border-blue-500/40 bg-blue-500/10";
    return "border-emerald-500/40 bg-emerald-500/10";
  };

  return (
    <div className="space-y-2" data-testid="risk-matrix">
      <div className="grid grid-cols-[70px_1fr_1fr_1fr] gap-2 label text-center">
        <span />
        <span>Low urg</span>
        <span>Med urg</span>
        <span>High urg</span>
      </div>
      {sevRows.map((s) => (
        <div key={s} className="grid grid-cols-[70px_1fr_1fr_1fr] gap-2">
          <div className="label flex items-center justify-end pr-2">{s === 3 ? "Critical" : s === 2 ? "Warning" : "Healthy"}</div>
          {urgCols.map((u) => {
            const items = cells[`${s}-${u}`] || [];
            return (
              <div key={u} className={`min-h-[110px] rounded border p-2 ${cellColor(s, u)}`} data-testid={`risk-cell-${s}-${u}`}>
                {items.map((it) => (
                  <Link key={it.asset_id} to={`/equipment/${it.asset_id}`} className="mb-1 block rounded border border-slate-700 bg-[#08111f] px-2 py-1.5 hover:border-cyan-400/50">
                    <div className="font-mono text-[10px] text-mut">{it.code}</div>
                    <div className="truncate text-xs font-semibold text-pri">{it.asset_name}</div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [sev, setSev] = useState("all");
  const [risk, setRisk] = useState(null);

  const load = useCallback(async () => {
    const params = sev === "all" ? {} : { severity: sev };
    setAlerts(await listAlerts(params));
    setRisk(await getRiskMatrix());
  }, [sev]);

  useEffect(() => {
    load();
  }, [load]);

  const ack = async (id) => {
    await ackAlert(id);
    load();
  };
  const simulate = async () => {
    await simulateAnomaly();
    load();
  };

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="alerts-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="label mb-2 flex items-center gap-2 text-cyan">
              <Radar size={14} /> Abnormality Queue
            </div>
            <h1 className="text-3xl font-black text-pri md:text-4xl">Alerts & Risk Radar</h1>
            <p className="mt-2 text-sm text-sec">Live alert triage with severity filtering, acknowledgement and RUL-derived risk mapping.</p>
          </div>
          <button className="btn btn-secondary" onClick={simulate} data-testid="simulate-btn">
            <Sparkles size={14} /> Simulate
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_500px]">
        <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="label text-cyan">Alert Stream</span>
            <div className="flex gap-1">
              {SEV.map((s) => (
                <button key={s} data-testid={`filter-${s}`} onClick={() => setSev(s)} className={`btn !px-3 !py-1 !text-[11px] ${sev === s ? "btn-primary" : "btn-ghost"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {!alerts && <Spinner />}
          {alerts && alerts.length === 0 && (
            <div className="py-6 text-center font-mono text-sm text-sec">No alerts matching this filter.</div>
          )}
          <div className="space-y-2" data-testid="alert-stream">
            {alerts && alerts.map((al) => (
              <div key={al.id} data-testid={`alert-${al.id}`} className="grid gap-3 rounded-md border border-slate-700 bg-[#08111f] p-4 md:grid-cols-[1fr_150px_110px]">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={al.severity} />
                    <Link to={`/equipment/${al.asset_id}`} className="label hover:text-cyan">{al.asset_name}</Link>
                  </div>
                  <div className="font-bold text-pri">{al.title}</div>
                  <div className="mt-1 text-sm text-sec">{al.message}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {al.evidence.map((e) => <span key={e} className="badge badge-info">{e}</span>)}
                  </div>
                </div>
                <div className="font-mono text-xs text-mut">{new Date(al.created_at).toLocaleString()}</div>
                <div className="text-right">
                  {!al.acknowledged ? (
                    <button data-testid={`ack-${al.id}`} onClick={() => ack(al.id)} className="btn btn-secondary !py-1.5">
                      <Check size={12} /> Ack
                    </button>
                  ) : (
                    <span className="badge badge-healthy">Acknowledged</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-4">
            <div className="label text-warning">Risk Matrix</div>
            <p className="mt-1 text-xs text-mut">Severity x urgency from asset health and remaining useful life.</p>
          </div>
          <RiskMatrix data={risk} />
        </aside>
      </div>
    </div>
  );
}
