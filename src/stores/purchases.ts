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
    if (!isCapacitorSupported()) {
      return finish();
    }

    try {
      // @ts-ignore
      await import("cordova-plugin-purchase");
      const { ProductType, Platform, store } = window.CdvPurchase;

      // Order matters per the cordova-plugin-purchase v13 README:
      //   1. register products
      //   2. attach event handlers
      //   3. initialize the platform adapters
      // The previous order (initialize → register → update) worked on
      // Google Play but on the Apple App Store the adapter queries App
      // Store Connect for the products list at initialize time. With no
      // products registered yet, it queried for nothing, store.get(key)
      // returned undefined, and the dialog showed "Payments not supported"
      // even though the product (id "supporter", App Store Connect ID
      // 6451364202) was approved.
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

      // Populate the products array reactively as the store loads them
      // from each platform. productUpdated fires once per product per
      // refresh; idempotent guard avoids duplicates.
      store.when().productUpdated((product) => {
        set((state) => {
          if (state.purchases.products.some((p) => p.id === product.id)) {
            return state;
          }
          return {
            purchases: {
              ...state.purchases,
              products: [...state.purchases.products, product],
            },
          };
        });
      });

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

      await store.initialize();

      set((state) => ({ purchases: { ...state.purchases, supported: true } }));
    } catch (err) {
      // Surface init failures in the device console so the next time
      // someone reports "Payments not supported" we have a real reason
      // to work from instead of guessing. supported stays false.
      console.error("[purchases] init failed:", err);
    }
    finish();
  },
  restorePurchases: async () => {
    set((state) => ({ purchases: { ...state.purchases, restoring: true } }));
    await window.CdvPurchase.store.restorePurchases();
    set((state) => ({ purchases: { ...state.purchases, restoring: false } }));
  },
});
