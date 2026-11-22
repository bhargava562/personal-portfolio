import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || "https://bhargavaa.dev",
  trailingSlash: "never",
  adapter: cloudflare(),
  integrations: [preact(), sitemap()],
  devToolbar: {
    enabled: false,
  },
  security: {
    checkOrigin: true,
  },
});
