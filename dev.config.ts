import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    copyPublicDir: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 5000,
    target: "esnext",
    rollupOptions: {
      input: {
        main: "index.html",
      },
    },
  },
  define: {
    __PreviewScreen__: false,
    __DEV__: true,
  },
});
