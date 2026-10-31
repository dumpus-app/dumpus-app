"use client";

import { forwardRef } from "react";
import { Trans } from "react-i18next";
import { palette } from "~/utils/palette";
import ShareCardFrame, { Eyebrow, Facets, Fit } from "./ShareCardFrame";
import { useShareFormat } from "./format";
import type { ShareData } from "./types";

const { slate } = palette;

export function hasMessages(data: ShareData) {
  return (data.messages.total ?? 0) > 0;
}

export default forwardRef<HTMLDivElement, { data: ShareData }>(
  function Messages({ data }, ref) {
    const format = useShareFormat();
    const { t } = format;
    const { messages, range } = data;
    const total = messages.total ?? 0;

    const counts = messages.series.map(({ count }) => count);
    const max = Math.max(0, ...counts);
    const peak = max > 0 ? counts.indexOf(max) : -1;
    const axis: Intl.DateTimeFormatOptions =
      messages.bucket === "day"
        ? { month: "short", day: "numeric" }
        : { month: "short", year: "numeric" };
    const busiest =
      peak === -1
        ? null
        : messages.bucket === "month"
          ? format.day(messages.series[peak].start, {
              month: "long",
              year: "numeric",
            })
          : messages.bucket === "week"
            ? t("share.messages.weekOf", {
                date: format.day(messages.series[peak].start, {
                  month: "short",
                  day: "numeric",
                }),
              })
            : format.day(messages.series[peak].start, {
                month: "long",
                day: "numeric",
              });
    const since = format.day(
      range.start,
      range.id === "lifetime"
        ? { year: "numeric" }
        : range.id === "4weeks"
          ? { month: "long", day: "numeric" }
          : { month: "long", year: "numeric" },
    );

    return (
      <ShareCardFrame
        ref={ref}
        rangeLabel={t(`share.range.${range.id}` as const)}
        background={`radial-gradient(90% 55% at 20% 32%, rgba(14,165,233,0.55) 0%, rgba(2,6,23,0) 70%), ${slate[950]}`}
        texture={
          <Facets seed={data.seed ^ 7} color="#38bdf8" max={0.1} fade="up" />
        }
      >
        <Eyebrow className="text-brand-300">
          {t("share.messages.eyebrow")}
        </Eyebrow>
        <Fit
          text={format.number(total)}
          max={300}
          min={80}
          className="mt-[120px] leading-[0.82] font-black tracking-[-0.05em] text-white"
        />
        <div className="mt-[10px] text-[120px] font-black tracking-[-0.035em] text-brand-300">
          {t("share.messages.unit", { count: total })}
        </div>
        {messages.perDay !== null && (
          <div className="mt-[56px] max-w-[880px] text-[50px] leading-[1.25] font-medium tracking-[-0.005em] text-gray-300">
            <Trans
              i18nKey="share.messages.perDay"
              values={{ value: format.number(messages.perDay), since }}
              components={{ b: <b className="font-extrabold text-white" /> }}
            />
          </div>
        )}
        {peak !== -1 && (
          <>
            <div
              className="mt-[110px] flex h-[330px] items-end"
              style={{ gap: counts.length > 100 ? 2 : 4 }}
            >
              {counts.map((count, i) => (
                <div
                  key={i}
                  className="min-w-0 flex-1 rounded-[6px_6px_2px_2px]"
                  style={{
                    height: `${Math.max(3, (count / max) * 100)}%`,
                    background:
                      i === peak ? palette.sky[300] : "rgba(56,189,248,0.32)",
                  }}
                />
              ))}
            </div>
            <div className="mt-[22px] flex justify-between gap-[24px] text-[34px] font-semibold whitespace-nowrap text-gray-400">
              <span>{format.day(messages.series[0].start, axis)}</span>
              <span className="text-brand-300">
                {t("share.messages.busiest", { period: busiest })}
              </span>
              <span>{format.day(range.end, axis)}</span>
            </div>
          </>
        )}
      </ShareCardFrame>
    );
  },
);
