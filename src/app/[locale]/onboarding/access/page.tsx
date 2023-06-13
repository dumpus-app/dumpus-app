import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import Methods from "./_components/Methods";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.access.title")}
        </h1>
        <p className="mt-2 text-gray-400">
          {t("onboarding.access.description")}
        </p>
      </div>
      <Methods />
      <div className="max-w-xs text-center">
        <p className="text-gray-400">{t("onboarding.shared.30DaysDelay")}</p>
      </div>
    </div>
  );
}
