"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";
import Button from "~/components/Button";
import { VERSION } from "~/constants";
import { NextErrorProps } from "~/types";
import { useTranslation } from "~/i18n/client"

export default function Error({ error, reset }: NextErrorProps) {
  const { t } = useTranslation();
  return (
    <div className="my-auto flex flex-col items-center space-y-4 px-2">
      <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-danger-400" />
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">An error occured</h1>
        <div className="mt-2 rounded-lg bg-gray-800 p-2 font-mono text-sm text-danger-500">
          {error.message}
        </div>
        <p className="mt-8 text-gray-400">
          {t("error.title")}
        </p>
        <div className="mt-2 flex flex-col">
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" onClick={() => window.location.reload()}>
            {t("error.reload")}
            </Button>
            <Button
              size="sm"
              variant="gray"
              onClick={() => (window.location.href = "/")}
            >
              {t("error.overview")}
            </Button>
          </div>
          <Button size="sm" className="mt-2" variant="danger">
            <a
              href={`https://github.com/dumpus-app/dumpus-app/issues/new?title=${encodeURIComponent(
                "[In-app report] Triggered error boundary"
              )}&body=${encodeURIComponent(`
## Error

\`\`\`bash
Version: ${VERSION}
Name: ${error.name}
Message: ${error.message}
Cause: ${error.cause || "none"}
Stack: ${error.stack || "none"}
\`\`\`

## Infos

- Location: ${window.location.href}
- OS: <complete>
- Platform: <complete>
`)}`}
              target="_blank"
            >
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
