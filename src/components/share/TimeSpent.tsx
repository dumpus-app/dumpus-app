"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { Trans } from "react-i18next";
import { palette } from "~/utils/palette";
import ShareCardFrame, { Eyebrow, Facets, Fit, Tile } from "./ShareCardFrame";
import { useShareFormat } from "./format";
import type { ShareData } from "./types";

const { yellow } = palette;

/** At least an hour on Discord, in a package that has sessions. */
export function hasTime(data: ShareData) {
  return (data.time?.minutes ?? 0) >= 60;
}

export default forwardRef<HTMLDivElement, { data: ShareData }>(
  function TimeSpent({ data }, ref) {
    const format = useShareFormat();
    const { t } = format;
    const time = data.time ?? {
      minutes: null,
      appOpens: null,
      voiceMinutes: null,
      avgSessionMinutes: null,
    };
    const hours = Math.round((time.minutes ?? 0) / 60);
    const days = Math.floor(hours / 24);

    // A 0 isn't worth sharing: those tiles are left out.
    const tiles = [
      (time.appOpens ?? 0) > 0 && {
        key: "appOpens",
        value: format.number(time.appOpens!),
        label: t("share.time.appOpens", { count: time.appOpens! }),
        valueClassName: "text-yellow-300",
        className: "bg-[rgba(2,6,23,0.9)] text-white",
      },
      (time.voiceMinutes ?? 0) >= 1 && {
        key: "voice",
        value: format.duration(time.voiceMinutes!),
        label: t("share.time.voice"),
        className: "bg-[rgba(255,255,255,0.55)]",
      },
    ].filter((tile) => tile !== false);

    return (
      <ShareCardFrame
        ref={ref}
        light
        rangeLabel={t(`share.range.${data.range.id}` as const)}
        background={`linear-gradient(170deg, ${yellow[200]} 0%, ${yellow[300]} 45%, ${yellow[400]} 100%)`}
        texture={
          <Facets seed={data.seed ^ 23} color="#020617" max={0.07} fade="up" />
        }
      >
        <Eyebrow>{t("share.time.eyebrow")}</Eyebrow>
        <Fit
          text={format.number(hours)}
          max={330}
          min={80}
          className="mt-[120px] leading-[0.82] font-black tracking-[-0.05em]"
        />
        <div className="mt-[6px] text-[130px] leading-none font-black tracking-[-0.04em]">
          {t("share.time.unit", { count: hours })}
        </div>
        {days >= 1 && (
          <div className="mt-[44px] text-[50px] leading-[1.25] font-semibold tracking-[-0.005em]">
            <Trans
              i18nKey="share.time.days"
              count={days}
              values={{ value: format.number(days) }}
              components={{ b: <b className="font-extrabold" /> }}
            />
          </div>
        )}
        <div className="mt-[96px] grid grid-cols-2 gap-[28px]">
          {tiles.map(({ key, className, ...tile }) => (
            <Tile
              key={key}
              {...tile}
              className={clsx(
                "h-[300px]",
                tiles.length === 1 && "col-span-2",
                className,
              )}
            />
          ))}
          {(time.avgSessionMinutes ?? 0) >= 1 && (
            <div className="col-span-2 flex h-[220px] items-center justify-between rounded-[44px] bg-[rgba(255,255,255,0.55)] px-[44px] py-[40px]">
              <div className="text-[44px] leading-[1.15] font-semibold opacity-85">
                {t("share.time.avgSession")}
              </div>
              <div className="text-[92px] leading-[0.95] font-black tracking-[-0.04em] whitespace-nowrap">
                {format.duration(time.avgSessionMinutes!)}
              </div>
            </div>
          )}
        </div>
      </ShareCardFrame>
    );
  },
);
