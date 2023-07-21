"use client";

import Button from "~/components/Button";
import { useTranslation } from "~/i18n/client";
import { useAppStore } from "~/stores";

export default function Share() {
  const setOpen = useAppStore(({ ui }) => ui.setShowSharePopup);
  const { t } = useTranslation();

  return (
    <div className="rounded-t-xl border border-b-0 border-gray-800 bg-gray-900 p-2">
      <Button type="button" onClick={() => setOpen(true)} className="w-full">
        {t("share")}
      </Button>
    </div>
  );
}
