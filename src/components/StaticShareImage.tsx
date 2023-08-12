import clsx from "clsx";
import { useTranslation } from "~/i18n/client";

type ListElement = {
  name: string;
  url: string;
  count: string;
};

export type Props = {
  user: {
    displayName: string;
    avatarURL: string;
  };
  stats: {
    messagesSent: string;
    timeSpent: string;
    appOpenings: string;
    networkSize: string;
  };
  topDMS: ListElement[];
  topGuilds: ListElement[];
  t: ReturnType<typeof useTranslation>["t"];
};

function StatCard({
  children,
  value,
  label,
  className,
}: {
  children: React.ReactNode;
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-1 items-start rounded-lg bg-gray-800 p-4 text-gray-300",
        className,
      )}
    >
      {children}
      <div className="ml-2 flex flex-col items-start">
        <div className="text-3xl font-bold text-brand-300">{value}</div>
        <div className="text-lg text-gray-300">{label}</div>
      </div>
    </div>
  );
}

function TopList({
  title,
  elements,
  className,
}: {
  title: string;
  elements: ListElement[];
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-1 flex-col rounded-lg bg-gray-800 p-4",
        className,
      )}
    >
      <div className="text-xl font-medium text-gray-300">{title}</div>
      <div className="mt-2 flex flex-col">
        {elements.map(({ name, url, count }, i) => (
          <div key={i} className="mt-2 flex items-center justify-between">
            <div className="flex items-center">
              {/* eslint-disable-next-line */}
              <img
                src={url}
                alt=""
                className="rounded-full object-cover object-center"
                width={48}
                height={48}
                crossOrigin="anonymous"
              />
              <div className="ml-2 text-xl text-white">{name}</div>
            </div>
            <div className="flex items-center text-brand-300">
              <div className="mr-2 text-xl">{count}</div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                // @ts-ignore
                className="h-8 w-8"
              >
                <path
                  fillRule="evenodd"
                  d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaticShareImage({
  user,
  stats,
  topDMS,
  topGuilds,
  t,
}: Props) {
  return (
    <div className="flex h-full w-full flex-col bg-gray-950 text-gray-400">
      <div className="h-4 flex-shrink-0 bg-brand-300" />
      <div className="flex flex-1 flex-col p-8">
        <div className="flex h-full flex-1 flex-col">
          <div className="mb-8 flex">
            {/* eslint-disable-next-line */}
            <img
              src={user.avatarURL}
              alt=""
              className="rounded-full object-cover object-center"
              width={128}
              height={128}
              crossOrigin="anonymous"
            />
            <div className="ml-4 flex flex-col justify-center">
              <div className="text-2xl text-gray-300">
                {t("shareImage.title")}
              </div>
              <div className="text-6xl font-bold text-white">
                {user.displayName}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex">
              <StatCard
                value={stats.messagesSent}
                label={t("shareImage.messagesSent")}
                className="mr-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  className="h-10 w-10"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </StatCard>
              <StatCard
                value={stats.timeSpent}
                label={t("shareImage.timeSpent")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  className="h-10 w-10"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </StatCard>
            </div>
            <div className="mt-4 flex">
              <StatCard
                value={stats.appOpenings}
                label={t("shareImage.appOpenings")}
                className="mr-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  className="h-10 w-10"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18a.75.75 0 01-.75-.75zm-8.962 3.712a.75.75 0 010 1.061l-1.591 1.591a.75.75 0 11-1.061-1.06l1.591-1.592a.75.75 0 011.06 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </StatCard>
              <StatCard
                value={stats.networkSize}
                label={t("shareImage.talkedWith")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  className="h-10 w-10"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </StatCard>
            </div>
          </div>
          <div className="mt-4 flex">
            <TopList
              title={t("shareImage.topDMS")}
              elements={topDMS}
              className="mr-4"
            />
            <TopList title={t("shareImage.topGuilds")} elements={topGuilds} />
          </div>
          <div className="mt-auto flex items-center justify-between">
            <div className="flex text-xl text-white">
              <div>{t("shareImage.getYours")}</div>
              <div className="ml-2 text-brand-300">dumpus.app</div>
            </div>
            {/* eslint-disable-next-line */}
            <img
              src="/assets/logo.png"
              alt=""
              className="rounded-full object-cover object-center"
              width={64}
              height={64}
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
