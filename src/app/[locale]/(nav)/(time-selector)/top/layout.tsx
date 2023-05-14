import TopSelector from "~/components/layout/TopSelector";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Layout({
  children,
  params: { locale },
}: PageProps<{}, { children: React.ReactNode }>) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <TopSelector />
      {children}
    </>
  );
}
