import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { createPayPalOrder, capturePayPalOrder } from "@/lib/paypal";
import { notifyLead, notifHtml, row } from "@/lib/notify";

const NEAR_BLACK = "#0A0A0F";
const GOLD = "#B8902E";
const CREAM = "#F7F4EF";
const CREAM_DIM = "rgba(247,244,239,0.6)";
const FONT_SANS = "Arial, Helvetica, sans-serif";

const schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(254),
});

type Field = "firstName" | "email";
type Step = "form" | "payment" | "done";

declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError: (err: unknown) => void;
      }) => { render: (selector: string) => void };
    };
  }
}

export function DiyAuditModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState({ firstName: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypalRendered = useRef(false);

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
        setValues({ firstName: "", email: "" });
        setError(null);
        setStep("form");
        setLeadId(null);
        setBuyerEmail("");
        setSubmitting(false);
        setPaypalLoaded(false);
        setPaypalError(null);
        paypalRendered.current = false;
      }, 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Load PayPal SDK when on payment step
  useEffect(() => {
    if (step !== "payment") return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) {
      setPaypalError("Payment system not configured. Please contact us directly.");
      return;
    }
    if (window.paypal) {
      setPaypalLoaded(true);
      return;
    }
    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      existing.addEventListener("load", () => setPaypalLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setPaypalError("Failed to load payment form. Please refresh and try again.");
    document.head.appendChild(script);
  }, [step]);

  // Render PayPal buttons once SDK is loaded
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || paypalRendered.current || !leadId) return;
    paypalRendered.current = true;

    window.paypal.Buttons({
      createOrder: async () => {
        const result = await createPayPalOrder({ data: { leadId: leadId! } });
        return result.orderId;
      },
      onApprove: async (data) => {
        try {
          const result = await capturePayPalOrder({ data: { orderId: data.orderID, leadId: leadId! } });
          setBuyerEmail(result.email);
          setStep("done");
        } catch (e) {
          console.error("[paypal] capture failed:", e);
          setPaypalError("Payment was received but something went wrong on our end. Please email amanda@avanashowroom.com with your order ID.");
        }
      },
      onError: (err) => {
        console.error("[paypal] button error:", err);
        setPaypalError("Something went wrong with the payment. Please try again.");
        paypalRendered.current = false;
      },
    }).render("#paypal-btn-container");
  }, [paypalLoaded, leadId]);

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

    const newLeadId = crypto.randomUUID();
    const { error: dbError } = await supabase
      .from("audit_kit_leads")
      .insert({
        id: newLeadId,
        first_name: parsed.data.firstName,
        email: parsed.data.email.toLowerCase(),
      });

    setSubmitting(false);

    if (dbError) {
      if (dbError.code === "23505") {
        setError("It looks like you already signed up. If you haven't completed payment, please contact amanda@avanashowroom.com.");
        return;
      }
      setError("Something went wrong. Please try again.");
      return;
    }

    // Non-blocking — unpaid/abandoned leads still surfaced to Amanda
    // Follow-up nudge sequence can be wired to audit_kit_leads WHERE paid=false in future
    try {
      await notifyLead({
        data: {
          subject: `Kit lead (not yet paid) — ${parsed.data.firstName} ${parsed.data.email}`,
          html: notifHtml('DIY Kit Lead — Not Yet Paid', 'ai-by-avana', [
            row('Name', parsed.data.firstName),
            row('Email', parsed.data.email),
            row('Status', 'Form submitted — payment not completed'),
          ]),
        },
      })
    } catch (e) {
      console.error('[email] kit lead notify failed:', e)
    }

    setLeadId(newLeadId);
    setBuyerEmail(parsed.data.email.toLowerCase());
    setStep("payment");
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
            aria-labelledby="diy-modal-title"
            style={{
              position: "relative",
              zIndex: 1,
              background: NEAR_BLACK,
              border: "1px solid rgba(184,144,46,0.22)",
              padding: "clamp(2rem, 5vw, 3rem)",
              width: "100%",
              maxWidth: step === "payment" ? "520px" : "480px",
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

            <AnimatePresence>
              {/* ── STEP: done ─────────────────────────────────────────── */}
              {step === "done" ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ paddingLeft: "1rem", paddingTop: "0.25rem" }}
                >
                  <p style={{ ...labelStyle, marginBottom: "1rem" }}>Payment received</p>
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
                    Your kit is on its way.
                  </p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", color: CREAM_DIM, lineHeight: 1.7 }}>
                    I sent it to {buyerEmail}. Check your inbox — if it doesn't arrive within a few minutes, check spam or reply to this order confirmation.
                  </p>
                </motion.div>

              ) : step === "payment" ? (
                /* ── STEP: payment ───────────────────────────────────────── */
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ paddingLeft: "1rem" }}
                >
                  <p style={{ ...labelStyle, marginBottom: "0.75rem" }}>Secure checkout — $297</p>
                  <h2
                    id="diy-modal-title"
                    style={{
                      fontFamily: FONT_SANS,
                      fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
                      fontWeight: 800,
                      color: CREAM,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.2,
                      marginBottom: "1.5rem",
                    }}
                  >
                    Complete your purchase
                  </h2>

                  {paypalError ? (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", color: "#FF9A8B", lineHeight: 1.6 }}>
                      {paypalError}
                    </p>
                  ) : !paypalLoaded ? (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", color: CREAM_DIM }}>
                      Loading payment form...
                    </p>
                  ) : null}

                  <div id="paypal-btn-container" style={{ minHeight: "45px" }} />

                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.75rem", color: CREAM_DIM, marginTop: "1.25rem", lineHeight: 1.6 }}>
                    Secured by PayPal. This $297 credits toward a full store audit with me directly.
                  </p>
                </motion.div>

              ) : (
                /* ── STEP: form ──────────────────────────────────────────── */
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ paddingLeft: "1rem" }}
                >
                  <p style={{ ...labelStyle, marginBottom: "0.75rem" }}>$297</p>
                  <h2
                    id="diy-modal-title"
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
                    Get the DIY Store Audit Kit
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
                    $297, and it credits toward your store fix. Tell me where to send it and I'll get you set up.
                  </p>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="diy-first-name" style={labelStyle}>First name</label>
                    <input
                      id="diy-first-name"
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

                  <div style={{ marginBottom: "1.75rem" }}>
                    <label htmlFor="diy-email" style={labelStyle}>Email</label>
                    <input
                      id="diy-email"
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
                    {submitting ? "Saving..." : "Continue to Payment"}
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
