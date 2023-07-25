import { z } from "zod";

export const env = z.object({
  NEXT_PUBLIC_DEPLOY_ENV: z.enum(["web", "desktop", "mobile"]),
  NEXT_PUBLIC_ANALYTICS_WEBSITE_ID: z.string().optional(),
  NEXT_PUBLIC_ANALYTICS_SRC: z.string().url().optional(),
});

env.parse(process.env);
