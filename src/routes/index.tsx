import { createFileRoute } from "@tanstack/react-router";
import { FilmGrain } from "@/components/FilmGrain";
import { CustomCursor } from "@/components/CustomCursor";
import { TopNav } from "@/components/TopNav";
import { ZoomThrough } from "@/components/ZoomThrough";
import { HeroIntro } from "@/components/HeroIntro";
import { Founder } from "@/components/Founder";
import { Interstitial } from "@/components/Interstitial";
import { BrandsGallery } from "@/components/BrandsGallery";
import { PreviousClients } from "@/components/PreviousClients";
import { Insider } from "@/components/Insider";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AVANA Showroom — Luxury Fashion Wholesale" },
      { name: "description", content: "The future of luxury wholesale. Moving the world's most coveted resortwear brands into the world's best retailers." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://avanashowroom.com/" },
      { property: "og:title", content: "AVANA Showroom — Luxury Fashion Wholesale" },
      { property: "og:description", content: "The future of luxury wholesale. Moving the world's most coveted resortwear brands into the world's best retailers." },
      { property: "og:image", content: "https://avanashowroom.com/avana-logo.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AVANA Showroom — Luxury Fashion Wholesale" },
      { name: "twitter:description", content: "The future of luxury wholesale. Moving the world's most coveted resortwear brands into the world's best retailers." },
      { name: "twitter:image", content: "https://avanashowroom.com/avana-logo.png" },
    ],
    links: [
      { rel: "canonical", href: "https://avanashowroom.com/" },
    ],
  }),
  component: Index,
});

const ORG_SCHEMA = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "AVANA Showroom",
  "url": "https://avanashowroom.com",
  "logo": "https://avanashowroom.com/avana-logo.png",
  "description": "Luxury fashion wholesale showroom representing the world's most coveted resortwear brands.",
  "founder": {
    "@type": "Person",
    "name": "Amanda Vanas",
    "url": "https://avanashowroom.com/meet-the-founder"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "amanda@avanashowroom.com",
    "contactType": "customer service"
  }
});

function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ORG_SCHEMA }} />
      <FilmGrain />
      <CustomCursor />
      <TopNav />
      <ZoomThrough />
      <HeroIntro />
      <Founder />
      <Interstitial />
      <BrandsGallery />
      <PreviousClients />
      <Insider />
    </div>
  );
}
