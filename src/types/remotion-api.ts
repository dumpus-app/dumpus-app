import { Prettify } from ".";

export type RemotionAPICreateResponse = Prettify<{ id: string }>;

// https:github.com/nestjs/bull/blob/master/packages/bull/lib/enums/bull-queue-events.enum.ts
export type RemotionAPIStatus =
  | "error"
  | "waiting"
  | "active"
  | "stalled"
  | "progress"
  | "completed"
  | "failed"
  | "paused"
  | "resumed"
  | "cleaned"
  | "drained"
  | "removed";
