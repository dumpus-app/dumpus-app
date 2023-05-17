import clsx from "clsx";
import { type ComponentProps, forwardRef, type HTMLAttributes } from "react";

type InternalProps = HTMLAttributes<HTMLDivElement>;

const Skeleton = forwardRef<HTMLDivElement, InternalProps>(function Skeleton(
  { className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={clsx("animate-pulse rounded-lg bg-gray-700", className)}
      {...rest}
    />
  );
});

export type Props = ComponentProps<typeof Skeleton>;

export default Skeleton;
