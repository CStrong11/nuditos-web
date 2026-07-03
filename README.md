# Nuditos Web

Versión web de **Nuditos**, la app de inventario de hilos. Comparte el mismo
backend de Supabase que la app iOS (`nuditos-ios`): tablas, vistas, RPCs,
Storage y usuarios son los mismos.

## Stack

- [Nuxt 4](https://nuxt.com) + Vue 3
- [@nuxtjs/supabase](https://supabase.nuxtjs.org) — auth y datos (el módulo
  redirige a `/login` sin sesión y usa `/confirm` como callback de OAuth)
- [Tailwind CSS](https://tailwindcss.com) — paleta de la app iOS en
  `tailwind.config.ts` (crema/rosa/verde/durazno/celeste)

## Desarrollo

```bash
npm install
cp .env.example .env   # claves públicas de Supabase
npm run dev            # http://localhost:3000
```

## Login

- Correo o **username** + contraseña (el username se resuelve con el RPC
  `email_por_username`, igual que en iOS).
- Google OAuth — requiere agregar `http://localhost:3000/confirm` (y la URL
  de producción `/confirm`) en Supabase → Authentication → URL Configuration
  → Redirect URLs.

## Deploy

Cualquier host con soporte Nuxt/Nitro (Vercel, Netlify, Cloudflare Pages).
Definir `SUPABASE_URL` y `SUPABASE_KEY` como variables de entorno.
