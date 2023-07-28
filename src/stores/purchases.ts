import { isCapacitorSupported } from "~/capacitor/utils";
import type { CreateSlice } from ".";
import { emitter } from "~/utils/emitter";

const PRODUCT_SUPPORTER_KEY = "supporter";
export const PRODUCT_KEYS = [PRODUCT_SUPPORTER_KEY] as const;
export type ProductKey = (typeof PRODUCT_KEYS)[number];

type State = {
  initialized: boolean;
  supported: boolean;
  products: CdvPurchase.Product[];
  restoring: boolean;
};

type Actions = {
  init: (props: { notify: (key: string) => void }) => Promise<void>;
  restorePurchases: () => Promise<void>;
};

export type PurchasesSlice = State & Actions;

export const createPurchasesSlice: CreateSlice<PurchasesSlice> = (
  set,
  get,
) => ({
  initialized: false,
  supported: false,
  products: [],
  restoring: false,
  init: async ({ notify }) => {
    function finish() {
      emitter.emit("purchases:initialized", true);
      set((state) => ({
        purchases: { ...state.purchases, initialized: true },
      }));
    }

    if (get().purchases.initialized) return;
    if (!isCapacitorSupported) {
      return finish();
    }

    // @ts-ignore
    await import("cordova-plugin-purchase");
    const { ProductType, Platform, store } = window.CdvPurchase;

    await store.initialize();
    store.register([
      {
        id: PRODUCT_SUPPORTER_KEY,
        type: ProductType.NON_CONSUMABLE,
        platform: Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_SUPPORTER_KEY,
        type: ProductType.NON_CONSUMABLE,
        platform: Platform.APPLE_APPSTORE,
      },
    ]);
    await store.update();

    for (const key of PRODUCT_KEYS) {
      const product = store.get(key);
      if (product) {
        set((state) => ({
          purchases: {
            ...state.purchases,
            products: [...state.purchases.products, product],
          },
        }));
      }
    }

    store.when().approved(async (transaction) => {
      // Can only be one product bought for now
      const productID = transaction.products[0].id as ProductKey;

      emitter.emit("purchases:transaction:approved", {
        key: productID,
      });
      get().config.setPremium(true);
      get().ui.setShowInAppPurchasesDialog(false);
      if (get().ui.showInAppPurchasesDialog || get().purchases.restoring) {
        notify(productID);
      }
      await transaction.finish();
    });

    set((state) => ({ purchases: { ...state.purchases, supported: true } }));
    finish();
  },
  restorePurchases: async () => {
    set((state) => ({ purchases: { ...state.purchases, restoring: true } }));
    await window.CdvPurchase.store.restorePurchases();
    set((state) => ({ purchases: { ...state.purchases, restoring: false } }));
  },
});
