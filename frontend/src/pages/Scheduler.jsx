import React, { useEffect, useState } from "react";
import { getScheduler } from "../lib/api";
import { Card, Spinner } from "../components/UI";
import { Wrench, User, Clock, ShieldCheck, Send } from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function PriorityCell({ task, onClick, selected }) {
  const cls = task.priority === "critical" ? "gantt-critical"
    : task.priority === "warning" ? "gantt-warning" : "gantt-info";
  return (
    <button
      onClick={onClick}
      data-testid={`gantt-task-${task.id}`}
      className={`gantt-cell ${cls} ${selected ? "ring-2 ring-blue-400" : ""} text-left w-full`}
    >
      {task.scope.length > 22 ? task.scope.slice(0, 22) + "…" : task.scope}
    </button>
  );
}

export default function Scheduler() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  useEffect(() => {
    getScheduler().then((d) => { setData(d); if (d.tasks.length) setSel(d.tasks[0]); });
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative z-10" data-testid="scheduler-page">
      <div className="mb-6">
        <div className="label mb-1">DYNAMIC GANTT SCHEDULER</div>
        <h1 className="text-4xl font-black tracking-tight" style={{
          background: "linear-gradient(90deg, #60A5FA, #A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>7-Day Maintenance Plan</h1>
        <p className="text-sec text-sm mt-1">AI-prioritized timeline based on asset health risks and spares logistics.</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <Card>
            <div className="grid grid-cols-[2fr_repeat(7,1fr)] gap-2 items-center">
              <div className="label">ASSET DESCRIPTION</div>
              {DAYS.map((d) => (
                <div key={d} className="label text-center">{d}</div>
              ))}
            </div>
            <div className="divider my-3" />
            {data.tasks.map((t) => (
              <div key={t.id} className="grid grid-cols-[2fr_repeat(7,1fr)] gap-2 items-center py-2 border-b border-d/40">
                <div>
                  <div className="text-pri text-sm font-semibold truncate">{t.asset_name}</div>
                  <div className="font-mono text-[10px] text-mut">{t.location} · {t.code}</div>
                </div>
                {DAYS.map((d, i) => (
                  <div key={d}>
                    {i === t.day_idx ? (
                      <PriorityCell task={t} onClick={() => setSel(t)} selected={sel?.id === t.id} />
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4">
          {sel && (
            <Card className="card-glow-purple">
              <div className="flex flex-col gap-4">
                <span className={`badge ${sel.priority === "critical" ? "badge-critical" : sel.priority === "warning" ? "badge-warning" : "badge-info"} w-fit`}>
                  {sel.priority} priority
                </span>
                <div>
                  <div className="text-2xl font-bold text-pri">{sel.asset_name}</div>
                  <div className="font-mono text-xs text-mut mt-1">Asset ID: {sel.code}</div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-sec text-xs">
                      <Wrench size={13} className="text-purple" />
                      <span className="label">Scope of work</span>
                    </div>
                    <div className="text-pri mt-1">{sel.scope}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sec text-xs">
                      <User size={13} className="text-purple" />
                      <span className="label">Assigned engineer</span>
                    </div>
                    <div className="text-pri mt-1">{sel.engineer}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sec text-xs">
                      <Clock size={13} className="text-purple" />
                      <span className="label">Estimated downtime</span>
                    </div>
                    <div className="text-pri mt-1 font-mono">{sel.downtime_hours} Hours</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sec text-xs">
                      <ShieldCheck size={13} className="text-purple" />
                      <span className="label">Spare parts verification</span>
                    </div>
                    <div className="mt-1">
                      <span className="badge badge-healthy">IN STOCK</span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary mt-2" data-testid="dispatch-btn">
                  <Send size={14} /> Dispatch Technician
                </button>
                <button className="btn btn-secondary" data-testid="telemetry-btn">
                  View Telemetry Stream
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
