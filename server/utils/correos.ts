// Envío de correos transaccionales con la API de Resend.
// (Independiente del SMTP de Supabase, que es solo para correos de auth.)

const REMITENTE = 'NuditosCol <hola@nuditoscol.com>'

/// Envía un correo HTML. Devuelve true si Resend lo aceptó.
export async function enviarCorreo(opts: {
  to: string
  subject: string
  html: string
}): Promise<boolean> {
  const c = useRuntimeConfig()
  const apiKey = c.resendApiKey as string
  if (!apiKey) {
    console.error('Falta RESEND_API_KEY: no se envió el correo a', opts.to)
    return false
  }
  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: { from: REMITENTE, to: opts.to, subject: opts.subject, html: opts.html },
    })
    return true
  } catch (e: any) {
    console.error('Resend falló:', e?.data ?? e?.message ?? e)
    return false
  }
}

/// Envoltura de marca: tarjeta crema con wordmark en texto (se ve aunque el
/// cliente bloquee imágenes).
function plantilla(titulo: string, cuerpoHtml: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#FBF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBF6EE;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #EDE4D8;border-radius:20px;overflow:hidden;">
        <tr><td style="padding:36px 32px;text-align:center;">
          <div style="font-size:26px;font-weight:700;color:#C06B86;letter-spacing:-0.5px;margin-bottom:8px;">nuditos</div>
          <h1 style="margin:16px 0 8px;font-size:20px;font-weight:700;color:#3A3A3A;">${titulo}</h1>
          ${cuerpoHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #EDE4D8;text-align:center;">
          <p style="margin:0;font-size:12px;color:#BEBEBE;">© 2026 Nuditos · nuditoscol.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function boton(url: string, texto: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;"><tr>
    <td style="border-radius:14px;background-color:#C06B86;">
      <a href="${url}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;">${texto}</a>
    </td></tr></table>`
}

/// Correo de entrega: el patrón ya está disponible para descargar.
export function correoEntrega(opts: { titulo: string; descargaUrl: string }): { subject: string; html: string } {
  const cuerpo = `
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6B6B6B;">
      ¡Gracias por tu compra! Tu patrón <strong>${opts.titulo}</strong> está listo. Toca el botón para descargar tu PDF.
    </p>
    ${boton(opts.descargaUrl, 'Descargar mi patrón')}
    <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:#9A9A9A;">¿No funciona el botón? Copia y pega este enlace:</p>
    <p style="margin:0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${opts.descargaUrl}" style="color:#C06B86;">${opts.descargaUrl}</a></p>
    <p style="margin:20px 0 0;font-size:12px;color:#9A9A9A;">El enlace estará disponible por 7 días. Guarda tu PDF en un lugar seguro. 💛</p>`
  return { subject: `Tu patrón "${opts.titulo}" está listo`, html: plantilla('¡Tu patrón está listo!', cuerpo) }
}

/// Correo de preventa: compra confirmada, se entrega el día del lanzamiento.
export function correoPreventa(opts: { titulo: string; fecha: string }): { subject: string; html: string } {
  const cuerpo = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#6B6B6B;">
      ¡Gracias por tu compra en preventa! Reservaste <strong>${opts.titulo}</strong>.
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6B6B6B;">
      Te enviaremos el PDF por este mismo correo el <strong style="color:#C06B86;">${opts.fecha}</strong>, el día de su lanzamiento. No tienes que hacer nada más.
    </p>`
  return { subject: `Reservaste "${opts.titulo}" — te llega el ${opts.fecha}`, html: plantilla('¡Compra confirmada!', cuerpo) }
}
