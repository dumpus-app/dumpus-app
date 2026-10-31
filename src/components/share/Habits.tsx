"use client";

import { forwardRef } from "react";
import { palette } from "~/utils/palette";
import ShareCardFrame, {
  Eyebrow,
  Facets,
  Headline,
  Tile,
} from "./ShareCardFrame";
import { useShareFormat } from "./format";
import { HABITS, type Habit, type ShareData } from "./types";

const { slate } = palette;
const SHOWN = 6;
const COLORS = [
  "text-brand-300",
  "text-danger-300",
  "text-yellow-300",
  "text-success-300",
];

/**
 * The first six counts worth a tile, and which of the six the full card
 * shows this export doesn't carry. A count is `null` only when the export
 * can't know it (#453); a 0 is known, but a 0 tile isn't worth sharing, so
 * it's left out without being called missing.
 */
export function habits(data: ShareData) {
  const shown = HABITS.filter((habit) => (data.habits[habit] ?? 0) > 0);
  const missing = HABITS.slice(0, SHOWN).filter(
    (habit) => data.habits[habit] === null,
  );
  return { shown: shown.slice(0, SHOWN), missing };
}

function NotAvailableIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="size-full"
    >
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5.5M12 16.4v.1" />
    </svg>
  );
}

export default forwardRef<HTMLDivElement, { data: ShareData }>(function Habits(
  { data },
  ref,
) {
  const format = useShareFormat();
  const { t } = format;
  const { shown, missing } = habits(data);
  const label = (habit: Habit, count: number) =>
    t(`share.habits.${habit}` as const, { count });

  return (
    <ShareCardFrame
      ref={ref}
      rangeLabel={t(`share.range.${data.range.id}` as const)}
      background={`radial-gradient(90% 50% at 90% 10%, rgba(56,189,248,0.28) 0%, rgba(2,6,23,0) 70%), ${slate[900]}`}
      texture={<Facets seed={data.seed ^ 29} color="#7dd3fc" max={0.08} />}
    >
      <Eyebrow className="text-brand-300">{t("share.habits.eyebrow")}</Eyebrow>
      <Headline>{t("share.habits.headline")}</Headline>
      <div className="mt-[72px] grid grid-cols-2 gap-[28px]">
        {shown.map((habit) => (
          <Tile
            key={habit}
            value={format.number(data.habits[habit]!)}
            label={label(habit, data.habits[habit]!)}
            className="h-[282px] bg-[rgba(255,255,255,0.08)]"
            valueClassName={COLORS[HABITS.indexOf(habit) % COLORS.length]}
          />
        ))}
      </div>
      {missing.length > 0 && (
        <div className="mt-[40px] flex items-start gap-[26px] rounded-[40px] border-[4px] border-dashed border-[rgba(148,163,184,0.5)] px-[40px] py-[34px] text-gray-300">
          <div className="mt-[4px] size-[52px] shrink-0 text-gray-400">
            <NotAvailableIcon />
          </div>
          <div>
            <div className="text-[40px] font-extrabold text-white">
              {t("share.habits.missingTitle")}
            </div>
            <div className="mt-[10px] text-[36px] leading-[1.3] font-medium">
              {t("share.habits.missing", {
                list: missing
                  .map((habit) => t(`share.habits.${habit}_other` as const))
                  .join(" · "),
              })}
            </div>
          </div>
        </div>
      )}
    </ShareCardFrame>
  );
});
