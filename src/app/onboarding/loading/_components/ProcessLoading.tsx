import { useTranslation } from "~/i18n/client";

export default function ProcessLoading() {
  const { t } = useTranslation();
  return (
    <div className="max-w-xs text-center">
      <h1 className="text-xl font-bold text-white">
        {t("onboarding.loading.progress.loading.title")}
      </h1>
      <p className="mt-2 text-gray-400">
        {t("onboarding.loading.progress.loading.description")}
      </p>
    </div>
  );
}
