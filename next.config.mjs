/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  distDir: "dist",
  experimental: {
    typedRoutes: true,
  },
};

export default config;
