import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    copyPublicDir: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000,
    target: "esnext",
    sourcemap: true,
    rollupOptions: {
      input: {
        main: "index.html",
      },
      output: {
        entryFileNames: `js/[name].js`,
        chunkFileNames: `js/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
  define: {
    __PreviewScreen__: false,
    __DEV__: false,
  },
});
