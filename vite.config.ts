export default defineConfig({
  base: "/", // or "/your-subdirectory/" if deploying under a subpath
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
});
