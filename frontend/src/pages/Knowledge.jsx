import React, { useCallback, useEffect, useState } from "react";
import { listAssets, listKnowledge } from "../lib/api";
import { Spinner } from "../components/UI";
import { Database, FileBadge, FileCheck, FileText, FileWarning, RefreshCw, Search, Terminal, Upload } from "lucide-react";

const INGESTION_TYPES = [
  { id: "sop", label: "SOP PDF", desc: "Standard operating procedures", icon: FileBadge, tone: "text-info" },
  { id: "manual", label: "Equipment Manual", desc: "OEM and technical manuals", icon: FileText, tone: "text-purple" },
  { id: "failure", label: "Failure Report", desc: "Incident and post-mortem logs", icon: FileWarning, tone: "text-warning" },
  { id: "checklist", label: "Inspection Checklist", desc: "Preventive checklist sheets", icon: FileCheck, tone: "text-healthy" },
];

export default function Knowledge() {
  const [docs, setDocs] = useState(null);
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [q, setQ] = useState("");
  const [selectedType, setSelectedType] = useState("sop");
  const [selected, setSelected] = useState(null);
  const [pipelineLog, setPipelineLog] = useState([]);
  const [drag, setDrag] = useState(false);

  const load = useCallback(async () => {
    const params = {};
    if (assetId) params.asset_id = assetId;
    if (q) params.q = q;
    setDocs(await listKnowledge(params));
  }, [assetId, q]);

  useEffect(() => {
    listAssets().then(setAssets);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runPipeline = (name) => {
    setPipelineLog([]);
    const steps = [
      `[INIT] ingesting ${name}`,
      "[PARSE] extracting text content",
      "[CHUNK] splitting into semantic chunks",
      "[EMBED] generating embeddings",
      "[INDEX] writing vectors to KB store",
      "[DONE] indexed and ready for RAG",
    ];
    steps.forEach((s, i) => setTimeout(() => {
      setPipelineLog((l) => [...l, { t: new Date().toLocaleTimeString(), s }]);
    }, i * 700));
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) runPipeline(file.name);
  };

  const docsCount = docs?.length || 0;
  const chunksCount = docsCount * 39;

  return (
    <div className="relative z-10 mx-auto max-w-[1760px] p-6 lg:p-8" data-testid="knowledge-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="label mb-2 flex items-center gap-2 text-cyan">
          <Database size={14} /> Knowledge Index Console
        </div>
        <h1 className="text-3xl font-black text-pri md:text-4xl">Plant Knowledge Library</h1>
        <p className="mt-2 text-sm text-sec">Search, preview and simulate ingestion for SOPs, manuals, checklists and failure reports.</p>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Documents", docsCount, "text-info"],
          ["Chunks", chunksCount, "text-cyan"],
          ["Embeddings", "Active", "text-healthy"],
          ["Refresh", "2 min", "text-warning"],
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="label">{label}</div>
            <div className={`mt-3 font-mono text-3xl font-bold ${tone}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_1fr_420px]">
        <aside className="space-y-5">
          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="mb-3 label text-cyan">Ingestion Type</div>
            <div className="grid gap-2">
              {INGESTION_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => setSelectedType(t.id)} data-testid={`ingest-${t.id}`} className={`rounded border p-3 text-left transition ${selectedType === t.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-[#08111f] hover:border-cyan-400/50"}`}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={t.tone} />
                      <span className="font-semibold text-pri">{t.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-sec">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => runPipeline("manual_upload_demo.pdf")}
            data-testid="dropzone"
            className={`cursor-pointer rounded-md border-2 border-dashed p-6 text-center transition ${drag ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-[#101827] hover:border-cyan-400/50"}`}
          >
            <Upload size={24} className="mx-auto text-cyan" />
            <div className="mt-3 font-bold text-pri">Drop document</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-mut">PDF, DOCX, TXT, MD, JSON</div>
          </section>
        </aside>

        <main className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
              <input data-testid="kb-search" className="input pl-9" placeholder="Search bearing, vibration, hydraulic..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select data-testid="kb-asset" className="input md:!w-72" value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">All equipment</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
            </select>
          </div>

          {!docs && <Spinner />}
          {docs && docs.length === 0 && <div className="py-10 text-center font-mono text-sm text-sec">No documents.</div>}
          <div className="grid gap-2">
            {docs && docs.map((d) => (
              <button key={d.id} data-testid={`doc-${d.id}`} onClick={() => setSelected(d)} className={`rounded border p-3 text-left transition ${selected?.id === d.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-[#08111f] hover:border-cyan-400/50"}`}>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`badge ${d.type === "sop" ? "badge-warning" : "badge-info"}`}>{d.type}</span>
                  <span className="label">{assets.find((a) => a.id === d.asset_id)?.code || d.asset_id}</span>
                </div>
                <div className="font-semibold text-pri">{d.title}</div>
              </button>
            ))}
          </div>
        </main>

        <aside className="space-y-5">
          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Terminal size={14} className="text-cyan" />
              <span className="label text-cyan">Pipeline Console</span>
            </div>
            <div className="h-56 overflow-y-auto rounded border border-slate-700 bg-black/30 p-3 font-mono text-xs scrollbar-thin">
              {pipelineLog.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-mut">
                  <RefreshCw size={20} className="mb-2" />
                  Upload a document to monitor pipeline execution
                </div>
              ) : (
                pipelineLog.map((l, i) => (
                  <div key={i} className="mb-1 text-sec">
                    <span className="text-mut">[{l.t}]</span>{" "}
                    <span className={l.s.includes("[DONE]") ? "text-healthy" : l.s.includes("[INIT]") ? "text-info" : "text-pri"}>{l.s}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-4">
            <div className="mb-3 label text-warning">{selected ? "Document Preview" : "Preview"}</div>
            {!selected ? (
              <div className="py-10 text-center text-sm text-sec">
                <Database size={30} className="mx-auto mb-3 text-mut" />
                Select a document to view its content.
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-info" />
                  <span className="badge badge-info">{selected.type}</span>
                </div>
                <h2 className="font-bold text-pri">{selected.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-sec">{selected.content}</p>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
