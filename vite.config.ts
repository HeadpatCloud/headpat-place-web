import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tanstackStart({
      target: "node-server",
      tsr: { srcDirectory: "src", routesDirectory: "src/routes" },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "#": resolve(__dirname, "./src"),
      "@backend": resolve(__dirname, "../headpat-place-api/src"),
    },
  },
  server: { port: 3000 },
})
