import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [preact()],
  devToolbar: {
    enabled: false,
  },
  security: {
    checkOrigin: true,
  },
});
