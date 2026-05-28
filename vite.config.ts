import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import mdx from "@mdx-js/rollup"
import tailwindcss from "@tailwindcss/vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tanstackStart(),
    { enforce: "pre", ...mdx() },
    viteReact(),
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
