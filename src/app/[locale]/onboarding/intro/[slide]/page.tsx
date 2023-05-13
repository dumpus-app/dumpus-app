import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Page({
  params: { locale, slide },
}: PageProps<{ slide: string }>) {
  const { t } = await useTranslation(locale);

  return <div>Onboarding intro slide #{slide}</div>;
}
