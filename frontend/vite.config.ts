import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["buffer", "process"],
      globals: { Buffer: true, process: true },
    }),
  ],
  build: {
    target: "es2022",
    sourcemap: true,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
