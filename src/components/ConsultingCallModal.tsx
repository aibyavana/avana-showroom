import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { z } from "zod";
import {
  getAvailableSlots,
  holdSlot,
  createConsultOrder,
  captureConsultOrder,
} from "@/lib/booking";
import {
  getLocalTimezone,
  groupSlotsByDate,
  formatSlotTime,
  SCHEDULE_CONFIG,
  formatSlot,
} from "@/lib/availability";

const NEAR_BLACK = "#0A0A0F";
const GOLD = "#B8902E";
const CREAM = "#F7F4EF";
const CREAM_DIM = "rgba(247,244,239,0.6)";
const FONT_SANS = "Arial, Helvetica, sans-serif";

const DURATION_OPTIONS = [
  { minutes: 30, label: "30 minutes", price: "$250" },
  { minutes: 60, label: "60 minutes", price: "$500" },
] as const;

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(120),
  email:     z.string().trim().email("Enter a valid email").max(254),
  note:      z.string().max(1000).optional(),
});

type Step = "form" | "slots" | "payment" | "done";

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

export function ConsultingCallModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState({ firstName: "", email: "", note: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<30 | 60>(30);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [holdingSlot, setHoldingSlot] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const paypalRendered = useRef(false);

  const [step, setStep] = useState<Step>("form");
  const localTz = getLocalTimezone();

  const amountDisplay = durationMinutes === 30 ? "$250" : "$500";
  const durLabel = durationMinutes === 30 ? "30-minute" : "60-minute";

  // ── Reset on close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setValues({ firstName: "", email: "", note: "" });
        setFormError(null);
        setDurationMinutes(30);
        setSlots([]);
        setSlotsLoading(false);
        setSlotsError(null);
        setSelectedSlot(null);
        setHoldingSlot(false);
        setSlotError(null);
        setBookingId(null);
        setPaypalLoaded(false);
        setPaypalError(null);
        paypalRendered.current = false;
        setStep("form");
      }, 500);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ── Keyboard / scroll lock ────────────────────────────────────────────────
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

  // ── Load slots ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "slots") return;
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);
    getAvailableSlots({ data: { durationMinutes } })
      .then(res => { setSlots(res.slots); setSlotsLoading(false); })
      .catch(() => { setSlotsError("Could not load available times. Please refresh and try again."); setSlotsLoading(false); });
  }, [step, durationMinutes]);

  // ── Load PayPal SDK ───────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "payment") return;
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    if (!clientId) { setPaypalError("Payment system not configured. Please contact amanda@avanashowroom.com."); return; }
    if (window.paypal) { setPaypalLoaded(true); return; }
    const existing = document.getElementById("paypal-sdk");
    if (existing) { existing.addEventListener("load", () => setPaypalLoaded(true)); return; }
    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
    script.onload = () => setPaypalLoaded(true);
    script.onerror = () => setPaypalError("Failed to load payment form. Please refresh and try again.");
    document.head.appendChild(script);
  }, [step]);

  // ── Render PayPal buttons ─────────────────────────────────────────────────
  useEffect(() => {
    if (!paypalLoaded || !window.paypal || paypalRendered.current || !bookingId) return;
    paypalRendered.current = true;
    window.paypal.Buttons({
      createOrder: async () => {
        const res = await createConsultOrder({ data: { bookingId: bookingId! } });
        return res.orderId;
      },
      onApprove: async (data) => {
        try {
          await captureConsultOrder({
            data: { orderId: data.orderID, bookingId: bookingId!, sourceTier: "Consulting page" },
          });
          setStep("done");
        } catch (e) {
          const msg = e instanceof Error ? e.message : "";
          if (msg === "SLOT_CONFLICT") {
            setPaypalError("That slot was just taken. Please go back and choose another time. Amanda has been notified to issue your refund.");
          } else {
            console.error("[consulting] capture failed:", e);
            setPaypalError("Payment was received but something went wrong. Please email amanda@avanashowroom.com with your order ID.");
          }
        }
      },
      onError: (err) => {
        console.error("[paypal] consulting button error:", err);
        setPaypalError("Something went wrong with the payment. Please try again.");
        paypalRendered.current = false;
      },
    }).render("#consulting-paypal-btn-container");
  }, [paypalLoaded, bookingId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Please check your details.");
      return;
    }
    setStep("slots");
  };

  const handleSlotConfirm = async () => {
    if (!selectedSlot) return;
    setHoldingSlot(true);
    setSlotError(null);
    try {
      const parsed = formSchema.parse(values);
      const res = await holdSlot({
        data: {
          slotTime:        selectedSlot,
          firstName:       parsed.firstName,
          email:           parsed.email,
          note:            parsed.note,
          durationMinutes,
          bookingType:     "consulting",
        },
      });
      setBookingId(res.bookingId);
      setStep("payment");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "SLOT_TAKEN") {
        setSlotError("That slot was just taken. Please choose another time.");
        setSelectedSlot(null);
        setSlotsLoading(true);
        getAvailableSlots({ data: { durationMinutes } })
          .then(r => { setSlots(r.slots); setSlotsLoading(false); })
          .catch(() => setSlotsLoading(false));
      } else {
        setSlotError("Something went wrong. Please try again.");
      }
    } finally {
      setHoldingSlot(false);
    }
  };

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "transparent", border: "none",
    borderBottom: "1px solid rgba(184,144,46,0.3)",
    padding: "14px 0", fontFamily: FONT_SANS, fontSize: "1rem",
    color: CREAM, outline: "none", transition: "border-color 0.25s ease",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: FONT_SANS, fontSize: "0.6rem",
    letterSpacing: "0.32em", textTransform: "uppercase" as const,
    color: GOLD, marginBottom: "4px",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "14px 0", background: GOLD, border: "none",
    color: "#05050A", fontFamily: FONT_SANS, fontSize: "0.72rem", fontWeight: 700,
    letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer",
    transition: "background 0.3s ease",
  };
  const btnDisabled: React.CSSProperties = { ...btnPrimary, background: "rgba(184,144,46,0.5)", cursor: "default" };
  const btnBack: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer",
    fontFamily: FONT_SANS, fontSize: "0.78rem", color: CREAM_DIM,
    padding: "0.75rem 0 0", textDecoration: "underline",
    textDecorationColor: "rgba(247,244,239,0.25)", display: "block",
  };

  const grouped = groupSlotsByDate(slots, localTz);
  const slotAmandaLabel = selectedSlot ? formatSlot(selectedSlot, SCHEDULE_CONFIG.timezone) : "";
  const slotLocalLabel  = selectedSlot ? formatSlot(selectedSlot, localTz) : "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button aria-label="Close" onClick={onClose}
            className="absolute inset-0 w-full h-full cursor-default"
            style={{ background: "rgba(5,5,10,0.82)", border: "none" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          />

          <motion.div role="dialog" aria-modal="true" aria-labelledby="consulting-modal-title"
            style={{
              position: "relative", zIndex: 1, background: NEAR_BLACK,
              border: "1px solid rgba(184,144,46,0.22)",
              padding: "clamp(2rem, 5vw, 3rem)",
              width: "100%",
              maxWidth: step === "slots" ? "580px" : "520px",
              maxHeight: "90vh", overflowY: "auto",
            }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Gold rule */}
            <div aria-hidden style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: 2,
              background: "linear-gradient(180deg, #E8C36A, #B8902E)",
            }} />

            {/* Close */}
            <button onClick={onClose} aria-label="Close" style={{
              position: "absolute", top: "1.25rem", right: "1.25rem",
              background: "none", border: "none", cursor: "pointer",
              color: CREAM_DIM, padding: "4px", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <X size={18} />
            </button>

            <AnimatePresence>

              {/* ── DONE ───────────────────────────────────────────────── */}
              {step === "done" && (
                <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ paddingLeft: "1rem", paddingTop: "0.25rem" }}>
                  <p style={{ ...labelStyle, marginBottom: "1rem" }}>Confirmed</p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "1.1rem", fontWeight: 700, color: CREAM, marginBottom: "0.75rem", letterSpacing: "-0.02em" }}>
                    Your {durLabel} session is booked.
                  </p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", color: CREAM_DIM, lineHeight: 1.7, marginBottom: "0.75rem" }}>
                    {amountDisplay} received. A confirmation and calendar invite are on their way to {values.email}.
                  </p>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", color: CREAM_DIM, lineHeight: 1.7 }}>
                    I will send the call link before we meet.
                  </p>
                </motion.div>
              )}

              {/* ── PAYMENT ────────────────────────────────────────────── */}
              {step === "payment" && (
                <motion.div key="payment" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ paddingLeft: "1rem" }}>
                  <p style={{ ...labelStyle, marginBottom: "0.75rem" }}>
                    Secure checkout &middot; {amountDisplay}
                  </p>
                  <h2 id="consulting-modal-title" style={{
                    fontFamily: FONT_SANS, fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
                    fontWeight: 800, color: CREAM, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "1rem",
                  }}>
                    Lock in your session
                  </h2>

                  {selectedSlot && (
                    <div style={{ background: "rgba(184,144,46,0.08)", borderLeft: `2px solid ${GOLD}`, padding: "12px 16px", marginBottom: "1.25rem" }}>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "0.75rem", color: GOLD, textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 4px" }}>
                        {durLabel} session
                      </p>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "0.95rem", color: CREAM, margin: "0 0 2px", fontWeight: 600 }}>
                        {localTz !== SCHEDULE_CONFIG.timezone ? slotLocalLabel : slotAmandaLabel}
                      </p>
                      {localTz !== SCHEDULE_CONFIG.timezone && (
                        <p style={{ fontFamily: FONT_SANS, fontSize: "0.8rem", color: CREAM_DIM, margin: 0 }}>
                          {slotAmandaLabel} (Vancouver)
                        </p>
                      )}
                    </div>
                  )}

                  {paypalError ? (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", color: "#FF9A8B", lineHeight: 1.6, marginBottom: "1rem" }}>
                      {paypalError}
                    </p>
                  ) : !paypalLoaded ? (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", color: CREAM_DIM, marginBottom: "1rem" }}>
                      Loading payment form...
                    </p>
                  ) : null}

                  <div id="consulting-paypal-btn-container" style={{ minHeight: "45px" }} />

                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.75rem", color: CREAM_DIM, marginTop: "1.25rem", lineHeight: 1.6 }}>
                    Secured by PayPal. {amountDisplay} for your {durLabel} consulting session.
                  </p>

                  <button type="button" style={btnBack} onClick={() => {
                    setStep("slots");
                    setPaypalLoaded(false);
                    setPaypalError(null);
                    paypalRendered.current = false;
                    setBookingId(null);
                  }}>
                    Choose a different time
                  </button>
                </motion.div>
              )}

              {/* ── SLOTS ─────────────────────────────────────────────── */}
              {step === "slots" && (
                <motion.div key="slots" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ paddingLeft: "1rem" }}>
                  <p style={{ ...labelStyle, marginBottom: "0.75rem" }}>Choose a time &middot; {durLabel} &middot; {amountDisplay}</p>
                  <h2 id="consulting-modal-title" style={{
                    fontFamily: FONT_SANS, fontSize: "clamp(1.1rem, 3vw, 1.25rem)",
                    fontWeight: 800, color: CREAM, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "0.4rem",
                  }}>
                    Pick your slot
                  </h2>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.82rem", color: CREAM_DIM, marginBottom: "1.5rem" }}>
                    Times shown in your local timezone ({localTz}).
                  </p>

                  {slotsLoading && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", color: CREAM_DIM }}>Loading available times...</p>
                  )}
                  {slotsError && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.85rem", color: "#FF9A8B" }}>{slotsError}</p>
                  )}
                  {!slotsLoading && !slotsError && grouped.length === 0 && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.9rem", color: CREAM_DIM, lineHeight: 1.7 }}>
                      No times are available right now. Please email amanda@avanashowroom.com to arrange a time directly.
                    </p>
                  )}

                  {grouped.map(({ dateLabel, slots: daySlots }) => (
                    <div key={dateLabel} style={{ marginBottom: "1.25rem" }}>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "0.7rem", color: GOLD, letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                        {dateLabel}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {daySlots.map(iso => {
                          const active = selectedSlot === iso;
                          return (
                            <button key={iso} type="button"
                              onClick={() => { setSelectedSlot(iso); setSlotError(null); }}
                              style={{
                                padding: "0.45rem 0.9rem",
                                background: active ? "rgba(184,144,46,0.15)" : "transparent",
                                border: `1px solid ${active ? GOLD : "rgba(184,144,46,0.28)"}`,
                                cursor: "pointer", fontFamily: FONT_SANS, fontSize: "0.82rem",
                                color: active ? CREAM : CREAM_DIM,
                                transition: "border-color 0.18s, background 0.18s, color 0.18s",
                              }}>
                              {formatSlotTime(iso, localTz)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {slotError && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.8rem", color: "#FF9A8B", marginBottom: "0.75rem" }}>
                      {slotError}
                    </p>
                  )}

                  {selectedSlot && (
                    <div style={{ background: "rgba(184,144,46,0.06)", border: "1px solid rgba(184,144,46,0.2)", padding: "10px 14px", marginBottom: "1rem" }}>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "0.82rem", color: CREAM, margin: 0 }}>
                        Selected: <strong>{formatSlotTime(selectedSlot, localTz)}</strong>
                        {localTz !== SCHEDULE_CONFIG.timezone && (
                          <span style={{ color: CREAM_DIM }}> &nbsp;/ {formatSlotTime(selectedSlot, SCHEDULE_CONFIG.timezone)} Vancouver</span>
                        )}
                      </p>
                    </div>
                  )}

                  <button type="button" onClick={handleSlotConfirm}
                    disabled={!selectedSlot || holdingSlot}
                    style={!selectedSlot || holdingSlot ? btnDisabled : btnPrimary}>
                    {holdingSlot ? "Holding your slot..." : "Continue to payment"}
                  </button>
                  <button type="button" style={btnBack} onClick={() => setStep("form")}>Back</button>
                </motion.div>
              )}

              {/* ── FORM ──────────────────────────────────────────────── */}
              {step === "form" && (
                <motion.form key="form" onSubmit={handleFormSubmit}
                  initial={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ paddingLeft: "1rem" }}>
                  <p style={{ ...labelStyle, marginBottom: "0.75rem" }}>Consulting call</p>
                  <h2 id="consulting-modal-title" style={{
                    fontFamily: FONT_SANS, fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
                    fontWeight: 800, color: CREAM, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "0.55rem",
                  }}>
                    Book a session
                  </h2>
                  <p style={{ fontFamily: FONT_SANS, fontSize: "0.88rem", color: CREAM_DIM, lineHeight: 1.7, marginBottom: "1.75rem" }}>
                    Paid consulting time. Choose your session length and pick a time.
                  </p>

                  {/* Duration selector */}
                  <div style={{ marginBottom: "1.75rem" }}>
                    <p style={{ ...labelStyle, marginBottom: "0.8rem" }}>Session length</p>
                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      {DURATION_OPTIONS.map(opt => {
                        const active = durationMinutes === opt.minutes;
                        return (
                          <button key={opt.minutes} type="button"
                            onClick={() => setDurationMinutes(opt.minutes as 30 | 60)}
                            style={{
                              flex: 1, padding: "0.9rem 0.75rem", textAlign: "center",
                              background: active ? "rgba(184,144,46,0.12)" : "transparent",
                              border: `1px solid ${active ? GOLD : "rgba(184,144,46,0.28)"}`,
                              cursor: "pointer", transition: "border-color 0.18s, background 0.18s",
                            }}>
                            <span style={{ display: "block", fontFamily: FONT_SANS, fontSize: "0.9rem", fontWeight: 700, color: active ? CREAM : CREAM_DIM, marginBottom: "2px" }}>
                              {opt.label}
                            </span>
                            <span style={{ display: "block", fontFamily: FONT_SANS, fontSize: "0.82rem", color: active ? GOLD : CREAM_DIM }}>
                              {opt.price}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <label htmlFor="consulting-first-name" style={labelStyle}>First name</label>
                    <input id="consulting-first-name" type="text" autoComplete="given-name"
                      placeholder="Your name" value={values.firstName}
                      onChange={e => setValues(v => ({ ...v, firstName: e.target.value }))}
                      required style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = GOLD; }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = "rgba(184,144,46,0.3)"; }} />
                  </div>

                  <div style={{ marginBottom: "1.75rem" }}>
                    <label htmlFor="consulting-email" style={labelStyle}>Email</label>
                    <input id="consulting-email" type="email" autoComplete="email"
                      placeholder="you@yourbrand.com" value={values.email}
                      onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
                      required style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = GOLD; }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = "rgba(184,144,46,0.3)"; }} />
                  </div>

                  <div style={{ marginBottom: "1.75rem" }}>
                    <label htmlFor="consulting-note" style={labelStyle}>What do you want to work on? (optional)</label>
                    <textarea id="consulting-note" rows={3}
                      placeholder="Brand, stage, specific questions..."
                      value={values.note}
                      onChange={e => setValues(v => ({ ...v, note: e.target.value }))}
                      style={{
                        width: "100%", background: "transparent",
                        border: "1px solid rgba(184,144,46,0.3)", padding: "10px 12px",
                        fontFamily: FONT_SANS, fontSize: "0.9rem", color: CREAM, outline: "none",
                        resize: "vertical", minHeight: "72px", boxSizing: "border-box",
                        transition: "border-color 0.25s ease",
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(184,144,46,0.3)"; }} />
                  </div>

                  {formError && (
                    <p style={{ fontFamily: FONT_SANS, fontSize: "0.8rem", color: "#FF9A8B", marginBottom: "1rem" }}>
                      {formError}
                    </p>
                  )}

                  <button type="submit" style={btnPrimary}>
                    Choose a time
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
