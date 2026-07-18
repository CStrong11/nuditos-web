// Novedades de la app: badge "nuevo" en la pestaña + aviso flotante.
// Se recuerda por navegador en localStorage; al lanzar otra novedad
// basta con subir la versión de la clave.

const CLAVE_INSUMOS = 'nuditos_novedad_insumos_v1'

export function useNovedadInsumos() {
  // `vista` = true significa "ya la conoce" (no mostrar nada).
  // Arranca en true para que el SSR no pinte el badge y luego parpadee.
  const vista = useState('novedad-insumos', () => true)

  function comprobar() {
    if (import.meta.client) {
      vista.value = localStorage.getItem(CLAVE_INSUMOS) === '1'
    }
  }

  function marcarVista() {
    vista.value = true
    if (import.meta.client) localStorage.setItem(CLAVE_INSUMOS, '1')
  }

  return { vista, comprobar, marcarVista }
}
