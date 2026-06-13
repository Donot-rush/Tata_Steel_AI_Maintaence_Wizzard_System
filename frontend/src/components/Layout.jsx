import React, { useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, MessageSquareCode, Wrench, BarChart3,
  Calendar, Package, Bell, FileText, Database, Award,
  Activity, Stethoscope, AlertTriangle,
  FileSignature, Bot, ShieldCheck, ChevronDown,
} from "lucide-react";
import { useRole } from "../lib/RoleContext";

const NAV_MAIN = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/wizard", label: "AI Chat", icon: MessageSquareCode, testid: "nav-wizard" },
  { to: "/equipment", label: "Equipment", icon: Wrench, testid: "nav-equipment" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, testid: "nav-analytics" },
  { to: "/scheduler", label: "Scheduler", icon: Calendar, testid: "nav-scheduler" },
  { to: "/inventory", label: "Inventory", icon: Package, testid: "nav-inventory" },
  { to: "/alerts", label: "Alerts", icon: Bell, testid: "nav-alerts" },
  { to: "/reports", label: "Reports", icon: FileText, testid: "nav-reports" },
  { to: "/knowledge", label: "Knowledge Center", icon: Database, testid: "nav-knowledge" },
  { to: "/credits", label: "Credits", icon: Award, testid: "nav-credits" },
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

export default function Layout({ children, criticalCount = 0 }) {
  const loc = useLocation();
  const clock = useClock();
  const { role, setRole } = useRole();
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <div className="App min-h-screen flex">
      <aside
        className="w-72 fixed left-0 top-0 bottom-0 border-r border-d bg-[#0B1224] z-50 flex flex-col"
        data-testid="sidebar"
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-d flex items-center gap-3">
          <div className="tata-logo">
            <span className="inner">TATA</span>
          </div>
          <div className="min-w-0">
            <div className="font-sans font-bold text-pri text-[17px] leading-tight">
              Maintenance Wizard
            </div>
            <div className="text-xs text-info font-mono tracking-wide mt-0.5 truncate">
              Tata Steel AI Platform
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="py-3 flex-1 overflow-y-auto scrollbar-thin">
          <div className="label px-5 py-2">Main</div>
          {NAV_MAIN.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to ||
              (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                data-testid={n.testid}
                className={`nav-item ${active ? "active" : ""}`}
              >
                <Icon size={17} strokeWidth={1.6} />
                <span className="flex-1">{n.label}</span>
                {n.to === "/alerts" && criticalCount > 0 && (
                  <span className="badge badge-critical !py-0 !px-1.5 !text-[10px]">
                    {criticalCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          <div className="label px-5 py-2 mt-3">Quick Actions</div>
          {QUICK_ACTIONS.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.label}
                to={q.to}
                data-testid={`quick-${q.label.toLowerCase().replace(/ /g, "-")}`}
                className="nav-item"
              >
                <Icon size={16} strokeWidth={1.6} className="text-purple" />
                <span>{q.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-d p-3" data-testid="user-card">
          <div className="bg-[#131C33] border border-d rounded-xl p-3 flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                 style={{ background: "linear-gradient(135deg, #14B8A6, #0EA5E9)" }}>
              SG
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-pri font-semibold text-sm leading-tight truncate">Smruti Gujar</div>
              <div className="font-mono text-[10px] tracking-[0.14em] text-mut uppercase mt-0.5">AI ENGINEER</div>
              <button
                onClick={() => setRoleOpen(!roleOpen)}
                data-testid="role-switcher"
                className="flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/40 hover:border-blue-400 transition w-fit"
              >
                <ShieldCheck size={11} className="text-info" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-info">{role}</span>
                <ChevronDown size={10} className="text-info" />
              </button>
              {/* removed Github/LinkedIn/portfolio icons per request */}
              {roleOpen && (
                <div className="absolute bottom-full mb-2 left-3 right-3 bg-[#0B1224] border border-d rounded-lg shadow-xl z-50 overflow-hidden" data-testid="role-menu">
                  {["engineer", "supervisor", "admin"].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setRoleOpen(false); }}
                      data-testid={`role-${r}`}
                      className={`w-full text-left px-3 py-2 text-xs font-mono uppercase tracking-wider hover:bg-blue-500/10 ${
                        role === r ? "text-info bg-blue-500/5" : "text-sec"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between px-1 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot text-emerald-400" />
              <span className="font-mono text-[10px] tracking-wider text-sec">AI Engine Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1 mt-1.5 text-mut">
            <span className="font-mono text-[10px] tracking-wider text-info">{clock}</span>
            <span className="font-mono text-[10px] tracking-wider">·</span>
            <Activity size={10} />
            <span className="font-mono text-[10px] tracking-wider">12h 46m</span>
          </div>
        </div>
      </aside>

      <main className="ml-72 flex-1 min-h-screen blueprint-bg relative">
        <div className="signature-badge" data-testid="signature">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot text-cyan-400" />
          AGENT · MAESTRO v1.0 · Built by Smruti Gujar
        </div>
        {children}
        <Link to="/wizard" className="fab" data-testid="fab-chat" title="Ask Maintenance Wizard">
          <Bot size={22} className="text-white" />
        </Link>
      </main>
    </div>
  );
}
