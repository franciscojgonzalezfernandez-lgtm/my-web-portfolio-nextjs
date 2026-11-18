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

// Lives at /desktop until the f-024 cutover; kept out of search results until then.
export const metadata: Metadata = {
  metadataBase: new URL("https://javier-gonzalez-portfolio.com"),
  title: "Javi — Web Portfolio",
  description:
    "The interactive desktop portfolio of Javi, full-stack software engineer based in Switzerland.",
  robots: { index: false, follow: false },
};

export default function OsRootLayout({
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
