import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `vite dev` runs the React app and the Cloudflare Worker (API + D1) together in workerd.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
});
