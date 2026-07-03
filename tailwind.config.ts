import type { Config } from 'tailwindcss'

// Paleta de Nuditos — variables CSS definidas en assets/css/tema.css
// (tripletas RGB para soportar modificadores de opacidad). El acento
// (`rosa`/`rosa-pastel`) y el modo claro/oscuro los gestiona tema.client.ts.
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        crema: 'rgb(var(--crema) / <alpha-value>)',
        blanco: 'rgb(var(--blanco) / <alpha-value>)',
        borde: 'rgb(var(--borde) / <alpha-value>)',
        texto: 'rgb(var(--texto) / <alpha-value>)',
        texto2: 'rgb(var(--texto2) / <alpha-value>)',
        rosa: 'rgb(var(--acento) / <alpha-value>)',
        'rosa-pastel': 'rgb(var(--acento-pastel) / <alpha-value>)',
        'verde-bg': 'rgb(var(--verde-bg) / <alpha-value>)',
        'verde-text': 'rgb(var(--verde-text) / <alpha-value>)',
        'durazno-bg': 'rgb(var(--durazno-bg) / <alpha-value>)',
        'durazno-text': 'rgb(var(--durazno-text) / <alpha-value>)',
        celeste: 'rgb(var(--celeste) / <alpha-value>)',
        'poco-bg': 'rgb(var(--poco-bg) / <alpha-value>)',
        'poco-text': 'rgb(var(--poco-text) / <alpha-value>)',
      },
      fontFamily: {
        rounded: ['ui-rounded', 'SF Pro Rounded', 'Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
}
