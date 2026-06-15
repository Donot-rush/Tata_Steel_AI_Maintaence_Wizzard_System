import React from "react";
import { Award, Cpu, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";

export default function Credits() {
  const features = [
    ["FORGEOPS Sentinel AI workbench with voice mode", Sparkles],
    ["Per-asset SOP and manual context", Cpu],
    ["Live sensor streams and health gauges", Zap],
    ["Severity and urgency risk radar", Award],
    ["Predictive RUL and maintenance runway", Sparkles],
    ["Industrial spares exposure optimizer", Cpu],
    ["PDF report studio", Zap],
    ["Role-based operations controls", Award],
  ];

  return (
    <div className="relative z-10 mx-auto max-w-[1400px] p-6 lg:p-8" data-testid="credits-page">
      <div className="mb-5 rounded-md border border-slate-700/70 bg-[#08111f] p-5">
        <div className="label mb-2 flex items-center gap-2 text-cyan">
          <ShieldCheck size={14} /> Project Identity
        </div>
        <h1 className="text-3xl font-black text-pri md:text-4xl">Credits & Build Notes</h1>
        <p className="mt-2 text-sm text-sec">Maintenance Wizard for Tata Steel AI Platform, built by Smruti Gujar.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <aside className="rounded-md border border-cyan-400/30 bg-cyan-400/10 p-6 text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded border border-cyan-300/50 bg-[#08111f] text-3xl font-black text-cyan">
            SG
          </div>
          <h2 className="mt-5 text-2xl font-black text-pri">Smruti Gujar</h2>
          <div className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-cyan">AI Engineer</div>
          <p className="mt-4 text-sm leading-6 text-sec">
            Builder of the Maintenance Wizard, a steel-plant reliability platform for explainable diagnostics,
            predictive maintenance, spares risk and operational reporting.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 text-mut">
            <Mail size={14} />
            <span className="font-mono text-[10px] uppercase tracking-wider">smruti.gujar - AI Engineer</span>
          </div>
        </aside>

        <main className="space-y-5">
          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-5">
            <div className="label text-cyan">The Project</div>
            <h2 className="mt-3 text-2xl font-black text-pri">Maintenance Wizard - Tata Steel AI Platform</h2>
            <p className="mt-3 text-sm leading-7 text-sec">
              An agentic AI decision-support system for steel-manufacturing maintenance teams. It combines
              sensor telemetry, equipment manuals, SOPs, historical breakdowns and operational logs to deliver
              diagnostics, failure warnings, prioritized maintenance actions, inventory risk signals and structured reports.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                ["30", "Plant assets", "text-info"],
                ["1", "Sentinel agent", "text-cyan"],
                ["17", "Spare parts", "text-warning"],
                ["10", "Live modules", "text-healthy"],
              ].map(([value, label, tone]) => (
                <div key={label} className="rounded border border-slate-700 bg-[#08111f] p-3">
                  <div className={`font-mono text-2xl font-bold ${tone}`}>{value}</div>
                  <div className="label mt-1">{label}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-5">
            <div className="label text-warning">Tech Stack</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded border border-slate-700 bg-[#08111f] p-4">
                <div className="label text-cyan">Frontend</div>
                <ul className="mt-3 space-y-2 text-sm text-sec">
                  <li>React 19 + React Router</li>
                  <li>TailwindCSS and custom operations UI</li>
                  <li>Recharts for telemetry and analytics</li>
                  <li>jsPDF for report export</li>
                </ul>
              </div>
              <div className="rounded border border-slate-700 bg-[#08111f] p-4">
                <div className="label text-cyan">Backend</div>
                <ul className="mt-3 space-y-2 text-sm text-sec">
                  <li>FastAPI with async MongoDB</li>
                  <li>FORGEOPS Sentinel routing over Gemini/Groq services</li>
                  <li>Groq Whisper speech-to-text</li>
                  <li>WebSocket live sensor streaming</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-slate-700/70 bg-[#101827] p-5">
            <div className="label text-healthy">Feature Coverage</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {features.map(([label, Icon]) => (
                <div key={label} className="flex items-center gap-3 rounded border border-slate-700 bg-[#08111f] p-3">
                  <Icon size={16} className="shrink-0 text-cyan" />
                  <span className="text-sm text-pri">{label}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
