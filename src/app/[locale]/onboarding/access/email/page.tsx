import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">Transfer the email</h1>
        <p className="mt-2 text-gray-400">
          Transfer the email received from Discord to{" "}
          <strong>process@dumpus-app.net</strong>. We’ll send you a link when
          it’s ready.
        </p>
        <p className="mt-2 text-gray-400">See you soon!</p>
      </div>
    </div>
  );
}
