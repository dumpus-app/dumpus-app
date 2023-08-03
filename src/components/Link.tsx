"use client";

import i18next from "i18next";
import NextLink from "next/link";
import { ComponentProps } from "react";

export default function Link(
  props: ComponentProps<typeof NextLink> & { noI18n?: boolean },
) {
  const { href: _href, noI18n = false, ...rest } = props;

  // Handle href
  let href = _href;
  // TODO: remove component
  // const prefix = `/${i18next.language}`;
  // if (!noI18n && typeof href === "string") {
  //   href = prefix + href;
  // }
  // if (
  //   !noI18n &&
  //   typeof href === "object" &&
  //   !href.pathname?.startsWith(prefix)
  // ) {
  //   href.pathname = prefix + href.pathname;
  // }

  return <NextLink href={href} {...rest} />;
}
