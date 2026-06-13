import React from "react";
import { Card } from "../components/UI";
import { Award, Cpu, Zap, Sparkles, Mail } from "lucide-react";

export default function Credits() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto relative z-10" data-testid="credits-page">
      <div className="mb-8">
        <div className="label mb-1">ABOUT THE PROJECT</div>
        <h1 className="text-4xl font-black tracking-tight" style={{
          background: "linear-gradient(90deg, #60A5FA, #A78BFA)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>Credits</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Author */}
        <div className="lg:col-span-1">
          <Card className="card-glow-purple">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-white font-black text-3xl shrink-0 mb-4"
                   style={{ background: "linear-gradient(135deg, #14B8A6, #0EA5E9, #8B5CF6)" }}>
                SG
              </div>
              <div className="text-2xl font-bold text-pri">Smruti Gujar</div>
              <div className="font-mono text-xs text-info tracking-[0.18em] mt-1.5 uppercase">AI Engineer</div>
              <p className="text-sec text-sm mt-3 max-w-xs">
                Builder of the Maintenance Wizard — Tata Steel AI Platform.
                Multi-model agentic intelligence, predictive maintenance, and
                explainable diagnostics for heavy industry.
              </p>
              <div className="flex items-center gap-3 mt-5 text-mut">
                <Mail size={14} /> <span className="font-mono text-[10px] tracking-wider">smruti.gujar · AI Engineer</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="THE PROJECT" className="card-glow-blue">
            <h3 className="text-pri text-xl font-bold mb-2">Maintenance Wizard · Tata Steel AI Platform</h3>
            <p className="text-sec leading-relaxed">
              An agentic AI decision-support system for steel-manufacturing maintenance teams.
              It consolidates sensor telemetry, equipment manuals, SOPs, historical breakdowns,
              and operational logs to deliver explainable diagnostics, predictive failure
              warnings, prioritized maintenance actions, and structured reports — all through a
              natural-language multi-model wizard.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div className="bg-[#131C33] border border-d rounded-lg p-3">
                <div className="font-mono text-2xl text-info">8</div>
                <div className="label">Pre-seeded assets</div>
              </div>
              <div className="bg-[#131C33] border border-d rounded-lg p-3">
                <div className="font-mono text-2xl text-purple">2</div>
                <div className="label">LLM models</div>
              </div>
              <div className="bg-[#131C33] border border-d rounded-lg p-3">
                <div className="font-mono text-2xl text-cyan">17</div>
                <div className="label">Spare parts</div>
              </div>
              <div className="bg-[#131C33] border border-d rounded-lg p-3">
                <div className="font-mono text-2xl text-healthy">9</div>
                <div className="label">Live modules</div>
              </div>
            </div>
          </Card>

          <Card title="TECH STACK">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="label">FRONTEND</div>
                <ul className="text-sec text-sm space-y-1.5">
                  <li>· React 19 + React Router</li>
                  <li>· TailwindCSS</li>
                  <li>· Recharts (live sensor + analytics)</li>
                  <li>· lucide-react icons</li>
                  <li>· jsPDF (report export)</li>
                  <li>· react-markdown (AI rendering)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="label">BACKEND</div>
                <ul className="text-sec text-sm space-y-1.5">
                  <li>· FastAPI (Python)</li>
                  <li>· Motor (async MongoDB)</li>
                  <li>· Gemini 2.5 Flash (AI generation)</li>
                  <li>· Groq Whisper (speech-to-text)</li>
                  <li>· Claude Sonnet 4.5 (reasoning)</li>
                  <li>· GPT-5.2 (reasoning)</li>
                  <li>· Whisper-1 + TTS-1 (voice mode)</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card title="FEATURES" className="card-glow-teal">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                ["Multi-model AI Wizard with voice mode", Sparkles],
                ["Per-asset RAG over manuals + SOPs", Cpu],
                ["Live sensor streams + health gauges", Zap],
                ["Risk matrix (severity × urgency)", Award],
                ["Predictive Remaining Useful Life", Sparkles],
                ["Dynamic 7-day Gantt scheduler", Cpu],
                ["Industrial spares risk optimizer", Zap],
                ["PDF report export + digital logbook", Award],
              ].map(([label, Icon]) => (
                <div key={label} className="flex items-center gap-3 bg-[#131C33] border border-d rounded-lg p-3">
                  <Icon size={16} className="text-info shrink-0" />
                  <span className="text-pri text-sm">{label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
