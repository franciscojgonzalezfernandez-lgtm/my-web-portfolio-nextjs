import Desktop from "@/components/os/desktop";
import RouteContent from "@/components/seo/route-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact - Javier González | Full-Stack Engineer",
  description:
    "Get to know my experience with Next.js, React, Node.js, DevOps, and web optimization. Portfolio with real projects and performance metrics.",
  alternates: {
    canonical: "/contact", // https://javier-gonzalez-portfolio.com/contact
  },
  openGraph: {
    title: "Contanct - Javier González Portfolio",
    description:
      "Contact with a full-stack frontend engineer to build amazing solutions",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "https://javier-gonzalez-portfolio.com/manager.webp",
        width: 1200,
        height: 630,
        alt: "Javier González - Contact",
      },
    ],
  },
};

// Contact is the Mail app on the desktop.
export default function ContactPage() {
  return (
    <>
      <Desktop open={{ kind: "app", app: "mail" }} />
      <RouteContent route="contact" />
    </>
  );
}
