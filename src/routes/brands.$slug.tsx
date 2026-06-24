import { createFileRoute, Link } from "@tanstack/react-router";
import { AvanaLogo } from "@/components/AvanaLogo";
import { FilmGrain } from "@/components/FilmGrain";
import { CustomCursor } from "@/components/CustomCursor";

export const Route = createFileRoute("/brands/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${formatName(params.slug)} — AVANA Showroom` },
      {
        name: "description",
        content: `${formatName(params.slug)} is part of the AVANA Showroom collective.`,
      },
    ],
  }),
  component: BrandStubPage,
});

function formatName(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function BrandStubPage() {
  const { slug } = Route.useParams();
  const name = formatName(slug);

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ backgroundColor: "#F7F4EF", color: "#0A0A0A" }}
    >
      <FilmGrain />
      <CustomCursor />

      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-8 py-6">
          <Link to="/" aria-label="Back to AVANA Showroom">
            <AvanaLogo size="header" style={{ width: 110 }} />
          </Link>
          <Link
            to="/"
            className="gold-link type-caption"
            style={{ color: "#B8902E" }}
          >
            ← Back
          </Link>
        </div>
      </header>

      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p
          className="mb-6"
          style={{
            color: "#B8902E",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.7rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
          }}
        >
          Agency Brand
        </p>
        <h1
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(2.5rem, 7vw, 6rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            color: "#4A4540",
          }}
        >
          {name}
        </h1>
        <p
          className="mt-8"
          style={{
            color: "#4A4540",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "0.85rem",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            opacity: 0.55,
          }}
        >
          Coming soon
        </p>
      </main>
    </div>
  );
}
