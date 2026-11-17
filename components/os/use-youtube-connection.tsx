"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { connectYouTubePlayer } from "./youtube-connection";

export function useYouTubeConnection(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  id: string,
  onReady: () => void,
) {
  const onReadyRef = useRef(onReady);
  const retryRef = useRef<() => void>(() => {});
  const [hasStartupError, setHasStartupError] = useState(false);

  useEffect(() => { onReadyRef.current = onReady; });

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let disconnect: (() => void) | undefined;
    const connect = () => {
      disconnect = connectYouTubePlayer(
        iframe, id, () => onReadyRef.current(), () => setHasStartupError(true),
      );
    };
    retryRef.current = () => {
      disconnect?.();
      setHasStartupError(false);
      iframe.src = iframe.src;
      connect();
    };
    connect();
    return () => {
      disconnect?.();
      retryRef.current = () => {};
    };
  }, [iframeRef, id]);

  return { hasStartupError, retry: () => retryRef.current() };
}

export function YouTubeStartupError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="yt-startup-error" role="alert">
      <p>YouTube couldn&apos;t connect.</p>
      <button type="button" onClick={onRetry}>Try again</button>
    </div>
  );
}
