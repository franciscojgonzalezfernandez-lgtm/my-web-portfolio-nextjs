"use client";

import { useEffect, useRef } from "react";

type RainColumn = { row: number; speed: number };

const RAIN_GLYPHS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:.=*+-<>¦|";
const RAIN_FONT_SIZE = 16;
const RAIN_FRAME_MS = 50;
const RAIN_TRAIL_FADE = "rgba(0, 0, 0, 0.08)";
const RAIN_BODY_COLOR = "#00d84a";
const RAIN_HEAD_COLOR = "#d6ffe0";
const STATIC_RAIN_FRAMES = 90;

const randomGlyph = () =>
  RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)];

const createColumn = (rowCount: number): RainColumn => ({
  row: -Math.floor(Math.random() * rowCount),
  speed: 0.6 + Math.random() * 0.6,
});

// Glyphs are mirrored, as in the film's code rain.
const drawGlyph = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
) => {
  context.save();
  context.translate(x + RAIN_FONT_SIZE, y);
  context.scale(-1, 1);
  context.fillStyle = color;
  context.fillText(randomGlyph(), 0, 0);
  context.restore();
};

const MatrixRain = ({ isAnimated }: { isAnimated: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    let columns: RainColumn[] = [];
    let rowCount = 0;

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(clientWidth * scale);
      canvas.height = Math.round(clientHeight * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.font = `${RAIN_FONT_SIZE}px ui-monospace, "SF Mono", Menlo, monospace`;
      context.textBaseline = "top";
      context.fillStyle = "#000";
      context.fillRect(0, 0, clientWidth, clientHeight);

      rowCount = Math.ceil(clientHeight / RAIN_FONT_SIZE);
      const columnCount = Math.ceil(clientWidth / RAIN_FONT_SIZE);
      columns = Array.from(
        { length: columnCount },
        (_, index) => columns[index] ?? createColumn(rowCount),
      );
    };

    const step = () => {
      context.fillStyle = RAIN_TRAIL_FADE;
      context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      columns.forEach((column, index) => {
        const previousRow = Math.floor(column.row);
        column.row += column.speed;
        const headRow = Math.floor(column.row);
        const x = index * RAIN_FONT_SIZE;

        if (previousRow >= 0 && previousRow !== headRow) {
          drawGlyph(context, x, previousRow * RAIN_FONT_SIZE, RAIN_BODY_COLOR);
        }
        if (headRow >= 0) {
          drawGlyph(context, x, headRow * RAIN_FONT_SIZE, RAIN_HEAD_COLOR);
        }
        if (headRow > rowCount && Math.random() > 0.975) {
          columns[index] = { ...createColumn(rowCount), row: 0 };
        }
      });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    if (!isAnimated) {
      Array.from({ length: STATIC_RAIN_FRAMES }).forEach(step);
      return () => observer.disconnect();
    }

    let frameId = 0;
    let lastStepAt = 0;
    const tick = (now: number) => {
      frameId = window.requestAnimationFrame(tick);
      if (now - lastStepAt < RAIN_FRAME_MS) {
        return;
      }
      lastStepAt = now;
      step();
    };
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [isAnimated]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 block h-full w-full animate-[matrix-fade-in_1.2s_ease-out]"
    />
  );
};

export default MatrixRain;
