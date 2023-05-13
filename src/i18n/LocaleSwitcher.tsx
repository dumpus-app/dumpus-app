import Link from "next/link";
import { locales } from "~/i18n/settings";
import { useTranslation } from "~/i18n";

export default async function LocaleSwitcher({ locale }: { locale: string }) {
  const { t } = await useTranslation(locale);
  return (
    <div>
      <span>{t("localeSwitcher", { locale })}</span>
      {locales
        .filter((l) => locale !== l)
        .map((l, index) => {
          return (
            <span key={l}>
              {index > 0 && " or "}
              <Link href={`/${l}`}>{l}</Link>
            </span>
          );
        })}
    </div>
  );
}
