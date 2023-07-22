import Link from "~/components/Link";
import { useTranslation } from "~/i18n/client";

export type Props = {
  title: string;
  href?: string;
  children: React.ReactNode;
  id?: string;
};

export default function Section({ title, href, children, id }: Props) {
  const {t } = useTranslation()
  return (
    <section id={id} className="py-4 desktop-container sm:py-8">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-lg font-bold text-white sm:text-2xl">{t(title)}</div>
        {href ? (
          <Link
            href={href}
            className="-mr-2 px-2 text-brand-300 hover:underline sm:text-lg"
          >
           {t("more") }
          </Link>
        ) : (
          <div />
        )}
      </div>
      {children}
    </section>
  );
}
