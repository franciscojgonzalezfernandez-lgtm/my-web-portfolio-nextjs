"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { postPlayerMessage } from "./media";

export type PlaybackStatus = "playing" | "buffering" | "error";

const BUFFER_DRAIN_MS = 3000;
const STALL_TO_ERROR_MS = 5000;
const RECONNECT_MS = 2000;
const REBUFFER_MS = 1200;
const PLAYBACK_ID_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

type OfflinePlaybackHandlers = {
  onStall?: () => void;
  onError?: () => void;
  onReconnect?: () => void;
};

export const useOfflinePlayback = (
  isOffline: boolean,
  handlers: OfflinePlaybackHandlers,
) => {
  const handlersRef = useRef(handlers);
  const isStalledRef = useRef(isOffline);
  const [status, setStatus] = useState<PlaybackStatus>(
    isOffline ? "buffering" : "playing",
  );

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (isOffline) {
      const stallDelay = isStalledRef.current ? 0 : BUFFER_DRAIN_MS;
      const stallTimer = window.setTimeout(() => {
        isStalledRef.current = true;
        handlersRef.current.onStall?.();
        setStatus((current) => (current === "error" ? current : "buffering"));
      }, stallDelay);
      const errorTimer = window.setTimeout(() => {
        handlersRef.current.onError?.();
        setStatus("error");
      }, stallDelay + STALL_TO_ERROR_MS);
      return () => {
        window.clearTimeout(stallTimer);
        window.clearTimeout(errorTimer);
      };
    }

    if (!isStalledRef.current) {
      return;
    }
    const retryTimer = window.setTimeout(() => {
      handlersRef.current.onReconnect?.();
      setStatus("buffering");
    }, RECONNECT_MS);
    const resumeTimer = window.setTimeout(() => {
      isStalledRef.current = false;
      setStatus("playing");
    }, RECONNECT_MS + REBUFFER_MS);
    return () => {
      window.clearTimeout(retryTimer);
      window.clearTimeout(resumeTimer);
    };
  }, [isOffline]);

  return { status, isStalledRef };
};

export const applyPlayerConnection = (
  iframe: HTMLIFrameElement | null,
  isOffline: boolean,
) => {
  postPlayerMessage(iframe, {
    event: "command",
    func: isOffline ? "pauseVideo" : "playVideo",
    args: [],
  });
};

const createPlaybackId = () =>
  Array.from(
    { length: 16 },
    () => PLAYBACK_ID_CHARS[Math.floor(Math.random() * PLAYBACK_ID_CHARS.length)],
  ).join("");

export const useYouTubeOfflinePlayback = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  isOffline: boolean,
) => {
  const [playbackId, setPlaybackId] = useState("");
  const { status, isStalledRef } = useOfflinePlayback(isOffline, {
    onStall: () => applyPlayerConnection(iframeRef.current, true),
    onError: () => setPlaybackId(createPlaybackId()),
    onReconnect: () => applyPlayerConnection(iframeRef.current, false),
  });

  return { status, playbackId, isStalledRef };
};

const YouTubeError = ({ playbackId }: { playbackId: string }) => (
  <div className="yt-error" role="alert">
    <div className="yt-error-content">
      <svg className="yt-error-icon" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" />
        <rect x="21.5" y="11" width="5" height="18" rx="2.5" />
        <circle cx="24" cy="35.5" r="3" />
      </svg>
      <div>
        <p>
          An error occurred. Please try again later. (Playback ID:{" "}
          {playbackId})
        </p>
        <a
          href="https://support.google.com/youtube/?p=player_error1&hl=en"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More
        </a>
      </div>
    </div>
  </div>
);

type YouTubePlaybackOverlayProps = {
  status: PlaybackStatus;
  playbackId: string;
};

export const YouTubePlaybackOverlay = ({ status, playbackId }: YouTubePlaybackOverlayProps) => {
  if (status === "buffering") {
    return <div className="yt-spinner" role="status" aria-label="Loading" />;
  }
  if (status === "error") {
    return <YouTubeError playbackId={playbackId} />;
  }
  return null;
};
