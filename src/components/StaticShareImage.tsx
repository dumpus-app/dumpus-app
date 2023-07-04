import clsx from "clsx";

export type Props = {
  user: {
    displayName: string;
    avatarURL: string;
  };
  stats: {
    messagesSent: string;
    timeSpent: string;
    appOpenings: string;
    // TODO: rename
    otherStat: string;
  };
  topDMS: {
    name: string;
    url: string;
  }[];
  topGuilds: {
    name: string;
    url: string;
  }[];
};

function StatCard({
  children,
  value,
  label,
  tw,
}: {
  children: React.ReactNode;
  value: string;
  label: string;
  tw?: string;
}) {
  return (
    <div
      tw={clsx(
        "flex-1 bg-gray-800 flex items-start text-gray-300 rounded-lg p-4",
        tw
      )}
    >
      {children}
      <div tw="flex flex-col items-start ml-2">
        <div tw="text-3xl font-bold text-brand-300">{value}</div>
        <div tw="text-lg text-gray-300">{label}</div>
      </div>
    </div>
  );
}

function TopList({
  title,
  elements,
}: {
  title: string;
  elements: {
    name: string;
    url: string;
  }[];
}) {
  return (
    <div tw="flex flex-col">
      <div tw="text-lg text-gray-300 font-medium">{title}</div>
      <div tw="flex flex-col">
        {elements.map(({ name, url }, i) => (
          <div key={i} tw="flex items-center mt-2">
            {/* eslint-disable-next-line */}
            <img
              src={url}
              alt=""
              tw="object-cover object-center rounded-full"
              width={48}
              height={48}
            />
            <div tw="ml-2 text-xl text-white">{name}</div>
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
}: Props) {
  return (
    <div tw="h-full w-full flex flex-col bg-gray-950 text-gray-400">
      <div tw="h-4 bg-brand-300 flex-shrink-0" />
      <div tw="flex-1 p-8 flex">
        <div tw="flex-1 h-full flex flex-col mr-8">
          <div tw="flex mb-8">
            {/* eslint-disable-next-line */}
            <img
              src={user.avatarURL}
              alt=""
              tw="object-cover object-center rounded-full"
              width={128}
              height={128}
            />
            <div tw="flex flex-col justify-center ml-4">
              <div tw="text-gray-300 text-2xl">Stats for Discord</div>
              <div tw="text-white font-bold text-6xl">{user.displayName}</div>
            </div>
          </div>
          <div tw="flex flex-col">
            <div tw="flex">
              <StatCard
                value={stats.messagesSent}
                label="Messages sent"
                tw="mr-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  tw="h-10 w-10"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </StatCard>
              <StatCard value={stats.timeSpent} label="Spent on Discord">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  tw="h-10 w-10"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </StatCard>
            </div>
            <div tw="flex mt-4">
              <StatCard
                value={stats.appOpenings}
                label="App openings"
                tw="mr-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  tw="h-10 w-10"
                >
                  <path
                    fill-rule="evenodd"
                    d="M12 1.5a.75.75 0 01.75.75V4.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zM5.636 4.136a.75.75 0 011.06 0l1.592 1.591a.75.75 0 01-1.061 1.06l-1.591-1.59a.75.75 0 010-1.061zm12.728 0a.75.75 0 010 1.06l-1.591 1.592a.75.75 0 01-1.06-1.061l1.59-1.591a.75.75 0 011.061 0zm-6.816 4.496a.75.75 0 01.82.311l5.228 7.917a.75.75 0 01-.777 1.148l-2.097-.43 1.045 3.9a.75.75 0 01-1.45.388l-1.044-3.899-1.601 1.42a.75.75 0 01-1.247-.606l.569-9.47a.75.75 0 01.554-.68zM3 10.5a.75.75 0 01.75-.75H6a.75.75 0 010 1.5H3.75A.75.75 0 013 10.5zm14.25 0a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H18a.75.75 0 01-.75-.75zm-8.962 3.712a.75.75 0 010 1.061l-1.591 1.591a.75.75 0 11-1.061-1.06l1.591-1.592a.75.75 0 011.06 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </StatCard>
              <StatCard value={stats.otherStat} label="Other stat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  // @ts-ignore
                  tw="h-10 w-10"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
              </StatCard>
            </div>
          </div>
          <div tw="mt-auto flex justify-between items-center">
            <div tw="text-white flex text-xl">
              <div>Get yours at</div>
              <div tw="text-brand-300 ml-2">dumpus.app</div>
            </div>
            {/* eslint-disable-next-line */}
            <img
              src="/assets/logo.png"
              alt=""
              tw="object-cover object-center rounded-full"
              width={64}
              height={64}
            />
          </div>
        </div>
        <div tw="w-1/3 h-full flex-shrink-0 bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
          <TopList title="Top DMs" elements={topDMS} />
          <div tw="h-px bg-gray-300" />
          <TopList title="Top Guilds" elements={topGuilds} />
        </div>
      </div>
    </div>
  );
}
