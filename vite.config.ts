// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // O dev server roda atrás do proxy do sandbox; sem isto o Vite responde
  // "Blocked request. This host is not allowed."
  vite: {
    server: {
      allowedHosts: [".all-hands.dev", "localhost"],
      // A URL pública é HTTPS. Chamar o Supabase local em http:// seria
      // bloqueado como mixed content; este proxy expõe o Supabase na mesma
      // origem, então o navegador fala https://<host>/supabase/... e o Vite
      // encaminha para o container local.
      proxy: {
        "/supabase": {
          target: "http://127.0.0.1:54321",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/supabase/, ""),
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
