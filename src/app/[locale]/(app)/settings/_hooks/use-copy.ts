"use client";

import { useTranslation } from "~/i18n/client";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { useEffect } from "react";
import { useCopyToClipboard } from "react-use";
import useToast from "~/hooks/use-toast";

export default function useCopy() {
  const { t } = useTranslation();
  const [state, copyToClipboard] = useCopyToClipboard();
  const toast = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        id: "cant-copy",
        variant: "danger",
        title: t("settings.toasts.copyError"),
        description: state.error.message,
        icon: XCircleIcon,
      });
    } else if (state.value) {
      let sliced = state.value.slice(0, 40);
      if (sliced.length !== state.value.length) {
        sliced += "...";
      }
      toast({
        id: sliced,
        title: t("settings.toasts.copied"),
        description: sliced,
        icon: CheckCircleIcon,
      });
    }
  }, [state, t, toast]);

  return copyToClipboard;
}
