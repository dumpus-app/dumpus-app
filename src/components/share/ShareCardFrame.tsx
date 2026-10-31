"use client";

import clsx from "clsx";
import { forwardRef, useMemo, useState } from "react";
import { palette } from "~/utils/palette";
import useFitText from "./use-fit-text";

export const STORY = { width: 1080, height: 1920 };
export const SQUARE = { width: 1080, height: 1080 };

/** Shown in place of an avatar Discord's CDN doesn't serve. */
export const FALLBACK_AVATAR = "/assets/share/avatar.png";

/** Seeded PRNG (mulberry32), so a texture comes out the same every time. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The logo's triangles as a texture: a triangular lattice where some
 * triangles are lit, fading out towards the bottom (`down`) or the top (`up`).
 */
export function Facets({
  seed,
  color = "#fff",
  max = 0.12,
  fade = "down",
  height = STORY.height,
}: {
  seed: number;
  color?: string;
  max?: number;
  fade?: "down" | "up";
  height?: number;
}) {
  const polygons = useMemo(() => {
    const random = rng(seed);
    const size = 180;
    const h = (size * Math.sqrt(3)) / 2;
    const result: { points: string; opacity: string }[] = [];
    for (let row = -1; row * h < height + h; row++) {
      for (let col = -1; col * size < STORY.width + size; col++) {
        const x = col * size + (row % 2 ? size / 2 : 0);
        const y = row * h;
        const t = fade === "down" ? 1 - y / height : y / height;
        for (const up of [true, false]) {
          if (random() > 0.55) continue;
          const opacity = (random() * max * Math.max(0, t)).toFixed(3);
          if (Number(opacity) < 0.006) continue;
          result.push({
            points: up
              ? `${x},${y + h} ${x + size / 2},${y} ${x + size},${y + h}`
              : `${x + size / 2},${y} ${x + size * 1.5},${y} ${x + size},${y + h}`,
            opacity,
          });
        }
      }
    }
    return result;
  }, [seed, max, fade, height]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        viewBox={`0 0 ${STORY.width} ${height}`}
        preserveAspectRatio="none"
        className="block size-full"
      >
        {polygons.map(({ points, opacity }) => (
          <polygon
            key={points}
            points={points}
            fill={color}
            fillOpacity={opacity}
          />
        ))}
      </svg>
    </div>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-[20px] text-[40px] font-bold tracking-[0.14em] uppercase",
        className,
      )}
    >
      <span className="h-[8px] w-[56px] shrink-0 rounded-[4px] bg-current" />
      {children}
    </div>
  );
}

export function Fit({
  text,
  max,
  min = Math.round(max / 2),
  className,
}: {
  text: string;
  max: number;
  min?: number;
  className?: string;
}) {
  const ref = useFitText<HTMLDivElement>(text, { max, min });
  return (
    <div ref={ref} className={clsx("whitespace-nowrap", className)}>
      {text}
    </div>
  );
}

/**
 * `className` replaces the default margin and size: two Tailwind classes for
 * one property don't override each other in the order they're written.
 */
export function Headline({
  children,
  className = "mt-[36px] text-[112px]",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "leading-[0.95] font-black tracking-[-0.03em]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Row({
  rank,
  image,
  name,
  count,
  rankClassName,
  countClassName,
}: {
  rank: number;
  image: React.ReactNode;
  name: string;
  count: string;
  rankClassName: string;
  countClassName: string;
}) {
  return (
    <div className="flex h-[116px] items-center gap-[30px]">
      <div
        className={clsx(
          "w-[64px] shrink-0 text-center text-[60px] font-black tracking-[-0.04em]",
          rankClassName,
        )}
      >
        {rank}
      </div>
      {image}
      <div className="min-w-0 flex-1 truncate text-[56px] font-bold tracking-[-0.015em]">
        {name}
      </div>
      <div
        className={clsx(
          "text-[46px] font-bold tracking-[-0.01em]",
          countClassName,
        )}
      >
        {count}
      </div>
    </div>
  );
}

/** The value shrinks from `valueSize` to fit its tile. */
export function Tile({
  value,
  label,
  className,
  valueSize = 92,
  valueClassName,
  labelClassName = "mt-[14px] text-[38px]",
  style,
}: {
  value: string;
  label: React.ReactNode;
  className?: string;
  valueSize?: number;
  valueClassName?: string;
  labelClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={clsx(
        "flex min-w-0 flex-col justify-end rounded-[44px] px-[44px] py-[40px]",
        className,
      )}
      style={style}
    >
      <Fit
        text={value}
        max={valueSize}
        className={clsx(
          "leading-[0.95] font-black tracking-[-0.04em]",
          valueClassName,
        )}
      />
      <div
        className={clsx(
          "leading-[1.15] font-semibold opacity-85",
          labelClassName,
        )}
      >
        {label}
      </div>
    </div>
  );
}

/** An avatar or icon that falls back to `fallback` when it doesn't load. */
export function CardImage({
  src,
  alt,
  size,
  className,
  style,
  fallback = FALLBACK_AVATAR,
}: {
  src: string;
  alt: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
  fallback?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);

  return (
    // The card is drawn from the DOM, which `next/image` would only wrap.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed === src ? fallback : src}
      alt={alt}
      width={size}
      height={size}
      // Drawing the card reads the image's pixels, which needs CORS.
      crossOrigin="anonymous"
      draggable={false}
      onError={() => setFailed(src)}
      className={clsx("block shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size, ...style }}
    />
  );
}

const ICON_GRADIENTS = [
  [palette.pink[400], palette.violet[600]],
  [palette.sky[400], palette.blue[700]],
  [palette.emerald[400], palette.teal[700]],
  [palette.amber[400], palette.orange[600]],
  [palette.violet[400], palette.indigo[700]],
  [palette.rose[400], palette.rose[700]],
  [palette.cyan[400], palette.cyan[700]],
  [palette.lime[400], palette.green[700]],
];

function initials(name: string) {
  const segmenter =
    typeof Intl.Segmenter === "function"
      ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
      : null;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) =>
      segmenter
        ? (segmenter.segment(word)[Symbol.iterator]().next().value?.segment ??
          "")
        : [...word][0],
    )
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** A server's icon, or its initials when Dumpus can't get the icon. */
export function ServerIcon({
  server,
  size,
}: {
  server: { id: string; name: string; icon: string | null };
  size: number;
}) {
  const [failed, setFailed] = useState<string | null>(null);

  if (server.icon && failed !== server.icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={server.icon}
        alt={server.name}
        width={size}
        height={size}
        crossOrigin="anonymous"
        draggable={false}
        onError={() => setFailed(server.icon)}
        className="block shrink-0 rounded-[30%] object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  let hash = 0;
  for (const char of server.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const [from, to] = ICON_GRADIENTS[hash % ICON_GRADIENTS.length];

  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[30%] font-extrabold tracking-[-0.02em] text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
    >
      {initials(server.name)}
    </div>
  );
}

export default forwardRef<
  HTMLDivElement,
  {
    background: string;
    square?: boolean;
    /** Dark text on a light background. */
    light?: boolean;
    texture?: React.ReactNode;
    rangeLabel: string;
    className?: string;
    children: React.ReactNode;
  }
>(function ShareCardFrame(
  { background, square, light, texture, rangeLabel, className, children },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        "relative flex w-[1080px] shrink-0 flex-col overflow-hidden px-[88px] text-left leading-[normal] tabular-nums antialiased select-none",
        square ? "h-[1080px] pt-[88px]" : "h-[1920px] pt-[236px]",
        light ? "text-gray-950" : "text-white",
      )}
      style={{ background }}
    >
      {texture}
      <div className={clsx("relative flex min-h-0 flex-1 flex-col", className)}>
        {children}
      </div>
      <div
        className={clsx(
          "absolute right-[88px] left-[88px] flex items-center justify-between",
          square ? "bottom-[64px]" : "bottom-[150px]",
        )}
      >
        <div className="flex items-center gap-[22px] text-[42px] font-extrabold tracking-[-0.01em]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo.png"
            alt="Dumpus"
            width={square ? 72 : 84}
            height={square ? 72 : 84}
            draggable={false}
            className={clsx(
              "block shadow-[0_0_0_3px_rgba(255,255,255,0.14)]",
              square
                ? "size-[72px] rounded-[18px]"
                : "size-[84px] rounded-[22px]",
            )}
          />
          dumpus.app
        </div>
        <div
          className={clsx(
            "rounded-full px-[30px] py-[14px] text-[34px] font-bold tracking-[0.01em]",
            light ? "bg-[rgba(2,6,23,0.12)]" : "bg-[rgba(255,255,255,0.14)]",
          )}
        >
          {rangeLabel}
        </div>
      </div>
    </div>
  );
});
