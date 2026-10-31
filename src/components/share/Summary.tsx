"use client";

import clsx from "clsx";
import { forwardRef } from "react";
import { palette } from "~/utils/palette";
import { hasTime } from "./TimeSpent";
import { peakHour } from "./PeakHour";
import ShareCardFrame, {
  CardImage,
  Facets,
  Fit,
  ServerIcon,
  SQUARE,
  Tile,
} from "./ShareCardFrame";
import { useShareFormat, type ShareFormat } from "./format";
import type { ShareData } from "./types";
import useFitText from "./use-fit-text";

const { slate } = palette;
const COLORS = [
  "text-brand-300",
  "text-yellow-300",
  "text-danger-300",
  "text-success-300",
];

/**
 * The summary's stats, from what every export has. Hours come second, and
 * a partial package, which has no sessions, shows the next one instead.
 */
function stats(data: ShareData, { t, number, hour }: ShareFormat) {
  const peak = peakHour(data);
  const hours = Math.round((data.time?.minutes ?? 0) / 60);
  return [
    (data.messages.total ?? 0) > 0 && {
      key: "messages",
      value: number(data.messages.total!),
      label: t("share.summary.messages"),
      short: t("share.summary.messagesShort"),
    },
    hasTime(data) && {
      key: "hours",
      value: t("share.units.hours", { value: number(hours) }),
      label: t("share.summary.hours"),
      short: t("share.summary.hours"),
    },
    peak !== null && {
      key: "peakHour",
      value: hour(peak),
      label: t("share.summary.peakHour"),
      short: t("share.summary.peakHour"),
    },
    (data.dmCount ?? 0) > 0 && {
      key: "people",
      value: number(data.dmCount!),
      label: t("share.summary.people"),
      short: t("share.summary.people"),
    },
    (data.serverCount ?? 0) > 0 && {
      key: "servers",
      value: number(data.serverCount!),
      label: t("share.summary.servers"),
      short: t("share.summary.servers"),
    },
  ].filter((stat) => stat !== false);
}

function Header({ data, square }: { data: ShareData; square?: boolean }) {
  const { t } = useShareFormat();
  const nameRef = useFitText<HTMLDivElement>(data.user.displayName, {
    max: square ? 96 : 112,
    min: square ? 56 : 64,
  });

  return (
    <div
      className={clsx(
        "flex items-center",
        square ? "gap-[34px]" : "gap-[40px]",
      )}
    >
      <CardImage
        src={data.user.avatar}
        alt={data.user.displayName}
        size={square ? 150 : 190}
        className={
          square
            ? "shadow-[0_0_0_7px_rgba(255,255,255,0.92)]"
            : "shadow-[0_0_0_8px_rgba(255,255,255,0.92)]"
        }
      />
      <div className="min-w-0 flex-1">
        <div
          className={clsx(
            "font-bold tracking-[0.12em] text-brand-300 uppercase",
            square ? "text-[32px]" : "text-[40px]",
          )}
        >
          {t("share.summary.eyebrow", {
            range: t(`share.range.${data.range.id}` as const),
          })}
        </div>
        <div
          ref={nameRef}
          className={clsx(
            "truncate leading-none font-black tracking-[-0.04em]",
            square ? "mt-[6px]" : "mt-[10px]",
          )}
        >
          {data.user.displayName}
        </div>
      </div>
    </div>
  );
}

function TopLists({ data, square }: { data: ShareData; square?: boolean }) {
  const { t } = useShareFormat();
  const columns = [
    {
      key: "topDMs",
      title: t("share.summary.topDMs"),
      color: "text-brand-300",
      rows: data.topDMs.slice(0, 3).map((person) => ({
        id: person.id,
        name: person.name,
        image: (
          <CardImage
            src={person.avatar}
            alt={person.name}
            size={square ? 64 : 88}
          />
        ),
      })),
    },
    {
      key: "topServers",
      title: t("share.summary.topServers"),
      color: "text-success-300",
      rows: data.topServers.slice(0, 3).map((server) => ({
        id: server.id,
        name: server.name,
        image: <ServerIcon server={server} size={square ? 64 : 88} />,
      })),
    },
  ].filter((column) => column.rows.length > 0);

  return (
    <div
      className={clsx(
        "flex",
        square ? "mt-[64px] gap-[40px]" : "mt-[84px] gap-[36px]",
      )}
    >
      {columns.map((column) => (
        <div key={column.key} className="min-w-0 flex-1">
          <div
            className={clsx(
              "font-bold tracking-[0.12em] text-gray-400 uppercase",
              square ? "text-[30px]" : "text-[36px]",
            )}
          >
            {column.title}
          </div>
          {column.rows.map((row, i) => (
            <div
              key={row.id}
              className={clsx(
                "flex items-center",
                square ? "mt-[22px] gap-[20px]" : "mt-[26px] gap-[22px]",
              )}
            >
              <span
                className={clsx(
                  "shrink-0 font-black",
                  square ? "w-[30px] text-[34px]" : "w-[34px] text-[44px]",
                  column.color,
                )}
              >
                {i + 1}
              </span>
              {row.image}
              {square ? (
                <span className="min-w-0 flex-1 truncate text-[38px] font-bold">
                  {row.name}
                </span>
              ) : /\s/.test(row.name.trim()) ? (
                <span className="line-clamp-2 min-w-0 flex-1 text-[40px] leading-[1.08] font-bold wrap-anywhere">
                  {row.name}
                </span>
              ) : (
                // A one-word name would break mid-word: it shrinks instead,
                // then ends in an ellipsis.
                <Fit
                  text={row.name}
                  max={40}
                  min={28}
                  className="min-w-0 flex-1 truncate leading-[1.08] font-bold"
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const Summary = forwardRef<HTMLDivElement, { data: ShareData }>(
  function Summary({ data }, ref) {
    const format = useShareFormat();
    const { t } = format;

    return (
      <ShareCardFrame
        ref={ref}
        rangeLabel={t(`share.range.${data.range.id}` as const)}
        background={`radial-gradient(100% 40% at 50% 0%, rgba(14,165,233,0.45) 0%, rgba(2,6,23,0) 80%), ${slate[950]}`}
        texture={<Facets seed={data.seed ^ 31} color="#38bdf8" max={0.12} />}
      >
        <Header data={data} />
        <div className="mt-[72px] grid grid-cols-2 gap-[28px]">
          {stats(data, format)
            .slice(0, 4)
            .map((stat, i) => (
              <Tile
                key={stat.key}
                value={stat.value}
                label={stat.label}
                valueSize={84}
                valueClassName={COLORS[i]}
                labelClassName="mt-[14px] text-[36px]"
                className="h-[236px] bg-[rgba(255,255,255,0.07)]"
              />
            ))}
        </div>
        <TopLists data={data} />
      </ShareCardFrame>
    );
  },
);

export const SummarySquare = forwardRef<HTMLDivElement, { data: ShareData }>(
  function SummarySquare({ data }, ref) {
    const format = useShareFormat();
    const { t } = format;

    return (
      <ShareCardFrame
        ref={ref}
        square
        rangeLabel={t(`share.range.${data.range.id}` as const)}
        background={`radial-gradient(90% 60% at 100% 0%, rgba(14,165,233,0.5) 0%, rgba(2,6,23,0) 70%), ${slate[950]}`}
        texture={
          <Facets
            seed={data.seed ^ 37}
            color="#38bdf8"
            max={0.12}
            height={SQUARE.height}
          />
        }
      >
        <Header data={data} square />
        <div className="mt-[64px] flex gap-[36px]">
          {stats(data, format)
            .slice(0, 3)
            .map((stat, i) => (
              <div key={stat.key} className="min-w-0 flex-1">
                <Fit
                  text={stat.value}
                  max={60}
                  className={clsx(
                    "leading-none font-black tracking-[-0.04em]",
                    COLORS[i],
                  )}
                />
                <div className="mt-[10px] text-[30px] font-semibold text-gray-300">
                  {stat.short}
                </div>
              </div>
            ))}
        </div>
        <TopLists data={data} square />
      </ShareCardFrame>
    );
  },
);
