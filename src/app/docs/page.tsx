import { DocsPage } from "@/views/Docs";

export const metadata = {
  title: "SpaceLinear | Docs & Pitch Deck",
  description:
    "Comprehensive documentation, pitch deck, and live system overview for SpaceLinear — the AI-powered spaced repetition learning platform.",
  openGraph: {
    title: "SpaceLinear — Docs & Pitch Deck",
    description:
      "Learn about SpaceLinear: our AI-powered spaced repetition platform, technical architecture, team, and vision.",
    type: "website",
  },
};

export default function DocsRoute() {
  return <DocsPage />;
}
