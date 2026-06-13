import React, { useEffect, useState } from "react";
import { listLogbook, listAssets, createLogbook } from "../lib/api";
import { Card, Spinner } from "../components/UI";
import { Plus, Wrench, Clock, Boxes } from "lucide-react";

export default function Logbook() {
  const [logs, setLogs] = useState(null);
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    asset_id: "", action: "", duration_min: 30, spares_used: "", notes: "",
  });

  const load = async () => setLogs(await listLogbook(filter || undefined));
  useEffect(() => { listAssets().then(setAssets); }, []);
  useEffect(() => { load(); }, [filter]);

  const submit = async () => {
    if (!form.asset_id || !form.action) return;
    await createLogbook({
      ...form,
      duration_min: Number(form.duration_min) || 0,
      spares_used: form.spares_used.split(",").map(s => s.trim()).filter(Boolean),
    });
    setOpen(false);
    setForm({ asset_id: "", action: "", duration_min: 30, spares_used: "", notes: "" });
    load();
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto" data-testid="logbook-page">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="label mb-1">DIGITAL LOGBOOK · AUTO-GENERATED</div>
          <h1 className="text-4xl font-black tracking-tight text-pri">Maintenance Activities</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)} data-testid="add-log-btn">
          <Plus size={14} /> Log activity
        </button>
      </div>

      <Card
        title="ALL ENTRIES"
        action={
          <select
            data-testid="log-filter"
            className="input !w-56 !py-1.5"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All equipment</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
          </select>
        }
      >
        {!logs && <Spinner />}
        {logs && logs.length === 0 && (
          <div className="text-sec text-sm py-6 text-center font-mono">No logbook entries.</div>
        )}
        <div className="space-y-3">
          {logs && logs.map((l) => (
            <div key={l.id} className="bg-[#0D111A] border border-d p-4" data-testid={`log-${l.id}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wrench size={14} className="text-brand" />
                  <span className="label">{l.asset_name}</span>
                </div>
                <span className="text-mut text-xs font-mono">
                  {new Date(l.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-pri font-semibold mt-2">{l.action}</div>
              <div className="flex flex-wrap gap-4 mt-2 text-sec text-xs font-mono">
                <span className="flex items-center gap-1.5"><Clock size={12} /> {l.duration_min} min</span>
                {l.spares_used && l.spares_used.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Boxes size={12} /> {l.spares_used.join(" · ")}
                  </span>
                )}
                <span className="text-mut">by {l.performed_by}</span>
              </div>
              {l.notes && <div className="text-sec text-sm mt-2 italic">"{l.notes}"</div>}
            </div>
          ))}
        </div>
      </Card>

      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          data-testid="log-modal"
          onClick={() => setOpen(false)}
        >
          <div
            className="card max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header"><div className="label">Add log entry</div></div>
            <div className="card-body space-y-3">
              <div>
                <label className="label block mb-1">Equipment</label>
                <select
                  data-testid="form-asset"
                  className="input"
                  value={form.asset_id}
                  onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label block mb-1">Action performed</label>
                <input
                  data-testid="form-action"
                  className="input"
                  value={form.action}
                  onChange={(e) => setForm({ ...form, action: e.target.value })}
                  placeholder="e.g. Replaced DE-bearing"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label block mb-1">Duration (min)</label>
                  <input
                    data-testid="form-duration"
                    className="input"
                    type="number"
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label block mb-1">Spares used (comma-sep)</label>
                  <input
                    data-testid="form-spares"
                    className="input"
                    value={form.spares_used}
                    onChange={(e) => setForm({ ...form, spares_used: e.target.value })}
                    placeholder="e.g. SKF 6324, Grease NLGI-2"
                  />
                </div>
              </div>
              <div>
                <label className="label block mb-1">Notes</label>
                <textarea
                  data-testid="form-notes"
                  className="input min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={submit} data-testid="form-submit">
                  Save entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
