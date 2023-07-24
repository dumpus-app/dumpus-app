import { useTranslation } from "~/i18n/client";
import { XCircleIcon } from "@heroicons/react/24/solid";
import EmptyState from "~/components/EmptyState";
import Retry from "./Retry";

export default function Error({ error, url }: { error: string; url: string }) {
  const { t } = useTranslation();
  return (
    <>
      <EmptyState
        icon={XCircleIcon}
        title={t("onboarding.loading.error")}
        description={error}
      />
      <Retry show={true} url={url} />
    </>
  );
}
