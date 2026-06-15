import React, { useEffect, useState } from "react";
import { getReport, listAssets } from "../lib/api";
import { Spinner, StatusBadge } from "../components/UI";
import { Download, FileDown, FileText } from "lucide-react";
import jsPDF from "jspdf";

function exportPDF(report) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595;
  const M = 40;
  let y = 60;

  doc.setFillColor(20, 184, 166);
  doc.rect(0, 0, W, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 25);
  doc.text("FORGEOPS Sentinel - Maintenance Report", M, y);
  y += 26;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 120);
  doc.text(`Generated: ${new Date(report.generated_at).toLocaleString()}`, M, y);
  y += 24;
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 25);
  doc.text(`${report.asset.code} - ${report.asset.name}`, M, y);
  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 90);
  doc.text(`Location: ${report.asset.location}`, M, y); y += 14;
  doc.text(`Manufacturer: ${report.asset.manufacturer} - Model: ${report.asset.model}`, M, y); y += 14;
  doc.text(`Installed: ${report.asset.installed} - Criticality: ${report.asset.criticality}`, M, y); y += 22;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 25);
  doc.text("Summary", M, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 70);
  doc.text(`Status: ${report.summary.status.toUpperCase()}`, M, y); y += 13;
  doc.text(`Health score: ${report.summary.health_score}/100`, M, y); y += 13;
  doc.text(`Remaining Useful Life: ${report.summary.rul_days} days`, M, y); y += 13;
  doc.text(`Open alerts: ${report.summary.open_alerts}`, M, y); y += 22;
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 25);
  doc.text("Recent Alerts", M, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 70);
  report.alerts.slice(0, 10).forEach((a) => {
    if (y > 780) { doc.addPage(); y = 60; }
    doc.text(`- [${a.severity.toUpperCase()}] ${a.title}`, M, y); y += 12;
    doc.text(`  ${new Date(a.created_at).toLocaleString()} - ${a.message}`, M, y); y += 16;
  });
  y += 6;
  if (y > 720) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 25);
  doc.text("Maintenance History", M, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 70);
  report.logbook.slice(0, 10).forEach((l) => {
    if (y > 780) { doc.addPage(); y = 60; }
    doc.text(`- ${new Date(l.created_at).toLocaleDateString()} - ${l.action} (${l.duration_min} min)`, M, y); y += 12;
    if (l.notes) { doc.text(`  Notes: ${l.notes}`, M, y); y += 12; }
    y += 4;
  });
  doc.setFontSize(8); doc.setTextColor(150, 150, 160);
  doc.text(`FORGEOPS Sentinel - ${report.asset.code}`, M, 815);
  doc.save(`forgeops-${report.asset.code}-${Date.now()}.pdf`);
}

export default function Reports() {
  const [assets, setAssets] = useState([]);
  const [pick, setPick] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listAssets().then((a) => {
      setAssets(a);
      if (a.length) setPick(a[0]);
    });
  }, []);

  useEffect(() => {
    if (!pick) return;
    setLoading(true);
    setReport(null);
    getReport(pick.id).then((r) => {
      setReport(r);
      setLoading(false);
    });
  }, [pick]);

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="reports-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="label mb-2 flex items-center gap-2 text-cyan">
          <FileText size={14} /> Report Builder
        </div>
        <h1 className="text-3xl font-black text-pri md:text-4xl">Maintenance Report Studio</h1>
        <p className="mt-2 text-sm text-sec">Generate asset-level evidence summaries and export a maintenance PDF.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-3 label text-cyan">Asset Register</div>
          <select
            className="input mb-4"
            value={pick?.id || ""}
            onChange={(e) => setPick(assets.find((a) => a.id === e.target.value))}
          >
            {assets.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </select>
          <div className="max-h-[650px] space-y-2 overflow-y-auto scrollbar-thin">
            {assets.map((a) => (
              <button
                key={a.id}
                data-testid={`report-asset-${a.code}`}
                onClick={() => setPick(a)}
                className={`w-full rounded border p-3 text-left transition ${
                  pick?.id === a.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-[#08111f] hover:border-cyan-400/50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-mut">{a.code}</div>
                    <div className="truncate text-sm font-semibold text-pri">{a.name}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="rounded-md border border-slate-700/70 bg-[#101827]">
          {loading && <Spinner />}
          {report && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-d px-5 py-4">
                <div>
                  <div className="label">Report - {report.asset.code}</div>
                  <h2 className="mt-1 text-2xl font-black text-pri">{report.asset.name}</h2>
                </div>
                <button className="btn btn-primary" onClick={() => exportPDF(report)} data-testid="export-pdf-btn">
                  <FileDown size={14} /> Export PDF
                </button>
              </div>

              <div className="p-5">
                <div className="mb-5 grid gap-3 md:grid-cols-4">
                  {[
                    ["Status", <StatusBadge status={report.summary.status} />],
                    ["Health", report.summary.health_score],
                    ["RUL", `${report.summary.rul_days}d`],
                    ["Open Alerts", report.summary.open_alerts],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded border border-slate-700 bg-[#08111f] p-4">
                      <div className="label">{label}</div>
                      <div className="mt-2 font-mono text-2xl text-pri">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <section>
                    <div className="mb-3 label text-critical">Recent Alerts</div>
                    <div className="space-y-2">
                      {report.alerts.slice(0, 6).map((a) => (
                        <div key={a.id} className="rounded border border-slate-700 bg-[#08111f] p-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={a.severity} />
                            <span className="ml-auto font-mono text-[10px] text-mut">{new Date(a.created_at).toLocaleString()}</span>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-pri">{a.title}</div>
                        </div>
                      ))}
                      {report.alerts.length === 0 && <div className="text-sm text-sec">No alerts recorded.</div>}
                    </div>
                  </section>
                  <section>
                    <div className="mb-3 label text-cyan">Maintenance History</div>
                    <div className="space-y-2">
                      {report.logbook.slice(0, 8).map((l) => (
                        <div key={l.id} className="rounded border border-slate-700 bg-[#08111f] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-sm font-semibold text-pri">{l.action}</div>
                            <div className="font-mono text-[10px] text-mut">{new Date(l.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-mut">{l.duration_min} min - {l.performed_by}</div>
                          {l.notes && <div className="mt-2 text-sm text-sec">{l.notes}</div>}
                        </div>
                      ))}
                      {report.logbook.length === 0 && <div className="text-sm text-sec">No history yet.</div>}
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
