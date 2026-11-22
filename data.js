// =====================================================================
//  ECOS DE VIDRIO — datos del juego (historia, personajes, enemigos)
//  Historia y personajes originales.
// =====================================================================

export const MAGIAS = {
  fuego:  { nombre: 'Fuego',  elem: 'fuego',  poder: 26, color: 0xff6a2a, desc: 'Daño de fuego a un enemigo' },
  hielo:  { nombre: 'Hielo',  elem: 'hielo',  poder: 26, color: 0x8fe3ff, desc: 'Daño de hielo a un enemigo' },
  rayo:   { nombre: 'Rayo',   elem: 'rayo',   poder: 26, color: 0xffe14a, desc: 'Daño eléctrico a un enemigo' },
  piedra: { nombre: 'Piedra', elem: 'tierra', poder: 32, color: 0xc49a5a, desc: 'Daño de tierra a un enemigo' },
  cura:   { nombre: 'Cura',   elem: null,     poder: 70, color: 0x7dffb0, desc: 'Recupera vida de un aliado', cura: true },
};

// Cuánto suma cada unidad de magia vinculada a cada estadística
export const FACTOR_VINCULO = {
  vida:      { cura: 3.2, piedra: 2.0, _: 1.5 },
  fuerza:    { fuego: 0.26, piedra: 0.30, _: 0.12 },
  defensa:   { hielo: 0.26, piedra: 0.30, _: 0.12 },
  magia:     { rayo: 0.26, cura: 0.20, _: 0.12 },
  velocidad: { rayo: 0.16, _: 0.08 },
};
export const NOMBRE_STAT = { vida: 'Vida', fuerza: 'Fuerza', defensa: 'Defensa', magia: 'Magia', velocidad: 'Velocidad' };

// Ecos: criaturas ancestrales que se invocan en combate
export const ECOS = {
  ignar:    { nombre: 'Ignar',    titulo: 'Salamandra del Horno', elem: 'fuego',  poder: 70,  color: 0xff5a1f, stats: ['fuerza', 'vida'],      ataque: 'Aliento de Forja' },
  volt:     { nombre: 'Volt',     titulo: 'Halcón de la Tormenta', elem: 'rayo',  poder: 85,  color: 0xffd23a, stats: ['magia', 'velocidad'],  ataque: 'Picada Relámpago' },
  nivalis:  { nombre: 'Nivalis',  titulo: 'Ciervo de Escarcha',   elem: 'hielo',  poder: 100, color: 0x9be8ff, stats: ['defensa', 'vida'],     ataque: 'Bosque Blanco' },
  terragon: { nombre: 'Terragon', titulo: 'Tortuga del Abismo',   elem: 'tierra', poder: 120, color: 0x9c7a46, stats: ['defensa', 'fuerza'],   ataque: 'Continente Caído' },
};

// Personajes jugables
export const PERSONAJES = {
  kael: {
    nombre: 'Kael Varo', corto: 'Kael', color: '#ff8a3d',
    base: { vida: 220, fuerza: 18, defensa: 10, magia: 10, velocidad: 12 },
    crece: { vida: 24, fuerza: 2.3, defensa: 1.6, magia: 1.4, velocidad: 0.6 },
    arte: { nombre: 'Corte del Alba', tipo: 'fisico', mult: 3.2, elem: 'fuego', desc: 'Golpe devastador a un enemigo' },
    modelo: { piel: 0xf1c7a0, pelo: 0x2a1a12, ropa: 0x2f4a7a, acento: 0xff8a3d, arma: 'espada' },
  },
  lyra: {
    nombre: 'Lyra Sol', corto: 'Lyra', color: '#7fd8ff',
    base: { vida: 170, fuerza: 10, defensa: 8, magia: 20, velocidad: 14 },
    crece: { vida: 18, fuerza: 1.2, defensa: 1.3, magia: 2.5, velocidad: 0.7 },
    arte: { nombre: 'Lluvia de Constelaciones', tipo: 'magia_todos', mult: 1.7, elem: null, desc: 'Magia a todos los enemigos' },
    modelo: { piel: 0xe9b48c, pelo: 0xe9e2ff, ropa: 0x3c2a6b, acento: 0x7fd8ff, arma: 'baculo' },
  },
  doran: {
    nombre: 'Doran Ferrum', corto: 'Doran', color: '#b9d36b',
    base: { vida: 280, fuerza: 22, defensa: 16, magia: 6, velocidad: 8 },
    crece: { vida: 28, fuerza: 2.5, defensa: 2.1, magia: 0.8, velocidad: 0.5 },
    arte: { nombre: 'Martillo del Juramento', tipo: 'fisico_cura', mult: 2.6, elem: 'tierra', desc: 'Golpe fuerte y cura al grupo' },
    modelo: { piel: 0x9a6b4a, pelo: 0x1a1a1a, ropa: 0x5b5f66, acento: 0xb9d36b, arma: 'martillo' },
  },
};

// Enemigos
export const ENEMIGOS = {
  arenisco:   { nombre: 'Arenisco',          vida: 60,   fuerza: 12, defensa: 4,  magia: 6,  velocidad: 8,  magias: ['fuego'],                  debil: 'hielo', xp: 14,  forma: 'baba',     color: 0xe0b45a },
  escorpion:  { nombre: 'Escorpión Vítreo',  vida: 85,   fuerza: 16, defensa: 8,  magia: 5,  velocidad: 11, magias: ['hielo', 'cura'],          debil: 'fuego', xp: 20,  forma: 'escorpion',color: 0x9fe7ff },
  golem:      { nombre: 'Gólem de Vidrio',   vida: 700,  fuerza: 24, defensa: 12, magia: 8,  velocidad: 7,  magias: ['fuego', 'piedra'],        debil: 'hielo', xp: 140, forma: 'golem',    color: 0xb8f0ff, jefe: true, especial: { nombre: 'Pisotón Cristalino', cada: 3, todos: true, mult: 1.1 } },
  soldado:    { nombre: 'Soldado del Sello', vida: 125,  fuerza: 20, defensa: 10, magia: 8,  velocidad: 10, magias: ['rayo', 'cura'],           debil: 'rayo',  xp: 32,  forma: 'soldado',  color: 0x7a1f2b },
  lobo:       { nombre: 'Lobo de Tormenta',  vida: 145,  fuerza: 24, defensa: 8,  magia: 8,  velocidad: 15, magias: ['rayo'],                   debil: 'fuego', xp: 36,  forma: 'lobo',     color: 0x4b5b8f },
  ave:        { nombre: 'Ave Espina',        vida: 115,  fuerza: 20, defensa: 6,  magia: 16, velocidad: 16, magias: ['hielo', 'rayo'],          debil: 'tierra',xp: 34,  forma: 'ave',      color: 0x2e8f6a },
  grifo:      { nombre: 'Grifo de Tormenta', vida: 1500, fuerza: 30, defensa: 14, magia: 22, velocidad: 14, magias: ['rayo', 'cura'],           debil: 'hielo', xp: 320, forma: 'grifo',    color: 0xd8c25a, jefe: true, especial: { nombre: 'Huracán de Plumas', cada: 3, todos: true, magico: true, elem: 'rayo', poder: 40 } },
  doran_duelo:{ nombre: 'Doran Ferrum',      vida: 1300, fuerza: 32, defensa: 20, magia: 6,  velocidad: 9,  magias: ['hielo', 'piedra'],        debil: 'rayo',  xp: 280, forma: 'doran',    color: 0x5b5f66, jefe: true, especial: { nombre: 'Golpe de Juramento', cada: 3, todos: false, mult: 1.8 } },
  centinela:  { nombre: 'Centinela Rúnico',  vida: 240,  fuerza: 32, defensa: 22, magia: 10, velocidad: 9,  magias: ['piedra', 'cura'],         debil: 'rayo',  xp: 60,  forma: 'centinela',color: 0x6f7486 },
  mago:       { nombre: 'Mago del Sello',    vida: 170,  fuerza: 14, defensa: 10, magia: 28, velocidad: 13, magias: ['fuego', 'hielo', 'rayo'],  debil: 'fuego', xp: 58,  forma: 'mago',     color: 0x6a1f8a },
  varek:      { nombre: 'Inquisidor Varek',  vida: 2600, fuerza: 40, defensa: 20, magia: 30, velocidad: 14, magias: ['hielo', 'rayo', 'cura'],  debil: 'fuego', xp: 650, forma: 'varek',    color: 0xa3122a, jefe: true, especial: { nombre: 'Sentencia Carmesí', cada: 3, todos: true, magico: true, elem: null, poder: 55 } },
  espectro:   { nombre: 'Espectro de Memoria',vida: 270, fuerza: 26, defensa: 12, magia: 34, velocidad: 15, magias: ['hielo', 'cura'],          debil: 'fuego', xp: 90,  forma: 'espectro', color: 0xb69cff },
  quimera:    { nombre: 'Quimera de Cristal', vida: 400, fuerza: 44, defensa: 18, magia: 20, velocidad: 12, magias: ['fuego', 'piedra'],        debil: 'rayo',  xp: 120, forma: 'quimera',  color: 0x58e0c8 },
  morvaine:   { nombre: 'Archivista Morvaine',vida: 3400,fuerza: 34, defensa: 22, magia: 42, velocidad: 16, magias: ['fuego','hielo','rayo','cura'], debil: 'rayo', xp: 0, forma: 'morvaine', color: 0x1d1b3a, jefe: true, especial: { nombre: 'Página en Blanco', cada: 3, todos: true, magico: true, elem: null, poder: 60, olvido: true } },
  vacio:      { nombre: 'Eco Primordial: Vacío', vida: 4800, fuerza: 50, defensa: 24, magia: 50, velocidad: 15, magias: ['fuego','hielo','rayo','piedra'], debil: null, xp: 1500, forma: 'vacio', color: 0x0a0618, jefe: true, especial: { nombre: 'Olvido Absoluto', cada: 2, todos: true, magico: true, elem: null, poder: 70, olvido: true } },
};

// Zonas del mapa (el mapa es un largo valle que avanza hacia el norte: z negativo)
export const ZONAS = [
  { id: 'ferrovia',  nombre: 'Estación Ferrovia',     desde: 20,   hasta: -14,  segura: true,  suelo: 0xc9a56b, cielo: [0xffb36b, 0x6b8fd6], niebla: 0xe8b98a },
  { id: 'desierto',  nombre: 'Desierto de Vidrio',    desde: -14,  hasta: -62,  encuentros: [['arenisco'], ['arenisco', 'arenisco'], ['escorpion'], ['arenisco', 'escorpion']], suelo: 0xe2c48a, cielo: [0xffd59a, 0x7aa7e8], niebla: 0xf0d2a0 },
  { id: 'bosque',    nombre: 'Bosque de la Tormenta', desde: -62,  hasta: -112, encuentros: [['lobo'], ['ave', 'lobo'], ['ave', 'ave'], ['soldado', 'lobo']], suelo: 0x3d6b45, cielo: [0x7d8fb0, 0x2a3550], niebla: 0x4c5d70 },
  { id: 'fortaleza', nombre: 'Fortaleza del Sello',   desde: -112, hasta: -152, encuentros: [['centinela'], ['mago', 'soldado'], ['centinela', 'mago']], suelo: 0x6b6470, cielo: [0xb05050, 0x2b1830], niebla: 0x6a3a48 },
  { id: 'torre',     nombre: 'Torre del Eco',         desde: -152, hasta: -200, encuentros: [['espectro', 'espectro'], ['quimera'], ['espectro', 'quimera']], suelo: 0x2b2a4a, cielo: [0x5a3a9a, 0x0b0a1e], niebla: 0x2a2150 },
];

// Puertas entre zonas: se abren al llegar a cierto capítulo
export const PUERTAS = [
  { z: -62,  cap: 2, msg: 'Una tormenta de arena bloquea el paso. Primero investiga las ruinas.' },
  { z: -112, cap: 4, msg: 'Un muro de viento impide avanzar. El bosque guarda algo poderoso.' },
  { z: -152, cap: 6, msg: 'Una barrera rúnica sella la Torre. Debes vencer al Inquisidor.' },
];

// Cristales de descanso: curan y guardan
export const CRISTALES = [
  { x: -5, z: 3 }, { x: 6, z: -58 }, { x: -6, z: -108 }, { x: 6, z: -148 }, { x: -6, z: -170 },
];

// Objetivo actual en pantalla según capítulo
export const OBJETIVOS = {
  1: 'Explora el Desierto de Vidrio y llega a las ruinas del norte.',
  2: 'Cruza hacia el Bosque de la Tormenta.',
  3: 'Busca el claro del Grifo al fondo del bosque.',
  4: 'Avanza hacia la Fortaleza del Sello.',
  5: 'Entra al patio de la fortaleza y enfrenta al Inquisidor.',
  6: 'Sube a la cima de la Torre del Eco.',
  7: 'Has salvado la memoria del mundo. Explora libremente.',
};

// Eventos de historia: se activan al acercarse si el capítulo coincide
export const EVENTOS = [
  {
    id: 'golem', cap: 1, x: 0, z: -55, radio: 6, marca: 0xff6a2a,
    antes: [
      { q: 'narrador', t: 'Entre columnas derrumbadas, un brillo rojo late bajo la arena… como un corazón.' },
      { q: 'kael', t: 'Esto no son ruinas comunes. Hay algo vivo ahí abajo.' },
      { q: 'narrador', t: '¡El vidrio del suelo se levanta y toma forma!' },
    ],
    batalla: ['golem'],
    despues: [
      { q: 'narrador', t: 'El gólem se quiebra. Del núcleo surge una salamandra de fuego líquido.' },
      { q: 'ignar', t: 'Mil años dormido… y me despierta un mecánico con las manos llenas de grasa.' },
      { q: 'kael', t: '¿Hablas? ¿Qué eres?' },
      { q: 'ignar', t: 'Soy Ignar, un Eco. Un recuerdo que el mundo olvidó. Si te vinculas conmigo, mi fuego será tuyo.' },
      { q: 'ignar', t: 'Pero cada vez que me llames, tomaré un recuerdo pequeño de tu vida. Ese es el precio.' },
      { q: 'kael', t: '…Si con eso protejo Ferrovia, acepto.' },
      { q: 'sistema', t: '¡Obtuviste el Eco IGNAR! Abre MENÚ → VÍNCULOS para vincular tus magias a Fuerza y Vida.' },
    ],
    premio: { eco: 'ignar', a: 'kael' }, nuevoCap: 2,
  },
  {
    id: 'lyra', cap: 2, x: 0, z: -70, radio: 7, marca: 0x7fd8ff,
    antes: [
      { q: 'lyra', t: '¡Aléjense! ¡No tengo lo que buscan!' },
      { q: 'narrador', t: 'Dos soldados con capas carmesí acorralan a una joven de cabello plateado.' },
      { q: 'kael', t: '¡Oigan! Dos contra una no es justo.' },
    ],
    batalla: ['soldado', 'soldado'],
    despues: [
      { q: 'lyra', t: 'Gracias… Soy Lyra Sol. Era archivista de la Orden del Sello.' },
      { q: 'lyra', t: 'La Archivista Morvaine borró la memoria de mi pueblo entero con un Eco robado. Nadie recuerda que existimos.' },
      { q: 'lyra', t: 'Quiere reunir todos los Ecos para reescribir la memoria del mundo a su gusto.' },
      { q: 'kael', t: 'Entonces vendrá por Ignar… y por mí.' },
      { q: 'lyra', t: 'En el fondo de este bosque duerme otro Eco. Si lo despertamos antes que ella, tendremos una oportunidad.' },
      { q: 'sistema', t: '¡Lyra se unió al grupo! Trae magias de Cura y Rayo.' },
    ],
    premio: { miembro: 'lyra' }, nuevoCap: 3,
  },
  {
    id: 'grifo', cap: 3, x: 0, z: -104, radio: 7, marca: 0xffd23a,
    antes: [
      { q: 'narrador', t: 'Un claro donde los árboles crecen torcidos por el viento. Los relámpagos caen sin nubes.' },
      { q: 'lyra', t: 'Es un guardián. Protege el sueño del Eco. Tendremos que demostrarle nuestra fuerza.' },
    ],
    batalla: ['grifo'],
    despues: [
      { q: 'volt', t: '¡Ja! Ha pasado mucho desde que alguien me hacía sudar las plumas.' },
      { q: 'volt', t: 'Soy Volt. Iré con ustedes… mientras sea divertido.' },
      { q: 'sistema', t: '¡Obtuviste el Eco VOLT! Desbloquea los vínculos de Magia y Velocidad.' },
      { q: 'lyra', t: 'La Fortaleza del Sello está al norte. Morvaine guarda allí los Ecos que ha capturado.' },
    ],
    premio: { eco: 'volt', a: 'lyra' }, nuevoCap: 4,
  },
  {
    id: 'doran', cap: 4, x: 0, z: -118, radio: 7, marca: 0xb9d36b,
    antes: [
      { q: 'doran', t: 'Alto. Soy Doran Ferrum, caballero del Sello. Tengo órdenes de capturar a los Vinculados.' },
      { q: 'lyra', t: 'Doran… tú me enseñaste a usar el báculo. ¿De verdad vas a obedecerla?' },
      { q: 'doran', t: 'Un juramento es un juramento. Muéstrenme si su causa vale más que el mío.' },
    ],
    batalla: ['doran_duelo'],
    despues: [
      { q: 'doran', t: 'Pelean por algo real… lo sentí en cada golpe.' },
      { q: 'doran', t: 'Morvaine nos dijo que los Ecos eran monstruos. Pero los que sufren son los pueblos que ella borra.' },
      { q: 'doran', t: 'Llevo conmigo un Eco que me ordenaron custodiar. Que sirva para algo bueno.' },
      { q: 'nivalis', t: '…Por fin, manos que no me encadenan. Soy Nivalis. Mi escarcha es vuestra.' },
      { q: 'sistema', t: '¡Doran se unió al grupo! ¡Obtuviste el Eco NIVALIS!' },
    ],
    premio: { miembro: 'doran', eco: 'nivalis', a: 'doran' }, nuevoCap: 5,
  },
  {
    id: 'varek', cap: 5, x: 0, z: -144, radio: 7, marca: 0xa3122a,
    antes: [
      { q: 'varek', t: 'Un traidor, una fugitiva y un mecánico. ¿Esta es la rebelión que temía la Archivista?' },
      { q: 'doran', t: 'Varek. Tú sellaste a Terragon en las mazmorras. Libéralo.' },
      { q: 'varek', t: 'Lo liberaré… cuando sea parte de la memoria nueva del mundo. ¡Arrodíllense!' },
    ],
    batalla: ['varek'],
    despues: [
      { q: 'narrador', t: 'Las cadenas rúnicas se rompen. Una tortuga enorme alza la cabeza desde el abismo.' },
      { q: 'terragon', t: 'Lento es mi paso… pero nunca olvido una deuda. Soy Terragon.' },
      { q: 'sistema', t: '¡Obtuviste el Eco TERRAGON!' },
      { q: 'morvaine', t: 'Bravo. Cuatro Ecos reunidos en un solo lugar. Me han ahorrado años de trabajo.' },
      { q: 'morvaine', t: 'Los espero en la cima de la Torre del Eco. Traigan sus recuerdos… los voy a necesitar.' },
    ],
    premio: { eco: 'terragon', a: 'kael' }, nuevoCap: 6,
  },
  {
    id: 'final', cap: 6, x: 0, z: -190, radio: 8, marca: 0xb69cff,
    antes: [
      { q: 'morvaine', t: 'El mundo recuerda guerras, hambre, traiciones. Yo le daré una memoria limpia. Sin dolor.' },
      { q: 'kael', t: 'He perdido recuerdos en este viaje. Ya no sé el nombre de la calle donde crecí.' },
      { q: 'kael', t: 'Pero sé por qué peleo. Y eso no me lo vas a borrar.' },
      { q: 'morvaine', t: 'Entonces serás el primer capítulo que arranque.' },
    ],
    batalla: ['morvaine'],
    medio: [
      { q: 'morvaine', t: 'Imposible… ¡Entonces que despierte lo que hay debajo de todos los recuerdos!' },
      { q: 'narrador', t: 'Morvaine se funde con el Eco Primordial. El cielo se vuelve una página en blanco.' },
      { q: 'lyra', t: '¡Es el Vacío! ¡El olvido mismo!' },
    ],
    batalla2: ['vacio'],
    despues: [
      { q: 'narrador', t: 'El Vacío se rompe como un espejo. Miles de recuerdos regresan volando a sus dueños.' },
      { q: 'lyra', t: 'Mi pueblo… ¡puedo ver sus nombres otra vez!' },
      { q: 'doran', t: 'Un juramento nuevo, entonces: proteger lo que el mundo recuerda.' },
      { q: 'ignar', t: 'Mecánico. Te devuelvo lo que tomé. Lo guardé con cuidado.' },
      { q: 'kael', t: '…Calle de los Faroles. Ahí crecí. Lo recuerdo.' },
      { q: 'narrador', t: 'FIN — Gracias por jugar ECOS DE VIDRIO.' },
    ],
    nuevoCap: 7, fin: true,
  },
];

export const PROLOGO = [
  { q: 'narrador', t: 'Hace siglos, los Ecos —criaturas nacidas de la memoria del mundo— fueron sellados bajo un desierto de vidrio.' },
  { q: 'narrador', t: 'Quien se vincula a un Eco obtiene su poder… a cambio de pequeños pedazos de sus propios recuerdos.' },
  { q: 'narrador', t: 'Hoy, la Orden del Sello caza a los Vinculados. Y su líder, la Archivista Morvaine, busca algo más grande.' },
  { q: 'kael', t: 'Otro día reparando rieles en Ferrovia… Dicen que la tormenta de anoche destapó unas ruinas al norte.' },
  { q: 'tobias', t: '¡Kael! Si vas al desierto, ten cuidado. Los monstruos de arena guardan magia dentro.' },
  { q: 'tobias', t: 'Usa EXTRAER en combate para robársela. Luego puedes lanzarla… o vincularla a tu cuerpo cuando tengas un Eco.' },
  { q: 'sistema', t: 'Muévete con el joystick izquierdo. Arrastra a la derecha para girar la cámara. El cristal azul cura y guarda.' },
];

export const HABLANTES = {
  narrador: { nombre: '', color: '#cfd6ff' },
  sistema:  { nombre: '◆', color: '#ffd54a' },
  kael:     { nombre: 'Kael', color: '#ff8a3d', retrato: 'kael' },
  lyra:     { nombre: 'Lyra', color: '#7fd8ff', retrato: 'lyra' },
  doran:    { nombre: 'Doran', color: '#b9d36b', retrato: 'doran' },
  tobias:   { nombre: 'Maese Tobías', color: '#e0c090', retrato: 'tobias' },
  morvaine: { nombre: 'Morvaine', color: '#c59cff', retrato: 'morvaine' },
  varek:    { nombre: 'Varek', color: '#ff5a6a', retrato: 'varek' },
  ignar:    { nombre: 'Ignar', color: '#ff6a2a', retrato: 'ignar' },
  volt:     { nombre: 'Volt', color: '#ffd23a', retrato: 'volt' },
  nivalis:  { nombre: 'Nivalis', color: '#9be8ff', retrato: 'nivalis' },
  terragon: { nombre: 'Terragon', color: '#c9a46a', retrato: 'terragon' },
};
