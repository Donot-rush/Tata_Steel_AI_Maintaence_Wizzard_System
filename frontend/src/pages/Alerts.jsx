import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAlerts, ackAlert, simulateAnomaly, getRiskMatrix } from "../lib/api";
import { Card, StatusBadge, Spinner } from "../components/UI";
import { Check, Sparkles } from "lucide-react";

const SEV = ["all", "critical", "warning", "info"];

function RiskMatrix({ data }) {
  if (!data) return null;
  // 3x3: rows = severity (3 top, 1 bottom), cols = urgency (3 right)
  const cells = {};
  data.points.forEach((p) => {
    const key = `${p.severity}-${p.urgency}`;
    if (!cells[key]) cells[key] = [];
    cells[key].push(p);
  });
  const sevRows = [3, 2, 1]; // top to bottom
  const urgCols = [1, 2, 3]; // left to right
  const cellColor = (s, u) => {
    const score = s + u;
    if (score >= 6) return "bg-red-500/10 border-red-500/40";
    if (score >= 5) return "bg-amber-500/10 border-amber-500/40";
    if (score >= 3) return "bg-blue-500/10 border-blue-500/40";
    return "bg-emerald-500/10 border-emerald-500/40";
  };
  return (
    <div className="grid grid-cols-[60px_1fr] gap-2" data-testid="risk-matrix">
      <div />
      <div className="grid grid-cols-3 gap-1 label text-center">
        <div>Low urg</div><div>Med urg</div><div>High urg</div>
      </div>
      {sevRows.map((s, i) => (
        <React.Fragment key={s}>
          <div className="label flex items-center justify-end pr-2">
            {s === 3 ? "Critical" : s === 2 ? "Warning" : "Healthy"}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {urgCols.map((u) => {
              const items = cells[`${s}-${u}`] || [];
              return (
                <div
                  key={u}
                  className={`border ${cellColor(s, u)} p-2 min-h-[90px]`}
                  data-testid={`risk-cell-${s}-${u}`}
                >
                  {items.map((it) => (
                    <Link
                      key={it.asset_id}
                      to={`/equipment/${it.asset_id}`}
                      className="block bg-[#0D111A] border border-d px-2 py-1.5 mb-1 hover:border-brand"
                    >
                      <div className="font-mono text-[10px] text-mut">{it.code}</div>
                      <div className="text-xs text-pri truncate">{it.asset_name}</div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState(null);
  const [sev, setSev] = useState("all");
  const [risk, setRisk] = useState(null);

  const load = async () => {
    const params = sev === "all" ? {} : { severity: sev };
    setAlerts(await listAlerts(params));
    setRisk(await getRiskMatrix());
  };

  useEffect(() => { load(); }, [sev]);

  const ack = async (id) => { await ackAlert(id); load(); };
  const simulate = async () => { await simulateAnomaly(); load(); };

  return (
    <div className="p-8 max-w-[1600px] mx-auto" data-testid="alerts-page">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="label mb-1">ABNORMALITY DETECTION · LIVE</div>
          <h1 className="text-4xl font-black tracking-tight text-pri">Alerts & Risk</h1>
        </div>
        <button className="btn btn-secondary" onClick={simulate} data-testid="simulate-btn">
          <Sparkles size={14} /> Simulate
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card
            title="ALERT STREAM"
            action={
              <div className="flex gap-1">
                {SEV.map((s) => (
                  <button
                    key={s}
                    data-testid={`filter-${s}`}
                    onClick={() => setSev(s)}
                    className={`btn ${sev === s ? "btn-primary" : "btn-ghost"} !px-3 !py-1 !text-[11px]`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            }
          >
            {!alerts && <Spinner />}
            {alerts && alerts.length === 0 && (
              <div className="text-sec text-sm py-6 text-center font-mono">
                No alerts matching this filter.
              </div>
            )}
            <div className="space-y-2" data-testid="alert-stream">
              {alerts && alerts.map((al) => (
                <div
                  key={al.id}
                  data-testid={`alert-${al.id}`}
                  className="bg-[#0D111A] border border-d p-4 flex items-start gap-4"
                  style={{
                    borderLeft: `3px solid ${
                      al.severity === "critical" ? "#EF4444" :
                      al.severity === "warning" ? "#F59E0B" : "#3B82F6"
                    }`,
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={al.severity} />
                      <Link to={`/equipment/${al.asset_id}`} className="label hover:text-brand">
                        {al.asset_name}
                      </Link>
                      <span className="text-mut text-xs font-mono ml-auto">
                        {new Date(al.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-pri font-semibold mt-1.5">{al.title}</div>
                    <div className="text-sec text-sm mt-1">{al.message}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {al.evidence.map((e) => (
                        <span key={e} className="badge badge-info">{e}</span>
                      ))}
                    </div>
                  </div>
                  {!al.acknowledged ? (
                    <button
                      data-testid={`ack-${al.id}`}
                      onClick={() => ack(al.id)}
                      className="btn btn-secondary !py-1.5"
                    >
                      <Check size={12} /> Ack
                    </button>
                  ) : (
                    <span className="badge badge-healthy">Acknowledged</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <Card title="RISK MATRIX · SEVERITY × URGENCY">
            <RiskMatrix data={risk} />
            <div className="text-xs text-mut mt-4 font-mono">
              Urgency is derived from Remaining Useful Life (RUL).<br />
              Lower-left = healthy, top-right = imminent action required.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
