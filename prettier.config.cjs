/** @type {import("prettier").Config} */
const config = {
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
  // Tailwind 4 has no config file of its own to find: the stylesheet that
  // imports it says which classes exist and in what order to sort them.
  tailwindStylesheet: "./src/app/_css/globals.css",
};

module.exports = config;
