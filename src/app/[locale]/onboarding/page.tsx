import Image from "next/image";
import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import Steps from "./_components/Steps";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative h-16 w-16">
        <Image
          src="https://cdn.discordapp.com/embed/avatars/0.png"
          alt="Avatar"
          fill
          priority
          className="rounded-full object-cover object-center"
        />
      </div>
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">Welcome to Dumpus</h1>
        <p className="mt-2 text-gray-400">
          Get detailed insights and stats for your Discord account
        </p>
      </div>
      <Steps />
    </div>
  );
}
