import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project site. The path is case-sensitive.
  // Dev server stays at / so local preview does not need the subpath.
  base: command === "build" ? "/India-fair-share/" : "/",
  server: {
    host: "0.0.0.0",
    port: 4179,
  },
}))
