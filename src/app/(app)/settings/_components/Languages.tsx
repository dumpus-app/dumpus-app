"use client";

import LocaleSwitch from "~/components/LocaleSwitch";
import Section from "~/components/Section";
import { useTranslation } from "~/i18n/client";

export default function Languages() {
  const { t } = useTranslation();

  return (
    <Section title={t("settings.languages.title")}>
      <div className="px-2">
        <LocaleSwitch
          description={(localesAmount) =>
            t("settings.languages.description", {
              value: localesAmount,
            })
          }
        />
      </div>
    </Section>
  );
}
