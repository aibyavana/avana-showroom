import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DUR_SLOW, EASE_SULTRY, DELAY_WITHHOLD } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean;
}

// Fades in from slightly below + slightly soft (blur), resolving into focus.
// Wrap any section, block, or element that should enter the frame slowly.
export function Reveal({
  children,
  delay = 0,
  className,
  style,
  "aria-hidden": ariaHidden,
}: RevealProps) {
  const reduce = useReducedMotion();
  // SSR guard: render plain div until client JS is ready so SSR HTML
  // never contains opacity:0 elements that stay invisible on slow mobile.
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  if (!isClient) {
    return (
      <div className={className} style={style} aria-hidden={ariaHidden}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      aria-hidden={ariaHidden}
      initial={reduce ? false : { opacity: 0, y: 32, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: DUR_SLOW,
        ease: EASE_SULTRY,
        delay: DELAY_WITHHOLD + delay,
      }}
    >
      {children}
    </motion.div>
  );
}
