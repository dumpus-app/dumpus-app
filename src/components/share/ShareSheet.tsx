"use client";

import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import CRC32 from "crc-32";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowSize } from "react-use";
import Button from "~/components/Button";
import useGenerateImg from "~/hooks/use-generate-img";
import { useTranslation } from "~/i18n/client";
import { createLogger } from "~/utils/logger";
import { CARDS } from ".";
import { SQUARE, STORY } from "./ShareCardFrame";
import useShareData from "./use-share-data";

const logger = createLogger({ tag: "Share" });

const GAP = 12;
/** Lets a swipe settle before the card it lands on is drawn. */
const DRAW_DELAY = 250;
/** Longest wait for names and icons before drawing without them. */
const DATA_TIMEOUT = 2_000;

type Drawing =
  { status: "pending" } | { status: "ready"; blob: Blob } | { status: "error" };

function canShareFiles() {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof navigator.share !== "function" || !navigator.canShare) {
    return false;
  }
  try {
    return navigator.canShare({
      files: [new File([], "card.png", { type: "image/png" })],
    });
  } catch {
    return false;
  }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function toBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The share sheet's content: the cards as live previews in a carousel, and
 * the buttons that share or save the selected one. The selected card is
 * drawn into a PNG once the carousel settles on it, so "Share" can hand the
 * image over within the tap, which Safari's Web Share API requires.
 */
export default function ShareSheet() {
  const { t, i18n } = useTranslation();
  const { data, loading } = useShareData();
  const { generate } = useGenerateImg();
  const native = Capacitor.isNativePlatform();
  const [shareable] = useState(canShareFiles);

  const cards = CARDS.filter((card) => card.shown(data));
  const [index, setIndex] = useState(0);
  const selected = Math.min(index, cards.length - 1);
  const card = cards[selected];

  const nodes = useRef(new Map<string, HTMLDivElement>());
  const queue = useRef(Promise.resolve());
  const [drawings, setDrawings] = useState<Record<string, Drawing>>({});
  const [waited, setWaited] = useState(false);
  // Any change of the data, names and avatars arriving included, makes a
  // new image.
  const dataKey = useMemo(() => CRC32.str(JSON.stringify(data)), [data]);
  const key = `${card.kind}:${dataKey}`;
  const drawing = drawings[key];

  useEffect(() => {
    const timer = setTimeout(() => setWaited(true), DATA_TIMEOUT);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (drawing || (loading && !waited)) return;
    const timer = setTimeout(() => {
      setDrawings((all) => ({ ...all, [key]: { status: "pending" } }));
      // One at a time: a swipe during a drawing waits for it.
      queue.current = queue.current.then(async () => {
        const node = nodes.current.get(card.kind);
        try {
          if (!node) throw new Error(`no node for the ${card.kind} card`);
          const blob = await generate(node, "square" in card ? SQUARE : STORY);
          setDrawings((all) => ({ ...all, [key]: { status: "ready", blob } }));
        } catch (error) {
          logger.error(error);
          setDrawings((all) => ({ ...all, [key]: { status: "error" } }));
        }
      });
    }, DRAW_DELAY);
    return () => clearTimeout(timer);
  }, [card, drawing, generate, key, loading, waited]);

  // The previews are the cards at full size, scaled down to leave the
  // sheet's title and buttons about 300 px of height and the next card
  // peeking out.
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const contentWidth = Math.min(windowWidth - 64, 416);
  const scale = Math.max(
    0.15,
    Math.min(
      0.28,
      (windowHeight - 300) / STORY.height,
      (contentWidth - 56) / STORY.width,
    ),
  );
  const slideWidth = Math.round(STORY.width * scale);

  const scroller = useRef<HTMLDivElement>(null);
  const go = useCallback(
    (to: number) => {
      scroller.current?.scrollTo({
        left: to * (slideWidth + GAP),
        behavior: reducedMotion() ? "auto" : "smooth",
      });
    },
    [slideWidth],
  );
  function onScroll() {
    const element = scroller.current;
    if (!element) return;
    const at = Math.round(element.scrollLeft / (slideWidth + GAP));
    setIndex(Math.max(0, Math.min(cards.length - 1, at)));
  }

  const name = `dumpus-${card.file}.png`;
  async function onShare() {
    if (drawing?.status !== "ready") return;
    const { blob } = drawing;
    const text = t("share.popup.description");
    try {
      if (native) {
        const { uri } = await Filesystem.writeFile({
          path: `share/${name}`,
          data: await toBase64(blob),
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: t("share.popup.title"),
          text,
          files: [uri],
          dialogTitle: t("share.recap"),
        });
        return;
      }
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: t("share.popup.title"),
          text,
          files: [file],
        });
        return;
      }
      download(blob, name);
    } catch (error) {
      // Closing the share sheet rejects too.
      if ((error as Error).name === "AbortError") return;
      if (/cancel/i.test((error as Error).message ?? "")) return;
      logger.warn(error);
      if (!native) download(blob, name);
    }
  }

  function onDownload() {
    if (drawing?.status === "ready") download(drawing.blob, name);
  }

  function retry() {
    setDrawings((all) => {
      const others = { ...all };
      delete others[key];
      return others;
    });
  }

  const status = drawing?.status ?? "pending";

  return (
    <div>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={onScroll}
          dir="ltr"
          tabIndex={0}
          role="region"
          aria-label={t("share.cardsLabel")}
          className="flex snap-x snap-mandatory [scrollbar-width:none] items-center overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
          style={{
            gap: GAP,
            paddingInline: `calc(50% - ${slideWidth / 2}px)`,
            height: Math.round(STORY.height * scale),
          }}
        >
          {cards.map(({ kind, Card, ...rest }, i) => {
            const square = "square" in rest;
            return (
              <div
                key={kind}
                role="group"
                aria-roledescription="slide"
                aria-label={t(`share.cards.${kind}`)}
                aria-current={i === selected}
                data-card={kind}
                data-image={
                  i === selected
                    ? status
                    : drawings[`${kind}:${dataKey}`]?.status
                }
                className="relative shrink-0 snap-center snap-always overflow-hidden rounded-xl bg-gray-800 shadow-lg"
                style={{
                  width: slideWidth,
                  height: Math.round(
                    (square ? SQUARE.height : STORY.height) * scale,
                  ),
                }}
              >
                <div
                  dir={i18n.dir()}
                  className="absolute top-0 left-0 origin-top-left"
                  style={{ transform: `scale(${scale})` }}
                >
                  <Card
                    data={data}
                    ref={(node: HTMLDivElement | null) => {
                      if (node) nodes.current.set(kind, node);
                      else nodes.current.delete(kind);
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => go(selected - 1)}
          disabled={selected === 0}
          aria-label={t("share.previous")}
          className="absolute top-1/2 left-0 hidden -translate-y-1/2 rounded-full bg-gray-950/70 p-2 text-white transition-opacity disabled:opacity-0 sm:block"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => go(selected + 1)}
          disabled={selected === cards.length - 1}
          aria-label={t("share.next")}
          className="absolute top-1/2 right-0 hidden -translate-y-1/2 rounded-full bg-gray-950/70 p-2 text-white transition-opacity disabled:opacity-0 sm:block"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-2 flex justify-center">
        {cards.map(({ kind }, i) => (
          <button
            key={kind}
            type="button"
            onClick={() => go(i)}
            aria-label={t(`share.cards.${kind}`)}
            aria-current={i === selected}
            className="p-1"
          >
            <span
              className={clsx(
                "block h-2 rounded-full transition-all motion-reduce:transition-none",
                i === selected ? "w-5 bg-brand-300" : "w-2 bg-gray-600",
              )}
            />
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {status === "error" ? (
          <Button variant="danger" className="flex-1" onClick={retry}>
            {t("share.error")}
          </Button>
        ) : (
          <>
            {shareable && (
              <Button
                className="flex-1"
                onClick={onShare}
                disabled={status !== "ready"}
                aria-busy={status === "pending"}
              >
                {status === "pending"
                  ? t("share.generating")
                  : t("share.title")}
              </Button>
            )}
            {!native && (
              <Button
                variant={shareable ? "gray" : "brand"}
                className="flex-1"
                onClick={onDownload}
                disabled={status !== "ready"}
                aria-busy={status === "pending"}
              >
                {status === "pending" && !shareable
                  ? t("share.generating")
                  : t("share.download")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
