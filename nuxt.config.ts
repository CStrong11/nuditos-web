// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  css: ['~/assets/css/tema.css'],
  supabase: {
    // Sin tipos generados por ahora; se pueden generar luego con `supabase gen types`.
    types: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // Páginas públicas: legales y ayuda (contenido estático, sin datos de usuario).
      exclude: ['/terminos', '/privacidad', '/reembolsos', '/ayuda'],
    },
  },
  app: {
    head: {
      title: 'Nuditos — tu inventario de hilos',
      htmlAttrs: { lang: 'es' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        // iOS: abrir en pantalla completa al añadir a inicio
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Nuditos' },
        { name: 'theme-color', content: '#FBF6EE' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'Nuditos — tu inventario de hilos',
      short_name: 'Nuditos',
      description: 'Inventario de hilos, proyectos de tejido y gastos',
      lang: 'es',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      background_color: '#FBF6EE',
      theme_color: '#FBF6EE',
      icons: [
        { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Cachear el shell de la app; los datos siguen viniendo de Supabase en vivo.
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      navigateFallbackDenylist: [/^\/confirm/],
    },
    client: {
      installPrompt: true,
    },
  },
})
