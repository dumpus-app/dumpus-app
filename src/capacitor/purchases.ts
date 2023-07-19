"use client";

import { emitter } from "~/utils/emitter";

const PRODUCT_SUPPORTER_KEY = "supporter";
export type ProductKey = typeof PRODUCT_SUPPORTER_KEY;

let cdv: typeof CdvPurchase;

class PurchasesModule {
  public initialized = false;
  public productsKeys = [PRODUCT_SUPPORTER_KEY] as const;

  constructor() {}

  public async init() {
    if (this.initialized) return;
    // @ts-ignore
    await import("cordova-plugin-purchase");
    cdv = window.CdvPurchase;
    await cdv.store.initialize();
    await this.registerProducts();
    await this.setupListeners();

    this.initialized = true;
    emitter.emit("purchases:initialized", true);
  }

  private async registerProducts() {
    cdv.store.register([
      {
        id: PRODUCT_SUPPORTER_KEY,
        type: cdv.ProductType.NON_CONSUMABLE,
        platform: cdv.Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_SUPPORTER_KEY,
        type: cdv.ProductType.NON_CONSUMABLE,
        platform: cdv.Platform.APPLE_APPSTORE,
      },
    ]);

    await cdv.store.update();
  }

  private async setupListeners() {
    cdv.store.when().approved(async (transaction) => {
      // Can only be one product bought for now
      const productID = transaction.products[0].id as ProductKey;

      emitter.emit("purchases:transaction:approved", {
        key: productID,
        product: await this.getProduct(productID)!,
      });
      await transaction.finish();
    });
  }

  public async getProduct(key: ProductKey) {
    return cdv?.store.get(key);
  }

  public async restorePurchases() {
    await cdv?.store.restorePurchases();
  }
}

export const purchasesSingleton = new PurchasesModule();
