import React from "react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

const tooltipStyle = {
  background: "#10141D",
  border: "1px solid #334155",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 12,
  color: "#F8FAFC",
};

export const Sparkline = ({ data, color = "#E8590C", height = 40 }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={1.5}
        fill={`url(#g-${color})`}
        dot={false}
        isAnimationActive={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export const SensorChart = ({ data, color = "#E8590C", unit = "", label = "" }) => (
  <ResponsiveContainer width="100%" height={180}>
    <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
      <CartesianGrid stroke="#1E293B" strokeDasharray="2 4" />
      <XAxis
        dataKey="t"
        tick={{ fill: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono" }}
        tickFormatter={(t) =>
          new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
        stroke="#334155"
        minTickGap={40}
      />
      <YAxis
        tick={{ fill: "#64748B", fontSize: 10, fontFamily: "JetBrains Mono" }}
        stroke="#334155"
        width={48}
      />
      <Tooltip
        contentStyle={tooltipStyle}
        labelFormatter={(t) => new Date(t).toLocaleString()}
        formatter={(v) => [`${v} ${unit}`, label]}
      />
      <Line
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={1.8}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

export const HealthGauge = ({ value, size = 140 }) => {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const offset = c * (1 - v / 100);
  const color = v >= 70 ? "#10B981" : v >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1E293B"
          strokeWidth="8"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth="8"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-3xl font-light text-pri">{v}</div>
        <div className="label">Health</div>
      </div>
    </div>
  );
};
