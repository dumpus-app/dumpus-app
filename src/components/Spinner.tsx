import clsx from "clsx";

/**
 * Its rotation runs on the compositor, so it keeps turning while a query
 * holds the main thread.
 */
export default function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-block size-4 shrink-0 spinner rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
