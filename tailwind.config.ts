import { type Config } from "tailwindcss";
import { palette } from "./src/utils/palette";
import plugin from "tailwindcss/plugin";

export const colors = {
  brand: palette.sky,
  gray: palette.slate,
  danger: palette.rose,
  success: palette.emerald,
  white: "#fff",
  transparent: "transparent",
  inherit: "inherit",
  currentColor: "currentColor",
  yellow: palette.yellow,
  gold: {
    50: "#fcf2e5",
    100: "#e5dbca",
    200: "#d2c3ad",
    300: "#beab8d",
    400: "#aa936e",
    500: "#927955",
    600: "#725e41",
    700: "#51432d",
    800: "#322819",
    900: "#241a0d",
    950: "#150c00",
  },
} satisfies NonNullable<Config["theme"]>["colors"];

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors,
    extend: {
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
      },
      spacing: {
        "safe-area-top-inset": "var(--safe-area-top-inset)",
        "safe-area-right-inset": "var(--safe-area-right-inset)",
        "safe-area-bottom-inset": "var(--safe-area-bottom-inset)",
        "safe-area-left-inset": "var(--safe-area-left-inset)",
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant, addUtilities, theme }) {
      addVariant("no-hover", "@media (hover: none)");
      addUtilities({
        ".desktop-container": {
          marginInline: "auto",
          width: "100%",
          maxWidth: theme("screens.lg"),
        },
      });
    }),
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
