import mitt from "mitt";
import { ProductKey } from "~/stores/purchases";

export const emitter = mitt<{
  "purchases:initialized": boolean;
  "purchases:transaction:approved": {
    key: ProductKey;
  };
}>();
