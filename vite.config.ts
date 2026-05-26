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
  server: { port: 3000 },
})
