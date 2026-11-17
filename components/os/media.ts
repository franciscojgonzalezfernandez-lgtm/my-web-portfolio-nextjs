import { projects } from "@/data/projects.data";

export type NowPlayingTrack = {
  videoId: string;
  title: string;
  artist: string;
  cover: string;
  // Self-hosted "uploads" (project demos in public/) play from this file
  // instead of the YouTube iframe, and show this frame as their thumbnail.
  localSrc?: string;
  thumbnail?: string;
};

export const YOUTUBE_ORIGIN = "https://www.youtube.com";

export const YOUTUBE_STATE = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
} as const;

const appleCover = (path: string) =>
  `https://is1-ssl.mzstatic.com/image/thumb/${path}/600x600bb.jpg`;

export const youtubeThumbnail = (videoId: string) =>
  `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

export const playlist: readonly NowPlayingTrack[] = [
  {
    videoId: "YXwYJyrKK5A",
    title: "What You Know",
    artist: "Two Door Cinema Club",
    cover: appleCover("Music211/v4/e6/7f/61/e67f61ff-6231-1613-a2a9-aa7f7439457c/00892038002275_Cover.jpg"),
  },
  {
    videoId: "PMk8L9FNqnY",
    title: "Over My Dead Body",
    artist: "Drake",
    cover: appleCover("Music124/v4/d2/53/62/d2536245-b94c-b3fd-7168-9512f655f6d4/00602527899091.rgb.jpg"),
  },
  {
    videoId: "_l09H-3zzgA",
    title: "Under Cover of Darkness",
    artist: "The Strokes",
    cover: appleCover("Music115/v4/8a/90/df/8a90dff0-73c6-c483-ab79-6810308414a2/884977195552.jpg"),
  },
  {
    videoId: "h0ffIJ7ZO4U",
    title: "Sultans of Swing",
    artist: "Dire Straits",
    cover: appleCover("Music/47/c3/21/mzi.ciyzkqao.jpg"),
  },
  {
    videoId: "beINamVRGy4",
    title: "Semi-Charmed Life",
    artist: "Third Eye Blind",
    cover: appleCover("Music115/v4/89/8f/21/898f2118-a3e1-2b4a-7481-d986d09ffc29/mzi.jbqxjhwg.jpg"),
  },
  {
    videoId: "hszZmFRPqx8",
    title: "The Island, Pt. I (Dawn)",
    artist: "Pendulum",
    cover: appleCover("Music/31/a6/d6/mzi.vtgbygzf.jpg"),
  },
  {
    videoId: "vq4hRDnGbDY",
    title: "Denver",
    artist: "Jack Harlow",
    cover: appleCover("Music126/v4/8e/af/03/8eaf035b-04ff-6667-4576-48ba4d115032/075679685858.jpg"),
  },
  {
    videoId: "Mimg_JpyFmA",
    title: "Donde Duele Inspira",
    artist: "Flowklorikos",
    cover: "https://cdn-images.dzcdn.net/images/cover/a89887b9d20a14209fee8552616c72be/500x500-000000-80-0-0.jpg",
  },
  {
    videoId: "a5fHoAx12DY",
    title: "Tú Sin Mí",
    artist: "Dread Mar I",
    cover: appleCover("Music114/v4/66/26/63/66266380-c0fb-4add-bd65-9000d3fc781a/DreadMarIViviEnDoiTunes.jpg"),
  },
  {
    videoId: "qWQ-0XhGNWo",
    title: "Bossa & People",
    artist: "El Kuelgue",
    cover: appleCover("Music211/v4/56/1a/f1/561af1df-919f-44bf-29cc-ffe0517b5bd4/199066185926.jpg"),
  },
  {
    videoId: "TaTBssx683I",
    title: "Por Mi Tripa",
    artist: "Pereza",
    cover: appleCover("Music124/v4/fa/0a/3d/fa0a3d4f-3a5c-f374-2c8e-e3c4554bc54c/mzi.xczozpdk.jpg"),
  },
  {
    videoId: "4JkIs37a2JE",
    title: "Virtual Insanity",
    artist: "Jamiroquai",
    cover: appleCover("Music122/v4/81/ec/ef/81ecef00-2a0b-807b-154c-ff0e5fb90571/886443439115.jpg"),
  },
  {
    videoId: "n3nPiBai66M",
    title: "Just Like Heaven",
    artist: "The Cure",
    cover: appleCover("Music/y2004/m11/d24/h19/s06.lkkhqoax.jpg"),
  },
];

const channelAvatar = (path: string) =>
  `https://yt3.ggpht.com/${path}=s176-c-k-c0x00ffffff-no-rj`;

const nprMusicAvatar = channelAvatar(
  "IXJZjJSYR9kfnUcHwIzAYjunIfovC2QYOOAseZxrDHBwvCKQEHBNcdC6PmNxn8EALE357U3vvhE",
);

export type YouTubePlaylist = {
  id: string;
  title: string;
  channel: string;
  cover: string;
  videos: readonly NowPlayingTrack[];
};

const nothingExceptEverything: NowPlayingTrack = {
  videoId: "hif5eI5pBxo",
  title: "nothing, except everything.",
  artist: "Wesley Wang",
  cover: channelAvatar("ytc/AIdro_lOL0cXGOXtGQJCNCI8Tn8UHQ-cQIg4Zyla2zruc3-ygsg"),
};

const nobodyLikesMilhouse: NowPlayingTrack = {
  videoId: "5omjH2dQLOY",
  title: "Nobody likes Milhouse",
  artist: "Jimmy Washington",
  cover: channelAvatar("ytc/AIdro_kvbTr0YvyBjAEeXjckQTQpXll_DaISaIcIJ2xXlXg"),
};

const navalRavikant: NowPlayingTrack = {
  videoId: "KyfUysrNaco",
  title: "44 Harsh Truths About The Game Of Life - Naval Ravikant (4K)",
  artist: "Chris Williamson",
  cover: channelAvatar("ytc/AIdro_mmN30Y4ap7dtPfLw8Algolz_LGtHHpTJxa-qAw-MCQpdo"),
};

const longDayOut: NowPlayingTrack = {
  videoId: "8NxXh3UqpAE",
  title: "A Long Day Out",
  artist: "Salomon TV",
  cover: channelAvatar(
    "FYMGSx1JlufyZQx6pZuoIrogO4Eu3hMGmcSdqcL_G8Dz5eCWBkAgTWP5c5NZ4vIfuUX2QVpWmg",
  ),
};

const kilianSalomonTv: NowPlayingTrack = {
  videoId: "zflO59_AzqQ",
  title: "Kilian - Salomon TV",
  artist: "SalomonTrailRunning",
  cover: channelAvatar("ytc/AIdro_m8DvoqH6A4tTmYcAST4TA_4WHWJ47bQr5CNLp3O4qt-g"),
};

const marianoYPaco: NowPlayingTrack = {
  videoId: "j7_rhMRq7tY",
  title: "Mariano y Paco debutan como albañiles | Aquí no hay quien viva",
  artist: "atresplayer",
  cover: channelAvatar(
    "mlBnus5FacB-G16VaVbYnPYaTUFSocBGH1ms-L8IdblIom7tcIFJm-mvznpKBbqd7kEpfpFoStA",
  ),
};

const rewindappAvatar = channelAvatar(
  "K7XkaPrmyPEuiBXt3QBAKVdK-W-J9ON3jHZED3YChSQiZ9iKJVDkTfqtOPh5lbn0x6om1Rm7VBQ",
);

const musicMixesPlaylist: YouTubePlaylist = {
  id: "music-mixes",
  title: "Music Mixes",
  channel: "Various channels",
  cover: rewindappAvatar,
  videos: [
    {
      videoId: "n4OflWszcZ0",
      title: "It's summer 1987, you're driving in Miami",
      artist: "Rewindapp Studio",
      cover: rewindappAvatar,
    },
    {
      videoId: "NS8DsXzU2Xg",
      title: "Best of classic Dance & Hause 80s, 90, 2000s",
      artist: "Runin-X",
      cover: channelAvatar(
        "vOpys3yC13xwt1NpTNNLuIPfBTUSrKzg54CHtr54WK4UD2_krd_4h5T8lphKnDo-ahDFNq0hYA",
      ),
    },
  ],
};

const tinyDeskPlaylist: YouTubePlaylist = {
  id: "tiny-desk",
  title: "Tiny Desk Concerts",
  channel: "NPR Music",
  cover: nprMusicAvatar,
  videos: [
    {
      videoId: "Rmg040Su5R8",
      title: "Omar Montes: Tiny Desk Concert",
      artist: "NPR Music",
      cover: nprMusicAvatar,
    },
    {
      videoId: "SW6L_lTrIFg",
      title: "C. Tangana: Tiny Desk (Home) Concert",
      artist: "NPR Music",
      cover: nprMusicAvatar,
    },
    {
      videoId: "RG6O-Qq79G0",
      title: "Nicki Nicole: Tiny Desk (Home) Concert",
      artist: "NPR Music",
      cover: nprMusicAvatar,
    },
    {
      videoId: "MzPPTUNbB7I",
      title: "Guitarricadelafuente: Tiny Desk Concert",
      artist: "NPR Music",
      cover: nprMusicAvatar,
    },
    {
      videoId: "eUjQkMma-Is",
      title: "Parcels: Tiny Desk Concert",
      artist: "NPR Music",
      cover: nprMusicAvatar,
    },
  ],
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withBasePath = (src: string) => `${BASE_PATH}${src.startsWith("/") ? src : `/${src}`}`;
export const JAVI_CHANNEL = "Javi";
export const JAVI_CHANNEL_URL = "https://www.youtube.com/@javi-tricker";
const JAVI_AVATAR = withBasePath("/smiling.webp");

export const isLocalVideo = (video: NowPlayingTrack) => Boolean(video.localSrc);

// Javi's "uploads": the intro plus every project demo video shipped in public/.
const javiIntro: NowPlayingTrack = {
  videoId: "local:intro",
  title: "8 years, 2 languages — engineering + business",
  artist: JAVI_CHANNEL,
  cover: JAVI_AVATAR,
  localSrc: withBasePath("/portfolio-intro.webm"),
  thumbnail: withBasePath("/intro-cover.webp"),
};

const javiProjectDemos: YouTubePlaylist = {
  id: "javi-project-demos",
  title: "Project demos",
  channel: JAVI_CHANNEL,
  cover: JAVI_AVATAR,
  videos: projects.flatMap((project) =>
    project.videoUrl
      ? [
          {
            videoId: `local:${project.slug}`,
            title: `${project.title} — demo`,
            artist: JAVI_CHANNEL,
            cover: JAVI_AVATAR,
            localSrc: withBasePath(project.videoUrl),
            thumbnail: withBasePath(project.images[0] ?? "/intro-cover.webp"),
          },
        ]
      : [],
  ),
};

export type YouTubeFeedItem =
  | { kind: "video"; video: NowPlayingTrack }
  | { kind: "playlist"; playlist: YouTubePlaylist };

export const youtubeFeed: readonly YouTubeFeedItem[] = [
  { kind: "video", video: javiIntro },
  { kind: "playlist", playlist: javiProjectDemos },
  { kind: "video", video: nothingExceptEverything },
  { kind: "video", video: nobodyLikesMilhouse },
  { kind: "playlist", playlist: tinyDeskPlaylist },
  { kind: "video", video: navalRavikant },
  { kind: "video", video: longDayOut },
  { kind: "playlist", playlist: musicMixesPlaylist },
  { kind: "video", video: kilianSalomonTv },
  { kind: "video", video: marianoYPaco },
];

const videosInFeedItem = (item: YouTubeFeedItem) => {
  if (item.kind === "video") {
    return [item.video];
  }
  return [];
};

const playlistInFeedItem = (item: YouTubeFeedItem) => {
  if (item.kind === "playlist") {
    return [item.playlist];
  }
  return [];
};

export const youtubeVideos: readonly NowPlayingTrack[] = youtubeFeed.flatMap(videosInFeedItem);

export const youtubePlaylists: readonly YouTubePlaylist[] = youtubeFeed.flatMap(playlistInFeedItem);

export const youtubeLibrary: readonly NowPlayingTrack[] = [
  ...youtubeVideos,
  ...youtubePlaylists.flatMap((playlist) => playlist.videos),
];

export const postPlayerMessage = (
  iframe: HTMLIFrameElement | null,
  message: Record<string, unknown>,
) => {
  iframe?.contentWindow?.postMessage(JSON.stringify(message), YOUTUBE_ORIGIN);
};

export type YouTubeSession = {
  track: NowPlayingTrack;
  isPlaying: boolean;
  togglePlay: () => void;
  previous: () => void;
  next: () => void;
};

export type AudibleSource = "spotify" | "youtube" | "video";

export type PlaybackGate = {
  owner: AudibleSource | null;
  held: Record<AudibleSource, boolean>;
};

export const createPlaybackGate = (): PlaybackGate => ({
  owner: null,
  held: { spotify: false, youtube: false, video: false },
});

export const claimPlayback = (gate: PlaybackGate, source: AudibleSource) => {
  gate.owner = source;
  gate.held.spotify = source !== "spotify";
  gate.held.youtube = source !== "youtube";
  gate.held.video = source !== "video";
};

export const releasePlayback = (gate: PlaybackGate, source: AudibleSource) => {
  if (gate.owner !== source) return false;
  gate.owner = null;
  return true;
};

export const acknowledgePause = (gate: PlaybackGate, source: AudibleSource) => {
  gate.held[source] = false;
};

// A repeated status update must not start a player that lost the session.
// Only a real state change, or the player that already owns it, may continue.
export const decidePlayback = (
  gate: PlaybackGate,
  source: AudibleSource,
  fromStateChange: boolean,
  canTake: boolean,
): "allow" | "suppress" => {
  if (!canTake || gate.held[source]) return "suppress";
  if (gate.owner === source) return "allow";
  if (!fromStateChange) return "suppress";
  return "allow";
};

export const sendPlayerCommand = (
  iframe: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = [],
) => {
  postPlayerMessage(iframe, { event: "command", func, args });
};

export const applyPlayerVolume = (
  iframe: HTMLIFrameElement | null,
  volume: number,
) => {
  postPlayerMessage(iframe, { event: "command", func: "setVolume", args: [volume] });
  postPlayerMessage(iframe, {
    event: "command",
    func: volume === 0 ? "mute" : "unMute",
    args: [],
  });
};

export const listenToPlayer = (iframe: HTMLIFrameElement | null, id: string) => {
  postPlayerMessage(iframe, { event: "listening", id, channel: "widget" });
};

export const isYouTubePlayerEvent = (
  event: MessageEvent,
  iframe: HTMLIFrameElement | null,
) =>
  iframe !== null &&
  event.origin === YOUTUBE_ORIGIN &&
  event.source === iframe.contentWindow;

export const readPlayerErrorCode = (info: unknown) => {
  if (typeof info !== "object" || info === null) return null;
  const code = (info as { videoData?: { errorCode?: unknown } }).videoData?.errorCode;
  if (typeof code !== "string" && typeof code !== "number") return null;
  if (code === "" || code === "none") return null;
  return String(code);
};

type PlayerMessage = { event: string; info: unknown };

export const readPlayerMessage = (data: unknown): PlayerMessage | null => {
  if (typeof data !== "string") {
    return null;
  }
  try {
    const message = JSON.parse(data) as { event?: unknown; info?: unknown };
    if (typeof message.event !== "string") {
      return null;
    }
    return { event: message.event, info: message.info };
  } catch {
    return null;
  }
};

const assertYouTubeIds = (ids: readonly string[], label: string) => {
  const seen = new Set<string>();
  if (ids.length === 0) throw new Error(`${label} is empty`);
  ids.forEach((id) => {
    if (!id.startsWith("local:") && !/^[A-Za-z0-9_-]{11}$/.test(id)) {
      throw new Error(`${label} id is not a YouTube id: ${id}`);
    }
    if (seen.has(id)) throw new Error(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  });
};

assertYouTubeIds(playlist.map((track) => track.videoId), "playlist");
assertYouTubeIds(
  youtubeLibrary.map((track) => track.videoId),
  "library",
);
