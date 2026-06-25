import { useRef, useState, Fragment } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import { WaitlistModal } from "./WaitlistModal";
import { GOLD, WARM_GREY, CANVAS } from "@/lib/tokens";
import { Reveal } from "@/components/Reveal";

const MAILTO = "mailto:amanda@avanashowroom.com";

// Generous feathered mask: keeps the face crisp but dissolves the studio
// background on the top, left and bottom edges into the warm canvas.
const PORTRAIT_MASK =
  "radial-gradient(130% 115% at 72% 55%, #000 30%, rgba(0,0,0,0.95) 50%, rgba(0,0,0,0.6) 72%, rgba(0,0,0,0.18) 88%, rgba(0,0,0,0) 100%)";

const HEADLINE_TEXT = "Hi, I'm Amanda.";

function MaskReveal({
  active,
  reduce,
  className,
  style,
}: {
  active: boolean;
  reduce: boolean | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  const words = HEADLINE_TEXT.split(" ");
  return (
    <h2 className={className} style={style} aria-label={HEADLINE_TEXT}>
      {words.map((word, i) => (
        <Fragment key={i}>
        <span
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "bottom",
            paddingBottom: "0.15em",
            marginRight: i === 0 || i === words.length - 1 ? 0 : "0.25em",
          }}
        >
          <motion.span
            style={{ display: "inline-block", willChange: "transform" }}
            initial={reduce ? { y: "0%" } : { y: "110%" }}
            animate={active || reduce ? { y: "0%" } : { y: "110%" }}
            transition={{
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05 + i * 0.1,
            }}
          >
            {word}
          </motion.span>
        </span>
        {i === 0 && <br />}
        </Fragment>
      ))}
    </h2>
  );
}

export function Founder() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const mobileHeadlineRef = useRef<HTMLDivElement>(null);

  const inView = useInView(headlineRef, { once: true, amount: 0.5 });
  const mobileInView = useInView(mobileHeadlineRef, { once: true, amount: 0.15 });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const portraitY = useTransform(scrollYProgress, [0, 1], ["6%", "-6%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["14%", "-14%"]);

  const [waitlistOpen, setWaitlistOpen] = useState(false);


  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: CANVAS }}
    >
      {/* grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* ============ DESKTOP / TABLET ============ */}
      <div className="relative mx-auto hidden md:block max-w-[1500px] px-10 lg:px-16 py-16 lg:py-28">
        <div className="relative grid grid-cols-12 gap-8">
          {/* LEFT COLUMN — headline + body, single connected block */}
          <motion.div
            style={reduce ? undefined : { y: textY }}
            className="col-span-7 relative z-10"
            ref={headlineRef}
          >
            <MaskReveal
              active={inView}
              reduce={reduce}
              className="font-bold"
              style={{
                color: WARM_GREY,
                fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.75rem, 6.5vw, 6.5rem)",
                letterSpacing: "-0.015em",
                lineHeight: 1.0,
                margin: 0,
              }}
            />

            <Reveal
              delay={0.5}
              className="mt-10 max-w-[58ch] space-y-6"
              style={{
                color: WARM_GREY,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "1.125rem",
                lineHeight: 1.85,
              }}
            >
            <p>
              I've spent 16 years in luxury wholesale, moving fashion brands
              into the world's best retailers —{" "}
              <strong className="font-bold whitespace-nowrap">NET-A-PORTER</strong>, Revolve,
                One&amp;Only hotels and beyond. I've sat across the table from
                buyers, built sales strategies from scratch, and generated over{" "}
                <strong className="font-bold">$15M</strong> in wholesale
                revenue for the brands I believe in.
              </p>
              <p>
                But the industry is changing fast, and most brands can't tell
                what's real from what's noise. That's why I started{" "}
                <a
                  href="https://www.thetechoffashion.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: GOLD,
                    fontWeight: 700,
                    textDecoration: "underline",
                    textUnderlineOffset: "0.18em",
                    textDecorationThickness: "1px",
                  }}
                >
                  The Tech of Fashion
                </a>{" "}
                — where I translate what's actually worth knowing in fashion
                tech and AI, and call out what's BS.
              </p>
              <p>
                <strong className="font-bold">AVANA Showroom</strong> is my
                agency. <strong className="font-bold">AI by AVANA</strong> is
                how I help brands build the right systems. And{" "}
                <strong className="font-bold">market hitch</strong> is the
                wholesale infrastructure I wish I'd had — think IG for fashion
                brands and buyers. No influencers, no fluff. B2B discovery
                without the noise: real deals, real connections, real
                transactions.
              </p>
            </Reveal>

            {/* LEFT CTA — Market Hitch waitlist */}
            <Reveal delay={0.8} className="mt-12">
              <button
                type="button"
                onClick={() => setWaitlistOpen(true)}
                className="group relative inline-block text-sm uppercase"
                style={{
                  color: GOLD,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  letterSpacing: "0.28em",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              >
                Get on the waitlist for market hitch
                <span
                  className="absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                  style={{ backgroundColor: GOLD }}
                />
              </button>
            </Reveal>
          </motion.div>

          {/* RIGHT COLUMN — portrait + CTA underneath */}
          <motion.div
            style={reduce ? undefined : { y: portraitY }}
            className="col-span-5 relative"
          >
            <div
              className="relative ml-auto"
              style={{
                width: "min(46vw, 620px)",
                aspectRatio: "3 / 4",
                marginRight: "-2vw",
              }}
            >
              <Reveal delay={0.2} className="relative h-full w-full">
              <div
                className="absolute inset-0"
                style={{
                  WebkitMaskImage: PORTRAIT_MASK,
                  maskImage: PORTRAIT_MASK,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }}
              >
                <motion.img
                  src="/amanda.png"
                  alt="Amanda, founder of AVANA Showroom"
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ scale: 1 }}
                  animate={reduce ? { scale: 1 } : { scale: 1.05 }}
                  transition={{
                    duration: 25,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundColor: CANVAS,
                    mixBlendMode: "multiply",
                    opacity: 0.14,
                  }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    backgroundColor: GOLD,
                    mixBlendMode: "multiply",
                    opacity: 0.05,
                  }}
                />
              </div>
              </Reveal>

              {/* Vertical "MEET THE FOUNDER" spine + gold rule */}
              <Reveal
                delay={0.4}
                aria-hidden={true}
                className="absolute left-[-2.5rem] top-10 flex flex-col items-center gap-5"
              >
                <span
                  style={{
                    color: GOLD,
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: "0.62rem",
                    letterSpacing: "0.42em",
                    textTransform: "uppercase",
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  Meet the Founder
                </span>
                <span
                  style={{
                    display: "inline-block",
                    width: "1px",
                    height: "clamp(80px, 14vw, 180px)",
                    backgroundColor: GOLD,
                    opacity: 0.7,
                  }}
                />
              </Reveal>
            </div>

            {/* CTA — under the portrait, right-aligned */}
            <Reveal delay={0.9} className="mt-10 flex justify-end mr-[-2vw]">
              <a
                href={MAILTO}
                className="group relative inline-block text-sm uppercase"
                style={{
                  color: GOLD,
                  fontFamily: "Arial, Helvetica, sans-serif",
                  letterSpacing: "0.28em",
                }}
              >
                Work with me
                <span
                  className="absolute left-0 -bottom-1 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
                  style={{ backgroundColor: GOLD }}
                />
              </a>
            </Reveal>
          </motion.div>
        </div>
      </div>

      {/* ============ MOBILE ============ */}
      <div className="relative md:hidden px-6 py-24" ref={mobileHeadlineRef}>
        <MaskReveal
          active={mobileInView}
          reduce={reduce}
          className="font-bold"
          style={{
            color: WARM_GREY,
            fontFamily: "'Archivo', Arial, Helvetica, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(2.5rem, 12vw, 4.25rem)",
            letterSpacing: "-0.015em",
            lineHeight: 1.0,
            margin: 0,
          }}
        />

        <Reveal
          delay={0.1}
          className="relative mx-auto mt-10"
          style={{ width: "100%", aspectRatio: "3 / 4" }}
        >
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: PORTRAIT_MASK,
              maskImage: PORTRAIT_MASK,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
            }}
          >
            <img
              src="/amanda.png"
              alt="Amanda, founder of AVANA Showroom"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundColor: CANVAS,
                mixBlendMode: "multiply",
                opacity: 0.14,
              }}
            />
          </div>
        </Reveal>

        <Reveal
          delay={0.15}
          className="mt-10 text-[0.65rem] uppercase"
          style={{ color: GOLD, fontFamily: "Arial, Helvetica, sans-serif", letterSpacing: "0.4em" }}
        >
          Meet the Founder
        </Reveal>

        <Reveal
          delay={0.25}
          className="mt-6 space-y-5"
          style={{
            color: WARM_GREY,
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "1.0625rem",
            lineHeight: 1.85,
          }}
        >
          <p>
            I've spent 16 years in luxury wholesale, moving fashion brands into
            the world's best retailers —{" "}
            <strong className="font-bold">NET-A-PORTER</strong>, Revolve,
            One&amp;Only hotels and beyond. I've sat across the table from
            buyers, built sales strategies from scratch, and generated over{" "}
            <strong className="font-bold">$15M</strong> in wholesale revenue for
            the brands I believe in.
          </p>
          <p>
            But the industry is changing fast, and most brands can't tell what's
            real from what's noise. That's why I started{" "}
            <a
              href="https://www.thetechoffashion.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: GOLD,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "0.18em",
                textDecorationThickness: "1px",
              }}
            >
              The Tech of Fashion
            </a>{" "}
            — where I translate what's actually worth knowing in fashion tech
            and AI, and call out what's BS.
          </p>
          <p>
            <strong className="font-bold">AVANA Showroom</strong> is my agency.{" "}
            <strong className="font-bold">AI by AVANA</strong> is how I help
            brands build the right systems. And{" "}
            <strong className="font-bold">market hitch</strong> is the wholesale
            infrastructure I wish I'd had — think IG for fashion brands and
            buyers. No influencers, no fluff. B2B discovery without the noise:
            real deals, real connections, real transactions.
          </p>
        </Reveal>

        {/* Mobile CTAs — stacked */}
        <Reveal delay={0.4} className="mt-10">
          <button
            type="button"
            onClick={() => setWaitlistOpen(true)}
            className="inline-block text-sm uppercase text-left"
            style={{
              color: GOLD,
              fontFamily: "Arial, Helvetica, sans-serif",
              letterSpacing: "0.28em",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              borderBottom: `1px solid ${GOLD}`,
              paddingBottom: 4,
            }}
          >
            Get on the waitlist for market hitch
          </button>
        </Reveal>

        <Reveal delay={0.55} className="mt-8">
          <a
            href={MAILTO}
            className="inline-block text-sm uppercase"
            style={{
              color: GOLD,
              fontFamily: "Arial, Helvetica, sans-serif",
              letterSpacing: "0.28em",
            }}
          >
            Work with me
          </a>
        </Reveal>
      </div>

      {/* "The Interlude" bridge — desktop only; overlaps mobile CTAs */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center"
        style={{ bottom: "8vh" }}
      >
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="w-px"
            style={{
              height: "11vh",
              background:
                "linear-gradient(to bottom, rgba(184,144,46,0) 0%, rgba(184,144,46,0.85) 55%, rgba(184,144,46,0.25) 100%)",
            }}
          />
          <div
            style={{
              marginTop: "1.25rem",
              color: GOLD,
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.8em",
              textTransform: "uppercase",
              opacity: 0.9,
              paddingLeft: "0.8em",
              whiteSpace: "nowrap",
            }}
          >
            THE STUDIO
          </div>
        </motion.div>
      </div>

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </section>
  );
}
