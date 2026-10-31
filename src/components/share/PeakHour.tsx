"use client";

import { forwardRef, useMemo } from "react";
import { Trans } from "react-i18next";
import { palette } from "~/utils/palette";
import ShareCardFrame, { Eyebrow, Headline, rng } from "./ShareCardFrame";
import { useShareFormat } from "./format";
import type { ShareData } from "./types";

const { slate, yellow } = palette;

/** The busiest hour, `null` without a message in the range. */
export function peakHour(data: ShareData) {
  const max = Math.max(...data.byHour);
  return max > 0 ? data.byHour.indexOf(max) : null;
}

// Each headline covers a part of the day: [first hour, hour after the last].
const PERIODS = [
  { key: "nightOwl", from: 21, to: 4 },
  { key: "earlyBird", from: 4, to: 10 },
  { key: "daylight", from: 10, to: 17 },
  { key: "evening", from: 17, to: 21 },
] as const;

function inPeriod(hour: number, { from, to }: { from: number; to: number }) {
  return from < to ? hour >= from && hour < to : hour >= from || hour < to;
}

const CX = 452;
const R0 = 252;
const R1 = 446;

function polar(hour: number, radius: number) {
  const angle = ((hour / 24) * 360 - 90) * (Math.PI / 180);
  return [CX + Math.cos(angle) * radius, CX + Math.sin(angle) * radius];
}

export default forwardRef<HTMLDivElement, { data: ShareData }>(
  function PeakHour({ data }, ref) {
    const format = useShareFormat();
    const { t } = format;
    const peak = peakHour(data) ?? 0;
    const max = Math.max(1, ...data.byHour);
    const total = data.byHour.reduce((sum, count) => sum + count, 0);
    const period = PERIODS.find((p) => inPeriod(peak, p))!;
    const periodCount = data.byHour.reduce(
      (sum, count, hour) => (inPeriod(hour, period) ? sum + count : sum),
      0,
    );

    const stars = useMemo(() => {
      const random = rng(data.seed ^ 5);
      return Array.from({ length: 70 }, () => ({
        cx: (random() * 1080).toFixed(0),
        cy: (random() * 1300).toFixed(0),
        r: (1 + random() * 2.6).toFixed(1),
        opacity: (0.15 + random() * 0.5).toFixed(2),
      }));
    }, [data.seed]);

    return (
      <ShareCardFrame
        ref={ref}
        rangeLabel={t(`share.range.${data.range.id}` as const)}
        background={`radial-gradient(80% 45% at 50% 30%, rgba(12,74,110,0.9) 0%, rgba(2,6,23,0) 75%), ${slate[950]}`}
        texture={
          <div className="pointer-events-none absolute inset-0">
            <svg viewBox="0 0 1080 1920" width="1080" height="1920">
              {stars.map((star, i) => (
                <circle
                  key={i}
                  cx={star.cx}
                  cy={star.cy}
                  r={star.r}
                  fill="#fff"
                  fillOpacity={star.opacity}
                />
              ))}
            </svg>
          </div>
        }
      >
        <Eyebrow className="text-yellow-300">
          {t("share.peakHour.eyebrow")}
        </Eyebrow>
        <div className="relative mt-[44px] size-[904px] shrink-0">
          <svg viewBox="0 0 904 904" width="904" height="904">
            <circle
              cx={CX}
              cy={CX}
              r={R0}
              fill="rgba(2,6,23,0.55)"
              stroke="rgba(148,163,184,0.25)"
              strokeWidth="3"
            />
            {data.byHour.map((count, hour) => {
              const [x1, y1] = polar(hour, R0 + 22);
              const [x2, y2] = polar(
                hour,
                R0 + 26 + (count / max) * (R1 - R0 - 40),
              );
              return (
                <line
                  key={hour}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    hour === peak ? yellow[300] : "rgba(148,163,184,0.42)"
                  }
                  strokeWidth="22"
                  strokeLinecap="round"
                />
              );
            })}
            {[0, 6, 12, 18].map((hour) => {
              const [x, y] = polar(hour, R0 - 46);
              return (
                <text
                  key={hour}
                  x={x}
                  y={y + 10}
                  textAnchor="middle"
                  fontSize="28"
                  fontWeight="700"
                  fill={slate[500]}
                >
                  {format.hour(hour)}
                </text>
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[112px] leading-none font-black tracking-[-0.04em] whitespace-nowrap text-yellow-300">
              {format.hour(peak)}
            </div>
            <div className="mt-[12px] text-[34px] font-semibold text-gray-400">
              {t("share.peakHour.caption")}
            </div>
          </div>
        </div>
        <Headline className="mt-[44px] text-[104px]">
          {t(`share.peakHour.${period.key}` as const)}
        </Headline>
        <div className="mt-[36px] text-[46px] leading-[1.25] font-medium tracking-[-0.005em] text-gray-300">
          <Trans
            i18nKey="share.peakHour.share"
            values={{
              share: format.percent(total ? periodCount / total : 0),
              from: format.hour(period.from),
              to: format.hour(period.to),
            }}
            components={{ b: <b className="font-extrabold text-white" /> }}
          />
        </div>
      </ShareCardFrame>
    );
  },
);
