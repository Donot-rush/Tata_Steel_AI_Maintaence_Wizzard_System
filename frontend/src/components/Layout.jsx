import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  Bot,
  Calendar,
  ChevronDown,
  Clock3,
  Database,
  Factory,
  FileSignature,
  FileText,
  LayoutDashboard,
  MessageSquareCode,
  Network,
  Package,
  ShieldCheck,
  Stethoscope,
  Wrench,
} from "lucide-react";
import { useRole } from "../lib/RoleContext";

const NAV_MAIN = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard", code: "01" },
  { to: "/wizard", label: "AI Chat", icon: MessageSquareCode, testid: "nav-wizard", code: "02" },
  { to: "/equipment", label: "Equipment", icon: Wrench, testid: "nav-equipment", code: "03" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testid: "nav-analytics", code: "04" },
  { to: "/scheduler", label: "Scheduler", icon: Calendar, testid: "nav-scheduler", code: "05" },
  { to: "/inventory", label: "Inventory", icon: Package, testid: "nav-inventory", code: "06" },
  { to: "/alerts", label: "Alerts", icon: Bell, testid: "nav-alerts", code: "07" },
  { to: "/reports", label: "Reports", icon: FileText, testid: "nav-reports", code: "08" },
  { to: "/knowledge", label: "Knowledge Center", icon: Database, testid: "nav-knowledge", code: "09" },
  { to: "/credits", label: "Credits", icon: Award, testid: "nav-credits", code: "10" },
];

const QUICK_ACTIONS = [
  { to: "/wizard?prompt=diagnose", label: "Diagnose Issue", icon: Stethoscope },
  { to: "/wizard?prompt=predict", label: "Predict Failures", icon: AlertTriangle },
  { to: "/reports", label: "Generate Report", icon: FileSignature },
];

function useClock() {
  const [t, setT] = useState(new Date());

  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const ss = String(t.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function isActivePath(pathname, to) {
  return pathname === to || (to !== "/" && pathname.startsWith(to));
}

export default function Layout({ children, criticalCount = 0 }) {
  const loc = useLocation();
  const clock = useClock();
  const { role, setRole } = useRole();
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <div className="App min-h-screen flex bg-[#060B18]">
      <aside
        className="fixed left-0 top-0 bottom-0 z-50 flex w-80 border-r border-slate-800 bg-[#070d19] text-sec"
        data-testid="sidebar"
      >
        <div className="flex w-[72px] flex-col items-center border-r border-slate-800 bg-[#050a13] px-3 py-4">
          <Link
            to="/"
            className="group flex h-12 w-12 items-center justify-center overflow-hidden rounded-sm border border-cyan-300/45 bg-[#071a33] shadow-[0_0_24px_rgba(34,211,238,0.16)] transition hover:border-cyan-200"
            title="Maintenance Wizard"
          >
            <svg
              viewBox="0 0 48 48"
              className="h-full w-full"
              role="img"
              aria-label="Tata Steel"
            >
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
          </Link>

          <div className="mt-6 flex flex-1 flex-col items-center gap-3">
            <div className="h-12 w-px bg-gradient-to-b from-cyan-300 to-transparent" />
            <div
              className="font-mono text-[10px] uppercase tracking-[0.26em] text-cyan"
              style={{ writingMode: "vertical-rl" }}
            >
              OPS
            </div>
            <div className="h-12 w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />
            <div className="grid gap-2">
              {NAV_MAIN.slice(0, 4).map((n) => {
                const Icon = n.icon;
                const active = isActivePath(loc.pathname, n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    title={n.label}
                    className={`flex h-9 w-9 items-center justify-center rounded border transition ${
                      active
                        ? "border-cyan-300 bg-cyan-300/15 text-cyan"
                        : "border-slate-800 bg-slate-900/50 text-slate-500 hover:border-slate-600 hover:text-pri"
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.7} />
                  </Link>
                );
              })}
            </div>
          </div>

          <Link
            to="/wizard"
            className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-purple-400/40 bg-purple-500/15"
            title="Ask Maintenance Wizard"
          >
            <Bot size={19} className="text-purple" />
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-800 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-sans text-[18px] font-black leading-tight text-pri">
                  Maintenance Wizard
                </div>
                <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">
                  Tata Steel AI Platform
                </div>
              </div>
              <div className="rounded border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                Live
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded border border-slate-800 bg-[#0b1424] p-2">
                <div className="flex items-center gap-2 text-[11px] text-mut">
                  <Factory size={13} className="text-info" />
                  Plant
                </div>
                <div className="mt-1 font-mono text-xs text-pri">Jamshedpur</div>
              </div>
              <div className="rounded border border-slate-800 bg-[#0b1424] p-2">
                <div className="flex items-center gap-2 text-[11px] text-mut">
                  <Network size={13} className="text-healthy" />
                  Network
                </div>
                <div className="mt-1 font-mono text-xs text-healthy">Online</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
            <div className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
              Plant Modules
            </div>

            <div className="space-y-1">
              {NAV_MAIN.map((n) => {
                const Icon = n.icon;
                const active = isActivePath(loc.pathname, n.to);
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.to === "/"}
                    data-testid={n.testid}
                    className={`group relative grid grid-cols-[34px_1fr_auto] items-center gap-3 rounded-md border px-3 py-2.5 transition ${
                      active
                        ? "border-cyan-400/55 bg-[#102033] text-pri shadow-[inset_3px_0_0_#22D3EE]"
                        : "border-transparent text-sec hover:border-slate-700 hover:bg-[#0d1728] hover:text-pri"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded border ${
                        active
                          ? "border-cyan-400/45 bg-cyan-400/10 text-cyan"
                          : "border-slate-800 bg-[#080f1c] text-slate-500 group-hover:text-cyan"
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{n.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-mut">
                        Module {n.code}
                      </span>
                    </span>
                    {n.to === "/alerts" && criticalCount > 0 ? (
                      <span className="rounded-full border border-red-400/60 bg-red-500/15 px-2 py-0.5 font-mono text-[11px] text-red-300">
                        {criticalCount}
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-cyan-400" />
                    )}
                  </NavLink>
                );
              })}
            </div>

            <div className="mt-5 mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
              Commands
            </div>
            <div className="grid gap-2">
              {QUICK_ACTIONS.map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.label}
                    to={q.to}
                    data-testid={`quick-${q.label.toLowerCase().replace(/ /g, "-")}`}
                    className="flex items-center gap-3 rounded border border-slate-800 bg-[#0b1424] px-3 py-2.5 text-sm font-semibold text-sec transition hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-pri"
                  >
                    <Icon size={16} strokeWidth={1.7} className="text-purple" />
                    <span className="truncate">{q.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-800 p-3" data-testid="user-card">
            <div className="relative rounded-md border border-slate-800 bg-[#0d1728] p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-cyan-300/40 bg-cyan-300/15 text-sm font-black text-cyan">
                  SG
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold text-pri">Smruti Gujar</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-mut">
                    AI Engineer
                  </div>
                  <button
                    onClick={() => setRoleOpen(!roleOpen)}
                    data-testid="role-switcher"
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-blue-400/35 bg-blue-500/10 px-2 py-1 transition hover:border-blue-300"
                  >
                    <ShieldCheck size={12} className="text-info" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-info">{role}</span>
                    <ChevronDown size={11} className="text-info" />
                  </button>
                </div>
              </div>

              {roleOpen && (
                <div
                  className="absolute bottom-full left-3 right-3 z-50 mb-2 overflow-hidden rounded-md border border-slate-700 bg-[#080f1c] shadow-xl"
                  data-testid="role-menu"
                >
                  {["engineer", "supervisor", "admin"].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r);
                        setRoleOpen(false);
                      }}
                      data-testid={`role-${r}`}
                      className={`w-full px-3 py-2 text-left font-mono text-xs uppercase tracking-wider transition hover:bg-blue-500/10 ${
                        role === r ? "bg-blue-500/10 text-info" : "text-sec"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-wider">
              <div className="rounded border border-emerald-400/25 bg-emerald-400/10 px-2 py-2 text-emerald-300">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-300 pulse-dot text-emerald-300" />
                AI Active
              </div>
              <div className="flex items-center justify-center gap-1 rounded border border-slate-800 bg-[#0b1424] px-2 py-2 text-info">
                <Clock3 size={11} />
                {clock}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mut">
              <Activity size={10} />
              <span>Runtime 12h 46m</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-80 flex-1 min-h-screen blueprint-bg relative">
        <div className="signature-badge" data-testid="signature">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot text-cyan-400" />
          AGENT - MAESTRO v1.0 - Built by Smruti Gujar
        </div>
        {children}
        <Link to="/wizard" className="fab" data-testid="fab-chat" title="Ask Maintenance Wizard">
          <Bot size={22} className="text-white" />
        </Link>
      </main>
    </div>
  );
}
