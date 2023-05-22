import { useTranslation } from "~/i18n";
import { PageProps } from "~/types";
import Slide1 from "./_components/Slide1";
import Slide2 from "./_components/Slide2";
import Slide3 from "./_components/Slide3";

const SLIDES = [
  {
    image: Slide1,
    title: "What does Dumpus really do?",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a tristique tortor. Fusce gravida tellus eget lorem suscipit.",
  },
  {
    image: Slide2,
    title: "Dumpus is safe",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. GitHub Pellentesque a tristique tortor. Fusce gravida tellus eget lorem suscipit.",
  },
  {
    image: Slide3,
    title: "Share it with your friends!",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a tristique tortor. Fusce gravida tellus eget lorem suscipit.",
  },
];

export function generateStaticParams() {
  return SLIDES.map((_, i) => ({
    slide: (i + 1).toString(),
  }));
}

export default async function Page({
  params: { locale, slide },
}: PageProps<{ slide: string }>) {
  const { t } = await useTranslation(locale);

  const { image: Img, title, description } = SLIDES[Number(slide) - 1];

  return (
    <div className="flex flex-col space-y-4 text-center">
      <Img className="w-full" />
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
