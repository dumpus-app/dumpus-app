"use client";

import Button from "~/components/Button";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";

export default function Share() {
  const setOpen = useAppStore(({ ui }) => ui.setShowSharePopup);
  const { t } = useTranslation();

  return (
    <div className="px-2 py-4 sm:hidden">
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        {t("share.title")}
      </Button>
    </div>
  );
}
