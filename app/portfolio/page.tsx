import Desktop from "@/components/os/desktop";
import RouteContent from "@/components/seo/route-content";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects - Javier González | Full-Stack Engineer",
  description:
    "A list of the highlighted projects I've done along my career. A showcase of my experience in many tecnologies as React, Next, Java, Typescript and more.",
  alternates: {
    canonical: "/portfolio", // https://javier-gonzalez-portfolio.com/portfolio
  },
  openGraph: {
    title: "Projects - Javier González Portfolio",
    description:
      "Projects of a Full-stack developer specialized in web performance and scalable architecture.",
    url: "/portfolio",
    type: "website",
    images: [
      {
        url: "https://javier-gonzalez-portfolio.com/manager.webp",
        width: 1200,
        height: 630,
        alt: "Javier González - Portfolio",
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

// The portfolio is the Projects folder in Finder.
export default function PortfolioPage() {
  return (
    <>
      <Desktop open={{ kind: "folder", folder: "projects" }} />
      <RouteContent route="portfolio" />
    </>
  );
}
