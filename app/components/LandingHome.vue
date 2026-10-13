<script setup lang="ts">
// Landing pública de Nuditos. Se renderiza en www (y en la raíz) desde
// pages/index.vue. En el host admin, esa misma raíz muestra el panel.
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
const menuAbierto = ref(false)

// URL de la app: en producción (nuditoscol.com) los botones apuntan al
// subdominio app.; en local/preview usan enlaces relativos (mismo origen).
const reqUrl = useRequestURL()
const appBase = computed(() => reqUrl.hostname.endsWith('nuditoscol.com') ? 'https://app.nuditoscol.com' : '')
const appUrl = (p: string) => appBase.value + p

// --- Idioma del landing: autodetección por región + selector manual ---
type Idioma = 'es' | 'en' | 'pt' | 'fr'
const idioma = ref<Idioma>('es')
const IDIOMAS: { code: Idioma, nombre: string }[] = [
  { code: 'es', nombre: 'Español' },
  { code: 'en', nombre: 'English' },
  { code: 'pt', nombre: 'Português' },
  { code: 'fr', nombre: 'Français' },
]

function cambiarIdioma(l: Idioma) {
  idioma.value = l
  if (import.meta.client) localStorage.setItem('nuditos_idioma', l)
}

function onIdiomaChange(e: Event) {
  cambiarIdioma((e.target as HTMLSelectElement).value as Idioma)
}

function detectarIdioma() {
  if (!import.meta.client) return
  const guardado = localStorage.getItem('nuditos_idioma') as Idioma | null
  if (guardado && IDIOMAS.some(i => i.code === guardado)) { idioma.value = guardado; return }
  const nav = (navigator.language || 'es').slice(0, 2).toLowerCase()
  idioma.value = (['en', 'pt', 'fr'].includes(nav) ? nav : 'es') as Idioma
}

const T = {
  es: {
    funciones: 'Funciones', instalar: 'Instalar', precios: 'Precios',
    tienda: 'Tienda',
    tiendaTit: 'Patrones listos para tejer',
    tiendaSub: 'Descarga patrones en PDF de crochet y amigurumi, hechos con amor. Págalo una vez y téjelo cuando quieras.',
    tiendaCta: 'Ver la tienda',
    entrar: 'Entrar', probar: 'Probar gratis',
    cargando: 'tejiendo tu inventario…',
    heroBadge: '🧶 Para tejedoras que venden',
    heroT1: 'Tú sabes tejer.', heroT2: 'Nuditos sabe cuánto te costó.',
    heroP: 'Tu hilero, tus insumos y tus proyectos en un solo lugar. Registra lo que usas y la app calcula sola cuántos ovillos te quedan y cuánto material se llevó cada amigurumi. Sin planillas, sin adivinar el precio.',
    heroCta1: 'Crear cuenta gratis', heroCta2: 'Entrar a la app',
    heroCk1: '✅ 14 días gratis', heroCk2: '✅ Entra con Google', heroCk3: '✅ Nada que descargar',
    heroChip1: '47 hilos · 70 ovillos', heroChip2: '1 con stock bajo',
    m1: 'sin planillas', m2: 'sin cuadernos perdidos', m3: 'sin adivinar el precio', m4: 'sin contar ovillos a mano',
    fnBadge: 'Qué hace Nuditos', fnT: 'Cinco pestañas, cero cuentas a mano',
    fnP: 'Todo lo que registras se conecta: un uso de hilo baja tu inventario, sube el consumo del mes y suma al costo del proyecto. Una sola vez, en un solo lugar.',
    f1T: 'Todo tu hilero, contado',
    f1P: 'Cada hilo con su marca, color, foto y precio. Registras lo que gastaste tejiendo con «− usar» y lo que compraste con «+ reponer». Si le pones peso y metros por ovillo, puedes escribir la cantidad en gramos, metros u ovillos y la app convierte sola.',
    f1b1: 'Alerta de stock bajo cuando un hilo pasa tu mínimo',
    f1b2: 'Etiquetas propias (algodón, bebé, amigurumi) para filtrar',
    f1b3: 'Buscador por nombre o marca',
    cInsT: 'Ojitos, relleno, cintas',
    cInsP1: 'Cuatro formas de medir: por unidad, por pares, por peso o por longitud. Los ojitos de seguridad descuentan dos unidades por cada par que uses.',
    cInsP2: 'El precio va por paquete o por unidad: una bolsa de relleno de 500 g a $20.000 le suma $2.000 al proyecto donde usaste 50 g.',
    cProT: 'El costo se arma solo',
    cProP1: 'El gasto de un proyecto no se escribe a mano. Cada uso que le asignas suma su valor: hilos, insumos y las horas que le pusiste.',
    cProP2: 'Filtra por En progreso, Pausado o Terminado, y al cerrarlo sabes exactamente cuánto costó — el número que necesitas para ponerle precio.',
    cResT: 'Cuánto tejiste, cuánto gastaste',
    cResP1: 'Consumo y gasto por mes, por hilo, por insumo y por proyecto. Cuántos ovillos tienes en total y cuáles están por acabarse.',
    cResP2: 'Cambia el período (este mes, el pasado, los últimos tres) y mira de una qué proyecto se llevó más.',
    cPerT: 'A tu gusto',
    cPerP1: 'Tema claro, oscuro o el del sistema, y cinco colores para la app: rosa, durazno, verde, celeste y lila. Se guarda en tu cuenta, así que se ve igual en todos tus dispositivos.',
    cPerP2: 'Define el valor de tu hora y Nuditos calcula la mano de obra de cada proyecto.',
    insBadge: 'Sin tiendas, sin descargas',
    insT: 'Nuditos vive en tu navegador y en tu pantalla de inicio',
    insP: 'Es una web app: no hay archivo que instalar ni APK que buscar. Entras con tu correo, tu usuario o con Google, y si quieres la dejas como un ícono más en el teléfono.',
    insIphoneT: 'En iPhone',
    insIphone1: 'Abre la web en Safari.', insIphone2: 'Toca Compartir, el cuadrito con la flecha.', insIphone3: 'Elige «Añadir a pantalla de inicio».',
    insAndroidT: 'En Android',
    insAndroid1: 'Ábrela en Chrome.', insAndroid2: 'Toca «Instalar aplicación» cuando aparezca.', insAndroid3: 'Si no sale, está en el menú de tres puntos.',
    insPcT: 'En el computador',
    insPcP: 'Es la misma cuenta y los mismos datos. Agregas los hilos sentada en el escritorio y registras los usos desde el sofá, con el teléfono.',
    testT: 'Lo que dicen las tejedoras',
    test1: '«Antes le ponía precio a ojo. Ahora sé que ese conejo me costó $9.400 y cobro tranquila.»',
    test2: '«Dejé de comprar hilo repetido. Miro la app en la tienda y ya sé qué me falta.»',
    test3: '«Lo de los ojitos por pares me salvó. Nunca me cuadraban las cuentas.»',
    prBadge: '14 días gratis, sin tarjeta', prT: 'Cuesta menos que un ovillo al mes',
    prP: 'Prueba todo durante dos semanas. Después eliges el plan que te acomode: mientras más largo, más barato el mes.',
    prMensual: 'Mensual', prTrim: 'Trimestral', prSem: 'Semestral', prAnual: 'Anual',
    prPerMes: 'USD / mes', prPer3: 'USD / 3 meses', prPer6: 'USD / 6 meses', prPerAno: 'USD / año',
    prMensualSub: 'Para probar sin compromiso', prAlMes: 'al mes',
    prTrimAhorra: 'ahorras 13%', prSemAhorra: 'ahorras 20%', prAnualAhorra: 'ahorras 33%',
    prSuscribir: 'Suscribirme', prMejor: 'Mejor precio',
    prEmbT: '¿Tienes una embajadora favorita?',
    prEmbP: 'Usa su código dentro de la app y te regalamos 30 días de acceso.',
    prSeguro: 'Pago seguro procesado por Lemon Squeezy. Puedes cancelar cuando quieras.',
    ctaT: 'La próxima vez que te pregunten el precio, tú ya lo sabes',
    ctaP: 'Empieza con 14 días gratis. Sin tarjeta, sin descargar nada.',
    ctaBtn2: 'Entrar con Google',
    ftTagline: 'Inventario de hilos, insumos y costos reales para tejedoras. Tus datos viajan contigo entre el teléfono y el computador.',
    ftProducto: 'Producto', ftAyuda: 'Ayuda', ftLegal: 'Legal',
    ftCentroAyuda: 'Centro de ayuda', ftSoporte: 'Escribir a soporte',
    ftTerminos: 'Términos', ftPrivacidad: 'Privacidad', ftReembolsos: 'Reembolsos',
    ftCopy: '© 2026 Nuditos · Hecho con hilo y cariño 🧶',
  },
  en: {
    funciones: 'Features', instalar: 'Install', precios: 'Pricing',
    tienda: 'Shop',
    tiendaTit: 'Patterns ready to make',
    tiendaSub: 'Download crochet and amigurumi PDF patterns, made with love. Pay once, make it anytime.',
    tiendaCta: 'Browse the shop',
    entrar: 'Log in', probar: 'Try it free',
    cargando: 'weaving your inventory…',
    heroBadge: '🧶 For makers who sell',
    heroT1: 'You know how to crochet.', heroT2: 'Nuditos knows what it cost you.',
    heroP: 'Your yarn, your supplies and your projects in one place. Log what you use and the app works out how many skeins you have left and how much material each amigurumi took. No spreadsheets, no guessing the price.',
    heroCta1: 'Create free account', heroCta2: 'Go to the app',
    heroCk1: '✅ 14 days free', heroCk2: '✅ Sign in with Google', heroCk3: '✅ Nothing to download',
    heroChip1: '47 yarns · 70 skeins', heroChip2: '1 low on stock',
    m1: 'no spreadsheets', m2: 'no lost notebooks', m3: 'no guessing the price', m4: 'no counting skeins by hand',
    fnBadge: 'What Nuditos does', fnT: 'Five tabs, zero math by hand',
    fnP: 'Everything you log connects: a yarn use lowers your inventory, raises the month’s consumption and adds to the project’s cost. Once, in one place.',
    f1T: 'Your whole yarn stash, counted',
    f1P: 'Each yarn with its brand, color, photo and price. Log what you used while crocheting with “− use” and what you bought with “+ restock”. Add weight and meters per skein, and you can enter the amount in grams, meters or skeins — the app converts it for you.',
    f1b1: 'Low-stock alert when a yarn drops below your minimum',
    f1b2: 'Your own tags (cotton, baby, amigurumi) to filter',
    f1b3: 'Search by name or brand',
    cInsT: 'Eyes, stuffing, ribbons',
    cInsP1: 'Four ways to measure: by unit, by pair, by weight or by length. Safety eyes subtract two units for every pair you use.',
    cInsP2: 'Price by pack or by unit: a 500 g bag of stuffing at $20,000 adds $2,000 to the project where you used 50 g.',
    cProT: 'The cost adds up on its own',
    cProP1: 'A project’s spend isn’t typed by hand. Every use you assign adds its value: yarns, supplies and the hours you logged.',
    cProP2: 'Filter by In progress, Paused or Finished, and when you close it you know exactly what it cost — the number you need to price it.',
    cResT: 'How much you made, how much you spent',
    cResP1: 'Consumption and spend by month, by yarn, by supply and by project. How many skeins you have in total and which ones are running out.',
    cResP2: 'Switch the period (this month, last month, the last three) and see at a glance which project cost the most.',
    cPerT: 'Made your way',
    cPerP1: 'Light, dark or system theme, and five app colors: pink, peach, green, blue and lilac. It’s saved to your account, so it looks the same on all your devices.',
    cPerP2: 'Set your hourly rate and Nuditos calculates the labor for each project.',
    insBadge: 'No stores, no downloads',
    insT: 'Nuditos lives in your browser and on your home screen',
    insP: 'It’s a web app: no file to install, no APK to hunt for. Sign in with your email, your username or Google, and if you like, keep it as one more icon on your phone.',
    insIphoneT: 'On iPhone',
    insIphone1: 'Open the site in Safari.', insIphone2: 'Tap Share, the box with the arrow.', insIphone3: 'Choose “Add to Home Screen”.',
    insAndroidT: 'On Android',
    insAndroid1: 'Open it in Chrome.', insAndroid2: 'Tap “Install app” when it appears.', insAndroid3: 'If it doesn’t show, it’s in the three-dot menu.',
    insPcT: 'On your computer',
    insPcP: 'Same account, same data. Add your yarns at your desk and log uses from the couch, on your phone.',
    testT: 'What makers are saying',
    test1: '“I used to price by eye. Now I know that bunny cost me $9,400 and I charge with confidence.”',
    test2: '“I stopped buying duplicate yarn. I check the app at the store and I know what I’m missing.”',
    test3: '“Safety eyes by pair saved me. My counts never added up before.”',
    prBadge: '14 days free, no card', prT: 'Less than one skein a month',
    prP: 'Try everything for two weeks. Then pick the plan that suits you: the longer it is, the cheaper the month.',
    prMensual: 'Monthly', prTrim: 'Quarterly', prSem: 'Six months', prAnual: 'Annual',
    prPerMes: 'USD / month', prPer3: 'USD / 3 months', prPer6: 'USD / 6 months', prPerAno: 'USD / year',
    prMensualSub: 'To try with no commitment', prAlMes: 'a month',
    prTrimAhorra: 'save 13%', prSemAhorra: 'save 20%', prAnualAhorra: 'save 33%',
    prSuscribir: 'Subscribe', prMejor: 'Best value',
    prEmbT: 'Have a favorite ambassador?',
    prEmbP: 'Use her code in the app and we’ll give you 30 days of access.',
    prSeguro: 'Secure payment processed by Lemon Squeezy. Cancel anytime.',
    ctaT: 'Next time someone asks your price, you already know it',
    ctaP: 'Start with 14 days free. No card, nothing to download.',
    ctaBtn2: 'Sign in with Google',
    ftTagline: 'Yarn, supplies and real costs for makers. Your data travels with you between your phone and your computer.',
    ftProducto: 'Product', ftAyuda: 'Help', ftLegal: 'Legal',
    ftCentroAyuda: 'Help center', ftSoporte: 'Contact support',
    ftTerminos: 'Terms', ftPrivacidad: 'Privacy', ftReembolsos: 'Refunds',
    ftCopy: '© 2026 Nuditos · Made with yarn and love 🧶',
  },
  pt: {
    funciones: 'Recursos', instalar: 'Instalar', precios: 'Preços',
    tienda: 'Loja',
    tiendaTit: 'Padrões prontos para tecer',
    tiendaSub: 'Baixe padrões em PDF de crochê e amigurumi, feitos com amor. Pague uma vez e faça quando quiser.',
    tiendaCta: 'Ver a loja',
    entrar: 'Entrar', probar: 'Testar grátis',
    cargando: 'tricotando seu estoque…',
    heroBadge: '🧶 Para artesãs que vendem',
    heroT1: 'Você sabe tricotar.', heroT2: 'O Nuditos sabe quanto custou.',
    heroP: 'Seus fios, seus insumos e seus projetos em um só lugar. Registre o que usa e o app calcula sozinho quantos novelos sobraram e quanto material cada amigurumi levou. Sem planilhas, sem chutar o preço.',
    heroCta1: 'Criar conta grátis', heroCta2: 'Ir para o app',
    heroCk1: '✅ 14 dias grátis', heroCk2: '✅ Entrar com Google', heroCk3: '✅ Nada para baixar',
    heroChip1: '47 fios · 70 novelos', heroChip2: '1 com estoque baixo',
    m1: 'sem planilhas', m2: 'sem cadernos perdidos', m3: 'sem chutar o preço', m4: 'sem contar novelos na mão',
    fnBadge: 'O que o Nuditos faz', fnT: 'Cinco abas, zero contas na mão',
    fnP: 'Tudo o que você registra se conecta: um uso de fio baixa seu estoque, sobe o consumo do mês e soma ao custo do projeto. Uma só vez, em um só lugar.',
    f1T: 'Todo o seu estoque de fios, contado',
    f1P: 'Cada fio com sua marca, cor, foto e preço. Registre o que gastou tricotando com «− usar» e o que comprou com «+ repor». Se informar peso e metros por novelo, pode escrever a quantidade em gramas, metros ou novelos e o app converte sozinho.',
    f1b1: 'Alerta de estoque baixo quando um fio passa do seu mínimo',
    f1b2: 'Etiquetas próprias (algodão, bebê, amigurumi) para filtrar',
    f1b3: 'Busca por nome ou marca',
    cInsT: 'Olhinhos, enchimento, fitas',
    cInsP1: 'Quatro formas de medir: por unidade, por pares, por peso ou por comprimento. Os olhinhos de segurança descontam duas unidades para cada par que você usa.',
    cInsP2: 'O preço vai por pacote ou por unidade: um saco de enchimento de 500 g a $20.000 soma $2.000 ao projeto onde você usou 50 g.',
    cProT: 'O custo se monta sozinho',
    cProP1: 'O gasto de um projeto não se escreve na mão. Cada uso que você atribui soma seu valor: fios, insumos e as horas que registrou.',
    cProP2: 'Filtre por Em andamento, Pausado ou Concluído, e ao fechá-lo você sabe exatamente quanto custou — o número que precisa para precificar.',
    cResT: 'Quanto você teceu, quanto gastou',
    cResP1: 'Consumo e gasto por mês, por fio, por insumo e por projeto. Quantos novelos você tem no total e quais estão acabando.',
    cResP2: 'Mude o período (este mês, o passado, os últimos três) e veja na hora qual projeto levou mais.',
    cPerT: 'Do seu jeito',
    cPerP1: 'Tema claro, escuro ou o do sistema, e cinco cores para o app: rosa, pêssego, verde, azul e lilás. Fica salvo na sua conta, então aparece igual em todos os seus dispositivos.',
    cPerP2: 'Defina o valor da sua hora e o Nuditos calcula a mão de obra de cada projeto.',
    insBadge: 'Sem lojas, sem downloads',
    insT: 'O Nuditos vive no seu navegador e na sua tela inicial',
    insP: 'É um web app: nenhum arquivo para instalar nem APK para procurar. Você entra com seu e-mail, seu usuário ou com o Google e, se quiser, deixa como mais um ícone no celular.',
    insIphoneT: 'No iPhone',
    insIphone1: 'Abra o site no Safari.', insIphone2: 'Toque em Compartilhar, o quadradinho com a seta.', insIphone3: 'Escolha «Adicionar à Tela de Início».',
    insAndroidT: 'No Android',
    insAndroid1: 'Abra no Chrome.', insAndroid2: 'Toque em «Instalar aplicativo» quando aparecer.', insAndroid3: 'Se não aparecer, está no menu de três pontos.',
    insPcT: 'No computador',
    insPcP: 'A mesma conta e os mesmos dados. Adicione os fios sentada na mesa e registre os usos do sofá, pelo celular.',
    testT: 'O que as artesãs dizem',
    test1: '«Antes eu chutava o preço. Agora sei que aquele coelho custou $9.400 e cobro tranquila.»',
    test2: '«Parei de comprar fio repetido. Olho o app na loja e já sei o que falta.»',
    test3: '«Os olhinhos por pares me salvaram. Minhas contas nunca fechavam.»',
    prBadge: '14 dias grátis, sem cartão', prT: 'Custa menos que um novelo por mês',
    prP: 'Teste tudo por duas semanas. Depois escolha o plano que combina: quanto mais longo, mais barato o mês.',
    prMensual: 'Mensal', prTrim: 'Trimestral', prSem: 'Semestral', prAnual: 'Anual',
    prPerMes: 'USD / mês', prPer3: 'USD / 3 meses', prPer6: 'USD / 6 meses', prPerAno: 'USD / ano',
    prMensualSub: 'Para testar sem compromisso', prAlMes: 'por mês',
    prTrimAhorra: 'economize 13%', prSemAhorra: 'economize 20%', prAnualAhorra: 'economize 33%',
    prSuscribir: 'Assinar', prMejor: 'Melhor preço',
    prEmbT: 'Tem uma embaixadora favorita?',
    prEmbP: 'Use o código dela no app e ganhe 30 dias de acesso.',
    prSeguro: 'Pagamento seguro processado pela Lemon Squeezy. Cancele quando quiser.',
    ctaT: 'Da próxima vez que perguntarem o preço, você já sabe',
    ctaP: 'Comece com 14 dias grátis. Sem cartão, sem baixar nada.',
    ctaBtn2: 'Entrar com Google',
    ftTagline: 'Estoque de fios, insumos e custos reais para artesãs. Seus dados viajam com você entre o celular e o computador.',
    ftProducto: 'Produto', ftAyuda: 'Ajuda', ftLegal: 'Jurídico',
    ftCentroAyuda: 'Central de ajuda', ftSoporte: 'Falar com o suporte',
    ftTerminos: 'Termos', ftPrivacidad: 'Privacidade', ftReembolsos: 'Reembolsos',
    ftCopy: '© 2026 Nuditos · Feito com fio e carinho 🧶',
  },
  fr: {
    funciones: 'Fonctionnalités', instalar: 'Installer', precios: 'Tarifs',
    tienda: 'Boutique',
    tiendaTit: 'Des patrons prêts à tricoter',
    tiendaSub: 'Téléchargez des patrons PDF de crochet et amigurumi, faits avec amour. Payez une fois, réalisez-le quand vous voulez.',
    tiendaCta: 'Voir la boutique',
    entrar: 'Se connecter', probar: 'Essayer gratuitement',
    cargando: 'tricotage de votre inventaire…',
    heroBadge: '🧶 Pour les créatrices qui vendent',
    heroT1: 'Vous savez crocheter.', heroT2: 'Nuditos sait ce que ça vous a coûté.',
    heroP: 'Vos fils, vos fournitures et vos projets au même endroit. Notez ce que vous utilisez et l’appli calcule seule combien de pelotes il vous reste et combien de matière chaque amigurumi a demandé. Sans tableurs, sans deviner le prix.',
    heroCta1: 'Créer un compte gratuit', heroCta2: 'Ouvrir l’appli',
    heroCk1: '✅ 14 jours gratuits', heroCk2: '✅ Connexion avec Google', heroCk3: '✅ Rien à télécharger',
    heroChip1: '47 fils · 70 pelotes', heroChip2: '1 en stock faible',
    m1: 'sans tableurs', m2: 'sans carnets perdus', m3: 'sans deviner le prix', m4: 'sans compter les pelotes à la main',
    fnBadge: 'Ce que fait Nuditos', fnT: 'Cinq onglets, zéro calcul à la main',
    fnP: 'Tout ce que vous notez se connecte : une utilisation de fil baisse votre stock, augmente la consommation du mois et s’ajoute au coût du projet. Une seule fois, à un seul endroit.',
    f1T: 'Tout votre stock de fils, compté',
    f1P: 'Chaque fil avec sa marque, sa couleur, sa photo et son prix. Notez ce que vous avez utilisé en crochetant avec « − utiliser » et ce que vous avez acheté avec « + réapprovisionner ». Avec le poids et les mètres par pelote, saisissez la quantité en grammes, mètres ou pelotes : l’appli convertit toute seule.',
    f1b1: 'Alerte de stock bas quand un fil passe sous votre minimum',
    f1b2: 'Vos propres étiquettes (coton, bébé, amigurumi) pour filtrer',
    f1b3: 'Recherche par nom ou marque',
    cInsT: 'Yeux, rembourrage, rubans',
    cInsP1: 'Quatre façons de mesurer : à l’unité, à la paire, au poids ou à la longueur. Les yeux de sécurité retirent deux unités pour chaque paire utilisée.',
    cInsP2: 'Le prix est par paquet ou à l’unité : un sac de rembourrage de 500 g à 20 000 $ ajoute 2 000 $ au projet où vous avez utilisé 50 g.',
    cProT: 'Le coût se calcule tout seul',
    cProP1: 'La dépense d’un projet ne s’écrit pas à la main. Chaque utilisation que vous lui affectez ajoute sa valeur : fils, fournitures et les heures notées.',
    cProP2: 'Filtrez par En cours, En pause ou Terminé, et à la clôture vous savez exactement combien il a coûté — le chiffre qu’il vous faut pour fixer le prix.',
    cResT: 'Combien vous avez tricoté, combien dépensé',
    cResP1: 'Consommation et dépense par mois, par fil, par fourniture et par projet. Combien de pelotes vous avez au total et lesquelles s’épuisent.',
    cResP2: 'Changez la période (ce mois-ci, le précédent, les trois derniers) et voyez d’un coup quel projet a coûté le plus.',
    cPerT: 'À votre goût',
    cPerP1: 'Thème clair, sombre ou système, et cinq couleurs pour l’appli : rose, pêche, vert, bleu et lilas. C’est enregistré sur votre compte, donc identique sur tous vos appareils.',
    cPerP2: 'Définissez le tarif de votre heure et Nuditos calcule la main-d’œuvre de chaque projet.',
    insBadge: 'Sans magasins, sans téléchargements',
    insT: 'Nuditos vit dans votre navigateur et sur votre écran d’accueil',
    insP: 'C’est une web app : aucun fichier à installer ni APK à chercher. Connectez-vous avec votre e-mail, votre identifiant ou Google, et si vous voulez, gardez-la comme une icône de plus sur le téléphone.',
    insIphoneT: 'Sur iPhone',
    insIphone1: 'Ouvrez le site dans Safari.', insIphone2: 'Touchez Partager, le carré avec la flèche.', insIphone3: 'Choisissez « Sur l’écran d’accueil ».',
    insAndroidT: 'Sur Android',
    insAndroid1: 'Ouvrez-le dans Chrome.', insAndroid2: 'Touchez « Installer l’application » quand elle apparaît.', insAndroid3: 'Sinon, c’est dans le menu à trois points.',
    insPcT: 'Sur l’ordinateur',
    insPcP: 'Le même compte et les mêmes données. Ajoutez vos fils au bureau et notez les utilisations depuis le canapé, sur le téléphone.',
    testT: 'Ce que disent les créatrices',
    test1: '« Avant je fixais le prix au pif. Maintenant je sais que ce lapin m’a coûté 9 400 $ et je facture sereinement. »',
    test2: '« J’ai arrêté d’acheter du fil en double. Je regarde l’appli en boutique et je sais ce qu’il me manque. »',
    test3: '« Les yeux à la paire m’ont sauvée. Mes comptes ne tombaient jamais juste. »',
    prBadge: '14 jours gratuits, sans carte', prT: 'Moins qu’une pelote par mois',
    prP: 'Essayez tout pendant deux semaines. Ensuite choisissez le plan qui vous convient : plus il est long, moins le mois coûte cher.',
    prMensual: 'Mensuel', prTrim: 'Trimestriel', prSem: 'Semestriel', prAnual: 'Annuel',
    prPerMes: 'USD / mois', prPer3: 'USD / 3 mois', prPer6: 'USD / 6 mois', prPerAno: 'USD / an',
    prMensualSub: 'Pour essayer sans engagement', prAlMes: 'par mois',
    prTrimAhorra: 'économisez 13%', prSemAhorra: 'économisez 20%', prAnualAhorra: 'économisez 33%',
    prSuscribir: 'S’abonner', prMejor: 'Meilleur prix',
    prEmbT: 'Vous avez une ambassadrice préférée ?',
    prEmbP: 'Utilisez son code dans l’appli et recevez 30 jours d’accès.',
    prSeguro: 'Paiement sécurisé par Lemon Squeezy. Annulez à tout moment.',
    ctaT: 'La prochaine fois qu’on vous demande le prix, vous le savez déjà',
    ctaP: 'Commencez avec 14 jours gratuits. Sans carte, sans rien télécharger.',
    ctaBtn2: 'Se connecter avec Google',
    ftTagline: 'Stock de fils, fournitures et coûts réels pour les créatrices. Vos données vous suivent entre le téléphone et l’ordinateur.',
    ftProducto: 'Produit', ftAyuda: 'Aide', ftLegal: 'Mentions légales',
    ftCentroAyuda: 'Centre d’aide', ftSoporte: 'Contacter le support',
    ftTerminos: 'Conditions', ftPrivacidad: 'Confidentialité', ftReembolsos: 'Remboursements',
    ftCopy: '© 2026 Nuditos · Fait avec du fil et de l’amour 🧶',
  },
} as const

const t = computed(() => T[idioma.value])

// Frases de la cinta (repetidas para llenar el ancho de la marquesina)
const cintaFrases = computed(() => {
  const f = [t.value.m1, t.value.m2, t.value.m3, t.value.m4]
  return [...f, ...f]
})

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
  detectarIdioma()
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
        <p style="margin:4px 0 0;font-size:15px;color:#9A9085">{{ t.cargando }}</p>
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
          <a href="#funciones" style="color:inherit">{{ t.funciones }}</a>
          <a href="#instalar" style="color:inherit">{{ t.instalar }}</a>
          <a href="#precios" style="color:inherit">{{ t.precios }}</a>
          <NuxtLink to="/tienda-de-patrones" style="color:inherit">{{ t.tienda }}</NuxtLink>
        </nav>
        <div style="display:flex;align-items:center;gap:10px">
          <!-- Selector de idioma (siempre visible) -->
          <select
            :value="idioma"
            aria-label="Idioma"
            style="padding:8px 28px 8px 12px;border-radius:12px;border:1.5px solid #ECE3D6;background:#fff;font-size:13px;font-weight:700;color:#4A443D;cursor:inherit;appearance:none;-webkit-appearance:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239A9085%22 stroke-width=%223%22 stroke-linecap=%22round%22><path d=%22M6 9l6 6 6-6%22/></svg>');background-repeat:no-repeat;background-position:right 10px center"
            @change="onIdiomaChange"
          >
            <option v-for="l in IDIOMAS" :key="l.code" :value="l.code">{{ l.code.toUpperCase() }}</option>
          </select>

          <!-- Escritorio: botones -->
          <NuxtLink v-if="amplio" :to="appUrl('/login')" class="nd-alza nd-alza-borde" style="padding:9px 16px;border-radius:14px;border:1.5px solid #ECE3D6;background:#fff;font-size:14px;font-weight:700;color:#4A443D">{{ t.entrar }}</NuxtLink>
          <NuxtLink v-if="amplio" :to="appUrl('/login')" class="nd-alza" style="padding:10px 18px;border-radius:14px;background:#C06B86;font-size:14px;font-weight:800;color:#fff;box-shadow:0 6px 16px -6px rgba(192,107,134,.7)">{{ t.probar }}</NuxtLink>

          <!-- Móvil: botón menú -->
          <button
            v-else type="button" aria-label="Menú"
            style="display:flex;align-items:center;justify-content:center;width:44px;height:40px;border-radius:12px;border:1.5px solid #ECE3D6;background:#fff;cursor:inherit"
            @click="menuAbierto = !menuAbierto"
          >
            <svg v-if="!menuAbierto" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A443D" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A443D" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>

      <!-- Móvil: panel del menú -->
      <div v-if="!amplio && menuAbierto" style="border-top:1px solid #ECE3D6;background:#fff;padding:10px 22px 18px">
        <a href="#funciones" style="display:block;padding:12px 4px;font-size:16px;font-weight:700;color:#4A443D" @click="menuAbierto = false">{{ t.funciones }}</a>
        <a href="#instalar" style="display:block;padding:12px 4px;font-size:16px;font-weight:700;color:#4A443D" @click="menuAbierto = false">{{ t.instalar }}</a>
        <a href="#precios" style="display:block;padding:12px 4px;font-size:16px;font-weight:700;color:#4A443D" @click="menuAbierto = false">{{ t.precios }}</a>
        <NuxtLink to="/tienda-de-patrones" style="display:block;padding:12px 4px 16px;font-size:16px;font-weight:700;color:#4A443D;border-bottom:1px solid #ECE3D6;margin-bottom:14px" @click="menuAbierto = false">{{ t.tienda }}</NuxtLink>
        <NuxtLink :to="appUrl('/login')" style="display:block;text-align:center;padding:12px;border-radius:14px;border:1.5px solid #ECE3D6;background:#fff;font-size:15px;font-weight:700;color:#4A443D;margin-bottom:10px" @click="menuAbierto = false">{{ t.entrar }}</NuxtLink>
        <NuxtLink :to="appUrl('/login')" style="display:block;text-align:center;padding:13px;border-radius:14px;background:#C06B86;font-size:15px;font-weight:800;color:#fff" @click="menuAbierto = false">{{ t.probar }}</NuxtLink>
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
        <div class="nd-center-mobile" style="flex:1 1 330px;min-width:0" data-stagger="left|left|suave|pop|suave" data-paso="110">
          <span style="display:inline-block;white-space:nowrap;padding:7px 14px;border-radius:999px;background:#DCEDD8;color:#4E7A4A;font-size:13px;font-weight:800;letter-spacing:.02em">{{ t.heroBadge }}</span>
          <h1 style="margin:18px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(40px,6.4vw,74px);line-height:1.02;letter-spacing:-.03em;color:#4A443D;text-wrap:balance">{{ t.heroT1 }}<br><span style="color:#C06B86">{{ t.heroT2 }}</span></h1>
          <p style="margin:20px 0 0;font-size:clamp(17px,1.5vw,21px);line-height:1.55;color:#7d7368;max-width:30em;text-wrap:pretty">{{ t.heroP }}</p>
          <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px">
            <NuxtLink :to="appUrl('/login')" class="nd-alza" style="padding:16px 28px;border-radius:18px;background:#C06B86;color:#fff;font-size:17px;font-weight:800;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)">{{ t.heroCta1 }}</NuxtLink>
            <NuxtLink :to="appUrl('/login')" class="nd-alza nd-alza-borde" style="padding:16px 26px;border-radius:18px;background:#fff;border:1.5px solid #ECE3D6;color:#4A443D;font-size:17px;font-weight:800">{{ t.heroCta2 }}</NuxtLink>
          </div>
          <div style="margin-top:20px;display:flex;flex-wrap:wrap;gap:8px 20px;font-size:14px;font-weight:600;color:#9A9085">
            <span>{{ t.heroCk1 }}</span><span>{{ t.heroCk2 }}</span><span>{{ t.heroCk3 }}</span>
          </div>
        </div>

        <div class="nd-phone-col" style="flex:0 1 360px;display:flex;justify-content:center;min-width:0" data-reveal data-anim="zoom">
          <div style="position:relative">
            <div style="position:absolute;inset:-26px -22px;border-radius:60px;background:radial-gradient(circle at 50% 40%,#F6D7E0 0%,rgba(246,215,224,0) 68%);filter:blur(2px)"></div>
            <div style="position:relative;width:clamp(230px,26vw,282px);border-radius:46px;padding:9px;background:linear-gradient(155deg,#5b544c,#2f2a25);box-shadow:0 34px 60px -22px rgba(74,68,61,.55);animation:nd-float 9s ease-in-out infinite">
              <div style="border-radius:38px;overflow:hidden;background:#FBF6EE">
                <img src="/capturas/hilos.jpg" alt="Lista de hilos en Nuditos" style="display:block;width:100%">
              </div>
            </div>
            <div style="position:absolute;transform:rotate(-8deg);bottom:52px;left:-38px;padding:10px 15px;border-radius:16px;background:#fff;border:1.5px solid #ECE3D6;box-shadow:0 12px 26px -14px rgba(74,68,61,.4);font-size:13px;font-weight:800;color:#4E7A4A">{{ t.heroChip1 }}</div>
            <div style="position:absolute;transform:rotate(7deg);top:32%;right:-30px;padding:10px 15px;border-radius:16px;background:#FBE6D6;box-shadow:0 12px 26px -14px rgba(168,92,50,.4);font-size:13px;font-weight:800;color:#A85C32">{{ t.heroChip2 }}</div>
          </div>
        </div>
      </div>

      <div style="height:28px;background:radial-gradient(circle at 14px 28px,transparent 14px,#4E7A4A 14px) repeat-x;background-size:28px 28px"></div>
    </section>

    <section style="background:#4E7A4A;color:#EAF3E7;padding:16px 0;overflow:hidden">
      <div style="display:flex;width:max-content;animation:nd-marquesina 34s linear infinite">
        <div class="nd-cinta">
          <template v-for="(frase, i) in cintaFrases" :key="i"><span>{{ frase }}</span><span style="opacity:.5">✿</span></template>
        </div>
        <div class="nd-cinta" aria-hidden="true">
          <template v-for="(frase, i) in cintaFrases" :key="i"><span>{{ frase }}</span><span style="opacity:.5">✿</span></template>
        </div>
      </div>
    </section>

    <section id="funciones" style="position:relative;padding:clamp(56px,4.5vw,72px) 22px">
      <div style="max-width:1160px;margin:0 auto">
        <div class="nd-center-mobile" style="max-width:600px" data-stagger="down|up|suave" data-paso="105">
          <span style="display:inline-block;padding:6px 13px;border-radius:999px;background:#F6D7E0;color:#C06B86;font-size:13px;font-weight:800">{{ t.fnBadge }}</span>
          <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.06;letter-spacing:-.025em">{{ t.fnT }}</h2>
          <p style="margin:12px 0 0;font-size:17px;line-height:1.55;color:#7d7368;text-wrap:pretty">{{ t.fnP }}</p>
        </div>

        <div style="margin-top:clamp(20px,2.2vw,28px);display:flex;flex-wrap:wrap;align-items:flex-start;gap:clamp(26px,4vw,52px)" data-reveal>
          <div class="nd-center-mobile" style="flex:1 1 360px;min-width:0" data-stagger="left|left|suave|suave" data-paso="105">
            <span style="font-size:30px">🧶</span>
            <h3 style="margin:6px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(26px,3vw,38px);line-height:1.1;letter-spacing:-.02em;color:#C06B86">{{ t.f1T }}</h3>
            <p style="margin:10px 0 0;font-size:17px;line-height:1.55;color:#7d7368;max-width:32em;text-wrap:pretty">{{ t.f1P }}</p>
            <ul style="margin:16px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px;font-size:16px;font-weight:600" data-stagger="left" data-paso="90">
              <li style="display:flex;gap:10px"><span style="color:#4E7A4A">✔</span><span>{{ t.f1b1 }}</span></li>
              <li style="display:flex;gap:10px"><span style="color:#4E7A4A">✔</span><span>{{ t.f1b2 }}</span></li>
              <li style="display:flex;gap:10px"><span style="color:#4E7A4A">✔</span><span>{{ t.f1b3 }}</span></li>
            </ul>
          </div>
          <div class="nd-feature-phone nd-phone-col" style="flex:0 1 340px;display:flex;justify-content:center;min-width:0">
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
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#A85C32">{{ t.cInsT }}</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">{{ t.cInsP1 }}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">{{ t.cInsP2 }}</p>
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
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#4E7A4A">{{ t.cProT }}</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">{{ t.cProP1 }}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">{{ t.cProP2 }}</p>
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
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#4A7BA6">{{ t.cResT }}</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">{{ t.cResP1 }}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">{{ t.cResP2 }}</p>
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
              <h3 style="margin:8px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:26px;letter-spacing:-.02em;color:#C06B86">{{ t.cPerT }}</h3>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.6;color:#7d7368;text-wrap:pretty">{{ t.cPerP1 }}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#9A9085">{{ t.cPerP2 }}</p>
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
        <span style="display:inline-block;padding:6px 13px;border-radius:999px;background:#DCEDD8;color:#4E7A4A;font-size:13px;font-weight:800">{{ t.insBadge }}</span>
        <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.06;letter-spacing:-.025em">{{ t.insT }}</h2>
        <p style="margin:14px auto 0;max-width:34em;font-size:17px;line-height:1.6;color:#7d7368;text-wrap:pretty">{{ t.insP }}</p>
        <div style="margin-top:38px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;text-align:left" data-stagger="left|pop|right" data-paso="130">
          <div style="border-radius:28px;background:#fff;border:1.5px solid #ECE3D6;padding:26px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px">{{ t.insIphoneT }}</p>
            <ol style="margin:14px 0 0;padding-left:20px;list-style:decimal;font-size:16px;line-height:1.7;color:#7d7368">
              <li>{{ t.insIphone1 }}</li>
              <li>{{ t.insIphone2 }}</li>
              <li>{{ t.insIphone3 }}</li>
            </ol>
          </div>
          <div style="border-radius:28px;background:#fff;border:1.5px solid #ECE3D6;padding:26px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px">{{ t.insAndroidT }}</p>
            <ol style="margin:14px 0 0;padding-left:20px;list-style:decimal;font-size:16px;line-height:1.7;color:#7d7368">
              <li>{{ t.insAndroid1 }}</li>
              <li>{{ t.insAndroid2 }}</li>
              <li>{{ t.insAndroid3 }}</li>
            </ol>
          </div>
          <div style="border-radius:28px;background:#DCEDD8;padding:26px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px;color:#4E7A4A">{{ t.insPcT }}</p>
            <p style="margin:14px 0 0;font-size:16px;line-height:1.7;color:#4A443D">{{ t.insPcP }}</p>
          </div>
        </div>
      </div>
    </section>

    <section style="padding:clamp(60px,8vw,104px) 22px">
      <div style="max-width:1160px;margin:0 auto">
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:14px" data-reveal>
          <h2 style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(30px,4vw,48px);line-height:1.08;letter-spacing:-.025em">{{ t.testT }}</h2>
        </div>
        <div style="margin-top:32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px" data-stagger="tilt|zoom|tiltR" data-paso="140">
          <figure style="margin:0;border-radius:30px;background:#F6D7E0;padding:28px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-size:24px;line-height:1.3;letter-spacing:-.01em;color:#8f4a60">{{ t.test1 }}</p>
            <figcaption style="margin-top:18px;font-size:15px;font-weight:700;color:#C06B86">katatejidos</figcaption>
          </figure>
          <figure style="margin:0;border-radius:30px;background:#DCEDD8;padding:28px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-size:24px;line-height:1.3;letter-spacing:-.01em;color:#3d6339">{{ t.test2 }}</p>
            <figcaption style="margin-top:18px;font-size:15px;font-weight:700;color:#4E7A4A">Maira</figcaption>
          </figure>
          <figure style="margin:0;border-radius:30px;background:#D6E6F2;padding:28px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-size:24px;line-height:1.3;letter-spacing:-.01em;color:#3a6484">{{ t.test3 }}</p>
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
          <span style="display:inline-block;padding:6px 13px;border-radius:999px;background:rgba(255,255,255,.18);font-size:13px;font-weight:800">{{ t.prBadge }}</span>
          <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(32px,4.4vw,52px);line-height:1.06;letter-spacing:-.025em">{{ t.prT }}</h2>
          <p style="margin:14px auto 0;max-width:32em;font-size:17px;line-height:1.6;color:rgba(244,249,242,.8);text-wrap:pretty">{{ t.prP }}</p>
        </div>

        <div style="margin-top:38px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px" data-stagger="pop" data-paso="110">
          <div style="border-radius:26px;background:#fff;color:#4A443D;padding:24px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">{{ t.prMensual }}</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em">$5</span><span style="font-size:14px;color:#9A9085"> {{ t.prPerMes }}</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">{{ t.prMensualSub }}</p>
            <NuxtLink :to="appUrl('/plan')" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#F6D7E0;color:#C06B86;font-weight:800;font-size:15px">{{ t.prSuscribir }}</NuxtLink>
          </div>
          <div style="border-radius:26px;background:#fff;color:#4A443D;padding:24px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">{{ t.prTrim }}</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em">$13</span><span style="font-size:14px;color:#9A9085"> {{ t.prPer3 }}</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">≈ $4,33 {{ t.prAlMes }} · <strong style="color:#4E7A4A">{{ t.prTrimAhorra }}</strong></p>
            <NuxtLink :to="appUrl('/plan')" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#F6D7E0;color:#C06B86;font-weight:800;font-size:15px">{{ t.prSuscribir }}</NuxtLink>
          </div>
          <div style="border-radius:26px;background:#fff;color:#4A443D;padding:24px">
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">{{ t.prSem }}</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em">$24</span><span style="font-size:14px;color:#9A9085"> {{ t.prPer6 }}</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">≈ $4,00 {{ t.prAlMes }} · <strong style="color:#4E7A4A">{{ t.prSemAhorra }}</strong></p>
            <NuxtLink :to="appUrl('/plan')" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#F6D7E0;color:#C06B86;font-weight:800;font-size:15px">{{ t.prSuscribir }}</NuxtLink>
          </div>
          <div style="position:relative;border-radius:26px;background:#FDF8F1;color:#4A443D;padding:24px;box-shadow:0 0 0 3px #F6D7E0, 0 22px 40px -20px rgba(0,0,0,.4)">
            <span style="position:absolute;top:-11px;right:18px;padding:4px 10px;border-radius:999px;background:#C06B86;color:#fff;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em">{{ t.prMejor }}</span>
            <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px">{{ t.prAnual }}</p>
            <p style="margin:10px 0 0"><span style="font-family:'Baloo 2',Nunito,sans-serif;font-size:38px;font-weight:800;letter-spacing:-.03em;color:#C06B86">$40</span><span style="font-size:14px;color:#9A9085"> {{ t.prPerAno }}</span></p>
            <p style="margin:4px 0 0;font-size:13px;color:#9A9085">≈ $3,33 {{ t.prAlMes }} · <strong style="color:#4E7A4A">{{ t.prAnualAhorra }}</strong></p>
            <NuxtLink :to="appUrl('/plan')" style="margin-top:18px;display:block;text-align:center;padding:12px;border-radius:14px;background:#C06B86;color:#fff;font-weight:800;font-size:15px;box-shadow:0 10px 20px -10px rgba(192,107,134,.9)">{{ t.prSuscribir }}</NuxtLink>
          </div>
        </div>

        <div style="margin-top:26px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;border-radius:26px;background:rgba(255,255,255,.12);padding:22px 26px" data-reveal>
          <div style="flex:1 1 340px;min-width:0;display:flex;align-items:center;gap:16px">
            <span style="flex:none;font-size:38px;line-height:1">💛</span>
            <div style="min-width:0">
              <p style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:22px">{{ t.prEmbT }}</p>
              <p style="margin:6px 0 0;font-size:15px;line-height:1.55;color:rgba(244,249,242,.82)">{{ t.prEmbP }}</p>
            </div>
          </div>
        </div>
        <p style="margin:18px 0 0;text-align:center;font-size:13px;color:rgba(244,249,242,.65)">{{ t.prSeguro }}</p>
      </div>
    </section>

    <!-- Tienda de patrones -->
    <section id="tienda" style="position:relative;overflow:hidden;background:#F9EFE6;padding:clamp(60px,8vw,104px) 22px;text-align:center">
      <div style="position:absolute;top:16%;right:14%;font-size:clamp(40px,5vw,72px);line-height:1;color:#F0D3DD;pointer-events:none;animation:nd-float 6s ease-in-out infinite">🧶</div>
      <div style="position:relative;max-width:680px;margin:0 auto" data-stagger="zoom|up|suave" data-paso="115">
        <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:#F6D7E0;color:#C06B86;font-size:13px;font-weight:800;letter-spacing:.02em">{{ t.tienda }}</span>
        <h2 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(30px,4.5vw,50px);line-height:1.06;letter-spacing:-.02em;color:#4A443D">{{ t.tiendaTit }}</h2>
        <p style="margin:14px 0 0;font-size:18px;line-height:1.6;color:#7d7368">{{ t.tiendaSub }}</p>
        <NuxtLink to="/tienda-de-patrones" class="nd-alza" style="margin-top:26px;display:inline-block;padding:16px 30px;border-radius:18px;background:#C06B86;color:#fff;font-size:17px;font-weight:800;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)">{{ t.tiendaCta }}</NuxtLink>
      </div>
    </section>

    <section style="position:relative;overflow:hidden;padding:clamp(64px,8vw,110px) 22px;text-align:center">
      <div style="position:absolute;top:12%;left:12%;width:76px;height:76px;border-radius:999px;background:repeating-conic-gradient(from 20deg,#F6D7E0 0deg 20deg,#FBE6D6 20deg 40deg);pointer-events:none;animation:nd-float2 7s ease-in-out infinite"></div>
      <div style="position:absolute;bottom:18%;right:12%;font-size:clamp(46px,5vw,80px);line-height:1;color:#DCEDD8;pointer-events:none;animation:nd-gira 26s linear infinite">✿</div>
      <div style="position:relative;max-width:720px;margin:0 auto" data-stagger="zoom|up|suave|pop" data-paso="115">
        <img src="/nuditos-logo.png" alt="" style="width:120px;animation:nd-float 6s ease-in-out infinite">
        <h2 style="margin:18px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(34px,5vw,58px);line-height:1.04;letter-spacing:-.03em">{{ t.ctaT }}</h2>
        <p style="margin:14px 0 0;font-size:18px;line-height:1.6;color:#7d7368">{{ t.ctaP }}</p>
        <div style="margin-top:28px;display:flex;flex-wrap:wrap;gap:12px;justify-content:center">
          <NuxtLink :to="appUrl('/login')" class="nd-alza" style="padding:16px 30px;border-radius:18px;background:#C06B86;color:#fff;font-size:17px;font-weight:800;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)">{{ t.heroCta1 }}</NuxtLink>
          <NuxtLink :to="appUrl('/login')" class="nd-alza nd-alza-borde" style="padding:16px 28px;border-radius:18px;background:#fff;border:1.5px solid #ECE3D6;color:#4A443D;font-size:17px;font-weight:800">{{ t.ctaBtn2 }}</NuxtLink>
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
          <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#9A9085">{{ t.ftTagline }}</p>
        </div>
        <nav style="display:flex;flex-wrap:wrap;gap:36px;font-size:14px;line-height:2" data-stagger="suave" data-paso="95">
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:800;color:#4A443D;margin-bottom:4px">{{ t.ftProducto }}</span>
            <a href="#funciones">{{ t.funciones }}</a>
            <a href="#instalar">{{ t.instalar }}</a>
            <a href="#precios">{{ t.precios }}</a>
            <NuxtLink to="/tienda-de-patrones">{{ t.tienda }}</NuxtLink>
          </div>
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:800;color:#4A443D;margin-bottom:4px">{{ t.ftAyuda }}</span>
            <NuxtLink to="/ayuda">{{ t.ftCentroAyuda }}</NuxtLink>
            <a href="mailto:cristianvabusiness@gmail.com?subject=Ayuda%20con%20Nuditos">{{ t.ftSoporte }}</a>
          </div>
          <div style="display:flex;flex-direction:column">
            <span style="font-weight:800;color:#4A443D;margin-bottom:4px">{{ t.ftLegal }}</span>
            <NuxtLink to="/terminos">{{ t.ftTerminos }}</NuxtLink>
            <NuxtLink to="/privacidad">{{ t.ftPrivacidad }}</NuxtLink>
            <NuxtLink to="/reembolsos">{{ t.ftReembolsos }}</NuxtLink>
          </div>
        </nav>
      </div>
      <p style="max-width:1160px;margin:32px auto 0;padding-top:20px;border-top:1px solid #ECE3D6;font-size:13px;color:#9A9085">{{ t.ftCopy }}</p>
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
  cursor: url('/aguja-cursor.svg') 5 3, auto;
}
/* La aguja de tejer como cursor en toda la landing (también sobre enlaces
   y botones, que por defecto usarían el puntero). En táctil no aplica. */
.nd :deep(*) {
  box-sizing: border-box;
  cursor: url('/aguja-cursor.svg') 5 3, auto;
}
.nd a { color: #C06B86; text-decoration: none; }
.nd a:hover { color: #A85C32; }

/* Navbar: subrayado animado que crece desde la izquierda al pasar el mouse */
.nd nav a { position: relative; transition: color .2s ease; }
.nd nav a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -5px;
  height: 2px;
  width: 100%;
  border-radius: 2px;
  background: #C06B86;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .28s cubic-bezier(.4, 0, .2, 1);
}
.nd nav a:hover { color: #C06B86; }
.nd nav a:hover::after { transform: scaleX(1); }
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

/* En móvil, centrar los bloques de texto principales (hero, intro, primera función) */
@media (max-width: 819px) {
  .nd-center-mobile { text-align: center; }
  .nd-center-mobile p { margin-left: auto; margin-right: auto; }
  .nd-center-mobile > div { justify-content: center; }
  .nd-center-mobile ul { align-items: center; }
  /* Los teléfonos ocupan el ancho completo y quedan centrados.
     !important para ganarle al flex-basis del estilo inline. */
  .nd-phone-col { flex-basis: 100% !important; }
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
