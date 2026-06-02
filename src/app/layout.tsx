import "./global.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "SpaceLinear",
  description:
    "Master any hard skills, topics through repetitive study and revision using SpaceLinear",
  authors: [{ name: "Lovable" }],
  openGraph: {
    type: "website",
    title: "SpaceLinear",
    description:
      "Master any hard skills, topics through repetitive study and revision using SpaceLinear",
    images: [
      {
        url: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c8f5142f-384f-4d94-8a28-def13f6b705b",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Lovable",
    title: "SpaceLinear",
    description:
      "Master any hard skills, topics through repetitive study and revision using SpaceLinear",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function() {
            var theme = localStorage.getItem('sl-theme');
            if (!theme) theme = 'dark';
            var resolved = theme;
            if (theme === 'system') {
              resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.classList.add(resolved);
          })();`}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
