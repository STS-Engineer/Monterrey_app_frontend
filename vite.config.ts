import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  base: "/",
  plugins: [
    react({
      jsxImportSource: "@emotion/react", // If using Emotion (optional)
      babel: {
        plugins: ["@emotion/babel-plugin"], // If using Emotion (optional)
      },
    }),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
      include: "**/*.svg", // Explicitly process SVGs
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json"], // Help Vite resolve files
  },
  server: {
    port: 3000,
    strictPort: true, // Avoid fallback to other ports
    headers: {
      "Content-Type": "application/javascript", // Force correct MIME
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"], // Pre-bundle key deps
  },
  esbuild: {
    loader: "tsx", // Ensure TSX files are processed
  },
});
