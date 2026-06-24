import { motion } from "framer-motion";
import { EASE_SULTRY, DUR_SLOW } from "@/lib/motion";

const HEADLINE_LINE1 = "Some brands you discover.";
const HEADLINE_LINE2 = "Others are chosen for you.";

export function HeroIntro() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Background video */}
      <video
        src="/avana-showroom.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Readability scrim */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)",
        }}
      />

      {/* Top dissolve — cream bleeds in from above */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[18vh] z-40"
        style={{
          background:
            "linear-gradient(to bottom, rgba(247,244,239,0.75) 0%, rgba(247,244,239,0.4) 55%, rgba(247,244,239,0) 100%)",
        }}
      />

      {/* Bottom dissolve — melts into Founder's cream background below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[32vh]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(247,244,239,0) 0%, rgba(247,244,239,0.55) 55%, rgba(247,244,239,1) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[65vh] md:min-h-screen max-w-[1600px] flex-col justify-center px-8 py-12 md:py-[14vh] md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: DUR_SLOW, ease: EASE_SULTRY }}
          className="max-w-3xl"
        >
          <h1
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.6rem, 2.2vw, 2.2rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              color: "#F2EDE5",
            }}
          >
            <span className="block">{HEADLINE_LINE1}</span>
            <span className="block">{HEADLINE_LINE2}</span>
          </h1>
          <p className="type-body mt-8 max-w-xl" style={{ color: "#F2EDE5CC", fontSize: "1.0625rem" }}>
            A curated showroom of the world's most coveted resortwear,<br />placed into the retailers that define luxury.
          </p>
          <div className="mt-10">
            <a href="#brands" className="gold-link type-caption">
              Explore the brands
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
