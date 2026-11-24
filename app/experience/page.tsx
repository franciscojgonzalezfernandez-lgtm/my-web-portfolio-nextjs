import Desktop from "@/components/os/desktop";
import RouteContent from "@/components/seo/route-content";
import { FIRST_EXPERIENCE_NOTE_ID } from "@/components/os/notes-data";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experience | Senior FULL STACK engineer",
  description:
    "A summary of my career as full-stack engineer in many projects as a developer, technical lead and project manager.",
  alternates: {
    canonical: "/experience",
  },
  openGraph: {
    title: "Experience - Senior full-stack developer",
    description:
      "A summary of my career as full-stack developer in many projects as a developer, technical lead and project manager.",
    url: "/experience",
    type: "website",
    images: [
      {
        url: "https://javier-gonzalez-portfolio.com/manager.webp",
        width: 1200,
        height: 630,
        alt: "Javier González - Experience",
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

// Experience lives in Notes, one note per job.
export default function ExperiencePage() {
  return (
    <>
      <Desktop open={{ kind: "notes", noteId: FIRST_EXPERIENCE_NOTE_ID }} />
      <RouteContent route="experience" />
    </>
  );
}
