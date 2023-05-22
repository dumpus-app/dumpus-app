import TopSelector from "./_components/TopSelector";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./_components/PageHeader";

export default async function Layout({
  children,
  params: { locale },
}: PageProps<{}, { children: React.ReactNode }>) {
  const { t } = await useTranslation(locale);

  return (
    <div className="mb-auto">
      <PageHeader />
      <TopSelector />
      {children}
    </div>
  );
}
