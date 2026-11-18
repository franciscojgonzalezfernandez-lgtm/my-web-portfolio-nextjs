"use client";

import parse from "html-react-parser";
import { CustomImage } from "@/components/high-order-components/CustomImage";
import { CustomVideo } from "@/components/high-order-components/CustomVideo";
import type { Project } from "@/interfaces/project.interface";
import { formatProjectDate, projectTypeLabel, useOsLanguage } from "./os-i18n";

const LABELS = {
  english: { type: "Type", released: "Released", stack: "Stack", visit: "Visit site", code: "Source code", gallery: "Gallery" },
  german: { type: "Typ", released: "Veröffentlicht", stack: "Stack", visit: "Website öffnen", code: "Quellcode", gallery: "Galerie" },
} as const;

// Project document shown inside a Finder-opened window (desktop) or a full-screen
// app card (iOS). Content comes straight from data/projects/*.project.data.ts.
export default function ProjectDocument({ project }: { project: Project }) {
  const language = useOsLanguage();
  const isGerman = language === "german";
  const labels = LABELS[language];
  const [cover, ...gallery] = project.images;

  return (
    <article className="project-doc" lang={isGerman ? "de" : "en"}>
      <div className="project-doc-media">
        {project.videoUrl ? (
          <CustomVideo
            src={project.videoUrl}
            poster={project.images[1] ?? cover}
            controls
            playsInline
            muted
            loop
            className="project-doc-video"
            title={project.title}
          />
        ) : cover ? (
          <CustomImage src={cover} alt="" className="project-doc-cover" />
        ) : null}
      </div>

      <header className="project-doc-header">
        <p className="project-doc-kicker">
          <span>{labels.type}: {projectTypeLabel(project.projectType, language)}</span>
          <span aria-hidden="true">·</span>
          <span>{labels.released}: {formatProjectDate(project.releaseDate, language)}</span>
        </p>
        <h2>{isGerman ? project.titleGerman : project.title}</h2>
        <p className="project-doc-lede">
          {isGerman ? project.descriptionGerman : project.description}
        </p>
        {(project.externalUrl || project.gitHubUrl) && (
          <div className="project-doc-links">
            {project.externalUrl && (
              <a href={project.externalUrl} target="_blank" rel="noopener noreferrer">
                {labels.visit} ↗
              </a>
            )}
            {project.gitHubUrl && (
              <a href={project.gitHubUrl} target="_blank" rel="noopener noreferrer">
                {labels.code} ↗
              </a>
            )}
          </div>
        )}
      </header>

      <section className="project-doc-tags" aria-label={labels.stack}>
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </section>

      <div className="project-doc-body">
        {parse(isGerman ? project.fullDescriptionGerman : project.fullDescription)}
      </div>

      {gallery.length > 0 && (
        <section className="project-doc-gallery" aria-label={labels.gallery}>
          {gallery.map((image) => (
            <CustomImage key={image} src={image} alt="" loading="lazy" />
          ))}
        </section>
      )}
    </article>
  );
}
