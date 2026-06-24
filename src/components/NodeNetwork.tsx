import { useEffect, useRef } from "react";

const GOLD = "184, 144, 46";
const MAX_NODES = 85;
const CONNECT_DIST = 220;
const MAX_SPEED = 0.22;
const NODE_RADIUS = 1.8;
const NODE_OPACITY = 0.55;
const LINE_OPACITY_MAX = 0.55;

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function NodeNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    // canvas and ctx are guaranteed non-null past this point
    const c = canvas;
    const g = ctx;

    let nodes: Node[] = [];
    let raf: number;
    let w = 0;
    let h = 0;
    let dpr = 1;

    function initNodes() {
      const count = Math.min(Math.floor(w / 22), MAX_NODES);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * MAX_SPEED * 2,
        vy: (Math.random() - 0.5) * MAX_SPEED * 2,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = w + "px";
      c.style.height = h + "px";
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    }

    function draw() {
      g.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) { n.x = 0; n.vx = Math.abs(n.vx); }
        if (n.x > w) { n.x = w; n.vx = -Math.abs(n.vx); }
        if (n.y < 0) { n.y = 0; n.vy = Math.abs(n.vy); }
        if (n.y > h) { n.y = h; n.vy = -Math.abs(n.vy); }
      }

      // Lines — drawn behind nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = LINE_OPACITY_MAX * (1 - dist / CONNECT_DIST);
            g.beginPath();
            g.moveTo(nodes[i].x, nodes[i].y);
            g.lineTo(nodes[j].x, nodes[j].y);
            g.strokeStyle = `rgba(${GOLD}, ${alpha.toFixed(3)})`;
            g.lineWidth = 0.8;
            g.stroke();
          }
        }
      }

      // Nodes — drawn on top of lines
      for (const n of nodes) {
        g.beginPath();
        g.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
        g.fillStyle = `rgba(${GOLD}, ${NODE_OPACITY})`;
        g.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        raf = requestAnimationFrame(draw);
      }
    }

    resize();
    raf = requestAnimationFrame(draw);

    const ro = new ResizeObserver(resize);
    ro.observe(document.documentElement);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
