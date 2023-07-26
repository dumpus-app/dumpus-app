import { ArchiveBoxXMarkIcon } from "@heroicons/react/24/solid";
import EmptyState from "./EmptyState";
import { useTranslation } from "~/i18n/client";

export default function NoDataAvailable() {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t("noData")}
      description={t("noDataTip")}
      icon={ArchiveBoxXMarkIcon}
    />
  );
}
