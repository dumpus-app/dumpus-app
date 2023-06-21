import { z } from "zod";

export const env = z.object({
  NEXT_PUBLIC_DEPLOY_ENV: z.enum(["web", "desktop", "mobile"]),
});

env.parse(process.env);
