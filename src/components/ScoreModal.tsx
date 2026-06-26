import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { notifyLead, notifHtml, row } from "@/lib/notify";
import { kickScoreRun } from "@/lib/score-runner";

const NEAR_BLACK = "#0A0A0F";
const GOLD = "#B8902E";
const CREAM = "#F7F4EF";
const CREAM_DIM = "rgba(247,244,239,0.6)";
const FONT_SANS = "Arial, Helvetica, sans-serif";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  storeUrl: z.string().trim().min(1, "Store URL is required").max(500),
});

type ModalType = "ai_visibility" | "shopify_health";
type Field = "firstName" | "email" | "storeUrl";

const COPY: Record<ModalType, { heading: string; line: string }> = {
  ai_visibility: {
    heading: "Your AI Visibility Score",
    line: "See where your store is invisible to AI search and where it is leaking revenue. I will send your report to your inbox.",
  },
  shopify_health: {
    heading: "Your Shopify Health Check",
    line: "Ten checks, one honest score. I will send your result to your inbox.",
  },
};

export function ScoreModal({
  type,
  open,
  onClose,
}: {
  type: ModalType;
  open: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState({ firstName: "", email: "", storeUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { heading, line } = COPY[type];
  const modalId = type === "ai_visibility" ? "score-ai-modal" : "score-health-modal";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setValues({ firstName: "", email: "", storeUrl: "" });
        setError(null);
        setDone(false);
        setSubmitting(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  const update = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues(v => ({ ...v, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setSubmitting(true);
    const { error: dbError } = await supabase
      .from("score_leads")
      .insert({
        first_name: parsed.data.firstName,
        email: parsed.data.email.toLowerCase(),
        store_url: parsed.data.storeUrl,
        type,
      });
    setSubmitting(false);

    // 23505 = duplicate email+type — show success but do not re-run score
    if (dbError && dbError.code !== "23505") {
      setError("Something went wrong. Please try again.");
      return;
    }
    const isDuplicate = dbError?.code === "23505";

    // Internal notification — fires immediately, non-blocking
    const label = type === 'ai_visibility' ? 'AI Visibility Score' : 'Shopify Health Check'
    if (!isDuplicate) {
      try {
        await notifyLead({
          data: {
            subject: `New ${label} Request — ${parsed.data.firstName}`,
            html: notifHtml(`New ${label} Request`, 'ai-by-avana', [
              row('Name', parsed.data.firstName),
              row('Email', parsed.data.email),
              row('Store URL', parsed.data.storeUrl),
              row('Score Type', label),
            ]),
          },
        })
      } catch (e) {
        console.error('[email] notify failed:', e)
      }
    }

    // Show success to user immediately — they are done here
    setDone(true);

    // Kick background score run — skip if duplicate submission
    if (isDuplicate) return;
    kickScoreRun({
      data: {
        firstName: parsed.data.firstName,
        email: parsed.data.email,
        storeUrl: parsed.data.storeUrl,
        type,
      },
    }).catch(e => console.error('[score-runner] kick failed:', e))
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1px solid rgba(184,144,46,0.3)",
    padding: "14px 0",
    fontFamily: FONT_SANS,
    fontSize: "1rem",
    color: CREAM,
    outline: "none",
    transition: "border-color 0.25s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: FONT_SANS,
    fontSize: "0.6rem",
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: GOLD,
    marginBottom: "4px",
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Backdrop */}
          <motion.button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0 w-full h-full cursor-default"
            style={{ background: "rgba(5,5,10,0.82)", border: "none" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalId}
            style={{
              position: "relative",
              zIndex: 1,
              background: NEAR_BLACK,
              border: "1px solid rgba(184,144,46,0.22)",
              padding: "clamp(2rem, 5vw, 3rem)",
              width: "100%",
              maxWidth: "480px",
            }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Gold left rule */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: 2,
                background: "linear-gradient(180deg, #E8C36A, #B8902E)",
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: CREAM_DIM,
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} />
            </button>

            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ paddingLeft: "1rem", paddingTop: "0.25rem" }}
                >
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "0.6rem",
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      color: GOLD,
                      marginBottom: "1rem",
                    }}
                  >
                    You're in
                  </p>
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: CREAM,
                      marginBottom: "0.75rem",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Your report is on its way.
                  </p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", color: CREAM_DIM, lineHeight: 1.7 }}>
                    {type === "shopify_health"
                      ? "I am running your store through ten checks now. Your Health Check score will arrive in your inbox within a few minutes."
                      : "I am scoring your store across five AI visibility dimensions now. Your report will arrive in your inbox within a few minutes."}
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ paddingLeft: "1rem" }}
                >
                  <h2
                    id={modalId}
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
                      fontWeight: 800,
                      color: CREAM,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      marginBottom: "0.6rem",
                    }}
                  >
                    {heading}
                  </h2>
                  <p
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "0.88rem",
                      color: CREAM_DIM,
                      lineHeight: 1.7,
                      marginBottom: "1.75rem",
                    }}
                  >
                    {line}
                  </p>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor={`${modalId}-first-name`} style={labelStyle}>First name</label>
                    <input
                      id={`${modalId}-first-name`}
                      type="text"
                      autoComplete="given-name"
                      placeholder="Your name"
                      value={values.firstName}
                      onChange={update("firstName")}
                      required
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = GOLD; }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = "rgba(184,144,46,0.3)"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor={`${modalId}-email`} style={labelStyle}>Email</label>
                    <input
                      id={`${modalId}-email`}
                      type="email"
                      autoComplete="email"
                      placeholder="you@yourbrand.com"
                      value={values.email}
                      onChange={update("email")}
                      required
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = GOLD; }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = "rgba(184,144,46,0.3)"; }}
                    />
                  </div>

                  <div style={{ marginBottom: "1.75rem" }}>
                    <label htmlFor={`${modalId}-store-url`} style={labelStyle}>Store URL</label>
                    <input
                      id={`${modalId}-store-url`}
                      type="text"
                      autoComplete="url"
                      placeholder="yourbrand.com"
                      value={values.storeUrl}
                      onChange={update("storeUrl")}
                      required
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = GOLD; }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = "rgba(184,144,46,0.3)"; }}
                    />
                  </div>

                  {error && (
                    <p
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: "0.8rem",
                        color: "#FF9A8B",
                        marginBottom: "1rem",
                      }}
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "14px 0",
                      background: submitting ? "rgba(184,144,46,0.5)" : GOLD,
                      border: "none",
                      color: "#05050A",
                      fontFamily: FONT_SANS,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      cursor: submitting ? "default" : "pointer",
                      transition: "background 0.3s ease",
                    }}
                  >
                    {submitting ? "Sending..." : "Send my score →"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
