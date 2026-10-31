import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextCoreWebVitals,
  {
    // React Compiler rules from `eslint-plugin-react-hooks` 7, off until the
    // hooks that set state in an effect after mount, and `Flag`, which
    // creates its component while rendering, are reworked.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
]);
