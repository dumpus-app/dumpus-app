import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import LinkForm from "./_components/LinkForm";
import RenderMarkdown from "~/components/RenderMarkdown";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          {t("onboarding.access.methods.link.title")}
        </h1>
        <p className="mt-2 text-gray-400">
          <RenderMarkdown
            content={t("onboarding.access.methods.link.description")}
          />
        </p>
      </div>
      <LinkForm />
    </div>
  );
}
