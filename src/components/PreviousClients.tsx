import { motion } from "framer-motion";
import { EASE_SULTRY, DUR_SLOW, DUR_HOVER, DELAY_WITHHOLD } from "@/lib/motion";
import { GOLD } from "@/lib/tokens";

// ── Tunables ─────────────────────────────────────────────────────────────
const LOGO_HEIGHT = 52;  // px — bounding box; mask-size:contain scales within
const LOGO_WIDTH  = 160; // px

const SILVER = "linear-gradient(135deg, #E8E8E8 0%, #A8A8A8 30%, #D4D4D4 65%, #909090 100%)";
// ─────────────────────────────────────────────────────────────────────────

const CLIENTS = [
  { name: "Andrea Iyamah",    src: "/clients/andrea-iyamah.png",    href: "https://www.andreaiyamah.com/" },
  { name: "Anna Kosturova",   src: "/clients/anna-kosturova.png",   href: "https://annakosturova.com/" },
  { name: "Camilla",          src: "/clients/camilla.png",          href: "https://ca.camilla.com/" },
  { name: "Capittana",        src: "/clients/capittana.svg",        href: "https://capittana.com/" },
  { name: "Minimale Animale", src: "/clients/minimale-animale.png", href: "https://minimaleanimale.com/" },
];

export function PreviousClients() {
  return (
    <section id="brands" className="relative w-full" style={{ backgroundColor: "#F7F4EF" }}>
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-12 md:py-24 lg:px-20">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: DUR_SLOW, ease: EASE_SULTRY }}
          className="mb-16 text-center md:mb-24"
          style={{
            color: GOLD,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          Previous Clients
        </motion.p>

        <ul className="flex items-center justify-between">
          {CLIENTS.map(({ name, src, href }, i) => (
            <motion.li
              key={name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 0.85, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: DUR_SLOW,
                ease: EASE_SULTRY,
                delay: DELAY_WITHHOLD + i * 0.12,
              }}
              whileHover={{ opacity: 1, transition: { duration: DUR_HOVER, ease: EASE_SULTRY } }}
              className="select-none"
              style={{ flexShrink: 0 }}
            >
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                style={{
                  display: "block",
                  width: LOGO_WIDTH,
                  height: LOGO_HEIGHT,
                  background: SILVER,
                  WebkitMaskImage: `url(${src})`,
                  maskImage: `url(${src})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  maskMode: "alpha",
                }}
              />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
