"use client";

import { forwardRef } from "react";
import { palette } from "~/utils/palette";
import ShareCardFrame, {
  Eyebrow,
  Facets,
  Headline,
  Row,
  ServerIcon,
} from "./ShareCardFrame";
import { useShareFormat } from "./format";
import type { ShareData } from "./types";

const { emerald } = palette;

export default forwardRef<HTMLDivElement, { data: ShareData }>(
  function TopServers({ data }, ref) {
    const format = useShareFormat();
    const { t } = format;
    const [first, ...rest] = data.topServers;

    return (
      <ShareCardFrame
        ref={ref}
        rangeLabel={t(`share.range.${data.range.id}` as const)}
        background={`linear-gradient(165deg, ${emerald[600]} 0%, ${emerald[800]} 50%, ${emerald[950]} 100%)`}
        texture={<Facets seed={data.seed ^ 19} max={0.12} />}
      >
        <Eyebrow className="text-success-100">
          {t("share.topServers.eyebrow")}
        </Eyebrow>
        <Headline>{t("share.topServers.headline")}</Headline>
        <div className="mt-[84px] flex items-center gap-[52px]">
          <div className="relative shrink-0 rounded-[30%] shadow-[0_0_0_12px_rgba(255,255,255,0.92),0_30px_80px_rgba(2,6,23,0.4)]">
            <ServerIcon server={first} size={280} />
            <div className="absolute right-[-22px] bottom-[-22px] flex size-[104px] items-center justify-center rounded-full bg-white text-[62px] font-black text-success-800">
              1
            </div>
          </div>
          <div className="min-w-0">
            <div className="truncate text-[96px] leading-none font-black tracking-[-0.035em]">
              {first.name}
            </div>
            <div className="mt-[16px] text-[50px] font-bold text-success-100">
              {t("share.topDMs.count", {
                count: first.count,
                value: format.number(first.count),
              })}
            </div>
          </div>
        </div>
        <div className="mt-[96px] flex flex-col gap-[26px]">
          {rest.map((server, i) => (
            <Row
              key={server.id}
              rank={i + 2}
              image={<ServerIcon server={server} size={116} />}
              name={server.name}
              count={format.number(server.count)}
              rankClassName="text-success-200"
              countClassName="text-success-100"
            />
          ))}
        </div>
      </ShareCardFrame>
    );
  },
);
