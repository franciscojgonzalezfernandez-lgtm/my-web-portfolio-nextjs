import Desktop from "@/components/os/desktop";
import RouteContent from "@/components/seo/route-content";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects.data";

import { Metadata } from "next";

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return {
      title: "Project | Javi",
      description: "Project not found",
    };
  }

  const keywords = [
    "fullstack development",
    "frontend engineer",
    "switzerland",
    "nextjs",
    "web development",
    ...project.tags.map((t) => t.toLowerCase()),
  ]
    .filter(Boolean)
    .slice(0, 20);

  return {
    title: `${project.title} | Javi`,
    description: project.description,
    keywords,
    alternates: {
      canonical: `/portfolio/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} | Javi`,
      description:
        project.description +
        ". Designed and implemented with: " +
        project.tags.join(", ") +
        ".",
      url: `/portfolio/${project.slug}`,
      type: "article",
      images: project.images?.[0]
        ? [
            {
              url: project.images[0],
              alt: project.title,
            },
          ]
        : undefined,
    },
  };
}

// Each project opens in its own window on the desktop.
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!projects.some((project) => project.slug === slug)) {
    notFound();
  }
  return (
    <>
      <Desktop open={{ kind: "project", slug }} />
      <RouteContent route="project" slug={slug} />
    </>
  );
}
