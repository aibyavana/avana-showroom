import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], input, textarea, select, [data-cursor="hover"]';

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 350, damping: 30, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 350, damping: 30, mass: 0.5 });
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const [fine, setFine] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    setFine(mq.matches);
    const onChange = () => setFine(mq.matches);
    mq.addEventListener("change", onChange);

    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const t = e.target as Element | null;
      setHover(!!(t && t.closest(INTERACTIVE_SELECTOR)));
    };
    const leave = () => setVisible(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseout", leave);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseout", leave);
    };
  }, [x, y]);

  if (!fine) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full border"
      style={{
        x: sx,
        y: sy,
        translateX: "-50%",
        translateY: "-50%",
        borderColor: "#B8902E",
        opacity: visible ? 1 : 0,
      }}
      animate={{ width: hover ? 44 : 18, height: hover ? 44 : 18, borderWidth: hover ? 1 : 1 }}
      transition={{ type: "spring", stiffness: 250, damping: 25 }}
    />
  );
}
