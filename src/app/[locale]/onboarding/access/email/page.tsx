"use client";

import RenderMarkdown from "~/components/RenderMarkdown";
import { useTranslation } from "~/i18n/client";

export default function Page() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.access.methods.email.title")}
        </h1>
        {t("onboarding.access.methods.email.content", {
          returnObjects: true,
        }).map((p, i) => (
          <p key={i} className="mt-2 text-gray-400">
            <RenderMarkdown content={p} />
          </p>
        ))}
      </div>
    </div>
  );
}
