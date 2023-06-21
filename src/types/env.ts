import { z } from "zod";
import { env } from "../env.mjs";

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof env> {}
  }
}
