import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, type CSSProperties, type RefObject, type ReactNode } from "react";
import {
  cubicBezier,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

import { DnaHelix, type DnaHelixHandle } from "@/components/DnaHelix";
import { FilmGrain } from "@/components/FilmGrain";
import { CustomCursor } from "@/components/CustomCursor";
import { TopNav } from "@/components/TopNav";
import { Reveal } from "@/components/Reveal";
import { DiyAuditModal } from "@/components/DiyAuditModal";
import { ConsultCallModal } from "@/components/ConsultCallModal";
import { ScoreModal } from "@/components/ScoreModal";
// RadialSystem reserved for "Team You Couldn't Hire" section — import when wired
import { GOLD, FONT_SANS } from "@/lib/tokens";
import { EASE_SULTRY } from "@/lib/motion";

// ── Design tokens ─────────────────────────────────────────────────────────────

const BG = "#0A0A0A";
const CREAM = "#F7F4EF";
const CREAM_DIM = "rgba(247,244,239,0.65)";
const CREAM_MUTED = "rgba(247,244,239,0.40)";
const GOLD_HEX = GOLD;
const ARCHIVO = "'Archivo', Arial, Helvetica, sans-serif";

const GOLD_GRADIENT_TEXT: React.CSSProperties = {
  background: "linear-gradient(135deg, #8C6D1F 0%, #B8902E 30%, #E8C36A 55%, #D4AF37 75%, #8C6D1F 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const GOLD_FILL_BTN: React.CSSProperties = {
  display: "inline-block",
  padding: "16px 40px",
  background: "linear-gradient(135deg, #6B4F18 0%, #B8902E 30%, #E8C36A 50%, #D4AF37 70%, #8C6D1F 100%)",
  backgroundSize: "200% 100%",
  backgroundPosition: "0% 50%",
  color: BG,
  fontFamily: FONT_SANS,
  fontSize: "0.72rem",
  letterSpacing: "0.32em",
  textTransform: "uppercase" as const,
  border: "none",
  cursor: "pointer",
  borderRadius: 0,
  textDecoration: "none",
  transition: "background-position 0.9s cubic-bezier(0.22,1,0.36,1)",
  fontWeight: 700,
};

const GOLD_GHOST_BTN: React.CSSProperties = {
  display: "inline-block",
  padding: "16px 40px",
  background: "transparent",
  border: "1px solid rgba(184,144,46,0.45)",
  color: GOLD_HEX,
  fontFamily: FONT_SANS,
  fontSize: "0.72rem",
  letterSpacing: "0.32em",
  textTransform: "uppercase" as const,
  cursor: "pointer",
  borderRadius: 0,
  textDecoration: "none",
  transition: "border-color 0.4s ease, color 0.4s ease",
  fontWeight: 700,
};

const EYEBROW: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: "0.68rem",
  letterSpacing: "0.38em",
  textTransform: "uppercase",
  color: GOLD_HEX,
  marginBottom: "2rem",
};

const SECTION_MAX = "max-w-[1140px]";
const SECTION_PAD = "mx-auto px-8 md:px-16";

const COLD_EYEBROW: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: "0.72rem",
  letterSpacing: "0.4em",
  textTransform: "uppercase",
  color: CREAM,
  marginBottom: "2rem",
};

const COLD_H1: React.CSSProperties = {
  fontFamily: ARCHIVO,
  fontWeight: 800,
  fontSize: "clamp(2.2rem, 5vw, 4rem)",
  letterSpacing: "-0.02em",
  lineHeight: 1.05,
  color: CREAM,
  margin: 0,
  textAlign: "center",
};

const easeThreshold = cubicBezier(0.65, 0.0, 0.35, 1.0);

// ── Reveal helper ─────────────────────────────────────────────────────────────

function up(delay = 0) {
  return {
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.15 as const },
    transition: { duration: 1.6, ease: EASE_SULTRY, delay },
  };
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/ai-by-avana")({
  head: () => ({
    meta: [
      { title: "AI by AVANA — Private AI Operating Systems for Fashion Brands" },
      {
        name: "description",
        content:
          "AI executives trained on the fashion industry, installed inside your brand. One system. Every role. Finally performing.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://avanashowroom.com/ai-by-avana" },
      { property: "og:title", content: "AI by AVANA — Private AI Operating Systems for Fashion Brands" },
      { property: "og:description", content: "AI executives trained on the fashion industry, installed inside your brand. One system. Every role. Finally performing." },
      { property: "og:image", content: "https://avanashowroom.com/avana-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AI by AVANA — Private AI Operating Systems for Fashion Brands" },
      { name: "twitter:description", content: "AI executives trained on the fashion industry, installed inside your brand. One system. Every role. Finally performing." },
      { name: "twitter:image", content: "https://avanashowroom.com/avana-logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://avanashowroom.com/ai-by-avana" },
    ],
  }),
  component: AiByAvana,
});

// ── Page ──────────────────────────────────────────────────────────────────────

const SERVICE_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "AI by AVANA",
  "provider": {
    "@type": "Organization",
    "name": "AVANA Showroom",
    "url": "https://avanashowroom.com"
  },
  "description": "Private AI operating systems for fashion brands. AI executives trained on the fashion industry, installed inside your brand to run marketing, operations, and strategy roles.",
  "url": "https://avanashowroom.com/ai-by-avana",
  "areaServed": "Worldwide",
  "audience": {
    "@type": "Audience",
    "audienceType": "Fashion brands generating $250K to $10M in annual revenue"
  }
});

function AiByAvana() {
  return (
    <main style={{ position: "relative", background: BG }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SERVICE_SCHEMA }} />
      <FilmGrain />
      <CustomCursor />
      <TopNav
        alwaysVisible
        background="rgba(10,10,10,0.88)"
        dark
      />
      <DnaColdOpen />
      <ProblemSection />
      <WhatWeBuildSection />
      <TheMathSection />
      <ExecutiveTilesSection />
      <HowItWorksSection />
      <div
        aria-hidden
        style={{
          position: "relative",
          zIndex: 10,
          height: 180,
          marginTop: -90,
          marginBottom: -90,
          background: "linear-gradient(to bottom, transparent 0%, rgba(184,144,46,0.18) 40%, rgba(184,144,46,0.22) 50%, rgba(184,144,46,0.18) 60%, transparent 100%)",
          pointerEvents: "none",
        }}
      />
      <WaysToWorkSection />
      <WhyAvanaSection />
      <FinalCtaSection />
    </main>
  );
}

// ── DNA Cold-open ─────────────────────────────────────────────────────────────

function DnaColdOpen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const dnaRef = useRef<DnaHelixHandle>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const eased = useTransform(scrollYProgress, (v) => easeThreshold(v));
  const textOpacity = useTransform(eased, [0, 0.2, 0.50], [1, 1, 0]);
  const helixScale = useTransform(eased, [0.15, 0.85], [1, 2.4]);
  const helixOpacity = useTransform(eased, [0.15, 0.78], [1, 0]);
  const cueOpacity = useTransform(eased, [0, 0.16], [1, 0]);
  const heroReveal = useTransform(eased, [0.48, 0.88], [0, 1]);

  useMotionValueEvent(eased, "change", (v) => {
    if (v >= 0.85) dnaRef.current?.stop();
    else dnaRef.current?.play();
  });

  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);

  if (reduce) {
    return (
      <>
      <style>{`
        @media (max-width: 767px) {
          .dna-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .dna-hero-grid > * {
            width: 100% !important;
          }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          background: BG,
          display: "flex",
          alignItems: "center",
          padding: "0 clamp(2rem, 7vw, 7rem)",
          overflow: "hidden",
          minHeight: "100vh",
        }}
      >
        <DnaHelix ref={dnaRef} eyebrowRef={eyebrowRef} />
        <div
          className="dna-hero-grid"
          style={{
            width: "100%",
            maxWidth: 1400,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "clamp(3rem, 6vw, 8rem)",
            alignItems: "center",
          }}
        >
          <div>
            <p ref={eyebrowRef} style={{ ...EYEBROW, color: GOLD_HEX, marginBottom: "2.5rem" }}>
              AI BY AVANA
            </p>
            <div
              aria-hidden="true"
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 3.4rem)",
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                color: CREAM,
                margin: 0,
              }}
            >
              <span style={{ display: "block" }}>You don&rsquo;t need more staff.</span>
              <span style={{ display: "block", marginTop: "0.65em" }}>You need your staff, your agencies, and your tools to stop contradicting each other.</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", alignItems: "flex-start" }}>
            <div
              className="gold-metallic-line"
              style={{ width: "100%", height: 3, clipPath: "polygon(0 40%, 100% 0%, 100% 100%, 0 60%)" }}
            />
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
                lineHeight: 1.85,
                color: CREAM_DIM,
                margin: 0,
              }}
            >
              We install AI executives, trained on the fashion industry, that run the roles you&rsquo;re already paying for — and finally make them perform.
            </p>
            <button onClick={() => setHealthModalOpen(true)} style={{ ...GOLD_FILL_BTN, alignSelf: "stretch", textAlign: "center" }}>
              Take the free Shopify Health Check →
            </button>
            <button
              onClick={() => setVisibilityModalOpen(true)}
              style={{ ...GOLD_GHOST_BTN, alignSelf: "stretch", textAlign: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.45)"; e.currentTarget.style.color = GOLD_HEX; }}
            >
              Get your free AI Visibility Score →
            </button>
            <a
              href="/ava-case-study.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: FONT_SANS, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(184,144,46,0.82)", textDecoration: "none", textAlign: "center", paddingTop: "4px", transition: "color 0.3s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = GOLD_HEX; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(184,144,46,0.82)"; }}
            >
              See one of my clients real $1M audit →
            </a>
          </div>
        </div>
      </div>
      <ScoreModal type="shopify_health" open={healthModalOpen} onClose={() => setHealthModalOpen(false)} />
      <ScoreModal type="ai_visibility" open={visibilityModalOpen} onClose={() => setVisibilityModalOpen(false)} />
      </>
    );
  }

  return (
    <>
    <style>{`
      @media (max-width: 767px) {
        .dna-hero-grid {
          grid-template-columns: 1fr !important;
        }
        .dna-hero-grid > * {
          width: 100% !important;
        }
      }
    `}</style>
    <div ref={containerRef} className="h-[150vh] md:h-[200vh]">
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          background: BG,
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            scale: helixScale,
            opacity: helixOpacity,
          }}
        >
          <DnaHelix ref={dnaRef} eyebrowRef={eyebrowRef} />
        </motion.div>

        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
            opacity: textOpacity,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <motion.p
            ref={eyebrowRef}
            style={COLD_EYEBROW}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            AI BY AVANA
          </motion.p>
          <WordLift
            isH1={false}
            text="Trained on your brand's DNA."
            goldWords={1}
            style={COLD_H1}
            stagger={0.1}
          />
        </motion.div>

        {/* Hero — fades in as helix fades out, no black gap */}
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            padding: "0 clamp(2rem, 7vw, 7rem)",
            opacity: heroReveal,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          {/* Two-column hero grid */}
          <div
            className="dna-hero-grid"
            style={{
              width: "100%",
              maxWidth: 1400,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "clamp(3rem, 6vw, 8rem)",
              alignItems: "center",
            }}
          >
            {/* LEFT — statement */}
            <div>
              <p style={{ ...EYEBROW, color: GOLD_HEX, marginBottom: "2.5rem" }}>AI BY AVANA</p>
              <h1
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "clamp(1.6rem, 3vw, 3.4rem)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  color: CREAM,
                  margin: 0,
                }}
              >
                <span style={{ display: "block" }}>You don&rsquo;t need more staff.</span>
                <span style={{ display: "block", marginTop: "0.65em" }}>You need your staff, your agencies, and your tools to stop contradicting each other.</span>
              </h1>
            </div>

            {/* RIGHT — sub + CTA */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", pointerEvents: "auto", alignItems: "flex-start" }}>
              {/* thin gold rule */}
              <div
                className="gold-metallic-line"
                style={{
                  width: "100%",
                  height: 3,
                  clipPath: "polygon(0 40%, 100% 0%, 100% 100%, 0 60%)",
                }}
              />
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
                  lineHeight: 1.85,
                  color: CREAM_DIM,
                  margin: 0,
                }}
              >
                We install AI executives, trained on the fashion industry, that run the roles you&rsquo;re already paying for — and finally make them perform.
              </p>
              <button
                onClick={() => setHealthModalOpen(true)}
                style={{ ...GOLD_FILL_BTN, alignSelf: "stretch", textAlign: "center" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundPosition = "100% 50%")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundPosition = "0% 50%")}
              >
                Take the free Shopify Health Check →
              </button>
              <button
                onClick={() => setVisibilityModalOpen(true)}
                style={{ ...GOLD_GHOST_BTN, alignSelf: "stretch", textAlign: "center" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.45)"; e.currentTarget.style.color = GOLD_HEX; }}
              >
                Get your free AI Visibility Score →
              </button>
              <a
                href="/ava-case-study.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: FONT_SANS, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(184,144,46,0.82)", textDecoration: "none", textAlign: "center", paddingTop: "4px", transition: "color 0.3s ease" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = GOLD_HEX; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(184,144,46,0.82)"; }}
              >
                See one of my clients real $1M audit →
              </a>
            </div>
          </div>
        </motion.div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "calc(50% - 0.5px)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          <motion.div style={{ opacity: cueOpacity }}>
            <motion.div
              style={{
                width: 1,
                height: 54,
                background: `linear-gradient(to bottom, transparent, ${GOLD_HEX})`,
              }}
              animate={{ opacity: [0.25, 0.85, 0.25] }}
              transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>
    </div>
    <ScoreModal type="shopify_health" open={healthModalOpen} onClose={() => setHealthModalOpen(false)} />
    <ScoreModal type="ai_visibility" open={visibilityModalOpen} onClose={() => setVisibilityModalOpen(false)} />
    </>
  );
}

// ── WordLift ──────────────────────────────────────────────────────────────────

const CLIP_STYLE: React.CSSProperties = {
  display: "inline-block",
  overflow: "hidden",
  verticalAlign: "bottom",
  paddingBottom: "0.18em",
};

function WordLift({
  text,
  isH1 = false,
  goldWords = 0,
  style,
  stagger = 0.09,
}: {
  text: string;
  isH1?: boolean;
  goldWords?: number;
  style?: CSSProperties;
  stagger?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const splitAt = goldWords > 0 ? words.length - goldWords : words.length;

  const wordSpan = (word: string, i: number, gold: boolean) => (
    <span key={i} style={{ ...CLIP_STYLE, marginRight: i < words.length - 1 ? "0.28em" : 0 }}>
      <motion.span
        style={{ display: "inline-block", willChange: "transform", ...(gold ? GOLD_GRADIENT_TEXT : {}) }}
        initial={{ y: reduce ? "0%" : "110%" }}
        animate={{ y: inView || reduce ? "0%" : "110%" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.06 + i * stagger }}
      >
        {word}
      </motion.span>
    </span>
  );

  const content = words.map((w, i) => wordSpan(w, i, i >= splitAt));
  return isH1
    ? <h1 ref={ref} style={style} aria-label={text}>{content}</h1>
    : <h2 ref={ref} style={style} aria-label={text}>{content}</h2>;
}

// ── 2. THE PROBLEM ────────────────────────────────────────────────────────────

function ProblemSection() {
  return (
    <section
      style={{ background: "linear-gradient(160deg, #3D2900 0%, #7A5500 18%, #C9A84C 38%, #F0D070 52%, #C9A84C 66%, #7A5500 84%, #3D2900 100%)", position: "relative" }}
      className="px-[clamp(1.5rem,5vw,4rem)] pt-[clamp(5rem,14vh,10rem)] pb-[clamp(11rem,26vh,18rem)]"
    >
      {/* Top fade — dissolves into the dark section above */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{ height: "18vh", background: "linear-gradient(to bottom, #0A0A0A 0%, rgba(10,10,10,0) 100%)" }}
      />
      {/* Bottom fade — dissolves into the dark section below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{ height: "22vh", background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0A0A0A 100%)" }}
      />
      <div className="mx-auto max-w-[1140px]" style={{ position: "relative", zIndex: 20 }}>
        <Reveal>
          <span
            style={{
              fontFamily: ARCHIVO,
              fontSize: 11,
              letterSpacing: "0.34em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.7)",
              display: "block",
              marginBottom: "1.1rem",
            }}
          >
            The Problem
          </span>
        </Reveal>

        <Reveal>
          <h2
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              color: "#0A0A0F",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              margin: "0 0 2.4rem",
            }}
          >
            Under-orchestrated.<br />Not under-resourced.
          </h2>
        </Reveal>

        <Reveal>
          <p
            style={{
              borderLeft: "2px solid rgba(255,255,255,0.75)",
              paddingLeft: 26,
              color: "rgba(10,10,15,0.72)",
              lineHeight: 1.7,
              fontSize: "clamp(1.05rem, 1.6vw, 1.18rem)",
              maxWidth: "46em",
              margin: "0 0 3rem",
              fontFamily: FONT_SANS,
            }}
          >
            You hired the marketing manager. You pay the ads agency. You&rsquo;re subscribed to the analytics tool, the email tool, the scheduler, the wholesale platform. And you&rsquo;re still the one who opens twelve tabs every morning after doing — then you make the call on instinct, because nothing gives you a straight answer.
          </p>
        </Reveal>

        {/* Paired columns — bare motion.divs, no outer Reveal (avoids double-animation) */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-[3.5rem] items-start"
          style={{ borderTop: "1px solid rgba(10,10,15,0.3)", paddingTop: "1.8rem" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0 }}
          >
            <div
              style={{
                fontFamily: ARCHIVO,
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.7)",
                marginBottom: "0.9rem",
              }}
            >
              The diagnosis
            </div>
            <p style={{ fontFamily: FONT_SANS, color: "rgba(10,10,15,0.78)", fontSize: "1.02rem", lineHeight: 1.7, margin: 0 }}>
              The problem was never that you lacked a team.<br />It&rsquo;s that no one — and nothing — is running it as one system.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          >
            <div
              style={{
                fontFamily: ARCHIVO,
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.7)",
                marginBottom: "0.9rem",
              }}
            >
              The fix
            </div>
            <p style={{ fontFamily: FONT_SANS, color: "rgba(10,10,15,0.72)", fontSize: "1.02rem", lineHeight: 1.7, margin: 0 }}>
              AI executives trained on the fashion industry sit across the whole operation — the agency&rsquo;s ad spend, the email flows, the wholesale accounts, the catalog — and orchestrate what you&rsquo;re already paying for. They don&rsquo;t replace your people; they make the whole thing finally pull in one direction.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ── 3. WHAT WE BUILD ──────────────────────────────────────────────────────────

const WB_CIRCLES = [
  {
    id: "run",
    title: "Run it from anywhere",
    body: "Connect to your AI executive from your phone, on the beach, in a meeting, anywhere in the world. Speak a task, it runs. Approve a decision with your voice. Your business stops waiting for you to be at a desk.",
    center: false,
    cls: "wb-circle-side-left",
  },
  {
    id: "dashboard",
    title: "One dashboard, one truth",
    body: "Twelve logins, twelve passwords, twelve tabs, and still no single answer to “how’s my business doing today?” We give you one place. Open it and know the health of your entire business in a glance.",
    center: true,
    cls: "wb-circle-center",
  },
  {
    id: "trained",
    title: "Trained on the industry,\nthen on you",
    body: "Every executive arrives already knowing how fashion works: buyers, seasons, margins, wholesale, what sells. Then it learns your specific brand on top. Institutional memory that compounds, not an amnesiac chat session.",
    center: false,
    cls: "wb-circle-side-right",
  },
] as const;

const CIRCLE_BORDER_DEFAULT = "1.5px solid #B8902E";
const CIRCLE_BORDER_ACTIVE  = "2px solid #E8C36A";
const CIRCLE_BG = "radial-gradient(circle at 50% 40%, #14130F, #0C0C0B 70%)";
const CIRCLE_SERIF = "Georgia, 'Times New Roman', serif";

function WhatWeBuildSection() {
  const wbRef  = useRef<HTMLDivElement>(null);
  const wbInView  = useInView(wbRef, { amount: 0.15, once: true });
  const wbReduce  = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  const wbCls = [
    "wb-anim",
    !wbReduce && wbInView ? "wb-building" : "",
    wbReduce  ? "wb-static" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      ref={wbRef}
      style={{
        background: BG,
        borderTop: "1px solid rgba(184,144,46,0.12)",
        overflow: "hidden",
        paddingTop: "clamp(3rem,7vh,5rem)",
        paddingBottom: "clamp(3.5rem,8vh,6rem)",
      }}
    >
      {/* ── Centered heading block ── */}
      <div className="mx-auto max-w-[1140px] px-8 md:px-16 text-center" style={{ marginBottom: "clamp(2.5rem,5vh,4rem)" }}>
        <motion.p style={EYEBROW} {...up(0)}>What We Build</motion.p>

        {/* Mobile heading */}
        <div className="md:hidden" style={{ margin: "0 auto 1.6rem" }}>
          <WordLift
            text="A private AI"
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(2rem, 8vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: CREAM,
              margin: 0,
              display: "block",
            }}
          />
          <WordLift
            text="operating system"
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(2rem, 8vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: CREAM,
              margin: 0,
              display: "block",
            }}
          />
        </div>

        {/* Desktop heading */}
        <div className="hidden md:block" style={{ margin: "0 auto 1.6rem" }}>
          <WordLift
            text="A private AI operating system —"
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: CREAM,
              margin: 0,
              display: "block",
            }}
          />
          <WordLift
            text="with your own executive team."
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: CREAM,
              margin: 0,
              display: "block",
            }}
          />
        </div>

        <motion.p
          style={{
            fontFamily: FONT_SANS,
            fontSize: "clamp(0.92rem, 1.2vw, 1.02rem)",
            lineHeight: 1.85,
            color: CREAM_DIM,
            maxWidth: "40em",
            margin: "0 auto",
          }}
          {...up(0.1)}
        >
          Trained on your voice, products, margins, customers, and the industry around you.<br />
          It does the work of the roles you&rsquo;re overpaying for, lives in one place, and runs every day.<br />
          No Subscription. Your Build. Your business.
        </motion.p>
      </div>

      {/* ── Desktop: full-bleed circle row ── */}
      <div
        className={`${wbCls} hidden md:block`}
        style={{ position: "relative", minHeight: 380 }}
      >
        {/* Left gold edge circle — bleeds off left viewport edge */}
        <div
          className="wb-edge-shimmer"
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translate(-44%, -50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
          }}
        />

        {/* Right gold edge circle — bleeds off right viewport edge */}
        <div
          className="wb-edge-shimmer"
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translate(44%, -50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
          }}
        />

        {/* Three content circles, centered */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            position: "relative",
            zIndex: 1,
            paddingTop: 16,
            paddingBottom: 16,
          }}
        >
          {WB_CIRCLES.map(({ id, title, body, center, cls }) => {
            const size = center ? 340 : 260;
            const isActive = activeId === id;
            return (
              <div
                key={id}
                className={`wb-content-circle ${cls}`}
                onMouseEnter={() => setActiveId(id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId(isActive ? null : id)}
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: CIRCLE_BG,
                  border: isActive ? CIRCLE_BORDER_ACTIVE : CIRCLE_BORDER_DEFAULT,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  padding: center ? 28 : 22,
                  cursor: "pointer",
                  overflow: "hidden",
                  boxSizing: "border-box",
                  transition: "border-color 0.3s ease",
                }}
              >
                <div style={{ textAlign: "center", width: "100%" }}>
                  <p
                    style={{
                      fontFamily: CIRCLE_SERIF,
                      fontStyle: "italic",
                      color: "#E8C36A",
                      fontSize: center ? "1.05rem" : "0.9rem",
                      lineHeight: 1.25,
                      textAlign: "center",
                      whiteSpace: "pre-line",
                      margin: 0,
                    }}
                  >
                    {title}
                  </p>
                  <div
                    style={{
                      overflow: "hidden",
                      maxHeight: isActive ? 200 : 0,
                      opacity: isActive ? 1 : 0,
                      transition: "max-height 0.4s ease, opacity 0.35s ease",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: FONT_SANS,
                        color: "#F7F4EF",
                        fontSize: "0.75rem",
                        lineHeight: 1.55,
                        textAlign: "center",
                        margin: "10px 0 0",
                      }}
                    >
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: vertical stack, tap to reveal body ── */}
      <div
        className={`${wbCls} md:hidden flex flex-col items-center`}
        style={{ gap: 16, paddingLeft: 24, paddingRight: 24 }}
      >
        {WB_CIRCLES.map(({ id, title, body, cls }) => {
          const isActive = activeId === id;
          return (
            <div
              key={id}
              className={`wb-content-circle ${cls}`}
              onClick={() => setActiveId(isActive ? null : id)}
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                background: CIRCLE_BG,
                border: isActive ? CIRCLE_BORDER_ACTIVE : CIRCLE_BORDER_DEFAULT,
                display: "grid",
                placeItems: "center",
                padding: 16,
                cursor: "pointer",
                overflow: "hidden",
                boxSizing: "border-box",
                transition: "border-color 0.3s ease",
              }}
            >
              <div style={{ textAlign: "center", width: "100%" }}>
                <p
                  style={{
                    fontFamily: CIRCLE_SERIF,
                    fontStyle: "italic",
                    color: "#E8C36A",
                    fontSize: "0.78rem",
                    lineHeight: 1.25,
                    textAlign: "center",
                    whiteSpace: "pre-line",
                    margin: 0,
                  }}
                >
                  {title}
                </p>
                <div
                  style={{
                    overflow: "hidden",
                    maxHeight: isActive ? 200 : 0,
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.35s ease, max-height 0.35s ease",
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      color: "#F7F4EF",
                      fontSize: "0.72rem",
                      lineHeight: 1.55,
                      textAlign: "center",
                      margin: "10px 0 0",
                    }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 4. THE MATH ───────────────────────────────────────────────────────────────

const MATH_ROWS = [
  {
    out: { title: "The agency retainer",        sub: "Every month, for results you can't fully see." },
    in:  { title: "Watched and run in-house",   sub: "The retainer, back in your pocket." },
  },
  {
    out: { title: "The tool stack",             sub: "Brandboom/JOOR, analytics, schedulers, overlapping apps." },
    in:  { title: "Deleted",                    sub: "Often the build cost in a single year of subscriptions." },
  },
  {
    out: { title: "Revenue already leaking",    sub: "Reorders not chased, carts not recovered, ad spend on the wrong audience." },
    in:  { title: "Recovered",                  sub: "One wholesale reorder can cover the system itself." },
  },
  {
    out: { title: "The hours you can't get back", sub: "The nights spent as the integration layer." },
    in:  { title: "Returned to you",            sub: "A straight answer every morning." },
  },
] as const;

const MATH_SERIF = "Georgia, 'Times New Roman', serif";

function TheMathSection() {
  const mathRef    = useRef<HTMLElement>(null);
  const mathInView = useInView(mathRef, { amount: 0.15, once: true });
  const mathReduce = useReducedMotion();

  const mathCls = [
    "math-anim",
    !mathReduce && mathInView ? "math-building" : "",
    mathReduce ? "math-static" : "",
  ].filter(Boolean).join(" ");

  return (
    <section
      ref={mathRef}
      className="px-[clamp(1.5rem,5vw,4rem)] py-20 md:py-28"
      style={{ borderTop: "1px solid rgba(184,144,46,0.12)" }}
    >
      <div className="mx-auto max-w-[1140px]">
      {/* Header */}
      <div style={{ marginBottom: "3.5rem" }}>
        <motion.p style={EYEBROW} {...up(0)}>The Math</motion.p>

        <WordLift
          text="You're already paying for this system."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
            color: CREAM,
            margin: "0",
            display: "block",
          }}
        />
        <WordLift
          text="It just isn't working yet."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.02,
            color: CREAM,
            margin: "0 0 2.4rem",
            display: "block",
          }}
        />

        <motion.p
          style={{
            borderLeft: "2px solid rgba(255,255,255,0.75)",
            paddingLeft: 26,
            color: CREAM_DIM,
            lineHeight: 1.7,
            fontSize: "clamp(1.05rem, 1.6vw, 1.18rem)",
            maxWidth: "46em",
            margin: 0,
            fontFamily: FONT_SANS,
          }}
          {...up(0.1)}
        >
          What leaves the account now, against what one owned system gives back.
        </motion.p>
      </div>

      {/* Column labels — desktop only */}
      <div>
      <div
        className="hidden md:grid"
        style={{ gridTemplateColumns: "1fr 56px 1fr", marginBottom: "0.5rem" }}
      >
        <div
          style={{
            fontFamily: ARCHIVO,
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: "rgba(247,244,239,0.75)",
            textAlign: "left",
            paddingLeft: "0",
          }}
        >
          What goes out
        </div>
        <div />
        <div
          style={{
            fontFamily: ARCHIVO,
            fontSize: 10,
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
            color: GOLD_HEX,
            textAlign: "left",
            paddingLeft: "1.75rem",
          }}
        >
          What comes back
        </div>
      </div>

      {/* Ledger — desktop */}
      <div
        className={`${mathCls} math-desktop hidden md:block`}
        style={{ position: "relative" }}
      >
        {/* Gold spine */}
        <div
          className="math-spine"
          style={{
            position: "absolute",
            left: "calc(50% - 0.5px)",
            top: 0,
            bottom: 0,
            width: 1,
            background:
              "linear-gradient(180deg, transparent, rgba(184,144,46,0.5) 8%, rgba(184,144,46,0.5) 92%, transparent)",
            transformOrigin: "top center",
          }}
        />

        {MATH_ROWS.map((row, i) => (
          <div
            key={row.out.title}
            className={`math-row math-row-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 56px 1fr",
              alignItems: "start",
              paddingTop: "2rem",
              paddingBottom: "2rem",
              borderBottom:
                i < MATH_ROWS.length - 1
                  ? "1px solid rgba(184,144,46,0.12)"
                  : "none",
            }}
          >
            {/* OUT — left aligned */}
            <div style={{ textAlign: "left", paddingRight: "1.75rem" }}>
              <p
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 700,
                  fontSize: "clamp(0.88rem, 1.15vw, 1rem)",
                  color: "#C9C3B6",
                  margin: "0 0 0.35rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {row.out.title}
              </p>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(0.76rem, 0.92vw, 0.85rem)",
                  lineHeight: 1.65,
                  color: "#F7F4EF",
                  margin: 0,
                }}
              >
                {row.out.sub}
              </p>
            </div>

            {/* Node — centered on spine */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                className={`math-node math-node-${i}`}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: "50%",
                  background: "#0A0A0A",
                  border: "1px solid #B8902E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#E8C36A" }} />
              </div>
            </div>

            {/* IN — left aligned */}
            <div style={{ paddingLeft: "1.75rem" }}>
              <p
                style={{
                  fontFamily: MATH_SERIF,
                  fontStyle: "italic",
                  fontSize: "clamp(0.88rem, 1.15vw, 1rem)",
                  color: "#E8C36A",
                  margin: "0 0 0.35rem",
                }}
              >
                {row.in.title}
              </p>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(0.76rem, 0.92vw, 0.85rem)",
                  lineHeight: 1.65,
                  color: "#F7F4EF",
                  margin: 0,
                }}
              >
                {row.in.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
      </div>{/* end centering wrapper */}

      {/* Ledger — mobile */}
      <div
        className={`${mathCls} math-mobile md:hidden`}
        style={{ position: "relative", paddingLeft: 28 }}
      >
        {/* Left-edge spine */}
        <div
          className="math-spine"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 1,
            background:
              "linear-gradient(180deg, transparent, rgba(184,144,46,0.5) 8%, rgba(184,144,46,0.5) 92%, transparent)",
            transformOrigin: "top center",
          }}
        />

        {MATH_ROWS.map((row, i) => (
          <div
            key={`m-${row.out.title}`}
            className={`math-row math-row-${i}`}
            style={{
              position: "relative",
              paddingTop: "1.5rem",
              paddingBottom: "1.5rem",
              borderBottom:
                i < MATH_ROWS.length - 1
                  ? "1px solid rgba(184,144,46,0.12)"
                  : "none",
            }}
          >
            {/* Node on left spine — inline transform keeps positioning safe from CSS scale rule */}
            <div
              className={`math-node math-node-${i}`}
              style={{
                position: "absolute",
                left: -35,
                top: "50%",
                transform: "translateY(-50%)",
                width: 13,
                height: 13,
                borderRadius: "50%",
                background: "#0A0A0A",
                border: "1px solid #B8902E",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#E8C36A" }} />
            </div>

            {/* OUT */}
            <p style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: "0.92rem", color: "#C9C3B6", margin: "0 0 0.2rem", letterSpacing: "-0.01em" }}>
              {row.out.title}
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", lineHeight: 1.65, color: "#F7F4EF", margin: "0 0 0.75rem" }}>
              {row.out.sub}
            </p>

            {/* IN */}
            <p style={{ fontFamily: MATH_SERIF, fontStyle: "italic", fontSize: "0.92rem", color: "#E8C36A", margin: "0 0 0.2rem" }}>
              {row.in.title}
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", lineHeight: 1.65, color: "#F7F4EF", margin: 0 }}>
              {row.in.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Closing line */}
      <motion.p
        style={{
          fontFamily: ARCHIVO,
          fontWeight: 800,
          fontSize: "clamp(0.92rem, 1.15vw, 1.15rem)",
          letterSpacing: "-0.01em",
          lineHeight: 1.55,
          color: CREAM,
          maxWidth: "none",
          margin: "3.5rem 0 0",
        }}
        {...up(0.1)}
      >
        Profitable from month one. Not because it costs less, but because it replaces what costs more.
      </motion.p>
      </div>{/* end mx-auto max-w-[1100px] */}
    </section>
  );
}

// ── 6. THE EXECUTIVE TEAM ─────────────────────────────────────────────────────

const EXECUTIVES = [
  {
    title: "Paid Ads",
    body: "Runs and optimizes spend daily, replacing the agency retainer while protecting the budget already out the door. Parallel-run handoff so nothing breaks.",
  },
  {
    title: "Email & Retention",
    body: "Recovers revenue leaking from abandoned carts, one-time buyers, and an under-mailed list. Turns email into the cheapest revenue the brand owns.",
  },
  {
    title: "Wholesale Platform",
    body: "A custom, branded ordering portal you own outright. Your own Brandboom/JOOR, none of the monthly fees. The wholesale executive chases reorders, follows up on every buyer, and flags accounts going quiet. Made-to-order, so no inventory-sync liability.",
  },
  {
    title: "Merchandising & Trend",
    body: "Trend forecasting, customer analysis, and collection scoring on your own sales data and live market signal. What to make more of, what to cut, what to drop next. Replaces guesswork that quietly burns cash on the wrong inventory.",
  },
  {
    title: "Content & Social",
    body: "On-brand drafting and scheduling, plus competitor analysis and what's trending. The channel stays fed and informed without a social manager on payroll.",
  },
  {
    title: "Catalog & Data",
    body: "Cleans and structures your Shopify catalog: variants, metafields, product data, tags. Optimizes for SEO, GEO, and AI search so customers and AI engines actually find you. Every other executive runs on truth, not noise.",
  },
  {
    title: "Ops & CEO Report",
    body: "A daily health check delivered to you: what needs to happen today, already drafted and ready. The executive does the thinking and the drafting. You just approve. Human in the loop, none of the busywork.",
  },
  {
    title: "Personal Assistant",
    body: `The always-on EA: scheduling, inbox triage, follow-ups, and the voice-driven "handle this while I'm out" executor. Your business keeps moving when you step away.`,
  },
] as const;

// Hub size — cluster nodes are fluid (sized by grid column)
const HUB_D = 200;

// Exec circle — fixed size for mobile hub; fluid (no size prop) for desktop cluster
function ExecCircle({
  title,
  size,
  isActive,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className = "",
  style = {},
  execRef,
}: {
  title: string;
  size?: number;
  isActive: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  execRef?: RefObject<HTMLDivElement | null>;
}) {
  const sizeStyle: CSSProperties = size
    ? { width: size, height: size }
    : { width: "100%", aspectRatio: "1" };

  return (
    <div
      ref={execRef}
      className={className}
      style={{
        ...sizeStyle,
        borderRadius: "50%",
        position: "relative",
        zIndex: 1,
        border: isActive
          ? "2px solid #E8C36A"
          : "1.5px solid #B8902E",
        background: "radial-gradient(circle at 50% 38%, #14130F, #0C0C0B 72%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "border-color 0.25s ease",
        flexShrink: 0,
        ...style,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <p
        style={{
          fontFamily: CIRCLE_SERIF,
          fontStyle: "italic",
          color: "#E8C36A",
          fontSize: "0.75rem",
          textAlign: "center",
          lineHeight: 1.3,
          padding: size ? `0 ${Math.round(size * 0.08)}px` : "0 10%",
          margin: 0,
        }}
      >
        {title}
      </p>
    </div>
  );
}

interface LineCoords {
  hubCX: number; hubCY: number;
  paCX: number;  paCY: number;
  csCX: number;  csCY: number;
  lenPA: number; lenCS: number;
}

function ExecutiveTilesSection() {
  const secRef   = useRef<HTMLElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const hubRef   = useRef<HTMLDivElement>(null);
  const paRef    = useRef<HTMLDivElement>(null);  // Paid Ads — diagonal anchor
  const csRef    = useRef<HTMLDivElement>(null);  // Content & Social — diagonal anchor
  const inView   = useInView(secRef, { amount: 0.15, once: true });
  const reduce   = useReducedMotion();

  const execCls = [
    "exec-anim",
    !reduce && inView ? "exec-building" : "",
    reduce ? "exec-static" : "",
  ].filter(Boolean).join(" ");

  const [activeIdx, setActiveIdx]   = useState<number | null>(null);
  const [lineCoords, setLineCoords] = useState<LineCoords | null>(null);

  // Measure all line endpoints from real DOM positions — reruns on resize
  useEffect(() => {
    function measure() {
      if (!boardRef.current || !hubRef.current || !paRef.current || !csRef.current) return;
      const board = boardRef.current.getBoundingClientRect();
      const hub   = hubRef.current.getBoundingClientRect();
      const pa    = paRef.current.getBoundingClientRect();
      const cs    = csRef.current.getBoundingClientRect();
      const hubCX = (hub.left - board.left) + hub.width  / 2;
      const hubCY = (hub.top  - board.top)  + hub.height / 2;
      const paCX  = (pa.left  - board.left) + pa.width   / 2;
      const paCY  = (pa.top   - board.top)  + pa.height  / 2;
      const csCX  = (cs.left  - board.left) + cs.width   / 2;
      const csCY  = (cs.top   - board.top)  + cs.height  / 2;
      const lenPA = Math.ceil(Math.hypot(paCX - hubCX, paCY - hubCY)) + 2;
      const lenCS = Math.ceil(Math.hypot(csCX - hubCX, csCY - hubCY)) + 2;
      setLineCoords({ hubCX, hubCY, paCX, paCY, csCX, csCY, lenPA, lenCS });
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (boardRef.current) ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const linesReady = inView && lineCoords !== null;
  const lineTrans  = reduce
    ? { duration: 0 }
    : { duration: 0.45, ease: "easeOut" as const };

  return (
    <section
      ref={secRef}
      style={{ background: "#0A0A0A", position: "relative" }}
      className="pt-[clamp(5rem,14vh,10rem)] pb-[clamp(6rem,16vh,11rem)]"
    >
      {/* Gold glow at top edge only — no bright field behind circles */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{ height: "22vh", background: "linear-gradient(to bottom, rgba(184,144,46,0.14) 0%, transparent 100%)" }} />
      {/* Gold glow at bottom edge only */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{ height: "22vh", background: "linear-gradient(to top, rgba(184,144,46,0.14) 0%, transparent 100%)" }} />

      {/* Heading — standard content column */}
      <div className="mx-auto max-w-[1140px] px-8 md:px-16 text-center" style={{ position: "relative", zIndex: 20 }}>
        <motion.p style={{ ...EYEBROW, color: GOLD_HEX, textAlign: "center" }} {...up(0)}>
          The Team You Couldn&rsquo;t Hire
        </motion.p>
        <WordLift
          text="Eight AI executives. One system."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: CREAM,
            margin: "0 0 2.5rem",
            textAlign: "center",
          }}
        />
      </div>

      {/* ── Desktop: hub-left + 4×2 cluster, near edge-to-edge ── */}
      <div
        className={`hidden md:block ${execCls}`}
        style={{ position: "relative", zIndex: 20 }}
      >
        {/* Flex wrapper centers the fixed-width board */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0 clamp(1.5rem,5vw,4rem)" }}>
          {/* Board — grid reference frame for SVG measurement */}
          <div
            ref={boardRef}
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: `${HUB_D}px max-content`,
              gap: "8rem",
              alignItems: "center",
            }}
          >
            {/* SVG connector lines — edge-to-edge (not center-to-center) */}
            {lineCoords && (() => {
              const NODE_R = 75; // cluster circle radius (150px / 2)
              // PA line — edge points
              const dxPA = lineCoords.paCX - lineCoords.hubCX;
              const dyPA = lineCoords.paCY - lineCoords.hubCY;
              const distPA = Math.hypot(dxPA, dyPA);
              const nxPA = dxPA / distPA; const nyPA = dyPA / distPA;
              const paX1 = lineCoords.hubCX + nxPA * (HUB_D / 2);
              const paY1 = lineCoords.hubCY + nyPA * (HUB_D / 2);
              const paX2 = lineCoords.paCX  - nxPA * NODE_R;
              const paY2 = lineCoords.paCY  - nyPA * NODE_R;
              const lenPA = Math.ceil(Math.hypot(paX2 - paX1, paY2 - paY1)) + 2;
              // CS line — edge points
              const dxCS = lineCoords.csCX - lineCoords.hubCX;
              const dyCS = lineCoords.csCY - lineCoords.hubCY;
              const distCS = Math.hypot(dxCS, dyCS);
              const nxCS = dxCS / distCS; const nyCS = dyCS / distCS;
              const csX1 = lineCoords.hubCX + nxCS * (HUB_D / 2);
              const csY1 = lineCoords.hubCY + nyCS * (HUB_D / 2);
              const csX2 = lineCoords.csCX  - nxCS * NODE_R;
              const csY2 = lineCoords.csCY  - nyCS * NODE_R;
              const lenCS = Math.ceil(Math.hypot(csX2 - csX1, csY2 - csY1)) + 2;
              return (
                <svg
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    pointerEvents: "none",
                    zIndex: 5,
                  }}
                >
                  <motion.line
                    x1={paX1} y1={paY1} x2={paX2} y2={paY2}
                    stroke="rgba(184,144,46,0.4)"
                    strokeWidth="0.8"
                    strokeDasharray={lenPA}
                    initial={{ strokeDashoffset: lenPA, opacity: 0 }}
                    animate={linesReady ? { strokeDashoffset: 0, opacity: 1 } : { strokeDashoffset: lenPA, opacity: 0 }}
                    transition={{ ...lineTrans, delay: reduce ? 0 : 0.52 }}
                  />
                  <motion.line
                    x1={csX1} y1={csY1} x2={csX2} y2={csY2}
                    stroke="rgba(184,144,46,0.4)"
                    strokeWidth="0.8"
                    strokeDasharray={lenCS}
                    initial={{ strokeDashoffset: lenCS, opacity: 0 }}
                    animate={linesReady ? { strokeDashoffset: 0, opacity: 1 } : { strokeDashoffset: lenCS, opacity: 0 }}
                    transition={{ ...lineTrans, delay: reduce ? 0 : 0.62 }}
                  />
                </svg>
              );
            })()}

            {/* Hub — 200px, first grid column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div
                ref={hubRef}
                className="exec-hub"
                style={{
                  width: HUB_D,
                  height: HUB_D,
                  borderRadius: "50%",
                  border: "1.5px solid #B8902E",
                  background: "linear-gradient(110deg, #6B4F18 0%, #B8902E 22%, #E8C36A 42%, #FBE9AE 50%, #E8C36A 58%, #B8902E 78%, #6B4F18 100%)",
                  backgroundSize: "200% 100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p style={{
                  fontFamily: CIRCLE_SERIF,
                  fontStyle: "italic",
                  color: "#0A0A0A",
                  fontSize: "1rem",
                  textAlign: "center",
                  lineHeight: 1.3,
                  padding: "0 18px",
                  margin: 0,
                }}>
                  One system.
                </p>
              </div>
              <p style={{
                fontFamily: FONT_SANS,
                fontSize: "0.75rem",
                color: CREAM,
                textAlign: "center",
                margin: 0,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
              }}>
                Hover an executive to see what they run.
              </p>
            </div>

            {/* 4×2 cluster — fixed 150px columns, more generous gap between circles */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gridTemplateColumns: "repeat(4, 150px)",
                gap: "4rem",
                width: "max-content",
              }}
            >
              {/* Row connector lines — absolute divs BEHIND circles (circles zIndex:1 cover them) */}
              {[75, 289].map((top, ri) => (
                <motion.div
                  key={`row-${ri}`}
                  style={{
                    position: "absolute",
                    left: 150,
                    right: 150,
                    top,
                    height: 1,
                    background: "rgba(184,144,46,0.4)",
                    zIndex: 0,
                    transformOrigin: "0% 50%",
                    pointerEvents: "none",
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={inView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: reduce ? 0 : 0.3 + ri * 0.12 }}
                />
              ))}
              {EXECUTIVES.map((exec, i) => (
                <ExecCircle
                  key={exec.title}
                  title={exec.title}
                  isActive={activeIdx === i}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  className={`exec-node exec-node-${i}`}
                  execRef={i === 0 ? paRef : i === 4 ? csRef : undefined}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Caption — content column */}
        <div className="mx-auto max-w-[1140px] px-8 md:px-16" style={{ marginTop: "1.5rem" }}>
          <div style={{ minHeight: "4.5em", maxWidth: "56ch" }}>
            {activeIdx !== null && (
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.9rem",
                  lineHeight: 1.78,
                  color: CREAM,
                  margin: 0,
                }}
              >
                {EXECUTIVES[activeIdx].body}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: hub top + 2×4 grid ── */}
      <div
        className={`md:hidden flex flex-col items-center gap-5 px-6 ${execCls}`}
        style={{ position: "relative", zIndex: 20 }}
      >
        <div
          className="exec-hub"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: "1.5px solid #B8902E",
            background: "linear-gradient(110deg, #6B4F18 0%, #B8902E 22%, #E8C36A 42%, #FBE9AE 50%, #E8C36A 58%, #B8902E 78%, #6B4F18 100%)",
            backgroundSize: "200% 100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <p style={{
            fontFamily: CIRCLE_SERIF,
            fontStyle: "italic",
            color: "#0A0A0A",
            fontSize: "0.82rem",
            textAlign: "center",
            lineHeight: 1.3,
            padding: "0 12px",
            margin: 0,
          }}>
            One system.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 88px)", gap: 12 }}>
          {EXECUTIVES.map((exec, i) => (
            <ExecCircle
              key={exec.title}
              title={exec.title}
              size={88}
              isActive={activeIdx === i}
              onClick={() => setActiveIdx((a) => (a === i ? null : i))}
              className={`exec-node exec-node-${i}`}
            />
          ))}
        </div>

        <div style={{ minHeight: "3.5em", textAlign: "center", maxWidth: "36ch" }}>
          <p style={{
            fontFamily: FONT_SANS,
            fontSize: "0.88rem",
            lineHeight: 1.75,
            color: activeIdx !== null ? CREAM : CREAM_MUTED,
            margin: 0,
          }}>
            {activeIdx !== null
              ? EXECUTIVES[activeIdx].body
              : "Tap an executive to see what they run."}
          </p>
        </div>
      </div>

    </section>
  );
}

// ── 7. HOW IT WORKS ───────────────────────────────────────────────────────────

const STEPS = [
  { n: "01", title: "Diagnose", body: "The free score gave you a number. This goes under the hood to show every gap behind it, what each one is costing you, and exactly where the brand stands. The full picture the score only hinted at." },
  { n: "02", title: "Audit & Plan", body: "A line-by-line read on what's underperforming and what it's quietly costing you, turned into a costed roadmap of exactly what to fix and in what order. You see the full plan, priced and prioritized, before you commit to a single build." },
  { n: "03", title: "Foundation", body: "Before anything gets built, the groundwork. We clean and structure your catalog, fix the product data, and repair SEO, GEO, and AI-search visibility so customers and AI engines can find you. Everything built on top runs on truth, not noise." },
  { n: "04", title: "Build", body: "The full system, built and connected to your tools and data. Your AI executives, your owned wholesale platform, the dashboard. Installed, tested, and handed over working. The team you couldn't hire, running." },
  { n: "05", title: "Run", body: "Ongoing operation and management. Health checks, a new automation each cycle, and monitoring so a vendor change never silently breaks the brand. The system keeps improving while you stay in control." },
];

function HowItWorksSection() {
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);

  return (
    <section
      className="px-[clamp(1.5rem,5vw,4rem)] py-20 md:py-28"
      style={{ borderTop: "1px solid rgba(184,144,46,0.12)" }}
    >
      {/* Constrain heading + score cards to standard column width */}
      <div className="mx-auto max-w-[1140px]">
        <motion.p style={EYEBROW} {...up(0)}>How It Works</motion.p>

        <WordLift
          text="Diagnosis before cure."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: CREAM,
            margin: "0 0 2rem",
          }}
        />

        <motion.blockquote
          style={{ borderLeft: "2px solid rgba(255,255,255,0.75)", paddingLeft: "1.6rem", margin: "0 0 3.5rem" }}
          {...up(0.08)}
        >
          <p style={{ fontFamily: FONT_SANS, fontSize: "clamp(1rem, 1.3vw, 1.1rem)", lineHeight: 1.75, color: CREAM_DIM, margin: 0, maxWidth: "46em" }}>
            You can&rsquo;t fix what you haven&rsquo;t measured. We start with the diagnosis, then the plan, then the build.
          </p>
        </motion.blockquote>

        {/* Two scores — side by side */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" style={{ marginBottom: "4rem" }}>
        {/* Primary: Shopify Health Check */}
        <motion.div
          style={{
            background: "rgba(184,144,46,0.06)",
            border: `1px solid rgba(184,144,46,0.28)`,
            borderTop: `3px solid ${GOLD_HEX}`,
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
          }}
          {...up(0.08)}
        >
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.62rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: GOLD_HEX,
              margin: "0 0 1.25rem",
            }}
          >
            Primary · lower friction
          </p>
          <p
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-0.01em",
              color: CREAM,
              margin: "0 0 1rem",
            }}
          >
            Shopify Health Check
          </p>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.92rem",
              lineHeight: 1.8,
              color: CREAM_DIM,
              margin: "0 0 2rem",
            }}
          >
            10 items, scored 1–10. No explanation, no fluff — just the brutal number.<br />The sting that makes a founder go &ldquo;I got a <em>what</em>?&rdquo; Instantly shareable.
          </p>
          <button
            onClick={() => setHealthModalOpen(true)}
            style={GOLD_FILL_BTN}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundPosition = "100% 50%")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundPosition = "0% 50%")}
          >
            See what it&rsquo;s costing you →
          </button>
        </motion.div>

        {/* Secondary: AI Visibility Score */}
        <motion.div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderTop: "3px solid rgba(255,255,255,0.08)",
            padding: "2.5rem",
            display: "flex",
            flexDirection: "column",
          }}
          {...up(0.14)}
        >
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.62rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: CREAM_MUTED,
              margin: "0 0 1.25rem",
            }}
          >
            Deeper read
          </p>
          <p
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 700,
              fontSize: "1.25rem",
              letterSpacing: "-0.01em",
              color: CREAM,
              margin: "0 0 1rem",
            }}
          >
            AI Visibility Score
          </p>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.92rem",
              lineHeight: 1.8,
              color: CREAM_DIM,
              margin: "0 0 2rem",
            }}
          >
            A deeper read on how ready the brand is for AI search, automation, and the operating system. Routes to the audit and build.
          </p>
          <button
            onClick={() => setVisibilityModalOpen(true)}
            style={{ ...GOLD_GHOST_BTN, marginTop: "auto" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.45)"; e.currentTarget.style.color = GOLD_HEX; }}
          >
            See if you&rsquo;re visible →
          </button>
        </motion.div>
        </div>
      </div>{/* end constrained heading/score wrapper */}

      {/* 5-step path — same width as heading block */}
      <div className="mx-auto max-w-[1140px]">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <motion.div key={s.n} {...up(0.07 * i)}>
            <p
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 800,
                fontSize: "2rem",
                letterSpacing: "-0.02em",
                color: GOLD_HEX,
                opacity: 0.5,
                margin: "0 0 1.5rem",
                lineHeight: 1,
              }}
            >
              {s.n}
            </p>
            <p
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: CREAM,
                margin: "0 0 1rem",
              }}
            >
              {s.title}
            </p>
            <div style={{ width: 20, height: 1, background: GOLD_HEX, opacity: 0.35, marginBottom: "1rem" }} />
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.92rem", lineHeight: 1.8, color: CREAM_DIM, margin: 0 }}>
              {s.body.split('. ').map((sentence, idx, arr) => (
                <span key={idx}>
                  {sentence}{idx < arr.length - 1 ? '.' : ''}
                  {idx < arr.length - 1 && <><br /><br /></>}
                </span>
              ))}
            </p>
          </motion.div>
        ))}
      </div>
      </div>{/* end max-w-[1140px] steps wrapper */}

      <ScoreModal type="shopify_health" open={healthModalOpen} onClose={() => setHealthModalOpen(false)} />
      <ScoreModal type="ai_visibility" open={visibilityModalOpen} onClose={() => setVisibilityModalOpen(false)} />
    </section>
  );
}

// ── 8. WAYS TO WORK WITH US ───────────────────────────────────────────────────

const SKU_TABLE = [
  { label: "Essential",    range: "up to 100 SKUs",   price: "$1,500"      },
  { label: "Growth",       range: "101 to 300 SKUs",  price: "$2,000"      },
  { label: "Full Catalog", range: "301 to 500 SKUs",  price: "$2,500"      },
  { label: "500+ SKUs",    range: "",                 price: "custom quote" },
] as const;

const CORE_INCLUDES = [
  "Eight AI executives, built and connected",
  "Your own wholesale platform, owned outright",
  "The unified dashboard, one place to run it all",
  "Installed, tested, handed over working. No monthly fees on the system.",
] as const;

type QuietTier = {
  name: string;
  sub: string;
  price: string;
  body: string;
  bodyItalic: string | null;
  gold: boolean;
  wireTransfer?: boolean;
};

const QUIET_TIERS: QuietTier[] = [
  {
    name: "Build & Manage",
    sub: "System Build + Management",
    price: "$8,000 + $1,000/month",
    body: "The natural attach to Core. Ongoing health checks, a new automation each cycle, and monitoring so a vendor change never silently breaks the brand. The monthly should feel small next to what the system saves every month.",
    bodyItalic: null,
    gold: false,
    wireTransfer: true,
  },
  {
    name: "A La Carte",
    sub: "Custom One-Off Builds",
    price: "$2,500 per build",
    body: "A standalone wholesale portal, a single executive, or one custom workflow. No system dependency required.",
    bodyItalic: null,
    gold: false,
    wireTransfer: true,
  },
  {
    name: "The Atelier Package",
    sub: "Your Embedded AI Operation · By Application",
    price: "From $15,000/month",
    body: "The fully embedded tier. We run your entire digital operation alongside you. By application.",
    bodyItalic: "Priced against: a fractional CTO runs $8,000 to $25,000/month for part-time hours. Atelier gives you the operator, the build, and the management, and you own what's built.",
    gold: true,
    wireTransfer: true,
  },
];

const LEDGER_COLS: CSSProperties = {
  gridTemplateColumns: "1.3fr 2fr 0.9fr",
  gap: "2rem",
  alignItems: "start",
};

const HERO_DIVIDER: CSSProperties = {
  height: 1,
  background: "rgba(184,144,46,0.18)",
};

const QUIET_DIVIDER: CSSProperties = {
  height: 1,
  background: "rgba(184,144,46,0.1)",
};

const WIRE_NOTE_STYLE: CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: "0.75rem",
  lineHeight: 1.6,
  color: "rgba(247,244,239,0.45)",
  margin: "0.65rem 0 0.8rem",
};

const WIRE_CTA_STYLE: CSSProperties = {
  display: "inline-block",
  background: "none",
  border: "1px solid rgba(184,144,46,0.38)",
  padding: "0.45rem 0.9rem",
  fontFamily: FONT_SANS,
  fontSize: "0.66rem",
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: GOLD,
  cursor: "pointer",
  textDecoration: "none",
  transition: "border-color 0.22s, color 0.22s",
  whiteSpace: "nowrap" as const,
};

function WireBlock({ align = "right", onBookCall }: { align?: "left" | "right"; onBookCall: () => void }) {
  return (
    <div style={{ textAlign: align }}>
      <p style={{ ...WIRE_NOTE_STYLE, textAlign: align }}>
        Invoiced directly, paid by wire transfer. Once I have scoped your project, I send an invoice with payment details.
      </p>
      <button
        onClick={onBookCall}
        style={WIRE_CTA_STYLE}
        onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = CREAM_DIM; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.38)"; e.currentTarget.style.color = GOLD; }}
      >
        Book a first call &middot; $500 &#8594;
      </button>
    </div>
  );
}

function HeroRow({
  tag,
  name,
  sub,
  price,
  lead,
  leadItalic,
  dropdownLabel,
  wireTransfer,
  onBookCall,
  children,
}: {
  tag: string;
  name: string;
  sub: string;
  price: string;
  lead: string;
  leadItalic?: string;
  dropdownLabel: string;
  wireTransfer?: boolean;
  onBookCall?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div style={{ position: "relative" }}>
      {/* Gold left-rule */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: "linear-gradient(180deg, #E8C36A, #B8902E)",
        }}
      />
      {/* Desktop 3-col grid */}
      <div className="hidden md:grid" style={{ ...LEDGER_COLS, paddingLeft: "1.5rem", paddingTop: "1.8rem", paddingBottom: "1.8rem" }}>
        {/* Col 1 */}
        <div>
          <p style={{ fontFamily: FONT_SANS, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD_HEX, margin: "0 0 0.55rem" }}>
            {tag}
          </p>
          <p style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: "1.15rem", letterSpacing: "-0.01em", color: CREAM, margin: "0 0 0.3rem" }}>
            {name}
          </p>
          <p style={{ fontFamily: ARCHIVO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM_DIM, margin: 0 }}>
            {sub}
          </p>
        </div>
        {/* Col 2 */}
        <div>
          <p style={{ fontFamily: FONT_SANS, fontSize: "clamp(0.9rem,1.05vw,0.97rem)", lineHeight: 1.75, color: CREAM_DIM, margin: leadItalic ? "0 0 0.45rem" : "0 0 1.1rem" }}>
            {lead}
          </p>
          {leadItalic && (
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", fontStyle: "italic", lineHeight: 1.65, color: CREAM_DIM, margin: "0 0 1.1rem" }}>
              {leadItalic}
            </p>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: "0.45rem", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT_SANS, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD_HEX }}
            aria-expanded={open}
          >
            <span style={{ display: "inline-block", fontSize: "1.05rem", lineHeight: 1, transition: reduce ? "none" : "transform 0.3s ease", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
            {dropdownLabel}
          </button>
          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: "1.1rem" }}>{children}</div>
          </motion.div>
        </div>
        {/* Col 3 */}
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "1.05rem", letterSpacing: "-0.01em", color: "#E8C36A", margin: 0, whiteSpace: "nowrap" }}>
            {price}
          </p>
          {wireTransfer && onBookCall && <WireBlock align="right" onBookCall={onBookCall} />}
        </div>
      </div>

      {/* Mobile stacked */}
      <div className="md:hidden" style={{ paddingLeft: "1.25rem", paddingTop: "1.5rem", paddingBottom: "1.5rem" }}>
        <p style={{ fontFamily: FONT_SANS, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD_HEX, margin: "0 0 0.45rem" }}>{tag}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <p style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.01em", color: CREAM, margin: 0 }}>{name}</p>
          <p style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "0.97rem", color: "#E8C36A", margin: 0, whiteSpace: "nowrap" }}>{price}</p>
        </div>
        <p style={{ fontFamily: ARCHIVO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM_DIM, margin: "0 0 0.75rem" }}>{sub}</p>
        <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", lineHeight: 1.7, color: CREAM_DIM, margin: leadItalic ? "0 0 0.4rem" : "0 0 0.9rem" }}>{lead}</p>
        {leadItalic && <p style={{ fontFamily: FONT_SANS, fontSize: "0.82rem", fontStyle: "italic", lineHeight: 1.6, color: CREAM_DIM, margin: "0 0 0.9rem" }}>{leadItalic}</p>}
        {wireTransfer && onBookCall && <WireBlock align="left" onBookCall={onBookCall} />}
        <button
          onClick={() => setOpen(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: "0.45rem", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT_SANS, fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: GOLD_HEX, marginTop: wireTransfer ? "1.25rem" : undefined }}
          aria-expanded={open}
        >
          <span style={{ display: "inline-block", fontSize: "1.05rem", lineHeight: 1, transition: reduce ? "none" : "transform 0.3s ease", transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
          {dropdownLabel}
        </button>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
        >
          <div style={{ paddingTop: "1rem" }}>{children}</div>
        </motion.div>
      </div>

      <div style={HERO_DIVIDER} />
    </div>
  );
}

function WaysToWorkSection() {
  const MUTED = CREAM_DIM;
  const GOLD_LABEL = "#B8902E";
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [consultSource, setConsultSource] = useState<string | null>(null);
  const openConsult = (source: string) => setConsultSource(source);

  return (
    <section
      className="px-[clamp(1.5rem,5vw,4rem)] py-20 md:py-28"
      style={{ borderTop: "1px solid rgba(184,144,46,0.12)" }}
    >
      <div className="mx-auto max-w-[1140px]">
        <motion.p style={{ ...EYEBROW, textAlign: "center" }} {...up(0)}>Ways to Work With Us</motion.p>

        <WordLift
          text="Start where it makes sense for your business."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: CREAM,
            margin: "0 0 1.5rem",
            textAlign: "center",
          }}
        />

        <motion.p
          style={{
            fontFamily: FONT_SANS,
            fontSize: "clamp(0.95rem, 1.2vw, 1.05rem)",
            lineHeight: 1.8,
            color: "#C9C3B6",
            maxWidth: "40em",
            margin: "0 auto 2.5rem",
            textAlign: "center",
          }}
          {...up(0.08)}
        >
          Every price is right here.<br className="md:hidden" /> No discovery call to learn what it costs.<br />No proposal built to upsell you, because I'd rather you decide for yourself than be sold.
        </motion.p>

        {/* Top divider */}
        <div style={HERO_DIVIDER} />

        {/* DIY Kit rung — $297 self-serve entry point */}
        <motion.div {...up(0.04)}>
          {/* Desktop */}
          <div className="hidden md:grid" style={{ ...LEDGER_COLS, padding: "1.6rem 0 1.4rem", borderBottom: "1px solid rgba(184,144,46,0.1)" }}>
            <div>
              <p style={{
                fontFamily: ARCHIVO,
                fontSize: "0.6rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: GOLD_LABEL,
                margin: "0 0 0.5rem",
              }}>
                SELF-SERVE
              </p>
              <p style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em", color: CREAM, margin: "0 0 0.2rem" }}>
                The DIY Store Audit Kit
              </p>
              <p style={{ fontFamily: ARCHIVO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM_MUTED, margin: 0 }}>
                Self-serve · Sidekick-powered
              </p>
            </div>
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", lineHeight: 1.75, color: CREAM_DIM, margin: "0 0 0.55rem" }}>
                The exact prompts we use to audit a fashion brand, across ten categories, run it yourself with Shopify's built-in AI. Deep enough to find every leak. Most founders run it, see the scope, and decide they would rather have it done for them.
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", fontStyle: "italic", color: GOLD_LABEL, margin: 0, opacity: 0.85 }}>
                Your $297 credits toward the Done-For-You Store Fix.
              </p>
            </div>
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.9rem" }}>
              <p style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "0.92rem", color: CREAM, margin: 0, letterSpacing: "-0.01em" }}>
                $297
              </p>
              <button
                onClick={() => setAuditModalOpen(true)}
                style={{
                  background: "none",
                  border: "1px solid rgba(184,144,46,0.45)",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  fontFamily: FONT_SANS,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: GOLD_HEX,
                  whiteSpace: "nowrap",
                  transition: "border-color 0.25s ease, color 0.25s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.45)"; e.currentTarget.style.color = GOLD_HEX; }}
              >
                Get the kit &mdash; $297 →
              </button>
            </div>
          </div>
          {/* Mobile */}
          <div className="md:hidden" style={{ padding: "1.4rem 0", borderBottom: "1px solid rgba(184,144,46,0.1)" }}>
            <p style={{ fontFamily: ARCHIVO, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD_LABEL, margin: "0 0 0.4rem" }}>
              SELF-SERVE
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.25rem" }}>
              <p style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: "0.97rem", color: CREAM, margin: 0 }}>The DIY Store Audit Kit</p>
              <p style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "0.88rem", color: CREAM, margin: 0 }}>$297</p>
            </div>
            <p style={{ fontFamily: ARCHIVO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: CREAM_MUTED, margin: "0 0 0.6rem" }}>
              Self-serve · Sidekick-powered
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", lineHeight: 1.75, color: CREAM_DIM, margin: "0 0 0.45rem" }}>
              The exact prompts we use to audit a fashion brand, across ten categories, run it yourself with Shopify's built-in AI. Deep enough to find every leak. Most founders run it, see the scope, and decide they would rather have it done for them.
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", fontStyle: "italic", color: GOLD_LABEL, margin: "0 0 1rem", opacity: 0.85 }}>
              Your $297 credits toward the Done-For-You Store Fix.
            </p>
            <button
              onClick={() => setAuditModalOpen(true)}
              style={{
                background: "none",
                border: "1px solid rgba(184,144,46,0.45)",
                padding: "0.6rem 1.1rem",
                cursor: "pointer",
                fontFamily: FONT_SANS,
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: GOLD_HEX,
                transition: "border-color 0.25s ease, color 0.25s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.45)"; e.currentTarget.style.color = GOLD_HEX; }}
            >
              Get the kit &mdash; $297 →
            </button>
          </div>
        </motion.div>

        {/* Hero row 1 — Minimum Package */}
        <HeroRow
          tag="THE NO-SYSTEM ENTRY POINT"
          name="The Minimum Package"
          sub="The Shopify Foundation Fix"
          price="from $1,500"
          lead="A full read on where your store is failing, and fixed. Catalog cleanup, data structuring, and the part most founders never connect: how it affects AI searchability and whether customers and AI engines can find you at all."
          dropdownLabel="What's included & SKU pricing"
          wireTransfer
          onBookCall={() => openConsult("The Minimum Package")}
        >
          <div style={{ marginBottom: "0.9rem" }}>
            {SKU_TABLE.map((row, i) => (
              <div
                key={row.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.45rem 0",
                  borderBottom: i < SKU_TABLE.length - 1 ? "1px solid rgba(184,144,46,0.1)" : "none",
                }}
              >
                <span style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", color: CREAM_DIM }}>
                  <span style={{ fontWeight: 600, color: CREAM }}>{row.label}</span>
                  {row.range && <span> &middot; {row.range}</span>}
                </span>
                <span style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "0.92rem", color: CREAM, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                  {row.price}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", fontStyle: "italic", lineHeight: 1.65, color: MUTED, margin: "0 0 0.65rem" }}>
            Priced against: a few months of the apps it makes redundant, and the sales lost every week to a store AI and search can&rsquo;t read.
          </p>
          <p style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", lineHeight: 1.75, color: CREAM_DIM, margin: 0 }}>
            This isn&rsquo;t data cleanup. It&rsquo;s making the brand discoverable and trustworthy to the systems that now decide who gets found. Stands alone, delivers real value, and warms every buyer for the build.
          </p>
        </HeroRow>

        {/* Hero row 2 — Core Package */}
        <HeroRow
          tag="THE OFFER YOU WANT TO LAND"
          name="The Core Package"
          sub="The System Build"
          price="$8,000"
          lead="Your full AI executive team, installed. An owned wholesale platform, built, connected, and yours. Not rented, not a subscription. The team you couldn't hire, running."
          leadItalic="Priced against: less than a year of most agency retainers, for a system you own outright."
          dropdownLabel="What's included"
          wireTransfer
          onBookCall={() => openConsult("The Core Package")}
        >
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {CORE_INCLUDES.map(item => (
              <li
                key={item}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0.65rem",
                  fontFamily: FONT_SANS,
                  fontSize: "0.88rem",
                  lineHeight: 1.65,
                  color: CREAM_DIM,
                  marginBottom: "0.4rem",
                }}
              >
                <span style={{ color: GOLD_HEX, fontSize: "0.5rem", flexShrink: 0, position: "relative", top: "-0.1em" }}>&#9670;</span>
                {item}
              </li>
            ))}
          </ul>
        </HeroRow>

        {/* "Also available" label */}
        <p style={{
          fontFamily: ARCHIVO,
          fontSize: "0.65rem",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: GOLD_HEX,
          margin: "2.2rem 0 0.6rem",
        }}>
          Additional services
        </p>

        {/* Quiet rows */}
        <div style={{ borderTop: "1px solid rgba(184,144,46,0.1)" }}>
          {QUIET_TIERS.map((tier, i) => (
            <motion.div key={tier.name} {...up(0.07 * i)}>
              {/* Desktop */}
              <div className="hidden md:grid" style={{ ...LEDGER_COLS, padding: "1.4rem 0", borderBottom: "1px solid rgba(184,144,46,0.1)" }}>
                <div>
                  <p style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.01em", color: tier.gold ? GOLD_LABEL : CREAM, margin: "0 0 0.25rem" }}>
                    {tier.name}
                  </p>
                  <p style={{ fontFamily: ARCHIVO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, margin: 0 }}>
                    {tier.sub}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", lineHeight: 1.7, color: MUTED, margin: tier.bodyItalic ? "0 0 0.45rem" : 0 }}>
                    {tier.body}
                  </p>
                  {tier.bodyItalic && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.8rem", fontStyle: "italic", lineHeight: 1.6, color: MUTED, margin: 0, opacity: 0.8 }}>
                      {tier.bodyItalic}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "0.92rem", color: tier.gold ? "#E8C36A" : CREAM, margin: 0, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                    {tier.price}
                  </p>
                  {tier.wireTransfer && <WireBlock align="right" onBookCall={() => openConsult(tier.name)} />}
                </div>
              </div>
              {/* Mobile */}
              <div className="md:hidden" style={{ padding: "1.2rem 0", borderBottom: "1px solid rgba(184,144,46,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.25rem" }}>
                  <p style={{ fontFamily: ARCHIVO, fontWeight: 700, fontSize: "0.97rem", color: tier.gold ? GOLD_LABEL : CREAM, margin: 0 }}>{tier.name}</p>
                  <p style={{ fontFamily: ARCHIVO, fontWeight: 600, fontSize: "0.88rem", color: tier.gold ? "#E8C36A" : CREAM, margin: 0, whiteSpace: "nowrap" }}>{tier.price}</p>
                </div>
                <p style={{ fontFamily: ARCHIVO, fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED, margin: "0 0 0.55rem" }}>{tier.sub}</p>
                <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", lineHeight: 1.7, color: MUTED, margin: tier.bodyItalic ? "0 0 0.4rem" : 0 }}>{tier.body}</p>
                {tier.bodyItalic && (
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", fontStyle: "italic", lineHeight: 1.6, color: MUTED, margin: 0, opacity: 0.8 }}>{tier.bodyItalic}</p>
                )}
                {tier.wireTransfer && <div style={{ marginTop: "0.9rem" }}><WireBlock align="left" onBookCall={() => openConsult(tier.name)} /></div>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* $500 First Call CTA */}
        <motion.div
          {...up(0.1)}
          style={{
            borderTop: "1px solid rgba(184,144,46,0.18)",
            marginTop: "2.5rem",
            paddingTop: "2.5rem",
            paddingBottom: "0.5rem",
          }}
        >
          {/* Desktop */}
          <div className="hidden md:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: "2rem" }}>
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD_HEX, margin: "0 0 0.5rem" }}>
                FIRST CALL
              </p>
              <p style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.01em", color: CREAM, margin: "0 0 0.3rem" }}>
                Not sure where to start?
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", lineHeight: 1.7, color: CREAM_DIM, margin: "0 0 0.3rem", maxWidth: "38em" }}>
                A 60-minute call where I read your brand and tell you exactly what I see. The $500 goes toward your build.
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", fontStyle: "italic", color: GOLD_HEX, margin: 0, opacity: 0.85 }}>
                The $500 credits toward any build package.
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={() => openConsult("")}
                style={{
                  background: "none",
                  border: "1px solid rgba(184,144,46,0.5)",
                  padding: "0.75rem 1.5rem",
                  cursor: "pointer",
                  fontFamily: FONT_SANS,
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: GOLD_HEX,
                  whiteSpace: "nowrap",
                  transition: "border-color 0.25s ease, color 0.25s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.5)"; e.currentTarget.style.color = GOLD_HEX; }}
              >
                Book a first call &middot; $500 &#8594;
              </button>
            </div>
          </div>
          {/* Mobile */}
          <div className="md:hidden">
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD_HEX, margin: "0 0 0.4rem" }}>
              FIRST CALL
            </p>
            <p style={{ fontFamily: ARCHIVO, fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em", color: CREAM, margin: "0 0 0.3rem" }}>
              Not sure where to start?
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", lineHeight: 1.7, color: CREAM_DIM, margin: "0 0 0.3rem" }}>
              A 60-minute call where I read your brand and tell you exactly what I see.
            </p>
            <p style={{ fontFamily: FONT_SANS, fontSize: "0.78rem", fontStyle: "italic", color: GOLD_HEX, margin: "0 0 1.1rem", opacity: 0.85 }}>
              The $500 credits toward any build package.
            </p>
            <button
              onClick={() => openConsult("")}
              style={{
                background: "none",
                border: "1px solid rgba(184,144,46,0.5)",
                padding: "0.7rem 1.25rem",
                cursor: "pointer",
                fontFamily: FONT_SANS,
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: GOLD_HEX,
                transition: "border-color 0.25s ease, color 0.25s ease",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_HEX; e.currentTarget.style.color = CREAM; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.5)"; e.currentTarget.style.color = GOLD_HEX; }}
            >
              Book a first call &middot; $500 &#8594;
            </button>
          </div>
        </motion.div>

        <DiyAuditModal open={auditModalOpen} onClose={() => setAuditModalOpen(false)} />
        <ConsultCallModal
          open={consultSource !== null}
          onClose={() => setConsultSource(null)}
          sourceTier={consultSource || undefined}
        />
      </div>
    </section>
  );
}

// ── 9. WHY AVANA ──────────────────────────────────────────────────────────────

const MOAT = [
  {
    title: "A fashion operator, not an AI consultant who found fashion",
    body: "Sixteen years knowing what sells, what a buyer does after market, what a real margin floor is. That judgment is the configuration layer no tool gives you, and no competitor can fake.",
  },
  {
    title: "$15M+ sold, and counting",
    body: "Built by someone who has carried the number, not theorized about it.",
  },
  {
    title: "Built for real use, on real brands",
    body: "These are the tools I need and use, running on real stores with real orders, while competitors are still posting about it.",
  },
  {
    title: "Relationships as distribution",
    body: "A warm network of founder-led brands — the one advantage a better-funded competitor can't buy quickly.",
  },
  {
    title: "You own it",
    body: "Your wholesale platform and operating system are built for you and owned outright. Not rented, not another subscription you're trapped in. The asset stays yours.",
  },
];

function WhyAvanaSection() {
  return (
    <section
      style={{ background: "linear-gradient(160deg, #3D2900 0%, #7A5500 18%, #C9A84C 38%, #F0D070 52%, #C9A84C 66%, #7A5500 84%, #3D2900 100%)", position: "relative" }}
      className="px-[clamp(1.5rem,5vw,4rem)] pt-[clamp(10rem,22vh,14rem)] pb-[clamp(12rem,26vh,18rem)]"
    >
      {/* Top fade — dissolves into the dark section above */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10"
        style={{ height: "18vh", background: "linear-gradient(to bottom, #0A0A0A 0%, rgba(10,10,10,0) 100%)" }}
      />
      {/* Bottom fade — dissolves into the dark section below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
        style={{ height: "22vh", background: "linear-gradient(to bottom, rgba(10,10,10,0) 0%, #0A0A0A 100%)" }}
      />
      <div className={`${SECTION_MAX} mx-auto`} style={{ position: "relative", zIndex: 20 }}>
        <motion.p style={{ ...EYEBROW, color: "rgba(255,255,255,0.7)" }} {...up(0)}>Why AVANA</motion.p>

        <WordLift
          text="Built by an operator."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: "#0A0A0F",
            margin: 0,
            maxWidth: "none",
          }}
        />
        <WordLift
          text="Not a tech shop."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: "#0A0A0F",
            margin: "0 0 2.4rem",
            maxWidth: "none",
          }}
        />

        <motion.blockquote
          style={{ borderLeft: "2px solid rgba(255,255,255,0.45)", paddingLeft: "1.6rem", margin: "0 0 1.8rem" }}
          {...up(0.1)}
        >
          <p
            style={{
              fontFamily: FONT_SANS,
              fontWeight: 400,
              fontSize: "clamp(1.05rem, 1.6vw, 1.18rem)",
              lineHeight: 1.7,
              color: "rgba(10,10,15,0.78)",
              margin: 0,
              maxWidth: "46em",
            }}
          >
            16 years in luxury resortwear. $15M+ sold.<br />Building the tools I actually use to run my showroom and my own B2B brands.
          </p>
        </motion.blockquote>

        <div style={{ height: 1, background: "rgba(255,255,255,0.35)", marginLeft: "calc(2px + 1.6rem)", marginBottom: "2.5rem" }} />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {MOAT.map((m, i) => (
            <motion.div
              key={m.title}
              style={{ borderLeft: "1px solid rgba(10,10,15,0.25)", paddingLeft: "2rem" }}
              {...up(0.08 * i)}
            >
              <p
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#0A0A0F",
                  margin: "0 0 0.75rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {m.title}
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(10,10,15,0.72)", margin: 0 }}>
                {m.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 10. FINAL CTA ─────────────────────────────────────────────────────────────

function FinalCtaSection() {
  return (
    <section
      className="px-[clamp(1.5rem,5vw,4rem)] py-12 md:py-16"
      style={{ borderTop: "1px solid rgba(184,144,46,0.12)" }}
    >
      <div className="mx-auto max-w-[1140px]" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <WordLift
          text="Let's build it."
          style={{
            fontFamily: ARCHIVO,
            fontWeight: 800,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.12,
            color: CREAM,
            margin: "0 0 1.25rem",
            textAlign: "center",
          }}
        />

        <motion.p
          style={{
            fontFamily: FONT_SANS,
            fontSize: "clamp(0.95rem, 1.2vw, 1.05rem)",
            lineHeight: 1.8,
            color: CREAM_DIM,
            maxWidth: "34em",
            margin: "0 0 2.5rem",
            textAlign: "center",
          }}
          {...up(0.07)}
        >
          You&rsquo;ve seen the math, your new executive team,<br />and the price. If it&rsquo;s a fit, let&rsquo;s get the contract signed and start building.
        </motion.p>

        <motion.div {...up(0.14)}>
          <a
            href="mailto:amanda@avanashowroom.com?subject=AI%20by%20AVANA%20enquiry"
            style={{ ...GOLD_FILL_BTN, minHeight: 44 }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundPosition = "100% 50%")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundPosition = "0% 50%")}
          >
            Start the build &rarr;
          </a>
        </motion.div>
      </div>
    </section>
  );
}
