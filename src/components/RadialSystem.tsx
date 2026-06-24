import { useInView, useReducedMotion } from "framer-motion";
import { useRef, useState } from "react";

// SVG geometry
const CX = 410;
const CY = 340;
const R_NODE = 200;
const RINGS = [90, 145, 200] as const;

const NODES = [
  {
    id: "ads",
    label: "Ads",
    angle: 0,
    caption: "Runs and optimizes spend daily. Replaces the agency retainer.",
  },
  {
    id: "email",
    label: "Email",
    angle: 45,
    caption: "Recovers revenue from abandoned carts and an under-mailed list.",
  },
  {
    id: "wholesale",
    label: "Wholesale",
    angle: 90,
    caption: "Your own branded ordering portal. None of the Brandboom/JOOR fees.",
  },
  {
    id: "merch",
    label: "Merch",
    angle: 135,
    caption: "What to make more of, what to cut, what to drop next.",
  },
  {
    id: "social",
    label: "Social",
    angle: 180,
    caption: "On-brand drafting, scheduling, and what's actually trending.",
  },
  {
    id: "catalog",
    label: "Catalog",
    angle: 225,
    caption: "Clean catalog + SEO/GEO so customers and AI engines find you.",
  },
  {
    id: "ops",
    label: "Ops",
    angle: 270,
    caption: "A daily health check. What needs to happen today, already drafted.",
  },
  {
    id: "assistant",
    label: "Assistant",
    angle: 315,
    caption: "Scheduling, inbox triage, and the voice-driven 'handle this while I'm out.'",
  },
] as const;

function nodeXY(angleDeg: number, r = R_NODE) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

function labelAnchor(angleDeg: number): { anchor: "middle" | "start" | "end"; dx: number; dy: number } {
  const a = ((angleDeg % 360) + 360) % 360;
  if (a === 0)   return { anchor: "middle", dx: 0,   dy: -14 }; // top
  if (a === 180) return { anchor: "middle", dx: 0,   dy: 18  }; // bottom
  if (a < 180)   return { anchor: "start",  dx: 14,  dy: 5   }; // right half
  return                 { anchor: "end",   dx: -14, dy: 5   }; // left half
}

export function RadialSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.15, once: true });
  const reduce = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  const cls = [
    "radial-system",
    !reduce && inView ? "is-building" : "",
    reduce ? "is-static" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const activeNode = NODES.find((n) => n.id === activeId);

  return (
    <div ref={containerRef} className={cls}>
      <svg
        viewBox="0 0 820 680"
        aria-label="One dashboard connecting eight AI executives"
        role="img"
        onMouseLeave={() => setActiveId(null)}
      >
        <defs>
          <radialGradient id="rsGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#B8902E" stopOpacity="0.13" />
            <stop offset="100%" stopColor="#B8902E" stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* Ambient glow */}
        <ellipse
          className="rs-glow"
          cx={CX} cy={CY} rx={250} ry={250}
          fill="url(#rsGlow)"
        />

        {/* Guide rings */}
        {RINGS.map((r, i) => (
          <circle
            key={r}
            className={`rs-ring rs-ring-${i}`}
            cx={CX} cy={CY} r={r}
            fill="none"
            stroke="#B8902E"
            strokeWidth="0.6"
            strokeDasharray="2 7"
          />
        ))}

        {/* Spokes */}
        {NODES.map(({ id, angle }, i) => {
          const { x, y } = nodeXY(angle);
          return (
            <line
              key={`spoke-${id}`}
              className={`rs-spoke rs-spoke-${i}`}
              x1={CX} y1={CY}
              x2={x}  y2={y}
              stroke="#B8902E"
              strokeWidth="0.6"
              strokeDasharray="210"
            />
          );
        })}

        {/* Nodes */}
        {NODES.map(({ id, label, angle }, i) => {
          const { x, y } = nodeXY(angle);
          const { anchor, dx, dy } = labelAnchor(angle);
          const active = activeId === id;
          return (
            <g
              key={id}
              transform={`translate(${x},${y})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setActiveId(id)}
              onClick={() => setActiveId(active ? null : id)}
            >
              {/* Transparent hit area */}
              <circle r={22} fill="transparent" />
              {/* Ring */}
              <circle
                className={`rs-node-ring rs-node-ring-${i}`}
                r={9}
                fill="#0A0A0A"
                stroke={active ? "#E8C36A" : "#B8902E"}
                strokeWidth={active ? 1.5 : 1}
              />
              {/* Centre dot */}
              <circle
                className={`rs-node-dot rs-node-dot-${i}`}
                r={2.5}
                fill={active ? "#E8C36A" : "#B8902E"}
              />
              {/* Label */}
              <text
                className={`rs-label rs-label-${i}`}
                x={dx}
                y={dy}
                textAnchor={anchor}
                fill={active ? "#E8C36A" : "#F3EFE6"}
                fontSize="10.5"
                fontFamily="'DM Mono', 'Courier New', monospace"
                letterSpacing="0.10em"
                style={{ userSelect: "none", textTransform: "uppercase" }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Core hub */}
        <g className="rs-core">
          <circle cx={CX} cy={CY} r={44} fill="#0A0A0A" stroke="#B8902E" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={37} fill="none"    stroke="#B8902E" strokeWidth="0.4" opacity="0.35" />
          <text
            x={CX} y={CY - 7}
            textAnchor="middle"
            fill="rgba(184,144,46,0.7)"
            fontSize="7.5"
            fontFamily="'DM Mono', 'Courier New', monospace"
            letterSpacing="0.35em"
          >
            YOUR
          </text>
          <text
            x={CX} y={CY + 5}
            textAnchor="middle"
            fill="#E8C36A"
            fontSize="8.5"
            fontFamily="'DM Mono', 'Courier New', monospace"
            letterSpacing="0.3em"
          >
            BRAND
          </text>
          <text
            x={CX} y={CY + 17}
            textAnchor="middle"
            fill="rgba(184,144,46,0.6)"
            fontSize="7"
            fontFamily="'DM Mono', 'Courier New', monospace"
            letterSpacing="0.3em"
          >
            OS
          </text>
        </g>
      </svg>

      {/* Caption slot */}
      <p
        style={{
          textAlign: "center",
          color: activeNode ? "#F3EFE6" : "rgba(247,244,239,0.35)",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "0.77rem",
          letterSpacing: "0.01em",
          lineHeight: 1.65,
          marginTop: "1.1rem",
          minHeight: "2.8em",
          transition: "color 0.25s ease, opacity 0.25s ease",
        }}
      >
        {activeNode
          ? activeNode.caption
          : "Everything you're already paying for — in one place."}
      </p>
    </div>
  );
}
