import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import Methods from "./_components/Methods";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">I want the stats!</h1>
        <p className="mt-2 text-gray-400">Choose your preferred method.</p>
      </div>
      <Methods />
      <div className="max-w-xs text-center">
        <p className="text-gray-400">
          Keep in mind it can take up to 30 days to receive the email. Be
          patient!
        </p>
      </div>
    </div>
  );
}
