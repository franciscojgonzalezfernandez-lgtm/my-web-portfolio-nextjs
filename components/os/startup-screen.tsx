"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

// Set once the boot animation has played; later loads in the same tab session skip it.
const BOOTED_KEY = "javi-os-booted";

const subscribeNever = () => () => {};
const readBooted = () => {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === "1";
  } catch {
    // Storage can be blocked; booting again is harmless.
    return false;
  }
};

// This component stays mounted around the desktop. App launches never restart it.
export default function StartupScreen({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [assetsReady, setAssetsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expired, setExpired] = useState(false);
  const [finished, setFinished] = useState(false);
  const [bootFinished, setDismissed] = useState(false);
  // Static HTML always ships the boot screen; repeat visits drop it during hydration.
  const bootedEarlier = useSyncExternalStore(subscribeNever, readBooted, () => false);
  const dismissed = bootFinished || bootedEarlier;

  useEffect(() => {
    if (!dismissed) return;
    try {
      sessionStorage.setItem(BOOTED_KEY, "1");
    } catch {
      // Ignore: see above.
    }
  }, [dismissed]);

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const cleanups: Array<() => void> = [];
    // A failed or stalled third-party asset must not trap visitors at startup.
    const deadline = window.setTimeout(() => setExpired(true), 8_000);

    const waitForImage = (image: HTMLImageElement) =>
      new Promise<void>((resolve) => {
        const settle = () => {
          image.removeEventListener("load", settle);
          image.removeEventListener("error", settle);
          resolve();
        };
        if (image.complete) resolve();
        else {
          image.addEventListener("load", settle, { once: true });
          image.addEventListener("error", settle, { once: true });
          cleanups.push(settle);
        }
      }).then(() => image.decode().catch(() => undefined));

    // Let the desktop finish its initial layout before collecting visible assets.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const images = Array.from(contentRef.current?.querySelectorAll("img") ?? [])
          .filter((image) => {
            const rect = image.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
              rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
          });
        const wallpaper = new Image();
        wallpaper.src = "/os/wallpaper.jpg";
        const assets = [document.fonts.ready, ...images.map(waitForImage), waitForImage(wallpaper)];
        let settled = 0;
        void Promise.allSettled(assets.map((asset) => Promise.resolve(asset).finally(() => {
          settled += 1;
          if (!cancelled) setProgress(Math.round((settled / assets.length) * 90));
        }))).then(() => {
          if (!cancelled) setAssetsReady(true);
        });
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearTimeout(deadline);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  const canFinish = (ready && assetsReady) || expired;
  useEffect(() => {
    if (!canFinish) return;
    // Finish the bar, then fade the screen away. This latch never resets.
    const finish = window.setTimeout(() => setFinished(true), 240);
    const dismiss = window.setTimeout(() => setDismissed(true), 520);
    return () => {
      clearTimeout(finish);
      clearTimeout(dismiss);
    };
  }, [canFinish]);

  return (
    <>
      {!dismissed && (
        <div className="startup-screen" data-finished={finished} role="status" aria-label="Loading desktop">
          <svg className="startup-logo" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.76 3.08.82 1.18-.24 2.31-.94 3.57-.85 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08l.01-.01ZM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25Z" />
          </svg>
          <div className="startup-progress" aria-hidden="true">
            <div style={{ transform: `scaleX(${(canFinish ? 100 : progress) / 100})` }} />
          </div>
        </div>
      )}
      <div ref={contentRef} className="startup-content" inert={!dismissed} aria-hidden={!dismissed ? true : undefined}>
        {children}
      </div>
    </>
  );
}
