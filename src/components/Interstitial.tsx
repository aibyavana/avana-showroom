import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const VIDEO_SRC      = "/erika-pena-x-avana-web.mp4";
const VIDEO_POSITION = "50% 20%";
const VEIL_GREY      = "#1C1C1C";

export function Interstitial() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // iOS Safari requires muted to be set via the DOM property, not just the attribute
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = true;
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Section stays opaque from the moment it enters; only fades out at the very bottom.
  const sectionOpacity = useTransform(scrollYProgress, [0.93, 1], [1, 0]);

  // Video grows gently as you scroll — section overflow:hidden keeps it framed.
  const videoScale = useTransform(scrollYProgress, [0, 0.75], [1, 1.1]);

  // Gradient wash band — a narrow strip at section top.
  // Sweeps upward and exits completely; video is clean after progress 0.22.
  const curtainY = useTransform(scrollYProgress, [0, 0.22], ["0%", "-100%"]);

  // Statement line settles in once the video is fully revealed
  const lineOpacity = useTransform(scrollYProgress, [0.18, 0.32], [0, 1]);
  const lineY = useTransform(scrollYProgress, [0.18, 0.32], [12, 0]);

  return (
    <motion.section
      ref={ref}
      aria-label="Interlude"
      className="relative h-screen w-full overflow-hidden"
      style={{ opacity: sectionOpacity, backgroundColor: "#000" }}
    >
      {/* Video — grows on scroll; overflow:hidden on section keeps it framed */}
      <motion.div className="absolute inset-0" style={{ scale: videoScale }}>
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/erika-pena-poster.webp"
          aria-hidden
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover", objectPosition: VIDEO_POSITION }}
        />
      </motion.div>

      {/* Gentle radial vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Gradient wash band — only ever touches the upper portion.
          Passes through and exits upward; leaves the video completely clean. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-30"
        style={{
          y: curtainY,
          height: "40%",
          background: `linear-gradient(to bottom, ${VEIL_GREY} 0%, rgba(28,28,28,0.88) 30%, rgba(28,28,28,0.50) 62%, rgba(28,28,28,0) 100%)`,
        }}
      />

      {/* Statement line */}
      <motion.p
        className="absolute bottom-16 left-8 md:bottom-24 md:left-20"
        style={{
          opacity: lineOpacity,
          y: lineY,
          color: "#F2EDE5",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "0.78rem",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          lineHeight: 1.6,
        }}
      >
        Timeless luxury, moved with intention by Erika Pe&#xF1;a
      </motion.p>

      {/* Top dissolve — cream bleeds in from Founder, merging the two sections */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[32vh] z-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(247,244,239,1) 0%, rgba(247,244,239,0.6) 40%, rgba(247,244,239,0) 100%)",
        }}
      />

      {/* Bottom dissolve into BrandsGallery (cream) below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[28vh]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(247,244,239,0) 0%, rgba(247,244,239,0.55) 55%, rgba(247,244,239,1) 100%)",
        }}
      />
    </motion.section>
  );
}
