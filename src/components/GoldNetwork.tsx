// GoldNetwork.tsx
// Animated gold node-network background for the AI by AVANA page.
//
// LAYERING (critical):
//   - The page wrapper is position:relative with background #0A0A0A (black).
//   - <GoldNetwork /> renders a position:fixed canvas at z-index 0 (above the
//     black background, below the content).
//   - ALL page content must sit in a wrapper with position:relative and
//     z-index >= 1 so it renders ABOVE the network.
//
//   Structure on the page:
//     <main style={{ position:'relative', background:'#0A0A0A', minHeight:'100vh' }}>
//       <GoldNetwork />                          // fixed, z-0
//       <div style={{ position:'relative', zIndex:1 }}>
//         ...nav + all sections...
//       </div>
//     </main>
//
// Respects prefers-reduced-motion (renders a single static frame).

import { useEffect, useRef } from "react";

export default function GoldNetwork() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];

    // Tunables ─────────────────────────────────
    const LINK = 155 * DPR;        // connection distance; raise for a denser web
    const SPEED = 0.12 * DPR;      // drift speed; lower = slower/more sultry
    const MAX_NODES = 70;
    const NODE_RGB = "212,175,55";   // gold node fill
    const LINE_RGB = "184,144,46";   // gold line stroke
    const LINE_MAX_OPACITY = 0.5;    // strongest line opacity (close nodes)
    const NODE_OPACITY = 0.85;
    // ──────────────────────────────────────────

    function resize() {
      w = canvas!.width = window.innerWidth * DPR;
      h = canvas!.height = window.innerHeight * DPR;
      canvas!.style.width = window.innerWidth + "px";
      canvas!.style.height = window.innerHeight + "px";
    }

    function build() {
      const count = Math.min(MAX_NODES, Math.floor(window.innerWidth / 22));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: (Math.random() * 1.6 + 0.6) * DPR,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // lines first (behind nodes)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK) {
            const o = (1 - dist / LINK) * LINE_MAX_OPACITY;
            ctx!.strokeStyle = `rgba(${LINE_RGB},${o.toFixed(3)})`;
            ctx!.lineWidth = 0.6 * DPR;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // nodes on top
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${NODE_RGB},${NODE_OPACITY})`;
        ctx!.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    resize();
    build();

    if (reduced) {
      // single static frame, no animation loop
      draw();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    } else {
      draw();
    }

    const onResize = () => {
      resize();
      build();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
