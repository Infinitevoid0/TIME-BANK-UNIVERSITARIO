import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em desenvolvimento, /api vai para a API local; assim o front usa sempre a mesma origem.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5067',
    },
  },
})
