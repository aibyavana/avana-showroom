import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { notifyLead, notifHtml, row, confirmSubmitter, marketHitchConfirmationEmail } from "@/lib/notify";
import { CustomCursor } from "@/components/CustomCursor";
import { TopNav } from "@/components/TopNav";

// ── Market Hitch design tokens (isolated from AVANA/TTF themes) ───────────────

const MH = {
  merlot: "#5A0A2A",
  merlotDeep: "#3E0620",
  pinot: "#8B1538",
  coral: "#EE7D73",
  coralHover: "#F28D84",
  teal: "#34EACD",
  tealMid: "#13A48E",
  bone: "#F7F1EC",
  boneDim: "#E8DCD3",
  ink: "#2A0815",
} as const;

const DISPLAY = "'Playfair Display', Georgia, serif";
const UI = "'Work Sans', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/market-hitch")({
  head: () => ({
    meta: [
      { title: "market hitch. the planning layer for wholesale." },
      {
        name: "description",
        content:
          "market hitch is the verified, commission-free discovery and planning platform built only for wholesale. plan a full season across faire, joor, direct and instagram finds in one board.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://avanashowroom.com/market-hitch" },
      { property: "og:title", content: "market hitch. the planning layer for wholesale." },
      {
        property: "og:description",
        content:
          "verified, commission-free discovery and planning for wholesale buyers and brands. one board for every brand you buy.",
      },
      { property: "og:image", content: "https://avanashowroom.com/avana-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "market hitch. the planning layer for wholesale." },
      {
        name: "twitter:description",
        content: "verified, commission-free discovery and planning for wholesale buyers and brands.",
      },
      { name: "twitter:image", content: "https://avanashowroom.com/avana-logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://avanashowroom.com/market-hitch" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Work+Sans:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.30.0/tabler-icons.min.css",
      },
    ],
  }),
  component: MarketHitchPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

type Audience = "buyer" | "brand";

interface FormState {
  name: string;
  email: string;
  company: string;
  audience: Audience;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PulseDot() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: MH.teal,
        animation: "mh-pulse 2.4s infinite",
        flexShrink: 0,
      }}
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        fontFamily: UI,
        fontSize: 11.5,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: MH.teal,
        marginBottom: 28,
      }}
    >
      <PulseDot />
      {children}
    </div>
  );
}

function BeltEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: UI,
        fontSize: 11,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: MH.teal,
        marginBottom: 18,
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: MH.teal,
          flexShrink: 0,
        }}
      />
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: UI,
        fontSize: 11,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: MH.teal,
        marginBottom: 14,
        textAlign: "center",
      }}
    >
      {children}
    </div>
  );
}

// ── Waitlist form section ─────────────────────────────────────────────────────

const BUYER_CONTENT = {
  tag: "for retail buyers",
  head: "plan a full season across every platform. in one board.",
  values: [
    {
      mark: "⌘",
      html: "<b>one board, every source.</b> pull product from faire, joor, direct and instagram finds into a single season plan. buy total updates live.",
    },
    {
      mark: "◷",
      html: "<b>your planning history, kept.</b> resort '29 builds on resort '28. every season becomes searchable memory, not lost screenshots.",
    },
    {
      mark: "✓",
      html: "<b>real wholesale data.</b> wholesale price, MSRP, MOQ and ship windows on every piece. no consumer noise, no guessing.",
    },
    {
      mark: "→",
      html: "<b>commission-free and neutral.</b> we own the planning, never your checkout. order wherever you already do. we don't take a cut.",
    },
  ],
  formHead: "join the buyer waitlist",
  formSub: "verified boutiques onboarded first, in order.",
  companyLabel: "store / business name",
  companyPlaceholder: "the boutique, vancouver",
  fine: "<b>verified buyers only.</b> we review every signup to keep the network free of consumers, resellers, and noise.",
  doneHead: "you're on the list.",
  doneBody:
    "we onboard verified boutiques in order. we'll reach out before launch to verify your store and set up your first season.",
};

const BRAND_CONTENT = {
  tag: "for wholesale brands",
  head: "see who's planning your collection. before a single order is placed.",
  values: [
    {
      mark: "◎",
      html: "<b>structured pre-order intent.</b> know which boutiques saved you, boarded you, and budgeted for you this season.",
    },
    {
      mark: "✦",
      html: "<b>a trade-show replacement, not a booth.</b> pay for verified buyer interest, not $15k of floor space and 40 business cards.",
    },
    {
      mark: "⌘",
      html: "<b>machine-readable from day one.</b> we structure your line so the buyer-tools coming next can actually find you.",
    },
    {
      mark: "→",
      html: "<b>subscription, never commission.</b> a flat seat to reach verified buyers. we never take a percentage of your order.",
    },
  ],
  formHead: "join the brand waitlist",
  formSub: "founding brands onboarded by hand, by amanda.",
  companyLabel: "brand name",
  companyPlaceholder: "the label, los angeles",
  fine: "<b>founding cohort.</b> the first 75 brands are onboarded personally with full commercial data before buyers arrive.",
  doneHead: "you're in the founding line.",
  doneBody:
    "the first cohort of brands is onboarded by hand, with verified commercial data, before the platform opens to buyers. we'll be in touch.",
};

function WaitlistForm() {
  const [audience, setAudience] = useState<Audience>("buyer");
  const [form, setForm] = useState<FormState>({ name: "", email: "", company: "", audience: "buyer" });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const content = audience === "buyer" ? BUYER_CONTENT : BRAND_CONTENT;

  function setAudienceTab(a: Audience) {
    setAudience(a);
    setForm((f) => ({ ...f, audience: a }));
    setStatus("idle");
    setErrors({});
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "name is required";
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errs.email = "enter a valid email";
    if (!form.company.trim()) errs.company = `${content.companyLabel} is required`;
    if (!form.audience) errs.audience = "please choose buyer or brand";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setErrorMsg("");

    try {
      const { error: dbErr } = await supabase.from("market_hitch_waitlist").insert({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        company: form.company.trim(),
        audience: form.audience,
      });

      if (dbErr) {
        if (dbErr.code === "23505") {
          setErrorMsg("that email is already on the list.");
        } else {
          setErrorMsg("something went wrong. please try again.");
        }
        setStatus("error");
        return;
      }

      setStatus("done");

      // Fire-and-forget: Amanda notification
      try {
        await notifyLead({
          data: {
            subject: `New Market Hitch Waitlist. ${form.name.trim()} | ${form.audience}`,
            html: notifHtml(
              `New Market Hitch Waitlist. ${form.name.trim()} | ${form.audience}`,
              "market-hitch",
              [
                row("name", form.name.trim()),
                row("email", form.email.trim()),
                row("company", form.company.trim()),
                row("audience", form.audience),
              ]
            ),
          },
        });
      } catch (_) {
        // non-blocking
      }

      // Fire-and-forget: submitter confirmation in MH branding
      try {
        const { html, text } = marketHitchConfirmationEmail(form.name.trim(), form.audience);
        await confirmSubmitter({
          data: {
            to: form.email.trim(),
            subject: audience === "buyer" ? "you're on the list." : "you're in the founding line.",
            html,
            text,
          },
        });
      } catch (_) {
        // non-blocking
      }
    } catch (_) {
      setStatus("error");
      setErrorMsg("something went wrong. please try again.");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(247,241,236,0.04)",
    border: `1px solid rgba(247,241,236,0.14)`,
    borderRadius: 10,
    padding: "13px 14px",
    color: MH.bone,
    fontFamily: BODY,
    fontSize: 16,
    outline: "none",
    transition: "border-color 0.25s, background 0.25s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: UI,
    fontSize: 11,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    color: "rgba(247,241,236,0.5)",
    marginBottom: 7,
  };

  return (
    <div id="join" style={{ scrollMarginTop: 80 }}>
      <SectionLabel>the network is opening in cohorts</SectionLabel>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 500,
          fontSize: "clamp(28px, 3.4vw, 40px)",
          lineHeight: 1.08,
          letterSpacing: "-0.01em",
          textTransform: "lowercase",
          textAlign: "center",
          maxWidth: "18ch",
          margin: "0 auto 36px",
          color: MH.bone,
        }}
      >
        verified buyers and brands only. onboarded by hand.
      </div>

      {/* buyer / brand toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <div
          role="tablist"
          aria-label="choose your side"
          style={{
            display: "inline-flex",
            background: "rgba(247,241,236,0.06)",
            border: "1px solid rgba(247,241,236,0.12)",
            borderRadius: 999,
            padding: 5,
            position: "relative",
          }}
        >
          {(["buyer", "brand"] as Audience[]).map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={audience === a}
              onClick={() => setAudienceTab(a)}
              style={{
                position: "relative",
                zIndex: 2,
                fontFamily: UI,
                fontWeight: 500,
                fontSize: 14,
                letterSpacing: "0.04em",
                textTransform: "lowercase",
                color: audience === a ? MH.merlotDeep : "rgba(247,241,236,0.6)",
                background: audience === a ? MH.coral : "none",
                border: "none",
                cursor: "pointer",
                padding: "12px 30px",
                borderRadius: 999,
                transition: "color 0.35s ease, background 0.35s ease",
                minHeight: 44,
              }}
            >
              i'm a {a}
            </button>
          ))}
        </div>
      </div>

      {/* panel */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          background: MH.merlot,
          border: "1px solid rgba(247,241,236,0.10)",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 40px 80px -40px rgba(0,0,0,0.6)",
          marginTop: 18,
        }}
      >
        {/* left: value copy */}
        <div style={{ padding: "46px 44px" }}>
          <div
            style={{
              fontFamily: UI,
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: MH.coral,
              marginBottom: 18,
            }}
          >
            {content.tag}
          </div>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(22px, 2.6vw, 30px)",
              lineHeight: 1.14,
              letterSpacing: "-0.01em",
              textTransform: "lowercase",
              marginBottom: 22,
              color: MH.bone,
            }}
          >
            {content.head}
          </h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, marginTop: 8 }}>
            {content.values.map((v, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  padding: "13px 0",
                  borderTop: i === 0 ? "none" : "1px solid rgba(247,241,236,0.08)",
                  fontSize: 14.5,
                  color: "rgba(247,241,236,0.82)",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(52,234,205,0.12)",
                    color: MH.teal,
                    fontFamily: UI,
                    fontSize: 12,
                    fontWeight: 600,
                    marginTop: 1,
                  }}
                >
                  {v.mark}
                </span>
                <span dangerouslySetInnerHTML={{ __html: v.html }} />
              </li>
            ))}
          </ul>
        </div>

        {/* right: form */}
        <div
          style={{
            padding: "46px 44px",
            background: MH.merlotDeep,
            borderLeft: "1px solid rgba(247,241,236,0.08)",
          }}
        >
          {status === "done" ? (
            <div style={{ animation: "mh-rise 0.5s cubic-bezier(0.2,0.7,0.3,1)" }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(52,234,205,0.14)",
                  color: MH.teal,
                  marginBottom: 20,
                  fontSize: 22,
                }}
              >
                ✓
              </div>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  fontSize: 26,
                  textTransform: "lowercase",
                  marginBottom: 12,
                  color: MH.bone,
                }}
              >
                {content.doneHead}
              </h3>
              <p style={{ fontSize: 14.5, color: "rgba(247,241,236,0.7)", maxWidth: "34ch", lineHeight: 1.6 }}>
                {content.doneBody}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div
                style={{
                  fontFamily: DISPLAY,
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 21,
                  color: MH.bone,
                  marginBottom: 6,
                  textTransform: "lowercase",
                }}
              >
                {content.formHead}
              </div>
              <div
                style={{ fontSize: 13.5, color: "rgba(247,241,236,0.55)", marginBottom: 24 }}
              >
                {content.formSub}
              </div>

              {/* name */}
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>your name</label>
                <input
                  type="text"
                  autoComplete="name"
                  placeholder="amanda van as"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  style={{
                    ...inputStyle,
                    borderColor: errors.name ? MH.pinot : "rgba(247,241,236,0.14)",
                  }}
                />
                {errors.name && (
                  <div style={{ marginTop: 4, fontSize: 12, color: MH.coral }}>{errors.name}</div>
                )}
              </div>

              {/* email */}
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>work email</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder={audience === "buyer" ? "you@yourstore.com" : "you@yourbrand.com"}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  style={{
                    ...inputStyle,
                    borderColor: errors.email ? MH.pinot : "rgba(247,241,236,0.14)",
                  }}
                />
                {errors.email && (
                  <div style={{ marginTop: 4, fontSize: 12, color: MH.coral }}>{errors.email}</div>
                )}
              </div>

              {/* company */}
              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>{content.companyLabel}</label>
                <input
                  type="text"
                  placeholder={content.companyPlaceholder}
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  style={{
                    ...inputStyle,
                    borderColor: errors.company ? MH.pinot : "rgba(247,241,236,0.14)",
                  }}
                />
                {errors.company && (
                  <div style={{ marginTop: 4, fontSize: 12, color: MH.coral }}>{errors.company}</div>
                )}
              </div>

              {status === "error" && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(139,21,56,0.2)",
                    border: `1px solid ${MH.pinot}`,
                    color: MH.coral,
                    fontSize: 13,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  width: "100%",
                  marginTop: 8,
                  fontFamily: UI,
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: "0.03em",
                  textTransform: "lowercase",
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  background: status === "submitting" ? "rgba(238,125,115,0.6)" : MH.coral,
                  color: MH.merlotDeep,
                  border: "none",
                  borderRadius: 10,
                  padding: 15,
                  minHeight: 48,
                  transition: "transform 0.2s, box-shadow 0.25s, background 0.25s",
                }}
              >
                {status === "submitting" ? "sending..." : "request early access"}
              </button>

              <p
                style={{ marginTop: 16, fontSize: 12, color: "rgba(247,241,236,0.42)", lineHeight: 1.5 }}
                dangerouslySetInnerHTML={{ __html: content.fine }}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

function MarketHitchPage() {
  return (
    <>
      <CustomCursor />
      <TopNav alwaysVisible background="rgba(62,6,32,0.92)" dark />
      <style>{`
        @keyframes mh-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(52,234,205,0.5); }
          70%  { box-shadow: 0 0 0 9px rgba(52,234,205,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,234,205,0); }
        }
        @keyframes mh-rise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: none; }
        }
        .mh-input:focus {
          border-color: ${MH.coral} !important;
          background: rgba(247,241,236,0.07) !important;
        }
        .mh-cta-primary:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .mh-cta-ghost:hover {
          color: ${MH.bone} !important;
          border-bottom-color: ${MH.coral} !important;
        }
        .mh-step:hover {
          border-color: rgba(52,234,205,0.3) !important;
          background: rgba(247,241,236,0.04) !important;
        }
        @media (max-width: 820px) {
          .mh-vs-grid { grid-template-columns: 1fr !important; }
          .mh-steps-grid { grid-template-columns: 1fr !important; }
          .mh-showcase-stage { flex-direction: column !important; align-items: center !important; }
          .mh-wrap { padding: 0 22px !important; }
          .mh-hero { padding: 60px 0 44px !important; }
          .mh-panel { grid-template-columns: 1fr !important; }
          .mh-panel-formside { border-left: none !important; border-top: 1px solid rgba(247,241,236,0.08) !important; }
          .mh-panel-copy, .mh-panel-formside { padding: 36px 28px !important; }
          .mh-counter { gap: 28px 40px !important; }
          .mh-showcase-phone { flex: none !important; width: 100% !important; max-width: 296px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
      `}</style>

      <div
        style={{
          background: MH.merlotDeep,
          color: MH.bone,
          fontFamily: BODY,
          fontWeight: 300,
          lineHeight: 1.6,
          WebkitFontSmoothing: "antialiased",
          overflowX: "hidden",
          minHeight: "100vh",
        }}
      >
        {/* ── Top bar ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "26px 0",
              borderBottom: "1px solid rgba(247,241,236,0.10)",
            }}
          >
            <div
              style={{
                fontFamily: UI,
                fontWeight: 600,
                fontSize: 15,
                letterSpacing: "0.14em",
                textTransform: "lowercase",
                color: MH.bone,
              }}
            >
              market <span style={{ color: MH.coral }}>hitch</span>
            </div>
            <div
              style={{
                fontFamily: UI,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(247,241,236,0.45)",
              }}
            >
              an avana showroom company
            </div>
          </div>
        </div>

        {/* ── Hero ── */}
        <header
          className="mh-hero"
          style={{
            position: "relative",
            padding: "84px 0 70px",
          }}
        >
          {/* background gradients */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(60% 80% at 80% 14%, rgba(238,125,115,0.16), transparent 60%), " +
                "radial-gradient(50% 60% at 8% 90%, rgba(139,21,56,0.45), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px", position: "relative" }}>
            <h1
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                fontSize: "clamp(40px, 5.4vw, 72px)",
                lineHeight: 1.03,
                letterSpacing: "-0.015em",
                maxWidth: "14ch",
                margin: "0 0 26px",
              }}
            >
              Wholesale just found its{" "}
              <em style={{
                fontStyle: "italic",
                background: "linear-gradient(135deg, #0A2A2A 0%, #0D4A3A 30%, #1DB8A0 65%, #34EACD 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "#34EACD",
              }}>match</em>.
            </h1>

            <p
              style={{
                maxWidth: "46ch",
                fontSize: "clamp(15px, 1.4vw, 18px)",
                color: "rgba(247,241,236,0.78)",
                fontWeight: 300,
                lineHeight: 1.7,
                marginBottom: 10,
              }}
            >
              The swipe-to-discover, plan-it-all-in-one-place network where buyers find the
              labels worth their floor space, and brands find the buyers who'll write the order.
              Think less trade show, more the feed you actually enjoy.
            </p>

            <p
              style={{
                fontSize: 13,
                letterSpacing: "0.04em",
                color: "rgba(247,241,236,0.5)",
                fontWeight: 300,
                marginBottom: 30,
              }}
            >
              Verified brands and buyers only. No influencers, no consumers, no noise.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
              <a
                href="#join"
                className="mh-cta-primary"
                style={{
                  fontFamily: UI,
                  fontWeight: 700,
                  fontSize: 14.5,
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #0A2A2A 0%, #0D4A3A 30%, #1DB8A0 65%, #34EACD 100%)",
                  color: MH.bone,
                  border: "none",
                  borderRadius: 10,
                  padding: "14px 26px",
                  transition: "filter 0.25s, transform 0.2s",
                  display: "inline-block",
                }}
              >
                Join the waitlist
              </a>
              <a
                href="#product"
                className="mh-cta-ghost"
                style={{
                  fontFamily: UI,
                  fontSize: 13.5,
                  letterSpacing: "0.04em",
                  color: "rgba(247,241,236,0.7)",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(247,241,236,0.25)",
                  paddingBottom: 2,
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                See how it works
              </a>
            </div>
          </div>
        </header>

        {/* ── BELT 1: Instagram is loud ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 32px 24px" }}>
          <BeltEyebrow>discovery, done right</BeltEyebrow>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(30px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.015em",
              textTransform: "lowercase",
              maxWidth: "18ch",
              marginBottom: 22,
            }}
          >
            instagram is <em style={{ fontStyle: "italic", color: MH.coral }}>loud</em>. wholesale deserves quiet.
          </h2>
          <p
            style={{
              maxWidth: "54ch",
              fontSize: "clamp(15px, 1.4vw, 18px)",
              color: "rgba(247,241,236,0.78)",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 42,
            }}
          >
            buyers discover brands on instagram because nothing better exists. so they wade through cat videos,
            influencers, consumer feeds and the algorithm to find one linen label. market hitch strips all of it
            away.{" "}
            <strong style={{ color: MH.bone, fontWeight: 400 }}>
              verified boutiques and brands only. no consumers, no influencers, no algorithm shouting over the work.
            </strong>
          </p>

          {/* loud vs quiet */}
          <div
            className="mh-vs-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              marginBottom: 72,
            }}
          >
            {/* loud */}
            <div
              style={{
                border: "1px solid rgba(247,241,236,0.10)",
                borderRadius: 16,
                padding: "28px 26px",
                background: "rgba(139,21,56,0.10)",
              }}
            >
              <div
                style={{
                  fontFamily: UI,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(247,241,236,0.5)",
                  marginBottom: 18,
                }}
              >
                what you scroll past today
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  "influencers & creator content",
                  "consumer feeds & cat videos",
                  "the engagement algorithm",
                  "no wholesale price, MOQ or ship window",
                  "47 cold emails that don't fit your store",
                ].map((item) => (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 11,
                      padding: "9px 0",
                      fontSize: 14.5,
                      color: "rgba(247,241,236,0.5)",
                      textDecoration: "line-through",
                      textDecorationColor: "rgba(238,125,115,0.5)",
                      borderTop: "1px solid rgba(247,241,236,0.07)",
                    }}
                  >
                    <i className="ti ti-x" style={{ color: MH.coral, textDecoration: "none", fontSize: 16, flexShrink: 0, marginTop: 1 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* quiet */}
            <div
              style={{
                border: "1px solid rgba(247,241,236,0.10)",
                borderRadius: 16,
                padding: "28px 26px",
                background: "rgba(247,241,236,0.02)",
              }}
            >
              <div
                style={{
                  fontFamily: UI,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: MH.teal,
                  marginBottom: 18,
                }}
              >
                what you see on market hitch
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {[
                  ["verified boutiques & brands only", true],
                  ["a feed curated to your store's vibe & price point", false],
                  ["wholesale price, MOQ & ship windows on every piece", false],
                  ["zero consumer noise", true],
                  ["brands reach you only when you match", false],
                ].map((row) => { const [item, bold] = row as [string, boolean]; return (
                  <li
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 11,
                      padding: "9px 0",
                      fontSize: 14.5,
                      color: "rgba(247,241,236,0.82)",
                      borderTop: "1px solid rgba(247,241,236,0.07)",
                    }}
                  >
                    <i className="ti ti-check" style={{ color: MH.teal, fontSize: 16, flexShrink: 0, marginTop: 1 }} />
                    {bold ? <strong style={{ color: MH.bone, fontWeight: 500 }}>{item}</strong> : item}
                  </li>
                ); })}
              </ul>
            </div>
          </div>
        </div>

        {/* ── BELT 2: Global discovery ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 72px" }}>
          <BeltEyebrow>global reach, local relevance</BeltEyebrow>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(30px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.015em",
              textTransform: "lowercase",
              maxWidth: "20ch",
              marginBottom: 22,
            }}
          >
            discover brands and buyers from{" "}
            <em style={{ fontStyle: "italic", color: MH.coral }}>across the world</em>.
          </h2>
          <p
            style={{
              maxWidth: "54ch",
              fontSize: "clamp(15px, 1.4vw, 18px)",
              color: "rgba(247,241,236,0.78)",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 38,
            }}
          >
            an avant-garde label in dublin discovered by an edgy boutique in tokyo. a resort brand in tulum
            found by a store in paris. a designer in lagos reaching shelves in london.{" "}
            <strong style={{ color: MH.bone, fontWeight: 400 }}>
              the first truly global wholesale discovery network
            </strong>{" "}
            — with smart filters, so a million brands could be here and you'll only ever see the ones that fit.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
            {[
              { from: "avant-garde, dublin", to: "edgy boutique, tokyo" },
              { from: "resort, tulum", to: "concept store, paris" },
              { from: "designer, lagos", to: "stockist, london" },
              { from: "swim, bali", to: "boutique, sydney" },
            ].map((pin) => (
              <div
                key={pin.from}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  border: "1px solid rgba(247,241,236,0.14)",
                  borderRadius: 999,
                  padding: "10px 18px",
                  fontFamily: UI,
                  fontSize: 14,
                  color: MH.bone,
                }}
              >
                <i className="ti ti-map-pin" style={{ color: MH.coral, fontSize: 15 }} />
                <span style={{ color: MH.teal, fontWeight: 500 }}>{pin.from}</span>
                <span style={{ color: "rgba(247,241,236,0.4)" }}>→</span>
                {pin.to}
              </div>
            ))}
          </div>
        </div>

        {/* ── BELT 3: Matchmaking ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 80px" }}>
          <BeltEyebrow>matchmaking, not mass outreach</BeltEyebrow>
          <h2
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              fontSize: "clamp(30px, 4vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.015em",
              textTransform: "lowercase",
              maxWidth: "18ch",
              marginBottom: 22,
            }}
          >
            set your taste. we do the{" "}
            <em style={{ fontStyle: "italic", color: MH.coral }}>matching</em>.
          </h2>
          <p
            style={{
              maxWidth: "54ch",
              fontSize: "clamp(15px, 1.4vw, 18px)",
              color: "rgba(247,241,236,0.78)",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 42,
            }}
          >
            most wholesale outreach is generic emails to mass lists. we kill it. you set your aesthetic, your
            categories, your price point and ship windows — and brands can only reach you when they genuinely
            match.{" "}
            <strong style={{ color: MH.bone, fontWeight: 400 }}>less selling. more matching.</strong>
          </p>

          {/* 3-step journey */}
          <div
            className="mh-steps-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 26,
              position: "relative",
            }}
          >
            {[
              {
                num: "i.",
                icon: "ti-adjustments",
                title: "you set your preferences",
                body: "aesthetic, categories, price point, MOQ, ship windows, the customer you dress. ",
                bold: "your taste becomes the filter.",
              },
              {
                num: "ii.",
                icon: "ti-heart-handshake",
                title: "we surface real matches",
                body: "brands whose aesthetic and terms actually overlap with yours. surfaced, ranked, and explained. ",
                bold: "not a search query. taste.",
              },
              {
                num: "iii.",
                icon: "ti-message-circle-2",
                title: "contact only on a match",
                body: "a brand can reach out only once you're matched. ",
                bold: "no cold outreach. no spam. no 47th irrelevant email.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="mh-step"
                style={{
                  border: "1px solid rgba(247,241,236,0.10)",
                  borderRadius: 16,
                  padding: "26px 24px",
                  background: "rgba(247,241,236,0.02)",
                  position: "relative",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontStyle: "italic",
                    fontSize: 15,
                    color: "rgba(247,241,236,0.4)",
                    marginBottom: 14,
                  }}
                >
                  {step.num}
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(52,234,205,0.12)",
                    color: MH.teal,
                    fontSize: 19,
                    marginBottom: 16,
                  }}
                >
                  <i className={`ti ${step.icon}`} />
                </div>
                <h3
                  style={{
                    fontFamily: UI,
                    fontSize: 16,
                    fontWeight: 600,
                    color: MH.bone,
                    marginBottom: 8,
                    letterSpacing: "0.01em",
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontSize: 13.5, color: "rgba(247,241,236,0.7)", lineHeight: 1.6, fontWeight: 300 }}>
                  {step.body}
                  <strong style={{ color: MH.bone, fontWeight: 400 }}>{step.bold}</strong>
                </p>
              </div>
            ))}
          </div>

          {/* no-spam guarantee */}
          <div
            style={{
              border: "1px solid rgba(52,234,205,0.22)",
              borderRadius: 14,
              padding: "20px 24px",
              background: "rgba(52,234,205,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "rgba(52,234,205,0.14)",
                color: MH.teal,
                fontSize: 20,
              }}
            >
              <i className="ti ti-shield-check" />
            </div>
            <div style={{ fontSize: 15, color: MH.bone, fontWeight: 300, lineHeight: 1.55 }}>
              <strong style={{ color: MH.teal, fontWeight: 500 }}>no spam, ever.</strong> brands can't blast
              the network. if you're not a match, they can't reach you. your inbox stays as curated as your feed.
            </div>
          </div>
        </div>

        {/* ── Waitlist ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 80px" }}>
          <WaitlistForm />
        </div>

        {/* ── Counter strip ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
          <div
            className="mh-counter"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "40px 64px",
              alignItems: "baseline",
              padding: "56px 0",
              borderTop: "1px solid rgba(247,241,236,0.10)",
              marginBottom: 0,
            }}
          >
            {[
              { n: "16", suffix: " yrs", em: true, label: "inside wholesale, on both sides of the network" },
              { n: "$20", suffix: "m+", em: true, label: "in wholesale sales generated for brands" },
              { n: "0", suffix: "%", em: true, label: "commission. brands subscribe, buyers plan free" },
              { n: "100%", suffix: "", em: false, label: "verified brands and buyers, onboarded by hand" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 500,
                    fontSize: "clamp(34px, 4.4vw, 52px)",
                    color: MH.bone,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.em ? (
                    <>
                      <em style={{ color: MH.coral, fontStyle: "normal" }}>{stat.n}</em>
                      {stat.suffix}
                    </>
                  ) : (
                    stat.n
                  )}
                </div>
                <div
                  style={{
                    fontFamily: UI,
                    fontSize: 12,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(247,241,236,0.5)",
                    marginTop: 10,
                    maxWidth: "22ch",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Product showcase ── */}
        <section
          id="product"
          style={{
            background: MH.bone,
            color: MH.ink,
            padding: "84px 0 90px",
            marginTop: 72,
          }}
        >
          <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
            <div
              style={{
                fontFamily: UI,
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: MH.pinot,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              see it working
            </div>
            <h2
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                fontSize: "clamp(30px, 3.8vw, 46px)",
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
                textTransform: "lowercase",
                textAlign: "center",
                maxWidth: "20ch",
                margin: "0 auto 12px",
                color: MH.ink,
              }}
            >
              two products. one verified network.
            </h2>
            <p
              style={{
                textAlign: "center",
                maxWidth: "54ch",
                margin: "0 auto 62px",
                fontSize: 15.5,
                color: "rgba(42,8,21,0.6)",
                fontWeight: 300,
                lineHeight: 1.7,
              }}
            >
              the buyer plans a season across every platform in one board. the brand watches that demand build
              against their own collection, before a single order is placed.
            </p>

            {/* Buyer product */}
            <div style={{ marginBottom: 72 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 15,
                  marginBottom: 26,
                  borderBottom: `1px solid rgba(42,8,21,0.12)`,
                  paddingBottom: 16,
                }}
              >
                <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 19, color: "rgba(42,8,21,0.38)" }}>i.</span>
                <span style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 500, color: MH.ink }}>the buyer</span>
                <span
                  style={{
                    fontFamily: UI,
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(42,8,21,0.48)",
                    marginLeft: "auto",
                  }}
                >
                  discover → board → assist
                </span>
              </div>

              <div
                className="mh-showcase-stage"
                style={{ display: "flex", gap: 38, alignItems: "flex-start", flexWrap: "wrap" }}
              >
                {/* Phone mockup */}
                <div className="mh-showcase-phone" style={{ flex: "0 0 296px" }}>
                  <div
                    style={{
                      background: "#0d0407",
                      borderRadius: 46,
                      padding: 9,
                      boxShadow: "0 32px 64px -24px rgba(42,8,21,0.42), 0 8px 20px -8px rgba(42,8,21,0.18)",
                    }}
                  >
                    <div
                      style={{
                        background: MH.bone,
                        borderRadius: 37,
                        overflow: "hidden",
                        position: "relative",
                        height: 612,
                      }}
                    >
                      <div
                        style={{
                          background: `linear-gradient(108deg, ${MH.merlot}, ${MH.pinot} 56%, ${MH.coral})`,
                          padding: "16px 17px 15px",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 9,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 86,
                            height: 22,
                            background: "#0d0407",
                            borderRadius: 12,
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            color: "#fff",
                            fontSize: 10.5,
                            marginBottom: 11,
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>9:41</span>
                          <div style={{ display: "flex", gap: 5 }}>
                            <i className="ti ti-antenna-bars-5" />
                            <i className="ti ti-wifi" />
                            <i className="ti ti-battery-3" />
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 23, color: "#fff", lineHeight: 1, fontWeight: 500 }}>
                              discover
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.82)", marginTop: 5 }}>
                              curated to your buy · verified b2b
                            </div>
                          </div>
                          <i className="ti ti-bell" style={{ color: "#fff", fontSize: 17 }} />
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 13, overflow: "hidden" }}>
                          {["style", "price", "season"].map((chip) => (
                            <span
                              key={chip}
                              style={{
                                background: "rgba(255,255,255,0.18)",
                                color: "#fff",
                                fontSize: 10,
                                padding: "6px 12px",
                                borderRadius: 20,
                                whiteSpace: "nowrap",
                                fontFamily: UI,
                              }}
                            >
                              {chip} v
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: 16, height: 462, overflowY: "auto" }}>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {[
                            { t: "mazu jacquard pants", b: "anjna studio", via: "faire", ws: 216 },
                            { t: "naiyah crochet tank", b: "anjna studio", via: "joor", ws: 117 },
                            { t: "lola wrap skirt set", b: "mona resort", via: "direct", ws: 189 },
                            { t: "decadence bikini", b: "mona resort", via: "instagram", ws: 86 },
                          ].map((item) => (
                            <div
                              key={item.t}
                              style={{
                                borderRadius: 12,
                                overflow: "hidden",
                                border: "1px solid rgba(42,8,21,0.07)",
                                background: "#fff",
                                padding: "10px 12px",
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 48,
                                  borderRadius: 8,
                                  background: `linear-gradient(135deg, ${MH.merlot}22, ${MH.coral}33)`,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: UI, fontSize: 11.5, fontWeight: 500, color: MH.ink }}>{item.t}</div>
                                <div style={{ fontFamily: UI, fontSize: 8, letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(42,8,21,0.4)", marginTop: 2 }}>
                                  {item.b} · {item.via}
                                </div>
                              </div>
                              <div style={{ textAlign: "right", fontFamily: UI, fontSize: 9 }}>
                                <div style={{ color: "#13A48E", fontWeight: 600 }}>${item.ws}</div>
                                <div style={{ color: "rgba(42,8,21,0.4)" }}>ws</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: DISPLAY,
                      fontStyle: "italic",
                      fontSize: 12.5,
                      color: "rgba(42,8,21,0.48)",
                      marginTop: 15,
                    }}
                  >
                    mobile · feed → board → assist
                  </div>
                </div>

                {/* Desktop mockup */}
                <div style={{ flex: 1, minWidth: 380 }}>
                  <div
                    style={{
                      border: "1px solid rgba(42,8,21,0.11)",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: MH.bone,
                      boxShadow: "0 32px 64px -28px rgba(42,8,21,0.32)",
                    }}
                  >
                    {/* browser chrome */}
                    <div
                      style={{
                        background: "#fff",
                        padding: "11px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        borderBottom: `2.5px solid`,
                        borderImage: `linear-gradient(90deg, ${MH.merlot}, ${MH.pinot} 55%, ${MH.coral}) 1`,
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: MH.coral, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: MH.boneDim, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: MH.boneDim, display: "inline-block" }} />
                      <span style={{ marginLeft: 13, fontFamily: UI, fontSize: 10.5, color: "rgba(42,8,21,0.5)" }}>
                        markethitch.com / plan
                      </span>
                      <span style={{ marginLeft: "auto", fontFamily: DISPLAY, fontSize: 13, color: MH.ink }}>
                        market hitch
                      </span>
                    </div>
                    {/* split pane */}
                    <div style={{ display: "flex", height: 320 }}>
                      <div
                        style={{
                          flex: "1.12",
                          borderRight: "1px solid rgba(42,8,21,0.09)",
                          background: MH.bone,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid rgba(42,8,21,0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: MH.ink }}>discover</div>
                            <div style={{ fontFamily: UI, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(42,8,21,0.5)", marginTop: 2 }}>
                              faire · joor · direct · instagram
                            </div>
                          </div>
                          <span style={{ border: "1px solid rgba(42,8,21,0.11)", color: "rgba(42,8,21,0.55)", fontFamily: UI, fontSize: 10, padding: "6px 12px", borderRadius: 20 }}>
                            style v
                          </span>
                        </div>
                        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                          {["anjna studio", "mona resort", "rue studio", "anjna studio", "mona resort", "rue studio"].map((brand, i) => (
                            <div
                              key={i}
                              style={{
                                borderRadius: 10,
                                background: `linear-gradient(135deg, ${MH.merlot}18, ${MH.coral}22)`,
                                height: 70,
                                display: "flex",
                                alignItems: "flex-end",
                                padding: "6px 7px",
                              }}
                            >
                              <span style={{ fontFamily: UI, fontSize: 8, color: MH.ink, fontWeight: 500 }}>{brand}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
                        <div
                          style={{
                            padding: "12px 14px",
                            borderBottom: "1px solid rgba(42,8,21,0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: MH.ink, fontStyle: "italic" }}>spring '26 · west coast</div>
                            <div style={{ fontFamily: UI, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(42,8,21,0.5)", marginTop: 2 }}>
                              0 pieces · 0 brands
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: UI, fontSize: 9, color: "rgba(42,8,21,0.5)" }}>buy cost</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 20, color: MH.merlot, lineHeight: 1.1 }}>$0</div>
                          </div>
                        </div>
                        <div style={{ flex: 1, padding: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div
                            style={{
                              border: "1px dashed rgba(42,8,21,0.16)",
                              borderRadius: 12,
                              padding: "24px 14px",
                              textAlign: "center",
                              fontSize: 11,
                              color: "rgba(42,8,21,0.52)",
                              lineHeight: 1.55,
                            }}
                          >
                            your season board is empty.<br />
                            save pieces from the feed. each arrives priced.
                          </div>
                        </div>
                        <div
                          style={{
                            borderTop: "1px solid rgba(42,8,21,0.09)",
                            padding: "10px 14px",
                            background: "linear-gradient(120deg, rgba(90,10,42,0.05), rgba(238,125,115,0.08))",
                          }}
                        >
                          <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, color: MH.ink, marginBottom: 4 }}>
                            hitch assist. grounded in your board
                          </div>
                          <div style={{ fontFamily: BODY, fontSize: 10, color: "rgba(42,8,21,0.6)", lineHeight: 1.5 }}>
                            save a few pieces and i'll spot the gaps in your spring buy.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: DISPLAY,
                      fontStyle: "italic",
                      fontSize: 12.5,
                      color: "rgba(42,8,21,0.48)",
                      marginTop: 15,
                    }}
                  >
                    desktop · board is the workspace. assist reads it
                  </div>
                </div>
              </div>
            </div>

            {/* Brand product */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 15,
                  marginBottom: 26,
                  borderBottom: `1px solid rgba(42,8,21,0.12)`,
                  paddingBottom: 16,
                }}
              >
                <span style={{ fontFamily: DISPLAY, fontStyle: "italic", fontSize: 19, color: "rgba(42,8,21,0.38)" }}>ii.</span>
                <span style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 500, color: MH.ink }}>the brand</span>
                <span
                  style={{
                    fontFamily: UI,
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(42,8,21,0.48)",
                    marginLeft: "auto",
                  }}
                >
                  your collection → buyer demand
                </span>
              </div>

              <div
                className="mh-showcase-stage"
                style={{ display: "flex", gap: 38, alignItems: "flex-start", flexWrap: "wrap" }}
              >
                {/* Phone mockup */}
                <div className="mh-showcase-phone" style={{ flex: "0 0 296px" }}>
                  <div
                    style={{
                      background: "#0d0407",
                      borderRadius: 46,
                      padding: 9,
                      boxShadow: "0 32px 64px -24px rgba(42,8,21,0.42), 0 8px 20px -8px rgba(42,8,21,0.18)",
                    }}
                  >
                    <div
                      style={{
                        background: MH.bone,
                        borderRadius: 37,
                        overflow: "hidden",
                        position: "relative",
                        height: 612,
                      }}
                    >
                      <div
                        style={{
                          background: `linear-gradient(108deg, ${MH.merlot}, ${MH.pinot} 56%, ${MH.coral})`,
                          padding: "16px 17px 15px",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            top: 9,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 86,
                            height: 22,
                            background: "#0d0407",
                            borderRadius: 12,
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            color: "#fff",
                            fontSize: 10.5,
                            marginBottom: 11,
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>9:41</span>
                          <div style={{ display: "flex", gap: 5 }}>
                            <i className="ti ti-antenna-bars-5" />
                            <i className="ti ti-wifi" />
                            <i className="ti ti-battery-3" />
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 23, color: "#fff", lineHeight: 1, fontWeight: 500 }}>
                              your studio
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.82)", marginTop: 5 }}>
                              your collection, live to verified buyers
                            </div>
                          </div>
                          <i className="ti ti-bell" style={{ color: "#fff", fontSize: 17 }} />
                        </div>
                      </div>
                      <div style={{ padding: 12, height: 462, overflowY: "auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11, paddingBottom: 13 }}>
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 13,
                              background: `linear-gradient(150deg, ${MH.ink}, ${MH.merlot})`,
                              display: "grid",
                              placeItems: "center",
                              color: "#fff",
                              fontFamily: DISPLAY,
                              fontSize: 19,
                              flexShrink: 0,
                            }}
                          >
                            E
                          </div>
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MH.ink }}>erika pena</div>
                            <div style={{ fontFamily: UI, fontSize: 8.5, color: "#13A48E", display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                              <i className="ti ti-rosette-discount-check" style={{ fontSize: 10 }} />
                              verified brand · the philippa collection
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 7, marginBottom: 13 }}>
                          {[["214", "discovering"], ["38", "boarded you"], ["$96k", "intent value"]].map(([n, l]) => (
                            <div
                              key={l}
                              style={{
                                flex: 1,
                                background: "#fff",
                                border: "1px solid rgba(42,8,21,0.07)",
                                borderRadius: 12,
                                padding: "10px 7px",
                                textAlign: "center",
                              }}
                            >
                              <div style={{ fontFamily: DISPLAY, fontSize: 18, color: MH.merlot, lineHeight: 1 }}>{n}</div>
                              <div style={{ fontFamily: UI, fontSize: 7, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(42,8,21,0.5)", marginTop: 4 }}>{l}</div>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            background: "rgba(52,234,205,0.05)",
                            border: "1px solid rgba(52,234,205,0.22)",
                            borderRadius: 12,
                            padding: 12,
                            fontSize: 10,
                            color: "rgba(42,8,21,0.7)",
                            lineHeight: 1.55,
                          }}
                        >
                          <strong style={{ color: MH.tealMid }}>hitch assist for brands.</strong> your stevie
                          kaftan is on 22 boards but unpriced for 6 buyers. add ship dates to convert intent into orders.
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: DISPLAY,
                      fontStyle: "italic",
                      fontSize: 12.5,
                      color: "rgba(42,8,21,0.48)",
                      marginTop: 15,
                    }}
                  >
                    mobile · your line first, demand layered on top
                  </div>
                </div>

                {/* Desktop mockup */}
                <div style={{ flex: 1, minWidth: 380 }}>
                  <div
                    style={{
                      border: "1px solid rgba(42,8,21,0.11)",
                      borderRadius: 16,
                      overflow: "hidden",
                      background: MH.bone,
                      boxShadow: "0 32px 64px -28px rgba(42,8,21,0.32)",
                    }}
                  >
                    <div
                      style={{
                        background: "#fff",
                        padding: "11px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        borderBottom: `2.5px solid`,
                        borderImage: `linear-gradient(90deg, ${MH.merlot}, ${MH.pinot} 55%, ${MH.coral}) 1`,
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: MH.coral, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: MH.boneDim, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: MH.boneDim, display: "inline-block" }} />
                      <span style={{ marginLeft: 13, fontFamily: UI, fontSize: 10.5, color: "rgba(42,8,21,0.5)" }}>
                        markethitch.com / studio
                      </span>
                      <span style={{ marginLeft: "auto", fontFamily: DISPLAY, fontSize: 13, color: MH.ink }}>
                        market hitch
                      </span>
                    </div>
                    <div style={{ display: "flex", height: 320 }}>
                      <div
                        style={{
                          flex: "1.12",
                          borderRight: "1px solid rgba(42,8,21,0.09)",
                          background: MH.bone,
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid rgba(42,8,21,0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: MH.ink }}>erika pena · your line</div>
                            <div style={{ fontFamily: UI, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(42,8,21,0.5)", marginTop: 2 }}>
                              the philippa collection · live to verified buyers
                            </div>
                          </div>
                          <span style={{ border: "1px solid rgba(42,8,21,0.11)", color: "rgba(42,8,21,0.55)", fontFamily: UI, fontSize: 10, padding: "6px 12px", borderRadius: 20 }}>
                            post look
                          </span>
                        </div>
                        <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                          {["stevie maxi kaftan", "maggie lace dress", "dylan denim shirt", "cher flare jeans", "aja ruffle top", "daphne lace blouse"].map((item) => (
                            <div
                              key={item}
                              style={{
                                borderRadius: 10,
                                background: `linear-gradient(135deg, ${MH.merlot}18, ${MH.coral}22)`,
                                height: 70,
                                display: "flex",
                                alignItems: "flex-end",
                                padding: "6px 7px",
                              }}
                            >
                              <span style={{ fontFamily: UI, fontSize: 7.5, color: MH.ink, fontWeight: 500 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#fff" }}>
                        <div
                          style={{
                            padding: "12px 14px",
                            borderBottom: "1px solid rgba(42,8,21,0.06)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: MH.ink, fontStyle: "italic" }}>buyer demand</div>
                            <div style={{ fontFamily: UI, fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(42,8,21,0.5)", marginTop: 2 }}>
                              who's discovering &amp; boarding you
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontFamily: UI, fontSize: 9, color: "rgba(42,8,21,0.5)" }}>intent value</div>
                            <div style={{ fontFamily: DISPLAY, fontSize: 20, color: MH.merlot, lineHeight: 1.1 }}>$96k</div>
                          </div>
                        </div>
                        <div style={{ flex: 1, padding: 10, overflow: "hidden" }}>
                          {[
                            { n: "Luxe Retail Group", loc: "new york · 24 stores", lvl: "hot", act: "boarded 4 pieces", c: MH.merlot },
                            { n: "The Edit Boutique", loc: "vancouver · 2 stores", lvl: "hot", act: "boarded 3 · returning", c: MH.pinot },
                            { n: "Maison du Nord", loc: "montreal · 1 store", lvl: "warm", act: "saved 2 pieces", c: MH.coral },
                          ].map((buyer) => (
                            <div
                              key={buyer.n}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                                padding: 9,
                                marginBottom: 6,
                                border: "1px solid rgba(42,8,21,0.07)",
                                borderRadius: 11,
                                background: "#fff",
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "50%",
                                  flexShrink: 0,
                                  display: "grid",
                                  placeItems: "center",
                                  background: buyer.c,
                                  color: "#fff",
                                  fontFamily: UI,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {buyer.n[0]}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, color: MH.ink }}>{buyer.n}</div>
                                <div style={{ fontFamily: UI, fontSize: 7.5, color: "rgba(42,8,21,0.5)", marginTop: 1 }}>{buyer.loc}</div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div
                                  style={{
                                    fontFamily: UI,
                                    fontSize: 7.5,
                                    letterSpacing: "0.07em",
                                    textTransform: "uppercase",
                                    fontWeight: 600,
                                    color: buyer.lvl === "hot" ? MH.coral : MH.pinot,
                                  }}
                                >
                                  {buyer.lvl === "hot" ? "· hot match" : "· warm"}
                                </div>
                                <div style={{ fontFamily: UI, fontSize: 7, color: "rgba(42,8,21,0.4)", marginTop: 1 }}>{buyer.act}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            borderTop: "1px solid rgba(42,8,21,0.09)",
                            padding: "10px 14px",
                            background: "linear-gradient(120deg, rgba(90,10,42,0.05), rgba(238,125,115,0.08))",
                          }}
                        >
                          <div style={{ fontFamily: UI, fontSize: 10, fontWeight: 600, color: MH.ink, marginBottom: 4 }}>
                            hitch assist for brands
                          </div>
                          <div style={{ fontFamily: BODY, fontSize: 10, color: "rgba(42,8,21,0.6)", lineHeight: 1.5 }}>
                            your stevie kaftan sits on 22 boards but is unpriced for 6 buyers. add ship dates to convert intent into orders.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      fontFamily: DISPLAY,
                      fontStyle: "italic",
                      fontSize: 12.5,
                      color: "rgba(42,8,21,0.48)",
                      marginTop: 15,
                    }}
                  >
                    desktop · collection left, live buyer demand right
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <div className="mh-wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px" }}>
          <footer
            style={{
              padding: "50px 0 70px",
              borderTop: "1px solid rgba(247,241,236,0.10)",
              display: "flex",
              flexWrap: "wrap",
              gap: 18,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontFamily: UI,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "lowercase",
                color: MH.bone,
              }}
            >
              market hitch
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(247,241,236,0.45)", maxWidth: "46ch" }}>
              built by <strong style={{ color: "rgba(247,241,236,0.7)", fontWeight: 400 }}>amanda van as</strong>. an insider, for insiders.
              reimagining the future of wholesale from kelowna, bc.
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
