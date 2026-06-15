import React, { useEffect, useState } from "react";
import { getScheduler } from "../lib/api";
import { Spinner } from "../components/UI";
import { CalendarDays, Clock, Send, ShieldCheck, User, Wrench } from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function priorityClasses(priority) {
  if (priority === "critical") return "border-red-400/50 bg-red-500/15 text-red-200";
  if (priority === "warning") return "border-amber-400/50 bg-amber-500/15 text-amber-100";
  return "border-blue-400/50 bg-blue-500/15 text-blue-100";
}

export default function Scheduler() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);

  useEffect(() => {
    getScheduler().then((d) => {
      setData(d);
      if (d.tasks.length) setSel(d.tasks[0]);
    });
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="scheduler-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="label mb-2 flex items-center gap-2 text-cyan">
          <CalendarDays size={14} /> Maintenance Dispatch Scheduler
        </div>
        <h1 className="text-3xl font-black text-pri md:text-4xl">7-Day Work Order Runway</h1>
        <p className="mt-2 text-sm text-sec">
          AI-prioritized work orders arranged by day, asset risk, engineer assignment and spares readiness.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-4 grid grid-cols-7 gap-2">
            {DAYS.map((d) => (
              <div key={d} className="rounded border border-slate-700 bg-[#08111f] p-3 text-center">
                <div className="font-mono text-sm font-bold text-pri">{d}</div>
                <div className="mt-1 font-mono text-[10px] text-mut">
                  {data.tasks.filter((t) => DAYS[t.day_idx] === d).length} jobs
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {data.tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSel(task)}
                data-testid={`gantt-task-${task.id}`}
                className={`grid w-full gap-3 rounded-md border px-4 py-3 text-left transition hover:translate-x-1 md:grid-cols-[120px_1.5fr_1fr_120px] ${
                  sel?.id === task.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-[#08111f]"
                }`}
              >
                <div>
                  <div className="label">Day</div>
                  <div className="mt-1 font-mono text-pri">{DAYS[task.day_idx]}</div>
                </div>
                <div className="min-w-0">
                  <div className="truncate font-bold text-pri">{task.asset_name}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mut">
                    {task.location} - {task.code}
                  </div>
                </div>
                <div className="truncate text-sm text-sec">{task.scope}</div>
                <div className="text-right">
                  <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${priorityClasses(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside>
          {sel && (
            <div className="rounded-md border border-slate-700/70 bg-[#101827] p-5">
              <span className={`rounded border px-3 py-1 font-mono text-[11px] uppercase tracking-wider ${priorityClasses(sel.priority)}`}>
                {sel.priority} priority
              </span>
              <h2 className="mt-5 text-2xl font-black text-pri">{sel.asset_name}</h2>
              <div className="mt-1 font-mono text-xs uppercase tracking-wider text-mut">Asset ID: {sel.code}</div>

              <div className="mt-6 space-y-4">
                {[
                  [Wrench, "Scope of work", sel.scope],
                  [User, "Assigned engineer", sel.engineer],
                  [Clock, "Estimated downtime", `${sel.downtime_hours} Hours`],
                  [ShieldCheck, "Spare parts verification", "In stock"],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="rounded border border-slate-700 bg-[#08111f] p-3">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-cyan" />
                      <span className="label text-cyan">{label}</span>
                    </div>
                    <div className="mt-2 text-pri">{value}</div>
                  </div>
                ))}
              </div>

              <button className="btn btn-primary mt-5 w-full" data-testid="dispatch-btn">
                <Send size={14} /> Dispatch Technician
              </button>
              <button className="btn btn-secondary mt-3 w-full" data-testid="telemetry-btn">
                View Telemetry Stream
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
