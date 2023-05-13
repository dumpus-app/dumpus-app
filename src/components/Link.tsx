"use client";

import i18next from "i18next";
import NextLink from "next/link";
import { ComponentProps } from "react";

export default function Link(
  props: ComponentProps<typeof NextLink> & { noI18n?: boolean }
) {
  const { href, noI18n = false, ...rest } = props;
  return (
    <NextLink href={noI18n ? href : `/${i18next.language}${href}`} {...rest} />
  );
}
