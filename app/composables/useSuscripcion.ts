// Estado de suscripción del usuario. "Fail-open": si la consulta falla
// (tabla ausente, red), se asume acceso para no bloquear a nadie por error.

export interface EstadoSuscripcion {
  estado: string | null          // trial | activa | cancelada | vencida | vitalicia
  plan: string | null
  trialTerminaEn: string | null
  periodoTerminaEn: string | null
  cargado: boolean
}

export function useSuscripcion() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const sub = useState<EstadoSuscripcion>('suscripcion', () => ({
    estado: null, plan: null, trialTerminaEn: null, periodoTerminaEn: null, cargado: false,
  }))

  async function cargar() {
    if (!user.value) return
    try {
      const { data } = await supabase
        .from('suscripciones')
        .select('estado, plan, trial_termina_en, periodo_termina_en')
        .single()
      if (data) {
        sub.value = {
          estado: (data as any).estado,
          plan: (data as any).plan,
          trialTerminaEn: (data as any).trial_termina_en,
          periodoTerminaEn: (data as any).periodo_termina_en,
          cargado: true,
        }
      } else {
        sub.value = { ...sub.value, cargado: true }
      }
    } catch {
      // Fail-open: marcamos cargado sin datos -> tieneAcceso será true.
      sub.value = { ...sub.value, cargado: true }
    }
  }

  const esVitalicia = computed(() => sub.value.estado === 'vitalicia')

  const enTrial = computed(() =>
    sub.value.estado === 'trial'
    && !!sub.value.trialTerminaEn
    && new Date(sub.value.trialTerminaEn) > new Date(),
  )

  const diasTrialRestantes = computed(() => {
    if (!sub.value.trialTerminaEn) return null
    const ms = new Date(sub.value.trialTerminaEn).getTime() - Date.now()
    return ms > 0 ? Math.ceil(ms / 86_400_000) : 0
  })

  const periodoVigente = computed(() =>
    !!sub.value.periodoTerminaEn && new Date(sub.value.periodoTerminaEn) > new Date(),
  )

  // Espejo de tiene_acceso() en el servidor. Fail-open: si no cargó, permite.
  const tieneAcceso = computed(() => {
    if (!sub.value.cargado) return true
    if (!sub.value.estado) return true // sin fila conocida -> no bloquear
    return esVitalicia.value || enTrial.value || periodoVigente.value
  })

  return {
    sub, cargar, tieneAcceso, esVitalicia, enTrial,
    diasTrialRestantes, periodoVigente,
  }
}
