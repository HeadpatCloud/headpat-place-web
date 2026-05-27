import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import { defineConfig } from "vite"

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
    },
  },
  server: { port: 3000 },
})
