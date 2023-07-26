import { NoSymbolIcon } from "@heroicons/react/24/solid";
import EmptyState from "./EmptyState";
import { useTranslation } from "~/i18n/client";

export default function NotFoundState() {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t("notFound.title")}
      description={t("notFound.description")}
      icon={NoSymbolIcon}
    />
  );
}
