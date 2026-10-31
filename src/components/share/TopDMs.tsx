"use client";

import { forwardRef } from "react";
import { palette } from "~/utils/palette";
import ShareCardFrame, {
  CardImage,
  Eyebrow,
  Facets,
  Headline,
  Row,
} from "./ShareCardFrame";
import { useShareFormat } from "./format";
import type { ShareData } from "./types";

const { rose } = palette;

export default forwardRef<HTMLDivElement, { data: ShareData }>(function TopDMs(
  { data },
  ref,
) {
  const format = useShareFormat();
  const { t } = format;
  const [first, ...rest] = data.topDMs;

  return (
    <ShareCardFrame
      ref={ref}
      rangeLabel={t(`share.range.${data.range.id}` as const)}
      background={`linear-gradient(165deg, ${rose[500]} 0%, ${rose[700]} 48%, ${rose[950]} 100%)`}
      texture={<Facets seed={data.seed ^ 11} max={0.13} />}
    >
      <Eyebrow className="text-danger-100">{t("share.topDMs.eyebrow")}</Eyebrow>
      <Headline>{t("share.topDMs.headline")}</Headline>
      <div className="mt-[84px] flex items-center gap-[52px]">
        <div className="relative shrink-0">
          <CardImage
            src={first.avatar}
            alt={first.name}
            size={280}
            className="shadow-[0_0_0_12px_rgba(255,255,255,0.92),0_30px_80px_rgba(2,6,23,0.45)]"
          />
          <div className="absolute right-[-18px] bottom-[-14px] flex size-[104px] items-center justify-center rounded-full bg-white text-[62px] font-black text-danger-700">
            1
          </div>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[104px] leading-none font-black tracking-[-0.035em]">
            {first.name}
          </div>
          <div className="mt-[16px] text-[50px] font-bold text-danger-100">
            {t("share.topDMs.count", {
              count: first.count,
              value: format.number(first.count),
            })}
          </div>
        </div>
      </div>
      <div className="mt-[96px] flex flex-col gap-[26px]">
        {rest.map((person, i) => (
          <Row
            key={person.id}
            rank={i + 2}
            image={
              <CardImage src={person.avatar} alt={person.name} size={116} />
            }
            name={person.name}
            count={format.number(person.count)}
            rankClassName="text-danger-200"
            countClassName="text-danger-100"
          />
        ))}
      </div>
    </ShareCardFrame>
  );
});
