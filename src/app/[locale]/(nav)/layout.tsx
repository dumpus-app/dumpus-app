import BottomNav from "~/components/layout/BottomNav";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Layout({
  children,
  params: { locale },
}: PageProps<{}, { children: React.ReactNode }>) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <div>{children}</div>
      <BottomNav />
    </>
  );
}
