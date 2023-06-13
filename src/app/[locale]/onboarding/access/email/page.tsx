import RenderMarkdown from "~/components/RenderMarkdown";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

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
