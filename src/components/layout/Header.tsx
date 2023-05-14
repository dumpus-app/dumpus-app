import clsx from "clsx";

export type Props = {
  title?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
  className?: string;
};

export default function Header({
  title,
  leftSlot,
  rightSlot,
  transparent = false,
  className,
}: Props) {
  return (
    <header
      className={clsx(
        "relative flex h-12 items-center justify-center px-2 py-2",
        transparent ? "" : "bg-gray-900",
        className
      )}
    >
      {leftSlot && <div className="absolute left-2">{leftSlot}</div>}
      {title && <div className="text-xl font-bold text-white">{title}</div>}
      {rightSlot && <div className="absolute right-2">{rightSlot}</div>}
    </header>
  );
}
