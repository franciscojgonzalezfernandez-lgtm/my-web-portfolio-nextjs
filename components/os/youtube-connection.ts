import { listenToPlayer, readPlayerMessage, YOUTUBE_ORIGIN } from "./media";

const HANDSHAKE_INTERVAL_MS = 250;
const STARTUP_TIMEOUT_MS = 12000;
const MAX_RELOADS = 2;

// An iframe's load event does not mean its asynchronous player is listening yet.
// Start on mount as well, since a cached iframe can load before React hydrates.
export function connectYouTubePlayer(
  iframe: HTMLIFrameElement,
  id: string,
  onReady: () => void,
  onFailure: () => void,
) {
  let stopped = false;
  let reloads = 0;
  let elapsed = 0;
  let interval: number | undefined;

  const stop = () => {
    stopped = true;
    window.clearInterval(interval);
    window.removeEventListener("message", handleMessage);
    iframe.removeEventListener("load", handshake);
  };

  const handshake = () => {
    if (!stopped) listenToPlayer(iframe, id);
  };

  const handleMessage = (event: MessageEvent) => {
    if (event.origin !== YOUTUBE_ORIGIN || event.source !== iframe.contentWindow) return;
    const message = readPlayerMessage(event.data);
    const info = message?.info as { playerState?: unknown } | null;
    if (
      message?.event !== "onReady" &&
      message?.event !== "initialDelivery" &&
      !(message?.event === "infoDelivery" && typeof info?.playerState === "number")
    ) return;
    stop();
    onReady();
  };

  window.addEventListener("message", handleMessage);
  iframe.addEventListener("load", handshake);
  interval = window.setInterval(() => {
    // Don't consume retries while the browser knows it has no connection.
    if (!navigator.onLine) return;
    elapsed += HANDSHAKE_INTERVAL_MS;
    if (elapsed >= STARTUP_TIMEOUT_MS) {
      elapsed = 0;
      if (reloads >= MAX_RELOADS) {
        stop();
        onFailure();
        return;
      }
      reloads += 1;
      iframe.src = iframe.src;
    }
    handshake();
  }, HANDSHAKE_INTERVAL_MS);
  handshake();
  return stop;
}
