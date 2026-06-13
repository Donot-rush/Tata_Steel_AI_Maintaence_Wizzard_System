import React, { useEffect, useState, useMemo } from "react";
import { getInventory, purchasePart } from "../lib/api";
import { Card, Spinner } from "../components/UI";
import { useRole } from "../lib/RoleContext";
import { Search, Package, ShieldAlert, AlertTriangle, DollarSign, PlusCircle, Filter, Lock } from "lucide-react";

const CATEGORIES = ["All Asset Types", "Centrifugal Pump", "Turbo Blower",
  "AC Motor (2000kW)", "Helical Gearbox", "Steam Turbine"];
const STOCK_FILTERS = ["All", "Out of Stock", "Low Stock"];

function StockBadge({ level, count }) {
  if (level === "out") return <span className="badge badge-critical">OUT OF STOCK</span>;
  if (level === "low") return <span className="badge badge-warning">LOW STOCK ({count})</span>;
  return <span className="badge badge-healthy">IN STOCK ({count})</span>;
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
  useEffect(() => { load(); }, []);

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
      setMsg(""); load();
    } catch (e) {
      const detail = e?.response?.data?.detail || "Action failed";
      setMsg(detail);
      setTimeout(() => setMsg(""), 3500);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative z-10" data-testid="inventory-page">
      <div className="mb-6">
        <div className="label mb-1">INDUSTRIAL SPARES & RISK OPTIMIZER</div>
        <h1 className="text-4xl font-black tracking-tight" style={{
          background: "linear-gradient(90deg, #60A5FA, #A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Spare Parts & Procurement</h1>
        <p className="text-sec text-sm mt-1">AI-driven logistics monitoring, out-of-stock risk valuation, and instant procurement dispatch.</p>
        {msg && (
          <div className="mt-3 inline-flex items-center gap-2 bg-red-500/10 border border-red-500/40 px-3 py-1.5 rounded-md text-critical text-sm" data-testid="role-error-toast">
            <Lock size={13} /> {msg}
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card stat-card acc-purple p-5" data-testid="kpi-cataloged">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background: "rgba(59,130,246,0.15)"}}>
              <Package size={18} className="text-info" />
            </div>
            <div className="label">Cataloged Spares</div>
          </div>
          <div className="font-mono text-4xl font-light text-pri">{data.kpis.cataloged}</div>
        </div>
        <div className="card stat-card acc-danger p-5" data-testid="kpi-oos">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background: "rgba(239,68,68,0.15)"}}>
              <ShieldAlert size={18} className="text-critical" />
            </div>
            <div className="label">Out Of Stock</div>
          </div>
          <div className="font-mono text-4xl font-light text-critical">{data.kpis.out_of_stock}</div>
        </div>
        <div className="card stat-card acc-warm p-5" data-testid="kpi-low">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background: "rgba(245,158,11,0.15)"}}>
              <AlertTriangle size={18} className="text-warning" />
            </div>
            <div className="label">Low Stock</div>
          </div>
          <div className="font-mono text-4xl font-light text-warning">{data.kpis.low_stock}</div>
        </div>
        <div className="card stat-card acc-success p-5" data-testid="kpi-value">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{background: "rgba(16,185,129,0.15)"}}>
              <DollarSign size={18} className="text-healthy" />
            </div>
            <div className="label">On-Hand Value</div>
          </div>
          <div className="font-mono text-4xl font-light text-healthy">₹{data.kpis.on_hand_value.toLocaleString()}</div>
        </div>
      </div>

      {/* Risk alert */}
      {data.risk_rows.length > 0 && (
        <div className="card mb-6 border-red-500/40" style={{ boxShadow: "0 0 36px rgba(239, 68, 68, 0.15)" }} data-testid="risk-alert">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                <ShieldAlert size={20} className="text-critical" />
              </div>
              <div>
                <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-critical">CRITICAL SPARES SHORTAGE RISK ALERT</div>
                <div className="text-2xl font-bold mt-1">
                  Production Downtime Risk Exposure: <span className="text-critical">₹{data.kpis.risk_exposure.toLocaleString()}</span>
                </div>
                <div className="text-sec text-sm mt-1">
                  There are <span className="text-pri font-bold">{data.kpis.degraded_assets}</span> degraded or critical plant assets missing matching spare parts. Production losses accumulate daily during parts lead-time.
                </div>
              </div>
            </div>
            <div className="label mb-2">ACTIVE EXPOSURE BREAKDOWN (LOSS COST = PART COST + LEAD TIME × ₹10,000/DAY)</div>
            <div className="space-y-2">
              <div className="grid grid-cols-[2fr_80px_2fr_100px_120px_100px] gap-3 label py-2 border-b border-d">
                <span>Degraded Asset</span><span>Health</span><span>Missing Spare</span><span>Lead Time</span><span>Risk Valuation</span><span className="text-right">Action</span>
              </div>
              {data.risk_rows.map((r) => (
                <div key={r.asset_id} className="grid grid-cols-[2fr_80px_2fr_100px_120px_100px] gap-3 items-center py-2">
                  <div>
                    <div className="text-pri font-semibold">{r.asset_name}</div>
                    <div className="font-mono text-[10px] text-mut">{r.location} · ID: {r.asset_id}</div>
                  </div>
                  <div className="badge badge-critical w-fit">{r.health}%</div>
                  <div>
                    <div className="text-pri text-sm">{r.spare_name}</div>
                    <div className="font-mono text-[10px] text-mut">{r.part_no} · Cost: ₹{r.spare_cost.toLocaleString()}</div>
                  </div>
                  <div className="font-mono text-warning">{r.lead_days} Days</div>
                  <div className="font-mono text-critical font-semibold">₹{r.risk_inr.toLocaleString()}</div>
                  <div className="text-right">
                    <button
                      className={`btn !px-3 !py-1.5 !text-xs ${canExpedite ? "btn-danger" : "btn-secondary opacity-60"}`}
                      onClick={() => canExpedite ? purchase("sp-bld-001") : setMsg("Admin role required to expedite purchase orders")}
                      data-testid={`expedite-${r.asset_id}`}
                      title={canExpedite ? "Expedite PO" : "Admin only"}
                    >
                      {canExpedite ? "Expedite PO" : <><Lock size={11} /> Admin</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <Card className="mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input
              data-testid="inv-search"
              className="input pl-9"
              placeholder="Search spare parts by name or part number..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-mut" />
            <span className="label">Filter Stock:</span>
            {STOCK_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStock(s)}
                data-testid={`stock-filter-${s}`}
                className={`btn !px-3 !py-1.5 !text-xs ${
                  stock === s
                    ? (s === "Out of Stock" ? "btn-danger" : s === "Low Stock" ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "btn-primary")
                    : "btn-secondary"
                }`}
              >{s}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              data-testid={`cat-${c}`}
              className={`btn !px-3 !py-1.5 !text-xs ${cat === c ? "btn-primary" : "btn-secondary"}`}
            >{c}</button>
          ))}
        </div>
      </Card>

      {/* Spare parts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="card stat-card acc-purple p-5" data-testid={`spare-${p.part_no}`}>
            <div className="label text-info">{p.category}</div>
            <div className="font-bold text-pri mt-1.5 text-[15px] leading-snug">{p.name}</div>
            <div className="font-mono text-[10px] text-mut mt-1">PART NO: {p.part_no}</div>
            <div className="divider my-4" />
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-sec text-sm">Stock Level:</span>
                <StockBadge level={p.level} count={p.stock} />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sec">Unit Cost:</span>
                <span className="font-mono text-pri">₹{p.unit_cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-sec">Standard Lead Time:</span>
                <span className="font-mono text-pri">{p.lead_days} Days</span>
              </div>
            </div>
            <button
              onClick={() => canBuy ? purchase(p.id) : setMsg("Supervisor or Admin role required to place purchase orders")}
              className={`btn w-full mt-4 ${canBuy ? "btn-primary" : "btn-secondary opacity-70"}`}
              data-testid={`purchase-${p.part_no}`}
              title={canBuy ? "Place purchase order" : "Insufficient permission"}
            >
              {canBuy ? <><PlusCircle size={14} /> 1-Click Purchase Order</> : <><Lock size={13} /> {role} cannot purchase</>}
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-sec text-sm text-center py-10">No spare parts match these filters.</div>
        )}
      </div>
    </div>
  );
}
