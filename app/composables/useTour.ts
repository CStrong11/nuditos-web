// Tour guiado de bienvenida (driver.js). Se muestra una vez a cada cuenta
// nueva; se recuerda en perfiles.tour_visto (y en localStorage como respaldo
// rápido). Se puede volver a lanzar manualmente desde el perfil.

export function useTour() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const CLAVE = 'nuditos_tour_visto'

  async function yaVisto(): Promise<boolean> {
    if (!user.value) return true
    if (import.meta.client && localStorage.getItem(CLAVE) === '1') return true
    try {
      const { data } = await supabase.from('perfiles').select('tour_visto').single()
      return !!(data as any)?.tour_visto
    } catch {
      // Si la columna aún no existe u otro error, no forzamos el tour en bucle.
      return false
    }
  }

  async function marcarVisto() {
    if (import.meta.client) localStorage.setItem(CLAVE, '1')
    try {
      await supabase.from('perfiles').update({ tour_visto: true }).eq('id', userID(user.value))
    } catch {
      // silencioso: el respaldo en localStorage evita que se repita en este equipo
    }
  }

  const pasos = [
    {
      popover: {
        title: '¡Bienvenida a Nuditos! 🧶',
        description: 'Te muestro lo esencial en 30 segundos. Puedes cerrar el tour con la ✕ cuando quieras.',
      },
    },
    {
      element: '[data-tour="nuevo-hilo"]',
      popover: {
        title: 'Agrega tus hilos',
        description: 'Empieza registrando tus hilos y lanas aquí, con su cantidad, costo y datos.',
      },
    },
    {
      element: '[data-tour="nav-insumos"]',
      popover: {
        title: 'Insumos',
        description: 'Ojitos, relleno, etiquetas y demás materiales que usas en tus tejidos.',
      },
    },
    {
      element: '[data-tour="nav-proyectos"]',
      popover: {
        title: 'Proyectos',
        description: 'Organiza tus tejidos y registra el hilo, el tiempo y el gasto de cada uno.',
      },
    },
    {
      element: '[data-tour="nav-resumen"]',
      popover: {
        title: 'Resumen',
        description: 'Tu consumo y tus gastos, con filtros por fecha para ver cuánto usas cada mes.',
      },
    },
    {
      element: '[data-tour="nav-perfil"]',
      popover: {
        title: 'Perfil',
        description: 'Ajustes y tu “valor por hora”, para calcular la mano de obra de tus proyectos.',
      },
    },
    {
      element: '[data-tour="nuevo-hilo"]',
      popover: {
        title: '¡A tejer! 🎉',
        description: 'Empieza agregando tu primer hilo. Si tienes dudas, entra a Perfil → Ayuda.',
      },
    },
  ]

  async function iniciarTour(forzar = false) {
    if (!import.meta.client) return
    if (!forzar && await yaVisto()) return

    const { driver } = await import('driver.js')
    const d = driver({
      showProgress: true,
      progressText: '{{current}} de {{total}}',
      nextBtnText: 'Siguiente',
      prevBtnText: 'Atrás',
      doneBtnText: 'Listo',
      steps: pasos,
      onDestroyed: () => { marcarVisto() },
    })
    d.drive()
  }

  return { iniciarTour }
}
