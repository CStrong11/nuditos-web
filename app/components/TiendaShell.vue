<script setup lang="ts">
// Marco de la tienda con el mundo visual del landing: crema fija (no depende
// del tema de la app), fuentes Baloo 2 / Nunito, navbar y footer consistentes.
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap' },
  ],
})

const reqUrl = useRequestURL()
const enProd = reqUrl.hostname.endsWith('nuditoscol.com')
const appUrl = (p: string) => (enProd ? 'https://app.nuditoscol.com' : '') + p

const menuAbierto = ref(false)
const ancho = ref(1200)
const amplio = computed(() => ancho.value >= 820)
function medir() { ancho.value = window.innerWidth }
onMounted(() => { medir(); window.addEventListener('resize', medir) })
onBeforeUnmount(() => window.removeEventListener('resize', medir))
</script>

<template>
  <div class="tienda">
    <header style="position:sticky;top:0;z-index:90;background:rgba(255,255,255,.82);backdrop-filter:blur(12px);border-bottom:1px solid #ECE3D6">
      <div style="max-width:1160px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px">
        <a href="/" style="display:flex;align-items:center;gap:10px;color:inherit">
          <img src="/nuditos-logo.png" alt="" style="width:46px">
          <span style="font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#C06B86">nuditos</span>
        </a>

        <nav v-if="amplio" style="display:flex;align-items:center;gap:26px;font-size:15px;font-weight:700;color:#4A443D">
          <a href="/#funciones" style="color:inherit">Funciones</a>
          <a href="/#precios" style="color:inherit">Precios</a>
          <NuxtLink to="/tienda-de-patrones" style="color:#C06B86">Tienda</NuxtLink>
        </nav>

        <div style="display:flex;align-items:center;gap:10px">
          <NuxtLink v-if="amplio" :to="appUrl('/login')" class="t-alza t-borde" style="padding:9px 16px;border-radius:14px;border:1.5px solid #ECE3D6;background:#fff;font-size:14px;font-weight:700;color:#4A443D">Entrar</NuxtLink>
          <NuxtLink v-if="amplio" :to="appUrl('/login')" class="t-alza" style="padding:10px 18px;border-radius:14px;background:#C06B86;font-size:14px;font-weight:800;color:#fff;box-shadow:0 6px 16px -6px rgba(192,107,134,.7)">Probar gratis</NuxtLink>
          <button v-if="!amplio" aria-label="Menú" style="display:flex;padding:8px;border-radius:12px;border:1.5px solid #ECE3D6;background:#fff" @click="menuAbierto = !menuAbierto">
            <svg v-if="!menuAbierto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A443D" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A443D" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>

      <div v-if="!amplio && menuAbierto" style="border-top:1px solid #ECE3D6;background:#fff;padding:10px 22px 18px">
        <a href="/#funciones" style="display:block;padding:12px 4px;font-size:16px;font-weight:700;color:#4A443D" @click="menuAbierto = false">Funciones</a>
        <a href="/#precios" style="display:block;padding:12px 4px;font-size:16px;font-weight:700;color:#4A443D" @click="menuAbierto = false">Precios</a>
        <NuxtLink to="/tienda-de-patrones" style="display:block;padding:12px 4px 16px;font-size:16px;font-weight:700;color:#C06B86;border-bottom:1px solid #ECE3D6;margin-bottom:14px" @click="menuAbierto = false">Tienda</NuxtLink>
        <NuxtLink :to="appUrl('/login')" style="display:block;text-align:center;padding:12px;border-radius:14px;border:1.5px solid #ECE3D6;background:#fff;font-size:15px;font-weight:700;color:#4A443D;margin-bottom:10px" @click="menuAbierto = false">Entrar</NuxtLink>
        <NuxtLink :to="appUrl('/login')" style="display:block;text-align:center;padding:13px;border-radius:14px;background:#C06B86;font-size:15px;font-weight:800;color:#fff" @click="menuAbierto = false">Probar gratis</NuxtLink>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer style="background:#fff;border-top:1px solid #ECE3D6;padding:34px 22px;margin-top:40px">
      <div style="max-width:1160px;margin:0 auto;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
        <a href="/" style="display:flex;align-items:center;gap:10px;color:inherit">
          <img src="/nuditos-logo.png" alt="" style="width:38px">
          <span style="font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px;color:#C06B86">nuditos</span>
        </a>
        <nav style="display:flex;flex-wrap:wrap;gap:20px;font-size:14px;font-weight:600;color:#7d7368">
          <NuxtLink to="/terminos">Términos</NuxtLink>
          <NuxtLink to="/privacidad">Privacidad</NuxtLink>
          <NuxtLink to="/reembolsos">Reembolsos</NuxtLink>
          <NuxtLink to="/ayuda">Ayuda</NuxtLink>
        </nav>
        <p style="margin:0;font-size:13px;color:#A69C90">© 2026 Nuditos</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tienda {
  min-height: 100vh;
  background: linear-gradient(180deg, #FDF8F1 0%, #FBF6EE 55%, #F9EFE6 100%);
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #4A443D;
}
.t-alza { transition: transform .18s ease, box-shadow .18s ease; }
.t-alza:hover { transform: translateY(-2px); }
.tienda :deep(a) { text-decoration: none; }
.tienda :deep(.t-link:hover) { color: #C06B86; }
</style>
