import { z } from "zod";

export const env = z
  .object({
    NEXT_PUBLIC_DEPLOY_ENV: z.enum(["web", "desktop", "mobile"]),
    NEXT_PUBLIC_ANALYTICS_WEBSITE_ID: z.string().optional(),
    NEXT_PUBLIC_ANALYTICS_SRC: z.string().url().optional(),
  })
  .refine(
    ({
      NEXT_PUBLIC_DEPLOY_ENV,
      NEXT_PUBLIC_ANALYTICS_SRC,
      NEXT_PUBLIC_ANALYTICS_WEBSITE_ID,
    }) => {
      if (
        process.env.NODE_ENV === "production" &&
        NEXT_PUBLIC_DEPLOY_ENV === "web"
      ) {
        return NEXT_PUBLIC_ANALYTICS_SRC && NEXT_PUBLIC_ANALYTICS_WEBSITE_ID;
      }

      return true;
    },
  );

env.parse(process.env);
