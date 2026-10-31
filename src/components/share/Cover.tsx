"use client";

import { forwardRef } from "react";
import { Trans } from "react-i18next";
import { palette } from "~/utils/palette";
import ShareCardFrame, { CardImage, Eyebrow, Facets } from "./ShareCardFrame";
import { useShareFormat } from "./format";
import type { ShareData } from "./types";
import useFitText from "./use-fit-text";

const { sky, slate } = palette;
const YEAR_MS = 365.25 * 86_400_000;

export default forwardRef<HTMLDivElement, { data: ShareData }>(function Cover(
  { data },
  ref,
) {
  const { t } = useShareFormat();
  const { user, range } = data;
  const rangeLabel = t(`share.range.${range.id}` as const);
  const nameRef = useFitText<HTMLDivElement>(user.displayName, {
    max: 150,
    min: 96,
  });

  const years = Math.floor(
    (Date.parse(range.end) - Date.parse(range.start)) / YEAR_MS,
  );
  const headline =
    range.id !== "lifetime"
      ? (`share.cover.${range.id}` as const)
      : years >= 1
        ? "share.cover.years"
        : "share.cover.lifetime";

  return (
    <ShareCardFrame
      ref={ref}
      rangeLabel={rangeLabel}
      background={`radial-gradient(120% 70% at 85% 0%, ${sky[300]} 0%, ${sky[500]} 34%, ${sky[700]} 62%, ${slate[950]} 100%)`}
      texture={<Facets seed={data.seed ^ 3} max={0.16} />}
    >
      <Eyebrow>{t("share.cover.eyebrow", { range: rangeLabel })}</Eyebrow>
      <div className="mt-[-40px] flex flex-1 flex-col items-center justify-center">
        <CardImage
          src={user.avatar}
          alt={user.displayName}
          size={400}
          className="shadow-[0_0_0_12px_rgba(255,255,255,0.92),0_30px_80px_rgba(2,6,23,0.45)]"
        />
        <div
          ref={nameRef}
          className="mt-[84px] max-w-full truncate leading-none font-black tracking-[-0.04em]"
        >
          {user.displayName}
        </div>
        <div className="mt-[22px] max-w-full truncate text-[50px] font-semibold text-brand-100 opacity-80">
          {user.handle}
        </div>
      </div>
      <div className="mb-[340px] text-[104px] leading-[0.95] font-black tracking-[-0.035em]">
        <Trans
          i18nKey={headline}
          count={years}
          components={{ accent: <span className="text-brand-200" /> }}
        />
      </div>
    </ShareCardFrame>
  );
});
