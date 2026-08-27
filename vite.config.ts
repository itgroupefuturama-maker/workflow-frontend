import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [tailwindcss(), react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      allowedHosts: ['serveur'],
      // Proxy dev uniquement (n'existe pas sur le build de prod) : rend les appels API
      // same-origin du point de vue du navigateur. Nécessaire quand le backend tourne sur une
      // autre machine (ex. via Tailscale) — sinon les cookies SameSite=Lax d'auth ne sont jamais
      // attachés aux requêtes XHR/fetch cross-site, seulement posés au login. Actif seulement si
      // VITE_API_PROXY_URL=/api est défini dans .env.local (voir src/service/env.ts).
      proxy: env.VITE_API_PROXY_URL === '/api' ? {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (requestPath: string) => requestPath.replace(/^\/api/, ''),
          // refresh_token est posé par le backend avec Path=/auth (restriction côté serveur, sur
          // l'URL réelle sans le préfixe /api). Vu du navigateur, la requête passe par /api/auth/...
          // — sans réécriture, le cookie est posé sur un chemin que le navigateur ne redemandera
          // jamais via le proxy, donc jamais renvoyé (voire jamais stocké visiblement).
          cookiePathRewrite: { '/auth': '/api/auth' },
        },
      } : undefined,
    },
  };
})
