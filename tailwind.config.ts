import { type Config } from "tailwindcss";
import { type ThemeConfig } from "tailwindcss/types/config";
import twColors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

export const colors = {
  brand: twColors.sky,
  gray: twColors.slate,
  danger: twColors.rose,
  success: twColors.emerald,
  white: "#fff",
  transparent: "transparent",
  inherit: "inherit",
  currentColor: "currentColor",
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
} satisfies ThemeConfig["colors"];

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
