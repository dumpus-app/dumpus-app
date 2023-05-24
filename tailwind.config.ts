import { type Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors: {
      brand: colors.sky,
      gray: colors.slate,
      danger: colors.rose,
      white: "#fff",
      transparent: "transparent",
      inherit: "inherit",
      currentColor: "currentColor",
    },
    extend: {
      animation: {
        "spin-slow": "spin 3s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
