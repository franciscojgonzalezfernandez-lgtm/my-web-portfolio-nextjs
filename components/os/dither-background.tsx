"use client";

import { useEffect, useRef } from "react";

type RGB = [number, number, number];

const MOBILE_QUERY = "(max-width: 700px)";

type DitherBackgroundProps = {
  src: string;
  gridSize?: number;
  mobileGridSize?: number;
  primaryColor: string;
  secondaryColor: string;
  threshold?: number;
  className?: string;
};

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const hexToRgb = (hex: string): RGB | null => {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match?.[1]) return null;
  const value = match[1];
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
};

const getLuminance = (red: number, green: number, blue: number) =>
  (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

const drawImageCover = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = Math.ceil(image.naturalWidth * scale);
  const drawHeight = Math.ceil(image.naturalHeight * scale);
  const offsetX = Math.floor((width - drawWidth) / 2);
  const offsetY = Math.floor((height - drawHeight) / 2);
  context.imageSmoothingQuality = "high";
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

const DitherBackground = ({
  src,
  gridSize = 2,
  mobileGridSize,
  primaryColor,
  secondaryColor,
  threshold = 0,
  className,
}: DitherBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const primary = hexToRgb(primaryColor);
    const secondary = hexToRgb(secondaryColor);
    if (!primary || !secondary) return;
    const image = new Image();
    const media = window.matchMedia(MOBILE_QUERY);
    let isImageLoaded = false;

    const resolveGridSize = () => {
      if (!media.matches || mobileGridSize === undefined) {
        return gridSize;
      }
      return mobileGridSize;
    };

    const render = () => {
      if (!isImageLoaded) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const activeGridSize = resolveGridSize();
      if (activeGridSize <= 0) return;
      const columns = Math.ceil(width / activeGridSize);
      const rows = Math.ceil(height / activeGridSize);
      if (columns === 0 || rows === 0) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = columns;
      canvas.height = rows;
      drawImageCover(context, image, columns, rows);

      let pixels: ImageData;
      try {
        pixels = context.getImageData(0, 0, columns, rows);
      } catch {
        return;
      }
      const { data } = pixels;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const index = (y * columns + x) * 4;
          const luminance = getLuminance(data[index], data[index + 1], data[index + 2]);
          const bayerValue = BAYER_4X4[y % 4][x % 4] / 16;
          const cutoff = bayerValue * (1 - threshold) + 0.5 * threshold;
          const [red, green, blue] = luminance < cutoff ? primary : secondary;
          data[index] = red;
          data[index + 1] = green;
          data[index + 2] = blue;
          data[index + 3] = 255;
        }
      }

      context.putImageData(pixels, 0, 0);
    };

    const handleImageLoad = () => {
      isImageLoaded = true;
      render();
    };

    const resizeObserver = new ResizeObserver(render);
    image.addEventListener("load", handleImageLoad);
    media.addEventListener("change", render);
    image.src = src;
    resizeObserver.observe(canvas);

    return () => {
      image.removeEventListener("load", handleImageLoad);
      media.removeEventListener("change", render);
      resizeObserver.disconnect();
    };
  }, [src, gridSize, mobileGridSize, primaryColor, secondaryColor, threshold]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`[image-rendering:pixelated] ${className ?? ""}`}
    />
  );
};

export default DitherBackground;
