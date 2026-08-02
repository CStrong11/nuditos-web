// Valor por hora del usuario (para la mano de obra). Se cachea en useState
// para que el banner y el perfil compartan el mismo estado.
//   undefined = aún no cargado · null = sin definir · number = definido

export function useValorHora() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()
  const valor = useState<number | null | undefined>('valor-hora', () => undefined)

  async function cargar(force = false) {
    if (!user.value) return
    if (valor.value !== undefined && !force) return
    try {
      const { data } = await supabase.from('perfiles').select('valor_hora').single()
      valor.value = (data as any)?.valor_hora ?? null
    } catch {
      valor.value = null
    }
  }

  function set(v: number | null) {
    valor.value = v
  }

  const sinDefinir = computed(() =>
    valor.value === null || (typeof valor.value === 'number' && valor.value <= 0),
  )

  return { valor, cargar, set, sinDefinir }
}
