import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { FilmGrain } from "@/components/FilmGrain";
import { CustomCursor } from "@/components/CustomCursor";
import { TopNav } from "@/components/TopNav";
import { Reveal } from "@/components/Reveal";
import { GOLD, WARM_GREY, CANVAS, FOREGROUND, FONT_SANS } from "@/lib/tokens";
import { EASE_SULTRY, DUR_SLOW } from "@/lib/motion";
import { notifyLead, notifHtml, row, confirmSubmitter, retailerConfirmationEmail, waitlistConfirmationEmail } from "@/lib/notify";

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

// ── Zod schema ───────────────────────────────────────────────────────────────

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
  store_name: z.string().trim().min(1, "Store name is required").max(200),
  website: z.string().trim().max(500).optional(),
  instagram: z.string().trim().max(200).optional(),
});

type FormValues = z.infer<typeof schema>;
type Field = keyof FormValues;

const waitlistSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
})

// ── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/become-a-retailer")({
  head: () => ({
    meta: [
      { title: "Become a Retailer — AVANA Showroom" },
      {
        name: "description",
        content:
          "Apply to stock AVANA's curated portfolio of resortwear brands. Exclusive campaigns, global audience, local mailblasts.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://avanashowroom.com/become-a-retailer" },
      { property: "og:title", content: "Become a Retailer — AVANA Showroom" },
      { property: "og:description", content: "Apply to stock AVANA's curated portfolio of resortwear brands. Exclusive campaigns, global audience, local mailblasts." },
      { property: "og:image", content: "https://avanashowroom.com/avana-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Become a Retailer — AVANA Showroom" },
      { name: "twitter:description", content: "Apply to stock AVANA's curated portfolio of resortwear brands." },
      { name: "twitter:image", content: "https://avanashowroom.com/avana-logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://avanashowroom.com/become-a-retailer" },
    ],
  }),
  component: BecomeARetailer,
});

// ── Page ─────────────────────────────────────────────────────────────────────

function BecomeARetailer() {
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: CANVAS, paddingTop: "108px" }}>
      <FilmGrain />
      <CustomCursor />
      <TopNav showAtEnds background="color-mix(in oklab, #DDDBD7 85%, transparent)" />
      <HeroSection onApply={scrollToForm} />
      <PartnershipSection />
      <FormSection ref={formRef} />
      <AiWaitlistSection />
    </div>
  );
}

// ── 1. HERO ──────────────────────────────────────────────────────────────────

function HeroSection({ onApply }: { onApply: (e: React.MouseEvent) => void }) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "88vh" }}
    >
      {/* Full-bleed landscape image */}
      <img
        src="/header image.png"
        alt="AVANA Showroom"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 0, objectPosition: "center 35%" }}
      />

      {/* Left-to-right gradient overlay — dark on left for text legibility, fades out right */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,9,8,0.72) 0%, rgba(10,9,8,0.45) 42%, rgba(10,9,8,0.10) 70%, transparent 100%)",
          zIndex: 1,
        }}
      />

      {/* Bottom fade to canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[10vh]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(247,244,239,0.6) 70%, rgba(247,244,239,1) 100%)",
          zIndex: 2,
        }}
      />

      {/* Grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: GRAIN, zIndex: 3 }}
      />

      {/* Text — left column, vertically centred */}
      <div
        className="relative flex h-full items-center"
        style={{ minHeight: "88vh", zIndex: 4 }}
      >
        <div className="w-full px-8 md:px-16" style={{ paddingTop: "clamp(3rem, 5vh, 4rem)", paddingBottom: "clamp(4rem, 8vh, 6rem)" }}>
          <div style={{ maxWidth: "clamp(280px, 42vw, 620px)" }}>
            <motion.p
              style={{ ...EYEBROW, color: "rgba(184,144,46,0.9)" }}
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR_SLOW, ease: EASE_SULTRY, delay: 0.1 }}
            >
              Become a Retailer
            </motion.p>

            <motion.h1
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 2.2vw, 2.2rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#F7F4EF",
                margin: 0,
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR_SLOW, ease: EASE_SULTRY, delay: 0.2 }}
            >
              <span className="block">They ship to you.</span>
              <span className="block">They sell for you.</span>
            </motion.h1>

            <motion.div
              className="mt-8"
              style={{
                fontFamily: FONT_SANS,
                fontSize: "clamp(0.9rem, 1.1vw, 1.05rem)",
                lineHeight: 1.8,
                color: "rgba(247,244,239,0.78)",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR_SLOW, ease: EASE_SULTRY, delay: 0.35 }}
            >
              <p style={{ margin: 0 }}>Our brands don't just fill your rails.</p>
              <p style={{ margin: 0 }}>They put their global audience to work for your store.</p>
            </motion.div>

            <motion.div
              className="mt-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DUR_SLOW, ease: EASE_SULTRY, delay: 0.5 }}
            >
              <a
                href="#apply"
                onClick={onApply}
                className="gold-link type-caption"
                style={{ color: GOLD }}
              >
                Apply to stock
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── 2. PARTNERSHIP ───────────────────────────────────────────────────────────

const BENEFITS = [
  {
    number: "01",
    title: "Campaign Assets",
    body: "Every stockist receives our brands' full digital libraries — campaign imagery, lookbooks, and video, ready for your channels.",
  },
  {
    number: "02",
    title: "They Feature You",
    body: "Our brands post their stockists across their own social platforms, putting your store in front of their global audience.",
  },
  {
    number: "03",
    title: "Local Mailblasts",
    body: "When your order ships, the brand emails their clients in your area — driving them straight to your door.",
  },
];

function PartnershipSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: CANVAS }}
    >
      {/* grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      <div className="relative mx-auto max-w-[1500px] px-8 py-12 md:px-16 md:py-20">
        {/* Header */}
        <Reveal delay={0}>
          <p style={EYEBROW} className="mb-8">
            The Partnership
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(1.25rem, 2.2vw, 2.2rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: FOREGROUND,
              margin: 0,
            }}
          >
            Stocking our brands is the start.<br />The marketing is the part no one tells you about.
          </h2>
        </Reveal>

        {/* Three columns */}
        <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
          {BENEFITS.map((b, i) => (
            <Reveal key={b.number} delay={0.1 + i * 0.1}>
              <div>
                <span
                  style={{
                    fontFamily: ARCHIVO,
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    letterSpacing: "0.22em",
                    color: GOLD,
                  }}
                >
                  {b.number}
                </span>

                <h3
                  className="mt-4"
                  style={{
                    fontFamily: ARCHIVO,
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: FOREGROUND,
                    margin: "1rem 0 0",
                  }}
                >
                  {b.title}
                </h3>

                {/* Gold rule */}
                <div
                  className="mt-5 mb-5"
                  style={{
                    width: 28,
                    height: 1,
                    background: GOLD_GRADIENT,
                  }}
                />

                <p
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: "0.975rem",
                    lineHeight: 1.85,
                    color: WARM_GREY,
                    margin: 0,
                  }}
                >
                  {b.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── 3. APPLICATION FORM ──────────────────────────────────────────────────────

import React from "react";

const FormSection = React.forwardRef<HTMLElement>((_, ref) => {
  const [values, setValues] = useState<Record<string, string>>({
    first_name: "",
    last_name: "",
    whatsapp: "",
    email: "",
    store_name: "",
    website: "",
    instagram: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const inputStyle = (field: string): React.CSSProperties => ({
    ...INPUT_BASE,
    borderBottomColor:
      focusedField === field ? GOLD : "rgba(74,69,64,0.2)",
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
      .from("retailer_applications")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        whatsapp: data.whatsapp,
        email: data.email,
        store_name: data.store_name,
        website: data.website || null,
        instagram: data.instagram || null,
      });

    setSubmitting(false);

    if (dbError) {
      if (dbError.code === "23505") {
        setError("An application from this email already exists.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    try {
      await notifyLead({
        data: {
          subject: `New Retailer Application — ${data.store_name}`,
          html: notifHtml('New Retailer Application', 'become-a-retailer', [
            row('Name', `${data.first_name} ${data.last_name}`),
            row('Store', data.store_name),
            row('Email', data.email),
            row('WhatsApp', data.whatsapp),
            row('Website', data.website || null),
            row('Instagram', data.instagram || null),
          ]),
        },
      })
    } catch (e) {
      console.error('[email] notify failed:', e)
    }

    try {
      const { html, text } = retailerConfirmationEmail(data.first_name, data.store_name)
      await confirmSubmitter({
        data: { to: data.email, subject: 'I received your retailer application', html, text },
      })
    } catch (e) {
      console.error('[email] retailer confirmation failed:', e)
    }

    setDone(true);
  };

  return (
    <section
      id="apply"
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: CANVAS }}
    >
      {/* grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Top gold hairline */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(184,144,46,0.3), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[900px] px-8 py-12 md:px-16 md:py-20">
        <Reveal delay={0}>
          <p style={EYEBROW} className="mb-8">
            By Application
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(1.25rem, 2.2vw, 2.2rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: FOREGROUND,
              margin: "0 0 3rem",
            }}
          >
            Apply to become an AVANA retailer
          </h2>
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
              Application received
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
              We'll be in touch.
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
              Every application is reviewed personally.{" "}
              <br />
              If your store is the right fit, you'll hear from us directly on WhatsApp.
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
                  placeholder="you@store.com"
                  value={values.email}
                  onChange={update("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("email")}
                />
              </div>

              {/* Row 3: Store name — full width */}
              <div className="mt-10">
                <FieldBlock
                  id="store_name"
                  label="Store Name"
                  required
                  type="text"
                  autoComplete="organization"
                  value={values.store_name}
                  onChange={update("store_name")}
                  onFocus={() => setFocusedField("store_name")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("store_name")}
                />
              </div>

              {/* Row 4: Website / Instagram */}
              <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12">
                <FieldBlock
                  id="website"
                  label="Website"
                  type="url"
                  autoComplete="url"
                  placeholder="yourstore.com"
                  value={values.website}
                  onChange={update("website")}
                  onFocus={() => setFocusedField("website")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("website")}
                />
                <FieldBlock
                  id="instagram"
                  label="Instagram"
                  type="text"
                  autoComplete="off"
                  placeholder="@yourstore"
                  value={values.instagram}
                  onChange={update("instagram")}
                  onFocus={() => setFocusedField("instagram")}
                  onBlur={() => setFocusedField(null)}
                  inputStyle={inputStyle("instagram")}
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
                    transition: "background-position 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.3s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundPosition = "100% 50%")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundPosition = "0% 50%")
                  }
                >
                  {submitting ? "Submitting…" : "Submit Application"}
                </button>
              </div>

              {/* Closing note */}
              <p
                className="mt-10"
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.78rem",
                  letterSpacing: "0.06em",
                  color: "#A8A29A",
                  lineHeight: 1.7,
                }}
              >
                We partner selectively.<br />Every application is reviewed personally.
              </p>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
});

FormSection.displayName = "FormSection";

// ── Field block helper ───────────────────────────────────────────────────────

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
  labelStyle?: React.CSSProperties;
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
  labelStyle,
}: FieldBlockProps) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle ?? LABEL_STYLE}>
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

// ── 4. RETAILER AI WAITLIST ──────────────────────────────────────────────────

const WAITLIST_LABEL: React.CSSProperties = {
  ...LABEL_STYLE,
  color: "rgba(10,10,5,0.55)",
}

function AiWaitlistSection() {
  const [values, setValues] = useState({ first_name: "", email: "" })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  const inputStyle = (field: string): React.CSSProperties => ({
    ...INPUT_BASE,
    color: FOREGROUND,
    borderBottomColor: focused === field ? FOREGROUND : "rgba(10,10,5,0.25)",
    transition: "border-color 0.3s ease",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const parsed = waitlistSchema.safeParse(values)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.")
      return
    }
    setSubmitting(true)
    const { error: dbError } = await supabase
      .from("retailer_ai_waitlist")
      .insert({ first_name: parsed.data.first_name, email: parsed.data.email })
    setSubmitting(false)
    if (dbError) {
      if (dbError.code === "23505") {
        setError("You're already on the waitlist.")
      } else {
        setError("Something went wrong. Please try again.")
      }
      return
    }
    try {
      await notifyLead({
        data: {
          subject: `New Retailer AI Waitlist — ${parsed.data.first_name}`,
          html: notifHtml("New Retailer AI Waitlist", "become-a-retailer", [
            row("Name", parsed.data.first_name),
            row("Email", parsed.data.email),
          ]),
        },
      })
    } catch (err) {
      console.error("[email] notify failed:", err)
    }

    try {
      const { html, text } = waitlistConfirmationEmail(parsed.data.first_name)
      await confirmSubmitter({
        data: { to: parsed.data.email, subject: "You're on the list", html, text },
      })
    } catch (e) {
      console.error('[email] waitlist confirmation failed:', e)
    }

    setDone(true)
  }

  return (
    <section className="relative w-full overflow-hidden" style={{ background: GOLD_GRADIENT }}>
      {/* grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />

      {/* Top dark hairline — separates from canvas section above */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(10,10,5,0.18), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-[900px] px-8 py-12 md:px-16 md:py-16">
        <Reveal delay={0}>
          <p style={{ ...EYEBROW, color: "rgba(10,10,5,0.55)" }} className="mb-8">
            Early Access
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <h2
            style={{
              fontFamily: ARCHIVO,
              fontWeight: 800,
              fontSize: "clamp(1.1rem, 1.8vw, 1.75rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: FOREGROUND,
              margin: "0 0 1.25rem",
            }}
          >
            I'm building something with AI for the retailers I work with.
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <p
            style={{
              fontFamily: FONT_SANS,
              fontSize: "0.975rem",
              lineHeight: 1.85,
              color: FOREGROUND,
              maxWidth: "52ch",
              margin: "0 0 2.5rem",
            }}
          >
            <span className="block">Tools to help you buy smarter and move faster.</span>
            <span className="block">It's early, and I'm opening it first to the retailers closest to me.</span>
            <span className="block">Add your name if you want to be one of them.</span>
          </p>
        </Reveal>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR_SLOW, ease: EASE_SULTRY }}
          >
            <p
              style={{
                fontFamily: FONT_SANS,
                fontSize: "0.62rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "rgba(10,10,5,0.55)",
                margin: "0 0 12px",
              }}
            >
              You're in
            </p>
            <p
              style={{
                fontFamily: ARCHIVO,
                fontWeight: 700,
                fontSize: "1.15rem",
                letterSpacing: "-0.015em",
                color: FOREGROUND,
                margin: 0,
              }}
            >
              You're on the early-access list. I'll reach out when it's ready.
            </p>
          </motion.div>
        ) : (
          <Reveal delay={0.2}>
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12">
                <FieldBlock
                  id="ai-waitlist-first-name"
                  label="First Name"
                  required
                  type="text"
                  autoComplete="given-name"
                  value={values.first_name}
                  onChange={(e) => setValues((v) => ({ ...v, first_name: e.target.value }))}
                  onFocus={() => setFocused("first_name")}
                  onBlur={() => setFocused(null)}
                  inputStyle={inputStyle("first_name")}
                  labelStyle={WAITLIST_LABEL}
                />
                <FieldBlock
                  id="ai-waitlist-email"
                  label="Email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@store.com"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  inputStyle={inputStyle("email")}
                  labelStyle={WAITLIST_LABEL}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-6"
                  style={{ fontFamily: FONT_SANS, fontSize: "0.82rem", color: "#6B1A0A" }}
                >
                  {error}
                </p>
              )}

              <div className="mt-10">
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: "0.72rem",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: FOREGROUND,
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${FOREGROUND}`,
                    padding: "6px 0",
                    cursor: submitting ? "wait" : "pointer",
                    opacity: submitting ? 0.4 : 1,
                    transition: "opacity 0.3s",
                    borderRadius: 0,
                  }}
                >
                  {submitting ? "Sending..." : "Request early access"}
                </button>
              </div>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  )
}
