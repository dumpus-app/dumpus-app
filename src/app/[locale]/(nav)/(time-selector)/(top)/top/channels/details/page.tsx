import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./PageHeader";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <PageHeader />
      <div>Top Channel details</div>
    </>
  );
}
