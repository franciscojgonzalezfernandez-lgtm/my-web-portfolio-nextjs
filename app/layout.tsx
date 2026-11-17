import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AnalyticsWrapper } from "@/components/high-order-components/Analytics-wrapper";
import ConsoleArt from "@/components/os/console-art";
import "@/components/os/os.css";
import "@/components/os/startup-screen.css";
import "@/components/os/project-window.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://javier-gonzalez-portfolio.com"),
  title: "Javi - Web Portfolio",
  description:
    "Web portfolio of a full‑stack software engineer, passionate problem solver and performance‑focused developer, crafting fast, reliable and user‑centric web applications.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Javi - Web Portfolio",
    description:
      "Web portfolio of a full‑stack software engineer and technical manager based in Switzerland.",
    url: "https://javier-gonzalez-portfolio.com/",
    type: "website",
    images: [
      {
        url: "https://javier-gonzalez-portfolio.com/manager.webp",
        width: 1200,
        height: 630,
        alt: "Javi Web Portfolio",
      },
    ],
  },
  keywords: [
    "Javier González",
    "Full-Stack Engineer",
    "Next.js developer",
    "React developer",
    "Node.js developer",
    "Frontend engineer",
    "Web performance",
    "DevOps",
    "Software engineer portfolio",
    "Switzerland",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <ConsoleArt />
        {children}
        {gaId ? <AnalyticsWrapper /> : null}
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
