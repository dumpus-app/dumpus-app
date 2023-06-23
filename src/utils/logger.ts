import { createConsola } from "consola";

export function createLogger({
  tag,
  sensible = false,
}: {
  tag: string;
  sensible?: boolean;
}) {
  const consola = createConsola({
    level: sensible
      ? process.env.NODE_ENV === "production"
        ? -999
        : undefined
      : undefined,
  });
  return consola.withTag(tag);
}
