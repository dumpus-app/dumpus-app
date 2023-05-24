import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import LinkForm from "./_components/LinkForm";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="max-w-xs text-center">
        <h1 className="text-xl font-bold text-white">
          Enter your Discord link
        </h1>
        <p className="mt-2 text-gray-400">
          You can obtain it in the email received from Discord. Copy the link
          from the button entitled <strong>You can download it here</strong>.
        </p>
      </div>
      <LinkForm />
    </div>
  );
}
