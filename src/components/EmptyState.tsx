import { Icon } from "~/types";

export default function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: Icon;
}) {
  return (
    <div className="my-auto px-2 py-4 desktop-container sm:py-8">
      <div className="text-center">
        <Icon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-bold text-white sm:text-2xl">
          {title}
        </h3>
        <p className="mt-1 text-gray-400 sm:text-xl">{description}</p>
      </div>
    </div>
  );
}
