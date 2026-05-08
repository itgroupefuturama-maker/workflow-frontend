import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ tailwindcss(),react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://192.168.1.124:6060',  // Ton serveur
  //       // target : 'https://ecozipo.tailbf0d81.ts.net',
  //       changeOrigin: true,  // Change l'Origin pour matcher
  //       secure: true,  // HTTP local, pas HTTPS
  //       rewrite: (path) => path.replace(/^\/api/, ''),  // Optionnel : enlève /api si besoin
  //     },
  //   },
  // },
})
