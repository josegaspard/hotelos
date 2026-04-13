import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/widget.ts"),
      name: "HotelOSWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
