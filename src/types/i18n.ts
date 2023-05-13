import enTranslation from "../../locales/en.json";

declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof enTranslation };
  }
}
