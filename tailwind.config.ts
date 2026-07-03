import type { Config } from 'tailwindcss'

// Paleta de Nuditos — misma que NuditosColors en la app iOS.
export default <Partial<Config>>{
  theme: {
    extend: {
      colors: {
        crema: '#FBF6EE',
        borde: '#ECE3D6',
        texto: '#4A443D',
        texto2: '#9A9085',
        rosa: '#C06B86',
        'rosa-pastel': '#F6D7E0',
        'verde-bg': '#DCEDD8',
        'verde-text': '#4E7A4A',
        'durazno-bg': '#FBE6D6',
        'durazno-text': '#A85C32',
        celeste: '#D6E6F2',
        'poco-bg': '#FBE0D6',
        'poco-text': '#B5532A',
      },
      fontFamily: {
        rounded: ['ui-rounded', 'SF Pro Rounded', 'Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
}
