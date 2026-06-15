import React from "react";
import {
  ArrowRight,
  BarChart3,
  Cpu,
  DatabaseZap,
  Gauge,
  Network,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";

function BrandMark({ large = false }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-md border border-cyan-300/45 bg-[#071a33] shadow-[0_0_28px_rgba(34,211,238,0.18)] ${
        large ? "h-14 w-14" : "h-9 w-9"
      }`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full" aria-label="Tata Steel" role="img">
        <rect width="48" height="48" fill="#071A33" />
        <path
          d="M8 16C17.5 6.8 31 6.8 40 16C32.8 13.7 27.8 15.1 24 21.2C20.2 15.1 15.2 13.7 8 16Z"
          fill="#22D3EE"
        />
        <path
          d="M12 21.5C18.3 20.1 21.9 23.5 24 31.5C26.1 23.5 29.7 20.1 36 21.5C30.9 24 28.2 28.2 27.1 37H20.9C19.8 28.2 17.1 24 12 21.5Z"
          fill="#60A5FA"
        />
        <rect x="6" y="35" width="36" height="7" rx="1.2" fill="#DA291C" />
        <text
          x="24"
          y="40.2"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="4.8"
          fontWeight="800"
          letterSpacing="0.35"
          fill="#FFFFFF"
        >
          TATA STEEL
        </text>
      </svg>
    </div>
  );
}

function DashboardMockup() {
  const bars = [34, 58, 42, 76, 54, 91, 65, 82, 49, 70, 88, 61];

  return (
    <div className="relative mx-auto mt-12 w-full max-w-3xl">
      <div className="absolute -inset-8 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-xl border border-slate-600/70 bg-[#0a1221] shadow-[0_32px_90px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-slate-700/80 bg-[#111b2d] px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            maintenance-wizard.local
          </div>
          <span className="h-2 w-2 rounded-full bg-emerald-300 pulse-dot text-emerald-300" />
        </div>

        <div className="grid min-h-[300px] grid-cols-[110px_1fr]">
          <div className="border-r border-slate-800 bg-[#070d19] p-3">
            <div className="mb-4 flex items-center gap-2">
              <BrandMark />
              <div>
                <div className="text-xs font-black text-pri">Wizard</div>
                <div className="font-mono text-[8px] uppercase tracking-wider text-cyan">Ops</div>
              </div>
            </div>
            {["Dashboard", "AI Chat", "Assets", "Alerts", "Reports"].map((item, idx) => (
              <div
                key={item}
                className={`mb-2 rounded border px-2 py-2 text-[10px] ${
                  idx === 0
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan"
                    : "border-slate-800 bg-slate-900/40 text-slate-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="grid gap-3 p-4">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Plant Health", "86%", "text-emerald-300"],
                ["Open Alerts", "10", "text-amber-300"],
                ["Critical RUL", "6d", "text-red-300"],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-md border border-slate-800 bg-[#101827] p-3">
                  <div className="font-mono text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
                  <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-md border border-slate-800 bg-[#101827] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-pri">Live Telemetry</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-cyan">Streaming</span>
                </div>
                <svg viewBox="0 0 300 120" className="h-32 w-full">
                  <polyline
                    points="0,92 28,70 56,82 84,44 112,67 140,34 168,52 196,24 224,42 252,18 280,36 300,28"
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="3"
                  />
                  <polyline
                    points="0,105 28,96 56,88 84,98 112,78 140,85 168,64 196,72 224,55 252,62 280,48 300,54"
                    fill="none"
                    stroke="#DA291C"
                    strokeWidth="2"
                    opacity="0.8"
                  />
                </svg>
              </div>

              <div className="rounded-md border border-slate-800 bg-[#101827] p-3">
                <div className="mb-3 text-xs font-bold text-pri">Anomaly Heatmap</div>
                <div className="grid grid-cols-6 gap-1">
                  {bars.map((v, i) => (
                    <span
                      key={i}
                      className="h-7 rounded-sm"
                      style={{
                        background: `rgba(${v > 75 ? "239,68,68" : v > 55 ? "245,158,11" : "34,211,238"}, ${
                          v / 100
                        })`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 rounded border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                  Sentinel fallback ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BootScreen() {
  return (
    <div className="launch-shell flex min-h-screen items-center justify-center overflow-hidden bg-[#05080f] px-6">
      <div className="absolute inset-0 launch-grid opacity-50" />
      <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-xl border border-slate-800/80 bg-[#070d19]/80 px-8 py-10 text-center shadow-[0_0_90px_rgba(34,211,238,0.12)] backdrop-blur-xl">
        <BrandMark large />
        <div className="mt-5 text-2xl font-black text-pri">Maintenance Wizard</div>
        <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Operations database hydration
        </div>
        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
          <div className="launch-progress h-full rounded-full" />
        </div>
        <div className="mt-5 font-mono text-sm text-slate-400">Console connection established.</div>
      </div>
    </div>
  );
}

export default function LaunchScreen({ mode = "landing", onLaunch }) {
  if (mode === "booting") {
    return <BootScreen />;
  }

  return (
    <div className="launch-shell min-h-screen overflow-hidden bg-[#05080f] text-pri">
      <div className="absolute inset-0 launch-grid opacity-50" />
      <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

      <header className="relative z-10 border-b border-slate-900/90 bg-[#070b13]/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <div className="text-lg font-black leading-tight">Maintenance Wizard</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
                Tata Steel AI Platform
              </div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-400 lg:flex">
            <a href="#features" className="transition hover:text-pri">Features</a>
            <a href="#diagnostics" className="transition hover:text-pri">Diagnostics</a>
            <a href="#architecture" className="transition hover:text-pri">Architecture</a>
            <a href="#stack" className="transition hover:text-pri">Tech Stack</a>
          </nav>

          <button onClick={onLaunch} className="launch-button">
            Launch Console <ArrowRight size={15} />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl flex-col items-center justify-center px-5 py-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300">
            <ShieldCheck size={13} /> Reliability Platform v1.5
          </div>

          <h1 className="max-w-5xl text-4xl font-black leading-tight text-white md:text-6xl">
            Industrial intelligence for{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              steel plant reliability
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400">
            Optimize maintenance operations with live anomaly thresholds, AI diagnosis,
            RUL triage, spare risk, and supervisor-ready work plans.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onLaunch} className="launch-button launch-button-primary">
              Enter Operations Dashboard <ArrowRight size={15} />
            </button>
            <a href="#architecture" className="launch-button launch-button-muted">
              Explore Blueprint
            </a>
          </div>

          <DashboardMockup />
        </section>

        <section id="features" className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-4">
          {[
            [Gauge, "Live Plant Health", "Fleet health, RUL and critical alerts in one command view."],
            [Cpu, "AI Diagnosis", "Sentinel combines sensors, SOPs, alerts and logbook context."],
            [DatabaseZap, "Spare Risk", "Inventory risk exposure and purchase gating for supervisors."],
            [Network, "Sensor Streaming", "WebSocket telemetry keeps equipment pages live."],
          ].map(([Icon, title, body]) => (
            <div key={title} className="rounded-lg border border-slate-800 bg-[#0b1220]/80 p-5">
              <Icon size={22} className="text-cyan" />
              <div className="mt-4 text-sm font-black text-pri">{title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{body}</p>
            </div>
          ))}
        </section>

        <section id="diagnostics" className="mx-auto max-w-7xl px-5 pb-16">
          <div className="rounded-xl border border-slate-800 bg-[#0b1220]/80 p-6 md:p-8">
            <div className="mb-2 inline-flex items-center gap-2 rounded bg-cyan-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">
              <Server size={13} /> Project Architecture
            </div>
            <h2 className="text-3xl font-black">Built on the actual Maintenance Wizard stack</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              The console uses a React operations layer, a FastAPI service layer, MongoDB plant data,
              streaming sensor routes, and AI provider routing through Gemini and Groq with a local
              Sentinel fallback when cloud models are unavailable.
            </p>
            <div id="stack" className="mt-6 grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-lg border border-slate-800 bg-[#070d19] p-5">
                <div className="mb-4 text-sm font-black text-pri">Frontend Stack</div>
                {[
                  [Cpu, "React 19 + React Router", "Launch layer, console routing, and page modules."],
                  [Gauge, "Tailwind + custom CSS", "Industrial dark UI, cards, launch screen, and dashboard styling."],
                  [BarChart3, "Recharts + jsPDF", "Analytics visuals and asset report PDF export."],
                  [Network, "Axios + WebSocket client", "REST API calls and live asset sensor streams."],
                ].map(([Icon, title, body]) => (
                  <div key={title} className="mb-4 flex gap-3 rounded-md border border-slate-800 bg-[#0b1220] p-3 last:mb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-cyan-400/30 bg-cyan-400/10">
                      <Icon size={17} className="text-cyan" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-pri">{title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#070d19]">
                <div className="grid grid-cols-[0.75fr_1.2fr_1fr] border-b border-slate-800 bg-[#111827] px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                  <span>Layer</span>
                  <span>Technology Used</span>
                  <span>Role in System</span>
                </div>
                {[
                  ["Backend", "FastAPI + Pydantic", "API routes, validation, reports, RBAC"],
                  ["Database", "MongoDB + Motor", "Assets, alerts, sessions, logs, knowledge"],
                  ["AI Chat", "Gemini + Groq", "FORGEOPS Sentinel streaming responses"],
                  ["Fallback", "Local rule engine", "Plant-data response during provider outages"],
                  ["Realtime", "FastAPI WebSockets", "Live sensor ticks for equipment pages"],
                  ["Voice", "Groq STT + TTS hook", "Voice input and speech playback flow"],
                ].map((row) => (
                  <div key={row[0]} className="grid grid-cols-[0.75fr_1.2fr_1fr] border-b border-slate-900 px-4 py-4 text-sm last:border-b-0">
                    {row.map((cell, idx) => (
                      <span key={idx} className={idx === 1 ? "font-semibold text-cyan" : "text-slate-300"}>
                        {cell}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="architecture" className="mx-auto max-w-4xl px-5 pb-20 text-center">
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-8">
            <Zap size={26} className="mx-auto text-cyan" />
            <h2 className="mt-4 text-3xl font-black">Ready to simulate plant health?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Launch the console to view the dashboard, AI chat, equipment fleet, scheduler,
              spares optimizer, knowledge center, reports, and live sensor streams.
            </p>
            <button onClick={onLaunch} className="launch-button launch-button-primary mt-6">
              Launch Console <ArrowRight size={15} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
