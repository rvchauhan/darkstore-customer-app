import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite as tanstackRouter } from "@tanstack/router-plugin/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain client-side SPA — no TanStack Start/SSR, no Lovable preset.
// Same TanStack Router (file-based routes) + Tailwind v4 + shadcn/ui stack as
// dark-store-portal, just without the platform-specific SSR wrapper.
export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  server: {
    port: 5174,
  },
});
