import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 entra como plugin do Vite (jeito novo, sem postcss.config).
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
