"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
  type MotionStyle,
  type MotionValue,
} from "motion/react";
import PhotosApp from "./photos";
import HomeIndicatorSpacer from "./home-indicator-spacer";
import WeatherWidget, { useZurichWeather } from "./weather";
import WeatherApp from "./weather-app";
import YouTubeApp from "./youtube";
import { useYouTubeConnection, YouTubeStartupError } from "./use-youtube-connection";
import ChatGPTApp from "./chatgpt";
import StartupScreen from "./startup-screen";
import LanguageMenu from "./language-menu";
import {
  useOfflinePlayback,
  useYouTubeOfflinePlayback,
  YouTubePlaybackOverlay,
} from "./offline-playback";
import {
  acknowledgePause,
  applyPlayerVolume,
  claimPlayback,
  createPlaybackGate,
  decidePlayback,
  isYouTubePlayerEvent,
  playlist,
  postPlayerMessage,
  readPlayerErrorCode,
  readPlayerMessage,
  releasePlayback,
  sendPlayerCommand,
  youtubeThumbnail,
  YOUTUBE_ORIGIN,
  YOUTUBE_STATE,
  type AudibleSource,
  type NowPlayingTrack,
  type PlaybackGate,
  type YouTubeSession,
} from "./media";
import { projects as portfolioProjects } from "@/data/projects.data";
import {
  trackCvDownload,
  trackEvent,
  trackExternalClick,
  trackProjectClick,
} from "@/lib/analytics";
import ProjectDocument from "./project-window";
import MoviePlayer, { INTRO_MOVIE } from "./movie-window";
import Terminal, { type TerminalTarget } from "./terminal";
import { AboutThisMac, ActivityMonitor, FreeformBoard } from "./system-apps";
import PreviewDocument, {
  certificateDocs,
  certificateLabel,
  CV_LABEL,
  CV_PATH,
  findCertificate,
  type PreviewDoc,
} from "./preview-document";
import {
  buildNoteFolders,
  DEFAULT_NOTE_ID,
  findFolderByNoteId,
  type Note,
  type NoteFolder,
} from "./notes-data";
import { useLanguageStore } from "@/stores/useLanguageStore";

type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  outcome?: string;
  url?: string;
  image: string;
};

// Javi's projects, in the same order as the portfolio grid (data/projects.data.ts).
const projects: Project[] = portfolioProjects.map((project) => ({
  id: project.slug,
  title: project.title,
  category: project.projectType,
  description: project.description,
  url: project.externalUrl ?? project.gitHubUrl,
  image: project.images[0] ?? "/os/doc-icons/folder.png",
}));

const apps = [
  { id: "notes", name: "Notes", icon: "/os/doc-icons/notes.png" },
  { id: "photos", name: "Photos", icon: "/os/doc-icons/photos.png" },
  { id: "mail", name: "Mail", icon: "/os/doc-icons/mail.png" },
  { id: "youtube", name: "YouTube", icon: "/os/doc-icons/youtube.svg" },
  { id: "spotify", name: "Spotify", icon: "/os/doc-icons/spotify.svg" },
  { id: "terminal", name: "Terminal", icon: "/os/doc-icons/terminal.svg" },
  {
    id: "activity-monitor",
    name: "Activity Monitor",
    icon: "/os/doc-icons/activity-monitor.svg",
  },
  { id: "freeform", name: "Freeform", icon: "/os/doc-icons/freeform.svg" },
  { id: "weather", name: "Weather", icon: "/os/doc-icons/weather.svg" },
  { id: "chatgpt", name: "ChatGPT", icon: "/os/doc-icons/chatgpt.svg" },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "/os/doc-icons/linkedin.svg",
    href: "https://www.linkedin.com/in/fjgonzalezfernandez/",
  },
  {
    id: "github",
    name: "GitHub",
    icon: "/os/doc-icons/github.svg",
    href: "https://github.com/franciscojgonzalezfernandez-lgtm",
  },
  { id: "trash", name: "Trash", icon: "/os/doc-icons/trash.png" },
] as const;

type DockApp = (typeof apps)[number];
type AppId = DockApp["id"];
const MOBILE_DOCK_APP_IDS = ["notes", "photos", "mail", "spotify"] as const;
type MobileDockAppId = (typeof MOBILE_DOCK_APP_IDS)[number];

const isMobileDockApp = (
  app: DockApp,
): app is Extract<DockApp, { id: MobileDockAppId }> => {
  const ids: readonly AppId[] = MOBILE_DOCK_APP_IDS;
  return ids.includes(app.id);
};
type LinkedAppId = Extract<DockApp, { href: string }>["id"];
type WindowAppId = Exclude<
  AppId,
  LinkedAppId | "notes" | "spotify" | "youtube" | "weather" | "terminal"
>;
type NotesTarget = { noteId: string; view?: NotesView };
type WindowState =
  | ({ kind: "notes" } & NotesTarget)
  | { kind: "app"; app: WindowAppId }
  | { kind: "folder"; folder: FolderId }
  | { kind: "project"; slug: string }
  | { kind: "preview"; doc: PreviewDoc }
  | { kind: "movie" }
  | { kind: "terminal" }
  | { kind: "about-mac" }
  | { kind: "video" }
  | { kind: "spotify" }
  | { kind: "youtube" }
  | { kind: "weather" }
  | { kind: "image"; memeId: MemeId };
type OpenWindow = {
  id: number;
  content: WindowState;
  offsetX: number;
  offsetY: number;
  zIndex: number;
  minimizedAt: number | null;
};

type FolderId = "secret" | "projects" | "certifications";

type DeepLinkTarget = { kind: "project"; slug: string } | { kind: "folder"; folder: "projects" };

export const readDeepLink = (search: string): DeepLinkTarget | null => {
  const open = new URLSearchParams(search).get("open");
  if (!open) return null;
  const [kind, value] = open.split(":");
  if (kind === "project" && portfolioProjects.some((project) => project.slug === value)) {
    return { kind: "project", slug: value };
  }
  if (kind === "folder" && value === "projects") return { kind: "folder", folder: "projects" };
  return null;
};

const windowKey = (content: WindowState) => {
  if (content.kind === "folder") return content.folder === "secret" ? null : `folder:${content.folder}`;
  if (content.kind === "project") return `project:${content.slug}`;
  if (content.kind === "movie") return "movie";
  if (content.kind === "terminal") return "terminal";
  if (content.kind === "about-mac") return "about-mac";
  if (content.kind === "preview")
    return content.doc.kind === "cv" ? "preview:cv" : `preview:cert:${content.doc.id}`;
  if (content.kind === "image") return `image:${content.memeId}`;
  if (content.kind === "app") return `app:${content.app}`;
  return content.kind;
};
type WindowStackProps = {
  windowId: number;
  zIndex: number;
  offsetX: number;
  offsetY: number;
  isMinimized: boolean;
  onFocus: () => void;
  onMinimize: () => void;
};

function Clock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!now) return <span>{compact ? "14:08" : "Wed 14:08"}</span>;
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const day = now.toLocaleDateString("en-US", { weekday: "short" });
  return <span>{compact ? time : `${day} ${time}`}</span>;
}

// Wi-Fi fan in a 24×24 box: a bottom wedge plus two bands sharing one center,
// spreading 45° each side of vertical. Each sector is inset by the corner
// radius and stroked at twice that width with round joins, which rounds every
// corner without changing the sector's outer size.
const WIFI_CENTER_X = 12;
const WIFI_CENTER_Y = 19.75;
const WIFI_HALF_ANGLE = Math.PI / 4;
const WIFI_CORNER_RADIUS = 0.7;
const WIFI_SECTORS: ReadonlyArray<{ inner: number; outer: number }> = [
  { inner: 0, outer: 5.4 },
  { inner: 7.25, outer: 10.45 },
  { inner: 12.3, outer: 15.5 },
];

const toWifiPoint = (radius: number, angle: number) => {
  const x = WIFI_CENTER_X + radius * Math.sin(angle);
  const y = WIFI_CENTER_Y - radius * Math.cos(angle);
  return `${x.toFixed(3)} ${y.toFixed(3)}`;
};

const getWifiEdgeAngle = (radius: number) =>
  WIFI_HALF_ANGLE - Math.asin(WIFI_CORNER_RADIUS / radius);

const getWifiSectorPath = ({ inner, outer }: { inner: number; outer: number }) => {
  const outerRadius = outer - WIFI_CORNER_RADIUS;
  const outerAngle = getWifiEdgeAngle(outerRadius);
  const outerArc = `M${toWifiPoint(outerRadius, -outerAngle)}A${outerRadius} ${outerRadius} 0 0 1 ${toWifiPoint(outerRadius, outerAngle)}`;

  if (inner === 0) {
    const apexDistance = WIFI_CORNER_RADIUS / Math.sin(WIFI_HALF_ANGLE);
    return `${outerArc}L${toWifiPoint(apexDistance, 0)}Z`;
  }

  const innerRadius = inner + WIFI_CORNER_RADIUS;
  const innerAngle = getWifiEdgeAngle(innerRadius);
  return `${outerArc}L${toWifiPoint(innerRadius, innerAngle)}A${innerRadius} ${innerRadius} 0 0 0 ${toWifiPoint(innerRadius, -innerAngle)}Z`;
};

const wifiFanPath = WIFI_SECTORS.map(getWifiSectorPath).join("");

const WifiFan = () => (
  <path
    d={wifiFanPath}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={WIFI_CORNER_RADIUS * 2}
    strokeLinejoin="round"
  />
);

const WIFI_SLASH_MASK_ID = "wifi-slash-cutout";
const WIFI_SLASH_PATH = "M4.6 3.4 19.4 20.6";

const WifiSlashedFan = () => (
  <>
    <mask id={WIFI_SLASH_MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect width="24" height="24" fill="#fff" />
      <path d={WIFI_SLASH_PATH} stroke="#000" strokeWidth="5" strokeLinecap="round" />
    </mask>
    <g mask={`url(#${WIFI_SLASH_MASK_ID})`}>
      <WifiFan />
    </g>
    <path
      d={WIFI_SLASH_PATH}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </>
);

type Box = { left: number; top: number; right: number; bottom: number };
type GenieOrigin = {
  rect: Box;
  layoutLeft: number;
  layoutTop: number;
  height: number;
};
type GenieState = {
  progress: number;
  origin: GenieOrigin | null;
  target: Box;
  savedTransform: string;
  controls: AnimationPlaybackControls | null;
};
type InlineFrame = {
  left: string;
  top: string;
  width: string;
  height: string;
  transform: string;
};
type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
type ResizeSession = {
  edge: ResizeEdge;
  x: number;
  y: number;
  start: Box;
};

const MOBILE_BREAKPOINT = 700;
const MINIMIZE_DURATION = 0.6;
const RESTORE_DURATION = 0.48;
const MAXIMIZE_DURATION_MS = 460;
const MAXIMIZE_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const GENIE_ROWS = 28;
// Wide enough to keep the window's 80px drop shadow unclipped at rest.
const GENIE_SHADOW_PAD = 120;
const MENU_BAR_HEIGHT = 28;
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 220;
const RESIZE_EDGES: ResizeEdge[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const clamp01 = (value: number) => clamp(value, 0, 1);
const lerp = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;
const smoothstep = (value: number) => value * value * (3 - 2 * value);
const easeInOutCubic = (value: number) => {
  if (value < 0.5) return 4 * value ** 3;
  return 1 - (-2 * value + 2) ** 3 / 2;
};
const phase = (progress: number, start: number, end: number) =>
  easeInOutCubic(clamp01((progress - start) / (end - start)));

const toBox = (rect: DOMRect): Box => ({
  left: rect.left,
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
});

const fallbackDockTarget = (): Box => {
  const size = 48;
  const left = window.innerWidth / 2 - size / 2;
  const bottom = window.innerHeight - 22;
  return { left, top: bottom - size, right: left + size, bottom };
};

const readDockTarget = (windowId: number) => {
  const tile = document.querySelector<HTMLElement>(
    `[data-minimized-tile="${windowId}"]`,
  );
  if (!tile) return fallbackDockTarget();
  return toBox(tile.getBoundingClientRect());
};

const measureGenieOrigin = (element: HTMLElement): GenieOrigin => {
  const parentRect = element.offsetParent?.getBoundingClientRect();
  return {
    rect: toBox(element.getBoundingClientRect()),
    layoutLeft: (parentRect?.left ?? 0) + element.offsetLeft,
    layoutTop: (parentRect?.top ?? 0) + element.offsetTop,
    height: element.offsetHeight,
  };
};

// Approximates the macOS genie: the sides bend into a funnel that ends at the
// dock tile, then the window slides down through it. The funnel is fixed in
// screen space, so content narrows as it travels rather than all at once.
const applyGenieFrame = (
  element: HTMLElement,
  origin: GenieOrigin,
  target: Box,
  progress: number,
) => {
  const { rect } = origin;
  const bend = phase(progress, 0, 0.42);
  const stretch = phase(progress, 0, 0.55);
  const slide = phase(progress, 0.28, 1);
  const top = lerp(rect.top, target.top, slide);
  const bottom = lerp(rect.bottom, target.bottom, stretch);
  const funnelHeight = Math.max(target.top - rect.top, 1);
  const pad = GENIE_SHADOW_PAD * (1 - bend);
  const leftEdge: string[] = [];
  const rightEdge: string[] = [];

  for (let row = 0; row < GENIE_ROWS; row += 1) {
    const fraction = row / (GENIE_ROWS - 1);
    const y = lerp(top, bottom, fraction);
    const curve = bend * smoothstep(clamp01((y - rect.top) / funnelHeight));
    const left = lerp(rect.left, target.left, curve) - rect.left - pad;
    const right = lerp(rect.right, target.right, curve) - rect.left + pad;
    const localY = fraction * (origin.height + pad * 2) - pad;
    leftEdge.push(`${left}px ${localY}px`);
    rightEdge.unshift(`${right}px ${localY}px`);
  }

  const translateX = rect.left - origin.layoutLeft;
  const translateY = top - origin.layoutTop;
  const scaleY = Math.max(bottom - top, 0.5) / origin.height;
  element.style.visibility = "visible";
  element.style.transformOrigin = "0 0";
  element.style.transform = `translate(${translateX}px, ${translateY}px) scale(1, ${scaleY})`;
  element.style.clipPath = `polygon(${[...leftEdge, ...rightEdge].join(", ")})`;
  element.style.opacity = String(1 - phase(progress, 0.8, 1));
};

const clearGenieFrame = (element: HTMLElement, transform: string) => {
  element.style.visibility = "";
  element.style.transformOrigin = "";
  element.style.transform = transform;
  element.style.clipPath = "";
  element.style.opacity = "";
};

const isDesktopViewport = () => window.innerWidth >= MOBILE_BREAKPOINT;

type Viewport = { width: number; height: number };
type ScreenPoint = { x: number; y: number };
type CardFrame = {
  x: number;
  y: number;
  scale: number;
  radius: number;
  opacity: number;
};

const FULL_FRAME: CardFrame = { x: 0, y: 0, scale: 1, radius: 0, opacity: 1 };
const IOS_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
const LAUNCH_DURATION = 0.5;
const GO_HOME_DURATION = 0.42;
const SPRING_BACK_DURATION = 0.34;
const CORNER_SETTLE_DURATION = 0.12;
const LAUNCHER_FALLBACK_SIZE = 60;
const ICON_CORNER_RATIO = 0.23;
const APP_CARD_RADIUS = 36;

const appliedFrames = new WeakMap<HTMLElement, CardFrame>();
const frameAnimations = new WeakMap<HTMLElement, AnimationPlaybackControls>();

const findWindowElement = (windowId: number) =>
  document.querySelector<HTMLElement>(`[data-window-id="${windowId}"]`);

const readViewport = (element: HTMLElement): Viewport => ({
  width: element.offsetWidth,
  height: element.offsetHeight,
});

const readCardFrame = (element: HTMLElement) =>
  appliedFrames.get(element) ?? FULL_FRAME;

// Mobile windows are full screen, so a frame is just where that screen-sized
// box is drawn. The radius is divided by the scale to stay visually constant.
const applyCardFrame = (element: HTMLElement, frame: CardFrame) => {
  appliedFrames.set(element, frame);
  element.dataset.cardFramed = "true";
  element.style.setProperty(
    "--mobile-transform",
    `translate(${frame.x}px, ${frame.y}px) scale(${frame.scale})`,
  );
  element.style.setProperty("--mobile-radius", `${frame.radius / frame.scale}px`);
  element.style.setProperty("--mobile-opacity", String(frame.opacity));
};

const stopFrameAnimation = (element: HTMLElement) => {
  frameAnimations.get(element)?.stop();
  frameAnimations.delete(element);
};

const clearCardFrame = (element: HTMLElement) => {
  stopFrameAnimation(element);
  appliedFrames.delete(element);
  delete element.dataset.cardFramed;
  element.style.removeProperty("--mobile-transform");
  element.style.removeProperty("--mobile-radius");
  element.style.removeProperty("--mobile-opacity");
};

// Appearing cards fade in early and disappearing ones fade out late, the way
// iOS keeps an app opaque until it has almost reached its icon.
const mixFrames = (from: CardFrame, to: CardFrame, progress: number) => {
  const isFadingIn = to.opacity > from.opacity;
  const fade = isFadingIn ? clamp01(progress * 2) : clamp01(progress * 2 - 1);
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
    scale: lerp(from.scale, to.scale, progress),
    radius: lerp(from.radius, to.radius, progress),
    opacity: lerp(from.opacity, to.opacity, fade),
  };
};

const animateFrame = (
  element: HTMLElement,
  to: CardFrame,
  duration: number,
  onComplete?: () => void,
) => {
  stopFrameAnimation(element);
  const from = readCardFrame(element);
  if (duration === 0) {
    applyCardFrame(element, to);
    onComplete?.();
    return;
  }
  const controls = animate(0, 1, {
    duration,
    ease: IOS_EASE,
    onUpdate: (progress) => applyCardFrame(element, mixFrames(from, to, progress)),
    onComplete: () => {
      frameAnimations.delete(element);
      onComplete?.();
    },
  });
  frameAnimations.set(element, controls);
};

const readIconFrame = (
  viewport: Viewport,
  center: ScreenPoint,
  size: number,
): CardFrame => {
  const scale = size / viewport.width;
  return {
    x: center.x - size / 2,
    y: center.y - (viewport.height * scale) / 2,
    scale,
    radius: size * ICON_CORNER_RATIO,
    opacity: 0,
  };
};

const readLauncherFrame = (viewport: Viewport, launcherKey: string) => {
  const launcher = document.querySelector<HTMLElement>(
    `.mobile-home [data-launcher="${launcherKey}"], .mobile-dock [data-launcher="${launcherKey}"]`,
  );
  const icon =
    launcher?.querySelector<HTMLElement>(".app-icon, .mobile-folder-icon, img") ??
    launcher;
  const rect = icon?.getBoundingClientRect();
  if (!rect || rect.width === 0) return null;
  if (rect.right <= 0 || rect.left >= viewport.width) return null;
  const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  return readIconFrame(viewport, center, rect.width);
};

const readScreenCenterFrame = (viewport: Viewport) =>
  readIconFrame(
    viewport,
    { x: viewport.width / 2, y: viewport.height / 2 },
    LAUNCHER_FALLBACK_SIZE * 2,
  );

const launchMobileWindow = (
  element: HTMLElement,
  launcherKey: string,
  pointer: ScreenPoint | null,
  duration: number,
) => {
  const viewport = readViewport(element);
  const pointerFrame = pointer
    ? readIconFrame(viewport, pointer, LAUNCHER_FALLBACK_SIZE)
    : readScreenCenterFrame(viewport);
  const origin = readLauncherFrame(viewport, launcherKey) ?? pointerFrame;
  const roundedFullFrame = { ...FULL_FRAME, radius: APP_CARD_RADIUS };
  const settleCorners = () => {
    const settleDuration = duration === 0 ? 0 : CORNER_SETTLE_DURATION;
    animateFrame(element, FULL_FRAME, settleDuration, () => clearCardFrame(element));
  };
  applyCardFrame(element, origin);
  animateFrame(element, roundedFullFrame, duration, settleCorners);
};

const useGenie = (
  windowRef: React.RefObject<HTMLDivElement | null>,
  windowId: number,
  isMinimized: boolean,
) => {
  const reduceMotion = useReducedMotion();
  const genieRef = useRef<GenieState>({
    progress: 0,
    origin: null,
    target: { left: 0, top: 0, right: 0, bottom: 0 },
    savedTransform: "",
    controls: null,
  });

  useLayoutEffect(() => {
    const element = windowRef.current;
    const genie = genieRef.current;
    const goal = isMinimized ? 1 : 0;
    if (!element) return;
    if (!isDesktopViewport()) {
      genie.controls?.stop();
      genie.controls = null;
      genie.progress = goal;
      genie.origin = null;
      return;
    }
    if (genie.progress === goal) return;

    if (genie.progress === 0) {
      element.getAnimations().forEach((animation) => animation.finish());
      genie.savedTransform = element.style.transform;
      genie.origin = measureGenieOrigin(element);
    }
    const origin = genie.origin;
    if (!origin) return;

    const finish = () => {
      genie.progress = goal;
      clearGenieFrame(element, genie.savedTransform);
      if (goal === 0) genie.origin = null;
    };
    if (reduceMotion) {
      finish();
      return;
    }

    // Restoring starts from the tile as it is now; it shrinks away while the
    // window grows, so tracking it would drag the window along.
    genie.target = readDockTarget(windowId);
    applyGenieFrame(element, origin, genie.target, genie.progress);

    const duration = isMinimized ? MINIMIZE_DURATION : RESTORE_DURATION;
    genie.controls = animate(genie.progress, goal, {
      duration: duration * Math.abs(goal - genie.progress),
      ease: "linear",
      onUpdate: (progress) => {
        genie.progress = progress;
        if (isMinimized) genie.target = readDockTarget(windowId);
        applyGenieFrame(element, origin, genie.target, progress);
      },
      onComplete: finish,
    });

    return () => genie.controls?.stop();
  }, [isMinimized, reduceMotion, windowId, windowRef]);
};

const useMaximize = (windowRef: React.RefObject<HTMLDivElement | null>) => {
  const reduceMotion = useReducedMotion();
  const [isMaximized, setIsMaximized] = useState(false);
  const fromRectRef = useRef<DOMRect | null>(null);
  const inlineFrameRef = useRef<InlineFrame>({
    left: "",
    top: "",
    width: "",
    height: "",
    transform: "",
  });
  const animationRef = useRef<Animation | null>(null);

  useLayoutEffect(() => {
    const element = windowRef.current;
    const from = fromRectRef.current;
    fromRectRef.current = null;
    if (!element || !from) return;

    // Dragging and resizing write inline styles, which would beat the
    // maximized class.
    const { style } = element;
    if (isMaximized) {
      inlineFrameRef.current = {
        left: style.left,
        top: style.top,
        width: style.width,
        height: style.height,
        transform: style.transform,
      };
      style.left = "";
      style.top = "";
      style.width = "";
      style.height = "";
      style.transform = "";
    } else {
      Object.assign(style, inlineFrameRef.current);
    }

    animationRef.current?.cancel();
    if (reduceMotion) return;
    const to = element.getBoundingClientRect();
    const parent = element.offsetParent?.getBoundingClientRect();
    const toKeyframe = (rect: DOMRect): Keyframe => ({
      left: `${rect.left - (parent?.left ?? 0)}px`,
      top: `${rect.top - (parent?.top ?? 0)}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: "none",
    });
    animationRef.current = element.animate([toKeyframe(from), toKeyframe(to)], {
      duration: MAXIMIZE_DURATION_MS,
      easing: MAXIMIZE_EASING,
    });
  }, [isMaximized, reduceMotion, windowRef]);

  const toggleMaximize = () => {
    if (!windowRef.current || !isDesktopViewport()) return;
    fromRectRef.current = windowRef.current.getBoundingClientRect();
    setIsMaximized((value) => !value);
  };

  return { isMaximized, toggleMaximize };
};

const isTransparentColor = (color: string) =>
  color === "transparent" || color === "rgba(0, 0, 0, 0)";

const isHiddenSurface = (style: CSSStyleDeclaration) =>
  style.display === "none" || style.visibility === "hidden";

const readEdgeSurface = (
  body: Element,
  edge: "firstElementChild" | "lastElementChild",
) => {
  const sibling =
    edge === "firstElementChild" ? "nextElementSibling" : "previousElementSibling";
  let node = body[edge];
  while (node) {
    const style = getComputedStyle(node);
    if (isHiddenSurface(style)) {
      node = node[sibling];
      continue;
    }
    if (!isTransparentColor(style.backgroundColor)) return style.backgroundColor;
    node = node[edge];
  }
  return null;
};

const stopPointerPropagation = (event: React.PointerEvent) => {
  event.stopPropagation();
};

const TrafficLights = ({
  isMaximized,
  onClose,
  onMinimize,
  onToggleMaximize,
}: {
  isMaximized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
}) => {
  const maximizeLabel = isMaximized ? "Restore window size" : "Maximize window";
  const zoomGlyph = isMaximized
    ? "M4.3 1v2.7H7zM1 4.3h2.7V7z"
    : "M2.2 1.2h4.6v4.6zM1.2 2.2v4.6h4.6z";

  return (
    <div className="traffic-lights">
      <button
        type="button"
        className="traffic close"
        aria-label="Close window"
        onPointerDown={stopPointerPropagation}
        onClick={onClose}
      >
        <svg viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1.6 1.6l4.8 4.8M6.4 1.6 1.6 6.4" />
        </svg>
      </button>
      <button
        type="button"
        className="traffic minimize"
        aria-label="Minimize window"
        onPointerDown={stopPointerPropagation}
        onClick={onMinimize}
      >
        <svg viewBox="0 0 8 8" aria-hidden="true">
          <path d="M1.2 4h5.6" />
        </svg>
      </button>
      <button
        type="button"
        className="traffic maximize"
        aria-label={maximizeLabel}
        aria-pressed={isMaximized}
        onPointerDown={stopPointerPropagation}
        onClick={onToggleMaximize}
      >
        <svg viewBox="0 0 8 8" aria-hidden="true">
          <path d={zoomGlyph} />
        </svg>
      </button>
    </div>
  );
};

function WindowShell({
  title,
  children,
  onClose,
  variant = "paper",
  windowId,
  zIndex,
  offsetX,
  offsetY,
  isMinimized,
  onFocus,
  onMinimize,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  variant?: "paper" | "dark";
} & WindowStackProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const resizeRef = useRef<ResizeSession | null>(null);
  const { isMaximized, toggleMaximize } = useMaximize(windowRef);
  useGenie(windowRef, windowId, isMinimized);

  useLayoutEffect(() => {
    if (!isMinimized || !windowRef.current) return;
    clearCardFrame(windowRef.current);
  }, [isMinimized]);

  useLayoutEffect(() => {
    const element = windowRef.current;
    const body = element?.querySelector(".window-body");
    if (!element || !body) return;
    const surfaces = {
      "--mobile-top-surface": readEdgeSurface(body, "firstElementChild"),
      "--mobile-bottom-surface": readEdgeSurface(body, "lastElementChild"),
    };
    Object.entries(surfaces).forEach(([property, color]) => {
      if (color) element.style.setProperty(property, color);
    });
  }, []);

  const handleMinimize = () => {
    if (!isDesktopViewport()) return;
    onMinimize();
  };
  const handleToggleMaximize = () => {
    onFocus();
    toggleMaximize();
  };
  const handleTitlebarDoubleClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest(".traffic-lights")) return;
    handleToggleMaximize();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !windowRef.current || isMaximized) return;
    const rect = windowRef.current.getBoundingClientRect();
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !windowRef.current || window.innerWidth < 700)
      return;
    const nextLeft = Math.max(
      8,
      Math.min(
        window.innerWidth - 240,
        dragRef.current.left + event.clientX - dragRef.current.x,
      ),
    );
    const nextTop = Math.max(
      MENU_BAR_HEIGHT,
      Math.min(
        window.innerHeight - 80,
        dragRef.current.top + event.clientY - dragRef.current.y,
      ),
    );
    windowRef.current.style.left = `${nextLeft}px`;
    windowRef.current.style.top = `${nextTop}px`;
    windowRef.current.style.transform = "none";
  };

  const handleResizePointerDown =
    (edge: ResizeEdge) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0 || !windowRef.current) return;
      if (isMaximized || !isDesktopViewport()) return;
      resizeRef.current = {
        edge,
        x: event.clientX,
        y: event.clientY,
        start: toBox(windowRef.current.getBoundingClientRect()),
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

  const handleResizePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = resizeRef.current;
    const element = windowRef.current;
    if (!session || !element || !isDesktopViewport()) return;
    const { edge, start } = session;
    const deltaX = event.clientX - session.x;
    const deltaY = event.clientY - session.y;
    const frame = { ...start };

    if (edge.includes("e")) {
      frame.right = clamp(
        start.right + deltaX,
        start.left + MIN_WINDOW_WIDTH,
        window.innerWidth,
      );
    }
    if (edge.includes("w")) {
      frame.left = clamp(start.left + deltaX, 0, start.right - MIN_WINDOW_WIDTH);
    }
    if (edge.includes("s")) {
      frame.bottom = clamp(
        start.bottom + deltaY,
        start.top + MIN_WINDOW_HEIGHT,
        window.innerHeight,
      );
    }
    if (edge.includes("n")) {
      frame.top = clamp(
        start.top + deltaY,
        MENU_BAR_HEIGHT,
        start.bottom - MIN_WINDOW_HEIGHT,
      );
    }

    Object.assign(element.style, {
      left: `${frame.left}px`,
      top: `${frame.top}px`,
      width: `${frame.right - frame.left}px`,
      height: `${frame.bottom - frame.top}px`,
      transform: "none",
    });
  };

  const handleResizePointerUp = () => {
    resizeRef.current = null;
  };

  const handleTitlebarPointerUp = () => {
    dragRef.current = null;
  };

  const className = [
    "window-shell",
    variant === "dark" && "dark-window",
    isMaximized && "window-maximized",
    isMinimized && "window-minimized",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      ref={windowRef}
      data-window-id={windowId}
      role="dialog"
      aria-label={title}
      style={
        {
          zIndex,
          "--window-offset-x": `${offsetX}px`,
          "--window-offset-y": `${offsetY}px`,
        } as React.CSSProperties
      }
      onPointerDown={onFocus}
    >
      <div
        className="titlebar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={handleTitlebarPointerUp}
        onPointerCancel={handleTitlebarPointerUp}
        onDoubleClick={handleTitlebarDoubleClick}
      >
        <TrafficLights
          isMaximized={isMaximized}
          onClose={onClose}
          onMinimize={handleMinimize}
          onToggleMaximize={handleToggleMaximize}
        />
        <strong>{title}</strong>
      </div>
      <div className="window-body">{children}</div>
      {RESIZE_EDGES.map((edge) => (
        <div
          key={edge}
          className={`window-resize-handle resize-${edge}`}
          aria-hidden="true"
          onPointerDown={handleResizePointerDown(edge)}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onPointerCancel={handleResizePointerUp}
        />
      ))}
    </div>
  );
}

const formatProjectUrl = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

type NotesView = "folders" | "list" | "note";

const NotesBackButton = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => (
  <button
    className="notes-back"
    type="button"
    aria-label={`Back to ${label}`}
    onClick={onClick}
  >
    <svg viewBox="0 0 13 22" aria-hidden="true">
      <path
        d="M10.7 2.2 2.4 11l8.3 8.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    {label}
  </button>
);

const NotesApp = ({
  noteId,
  view = "note",
  onOpenProject,
}: NotesTarget & { onOpenProject: (slug: string) => void }) => {
  const language = useLanguageStore((state) => state.language);
  const noteFolders = buildNoteFolders(language);
  const [activeFolderId, setActiveFolderId] = useState(
    findFolderByNoteId(noteFolders, noteId).id,
  );
  const [activeNoteId, setActiveNoteId] = useState(noteId);
  const [mobileView, setMobileView] = useState<NotesView>(view);
  const activeNoteRef = useRef<HTMLButtonElement>(null);

  const activeFolder =
    noteFolders.find((folder) => folder.id === activeFolderId) ??
    noteFolders[0];
  const activeNote =
    activeFolder.notes.find((note) => note.id === activeNoteId) ??
    activeFolder.notes[0];

  useEffect(() => {
    activeNoteRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const handleSelectFolder = (folder: NoteFolder) => {
    setActiveFolderId(folder.id);
    setActiveNoteId(folder.notes[0].id);
    setMobileView("list");
  };
  const handleSelectNote = (note: Note) => {
    setActiveNoteId(note.id);
    setMobileView("note");
  };
  return (
    <div className="notes-app" data-view={mobileView}>
      <aside className="notes-folders">
        <h2>Folders</h2>
        <span>iCloud</span>
        <div className="notes-folders-group">
          {noteFolders.map((folder) => {
            const isActive = folder.id === activeFolder.id;
            return (
              <button
                key={folder.id}
                type="button"
                className={isActive ? "active" : undefined}
                aria-current={isActive}
                aria-label={`${folder.title}, ${folder.notes.length} notes`}
                onClick={() => handleSelectFolder(folder)}
              >
                <svg
                  className="notes-folder-icon"
                  viewBox="0 0 24 20"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4.5A2.5 2.5 0 0 1 4.5 2h4.3c.7 0 1.3.3 1.8.8l1.3 1.4c.3.3.7.5 1.1.5h6.5A2.5 2.5 0 0 1 22 7.2v8.3a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 15.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2 8h20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                </svg>
                <span className="notes-folder-title">{folder.title}</span>
                <small>{folder.notes.length}</small>
                <svg
                  className="notes-folder-chevron"
                  viewBox="0 0 8 14"
                  aria-hidden="true"
                >
                  <path
                    d="m1.5 1.5 5 5.5-5 5.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      </aside>
      <nav className="notes-list" aria-label={`${activeFolder.title} notes`}>
        <NotesBackButton
          label="Folders"
          onClick={() => setMobileView("folders")}
        />
        <h3>{activeFolder.title}</h3>
        {activeFolder.notes.map((note, noteIndex) => {
          const isActive = note.id === activeNote.id;
          const shouldShowSection =
            note.section !== undefined &&
            note.section !== activeFolder.notes[noteIndex - 1]?.section;
          return (
            <Fragment key={note.id}>
              {shouldShowSection ? (
                <h4 className="notes-list-section">{note.section}</h4>
              ) : null}
              <button
                ref={isActive ? activeNoteRef : undefined}
                type="button"
                className={isActive ? "active" : undefined}
                aria-current={isActive}
                onClick={() => handleSelectNote(note)}
              >
                <b>{note.title}</b>
                <span>
                  <em>{note.meta}</em>
                  {note.paragraphs[0]}
                </span>
              </button>
            </Fragment>
          );
        })}
        <HomeIndicatorSpacer />
      </nav>
      <article>
        <NotesBackButton
          label={activeFolder.title}
          onClick={() => setMobileView("list")}
        />
        <small>{activeNote.meta}</small>
        {activeNote.image ? (
          <img
            className="notes-image"
            src={activeNote.image}
            alt={`${activeNote.title} icon`}
          />
        ) : null}
        <h2>{activeNote.title}</h2>
        {activeNote.paragraphs.map((paragraph, paragraphIndex) => (
          <p key={`${paragraphIndex}-${paragraph}`}>{paragraph}</p>
        ))}
        {activeNote.bullets?.length ? (
          <ul className="notes-bullets">
            {activeNote.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        {activeNote.links?.length ? (
          <p className="notes-links">
            {activeNote.links.map((link) =>
              link.project ? (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => onOpenProject(link.project as string)}
                >
                  {link.label} ›
                </button>
              ) : (
                <a key={link.label} href={link.url} target="_blank" rel="noreferrer">
                  {link.url ? formatProjectUrl(link.url) : link.label}
                </a>
              ),
            )}
          </p>
        ) : null}
        <HomeIndicatorSpacer />
      </article>
    </div>
  );
};

const NotesWindow = ({
  noteId,
  view,
  onClose,
  onOpenProject,
  ...stackProps
}: NotesTarget & {
  onClose: () => void;
  onOpenProject: (slug: string) => void;
} & WindowStackProps) => (
  <WindowShell title="Notes" onClose={onClose} {...stackProps}>
    <NotesApp
      key={`${noteId}-${view}`}
      noteId={noteId}
      view={view}
      onOpenProject={onOpenProject}
    />
  </WindowShell>
);

// Share of each file that the artwork actually occupies. Full-bleed icons are 1.
const ICON_PLATE: Record<AppId, number> = {
  notes: 840 / 1024,
  photos: 840 / 1024,
  weather: 1,
  spotify: 1,
  youtube: 1,
  chatgpt: 1,
  mail: 840 / 1024,
  linkedin: 1,
  github: 1,
  terminal: 1,
  "activity-monitor": 1,
  freeform: 1,
  trash: 862 / 1024,
};

const AppIcon = ({ app }: { app: DockApp }) => {
  const iconStyle = {
    backgroundImage: `url("${app.icon}")`,
    "--icon-fit": 1 / ICON_PLATE[app.id],
  } as React.CSSProperties;

  return <span className="app-icon" style={iconStyle} />;
};

const AppLauncher = ({
  app,
  className,
  onOpen,
  children,
}: {
  app: DockApp;
  className?: string;
  onOpen: (app: DockApp) => void;
  children?: ReactNode;
}) => {
  if ("href" in app) {
    return (
      <a
        className={className}
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        data-launcher={app.id}
        aria-label={`${app.name}, opens in a new tab`}
        onClick={() => onOpen(app)}
      >
        <AppIcon app={app} />
        {children}
      </a>
    );
  }

  return (
    <button
      className={className}
      type="button"
      data-launcher={app.id}
      aria-label={app.name}
      onClick={() => onOpen(app)}
    >
      <AppIcon app={app} />
      {children}
    </button>
  );
};

const DOCK_BASE_SIZE = 56;
const DOCK_MAGNIFICATION = 40;
const DOCK_REACH = 140;

function DockSlot({ label, pointerX, className, children }: {
  label: string;
  pointerX: MotionValue<number>;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = useMotionValue(false);
  const reduceMotion = useReducedMotion();
  const targetSize = useTransform(() => {
    const x = pointerX.get();
    const keyboardFocused = focused.get();
    if (keyboardFocused) return DOCK_BASE_SIZE + DOCK_MAGNIFICATION;
    if (!ref.current || !Number.isFinite(x)) return DOCK_BASE_SIZE;

    // Measure the current icon, since its center shifts as neighbors grow.
    const rect = ref.current.getBoundingClientRect();
    const distance = Math.min(Math.abs(x - rect.left - rect.width / 2), DOCK_REACH);
    const influence = (1 + Math.cos(Math.PI * distance / DOCK_REACH)) / 2;
    return DOCK_BASE_SIZE + DOCK_MAGNIFICATION * influence;
  });
  const size = useSpring(targetSize, { mass: 0.2, stiffness: 250, damping: 22 });

  return (
    <div
      className={`dock-slot ${className ?? ""}`}
      onFocus={(event) => focused.set(event.target.matches(":focus-visible"))}
      onBlur={() => focused.set(false)}
    >
      <span>{label}</span>
      <motion.div
        ref={ref}
        className="dock-item"
        style={{
          width: reduceMotion ? DOCK_BASE_SIZE : size,
          height: reduceMotion ? DOCK_BASE_SIZE : size,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

type MinimizedWindowTile = {
  id: number;
  label: string;
  icon?: string;
  preview?: string;
  variant: "paper" | "dark";
};

const DOCK_GAP = 6;
const TILE_ENTER = { duration: 0.42, ease: [0.32, 0.72, 0, 1] } as const;
const TILE_EXIT = { duration: 0.32, ease: [0.32, 0.72, 0, 1] } as const;

const MinimizedWindowButton = ({
  tile,
  pointerX,
  onRestore,
}: {
  tile: MinimizedWindowTile;
  pointerX: MotionValue<number>;
  onRestore: (id: number) => void;
}) => (
  <motion.div
    className="dock-tile-wrap"
    initial={{ width: 0, marginLeft: -DOCK_GAP }}
    animate={{ width: "auto", marginLeft: 0, transition: TILE_ENTER }}
    exit={{ width: 0, marginLeft: -DOCK_GAP, transition: TILE_EXIT }}
  >
    <DockSlot label={tile.label} pointerX={pointerX}>
      <button
        type="button"
        className="dock-window-tile"
        aria-label={`Restore ${tile.label}`}
        onClick={() => onRestore(tile.id)}
      >
        <motion.span
          className={`mini-window ${tile.variant}`}
          data-minimized-tile={tile.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { delay: MINIMIZE_DURATION * 0.78, duration: 0.14 },
          }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
        >
          <i aria-hidden="true" />
          {tile.preview ? <img src={tile.preview} alt="" /> : null}
        </motion.span>
        {tile.icon ? (
          <img className="mini-window-badge" src={tile.icon} alt="" />
        ) : null}
      </button>
    </DockSlot>
  </motion.div>
);

function DesktopDock({
  onOpen,
  minimizedWindows,
  onRestore,
}: {
  onOpen: (app: DockApp) => void;
  minimizedWindows: MinimizedWindowTile[];
  onRestore: (id: number) => void;
}) {
  // Motion values update the animation without re-rendering the desktop.
  const pointerX = useMotionValue(Infinity);
  const renderApp = (app: DockApp) => (
    <DockSlot
      key={app.id}
      label={app.name}
      pointerX={pointerX}
      className={app.id === "linkedin" ? "separated" : undefined}
    >
      <AppLauncher app={app} onOpen={onOpen} />
    </DockSlot>
  );

  return (
    <div
      className="dock desktop-dock desktop-only"
      aria-label="Applications"
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        const glassX = ((event.clientX - rect.left) / rect.width) * 100;
        event.currentTarget.style.setProperty("--glass-x", `${Math.max(0, Math.min(100, glassX))}%`);
        pointerX.set(event.clientX);
      }}
      onPointerLeave={() => pointerX.set(Infinity)}
      onPointerCancel={() => pointerX.set(Infinity)}
    >
      <span className="dock-liquid-surface" aria-hidden="true" />
      {apps
        .filter((app) => app.id !== "trash" && app.id !== "weather")
        .map(renderApp)}
      <span className="dock-divider" aria-hidden="true" />
      <AnimatePresence initial={false}>
        {minimizedWindows.map((tile) => (
          <MinimizedWindowButton
            key={tile.id}
            tile={tile}
            pointerX={pointerX}
            onRestore={onRestore}
          />
        ))}
      </AnimatePresence>
      {apps.filter((app) => app.id === "trash").map(renderApp)}
    </div>
  );
}

const CONTACT_EMAIL = "franciscojgonzalezfernandez@gmail.com";

const readMailField = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") return "";
  return value;
};

const MAIL_LABELS = {
  english: {
    to: "To:",
    subject: "Subject:",
    subjectDefault: "Job opportunity",
    greeting: "Hello Javi,",
    send: "Send",
    attachment: "Attachment",
    attachmentHint: "Download my CV",
  },
  german: {
    to: "An:",
    subject: "Betreff:",
    subjectDefault: "Jobangebot",
    greeting: "Hallo Javi,",
    send: "Senden",
    attachment: "Anhang",
    attachmentHint: "Meinen Lebenslauf herunterladen",
  },
} as const;

// Contact form. No backend: Send hands the draft to the visitor's mail client.
const MailComposeForm = () => {
  const language = useLanguageStore((state) => state.language);
  const labels = MAIL_LABELS[language];
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = readMailField(data.get("subject")) || labels.subjectDefault;
    const message = readMailField(data.get("message"));
    const mailto =
      `mailto:${CONTACT_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(message)}`;
    trackEvent("contact_email", { language });
    window.location.href = mailto;
  };

  return (
    <form className="mail-app" onSubmit={handleSubmit}>
      <label>
        {labels.to} <span>Javi &lt;{CONTACT_EMAIL}&gt;</span>
      </label>
      <label>
        {labels.subject}{" "}
        <input
          name="subject"
          aria-label={labels.subject}
          placeholder={labels.subjectDefault}
        />
      </label>
      <textarea
        key={language}
        name="message"
        aria-label="Message"
        defaultValue={`${labels.greeting}\n\n`}
      />
      <div className="mail-footer">
        <a
          className="mail-attachment"
          href={CV_PATH}
          download="CV-Javi.pdf"
          title={labels.attachmentHint}
          onClick={() => trackCvDownload(language)}
        >
          <img src={PDF_ICON} alt="" />
          <span>
            <b>CV-Javi.pdf</b>
            <small>{labels.attachment}</small>
          </span>
        </a>
        <button type="submit">{labels.send}</button>
      </div>
    </form>
  );
};

const BrowserLockIcon = () => (
  <svg
    viewBox="0 0 9 11"
    aria-hidden="true"
    className="block h-[11px] w-[9px] shrink-0 fill-current text-[#858585]"
  >
    <path
      d="M2.25 5V3.5a2.25 2.25 0 0 1 4.5 0V5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <rect x="0.5" y="4.5" width="8" height="6.5" rx="1.5" />
  </svg>
);

function AppWindow({
  app,
  onClose,
  ...stackProps
}: { app: WindowAppId; onClose: () => void } & WindowStackProps) {
  if (app === "activity-monitor") {
    return (
      <WindowShell title="Activity Monitor" onClose={onClose} {...stackProps}>
        <ActivityMonitor />
      </WindowShell>
    );
  }
  if (app === "freeform") {
    return (
      <WindowShell title="Freeform" onClose={onClose} {...stackProps}>
        <FreeformBoard />
      </WindowShell>
    );
  }
  if (app === "photos") {
    return (
      <WindowShell title="Photos" onClose={onClose} {...stackProps}>
        <PhotosApp />
      </WindowShell>
    );
  }
  if (app === "mail") {
    return (
      <WindowShell title="New Message" onClose={onClose} {...stackProps}>
        <MailComposeForm />
      </WindowShell>
    );
  }
  if (app === "chatgpt") {
    return (
      <WindowShell title="ChatGPT" onClose={onClose} {...stackProps}>
        <ChatGPTApp />
      </WindowShell>
    );
  }
  return (
    <WindowShell title="Trash" onClose={onClose} {...stackProps}>
      <div className="empty-trash">
        <img src="/os/doc-icons/trash.png" alt="" />
        <h2>Trash is Empty</h2>
        <p>Nothing to see here.</p>
      </div>
    </WindowShell>
  );
}

const PDF_ICON = "/os/doc-icons/pdf.svg";
const FOLDER_TITLES: Record<FolderId, string> = {
  secret: "Don't Open",
  projects: "Projects",
  certifications: "My certifications",
};

type FolderItem = {
  id: string;
  label: string;
  meta?: string;
  thumbnail?: string;
  // File-type icon instead of a content thumbnail: drawn whole, not cropped.
  isFileIcon?: boolean;
  onOpen: () => void;
};

function FolderWindow({
  folder,
  onClose,
  onOpenVideo,
  onOpenProject,
  onOpenPreview,
  ...stackProps
}: {
  folder: FolderId;
  onClose: () => void;
  onOpenVideo: () => void;
  onOpenProject: (slug: string) => void;
  onOpenPreview: (doc: PreviewDoc) => void;
} & WindowStackProps) {
  const isGerman = useLanguageStore((state) => state.language) === "german";
  const title = FOLDER_TITLES[folder];
  const items: FolderItem[] =
    folder === "projects"
      ? portfolioProjects.map((project) => ({
          id: project.slug,
          label: project.title,
          meta: project.projectType,
          thumbnail: project.images[0],
          onOpen: () => onOpenProject(project.slug),
        }))
      : folder === "certifications"
        ? certificateDocs.map((certificate) => ({
            id: certificate.id,
            label: certificateLabel(certificate, isGerman),
            meta: certificate.date,
            thumbnail: PDF_ICON,
            isFileIcon: true,
            onOpen: () => onOpenPreview({ kind: "certificate", id: certificate.id }),
          }))
        : [];
  const hasItems = folder !== "secret";
  const sidebar = [
    {
      title: "iCloud",
      items: [
        { label: "Recents", icon: "recents" },
        { label: "Shared", icon: "shared" },
      ],
    },
    {
      title: "Favorites",
      items: [
        { label: "Desktop", icon: "desktop" },
        { label: "Applications", icon: "applications" },
        { label: "Projects", icon: "projects" },
        { label: "Work", icon: "work" },
        { label: "Movies", icon: "movies" },
        { label: "Downloads", icon: "downloads" },
        { label: "Documents", icon: "documents" },
      ],
    },
  ];

  return (
    <WindowShell title={title} onClose={onClose} {...stackProps}>
      <div className="finder-app">
        <div className="finder-toolbar">
          <div className="finder-arrows">
            <button aria-label="Back">
              <span />
            </button>
            <button aria-label="Forward" disabled>
              <span />
            </button>
          </div>
          <b>
            <span className="tiny-folder" />
            {title}
          </b>
          <div className="finder-tools">
            <div className="view-switcher">
              <button className="active" aria-label="Icon view">
                <span className="view-grid">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </button>
              <button aria-label="List view">
                <span className="view-list">
                  <i />
                  <i />
                  <i />
                </span>
              </button>
              <button aria-label="Column view">
                <span className="view-columns">
                  <i />
                  <i />
                  <i />
                </span>
              </button>
              <button aria-label="Gallery view">
                <span className="view-gallery">
                  <i />
                </span>
              </button>
            </div>
            <span className="finder-search" />
          </div>
        </div>
        <div className="finder-content">
          <aside>
            {sidebar.map((group) => (
              <div key={group.title}>
                <h3>{group.title}</h3>
                {group.items.map((item) => (
                  <p key={item.label} data-active={item.label === title || undefined}>
                    <i className={`sidebar-icon ${item.icon}`}>
                      <span />
                    </i>
                    {item.label}
                  </p>
                ))}
              </div>
            ))}
          </aside>
          {hasItems ? (
            <div className="finder-files finder-grid">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="finder-thumb-file"
                  aria-label={`Open ${item.label}`}
                  onDoubleClick={item.onOpen}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") item.onOpen();
                  }}
                  onClick={(event) => {
                    // Touch and pen have no double click; a tap opens directly.
                    if ((event.nativeEvent as PointerEvent).pointerType !== "mouse") item.onOpen();
                  }}
                >
                  <span className={`finder-thumb ${item.isFileIcon ? "finder-thumb-icon" : ""}`}>
                    {item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : null}
                  </span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          ) : (
          <div className="finder-files">
            <button
              className="movie-file"
              aria-label="Open Dont play this video.mov"
              onClick={onOpenVideo}
            >
              <MovIcon />
              <strong>
                Dont play this
                <br />
                video.mov
              </strong>
            </button>
          </div>
          )}
        </div>
        <div className="finder-status">
          <div>
            <span className="tiny-folder" />
            Macintosh HD <b>›</b> Users <b>›</b> javi <b>›</b> Desktop <b>›</b>{" "}
            <strong>{title}</strong>
          </div>
          <span>{hasItems ? `${items.length} items` : "1 item"}</span>
        </div>
      </div>
      <FilesApp
        title={title}
        onBack={onClose}
        onOpenVideo={onOpenVideo}
        items={hasItems ? items : undefined}
      />
    </WindowShell>
  );
}

const MovIcon = () => (
  <span className="mov-icon">
    <i className="camera-body" />
    <b className="camera-lens" />
    <small>MOV</small>
  </span>
);

const FILES_TABS = [
  { id: "recents", label: "Recents" },
  { id: "shared", label: "Shared" },
  { id: "browse", label: "Browse" },
] as const;

type FilesTabId = (typeof FILES_TABS)[number]["id"];

const FilesTabIcon = ({ id }: { id: FilesTabId }) => {
  if (id === "recents") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <circle cx="14" cy="14" r="10.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path
          d="M14 7.5V14l4.2 2.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "shared") {
    return (
      <svg viewBox="0 0 28 28" aria-hidden="true">
        <path
          d="M3.5 8.5a2 2 0 0 1 2-2h5l2.2 2.4h9.8a2 2 0 0 1 2 2v9.6a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="13.6" r="2.2" fill="currentColor" />
        <path d="M9.8 19.6a4.2 3.2 0 0 1 8.4 0Z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <path
        d="M3 8.2a2.2 2.2 0 0 1 2.2-2.2h5.4l2.4 2.6h9.8a2.2 2.2 0 0 1 2.2 2.2v9.8a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 20.6Z"
        fill="currentColor"
      />
    </svg>
  );
};

type FilesAppProps = {
  title: string;
  onBack: () => void;
  onOpenVideo: () => void;
  items?: FolderItem[];
};

const FilesApp = ({ title, onBack, onOpenVideo, items }: FilesAppProps) => (
  <div className="files-app">
    <header className="files-header">
      <div className="files-nav">
        <button
          className="files-back"
          type="button"
          aria-label="Back to Browse"
          onClick={onBack}
        >
          <svg viewBox="0 0 13 22" aria-hidden="true">
            <path
              d="M10.7 2.2 2.4 11l8.3 8.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Browse
        </button>
        <span className="files-more" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
      <h2>{title}</h2>
      <div className="files-search" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <circle cx="6.8" cy="6.8" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="m10.6 10.6 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Search
      </div>
    </header>
    <div className="files-content">
      <div className="files-grid">
        {items ? (
          items.map((item) => (
            <button
              key={item.id}
              className="files-item"
              type="button"
              aria-label={`Open ${item.label}`}
              onClick={item.onOpen}
            >
              <span className={`files-thumb ${item.isFileIcon ? "files-thumb-icon" : ""}`}>
                {item.thumbnail ? <img src={item.thumbnail} alt="" loading="lazy" /> : null}
              </span>
              <strong>{item.label}</strong>
              {item.meta ? <small>{item.meta}</small> : null}
            </button>
          ))
        ) : (
          <button
            className="files-item"
            type="button"
            aria-label="Open Dont play this video.mov"
            onClick={onOpenVideo}
          >
            <MovIcon />
            <strong>Dont play this video</strong>
            <small>12 Oct 2025</small>
            <small>42.1 MB</small>
          </button>
        )}
      </div>
      <p className="files-count">{items ? `${items.length} items` : "1 item"}</p>
    </div>
    <nav className="files-tabs" aria-hidden="true">
      {FILES_TABS.map((tab) => (
        <span key={tab.id} data-active={tab.id === "browse"}>
          <FilesTabIcon id={tab.id} />
          {tab.label}
        </span>
      ))}
    </nav>
  </div>
);

const VIDEO_ID = "dQw4w9WgXcQ";
const VIDEO_TITLE = "Never Gonna Give You Up";
const VIDEO_ARTIST = "Rick Astley";

const sendVideoCommand = (iframe: HTMLIFrameElement | null, func: "playVideo" | "pauseVideo") => {
  postPlayerMessage(iframe, { event: "command", func, args: [] });
};

const isPlayingState = (state: number) =>
  state === YOUTUBE_STATE.playing || state === YOUTUBE_STATE.buffering;

function VideoWindow({
  onClose,
  volume,
  isOffline,
  isPlaybackActive,
  canTakePlayback,
  playbackRequest,
  playbackGateRef,
  onClaimPlayback,
  onReleasePlayback,
  onPlayingChange,
  ...stackProps
}: {
  onClose: () => void;
  volume: number;
  isOffline: boolean;
  isPlaybackActive: boolean;
  canTakePlayback: boolean;
  playbackRequest: number;
  playbackGateRef: RefObject<PlaybackGate>;
  onClaimPlayback: () => void;
  onReleasePlayback: () => void;
  onPlayingChange: (isPlaying: boolean) => void;
} & WindowStackProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasPlayerError, setHasPlayerError] = useState(false);
  const volumeRef = useRef(volume);
  const isPlaybackActiveRef = useRef(isPlaybackActive);
  const canTakePlaybackRef = useRef(canTakePlayback);
  const onPlayingChangeRef = useRef(onPlayingChange);
  const onClaimRef = useRef(onClaimPlayback);
  const onReleaseRef = useRef(onReleasePlayback);
  const {
    status: playbackStatus,
    playbackId,
    isStalledRef,
  } = useYouTubeOfflinePlayback(iframeRef, isOffline);
  const { hasStartupError, retry } = useYouTubeConnection(iframeRef, "desktop-video", () => {
    applyPlayerVolume(iframeRef.current, volumeRef.current);
    if (!isPlaybackActiveRef.current || isStalledRef.current) {
      sendVideoCommand(iframeRef.current, "pauseVideo");
    }
  });

  useLayoutEffect(() => {
    const wasActive = isPlaybackActiveRef.current;
    if (wasActive && !isPlaybackActive) playbackGateRef.current.held.video = true;
    if (!wasActive && isPlaybackActive) playbackGateRef.current.held.video = false;
    isPlaybackActiveRef.current = isPlaybackActive;
    canTakePlaybackRef.current = canTakePlayback;
  }, [canTakePlayback, isPlaybackActive, playbackGateRef]);

  useEffect(() => {
    onPlayingChangeRef.current = onPlayingChange;
    onClaimRef.current = onClaimPlayback;
    onReleaseRef.current = onReleasePlayback;
  });

  useEffect(() => {
    return () => {
      onPlayingChangeRef.current(false);
      onReleaseRef.current();
    };
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
    applyPlayerVolume(iframeRef.current, volume);
  }, [volume]);

  useEffect(() => {
    if (isPlaybackActive) {
      sendVideoCommand(iframeRef.current, "playVideo");
      return;
    }
    sendVideoCommand(iframeRef.current, "pauseVideo");
    onPlayingChangeRef.current(false);
  }, [isPlaybackActive, playbackRequest]);

  useEffect(() => {
    const reportState = (state: number, fromStateChange: boolean) => {
      const gate = playbackGateRef.current;
      if (isPlayingState(state)) {
        const decision = decidePlayback(
          gate,
          "video",
          fromStateChange,
          canTakePlaybackRef.current && !isStalledRef.current,
        );
        if (decision === "suppress") {
          sendVideoCommand(iframeRef.current, "pauseVideo");
          onPlayingChangeRef.current(false);
          return;
        }
        if (gate.owner !== "video") onClaimRef.current();
        onPlayingChangeRef.current(true);
        return;
      }
      if (fromStateChange) acknowledgePause(gate, "video");
      onPlayingChangeRef.current(false);
    };

    const handlePlayerMessage = (event: MessageEvent) => {
      if (!isYouTubePlayerEvent(event, iframeRef.current)) {
        return;
      }
      const message = readPlayerMessage(event.data);
      if (!message) {
        return;
      }
      if (message.event === "onError" || readPlayerErrorCode(message.info)) {
        setHasPlayerError(true);
        onPlayingChangeRef.current(false);
        return;
      }
      if (message.event === "onStateChange" && typeof message.info === "number") {
        reportState(message.info, true);
        return;
      }
      if (message.event !== "infoDelivery" && message.event !== "initialDelivery") {
        return;
      }
      const playerState = (message.info as { playerState?: unknown } | null)?.playerState;
      if (typeof playerState !== "number") {
        return;
      }
      reportState(playerState, false);
    };
    window.addEventListener("message", handlePlayerMessage);
    return () => window.removeEventListener("message", handlePlayerMessage);
  }, [isStalledRef, playbackGateRef]);

  return (
    <WindowShell
      title="Dont play this video.mov"
      onClose={onClose}
      variant="dark"
      {...stackProps}
    >
      <div className={`video-app ${playbackStatus}`}>
        <iframe
          ref={iframeRef}
          src={`${YOUTUBE_ORIGIN}/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
          title={`${VIDEO_ARTIST} — ${VIDEO_TITLE}`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
        <YouTubePlaybackOverlay status={playbackStatus} playbackId={playbackId} />
        {hasPlayerError || (hasStartupError && !isOffline) ? (
          <YouTubeStartupError
            onRetry={() => {
              setHasPlayerError(false);
              retry();
            }}
          />
        ) : null}
      </div>
    </WindowShell>
  );
}

const rickrollTrack: NowPlayingTrack = {
  videoId: VIDEO_ID,
  title: VIDEO_TITLE,
  artist: VIDEO_ARTIST,
  cover: youtubeThumbnail(VIDEO_ID),
};

const spotifyPlaylist = playlist;

const SPOTIFY_PLAYLIST_NAME = "Javi's Mix";
const SPOTIFY_PLAYER_ID = "spotify-player";
const SPOTIFY_RESTART_AFTER_SECONDS = 3;
const SPOTIFY_TRACK_START_SECONDS = 8;
const SPOTIFY_EMBED_SRC = `${YOUTUBE_ORIGIN}/embed/${spotifyPlaylist[0].videoId}?enablejsapi=1&controls=0&disablekb=1&rel=0&playsinline=1`;

type PlayerInfo = {
  playerState?: unknown;
  currentTime?: unknown;
  duration?: unknown;
  videoData?: { video_id?: unknown };
};

const readFiniteNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const formatTrackTime = (seconds: number) => {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = String(wholeSeconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
};

const spotifyIcons = {
  play: <path d="M6.5 4.5v15L19 12z" />,
  pause: <path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" />,
  previous: <path d="M6 5h2.4v6.1L18 5v14l-9.6-6.1V19H6z" />,
  next: <path d="M18 5h-2.4v6.1L6 5v14l9.6-6.1V19H18z" />,
  home: <path d="M12 3.2 3 10.4V21h6.4v-6.2h5.2V21H21V10.4z" />,
  search: (
    <path d="M10.5 3a7.5 7.5 0 0 1 5.96 12.05l4.74 4.74-1.41 1.41-4.74-4.74A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
  ),
  library: <path d="M4 3h2v18H4zM9 3h2v18H9zM14.1 3.6l1.9-.6 5.6 17.4-1.9.6z" />,
  shuffle: (
    <path
      d="M3 7h3.5c1.6 0 3 .8 3.9 2.1l3.2 5.8c.9 1.3 2.3 2.1 3.9 2.1H20M3 17h3.5c1.6 0 3-.8 3.9-2.1M13.6 9.1c.9-1.3 2.3-2.1 3.9-2.1H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  saved: (
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.2-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4z"
    />
  ),
  more: (
    <path d="M5 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
  ),
  list: <path d="M3 5h18v2H3zM3 11h18v2H3zM3 17h18v2H3z" />,
  logo: (
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  ),
} satisfies Record<string, ReactNode>;

const SpotifyIcon = ({ name }: { name: keyof typeof spotifyIcons }) => (
  <svg className="spotify-icon" viewBox="0 0 24 24" aria-hidden="true">
    {spotifyIcons[name]}
  </svg>
);

const SpotifyCover = ({ className }: { className: string }) => (
  <span className={className} aria-hidden="true">
    {spotifyPlaylist.slice(0, 4).map((track) => (
      <img key={track.videoId} src={track.cover} alt="" />
    ))}
  </span>
);

type TrackProgress = { currentTime: number; duration: number };

const EMPTY_PROGRESS: TrackProgress = { currentTime: 0, duration: 0 };

type TrackProgressStore = {
  getSnapshot: () => TrackProgress;
  subscribe: (listener: () => void) => () => void;
  setProgress: (progress: TrackProgress) => void;
};

const createTrackProgressStore = (): TrackProgressStore => {
  let progress = EMPTY_PROGRESS;
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => progress,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setProgress: (next) => {
      if (next.currentTime === progress.currentTime && next.duration === progress.duration) {
        return;
      }
      progress = next;
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
};

const useTrackProgress = (store: TrackProgressStore) =>
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

const wrapTrackIndex = (index: number) =>
  (index + spotifyPlaylist.length) % spotifyPlaylist.length;

type SpotifyPlayer = {
  audioFrame: ReactNode;
  isReady: boolean;
  isOffline: boolean;
  hasPlaybackError: boolean;
  hasStartupError: boolean;
  retry: () => void;
  isPlaying: boolean;
  trackIndex: number;
  track: NowPlayingTrack;
  progressStore: TrackProgressStore;
  togglePlay: () => void;
  selectTrack: (index: number) => void;
  previous: () => void;
  next: () => void;
  seek: (seconds: number) => void;
};

const useSpotifyPlayer = ({
  volume,
  isOffline,
  isInterrupted,
  playbackGateRef,
  onClaimPlayback,
  onReleasePlayback,
}: {
  volume: number;
  isOffline: boolean;
  isInterrupted: boolean;
  playbackGateRef: RefObject<PlaybackGate>;
  onClaimPlayback: () => void;
  onReleasePlayback: () => void;
}): SpotifyPlayer => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const volumeRef = useRef(volume);
  const isReadyRef = useRef(false);
  const wantsPlaybackRef = useRef(false);
  const isInterruptedRef = useRef(isInterrupted);
  const awaitingTrackRef = useRef(false);
  const reportedVideoIdRef = useRef<string | null>(null);
  const [playerError, setPlayerError] = useState(false);
  const playerStateRef = useRef<number>(YOUTUBE_STATE.unstarted);
  const trackIndexRef = useRef(0);
  const loadedVideoIdRef = useRef(spotifyPlaylist[0].videoId);
  const progressStoreRef = useRef<TrackProgressStore | null>(null);
  if (progressStoreRef.current === null) {
    progressStoreRef.current = createTrackProgressStore();
  }
  const progressStore = progressStoreRef.current;
  const [isReady, setIsReady] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playerState, setPlayerState] = useState<number>(YOUTUBE_STATE.unstarted);

  const isAudible =
    playerState === YOUTUBE_STATE.playing || playerState === YOUTUBE_STATE.buffering;
  const isPlaying = !isInterrupted && isAudible;

  const rememberPlayback = (next: boolean) => {
    wantsPlaybackRef.current = next;
  };

  isInterruptedRef.current = isInterrupted;

  useEffect(() => {
    volumeRef.current = volume;
    applyPlayerVolume(iframeRef.current, volume);
  }, [volume]);

  const [stalledWhilePlaying, setStalledWhilePlaying] = useState(false);
  const { status: offlineStatus } = useOfflinePlayback(isOffline, {
    onStall: () => {
      setStalledWhilePlaying(wantsPlaybackRef.current);
      sendPlayerCommand(iframeRef.current, "pauseVideo");
    },
    onReconnect: () => {
      if (!wantsPlaybackRef.current || isInterruptedRef.current) {
        return;
      }
      sendPlayerCommand(iframeRef.current, "playVideo");
    },
  });
  const hasPlaybackError = offlineStatus === "error" && stalledWhilePlaying;

  useEffect(() => {
    if (!isInterrupted) return;
    rememberPlayback(false);
    sendPlayerCommand(iframeRef.current, "pauseVideo");
  }, [isInterrupted]);

  useEffect(() => {
    trackIndexRef.current = trackIndex;
    const { videoId } = spotifyPlaylist[trackIndex];
    if (!isReadyRef.current || videoId === loadedVideoIdRef.current) {
      return;
    }
    loadedVideoIdRef.current = videoId;
    const shouldPlay = wantsPlaybackRef.current && !isInterruptedRef.current;
    const command = shouldPlay ? "loadVideoById" : "cueVideoById";
    sendPlayerCommand(iframeRef.current, command, [videoId]);
  }, [trackIndex]);

  const { hasStartupError, retry } = useYouTubeConnection(iframeRef, SPOTIFY_PLAYER_ID, () => {
    if (isReadyRef.current) {
      return;
    }
    isReadyRef.current = true;
    setIsReady(true);
    applyPlayerVolume(iframeRef.current, volumeRef.current);
    const { videoId } = spotifyPlaylist[trackIndexRef.current];
    if (videoId === loadedVideoIdRef.current && !wantsPlaybackRef.current) {
      return;
    }
    loadedVideoIdRef.current = videoId;
    const shouldPlay = wantsPlaybackRef.current && !isInterruptedRef.current;
    sendPlayerCommand(iframeRef.current, shouldPlay ? "loadVideoById" : "cueVideoById", [videoId]);
  });

  useEffect(() => {
    const rememberProgress = (currentTime: number | null, duration: number | null) => {
      if (currentTime === null && duration === null) {
        return;
      }
      const current = progressStore.getSnapshot();
      progressStore.setProgress({
        currentTime: currentTime ?? current.currentTime,
        duration: duration ?? current.duration,
      });
    };

    const handleStateChange = (state: number, currentTime: number | null) => {
      const owner = playbackGateRef.current.owner;
      const blocked = owner !== null && owner !== "spotify";
      if (blocked && isPlayingState(state)) {
        rememberPlayback(false);
        sendPlayerCommand(iframeRef.current, "pauseVideo");
        if (playerStateRef.current === YOUTUBE_STATE.paused) return;
        playerStateRef.current = YOUTUBE_STATE.paused;
        setPlayerState(YOUTUBE_STATE.paused);
        return;
      }
      const reportedVideoId = reportedVideoIdRef.current;
      const isActiveState =
        state === YOUTUBE_STATE.playing || state === YOUTUBE_STATE.buffering;
      const startedRequestedTrack =
        isActiveState &&
        (reportedVideoId === loadedVideoIdRef.current ||
          (currentTime !== null && currentTime < SPOTIFY_TRACK_START_SECONDS));
      if (awaitingTrackRef.current && startedRequestedTrack) {
        awaitingTrackRef.current = false;
      }
      if (state === YOUTUBE_STATE.ended && awaitingTrackRef.current) {
        return;
      }
      if (playerStateRef.current === state) {
        return;
      }
      playerStateRef.current = state;
      setPlayerState(state);
      if (state !== YOUTUBE_STATE.ended) {
        return;
      }
      awaitingTrackRef.current = true;
      setTrackIndex((index) => wrapTrackIndex(index + 1));
      progressStore.setProgress(EMPTY_PROGRESS);
    };

    const handlePlayerMessage = (event: MessageEvent) => {
      if (!isYouTubePlayerEvent(event, iframeRef.current)) {
        return;
      }
      const message = readPlayerMessage(event.data);
      if (!message) {
        return;
      }
      if (message.event === "onError" || readPlayerErrorCode(message.info)) {
        setPlayerError(true);
        return;
      }
      if (message.event === "onStateChange") {
        const state = readFiniteNumber(message.info);
        if (state !== null) {
          handleStateChange(state, null);
        }
        return;
      }
      if (message.event !== "infoDelivery" && message.event !== "initialDelivery") {
        return;
      }
      const info = (message.info ?? {}) as PlayerInfo;
      if (typeof info.videoData?.video_id === "string") {
        reportedVideoIdRef.current = info.videoData.video_id;
      }
      const state = readFiniteNumber(info.playerState);
      const currentTime = readFiniteNumber(info.currentTime);
      const duration = readFiniteNumber(info.duration);
      if (state !== null) {
        handleStateChange(state, currentTime);
      }
      rememberProgress(currentTime, duration);
    };

    window.addEventListener("message", handlePlayerMessage);
    return () => window.removeEventListener("message", handlePlayerMessage);
  }, [playbackGateRef, progressStore]);

  const requestPlayback = () => {
    rememberPlayback(true);
  };

  const play = () => {
    if (isOffline || !isReadyRef.current) return;
    onClaimPlayback();
    requestPlayback();
    sendPlayerCommand(iframeRef.current, "playVideo");
  };

  const pause = () => {
    rememberPlayback(false);
    onReleasePlayback();
    sendPlayerCommand(iframeRef.current, "pauseVideo");
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
      return;
    }
    play();
  };

  const showTrack = (index: number) => {
    if (isOffline || !isReadyRef.current) return;
    onClaimPlayback();
    requestPlayback();
    awaitingTrackRef.current = true;
    reportedVideoIdRef.current = null;
    setPlayerError(false);
    setTrackIndex(wrapTrackIndex(index));
    progressStore.setProgress(EMPTY_PROGRESS);
  };

  const selectTrack = (index: number) => {
    if (index === trackIndex) {
      togglePlay();
      return;
    }
    showTrack(index);
  };

  const seek = (seconds: number) => {
    sendPlayerCommand(iframeRef.current, "seekTo", [seconds, true]);
    const current = progressStore.getSnapshot();
    progressStore.setProgress({ ...current, currentTime: seconds });
  };

  const previous = () => {
    if (progressStore.getSnapshot().currentTime > SPOTIFY_RESTART_AFTER_SECONDS) {
      seek(0);
      return;
    }
    showTrack(trackIndex - 1);
  };

  const next = () => {
    showTrack(trackIndex + 1);
  };

  // Prepare the iframe before interaction so the first mobile tap can send
  // playVideo immediately, without losing user activation while it loads.
  const audioFrame = (
    <iframe
      ref={iframeRef}
      className="spotify-audio-frame"
      src={SPOTIFY_EMBED_SRC}
      title="Audio player"
      allow="autoplay; encrypted-media"
      tabIndex={-1}
      aria-hidden="true"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );

  return {
    audioFrame,
    isReady,
    isOffline,
    hasPlaybackError: hasPlaybackError || playerError,
    hasStartupError: hasStartupError || playerError,
    retry: () => {
      setPlayerError(false);
      retry();
    },
    isPlaying,
    trackIndex,
    track: spotifyPlaylist[trackIndex],
    progressStore,
    togglePlay,
    selectTrack,
    previous,
    next,
    seek,
  };
};

function SpotifyWindow({
  onClose,
  player,
  ...stackProps
}: {
  onClose: () => void;
  player: SpotifyPlayer;
} & WindowStackProps) {
  const { isOffline, isReady, isPlaying, trackIndex } = player;
  const isDisabled = isOffline || !isReady;
  const progress = useTrackProgress(player.progressStore);
  const currentTrack = player.track;

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    player.seek(Number(event.target.value));
  };

  const playLabel = isPlaying ? "Pause" : "Play";
  const playIcon = isPlaying ? "pause" : "play";

  return (
    <WindowShell
      title="Spotify"
      onClose={onClose}
      variant="dark"
      {...stackProps}
    >
      <div className="spotify-app">
        <aside className="spotify-side">
          <nav className="spotify-panel spotify-nav" aria-label="Spotify">
            <span className="spotify-nav-item active">
              <SpotifyIcon name="home" />
              Home
            </span>
            <span className="spotify-nav-item">
              <SpotifyIcon name="search" />
              Search
            </span>
          </nav>
          <section className="spotify-panel spotify-library" aria-label="Your Library">
            <span className="spotify-nav-item">
              <SpotifyIcon name="library" />
              Your Library
            </span>
            <div className="spotify-library-item">
              <SpotifyCover className="spotify-cover spotify-cover-small" />
              <span>
                <b>{SPOTIFY_PLAYLIST_NAME}</b>
                <small>Playlist · Javi</small>
              </span>
            </div>
          </section>
        </aside>

        <section className="spotify-main" aria-label={SPOTIFY_PLAYLIST_NAME}>
          <header className="spotify-hero">
            <SpotifyCover className="spotify-cover" />
            <div>
              <small>Playlist</small>
              <h2>{SPOTIFY_PLAYLIST_NAME}</h2>
              <p>
                <b>Javi</b> · {spotifyPlaylist.length} songs
              </p>
            </div>
          </header>
          <div className="spotify-actions">
            <button
              type="button"
              className="spotify-play-big"
              aria-label={`${playLabel} ${SPOTIFY_PLAYLIST_NAME}`}
              disabled={isDisabled}
              onClick={player.togglePlay}
            >
              <SpotifyIcon name={playIcon} />
            </button>
            <span className="spotify-action-icon" aria-hidden="true">
              <SpotifyIcon name="shuffle" />
            </span>
            <span className="spotify-action-icon saved" aria-hidden="true">
              <SpotifyIcon name="saved" />
            </span>
            <span className="spotify-action-icon" aria-hidden="true">
              <SpotifyIcon name="more" />
            </span>
            <span className="spotify-view-toggle" aria-hidden="true">
              List
              <SpotifyIcon name="list" />
            </span>
          </div>
          <ol className="spotify-tracks">
            {spotifyPlaylist.map((track, index) => {
              const isCurrent = index === trackIndex;
              const isCurrentPlaying = isCurrent && isPlaying;
              return (
                <li key={track.videoId}>
                  <button
                    type="button"
                    className={`spotify-track ${isCurrent ? "current" : ""}`}
                    aria-current={isCurrent ? "true" : undefined}
                    aria-label={`${isCurrentPlaying ? "Pause" : "Play"} ${track.title} by ${track.artist}`}
                    disabled={isDisabled}
                    onClick={() => player.selectTrack(index)}
                  >
                    <img src={track.cover} alt="" />
                    <span className="spotify-track-text">
                      <b>{track.title}</b>
                      <small>{track.artist}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="spotify-panel spotify-now-playing" aria-label="Now playing">
          <b>{SPOTIFY_PLAYLIST_NAME}</b>
          <img src={currentTrack.cover} alt={`${currentTrack.title} cover`} />
          <span className="spotify-track-text">
            <b>{currentTrack.title}</b>
            <small>{currentTrack.artist}</small>
          </span>
        </aside>

        <footer className="spotify-player">
          <div className="spotify-player-track">
            <img src={currentTrack.cover} alt="" />
            <span className="spotify-track-text">
              <b>{currentTrack.title}</b>
              <small>{currentTrack.artist}</small>
            </span>
          </div>
          <div className="spotify-player-center">
            <div className="spotify-controls">
              <button
                type="button"
                aria-label="Previous"
                disabled={isDisabled}
                onClick={player.previous}
              >
                <SpotifyIcon name="previous" />
              </button>
              <button
                type="button"
                className="spotify-play"
                aria-label={playLabel}
                disabled={isDisabled}
                onClick={player.togglePlay}
              >
                <SpotifyIcon name={playIcon} />
              </button>
              <button
                type="button"
                aria-label="Next"
                disabled={isDisabled}
                onClick={player.next}
              >
                <SpotifyIcon name="next" />
              </button>
            </div>
            <div className="spotify-progress">
              <small>{formatTrackTime(progress.currentTime)}</small>
              <input
                type="range"
                aria-label="Seek"
                aria-valuetext={`${formatTrackTime(progress.currentTime)} of ${formatTrackTime(progress.duration)}`}
                min={0}
                max={Math.max(progress.duration, 1)}
                step={1}
                value={Math.min(progress.currentTime, progress.duration)}
                disabled={isDisabled || progress.duration === 0}
                style={
                  {
                    "--spotify-progress": `${progress.duration ? (progress.currentTime / progress.duration) * 100 : 0}%`,
                  } as React.CSSProperties
                }
                onChange={handleSeek}
              />
              <small>{formatTrackTime(progress.duration)}</small>
            </div>
          </div>
          <div className="spotify-player-status" role="status">
            {isOffline ? "You're offline" : player.hasStartupError ? (
              <span>Music couldn&apos;t connect. <button type="button" onClick={player.retry}>Try again</button></span>
            ) : !isReady ? "Connecting…" : null}
          </div>
        </footer>
        {player.hasPlaybackError ? (
          <div className="spotify-toast" role="alert">
            Spotify can&apos;t play this right now. Check your internet connection.
          </div>
        ) : null}
      </div>
    </WindowShell>
  );
}

type SpotifyWidgetProps = {
  player: SpotifyPlayer;
  variant: "desktop" | "mobile";
  onOpen?: () => void;
};

const stopControlEvent = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const SpotifyControl = ({
  label,
  icon,
  className,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof spotifyIcons;
  className?: string;
  disabled: boolean;
  onPress: () => void;
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopControlEvent(event);
    onPress();
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      disabled={disabled}
      onPointerDown={stopControlEvent}
      onKeyDown={stopControlEvent}
      onClick={handleClick}
    >
      <SpotifyIcon name={icon} />
    </button>
  );
};

const SpotifyWidget = ({ player, variant, onOpen }: SpotifyWidgetProps) => {
  const { isOffline, isReady, isPlaying, track } = player;
  const isDisabled = isOffline || !isReady;
  const playLabel = isPlaying ? "Pause" : "Play";
  const playIcon = isPlaying ? "pause" : "play";
  const subtitle = isOffline ? "You're offline" : player.hasStartupError ? "Music couldn’t connect" : track.artist;
  const statusLabel = `${isPlaying ? "Now playing" : "Paused"}: ${track.title} by ${track.artist}`;
  const handleOpen = () => {
    onOpen?.();
  };
  const rootClass = variant === "desktop" ? "sp-widget sp-widget-desktop" : "sp-widget";
  const regionLabel = variant === "desktop" ? statusLabel : "Spotify widget";

  return (
    <section className={rootClass} aria-label={regionLabel}>
      <img className="sp-widget-backdrop" src={track.cover} alt="" aria-hidden="true" />
      <button
        type="button"
        className="sp-widget-open"
        aria-label={`Open Spotify. ${statusLabel}`}
        onClick={handleOpen}
      >
        <img className="sp-widget-cover" src={track.cover} alt="" draggable={false} />
        <span className="sp-widget-text">
          <b>{track.title}</b>
          <small>{subtitle}</small>
        </span>
      </button>
      <div className="sp-widget-logo">
        <SpotifyIcon name="logo" />
      </div>
      <div className="sp-widget-controls">
        <SpotifyControl
          label="Previous track"
          icon="previous"
          disabled={isDisabled}
          onPress={player.previous}
        />
        <SpotifyControl
          label={player.hasStartupError ? "Retry music connection" : playLabel}
          icon={playIcon}
          className="sp-widget-play"
          disabled={isOffline || (!isReady && !player.hasStartupError)}
          onPress={player.hasStartupError ? player.retry : player.togglePlay}
        />
        <SpotifyControl
          label="Next track"
          icon="next"
          disabled={isDisabled}
          onPress={player.next}
        />
      </div>
    </section>
  );
};

type ToggleId =
  | "wifi"
  | "bluetooth"
  | "airdrop"
  | "airplane"
  | "focus"
  | "stageManager"
  | "mirroring"
  | "rotationLock"
  | "flashlight";

type ControlCenterState = {
  volume: number;
  brightness: number;
  toggles: Record<ToggleId, boolean>;
  nowPlaying: NowPlayingTrack | null;
  music: MusicControls | null;
  onVolumeChange: (value: number) => void;
  onBrightnessChange: (value: number) => void;
  onToggle: (id: ToggleId) => void;
};

const initialToggles: Record<ToggleId, boolean> = {
  wifi: true,
  bluetooth: true,
  airdrop: true,
  airplane: false,
  focus: false,
  stageManager: false,
  mirroring: false,
  rotationLock: true,
  flashlight: false,
};

const DEFAULT_VOLUME = 70;
const MAX_SCREEN_DIM = 0.75;

const controlIcons = {
  controlCenter: (
    <>
      <rect x="2.85" y="2.97" width="18.3" height="7.88" rx="3.94" />
      <circle cx="6.79" cy="6.91" r="2.49" fill="currentColor" stroke="none" />
      <path
        fill="currentColor"
        stroke="none"
        fillRule="evenodd"
        d="M6.32 13.29H17.68A4.315 4.315 0 0 1 17.68 21.92H6.32A4.315 4.315 0 0 1 6.32 13.29zM17.68 14.89A2.72 2.72 0 0 1 17.68 20.33A2.72 2.72 0 0 1 17.68 14.89z"
      />
    </>
  ),
  wifi: <WifiFan />,
  wifiOff: <WifiSlashedFan />,
  bluetooth: <path d="m7 7 10 10-5 5V2l5 5L7 17" />,
  airdrop: (
    <>
      <circle cx="12" cy="12" r="1.8" />
      <path d="M8.1 15.9a5.5 5.5 0 1 1 7.8 0" />
      <path d="M5 19a9.9 9.9 0 1 1 14 0" />
    </>
  ),
  airplane: (
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  ),
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
    </>
  ),
  speaker: (
    <>
      <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6a1.4 1.4 0 0 1-1 .4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
      <path d="M16 9a5 5 0 0 1 0 6" />
      <path d="M19.4 5.6a9 9 0 0 1 0 12.8" />
    </>
  ),
  speakerMuted: (
    <>
      <path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6a1.4 1.4 0 0 1-1 .4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z" />
      <path d="m22 9-6 6M16 9l6 6" />
    </>
  ),
  stageManager: (
    <>
      <rect x="8" y="5" width="13" height="14" rx="2" />
      <path d="M3.5 7v3.5M3.5 13.5V17" />
    </>
  ),
  mirroring: (
    <>
      <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
      <path d="m12 15 5 6H7z" />
    </>
  ),
  rotationLock: (
    <>
      <rect x="8.5" y="11" width="7" height="5.5" rx="1" />
      <path d="M10 11V9.5a2 2 0 0 1 4 0V11" />
      <path d="M20.5 12A8.5 8.5 0 1 1 18 6" />
      <path d="M18.5 2.5V6.5H14.5" />
    </>
  ),
  flashlight: (
    <>
      <path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V2h12z" />
      <path d="M6 6h12M12 12v1" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 9.5v4l2.5 2.5M10 2h4" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
      <path d="M8.5 6.5h7M9 11h.01M12 11h.01M15 11h.01M9 14.5h.01M12 14.5h.01M15 14.5h.01M9 18h.01M12 18h.01M15 18h.01" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
} satisfies Record<string, ReactNode>;

const sunRays = [0, 45, 90, 135, 180, 225, 270, 315];

const filledControlIcons = {
  wifi: <WifiFan />,
  airplane: (
    <g transform="translate(1.05 1.2) rotate(-42 12 12)">
      <path d="M21.1 11.15v-1.55L13.4 5.3V2.7a1.35 1.35 0 0 0-2.7 0v2.6L3 9.6v1.55l7.7-2.35v4.85l-2.05 1.45v1.35l3.4-.95 3.4.95v-1.35l-2.05-1.45V8.8l7.7 2.35z" />
    </g>
  ),
  airdrop: (
    <>
      <circle cx="12" cy="12" r="2.05" />
      <circle className="cc-glyph-stroke" cx="12" cy="12" r="5.55" />
      <circle className="cc-glyph-stroke" cx="12" cy="12" r="9.15" />
    </>
  ),
  bluetooth: (
    <path
      className="cc-glyph-stroke"
      d="M6.7 7.05 17.05 16.75 12 21.4V2.6l5.05 4.65L6.7 16.95"
    />
  ),
  rotationLock: (
    <>
      <path
        className="cc-glyph-fine"
        d="M17.45 18.06A8.15 8.15 0 1 1 17.45 5.94"
      />
      <path d="M19.52 7.82 15.1 6.9 18.18 3.5z" />
      <rect x="9.15" y="12.05" width="5.7" height="4.65" rx="1.05" />
      <path
        className="cc-glyph-fine"
        d="M10.4 12.05V10.45a1.6 1.6 0 0 1 3.2 0v1.6"
      />
    </>
  ),
  mirroring: (
    <>
      <rect
        className="cc-glyph-stroke"
        x="3.4"
        y="2.55"
        width="17.2"
        height="11"
        rx="2.05"
      />
      <path d="M9.15 20.85 12 16.7l2.85 4.15z" />
    </>
  ),
  moon: <path d="M15.35 3.05a7.55 7.55 0 1 0 5.15 11.55A6.55 6.55 0 0 1 15.35 3.05z" />,
  flashlight: (
    <>
      <rect x="6.15" y="1.7" width="11.7" height="6.15" rx="1.7" />
      <rect x="8.35" y="8.55" width="7.3" height="12.1" rx="1.7" />
      <rect x="10.15" y="10.7" width="3.7" height="1.15" rx="0.45" fill="#1c1c1e" fillOpacity="0.28" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.35" />
      {sunRays.map((angle) => (
        <rect
          key={angle}
          x="11.2"
          y="1.55"
          width="1.6"
          height="3.7"
          rx="0.8"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
    </>
  ),
  speaker: (
    <>
      <path d="M3.15 8.85h2.85L10.7 4.7v14.6l-4.7-4.15H3.15A1.15 1.15 0 0 1 2 14V10a1.15 1.15 0 0 1 1.15-1.15z" />
      <path className="cc-glyph-round" d="M14.7 9.15a4.15 4.15 0 0 1 0 5.7" />
      <path className="cc-glyph-round" d="M17.55 6.35a8.15 8.15 0 0 1 0 11.3" />
    </>
  ),
  speakerMuted: (
    <>
      <path d="M3.15 8.85h2.85L10.7 4.7v14.6l-4.7-4.15H3.15A1.15 1.15 0 0 1 2 14V10a1.15 1.15 0 0 1 1.15-1.15z" />
      <path className="cc-glyph-round" d="m15.2 9.2 5.5 5.6M20.7 9.2l-5.5 5.6" />
    </>
  ),
  timer: (
    <>
      <circle className="cc-glyph-stroke" cx="12" cy="13.15" r="7.15" />
      <path className="cc-glyph-round" d="M12 13.15V8.85" />
      <path className="cc-glyph-round" d="m12 13.15 2.7 1.7" />
      <rect x="10.15" y="1.45" width="3.7" height="2.05" rx="0.55" />
      <rect
        x="16.35"
        y="3.15"
        width="2.7"
        height="1.45"
        rx="0.45"
        transform="rotate(28 17.7 3.9)"
      />
    </>
  ),
  calculator: (
    <path
      fillRule="evenodd"
      d="M6.1 2.35h11.8A2.55 2.55 0 0 1 20.45 4.9v14.2a2.55 2.55 0 0 1-2.55 2.55H6.1a2.55 2.55 0 0 1-2.55-2.55V4.9A2.55 2.55 0 0 1 6.1 2.35zM7.15 5.35h9.7v2.85h-9.7zm.2 5.35h2.15v2.15H7.35zm3.55 0h2.2v2.15h-2.2zm3.55 0h2.2v2.15h-2.2zM7.35 14.2h2.15v2.15H7.35zm3.55 0h2.2v2.15h-2.2zm3.55 0h2.2v2.15h-2.2z"
    />
  ),
  camera: (
    <path
      fillRule="evenodd"
      d="M9.05 4.15h5.9l1.25 2.05h2.15A2.4 2.4 0 0 1 20.75 8.6v8.15a2.4 2.4 0 0 1-2.4 2.4H5.65a2.4 2.4 0 0 1-2.4-2.4V8.6a2.4 2.4 0 0 1 2.4-2.4h2.15zM12 16.55a3.35 3.35 0 1 0 0-6.7 3.35 3.35 0 0 0 0 6.7z"
    />
  ),
  music: (
    <>
      <path d="M8.2 5.35h1.65V15.4a2.55 2.55 0 1 1-1.65-2.38V5.35z" />
      <path d="M9.85 5.15 18.15 3.5h.15v10.15a2.55 2.55 0 1 1-1.65-2.38V5.05L9.85 6.7V5.15z" />
    </>
  ),
} satisfies Record<string, ReactNode>;

type ControlIconName = keyof typeof controlIcons;
type FilledControlIconName = keyof typeof filledControlIcons;

const ControlIcon = ({
  name,
  filled = false,
}: {
  name: ControlIconName;
  filled?: boolean;
}) => {
  const glyph =
    filled && name in filledControlIcons
      ? filledControlIcons[name as FilledControlIconName]
      : controlIcons[name];
  const className = filled ? "cc-icon cc-icon-fill" : "cc-icon";

  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {glyph}
    </svg>
  );
};

const MobileStatusIndicators = ({
  airplane,
  wifi,
}: {
  airplane: boolean;
  wifi: boolean;
}) => (
  <div
    className="mobile-indicators"
    aria-label="Cellular, Wi-Fi, and battery status"
  >
    {airplane ? (
      <span className="status-airplane">
        <ControlIcon name="airplane" filled />
      </span>
    ) : (
      <svg className="status-signal" viewBox="0 0 18 12" aria-hidden="true">
        <rect x="0" y="7.6" width="3" height="4.4" rx="0.7" />
        <rect x="5" y="5" width="3" height="7" rx="0.7" />
        <rect x="10" y="2.5" width="3" height="9.5" rx="0.7" />
        <rect x="15" y="0" width="3" height="12" rx="0.7" />
      </svg>
    )}
    {wifi ? (
      <svg className="status-wifi" viewBox="1 4 22 16" aria-hidden="true">
        <WifiFan />
      </svg>
    ) : null}
    <svg className="status-battery" viewBox="0 0 28 13" aria-hidden="true">
      <rect className="status-battery-shell" x="0.75" y="0.75" width="22.6" height="11.5" rx="2.5" />
      <rect x="2.35" y="2.35" width="19.4" height="8.3" rx="1.2" />
      <path className="status-battery-cap" d="M24.7 4.15c.85.45 1.4 1.25 1.4 2.35s-.55 1.9-1.4 2.35V4.15z" />
    </svg>
  </div>
);

const getVolumeIcon = (volume: number): ControlIconName =>
  volume === 0 ? "speakerMuted" : "speaker";

const clampPercent = (value: number) =>
  Math.round(Math.max(0, Math.min(100, value)));

const sliderKeySteps: Record<string, number> = {
  ArrowUp: 5,
  ArrowRight: 5,
  ArrowDown: -5,
  ArrowLeft: -5,
  PageUp: 20,
  PageDown: -20,
};

type ControlSliderProps = {
  label: string;
  icon: ControlIconName;
  value: number;
  orientation: "horizontal" | "vertical";
  className?: string;
  filled?: boolean;
  onChange: (value: number) => void;
};

const ControlSlider = ({
  label,
  icon,
  value,
  orientation,
  className = "",
  filled = false,
  onChange,
}: ControlSliderProps) => {
  const updateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio =
      orientation === "vertical"
        ? (rect.bottom - event.clientY) / rect.height
        : (event.clientX - rect.left) / rect.width;
    onChange(clampPercent(ratio * 100));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateFromPointer(event);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    updateFromPointer(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Home") {
      event.preventDefault();
      onChange(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      onChange(100);
      return;
    }
    const step = sliderKeySteps[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    onChange(clampPercent(value + step));
  };

  return (
    <div
      className={`cc-slider ${orientation} ${className}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value}%`}
      style={{ "--cc-value": `${value}%` } as React.CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
    >
      <span className="cc-slider-fill" />
      {orientation === "vertical" ? (
        <>
          <span className="cc-slider-icon cc-slider-icon-light">
            <ControlIcon name={icon} filled={filled} />
          </span>
          <span className="cc-slider-icon-mask">
            <span className="cc-slider-icon">
              <ControlIcon name={icon} filled={filled} />
            </span>
          </span>
        </>
      ) : (
        <ControlIcon name={icon} />
      )}
    </div>
  );
};

type ControlToggleProps = {
  id: ToggleId;
  label: string;
  icon: ControlIconName;
  controls: ControlCenterState;
  className?: string;
  filled?: boolean;
  children?: ReactNode;
};

const ControlToggle = ({
  id,
  label,
  icon,
  controls,
  className = "",
  filled = false,
  children,
}: ControlToggleProps) => (
  <button
    type="button"
    className={`cc-toggle ${className}`}
    data-control={id}
    aria-label={label}
    aria-pressed={controls.toggles[id]}
    onClick={() => controls.onToggle(id)}
  >
    <span className="cc-toggle-icon">
      <ControlIcon name={icon} filled={filled} />
    </span>
    {children}
  </button>
);

const ToggleText = ({ title, status }: { title: string; status?: string }) => (
  <span className="cc-text">
    <b>{title}</b>
    {status ? <small>{status}</small> : null}
  </span>
);

type MusicControls = {
  isPlaying: boolean;
  isDisabled: boolean;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

const MusicControlButtons = ({ music }: { music: MusicControls }) => (
  <div className="cc-music-controls">
    <button
      type="button"
      aria-label="Previous track"
      disabled={music.isDisabled}
      onClick={music.onPrevious}
    >
      <SpotifyIcon name="previous" />
    </button>
    <button
      type="button"
      className="cc-music-play"
      aria-label={music.isPlaying ? "Pause" : "Play"}
      disabled={music.isDisabled}
      onClick={music.onTogglePlay}
    >
      <SpotifyIcon name={music.isPlaying ? "pause" : "play"} />
    </button>
    <button
      type="button"
      aria-label="Next track"
      disabled={music.isDisabled}
      onClick={music.onNext}
    >
      <SpotifyIcon name="next" />
    </button>
  </div>
);

const NowPlaying = ({
  track,
  music,
  className,
  filled = false,
}: {
  track: NowPlayingTrack | null;
  music: MusicControls | null;
  className: string;
  filled?: boolean;
}) => (
  <section className={`cc-tile cc-now-playing ${className}`} aria-label="Now Playing">
    {track ? (
      <img src={track.cover} alt="" />
    ) : (
      <span className="cc-art-placeholder">
        <ControlIcon name="music" filled={filled} />
      </span>
    )}
    {track ? (
      <ToggleText title={track.title} status={track.artist} />
    ) : (
      <ToggleText title="Not Playing" />
    )}
    {music ? <MusicControlButtons music={music} /> : null}
  </section>
);

const desktopConnectivity = [
  { id: "wifi", label: "Wi-Fi", icon: "wifi", onStatus: "Javi's Network" },
  { id: "bluetooth", label: "Bluetooth", icon: "bluetooth", onStatus: "On" },
  { id: "airdrop", label: "AirDrop", icon: "airdrop", onStatus: "Contacts Only" },
] as const;

const mobileConnectivity = [
  { id: "airplane", label: "Airplane Mode", icon: "airplane" },
  { id: "airdrop", label: "AirDrop", icon: "airdrop" },
  { id: "wifi", label: "Wi-Fi", icon: "wifi" },
  { id: "bluetooth", label: "Bluetooth", icon: "bluetooth" },
] as const;

const mobileShortcuts = [
  { icon: "timer", label: "Timer" },
  { icon: "calculator", label: "Calculator" },
  { icon: "camera", label: "Camera" },
] as const;

const useMenuBarPanel = (isOpen: boolean, onClose: () => void) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    panelRef.current?.focus();
    const handlePointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Element;
      if (panelRef.current?.contains(target)) {
        return;
      }
      if (target.closest(".cc-menu-button")) {
        return;
      }
      onClose();
    };
    document.addEventListener("pointerdown", handlePointerDownOutside);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDownOutside);
  }, [isOpen, onClose]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") {
      return;
    }
    onClose();
  };

  return { panelRef, handleKeyDown };
};

const menuBarPanelMotion = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.97 },
  transition: { duration: 0.16, ease: "easeOut" },
} as const;

const DesktopWifiMenu = ({
  isOpen,
  isConnected,
  onConnectedChange,
  onClose,
}: {
  isOpen: boolean;
  isConnected: boolean;
  onConnectedChange: (isConnected: boolean) => void;
  onClose: () => void;
}) => {
  const { panelRef, handleKeyDown } = useMenuBarPanel(isOpen, onClose);

  const handleSwitchClick = () => onConnectedChange(!isConnected);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={panelRef}
          className="wifi-menu desktop-only"
          role="dialog"
          aria-label="Wi-Fi"
          tabIndex={-1}
          {...menuBarPanelMotion}
          onKeyDown={handleKeyDown}
        >
          <div className="wifi-menu-header">
            <b id="wifi-menu-title">Wi-Fi</b>
            <button
              type="button"
              className="wifi-switch"
              role="switch"
              aria-checked={isConnected}
              aria-labelledby="wifi-menu-title"
              onClick={handleSwitchClick}
            >
              <span />
            </button>
          </div>
          {isConnected ? (
            <section className="wifi-menu-section" aria-label="Known Network">
              <small>Known Network</small>
              <div className="wifi-network">
                <span className="wifi-network-icon">
                  <ControlIcon name="wifi" filled />
                </span>
                <span>Javi&apos;s Network</span>
              </div>
            </section>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const BATTERY_LEVEL = 100;

const MenuBarBattery = ({ isLowPowerMode }: { isLowPowerMode: boolean }) => (
  <span
    className={`battery ${isLowPowerMode ? "low-power" : ""}`}
    aria-hidden="true"
  >
    <i style={{ width: `${BATTERY_LEVEL}%` }} />
  </span>
);

const DesktopBatteryMenu = ({
  isOpen,
  isLowPowerMode,
  onLowPowerModeChange,
  onClose,
}: {
  isOpen: boolean;
  isLowPowerMode: boolean;
  onLowPowerModeChange: (isLowPowerMode: boolean) => void;
  onClose: () => void;
}) => {
  const { panelRef, handleKeyDown } = useMenuBarPanel(isOpen, onClose);

  const handleSwitchClick = () => onLowPowerModeChange(!isLowPowerMode);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={panelRef}
          className="wifi-menu battery-menu desktop-only"
          role="dialog"
          aria-label="Battery"
          tabIndex={-1}
          {...menuBarPanelMotion}
          onKeyDown={handleKeyDown}
        >
          <div className="wifi-menu-header">
            <b>Battery</b>
            <span className="battery-menu-percent">{BATTERY_LEVEL}%</span>
          </div>
          <div className="battery-menu-status">
            <span>Power Source: Power Adapter</span>
            <span>Battery Is Charged</span>
          </div>
          <section className="wifi-menu-section" aria-label="Energy Mode">
            <div className="battery-menu-row">
              <span id="low-power-mode-label">Low Power Mode</span>
              <button
                type="button"
                className="wifi-switch"
                role="switch"
                aria-checked={isLowPowerMode}
                aria-labelledby="low-power-mode-label"
                onClick={handleSwitchClick}
              >
                <span />
              </button>
            </div>
          </section>
          <section className="wifi-menu-section" aria-label="Using Significant Energy">
            <small>Using Significant Energy</small>
            <span className="battery-menu-empty">
              No Apps Using Significant Energy
            </span>
          </section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const DesktopControlCenter = ({
  isOpen,
  controls,
  onClose,
}: {
  isOpen: boolean;
  controls: ControlCenterState;
  onClose: () => void;
}) => {
  const { panelRef, handleKeyDown } = useMenuBarPanel(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={panelRef}
          className="cc-desktop desktop-only"
          role="dialog"
          aria-label="Control Center"
          tabIndex={-1}
          {...menuBarPanelMotion}
          onKeyDown={handleKeyDown}
        >
          <section className="cc-tile cc-module cc-connectivity" aria-label="Connectivity">
            {desktopConnectivity.map((item) => (
              <ControlToggle
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                controls={controls}
                className="cc-row"
              >
                <ToggleText
                  title={item.label}
                  status={controls.toggles[item.id] ? item.onStatus : "Off"}
                />
              </ControlToggle>
            ))}
          </section>
          <ControlToggle
            id="focus"
            label="Focus"
            icon="moon"
            controls={controls}
            className="cc-tile cc-module cc-row cc-focus-module"
          >
            <ToggleText
              title="Focus"
              status={controls.toggles.focus ? "Do Not Disturb" : undefined}
            />
          </ControlToggle>
          <ControlToggle
            id="stageManager"
            label="Stage Manager"
            icon="stageManager"
            controls={controls}
            className="cc-tile cc-module cc-square"
          >
            <small>Stage Manager</small>
          </ControlToggle>
          <ControlToggle
            id="mirroring"
            label="Screen Mirroring"
            icon="mirroring"
            controls={controls}
            className="cc-tile cc-module cc-square"
          >
            <small>Screen Mirroring</small>
          </ControlToggle>
          <section className="cc-tile cc-module cc-wide">
            <b>Display</b>
            <ControlSlider
              label="Display brightness"
              icon="sun"
              orientation="horizontal"
              value={controls.brightness}
              onChange={controls.onBrightnessChange}
            />
          </section>
          <section className="cc-tile cc-module cc-wide">
            <b>Sound</b>
            <ControlSlider
              label="Sound volume"
              icon={getVolumeIcon(controls.volume)}
              orientation="horizontal"
              value={controls.volume}
              onChange={controls.onVolumeChange}
            />
          </section>
          <NowPlaying
            track={controls.nowPlaying}
            music={controls.music}
            className="cc-module cc-wide"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

const PULL_DISTANCE = 220;
const TAP_SLOP = 8;
const OPEN_THRESHOLD = 0.3;
const CLOSE_THRESHOLD = 0.7;
const FLICK_SPEED = 1.15;
const MAX_FLING = 3.2;
const VELOCITY_WINDOW = 90;
const OVERPULL_LIMIT = 0.14;
// Touches starting this far down still pull, beyond the strip that captures taps.
const EDGE_ZONE = 76;
const MOBILE_QUERY = "(max-width: 700px)";
// Sideways travel allowed per unit of downward travel before a pull is refused.
const HANDLE_SLANT = 2;
const EDGE_SLANT = 1;
const OPEN_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 23,
  mass: 0.85,
  restDelta: 0.001,
  restSpeed: 0.06,
};
const CLOSE_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 38,
  mass: 0.8,
  restDelta: 0.001,
  restSpeed: 0.06,
};

type PullPoint = { x: number; y: number; time: number };
type PullSample = { y: number; time: number };
type PullSource = "pointer" | "touch";
type PullGesture = {
  id: number;
  source: PullSource;
  startX: number;
  startY: number;
  startProgress: number;
  slant: number;
  wasOpen: boolean;
  rejected: boolean;
  moved: boolean;
  samples: PullSample[];
};

const resistPull = (rawProgress: number) => {
  if (rawProgress <= 0) {
    return 0;
  }
  if (rawProgress <= 1) {
    return rawProgress;
  }
  const excess = rawProgress - 1;
  return 1 + (OVERPULL_LIMIT * excess) / (excess + 0.6);
};

const readPointerPoint = (event: React.PointerEvent): PullPoint => ({
  x: event.clientX,
  y: event.clientY,
  time: event.timeStamp,
});

const readTouchPoint = (touch: Touch, time: number): PullPoint => ({
  x: touch.clientX,
  y: touch.clientY,
  time,
});

const findTouch = (touches: TouchList, id: number) =>
  Array.from(touches).find((touch) => touch.identifier === id);

const MobileControlCenter = ({ controls }: { controls: ControlCenterState }) => {
  const progress = useMotionValue(0);
  const panelY = useTransform(
    progress,
    [0, 1, 1 + OVERPULL_LIMIT],
    [-96, 0, 22],
    { clamp: false },
  );
  const panelScale = useTransform(
    progress,
    [0, 1, 1 + OVERPULL_LIMIT],
    [0.88, 1, 1.025],
    { clamp: false },
  );
  const overlayOpacity = useTransform(progress, [0, 0.55], [0, 1]);
  const gridStyle = {
    y: panelY,
    scale: panelScale,
    "--cc-progress": progress,
  } as MotionStyle;
  const reduceMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pullHandleRef = useRef<HTMLButtonElement>(null);
  const gestureRef = useRef<PullGesture | null>(null);
  const suppressClickRef = useRef(false);
  const settleGeneration = useRef(0);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    overlayRef.current?.focus();
  }, [isVisible]);

  const settle = (shouldOpen: boolean, velocity = 0) => {
    const generation = ++settleGeneration.current;
    setIsVisible(true);
    const transition = reduceMotion
      ? { duration: 0 }
      : { ...(shouldOpen ? OPEN_SPRING : CLOSE_SPRING), velocity };
    animate(progress, shouldOpen ? 1 : 0, {
      ...transition,
      onComplete: () => {
        if (generation !== settleGeneration.current) {
          return;
        }
        if (shouldOpen) {
          return;
        }
        setIsVisible(false);
        pullHandleRef.current?.focus({ preventScroll: true });
      },
    });
  };

  const beginPull = (
    source: PullSource,
    id: number,
    point: PullPoint,
    wasOpen: boolean,
    slant: number,
  ) => {
    settleGeneration.current += 1;
    progress.stop();
    suppressClickRef.current = false;
    gestureRef.current = {
      id,
      source,
      startX: point.x,
      startY: point.y,
      startProgress: Math.max(0, Math.min(1, progress.get())),
      slant,
      wasOpen,
      rejected: false,
      moved: false,
      samples: [{ y: point.y, time: point.time }],
    };
  };

  const noteSample = (gesture: PullGesture, point: PullPoint) => {
    gesture.samples.push({ y: point.y, time: point.time });
    const cutoff = point.time - VELOCITY_WINDOW;
    while (gesture.samples.length > 1 && gesture.samples[0].time < cutoff) {
      gesture.samples.shift();
    }
  };

  const readVelocity = (gesture: PullGesture) => {
    const first = gesture.samples[0];
    const last = gesture.samples[gesture.samples.length - 1];
    const elapsed = last.time - first.time;
    if (elapsed < 12) return 0;
    const velocity = (((last.y - first.y) / elapsed) * 1000) / PULL_DISTANCE;
    return Math.max(-MAX_FLING, Math.min(MAX_FLING, velocity));
  };

  const isPullDirection = (
    gesture: PullGesture,
    deltaX: number,
    deltaY: number,
  ) => {
    if (gesture.wasOpen) {
      return Math.abs(deltaY) >= Math.abs(deltaX);
    }
    return deltaY > 0 && Math.abs(deltaX) <= deltaY * gesture.slant;
  };

  const trackPull = (gesture: PullGesture, point: PullPoint) => {
    if (gesture.rejected) {
      return;
    }
    noteSample(gesture, point);
    const deltaX = point.x - gesture.startX;
    const deltaY = point.y - gesture.startY;
    if (!gesture.moved) {
      if (Math.hypot(deltaX, deltaY) <= TAP_SLOP) {
        return;
      }
      if (!isPullDirection(gesture, deltaX, deltaY)) {
        gesture.rejected = true;
        return;
      }
      gesture.moved = true;
    }
    setIsVisible(true);
    progress.set(resistPull(gesture.startProgress + deltaY / PULL_DISTANCE));
  };

  const finishPull = (
    gesture: PullGesture,
    point: PullPoint,
    target: EventTarget | null,
  ) => {
    // Include the release: a flick followed by a pause must not retain momentum.
    trackPull(gesture, point);
    gestureRef.current = null;
    suppressClickRef.current = gesture.moved || gesture.rejected;
    if (gesture.rejected) {
      if (gesture.wasOpen) {
        settle(true);
      }
      return;
    }
    if (!gesture.moved) {
      // Taps near the top edge belong to whatever is under the finger.
      if (gesture.source === "touch") {
        return;
      }
      const tappedTile = target instanceof Element && target.closest(".cc-tile");
      settle(!gesture.wasOpen || Boolean(tappedTile));
      return;
    }
    const velocity = readVelocity(gesture);
    const threshold = gesture.wasOpen ? CLOSE_THRESHOLD : OPEN_THRESHOLD;
    const isFlickDown = velocity >= FLICK_SPEED;
    const isFlickUp = velocity <= -FLICK_SPEED;
    const shouldOpen = isFlickDown || (!isFlickUp && progress.get() > threshold);
    settle(shouldOpen, velocity);
  };

  const abortPull = (gesture: PullGesture) => {
    gestureRef.current = null;
    suppressClickRef.current = true;
    if (!gesture.wasOpen && !gesture.moved) {
      return;
    }
    settle(gesture.wasOpen);
  };

  const readPointerGesture = (event: React.PointerEvent) => {
    const gesture = gestureRef.current;
    if (
      !gesture ||
      gesture.source !== "pointer" ||
      gesture.id !== event.pointerId
    ) {
      return null;
    }
    return gesture;
  };

  const handlePullPointerDown = (
    event: React.PointerEvent<HTMLElement>,
    wasOpen: boolean,
  ) => {
    if (!event.isPrimary || event.button !== 0 || gestureRef.current) {
      return;
    }
    const slant = wasOpen ? 1 : HANDLE_SLANT;
    beginPull("pointer", event.pointerId, readPointerPoint(event), wasOpen, slant);
    // Keep the opening gesture even when its overlay appears under the finger.
    // For tiles, defer capture until a drag so taps still reach their buttons.
    if (!wasOpen) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePullPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const gesture = readPointerGesture(event);
    if (!gesture) {
      return;
    }
    const wasMoved = gesture.moved;
    trackPull(gesture, readPointerPoint(event));
    if (gesture.moved && !wasMoved) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handlePullPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const gesture = readPointerGesture(event);
    if (!gesture) {
      return;
    }
    finishPull(gesture, readPointerPoint(event), event.target);
  };

  const handlePullPointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    // Moving capture from a tile to the overlay also fires a bubbling lost event.
    const isBubbledCaptureLoss =
      event.type === "lostpointercapture" && event.target !== event.currentTarget;
    if (isBubbledCaptureLoss) {
      return;
    }
    const gesture = readPointerGesture(event);
    if (!gesture) {
      return;
    }
    abortPull(gesture);
  };

  const readTouchGesture = (event: TouchEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.source !== "touch") {
      return null;
    }
    const touch = findTouch(event.changedTouches, gesture.id);
    if (!touch) {
      return null;
    }
    return { gesture, point: readTouchPoint(touch, event.timeStamp) };
  };

  const handleEdgeTouchStart = useEffectEvent((event: TouchEvent) => {
    if (isVisible || gestureRef.current || event.touches.length !== 1) {
      return;
    }
    if (!window.matchMedia(MOBILE_QUERY).matches) {
      return;
    }
    const touch = event.changedTouches[0];
    if (touch.clientY > EDGE_ZONE) {
      return;
    }
    const isOwnSurface =
      event.target instanceof Element &&
      event.target.closest(".cc-pull-handle, .cc-mobile-overlay");
    if (isOwnSurface) {
      return;
    }
    const point = readTouchPoint(touch, event.timeStamp);
    beginPull("touch", touch.identifier, point, false, EDGE_SLANT);
  });

  const handleEdgeTouchMove = useEffectEvent((event: TouchEvent) => {
    const active = readTouchGesture(event);
    if (!active) {
      return;
    }
    const { gesture, point } = active;
    trackPull(gesture, point);
    if (gesture.rejected) {
      gestureRef.current = null;
      return;
    }
    // Claim the touch before the page starts scrolling, which iOS won't undo.
    const isHeadingDown = point.y > gesture.startY;
    if (event.cancelable && (gesture.moved || isHeadingDown)) {
      event.preventDefault();
    }
  });

  const handleEdgeTouchEnd = useEffectEvent((event: TouchEvent) => {
    const active = readTouchGesture(event);
    if (!active) {
      return;
    }
    if (event.type === "touchcancel") {
      abortPull(active.gesture);
      return;
    }
    finishPull(active.gesture, active.point, event.target);
  });

  useEffect(() => {
    const listenForTouchStart = (event: TouchEvent) => handleEdgeTouchStart(event);
    const listenForTouchMove = (event: TouchEvent) => handleEdgeTouchMove(event);
    const listenForTouchEnd = (event: TouchEvent) => handleEdgeTouchEnd(event);
    window.addEventListener("touchstart", listenForTouchStart, { passive: true });
    window.addEventListener("touchmove", listenForTouchMove, { passive: false });
    window.addEventListener("touchend", listenForTouchEnd);
    window.addEventListener("touchcancel", listenForTouchEnd);
    return () => {
      window.removeEventListener("touchstart", listenForTouchStart);
      window.removeEventListener("touchmove", listenForTouchMove);
      window.removeEventListener("touchend", listenForTouchEnd);
      window.removeEventListener("touchcancel", listenForTouchEnd);
    };
  }, []);

  const handlePullClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Pointer taps are handled on release; keyboard/assistive clicks arrive here.
    if (event.detail === 0) settle(true);
  };

  const handleOverlayClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) {
      return;
    }
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") {
      return;
    }
    settle(false);
  };

  return (
    <>
      <button
        type="button"
        ref={pullHandleRef}
        className="cc-pull-handle"
        aria-label="Open Control Center"
        aria-expanded={isVisible}
        aria-haspopup="dialog"
        onPointerDown={(event) => handlePullPointerDown(event, false)}
        onPointerMove={handlePullPointerMove}
        onPointerUp={handlePullPointerUp}
        onPointerCancel={handlePullPointerCancel}
        onLostPointerCapture={handlePullPointerCancel}
        onClick={handlePullClick}
      />
      {isVisible ? (
        <motion.div
          ref={overlayRef}
          className="cc-mobile-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Control Center"
          tabIndex={-1}
          style={{ opacity: overlayOpacity }}
          onPointerDown={(event) => handlePullPointerDown(event, true)}
          onPointerMove={handlePullPointerMove}
          onPointerUp={handlePullPointerUp}
          onPointerCancel={handlePullPointerCancel}
          onLostPointerCapture={handlePullPointerCancel}
          onClickCapture={handleOverlayClickCapture}
          onKeyDown={handleOverlayKeyDown}
        >
          <motion.div
            className="cc-mobile-grid"
            style={gridStyle}
          >
            <section className="cc-tile cc-connect-grid" aria-label="Connectivity">
              {mobileConnectivity.map((item) => (
                <ControlToggle
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  controls={controls}
                  className="cc-round-toggle"
                  filled
                />
              ))}
            </section>
            <NowPlaying
              track={controls.nowPlaying}
              music={controls.music}
              className="cc-block"
              filled
            />
            <ControlToggle
              id="rotationLock"
              label="Orientation Lock"
              icon="rotationLock"
              controls={controls}
              className="cc-tile cc-icon-tile"
              filled
            />
            <ControlToggle
              id="mirroring"
              label="Screen Mirroring"
              icon="mirroring"
              controls={controls}
              className="cc-tile cc-icon-tile"
              filled
            />
            <ControlSlider
              label="Brightness"
              icon="sun"
              orientation="vertical"
              className="cc-tile"
              filled
              value={controls.brightness}
              onChange={controls.onBrightnessChange}
            />
            <ControlSlider
              label="Volume"
              icon={getVolumeIcon(controls.volume)}
              orientation="vertical"
              className="cc-tile"
              filled
              value={controls.volume}
              onChange={controls.onVolumeChange}
            />
            <ControlToggle
              id="focus"
              label="Focus"
              icon="moon"
              controls={controls}
              className="cc-tile cc-row cc-focus-tile"
              filled
            >
              <ToggleText
                title="Focus"
                status={controls.toggles.focus ? "On" : undefined}
              />
            </ControlToggle>
            <ControlToggle
              id="flashlight"
              label="Flashlight"
              icon="flashlight"
              controls={controls}
              className="cc-tile cc-icon-tile"
              filled
            />
            {mobileShortcuts.map((shortcut) => (
              <span
                key={shortcut.icon}
                className="cc-tile cc-icon-tile"
                role="img"
                aria-label={shortcut.label}
              >
                <span className="cc-toggle-icon">
                  <ControlIcon name={shortcut.icon} filled />
                </span>
              </span>
            ))}
          </motion.div>
          <button
            type="button"
            className="cc-dismiss-handle"
            aria-label="Close Control Center"
            onClick={() => settle(false)}
          >
            <span />
          </button>
        </motion.div>
      ) : null}
    </>
  );
};

type IconPosition = {
  x: number;
  y: number;
};

type DesktopSize = { width: number; height: number };

const DESKTOP_POSITIONS_KEY = "javi-os-desktop-icon-positions-v2";
const DRAG_THRESHOLD = 4;
const DOCK_CLEARANCE = 108;
const DESKTOP_EDGE_INSET = 28;
const DESKTOP_ICON_WIDTH = 112;
const DESKTOP_ICON_ROW_HEIGHT = 126;
const DESKTOP_ICON_COLUMN_GAP = 16;
const DESKTOP_WIDGET_HEIGHT = 166;
const DESKTOP_WIDGET_GAP = 16;
const SPOTIFY_WIDGET_LAYOUT_KEY = "javi-os-spotify-widget-layout";
const SPOTIFY_WIDGET_LAYOUT = "square-below-weather";
const FIXED_DESKTOP_ICON_IDS = [
  "projects-folder",
  "certifications-folder",
  "cv-pdf",
  "intro-mov",
] as const;
const STRAY_ICON_ID = "folder";
const STRAY_ICON_ANCHOR = { x: 0.21, y: 0.64 };
const FALLBACK_DESKTOP_SIZE: DesktopSize = { width: 1440, height: 872 };

const createDefaultDesktopPositions = (
  { width, height }: DesktopSize,
  iconIds: readonly string[],
) => {
  const toPercent = (left: number, top: number): IconPosition => ({
    x: (left / width) * 100,
    y: (top / height) * 100,
  });
  const usableHeight = height - DOCK_CLEARANCE - DESKTOP_EDGE_INSET;
  const rowsPerColumn = Math.max(
    1,
    Math.floor(usableHeight / DESKTOP_ICON_ROW_HEIGHT),
  );
  const firstColumnLeft = width - DESKTOP_EDGE_INSET - DESKTOP_ICON_WIDTH;
  const positions: Record<string, IconPosition> = {
    "weather-widget": toPercent(DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
    "spotify-widget": toPercent(
      DESKTOP_EDGE_INSET,
      DESKTOP_EDGE_INSET + DESKTOP_WIDGET_HEIGHT + DESKTOP_WIDGET_GAP,
    ),
    [STRAY_ICON_ID]: toPercent(
      width * STRAY_ICON_ANCHOR.x,
      (height - DOCK_CLEARANCE) * STRAY_ICON_ANCHOR.y,
    ),
  };
  iconIds.forEach((id, index) => {
    const column = Math.floor(index / rowsPerColumn);
    const row = index % rowsPerColumn;
    positions[id] = toPercent(
      firstColumnLeft - column * (DESKTOP_ICON_WIDTH + DESKTOP_ICON_COLUMN_GAP),
      DESKTOP_EDGE_INSET + row * DESKTOP_ICON_ROW_HEIGHT,
    );
  });
  return positions;
};


const readDesktopPositions = (fallback: Record<string, IconPosition>) => {
  try {
    const raw = localStorage.getItem(DESKTOP_POSITIONS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, Partial<IconPosition>>;
    const next: Record<string, IconPosition> = { ...fallback };
    for (const id of Object.keys(fallback)) {
      const value = parsed[id];
      if (!value) continue;
      if (typeof value.x !== "number" || typeof value.y !== "number") continue;
      if (!Number.isFinite(value.x) || !Number.isFinite(value.y)) continue;
      next[id] = {
        x: clamp(value.x, 0, 92),
        y: clamp(value.y, 0, 88),
      };
    }
    return next;
  } catch {
    return null;
  }
};

type MemeImage = {
  id: string;
  src: string;
  label: string;
  alt: string;
  ratio: number;
  markupStorageKey: string;
};

const memeImages = [
  {
    id: "iq-image",
    src: "/os/iq-bell-curve.jpg",
    label: "meme.jpg",
    alt: "IQ score bell curve, with a smiling face at the low end, a crying face at the average, and a hooded face at the high end.",
    ratio: 1024 / 757,
    markupStorageKey: "javi-os-preview-iq-markup",
  },
  {
    id: "smart-rich-image",
    src: "/os/so-smart-why-not-rich.jpg",
    label: "meme 2.jpg",
    alt: "MIT Technology Review headline: “If you’re so smart, why aren’t you rich? Turns out you’re fucking stupid.”",
    ratio: 896 / 829,
    markupStorageKey: "javi-os-preview-smart-rich-markup",
  },
] as const satisfies readonly MemeImage[];

type MemeId = (typeof memeImages)[number]["id"];

const DESKTOP_ICON_ORDER = [
  ...FIXED_DESKTOP_ICON_IDS,
  ...memeImages.map((meme) => meme.id),
] as const;

const defaultDesktopPositions = createDefaultDesktopPositions(
  FALLBACK_DESKTOP_SIZE,
  DESKTOP_ICON_ORDER,
);

const positionFor = (positions: Record<string, IconPosition>, id: string): IconPosition =>
  positions[id] ?? { x: 4, y: 4 };

const findMemeImage = (id: MemeId): MemeImage => {
  const meme = memeImages.find((item) => item.id === id);
  if (!meme) throw new Error(`Unknown meme ${id}`);
  return meme;
};

const PREVIEW_ZOOM_MIN = 25;
const PREVIEW_ZOOM_MAX = 400;
const PREVIEW_ZOOM_STEP = 25;
const PREVIEW_COMPACT_QUERY = "(max-width: 700px)";

const PREVIEW_TEXT_SCALE = 0.034;

const markupTools = [
  { id: "pen", label: "Pen" },
  { id: "highlight", label: "Highlighter" },
  { id: "text", label: "Text" },
  { id: "note", label: "Note" },
] as const;
type MarkupTool = (typeof markupTools)[number]["id"];
type StrokeTool = Extract<MarkupTool, "pen" | "highlight">;
type SavedStrokeKind = StrokeTool | "shape";
type TextTool = Extract<MarkupTool, "text" | "note">;
type MarkPoint = { x: number; y: number };
type StrokeMark = {
  id: number;
  kind: SavedStrokeKind;
  color: string;
  points: MarkPoint[];
};
type TextMark = {
  id: number;
  kind: TextTool;
  color: string;
  x: number;
  y: number;
  value: string;
};
type Mark = StrokeMark | TextMark;
type PreviewSize = { width: number; height: number };
type ZoomAnchor = {
  offsetX: number;
  offsetY: number;
  fractionX: number;
  fractionY: number;
};
type PinchState = { distance: number; zoom: number; anchor: ZoomAnchor };

const isCompactViewport = () =>
  typeof window !== "undefined" && window.matchMedia(PREVIEW_COMPACT_QUERY).matches;

const readZoomAnchor = (
  area: HTMLElement,
  clientX: number,
  clientY: number,
): ZoomAnchor => {
  const rect = area.getBoundingClientRect();
  const offsetX = clientX - rect.left;
  const offsetY = clientY - rect.top;
  return {
    offsetX,
    offsetY,
    fractionX: (area.scrollLeft + offsetX) / area.scrollWidth,
    fractionY: (area.scrollTop + offsetY) / area.scrollHeight,
  };
};

const applyZoomAnchor = (area: HTMLElement, anchor: ZoomAnchor) => {
  area.scrollLeft = anchor.fractionX * area.scrollWidth - anchor.offsetX;
  area.scrollTop = anchor.fractionY * area.scrollHeight - anchor.offsetY;
};

const readTouchDistance = (touches: TouchList) =>
  Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

const readTouchMidpoint = (touches: TouchList) => ({
  x: (touches[0].clientX + touches[1].clientX) / 2,
  y: (touches[0].clientY + touches[1].clientY) / 2,
});

const previewColors = [
  { value: "#ff375f", label: "Red" },
  { value: "#ffd60a", label: "Yellow" },
  { value: "#30d158", label: "Green" },
  { value: "#0a84ff", label: "Blue" },
  { value: "#111111", label: "Black" },
] as const;

const strokeWidths: Record<SavedStrokeKind, number> = {
  pen: 0.005,
  highlight: 0.026,
  shape: 0.005,
};

const isStrokeTool = (tool: MarkupTool): tool is StrokeTool =>
  tool === "pen" || tool === "highlight";

const isSavedStrokeKind = (kind: string): kind is SavedStrokeKind =>
  kind === "pen" || kind === "highlight" || kind === "shape";

const isStrokeMark = (mark: Mark): mark is StrokeMark => isSavedStrokeKind(mark.kind);

const isTextMark = (mark: Mark): mark is TextMark =>
  mark.kind === "text" || mark.kind === "note";

const drawStrokeMark = (
  context: CanvasRenderingContext2D,
  mark: StrokeMark,
  size: PreviewSize,
) => {
  const [first, ...rest] = mark.points;
  if (!first) {
    return;
  }
  context.save();
  context.strokeStyle = mark.color;
  context.lineWidth = strokeWidths[mark.kind] * size.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  if (mark.kind === "highlight") {
    context.globalAlpha = 0.4;
    context.lineCap = "butt";
  }
  if (mark.kind === "shape") {
    const last = rest[rest.length - 1] ?? first;
    context.strokeRect(
      first.x * size.width,
      first.y * size.height,
      (last.x - first.x) * size.width,
      (last.y - first.y) * size.height,
    );
    context.restore();
    return;
  }
  context.beginPath();
  context.moveTo(first.x * size.width, first.y * size.height);
  if (rest.length === 0) {
    context.lineTo(first.x * size.width + 0.1, first.y * size.height);
  }
  rest.forEach((point) => {
    context.lineTo(point.x * size.width, point.y * size.height);
  });
  context.stroke();
  context.restore();
};

const fitPreviewSheet = (
  area: PreviewSize,
  quarterTurn: boolean,
  zoom: number,
  imageRatio: number,
) => {
  const boxRatio = quarterTurn ? 1 / imageRatio : imageRatio;
  const boxWidth = Math.min(area.width, area.height * boxRatio) * zoom;
  const boxHeight = boxWidth / boxRatio;
  const sheetWidth = quarterTurn ? boxHeight : boxWidth;
  return {
    box: { width: boxWidth, height: boxHeight },
    sheet: { width: sheetWidth, height: sheetWidth / imageRatio },
  };
};

const useElementSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<PreviewSize>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
};

type PreviewGlyphName =
  | MarkupTool
  | "sidebar"
  | "minus"
  | "plus"
  | "markup"
  | "rotate"
  | "share"
  | "undo"
  | "clear";

const PreviewGlyph = ({ name }: { name: PreviewGlyphName }) => {
  const glyphs = {
    sidebar: (
      <>
        <rect x="1.4" y="2" width="13.2" height="12" rx="1.6" />
        <path d="M6.1 2.4v11.2" />
      </>
    ),
    minus: <path d="M3.2 8h9.6" />,
    plus: (
      <>
        <path d="M8 3.2v9.6" />
        <path d="M3.2 8h9.6" />
      </>
    ),
    markup: (
      <path d="M2.8 13.2 3.6 10 11.4 2.2a1.15 1.15 0 0 1 1.6 1.6L5.2 11.6Z" />
    ),
    rotate: (
      <>
        <path d="M13 6.4a5.1 5.1 0 1 0 .4 3.2" />
        <path d="M13.1 2.7v3.8H9.3" />
      </>
    ),
    share: (
      <>
        <path d="M4 6.6v5.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6.6" />
        <path d="M8 9.2V2.4" />
        <path d="M5.3 5 8 2.3 10.7 5" />
      </>
    ),
    pen: (
      <path d="M3.2 12.8 4 9.6 11.2 2.4a1 1 0 0 1 1.4 1.4L5.4 11Z" />
    ),
    highlight: (
      <path
        className="preview-glyph-fill"
        d="M2.4 10.2 5.2 13h2.2l6.2-6.2-2.8-2.8Z"
      />
    ),
    text: (
      <>
        <path d="M3.2 3.4h9.6" />
        <path d="M8 3.4v9.4" />
      </>
    ),
    note: (
      <path d="M3 3.2h10v7.2H7.2L4.4 13V10.4H3Z" />
    ),
    undo: (
      <>
        <path d="M5.4 3.6 2.6 6.4l2.8 2.8" />
        <path d="M2.8 6.4h6.4a3.6 3.6 0 0 1 0 7.2H6.6" />
      </>
    ),
    clear: (
      <>
        <path d="M2.8 4.4h10.4" />
        <path d="M6.4 4.2V2.8h3.2v1.4" />
        <path d="M4.2 4.6 5 13.2h6l.8-8.6" />
      </>
    ),
  } satisfies Record<PreviewGlyphName, ReactNode>;

  return (
    <svg className="preview-glyph" viewBox="0 0 16 16" aria-hidden="true">
      {glyphs[name]}
    </svg>
  );
};

const strokeKinds: readonly string[] = ["pen", "highlight", "shape"];
const textKinds: readonly string[] = ["text", "note"];

const isSavedPoint = (value: unknown): value is MarkPoint => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const point = value as Record<string, unknown>;
  return typeof point.x === "number" && typeof point.y === "number";
};

const isSavedMark = (value: unknown): value is Mark => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const mark = value as Record<string, unknown>;
  if (typeof mark.id !== "number" || typeof mark.color !== "string") {
    return false;
  }
  if (typeof mark.kind !== "string") {
    return false;
  }
  if (strokeKinds.includes(mark.kind)) {
    return Array.isArray(mark.points) && mark.points.every(isSavedPoint);
  }
  if (!textKinds.includes(mark.kind)) {
    return false;
  }
  return (
    typeof mark.x === "number" &&
    typeof mark.y === "number" &&
    typeof mark.value === "string"
  );
};

const readSavedMarks = (storageKey: string): Mark[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const seen = new Set<number>();
    return parsed.filter(isSavedMark).filter((mark) => {
      if (seen.has(mark.id)) return false;
      seen.add(mark.id);
      return true;
    });
  } catch {
    return [];
  }
};

const withoutEmptyText = (marks: Mark[]) =>
  marks.filter((mark) => !isTextMark(mark) || mark.value.trim() !== "");

const readNextMarkId = (marks: Mark[]) =>
  marks.reduce((highest, mark) => Math.max(highest, mark.id), 0) + 1;

type PreviewAppProps = {
  meme: MemeImage;
  marks: Mark[];
  setMarks: React.Dispatch<React.SetStateAction<Mark[]>>;
};

const PreviewApp = ({ meme, marks, setMarks }: PreviewAppProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(() => !isCompactViewport());
  const [markupOpen, setMarkupOpen] = useState(() => !isCompactViewport());

  useEffect(() => {
    const media = window.matchMedia(PREVIEW_COMPACT_QUERY);
    const syncPanels = () => {
      setSidebarOpen(!media.matches);
      setMarkupOpen(!media.matches);
    };
    media.addEventListener("change", syncPanels);
    return () => media.removeEventListener("change", syncPanels);
  }, []);
  const [markupTool, setMarkupTool] = useState<MarkupTool>("pen");
  const [markupColor, setMarkupColor] = useState<string>(previewColors[0].value);
  const [draft, setDraft] = useState<StrokeMark | null>(null);
  const [focusTextId, setFocusTextId] = useState<number | null>(null);
  const nextMarkId = useRef(readNextMarkId(marks));
  const sheetRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const { ref: canvasAreaRef, size: canvasArea } = useElementSize<HTMLDivElement>();
  const quarterTurn = rotation % 180 !== 0;
  const { box, sheet } = fitPreviewSheet(
    canvasArea,
    quarterTurn,
    zoom / 100,
    meme.ratio,
  );
  const textMarks = marks.filter(isTextMark);
  const zoomRef = useRef(zoom);
  const pendingZoomAnchor = useRef<ZoomAnchor | null>(null);

  const sheetWidth = sheet.width;
  const sheetHeight = sheet.height;

  const zoomTo = useCallback((value: number, anchor: ZoomAnchor | null) => {
    const nextZoom = clamp(value, PREVIEW_ZOOM_MIN, PREVIEW_ZOOM_MAX);
    const area = canvasAreaRef.current;
    if (nextZoom === zoomRef.current) {
      if (area && anchor) {
        applyZoomAnchor(area, anchor);
      }
      return;
    }
    zoomRef.current = nextZoom;
    pendingZoomAnchor.current = anchor;
    setZoom(nextZoom);
  }, [canvasAreaRef]);

  const zoomAroundCenter = (value: number) => {
    const area = canvasAreaRef.current;
    if (!area) {
      zoomTo(value, null);
      return;
    }
    const rect = area.getBoundingClientRect();
    zoomTo(
      value,
      readZoomAnchor(area, rect.left + rect.width / 2, rect.top + rect.height / 2),
    );
  };

  useLayoutEffect(() => {
    const area = canvasAreaRef.current;
    const anchor = pendingZoomAnchor.current;
    if (!area || !anchor) {
      return;
    }
    pendingZoomAnchor.current = null;
    applyZoomAnchor(area, anchor);
  }, [zoom, canvasAreaRef]);

  useEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) {
      return;
    }
    let pinch: PinchState | null = null;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        return;
      }
      const midpoint = readTouchMidpoint(event.touches);
      pinch = {
        distance: readTouchDistance(event.touches),
        zoom: zoomRef.current,
        anchor: readZoomAnchor(area, midpoint.x, midpoint.y),
      };
      setDraft(null);
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (!pinch || event.touches.length !== 2) {
        return;
      }
      event.preventDefault();
      if (pinch.distance === 0) return;
      const rect = area.getBoundingClientRect();
      const midpoint = readTouchMidpoint(event.touches);
      const scale = readTouchDistance(event.touches) / pinch.distance;
      zoomTo(pinch.zoom * scale, {
        ...pinch.anchor,
        offsetX: midpoint.x - rect.left,
        offsetY: midpoint.y - rect.top,
      });
    };
    const handleTouchEnd = (event: TouchEvent) => {
      if (event.touches.length >= 2) {
        return;
      }
      pinch = null;
    };

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const nextZoom = zoomRef.current * Math.exp(-event.deltaY * 0.01);
      zoomTo(nextZoom, readZoomAnchor(area, event.clientX, event.clientY));
    };

    area.addEventListener("touchstart", handleTouchStart, { passive: true });
    area.addEventListener("touchmove", handleTouchMove, { passive: false });
    area.addEventListener("touchend", handleTouchEnd);
    area.addEventListener("touchcancel", handleTouchEnd);
    area.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      area.removeEventListener("touchstart", handleTouchStart);
      area.removeEventListener("touchmove", handleTouchMove);
      area.removeEventListener("touchend", handleTouchEnd);
      area.removeEventListener("touchcancel", handleTouchEnd);
      area.removeEventListener("wheel", handleWheel);
    };
  }, [zoomTo, canvasAreaRef]);

  useEffect(() => {
    const ink = inkRef.current;
    if (!ink) {
      return;
    }
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    ink.width = Math.max(1, Math.round(sheetWidth * scale));
    ink.height = Math.max(1, Math.round(sheetHeight * scale));
    const context = ink.getContext("2d");
    if (!context) {
      return;
    }
    context.scale(scale, scale);
    const size = { width: sheetWidth, height: sheetHeight };
    const strokes = draft ? [...marks, draft] : marks;
    strokes.filter(isStrokeMark).forEach((mark) => {
      drawStrokeMark(context, mark, size);
    });
  }, [marks, draft, sheetWidth, sheetHeight]);

  const readSheetPoint = (event: React.PointerEvent<HTMLDivElement>) => {
    const element = sheetRef.current;
    if (!element) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const angle = (rotation * Math.PI) / 180;
    const localX = dx * Math.cos(angle) + dy * Math.sin(angle);
    const localY = -dx * Math.sin(angle) + dy * Math.cos(angle);
    return {
      x: clamp(localX / element.offsetWidth + 0.5, 0, 1),
      y: clamp(localY / element.offsetHeight + 0.5, 0, 1),
    };
  };

  const handleSheetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      setDraft(null);
      return;
    }
    if (!markupOpen || event.button !== 0) {
      return;
    }
    if ((event.target as Element).closest(".preview-text")) {
      return;
    }
    const point = readSheetPoint(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    const id = nextMarkId.current++;
    if (!isStrokeTool(markupTool)) {
      setMarks((current) => [
        ...current,
        { id, kind: markupTool, color: markupColor, ...point, value: "" },
      ]);
      setFocusTextId(id);
      return;
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture needs an active pointer. Drawing still follows later events.
    }
    setDraft({ id, kind: markupTool, color: markupColor, points: [point] });
  };

  const handleSheetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draft || !event.isPrimary) {
      return;
    }
    const point = readSheetPoint(event);
    if (!point) {
      return;
    }
    setDraft({ ...draft, points: [...draft.points, point] });
  };

  const handleSheetPointerUp = () => {
    if (!draft) {
      return;
    }
    setMarks((current) => [...current, draft]);
    setDraft(null);
  };

  const handleTextChange = (id: number, value: string) => {
    setMarks((current) =>
      current.map((mark) => {
        if (mark.id !== id || !isTextMark(mark)) {
          return mark;
        }
        return { ...mark, value };
      }),
    );
  };

  const handleTextBlur = (mark: TextMark) => {
    setFocusTextId(null);
    if (mark.value.trim()) {
      return;
    }
    setMarks((current) => current.filter((item) => item.id !== mark.id));
  };

  const handleTextKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== "Escape") {
      return;
    }
    event.currentTarget.blur();
  };

  const handleUndo = () => {
    setMarks((current) => current.slice(0, -1));
  };
  const handleClear = () => {
    setMarks([]);
  };
  const handleSelectColor = (color: string) => {
    setMarkupColor(color);
  };

  const handleZoomOut = () => {
    zoomAroundCenter((Math.ceil(zoom / PREVIEW_ZOOM_STEP) - 1) * PREVIEW_ZOOM_STEP);
  };
  const handleZoomIn = () => {
    zoomAroundCenter((Math.floor(zoom / PREVIEW_ZOOM_STEP) + 1) * PREVIEW_ZOOM_STEP);
  };
  const handleShare = async () => {
    const url = new URL(meme.src, window.location.href).href;
    if (!navigator.share) {
      window.open(url, "_blank", "noopener");
      return;
    }
    try {
      await navigator.share({ title: meme.label, url });
    } catch {
      // The share sheet was dismissed.
    }
  };
  const handleRotate = () => {
    setRotation((value) => (value + 90) % 360);
  };
  const handleToggleSidebar = () => {
    setSidebarOpen((value) => !value);
  };
  const handleToggleMarkup = () => {
    setMarkupOpen((value) => !value);
  };
  const handleSelectMarkupTool = (tool: MarkupTool) => {
    setMarkupTool(tool);
  };

  return (
    <div
      className="preview-app"
      data-sidebar={sidebarOpen ? "open" : "closed"}
      data-markup={markupOpen ? "open" : "closed"}
    >
      <div className="preview-toolbar" role="toolbar" aria-label="Preview">
        <button
          type="button"
          className="preview-sidebar-toggle"
          aria-label="Toggle sidebar"
          aria-pressed={sidebarOpen}
          onClick={handleToggleSidebar}
        >
          <PreviewGlyph name="sidebar" />
        </button>
        <div className="preview-zoom" role="group" aria-label="Zoom">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= PREVIEW_ZOOM_MIN}
            onClick={handleZoomOut}
          >
            <PreviewGlyph name="minus" />
          </button>
          <span>{Math.round(zoom)}%</span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= PREVIEW_ZOOM_MAX}
            onClick={handleZoomIn}
          >
            <PreviewGlyph name="plus" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Markup"
          aria-pressed={markupOpen}
          onClick={handleToggleMarkup}
        >
          <PreviewGlyph name="markup" />
        </button>
        <button type="button" aria-label="Rotate clockwise" onClick={handleRotate}>
          <PreviewGlyph name="rotate" />
        </button>
        <span className="preview-spacer" />
        <button type="button" aria-label="Share" onClick={handleShare}>
          <PreviewGlyph name="share" />
        </button>
      </div>
      {markupOpen ? (
        <div className="preview-markup" role="toolbar" aria-label="Markup">
          {markupTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              aria-label={tool.label}
              aria-pressed={markupTool === tool.id}
              onClick={() => handleSelectMarkupTool(tool.id)}
            >
              <PreviewGlyph name={tool.id} />
            </button>
          ))}
          <span className="preview-divider" aria-hidden="true" />
          <div className="preview-colors" role="group" aria-label="Color">
            {previewColors.map((color) => (
              <button
                key={color.value}
                type="button"
                aria-label={color.label}
                aria-pressed={markupColor === color.value}
                style={{ "--swatch": color.value } as React.CSSProperties}
                onClick={() => handleSelectColor(color.value)}
              />
            ))}
          </div>
          <span className="preview-spacer" />
          <button
            type="button"
            aria-label="Undo"
            disabled={marks.length === 0}
            onClick={handleUndo}
          >
            <PreviewGlyph name="undo" />
          </button>
          <button
            type="button"
            aria-label="Clear markup"
            disabled={marks.length === 0}
            onClick={handleClear}
          >
            <PreviewGlyph name="clear" />
          </button>
        </div>
      ) : null}
      <div className="preview-body">
        {sidebarOpen ? (
          <aside className="preview-sidebar" aria-label="Pages">
            <button
              type="button"
              className="preview-thumb"
              aria-current="true"
              aria-label="Page 1"
            >
              <img src={meme.src} alt="" />
              <small>1</small>
            </button>
          </aside>
        ) : null}
        <div className="preview-canvas" ref={canvasAreaRef}>
          <div
            className="preview-frame"
            style={{ width: box.width, height: box.height }}
          >
            <div
              ref={sheetRef}
              className="preview-sheet"
              data-tool={markupOpen ? markupTool : "none"}
              style={{
                width: sheet.width,
                height: sheet.height,
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }}
              onPointerDown={handleSheetPointerDown}
              onPointerMove={handleSheetPointerMove}
              onPointerUp={handleSheetPointerUp}
              onPointerCancel={handleSheetPointerUp}
            >
              <img src={meme.src} alt={meme.alt} draggable={false} />
              <canvas ref={inkRef} className="preview-ink" aria-hidden="true" />
              <div
                className="preview-text-layer"
                style={{ fontSize: sheet.width * PREVIEW_TEXT_SCALE }}
              >
                {textMarks.map((mark) => (
                  <input
                    key={mark.id}
                    className={`preview-text ${mark.kind}`}
                    style={{
                      left: `${mark.x * 100}%`,
                      top: `${mark.y * 100}%`,
                      color: mark.kind === "text" ? mark.color : undefined,
                    }}
                    value={mark.value}
                    size={Math.max(6, mark.value.length + 1)}
                    placeholder={mark.kind === "note" ? "Note" : "Text"}
                    aria-label={mark.kind === "note" ? "Note" : "Text"}
                    readOnly={!markupOpen}
                    autoFocus={mark.id === focusTextId}
                    onChange={(event) => handleTextChange(mark.id, event.target.value)}
                    onBlur={() => handleTextBlur(mark)}
                    onKeyDown={handleTextKeyDown}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type SaveChangesSheetProps = {
  meme: MemeImage;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

const SaveChangesSheet = ({
  meme,
  onSave,
  onDiscard,
  onCancel,
}: SaveChangesSheetProps) => {
  const titleId = useId();
  const messageId = useId();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") {
      return;
    }
    event.stopPropagation();
    onCancel();
  };

  return (
    <div className="save-sheet-backdrop">
      <div
        className="save-sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onKeyDown={handleKeyDown}
      >
        <img className="save-sheet-icon" src={meme.src} alt="" />
        <h2 id={titleId}>
          Do you want to save the changes you made to “{meme.label}”?
        </h2>
        <p id={messageId}>Your changes will be lost if you don’t save them.</p>
        <div className="save-sheet-actions">
          <button type="button" className="primary" autoFocus onClick={onSave}>
            Save
          </button>
          <button type="button" onClick={onDiscard}>
            Don’t Save
          </button>
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const ImageWindow = ({
  meme,
  onClose,
  ...stackProps
}: { meme: MemeImage; onClose: () => void } & WindowStackProps) => {
  const [savedMarks, setSavedMarks] = useState<Mark[]>(() =>
    readSavedMarks(meme.markupStorageKey),
  );
  const [marks, setMarks] = useState<Mark[]>(savedMarks);
  const [isConfirmingClose, setIsConfirmingClose] = useState(false);
  const isEdited =
    JSON.stringify(withoutEmptyText(marks)) !== JSON.stringify(savedMarks);
  const title = isEdited ? `${meme.label} — Edited` : meme.label;

  const handleRequestClose = () => {
    if (!isEdited) {
      onClose();
      return;
    }
    setIsConfirmingClose(true);
  };
  const handleSave = () => {
    const nextMarks = withoutEmptyText(marks);
    localStorage.setItem(meme.markupStorageKey, JSON.stringify(nextMarks));
    setSavedMarks(nextMarks);
    onClose();
  };
  const handleDiscard = () => {
    onClose();
  };
  const handleCancelClose = () => {
    setIsConfirmingClose(false);
  };

  return (
    <WindowShell title={title} onClose={handleRequestClose} {...stackProps}>
      <PreviewApp meme={meme} marks={marks} setMarks={setMarks} />
      {isConfirmingClose ? (
        <SaveChangesSheet
          meme={meme}
          onSave={handleSave}
          onDiscard={handleDiscard}
          onCancel={handleCancelClose}
        />
      ) : null}
    </WindowShell>
  );
};

type DesktopDragState = {
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
  moved: boolean;
  next: IconPosition | null;
};

const useDesktopDrag = <T extends HTMLElement>({
  position,
  onMove,
}: {
  position: IconPosition;
  onMove: (position: IconPosition) => void;
}) => {
  const elementRef = useRef<T>(null);
  const dragRef = useRef<DesktopDragState | null>(null);
  const suppressClickRef = useRef(false);
  const [livePosition, setLivePosition] = useState<IconPosition | null>(null);

  const handlePointerDown = (event: React.PointerEvent<T>) => {
    if (event.button !== 0) return;
    const element = elementRef.current;
    if (!element?.parentElement) return;
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originLeft: element.offsetLeft,
      originTop: element.offsetTop,
      moved: false,
      next: null,
    };
    element.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<T>) => {
    const drag = dragRef.current;
    const element = elementRef.current;
    const parent = element?.parentElement;
    if (!drag || !element || !parent) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    const maxLeft = Math.max(0, parent.clientWidth - element.offsetWidth);
    const maxTop = Math.max(
      0,
      parent.clientHeight - element.offsetHeight - DOCK_CLEARANCE,
    );
    const next = {
      x: (clamp(drag.originLeft + dx, 0, maxLeft) / parent.clientWidth) * 100,
      y: (clamp(drag.originTop + dy, 0, maxTop) / parent.clientHeight) * 100,
    };
    drag.next = next;
    setLivePosition(next);
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.moved || !drag.next) return;
    suppressClickRef.current = true;
    setLivePosition(null);
    onMove(drag.next);
  };

  const consumeDragClick = () => {
    if (!suppressClickRef.current) return false;
    suppressClickRef.current = false;
    return true;
  };

  return {
    elementRef,
    shown: livePosition ?? position,
    isDragging: livePosition !== null,
    consumeDragClick,
    dragHandlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
};

const WIDGET_KEY_STEPS: Record<string, IconPosition> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

const DesktopWidget = ({
  position,
  onMove,
  onOpen,
  label = "Zurich weather widget. Press Enter to open Weather. Drag or use arrow keys to move.",
  className,
  children,
}: {
  position: IconPosition;
  onMove: (position: IconPosition) => void;
  onOpen: () => void;
  label?: string;
  className?: string;
  children: ReactNode;
}) => {
  const { elementRef, shown, isDragging, consumeDragClick, dragHandlers } =
    useDesktopDrag<HTMLDivElement>({ position, onMove });

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (consumeDragClick()) return;
    const target = event.target;
    if (target instanceof Element && target.closest("button")) return;
    onOpen();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
      return;
    }
    const step = WIDGET_KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const multiplier = event.shiftKey ? 5 : 1;
    onMove({
      x: clamp(position.x + step.x * multiplier, 0, 92),
      y: clamp(position.y + step.y * multiplier, 0, 88),
    });
  };

  return (
    <div
      ref={elementRef}
      className={["desktop-widget", className, isDragging ? "dragging" : ""]
        .filter(Boolean)
        .join(" ")}
      role="group"
      tabIndex={0}
      aria-label={label}
      style={
        {
          "--widget-x": `${shown.x}%`,
          "--widget-y": `${shown.y}%`,
        } as React.CSSProperties
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...dragHandlers}
    >
      {children}
    </div>
  );
};

type MobileFolderLauncherProps = {
  label: string;
  launcherKey?: string;
  icon?: string;
  previews?: ReactNode;
  onOpen: () => void;
};

const MobileFolderLauncher = ({
  label,
  launcherKey,
  icon,
  previews,
  onOpen,
}: MobileFolderLauncherProps) => {
  const glyph = icon ? (
    <img className="mobile-folder-glyph" src={icon} alt="" />
  ) : (
    <span className="mobile-folder-icon" aria-hidden="true">
      {previews}
    </span>
  );

  return (
    <button
      className="mobile-folder"
      type="button"
      data-launcher={launcherKey}
      aria-label={label}
      onClick={onOpen}
    >
      {glyph}
      <span>{label}</span>
    </button>
  );
};

type MobilePhotoWidgetProps = {
  onOpen: (memeId: MemeId) => void;
};

const MobilePhotoWidget = ({ onOpen }: MobilePhotoWidgetProps) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = event.currentTarget;
    if (clientWidth === 0) return;
    setActiveSlide(Math.round(scrollLeft / clientWidth));
  };

  return (
    <section className="photo-widget" aria-label="Photos widget">
      <div className="photo-widget-track" onScroll={handleScroll}>
        {memeImages.map((meme) => (
          <button
            key={meme.id}
            className="photo-widget-slide"
            type="button"
            data-launcher={meme.id}
            aria-label={meme.label}
            onClick={() => onOpen(meme.id)}
          >
            <img src={meme.src} alt="" draggable={false} />
          </button>
        ))}
      </div>
      <div className="photo-widget-dots" aria-hidden="true">
        {memeImages.map((meme, index) => (
          <span key={meme.id} data-active={index === activeSlide} />
        ))}
      </div>
    </section>
  );
};

const MobileHomePages = ({ pages }: { pages: ReactNode[] }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);
  const reduceMotion = useReducedMotion();

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, clientWidth } = event.currentTarget;
    if (clientWidth === 0) return;
    setActivePage(Math.round(scrollLeft / clientWidth));
  };

  const handleShowPage = (index: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({
      left: index * scroller.clientWidth,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <>
      <div
        ref={scrollerRef}
        className="mobile-home"
        aria-label="Home screen"
        onScroll={handleScroll}
      >
        {pages.map((page, index) => (
          <div
            key={index}
            className="mobile-home-page"
            role="group"
            aria-label={`Page ${index + 1} of ${pages.length}`}
          >
            {page}
          </div>
        ))}
      </div>
      <div className="mobile-home-dots" aria-label="Home screen pages">
        {pages.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Show page ${index + 1}`}
            aria-current={index === activePage}
            onClick={() => handleShowPage(index)}
          />
        ))}
      </div>
    </>
  );
};

const DesktopIcon = ({
  id,
  label,
  icon = "/os/doc-icons/folder.png",
  variant = "folder",
  selected,
  position,
  onSelect,
  onOpen,
  onMove,
}: {
  id: string;
  label: string;
  icon?: string;
  variant?: "folder" | "picture" | "document";
  selected: boolean;
  position: IconPosition;
  onSelect: (id: string) => void;
  onOpen: () => void;
  onMove: (id: string, position: IconPosition) => void;
}) => {
  const { elementRef, shown, isDragging, consumeDragClick, dragHandlers } =
    useDesktopDrag<HTMLButtonElement>({
      position,
      onMove: (next) => onMove(id, next),
    });

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    onSelect(id);
    dragHandlers.onPointerDown(event);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (consumeDragClick()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Keyboard activation opens immediately; pointer clicks open on the second click.
    if (event.detail === 0 || event.detail === 2) onOpen();
  };

  const className = [
    "desktop-icon",
    variant,
    selected ? "selected" : "",
    isDragging ? "dragging" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={elementRef}
      className={className}
      aria-label={label}
      style={
        {
          "--icon-x": `${shown.x}%`,
          "--icon-y": `${shown.y}%`,
        } as React.CSSProperties
      }
      {...dragHandlers}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
    >
      <img src={icon} alt="" draggable={false} />
      <span>{label}</span>
    </button>
  );
};

type StatusTone = "light" | "dark";

const HOME_FLICK_SPEED = 0.9;
const HOME_RETURN_SPEED = -0.2;
const HOME_SWIPE_SLOP = 24;
const HOME_SWITCHER_LIFT = 70;
const DRAG_MIN_SCALE = 0.4;
const DRAG_SHRINK_REACH = 0.3;

const recordSample = (samples: PullSample[], y: number) => {
  const now = performance.now();
  samples.push({ y, time: now });
  while (samples.length > 2 && samples[0].time < now - VELOCITY_WINDOW) {
    samples.shift();
  }
};

const readUpwardSpeed = (samples: PullSample[]) => {
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) return 0;
  const elapsed = last.time - first.time;
  if (elapsed < 12) return 0;
  return (first.y - last.y) / elapsed;
};

// The card's bottom edge tracks the finger while it shrinks toward the
// centre, which is how an iOS app follows the home indicator.
const readDragFrame = (
  viewport: Viewport,
  offsetX: number,
  lift: number,
): CardFrame => {
  const rise = Math.max(0, lift);
  const shrink = 1 - Math.exp(-rise / (viewport.height * DRAG_SHRINK_REACH));
  const scale = 1 - (1 - DRAG_MIN_SCALE) * shrink;
  return {
    x: viewport.width / 2 + offsetX - (viewport.width * scale) / 2,
    y: viewport.height - rise - viewport.height * scale,
    scale,
    radius: Math.min(APP_CARD_RADIUS, rise * 0.4),
    opacity: 1,
  };
};

type HomeGesture = {
  startX: number;
  startY: number;
  samples: PullSample[];
  element: HTMLElement | null;
  viewport: Viewport | null;
};

type MobileHomeGestureProps = {
  foregroundId: number | null;
  launcherKey: string | null;
  tone: StatusTone;
  canOpenSwitcher: boolean;
  onGoHome: () => void;
  onOpenSwitcher: () => void;
};

const MobileHomeGesture = ({
  foregroundId,
  launcherKey,
  tone,
  canOpenSwitcher,
  onGoHome,
  onOpenSwitcher,
}: MobileHomeGestureProps) => {
  const reduceMotion = useReducedMotion();
  const motionScale = reduceMotion ? 0 : 1;
  const gestureRef = useRef<HomeGesture | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasApp = foregroundId !== null;

  if (!hasApp && !canOpenSwitcher) return null;

  const readForeground = () => {
    if (foregroundId === null) return null;
    return findWindowElement(foregroundId);
  };

  const springBack = (element: HTMLElement) => {
    animateFrame(element, FULL_FRAME, SPRING_BACK_DURATION * motionScale, () =>
      clearCardFrame(element),
    );
  };

  const goHome = (element: HTMLElement) => {
    const viewport = readViewport(element);
    const launcherFrame = launcherKey
      ? readLauncherFrame(viewport, launcherKey)
      : null;
    const target = launcherFrame ?? readScreenCenterFrame(viewport);
    animateFrame(element, target, GO_HOME_DURATION * motionScale, onGoHome);
  };

  const openSwitcherIfAvailable = () => {
    if (!canOpenSwitcher) return;
    onOpenSwitcher();
  };

  const finishGesture = () => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    setIsDragging(false);
    return gesture;
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Capture needs an active pointer. Tracking still follows later events.
    }
    const element = readForeground();
    if (element) stopFrameAnimation(element);
    gestureRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      samples: [{ y: event.clientY, time: event.timeStamp }],
      element,
      viewport: element ? readViewport(element) : null,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    if (!gesture) return;
    recordSample(gesture.samples, event.clientY);
    if (!gesture.element || !gesture.viewport) return;
    const frame = readDragFrame(
      gesture.viewport,
      event.clientX - gesture.startX,
      gesture.startY - event.clientY,
    );
    applyCardFrame(gesture.element, frame);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const gesture = finishGesture();
    if (!gesture) return;
    recordSample(gesture.samples, event.clientY);
    const lift = gesture.startY - event.clientY;
    const speed = readUpwardSpeed(gesture.samples);

    if (!gesture.element) {
      if (lift < HOME_SWITCHER_LIFT) return;
      openSwitcherIfAvailable();
      return;
    }
    if (lift < HOME_SWIPE_SLOP || speed < HOME_RETURN_SPEED) {
      springBack(gesture.element);
      return;
    }
    if (speed > HOME_FLICK_SPEED) {
      goHome(gesture.element);
      return;
    }
    onOpenSwitcher();
  };

  const handlePointerCancel = () => {
    const gesture = finishGesture();
    if (!gesture?.element) return;
    springBack(gesture.element);
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.detail !== 0) return;
    const element = readForeground();
    if (!element) {
      openSwitcherIfAvailable();
      return;
    }
    goHome(element);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowUp") return;
    event.preventDefault();
    openSwitcherIfAvailable();
  };

  const label = hasApp
    ? "Go to Home Screen. Press Up Arrow for the App Switcher"
    : "Open the App Switcher";

  return (
    <button
      type="button"
      className="home-gesture"
      data-tone={tone}
      data-visible={hasApp && !isDragging}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    />
  );
};

const SWITCHER_CARD_SCALE = 0.62;
const SWITCHER_FOCUS_X = 0.56;
const SWITCHER_STACK_SPACING = 0.25;
const SWITCHER_FAR_SPACING = 0.12;
const SWITCHER_LEAD_SPACING = 0.6;
const SWITCHER_SCROLL_STEP = 0.32;
const SWITCHER_CARD_RADIUS = 30;
const SWITCHER_LABEL_HEIGHT = 30;
const SWITCHER_LABEL_GAP = 8;
const SWITCHER_LABEL_MIN_WIDTH = 34;
const SWITCHER_ENTER_DURATION = 0.46;
const SWITCHER_REFLOW_DURATION = 0.34;
const SWITCHER_OPEN_DURATION = 0.42;
const SWITCHER_DISMISS_DURATION = 0.32;
const SWITCHER_CLOSE_DURATION = 0.28;
const SWITCHER_CLOSE_SPEED = 0.5;
const SWITCHER_CLOSE_DISTANCE = 0.22;
const SWITCHER_DRAG_RESISTANCE = 0.2;
const SWITCHER_SLIDE_IN = 0.3;
const SWITCHER_ZOOM_IN = 1.12;
const SWITCHER_ZOOM_OUT = 0.86;
const SWITCHER_FOCUS_Z = 970;

// Older cards tuck under the focused one from the left and bunch up the
// further back they are; newer cards slide away quickly to the right.
const readStackOffset = (relative: number) => {
  if (relative < 0) return relative * SWITCHER_LEAD_SPACING;
  const near = Math.min(relative, 1) * SWITCHER_STACK_SPACING;
  const far = Math.max(relative - 1, 0) * SWITCHER_FAR_SPACING;
  return near + far;
};

const readSwitcherFrame = (viewport: Viewport, relative: number): CardFrame => {
  const scale = SWITCHER_CARD_SCALE;
  const centerX = viewport.width * (SWITCHER_FOCUS_X - readStackOffset(relative));
  return {
    x: centerX - (viewport.width * scale) / 2,
    y: (viewport.height * (1 - scale) + SWITCHER_LABEL_HEIGHT) / 2,
    scale,
    radius: SWITCHER_CARD_RADIUS,
    opacity: 1,
  };
};

const zoomFrame = (
  viewport: Viewport,
  frame: CardFrame,
  factor: number,
): CardFrame => {
  const width = viewport.width * frame.scale;
  const height = viewport.height * frame.scale;
  return {
    x: frame.x + (width * (1 - factor)) / 2,
    y: frame.y + (height * (1 - factor)) / 2,
    scale: frame.scale * factor,
    radius: frame.radius,
    opacity: 0,
  };
};

const frameContains = (
  viewport: Viewport,
  frame: CardFrame,
  point: ScreenPoint,
) =>
  point.x >= frame.x &&
  point.x <= frame.x + viewport.width * frame.scale &&
  point.y >= frame.y &&
  point.y <= frame.y + viewport.height * frame.scale;

type CardTween = {
  from: Map<number, CardFrame>;
  scrollIndex: number;
  progress: number;
  controls: AnimationPlaybackControls | null;
};
type SwitcherGesture = {
  startX: number;
  startY: number;
  startLift: number;
  cardId: number | null;
  mode: "pending" | "vertical" | "horizontal";
  samples: PullSample[];
};

type MobileAppSwitcherProps = {
  cards: MinimizedWindowTile[];
  entryId: number | null;
  onOpenWindow: (windowId: number) => void;
  onCloseWindow: (windowId: number) => void;
  onDismiss: () => void;
};

const MobileAppSwitcher = ({
  cards,
  entryId,
  onOpenWindow,
  onCloseWindow,
  onDismiss,
}: MobileAppSwitcherProps) => {
  const reduceMotion = useReducedMotion();
  const motionScale = reduceMotion ? 0 : 1;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef(new Map<number, HTMLButtonElement>());
  const cardsRef = useRef(cards);
  const framesRef = useRef(new Map<number, CardFrame>());
  const liftsRef = useRef(new Map<number, number>());
  const liftAnimationsRef = useRef(new Map<number, AnimationPlaybackControls>());
  const tweenRef = useRef<CardTween | null>(null);
  const exitAnimationRef = useRef<AnimationPlaybackControls | null>(null);
  const gestureRef = useRef<SwitcherGesture | null>(null);
  const isExitingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const cardKey = cards.map((card) => card.id).join(",");
  const previousCardKeyRef = useRef(cardKey);

  const readLayout = () => {
    const scroller = scrollerRef.current;
    if (!scroller) return null;
    const viewport = { width: scroller.clientWidth, height: scroller.clientHeight };
    const step = viewport.width * SWITCHER_SCROLL_STEP;
    const maxScroll = (cardsRef.current.length - 1) * step;
    const scrollIndex = step > 0 ? (maxScroll - scroller.scrollLeft) / step : 0;
    return { viewport, scrollIndex };
  };

  const renderLabels = () => {
    const currentCards = cardsRef.current;
    currentCards.forEach((card, index) => {
      const label = labelRefs.current.get(card.id);
      const frame = framesRef.current.get(card.id);
      if (!label || !frame) return;
      const newerCard = currentCards[index - 1];
      const newerFrame = newerCard ? framesRef.current.get(newerCard.id) : null;
      const room = newerFrame
        ? newerFrame.x - frame.x - SWITCHER_LABEL_GAP * 2
        : Number.POSITIVE_INFINITY;
      const isVisible = room >= SWITCHER_LABEL_MIN_WIDTH;
      const top = frame.y - SWITCHER_LABEL_HEIGHT - SWITCHER_LABEL_GAP;
      label.style.transform = `translate(${frame.x + SWITCHER_LABEL_GAP}px, ${top}px)`;
      label.style.maxWidth = Number.isFinite(room) ? `${room}px` : "";
      label.style.opacity = isVisible ? String(frame.opacity) : "0";
    });
  };

  const renderCards = () => {
    const layout = readLayout();
    if (!layout || isExitingRef.current) return;
    const tween = tweenRef.current;
    cardsRef.current.forEach((card, index) => {
      const element = findWindowElement(card.id);
      if (!element) return;
      const resting = readSwitcherFrame(layout.viewport, index - layout.scrollIndex);
      const lift = liftsRef.current.get(card.id) ?? 0;
      const from = tween?.from.get(card.id);
      const target = tween
        ? readSwitcherFrame(layout.viewport, index - tween.scrollIndex)
        : resting;
      const base = tween && from ? mixFrames(from, target, tween.progress) : target;
      // Scrolling and swiping stay responsive while the stack enters/reflows.
      const frame = {
        ...base,
        x: base.x + resting.x - target.x,
        y: base.y + lift,
      };
      applyCardFrame(element, frame);
      framesRef.current.set(card.id, frame);
    });
    renderLabels();
  };

  const tweenFrom = (from: Map<number, CardFrame>, duration: number) => {
    tweenRef.current?.controls?.stop();
    const layout = readLayout();
    if (!layout) return;
    if (duration === 0) {
      tweenRef.current = null;
      renderCards();
      return;
    }
    const tween: CardTween = {
      from,
      scrollIndex: layout.scrollIndex,
      progress: 0,
      controls: null,
    };
    tweenRef.current = tween;
    renderCards();
    tween.controls = animate(0, 1, {
      duration,
      ease: IOS_EASE,
      onUpdate: (progress) => {
        tween.progress = progress;
        renderCards();
      },
      onComplete: () => {
        if (tweenRef.current === tween) tweenRef.current = null;
        renderCards();
      },
    });
  };

  const animateCardsTo = (
    targets: Map<number, CardFrame>,
    duration: number,
    onComplete: () => void,
  ) => {
    isExitingRef.current = true;
    setIsExiting(true);
    tweenRef.current?.controls?.stop();
    const starts = new Map<number, CardFrame>();
    targets.forEach((_, windowId) => {
      const element = findWindowElement(windowId);
      if (element) starts.set(windowId, readCardFrame(element));
    });
    const applyProgress = (progress: number) => {
      starts.forEach((from, windowId) => {
        const element = findWindowElement(windowId);
        const to = targets.get(windowId);
        if (!element || !to) return;
        applyCardFrame(element, mixFrames(from, to, progress));
      });
    };
    if (duration === 0) {
      applyProgress(1);
      onComplete();
      return;
    }
    exitAnimationRef.current = animate(0, 1, {
      duration,
      ease: IOS_EASE,
      onUpdate: applyProgress,
      onComplete,
    });
  };

  const openCard = (windowId: number) => {
    if (isExitingRef.current) return;
    const element = findWindowElement(windowId);
    if (element) element.style.zIndex = String(SWITCHER_FOCUS_Z);
    const targets = new Map([[windowId, FULL_FRAME]]);
    animateCardsTo(targets, SWITCHER_OPEN_DURATION * motionScale, () =>
      onOpenWindow(windowId),
    );
  };

  const dismiss = () => {
    const layout = readLayout();
    if (isExitingRef.current || !layout) return;
    const targets = new Map<number, CardFrame>();
    cardsRef.current.forEach((card) => {
      const frame = framesRef.current.get(card.id);
      if (!frame) return;
      targets.set(card.id, zoomFrame(layout.viewport, frame, SWITCHER_ZOOM_OUT));
    });
    animateCardsTo(targets, SWITCHER_DISMISS_DURATION * motionScale, onDismiss);
  };

  const animateLift = (
    windowId: number,
    to: number,
    duration: number,
    onComplete: () => void,
  ) => {
    liftAnimationsRef.current.get(windowId)?.stop();
    const finish = () => {
      liftAnimationsRef.current.delete(windowId);
      onComplete();
    };
    if (duration === 0) {
      liftsRef.current.set(windowId, to);
      renderCards();
      finish();
      return;
    }
    const controls = animate(liftsRef.current.get(windowId) ?? 0, to, {
      duration,
      ease: IOS_EASE,
      onUpdate: (offset) => {
        liftsRef.current.set(windowId, offset);
        renderCards();
      },
      onComplete: finish,
    });
    liftAnimationsRef.current.set(windowId, controls);
  };

  const settleLift = (windowId: number) => {
    animateLift(windowId, 0, SPRING_BACK_DURATION * motionScale, () => {
      liftsRef.current.delete(windowId);
      renderCards();
    });
  };

  const closeCard = (windowId: number) => {
    const layout = readLayout();
    if (!layout) return;
    animateLift(
      windowId,
      -layout.viewport.height,
      SWITCHER_CLOSE_DURATION * motionScale,
      () => {
        liftsRef.current.delete(windowId);
        const isLastCard = cardsRef.current.length <= 1;
        onCloseWindow(windowId);
        if (isLastCard) onDismiss();
      },
    );
  };

  const findCardAt = (point: ScreenPoint) => {
    const layout = readLayout();
    if (!layout) return null;
    const hit = cardsRef.current.find((card) => {
      const frame = framesRef.current.get(card.id);
      if (!frame) return false;
      return frameContains(layout.viewport, frame, point);
    });
    return hit?.id ?? null;
  };

  const enterSwitcher = useEffectEvent(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
    const viewport = { width: scroller.clientWidth, height: scroller.clientHeight };
    const from = new Map<number, CardFrame>();
    cardsRef.current.forEach((card, index) => {
      const element = findWindowElement(card.id);
      const target = readSwitcherFrame(viewport, index);
      if (element && card.id === entryId) {
        from.set(card.id, readCardFrame(element));
        return;
      }
      if (entryId !== null) {
        const slideX = target.x - viewport.width * SWITCHER_SLIDE_IN;
        from.set(card.id, { ...target, x: slideX, opacity: 0 });
        return;
      }
      from.set(card.id, zoomFrame(viewport, target, SWITCHER_ZOOM_IN));
    });
    tweenFrom(from, SWITCHER_ENTER_DURATION * motionScale);
    const firstLabel = labelRefs.current.get(cardsRef.current[0]?.id ?? -1);
    firstLabel?.focus({ preventScroll: true });
  });

  const reflowCards = useEffectEvent(() => {
    const from = new Map<number, CardFrame>();
    cardsRef.current.forEach((card) => {
      const frame = framesRef.current.get(card.id);
      if (!frame) return;
      // Stored frames already include the swipe; only tween the stack position.
      const lift = liftsRef.current.get(card.id) ?? 0;
      from.set(card.id, { ...frame, y: frame.y - lift });
    });
    tweenFrom(from, SWITCHER_REFLOW_DURATION * motionScale);
  });

  const handleResize = useEffectEvent(() => renderCards());

  useLayoutEffect(() => {
    cardsRef.current = cards;
  });

  useLayoutEffect(() => {
    const lifts = liftAnimationsRef.current;
    const listenForResize = () => handleResize();
    enterSwitcher();
    window.addEventListener("resize", listenForResize);
    return () => {
      window.removeEventListener("resize", listenForResize);
      tweenRef.current?.controls?.stop();
      exitAnimationRef.current?.stop();
      lifts.forEach((controls) => controls.stop());
      cardsRef.current.forEach((card) => {
        const element = findWindowElement(card.id);
        if (element) clearCardFrame(element);
      });
    };
  }, []);

  useLayoutEffect(() => {
    if (previousCardKeyRef.current === cardKey) return;
    previousCardKeyRef.current = cardKey;
    reflowCards();
  }, [cardKey]);

  const setLabelRef = (windowId: number, node: HTMLButtonElement | null) => {
    if (node) {
      labelRefs.current.set(windowId, node);
      return;
    }
    labelRefs.current.delete(windowId);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isExitingRef.current) return;
    const point = { x: event.clientX, y: event.clientY };
    gestureRef.current = {
      startX: point.x,
      startY: point.y,
      startLift: 0,
      cardId: findCardAt(point),
      mode: "pending",
      samples: [{ y: point.y, time: event.timeStamp }],
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.mode === "horizontal") return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (gesture.mode === "pending") {
      const isHorizontal =
        Math.abs(deltaX) > TAP_SLOP && Math.abs(deltaX) >= Math.abs(deltaY);
      if (isHorizontal) {
        gesture.mode = "horizontal";
        return;
      }
      if (Math.abs(deltaY) <= TAP_SLOP || gesture.cardId === null) return;
      gesture.mode = "vertical";
      gesture.startLift = liftsRef.current.get(gesture.cardId) ?? 0;
      liftAnimationsRef.current.get(gesture.cardId)?.stop();
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture needs an active pointer. Tracking still follows later events.
      }
    }

    if (gesture.cardId === null) return;
    recordSample(gesture.samples, event.clientY);
    const delta = deltaY < 0 ? deltaY : deltaY * SWITCHER_DRAG_RESISTANCE;
    const offset = gesture.startLift + delta;
    liftsRef.current.set(gesture.cardId, offset);
    renderCards();
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || gesture.mode === "horizontal") return;

    if (gesture.mode === "pending") {
      if (gesture.cardId === null) {
        dismiss();
        return;
      }
      openCard(gesture.cardId);
      return;
    }

    if (gesture.cardId === null) return;
    recordSample(gesture.samples, event.clientY);
    const layout = readLayout();
    const lift = liftsRef.current.get(gesture.cardId) ?? 0;
    const height = layout?.viewport.height ?? window.innerHeight;
    const isFlick = readUpwardSpeed(gesture.samples) > SWITCHER_CLOSE_SPEED;
    const isFarEnough = -lift > height * SWITCHER_CLOSE_DISTANCE;
    if (isFlick || isFarEnough) {
      closeCard(gesture.cardId);
      return;
    }
    settleLift(gesture.cardId);
  };

  const handlePointerCancel = () => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (gesture?.mode !== "vertical" || gesture.cardId === null) return;
    settleLift(gesture.cardId);
  };

  const handleSwitcherKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    dismiss();
  };

  const handleLabelKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    windowId: number,
  ) => {
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    event.preventDefault();
    closeCard(windowId);
  };

  return (
    <>
      <div
        className="app-switcher-backdrop"
        data-exiting={isExiting}
        aria-hidden="true"
      />
      <div
        className="app-switcher-labels"
        data-exiting={isExiting}
        role="dialog"
        aria-modal="true"
        aria-label="App Switcher"
        onKeyDown={handleSwitcherKeyDown}
      >
        {cards.map((card) => (
          <button
            key={card.id}
            ref={(node) => setLabelRef(card.id, node)}
            type="button"
            className="app-switcher-label"
            aria-label={`Open ${card.label}. Press Delete to close it`}
            onClick={() => openCard(card.id)}
            onKeyDown={(event) => handleLabelKeyDown(event, card.id)}
          >
            <img
              src={card.icon ?? card.preview}
              alt=""
              data-kind={card.icon ? "icon" : "preview"}
            />
            <span>{card.label}</span>
          </button>
        ))}
      </div>
      <div
        ref={scrollerRef}
        className="app-switcher-scroller"
        aria-hidden="true"
        onScroll={renderCards}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {cards.map((card, index) => (
          <span
            key={card.id}
            className="app-switcher-snap"
            style={{ left: `${index * SWITCHER_SCROLL_STEP * 100}%` }}
          />
        ))}
      </div>
    </>
  );
};

const windowAppId = ({ content }: OpenWindow) => {
  if (content.kind === "app") return content.app;
  if (content.kind === "image") return content.memeId;
  return content.kind;
};

const byMinimizeOrder = (first: OpenWindow, second: OpenWindow) =>
  (first.minimizedAt ?? 0) - (second.minimizedAt ?? 0);

const DARK_SURFACE_IDS = new Set<string>([
  "spotify",
  "youtube",
  "instagram",
  "weather",
  "video",
  "movie",
  "terminal",
]);

const describeMinimizedWindow = (item: OpenWindow): MinimizedWindowTile => {
  const { id, content } = item;
  if (content.kind === "project") {
    const project = portfolioProjects.find((entry) => entry.slug === content.slug);
    return {
      id,
      label: project?.title ?? "Project",
      preview: project?.images[0],
      variant: "paper",
    };
  }
  if (content.kind === "about-mac") {
    return { id, label: "About This Mac", variant: "paper" };
  }
  if (content.kind === "terminal") {
    return { id, label: "Terminal", icon: "/os/doc-icons/terminal.svg", variant: "dark" };
  }
  if (content.kind === "movie") {
    return { id, label: INTRO_MOVIE.label, preview: INTRO_MOVIE.poster, variant: "dark" };
  }
  if (content.kind === "preview") {
    const certificate = content.doc.kind === "certificate" ? findCertificate(content.doc.id) : null;
    return {
      id,
      label: certificate ? certificateLabel(certificate, false) : CV_LABEL,
      icon: PDF_ICON,
      variant: "paper",
    };
  }
  if (content.kind === "folder") {
    return {
      id,
      label: FOLDER_TITLES[content.folder],
      icon: "/os/doc-icons/folder.png",
      variant: "paper",
    };
  }
  if (content.kind === "image") {
    const meme = findMemeImage(content.memeId);
    return { id, label: meme.label, preview: meme.src, variant: "paper" };
  }
  if (content.kind === "video") {
    return {
      id,
      label: "Dont play this video.mov",
      preview: rickrollTrack.cover,
      variant: "dark",
    };
  }
  const app = apps.find((entry) => entry.id === windowAppId(item));
  if (!app) return { id, label: "Window", variant: "paper" };
  const variant = DARK_SURFACE_IDS.has(app.id) ? "dark" : "paper";
  return { id, label: app.name, icon: app.icon, variant };
};

const readStatusTone = (item: OpenWindow | null): StatusTone => {
  if (!item) return "light";
  if (DARK_SURFACE_IDS.has(windowAppId(item))) return "light";
  return "dark";
};

const findForegroundWindow = (windows: OpenWindow[]) =>
  windows.reduce<OpenWindow | null>((top, item) => {
    if (item.minimizedAt !== null) return top;
    if (top && top.zIndex > item.zIndex) return top;
    return item;
  }, null);

const byMostRecent = (first: OpenWindow, second: OpenWindow) =>
  second.zIndex - first.zIndex;

type SwitcherSession = { entryId: number | null };

type MenuBarPanelId = "wifi" | "battery" | "controlCenter";

const TEXT_ENTRY_TYPES = new Set([
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url",
]);

const isTextField = (
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement => {
  if (target instanceof HTMLTextAreaElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return TEXT_ENTRY_TYPES.has(target.type);
};

const LOCKED_VIEWPORT =
  "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content";

const BROWSER_ZOOM_CODES = new Set([
  "Equal",
  "Minus",
  "Digit0",
  "NumpadAdd",
  "NumpadSubtract",
  "Numpad0",
]);

// Pinch, trackpad pinch, and the zoom shortcuts scale the whole page and
// break the fixed desktop. The meme viewer listens for the same gestures
// itself and zooms the photo instead.
const usePreventBrowserZoom = () => {
  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute("content", LOCKED_VIEWPORT);
    }

    const preventBrowserZoom = (event: Event) => {
      event.preventDefault();
    };
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      event.preventDefault();
    };
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      if (!BROWSER_ZOOM_CODES.has(event.code)) return;
      event.preventDefault();
    };

    document.addEventListener("gesturestart", preventBrowserZoom, { passive: false });
    document.addEventListener("gesturechange", preventBrowserZoom, { passive: false });
    document.addEventListener("gestureend", preventBrowserZoom, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("gesturestart", preventBrowserZoom);
      document.removeEventListener("gesturechange", preventBrowserZoom);
      document.removeEventListener("gestureend", preventBrowserZoom);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("wheel", handleWheel, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
};

const clearTypingViewport = () => {
  document.documentElement.style.removeProperty("--keyboard-overlap");
};

// The screen keeps its full height while the keyboard is open. Only fields
// marked data-follows-keyboard lift by --keyboard-overlap to stay above it,
// measured from the visible area in case iOS still pans the page.
const useTypingViewport = () => {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const resetScroll = () => {
      if (window.scrollX === 0 && window.scrollY === 0) return;
      window.scrollTo(0, 0);
    };

    const syncTypingViewport = () => {
      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const focused = document.activeElement;
      const followsKeyboard =
        isTextField(focused) && Boolean(focused.closest("[data-follows-keyboard]"));
      if (!isMobile || !followsKeyboard) {
        clearTypingViewport();
        return;
      }
      resetScroll();
      const visibleBottom = viewport.offsetTop + viewport.height;
      const overlap = Math.max(0, Math.round(window.innerHeight - visibleBottom));
      document.documentElement.style.setProperty("--keyboard-overlap", `${overlap}px`);
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!window.matchMedia(MOBILE_QUERY).matches) return;
      const target = event.target;
      if (!isTextField(target)) return;
      if (!target.closest("[data-follows-keyboard]")) return;
      if (document.activeElement === target) return;
      event.preventDefault();
      target.focus({ preventScroll: true });
    };

    syncTypingViewport();
    viewport.addEventListener("resize", syncTypingViewport);
    viewport.addEventListener("scroll", syncTypingViewport);
    window.addEventListener("resize", syncTypingViewport);
    document.addEventListener("focusin", syncTypingViewport);
    document.addEventListener("focusout", syncTypingViewport);
    document.addEventListener("touchend", handleTouchEnd, { capture: true, passive: false });

    return () => {
      viewport.removeEventListener("resize", syncTypingViewport);
      viewport.removeEventListener("scroll", syncTypingViewport);
      window.removeEventListener("resize", syncTypingViewport);
      document.removeEventListener("focusin", syncTypingViewport);
      document.removeEventListener("focusout", syncTypingViewport);
      document.removeEventListener("touchend", handleTouchEnd, { capture: true });
      clearTypingViewport();
    };
  }, []);
};

export default function Home() {
  usePreventBrowserZoom();
  useTypingViewport();
  const [openWindows, setOpenWindows] = useState<OpenWindow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const desktopFilesRef = useRef<HTMLDivElement>(null);
  const [desktopSize, setDesktopSize] = useState<DesktopSize | null>(null);
  const [savedIconPositions, setSavedIconPositions] = useState<Record<
    string,
    IconPosition
  > | null>(null);
  const [iconPositionsReady, setIconPositionsReady] = useState(false);
  const layoutIconPositions = desktopSize
    ? createDefaultDesktopPositions(desktopSize, DESKTOP_ICON_ORDER)
    : defaultDesktopPositions;
  const iconPositions = savedIconPositions ?? layoutIconPositions;
  const isDesktopLayoutReady = iconPositionsReady && desktopSize !== null;
  const [openMenuBarPanel, setOpenMenuBarPanel] = useState<MenuBarPanelId | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [brightness, setBrightness] = useState(100);
  const [toggles, setToggles] = useState(initialToggles);
  const isOffline = !toggles.wifi || toggles.airplane;
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [youtubeSession, setYoutubeSession] = useState<YouTubeSession | null>(null);
  const [videoPlaybackRequest, setVideoPlaybackRequest] = useState(0);
  const playbackGateRef = useRef<PlaybackGate>(createPlaybackGate());
  const [audibleSource, setAudibleSource] = useState<AudibleSource | null>(null);
  const claimAudible = useCallback((source: AudibleSource) => {
    claimPlayback(playbackGateRef.current, source);
    setAudibleSource(source);
  }, []);
  const releaseAudible = useCallback((source: AudibleSource) => {
    const released = releasePlayback(playbackGateRef.current, source);
    if (!released) return;
    setAudibleSource(null);
  }, []);
  const isYoutubePlaying = youtubeSession?.isPlaying === true;
  const spotify = useSpotifyPlayer({
    volume,
    isOffline,
    isInterrupted: audibleSource !== null && audibleSource !== "spotify",
    playbackGateRef,
    onClaimPlayback: () => claimAudible("spotify"),
    onReleasePlayback: () => releaseAudible("spotify"),
  });
  const nextWindowId = useRef(1);
  const nextWindowZ = useRef(30);
  const nextMinimizeOrder = useRef(1);
  const reduceMotion = useReducedMotion();
  const [switcher, setSwitcher] = useState<SwitcherSession | null>(null);
  const lastPointerRef = useRef<ScreenPoint | null>(null);
  const skipLaunchRef = useRef(false);
  const foregroundWindow = findForegroundWindow(openWindows);
  const foregroundId = foregroundWindow?.id ?? null;
  const foregroundLauncher = foregroundWindow ? windowAppId(foregroundWindow) : null;
  const isSwitcherOpen = switcher !== null;
  const statusTone = isSwitcherOpen ? "light" : readStatusTone(foregroundWindow);

  const addWindow = (content: WindowState) => {
    const id = nextWindowId.current++;
    const cascade = (id - 1) % 6;
    const zIndex = nextWindowZ.current++;
    setOpenWindows((current) => {
      const key = windowKey(content);
      const existing =
        key === null ? undefined : current.find((item) => windowKey(item.content) === key);
      if (existing) {
        return current.map((item) =>
          item.id === existing.id ? { ...item, content, zIndex, minimizedAt: null } : item,
        );
      }
      return [
        ...current,
        {
          id,
          content,
          offsetX: cascade * 22,
          offsetY: cascade * 18,
          zIndex,
          minimizedAt: null,
        },
      ];
    });
  };
  const closeWindow = (id: number) => {
    setOpenWindows((current) => current.filter((item) => item.id !== id));
  };
  const updateWindow = (id: number, changes: Partial<OpenWindow>) => {
    setOpenWindows((current) =>
      current.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  };
  const focusWindow = (id: number) => {
    const zIndex = nextWindowZ.current++;
    updateWindow(id, { zIndex, minimizedAt: null });
  };
  const minimizeWindow = (id: number) => {
    updateWindow(id, { minimizedAt: nextMinimizeOrder.current++ });
  };
  const showOnlyWindow = (id: number | null) => {
    const zIndex = nextWindowZ.current++;
    setOpenWindows((current) => {
      let order = current.reduce((highest, item) => Math.max(highest, item.minimizedAt ?? 0), 0);
      const next = current.map((item) => {
        if (item.id === id) return { ...item, zIndex, minimizedAt: null };
        if (item.minimizedAt !== null) return item;
        order += 1;
        return { ...item, minimizedAt: order };
      });
      nextMinimizeOrder.current = order + 1;
      return next;
    });
  };
  const handleGoHome = () => showOnlyWindow(null);
  const handleOpenSwitcher = () => setSwitcher({ entryId: foregroundId });
  const handleSwitcherOpenWindow = (id: number) => {
    skipLaunchRef.current = true;
    showOnlyWindow(id);
    setSwitcher(null);
  };
  const handleSwitcherDismiss = () => {
    showOnlyWindow(null);
    setSwitcher(null);
  };
  const handlePointerDownCapture = (event: React.PointerEvent) => {
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
  };

  const launchForeground = useEffectEvent(() => {
    const shouldSkip = skipLaunchRef.current;
    skipLaunchRef.current = false;
    if (shouldSkip || foregroundId === null || isDesktopViewport()) return;
    const element = findWindowElement(foregroundId);
    if (!element || !foregroundLauncher) return;
    const duration = reduceMotion ? 0 : LAUNCH_DURATION;
    launchMobileWindow(element, foregroundLauncher, lastPointerRef.current, duration);
  });

  useLayoutEffect(() => {
    if (isSwitcherOpen || foregroundId === null) return;
    launchForeground();
  }, [foregroundId, isSwitcherOpen]);

  const openNotes = (target: NotesTarget) => {
    addWindow({ kind: "notes", ...target });
  };

  useLayoutEffect(() => {
    const element = desktopFilesRef.current;
    if (!element) return;
    const measure = () => {
      const { clientWidth, clientHeight } = element;
      if (clientWidth === 0 || clientHeight === 0) return;
      setDesktopSize({ width: clientWidth, height: clientHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = desktopFilesRef.current;
    const measuredWidth = element?.clientWidth ?? 0;
    const measuredHeight = element?.clientHeight ?? 0;
    const fallback =
      measuredWidth > 0 && measuredHeight > 0
        ? createDefaultDesktopPositions(
            {
              width: measuredWidth,
              height: measuredHeight,
            },
            DESKTOP_ICON_ORDER,
          )
        : defaultDesktopPositions;
    const stored = readDesktopPositions(fallback);
    const hasSquareLayout =
      localStorage.getItem(SPOTIFY_WIDGET_LAYOUT_KEY) === SPOTIFY_WIDGET_LAYOUT;
    if (stored && !hasSquareLayout) {
      stored["spotify-widget"] = fallback["spotify-widget"];
    }
    localStorage.setItem(SPOTIFY_WIDGET_LAYOUT_KEY, SPOTIFY_WIDGET_LAYOUT);
    setSavedIconPositions(stored);
    setIconPositionsReady(true);
  }, []);

  useEffect(() => {
    if (!savedIconPositions) return;
    localStorage.setItem(
      DESKTOP_POSITIONS_KEY,
      JSON.stringify(savedIconPositions),
    );
  }, [savedIconPositions]);

  const handleOpenProjectsFolder = () => {
    setSelected("projects-folder");
    addWindow({ kind: "folder", folder: "projects" });
  };
  const openProject = (slug: string) => {
    const project = portfolioProjects.find((entry) => entry.slug === slug);
    if (!project) return;
    trackProjectClick(project.slug, project.projectType);
    addWindow({ kind: "project", slug });
  };
  // Deep links: /desktop?open=project:<slug> or ?open=folder:projects. f-024
  // maps the old routes (/portfolio/<slug>, …) onto the same targets.
  const handledDeepLink = useRef(false);
  useEffect(() => {
    if (handledDeepLink.current) return;
    handledDeepLink.current = true;
    const target = readDeepLink(window.location.search);
    if (!target) return;
    if (target.kind === "project") openProject(target.slug);
    else addWindow({ kind: "folder", folder: target.folder });
  });
  const openPreview = (doc: PreviewDoc) => {
    addWindow({ kind: "preview", doc });
  };
  const handleOpenCertificationsFolder = () => {
    setSelected("certifications-folder");
    addWindow({ kind: "folder", folder: "certifications" });
  };
  const handleOpenIntroMovie = () => {
    setSelected("intro-mov");
    addWindow({ kind: "movie" });
  };
  const handleIntroMoviePlay = () => {
    // One audible source at a time: the intro pauses the music.
    if (spotify.isPlaying) spotify.togglePlay();
  };
  const openFromTerminal = (target: TerminalTarget) => {
    if (typeof target === "object") {
      openProject(target.project);
      return true;
    }
    if (target === "projects") handleOpenProjectsFolder();
    else if (target === "cv") handleOpenCv();
    else if (target === "certifications") handleOpenCertificationsFolder();
    else if (target === "notes") openNotes({ noteId: DEFAULT_NOTE_ID });
    else if (target === "mail") addWindow({ kind: "app", app: "mail" });
    else if (target === "photos") addWindow({ kind: "app", app: "photos" });
    else if (target === "youtube") openYouTube();
    else if (target === "spotify") openSpotify();
    else if (target === "intro") handleOpenIntroMovie();
    return true;
  };
  const handleOpenCv = () => {
    setSelected("cv-pdf");
    openPreview({ kind: "cv" });
  };
  const handleOpenSecretFolder = () => {
    setSelected("folder");
    addWindow({ kind: "folder", folder: "secret" });
  };
  const handleOpenMemeImage = (memeId: MemeId) => {
    setSelected(memeId);
    addWindow({ kind: "image", memeId });
  };
  const openVideo = () => {
    claimAudible("video");
    setVideoPlaybackRequest((current) => current + 1);
    addWindow({ kind: "video" });
  };
  const openSpotify = () => {
    addWindow({ kind: "spotify" });
  };
  const openYouTube = () => {
    addWindow({ kind: "youtube" });
  };
  const openWeather = () => {
    setSelected("weather");
    addWindow({ kind: "weather" });
  };
  const handleSelectIcon = (id: string) => {
    setSelected(id);
  };
  const handleMoveIcon = (id: string, position: IconPosition) => {
    setSavedIconPositions((current) => ({
      ...(current ?? iconPositions),
      [id]: position,
    }));
  };
  const openApp = (app: DockApp) => {
    if ("href" in app) {
      trackExternalClick(app.name, "desktop");
      return;
    }
    setSelected(app.id);
    if (app.id === "notes") {
      openNotes({ noteId: DEFAULT_NOTE_ID });
      return;
    }
    if (app.id === "terminal") {
      addWindow({ kind: "terminal" });
      return;
    }
    if (app.id === "spotify") {
      openSpotify();
      return;
    }
    if (app.id === "youtube") {
      openYouTube();
      return;
    }
    if (app.id === "weather") {
      openWeather();
      return;
    }
    addWindow({ kind: "app", app: app.id });
  };
  const minimizedWindows = openWindows
    .filter((item) => item.minimizedAt !== null)
    .sort(byMinimizeOrder)
    .map(describeMinimizedWindow);
  const switcherCards = [...openWindows]
    .sort(byMostRecent)
    .map(describeMinimizedWindow);
  const desktopClassName = ["desktop", isSwitcherOpen && "mobile-switcher-open"]
    .filter(Boolean)
    .join(" ");

  const handleToggleControl = (id: ToggleId) => {
    setToggles((current) => ({ ...current, [id]: !current[id] }));
  };
  const handleWifiConnectedChange = (isConnected: boolean) => {
    setToggles((current) => ({
      ...current,
      wifi: isConnected,
      airplane: isConnected ? false : current.airplane,
    }));
  };
  const toggleMenuBarPanel = (id: MenuBarPanelId) => {
    setOpenMenuBarPanel((current) => (current === id ? null : id));
  };
  const handleControlCenterButtonClick = () => toggleMenuBarPanel("controlCenter");
  const handleWifiButtonClick = () => toggleMenuBarPanel("wifi");
  const handleBatteryButtonClick = () => toggleMenuBarPanel("battery");
  const handleCloseMenuBarPanel = useCallback(() => {
    setOpenMenuBarPanel(null);
  }, []);
  const isControlCenterOpen = openMenuBarPanel === "controlCenter";
  const isWifiMenuOpen = openMenuBarPanel === "wifi";
  const isBatteryMenuOpen = openMenuBarPanel === "battery";

  const { weather: zurichWeather, status: weatherStatus } = useZurichWeather(isOffline);
  const canVideoTakePlayback = (item: OpenWindow) => {
    if (item.content.kind !== "video") return false;
    if (item.minimizedAt !== null) return false;
    if (item.id !== foregroundId) return false;
    if (isSwitcherOpen || isOffline) return false;
    return true;
  };
  const isVideoPlaybackActive = (item: OpenWindow) =>
    canVideoTakePlayback(item) && audibleSource === "video";
  const spotifyControls: MusicControls = {
    isPlaying: spotify.isPlaying,
    isDisabled: isOffline || !spotify.isReady,
    onTogglePlay: spotify.togglePlay,
    onPrevious: spotify.previous,
    onNext: spotify.next,
  };
  const readNowPlaying = (): { track: NowPlayingTrack; music: MusicControls | null } => {
    if (isVideoPlaying) {
      return { track: rickrollTrack, music: null };
    }
    const showsYoutube = isYoutubePlaying || (youtubeSession !== null && !spotify.isPlaying);
    if (!youtubeSession || !showsYoutube) {
      return { track: spotify.track, music: spotifyControls };
    }
    return {
      track: youtubeSession.track,
      music: {
        isPlaying: youtubeSession.isPlaying,
        isDisabled: isOffline,
        onTogglePlay: youtubeSession.togglePlay,
        onPrevious: youtubeSession.previous,
        onNext: youtubeSession.next,
      },
    };
  };
  const nowPlaying = readNowPlaying();

  const controls: ControlCenterState = {
    volume,
    brightness,
    toggles,
    nowPlaying: nowPlaying.track,
    music: nowPlaying.music,
    onVolumeChange: setVolume,
    onBrightnessChange: setBrightness,
    onToggle: handleToggleControl,
  };

  return (
    <StartupScreen ready={iconPositionsReady && weatherStatus !== "loading"}>
    <main
      className={desktopClassName}
      aria-label="Javi — interactive desktop portfolio"
      onPointerDownCapture={handlePointerDownCapture}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (
          target === event.currentTarget ||
          target.classList.contains("desktop-files")
        )
          setSelected(null);
      }}
    >
      <h1 className="sr-only">
        Javi — Full-Stack Software Engineer
      </h1>

      <div className="menu-bar desktop-only">
        <div>
          <button
            type="button"
            className="menu-apple-button"
            aria-label="About This Mac"
            title="About This Mac"
            onClick={() => addWindow({ kind: "about-mac" })}
          >
          <svg className="menu-apple" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.76 3.08.82 1.18-.24 2.31-.94 3.57-.85 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08l.01-.01ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z" />
          </svg>
          </button>
          <b>Javi</b>
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Window</span>
          <span>Help</span>
        </div>
        <div>
          <LanguageMenu />
          <button
            type="button"
            className={`cc-menu-button menu-wifi ${isWifiMenuOpen ? "active" : ""}`}
            aria-label={isOffline ? "Wi-Fi: Not connected" : "Wi-Fi: Connected"}
            aria-expanded={isWifiMenuOpen}
            aria-haspopup="dialog"
            onClick={handleWifiButtonClick}
          >
            <ControlIcon name={isOffline ? "wifiOff" : "wifi"} />
          </button>
          <button
            type="button"
            className={`cc-menu-button menu-battery ${isBatteryMenuOpen ? "active" : ""}`}
            aria-label={`Battery: ${BATTERY_LEVEL}%${isLowPowerMode ? ", Low Power Mode" : ""}`}
            aria-expanded={isBatteryMenuOpen}
            aria-haspopup="dialog"
            onClick={handleBatteryButtonClick}
          >
            <MenuBarBattery isLowPowerMode={isLowPowerMode} />
          </button>
          <button
            type="button"
            className={`cc-menu-button ${isControlCenterOpen ? "active" : ""}`}
            aria-label="Control Center"
            aria-expanded={isControlCenterOpen}
            aria-haspopup="dialog"
            onClick={handleControlCenterButtonClick}
          >
            <ControlIcon name="controlCenter" />
          </button>
          <Clock />
        </div>
      </div>
      <DesktopWifiMenu
        isOpen={isWifiMenuOpen}
        isConnected={!isOffline}
        onConnectedChange={handleWifiConnectedChange}
        onClose={handleCloseMenuBarPanel}
      />
      <DesktopBatteryMenu
        isOpen={isBatteryMenuOpen}
        isLowPowerMode={isLowPowerMode}
        onLowPowerModeChange={setIsLowPowerMode}
        onClose={handleCloseMenuBarPanel}
      />
      <DesktopControlCenter
        isOpen={isControlCenterOpen}
        controls={controls}
        onClose={handleCloseMenuBarPanel}
      />
      <MobileControlCenter controls={controls} />
      <div
        className="mobile-status-bar"
        data-tone={statusTone}
        aria-label="Mobile status bar"
      >
        <div className="mobile-clock">
          <Clock compact />
        </div>
        <MobileStatusIndicators
          airplane={toggles.airplane}
          wifi={toggles.wifi}
        />
      </div>

      <div
        ref={desktopFilesRef}
        className={`desktop-files desktop-only ${isDesktopLayoutReady ? "ready" : ""}`}
      >
        <DesktopIcon
          id="projects-folder"
          label="Projects"
          selected={selected === "projects-folder"}
          position={positionFor(iconPositions, "projects-folder")}
          onSelect={handleSelectIcon}
          onOpen={handleOpenProjectsFolder}
          onMove={handleMoveIcon}
        />
        <DesktopIcon
          id="certifications-folder"
          label="My certifications"
          selected={selected === "certifications-folder"}
          position={positionFor(iconPositions, "certifications-folder")}
          onSelect={handleSelectIcon}
          onOpen={handleOpenCertificationsFolder}
          onMove={handleMoveIcon}
        />
        <DesktopIcon
          id="cv-pdf"
          label={CV_LABEL}
          icon={PDF_ICON}
          variant="document"
          selected={selected === "cv-pdf"}
          position={positionFor(iconPositions, "cv-pdf")}
          onSelect={handleSelectIcon}
          onOpen={handleOpenCv}
          onMove={handleMoveIcon}
        />
        <DesktopIcon
          id="intro-mov"
          label={INTRO_MOVIE.label}
          icon={INTRO_MOVIE.poster}
          variant="picture"
          selected={selected === "intro-mov"}
          position={positionFor(iconPositions, "intro-mov")}
          onSelect={handleSelectIcon}
          onOpen={handleOpenIntroMovie}
          onMove={handleMoveIcon}
        />
        <DesktopIcon
          id="folder"
          label="Don't Open"
          selected={selected === "folder"}
          position={positionFor(iconPositions, "folder")}
          onSelect={handleSelectIcon}
          onOpen={handleOpenSecretFolder}
          onMove={handleMoveIcon}
        />
        {memeImages.map((meme) => (
          <DesktopIcon
            key={meme.id}
            id={meme.id}
            label={meme.label}
            icon={meme.src}
            variant="picture"
            selected={selected === meme.id}
            position={positionFor(iconPositions, meme.id)}
            onSelect={handleSelectIcon}
            onOpen={() => handleOpenMemeImage(meme.id)}
            onMove={handleMoveIcon}
          />
        ))}
        <DesktopWidget
          position={positionFor(iconPositions, "weather-widget")}
          onMove={(position) => handleMoveIcon("weather-widget", position)}
          onOpen={openWeather}
        >
          <WeatherWidget variant="desktop" weather={zurichWeather} status={weatherStatus} />
        </DesktopWidget>
        <DesktopWidget
          position={positionFor(iconPositions, "spotify-widget")}
          onMove={(position) => handleMoveIcon("spotify-widget", position)}
          onOpen={openSpotify}
          label="Spotify widget. Press Enter to open Spotify. Drag or use arrow keys to move."
          className="desktop-widget-square"
        >
          <SpotifyWidget player={spotify} variant="desktop" onOpen={openSpotify} />
        </DesktopWidget>
      </div>

      <DesktopDock
        onOpen={openApp}
        minimizedWindows={minimizedWindows}
        onRestore={focusWindow}
      />

      <MobileHomePages
        pages={[
          <Fragment key="main">
            <WeatherWidget
              variant="mobile"
              weather={zurichWeather}
              status={weatherStatus}
              onOpen={openWeather}
            />
            <SpotifyWidget player={spotify} variant="mobile" onOpen={openSpotify} />
            <MobilePhotoWidget onOpen={handleOpenMemeImage} />
            <MobileFolderLauncher
              label="Projects"
              icon="/os/doc-icons/folder.png"
              onOpen={handleOpenProjectsFolder}
            />
            <MobileFolderLauncher
              label="Certifications"
              launcherKey="certifications-folder"
              icon="/os/doc-icons/folder.png"
              onOpen={handleOpenCertificationsFolder}
            />
            <MobileFolderLauncher
              label={INTRO_MOVIE.label}
              launcherKey="intro-mov"
              icon={INTRO_MOVIE.poster}
              onOpen={handleOpenIntroMovie}
            />
            <MobileFolderLauncher
              label={CV_LABEL}
              launcherKey="cv-pdf"
              icon={PDF_ICON}
              onOpen={handleOpenCv}
            />
            {apps
              .filter(
                (app) =>
                  app.id !== "trash" &&
                  app.id !== "weather" &&
                  !isMobileDockApp(app),
              )
              .map((app) => (
                <AppLauncher key={app.id} app={app} onOpen={openApp}>
                  <span>{app.name}</span>
                </AppLauncher>
              ))}
          </Fragment>,
          <MobileFolderLauncher
            key="dont-open"
            label="Don't Open"
            launcherKey="folder"
            icon="/os/doc-icons/folder.png"
            onOpen={handleOpenSecretFolder}
          />,
        ]}
      />

      <div className="dock mobile-dock" aria-label="Applications">
        {MOBILE_DOCK_APP_IDS.map((id) => {
          const app = apps.find((item) => item.id === id);
          if (!app) return null;
          return (
            <div className="dock-slot" key={app.id}>
              <AppLauncher app={app} onOpen={openApp} />
            </div>
          );
        })}
      </div>

      {openWindows.map((window) => {
        const stackProps: WindowStackProps = {
          windowId: window.id,
          zIndex: window.zIndex,
          offsetX: window.offsetX,
          offsetY: window.offsetY,
          isMinimized: window.minimizedAt !== null,
          onFocus: () => focusWindow(window.id),
          onMinimize: () => minimizeWindow(window.id),
        };
        const onClose = () => closeWindow(window.id);
        if (window.content.kind === "notes")
          return (
            <NotesWindow
              key={window.id}
              onOpenProject={openProject}
              noteId={window.content.noteId}
              view={window.content.view}
              onClose={onClose}
              {...stackProps}
            />
          );
        if (window.content.kind === "app")
          return (
            <AppWindow
              key={window.id}
              app={window.content.app}
              onClose={onClose}
              {...stackProps}
            />
          );
        if (window.content.kind === "folder")
          return (
            <FolderWindow
              key={window.id}
              folder={window.content.folder}
              onClose={onClose}
              onOpenVideo={openVideo}
              onOpenProject={openProject}
              onOpenPreview={openPreview}
              {...stackProps}
            />
          );
        if (window.content.kind === "about-mac")
          return (
            <WindowShell key={window.id} title="" onClose={onClose} {...stackProps}>
              <AboutThisMac />
            </WindowShell>
          );
        if (window.content.kind === "terminal")
          return (
            <WindowShell
              key={window.id}
              title="javi — -zsh — 80×24"
              onClose={onClose}
              variant="dark"
              {...stackProps}
            >
              <Terminal onOpen={openFromTerminal} onExit={onClose} />
            </WindowShell>
          );
        if (window.content.kind === "movie")
          return (
            <WindowShell
              key={window.id}
              title={INTRO_MOVIE.label}
              onClose={onClose}
              variant="dark"
              {...stackProps}
            >
              <MoviePlayer onPlay={handleIntroMoviePlay} />
            </WindowShell>
          );
        if (window.content.kind === "preview") {
          const { doc } = window.content;
          const certificate = doc.kind === "certificate" ? findCertificate(doc.id) : null;
          return (
            <WindowShell
              key={window.id}
              title={certificate ? certificateLabel(certificate, false) : CV_LABEL}
              onClose={onClose}
              {...stackProps}
            >
              <PreviewDocument doc={doc} />
            </WindowShell>
          );
        }
        if (window.content.kind === "project") {
          const { slug } = window.content;
          const project = portfolioProjects.find((entry) => entry.slug === slug);
          if (!project) return null;
          return (
            <WindowShell key={window.id} title={project.title} onClose={onClose} {...stackProps}>
              <ProjectDocument project={project} />
            </WindowShell>
          );
        }
        if (window.content.kind === "image")
          return (
            <ImageWindow
              key={window.id}
              meme={findMemeImage(window.content.memeId)}
              onClose={onClose}
              {...stackProps}
            />
          );
        if (window.content.kind === "spotify")
          return (
            <SpotifyWindow
              key={window.id}
              onClose={onClose}
              player={spotify}
              {...stackProps}
            />
          );
        if (window.content.kind === "weather")
          return (
            <WindowShell
              key={window.id}
              title="Weather"
              onClose={onClose}
              variant="dark"
              {...stackProps}
            >
              <WeatherApp isOffline={isOffline} />
            </WindowShell>
          );
        if (window.content.kind === "youtube")
          return (
            <WindowShell
              key={window.id}
              title="YouTube"
              onClose={onClose}
              variant="dark"
              {...stackProps}
            >
              <div className="browser-bar citizenx-browser-bar">
                <span>‹</span>
                <span>›</span>
                <div>
                  <BrowserLockIcon />
                  youtube.com
                </div>
              </div>
              <YouTubeApp
                volume={volume}
                isOffline={isOffline}
                isSuspended={audibleSource !== null && audibleSource !== "youtube"}
                playbackGateRef={playbackGateRef}
                onClaimPlayback={() => claimAudible("youtube")}
                onReleasePlayback={() => releaseAudible("youtube")}
                onSessionChange={setYoutubeSession}
              />
            </WindowShell>
          );
        return (
          <VideoWindow
            key={window.id}
            onClose={onClose}
            volume={volume}
            isOffline={isOffline}
            isPlaybackActive={isVideoPlaybackActive(window)}
            canTakePlayback={canVideoTakePlayback(window)}
            playbackRequest={videoPlaybackRequest}
            playbackGateRef={playbackGateRef}
            onClaimPlayback={() => claimAudible("video")}
            onReleasePlayback={() => releaseAudible("video")}
            onPlayingChange={setIsVideoPlaying}
            {...stackProps}
          />
        );
      })}
      {switcher ? (
        <MobileAppSwitcher
          cards={switcherCards}
          entryId={switcher.entryId}
          onOpenWindow={handleSwitcherOpenWindow}
          onCloseWindow={closeWindow}
          onDismiss={handleSwitcherDismiss}
        />
      ) : (
        <MobileHomeGesture
          foregroundId={foregroundId}
          launcherKey={foregroundLauncher}
          tone={statusTone}
          canOpenSwitcher={openWindows.length > 0}
          onGoHome={handleGoHome}
          onOpenSwitcher={handleOpenSwitcher}
        />
      )}
      {spotify.audioFrame}
      <div
        className="brightness-overlay"
        aria-hidden="true"
        style={{ opacity: ((100 - brightness) / 100) * MAX_SCREEN_DIM }}
      />
    </main>
    </StartupScreen>
  );
}
