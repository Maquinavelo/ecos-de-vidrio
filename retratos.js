// Retratos 2D originales (SVG) para diálogos y menús
const P = {
  kael:     { fondo: ['#ff9a4a', '#5a2a14'], piel: '#f1c7a0', pelo: '#2a1a12', ojos: '#d9681e', ropa: '#2f4a7a', acento: '#ff8a3d', estilo: 'puntas' },
  lyra:     { fondo: ['#7fd8ff', '#1d2a5a'], piel: '#e9b48c', pelo: '#ece6ff', ojos: '#4aa8ff', ropa: '#3c2a6b', acento: '#7fd8ff', estilo: 'largo' },
  doran:    { fondo: ['#b9d36b', '#2a3318'], piel: '#9a6b4a', pelo: '#1a1a1a', ojos: '#3a2a1a', ropa: '#5b5f66', acento: '#b9d36b', estilo: 'corto', barba: true },
  tobias:   { fondo: ['#e0c090', '#4a3420'], piel: '#d8a882', pelo: '#d8d8d8', ojos: '#4a3a2a', ropa: '#6a4a2a', acento: '#e0c090', estilo: 'calvo', barba: true },
  morvaine: { fondo: ['#8a5ae0', '#120a24'], piel: '#e8e0f0', pelo: '#120d1e', ojos: '#c59cff', ropa: '#1d1b3a', acento: '#c59cff', estilo: 'recogido' },
  varek:    { fondo: ['#ff5a6a', '#2a0a10'], piel: '#d9b8a0', pelo: '#e8e8e8', ojos: '#ff2a3a', ropa: '#7a0f20', acento: '#ffcc55', estilo: 'corto', corona: true },
};
const ECO = {
  ignar:    { c1: '#ffb347', c2: '#ff3d00', ojo: '#fff3a0', forma: 'salamandra' },
  volt:     { c1: '#fff07a', c2: '#e0a800', ojo: '#1a1a1a', forma: 'halcon' },
  nivalis:  { c1: '#e8fbff', c2: '#5cc8f0', ojo: '#1a3a6a', forma: 'ciervo' },
  terragon: { c1: '#c9a46a', c2: '#5a4020', ojo: '#ffe08a', forma: 'tortuga' },
};

function pelo(p) {
  switch (p.estilo) {
    case 'puntas': return `<path d="M30 52 L22 30 L38 40 L40 18 L52 36 L60 14 L66 36 L80 20 L80 42 L96 34 L90 56 Q60 34 30 52Z" fill="${p.pelo}"/>`;
    case 'largo': return `<path d="M28 58 Q26 18 60 16 Q94 18 92 58 L98 112 L82 112 L84 60 Q60 40 36 60 L38 112 L22 112Z" fill="${p.pelo}"/><path d="M34 50 Q50 30 70 34 Q60 42 54 52Z" fill="${p.pelo}"/>`;
    case 'corto': return `<path d="M32 52 Q30 22 60 20 Q90 22 88 52 Q76 34 60 36 Q44 34 32 52Z" fill="${p.pelo}"/>`;
    case 'calvo': return `<path d="M32 56 Q34 44 40 46 L40 58Z M88 56 Q86 44 80 46 L80 58Z" fill="${p.pelo}"/>`;
    case 'recogido': return `<circle cx="60" cy="14" r="12" fill="${p.pelo}"/><path d="M30 60 Q28 20 60 22 Q92 20 90 60 Q86 40 60 34 Q34 40 30 60Z" fill="${p.pelo}"/><path d="M30 60 L26 96 L36 96 L36 62Z M90 60 L94 96 L84 96 L84 62Z" fill="${p.pelo}"/>`;
  }
  return '';
}

export function retrato(id, tam = 96) {
  if (ECO[id]) return retratoEco(id, tam);
  const p = P[id];
  if (!p) return '';
  const g = 'g' + id;
  return `<svg viewBox="0 0 120 120" width="${tam}" height="${tam}" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="${g}" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${p.fondo[0]}"/><stop offset="1" stop-color="${p.fondo[1]}"/></radialGradient></defs>
  <rect width="120" height="120" rx="14" fill="url(#${g})"/>
  ${p.estilo === 'largo' || p.estilo === 'recogido' ? pelo(p) : ''}
  <path d="M18 120 Q22 92 60 88 Q98 92 102 120Z" fill="${p.ropa}"/>
  <path d="M46 92 L60 104 L74 92 L70 88 L60 96 L50 88Z" fill="${p.acento}"/>
  <rect x="52" y="74" width="16" height="18" fill="${p.piel}"/>
  <ellipse cx="60" cy="56" rx="27" ry="31" fill="${p.piel}"/>
  ${p.barba ? `<path d="M36 64 Q40 92 60 92 Q80 92 84 64 Q76 80 60 80 Q44 80 36 64Z" fill="${p.pelo === '#d8d8d8' ? '#e8e8e8' : p.pelo}"/>` : ''}
  <ellipse cx="49" cy="58" rx="5.5" ry="6.5" fill="#fff"/><ellipse cx="71" cy="58" rx="5.5" ry="6.5" fill="#fff"/>
  <ellipse cx="50" cy="59" rx="3.6" ry="4.8" fill="${p.ojos}"/><ellipse cx="70" cy="59" rx="3.6" ry="4.8" fill="${p.ojos}"/>
  <circle cx="51" cy="57" r="1.3" fill="#fff"/><circle cx="71" cy="57" r="1.3" fill="#fff"/>
  <path d="M42 49 L55 51 M65 51 L78 49" stroke="${p.pelo === '#ece6ff' ? '#8a7ab0' : '#2a1a12'}" stroke-width="2.4" stroke-linecap="round"/>
  ${p.barba ? '' : `<path d="M54 74 Q60 77 66 74" stroke="#8a4a3a" stroke-width="2" fill="none" stroke-linecap="round"/>`}
  ${p.estilo !== 'largo' && p.estilo !== 'recogido' ? pelo(p) : ''}
  ${p.corona ? `<path d="M36 30 L42 14 L50 28 L60 10 L70 28 L78 14 L84 30Z" fill="${p.acento}"/>` : ''}
</svg>`;
}

function retratoEco(id, tam) {
  const e = ECO[id];
  const g = 'e' + id;
  let cuerpo = '';
  if (e.forma === 'salamandra') cuerpo = `<path d="M20 86 Q40 60 64 66 Q90 72 100 52 Q104 74 84 84 Q62 96 40 90 Q30 96 20 86Z" fill="${e.c2}"/><circle cx="92" cy="52" r="14" fill="${e.c2}"/><path d="M52 64 L56 46 L62 64 M66 66 L72 48 L76 68" fill="${e.c1}"/><circle cx="96" cy="48" r="3.5" fill="${e.ojo}"/>`;
  if (e.forma === 'halcon') cuerpo = `<path d="M60 50 L10 30 Q30 60 52 66Z M60 50 L110 30 Q90 60 68 66Z" fill="${e.c2}"/><ellipse cx="60" cy="66" rx="14" ry="22" fill="${e.c1}"/><circle cx="60" cy="44" r="11" fill="${e.c1}"/><path d="M60 48 L66 56 L58 54Z" fill="#e07a00"/><circle cx="56" cy="42" r="2.6" fill="${e.ojo}"/><circle cx="64" cy="42" r="2.6" fill="${e.ojo}"/>`;
  if (e.forma === 'ciervo') cuerpo = `<path d="M50 40 L40 14 M44 26 L32 20 M54 40 L64 12 M60 24 L74 18" stroke="${e.c2}" stroke-width="4" stroke-linecap="round" fill="none"/><ellipse cx="56" cy="52" rx="12" ry="16" fill="${e.c1}"/><ellipse cx="60" cy="92" rx="30" ry="16" fill="${e.c1}"/><rect x="50" y="62" width="12" height="22" fill="${e.c1}"/><circle cx="52" cy="50" r="2.6" fill="${e.ojo}"/><circle cx="60" cy="50" r="2.6" fill="${e.ojo}"/>`;
  if (e.forma === 'tortuga') cuerpo = `<path d="M14 88 Q20 44 60 42 Q100 44 106 88Z" fill="${e.c2}"/><path d="M34 86 L44 58 L60 66 L76 58 L86 86 M44 58 L60 46 L76 58" stroke="${e.c1}" stroke-width="3" fill="none"/><ellipse cx="60" cy="96" rx="44" ry="8" fill="${e.c1}"/><circle cx="106" cy="76" r="11" fill="${e.c1}"/><circle cx="109" cy="73" r="2.5" fill="${e.ojo}"/>`;
  return `<svg viewBox="0 0 120 120" width="${tam}" height="${tam}" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="${g}" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="${e.c1}" stop-opacity=".55"/><stop offset="1" stop-color="#0a0a18"/></radialGradient></defs>
  <rect width="120" height="120" rx="14" fill="url(#${g})"/>${cuerpo}</svg>`;
}
