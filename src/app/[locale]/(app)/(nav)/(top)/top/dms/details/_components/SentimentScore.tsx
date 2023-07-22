"use client";

import clsx from "clsx";
import Section from "~/components/Section";
import { useTranslation } from "~/i18n/client";

function mapScoreToRange(score: number): number {
  if (score < -1 || score > 1) {
    throw new Error("Score must be between -1 and 1");
  }

  const minScore = -1;
  const maxScore = 1;
  const minOutput = 0;
  const maxOutput = 8;

  const scaledScore = (score - minScore) / (maxScore - minScore);
  const mappedOutput = Math.round(
    minOutput + scaledScore * (maxOutput - minOutput)
  );

  return mappedOutput;
}

export default function SentimentScore({ score }: { score: number }) {
  const activeIndex = mapScoreToRange(score);
  const { t } = useTranslation();

  const colors = [
    "bg-danger-500",
    "bg-danger-500/80",
    "bg-danger-500/60",
    "bg-danger-500/40",
    "bg-gray-200",
    "bg-success-500/40",
    "bg-success-500/60",
    "bg-success-500/80",
    "bg-success-500",
  ];

  return (
    <Section title={t("sentimentAnalysis.title")}>
      <div className="mx-2 space-y-2">
        <div className="flex items-center justify-between px-4 text-sm sm:px-6 sm:text-base">
          <div className="text-danger-500">{t("sentimentAnalysis.anger")}</div>
          <div className="text-success-500">
            {t("sentimentAnalysis.happiness")}
          </div>
        </div>
        <div className="grid h-8 grid-cols-9 rounded-full bg-white sm:h-12">
          {colors.map((color, i) => {
            const active = i === activeIndex;
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-center justify-center first:rounded-l-full last:rounded-r-full",
                  color
                )}
                aria-label={active ? t("sentimentAnalysis.score", { value: score }) : undefined}
              >
                {active && (
                  <div className="relative">
                    <div className="h-4 w-4 rounded-full bg-gray-900 sm:h-6 sm:w-6"></div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-gray-600 bg-gray-800 px-2 text-sm text-gray-300 sm:-bottom-7 sm:text-base">
                      {score.toFixed(3)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
