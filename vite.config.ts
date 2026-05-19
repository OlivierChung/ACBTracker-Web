import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'https://acbtracker-api.terralyx.com',
      '/health': 'https://acbtracker-api.terralyx.com',
    },
  },
})
