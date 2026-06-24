import { motion, useReducedMotion } from "framer-motion";
import { DUR_HOVER, EASE_SULTRY } from "@/lib/motion";

interface HoverRevealProps {
  children: React.ReactNode;
  className?: string;
}

// Hidden content that fades in when a parent motion element enters "hover" variant.
// Parent must declare: initial="rest" whileHover="hover" whileTap="hover"
// This component picks up the variant and fades in without snapping.
//
// Example:
//   <motion.div initial="rest" whileHover="hover" whileTap="hover">
//     <span>Always visible</span>
//     <HoverReveal>Revealed on hover or tap</HoverReveal>
//   </motion.div>
export function HoverReveal({ children, className }: HoverRevealProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        rest:  { opacity: 0 },
        hover: { opacity: 1 },
      }}
      transition={{
        duration: reduce ? 0 : DUR_HOVER,
        ease: EASE_SULTRY,
      }}
    >
      {children}
    </motion.div>
  );
}
