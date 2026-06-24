export interface Brand {
  slug: string;
  name: string;
  tagline: string;
  image: string;
  href?: string;
}

export const BRANDS: Brand[] = [
  {
    slug: "avana-shades",
    name: "AVANA Shades",
    tagline: "A frame for every character.",
    image: "/brands/avana-shades.jpeg",
  },
  {
    slug: "erika-pena",
    name: "Erika Peña",
    tagline: "Where the resort begins.",
    image: "/brands/erika-pena.png",
    href: "https://www.erikapena.com/",
  },
  {
    slug: "katia-panteli",
    name: "Katia Panteli",
    tagline: "Summer becomes second skin.",
    image: "/brands/katia-panteli.png",
    href: "https://www.katiapanteli.com/",
  },
  {
    slug: "kanzu",
    name: "Kanzu",
    tagline: "Handwoven in Greece.",
    image: "/brands/kanzu.png",
  },
  {
    slug: "mona",
    name: "Mona",
    tagline: "Myth, worn to the water.",
    image: "/brands/mona.png",
    href: "https://monaswims.com/",
  },
  {
    slug: "sadh",
    name: "SĀDH",
    tagline: "Crochet, with an edge.",
    image: "/brands/sadh.png",
    href: "https://www.sadh.online/",
  },
];
