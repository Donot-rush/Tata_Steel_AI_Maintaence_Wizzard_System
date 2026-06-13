import React, { useEffect, useState } from "react";
import { listAssets, getReport } from "../lib/api";
import { Card, StatusBadge, Spinner } from "../components/UI";
import { FileDown, Download } from "lucide-react";
import jsPDF from "jspdf";

function exportPDF(report) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = 595; const M = 40; let y = 60;

  doc.setFillColor(232, 89, 12);
  doc.rect(0, 0, W, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(20, 20, 25);
  doc.text("MAESTRO · Maintenance Report", M, y); y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 120);
  doc.text(`Generated: ${new Date(report.generated_at).toLocaleString()}`, M, y); y += 24;

  // Asset block
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 25);
  doc.text(`${report.asset.code} — ${report.asset.name}`, M, y); y += 16;
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 90);
  doc.text(`Location: ${report.asset.location}`, M, y); y += 14;
  doc.text(`Manufacturer: ${report.asset.manufacturer}  ·  Model: ${report.asset.model}`, M, y); y += 14;
  doc.text(`Installed: ${report.asset.installed}  ·  Criticality: ${report.asset.criticality}`, M, y); y += 22;

  // Summary
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 25);
  doc.text("Summary", M, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 70);
  doc.text(`Status: ${report.summary.status.toUpperCase()}`, M, y); y += 13;
  doc.text(`Health score: ${report.summary.health_score}/100`, M, y); y += 13;
  doc.text(`Remaining Useful Life: ${report.summary.rul_days} days`, M, y); y += 13;
  doc.text(`Open alerts: ${report.summary.open_alerts}`, M, y); y += 22;

  // Alerts
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 25);
  doc.text("Recent Alerts", M, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 70);
  report.alerts.slice(0, 10).forEach((a) => {
    if (y > 780) { doc.addPage(); y = 60; }
    const t = new Date(a.created_at).toLocaleString();
    doc.text(`• [${a.severity.toUpperCase()}] ${a.title}`, M, y); y += 12;
    doc.text(`  ${t} — ${a.message}`, M, y); y += 16;
  });
  y += 6;

  // Logbook
  if (y > 720) { doc.addPage(); y = 60; }
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(20, 20, 25);
  doc.text("Maintenance History", M, y); y += 14;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(60, 60, 70);
  report.logbook.slice(0, 10).forEach((l) => {
    if (y > 780) { doc.addPage(); y = 60; }
    const t = new Date(l.created_at).toLocaleDateString();
    doc.text(`• ${t} — ${l.action} (${l.duration_min} min)`, M, y); y += 12;
    if (l.notes) { doc.text(`  Notes: ${l.notes}`, M, y); y += 12; }
    y += 4;
  });

  doc.setFontSize(8); doc.setTextColor(150, 150, 160);
  doc.text(`MAESTRO — Steel Plant Maintenance Wizard · ${report.asset.code}`, M, 815);

  doc.save(`maestro-${report.asset.code}-${Date.now()}.pdf`);
}

export default function Reports() {
  const [assets, setAssets] = useState([]);
  const [pick, setPick] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listAssets().then((a) => { setAssets(a); if (a.length) setPick(a[0]); });
  }, []);

  useEffect(() => {
    if (!pick) return;
    setLoading(true); setReport(null);
    getReport(pick.id).then((r) => { setReport(r); setLoading(false); });
  }, [pick]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto" data-testid="reports-page">
      <div className="mb-6">
        <div className="label mb-1">STRUCTURED REPORTS · PDF EXPORT</div>
        <h1 className="text-4xl font-black tracking-tight text-pri">Maintenance Reports</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3">
          <Card title="EQUIPMENT">
            <div className="space-y-1.5">
              {assets.map((a) => (
                <button
                  key={a.id}
                  data-testid={`report-asset-${a.code}`}
                  onClick={() => setPick(a)}
                  className={`w-full text-left p-3 border ${
                    pick?.id === a.id ? "border-brand bg-[#0D111A]" : "border-d"
                  } hover:bg-[#0D111A]`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="label">{a.code}</div>
                      <div className="text-pri text-sm">{a.name}</div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-9">
          {loading && <Spinner />}
          {report && (
            <Card
              title={`REPORT · ${report.asset.code}`}
              action={
                <button
                  className="btn btn-primary"
                  onClick={() => exportPDF(report)}
                  data-testid="export-pdf-btn"
                >
                  <FileDown size={14} /> Export PDF
                </button>
              }
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-[#0D111A] border border-d p-3">
                  <div className="label">Status</div>
                  <div className="mt-2"><StatusBadge status={report.summary.status} /></div>
                </div>
                <div className="bg-[#0D111A] border border-d p-3">
                  <div className="label">Health</div>
                  <div className="font-mono text-2xl text-pri mt-1">{report.summary.health_score}</div>
                </div>
                <div className="bg-[#0D111A] border border-d p-3">
                  <div className="label">RUL</div>
                  <div className="font-mono text-2xl text-pri mt-1">{report.summary.rul_days}d</div>
                </div>
                <div className="bg-[#0D111A] border border-d p-3">
                  <div className="label">Open alerts</div>
                  <div className="font-mono text-2xl text-pri mt-1">{report.summary.open_alerts}</div>
                </div>
              </div>

              <div className="label mb-2">RECENT ALERTS</div>
              <div className="space-y-2 mb-6">
                {report.alerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="bg-[#0D111A] border border-d p-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.severity} />
                      <span className="text-mut text-xs font-mono ml-auto">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-pri text-sm mt-1">{a.title}</div>
                  </div>
                ))}
                {report.alerts.length === 0 && (
                  <div className="text-sec text-sm font-mono">No alerts recorded.</div>
                )}
              </div>

              <div className="label mb-2">MAINTENANCE HISTORY</div>
              <div className="space-y-2">
                {report.logbook.slice(0, 8).map((l) => (
                  <div key={l.id} className="bg-[#0D111A] border border-d p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-pri text-sm font-semibold">{l.action}</div>
                      <div className="text-mut text-xs font-mono">
                        {new Date(l.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-sec text-xs mt-1 font-mono">
                      {l.duration_min} min · by {l.performed_by}
                    </div>
                    {l.notes && <div className="text-sec text-sm mt-1 italic">"{l.notes}"</div>}
                  </div>
                ))}
                {report.logbook.length === 0 && (
                  <div className="text-sec text-sm font-mono">No history yet.</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
