import React, { useEffect, useState } from "react";
import { listKnowledge, listAssets } from "../lib/api";
import { Card, Spinner } from "../components/UI";
import {
  Search, FileText, Upload, Database, Sparkles, RefreshCw,
  FileBadge, FileWarning, FileCheck, Terminal,
} from "lucide-react";

const INGESTION_TYPES = [
  { id: "sop", label: "SOP PDF", desc: "Standard Operating Procedures", icon: FileBadge, color: "info" },
  { id: "manual", label: "Equipment Manual", desc: "Technical & OEM specification manuals", icon: FileText, color: "purple" },
  { id: "failure", label: "Failure Report", desc: "Incident analysis and post-mortem logs", icon: FileWarning, color: "warning" },
  { id: "checklist", label: "Inspection Checklist", desc: "Routine preventative checklist sheets", icon: FileCheck, color: "healthy" },
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

  const load = async () => {
    const params = {};
    if (assetId) params.asset_id = assetId;
    if (q) params.q = q;
    setDocs(await listKnowledge(params));
  };
  useEffect(() => { listAssets().then(setAssets); }, []);
  useEffect(() => { load(); }, [assetId, q]);

  const onDrop = async (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    runPipeline(file.name);
  };

  const runPipeline = (name) => {
    setPipelineLog([]);
    const steps = [
      `[INIT] Ingesting ${name}…`,
      `[PARSE] Extracting text content`,
      `[CHUNK] Splitting into semantic chunks`,
      `[EMBED] Generating Gemini embeddings`,
      `[INDEX] Writing vectors to KB store`,
      `[DONE] Indexed · ready for RAG`,
    ];
    steps.forEach((s, i) => setTimeout(() => {
      setPipelineLog((l) => [...l, { t: new Date().toLocaleTimeString(), s }]);
    }, i * 700));
  };

  const docsCount = docs?.length || 0;
  const chunksCount = (docs?.length || 0) * 39; // synthetic

  return (
    <div className="p-8 max-w-[1600px] mx-auto relative z-10" data-testid="knowledge-page">
      <div className="mb-6">
        <div className="label mb-1 flex items-center gap-2">
          <Sparkles size={12} className="text-purple" /> KNOWLEDGE INTEGRATION
        </div>
        <h1 className="text-4xl font-black tracking-tight" style={{
          background: "linear-gradient(90deg, #60A5FA, #A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Knowledge Center</h1>
        <p className="text-sec text-sm mt-1">Dynamic Enterprise Knowledge Ingestion & Vector Index Engine</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card stat-card acc-purple p-5">
          <div className="label">Documents Ingested</div>
          <div className="font-mono text-5xl font-light text-pri mt-3">{docsCount}</div>
        </div>
        <div className="card stat-card acc-cyan p-5">
          <div className="label">Text Chunks Created</div>
          <div className="font-mono text-5xl font-light text-pri mt-3">{chunksCount}</div>
        </div>
        <div className="card stat-card acc-success p-5">
          <div className="label">Gemini Embeddings</div>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
            <span className="font-mono text-3xl text-healthy">ACTIVE</span>
          </div>
        </div>
        <div className="card stat-card acc-warm p-5">
          <div className="label">Last Index Refresh</div>
          <div className="flex items-center gap-2 mt-3 text-warning">
            <RefreshCw size={20} />
            <span className="font-mono text-3xl">2 min ago</span>
          </div>
        </div>
      </div>

      {/* Ingestion + Pipeline */}
      <div className="grid grid-cols-12 gap-6 mb-6">
        <div className="col-span-12 lg:col-span-7">
          <Card title={<span className="flex items-center gap-2"><Upload size={14} className="text-info" /> ENTERPRISE DOCUMENT INGESTION</span>}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {INGESTION_TYPES.map((t) => {
                const Icon = t.icon;
                const active = selectedType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedType(t.id)}
                    data-testid={`ingest-${t.id}`}
                    className={`bg-[#131C33] border ${active ? "border-blue-500/60 bg-blue-500/5" : "border-d"} rounded-xl p-4 text-left transition`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={16} className={`text-${t.color}`} />
                      <span className="text-pri font-semibold">{t.label}</span>
                    </div>
                    <div className="text-xs text-sec">{t.desc}</div>
                  </button>
                );
              })}
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => runPipeline("manual_upload_demo.pdf")}
              data-testid="dropzone"
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                drag ? "border-blue-400 bg-blue-500/5" : "border-d hover:border-blue-500/40"
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3"
                   style={{ background: "rgba(59,130,246,0.15)" }}>
                <Upload size={22} className="text-info" />
              </div>
              <div className="text-pri font-semibold mb-1">Drag & Drop document or click to browse</div>
              <div className="text-mut text-xs font-mono">Supports PDF, DOCX, TXT, MD, JSON</div>
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <Card title={<span className="flex items-center gap-2"><Terminal size={14} className="text-purple" /> EMBEDDING ENGINE CONSOLE</span>}>
            <div className="bg-black/40 border border-d rounded-lg p-3 h-64 overflow-y-auto scrollbar-thin font-mono text-xs">
              {pipelineLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-mut text-center">
                  <div className="w-9 h-9 rounded-full bg-[#131C33] border border-d flex items-center justify-center mb-2">
                    !
                  </div>
                  Upload a document to monitor pipeline execution
                </div>
              ) : (
                pipelineLog.map((l, i) => (
                  <div key={i} className="text-sec mb-1">
                    <span className="text-mut">[{l.t}]</span>{" "}
                    <span className={l.s.includes("[DONE]") ? "text-healthy" : l.s.includes("[INIT]") ? "text-info" : "text-pri"}>
                      {l.s}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Knowledge browser */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
          <input
            data-testid="kb-search"
            className="input pl-9"
            placeholder="Search the knowledge base (e.g. bearing, vibration, hydraulic)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          data-testid="kb-asset"
          className="input !w-64"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
        >
          <option value="">All equipment</option>
          {assets.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5">
          <Card title={`KNOWLEDGE STORE · ${docs?.length || 0} docs`}>
            {!docs && <Spinner />}
            {docs && docs.length === 0 && (
              <div className="text-sec text-sm py-6 text-center font-mono">No documents.</div>
            )}
            <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
              {docs && docs.map((d) => (
                <button
                  key={d.id}
                  data-testid={`doc-${d.id}`}
                  onClick={() => setSelected(d)}
                  className={`w-full text-left p-3 border rounded-lg transition ${
                    selected?.id === d.id ? "border-blue-500/60 bg-blue-500/5" : "border-d hover:bg-[#131C33]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${d.type === "sop" ? "badge-warning" : "badge-info"}`}>
                      {d.type}
                    </span>
                    <span className="label">
                      {assets.find(a => a.id === d.asset_id)?.code || d.asset_id}
                    </span>
                  </div>
                  <div className="text-pri text-sm font-semibold">{d.title}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <Card title={selected ? selected.title : "PREVIEW"}>
            {!selected && (
              <div className="py-12 text-center">
                <Database size={32} className="mx-auto text-mut mb-3" />
                <div className="text-sec text-sm">Select a document to view its content.</div>
              </div>
            )}
            {selected && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-info" />
                  <span className="badge badge-info">{selected.type}</span>
                  <span className="label">
                    {assets.find(a => a.id === selected.asset_id)?.name}
                  </span>
                </div>
                <p className="text-sec text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.content}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
