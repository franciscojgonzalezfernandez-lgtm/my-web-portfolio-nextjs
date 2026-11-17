"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

const ZURICH_NAME = "Zurich";
const HOUR_COUNT = 6;
const MOBILE_HOUR_COUNT = 4;
const REFRESH_MS = 10 * 60 * 1000;
const FORECAST_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=47.3769&longitude=8.5417&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FZurich&forecast_days=2";

export type Sky =
  | "clear"
  | "mostly-clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "freezing-rain"
  | "snow"
  | "thunder";

export type Scene =
  | "sun"
  | "night"
  | "partly-day"
  | "partly-night"
  | "cloud"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

type HourSlot = {
  label: string;
  temperature: number | null;
  code: number | null;
  isDay: boolean;
};

type ZurichWeather = {
  temperature: number;
  code: number;
  isDay: boolean;
  high: number;
  low: number;
  hours: HourSlot[];
};

export type WeatherStatus = "loading" | "ready" | "error" | "offline";

type WeatherWidgetProps = {
  variant: "desktop" | "mobile";
  weather: ZurichWeather | null;
  status: WeatherStatus;
  onOpen?: () => void;
};

const placeholderHours = (): HourSlot[] => [
  { label: "Now", temperature: null, code: null, isDay: true },
  { label: "–", temperature: null, code: null, isDay: true },
  { label: "–", temperature: null, code: null, isDay: true },
  { label: "–", temperature: null, code: null, isDay: true },
  { label: "–", temperature: null, code: null, isDay: true },
  { label: "–", temperature: null, code: null, isDay: true },
];

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const readNumber = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
};

const readHourLabel = (iso: string) => {
  const match = /T(\d{2})/.exec(iso);
  if (!match) return "";
  return String(Number(match[1]));
};

export const skyFromCode = (code: number): Sky => {
  if (code === 0) return "clear";
  if (code === 1) return "mostly-clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code === 51 || code === 53 || code === 55) return "drizzle";
  if (code === 56 || code === 57 || code === 66 || code === 67) return "freezing-rain";
  if (code === 61 || code === 63 || code === 80 || code === 81) return "rain";
  if (code === 65 || code === 82) return "heavy-rain";
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return "snow";
  }
  if (code === 95 || code === 96 || code === 99) return "thunder";
  return "cloudy";
};

export const skyLabel = (sky: Sky, isDay: boolean) => {
  if (sky === "clear" && isDay) return "Sunny";
  if (sky === "clear") return "Clear";
  if (sky === "mostly-clear" && isDay) return "Mostly Sunny";
  if (sky === "mostly-clear") return "Mostly Clear";
  if (sky === "partly") return "Partly Cloudy";
  if (sky === "cloudy") return "Cloudy";
  if (sky === "fog") return "Fog";
  if (sky === "drizzle") return "Drizzle";
  if (sky === "rain") return "Rain";
  if (sky === "heavy-rain") return "Heavy Rain";
  if (sky === "freezing-rain") return "Freezing Rain";
  if (sky === "snow") return "Snow";
  return "Thunderstorms";
};

export const sceneFor = (sky: Sky, isDay: boolean): Scene => {
  if (sky === "thunder") return "storm";
  if (sky === "snow") return "snow";
  if (sky === "rain" || sky === "heavy-rain" || sky === "drizzle" || sky === "freezing-rain") {
    return "rain";
  }
  if (sky === "fog") return "fog";
  if (sky === "cloudy") return "cloud";
  if (sky === "partly" || sky === "mostly-clear") {
    if (isDay) return "partly-day";
    return "partly-night";
  }
  if (isDay) return "sun";
  return "night";
};

const sceneDetails: Record<Scene, ReadonlyArray<string>> = {
  sun: ["wx-sun-glow"],
  night: ["wx-moon-glow", "wx-stars", "wx-stars-twinkle"],
  "partly-day": ["wx-sun-glow", "wx-clouds"],
  "partly-night": ["wx-moon-glow", "wx-stars wx-stars-dim", "wx-clouds wx-clouds-night"],
  cloud: ["wx-clouds wx-clouds-heavy"],
  fog: ["wx-fog"],
  rain: ["wx-clouds wx-clouds-heavy", "wx-rain"],
  snow: ["wx-clouds", "wx-snow"],
  storm: ["wx-clouds wx-clouds-night", "wx-rain wx-rain-heavy"],
};

type WeatherSceneProps = {
  scene: Scene;
  className?: string;
};

export const WeatherScene = ({ scene, className }: WeatherSceneProps) => {
  const rootClass = ["wx-scene", `wx-scene-${scene}`, className].filter(Boolean).join(" ");
  return (
    <span className={rootClass} aria-hidden="true">
      {sceneDetails[scene].map((detail) => (
        <span key={detail} className={`wx-scene-detail ${detail}`} />
      ))}
    </span>
  );
};

const formatTemperature = (value: number | null) => {
  if (value === null) return "--°";
  return `${value}°`;
};

const readCondition = (weather: ZurichWeather | null, status: WeatherStatus) => {
  if (weather) return skyLabel(skyFromCode(weather.code), weather.isDay);
  if (status === "loading") return "";
  return "Weather Unavailable";
};

const parseZurichWeather = (payload: unknown): ZurichWeather | null => {
  if (!isRecord(payload)) return null;
  const current = payload.current;
  const hourly = payload.hourly;
  const daily = payload.daily;
  if (!isRecord(current) || !isRecord(hourly) || !isRecord(daily)) return null;

  const temperature = readNumber(current.temperature_2m);
  const code = readNumber(current.weather_code);
  const currentTime = current.time;
  if (temperature === null || code === null || typeof currentTime !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(currentTime)) return null;

  const times = hourly.time;
  const temps = hourly.temperature_2m;
  const codes = hourly.weather_code;
  const days = hourly.is_day;
  if (!Array.isArray(times) || !Array.isArray(temps) || !Array.isArray(codes) || !Array.isArray(days)) {
    return null;
  }

  const start = times.findIndex((time) => typeof time === "string" && time >= currentTime);
  const startIndex = start === -1 ? 0 : start;
  const hours: HourSlot[] = [];

  for (let index = startIndex; index < times.length && hours.length < HOUR_COUNT; index += 1) {
    const time = times[index];
    const hourTemp = readNumber(temps[index]);
    const hourCode = readNumber(codes[index]);
    if (typeof time !== "string" || hourTemp === null || hourCode === null) continue;
    const isNow = hours.length === 0;
    const isDay = isNow ? current.is_day === 1 : days[index] === 1;
    hours.push({
      label: isNow ? "Now" : readHourLabel(time),
      temperature: isNow ? Math.round(temperature) : Math.round(hourTemp),
      code: isNow ? code : hourCode,
      isDay,
    });
  }

  if (hours.length === 0) return null;

  const today = currentTime.slice(0, 10);
  let high: number | null = null;
  let low: number | null = null;
  if (Array.isArray(daily.time) && Array.isArray(daily.temperature_2m_max) && Array.isArray(daily.temperature_2m_min)) {
    const dayIndex = daily.time.indexOf(today);
    if (dayIndex >= 0) {
      high = readNumber(daily.temperature_2m_max[dayIndex]);
      low = readNumber(daily.temperature_2m_min[dayIndex]);
    }
  }

  return {
    temperature: Math.round(temperature),
    code,
    isDay: current.is_day === 1,
    high: Math.round(high ?? temperature),
    low: Math.round(low ?? temperature),
    hours,
  };
};

export const useZurichWeather = (isOffline: boolean) => {
  const [weather, setWeather] = useState<ZurichWeather | null>(null);
  const [status, setStatus] = useState<WeatherStatus>("loading");
  const weatherRef = useRef<ZurichWeather | null>(null);

  useEffect(() => {
    weatherRef.current = weather;
  }, [weather]);

  useEffect(() => {
    if (isOffline) {
      if (!weatherRef.current) setStatus("offline");
      return;
    }
    if (!weatherRef.current) setStatus("loading");

    const controller = new AbortController();
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const request = ++generation;
      try {
        const response = await fetch(FORECAST_URL, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("forecast failed");
        const next = parseZurichWeather(await response.json());
        if (!next) throw new Error("forecast invalid");
        if (cancelled || request !== generation) return;
        setWeather(next);
        setStatus("ready");
      } catch (error) {
        if (cancelled || request !== generation) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (weatherRef.current) return;
        setStatus("error");
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void load();
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, REFRESH_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isOffline]);

  return { weather, status };
};

const SUN_COLOR = "#ffd60a";
const RAIN_COLOR = "#5ac8fa";
const CUTOUT_WIDTH = 2.6;
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const CLOUD_PATH =
  "M7 18.5h10.5a4 4 0 0 0 .6-7.96A5.75 5.75 0 0 0 7.1 9.6a4.45 4.45 0 0 0-.1 8.9z";
const MOON_PATH = "M10.21 5.04A8 8 0 1 0 18.96 13.79 6.5 6.5 0 0 1 10.21 5.04z";
const BOLT_PATH = "M12.6 10.4 8.8 16.2h3l-1.2 6 5.4-7.8h-3.2l1.8-4z";
const PRECIPITATION_CLOUD = "translate(1.2 -4.2) scale(0.9)";
const PARTLY_CLOUD = "translate(-1 4.9) scale(0.82)";
const PARTLY_MOON = "translate(9.1 0.4) scale(0.58)";

type Streak = readonly [number, number, number, number];
type Point = readonly [number, number];

const DRIZZLE_STREAKS: Streak[] = [
  [8.2, 14.8, 7.7, 16.1],
  [12.2, 14.8, 11.7, 16.1],
  [16.2, 14.8, 15.7, 16.1],
  [10.2, 18.6, 9.7, 19.9],
  [14.2, 18.6, 13.7, 19.9],
];
const RAIN_STREAKS: Streak[] = [
  [8.4, 14.8, 6.8, 19.6],
  [12.4, 14.8, 10.8, 19.6],
  [16.4, 14.8, 14.8, 19.6],
];
const HEAVY_RAIN_STREAKS: Streak[] = [
  [7.4, 14.6, 5.4, 20.8],
  [10.9, 14.6, 8.9, 20.8],
  [14.4, 14.6, 12.4, 20.8],
  [17.9, 14.6, 15.9, 20.8],
];
const SLEET_STREAKS: Streak[] = [
  [8.4, 14.8, 7, 19],
  [16.4, 14.8, 15, 19],
];
const STORM_STREAKS: Streak[] = [
  [6.4, 14.6, 5.4, 17.6],
  [18.6, 14.6, 17.6, 17.6],
];
const SLEET_FLAKES: Point[] = [[12, 18.2]];
const SNOW_FLAKES: Point[] = [
  [7.8, 16.4],
  [16.2, 16.4],
  [12, 20],
];

const round = (value: number) => Number(value.toFixed(2));

const Cloud = ({ transform }: { transform?: string }) => (
  <path fill="currentColor" d={CLOUD_PATH} transform={transform} />
);

const Cutout = ({ d, transform }: { d: string; transform?: string }) => (
  <path
    d={d}
    transform={transform}
    fill="black"
    stroke="black"
    strokeWidth={CUTOUT_WIDTH}
    strokeLinejoin="round"
  />
);

type KnockoutProps = {
  id: string;
  cutout: ReactNode;
  children: ReactNode;
};

const Knockout = ({ id, cutout, children }: KnockoutProps) => (
  <>
    <mask id={id} maskUnits="userSpaceOnUse" x="-4" y="-4" width="32" height="32">
      <rect x="-4" y="-4" width="32" height="32" fill="white" />
      {cutout}
    </mask>
    <g mask={`url(#${id})`}>{children}</g>
  </>
);

type SunProps = {
  cx: number;
  cy: number;
  radius: number;
  rayStart: number;
  rayEnd: number;
  rayWidth: number;
};

const Sun = ({ cx, cy, radius, rayStart, rayEnd, rayWidth }: SunProps) => (
  <g fill={SUN_COLOR} stroke={SUN_COLOR} strokeLinecap="round">
    <circle cx={cx} cy={cy} r={radius} stroke="none" />
    {RAY_ANGLES.map((angle) => {
      const radians = (angle * Math.PI) / 180;
      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      return (
        <line
          key={angle}
          x1={round(cx + cos * rayStart)}
          y1={round(cy + sin * rayStart)}
          x2={round(cx + cos * rayEnd)}
          y2={round(cy + sin * rayEnd)}
          strokeWidth={rayWidth}
        />
      );
    })}
  </g>
);

const Sparkle = ({ cx, cy, size }: { cx: number; cy: number; size: number }) => (
  <path
    fill="currentColor"
    d={`M${cx} ${cy - size}Q${cx} ${cy} ${cx + size} ${cy}Q${cx} ${cy} ${cx} ${cy + size}Q${cx} ${cy} ${cx - size} ${cy}Q${cx} ${cy} ${cx} ${cy - size}z`}
  />
);

const Streaks = ({ streaks }: { streaks: Streak[] }) => (
  <g stroke={RAIN_COLOR} strokeWidth="1.9" strokeLinecap="round">
    {streaks.map(([x1, y1, x2, y2]) => (
      <line key={`${x1}-${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} />
    ))}
  </g>
);

const Flakes = ({ flakes }: { flakes: Point[] }) => (
  <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
    {flakes.map(([cx, cy]) => (
      <path
        key={`${cx}-${cy}`}
        d={`M${cx} ${round(cy - 1.8)}v3.6M${round(cx - 1.56)} ${round(cy - 0.9)}l3.12 1.8M${round(cx - 1.56)} ${round(cy + 0.9)}l3.12-1.8`}
      />
    ))}
  </g>
);

const PrecipitationGlyph = ({ children }: { children: ReactNode }) => (
  <>
    <Cloud transform={PRECIPITATION_CLOUD} />
    {children}
  </>
);

const GlyphShape = ({ sky, isDay, maskId }: { sky: Sky; isDay: boolean; maskId: string }) => {
  if (sky === "clear" && isDay) {
    return <Sun cx={12} cy={12} radius={4.6} rayStart={7.4} rayEnd={9.7} rayWidth={2} />;
  }
  if (sky === "clear") {
    return (
      <>
        <path fill="currentColor" d={MOON_PATH} />
        <Sparkle cx={17.6} cy={4.6} size={2.4} />
        <Sparkle cx={21} cy={10.2} size={1.5} />
      </>
    );
  }
  if ((sky === "partly" || sky === "mostly-clear") && isDay) {
    return (
      <>
        <Knockout id={maskId} cutout={<Cutout d={CLOUD_PATH} transform={PARTLY_CLOUD} />}>
          <Sun cx={15.4} cy={8.4} radius={3.3} rayStart={5.3} rayEnd={6.9} rayWidth={1.6} />
        </Knockout>
        <Cloud transform={PARTLY_CLOUD} />
      </>
    );
  }
  if (sky === "partly" || sky === "mostly-clear") {
    return (
      <>
        <Knockout id={maskId} cutout={<Cutout d={CLOUD_PATH} transform={PARTLY_CLOUD} />}>
          <path fill="currentColor" d={MOON_PATH} transform={PARTLY_MOON} />
        </Knockout>
        <Cloud transform={PARTLY_CLOUD} />
      </>
    );
  }
  if (sky === "fog") {
    return (
      <PrecipitationGlyph>
        <path
          d="M4.5 15.6h15M7 19.6h10"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </PrecipitationGlyph>
    );
  }
  if (sky === "drizzle") {
    return (
      <PrecipitationGlyph>
        <Streaks streaks={DRIZZLE_STREAKS} />
      </PrecipitationGlyph>
    );
  }
  if (sky === "rain") {
    return (
      <PrecipitationGlyph>
        <Streaks streaks={RAIN_STREAKS} />
      </PrecipitationGlyph>
    );
  }
  if (sky === "heavy-rain") {
    return (
      <PrecipitationGlyph>
        <Streaks streaks={HEAVY_RAIN_STREAKS} />
      </PrecipitationGlyph>
    );
  }
  if (sky === "freezing-rain") {
    return (
      <PrecipitationGlyph>
        <Streaks streaks={SLEET_STREAKS} />
        <Flakes flakes={SLEET_FLAKES} />
      </PrecipitationGlyph>
    );
  }
  if (sky === "snow") {
    return (
      <PrecipitationGlyph>
        <Flakes flakes={SNOW_FLAKES} />
      </PrecipitationGlyph>
    );
  }
  if (sky === "thunder") {
    return (
      <>
        <Knockout id={maskId} cutout={<Cutout d={BOLT_PATH} />}>
          <Cloud transform={PRECIPITATION_CLOUD} />
          <Streaks streaks={STORM_STREAKS} />
        </Knockout>
        <path
          d={BOLT_PATH}
          fill={SUN_COLOR}
          stroke={SUN_COLOR}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </>
    );
  }
  return <Cloud />;
};

export const WeatherGlyph = ({ code, isDay }: { code: number | null; isDay: boolean }) => {
  const maskId = `wx-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sky = code === null ? "cloudy" : skyFromCode(code);
  const className = code === null ? "wx-glyph wx-glyph-empty" : "wx-glyph";
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <GlyphShape sky={sky} isDay={isDay} maskId={maskId} />
    </svg>
  );
};

const HourlyForecast = ({ hours }: { hours: HourSlot[] }) => (
  <div className="wx-hours" aria-label="Hourly forecast">
    {hours.map((hour, index) => (
      <div className="wx-hour" key={`${hour.label}-${index}`}>
        <span className="wx-hour-label">{hour.label}</span>
        <WeatherGlyph code={hour.code} isDay={hour.isDay} />
        <span className="wx-hour-temp">{formatTemperature(hour.temperature)}</span>
      </div>
    ))}
  </div>
);

const TemperatureRange = ({ high, low }: { high: string; low: string }) => (
  <p className="wx-range">
    <span>H:{high}</span>
    <span>L:{low}</span>
  </p>
);

type WidgetBodyProps = {
  variant: "desktop" | "mobile";
  tempText: string;
  condition: string;
  high: string;
  low: string;
  code: number | null;
  isDay: boolean;
  hours: HourSlot[];
};

const WidgetBody = ({
  variant,
  tempText,
  condition,
  high,
  low,
  code,
  isDay,
  hours,
}: WidgetBodyProps) => (
  <div className="wx-body">
    <div className="wx-top">
      <div className="wx-copy">
        <p className="wx-place">{ZURICH_NAME}</p>
        <p className="wx-temp">{tempText}</p>
      </div>
      <div className="wx-summary">
        <WeatherGlyph code={code} isDay={isDay} />
        <p className="wx-condition">{condition}</p>
        <TemperatureRange high={high} low={low} />
      </div>
    </div>
    <HourlyForecast hours={variant === "desktop" ? hours : hours.slice(0, MOBILE_HOUR_COUNT)} />
  </div>
);

const WeatherWidget = ({ variant, weather, status, onOpen }: WeatherWidgetProps) => {
  const scene = weather ? sceneFor(skyFromCode(weather.code), weather.isDay) : "cloud";
  const condition = readCondition(weather, status);
  const hours = weather?.hours ?? placeholderHours();
  const variantClass = variant === "desktop" ? "wx wx-desktop desktop-only" : "wx wx-mobile";
  const rootClass = [variantClass, onOpen && "cursor-pointer"].filter(Boolean).join(" ");
  const summary = weather
    ? `${ZURICH_NAME}, ${weather.temperature} degrees, ${condition}. High ${weather.high}, low ${weather.low}.`
    : `${ZURICH_NAME} weather`;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!onOpen) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  };

  const openProps = onOpen
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": `${summary} Open Weather.`,
        onClick: onOpen,
        onKeyDown: handleKeyDown,
      }
    : { "aria-label": summary };

  return (
    <section className={rootClass} aria-busy={status === "loading"} {...openProps}>
      <WeatherScene scene={scene} />
      <WidgetBody
        variant={variant}
        tempText={formatTemperature(weather ? weather.temperature : null)}
        condition={condition}
        high={formatTemperature(weather ? weather.high : null)}
        low={formatTemperature(weather ? weather.low : null)}
        code={weather ? weather.code : null}
        isDay={weather ? weather.isDay : true}
        hours={hours}
      />
      <p className="sr-only">Weather data by Open-Meteo.</p>
    </section>
  );
};

export default WeatherWidget;
