import { type Config } from "tailwindcss";
import colors from "tailwindcss/colors";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    colors: {
      primary: colors.sky,
      gray: colors.slate,
      danger: colors.rose,
      white: "#fff",
      transparent: "transparent",
      inherit: "inherit",
      currentColor: "currentColor",
    },
  },
  plugins: [],
} satisfies Config;
