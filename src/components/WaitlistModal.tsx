import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { GOLD, WARM_GREY, CANVAS } from "@/lib/tokens";
import { notifyLead, notifHtml, row, confirmSubmitter, marketHitchConfirmationEmail } from "@/lib/notify";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
  company: z.string().trim().min(1, "Please enter your company").max(160),
});

type Field = "name" | "email" | "company";

export function WaitlistModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState({ name: "", email: "", company: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      // reset after close animation
      const t = setTimeout(() => {
        setValues({ name: "", email: "", company: "" });
        setError(null);
        setDone(false);
        setSubmitting(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  const update = (k: Field) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

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
      .from("market_hitch_waitlist")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        company: parsed.data.company,
      });
    setSubmitting(false);
    if (dbError) {
      if (dbError.code === "23505") {
        setError("You're already on the list.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }
    try {
      await notifyLead({
        data: {
          subject: `New Market Hitch Waitlist — ${parsed.data.name}`,
          html: notifHtml('New Market Hitch Waitlist', 'market-hitch', [
            row('Name', parsed.data.name),
            row('Email', parsed.data.email),
            row('Company', parsed.data.company),
          ]),
        },
      })
    } catch (e) {
      console.error('[email] notify failed:', e)
    }
    try {
      const { html, text } = marketHitchConfirmationEmail(parsed.data.name, 'buyer')
      await confirmSubmitter({
        data: { to: parsed.data.email.toLowerCase(), subject: "you're on the list.", html, text },
      })
    } catch (e) {
      console.error('[email] waitlist confirmation failed:', e)
    }
    setDone(true);
    setTimeout(() => onClose(), 2200);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: `1px solid ${WARM_GREY}33`,
    padding: "14px 0",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "1rem",
    color: WARM_GREY,
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "0.62rem",
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
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* backdrop */}
          <motion.button
            aria-label="Close"
            onClick={onClose}
            className="absolute inset-0"
            style={{ background: "rgba(36, 32, 28, 0.55)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-title"
            className="relative w-full max-w-[560px] mx-auto"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              backgroundColor: CANVAS,
              padding: "clamp(2rem, 5vw, 3.5rem)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close form"
              className="absolute right-5 top-5 p-2 transition-opacity hover:opacity-60"
              style={{ color: WARM_GREY }}
            >
              <X size={18} strokeWidth={1.5} />
            </button>

            <p
              style={{
                color: GOLD,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "0.62rem",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Market Hitch
            </p>
            <h3
              id="waitlist-title"
              className="font-bold"
              style={{
                color: WARM_GREY,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                margin: "14px 0 10px",
              }}
            >
              Join the waitlist.
            </h3>
            <p
              style={{
                color: WARM_GREY,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "0.92rem",
                lineHeight: 1.7,
                opacity: 0.85,
                marginBottom: "2rem",
                maxWidth: "44ch",
              }}
            >
              B2B discovery without the noise — real brands, real buyers, real
              deals. Be first in when we open the doors.
            </p>

            {done ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  color: WARM_GREY,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "1.1rem",
                  lineHeight: 1.6,
                  padding: "1.5rem 0",
                }}
              >
                <span style={{ color: GOLD, letterSpacing: "0.3em", fontSize: "0.6rem", textTransform: "uppercase" }}>
                  Confirmed
                </span>
                <div style={{ marginTop: 12, fontSize: "1.4rem" }}>
                  You're on the list.
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label style={labelStyle} htmlFor="wl-name">Name</label>
                  <input
                    id="wl-name"
                    type="text"
                    autoComplete="name"
                    required
                    value={values.name}
                    onChange={update("name")}
                    style={inputStyle}
                    maxLength={120}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="wl-email">Email</label>
                  <input
                    id="wl-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={values.email}
                    onChange={update("email")}
                    style={inputStyle}
                    maxLength={254}
                  />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="wl-company">Company</label>
                  <input
                    id="wl-company"
                    type="text"
                    autoComplete="organization"
                    required
                    value={values.company}
                    onChange={update("company")}
                    style={inputStyle}
                    maxLength={160}
                  />
                </div>

                {error && (
                  <p
                    role="alert"
                    style={{
                      color: "#B0341E",
                      fontFamily: "Arial, Helvetica, sans-serif",
                      fontSize: "0.82rem",
                      margin: 0,
                    }}
                  >
                    {error}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-xs uppercase transition-opacity hover:opacity-60"
                    style={{
                      color: WARM_GREY,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      letterSpacing: "0.3em",
                      opacity: 0.7,
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="group relative inline-block text-xs uppercase"
                    style={{
                      color: GOLD,
                      fontFamily: "Arial, Helvetica, sans-serif",
                      letterSpacing: "0.32em",
                      background: "none",
                      border: "none",
                      padding: "8px 0",
                      cursor: submitting ? "wait" : "pointer",
                      opacity: submitting ? 0.5 : 1,
                    }}
                  >
                    {submitting ? "Submitting…" : "Join the list"}
                    <span
                      className="absolute left-0 -bottom-0 h-px w-full origin-left transition-transform duration-500 ease-out group-hover:scale-x-100"
                      style={{ backgroundColor: GOLD, transform: "scaleX(0.4)" }}
                    />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
