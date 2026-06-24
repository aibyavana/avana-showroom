import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface DnaHelixHandle {
  play(): void;
  stop(): void;
}

interface DnaHelixProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eyebrowRef: React.RefObject<any>;
}

export const DnaHelix = forwardRef<DnaHelixHandle, DnaHelixProps>(
  function DnaHelix({ eyebrowRef }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number | null>(null);
    const drawFnRef = useRef<(() => void) | null>(null);
    const playingRef = useRef(true);

    useImperativeHandle(ref, () => ({
      play() {
        playingRef.current = true;
        if (rafRef.current === null && drawFnRef.current) {
          rafRef.current = requestAnimationFrame(drawFnRef.current);
        }
      },
      stop() {
        playingRef.current = false;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const DPR = Math.min(window.devicePixelRatio || 1, 2);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let w = 0, h = 0, t = 0, minRadius = 40;

      function measureFloor() {
        const el = eyebrowRef.current;
        const rectW = el ? el.getBoundingClientRect().width : 160;
        // 28px padding each side — matches the original HTML reference
        minRadius = ((rectW + 56) / 2) * DPR;
      }

      function resize() {
        w = canvas!.width = Math.max(1, Math.floor(window.innerWidth * DPR));
        h = canvas!.height = Math.max(1, Math.floor(window.innerHeight * DPR));
        canvas!.style.width = window.innerWidth + "px";
        canvas!.style.height = window.innerHeight + "px";
        measureFloor();
      }

      function draw() {
        ctx!.clearRect(0, 0, w, h);
        ctx!.globalCompositeOperation = "lighter";

        const cx = w / 2;
        const cy = h / 2;
        const breathe = (Math.sin(t * 0.5) + 1) / 2;

        // floor-pinned radius: never narrower than the eyebrow text
        const growth = Math.max(minRadius * 1.35, Math.min(w, h) * 0.2);
        const radius = minRadius + (growth - minRadius) * breathe;

        const spin = t * 0.35;
        // coil tightens with radius so loops stay DNA-aspect-ratio, not ovals
        const coil = (Math.PI * 2) / (radius * 2.6);
        const spanFrac = 0.3 + breathe * 0.06;
        const top = cy - h * spanFrac;
        const bot = cy + h * spanFrac;
        const step = 12 * DPR;

        let prevA: [number, number] | null = null;
        let prevB: [number, number] | null = null;

        for (let y = top; y <= bot; y += step) {
          const ang = (y - cy) * coil + spin;
          const ax = cx + Math.sin(ang) * radius;
          const bx = cx + Math.sin(ang + Math.PI) * radius;
          const dA = (Math.cos(ang) + 1) / 2;
          const dB = (Math.cos(ang + Math.PI) + 1) / 2;
          let edge = 1 - Math.abs((y - cy) / (h * spanFrac));
          edge = Math.max(0, Math.min(1, edge * 1.4));

          // Rung (cross-bar between the two strands)
          ctx!.strokeStyle = `rgba(212,175,55,${((0.18 + 0.32 * Math.min(dA, dB)) * edge).toFixed(3)})`;
          ctx!.lineWidth = 1.1 * DPR;
          ctx!.beginPath();
          ctx!.moveTo(ax, y);
          ctx!.lineTo(bx, y);
          ctx!.stroke();

          // Backbone A
          if (prevA) {
            ctx!.strokeStyle = `rgba(184,144,46,${((0.06 + dA * 0.2) * edge).toFixed(3)})`;
            ctx!.lineWidth = 1.1 * DPR;
            ctx!.beginPath();
            ctx!.moveTo(prevA[0], prevA[1]);
            ctx!.lineTo(ax, y);
            ctx!.stroke();
          }

          // Backbone B
          if (prevB) {
            ctx!.strokeStyle = `rgba(184,144,46,${((0.06 + dB * 0.2) * edge).toFixed(3)})`;
            ctx!.lineWidth = 1.1 * DPR;
            ctx!.beginPath();
            ctx!.moveTo(prevB[0], prevB[1]);
            ctx!.lineTo(bx, y);
            ctx!.stroke();
          }

          // Node A — depth-tinted gold
          const rA = (1.3 + dA * 2.6) * DPR;
          ctx!.beginPath();
          ctx!.arc(ax, y, rA, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${180 + Math.floor(dA * 52)},${144 + Math.floor(dA * 51)},${46 + Math.floor(dA * 60)},${((0.25 + dA * 0.62) * edge).toFixed(3)})`;
          ctx!.fill();

          // Node B
          const rB = (1.3 + dB * 2.6) * DPR;
          ctx!.beginPath();
          ctx!.arc(bx, y, rB, 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${180 + Math.floor(dB * 52)},${144 + Math.floor(dB * 51)},${46 + Math.floor(dB * 60)},${((0.25 + dB * 0.62) * edge).toFixed(3)})`;
          ctx!.fill();

          prevA = [ax, y];
          prevB = [bx, y];
        }

        ctx!.globalCompositeOperation = "source-over";
        t += 0.016;

        if (playingRef.current && !reduced) {
          rafRef.current = requestAnimationFrame(draw);
        } else {
          rafRef.current = null;
        }
      }

      drawFnRef.current = draw;
      resize();

      if (reduced) {
        draw(); // single static frame, no loop
      } else {
        rafRef.current = requestAnimationFrame(draw);
      }

      window.addEventListener("resize", resize);

      function onVisibility() {
        if (document.hidden) {
          if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
          }
        } else if (playingRef.current && rafRef.current === null && drawFnRef.current) {
          rafRef.current = requestAnimationFrame(drawFnRef.current);
        }
      }
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    );
  }
);
