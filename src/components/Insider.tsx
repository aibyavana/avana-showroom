import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { notifyLead, notifHtml, row } from "@/lib/notify";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(254),
});

export function Insider() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    const { error: dbError } = await supabase
      .from("insider_subscribers")
      .insert({ email: parsed.data.email.toLowerCase() });
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
          subject: `New Insider Subscriber — ${parsed.data.email}`,
          html: notifHtml('New Insider Subscriber', 'home', [
            row('Email', parsed.data.email),
          ]),
        },
      })
    } catch (e) {
      console.error('[email] notify failed:', e)
    }
    setSubmitted(true);
    toast.success("You're on the list.");
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section className="relative w-full">
      {/* Gradient lead-in from warm canvas into the dark moment */}
      <div
        aria-hidden
        className="w-full"
        style={{
          height: "12vh",
          background: "linear-gradient(to bottom, #F7F4EF, #0A0A0A)",
        }}
      />
      <div className="w-full" style={{ backgroundColor: "#0A0A0A" }}>
        <div className="mx-auto max-w-[900px] px-6 pt-16 pb-16 md:px-12 md:pt-28 md:pb-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
            style={{
              color: "#B8902E",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            Your Invitation To
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            style={{
              color: "#F7F4EF",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2.25rem, 5.5vw, 4.5rem)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            BECOME AN INSIDER
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="mx-auto mt-8 max-w-[52ch]"
            style={{
              color: "#A8A29A",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "0.95rem",
              lineHeight: 1.85,
            }}
          >
            First access to brand drops, exclusive collections, and the quiet news
            of new territory openings. We write rarely. We write well.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.32 }}
            onSubmit={handleSubmit}
            className="mx-auto mt-14 flex max-w-[520px] flex-col items-stretch gap-6 md:flex-row md:items-end md:gap-8"
          >
            <label className="relative flex-1 text-left">
              <span
                className="block pb-2"
                style={{
                  color: "#6B655C",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                }}
              >
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@brand.com"
                className="w-full bg-transparent pb-3 outline-none"
                style={{
                  color: "#F7F4EF",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "1rem",
                  borderBottom: "1px solid #2E2A24",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={submitting || submitted}
              className="group relative shrink-0 overflow-hidden px-8 py-3"
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "0.72rem",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "#0A0A0A",
                background:
                  "linear-gradient(135deg, #6B4F18 0%, #B8902E 30%, #E8C36A 50%, #D4AF37 70%, #8C6D1F 100%)",
                backgroundSize: "200% 100%",
                backgroundPosition: "0% 50%",
                transition: "background-position 0.9s cubic-bezier(0.22,1,0.36,1)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundPosition = "100% 50%")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundPosition = "0% 50%")
              }
            >
              {submitted ? "Subscribed" : submitting ? "Submitting…" : "Sign Up"}
            </button>
          </motion.form>

          {error && (
            <p
              role="alert"
              className="mt-5 text-center"
              style={{
                color: "#B0341E",
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "0.82rem",
              }}
            >
              {error}
            </p>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.4, delay: 0.5 }}
            className="mt-10"
            style={{
              color: "#5A554D",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            No noise. Unsubscribe anytime.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
