"use client";

import { CustomVideo } from "@/components/high-order-components/CustomVideo";

export const INTRO_MOVIE = {
  label: "Intro.mov",
  src: "/portfolio-intro.webm",
  poster: "/intro-cover.webp",
} as const;

// QuickTime-style player for Intro.mov. CustomVideo owns the analytics events.
export default function MoviePlayer({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="movie-player">
      <CustomVideo
        src={INTRO_MOVIE.src}
        poster={INTRO_MOVIE.poster}
        title={INTRO_MOVIE.label}
        controls
        playsInline
        preload="metadata"
        onPlay={onPlay}
      />
    </div>
  );
}
