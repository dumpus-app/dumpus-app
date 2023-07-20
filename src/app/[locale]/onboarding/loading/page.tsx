"use client";

import { useTranslation } from "~/i18n/client";
import Error from "./_components/Error";
import ProcessLoading from "./_components/ProcessLoading";
import Progress from "./_components/Progress";
import QueueDisplay from "./_components/QueueDisplay";
import useLogic from "./_hooks/use-logic";

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <span className="inline-flex h-16 w-16 animate-spin-slow rounded-full border-8 border-dotted border-brand-300"></span>
      {children}
    </div>
  );
}

export default function Page() {
  const { t } = useTranslation();

  const { process, status, data, error } = useLogic();

  if (error) {
    return (
      <Error
        error={
          {
            UNKNOWN_PACKAGE_ID: "This package is unknown.",
            UNAUTHORIZED:
              "You are not allowed to interact with this package data.",
            INVALID_LINK: "Link invalid.",
            UNKNOWN_ERROR: "An unknown error occured.",
            EXPIRED_LINK: "Link expired.",
          }[error]
        }
      />
    );
  }

  if (!process.data || !status.data) {
    return (
      <Wrapper>
        <ProcessLoading />
      </Wrapper>
    );
  }

  if (status.data.processingStep === "LOCKED") {
    return (
      <Wrapper>
        <QueueDisplay
          position={status.data.processingQueuePosition.standardQueueUser}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Progress data={status.data} />
    </Wrapper>
  );
}
