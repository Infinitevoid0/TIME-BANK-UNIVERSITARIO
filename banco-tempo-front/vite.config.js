import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Em desenvolvimento, /api vai para a API local; assim o front usa sempre a mesma origem.
// VITE_PROXY_API aponta o proxy para outra pilha (ex.: http://127.0.0.1:8090).
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': process.env.VITE_PROXY_API || 'http://localhost:5067',
    },
  },
})
