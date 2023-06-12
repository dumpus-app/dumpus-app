import { CSSProperties } from "react";
import Link from "~/components/Link";
import { useTranslation } from "~/i18n/client";

export type Props = {
  progress: 0 | 0.33 | 0.66 | 1 | 2 | 2.5 | 3 | null;
  href: null | string;
};

export default function Header({ progress, href }: Props) {
  const { t } = useTranslation();

  if (progress === null)
    return (
      <div className="flex h-12 w-full items-center justify-between px-2 sm:mx-auto sm:max-w-sm" />
    );

  return (
    <div className="flex h-12 w-full items-center justify-between px-2 sm:mx-auto sm:max-w-sm">
      {href ? (
        <Link href={href} className="text-brand-300 hover:underline">
          {t("onboarding.shared.previous")}
        </Link>
      ) : (
        <div />
      )}
      <div className="flex items-center">
        <div
          className="bg-gradient-to-t [clip-path:url(#header-check-1)]"
          style={
            {
              "--tw-gradient-stops":
                progress === 0
                  ? "#94a3b8 0%, #94a3b8 100%" // all gray-400
                  : progress < 1
                  ? `#38bdf8 0%, #38bdf8 ${progress * 100}%, #94a3b8 ${
                      progress * 100 + 0.01
                    }%, #94a3b8 100%`
                  : "#38bdf8 0%, #38bdf8 100%", // all brand-400,
            } as CSSProperties
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <defs>
              <clipPath id="header-check-1">
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div
          className="bg-gradient-to-t [clip-path:url(#header-check-2)]"
          style={
            {
              "--tw-gradient-stops":
                progress <= 1
                  ? "#94a3b8 0%, #94a3b8 100%" // all gray-400
                  : progress < 2
                  ? `#38bdf8 0%, #38bdf8 ${(progress - 1) * 100}%, #94a3b8 ${
                      (progress - 1) * 100 + 0.01
                    }%, #94a3b8 100%`
                  : "#38bdf8 0%, #38bdf8 100%", // all brand-400,
            } as CSSProperties
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <defs>
              <clipPath id="header-check-2">
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div
          className="bg-gradient-to-t [clip-path:url(#header-check-3)]"
          style={
            {
              "--tw-gradient-stops":
                progress <= 2
                  ? "#94a3b8 0%, #94a3b8 100%" // all gray-400
                  : progress < 3
                  ? `#38bdf8 0%, #38bdf8 ${(progress - 2) * 100}%, #94a3b8 ${
                      (progress - 2) * 100 + 0.01
                    }%, #94a3b8 100%`
                  : "#38bdf8 0%, #38bdf8 100%", // all brand-400,
            } as CSSProperties
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-6 w-6"
          >
            <defs>
              <clipPath id="header-check-3">
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
