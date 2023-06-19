"use client";

import Button from "~/components/Button";
import Link from "~/components/Link";
import { useTranslation } from "~/i18n/client";

export type Props = { href: string | null; label: string | null };

export default function Footer({ href, label }: Props) {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-2 p-4 text-center sm:mx-auto sm:max-w-sm">
      <button
        type="button"
        onClick={(e) => {
          // TODO: show popup
          alert("show popup");
        }}
        className="w-full py-2 text-gray-400 underline transition-colors hover:text-gray-300"
      >
        {t("onboarding.shared.trust")}
      </button>
      {href && (
        <Button asChild>
          <Link href={href}>{label}</Link>
        </Button>
      )}
    </div>
  );
}
