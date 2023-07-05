"use client";

import "cordova-plugin-purchase";

class PurchasesModule {
  private PRODUCT_SUPPORTER_TEST_KEY = "supporter_test";
  // @ts-ignore
  private CdvPurchase: typeof CdvPurchase;

  public initialized = false;
  public onSupporterTestApproved = () => {};

  constructor() {}

  public async init() {
    if (!window.CdvPurchase) setTimeout(this.init, 100);
    else {
      this.CdvPurchase = window.CdvPurchase;
      await this.CdvPurchase.store.initialize([
        this.CdvPurchase.Platform.GOOGLE_PLAY,
      ]);
      await this.registerProducts();
      await this.setupListeners();

      this.initialized = true;
    }
  }

  private async registerProducts() {
    this.CdvPurchase.store.register([
      {
        id: this.PRODUCT_SUPPORTER_TEST_KEY,
        type: this.CdvPurchase.ProductType.NON_CONSUMABLE,
        platform: this.CdvPurchase.Platform.GOOGLE_PLAY,
      },
    ]);

    await this.CdvPurchase.store.update();
  }

  private async setupListeners() {
    this.CdvPurchase.store
      .when()
      .approved((transaction) => {
        // Can only be one product bought for now
        const productID = transaction.products[0].id;

        if (productID === this.PRODUCT_SUPPORTER_TEST_KEY) {
          this.onSupporterTestApproved();
        }
        return transaction.verify();
      })
      .verified((receipt) => receipt.finish());
  }

  public getProduct() {
    return this.CdvPurchase.store.get(this.PRODUCT_SUPPORTER_TEST_KEY)!;
  }
}

const purchases = new PurchasesModule();
export default purchases;
