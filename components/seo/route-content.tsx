import parse from "html-react-parser";

import { LIGHTHOUSE, METRICS_DATA } from "@/data/metrics.data";
import { projects } from "@/data/projects.data";
import { buildNoteFolders, type Note } from "@/components/os/notes-data";

// Server-rendered, crawlable copy of what each route opens on the desktop.
//
// The desktop (components/os/desktop.tsx) draws its windows on the client, so
// the static HTML of every route used to be the same empty shell. This article
// ships the real content of the route in the export: its own <h1>, the text
// the window shows, and plain <a href> links to every section and project.
// It is visually hidden (the desktop is the UI) but stays in the accessibility
// tree, so screen readers get a linear version of the same content.
//
// English only: it matches the <title>, description and canonical of every
// route, which are English too.

export type RouteContentProps =
  | { route: "home" | "about" | "experience" | "portfolio" | "contact" | "metrics" }
  | { route: "project"; slug: string };

const SITE_NAME = "Javier González — Full-Stack Software Engineer";
const LINKEDIN_URL = "https://www.linkedin.com/in/fjgonzalezfernandez/";
const GITHUB_URL = "https://github.com/franciscojgonzalezfernandez-lgtm";

const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About me" },
  { href: "/experience", label: "Experience" },
  { href: "/portfolio", label: "Projects" },
  { href: "/metrics", label: "Performance metrics" },
  { href: "/contact", label: "Contact" },
] as const;

const stripTags = (html: string) => html.replace(/<[^>]+>/g, "");

const folders = () => buildNoteFolders("english");
const folderNotes = (id: string) => folders().find((folder) => folder.id === id)?.notes ?? [];

function NoteSection({ note, level = 2 }: { note: Note; level?: 2 | 3 }) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section>
      <Heading>{note.title}</Heading>
      {note.meta && <p>{note.meta}</p>}
      {note.paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {note.bullets && note.bullets.length > 0 && (
        <ul>
          {note.bullets.map((bullet, index) => (
            <li key={index}>{bullet}</li>
          ))}
        </ul>
      )}
      {note.links && note.links.length > 0 && (
        <ul>
          {note.links.map((link, index) => (
            <li key={index}>
              <a href={link.project ? `/portfolio/${link.project}` : link.url}>{link.label}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProjectList() {
  return (
    <ul>
      {projects.map((project) => (
        <li key={project.slug}>
          <a href={`/portfolio/${project.slug}`}>{project.title}</a>
          {" — "}
          {project.description}
        </li>
      ))}
    </ul>
  );
}

function Body(props: RouteContentProps) {
  switch (props.route) {
    case "home": {
      const [professional] = folderNotes("about");
      return (
        <>
          <h1>{SITE_NAME}</h1>
          {professional?.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <h2>Selected projects</h2>
          <ProjectList />
        </>
      );
    }
    case "about":
      return (
        <>
          <h1>About Javier González</h1>
          {[...folderNotes("about"), ...folderNotes("hobbies")].map((note) => (
            <NoteSection key={note.id} note={note} />
          ))}
        </>
      );
    case "experience":
      return (
        <>
          <h1>Experience — Javier González</h1>
          {folderNotes("experience").map((note) => (
            <NoteSection key={note.id} note={note} />
          ))}
        </>
      );
    case "portfolio":
      return (
        <>
          <h1>Projects by Javier González</h1>
          <ProjectList />
        </>
      );
    case "contact":
      return (
        <>
          <h1>Contact Javier González</h1>
          <p>
            Write to me through the Mail app on this site, or find me on LinkedIn and GitHub.
          </p>
          <ul>
            <li>
              <a href={LINKEDIN_URL}>LinkedIn</a>
            </li>
            <li>
              <a href={GITHUB_URL}>GitHub</a>
            </li>
          </ul>
        </>
      );
    case "metrics":
      return (
        <>
          <h1>{`${METRICS_DATA.title} — web performance metrics`}</h1>
          <p>{METRICS_DATA.subtitle}</p>
          <h2>{METRICS_DATA.title2}</h2>
          <p>{stripTags(METRICS_DATA.subtitle2)}</p>
          <h2>Lighthouse scores</h2>
          <ul>
            {LIGHTHOUSE.map((metric) => (
              <li key={metric.name}>
                {`${metric.name}: ${metric.score}`}
              </li>
            ))}
          </ul>
        </>
      );
    case "project": {
      const project = projects.find((candidate) => candidate.slug === props.slug);
      if (!project) return null;
      return (
        <>
          <h1>{project.title}</h1>
          <p>{project.description}</p>
          <p>
            {project.projectType} · {project.releaseDate} · {project.tags.join(", ")}
          </p>
          {/* fullDescription is author-controlled HTML from data/projects/*, same as the project window renders. */}
          <div>{parse(project.fullDescription)}</div>
          <ul>
            {project.externalUrl && (
              <li>
                <a href={project.externalUrl}>Live site</a>
              </li>
            )}
            {project.gitHubUrl && (
              <li>
                <a href={project.gitHubUrl}>Source code</a>
              </li>
            )}
          </ul>
          <h2>More projects</h2>
          <ProjectList />
        </>
      );
    }
  }
}

export default function RouteContent(props: RouteContentProps) {
  return (
    <article className="sr-only" lang="en">
      <Body {...props} />
      <nav aria-label="Site sections">
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.href}>
              <a href={section.href}>{section.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </article>
  );
}
