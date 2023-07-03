import TimeSelector from "./_components/TimeSelector";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import BottomNav from "../_components/BottomNav";
import TopNav from "../_components/TopNav";

export default async function Layout({
  children,
  params: { locale },
}: PageProps<{}, { children: React.ReactNode }>) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <TopNav />
      {children}
      <BottomNav>
        <TimeSelector />
      </BottomNav>
    </>
  );
}
