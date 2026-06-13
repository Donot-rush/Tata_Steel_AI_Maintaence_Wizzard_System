# Maintenance Wizard — Tata Steel AI Platform

## Branding (locked)
- **Product**: Maintenance Wizard
- **Sub-brand**: Tata Steel AI Platform
- **Author**: Smruti Gujar — AI Engineer (role switcher; no social icons)
- **Signature**: `AGENT · MAESTRO V1.0 · BUILT BY SMRUTI GUJAR` corner badge

## Scale
- **30 assets** across 6 sectors (Blast Furnace 6 · Steel Melting 5 · Rolling Mill 6 · Coke Oven 5 · Sinter Plant 5 · Power Plant 3)
- 13 seeded alerts, 6 logbook entries, 12 knowledge documents, 17 spare parts
- **"JUMP TO ASSET"** quick selector on Equipment Fleet — selecting any of the 30 assets navigates straight to its full detail page (gauge, sensors, recommendations, AI Wizard)

## Distinctive design language (NOT a clone of any reference)
- **Isometric SVG 3D Digital Twin** — assets rendered as floating geometric blocks (octahedron/cube/cylinder by status), color-coded with floor glow discs, dashed beams to a pulsing central MAESTRO core, rotating outer rings, interactive rotate/top-down controls
- **Bento mosaic** dashboard with mixed-size tiles (3D hero wide-left, Plant Health ring vertical-right, 4 micro KPI strip, Critical Attention + Live Telemetry below)
- **Orbital AI Chat hero** — 6 sample prompts arranged in a circular ring around a pulsing core orb with 3 concentric animated rings (not a 2×3 grid)
- **Custom angular logo** with clip-path notch + Tata-red inner mark
- **HUD-style page titles** with vertical accent stripe + "TATA · STEEL · OPS · COMMAND" eyebrow text
- **Diagonal corner notches** on every card via clip-path
- **Hex-grid 60°/-60° background pattern** instead of plain blueprint

## Features (all functional)
- Plant Dashboard (3D Digital Twin, Plant Health Index ring, KPI strip, Critical Attention, Live Telemetry stream)
- AI Decision-Support Console (orbital prompts, Claude Sonnet 4.5 + GPT-5.2 switchable, SSE streaming, **voice in via Whisper-1 + voice out via TTS-1**, Agent Thought Logs, feedback, sessions)
- Equipment Fleet (sector pill filters, gradient health bars, **live WebSocket sensor stream** with LIVE badges)
- Equipment detail (gauge + 4 sensor charts updating live + recommendations)
- Analytics & ROI (health scores, cost analysis, Health Degradation Leaderboard)
- Scheduler (7-day Gantt + scope/engineer/downtime panel)
- Industrial Spares Risk Optimizer (17 parts, ₹ risk-exposure, 1-click PO with **role gating**)
- Alerts (severity filter + acknowledge + risk matrix)
- Knowledge Center (ingestion-pipeline UI + KB search)
- Reports (PDF export via jsPDF)
- Credits

## P1 features delivered
- **Role-Based Access Control** (engineer / supervisor / admin) — switcher under user card, X-Role header on every request, backend 403 enforcement, graceful UI lock-icon fallbacks
- **WebSocket live sensor stream** — `/api/ws/sensors/{asset_id}` ticks every 2 s, Equipment detail page shows LIVE badges with live tick values

## Tech
- Backend: FastAPI + Motor + emergentintegrations (Claude 4.5, GPT-5.2, Whisper-1, TTS-1) + WebSockets
- Frontend: React 19 + Tailwind + custom CSS design system + jsPDF + react-markdown + native SVG isometric 3D
