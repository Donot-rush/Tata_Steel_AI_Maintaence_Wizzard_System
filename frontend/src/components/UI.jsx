import React from "react";

export const StatusBadge = ({ status, children, className = "" }) => {
  const map = {
    healthy: "badge-healthy",
    warning: "badge-warning",
    critical: "badge-critical",
    info: "badge-info",
  };
  return (
    <span className={`badge ${map[status] || "badge-info"} ${className}`}>
      {status === "critical" && <span className="pulse-dot bg-current" />}
      {children || status}
    </span>
  );
};

export const Card = ({ title, action, children, className = "", testid }) => (
  <div className={`card ${className}`} data-testid={testid}>
    {title && (
      <div className="card-header">
        <div className="label">{title}</div>
        {action}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

export const Stat = ({ label, value, sub, accent = "text-pri", testid }) => (
  <div className="card p-5" data-testid={testid}>
    <div className="label mb-2">{label}</div>
    <div className={`font-mono text-4xl font-light tracking-tighter ${accent}`}>
      {value}
    </div>
    {sub && <div className="text-xs text-mut mt-2 font-mono">{sub}</div>}
  </div>
);

export const Empty = ({ label = "No data" }) => (
  <div className="text-sec text-sm py-6 text-center font-mono">{label}</div>
);

export const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="w-6 h-6 border-2 border-[#252B3B] border-t-[#E8590C] rounded-full animate-spin" />
  </div>
);
