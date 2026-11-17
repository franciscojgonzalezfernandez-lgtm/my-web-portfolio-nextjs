"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  WeatherGlyph,
  WeatherScene,
  isRecord,
  readNumber,
  sceneFor,
  skyFromCode,
  skyLabel,
  type Scene,
  type WeatherStatus,
} from "./weather";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const CURRENT_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "relative_humidity_2m",
  "dew_point_2m",
  "weather_code",
  "is_day",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "pressure_msl",
  "visibility",
  "uv_index",
];
const HOURLY_FIELDS = ["temperature_2m", "weather_code", "is_day", "precipitation_probability"];
const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunrise",
  "sunset",
  "uv_index_max",
  "precipitation_sum",
  "precipitation_probability_max",
];
const REFRESH_MS = 10 * 60 * 1000;
const CLOCK_TICK_MS = 30 * 1000;
const HOUR_COUNT = 24;
const DAY_COUNT = 10;
const DAY_MINUTES = 24 * 60;
const PRECIPITATION_THRESHOLD = 20;
const SWIPE_THRESHOLD = 56;
const FALLBACK_PLACE_ID = "madrid";
const UV_GRADIENT = "linear-gradient(90deg, #30d158, #ffd60a, #ff9f0a, #ff453a, #bf5af2)";
const PRESSURE_GRADIENT = "linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.6))";
const PRESSURE_RANGE = { min: 970, max: 1050 };
const GLASS_PILL_CLASS =
  "pointer-events-auto rounded-full border-[0.5px] border-white/30 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-xl backdrop-saturate-150";
const COMPASS_POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const TEMPERATURE_COLORS = [
  { from: -Infinity, color: "#5e5ce6" },
  { from: 0, color: "#64d2ff" },
  { from: 8, color: "#30d158" },
  { from: 16, color: "#ffd60a" },
  { from: 24, color: "#ff9f0a" },
  { from: 32, color: "#ff453a" },
].sort((left, right) => left.from - right.from);

type Coordinates = { latitude: number; longitude: number };
type Place = Coordinates & { id: string; name: string };

const SAVED_PLACES: Place[] = [
  { id: "madrid", name: "Madrid", latitude: 40.4168, longitude: -3.7038 },
  { id: "granada", name: "Granada", latitude: 37.1773, longitude: -3.5986 },
  { id: "sierra-nevada", name: "Sierra Nevada", latitude: 37.0956, longitude: -3.3986 },
  { id: "flumserberg", name: "Flumserberg", latitude: 47.0906, longitude: 9.2869 },
  { id: "zurich", name: "Zurich", latitude: 47.3769, longitude: 8.5417 },
];

if (!SAVED_PLACES.some((place) => place.id === FALLBACK_PLACE_ID)) {
  throw new Error(`Saved places must include ${FALLBACK_PLACE_ID}`);
}

type CurrentConditions = {
  time: string;
  temperature: number;
  code: number;
  isDay: boolean;
  feelsLike: number | null;
  humidity: number | null;
  dewPoint: number | null;
  windSpeed: number | null;
  windGusts: number | null;
  windDirection: number | null;
  pressure: number | null;
  visibility: number | null;
  uvIndex: number | null;
};

type SunEvent = "Sunrise" | "Sunset";

type HourItem =
  | {
      kind: "hour";
      time: string;
      label: string;
      temperature: number;
      code: number;
      isDay: boolean;
      precipitationChance: number | null;
    }
  | { kind: "sun"; time: string; label: string; event: SunEvent };

type DayForecast = {
  date: string;
  label: string;
  code: number;
  high: number;
  low: number;
  precipitationChance: number | null;
  precipitationSum: number | null;
  sunrise: string | null;
  sunset: string | null;
  uvMax: number | null;
};

type Forecast = {
  utcOffsetSeconds: number;
  current: CurrentConditions;
  hours: HourItem[];
  days: DayForecast[];
};

type LocationEntry = {
  id: string;
  title: string;
  listTitle: string;
  listSubtitle: string | null;
  forecast: Forecast | null;
};

type CardIconName =
  | "clock"
  | "calendar"
  | "sun"
  | "sunset"
  | "wind"
  | "drop"
  | "thermometer"
  | "humidity"
  | "eye"
  | "gauge";

const readList = (record: Record<string, unknown>, key: string): unknown[] => {
  const value = record[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
};

const readText = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  return value;
};

const LOCAL_TIMESTAMP = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/;

const readLocalTime = (iso: string) => {
  const match = LOCAL_TIMESTAMP.exec(iso);
  const date = match?.[1];
  const hourText = match?.[2];
  const minuteText = match?.[3];
  if (!date || !hourText || !minuteText) return null;
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  if (hours > 23 || minutes > 59) return null;
  return { date, clock: `${hourText}:${minuteText}`, minuteOfDay: hours * 60 + minutes };
};

const readClockTime = (iso: string) => readLocalTime(iso)?.clock ?? "--:--";

const readMinuteOfDay = (iso: string) => readLocalTime(iso)?.minuteOfDay ?? null;

const readTimestamp = (value: unknown) => {
  const text = readText(value);
  if (text === null || readLocalTime(text) === null) return null;
  return text;
};

const readDayLabel = (date: string, today: string) => {
  if (date === today) {
    return "Today";
  }
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
};

const parseCurrent = (current: Record<string, unknown>): CurrentConditions | null => {
  const time = readTimestamp(current.time);
  const temperature = readNumber(current.temperature_2m);
  const code = readNumber(current.weather_code);
  if (time === null || temperature === null || code === null) {
    return null;
  }
  return {
    time,
    temperature,
    code,
    isDay: current.is_day === 1,
    feelsLike: readNumber(current.apparent_temperature),
    humidity: readNumber(current.relative_humidity_2m),
    dewPoint: readNumber(current.dew_point_2m),
    windSpeed: readNumber(current.wind_speed_10m),
    windGusts: readNumber(current.wind_gusts_10m),
    windDirection: readNumber(current.wind_direction_10m),
    pressure: readNumber(current.pressure_msl),
    visibility: readNumber(current.visibility),
    uvIndex: readNumber(current.uv_index),
  };
};

const parseDays = (daily: Record<string, unknown>, today: string): DayForecast[] => {
  const dates = readList(daily, "time");
  const codes = readList(daily, "weather_code");
  const highs = readList(daily, "temperature_2m_max");
  const lows = readList(daily, "temperature_2m_min");
  const sunrises = readList(daily, "sunrise");
  const sunsets = readList(daily, "sunset");
  const uvMaxes = readList(daily, "uv_index_max");
  const sums = readList(daily, "precipitation_sum");
  const chances = readList(daily, "precipitation_probability_max");
  const days: DayForecast[] = [];

  dates.slice(0, DAY_COUNT).forEach((value, index) => {
    const date = readText(value);
    const code = readNumber(codes[index]);
    const high = readNumber(highs[index]);
    const low = readNumber(lows[index]);
    if (date === null || code === null || high === null || low === null) {
      return;
    }
    days.push({
      date,
      label: readDayLabel(date, today),
      code,
      high,
      low,
      precipitationChance: readNumber(chances[index]),
      precipitationSum: readNumber(sums[index]),
      sunrise: readTimestamp(sunrises[index]),
      sunset: readTimestamp(sunsets[index]),
      uvMax: readNumber(uvMaxes[index]),
    });
  });

  return days;
};

const toSunItem = (time: string | null, event: SunEvent): HourItem | null => {
  if (time === null) {
    return null;
  }
  return { kind: "sun", time, label: readClockTime(time), event };
};

const parseHours = (
  hourly: Record<string, unknown>,
  current: CurrentConditions,
  days: DayForecast[],
): HourItem[] => {
  const times = readList(hourly, "time");
  const temperatures = readList(hourly, "temperature_2m");
  const codes = readList(hourly, "weather_code");
  const dayFlags = readList(hourly, "is_day");
  const chances = readList(hourly, "precipitation_probability");
  const currentHour = `${current.time.slice(0, 13)}:00`;
  const startIndex = Math.max(
    0,
    times.findIndex((time) => typeof time === "string" && time >= currentHour),
  );
  const hours: HourItem[] = [
    {
      kind: "hour",
      time: current.time,
      label: "Now",
      temperature: current.temperature,
      code: current.code,
      isDay: current.isDay,
      precipitationChance: readNumber(chances[startIndex]),
    },
  ];

  for (let index = startIndex + 1; index < times.length && hours.length < HOUR_COUNT; index += 1) {
    const time = readText(times[index]);
    const temperature = readNumber(temperatures[index]);
    const code = readNumber(codes[index]);
    if (time === null || temperature === null || code === null) {
      continue;
    }
    hours.push({
      kind: "hour",
      time,
      label: time.slice(11, 13),
      temperature,
      code,
      isDay: dayFlags[index] === 1,
      precipitationChance: readNumber(chances[index]),
    });
  }

  const lastTime = hours[hours.length - 1].time;
  const sunItems = days
    .flatMap((day) => [toSunItem(day.sunrise, "Sunrise"), toSunItem(day.sunset, "Sunset")])
    .filter((item): item is HourItem => {
      if (item === null) {
        return false;
      }
      return item.time > current.time && item.time < lastTime;
    });

  return [...hours, ...sunItems].sort((first, second) => first.time.localeCompare(second.time));
};

const parseForecast = (payload: unknown): Forecast | null => {
  if (!isRecord(payload)) {
    return null;
  }
  const { current, hourly, daily } = payload;
  if (!isRecord(current) || !isRecord(hourly) || !isRecord(daily)) {
    return null;
  }
  const conditions = parseCurrent(current);
  if (!conditions) {
    return null;
  }
  const days = parseDays(daily, conditions.time.slice(0, 10));
  if (days.length === 0) {
    return null;
  }
  const utcOffsetSeconds = readNumber(payload.utc_offset_seconds);
  if (utcOffsetSeconds === null) return null;
  return {
    utcOffsetSeconds,
    current: conditions,
    hours: parseHours(hourly, conditions, days),
    days,
  };
};

const buildForecastUrl = (places: Coordinates[]) => {
  const params = new URLSearchParams({
    latitude: places.map((place) => place.latitude.toFixed(4)).join(","),
    longitude: places.map((place) => place.longitude.toFixed(4)).join(","),
    current: CURRENT_FIELDS.join(","),
    hourly: HOURLY_FIELDS.join(","),
    daily: DAILY_FIELDS.join(","),
    timezone: "auto",
    forecast_days: String(DAY_COUNT),
  });
  return `${FORECAST_ENDPOINT}?${params}`;
};

const formatDegrees = (value: number | null) => {
  if (value === null) {
    return "--°";
  }
  return `${Math.round(value)}°`;
};

const formatLocalTime = (utcOffsetSeconds: number, now: number) =>
  new Date(now + utcOffsetSeconds * 1000).toISOString().slice(11, 16);

const formatMillimeters = (value: number) => {
  if (value > 0 && value < 1) {
    return `${value.toFixed(1)} mm`;
  }
  return `${Math.round(value)} mm`;
};

const readCondition = (forecast: Forecast) =>
  skyLabel(skyFromCode(forecast.current.code), forecast.current.isDay);

const readScene = (forecast: Forecast | null): Scene => {
  if (!forecast) {
    return "cloud";
  }
  return sceneFor(skyFromCode(forecast.current.code), forecast.current.isDay);
};

const readTemperatureColor = (temperature: number) => {
  const band = [...TEMPERATURE_COLORS].reverse().find((entry) => temperature >= entry.from);
  return band?.color ?? TEMPERATURE_COLORS[0].color;
};

const readUvLevel = (uvIndex: number) => {
  if (uvIndex < 3) {
    return "Low";
  }
  if (uvIndex < 6) {
    return "Moderate";
  }
  if (uvIndex < 8) {
    return "High";
  }
  if (uvIndex < 11) {
    return "Very High";
  }
  return "Extreme";
};

const readCompassPoint = (degrees: number) => {
  const index =
    ((Math.round(degrees / 45) % COMPASS_POINTS.length) + COMPASS_POINTS.length) %
    COMPASS_POINTS.length;
  return COMPASS_POINTS[index] ?? "N";
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const describeHourly = (forecast: Forecast) => {
  const currentLabel = readCondition(forecast);
  const change = forecast.hours.find(
    (item) =>
      item.kind === "hour" &&
      item.label !== "Now" &&
      skyLabel(skyFromCode(item.code), item.isDay) !== currentLabel,
  );
  const outlook =
    change && change.kind === "hour"
      ? `${skyLabel(skyFromCode(change.code), change.isDay)} conditions expected around ${readClockTime(change.time)}.`
      : `${currentLabel} conditions will continue for the rest of the day.`;
  const gusts = forecast.current.windGusts;
  if (gusts === null) {
    return outlook;
  }
  return `${outlook} Wind gusts are up to ${Math.round(gusts)} km/h.`;
};

const describeFeelsLike = (temperature: number, feelsLike: number) => {
  const difference = feelsLike - temperature;
  if (Math.abs(difference) < 2) {
    return "Similar to the actual temperature.";
  }
  if (difference < 0) {
    return "Wind is making it feel colder.";
  }
  return "Humidity is making it feel warmer.";
};

const describeVisibility = (kilometers: number) => {
  if (kilometers >= 10) {
    return "Perfectly clear view.";
  }
  if (kilometers >= 5) {
    return "Light haze is affecting visibility.";
  }
  return "Low visibility right now.";
};

const buildEntries = (forecasts: Record<string, Forecast>, now: number): LocationEntry[] =>
  SAVED_PLACES.map((place): LocationEntry => {
    const forecast = forecasts[place.id] ?? null;
    return {
      id: place.id,
      title: place.name,
      listTitle: place.name,
      listSubtitle: forecast ? formatLocalTime(forecast.utcOffsetSeconds, now) : null,
      forecast,
    };
  });

const useNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
};

const samePlace = (payload: unknown, place: Coordinates) => {
  if (!isRecord(payload)) return false;
  const latitude = readNumber(payload.latitude);
  const longitude = readNumber(payload.longitude);
  if (latitude === null || longitude === null) return false;
  return Math.abs(latitude - place.latitude) <= 0.1 && Math.abs(longitude - place.longitude) <= 0.1;
};

const useForecasts = (places: Place[], isOffline: boolean) => {
  const [forecasts, setForecasts] = useState<Record<string, Forecast>>({});
  const [status, setStatus] = useState<WeatherStatus>("loading");
  const hasForecastRef = useRef(false);

  useEffect(() => {
    if (isOffline) {
      if (!hasForecastRef.current) {
        setStatus("offline");
      }
      return;
    }
    if (!hasForecastRef.current) {
      setStatus("loading");
    }
    const controller = new AbortController();
    let cancelled = false;
    let generation = 0;

    const load = async () => {
      const request = ++generation;
      try {
        const response = await fetch(buildForecastUrl(places), {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("forecast failed");
        }
        const payload: unknown = await response.json();
        const results = Array.isArray(payload) ? payload : [payload];
        const next: Record<string, Forecast> = {};
        places.forEach((place) => {
          const match = results.find((result) => samePlace(result, place));
          const forecast = parseForecast(match);
          if (forecast) {
            next[place.id] = forecast;
          }
        });
        if (cancelled || request !== generation) return;
        if (Object.keys(next).length === 0) {
          throw new Error("forecast invalid");
        }
        hasForecastRef.current = true;
        setForecasts(next);
        setStatus("ready");
      } catch {
        if (
          cancelled ||
          controller.signal.aborted ||
          request !== generation ||
          hasForecastRef.current
        ) {
          return;
        }
        setStatus("error");
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      void load();
    };

    void load();
    const interval = window.setInterval(() => void load(), REFRESH_MS);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [places, isOffline]);

  return { forecasts, status };
};

const CardIcon = ({ name }: { name: CardIconName }) => {
  const shapes: Record<CardIconName, ReactNode> = {
    clock: (
      <>
        <circle cx="8" cy="8" r="6.25" />
        <path d="M8 4.5V8l2.5 1.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="2" y="3" width="12" height="11" rx="2" />
        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
      </>
    ),
    sun: (
      <>
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M12.6 3.4l-1 1M4.4 11.6l-1 1" />
      </>
    ),
    sunset: <path d="M2 12h12M4.5 12a3.5 3.5 0 0 1 7 0M8 2v4.5M6 4.5l2 2 2-2" />,
    wind: <path d="M2 6h8a2 2 0 1 0-2-2M2 10h10a2 2 0 1 1-2 2" />,
    drop: <path d="M8 2s-4.5 5-4.5 8a4.5 4.5 0 0 0 9 0C12.5 7 8 2 8 2z" />,
    thermometer: <path d="M6.5 9.5V3a1.5 1.5 0 0 1 3 0v6.5a3 3 0 1 1-3 0z" />,
    humidity: (
      <path d="M2 6c1.5-1.3 2.5-1.3 4 0s2.5 1.3 4 0 2.5-1.3 4 0M2 10.5c1.5-1.3 2.5-1.3 4 0s2.5 1.3 4 0 2.5-1.3 4 0" />
    ),
    eye: (
      <>
        <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" />
        <circle cx="8" cy="8" r="2" />
      </>
    ),
    gauge: <path d="M2.5 11.5a5.5 5.5 0 1 1 11 0M8 11.5l2.5-3" />,
  };
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="size-3.5 shrink-0 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]"
    >
      {shapes[name]}
    </svg>
  );
};

const Card = ({
  title,
  icon,
  className,
  children,
}: {
  title: string;
  icon: CardIconName;
  className?: string;
  children: ReactNode;
}) => (
  <section
    aria-label={title}
    className={`flex flex-col rounded-2xl bg-black/15 p-3 shadow-[inset_0_0_0_0.5px_rgba(255,255,255,0.18)] backdrop-blur-md ${className ?? ""}`}
  >
    <h3 className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-white/60 uppercase">
      <CardIcon name={icon} />
      {title}
    </h3>
    {children}
  </section>
);

const Tile = ({
  title,
  icon,
  value,
  caption,
  footer,
  children,
}: {
  title: string;
  icon: CardIconName;
  value?: string;
  caption?: string;
  footer?: string;
  children?: ReactNode;
}) => (
  <Card title={title} icon={icon} className="min-h-[164px] min-w-0">
    {value ? <p className="mt-2 text-[30px] leading-tight font-medium">{value}</p> : null}
    {caption ? <p className="text-[17px] leading-tight font-medium">{caption}</p> : null}
    {children}
    {footer ? <p className="mt-auto pt-2 text-[13px] leading-snug">{footer}</p> : null}
  </Card>
);

const ScaleBar = ({ fraction, gradient }: { fraction: number; gradient: string }) => (
  <span
    className="relative mt-3 block h-1 rounded-full"
    style={{ backgroundImage: gradient }}
    aria-hidden="true"
  >
    <span
      className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/30"
      style={{ left: `${clampPercent(fraction * 100)}%` }}
    />
  </span>
);

const SunEventGlyph = ({ event }: { event: SunEvent }) => {
  const arrow = event === "Sunrise" ? "M12 3v5M9.5 5.5 12 3l2.5 2.5" : "M12 3v5M9.5 5.5 12 8l2.5-2.5";
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-[22px] fill-none stroke-current stroke-[1.7] text-[#ffd60a] [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <path d="M3 18h18M7 18a5 5 0 0 1 10 0" />
      <path d={arrow} />
    </svg>
  );
};

const HourColumn = ({ item }: { item: HourItem }) => {
  if (item.kind === "sun") {
    return (
      <li className="flex w-[54px] shrink-0 flex-col items-center gap-2 text-[15px] font-medium">
        <span>{item.label}</span>
        <span className="flex h-[42px] items-center">
          <SunEventGlyph event={item.event} />
        </span>
        <span className="text-[13px]">{item.event}</span>
      </li>
    );
  }
  const showChance =
    item.precipitationChance !== null && item.precipitationChance >= PRECIPITATION_THRESHOLD;
  return (
    <li className="flex w-[54px] shrink-0 flex-col items-center gap-2 text-[15px] font-medium">
      <span className="data-[now=true]:font-semibold" data-now={item.label === "Now"}>
        {item.label}
      </span>
      <span className="flex h-[42px] flex-col items-center justify-center gap-1">
        <span className="flex scale-125">
          <WeatherGlyph code={item.code} isDay={item.isDay} />
        </span>
        {showChance ? (
          <span className="text-[11px] font-semibold text-[#7fd0ff]">{item.precipitationChance}%</span>
        ) : null}
      </span>
      <span>{formatDegrees(item.temperature)}</span>
    </li>
  );
};

const HourlyCard = ({ forecast }: { forecast: Forecast }) => (
  <Card title="Hourly Forecast" icon="clock" className="col-span-full">
    <p className="mt-2 border-b border-white/15 pb-3 text-[14px] leading-snug">
      {describeHourly(forecast)}
    </p>
    <ol
      data-scroll-x
      aria-label="Next 24 hours"
      className="-mx-3 flex gap-1 overflow-x-auto px-3 pt-3 [scrollbar-width:none]"
    >
      {forecast.hours.map((item) => (
        <HourColumn key={`${item.kind}-${item.time}`} item={item} />
      ))}
    </ol>
  </Card>
);

const RangeBar = ({
  low,
  high,
  min,
  max,
  current,
}: {
  low: number;
  high: number;
  min: number;
  max: number;
  current: number | null;
}) => {
  const span = Math.max(max - min, 1);
  const left = ((low - min) / span) * 100;
  const width = Math.max(((high - low) / span) * 100, 4);
  const gradient = `linear-gradient(90deg, ${readTemperatureColor(low)}, ${readTemperatureColor(high)})`;
  return (
    <span className="relative h-1 min-w-12 flex-1 rounded-full bg-black/25" aria-hidden="true">
      <span
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${left}%`, width: `${width}%`, backgroundImage: gradient }}
      />
      {current !== null ? (
        <span
          className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-black/30"
          style={{ left: `${clampPercent(((current - min) / span) * 100)}%` }}
        />
      ) : null}
    </span>
  );
};

const DailyCard = ({ forecast }: { forecast: Forecast }) => {
  const min = Math.min(...forecast.days.map((day) => day.low));
  const max = Math.max(...forecast.days.map((day) => day.high));
  return (
    <Card title={`${forecast.days.length}-Day Forecast`} icon="calendar" className="col-span-full">
      <ol className="mt-1">
        {forecast.days.map((day) => {
          const showChance =
            day.precipitationChance !== null && day.precipitationChance >= PRECIPITATION_THRESHOLD;
          const current =
            day.date === forecast.current.time.slice(0, 10) ? forecast.current.temperature : null;
          const condition = skyLabel(skyFromCode(day.code), true);
          return (
            <li
              key={day.date}
              aria-label={`${day.label}: ${condition}, high ${Math.round(day.high)}, low ${Math.round(day.low)}`}
              className="flex items-center gap-3 border-t border-white/15 py-2.5 text-[17px] font-medium first:border-t-0"
            >
              <span className="w-[52px] shrink-0">{day.label}</span>
              <span className="flex w-8 shrink-0 flex-col items-center gap-1">
                <span className="flex scale-125">
                  <WeatherGlyph code={day.code} isDay />
                </span>
                {showChance ? (
                  <span className="text-[11px] font-semibold text-[#7fd0ff]">{day.precipitationChance}%</span>
                ) : null}
              </span>
              <span className="w-9 shrink-0 text-right text-white/60">{formatDegrees(day.low)}</span>
              <RangeBar low={day.low} high={day.high} min={min} max={max} current={current} />
              <span className="w-9 shrink-0 text-right">{formatDegrees(day.high)}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
};

const SunCurve = ({ sunrise, sunset, now }: { sunrise: number; sunset: number; now: number }) => {
  const noon = (sunrise + sunset) / 2;
  const horizonOffset = Math.cos((Math.PI * (sunset - sunrise)) / DAY_MINUTES);
  const readY = (minute: number) =>
    24 - (Math.cos((2 * Math.PI * (minute - noon)) / DAY_MINUTES) - horizonOffset) * 12;
  const points = Array.from({ length: 49 }, (_, index) => {
    const minute = (index / 48) * DAY_MINUTES;
    return `${(index / 48) * 100},${readY(minute).toFixed(2)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 44" aria-hidden="true" className="mt-2 w-full overflow-visible">
      <line x1="0" x2="100" y1="24" y2="24" className="stroke-white/35" strokeWidth="0.8" />
      <polyline points={points} fill="none" className="stroke-white/70" strokeWidth="1.6" />
      <circle cx={(now / DAY_MINUTES) * 100} cy={readY(now)} r="3.2" className="fill-white" />
    </svg>
  );
};

const todayOf = (forecast: Forecast) =>
  forecast.days.find((day) => day.date === forecast.current.time.slice(0, 10));

const SunTile = ({ forecast }: { forecast: Forecast }) => {
  const today = todayOf(forecast);
  const tomorrow = forecast.days.find((day) => today !== undefined && day.date > today.date);
  if (!today?.sunrise || !today.sunset) {
    return null;
  }
  const sunriseMinute = readMinuteOfDay(today.sunrise);
  const sunsetMinute = readMinuteOfDay(today.sunset);
  const nowMinute = readMinuteOfDay(forecast.current.time);
  if (sunriseMinute === null || sunsetMinute === null || nowMinute === null) {
    return null;
  }
  const time = forecast.current.time;
  const nextSunrise = time < today.sunrise ? today.sunrise : (tomorrow?.sunrise ?? today.sunrise);
  const isDaylight = time >= today.sunrise && time < today.sunset;
  const title = isDaylight ? "Sunset" : "Sunrise";
  const value = isDaylight ? today.sunset : nextSunrise;
  const footer = isDaylight
    ? `Sunrise: ${readClockTime(today.sunrise)}`
    : `Sunset: ${readClockTime(today.sunset)}`;
  return (
    <Tile title={title} icon="sunset" value={readClockTime(value)} footer={footer}>
      <SunCurve sunrise={sunriseMinute} sunset={sunsetMinute} now={nowMinute} />
    </Tile>
  );
};

const WindCompass = ({ speed, direction }: { speed: number; direction: number }) => (
  <svg viewBox="0 0 100 100" aria-hidden="true" className="mx-auto mt-1 w-full max-w-[104px]">
    <circle
      cx="50"
      cy="50"
      r="42"
      fill="none"
      className="stroke-white/35"
      strokeWidth="5"
      strokeDasharray="0.7 3.7"
    />
    {[
      { label: "N", x: 50, y: 17 },
      { label: "E", x: 84, y: 53 },
      { label: "S", x: 50, y: 89 },
      { label: "W", x: 16, y: 53 },
    ].map((point) => (
      <text
        key={point.label}
        x={point.x}
        y={point.y}
        textAnchor="middle"
        className="fill-white/70 text-[9px] font-semibold"
      >
        {point.label}
      </text>
    ))}
    <g transform={`rotate(${direction + 180} 50 50)`}>
      <line x1="50" y1="84" x2="50" y2="18" className="stroke-white" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M44 25 50 14l6 11z" className="fill-white" />
      <circle cx="50" cy="84" r="3.2" className="fill-white" />
    </g>
    <circle cx="50" cy="50" r="17" className="fill-[#1c2a40]/80" />
    <text x="50" y="52" textAnchor="middle" className="fill-white text-[15px] font-semibold">
      {Math.round(speed)}
    </text>
    <text x="50" y="61" textAnchor="middle" className="fill-white/70 text-[7px] font-semibold">
      km/h
    </text>
  </svg>
);

const DetailTiles = ({ forecast }: { forecast: Forecast }) => {
  const { current, days } = forecast;
  const [today, tomorrow] = days;
  const tiles: ReactNode[] = [];

  if (current.uvIndex !== null) {
    const peak = today.uvMax ?? current.uvIndex;
    tiles.push(
      <Tile
        key="uv"
        title="UV Index"
        icon="sun"
        value={String(Math.round(current.uvIndex))}
        caption={readUvLevel(current.uvIndex)}
        footer={`Peak today: ${Math.round(peak)}, ${readUvLevel(peak).toLowerCase()}.`}
      >
        <ScaleBar fraction={current.uvIndex / 11} gradient={UV_GRADIENT} />
      </Tile>,
    );
  }
  tiles.push(<SunTile key="sun" forecast={forecast} />);
  if (current.windSpeed !== null && current.windDirection !== null) {
    const gusts = current.windGusts === null ? "" : ` · Gusts ${Math.round(current.windGusts)} km/h`;
    tiles.push(
      <Tile key="wind" title="Wind" icon="wind" footer={`${readCompassPoint(current.windDirection)}${gusts}`}>
        <WindCompass speed={current.windSpeed} direction={current.windDirection} />
      </Tile>,
    );
  }
  if (today.precipitationSum !== null) {
    const tomorrowSum = tomorrow?.precipitationSum ?? 0;
    const footer =
      tomorrowSum > 0
        ? `${formatMillimeters(tomorrowSum)} expected tomorrow.`
        : "None expected tomorrow.";
    tiles.push(
      <Tile
        key="precipitation"
        title="Precipitation"
        icon="drop"
        value={formatMillimeters(today.precipitationSum)}
        caption="Today"
        footer={footer}
      />,
    );
  }
  if (current.feelsLike !== null) {
    tiles.push(
      <Tile
        key="feels-like"
        title="Feels Like"
        icon="thermometer"
        value={formatDegrees(current.feelsLike)}
        footer={describeFeelsLike(current.temperature, current.feelsLike)}
      />,
    );
  }
  if (current.humidity !== null) {
    const footer =
      current.dewPoint === null
        ? undefined
        : `The dew point is ${formatDegrees(current.dewPoint)} right now.`;
    tiles.push(
      <Tile
        key="humidity"
        title="Humidity"
        icon="humidity"
        value={`${Math.round(current.humidity)}%`}
        footer={footer}
      />,
    );
  }
  if (current.visibility !== null) {
    const kilometers = current.visibility / 1000;
    tiles.push(
      <Tile
        key="visibility"
        title="Visibility"
        icon="eye"
        value={`${Math.round(kilometers)} km`}
        footer={describeVisibility(kilometers)}
      />,
    );
  }
  if (current.pressure !== null) {
    const fraction =
      (current.pressure - PRESSURE_RANGE.min) / (PRESSURE_RANGE.max - PRESSURE_RANGE.min);
    tiles.push(
      <Tile
        key="pressure"
        title="Pressure"
        icon="gauge"
        value={String(Math.round(current.pressure))}
        caption="hPa"
      >
        <ScaleBar fraction={fraction} gradient={PRESSURE_GRADIENT} />
        <span className="mt-1.5 flex justify-between text-[11px] font-medium text-white/60">
          <span>Low</span>
          <span>High</span>
        </span>
      </Tile>,
    );
  }

  return <>{tiles}</>;
};

const readEmptyState = (status: WeatherStatus) => {
  if (status === "offline") {
    return {
      title: "No Internet Connection",
      message: "Turn Wi-Fi on in Control Center to update the forecast.",
    };
  }
  if (status === "error") {
    return {
      title: "Weather Unavailable",
      message: "The forecast couldn't be loaded. Try again in a moment.",
    };
  }
  return { title: "Loading Forecast…", message: "" };
};

const EmptyState = ({ status }: { status: WeatherStatus }) => {
  const { title, message } = readEmptyState(status);
  return (
    <div
      role="status"
      className="col-span-full flex flex-col items-center gap-2 rounded-2xl bg-black/15 px-6 py-8 text-center backdrop-blur-md"
    >
      <p className="text-[17px] font-semibold">{title}</p>
      {message ? <p className="max-w-[320px] text-[14px] text-white/75">{message}</p> : null}
    </div>
  );
};

const LocationHero = ({ entry }: { entry: LocationEntry }) => {
  const forecast = entry.forecast;
  const today = forecast ? todayOf(forecast) : undefined;
  const condition = forecast ? readCondition(forecast) : "";
  return (
    <header className="col-span-full flex flex-col items-center pt-6 pb-8 text-center [text-shadow:0_1px_3px_rgba(0,0,0,0.25)]">
      <h2 className="text-[34px] leading-tight font-normal">{entry.title}</h2>
      <p className="pl-[0.28em] text-[96px] leading-none font-thin">
        {formatDegrees(forecast ? forecast.current.temperature : null)}
      </p>
      <p className="min-h-7 text-[20px] font-medium text-white/90">{condition}</p>
      {today ? (
        <p className="text-[20px] font-medium">
          H:{formatDegrees(today.high)} L:{formatDegrees(today.low)}
        </p>
      ) : null}
    </header>
  );
};

const LocationRow = ({
  entry,
  isSelected,
  onSelect,
}: {
  entry: LocationEntry;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const forecast = entry.forecast;
  const today = forecast ? todayOf(forecast) : undefined;
  const condition = forecast ? readCondition(forecast) : "";
  const temperature = formatDegrees(forecast ? forecast.current.temperature : null);
  const handleClick = () => onSelect(entry.id);
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={isSelected ? "true" : undefined}
      aria-label={`${entry.listTitle}${entry.listSubtitle ? `, ${entry.listSubtitle}` : ""}, ${temperature} ${condition}`}
      data-selected={isSelected}
      className="relative isolate flex h-[108px] w-full overflow-hidden rounded-2xl p-3 text-left [text-shadow:0_1px_2px_rgba(0,0,0,0.3)] ring-white/85 outline-none focus-visible:ring-2 active:scale-[0.985] @2xl:data-[selected=true]:ring-2"
    >
      <WeatherScene scene={readScene(forecast)} className="-z-10" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[19px] leading-tight font-bold">{entry.listTitle}</span>
        <span className="truncate text-[13px] font-medium">{entry.listSubtitle}</span>
        <span className="mt-auto truncate text-[13px] font-medium">{condition}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <span className="text-[42px] leading-none font-light">{temperature}</span>
        {today ? (
          <span className="mt-auto text-[13px] font-medium">
            H:{formatDegrees(today.high)} L:{formatDegrees(today.low)}
          </span>
        ) : null}
      </span>
    </button>
  );
};

const ListIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="size-6 fill-none stroke-current stroke-[1.8] [stroke-linecap:round]"
  >
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="0.6" className="fill-current" />
    <circle cx="4.5" cy="12" r="0.6" className="fill-current" />
    <circle cx="4.5" cy="18" r="0.6" className="fill-current" />
  </svg>
);

const PageDots = ({
  entries,
  selectedId,
  onSelect,
}: {
  entries: LocationEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
}) => (
  <div className={`flex h-9 items-center gap-1 px-2.5 ${GLASS_PILL_CLASS}`} aria-label="Locations">
    {entries.map((entry) => {
      const handleClick = () => onSelect(entry.id);
      return (
        <button
          key={entry.id}
          type="button"
          onClick={handleClick}
          aria-label={`Show ${entry.listTitle}`}
          aria-current={entry.id === selectedId ? "true" : undefined}
          data-selected={entry.id === selectedId}
          className="flex size-4 items-center justify-center rounded-full text-white/40 focus-visible:outline-2 focus-visible:outline-white data-[selected=true]:text-white"
        >
          <span className="size-[7px] rounded-full bg-current" />
        </button>
      );
    })}
  </div>
);

type WeatherAppProps = {
  isOffline: boolean;
};

const WeatherApp = ({ isOffline }: WeatherAppProps) => {
  const now = useNow();
  const { forecasts, status } = useForecasts(SAVED_PLACES, isOffline);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [isListOpen, setIsListOpen] = useState(false);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const entries = buildEntries(forecasts, now);
  const selectedIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.id === (chosenId ?? FALLBACK_PLACE_ID)),
  );
  const selectedEntry = entries[selectedIndex];

  const handleSelect = (id: string) => {
    setChosenId(id);
    setIsListOpen(false);
  };
  const handleOpenList = () => setIsListOpen(true);
  const handleStep = (step: number) => {
    const next = entries[selectedIndex + step];
    if (!next) {
      return;
    }
    setChosenId(next.id);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-scroll-x]")) {
      return;
    }
    if (event.key === "ArrowLeft") {
      handleStep(-1);
    }
    if (event.key === "ArrowRight") {
      handleStep(1);
    }
  };
  const handleSwipeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.pointerType !== "touch" || target.closest("[data-scroll-x]")) {
      swipeRef.current = null;
      return;
    }
    swipeRef.current = { x: event.clientX, y: event.clientY };
  };
  const handleSwipeEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) {
      return;
    }
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
      return;
    }
    handleStep(deltaX < 0 ? 1 : -1);
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="weather-app @container relative isolate flex h-full min-h-0 w-full overflow-hidden bg-[#16263d] text-white select-none [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',sans-serif]"
    >
      <WeatherScene scene={readScene(selectedEntry.forecast)} className="-z-10" />
      <nav
        aria-label="Weather locations"
        data-open={isListOpen}
        className="hidden min-h-0 w-full shrink-0 flex-col bg-[#0a1226]/55 pt-[var(--wx-safe-top,0px)] pb-[var(--safe-area-bottom,0px)] backdrop-blur-2xl backdrop-saturate-150 data-[open=true]:flex @2xl:flex @2xl:w-[300px] @2xl:border-r @2xl:border-white/10 @2xl:bg-[#0a1226]/35"
      >
        <h2 className="px-4 pt-3 pb-3 text-[34px] leading-tight font-bold @2xl:sr-only">Weather</h2>
        <ul className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-3 pt-0 pb-6 @2xl:pt-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <LocationRow
                entry={entry}
                isSelected={entry.id === selectedEntry.id}
                onSelect={handleSelect}
              />
            </li>
          ))}
        </ul>
      </nav>

      <section
        aria-label={`${selectedEntry.title} weather`}
        data-list-open={isListOpen}
        className="relative flex min-w-0 flex-1 flex-col pt-[var(--wx-safe-top,0px)] data-[list-open=true]:hidden @2xl:flex"
      >
        <div
          onPointerDown={handleSwipeStart}
          onPointerUp={handleSwipeEnd}
          onPointerCancel={handleSwipeEnd}
          className="@container min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-4 pb-[calc(var(--safe-area-bottom,0px)+6rem)] @2xl:px-6 @2xl:pb-10"
        >
          <div
            key={selectedEntry.id}
            className="mx-auto grid w-full max-w-[680px] animate-[wx-in_0.35s_ease] grid-cols-2 gap-3 @lg:grid-cols-4"
          >
            <LocationHero entry={selectedEntry} />
            {selectedEntry.forecast ? (
              <>
                <HourlyCard forecast={selectedEntry.forecast} />
                <DailyCard forecast={selectedEntry.forecast} />
                <DetailTiles forecast={selectedEntry.forecast} />
              </>
            ) : (
              <EmptyState status={status} />
            )}
            <p className="col-span-full py-4 text-center text-[12px] text-white/70">
              Weather data by{" "}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                Open-Meteo
              </a>
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--safe-area-bottom,0px)+0.75rem)] grid grid-cols-[1fr_auto_1fr] items-center px-4 @2xl:hidden">
          <span aria-hidden="true" />
          <PageDots entries={entries} selectedId={selectedEntry.id} onSelect={handleSelect} />
          <button
            type="button"
            onClick={handleOpenList}
            aria-label="Show all locations"
            className={`flex size-11 items-center justify-center justify-self-end focus-visible:outline-2 focus-visible:outline-white active:scale-95 ${GLASS_PILL_CLASS}`}
          >
            <ListIcon />
          </button>
        </div>
      </section>
    </div>
  );
};

export default WeatherApp;
