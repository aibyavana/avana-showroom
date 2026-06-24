import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { motion } from "framer-motion";
import { FilmGrain } from "@/components/FilmGrain";
import { CustomCursor } from "@/components/CustomCursor";
import { TopNav } from "@/components/TopNav";
import { Reveal } from "@/components/Reveal";
import { GOLD, WARM_GREY, CANVAS, FOREGROUND, FONT_SANS } from "@/lib/tokens";
import { EASE_SULTRY, DUR_SLOW } from "@/lib/motion";

// ── Constants ─────────────────────────────────────────────────────────────────

const ARCHIVO = "'Archivo', Arial, Helvetica, sans-serif";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #6B4F18 0%, #B8902E 30%, #E8C36A 50%, #D4AF37 70%, #8C6D1F 100%)";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")";

const EYEBROW: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: "0.7rem",
  letterSpacing: "0.38em",
  textTransform: "uppercase",
  color: GOLD,
};

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/meet-the-founder")({
  head: () => ({
    meta: [
      { title: "Meet the Founder — Amanda Vanas | AVANA" },
      {
        name: "description",
        content:
          "Sixteen years across New York PR, celebrity representation, and luxury fashion. Amanda Vanas, founder of AVANA Showroom, on building where relationships meet intelligent systems.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://avanashowroom.com/meet-the-founder" },
      { property: "og:title", content: "Meet the Founder — Amanda Vanas | AVANA" },
      { property: "og:description", content: "Sixteen years across New York PR, celebrity representation, and luxury fashion. Building where relationships meet intelligent systems." },
      { property: "og:image", content: "https://avanashowroom.com/amanda-founder.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Meet the Founder — Amanda Vanas | AVANA" },
      { name: "twitter:description", content: "Sixteen years across New York PR, celebrity representation, and luxury fashion." },
      { name: "twitter:image", content: "https://avanashowroom.com/amanda-founder.png" },
    ],
    links: [{ rel: "canonical", href: "https://avanashowroom.com/meet-the-founder" }],
  }),
  component: MeetTheFounderPage,
});

// ── Gold highlight span ───────────────────────────────────────────────────────

function G({ children }: { children: React.ReactNode }) {
  return <span style={{ color: GOLD, fontWeight: 700 }}>{children}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PERSON_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Amanda Vanas",
  "jobTitle": "Founder & CEO",
  "worksFor": {
    "@type": "Organization",
    "name": "AVANA Showroom",
    "url": "https://avanashowroom.com"
  },
  "url": "https://avanashowroom.com/meet-the-founder",
  "image": "https://avanashowroom.com/amanda-founder.png",
  "description": "Sixteen years across New York PR, celebrity representation, and luxury fashion. Founder of AVANA Showroom and AI by AVANA.",
  "email": "amanda@avanashowroom.com",
  "sameAs": ["https://www.thetechoffashion.com/"]
});

function MeetTheFounderPage() {
  return (
    <div
      className="relative min-h-screen"
      style={{ backgroundColor: CANVAS, paddingTop: "108px" }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: PERSON_SCHEMA }} />
      <FilmGrain />
      <CustomCursor />
      <TopNav showAtEnds background="color-mix(in oklab, #DDDBD7 85%, transparent)" />
      <main>
        {/* Unified bleed zone — portrait sits behind hero + first chapter */}
        <div className="relative">

          {/* Portrait bleed — desktop only, absolutely positioned right */}
          <div
            aria-hidden
            className="hidden md:block pointer-events-none"
            style={{
              position: "absolute",
              right: 0,
              top: "-7rem",
              width: "46%",
              height: "1040px",
              zIndex: 0,
              overflow: "hidden",
            }}
          >
            <motion.img
              src="/amanda-founder.png"
              alt=""
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: DUR_SLOW * 1.2, ease: EASE_SULTRY, delay: 0.15 }}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
              }}
            />
            {/* Left-edge fade — blends image into the content behind it */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "260px",
                background: `linear-gradient(to right, ${CANVAS} 0%, ${CANVAS} 20%, rgba(247,244,239,0.6) 60%, transparent 100%)`,
                pointerEvents: "none",
              }}
            />
            {/* Bottom fade — dissolves into canvas */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "45%",
                background: `linear-gradient(to bottom, transparent 0%, rgba(247,244,239,0.6) 55%, ${CANVAS} 100%)`,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Content — sits on top of the portrait */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <HeroSection />
            <ChaptersSection />
          </div>
        </div>
      </main>
    </div>
  );
}

// ── 1. HERO ───────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative w-full" style={{ backgroundColor: "transparent" }}>
      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      {/* ── Desktop: left-side text only (portrait is in parent bleed) ── */}
      <div className="hidden md:block relative w-full">
        <div className="px-16" style={{ paddingTop: "2.5rem", paddingBottom: "2.5rem", maxWidth: "52%" }}>
          <Reveal delay={0.05}>
            <p style={{ ...EYEBROW, marginBottom: "1rem" }}>Meet the Founder</p>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 800,
                fontSize: "clamp(1.7rem, 3.9vw, 3.25rem)",
                letterSpacing: "-0.025em",
                lineHeight: 1.0,
                color: FOREGROUND,
                margin: "0 0 0.4rem",
              }}
            >
              Amanda Vanas
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.7rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#A8A29A",
                margin: "0 0 1.1rem",
              }}
            >
              Founder &amp; CEO
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "clamp(0.8rem, 0.95vw, 0.88rem)",
                lineHeight: 1.85,
                color: WARM_GREY,
                maxWidth: "34em",
              }}
            >
              Sixteen years across New York PR, celebrity representation, and luxury fashion.
              Now building where relationships meet intelligent systems.
            </p>
          </Reveal>
        </div>
      </div>

      {/* ── Mobile: portrait + text stacked ── */}
      <div className="md:hidden relative w-full flex flex-col">
        <div className="relative w-full">
          <motion.img
            src="/amanda-founder.png"
            alt="Amanda Vanas, founder of AVANA"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR_SLOW, ease: EASE_SULTRY, delay: 0.1 }}
            style={{ display: "block", width: "100%", height: "auto" }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: `linear-gradient(to bottom, transparent, ${CANVAS})`,
              pointerEvents: "none",
            }}
          />
        </div>

        <div className="px-8 pt-6 pb-10">
          <Reveal delay={0.05}>
            <p style={{ ...EYEBROW, marginBottom: "1rem" }}>Meet the Founder</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 800,
                fontSize: "clamp(2.2rem, 9vw, 3.2rem)",
                letterSpacing: "-0.025em",
                lineHeight: 1.0,
                color: FOREGROUND,
                margin: "0 0 0.5rem",
              }}
            >
              Amanda Vanas
            </h1>
          </Reveal>
          <Reveal delay={0.14}>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.7rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#A8A29A",
                margin: "0 0 1.25rem",
              }}
            >
              Founder &amp; CEO
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.95rem",
                lineHeight: 1.85,
                color: WARM_GREY,
              }}
            >
              Sixteen years across New York PR, celebrity representation, and luxury fashion.
              Now building where relationships meet intelligent systems.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── 2. CHAPTERS ───────────────────────────────────────────────────────────────

const PROSE: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontSize: "1rem",
  lineHeight: 1.95,
  color: WARM_GREY,
  maxWidth: "38em",
  margin: 0,
};

const HAIRLINE = "1px solid rgba(184,144,46,0.18)";

function ChapterMarker({ n, title }: { n: string; title: string }) {
  return (
    <div
      className="hidden md:flex"
      style={{
        flexDirection: "column",
        alignItems: "flex-start",
        paddingTop: "2.5rem",
        paddingRight: "3rem",
        position: "sticky",
        top: "7rem",
        alignSelf: "flex-start",
      }}
    >
      <span
        style={{
          fontFamily: ARCHIVO,
          fontWeight: 800,
          fontSize: "clamp(2rem, 3.5vw, 3rem)",
          lineHeight: 1,
          color: GOLD,
          display: "block",
          marginBottom: "0.5rem",
        }}
      >
        {n}
      </span>
      <div
        aria-hidden
        style={{ width: 1, height: 40, background: "rgba(10,10,10,0.15)", margin: "0 0 0.5rem" }}
      />
      <span
        style={{
          fontFamily: FONT_SANS,
          fontSize: "0.6rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#A8A29A",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function MobileMarker({ n, title }: { n: string; title: string }) {
  return (
    <div className="md:hidden flex items-center gap-3" style={{ marginBottom: "1rem" }}>
      <span
        style={{
          fontFamily: ARCHIVO,
          fontWeight: 800,
          fontSize: "1.6rem",
          lineHeight: 1,
          color: GOLD,
        }}
      >
        {n}
      </span>
      <div aria-hidden style={{ width: 20, height: 1, background: "rgba(10,10,10,0.15)" }} />
      <span
        style={{
          fontFamily: FONT_SANS,
          fontSize: "0.6rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#A8A29A",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function StatBand() {
  return (
    <div style={{ borderTop: HAIRLINE, padding: "3rem 0", textAlign: "center" }}>
      <p
        style={{
          fontFamily: ARCHIVO,
          fontWeight: 800,
          fontSize: "clamp(2.4rem, 6vw, 4.4rem)",
          letterSpacing: "-0.025em",
          lineHeight: 1.1,
          margin: "0 0 0.5rem",
        }}
      >
        <span
          style={{
            background: GOLD_GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          $15M+
        </span>{" "}
        <span style={{ color: FOREGROUND }}>in wholesale revenue</span>
      </p>
      <p
        style={{
          fontFamily: FONT_SANS,
          fontSize: "0.62rem",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#A8A29A",
          margin: 0,
        }}
      >
        and counting
      </p>
    </div>
  );
}

function ChaptersSection() {
  return (
    <section className="relative w-full" style={{ backgroundColor: "transparent" }}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="relative mx-auto max-w-[1140px] px-8 py-8 md:px-16 md:py-12">

        {/* ── Chapter 01 ── */}
        <div style={{ borderTop: HAIRLINE }}>
          <Reveal delay={0}>
            <div className="md:grid" style={{ gridTemplateColumns: "0.5fr 2fr" }}>
              <ChapterMarker n="01" title="New York" />
              <div style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
                <MobileMarker n="01" title="New York" />
                <h2
                  style={{
                    fontFamily: ARCHIVO,
                    fontWeight: 800,
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                    letterSpacing: "-0.01em",
                    color: FOREGROUND,
                    margin: "0 0 1.25rem",
                  }}
                >
                  New York
                </h2>
                <p style={PROSE}>
                  I began my career in New York City, cutting my teeth in public relations alongside industry
                  powerhouses like <G>Kelly Cutrone</G> at <G>People's Revolution</G>, and working with iconic
                  designers including <G>Kim Newport-Mimran</G> of Pink Tartan and <G>Joe Mimran</G>, the
                  visionary behind Club Monaco and Joe Fresh. That foundation shaped my understanding of brand,
                  influence, and how visibility drives commercial success.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Chapter 02 ── */}
        <div style={{ borderTop: HAIRLINE }}>
          <Reveal delay={0.05}>
            <div className="md:grid" style={{ gridTemplateColumns: "0.5fr 2fr" }}>
              <ChapterMarker n="02" title="The Stage" />
              <div style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
                <MobileMarker n="02" title="The Stage" />
                <h2
                  style={{
                    fontFamily: ARCHIVO,
                    fontWeight: 800,
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                    letterSpacing: "-0.01em",
                    color: FOREGROUND,
                    margin: "0 0 1.25rem",
                  }}
                >
                  The Stage
                </h2>
                <p style={PROSE}>
                  My career then took me into celebrity PR in Vancouver, where I represented a global roster
                  of talent including internationally renowned musicians such as <G>Tiësto</G>, <G>Kaskade</G>,
                  and <G>Diplo</G>, as well as actors from cult-status series like <G>Game of Thrones</G> and
                  iconic franchises such as <G>Star Wars</G>. That experience sharpened my instinct for cultural
                  relevance, strategic positioning, and the power of storytelling at scale.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Pull-stat band ── */}
        <Reveal delay={0.08}>
          <StatBand />
        </Reveal>

        {/* ── Chapter 03 ── */}
        <div style={{ borderTop: HAIRLINE }}>
          <Reveal delay={0.05}>
            <div className="md:grid" style={{ gridTemplateColumns: "0.5fr 2fr" }}>
              <ChapterMarker n="03" title="Fashion, the true calling" />
              <div style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
                <MobileMarker n="03" title="Fashion, the true calling" />
                <h2
                  style={{
                    fontFamily: ARCHIVO,
                    fontWeight: 800,
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                    letterSpacing: "-0.01em",
                    color: FOREGROUND,
                    margin: "0 0 1.25rem",
                  }}
                >
                  Fashion, the true calling
                </h2>
                <p style={PROSE}>
                  Fashion, however, was always my true calling. I returned to the industry to serve as
                  Director at <G>Anna Kosturova</G>, a leader in luxury swimwear, before founding{" "}
                  <G>AVANA Showroom</G>. What began as a high-touch, globally curated fashion agency has since
                  generated over $15 million in wholesale revenue, working with leading retailers while
                  supporting designers across sales, production, market positioning, and creative direction.
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ── Chapter 04 ── */}
        <div style={{ borderTop: HAIRLINE }}>
          <Reveal delay={0.05}>
            <div className="md:grid" style={{ gridTemplateColumns: "0.5fr 2fr" }}>
              <ChapterMarker n="04" title="What's next" />
              <div style={{ paddingTop: "2.5rem", paddingBottom: "3rem" }}>
                <MobileMarker n="04" title="What's next" />
                <h2
                  style={{
                    fontFamily: ARCHIVO,
                    fontWeight: 800,
                    fontSize: "clamp(1rem, 1.5vw, 1.25rem)",
                    letterSpacing: "-0.01em",
                    color: FOREGROUND,
                    margin: "0 0 1.25rem",
                  }}
                >
                  What's next
                </h2>
                <p style={{ ...PROSE, marginBottom: "1.5rem" }}>
                  Today, I'm evolving AVANA Showroom into an <G>AI-led wholesale agency</G>. I'm focused
                  on modernizing how brands scale by combining deep industry relationships with intelligent
                  systems that improve buyer targeting, streamline outreach, and bring clarity to a
                  traditionally opaque process. This isn't about replacing the human side of fashion,
                  it's about enhancing it with smarter infrastructure.
                </p>
                <p style={PROSE}>
                  My work sits at the intersection of{" "}
                  <G>wholesale strategy, celebrity and fashion PR, and emerging technology</G>. I believe
                  the future of fashion belongs to brands that are both creatively strong and operationally
                  intelligent, and I'm building the systems to support that evolution.
                </p>
                <p style={{ ...PROSE, marginTop: "1.5rem" }}>
                  I also write about where fashion and technology collide at{" "}
                  <a
                    href="https://www.thetechoffashion.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: GOLD,
                      fontWeight: 700,
                      textDecoration: "none",
                      borderBottom: `1px solid ${GOLD}`,
                      paddingBottom: "1px",
                    }}
                  >
                    The Tech of Fashion
                  </a>
                  .
                </p>
              </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  );
}
