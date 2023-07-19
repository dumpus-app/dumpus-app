import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import Slide1 from "./_components/Slide1";
import Slide2 from "./_components/Slide2";
import Slide3 from "./_components/Slide3";
import RenderMarkdown from "~/components/RenderMarkdown";
import Image from "next/image";

const SLIDES = ["how", "trust", "share"].map((e) => ({ image: e }));

export function generateStaticParams() {
  return SLIDES.map((_, i) => ({
    slide: (i + 1).toString(),
  }));
}

export default async function Page({
  params: { locale, slide },
}: PageProps<{ slide: string }>) {
  const { t } = await useTranslation(locale);

  const index = Number(slide) - 1;
  const slideData = {
    ...(t(`onboarding.slides.${index}`, {
      returnObjects: true,
      defaultValue: "",
    }) as unknown as { title: string; description: string }),
    ...SLIDES[index],
  };
  const { image, title, description } = slideData;

  return (
    <div className="flex flex-col items-center	space-y-4 text-center">
      <Image src={`/assets/${image}.png`} alt="" width={256} height={256} />
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-gray-400">
        <RenderMarkdown content={description} />
      </p>
    </div>
  );
}
