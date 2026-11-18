"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { projects } from "@/data/projects.data";
import { experiences } from "@/data/experiences.data";
import { useLanguageStore } from "@/stores/useLanguageStore";
import MatrixRain from "./matrix-rain";

export const GITHUB_USER = "franciscojgonzalezfernandez-lgtm";
const GITHUB_PROFILE = `https://github.com/${GITHUB_USER}`;
const ACTIVITY_GRAPH = `https://github-readme-activity-graph.vercel.app/graph?username=${GITHUB_USER}&theme=github-compact`;
const PROMPT_HOST = "javi@MacBook-Pro";

// Things the terminal can open on the desktop. The desktop maps them to windows.
export type TerminalTarget =
  | "projects"
  | "cv"
  | "certifications"
  | "notes"
  | "mail"
  | "photos"
  | "youtube"
  | "spotify"
  | "intro"
  | { project: string };

type Line = { id: number; kind: "input" | "output"; content: ReactNode };

type GitHubEvent = {
  type: string;
  repo: { name: string };
  created_at: string;
  // GitHub trimmed public event payloads in 2025: pushes carry ref/head, not commits.
  payload: {
    ref?: string | null;
    head?: string;
    ref_type?: string;
    action?: string;
    number?: number;
  };
};

const OPEN_TARGETS: Record<string, TerminalTarget> = {
  projects: "projects",
  cv: "cv",
  "cv.pdf": "cv",
  certifications: "certifications",
  notes: "notes",
  about: "notes",
  mail: "mail",
  contact: "mail",
  photos: "photos",
  youtube: "youtube",
  spotify: "spotify",
  intro: "intro",
  "intro.mov": "intro",
};

const HELP: Array<[string, string]> = [
  ["help", "list commands"],
  ["whoami", "who is Javi"],
  ["neofetch", "system information"],
  ["ls [projects]", "list the desktop or the projects"],
  ["open <name>", "open projects, cv, notes, mail, photos, youtube, intro or a project slug"],
  ["git log", "latest public GitHub activity"],
  ["github", "contribution graph"],
  ["lang en|de", "switch the site language"],
  ["date", "print the date"],
  ["echo <text>", "print text"],
  ["clear", "clear the screen"],
  ["exit", "close the terminal"],
];

const formatAgo = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
};

const GitLog = () => {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "ready"; entries: string[] }
  >({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<GitHubEvent[]>;
      })
      .then((events) => {
        const entries = events.flatMap((event) => {
          const repo = event.repo.name.split("/")[1] ?? event.repo.name;
          const when = formatAgo(event.created_at);
          const branch = (event.payload.ref ?? "").replace("refs/heads/", "");
          if (event.type === "PushEvent") {
            const sha = (event.payload.head ?? "").slice(0, 7).padEnd(7);
            return [`${sha}  ${repo.padEnd(26)} push to ${branch}  (${when})`];
          }
          if (event.type === "CreateEvent") {
            const what = event.payload.ref_type === "repository" ? "new repository" : `new ${event.payload.ref_type} ${branch}`;
            return [`+       ${repo.padEnd(26)} ${what}  (${when})`];
          }
          if (event.type === "PullRequestEvent") {
            return [`#${String(event.payload.number ?? "").padEnd(6)} ${repo.padEnd(26)} PR ${event.payload.action ?? ""}  (${when})`];
          }
          if (event.type === "PullRequestReviewEvent") {
            return [`#${String(event.payload.number ?? "").padEnd(6)} ${repo.padEnd(26)} review  (${when})`];
          }
          return [];
        });
        setState({ status: "ready", entries: entries.slice(0, 12) });
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError") setState({ status: "error" });
      });
    return () => controller.abort();
  }, []);

  if (state.status === "loading") return <span className="term-dim">Fetching github.com/{GITHUB_USER}…</span>;
  if (state.status === "error" || state.entries.length === 0) {
    return (
      <span>
        Could not reach the GitHub API (rate limit?). See{" "}
        <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
          {GITHUB_PROFILE}
        </a>
      </span>
    );
  }
  return (
    <span className="term-pre">
      {state.entries.map((entry, index) => (
        <span key={`${index}-${entry}`} className="term-log-line">
          <span className="term-yellow">{entry.slice(0, 7)}</span>
          {entry.slice(7)}
        </span>
      ))}
    </span>
  );
};

const Neofetch = () => {
  const years = new Date().getFullYear() - 2017;
  const rows: Array<[string, string]> = [
    ["OS", "JaviOS (macOS-style) on Next.js"],
    ["Host", "javier-gonzalez-portfolio.com"],
    ["Role", "Full-stack engineer & technical manager"],
    ["Uptime", `${years}+ years shipping software`],
    ["Shell", "zsh 5.9"],
    ["Languages", "English, German, Spanish"],
    ["Stack", "React, Next.js, TypeScript, Node.js, Java"],
    ["Projects", String(projects.length)],
    ["Jobs", String(experiences.length)],
    ["Location", "Switzerland"],
  ];
  return (
    <span className="term-neofetch">
      <span className="term-logo" aria-hidden="true">
        {"       .:'\n    __ :'__\n .'`  `-'  ``.\n:          .-'\n:         :\n :         `-;\n  `.__.-.__.'"}
      </span>
      <span className="term-pre">
        <span className="term-green">javi</span>@<span className="term-green">MacBook-Pro</span>
        {"\n-----------------\n"}
        {rows.map(([key, value]) => (
          <span key={key} className="term-log-line">
            <span className="term-green">{key}</span>: {value}
          </span>
        ))}
      </span>
    </span>
  );
};

export default function Terminal({
  onOpen,
  onExit,
}: {
  onOpen: (target: TerminalTarget) => boolean;
  onExit: () => void;
}) {
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const [lines, setLines] = useState<Line[]>(() => [
    {
      id: 0,
      kind: "output",
      content: `Last login: ${new Date().toDateString()} on ttys000\nType "help" to see what this terminal can do.`,
    },
  ]);
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [isMatrix, setIsMatrix] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const print = (content: ReactNode) => {
    setLines((current) => [...current, { id: nextId.current++, kind: "output", content }]);
  };

  const run = (raw: string) => {
    const input = raw.trim();
    const [command = "", ...args] = input.split(/\s+/);
    const argument = args.join(" ");
    switch (command.toLowerCase()) {
      case "":
        return;
      case "help":
        print(
          <span className="term-pre">
            {HELP.map(([name, description]) => (
              <span key={name} className="term-log-line">
                <span className="term-green">{name.padEnd(16)}</span>
                {description}
              </span>
            ))}
          </span>,
        );
        return;
      case "whoami":
        print("Francisco Javier González (Javi) — full-stack software engineer and technical manager in Switzerland. Snowboard instructor at Flumserberg in winter.");
        return;
      case "neofetch":
        print(<Neofetch />);
        return;
      case "ls":
        if (argument === "projects" || argument === "projects/") {
          print(
            <span className="term-pre">
              {projects.map((project) => (
                <span key={project.slug} className="term-log-line">
                  <span className="term-blue">{project.slug}</span>
                </span>
              ))}
            </span>,
          );
          return;
        }
        print(
          <span>
            <span className="term-blue">Projects/</span>  <span className="term-blue">My certifications/</span>  CV.pdf  Intro.mov  meme.jpg  meme 2.jpg
          </span>,
        );
        return;
      case "cd":
        print(argument ? `cd: permission denied: ${argument} — try "open ${argument}"` : "");
        return;
      case "open": {
        const target =
          OPEN_TARGETS[argument.toLowerCase()] ??
          (projects.some((project) => project.slug === argument) ? { project: argument } : null);
        if (!target || !onOpen(target)) {
          print(`The file ${argument || "(nothing)"} does not exist. Try "ls" or "ls projects".`);
          return;
        }
        print(`Opening ${argument}…`);
        return;
      }
      case "git":
        if (args[0] === "log") {
          print(<GitLog />);
          return;
        }
        print(`git: '${args[0] ?? ""}' is not supported here. Try "git log".`);
        return;
      case "github":
        print(
          <span>
            <img className="term-graph" src={ACTIVITY_GRAPH} alt="GitHub contribution activity graph" />
            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer">
              {GITHUB_PROFILE}
            </a>
          </span>,
        );
        return;
      case "lang":
        if (argument === "en" || argument === "de") {
          setLanguage(argument === "en" ? "english" : "german");
          print(argument === "en" ? "Language set to English." : "Sprache auf Deutsch gestellt.");
          return;
        }
        print("usage: lang en|de");
        return;
      case "date":
        print(new Date().toString());
        return;
      case "echo":
        print(argument);
        return;
      case "clear":
        setLines([]);
        return;
      case "sudo":
        print("javi is not in the sudoers file. This incident will be reported. 🚨");
        return;
      case "rm":
        print("Nice try. Nothing gets deleted here.");
        return;
      case "matrix":
        setIsMatrix(true);
        print("Wake up, Neo…  (press any key)");
        return;
      case "exit":
        onExit();
        return;
      default:
        print(`zsh: command not found: ${command}`);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLines((current) => [...current, { id: nextId.current++, kind: "input", content: value }]);
    if (value.trim()) setHistory((current) => [...current, value]);
    setHistoryIndex(null);
    run(value);
    setValue("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isMatrix) {
      setIsMatrix(false);
      return;
    }
    if (event.key === "ArrowUp" && history.length > 0) {
      event.preventDefault();
      const index = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(index);
      setValue(history[index] ?? "");
    }
    if (event.key === "ArrowDown" && historyIndex !== null) {
      event.preventDefault();
      const index = historyIndex + 1;
      if (index >= history.length) {
        setHistoryIndex(null);
        setValue("");
      } else {
        setHistoryIndex(index);
        setValue(history[index] ?? "");
      }
    }
    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  return (
    <div className="terminal-app" onClick={() => inputRef.current?.focus()}>
      {isMatrix && (
        <div className="terminal-matrix" onClick={() => setIsMatrix(false)}>
          <MatrixRain isAnimated />
        </div>
      )}
      <div className="terminal-scroll" ref={scrollRef}>
        {lines.map((line) =>
          line.kind === "input" ? (
            <div key={line.id} className="term-line">
              <span className="term-prompt">{PROMPT_HOST} ~ %</span> {line.content}
            </div>
          ) : (
            <div key={line.id} className="term-line term-output">
              {line.content}
            </div>
          ),
        )}
        <form className="term-line term-input-row" onSubmit={handleSubmit}>
          <label htmlFor="terminal-input" className="term-prompt">
            {PROMPT_HOST} ~ %
          </label>
          <input
            id="terminal-input"
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            autoFocus
            aria-label="Terminal command"
          />
        </form>
      </div>
    </div>
  );
}
