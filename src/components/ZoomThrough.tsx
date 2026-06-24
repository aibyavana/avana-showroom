import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  cubicBezier,
} from "framer-motion";
import { AvanaLogo } from "./AvanaLogo";
import { GOLD, WARM_GREY, FOREGROUND as DOOR_BLACK } from "@/lib/tokens";

// ── Tunables ────────────────────────────────────────────────────────────
// The hero photo already contains dark vertical bars framing the model.
// We extend those bars with overlay panels that slide inward to "close
// the doors" on the scene. Almost no scaling, so image quality is preserved.
const HERO_PUSH_SCALE = 1.08; // very subtle breathing push
const HERO_OBJECT_POSITION = "50% 50%";
// Door panels start as narrow strips at the edges (matching the photo's
// existing bars) and slide to meet in the middle.
const DOOR_START_WIDTH_PCT = 22; // each panel's starting width (% of viewport)
const DOOR_END_WIDTH_PCT = 50;   // each panel reaches the centerline

// Phase boundaries along the sticky scroll timeline (0 → 1)
const COLD_OPEN_END = 0.20;
const COMPOSE_END = 0.36;
const DOORS_START = 0.62;
const DOORS_CLOSED = 1.0;
const LOGO_ANCHOR_Y_PCT = 62;
// ────────────────────────────────────────────────────────────────────────

const easeThreshold = cubicBezier(0.65, 0.0, 0.35, 1.0);

export function ZoomThrough() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const p = useTransform(scrollYProgress, (v) => easeThreshold(v));

  // Cold-open: logomark sits dead-center on black, then drifts to belly-button anchor as the model appears
  const logoScale = useTransform(p, [0, COLD_OPEN_END, COMPOSE_END], [1.15, 1.1, 1]);
  const logoY = useTransform(p, [0, COLD_OPEN_END, COMPOSE_END], ["0vh", "0vh", "0vh"]);
  const logoTop = useTransform(p, [0, COLD_OPEN_END, COMPOSE_END], ["50%", "50%", `${LOGO_ANCHOR_Y_PCT}%`]);

  // Hero image — fades in during compose, breathes gently through hold, then pushes as doors close
  const heroOpacity = useTransform(p, [COLD_OPEN_END, COMPOSE_END], [0, 1]);
  const heroScale = useTransform(
    p,
    [COMPOSE_END, DOORS_START, DOORS_CLOSED],
    [1.0, 1.03, HERO_PUSH_SCALE],
  );

  // Door panels — slide inward to meet at center
  const doorWidth = useTransform(
    p,
    [DOORS_START, DOORS_CLOSED],
    [DOOR_START_WIDTH_PCT, DOOR_END_WIDTH_PCT],
  );
  const doorWidthStyle = useTransform(doorWidth, (w) => `${w}%`);

  // Cold-open scroll cue
  const cueOpacity = useTransform(p, [0, COLD_OPEN_END * 0.6, COLD_OPEN_END], [1, 1, 0]);

  if (reduce) {
    return (
      <section className="relative h-screen w-full overflow-hidden">
        <img
          aria-hidden
          src="/hero-doorway-model.png"
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover", objectPosition: HERO_OBJECT_POSITION }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${LOGO_ANCHOR_Y_PCT}%` }}
        >
          <AvanaLogo style={{ width: "clamp(min(88vw, 495px), 63vw, 855px)" }} />
        </div>
        <div className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-8 pb-[14vh] md:px-16">
          <h1
            className="mt-10"
            style={{
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 3.92vw, 3.85rem)",
              letterSpacing: "-0.025em",
              lineHeight: 1.02,
              color: WARM_GREY,
            }}
          >
            The future of luxury wholesale.
          </h1>
        </div>
      </section>
    );
  }

  return (
    <div ref={ref} className="relative" style={{ height: "200vh" }}>
      <div
        className="sticky top-0 h-screen w-full overflow-hidden"
        style={{ backgroundColor: DOOR_BLACK }}
      >
        {/* Hero image — near-native resolution */}
        <motion.img
          aria-hidden
          src="/hero-doorway-model.png"
          alt=""
          className="absolute inset-0 h-full w-full"
          style={{
            objectFit: "cover",
            objectPosition: HERO_OBJECT_POSITION,
            scale: heroScale,
            opacity: heroOpacity,
            willChange: "transform, opacity",
          }}
        />

        {/* Logomark — CSS gold-shimmer (9s) + Framer opacity breathe (7s) compound for dual-rhythm life */}
        <motion.div
          className="absolute left-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
          style={{ top: logoTop, y: logoY, scale: logoScale }}
          animate={{ opacity: [0.80, 1, 0.80] }}
          transition={{ duration: 7, ease: "easeInOut", repeat: Infinity }}
        >
          <AvanaLogo style={{ width: "clamp(min(88vw, 495px), 63vw, 855px)" }} />
        </motion.div>

        {/* Door panels — slide inward to close on the scene */}
        <motion.div
          aria-hidden
          className="absolute inset-y-0 left-0 z-20 pointer-events-none"
          style={{
            width: doorWidthStyle,
            background: `linear-gradient(to right, ${DOOR_BLACK} 0%, ${DOOR_BLACK} 88%, rgba(10,10,10,0.92) 96%, rgba(10,10,10,0.78) 100%)`,
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-y-0 right-0 z-20 pointer-events-none"
          style={{
            width: doorWidthStyle,
            background: `linear-gradient(to left, ${DOOR_BLACK} 0%, ${DOOR_BLACK} 88%, rgba(10,10,10,0.92) 96%, rgba(10,10,10,0.78) 100%)`,
          }}
        />

        {/* Bottom dissolve — cream bridge into HeroIntro video below */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[18vh] z-40"
          style={{
            background:
              "linear-gradient(to bottom, rgba(247,244,239,0) 0%, rgba(247,244,239,0.4) 60%, rgba(247,244,239,0.75) 100%)",
          }}
        />

        {/* Cold-open scroll cue */}
        <motion.div
          aria-hidden
          className="absolute bottom-10 left-1/2 z-30 -translate-x-1/2"
          style={{ opacity: cueOpacity }}
        >
          <motion.div
            className="h-14 w-px"
            style={{ background: `linear-gradient(to bottom, transparent, ${GOLD})` }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
          />
        </motion.div>

      </div>
    </div>
  );
}
