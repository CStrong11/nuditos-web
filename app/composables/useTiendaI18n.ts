// i18n de la tienda de patrones (ES/EN/PT/FR). El idioma se detecta del
// navegador (Accept-Language en SSR) y se guarda en cookie, así SSR y cliente
// coinciden (sin parpadeo ni hydration mismatch). El selector lo cambia.
export type Idioma = 'es' | 'en' | 'pt' | 'fr'
export const IDIOMAS: Idioma[] = ['es', 'en', 'pt', 'fr']

const T = {
  es: {
    navFunciones: 'Funciones', navPrecios: 'Precios', navTienda: 'Tienda',
    entrar: 'Entrar', probar: 'Probar gratis',
    heroBadge: 'Tienda',
    heroTitulo: 'Tienda de Patrones de NuditosCol',
    heroSub: 'Patrones en PDF listos para descargar. Págalo una vez, téjelo mil veces. 🧶',
    buscar: 'Buscar por nombre…',
    ordRecientes: 'Más recientes', ordAsc: 'Precio: menor a mayor', ordDesc: 'Precio: mayor a menor',
    chipPreventa: 'Preventa', chipOfertas: 'Ofertas', limpiar: 'Limpiar',
    vacioSin: 'Pronto tendremos patrones nuevos por aquí. ¡Vuelve prontito! 🧶',
    vacioFiltro: 'No encontramos patrones con esos filtros.',
    ver: 'Ver patrón →', gratis: 'Gratis',
    bPreventa: 'Preventa', bGratis: 'Gratis', bOferta: 'Oferta',
    volver: 'Tienda', nivel: 'Nivel:',
    preventaPre: '🗓️ Preventa — recibirás tu PDF por correo el ', preventaPost: '.',
    btnReservar: 'Reservar en preventa', btnComprar: 'Comprar patrón', btnGratis: 'Descargar gratis',
    nota: '📩 El PDF llega a tu correo. No necesitas crear cuenta. Pago seguro con tarjeta.',
    noEncontrado: 'No encontramos este patrón.',
    modalTit: '¿A qué correo enviamos tu patrón?', modalSub: 'Ahí recibirás el enlace de descarga del PDF.',
    cancelar: 'Cancelar', irPagar: 'Ir a pagar', enviarmelo: 'Enviármelo', momento: 'Un momento…',
    errCompra: 'No se pudo completar. Intenta de nuevo.',
    graciasTit: '¡Gracias por tu compra!',
    graciasTxt: 'Te enviamos un correo con tu patrón. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso). Si es una preventa, te llegará el día del lanzamiento. 💛',
    graciasBtn: 'Seguir viendo patrones',
  },
  en: {
    navFunciones: 'Features', navPrecios: 'Pricing', navTienda: 'Shop',
    entrar: 'Log in', probar: 'Try it free',
    heroBadge: 'Shop',
    heroTitulo: 'NuditosCol Pattern Shop',
    heroSub: 'Ready-to-download PDF patterns. Pay once, make it a thousand times. 🧶',
    buscar: 'Search by name…',
    ordRecientes: 'Newest', ordAsc: 'Price: low to high', ordDesc: 'Price: high to low',
    chipPreventa: 'Pre-order', chipOfertas: 'On sale', limpiar: 'Clear',
    vacioSin: 'New patterns are coming soon. Check back shortly! 🧶',
    vacioFiltro: 'No patterns match those filters.',
    ver: 'View pattern →', gratis: 'Free',
    bPreventa: 'Pre-order', bGratis: 'Free', bOferta: 'Sale',
    volver: 'Shop', nivel: 'Level:',
    preventaPre: '🗓️ Pre-order — you’ll get your PDF by email on ', preventaPost: '.',
    btnReservar: 'Pre-order now', btnComprar: 'Buy pattern', btnGratis: 'Download for free',
    nota: '📩 The PDF arrives in your inbox. No account needed. Secure card payment.',
    noEncontrado: 'We couldn’t find this pattern.',
    modalTit: 'Which email should we send your pattern to?', modalSub: 'You’ll get the PDF download link there.',
    cancelar: 'Cancel', irPagar: 'Go to payment', enviarmelo: 'Send it to me', momento: 'One moment…',
    errCompra: 'Something went wrong. Please try again.',
    graciasTit: 'Thank you for your purchase!',
    graciasTxt: 'We’ve emailed you your pattern. Check your inbox (and the spam folder, just in case). If it’s a pre-order, it’ll arrive on launch day. 💛',
    graciasBtn: 'Keep browsing patterns',
  },
  pt: {
    navFunciones: 'Recursos', navPrecios: 'Preços', navTienda: 'Loja',
    entrar: 'Entrar', probar: 'Testar grátis',
    heroBadge: 'Loja',
    heroTitulo: 'Loja de Padrões da NuditosCol',
    heroSub: 'Padrões em PDF prontos para baixar. Pague uma vez, teça mil vezes. 🧶',
    buscar: 'Buscar por nome…',
    ordRecientes: 'Mais recentes', ordAsc: 'Preço: menor para maior', ordDesc: 'Preço: maior para menor',
    chipPreventa: 'Pré-venda', chipOfertas: 'Ofertas', limpiar: 'Limpar',
    vacioSin: 'Em breve teremos novos padrões por aqui. Volte logo! 🧶',
    vacioFiltro: 'Nenhum padrão encontrado com esses filtros.',
    ver: 'Ver padrão →', gratis: 'Grátis',
    bPreventa: 'Pré-venda', bGratis: 'Grátis', bOferta: 'Oferta',
    volver: 'Loja', nivel: 'Nível:',
    preventaPre: '🗓️ Pré-venda — você receberá seu PDF por e-mail em ', preventaPost: '.',
    btnReservar: 'Reservar na pré-venda', btnComprar: 'Comprar padrão', btnGratis: 'Baixar grátis',
    nota: '📩 O PDF chega no seu e-mail. Não precisa criar conta. Pagamento seguro com cartão.',
    noEncontrado: 'Não encontramos este padrão.',
    modalTit: 'Para qual e-mail enviamos seu padrão?', modalSub: 'Você receberá o link de download do PDF ali.',
    cancelar: 'Cancelar', irPagar: 'Ir para o pagamento', enviarmelo: 'Enviar para mim', momento: 'Um momento…',
    errCompra: 'Não foi possível concluir. Tente de novo.',
    graciasTit: 'Obrigado pela sua compra!',
    graciasTxt: 'Enviamos seu padrão por e-mail. Verifique sua caixa de entrada (e o spam, por via das dúvidas). Se for pré-venda, chegará no dia do lançamento. 💛',
    graciasBtn: 'Continuar vendo padrões',
  },
  fr: {
    navFunciones: 'Fonctionnalités', navPrecios: 'Tarifs', navTienda: 'Boutique',
    entrar: 'Se connecter', probar: 'Essai gratuit',
    heroBadge: 'Boutique',
    heroTitulo: 'Boutique de Patrons de NuditosCol',
    heroSub: 'Patrons PDF prêts à télécharger. Payez une fois, tricotez mille fois. 🧶',
    buscar: 'Rechercher par nom…',
    ordRecientes: 'Plus récents', ordAsc: 'Prix : croissant', ordDesc: 'Prix : décroissant',
    chipPreventa: 'Précommande', chipOfertas: 'Promos', limpiar: 'Effacer',
    vacioSin: 'De nouveaux patrons arrivent bientôt. Revenez vite ! 🧶',
    vacioFiltro: 'Aucun patron ne correspond à ces filtres.',
    ver: 'Voir le patron →', gratis: 'Gratuit',
    bPreventa: 'Précommande', bGratis: 'Gratuit', bOferta: 'Promo',
    volver: 'Boutique', nivel: 'Niveau :',
    preventaPre: '🗓️ Précommande — vous recevrez votre PDF par e-mail le ', preventaPost: '.',
    btnReservar: 'Précommander', btnComprar: 'Acheter le patron', btnGratis: 'Télécharger gratuitement',
    nota: '📩 Le PDF arrive dans votre boîte mail. Pas de compte requis. Paiement sécurisé par carte.',
    noEncontrado: 'Patron introuvable.',
    modalTit: 'À quelle adresse envoyons-nous votre patron ?', modalSub: 'Vous y recevrez le lien de téléchargement du PDF.',
    cancelar: 'Annuler', irPagar: 'Aller au paiement', enviarmelo: 'Me l’envoyer', momento: 'Un instant…',
    errCompra: 'Échec de l’opération. Réessayez.',
    graciasTit: 'Merci pour votre achat !',
    graciasTxt: 'Nous vous avons envoyé votre patron par e-mail. Vérifiez votre boîte de réception (et les spams, au cas où). Pour une précommande, il arrivera le jour du lancement. 💛',
    graciasBtn: 'Continuer à parcourir',
  },
} as const

export function useTiendaI18n() {
  const cookie = useCookie<Idioma>('nd_idioma', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  const idioma = useState<Idioma>('nd_idioma', () => {
    if (cookie.value && IDIOMAS.includes(cookie.value)) return cookie.value
    let lang = ''
    if (import.meta.server) {
      const h = useRequestHeaders(['accept-language'])
      lang = (h['accept-language'] || '').slice(0, 2).toLowerCase()
    } else {
      lang = (navigator.language || '').slice(0, 2).toLowerCase()
    }
    return (IDIOMAS.includes(lang as Idioma) ? lang : 'es') as Idioma
  })

  const t = computed(() => T[idioma.value])

  function cambiar(nuevo: Idioma) {
    idioma.value = nuevo
    cookie.value = nuevo
  }

  return { idioma, cambiar, t }
}
