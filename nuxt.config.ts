// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  supabase: {
    // Sin tipos generados por ahora; se pueden generar luego con `supabase gen types`.
    types: false,
    // Defaults del módulo: redirige a /login si no hay sesión y usa /confirm
    // como callback de OAuth.
  },
  app: {
    head: {
      title: 'Nuditos — tu inventario de hilos',
      htmlAttrs: { lang: 'es' },
    },
  },
})
