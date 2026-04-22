// Vite build configuration for the RawType frontend.
// Wires React and the Cloudflare plugin into the dev/build pipeline.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cloudflare()],
})