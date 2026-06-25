import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { FilmGrain } from "@/components/FilmGrain";
import { CustomCursor } from "@/components/CustomCursor";
import { TopNav } from "@/components/TopNav";
import { Reveal } from "@/components/Reveal";
import { AvanaLogo } from "@/components/AvanaLogo";
import { ConsultingCallModal } from "@/components/ConsultingCallModal";
import { GOLD, WARM_GREY, CANVAS, FOREGROUND, FONT_SANS } from "@/lib/tokens";
import { EASE_SULTRY, DUR_SLOW } from "@/lib/motion";
import { notifyLead, notifHtml, row, confirmSubmitter, consultingConfirmationEmail } from "@/lib/notify";

// ── Constants ────────────────────────────────────────────────────────────────

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

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_SANS,
  fontSize: "0.62rem",
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color: GOLD,
  marginBottom: "6px",
};

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid rgba(74,69,64,0.2)",
  padding: "14px 0",
  fontFamily: FONT_SANS,
  fontSize: "1rem",
  color: WARM_GREY,
  outline: "none",
  borderRadius: 0,
};

// ── Data ─────────────────────────────────────────────────────────────────────

const OFFERINGS: Array<{
  n: string;
  title: string;
  body: string;
  linkTo?: string;
  linkLabel?: string;
}> = [
  {
    n: "01",
    title: "Wholesale Strategy",
    body: "Getting your brand into the right rooms. Buyer relationships, showroom strategy, order minimums, and the positioning that makes the pitch before you speak. Built on sixteen years of knowing what buyers actually want, and what makes them say no.",
  },
  {
    n: "02",
    title: "DTC & Ecommerce Sales",
    body: "The full channel, built right. Pricing architecture, DTC margin, customer acquisition, and the conversion gaps most brands stop too early to find. The difference between a store that looks good and one that sells.",
  },
  {
    n: "03",
    title: "Collection Design & Direction",
    body: "Product that earns its price. Range architecture, seasonal planning, and the commercial instinct behind what actually sells versus what just photographs well. Direction grounded in what the market is asking for, not what trends say it should want.",
  },
  {
    n: "04",
    title: "Photography & Art Direction",
    body: "Campaign assets that open doors. Art direction, casting, and production for imagery that moves buyers and converts online, not just in the lookbook. Visual strategy built around where the images actually need to work.",
  },
  {
    n: "05",
    title: "Shopify & Store Strategy",
    body: "The store as a sales tool. Catalog health, AI-readiness, conversion architecture, and the fixes that make a real difference to a buyer reviewing your site. Most brands don't know what their store is costing them.",
  },
  {
    n: "06",
    title: "AI Strategy",
    body: "The AI layer your brand doesn't know it needs yet. From AI executives to full workflow automation. If you're ready to build the system, the full picture is at AI by AVANA.",
    linkTo: "/ai-by-avana",
    linkLabel: "See AI by AVANA",
  },
];

const AREAS = [
  "Wholesale Strategy",
  "DTC & Ecommerce",
  "Collection Direction",
  "Photography & Art Direction",
  "Shopify & Store Strategy",
  "AI Strategy",
  "AI Implementation Program",
  "White-Glove Creative",
];

// ── Zod schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(120),
  last_name: z.string().trim().min(1, "Last name is required").max(120),
  whatsapp: z
    .string()
    .trim()
    .regex(
      /^\+[0-9][0-9\s\-().]{5,28}$/,
      "Include your country code, e.g. +44 7700 900000"
    ),
  email: z.string().trim().email("Enter a valid email address").max(254),
  brand_name: z.string().trim().min(1, "Brand name is required").max(200),
  website: z.string().trim().min(1, "Website or Instagram is required").max(500),
  message: z.string().trim().max(2000).optional(),
});

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/consulting")({
  head: () => ({
    meta: [
      { title: "Consulting — AVANA Showroom" },
      {
        name: "description",
        content:
          "Hands-on consulting for fashion brands serious about scaling. Wholesale, DTC, collection direction, photography, Shopify, and AI strategy from sixteen years inside the industry.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://avanashowroom.com/consulting" },
      { property: "og:title", content: "Consulting — AVANA Showroom" },
      { property: "og:description", content: "Hands-on consulting for fashion brands serious about scaling. Wholesale, DTC, Shopify, and AI strategy from sixteen years inside the industry." },
      { property: "og:image", content: "https://avanashowroom.com/consulting-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Consulting — AVANA Showroom" },
      { name: "twitter:description", content: "Hands-on consulting for fashion brands serious about scaling." },
      { name: "twitter:image", content: "https://avanashowroom.com/consulting-image.png" },
    ],
    links: [{ rel: "canonical", href: "https://avanashowroom.com/consulting" }],
  }),
  component: ConsultingPage,
});

// ── Page ──────────────────────────────────────────────────────────────────────

function ConsultingPage() {
  const formRef = React.useRef<HTMLElement>(null);
  const [consultOpen, setConsultOpen] = useState(false);

  const openConsult = (e: React.MouseEvent) => {
    e.preventDefault();
    setConsultOpen(true);
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: CANVAS, paddingTop: "108px" }}>
      <FilmGrain />
      <CustomCursor />
      <TopNav showAtEnds background="color-mix(in oklab, #DDDBD7 85%, transparent)" />
      <main>
        <HeroSection onBook={openConsult} />
        <div
          aria-hidden
          style={{
            position: "relative",
            zIndex: 10,
            height: 160,
            marginTop: -80,
            marginBottom: -80,
            background: "linear-gradient(to bottom, transparent 0%, rgba(184,144,46,0.12) 40%, rgba(184,144,46,0.16) 50%, rgba(184,144,46,0.12) 60%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <OfferingsSection />
        <div
          aria-hidden
          style={{
            position: "relative",
            zIndex: 10,
            height: 160,
            marginTop: -80,
            marginBottom: -80,
            background: "linear-gradient(to bottom, transparent 0%, rgba(184,144,46,0.12) 40%, rgba(184,144,46,0.16) 50%, rgba(184,144,46,0.12) 60%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <AIProgramSection onBook={openConsult} />
        <div
          aria-hidden
          style={{
            position: "relative",
            zIndex: 10,
            height: 160,
            marginTop: -80,
            marginBottom: -80,
            background: "linear-gradient(to bottom, transparent 0%, rgba(184,144,46,0.12) 40%, rgba(184,144,46,0.16) 50%, rgba(184,144,46,0.12) 60%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
        <WhiteGloveSection onBook={openConsult} />
        <RepresentationBand />
        <IntakeFormSection ref={formRef} />
      </main>
      <ConsultingCallModal open={consultOpen} onClose={() => setConsultOpen(false)} />
    </div>
  );
}

// ── 1. HERO ───────────────────────────────────────────────────────────────────

function HeroSection({ onBook }: { onBook: (e: React.MouseEvent) => void }) {
  const h1Ref = React.useRef<HTMLHeadingElement>(null);
  const [paraMaxW, setParaMaxW] = React.useState<string>("33rem");

  React.useEffect(() => {
    const measure = () => {
      if (h1Ref.current) setParaMaxW(`${h1Ref.current.offsetWidth}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: CANVAS,
        borderBottom: "1px solid rgba(184,144,46,0.15)",
      }}
    >
      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      {/* sr-only h1: single crawlable/accessible heading at all viewports */}
      <h1 className="sr-only">Consulting with Amanda Van As: wholesale, ecommerce and AI strategy</h1>

      {/* ── Desktop: two-column grid ── */}
      <div
        className="hidden md:grid relative w-full"
        style={{
          gridTemplateColumns: "1.1fr 0.9fr",
          alignItems: "center",
        }}
      >
        {/* Left column */}
        <div
          className="relative flex items-center px-16"
          style={{ paddingTop: "4rem", paddingBottom: "4rem" }}
        >
          {/* Section marker: 01 / tick / THE FOUNDER */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginRight: "2.5rem",
              flexShrink: 0,
            }}
          >
            <Reveal delay={0.05}>
              <span
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "clamp(2.4rem,5vw,3.6rem)",
                  lineHeight: 1,
                  color: GOLD,
                  display: "block",
                }}
              >
                01
              </span>
            </Reveal>

            <Reveal delay={0.1}>
              <div
                aria-hidden
                style={{
                  width: 1,
                  height: 54,
                  background: `rgba(10,10,10,0.18)`,
                  margin: "10px 0",
                }}
              />
            </Reveal>

            <Reveal delay={0.13}>
              <span
                aria-hidden
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.58rem",
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: "#A8A29A",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  display: "block",
                  userSelect: "none",
                }}
              >
                The Founder
              </span>
            </Reveal>
          </div>

          {/* Copy block */}
          <div style={{ flex: 1 }}>
            <Reveal delay={0.08}>
              <h2
                ref={h1Ref}
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "clamp(1.8rem,4vw,2.8rem)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.0,
                  color: FOREGROUND,
                  margin: "0 0 1rem",
                  whiteSpace: "nowrap",
                }}
              >
                Are you ready to work!
              </h2>
            </Reveal>

            {/* Gold rule */}
            <Reveal delay={0.14}>
              <div
                aria-hidden
                style={{
                  width: 62,
                  height: 2,
                  background: GOLD,
                  margin: "0 0 1.75rem",
                }}
              />
            </Reveal>

            <Reveal delay={0.2}>
              <div style={{ maxWidth: paraMaxW }}>
                <p style={{ fontFamily: FONT_SANS, fontSize: "1.05rem", lineHeight: 1.9, color: WARM_GREY, margin: "0 0 1rem" }}>
                  I take on two clients a quarter. That's it.<br />Two brands get my full attention, not a slice of it split across a roster.
                </p>
                <p style={{ fontFamily: FONT_SANS, fontSize: "1.05rem", lineHeight: 1.9, color: WARM_GREY, margin: "0 0 1rem" }}>
                  For those two, you get sixteen years of operating judgment and $15M in sales applied directly to your business: wholesale, DTC, collection audit and direction, Shopify, or wherever AI actually fits. Real strategy from someone who has carried the number, not theorized about it.
                </p>
                <p style={{ fontFamily: FONT_SANS, fontSize: "1.05rem", lineHeight: 1.9, color: WARM_GREY, margin: "0 0 2rem", maxWidth: "none" }}>
                  If you're building something serious and want that kind of focus, <strong>let's talk.</strong>
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <a
                href="#book"
                onClick={onBook}
                className="gold-link type-caption"
                style={{ color: GOLD }}
              >
                Book an intro call
              </a>
            </Reveal>
          </div>
        </div>

        {/* Right column — portrait, height driven by image */}
        <div className="relative" style={{ alignSelf: "stretch" }}>
          <motion.img
            src="/consulting-image.png"
            alt="Amanda, founder of AVANA"
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DUR_SLOW * 1.2, ease: EASE_SULTRY, delay: 0.18 }}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
          {/* Left-edge fade into canvas */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "100px",
              background: `linear-gradient(to right, ${CANVAS}, transparent)`,
              pointerEvents: "none",
            }}
          />

        </div>
      </div>

      {/* ── Mobile: stacked ── */}
      <div className="md:hidden relative w-full flex flex-col">
        {/* Portrait — full image, no crop */}
        <div className="relative w-full">
          <motion.img
            src="/consulting-image.png"
            alt="Amanda, founder of AVANA"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR_SLOW, ease: EASE_SULTRY, delay: 0.1 }}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
          {/* Bottom fade into canvas */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background: `linear-gradient(to bottom, transparent, ${CANVAS})`,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Copy block */}
        <div className="px-8 pt-6 pb-12">
          {/* Horizontal marker row */}
          <Reveal delay={0.05}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "1.8rem",
                  lineHeight: 1,
                  color: GOLD,
                }}
              >
                01
              </span>
              <div aria-hidden style={{ width: 24, height: 1, background: "rgba(10,10,10,0.18)" }} />
              <span
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.58rem",
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: "#A8A29A",
                }}
              >
                The Founder
              </span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 800,
                fontSize: "clamp(1.8rem,7vw,2.4rem)",
                letterSpacing: "-0.025em",
                lineHeight: 1.0,
                color: FOREGROUND,
                margin: "0 0 1rem",
              }}
            >
              Hello.
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <div
              aria-hidden
              style={{ width: 62, height: 2, background: GOLD, margin: "0 0 1.5rem" }}
            />
          </Reveal>

          <Reveal delay={0.2}>
            <div>
              <p style={{ fontFamily: FONT_SANS, fontSize: "1.05rem", lineHeight: 1.9, color: WARM_GREY, margin: "0 0 1rem" }}>
                I take on two clients a quarter. That's it.<br />Two brands get my full attention, not a slice of it split across a roster.
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: "1.05rem", lineHeight: 1.9, color: WARM_GREY, margin: "0 0 1rem" }}>
                For those two, you get sixteen years of operating judgment and $15M in sales applied directly to your business: wholesale, DTC, collection audit and direction, Shopify, or wherever AI actually fits. Real strategy from someone who has carried the number, not theorized about it.
              </p>
              <p style={{ fontFamily: FONT_SANS, fontSize: "1.05rem", lineHeight: 1.9, color: WARM_GREY, margin: "0 0 1.75rem", maxWidth: "none" }}>
                If you're building something serious and want that kind of focus,<br /><strong>let's talk.</strong>
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.26}>
            <a
              href="#book"
              onClick={onBook}
              className="gold-link type-caption"
              style={{ color: GOLD }}
            >
              Book an intro call
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ── 2. OFFERINGS ──────────────────────────────────────────────────────────────

function OfferingsSection() {
  return (
    <section
      className="relative w-full"
      style={{ backgroundColor: CANVAS }}
    >
      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="relative mx-auto max-w-[1140px] px-8 py-12 md:px-16 md:py-20">
        <Reveal delay={0}>
          <p style={EYEBROW} className="mb-10">
            What I Work On
          </p>
        </Reveal>

        <div>
          {OFFERINGS.map((o, i) => (
            <Reveal key={o.n} delay={0.07 * i}>
              <div
                style={{
                  borderTop: i === 0 ? "1px solid rgba(184,144,46,0.2)" : undefined,
                  borderBottom: "1px solid rgba(184,144,46,0.2)",
                  padding: "2rem 0",
                }}
              >
                {/* Desktop: 2-col */}
                <div className="hidden md:grid" style={{ gridTemplateColumns: "0.35fr 1fr", gap: "3rem", alignItems: "start" }}>
                  <div>
                    <span
                      style={{
                        fontFamily: ARCHIVO,
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        letterSpacing: "0.25em",
                        color: GOLD,
                        display: "block",
                        marginBottom: "0.6rem",
                      }}
                    >
                      {o.n}
                    </span>
                    <h2
                      style={{
                        fontFamily: ARCHIVO,
                        fontWeight: 800,
                        fontSize: "1.1rem",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.2,
                        color: FOREGROUND,
                        margin: 0,
                      }}
                    >
                      {o.title}
                    </h2>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: "0.975rem",
                        lineHeight: 1.85,
                        color: WARM_GREY,
                        margin: o.linkTo ? "0 0 0.75rem" : 0,
                      }}
                    >
                      {o.body}
                    </p>
                    {o.linkTo && o.linkLabel && (
                      <Link
                        to={o.linkTo as "/ai-by-avana"}
                        className="gold-link type-caption"
                        style={{ color: GOLD }}
                      >
                        {o.linkLabel}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Mobile: stacked */}
                <div className="md:hidden">
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        fontFamily: ARCHIVO,
                        fontWeight: 700,
                        fontSize: "0.65rem",
                        letterSpacing: "0.25em",
                        color: GOLD,
                      }}
                    >
                      {o.n}
                    </span>
                    <h2
                      style={{
                        fontFamily: ARCHIVO,
                        fontWeight: 800,
                        fontSize: "1rem",
                        letterSpacing: "-0.01em",
                        color: FOREGROUND,
                        margin: 0,
                      }}
                    >
                      {o.title}
                    </h2>
                  </div>
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "0.9rem",
                      lineHeight: 1.8,
                      color: WARM_GREY,
                      margin: o.linkTo ? "0 0 0.6rem" : 0,
                    }}
                  >
                    {o.body}
                  </p>
                  {o.linkTo && o.linkLabel && (
                    <Link
                      to={o.linkTo as "/ai-by-avana"}
                      className="gold-link type-caption"
                      style={{ color: GOLD }}
                    >
                      {o.linkLabel}
                    </Link>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 3. AI IMPLEMENTATION PROGRAM ─────────────────────────────────────────────

function AIProgramSection({ onBook }: { onBook: (e: React.MouseEvent) => void }) {
  const AI_BG = "#1C1813";
  const AI_HEAD = "#F7F4EF";
  const AI_BODY = "rgba(247,244,239,0.68)";
  const AI_MUTED = "rgba(247,244,239,0.42)";
  const AI_CANVAS = CANVAS;

  const pillStyle: React.CSSProperties = {
    display: "inline-block",
    fontFamily: FONT_SANS,
    fontSize: "0.6rem",
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: GOLD,
    border: "1px solid rgba(184,144,46,0.35)",
    padding: "5px 12px",
    marginBottom: "1.75rem",
  };

  const blockStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(184,144,46,0.18)",
    paddingTop: "1.5rem",
    marginTop: "1.5rem",
  };

  const blockLabelStyle: React.CSSProperties = {
    fontFamily: ARCHIVO,
    fontWeight: 700,
    fontSize: "0.72rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: AI_HEAD,
    marginBottom: "0.5rem",
  };

  const blockBodyStyle: React.CSSProperties = {
    fontFamily: FONT_SANS,
    fontSize: "0.92rem",
    lineHeight: 1.8,
    color: AI_BODY,
    margin: 0,
  };

  const CTAprimary: React.CSSProperties = {
    display: "inline-block",
    fontFamily: FONT_SANS,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
    color: FOREGROUND,
    background: GOLD,
    border: "none",
    padding: "14px 28px",
    cursor: "pointer",
    textDecoration: "none",
    transition: "background 0.25s ease",
  };

  const CTAsecondary: React.CSSProperties = {
    fontFamily: FONT_SANS,
    fontSize: "0.8rem",
    color: GOLD,
    textDecoration: "none",
    letterSpacing: "0.06em",
    borderBottom: "1px solid rgba(184,144,46,0.35)",
    paddingBottom: "2px",
    transition: "border-color 0.25s ease",
  };

  return (
    <section
      className="relative w-full"
      style={{ backgroundColor: AI_BG }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="relative mx-auto max-w-[1140px] px-8 py-12 md:px-16 md:py-20">
        <Reveal delay={0}>
          <span style={pillStyle}>A Structured Program</span>
        </Reveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
          {/* Left: headline + lead + CTAs */}
          <div>
            <Reveal delay={0.04}>
              <h2
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  color: AI_HEAD,
                  margin: "0 0 1.25rem",
                }}
              >
                Bring AI in-house.<br />With someone who has already done it.
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(0.9rem, 1.05vw, 1rem)",
                  lineHeight: 1.85,
                  color: AI_BODY,
                  margin: "0 0 2rem",
                }}
              >
                Not everyone wants their operation run for them.<br />Some founders and teams want the capability inside the building. This is a guided program that teaches you and your team to actually use AI in your business, paired with my oversight while you roll it out, so it sticks instead of stalling after the first week.
              </p>
            </Reveal>

            <Reveal delay={0.14}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.88rem",
                  fontStyle: "italic",
                  color: AI_BODY,
                  margin: "0 0 2rem",
                }}
              >
                Learn to run it yourself. Or, if you'd rather have a white glove experience, I'll run it for you.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.72rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: AI_MUTED,
                  margin: "0 0 1.5rem",
                }}
              >
                Custom-scoped by team size and goals.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "flex-start" }}>
                <button
                  onClick={onBook}
                  style={CTAprimary}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E8C36A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = GOLD; }}
                >
                  Talk about a program →
                </button>
                <Link
                  to="/ai-by-avana"
                  style={CTAsecondary}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E8C36A"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(184,144,46,0.35)"; }}
                >
                  Or see the done-for-you system →
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right: three pillars */}
          <div>
            <Reveal delay={0.06}>
              <div style={blockStyle}>
                <p style={blockLabelStyle}>Train</p>
                <p style={blockBodyStyle}>
                  Practical, hands-on sessions for you or your team: where AI fits in a fashion brand, the workflows worth automating first, and how to actually operate the tools. Built around how fashion works, not generic prompts.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div style={blockStyle}>
                <p style={blockLabelStyle}>Implement</p>
                <p style={blockBodyStyle}>
                  We put it to work on your real store and your real data, not slideware. You build the first workflows with me, not after me.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <div style={blockStyle}>
                <p style={blockLabelStyle}>Oversee</p>
                <p style={blockBodyStyle}>
                  I stay on through the rollout. We review what is working, fix what is not, and make sure the team keeps using it after the energy of week one fades.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 4. WHITE-GLOVE CREATIVE (CAPSTONE) ───────────────────────────────────────

function WhiteGloveSection({ onBook }: { onBook: (e: React.MouseEvent) => void }) {
  const PANEL_BG = CANVAS;
  const CREAM_WG = FOREGROUND;
  const CREAM_DIM_WG = WARM_GREY;
  const CREAM_MUTED_WG = "rgba(74,69,64,0.5)";

  const markerStyle: React.CSSProperties = {
    fontFamily: FONT_SANS,
    fontSize: "0.6rem",
    letterSpacing: "0.38em",
    textTransform: "uppercase",
    color: GOLD,
    marginBottom: "1.75rem",
  };

  const blockStyle: React.CSSProperties = {
    borderTop: "1px solid rgba(184,144,46,0.2)",
    paddingTop: "1.4rem",
    marginTop: "1.4rem",
  };

  const blockLabelStyle: React.CSSProperties = {
    fontFamily: ARCHIVO,
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: GOLD,
    marginBottom: "0.45rem",
  };

  const blockBodyStyle: React.CSSProperties = {
    fontFamily: FONT_SANS,
    fontSize: "0.92rem",
    lineHeight: 1.8,
    color: CREAM_DIM_WG,
    margin: 0,
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: PANEL_BG }}
    >
      {/* Grain on light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Top gold rule */}
      <div
        aria-hidden
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(184,144,46,0.55) 30%, rgba(232,195,106,0.7) 50%, rgba(184,144,46,0.55) 70%, transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[1140px] px-8 py-14 md:px-16 md:py-24">
        <Reveal delay={0}>
          <p style={markerStyle}>White-Glove Creative</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-20">
          {/* Left: headline + lead + closing + CTA */}
          <div>
            <Reveal delay={0.04}>
              <h2
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "clamp(1.6rem, 3vw, 2.7rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.08,
                  color: CREAM_WG,
                  margin: "0 0 1.5rem",
                }}
              >
                You bring the vision.<br />I bring sixteen years of making it real.
              </h2>
            </Reveal>

            <Reveal delay={0.09}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(0.9rem, 1.05vw, 1rem)",
                  lineHeight: 1.85,
                  color: CREAM_DIM_WG,
                  margin: "0 0 2rem",
                }}
              >
                The deepest way to work with me. For brands that want a collection built, not just advised on, and for creators with an audience who are ready to launch a line of their own. I design it, source it, and produce it with you, the same way I have moved $15M of product into the world's best retailers. Not a deck. Actual product, made to sell.
              </p>
            </Reveal>

            <Reveal delay={0.16}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.88rem",
                  fontStyle: "italic",
                  color: CREAM_DIM_WG,
                  margin: "0 0 0.6rem",
                }}
              >
                I only take a small number of these a year, by design.<br />This is the work I protect my calendar for.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.72rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: CREAM_MUTED_WG,
                  margin: "0 0 2rem",
                }}
              >
                Scoped per project. Selective by capacity.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <button
                onClick={onBook}
                style={{
                  display: "inline-block",
                  fontFamily: FONT_SANS,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: FOREGROUND,
                  background: GOLD,
                  border: "none",
                  padding: "15px 32px",
                  cursor: "pointer",
                  transition: "background 0.25s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#E8C36A"; }}
                onMouseLeave={e => { e.currentTarget.style.background = GOLD; }}
              >
                Start a conversation →
              </button>
            </Reveal>
          </div>

          {/* Right: three pillars */}
          <div>
            <Reveal delay={0.07}>
              <div style={{ ...blockStyle, marginTop: 0, borderTop: "none", paddingTop: 0 }}>
                <p style={blockLabelStyle}>For your brand</p>
                <p style={blockBodyStyle}>
                  A full collection designed and developed end to end: line plan, design, sourcing, sampling, production. The commercial eye that decides what gets made, not just what looks good.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.13}>
              <div style={blockStyle}>
                <p style={blockLabelStyle}>For creators</p>
                <p style={blockBodyStyle}>
                  You have the audience, I build the product. Your own line, designed and produced properly, positioned to sell to your people and to retailers, not merch.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.19}>
              <div style={blockStyle}>
                <p style={blockLabelStyle}>Private label</p>
                <p style={blockBodyStyle}>
                  Branded product made for you, under your name, to a standard that earns a place in luxury retail.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Bottom gold rule */}
      <div
        aria-hidden
        style={{
          height: 1,
          background: "linear-gradient(to right, transparent, rgba(184,144,46,0.55) 30%, rgba(232,195,106,0.7) 50%, rgba(184,144,46,0.55) 70%, transparent)",
        }}
      />
    </section>
  );
}

// ── 5. BRAND REPRESENTATION BAND ─────────────────────────────────────────────

function RepresentationBand() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: FOREGROUND }}
    >
      {/* Subtle grain on dark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="relative mx-auto max-w-[1140px] px-8 py-12 md:px-16 md:py-20">
        <div className="flex items-center justify-between gap-12">
          {/* Left: content */}
          <div style={{ flex: 1 }}>
            <Reveal delay={0}>
              <p
                style={{
                  ...EYEBROW,
                  color: "rgba(184,144,46,0.85)",
                  marginBottom: "1.5rem",
                }}
              >
                Beyond Consulting
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h2
                style={{
                  fontFamily: ARCHIVO,
                  fontWeight: 800,
                  fontSize: "clamp(1.4rem, 2.5vw, 2.4rem)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  color: "#F7F4EF",
                  margin: "0 0 1.25rem",
                }}
              >
                Brand Representation
              </h2>
            </Reveal>

            <Reveal delay={0.15}>
              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "clamp(0.9rem, 1.1vw, 1rem)",
                  lineHeight: 1.85,
                  color: "rgba(247,244,239,0.72)",
                  maxWidth: "66ch",
                  margin: "0 0 2rem",
                }}
              >
                We represent a curated portfolio of resortwear brands in wholesale
                markets worldwide. If your brand is the right fit for the AVANA Showroom,
                placement in our portfolio means access to our buyer network, our campaign
                library, and the marketing that goes to work for every stockist we sign.
              </p>
            </Reveal>

            <Reveal delay={0.22}>
              <a
                href="/become-a-retailer"
                className="gold-link type-caption"
                style={{ color: GOLD }}
              >
                Apply for representation
              </a>
            </Reveal>
          </div>

          {/* Right: AVANA logo */}
          <div className="hidden md:flex items-center justify-center" style={{ flexShrink: 0 }}>
            <Reveal delay={0.18}>
              <AvanaLogo style={{ width: 286, opacity: 0.85 }} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 4. INTAKE FORM ────────────────────────────────────────────────────────────

const IntakeFormSection = React.forwardRef<HTMLElement>((_, ref) => {
  const [values, setValues] = useState<Record<string, string>>({
    first_name: "",
    last_name: "",
    whatsapp: "",
    email: "",
    brand_name: "",
    website: "",
    message: "",
  });
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const toggleArea = (area: string) =>
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );

  const inputStyle = (field: string): React.CSSProperties => ({
    ...INPUT_BASE,
    borderBottomColor: focusedField === field ? GOLD : "rgba(74,69,64,0.2)",
    transition: "border-color 0.3s ease",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }

    setSubmitting(true);

    const { data } = parsed;
    const { error: dbError } = await supabase
      .from("consulting_intake")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        whatsapp: data.whatsapp,
        email: data.email,
        brand_name: data.brand_name,
        website: data.website,
        areas: selectedAreas.length > 0 ? selectedAreas.join(", ") : null,
        message: data.message || null,
      });

    setSubmitting(false);

    if (dbError) {
      // NOTE: no UNIQUE(email) on consulting_intake yet, so 23505 path is currently unreachable
      if (dbError.code === "23505") {
        setError("An intake from this email already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      try {
        await notifyLead({
          data: {
            subject: `Consulting intake FAILED — ${data.brand_name}`,
            html: notifHtml('Consulting Intake — Insert Failed', 'consulting', [
              row('Name', `${data.first_name} ${data.last_name}`),
              row('Brand', data.brand_name),
              row('Email', data.email),
              row('Error', dbError.message),
            ]),
          },
        })
      } catch { /* alert failure must never block */ }
      return;
    }

    try {
      await notifyLead({
        data: {
          subject: `New Consulting Intake — ${data.brand_name}`,
          html: notifHtml('New Consulting Intake', 'consulting', [
            row('Name', `${data.first_name} ${data.last_name}`),
            row('Brand', data.brand_name),
            row('Email', data.email),
            row('WhatsApp', data.whatsapp),
            row('Website', data.website || null),
            row('Focus Areas', selectedAreas.length > 0 ? selectedAreas.join(', ') : null),
            row('Message', data.message || null),
          ]),
        },
      })
    } catch (e) {
      console.error('[email] notify failed:', e)
    }

    try {
      const areas = selectedAreas.length > 0 ? selectedAreas.join(', ') : null
      const { html, text } = consultingConfirmationEmail(data.first_name, areas)
      await confirmSubmitter({
        data: { to: data.email, subject: 'I received your note', html, text },
      })
    } catch (e) {
      console.error('[email] consulting confirmation failed:', e)
    }

    setDone(true);

  };

  return (
    <section
      id="book"
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: CANVAS }}
    >
      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(184,144,46,0.3), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[900px] px-8 py-12 md:px-16 md:py-20">
        <Reveal delay={0}>
          <p style={EYEBROW} className="mb-4">
            By Application
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(1.4rem, 2.5vw, 2.4rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              color: FOREGROUND,
              margin: "0 0 0.75rem",
            }}
          >
            Book an intro call
          </h2>
        </Reveal>

        <Reveal delay={0.12}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: FONT_SANS,
                fontSize: "0.65rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: FOREGROUND,
                background: GOLD_GRADIENT,
                padding: "5px 12px",
                borderRadius: 0,
              }}
            >
              $500
            </span>
            <span
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.82rem",
                color: WARM_GREY,
              }}
            >
              credited in full toward your engagement
            </span>
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.9rem",
              lineHeight: 1.8,
              color: WARM_GREY,
              maxWidth: "none",
              margin: "0 0 2.5rem",
            }}
          >
            A 60-minute working session. I'll review your brand before we speak.<br />
            If we're aligned, we scope the engagement and the $500 applies.
          </p>
        </Reveal>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR_SLOW, ease: EASE_SULTRY }}
            className="py-16"
          >
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.62rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: GOLD,
                margin: "0 0 16px",
              }}
            >
              Intake received
            </p>
            <p
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 700,
                fontSize: "clamp(1.25rem, 2.2vw, 2.2rem)",
                letterSpacing: "-0.015em",
                color: FOREGROUND,
                margin: 0,
              }}
            >
              I'll be in touch.
            </p>
            <p
              className="mt-6"
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.95rem",
                lineHeight: 1.8,
                color: WARM_GREY,
                maxWidth: "44ch",
              }}
            >
              Every intake is reviewed personally. You'll hear from me directly
              on WhatsApp once I've had a look at your brand.
            </p>
          </motion.div>
        ) : (
          <Reveal delay={0.2}>
            <form onSubmit={handleSubmit} noValidate>
              {/* Row 1: First / Last name */}
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12">
                <FieldBlock
                  id="first_name"
                  label="First Name"
                  required
                  type="text"
                  autoComplete="given-name"
                  value={values.first_name}
                  onChange={update("first_name")}
                  onFocus={() => setFocusedField("first_name")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("first_name")}
                />
                <FieldBlock
                  id="last_name"
                  label="Last Name"
                  required
                  type="text"
                  autoComplete="family-name"
                  value={values.last_name}
                  onChange={update("last_name")}
                  onFocus={() => setFocusedField("last_name")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("last_name")}
                />
              </div>

              {/* Row 2: WhatsApp / Email */}
              <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12">
                <FieldBlock
                  id="whatsapp"
                  label="WhatsApp"
                  required
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 604 555 0123"
                  hint="Include country code"
                  value={values.whatsapp}
                  onChange={update("whatsapp")}
                  onFocus={() => setFocusedField("whatsapp")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("whatsapp")}
                />
                <FieldBlock
                  id="email"
                  label="Email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@yourbrand.com"
                  value={values.email}
                  onChange={update("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("email")}
                />
              </div>

              {/* Row 3: Brand Name / Website */}
              <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12">
                <FieldBlock
                  id="brand_name"
                  label="Brand Name"
                  required
                  type="text"
                  autoComplete="organization"
                  value={values.brand_name}
                  onChange={update("brand_name")}
                  onFocus={() => setFocusedField("brand_name")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("brand_name")}
                />
                <FieldBlock
                  id="website"
                  label="Website or Instagram"
                  type="url"
                  autoComplete="url"
                  placeholder="yourbrand.com or @yourbrand"
                  value={values.website}
                  onChange={update("website")}
                  onFocus={() => setFocusedField("website")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("website")}
                  required
                />
              </div>

              {/* Areas of interest */}
              <div className="mt-10">
                <span style={LABEL_STYLE}>Areas of interest</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {AREAS.map((area) => {
                    const active = selectedAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleArea(area)}
                        style={{
                          minHeight: 44,
                          padding: "8px 16px",
                          fontFamily: FONT_SANS,
                          fontSize: "0.72rem",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          border: active ? "1px solid " + GOLD : "1px solid rgba(74,69,64,0.25)",
                          background: active ? "rgba(184,144,46,0.08)" : "transparent",
                          color: active ? GOLD : WARM_GREY,
                          borderRadius: 0,
                          cursor: "pointer",
                          transition: "all 0.25s ease",
                        }}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="mt-10">
                <label htmlFor="message" style={LABEL_STYLE}>
                  Tell me about your brand and what you're trying to solve
                  <span style={{ opacity: 0.5, marginLeft: "0.5em", letterSpacing: "0.1em" }}>optional</span>
                </label>
                <textarea
                  id="message"
                  value={values.message}
                  onChange={update("message")}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  rows={4}
                  style={{
                    ...INPUT_BASE,
                    resize: "vertical",
                    borderBottom: "none",
                    border: `1px solid ${focusedField === "message" ? GOLD : "rgba(74,69,64,0.2)"}`,
                    padding: "12px 14px",
                    transition: "border-color 0.3s ease",
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <p
                  role="alert"
                  className="mt-8"
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: "0.82rem",
                    color: "#B0341E",
                  }}
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <div className="mt-14">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-block px-10 py-4"
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: "0.72rem",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: FOREGROUND,
                    background: GOLD_GRADIENT,
                    backgroundSize: "200% 100%",
                    backgroundPosition: "0% 50%",
                    border: "none",
                    cursor: submitting ? "wait" : "pointer",
                    opacity: submitting ? 0.6 : 1,
                    borderRadius: 0,
                    transition:
                      "background-position 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.3s",
                    minHeight: 44,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundPosition = "100% 50%")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundPosition = "0% 50%")
                  }
                >
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
              </div>

              <p
                className="mt-10 text-center"
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.78rem",
                  letterSpacing: "0.06em",
                  color: "#A8A29A",
                  lineHeight: 1.7,
                }}
              >
                Every intake is reviewed personally.<br />I'll be in touch within 48 hours.
              </p>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
});

IntakeFormSection.displayName = "IntakeFormSection";

// ── Field block helper ────────────────────────────────────────────────────────

interface FieldBlockProps {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  inputStyle: React.CSSProperties;
}

function FieldBlock({
  id,
  label,
  required,
  type = "text",
  autoComplete,
  placeholder,
  hint,
  value,
  onChange,
  onFocus,
  onBlur,
  inputStyle,
}: FieldBlockProps) {
  return (
    <div>
      <label htmlFor={id} style={LABEL_STYLE}>
        {label}
        {!required && (
          <span style={{ opacity: 0.5, marginLeft: "0.5em", letterSpacing: "0.1em" }}>
            optional
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        style={inputStyle}
        maxLength={type === "email" ? 254 : 500}
      />
      {hint && (
        <p
          style={{
            fontFamily: FONT_SANS,
            fontSize: "0.65rem",
            letterSpacing: "0.08em",
            color: "#A8A29A",
            margin: "6px 0 0",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
