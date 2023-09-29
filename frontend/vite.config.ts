import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from 'vite';

export default ({ mode }) => {

  process.env = {
      ...process.env,
      ...loadEnv(mode, process.cwd())
  };

  return defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
      host: true,
      strictPort: true,
      port: 3000,
    },
});
};