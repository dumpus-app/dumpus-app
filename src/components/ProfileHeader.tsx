import clsx from "clsx";

export type Props = {
  title: string;
  description: string;
  imageSlot: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

export default function ProfileHeader({
  title,
  description,
  imageSlot,
  className,
  children,
}: Props) {
  return (
    <div className="bg-gray-900">
      <div
        className={clsx(
          "relative flex items-center justify-between px-2 py-8 desktop-container sm:flex-row-reverse sm:justify-end sm:py-16",
          className,
        )}
      >
        <div className="sm:ml-4">
          <div className="text-gray-400 sm:text-xl">{description}</div>
          <div className="text-xl font-bold text-white sm:text-3xl">
            {title}
          </div>
        </div>
        <div className="shrink-0">{imageSlot}</div>
        {children}
      </div>
    </div>
  );
}
