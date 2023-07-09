import mitt from "mitt";
import { purchases } from "~/capacitor";
import type { ProductKey } from "~/capacitor/purchases";

export const emitter = mitt<{
  "purchases:initialized": boolean;
  "purchases:transaction:approved": {
    key: ProductKey;
    product: NonNullable<ReturnType<typeof purchases.getProduct>>;
  };
}>();
