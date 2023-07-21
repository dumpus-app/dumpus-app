import { useQuery } from "@tanstack/react-query";
import Section from "~/components/Section";
import StatCard from "~/components/data/StatCard";
import usePackageAPI from "~/hooks/use-package-api";
import { useSelectedPackage } from "~/stores";
import { Activity, DmChannelsData } from "~/types/sql";
import { avatarURLFallback } from "~/utils/discord";
import DiscordImage from "~/components/DiscordImage";

type Bot = Pick<
  DmChannelsData,
  "user_name" | "display_name" | "user_avatar_url"
> &
  Required<Pick<Activity, "associated_user_id">> & { total_occurences: number };

function BotCard({ bot }: { bot: Bot }) {
  const selectedPackage = useSelectedPackage();
  const api = usePackageAPI({ baseURL: selectedPackage.backendURL });

  const { data } = useQuery({
    queryKey: ["user", bot.associated_user_id],
    queryFn: () =>
      api.user({
        packageID: selectedPackage.package_id,
        UPNKey: selectedPackage.UPNKey,
        userID: bot.associated_user_id,
      }),
    staleTime: Infinity,
  });

  const username = data?.username || bot.user_name;
  const displayName = data?.display_name || bot.display_name || username;
  const avatarURL = data?.avatar_url || bot.user_avatar_url;

  return username ? (
    <StatCard
      value={
        <div className="flex items-center">
          <div className="relative mr-1 aspect-square w-6 sm:w-8">
            <DiscordImage
              src={avatarURLFallback(avatarURL, bot.associated_user_id)}
              alt={`${displayName}'s avatar`}
              fill
              className="rounded-full object-cover object-center"
            />
          </div>
          <div className="line-clamp-1 overflow-hidden text-ellipsis font-semibold text-white sm:text-2xl">
            {displayName}
          </div>
        </div>
      }
      label={
        <div className="text-sm text-gray-400 sm:text-lg">
          {bot.total_occurences} commands
        </div>
      }
    />
  ) : null;
}

export default function TopUsedBots({ bots }: { bots: Bot[] }) {
  return (
    <Section title="Top used bots">
      <div className="grid grid-cols-2 gap-2 px-2">
        {bots.slice(0, 4).map((bot, i) => (
          <BotCard key={i} bot={bot} />
        ))}
      </div>
    </Section>
  );
}
