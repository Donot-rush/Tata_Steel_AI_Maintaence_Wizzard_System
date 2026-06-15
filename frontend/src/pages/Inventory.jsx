import React, { useEffect, useMemo, useState } from "react";
import { getInventory, purchasePart } from "../lib/api";
import { Spinner } from "../components/UI";
import { useRole } from "../lib/RoleContext";
import { AlertTriangle, DollarSign, Filter, Lock, Package, PlusCircle, Search, ShieldAlert } from "lucide-react";

const CATEGORIES = ["All Asset Types", "Centrifugal Pump", "Turbo Blower", "AC Motor (2000kW)", "Helical Gearbox", "Steam Turbine"];
const STOCK_FILTERS = ["All", "Out of Stock", "Low Stock"];

function StockBadge({ level, count }) {
  if (level === "out") return <span className="badge badge-critical">Out</span>;
  if (level === "low") return <span className="badge badge-warning">Low ({count})</span>;
  return <span className="badge badge-healthy">In ({count})</span>;
}

export default function Inventory() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All Asset Types");
  const [stock, setStock] = useState("All");
  const [msg, setMsg] = useState("");
  const { role, can } = useRole();
  const canBuy = can("purchase");
  const canExpedite = can("expedite");

  const load = async () => setData(await getInventory());

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.items.filter((i) => {
      if (cat !== "All Asset Types" && i.category !== cat) return false;
      if (stock === "Out of Stock" && i.level !== "out") return false;
      if (stock === "Low Stock" && i.level !== "low") return false;
      if (q && !`${i.name} ${i.part_no}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [data, q, cat, stock]);

  if (!data) return <Spinner />;

  const purchase = async (id) => {
    try {
      await purchasePart(id);
      setMsg("");
      load();
    } catch (e) {
      const detail = e?.response?.data?.detail || "Action failed";
      setMsg(detail);
      setTimeout(() => setMsg(""), 3500);
    }
  };

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="inventory-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="label mb-2 flex items-center gap-2 text-cyan">
          <Package size={14} /> Spares Control Ledger
        </div>
        <h1 className="text-3xl font-black text-pri md:text-4xl">Inventory Risk Dispatch</h1>
        <p className="mt-2 text-sm text-sec">
          Live spares availability, shortage exposure, lead-time risk and role-gated procurement.
        </p>
        {msg && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-critical" data-testid="role-error-toast">
            <Lock size={13} /> {msg}
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Cataloged Spares", data.kpis.cataloged, Package, "text-info"],
          ["Out of Stock", data.kpis.out_of_stock, ShieldAlert, "text-critical"],
          ["Low Stock", data.kpis.low_stock, AlertTriangle, "text-warning"],
          ["On-Hand Value", `Rs ${data.kpis.on_hand_value.toLocaleString()}`, DollarSign, "text-healthy"],
        ].map(([label, value, Icon, tone]) => (
          <div key={label} className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="label">{label}</span>
              <Icon size={18} className={tone} />
            </div>
            <div className={`mt-3 font-mono text-3xl font-bold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      {data.risk_rows.length > 0 && (
        <section className="mb-5 rounded-md border border-red-500/35 bg-red-500/10 p-4" data-testid="risk-alert">
          <div className="mb-4 flex items-start gap-3">
            <ShieldAlert size={24} className="mt-1 text-critical" />
            <div>
              <div className="label text-critical">Critical Shortage Exposure</div>
              <div className="mt-1 text-2xl font-black text-pri">
                Production downtime risk: <span className="text-critical">Rs {data.kpis.risk_exposure.toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-sec">
                {data.kpis.degraded_assets} degraded or critical plant assets are missing matching spare parts.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {data.risk_rows.map((r) => (
              <div key={r.asset_id} className="grid gap-3 rounded border border-red-500/25 bg-[#08111f] p-3 md:grid-cols-[1.5fr_70px_1.5fr_90px_120px_110px]">
                <div>
                  <div className="font-semibold text-pri">{r.asset_name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-mut">{r.location} - {r.asset_id}</div>
                </div>
                <div className="badge badge-critical w-fit">{r.health}%</div>
                <div>
                  <div className="text-sm text-pri">{r.spare_name}</div>
                  <div className="font-mono text-[10px] text-mut">{r.part_no} - Rs {r.spare_cost.toLocaleString()}</div>
                </div>
                <div className="font-mono text-warning">{r.lead_days}d</div>
                <div className="font-mono font-semibold text-critical">Rs {r.risk_inr.toLocaleString()}</div>
                <button
                  className={`btn !px-3 !py-1.5 !text-xs ${canExpedite ? "btn-danger" : "btn-secondary opacity-60"}`}
                  onClick={() => canExpedite ? purchase("sp-bld-001") : setMsg("Admin role required to expedite purchase orders")}
                  data-testid={`expedite-${r.asset_id}`}
                >
                  {canExpedite ? "Expedite PO" : <><Lock size={11} /> Admin</>}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-5 rounded-md border border-slate-700/70 bg-[#101827] p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input
              data-testid="inv-search"
              className="input pl-9"
              placeholder="Search spare name or part number..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter size={14} className="text-mut" />
            {STOCK_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStock(s)}
                data-testid={`stock-filter-${s}`}
                className={`btn !px-3 !py-1.5 !text-xs ${stock === s ? "btn-primary" : "btn-secondary"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} data-testid={`cat-${c}`} className={`btn !px-3 !py-1.5 !text-xs ${cat === c ? "btn-primary" : "btn-secondary"}`}>
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
        <div className="hidden grid-cols-[1.6fr_1fr_90px_110px_120px_190px] gap-3 border-b border-d px-3 py-2 label md:grid">
          <span>Spare</span><span>Category</span><span>Stock</span><span>Unit Cost</span><span>Lead Time</span><span>Action</span>
        </div>
        <div className="space-y-2">
          {filtered.map((p) => (
            <div key={p.id} className="grid gap-3 rounded border border-slate-700 bg-[#08111f] px-3 py-3 md:grid-cols-[1.6fr_1fr_90px_110px_120px_190px]" data-testid={`spare-${p.part_no}`}>
              <div>
                <div className="font-semibold text-pri">{p.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-mut">{p.part_no}</div>
              </div>
              <div className="text-sm text-sec">{p.category}</div>
              <StockBadge level={p.level} count={p.stock} />
              <div className="font-mono text-pri">Rs {p.unit_cost.toLocaleString()}</div>
              <div className="font-mono text-sec">{p.lead_days} days</div>
              <button onClick={() => canBuy ? purchase(p.id) : setMsg("Supervisor or Admin role required to place purchase orders")} className={`btn !py-1.5 ${canBuy ? "btn-primary" : "btn-secondary opacity-70"}`} data-testid={`purchase-${p.part_no}`}>
                {canBuy ? <><PlusCircle size={14} /> Purchase Order</> : <><Lock size={13} /> {role} cannot purchase</>}
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-sec">No spare parts match these filters.</div>
          )}
        </div>
      </section>
    </div>
  );
}
