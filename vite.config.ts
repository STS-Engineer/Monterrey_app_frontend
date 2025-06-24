import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  build: {
    assetsInlineLimit: 0, // Ensure all assets are external files
    manifest: true // Generate manifest.json
  }
});
