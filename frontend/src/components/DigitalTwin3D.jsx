import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Isometric SVG 3D Digital Twin — distinct from any reference UI.
 * Renders the steel plant as floating isometric blocks on a holographic platform,
 * with auto-rotating perspective, status pulses, and click-to-inspect.
 */
const STATUS_COLOR = {
  healthy: { top: "#10B981", side: "#047857", glow: "#10B98155" },
  warning: { top: "#F59E0B", side: "#B45309", glow: "#F59E0B55" },
  critical: { top: "#EF4444", side: "#991B1B", glow: "#EF444466" },
};

function IsoBlock({ x, y, h, status, code, name, onClick, hovered, setHovered }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.healthy;
  const w = 18;        // block half-width (smaller for 30 assets)
  const d = 18;
  const sx = x;
  const sy = y - h;
  const isHover = hovered === code;
  return (
    <g
      transform={`translate(${sx},${sy})`}
      style={{ cursor: "pointer", filter: isHover ? `drop-shadow(0 0 14px ${c.glow})` : `drop-shadow(0 6px 18px ${c.glow})` }}
      onMouseEnter={() => setHovered(code)}
      onMouseLeave={() => setHovered(null)}
      onClick={onClick}
    >
      {/* glow disc on the floor */}
      <ellipse cx="0" cy={h + 8} rx={w + 8} ry={(d + 8) / 2} fill={c.glow} />

      {/* Right face */}
      <polygon
        points={`0,${h}  ${w},${h - d/2}  ${w},${-d/2}  0,0`}
        fill={c.side} opacity="0.85"
      />
      {/* Left face */}
      <polygon
        points={`0,${h}  ${-w},${h - d/2}  ${-w},${-d/2}  0,0`}
        fill={c.side} opacity="0.65"
      />
      {/* Top face */}
      <polygon
        points={`0,0  ${w},${-d/2}  0,${-d}  ${-w},${-d/2}`}
        fill={c.top} stroke="#0B1224" strokeWidth="0.5"
      />
      {/* Pulse on top — critical only */}
      {status === "critical" && (
        <circle cx="0" cy={-d/2} r="3" fill="#fff">
          <animate attributeName="r" values="3;8;3" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Hover label */}
      {isHover && (
        <g transform={`translate(0,${-d - 22})`}>
          <rect x="-44" y="-12" width="88" height="22" rx="3" fill="#0B1224" stroke={c.top} />
          <text x="0" y="3" textAnchor="middle" fill={c.top} fontFamily="JetBrains Mono" fontSize="9" fontWeight="700">{code}</text>
        </g>
      )}
    </g>
  );
}

export default function DigitalTwin3D({ assets = [], onPick }) {
  const nav = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [view, setView] = useState("iso"); // iso | top
  const [rotation, setRotation] = useState(0);

  // Layout: place 30 assets in TWO concentric rings if there are many
  const N = assets.length;
  const placements = assets.map((a, i) => {
    const innerCount = N <= 12 ? N : Math.ceil(N * 0.55);
    const isInner = i < innerCount;
    const ringSize = isInner ? innerCount : (N - innerCount);
    const ringIdx = isInner ? i : (i - innerCount);
    const angle = (ringIdx / Math.max(ringSize, 1)) * Math.PI * 2 + (rotation * Math.PI / 180);
    const radius = isInner ? (N <= 12 ? 130 : 95) : 175;
    const wx = Math.cos(angle) * radius;
    const wy = Math.sin(angle) * radius;
    const ix = (wx - wy) * Math.cos(Math.PI / 6);
    const iy = (wx + wy) * Math.sin(Math.PI / 6) * 0.7;
    const h = a.status === "critical" ? 56 : a.status === "warning" ? 40 : 28;
    return { ...a, ix, iy, h };
  });

  const handlePick = (a) => {
    if (onPick) onPick(a.code);
    else nav(`/equipment/${a.id}`);
  };

  return (
    <div className="relative w-full h-full" data-testid="digital-twin-3d">
      {/* Controls */}
      <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
        <button onClick={() => setRotation((r) => r - 30)} className="btn btn-secondary !px-2 !py-1 !text-[10px]" data-testid="rotate-left">↺</button>
        <button onClick={() => setRotation((r) => r + 30)} className="btn btn-secondary !px-2 !py-1 !text-[10px]" data-testid="rotate-right">↻</button>
        <button onClick={() => setView(view === "iso" ? "top" : "iso")} className="btn btn-secondary !px-2 !py-1 !text-[10px]" data-testid="toggle-view">
          {view === "iso" ? "TOP-DOWN" : "ISOMETRIC"}
        </button>
      </div>

      <svg viewBox="-280 -200 560 380" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
        {/* Background grid (top-down view) */}
        <defs>
          <radialGradient id="floorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(34,211,238,0.18)" />
            <stop offset="60%" stopColor="rgba(59,130,246,0.06)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="ringStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Floor ellipse */}
        <ellipse cx="0" cy="60" rx="240" ry="120" fill="url(#floorGlow)" />

        {/* Iso grid */}
        {Array.from({ length: 11 }).map((_, i) => {
          const o = (i - 5) * 26;
          return (
            <g key={i} stroke="#1E3A5F" strokeWidth="0.5" opacity="0.4">
              <line x1={o*Math.cos(Math.PI/6)+260*Math.cos(Math.PI/6)} y1={o*Math.sin(Math.PI/6)+60-260*Math.sin(Math.PI/6)*0.7}
                    x2={o*Math.cos(Math.PI/6)-260*Math.cos(Math.PI/6)} y2={o*Math.sin(Math.PI/6)+60+260*Math.sin(Math.PI/6)*0.7} />
              <line x1={-o*Math.cos(Math.PI/6)+260*Math.cos(Math.PI/6)} y1={o*Math.sin(Math.PI/6)+60+260*Math.sin(Math.PI/6)*0.7}
                    x2={-o*Math.cos(Math.PI/6)-260*Math.cos(Math.PI/6)} y2={o*Math.sin(Math.PI/6)+60-260*Math.sin(Math.PI/6)*0.7} />
            </g>
          );
        })}

        {/* Outer rings (rotating) */}
        <g transform={`translate(0,60)`} style={{ transformOrigin: "0 0" }}>
          <ellipse cx="0" cy="0" rx="200" ry="100" fill="none" stroke="url(#ringStroke)" strokeWidth="1" opacity="0.6" />
          <ellipse cx="0" cy="0" rx="240" ry="120" fill="none" stroke="url(#ringStroke)" strokeWidth="0.5" opacity="0.4" strokeDasharray="4 4" />
        </g>

        {/* Connector beams from center to each block */}
        {placements.map((p) => (
          <line key={`l-${p.id}`}
                x1="0" y1="60"
                x2={p.ix} y2={p.iy + 60 - p.h/2}
                stroke="#3B82F6" strokeWidth="0.7" opacity="0.35" strokeDasharray="2 3" />
        ))}

        {/* Central core — pulsing icosahedron */}
        <g transform={`translate(0,60)`}>
          <circle r="22" fill="none" stroke="#8B5CF6" strokeWidth="0.8" opacity="0.5">
            <animate attributeName="r" values="22;28;22" dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.6s" repeatCount="indefinite" />
          </circle>
          <polygon points="-14,8 14,8 16,-4 0,-14 -16,-4" fill="#8B5CF6" opacity="0.3" />
          <circle r="8" fill="#22D3EE" filter="url(#glow)" />
          <text x="0" y="34" textAnchor="middle" fill="#22D3EE" fontFamily="JetBrains Mono" fontSize="7" letterSpacing="2">CORE · MAESTRO</text>
        </g>

        {/* Asset blocks */}
        {placements.sort((a, b) => a.iy - b.iy).map((p) => (
          <IsoBlock
            key={p.id}
            x={p.ix} y={p.iy + 60} h={p.h}
            status={p.status}
            code={p.code}
            name={p.name}
            onClick={() => handlePick(p)}
            hovered={hovered}
            setHovered={setHovered}
          />
        ))}

        {/* Compass / scale */}
        <g transform="translate(-250,-160)">
          <text fill="#64748B" fontFamily="JetBrains Mono" fontSize="8">N ↑ · ISO · 30°</text>
        </g>
      </svg>
    </div>
  );
}
