import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { AvanaLogo } from "./AvanaLogo";
import { EASE_SULTRY } from "@/lib/motion";

const NAV_ITEMS = [
  { label: "Our Brands", href: "/#brands", internal: false },
  { label: "Become a Retailer", href: "/become-a-retailer", internal: true },
  { label: "AI by AVANA", href: "/ai-by-avana", internal: true },
  { label: "Consulting", href: "/consulting", internal: true },
  { label: "Meet the Founder", href: "/meet-the-founder", internal: true },
];

// Dark editorial overlay palette
const OVERLAY_BG = "#0A0705";
const CREAM = "#F7F1EC";
const GOLD_HEX = "#B8902E";

export function TopNav({
  alwaysVisible = false,
  showAtEnds = false,
  topThresholdPx,
  background,
  dark = false,
}: {
  alwaysVisible?: boolean;
  showAtEnds?: boolean;
  topThresholdPx?: number;
  background?: string;
  dark?: boolean;
} = {}) {
  const [visible, setVisible] = useState(alwaysVisible || showAtEnds);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (alwaysVisible) return;
    const onScroll = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (showAtEnds) {
        const atTop = y < (topThresholdPx ?? 80);
        const atBottom = y + vh >= document.documentElement.scrollHeight - 200;
        setVisible(atTop || atBottom);
      } else {
        setVisible(y > vh * 2);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [alwaysVisible, showAtEnds, topThresholdPx]);

  // Close menu when nav hides (e.g. user scrolls to a hidden zone)
  useEffect(() => {
    if (!visible) setMenuOpen(false);
  }, [visible]);

  // Prevent body scroll while mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Escape key closes menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Ease shorthand for inline use
  const ease = [...EASE_SULTRY] as [number, number, number, number];

  // Hamburger bar shared transition
  const barTransition = reduce
    ? "none"
    : "transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease, width 0.25s cubic-bezier(0.22,1,0.36,1)";

  if (!visible) return null;

  return (
    <>
      {/* ── Nav bar (desktop + mobile header row) ─────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="fixed inset-x-0 top-0 z-50"
        style={{
          background: menuOpen
            ? OVERLAY_BG
            : (background ?? "color-mix(in oklab, #F7F4EF 78%, transparent)"),
          backdropFilter: menuOpen ? "none" : "blur(4px)",
          WebkitBackdropFilter: menuOpen ? "none" : "blur(4px)",
        }}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-2">
          <Link
            to="/"
            aria-label="AVANA Showroom — home"
            style={{ display: "flex", flex: 1, alignItems: "center" }}
            onClick={closeMenu}
          >
            <AvanaLogo size="header" style={{ width: 160 }} />
          </Link>

          {/* Desktop nav — unchanged */}
          <ul className="hidden md:flex items-center gap-10">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                {item.internal ? (
                  <Link
                    to={item.href as ("/become-a-retailer" | "/ai-by-avana" | "/consulting" | "/meet-the-founder")}
                    className={`nav-link type-caption ${dark ? "text-[#F7F4EF]" : "text-foreground"}`}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a href={item.href} className={`nav-link type-caption ${dark ? "text-[#F7F4EF]" : "text-foreground"}`}>
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Hamburger button — mobile only, 44×44px tap target */}
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex h-11 w-11 flex-shrink-0 items-center justify-center"
            style={{
              color: menuOpen ? CREAM : (dark ? "#F7F4EF" : "#0A0A0A"),
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            <span aria-hidden className="flex flex-col gap-[5px]" style={{ width: 22 }}>
              {/* Top bar → rotates to form top of X */}
              <span
                style={{
                  display: "block",
                  height: 1,
                  backgroundColor: "currentColor",
                  transformOrigin: "center",
                  transition: barTransition,
                  transform: menuOpen ? "translateY(6px) rotate(45deg)" : "none",
                }}
              />
              {/* Middle bar → fades out */}
              <span
                style={{
                  display: "block",
                  height: 1,
                  backgroundColor: "currentColor",
                  transition: barTransition,
                  opacity: menuOpen ? 0 : 1,
                  transform: menuOpen ? "scaleX(0)" : "none",
                }}
              />
              {/* Bottom bar → shorter at rest, full-width + rotates to form bottom of X */}
              <span
                style={{
                  display: "block",
                  height: 1,
                  backgroundColor: "currentColor",
                  transformOrigin: "center",
                  transition: barTransition,
                  width: menuOpen ? "100%" : "72%",
                  transform: menuOpen ? "translateY(-6px) rotate(-45deg)" : "none",
                }}
              />
            </span>
          </button>
        </div>
      </motion.nav>

      {/* ── Mobile menu overlay ───────────────────────────────────────── */}
      {/*
        z-[49]: sits just below the nav bar (z-50) so the hamburger button
        in the nav bar is always accessible and can close the menu.
        FilmGrain at z-[60] renders on top (multiply blend — invisible on
        near-black bg anyway).
      */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
            className="md:hidden fixed inset-0 z-[49] flex flex-col overflow-hidden"
            style={{ backgroundColor: OVERLAY_BG }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease }}
          >
            {/* Spacer that matches the nav bar height so links start below it */}
            <div style={{ height: 52 }} />

            {/* Gold hairline — editorial accent */}
            <div style={{ height: 1, backgroundColor: GOLD_HEX, opacity: 0.3 }} />

            {/* Nav links */}
            <ul className="flex flex-col px-8 pt-4">
              {NAV_ITEMS.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? 0 : 0.42,
                    ease,
                    delay: reduce ? 0 : 0.08 + i * 0.055,
                  }}
                >
                  {item.internal ? (
                    <Link
                      to={item.href as ("/become-a-retailer" | "/ai-by-avana" | "/consulting" | "/meet-the-founder")}
                      onClick={closeMenu}
                      className="flex items-center py-5"
                      style={{ borderBottom: `1px solid rgba(184,144,46,0.18)` }}
                    >
                      <span
                        style={{
                          fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
                          fontWeight: 700,
                          fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
                          letterSpacing: "-0.02em",
                          color: CREAM,
                          lineHeight: 1.1,
                        }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      onClick={closeMenu}
                      className="flex items-center py-5"
                      style={{ borderBottom: `1px solid rgba(184,144,46,0.18)` }}
                    >
                      <span
                        style={{
                          fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
                          fontWeight: 700,
                          fontSize: "clamp(1.75rem, 7vw, 2.25rem)",
                          letterSpacing: "-0.02em",
                          color: CREAM,
                          lineHeight: 1.1,
                        }}
                      >
                        {item.label}
                      </span>
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>

            {/* Bottom wordmark */}
            <div className="mt-auto px-8 pb-10">
              <div style={{ height: 1, backgroundColor: GOLD_HEX, opacity: 0.15, marginBottom: "1.25rem" }} />
              <p
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: `rgba(247,241,236,0.25)`,
                }}
              >
                AVANA SHOWROOM
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
