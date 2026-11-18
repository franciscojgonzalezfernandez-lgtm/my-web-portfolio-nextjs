"use client";

import { CustomVideo } from "@/components/high-order-components/CustomVideo";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  applyPlayerVolume,
  readPlayerMessage,
  sendPlayerCommand,
  youtubeFeed,
  youtubeLibrary,
  youtubePlaylists,
  youtubeThumbnail,
  isLocalVideo,
  JAVI_CHANNEL,
  JAVI_CHANNEL_URL,
  youtubeVideos,
  YOUTUBE_ORIGIN,
  YOUTUBE_STATE,
  acknowledgePause,
  decidePlayback,
  isYouTubePlayerEvent,
  readPlayerErrorCode,
  type NowPlayingTrack,
  type PlaybackGate,
  type YouTubeFeedItem,
  type YouTubePlaylist,
  type YouTubeSession,
} from "./media";
import {
  applyPlayerConnection,
  useYouTubeOfflinePlayback,
  YouTubePlaybackOverlay,
} from "./offline-playback";
import { useYouTubeConnection, YouTubeStartupError } from "./use-youtube-connection";
import HomeIndicatorSpacer from "./home-indicator-spacer";

type YouTubeAppProps = {
  volume: number;
  isOffline: boolean;
  isSuspended: boolean;
  playbackGateRef: RefObject<PlaybackGate>;
  onClaimPlayback: () => void;
  onReleasePlayback: () => void;
  onSessionChange: (session: YouTubeSession | null) => void;
};

type YouTubeIconName = "home" | "subscriptions" | "you" | "search" | "close" | "playlist";

const YOUTUBE_PLAYER_ID = "youtube-player";
const CATEGORY_CHIPS = ["All", "Music", "Mixes", "Rock", "Hip hop", "Latin", "Live"];
const GUIDE_ITEMS: readonly { icon: YouTubeIconName; label: string }[] = [
  { icon: "home", label: "Home" },
  { icon: "subscriptions", label: "Subscriptions" },
  { icon: "you", label: "You" },
];

const youtubeIcons = {
  home: <path d="M12 3.2 3 10.4V21h6.4v-6.2h5.2V21H21V10.4z" />,
  subscriptions: (
    <path d="M4 4h16v2H4zm2-3h12v2H6zm-3 7h18v14H3zm7 3v8l6-4z" />
  ),
  you: (
    <path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 10.5c4.4 0 8 2.2 8 5V21H4v-2.5c0-2.8 3.6-5 8-5z" />
  ),
  search: (
    <path d="M10.5 3a7.5 7.5 0 0 1 5.96 12.05l4.74 4.74-1.41 1.41-4.74-4.74A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" />
  ),
  close: (
    <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" />
  ),
  playlist: <path d="M3 5h12v2H3zm0 4h12v2H3zm0 4h8v2H3zm12 0v8l6-4z" />,
} satisfies Record<YouTubeIconName, ReactNode>;

const YouTubeIcon = ({ name }: { name: YouTubeIconName }) => (
  <svg className="yt-icon" viewBox="0 0 24 24" aria-hidden="true">
    {youtubeIcons[name]}
  </svg>
);

const YouTubeLogo = () => (
  <span className="yt-logo-mark" aria-hidden="true">
    <svg viewBox="0 0 28 20">
      <rect width="28" height="20" rx="5.5" fill="#ff0033" />
      <path d="M11.2 5.8v8.4l7.2-4.2z" fill="#fff" />
    </svg>
    <b>YouTube</b>
  </span>
);

const findVideoIndex = (videos: readonly NowPlayingTrack[], videoId: string) =>
  videos.findIndex((video) => video.videoId === videoId);

const findPlaylist = (videoId: string) =>
  youtubePlaylists.find((playlist) => findVideoIndex(playlist.videos, videoId) !== -1);

const videoQueue = (videoId: string) => findPlaylist(videoId)?.videos ?? youtubeVideos;

const adjacentVideoId = (videoId: string, offset: 1 | -1) => {
  const queue = videoQueue(videoId);
  const adjacentIndex =
    (findVideoIndex(queue, videoId) + offset + queue.length) % queue.length;
  return queue[adjacentIndex].videoId;
};

const videoPlayerSrc = (video: NowPlayingTrack) => {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    playsinline: "1",
    enablejsapi: "1",
  });
  return `${YOUTUBE_ORIGIN}/embed/${video.videoId}?${params.toString()}`;
};

const matchesQuery = (video: NowPlayingTrack, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return `${video.title} ${video.artist}`.toLowerCase().includes(normalizedQuery);
};

const playlistMatchesQuery = (playlist: YouTubePlaylist, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (`${playlist.title} ${playlist.channel}`.toLowerCase().includes(normalizedQuery)) {
    return true;
  }
  return playlist.videos.some((video) => matchesQuery(video, query));
};

const matchesFeedItem = (item: YouTubeFeedItem, query: string) => {
  if (item.kind === "video") {
    return matchesQuery(item.video, query);
  }
  return playlistMatchesQuery(item.playlist, query);
};

const feedItemContainsVideo = (item: YouTubeFeedItem, videoId: string) => {
  if (item.kind === "video") {
    return item.video.videoId === videoId;
  }
  return findVideoIndex(item.playlist.videos, videoId) !== -1;
};

const feedAfter = (videoId: string) => {
  const currentIndex = youtubeFeed.findIndex((item) => feedItemContainsVideo(item, videoId));
  if (currentIndex === -1) {
    return youtubeFeed;
  }
  return [...youtubeFeed.slice(currentIndex + 1), ...youtubeFeed.slice(0, currentIndex)];
};

const isActivePlayerState = (state: number) =>
  state === YOUTUBE_STATE.playing || state === YOUTUBE_STATE.buffering;

const OfflineNotice = () => (
  <div className="yt-offline" role="status">
    <b>Connect to the internet</b>
    <p>You&apos;re offline. Check your connection.</p>
  </div>
);

type CardVariant = "grid" | "compact";

type VideoCardProps = {
  video: NowPlayingTrack;
  variant: CardVariant;
  isCurrent?: boolean;
  onSelect: (videoId: string) => void;
};

const VideoCard = ({ video, variant, isCurrent = false, onSelect }: VideoCardProps) => {
  const handleClick = () => onSelect(video.videoId);

  return (
    <button
      type="button"
      className={`yt-card yt-card-${variant} ${isCurrent ? "current" : ""}`}
      aria-label={`Watch ${video.title} by ${video.artist}`}
      aria-current={isCurrent ? "true" : undefined}
      onClick={handleClick}
    >
      <img
        className="yt-card-thumb"
        src={video.thumbnail ?? youtubeThumbnail(video.videoId)}
        alt=""
        loading="lazy"
      />
      <span className="yt-card-details">
        {variant === "grid" ? (
          <img className="yt-avatar" src={video.cover} alt="" loading="lazy" />
        ) : null}
        <span className="yt-card-text">
          <b>{video.title}</b>
          <small>{video.artist}</small>
        </span>
      </span>
    </button>
  );
};

type PlaylistCardProps = {
  playlist: YouTubePlaylist;
  variant: CardVariant;
  onSelect: (videoId: string) => void;
};

const PlaylistCard = ({ playlist, variant, onSelect }: PlaylistCardProps) => {
  const [firstVideo] = playlist.videos;
  const videoCount = `${playlist.videos.length} videos`;
  const handleClick = () => onSelect(firstVideo.videoId);

  return (
    <button
      type="button"
      className={`yt-card yt-card-${variant} yt-playlist-card`}
      aria-label={`Play playlist ${playlist.title} by ${playlist.channel}, ${videoCount}`}
      onClick={handleClick}
    >
      <span className="yt-playlist-thumb">
        <img
          className="yt-card-thumb"
          src={firstVideo.thumbnail ?? youtubeThumbnail(firstVideo.videoId)}
          alt=""
          loading="lazy"
        />
        <span className="yt-playlist-count">
          <YouTubeIcon name="playlist" />
          {videoCount}
        </span>
      </span>
      <span className="yt-card-details">
        {variant === "grid" ? (
          <img className="yt-avatar" src={playlist.cover} alt="" loading="lazy" />
        ) : null}
        <span className="yt-card-text">
          <b>{playlist.title}</b>
          <small>{playlist.channel} · Playlist</small>
        </span>
      </span>
    </button>
  );
};

const renderFeedCard = (
  item: YouTubeFeedItem,
  variant: CardVariant,
  onSelect: (videoId: string) => void,
) => {
  if (item.kind === "video") {
    return (
      <VideoCard
        key={item.video.videoId}
        video={item.video}
        variant={variant}
        onSelect={onSelect}
      />
    );
  }

  return (
    <PlaylistCard
      key={item.playlist.id}
      playlist={item.playlist}
      variant={variant}
      onSelect={onSelect}
    />
  );
};

type PlaylistPanelProps = {
  playlist: YouTubePlaylist;
  currentVideoId: string;
  onSelect: (videoId: string) => void;
};

const PlaylistPanel = ({ playlist, currentVideoId, onSelect }: PlaylistPanelProps) => {
  const position = findVideoIndex(playlist.videos, currentVideoId) + 1;

  return (
    <section className="yt-playlist-panel" aria-label={`Playlist: ${playlist.title}`}>
      <header>
        <b>{playlist.title}</b>
        <small>
          {playlist.channel} · {position}/{playlist.videos.length}
        </small>
      </header>
      <div className="yt-playlist-items">
        {playlist.videos.map((video) => (
          <VideoCard
            key={video.videoId}
            video={video}
            variant="compact"
            isCurrent={video.videoId === currentVideoId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
};

type VideoPlayerProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  video: NowPlayingTrack;
  volume: number;
  isOffline: boolean;
  playbackGateRef: RefObject<PlaybackGate>;
  onClaimPlayback: () => void;
  onReleasePlayback: () => void;
  onStateChange: (state: number) => void;
  onEnded: () => void;
};

const VideoPlayer = ({
  iframeRef,
  video,
  volume,
  isOffline,
  playbackGateRef,
  onClaimPlayback,
  onReleasePlayback,
  onStateChange,
  onEnded,
}: VideoPlayerProps) => {
  const volumeRef = useRef(volume);
  const [playerErrorVideoId, setPlayerErrorVideoId] = useState<string | null>(null);
  const hasPlayerError = playerErrorVideoId === video.videoId;
  const sawPlaybackRef = useRef(false);
  const { status, playbackId, isStalledRef } = useYouTubeOfflinePlayback(
    iframeRef,
    isOffline,
  );
  const onStateChangeRef = useRef(onStateChange);
  const onEndedRef = useRef(onEnded);
  const onClaimRef = useRef(onClaimPlayback);
  const onReleaseRef = useRef(onReleasePlayback);
  const { hasStartupError, retry } = useYouTubeConnection(iframeRef, YOUTUBE_PLAYER_ID, () => {
    applyPlayerVolume(iframeRef.current, volumeRef.current);
    if (isStalledRef.current) applyPlayerConnection(iframeRef.current, true);
  });

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
    onEndedRef.current = onEnded;
    onClaimRef.current = onClaimPlayback;
    onReleaseRef.current = onReleasePlayback;
  });

  useEffect(() => {
    volumeRef.current = volume;
    applyPlayerVolume(iframeRef.current, volume);
  }, [iframeRef, volume]);

  useEffect(() => {
    const handleState = (state: number, fromStateChange: boolean) => {
      const gate = playbackGateRef.current;
      if (isActivePlayerState(state)) {
        const decision = decidePlayback(gate, "youtube", fromStateChange, !isStalledRef.current);
        if (decision === "suppress") {
          sendPlayerCommand(iframeRef.current, "pauseVideo");
          onStateChangeRef.current(YOUTUBE_STATE.paused);
          return;
        }
        sawPlaybackRef.current = true;
        if (gate.owner !== "youtube") onClaimRef.current();
        onStateChangeRef.current(state);
        return;
      }

      if (fromStateChange) {
        const shouldRelease =
          state === YOUTUBE_STATE.paused &&
          sawPlaybackRef.current &&
          gate.owner === "youtube" &&
          !gate.held.youtube;
        acknowledgePause(gate, "youtube");
        if (shouldRelease) {
          sawPlaybackRef.current = false;
          onReleaseRef.current();
        }
      }
      onStateChangeRef.current(state);
      if (state !== YOUTUBE_STATE.ended || playbackGateRef.current.owner !== "youtube") {
        return;
      }
      onEndedRef.current();
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
        setPlayerErrorVideoId(video.videoId);
        return;
      }
      if (message.event === "onStateChange" && typeof message.info === "number") {
        handleState(message.info, true);
        return;
      }
      if (message.event !== "infoDelivery" && message.event !== "initialDelivery") {
        return;
      }
      const { playerState } = (message.info ?? {}) as { playerState?: unknown };
      if (typeof playerState !== "number") {
        return;
      }
      handleState(playerState, false);
    };

    window.addEventListener("message", handlePlayerMessage);
    return () => window.removeEventListener("message", handlePlayerMessage);
  }, [iframeRef, isStalledRef, playbackGateRef, video.videoId]);

  return (
    <div className={`yt-player ${status}`}>
      <iframe
        ref={iframeRef}
        src={videoPlayerSrc(video)}
        title={`${video.artist} — ${video.title}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <YouTubePlaybackOverlay status={status} playbackId={playbackId} />
      {hasPlayerError || (hasStartupError && !isOffline) ? (
        <YouTubeStartupError
          onRetry={() => {
            setPlayerErrorVideoId(null);
            retry();
          }}
        />
      ) : null}
    </div>
  );
};

export default function YouTubeApp({
  volume,
  isOffline,
  isSuspended,
  playbackGateRef,
  onClaimPlayback,
  onReleasePlayback,
  onSessionChange,
}: YouTubeAppProps) {
  const [watchingId, setWatchingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [playerState, setPlayerState] = useState<number>(YOUTUBE_STATE.unstarted);
  const [subscribedChannels, setSubscribedChannels] = useState<string[]>([]);
  const mainRef = useRef<HTMLDivElement>(null);
  const playerFrameRef = useRef<HTMLIFrameElement>(null);
  const watchingIdRef = useRef(watchingId);
  const onClaimRef = useRef(onClaimPlayback);
  const onReleaseRef = useRef(onReleasePlayback);
  if (isSuspended && isActivePlayerState(playerState)) {
    setPlayerState(YOUTUBE_STATE.paused);
  }

  useEffect(() => {
    onClaimRef.current = onClaimPlayback;
    onReleaseRef.current = onReleasePlayback;
  });

  const watchingVideo = youtubeLibrary.find((video) => video.videoId === watchingId) ?? null;
  const isPlaying = isActivePlayerState(playerState);
  const feedResults = youtubeFeed.filter((item) => matchesFeedItem(item, query));

  useEffect(() => {
    watchingIdRef.current = watchingId;
  }, [watchingId]);

  useEffect(() => {
    if (!isSuspended) return;
    sendPlayerCommand(playerFrameRef.current, "pauseVideo");
  }, [isSuspended]);

  useEffect(() => {
    if (!watchingVideo) {
      onSessionChange(null);
      return;
    }
    const stepVideo = (offset: 1 | -1) => {
      onClaimRef.current();
      setPlayerState(YOUTUBE_STATE.unstarted);
      setWatchingId(adjacentVideoId(watchingVideo.videoId, offset));
    };
    const togglePlay = () => {
      if (isPlaying) {
        sendPlayerCommand(playerFrameRef.current, "pauseVideo");
        onReleaseRef.current();
        return;
      }
      onClaimRef.current();
      sendPlayerCommand(playerFrameRef.current, "playVideo");
    };
    onSessionChange({
      track: watchingVideo,
      isPlaying,
      togglePlay,
      previous: () => stepVideo(-1),
      next: () => stepVideo(1),
    });
  }, [watchingVideo, isPlaying, onSessionChange]);

  useEffect(
    () => () => {
      onSessionChange(null);
      onReleaseRef.current();
    },
    [onSessionChange],
  );

  const watchVideo = (videoId: string) => {
    onClaimRef.current();
    setPlayerState(YOUTUBE_STATE.unstarted);
    setWatchingId(videoId);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const goHome = () => {
    onReleaseRef.current();
    setPlayerState(YOUTUBE_STATE.unstarted);
    setWatchingId(null);
  };

  const handleLogoClick = () => {
    setQuery("");
    goHome();
  };

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleClearQuery = () => {
    setQuery("");
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    goHome();
  };

  const handleVideoEnded = () => {
    const endedId = watchingIdRef.current;
    if (!endedId) {
      return;
    }
    setWatchingId((current) => {
      if (current !== endedId) {
        return current;
      }
      return adjacentVideoId(endedId, 1);
    });
  };

  const toggleSubscription = (channel: string) => {
    setSubscribedChannels((current) => {
      if (current.includes(channel)) {
        return current.filter((item) => item !== channel);
      }
      return [...current, channel];
    });
  };

  const renderHome = () => {
    if (isOffline) {
      return <OfflineNotice />;
    }
    if (feedResults.length === 0) {
      return (
        <div className="yt-empty" role="status">
          <b>No results found</b>
          <p>Try different keywords.</p>
        </div>
      );
    }
    return (
      <>
        <div className="yt-chips" aria-hidden="true">
          {CATEGORY_CHIPS.map((chip, index) => (
            <span key={chip} className={index === 0 ? "active" : undefined}>
              {chip}
            </span>
          ))}
        </div>
        <div className="yt-grid">
          {feedResults.map((item) => renderFeedCard(item, "grid", watchVideo))}
        </div>
      </>
    );
  };

  const renderUpNext = (video: NowPlayingTrack) => {
    const currentPlaylist = findPlaylist(video.videoId);

    return (
      <>
        {currentPlaylist ? (
          <PlaylistPanel
            playlist={currentPlaylist}
            currentVideoId={video.videoId}
            onSelect={watchVideo}
          />
        ) : null}
        {feedAfter(video.videoId).map((item) => renderFeedCard(item, "compact", watchVideo))}
      </>
    );
  };

  const renderWatch = (video: NowPlayingTrack) => {
    const isSubscribed = subscribedChannels.includes(video.artist);
    const handleSubscribeClick = () => toggleSubscription(video.artist);

    return (
      <div className="yt-watch">
        <section className="yt-watch-primary" aria-label={video.title}>
          {isLocalVideo(video) ? (
            <div className="yt-player yt-local-player">
              <CustomVideo
                key={video.videoId}
                src={video.localSrc ?? ""}
                poster={video.thumbnail}
                title={video.title}
                controls
                autoPlay
                playsInline
                onPlay={onClaimPlayback}
                onEnded={onReleasePlayback}
              />
            </div>
          ) : (
          <VideoPlayer
            key={video.videoId}
            iframeRef={playerFrameRef}
            video={video}
            volume={volume}
            isOffline={isOffline}
            playbackGateRef={playbackGateRef}
            onClaimPlayback={onClaimPlayback}
            onReleasePlayback={onReleasePlayback}
            onStateChange={setPlayerState}
            onEnded={handleVideoEnded}
          />
          )}
          <h2 className="yt-watch-title">{video.title}</h2>
          <div className="yt-channel-row">
            <img className="yt-avatar" src={video.cover} alt="" />
            <span className="yt-card-text">
              <b>{video.artist}</b>
              {video.artist === JAVI_CHANNEL ? (
                <a href={JAVI_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  @javi-tricker
                </a>
              ) : (
                <small>Channel</small>
              )}
            </span>
            <button
              type="button"
              className={`yt-subscribe ${isSubscribed ? "subscribed" : ""}`}
              aria-pressed={isSubscribed}
              onClick={handleSubscribeClick}
            >
              {isSubscribed ? "Subscribed" : "Subscribe"}
            </button>
          </div>
        </section>
        <aside className="yt-up-next" aria-label="Up next">
          {renderUpNext(video)}
        </aside>
      </div>
    );
  };

  return (
    <div className="youtube-app">
      <header className="yt-header">
        <button
          type="button"
          className="yt-logo"
          aria-label="YouTube Home"
          onClick={handleLogoClick}
        >
          <YouTubeLogo />
        </button>
        <form className="yt-search" role="search" onSubmit={handleSearchSubmit}>
          <label className="sr-only" htmlFor="yt-search-input">
            Search
          </label>
          <input
            id="yt-search-input"
            type="search"
            placeholder="Search"
            autoComplete="off"
            value={query}
            onChange={handleQueryChange}
          />
          {query ? (
            <button
              type="button"
              className="yt-search-clear"
              aria-label="Clear search"
              onClick={handleClearQuery}
            >
              <YouTubeIcon name="close" />
            </button>
          ) : null}
          <button type="submit" className="yt-search-submit" aria-label="Search">
            <YouTubeIcon name="search" />
          </button>
        </form>
        <a
          className="yt-account"
          href={JAVI_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Javi's YouTube channel, opens in a new tab"
        >
          J
        </a>
      </header>

      <div className="yt-body">
        <nav className="yt-guide" aria-label="YouTube">
          {GUIDE_ITEMS.map((item) => (
            <span
              key={item.label}
              className={item.icon === "home" ? "active" : undefined}
            >
              <YouTubeIcon name={item.icon} />
              {item.label}
            </span>
          ))}
        </nav>
        <div className="yt-main" ref={mainRef}>
          {watchingVideo ? renderWatch(watchingVideo) : renderHome()}
          <HomeIndicatorSpacer />
        </div>
      </div>
    </div>
  );
}
