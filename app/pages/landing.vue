<script setup lang="ts">
// Landing pública de Nuditos — ruta /landing
// Sin el layout de pestañas y sin exigir sesión.
definePageMeta({ layout: false })

useHead({
  title: 'Nuditos — inventario de hilos para tejedoras',
  meta: [
    { name: 'description', content: 'Tu hilero, tus insumos y tus proyectos en un solo lugar. Nuditos calcula cuántos ovillos te quedan y cuánto material se llevó cada amigurumi.' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&display=swap' },
  ],
})

const DURACION_CARGA = 1900

const cargando = ref(true)
const salirCarga = ref(false)
const ancho = ref(1200)
const amplio = computed(() => ancho.value >= 820)

const variantes: Record<string, string> = {
  up: 'translateY(26px)',
  down: 'translateY(-20px)',
  left: 'translateX(-34px)',
  right: 'translateX(34px)',
  zoom: 'scale(.93)',
  pop: 'translateY(20px) scale(.96)',
  tilt: 'rotate(-2.5deg) translateY(18px) scale(.97)',
  tiltR: 'rotate(2.5deg) translateY(18px) scale(.97)',
  suave: 'translateY(12px)',
}

let observador: IntersectionObserver | null = null
const temporizadores: ReturnType<typeof setTimeout>[] = []

function medir() {
  ancho.value = window.innerWidth
}

function sinMovimiento() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ocultar(el: HTMLElement) {
  if (el.dataset.prep === '1') return
  el.dataset.prep = '1'
  const retraso = Number(el.dataset.delay || 0)
  const salida = variantes[el.dataset.anim || 'up'] || variantes.up
  el.style.transition =
    'opacity 1s cubic-bezier(.22,.86,.26,1), transform 1.05s cubic-bezier(.18,.88,.24,1), filter .9s ease'
  el.style.transitionDelay = retraso + 'ms'
  el.style.opacity = '0'
  if (sinMovimiento()) return
  el.style.transform = salida
  el.style.filter = 'blur(7px)'
  el.style.willChange = 'opacity, transform, filter'
}

function mostrar(el: HTMLElement) {
  el.style.opacity = '1'
  el.style.transform = 'none'
  el.style.filter = 'none'
  setTimeout(() => { el.style.willChange = 'auto' }, 1600)
}

// Cada contenedor con data-stagger anima sus hijos en cascada. El valor
// nombra la variante, o varias alternadas separadas por «|».
function prepararGrupos() {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((cont) => {
    if (cont.dataset.stg === '1') return
    cont.dataset.stg = '1'
    const ciclo = (cont.dataset.stagger || 'up').split('|')
    const paso = Number(cont.dataset.paso || 95)
    let n = 0
    Array.from(cont.children).forEach((hijo) => {
      const el = hijo as HTMLElement
      if (getComputedStyle(el).position === 'absolute') return
      el.setAttribute('data-reveal', '')
      if (!el.dataset.anim) el.dataset.anim = ciclo[n % ciclo.length]
      el.dataset.delay = String(Math.min(n, 7) * paso)
      n++
    })
  })
}

function preparar() {
  prepararGrupos()
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.dataset.shown !== '1') ocultar(el)
  })
}

function observar() {
  if (!observador) {
    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
      el.dataset.shown = '1'
      mostrar(el)
    })
    return
  }
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    if (el.dataset.shown === '1' || el.dataset.obs === '1') return
    el.dataset.obs = '1'
    observador!.observe(el)
  })
}

onMounted(() => {
  medir()
  window.addEventListener('resize', medir)

  temporizadores.push(setTimeout(() => { salirCarga.value = true }, DURACION_CARGA))
  temporizadores.push(setTimeout(() => { cargando.value = false }, DURACION_CARGA + 700))

  if ('IntersectionObserver' in window) {
    observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return
        const el = e.target as HTMLElement
        el.dataset.shown = '1'
        mostrar(el)
        observador!.unobserve(el)
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' })
  }

  // Todo parte escondido detrás de la pantalla de carga; el observador se
  // enciende recién cuando la carga se disuelve, así el hero también anima.
  preparar()
  temporizadores.push(setTimeout(observar, DURACION_CARGA + 250))
})

onBeforeUnmount(() => {
  temporizadores.forEach(clearTimeout)
  window.removeEventListener('resize', medir)
  observador?.disconnect()
})
</script>

<template>
  <div class="nd">
    <div
      v-if="cargando"
      class="nd-carga"
      :style="{ opacity: salirCarga ? 0 : 1 }"
    >
      <div style="position:absolute;top:14%;left:12%;font-size:64px;line-height:1;color:#F6D7E0;animation:nd-gira 22s linear infinite">✿</div>
      <div style="position:absolute;bottom:16%;right:14%;font-size:46px;line-height:1;color:#DCEDD8;animation:nd-giralento 18s linear infinite">❀</div>
      <div style="position:absolute;bottom:22%;left:18%;width:64px;height:64px;border-radius:999px;background:repeating-conic-gradient(from 0deg,#F6D7E0 0deg 22deg,#D6E6F2 22deg 44deg);opacity:.7;animation:nd-float 4.5s ease-in-out infinite"></div>
      <img src="/nuditos-logo.png" alt="Nuditos" style="width:190px;animation:nd-rebote 2.4s ease-in-out infinite">
      <div style="text-align:center">
        <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:40px;letter-spacing:-.02em;color:#C06B86">nuditos</p>
        <p style="margin:4px 0 0;font-size:15px;color:#9A9085">tejiendo tu inventario…</p>
      </div>
      <div style="width:200px;height:10px;border-radius:999px;background:#F1E7DA;overflow:hidden">
        <div style="height:100%;border-radius:999px;background:linear-gradient(90deg,#F6D7E0,#C06B86);animation:nd-hilo 2.1s cubic-bezier(.4,0,.2,1) forwards"></div>
      </div>
    </div>

    <header style="position:sticky;top:0;z-index:90;background:rgba(255,255,255,.82);backdrop-filter:blur(12px);border-bottom:1px solid #ECE3D6">
      <div style="max-width:1160px;margin:0 auto;padding:12px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px">
        <a href="#inicio" style="display:flex;align-items:center;gap:10px;color:inherit">
          <img src="/nuditos-logo.png" alt="" style="width:46px">
          <span style="font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#C06B86">nuditos</span>
        </a>
        <nav v-if="amplio" style="display:flex;align-items:center;gap:26px;font-size:15px;font-weight:700;color:#4A443D">
          <a href="#funciones" style="color:inherit">Funciones</a>
          <a href="#instalar" style="color:inherit">Instalar</a>
          <a href="#precios" style="color:inherit">Precios</a>
        </nav>
        <div style="display:flex;align-items:center;gap:10px">
          <NuxtLink to="/login" style="padding:9px 16px;border-radius:14px;border:1.5px solid #ECE3D6;background:#fff;font-size:14px;font-weight:700;color:#4A443D">Entrar</NuxtLink>
          <NuxtLink to="/login" style="padding:10px 18px;border-radius:14px;background:#C06B86;font-size:14px;font-weight:800;color:#fff;box-shadow:0 6px 16px -6px rgba(192,107,134,.7)">Probar gratis</NuxtLink>
        </div>
      </div>
    </header>

    <section id="inicio" style="position:relative;overflow:hidden;background:linear-gradient(180deg,#FDF8F1 0%,#FBF6EE 55%,#F9EFE6 100%)">
      <div style="position:absolute;inset:0;pointer-events:none">
        <div style="position:absolute;top:3%;right:1%;font-size:clamp(70px,9vw,130px);line-height:1;color:#F6D7E0;animation:nd-gira 26s linear infinite">✿</div>
        <div style="position:absolute;bottom:7%;right:27%;font-size:clamp(50px,6vw,88px);line-height:1;color:#DCEDD8;animation:nd-giralento 20s linear infinite">❀</div>
        <div style="position:absolute;bottom:2%;left:2%;font-size:clamp(38px,4vw,62px);line-height:1;color:#FBE6D6;animation:nd-gira 30s linear infinite">✾</div>
        <div class="nd-nube-a" style="position:absolute;top:9%;right:33%;width:132px;height:52px;border-radius:999px;background:#fff;opacity:.85;animation:nd-float 7s ease-in-out infinite"></div>
        <div class="nd-nube-b" style="position:absolute;top:46%;right:3%;width:96px;height:38px;border-radius:999px;background:#D6E6F2;opacity:.6;animation:nd-float 9s ease-in-out infinite"></div>
        <div style="position:absolute;bottom:16%;right:7%;width:120px;height:60px;border-top-left-radius:999px;border-top-right-radius:999px;border:14px solid #F6D7E0;border-bottom:none;box-shadow:0 0 0 14px #DCEDD8, 0 0 0 28px #FBE6D6;opacity:.75;animation:nd-float 8s ease-in-out infinite"></div>
        <div class="nd-ovillo" style="position:absolute;bottom:1%;left:23%;width:88px;height:88px;border-radius:999px;background:repeating-conic-gradient(from 12deg,#FBE6D6 0deg 20deg,#F6D7E0 20deg 40deg);animation:nd-float2 6.5s ease-in-out infinite"></div>
      </div>

      <div style="position:relative;max-width:1160px;margin:0 auto;padding:clamp(40px,7vw,86px) 22px clamp(52px,7vw,92px);display:flex;flex-wrap:wrap;align-items:center;gap:clamp(24px,3.6vw,56px)">
        <div style="flex:1 1 330px;min-width:0" data-stagger="left|left|suave|pop|suave" data-paso="110">
          <span style="display:inline-block;white-space:nowrap;padding:7px 14px;border-radius:999px;background:#DCEDD8;color:#4E7A4A;font-size:13px;font-weight:800;letter-spacing:.02em">🧶 Para tejedoras que venden</span>
          <h1 style="margin:18px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(40px,6.4vw,74px);line-height:1.02;letter-spacing:-.03em;color:#4A443D;text-wrap:balance">Tú sabes tejer.<br><span style="color:#C06B86">Nuditos sabe cuánto te costó.</span></h1>
          <p style="margin:20px 0 0;font-size:clamp(17px,1.5vw,21px);line-height:1.55;color:#7d7368;max-width:30em;text-wrap:pretty">Tu hilero, tus insumos y tus proyectos en un solo lugar. Registra lo que usas y la app calcula sola cuántos ovillos te quedan y cuánto material se llevó cada amigurumi. Sin planillas, sin adivinar el precio.</p>
          <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px">
            <NuxtLink to="/login" class="nd-alza" style="padding:16px 28px;border-radius:18px;background:#C06B86;color:#fff;font-size:17px;font-weight:800;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)">Crear cuenta gratis</NuxtLink>
            <NuxtLink to="/login" class="nd-alza nd-alza-borde" style="padding:16px 26px;border-radius:18px;background:#fff;border:1.5px solid #ECE3D6;color:#4A443D;font-size:17px;font-weight:800">Entrar a la app</NuxtLink>
          </div>
          <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:8px 20px;font-size:14px;font-weight:600;color:#9A9085">
            <span>✅ 14 días gratis</span><span>✅ Entra con Google</span><span>✅ Nada que descargar</span>
          </div>
        </div>

        <div style="flex:0 1 360px;display:flex;justify-content:center;min-width:0" data-reveal data-anim="zoom">
          <div style="position:relative">
            <div style="position:absolute;inset:-26px -22px;border-radius:60px;background:radial-gradient(circle at 50% 40%,#F6D7E0 0%,rgba(246,215,224,0) 68%);filter:blur(2px)"></div>
            <div style="position:relative;width:clamp(230px,26vw,282px);border-radius:46px;padding:9px;background:linear-gradient(155deg,#5b544c,#2f2a25);box-shadow:0 34px 60px -22px rgba(74,68,61,.55);animation:nd-float 9s ease-in-out infinite">
              <div style="border-radius:38px;overflow:hidden;background:#FBF6EE">
                <img src="/capturas/hilos.jpg" alt="Lista de hilos en Nuditos" style="display:block;width:100%">
              </div>
            </div>
            <div style="position:absolute;transform:rotate(-8deg);bottom:52px;left:-38px;padding:10px 15px;border-radius:16px;background:#fff;border:1.5px solid #ECE3D6;box-shadow:0 12px 26px -14px rgba(74,68,61,.4);font-size:13px;font-weight:800;color:#4E7A4A">47 hilos · 70 ovillos</div>
            <div style="position:absolute;transform:rotate(7deg);top:32%;right:-30px;padding:10px 15px;border-radius:16px;background:#FBE6D6;box-shadow:0 12px 26px -14px rgba(168,92,50,.4);font-size:13px;font-weight:800;color:#A85C32">1 con stock bajo</div>
          </div>
        </div>
      </div>

      <div style="height:28px;background:radial-gradient(circle at 14px 28px,transparent 14px,#4E7A4A 14px) repeat-x;background-size:28px 28px"></div>
    </section>

    <section style="background:#4E7A4A;color:#EAF3E7;padding:16px 0;overflow:hidden">
      <div style="display:flex;width:max-content;animation:nd-marquesina 34s linear infinite">
        <div class="nd-cinta">
          <span>sin planillas</span><span style="opacity:.5">✿</span><span>sin cuadernos perdidos</span><span style="opacity:.5">✿</span><span>sin adivinar el precio</span><span style="opacity:.5">✿</span><span>sin contar ovillos a mano</span><span style="opacity:.5">✿</span><span>sin planillas</span><span style="opacity:.5">✿</span><span>sin cuadernos perdidos</span><span style="opacity:.5">✿</span><span>sin adivinar el precio</span><span style="opacity:.5">✿</span><span>sin contar ovillos a mano</span><span style="opacity:.5">✿</span>
        </div>
        <div class="nd-cinta" aria-hidden="true">
          <span>sin planillas</span><span style="opacity:.5">✿</span><span>sin cuadernos perdidos</span><span style="opacity:.5">✿</span><span>sin adivinar el precio</span><span style="opacity:.5">✿</span><span>sin contar ovillos a mano</span><span style="opacity:.5">✿</span><span>sin planillas</span><span style="opacity:.5">✿</span><span>sin cuadernos perdidos</span><span style="opacity:.5">✿</span><span>sin adivinar el precio</span><span style="opacity:.5">✿</span><span>sin contar ovillos a mano</span><span style="opacity:.5">✿</span>
        </div>
      </div>
    </section>

    <section id="funciones" style="position:relative;padding:clamp(56px,4.5vw,72px) 22px">
      <div style="max-width:1160px;margin:0 auto">
        <div style="max-width:600px" data-stagger="down|up|suave" data-paso="105">
          <span style="display:inline-block;padding:6px 13px;border-radius:999px;background:#F6D7E0;color:#C06B86;font-size:13px;font-weight:800">Qué hace Nuditos</span>
          <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.06;letter-spacing:-.025em">Cinco pestañas, cero cuentas a mano</h2>
          <p style="margin:12px 0 0;font-size:17px;line-height:1.55;color:#7d7368;text-wrap:pretty">Todo lo que registras se conecta: un uso de hilo baja tu inventario, sube el consumo del mes y suma al costo del proyecto. Una sola vez, en un solo lugar.</p>
        </div>

        <div style="margin-top:clamp(20px,2.2vw,28px);display:flex;flex-wrap:wrap;align-items:flex-start;gap:clamp(26px,4vw,52px)" data-reveal>
          <div style="flex:1 1 360px;min-width:0" data-stagger="left|left|suave|suave" data-paso="105">
            <span style="font-size:30px">🧶</span>
            <h3 style="margin:6px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(26px,3vw,38px);line-height:1.1;letter-spacing:-.02em;color:#C06B86">Todo tu hilero, contado</h3>
            <p style="margin:10px 0 0;font-size:17px;line-height:1.55;color:#7d7368;max-width:32em;text-wrap:pretty">Cada hilo con su marca, color, foto y precio. Registras lo que gastaste tejiendo con «− usar» y lo que compraste con «+ reponer». Si le pones peso y metros por ovillo, puedes escribir la cantidad en gramos, metros u ovillos y la app convierte sola.</p>
            <ul style="margin:16px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;font-size:16px;font-weight:600" data-stagger="left" data-paso="90">
              <li style="display:flex;gap:10px"><span style="color:#4E7A4A">✔</span><span>Alerta de <strong>stock bajo</strong> cuando un hilo pasa tu mínimo</span></li>
              <li style="display:flex;gap:10px"><span style="color:#4E7A4A">✔</span><span>Etiquetas propias (algodón, bebé, amigurumi) para filtrar</span></li>
              <li style="display:flex;gap:10px"><span style="color:#4E7A4A">✔</span><span>Buscador por nombre o marca</span></li>
            </ul>
          </div>
          <div class="nd-feature-phone" style="flex:0 1 340px;display:flex;justify-content:center;min-width:0">
            <div style="position:relative">
              <div style="position:absolute;inset:-30px;border-radius:70px;background:radial-gradient(circle at 50% 45%,#DCEDD8 0%,rgba(220,237,216,0) 70%)"></div>
              <div style="position:relative;width:clamp(220px,24vw,266px);border-radius:44px;padding:9px;background:linear-gradient(155deg,#5b544c,#2f2a25);box-shadow:0 28px 50px -20px rgba(74,68,61,.5)">
                <div style="border-radius:36px;overflow:hidden;background:#FBF6EE;max-height:430px">
                  <img src="/capturas/hilos.jpg" alt="Pestaña Hilos" style="display:block;width:100%">
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="nd-cards" style="margin-top:clamp(28px,3vw,40px)" data-stagger="tilt|tiltR" data-paso="130">
          <article class="nd-tarjeta">
            <div style="height:250px;overflow:hidden;background:#FBE6D6;display:flex;justify-content:center;padding-top:18px">
              <div class="nd-mini">
                <img src="/capturas/insumos.jpg" alt="Pestaña Insumos" style="display:block;width:100%">
              </div>
            </div>
            <div style="padding:24px 26px 28px">
              <span style="font-size:26px">🧷</span>
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#A85C32">Ojitos, relleno, cintas</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">Cuatro formas de medir: por unidad, por pares, por peso o por longitud. Los ojitos de seguridad descuentan dos unidades por cada par que uses.</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">El precio va por paquete o por unidad: una bolsa de relleno de 500 g a $20.000 le suma $2.000 al proyecto donde usaste 50 g.</p>
            </div>
          </article>

          <article class="nd-tarjeta">
            <div style="height:250px;overflow:hidden;background:#DCEDD8;display:flex;justify-content:center;padding-top:18px">
              <div class="nd-mini">
                <img src="/capturas/proyectos.jpg" alt="Pestaña Proyectos" style="display:block;width:100%">
              </div>
            </div>
            <div style="padding:24px 26px 28px">
              <span style="font-size:26px">🧺</span>
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#4E7A4A">El costo se arma solo</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">El gasto de un proyecto no se escribe a mano. Cada uso que le asignas suma su valor: hilos, insumos y las horas que le pusiste.</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">Filtra por En progreso, Pausado o Terminado, y al cerrarlo sabes exactamente cuánto costó — el número que necesitas para ponerle precio.</p>
            </div>
          </article>

          <article class="nd-tarjeta">
            <div style="height:250px;overflow:hidden;background:#D6E6F2;display:flex;justify-content:center;padding-top:18px">
              <div class="nd-mini">
                <img src="/capturas/resumen.jpg" alt="Pestaña Resumen" style="display:block;width:100%">
              </div>
            </div>
            <div style="padding:24px 26px 28px">
              <span style="font-size:26px">📊</span>
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#4A7BA6">Cuánto tejiste, cuánto gastaste</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">Consumo y gasto por mes, por hilo, por insumo y por proyecto. Cuántos ovillos tienes en total y cuáles están por acabarse.</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">Cambia el período (este mes, el pasado, los últimos tres) y mira de una qué proyecto se llevó más.</p>
            </div>
          </article>

          <article class="nd-tarjeta">
            <div style="height:250px;overflow:hidden;background:#F6D7E0;display:flex;justify-content:center;padding-top:18px">
              <div class="nd-mini">
                <img src="/capturas/perfil.jpg" alt="Pestaña Perfil" style="display:block;width:100%">
              </div>
            </div>
            <div style="padding:24px 26px 28px">
              <span style="font-size:26px">👤</span>
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#C06B86">A tu gusto</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">Tema claro, oscuro o el del sistema, y cinco colores para la app: rosa, durazno, verde, celeste y lila. Se guarda en tu cuenta, así que se ve igual en todos tus dispositivos.</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">Define el valor de tu hora y Nuditos calcula la mano de obra de cada proyecto.</p>
              <div style="margin-top:16px;display:flex;gap:9px">
                <span style="width:26px;height:26px;border-radius:999px;background:#C06B86"></span>
                <span style="width:26px;height:26px;border-radius:999px;background:#A85C32"></span>
                <span style="width:26px;height:26px;border-radius:999px;background:#4E7A4A"></span>
                <span style="width:26px;height:26px;border-radius:999px;background:#4A7BA6"></span>
                <span style="width:26px;height:26px;border-radius:999px;background:#7B5EA6"></span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section id="instalar" style="position:relative;overflow:hidden;background:#F9EFE6;padding:clamp(60px,8vw,104px) 22px">
      <div style="position:absolute;top:8%;right:6%;font-size:clamp(50px,6vw,90px);line-height:1;color:#F6D7E0;pointer-events:none;animation:nd-giralento 24s linear infinite">❀</div>
      <div class="nd-nube-c" style="position:absolute;bottom:10%;left:5%;width:110px;height:44px;border-radius:999px;background:#fff;opacity:.8;pointer-events:none;animation:nd-float 8s ease-in-out infinite"></div>
      <div style="position:relative;max-width:1000px;margin:0 auto;text-align:center" data-stagger="down|up|suave|up" data-paso="105">
        <span style="display:inline-block;padding:6px 13px;border-radius:999px;background:#DCEDD8;color:#4E7A4A;font-size:13px;font-weight:800">Sin tiendas, sin descargas</span>
        <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.06;letter-spacing:-.025em">Nuditos vive en tu navegador y en tu pantalla de inicio</h2>
        <p style="margin:14px auto 0;max-width:34em;font-size:17px;line-height:1.6;color:#7d7368;text-wrap:pretty">Es una web app: no hay archivo que instalar ni APK que buscar. Entras con tu correo, tu usuario o con Google, y si quieres la dejas como un ícono más en el teléfono.</p>
        <div style="margin-top:38px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;text-align:left" data-stagger="left|pop|right" data-paso="130">
          <div style="border-radius:28px;background:#fff;border:1.5px solid #ECE3D6;padding:26px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px">En iPhone</p>
            <ol style="margin:14px 0 0;padding-left:20px;list-style:decimal;font-size:16px;line-height:1.7;color:#7d7368">
              <li>Abre la web en <strong>Safari</strong>.</li>
              <li>Toca <strong>Compartir</strong>, el cuadrito con la flecha.</li>
              <li>Elige <strong>«Añadir a pantalla de inicio»</strong>.</li>
            </ol>
          </div>
          <div style="border-radius:28px;background:#fff;border:1.5px solid #ECE3D6;padding:26px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px">En Android</p>
            <ol style="margin:14px 0 0;padding-left:20px;list-style:decimal;font-size:16px;line-height:1.7;color:#7d7368">
              <li>Ábrela en <strong>Chrome</strong>.</li>
              <li>Toca <strong>«Instalar aplicación»</strong> cuando aparezca.</li>
              <li>Si no sale, está en el menú de tres puntos.</li>
            </ol>
          </div>
          <div style="border-radius:28px;background:#DCEDD8;padding:26px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px;color:#4E7A4A">En el computador</p>
            <p style="margin:14px 0 0;font-size:16px;line-height:1.7;color:#4A443D">Es la misma cuenta y los mismos datos. Agregas los hilos sentada en el escritorio y registras los usos desde el sofá, con el teléfono.</p>
          </div>
        </div>
      </div>
    </section>

    <section style="padding:clamp(60px,8vw,104px) 22px">
      <div style="max-width:1160px;margin:0 auto">
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:14px" data-reveal>
          <h2 style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(30px,4vw,48px);line-height:1.08;letter-spacing:-.025em">Lo que dicen las tejedoras</h2>
        </div>
        <div style="margin-top:32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px" data-stagger="tilt|zoom|tiltR" data-paso="140">
          <figure style="margin:0;border-radius:30px;background:#F6D7E0;padding:28px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-size:24px;line-height:1.3;letter-spacing:-.01em;color:#8f4a60">«Antes le ponía precio a ojo. Ahora sé que ese conejo me costó $9.400 y cobro tranquila.»</p>
            <figcaption style="margin-top:18px;font-size:15px;font-weight:700;color:#C06B86">katatejidos</figcaption>
          </figure>
          <figure style="margin:0;border-radius:30px;background:#DCEDD8;padding:28px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-size:24px;line-height:1.3;letter-spacing:-.01em;color:#3d6339">«Dejé de comprar hilo repetido. Miro la app en la tienda y ya sé qué me falta.»</p>
            <figcaption style="margin-top:18px;font-size:15px;font-weight:700;color:#4E7A4A">Maira</figcaption>
          </figure>
          <figure style="margin:0;border-radius:30px;background:#D6E6F2;padding:28px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-size:24px;line-height:1.3;letter-spacing:-.01em;color:#3a6484">«Lo de los ojitos por pares me salvó. Nunca me cuadraban las cuentas.»</p>
            <figcaption style="margin-top:18px;font-size:15px;font-weight:700;color:#4A7BA6">Cristian</figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section id="precios" style="position:relative;overflow:hidden;background:#4E7A4A;color:#F4F9F2;padding:clamp(60px,8vw,104px) 22px clamp(70px,8vw,110px)">
      <div style="position:absolute;top:10%;left:5%;font-size:clamp(60px,7vw,110px);line-height:1;color:rgba(255,255,255,.13);pointer-events:none;animation:nd-gira 28s linear infinite">✿</div>
      <div style="position:absolute;bottom:14%;right:7%;font-size:clamp(44px,5vw,80px);line-height:1;color:rgba(255,255,255,.13);pointer-events:none;animation:nd-giralento 22s linear infinite">❀</div>
      <div style="position:relative;max-width:1060px;margin:0 auto">
        <div style="text-align:center" data-stagger="down|up|suave" data-paso="105">
          <span style="display:inline-block;padding:6px 13px;border-radius:999px;background:rgba(255,255,255,.18);font-size:13px;font-weight:800">14 días gratis, sin tarjeta</span>
          <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.06;letter-spacing:-.025em">Cuesta menos que un ovillo al mes</h2>
          <p style="margin:14px auto 0;max-width:32em;font-size:17px;line-height:1.6;color:rgba(244,249,242,.8);text-wrap:pretty">Prueba todo durante dos semanas. Después eliges el plan que te acomode: mientras más largo, más barato el mes.</p>
        </div>

        <div style="margin-top:38px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px" data-stagger="pop" data-paso="110">
          <div style="border-radius:26px;background:#fff;color:#4A443D;padding:24px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">Mensual</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em">$5</span><span style="font-size:14px;color:#9A9085"> USD / mes</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">Para probar sin compromiso</p>
            <NuxtLink to="/plan" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#F6D7E0;color:#C06B86;font-weight:800;font-size:15px">Suscribirme</NuxtLink>
          </div>
          <div style="border-radius:26px;background:#fff;color:#4A443D;padding:24px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">Trimestral</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em">$13</span><span style="font-size:14px;color:#9A9085"> USD / 3 meses</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">≈ $4,33 al mes · <strong style="color:#4E7A4A">ahorras 13%</strong></p>
            <NuxtLink to="/plan" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#F6D7E0;color:#C06B86;font-weight:800;font-size:15px">Suscribirme</NuxtLink>
          </div>
          <div style="border-radius:26px;background:#fff;color:#4A443D;padding:24px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">Semestral</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em">$24</span><span style="font-size:14px;color:#9A9085"> USD / 6 meses</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">≈ $4,00 al mes · <strong style="color:#4E7A4A">ahorras 20%</strong></p>
            <NuxtLink to="/plan" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#F6D7E0;color:#C06B86;font-weight:800;font-size:15px">Suscribirme</NuxtLink>
          </div>
          <div style="position:relative;border-radius:26px;background:#FDF8F1;color:#4A443D;padding:24px;box-shadow:0 0 0 3px #F6D7E0, 0 22px 40px -20px rgba(0,0,0,.4)">
            <span style="position:absolute;top:-11px;right:18px;padding:4px 10px;border-radius:999px;background:#C06B86;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em">Mejor precio</span>
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">Anual</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em;color:#C06B86">$40</span><span style="font-size:14px;color:#9A9085"> USD / año</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">≈ $3,33 al mes · <strong style="color:#4E7A4A">ahorras 33%</strong></p>
            <NuxtLink to="/plan" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#C06B86;color:#fff;font-weight:800;font-size:15px;box-shadow:0 10px 20px -10px rgba(192,107,134,.9)">Suscribirme</NuxtLink>
          </div>
        </div>

        <div style="margin-top:26px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;border-radius:26px;background:rgba(255,255,255,.12);padding:22px 26px" data-reveal>
          <div style="flex:1 1 340px;min-width:0;display:flex;align-items:center;gap:16px">
            <span style="flex:none;font-size:38px;line-height:1">💛</span>
            <div style="min-width:0">
              <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px">¿Tienes una embajadora favorita?</p>
              <p style="margin:6px 0 0;font-size:15px;line-height:1.55;color:rgba(244,249,242,.82)">Usa su código dentro de la app y te regalamos 30 días de acceso.</p>
            </div>
          </div>
        </div>
        <p style="margin:18px 0 0;text-align:center;font-size:13px;color:rgba(244,249,242,.65)">Pago seguro procesado por Lemon Squeezy. Puedes cancelar cuando quieras.</p>
      </div>
    </section>

    <section style="position:relative;overflow:hidden;padding:clamp(64px,8vw,110px) 22px;text-align:center">
      <div style="position:absolute;top:12%;left:12%;width:76px;height:76px;border-radius:999px;background:repeating-conic-gradient(from 20deg,#F6D7E0 0deg 20deg,#FBE6D6 20deg 40deg);pointer-events:none;animation:nd-float2 7s ease-in-out infinite"></div>
      <div style="position:absolute;bottom:18%;right:12%;font-size:clamp(46px,5vw,80px);line-height:1;color:#DCEDD8;pointer-events:none;animation:nd-gira 26s linear infinite">✿</div>
      <div style="position:relative;max-width:720px;margin:0 auto" data-stagger="zoom|up|suave|pop" data-paso="115">
        <img src="/nuditos-logo.png" alt="" style="width:120px;animation:nd-float 6s ease-in-out infinite">
        <h2 style="margin:18px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(34px,5vw,58px);line-height:1.04;letter-spacing:-.03em">La próxima vez que te pregunten el precio, tú ya lo sabes</h2>
        <p style="margin:14px 0 0;font-size:18px;line-height:1.6;color:#7d7368">Empieza con 14 días gratis. Sin tarjeta, sin descargar nada.</p>
        <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
          <NuxtLink to="/login" class="nd-alza" style="padding:16px 30px;border-radius:18px;background:#C06B86;color:#fff;font-size:17px;font-weight:800;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)">Crear cuenta gratis</NuxtLink>
          <NuxtLink to="/login" class="nd-alza nd-alza-borde" style="padding:16px 28px;border-radius:18px;background:#fff;border:1.5px solid #ECE3D6;color:#4A443D;font-size:17px;font-weight:800">Entrar con Google</NuxtLink>
        </div>
      </div>
    </section>

    <footer style="background:#fff;border-top:1px solid #ECE3D6;padding:44px 22px 36px">
      <div style="max-width:1160px;margin:0 auto;display:flex;flex-wrap:wrap;gap:28px;justify-content:space-between;align-items:flex-start" data-stagger="left|right" data-paso="130">
        <div style="flex:0 1 300px">
          <div style="display:flex;align-items:center;gap:10px">
            <img src="/nuditos-logo.png" alt="" style="width:42px">
            <span style="font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:24px;color:#C06B86">nuditos</span>
          </div>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#9A9085">Inventario de hilos, insumos y costos reales para tejedoras. Tus datos viajan contigo entre el teléfono y el computador.</p>
        </div>
        <nav style="display:flex;flex-wrap:wrap;gap:36px;font-size:14px;line-height:2" data-stagger="suave" data-paso="95">
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:800;color:#4A443D;margin-bottom:4px">Producto</span>
            <a href="#funciones">Funciones</a>
            <a href="#instalar">Instalar</a>
            <a href="#precios">Precios</a>
          </div>
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:800;color:#4A443D;margin-bottom:4px">Ayuda</span>
            <NuxtLink to="/ayuda">Centro de ayuda</NuxtLink>
            <a href="mailto:cristianvabusiness@gmail.com?subject=Ayuda%20con%20Nuditos">Escribir a soporte</a>
          </div>
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:800;color:#4A443D;margin-bottom:4px">Legal</span>
            <NuxtLink to="/terminos">Términos</NuxtLink>
            <NuxtLink to="/privacidad">Privacidad</NuxtLink>
            <NuxtLink to="/reembolsos">Reembolsos</NuxtLink>
          </div>
        </nav>
      </div>
      <p style="max-width:1160px;margin:32px auto 0;padding-top:20px;border-top:1px solid #ECE3D6;font-size:13px;color:#9A9085">© 2026 Nuditos · Hecho con hilo y cariño 🧶</p>
    </footer>
  </div>
</template>

<style scoped>
.nd {
  background: #FBF6EE;
  color: #4A443D;
  font-family: Nunito, ui-rounded, 'SF Pro Rounded', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.nd :deep(*) { box-sizing: border-box; }
.nd a { color: #C06B86; text-decoration: none; }
.nd a:hover { color: #A85C32; }
.nd img { max-width: 100%; }

.nd-carga {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 26px;
  background: #FBF6EE;
  transition: opacity .65s ease;
}

.nd-cinta {
  display: flex;
  align-items: center;
  gap: 26px;
  flex: none;
  padding-right: 26px;
  font-family: 'Baloo 2', Nunito, sans-serif;
  font-weight: 700;
  font-size: clamp(18px, 2vw, 26px);
  white-space: nowrap;
}

.nd-tarjeta {
  display: flex;
  flex-direction: column;
  border-radius: 32px;
  background: #fff;
  border: 1.5px solid #ECE3D6;
  overflow: hidden;
  box-shadow: 0 18px 40px -28px rgba(74, 68, 61, .45);
}
.nd-mini {
  width: 200px;
  border-top-left-radius: 26px;
  border-top-right-radius: 26px;
  overflow: hidden;
  border: 7px solid #2f2a25;
  border-bottom: none;
  background: #FBF6EE;
}

/* Cards de funciones: 1 col en móvil, 2 en tablet, 4 en escritorio */
.nd-cards {
  display: grid;
  gap: clamp(20px, 2.4vw, 30px);
  grid-template-columns: 1fr;
}
@media (min-width: 600px) {
  .nd-cards { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .nd-cards { grid-template-columns: repeat(4, 1fr); }
}

/* En escritorio sube el teléfono de la primera función para alinearlo
   con el texto de la izquierda (arriba). En móvil se apila normal. */
@media (min-width: 900px) {
  .nd-feature-phone { margin-top: -170px; }
}

.nd-alza { transition: transform .25s ease, border-color .25s ease; }
.nd-alza:hover { transform: translateY(-3px); }
.nd-alza-borde:hover { border-color: #C06B86; }

/* Nubes puffy: los bultos son pseudo-elementos */
.nd-nube-a::before {
  content: ''; position: absolute; left: 16px; top: -24px;
  width: 58px; height: 58px; border-radius: 999px; background: #fff;
}
.nd-nube-a::after {
  content: ''; position: absolute; right: 14px; top: -38px;
  width: 44px; height: 44px; border-radius: 999px; background: #fff;
}
.nd-nube-b::before {
  content: ''; position: absolute; left: 14px; top: -18px;
  width: 44px; height: 44px; border-radius: 999px; background: #D6E6F2;
}
.nd-nube-c::before {
  content: ''; position: absolute; left: 14px; top: -20px;
  width: 50px; height: 50px; border-radius: 999px; background: #fff;
}
/* La aguja cruzando el ovillo */
.nd-ovillo::after {
  content: ''; position: absolute; left: -30px; top: 38px;
  width: 130px; height: 9px; border-radius: 999px;
  background: #C79A6B; transform: rotate(-24deg);
}
</style>

<style>
/* Animaciones continuas — globales porque las usan elementos con estilo inline */
@keyframes nd-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
@keyframes nd-float2 { 0%, 100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-20px) rotate(4deg) } }
@keyframes nd-gira { from { transform: rotate(0) } to { transform: rotate(360deg) } }
@keyframes nd-giralento { from { transform: rotate(0) } to { transform: rotate(-360deg) } }
@keyframes nd-marquesina { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes nd-rebote { 0%, 100% { transform: translateY(0) rotate(-4deg) } 50% { transform: translateY(-22px) rotate(6deg) } }
@keyframes nd-hilo { 0% { width: 8% } 55% { width: 82% } 100% { width: 100% } }
</style>
