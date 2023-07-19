"use client";

import Image from "next/image";
import useFocus from "~/hooks/use-focus";

type DiscordImageProps = React.ComponentProps<typeof Image>;

export default function DiscordImage(props: DiscordImageProps) {
  const { src, alt, ...rest } = props;
  const focused = useFocus();

  const imageSrc =
    typeof src === "string" &&
    // ignore placeholders
    !src.includes("/embed") &&
    src.includes(".gif")
      ? src.replace(focused ? ".webp" : ".gif", focused ? ".gif" : ".webp")
      : src;

  return <Image {...rest} alt={alt} src={imageSrc} />;
}
