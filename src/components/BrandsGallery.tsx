import { useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { AvanaLogo } from "./AvanaLogo";
import { GOLD, WARM_GREY } from "@/lib/tokens";
import { Brand, BRANDS } from "@/data/brands";

// ── Card dimensions — tune here ──────────────────────────────────────────
const CARD_WIDTH       = "clamp(260px, 30vw, 420px)";
const CARD_ASPECT      = "2/3"; // editorial portrait — width:height
const CARD_TEXT_BOTTOM = "11%"; // distance from card bottom to text block — increase to push text up
// ─────────────────────────────────────────────────────────────────────────

function BrandCard({ brand }: { brand: Brand }) {
  const sharedClass = "group relative block flex-shrink-0 overflow-hidden";
  const sharedStyle = { width: CARD_WIDTH, aspectRatio: CARD_ASPECT, backgroundColor: "#E8E2D6" };

  const inner = (
    <>
      {/* Brand photo */}
      <img
        src={brand.image}
        alt={brand.name}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
      />
      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />
      {/* Bottom scrim — keeps name legible over any photo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.22) 38%, transparent 62%)",
        }}
      />
      {/* Gold overlay on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[1200ms] ease-out group-hover:opacity-[0.22]"
        style={{ backgroundColor: GOLD, mixBlendMode: "multiply" }}
      />

      {/* Name + tagline */}
      <div className="absolute left-0 right-0 px-7 md:px-9" style={{ bottom: CARD_TEXT_BOTTOM }}>
        <div
          style={{
            color: "#F7F4EF",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.72rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          {brand.name}
        </div>
        <div
          className="mt-2 max-h-0 overflow-hidden opacity-0 transition-[max-height,opacity] duration-[900ms] ease-out group-hover:max-h-10 group-hover:opacity-100"
          style={{
            color: "#F7F4EF",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.78rem",
            letterSpacing: "0.04em",
            fontStyle: "italic",
            opacity: 0.92,
          }}
        >
          {brand.tagline}
        </div>
      </div>
    </>
  );

  if (brand.href) {
    return (
      <a href={brand.href} target="_blank" rel="noopener noreferrer" className={sharedClass} style={sharedStyle}>
        {inner}
      </a>
    );
  }
  return (
    <div className={sharedClass} style={sharedStyle}>
      {inner}
    </div>
  );
}

export function BrandsGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Lead-in / lead-out fractions — must match the useTransform call below.
  const RAIL_START = 0.05;
  const RAIL_END   = 0.92;

  // Measure rail travel at runtime and derive the exact section height needed.
  // containerHeight = railTravel / (RAIL_END - RAIL_START) + viewportHeight
  // This ensures the sticky scroll ends exactly when the last item clears.
  const [maxTranslate, setMaxTranslate] = useState(0);
  const [sectionHeight, setSectionHeight] = useState("320vh"); // SSR fallback
  useLayoutEffect(() => {
    const measure = () => {
      const el = railRef.current;
      if (!el) return;
      const travel = Math.max(0, el.scrollWidth - window.innerWidth);
      setMaxTranslate(travel);
      const px = Math.round(travel / (RAIL_END - RAIL_START) + window.innerHeight);
      setSectionHeight(`${px}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Rail travel mapped across the pinned scroll distance.
  const x = useTransform(scrollYProgress, [RAIL_START, RAIL_END], [0, -maxTranslate]);

  // Mobile: vertical stack — no sticky rail
  return (
    <section id="brands" className="relative w-full" style={{ backgroundColor: "#F7F4EF" }}>
      {/* Desktop: sticky horizontal rail */}
      <div className="hidden md:block">
        <div ref={ref} className="relative" style={{ height: sectionHeight }}>
          <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
            <div className="px-12 pt-20 lg:px-20">
              <div className="mb-3 flex items-center gap-4 overflow-hidden">
                <motion.p
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    color: GOLD,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "0.7rem",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                  }}
                >
                  The Collective
                </motion.p>
                <motion.span
                  aria-hidden
                  initial={reduce ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  style={{
                    display: "inline-block",
                    width: "10vw",
                    height: "1px",
                    backgroundColor: GOLD,
                    transformOrigin: "left center",
                  }}
                />
              </div>
              <div style={{ overflow: "hidden" }}>
                <motion.h2
                  initial={reduce ? false : { y: "100%" }}
                  whileInView={{ y: "0%" }}
                  viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(2.5rem, 6vw, 5rem)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                    color: WARM_GREY,
                  }}
                >
                  AGENCY BRANDS
                </motion.h2>
              </div>
            </div>

            <div className="flex flex-1 items-center overflow-hidden">
              <motion.div
                ref={railRef}
                className="flex items-center gap-[4vw] pl-[8vw] pr-[8vw]"
                style={reduce ? undefined : { x }}
              >
                {BRANDS.map((b) => (
                  <BrandCard key={b.slug} brand={b} />
                ))}
                {/* Closing endcap: rail stops when logo's right edge hits viewport */}
                <div className="flex flex-shrink-0 items-center">
                  <AvanaLogo style={{ width: "clamp(380px, 42vw, 580px)" }} />
                </div>

              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: simple vertical stack */}
      <div className="md:hidden px-6 py-20">
        <p
          className="mb-3"
          style={{
            color: GOLD,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          The Collective
        </p>
        <h2
          className="mb-12"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 700,
            fontSize: "2.5rem",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: WARM_GREY,
          }}
        >
          AGENCY BRANDS
        </h2>
        <div className="flex flex-col gap-8">
          {BRANDS.map((b) => (
            <BrandCard key={b.slug} brand={b} />
          ))}
        </div>
      </div>
    </section>
  );
}
