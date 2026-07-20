<script setup lang="ts">
useHead({ title: 'Ayuda — Nuditos' })

const abierta = ref<string | null>('empezar')
function alternar(id: string) {
  abierta.value = abierta.value === id ? null : id
}

const secciones = [
  { id: 'empezar', icono: '🚀', titulo: 'Primeros pasos' },
  { id: 'hilos', icono: '🧶', titulo: 'Hilos: agregar, usar y reponer' },
  { id: 'insumos', icono: '🧷', titulo: 'Insumos', nuevo: true },
  { id: 'proyectos', icono: '🧺', titulo: 'Proyectos y cuánto gastaste' },
  { id: 'resumen', icono: '📊', titulo: 'Resumen y estadísticas' },
  { id: 'perfil', icono: '👤', titulo: 'Tu perfil y la apariencia' },
  { id: 'instalar', icono: '📱', titulo: 'Instalar la app en tu teléfono' },
  { id: 'faq', icono: '❓', titulo: 'Preguntas frecuentes' },
]
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center gap-3">
      <NuxtLink to="/perfil" class="text-texto2">←</NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-rosa">Ayuda</h1>
        <p class="text-sm text-texto2">Tutoriales y respuestas rápidas</p>
      </div>
    </header>

    <div class="space-y-3">
      <section
        v-for="s in secciones" :key="s.id"
        class="overflow-hidden rounded-2xl border border-borde bg-blanco"
      >
        <button
          class="flex w-full items-center gap-3 p-4 text-left"
          @click="alternar(s.id)"
        >
          <span class="text-xl">{{ s.icono }}</span>
          <span class="flex-1 font-semibold">
            {{ s.titulo }}
            <span
              v-if="s.nuevo"
              class="ml-1.5 rounded-full bg-rosa px-1.5 py-px text-[9px] font-bold uppercase text-white"
            >
              new
            </span>
          </span>
          <span class="text-texto2 transition" :class="abierta === s.id ? 'rotate-180' : ''">⌄</span>
        </button>

        <div v-if="abierta === s.id" class="ayuda border-t border-borde px-4 pb-5 pt-4">
          <!-- Primeros pasos -->
          <template v-if="s.id === 'empezar'">
            <p>¡Bienvenida a Nuditos! Esta app te ayuda a saber <strong>qué materiales tienes, cuánto usaste y cuánto te costó cada proyecto</strong>.</p>
            <p>Te sugerimos empezar así:</p>
            <ol>
              <li>Agrega tus <strong>hilos</strong> desde la pestaña Hilos → «+ Nuevo hilo».</li>
              <li>Agrega tus <strong>insumos</strong> (ojitos, rellenos, etiquetas…) en la pestaña Insumos.</li>
              <li>Crea un <strong>proyecto</strong> en la pestaña Proyectos.</li>
              <li>Cada vez que tejas, registra lo que gastaste con el botón <strong>«− usar»</strong> y asígnalo a ese proyecto.</li>
            </ol>
            <p>Con eso, la app calcula sola tu inventario, tu consumo y el costo de cada proyecto.</p>
          </template>

          <!-- Hilos -->
          <template v-else-if="s.id === 'hilos'">
            <h3>Agregar un hilo</h3>
            <p>Pestaña <strong>Hilos</strong> → «+ Nuevo hilo». Solo el nombre es obligatorio, pero mientras más completes, más te sirve la app.</p>

            <div class="tip">
              <strong>💡 El dato más importante:</strong> llena <strong>«Peso por ovillo»</strong> y <strong>«Metros por ovillo»</strong> junto con el <strong>precio</strong>. Sin ellos la app no puede calcular cuántos ovillos te quedan ni cuánto dinero llevas gastado en cada proyecto.
            </div>

            <h3>Usar y reponer</h3>
            <p>Desde la lista (botones «− usar» / «+ reponer») o desde el detalle del hilo:</p>
            <ul>
              <li><strong>Usar</strong>: registras lo que gastaste tejiendo. Ojo: se ingresa <em>lo que usaste</em>, no lo que te queda.</li>
              <li><strong>Reponer</strong>: cuando compras más del mismo hilo.</li>
            </ul>
            <p>Si el hilo tiene datos de ovillo, puedes escribir la cantidad en <strong>gramos, metros u ovillos</strong> y la app convierte sola. Te muestra la equivalencia antes de confirmar.</p>

            <h3>Alerta de stock bajo</h3>
            <p>Al crear o editar un hilo puedes definir un <strong>«Stock mínimo»</strong> (en gramos/metros o en ovillos). Cuando el hilo baje de ese número, verás un ícono rojo <strong>«!»</strong> sobre su foto y un aviso en el detalle.</p>
            <p class="nota">Si nunca defines un stock mínimo, no aparecerá ninguna alerta para ese hilo.</p>

            <h3>Etiquetas</h3>
            <p>Puedes etiquetar tus hilos (por ejemplo «algodón», «bebé», «amigurumi») y luego filtrarlos en la lista tocando la etiqueta.</p>
          </template>

          <!-- Insumos -->
          <template v-else-if="s.id === 'insumos'">
            <p>Los <strong>insumos</strong> son todo lo que no es hilo pero también usas: ojitos de seguridad, rellenos, etiquetas, cajitas, cintas, cierres…</p>
            <p>Al crear uno, solo el <strong>nombre</strong> es obligatorio. La marca, el color, la foto, el precio y la descripción son <strong>opcionales</strong>: puedes llenarlos cuando quieras.</p>

            <h3>Las 4 formas de medir</h3>
            <p>Eliges cómo llevar su inventario:</p>
            <ul>
              <li><strong>Por unidad</strong> — etiquetas, cajitas, cierres.</li>
              <li><strong>Por pares</strong> — ojitos de seguridad. Cada par que uses descuenta 2 unidades del inventario.</li>
              <li><strong>Por peso</strong> — rellenos y fibra. Eliges gramos o kilos.</li>
              <li><strong>Por longitud</strong> — cintas y elásticos. Eliges metros o centímetros.</li>
            </ul>

            <h3>Precio: por paquete o por unidad</h3>
            <p>Para que el insumo sume al costo de tus proyectos, puedes indicar su precio de dos maneras:</p>
            <ul>
              <li><strong>Por paquete</strong> — dices cuánto trae un paquete y cuánto costó; la app calcula el precio de cada unidad.</li>
              <li><strong>Por unidad</strong> — si no sabes el precio del paquete, escribes directamente cuánto vale una unidad.</li>
            </ul>
            <div class="tip">
              <strong>Ejemplo (por paquete):</strong> una bolsa de relleno de <strong>500 g</strong> que costó <strong>$20.000</strong>. Si usas 50 g en un proyecto, se le suman <strong>$2.000</strong> automáticamente.
            </div>
            <p class="nota">El precio es opcional. Si lo dejas vacío, el insumo funciona igual, pero sus usos no sumarán al gasto del proyecto.</p>

            <h3>Usar y reponer</h3>
            <p>Igual que con los hilos: puedes registrar la cantidad en <strong>pares, unidades o paquetes</strong> (o en gramos/metros según el tipo) y asignarla a un proyecto.</p>
          </template>

          <!-- Proyectos -->
          <template v-else-if="s.id === 'proyectos'">
            <h3>Crear un proyecto</h3>
            <p>Pestaña <strong>Proyectos</strong> → «+ Nuevo». Ponle nombre, foto y estado: <strong>En progreso</strong>, <strong>Pausado</strong> o <strong>Terminado</strong>. Arriba puedes filtrar por estado.</p>

            <h3>Cómo se llena el gasto</h3>
            <p>El costo de un proyecto <strong>no se escribe a mano</strong>: se arma solo. Cada vez que uses un hilo o un insumo y lo asignes a ese proyecto, su valor se suma.</p>
            <p>En el detalle del proyecto verás:</p>
            <ul>
              <li><strong>Consumo total</strong> y cuántos hilos distintos usaste.</li>
              <li><strong>Gasto total estimado</strong>, con el desglose «Hilos $X · Insumos $Y».</li>
              <li>Un detalle en tres pestañas: <strong>Movimientos</strong> (cada uso), <strong>Por hilo</strong> (cuánto se llevó cada hilo) e <strong>Insumos</strong>.</li>
            </ul>
            <div class="tip">
              <strong>💡 Al terminar un proyecto</strong> tendrás exactamente cuánto te costó en material — muy útil para ponerle precio a lo que vendes.
            </div>
            <p class="nota">Si un hilo o insumo no tiene precio y datos de paquete/ovillo, sus usos no suman al gasto y la app te lo avisa con una nota.</p>
          </template>

          <!-- Resumen -->
          <template v-else-if="s.id === 'resumen'">
            <p>La pestaña <strong>Resumen</strong> tiene tres vistas:</p>
            <ul>
              <li><strong>General</strong> — cuántos hilos tienes, cuántos ovillos en total, cuántos con stock bajo, y tu consumo por mes y por proyecto.</li>
              <li><strong>Por hilo</strong> — de cada hilo: lo que te queda y lo que has consumido, expresado en gramos, metros y ovillos a la vez.</li>
              <li><strong>Insumos</strong> — lo mismo para tus insumos, más el valor de lo consumido.</li>
            </ul>
          </template>

          <!-- Perfil -->
          <template v-else-if="s.id === 'perfil'">
            <h3>Tu cuenta</h3>
            <p>Puedes cambiar tu <strong>foto</strong>, tu <strong>nombre</strong> y tu <strong>nombre de usuario</strong> (@usuario). El usuario te sirve para iniciar sesión sin escribir el correo.</p>

            <h3>Apariencia</h3>
            <p>Elige tema <strong>Claro</strong>, <strong>Oscuro</strong> o <strong>Sistema</strong> (sigue la configuración de tu teléfono), y el <strong>color</strong> de la app entre cinco opciones. Se guarda en tu cuenta, así que se ve igual en todos tus dispositivos.</p>

            <h3>Etiquetas</h3>
            <p>Desde el perfil puedes crear y eliminar las etiquetas que usas para clasificar tus hilos.</p>
          </template>

          <!-- Instalar -->
          <template v-else-if="s.id === 'instalar'">
            <p>Nuditos se puede instalar como una app normal, sin pasar por la tienda.</p>
            <h3>En iPhone</h3>
            <ol>
              <li>Abre la web en <strong>Safari</strong>.</li>
              <li>Toca el botón <strong>Compartir</strong> (el cuadrito con la flecha hacia arriba).</li>
              <li>Elige <strong>«Añadir a pantalla de inicio»</strong>.</li>
            </ol>
            <h3>En Android</h3>
            <p>Chrome te mostrará solo la opción <strong>«Instalar aplicación»</strong>. Si no aparece, ábrela desde el menú de tres puntos → «Instalar».</p>
            <p class="nota">Una vez instalada se abre a pantalla completa, con su ícono propio y sin la barra del navegador.</p>
          </template>

          <!-- FAQ -->
          <template v-else-if="s.id === 'faq'">
            <h3>No me aparece la alerta de stock bajo</h3>
            <p>Es porque ese hilo o insumo no tiene un <strong>«Stock mínimo»</strong> definido. Edítalo y ponle el número desde el cual quieres que te avise.</p>

            <h3>Mi proyecto dice $0 o «sin costo»</h3>
            <p>Falta información de precio. Revisa que el hilo tenga <strong>costo + peso/metros por ovillo</strong>. En el insumo basta con ponerle un <strong>precio</strong>: por paquete (con cuánto trae) o directamente por unidad.</p>

            <h3>¿Puedo usarla en el computador y el teléfono?</h3>
            <p>Sí. Tu información se guarda en la nube, así que entras con la misma cuenta desde donde quieras y ves lo mismo.</p>

            <h3>Me equivoqué en un movimiento</h3>
            <p>Puedes compensarlo con el movimiento contrario: si usaste de más, «repón» la diferencia (y viceversa). Todo queda registrado en el historial del hilo o insumo.</p>

            <h3>¿Se pierden mis datos si no entro por un tiempo?</h3>
            <p>No. Tu inventario queda guardado en tu cuenta.</p>

            <h3>Olvidé mi contraseña</h3>
            <p>En la pantalla de inicio de sesión toca <strong>«¿Olvidaste tu contraseña?»</strong> y te llegará un correo para restablecerla.</p>
          </template>
        </div>
      </section>
    </div>

    <!-- Contacto -->
    <section class="mt-6 rounded-2xl border border-borde bg-blanco p-5 text-center">
      <p class="font-semibold">¿No encontraste lo que buscabas?</p>
      <p class="mt-1 text-sm text-texto2">
        Escríbenos y te ayudamos con gusto.
      </p>
      <a
        href="mailto:cristianvabusiness@gmail.com?subject=Ayuda%20con%20Nuditos"
        class="mt-3 inline-block rounded-2xl bg-rosa px-5 py-2.5 text-sm font-semibold text-white"
      >
        Escribir a soporte
      </a>
    </section>
  </main>
</template>

<style scoped>
.ayuda :deep(h3) {
  @apply mb-1 mt-4 font-semibold text-texto;
}
.ayuda :deep(h3:first-child) {
  @apply mt-0;
}
.ayuda :deep(p) {
  @apply mb-2 text-sm leading-relaxed text-texto;
}
.ayuda :deep(ul) {
  @apply mb-3 list-disc space-y-1 pl-5 text-sm text-texto;
}
.ayuda :deep(ol) {
  @apply mb-3 list-decimal space-y-1 pl-5 text-sm text-texto;
}
.ayuda :deep(.tip) {
  @apply my-3 rounded-xl bg-crema p-3 text-sm leading-relaxed text-texto;
}
.ayuda :deep(.nota) {
  @apply text-xs text-texto2;
}
</style>
