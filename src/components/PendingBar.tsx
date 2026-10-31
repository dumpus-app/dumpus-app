import clsx from "clsx";

/**
 * Fades in after 100 ms, so a quick navigation doesn't flash it. Its parent
 * must be positioned; `className` places it, for eg. `top-0`.
 */
export default function PendingBar({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-x-0 z-10 h-0.5 overflow-hidden transition-opacity duration-150",
        active ? "opacity-100 delay-100" : "opacity-0",
        className,
      )}
    >
      {active && (
        <div className="h-full w-1/3 pending-slide rounded-full bg-brand-300 motion-reduce:w-full" />
      )}
    </div>
  );
}
