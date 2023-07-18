"use client";

import Image from "next/image";
import useFocus from "~/hooks/use-focus";

type DiscordImageProps = React.ComponentProps<typeof Image>;

export default function DiscordImage(props: DiscordImageProps) {
  const focused = useFocus();

  const imageSrc =
    typeof props.src === "string" &&
    // ignore placeholders
    !props.src.includes("/embed") &&
    props.src.includes(".gif")
      ? props.src.replace(
          focused ? ".webp" : ".gif",
          focused ? ".gif" : ".webp"
        )
      : props.src;

  // eslint-disable-next-line
  return <Image {...props} src={imageSrc} />;
}
