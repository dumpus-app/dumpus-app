import Link from "next/link";
import { useTranslation } from "~/i18n/client";
import LinkPending from "./LinkPending";
import Spinner from "./Spinner";

export type Props = {
  title: string;
  href?: string;
  children: React.ReactNode;
  id?: string;
};

export default function Section({ title, href, children, id }: Props) {
  const { t } = useTranslation();
  return (
    <section id={id} className="desktop-container py-4 sm:py-8">
      <div className="mb-2 flex items-center justify-between px-2">
        <div className="text-lg font-bold text-white sm:text-2xl">{title}</div>
        {href ? (
          <Link
            href={href}
            className="relative -mr-2 pressable px-2 text-brand-300 [--press-scale:0.94] hover:underline active:text-brand-400 sm:text-lg"
          >
            {t("more")}
            <LinkPending>
              {(pending) =>
                pending && (
                  <Spinner className="absolute top-1/2 right-full size-3.5 -translate-y-1/2" />
                )
              }
            </LinkPending>
          </Link>
        ) : (
          <div />
        )}
      </div>
      {children}
    </section>
  );
}
