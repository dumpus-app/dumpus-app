import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import PageHeader from "./PageHeader";

export default async function Page({ params: { locale } }: PageProps) {
  const { t } = await useTranslation(locale);

  return (
    <>
      <PageHeader />
      <div>Stats</div>
      <div className="text-4xl">
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Non
        voluptatibus nobis id sed ab, optio error necessitatibus molestias eaque
        autem neque. Et iure similique a necessitatibus, voluptate corporis eum
        molestias, consequatur magni libero temporibus odit porro esse veritatis
        excepturi consequuntur impedit, delectus fugiat iusto sint error!
        Deleniti odit ducimus natus.
      </div>
    </>
  );
}
