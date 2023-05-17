import clsx from "clsx";

export type Props = {
  title: string;
  description: string;
  imageSlot: React.ReactNode;
  className?: string;
};

export default function ProfileHeader({
  title,
  description,
  imageSlot,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between bg-gray-900 px-2 py-8",
        className
      )}
    >
      <div>
        <div className="text-gray-400">{description}</div>
        <div className="text-xl font-bold text-white">{title}</div>
      </div>
      <div className="shrink-0">{imageSlot}</div>
    </div>
  );
}
