import * as THREE from './three.module.js';

// ---------- Material estilo anime (cel-shading) ----------
const grad = (() => {
  const d = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
const cacheMat = new Map();
export function toon(color, extra = {}) {
  const k = color + JSON.stringify(extra);
  if (cacheMat.has(k)) return cacheMat.get(k);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra });
  cacheMat.set(k, m);
  return m;
}
const matBorde = new THREE.MeshBasicMaterial({ color: 0x14101c, side: THREE.BackSide });

export function contorno(grupo, grosor = 1.07) {
  const lista = [];
  grupo.traverse(o => { if (o.isMesh && !o.userData.sinBorde && !o.userData.esBorde) lista.push(o); });
  for (const m of lista) {
    const b = new THREE.Mesh(m.geometry, matBorde);
    b.userData.esBorde = true;
    b.scale.setScalar(grosor);
    m.add(b);
  }
  return grupo;
}
function sombras(g) { g.traverse(o => { if (o.isMesh && !o.userData.esBorde) { o.castShadow = true; } }); return g; }

const G = {
  esfera: (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h),
  capsula: (r, l) => new THREE.CapsuleGeometry(r, l, 6, 14),
  cono: (r, h, s = 16) => new THREE.ConeGeometry(r, h, s),
  cil: (r1, r2, h, s = 16) => new THREE.CylinderGeometry(r1, r2, h, s),
  toro: (r, t) => new THREE.TorusGeometry(r, t, 10, 32),
};
function malla(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }

// ---------- Humanoide redondeado ----------
export function humanoide(o) {
  const g = new THREE.Group();
  const piel = toon(o.piel), ropa = toon(o.ropa), pelo = toon(o.pelo), acento = toon(o.acento);
  const oscura = toon(new THREE.Color(o.ropa).multiplyScalar(0.6).getHex());
  const escala = o.escala || 1;

  const cadera = new THREE.Group(); cadera.position.y = 0.95; g.add(cadera);
  const piernaI = new THREE.Group(), piernaD = new THREE.Group();
  piernaI.position.set(-0.14, 0, 0); piernaD.position.set(0.14, 0, 0);
  for (const p of [piernaI, piernaD]) {
    p.add(malla(G.capsula(0.11, 0.55), oscura, 0, -0.42, 0));
    p.add(malla(G.capsula(0.12, 0.12), toon(0x2a2018), 0, -0.86, 0.06));
    cadera.add(p);
  }
  const torso = new THREE.Group(); torso.position.y = 0.95; g.add(torso);
  torso.add(malla(G.capsula(0.24, 0.42), ropa, 0, 0.38, 0));
  const cinto = malla(G.toro(0.24, 0.045), acento, 0, 0.1, 0); cinto.rotation.x = Math.PI / 2; torso.add(cinto);
  if (o.capa) {
    const capa = malla(new THREE.CylinderGeometry(0.28, 0.55, 1.2, 16, 1, true, Math.PI * 0.15, Math.PI * 0.7), toon(o.capa, { side: THREE.DoubleSide }), 0, 0.15, -0.02);
    capa.rotation.y = Math.PI; torso.add(capa);
  }
  if (o.tunica) torso.add(malla(G.cono(0.5, 1.2, 20), ropa, 0, -0.35, 0));
  // brazos
  const brazoI = new THREE.Group(), brazoD = new THREE.Group();
  brazoI.position.set(-0.33, 0.68, 0); brazoD.position.set(0.33, 0.68, 0);
  for (const b of [brazoI, brazoD]) {
    b.add(malla(G.esfera(0.12), acento, 0, 0, 0));
    b.add(malla(G.capsula(0.085, 0.42), ropa, 0, -0.3, 0));
    b.add(malla(G.esfera(0.09), piel, 0, -0.6, 0));
    torso.add(b);
  }
  brazoI.rotation.z = 0.12; brazoD.rotation.z = -0.12;
  // cabeza
  const cabeza = new THREE.Group(); cabeza.position.y = 1.05; torso.add(cabeza);
  cabeza.add(malla(G.capsula(0.07, 0.1), piel, 0, -0.18, 0));
  cabeza.add(malla(G.esfera(0.26), piel, 0, 0.08, 0));
  const ojoM = toon(0x1a1420);
  const brillo = new THREE.MeshBasicMaterial({ color: o.ojos || 0x3a6ad0 });
  for (const s of [-1, 1]) {
    const ojo = malla(new THREE.SphereGeometry(0.05, 10, 8), ojoM, s * 0.09, 0.09, 0.23); ojo.scale.set(0.8, 1.2, 0.5); ojo.userData.sinBorde = true; cabeza.add(ojo);
    const iris = malla(new THREE.SphereGeometry(0.03, 8, 6), brillo, s * 0.09, 0.08, 0.255); iris.userData.sinBorde = true; cabeza.add(iris);
  }
  // pelo
  const casco = malla(G.esfera(0.285), pelo, 0, 0.13, -0.03); casco.scale.set(1, 0.92, 1); cabeza.add(casco);
  if (o.peinado === 'puntas') {
    for (let i = 0; i < 7; i++) {
      const a = -1.2 + i * 0.4;
      const c = malla(G.cono(0.09, 0.36, 8), pelo, Math.sin(a) * 0.2, 0.3, -0.05 + Math.cos(a) * 0.12);
      c.rotation.set(-0.6 + Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.9); cabeza.add(c);
    }
    const flequillo = malla(G.cono(0.12, 0.3, 8), pelo, 0.06, 0.2, 0.22); flequillo.rotation.set(1.9, 0, 0.4); cabeza.add(flequillo);
  } else if (o.peinado === 'largo') {
    const melena = malla(G.capsula(0.22, 0.6), pelo, 0, -0.25, -0.12); melena.scale.set(1.2, 1, 0.7); cabeza.add(melena);
    for (const s of [-1, 1]) { const m = malla(G.capsula(0.07, 0.42), pelo, s * 0.24, -0.12, 0.08); cabeza.add(m); }
  } else if (o.peinado === 'casco') {
    const yelmo = malla(G.esfera(0.31, 20, 12), toon(o.yelmo || 0x8a8f99), 0, 0.12, -0.01); yelmo.scale.set(1, 0.9, 1); cabeza.add(yelmo);
    const cresta = malla(G.cono(0.06, 0.4, 8), acento, 0, 0.45, -0.05); cabeza.add(cresta);
  } else if (o.peinado === 'recogido') {
    cabeza.add(malla(G.esfera(0.13), pelo, 0, 0.42, -0.1));
  }
  if (o.barba) { const b = malla(G.esfera(0.2), pelo, 0, -0.04, 0.1); b.scale.set(1, 0.8, 0.8); cabeza.add(b); }
  if (o.sombrero) { cabeza.add(malla(G.cono(0.34, 0.7, 18), toon(o.sombrero), 0, 0.55, 0)); cabeza.add(malla(G.cil(0.5, 0.5, 0.04, 24), toon(o.sombrero), 0, 0.25, 0)); }
  if (o.corona) for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; cabeza.add(malla(G.cono(0.05, 0.22, 6), toon(0xffcc55), Math.sin(a) * 0.22, 0.42, Math.cos(a) * 0.22)); }
  // hombreras
  if (o.armadura) for (const s of [-1, 1]) { const h = malla(G.esfera(0.17, 14, 10), toon(o.armadura), s * 0.33, 1.65, 0); h.scale.set(1, 0.7, 1); g.add(h); }
  // arma
  const mano = new THREE.Group(); mano.position.set(0, -0.62, 0.02); brazoD.add(mano);
  if (o.arma === 'espada') {
    mano.add(malla(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), toon(0x3a2a20), 0, 0, 0));
    const guarda = malla(G.capsula(0.035, 0.22), acento, 0, 0.12, 0); guarda.rotation.z = Math.PI / 2; mano.add(guarda);
    const hoja = malla(new THREE.CylinderGeometry(0.01, 0.06, 1.0, 4), toon(0xdfe8f5, { emissive: 0x223344 }), 0, 0.64, 0); hoja.scale.z = 0.35; mano.add(hoja);
    mano.rotation.x = Math.PI / 2.4;
  } else if (o.arma === 'baculo') {
    mano.add(malla(G.cil(0.025, 0.03, 1.5, 8), toon(0xe8d8b0), 0, 0.35, 0));
    const gema = malla(new THREE.OctahedronGeometry(0.11), new THREE.MeshBasicMaterial({ color: o.acento }), 0, 1.15, 0); gema.userData.sinBorde = true; mano.add(gema);
    mano.add(malla(G.toro(0.1, 0.02), toon(0xe8d8b0), 0, 1.15, 0));
  } else if (o.arma === 'martillo') {
    mano.add(malla(G.cil(0.035, 0.035, 1.1, 8), toon(0x5a3a22), 0, 0.3, 0));
    const cab = malla(G.cil(0.16, 0.16, 0.45, 14), toon(0x8a8f99), 0, 0.85, 0); cab.rotation.z = Math.PI / 2; mano.add(cab);
    mano.add(malla(G.toro(0.16, 0.03), acento, 0, 0.85, 0));
    mano.rotation.x = Math.PI / 2.6;
  } else if (o.arma === 'lanza') {
    mano.add(malla(G.cil(0.025, 0.025, 1.8, 8), toon(0x4a3020), 0, 0.4, 0));
    mano.add(malla(G.cono(0.06, 0.3, 8), toon(0xdfe8f5), 0, 1.4, 0));
  }
  g.scale.setScalar(escala);
  g.userData.p = { piernaI, piernaD, brazoI, brazoD, torso, cabeza };
  g.userData.alto = 2.0 * escala;
  return sombras(contorno(g));
}

export const MODELO_PJ = {
  kael:  { piel: 0xf1c7a0, pelo: 0x3a2216, ropa: 0x2f4a7a, acento: 0xff8a3d, ojos: 0xd9681e, arma: 'espada', peinado: 'puntas' },
  lyra:  { piel: 0xe9b48c, pelo: 0xe9e2ff, ropa: 0x3c2a6b, acento: 0x7fd8ff, ojos: 0x4aa8ff, arma: 'baculo', peinado: 'largo', escala: 0.93 },
  doran: { piel: 0x9a6b4a, pelo: 0x1a1a1a, ropa: 0x5b5f66, acento: 0xb9d36b, ojos: 0x3a2a1a, arma: 'martillo', peinado: 'casco', yelmo: 0x6f747e, barba: true, armadura: 0x8a8f99, escala: 1.1 },
  tobias:{ piel: 0xd8a882, pelo: 0xe0e0e0, ropa: 0x6a4a2a, acento: 0xe0c090, ojos: 0x4a3a2a, peinado: 'corto', barba: true },
};

// ---------- Animación de caminar / reposo ----------
export function animarHumanoide(m, t, velocidad) {
  const p = m.userData.p; if (!p) return;
  const s = Math.sin(t * 10) * Math.min(1, velocidad);
  p.piernaI.rotation.x = s * 0.7; p.piernaD.rotation.x = -s * 0.7;
  p.brazoI.rotation.x = -s * 0.6; if (!m.userData.ataca) p.brazoD.rotation.x = s * 0.6;
  p.torso.position.y = 0.95 + Math.abs(Math.cos(t * 10)) * 0.04 * Math.min(1, velocidad) + Math.sin(t * 2) * 0.01;
}

// ---------- Enemigos ----------
const brilla = c => new THREE.MeshBasicMaterial({ color: c });
const cristal = (c, op = 0.85) => new THREE.MeshToonMaterial({ color: c, gradientMap: grad, transparent: true, opacity: op, emissive: new THREE.Color(c).multiplyScalar(0.25) });

function ojos(g, x, y, z, sep, r = 0.07, color = 0xffee88) {
  for (const s of [-1, 1]) { const o = malla(G.esfera(r, 10, 8), brilla(color), x, y, z + s * sep); o.userData.sinBorde = true; g.add(o); }
}

export function modeloEnemigo(def) {
  const g = new THREE.Group();
  const c = def.color, mc = toon(c), md = toon(new THREE.Color(c).multiplyScalar(0.6).getHex());
  let alto = 1.5;
  switch (def.forma) {
    case 'baba': {
      const b = malla(G.esfera(0.6, 24, 16), cristal(c, 0.9), 0, 0.5, 0); b.scale.set(1, 0.8, 1); g.add(b);
      const nucleo = malla(G.esfera(0.2), brilla(0xff7a2a), 0, 0.5, 0); nucleo.userData.sinBorde = true; g.add(nucleo);
      ojos(g, 0.45, 0.7, 0, 0.18, 0.08, 0x1a1010); alto = 1.2; break;
    }
    case 'escorpion': {
      const cu = malla(G.esfera(0.5), cristal(c), 0, 0.45, 0); cu.scale.set(1.4, 0.6, 0.9); g.add(cu);
      for (let i = 0; i < 6; i++) { const a = i / 5; g.add(malla(G.esfera(0.17 - a * 0.05), cristal(c), -0.6 - Math.sin(a * 2) * 0.4, 0.55 + a * 1.0, 0)); }
      const agu = malla(G.cono(0.1, 0.35, 8), toon(0xff5a7a), -0.55, 1.65, 0); agu.rotation.z = -2.2; g.add(agu);
      for (const s of [-1, 1]) {
        g.add(malla(G.capsula(0.08, 0.4), cristal(c), 0.75, 0.4, s * 0.45));
        const pinza = malla(G.esfera(0.17), cristal(c), 1.05, 0.45, s * 0.5); pinza.scale.set(1.3, 0.6, 0.8); g.add(pinza);
        for (let k = 0; k < 3; k++) { const pa = malla(G.capsula(0.04, 0.35), md, -0.3 + k * 0.3, 0.2, s * 0.5); pa.rotation.x = s * 0.8; g.add(pa); }
      }
      ojos(g, 0.62, 0.6, 0, 0.1, 0.05, 0xff3355); alto = 1.8; break;
    }
    case 'golem': {
      const cm = cristal(c, 0.8);
      const torso = malla(new THREE.IcosahedronGeometry(1.0, 0), cm, 0, 2.3, 0); torso.scale.set(1, 1.2, 0.9); g.add(torso);
      const nucleo = malla(G.esfera(0.32), brilla(0xff3d00), 0.3, 2.3, 0); nucleo.userData.sinBorde = true; g.add(nucleo);
      g.add(malla(new THREE.DodecahedronGeometry(0.5, 0), cm, 0.1, 3.55, 0));
      ojos(g, 0.45, 3.6, 0, 0.18, 0.07, 0xff6a2a);
      for (const s of [-1, 1]) {
        g.add(malla(new THREE.OctahedronGeometry(0.45), cm, 0, 2.9, s * 1.2));
        const br = malla(new THREE.OctahedronGeometry(0.4), cm, 0.2, 1.8, s * 1.35); br.scale.y = 1.8; g.add(br);
        const pi = malla(new THREE.OctahedronGeometry(0.45), cm, 0, 0.7, s * 0.5); pi.scale.y = 1.6; g.add(pi);
      }
      for (let i = 0; i < 5; i++) { const p = malla(new THREE.ConeGeometry(0.15, 0.7, 5), cm, -0.4, 2.8 + Math.random() * 0.6, -0.6 + i * 0.3); p.rotation.z = 0.6; g.add(p); }
      alto = 4.2; break;
    }
    case 'soldado':
      return modeloHumanoideEnemigo({ piel: 0xd9b090, pelo: 0x3a2a1a, ropa: 0x3a3f4a, acento: 0x7a1f2b, capa: 0x7a1f2b, arma: 'lanza', peinado: 'casco', yelmo: 0x7a7f8a, ojos: 0x222222 }, def);
    case 'doran':
      return modeloHumanoideEnemigo(MODELO_PJ.doran, def);
    case 'mago':
      return modeloHumanoideEnemigo({ piel: 0xc9a890, pelo: 0x222222, ropa: 0x4a1a6a, acento: 0xd0a0ff, arma: 'baculo', peinado: 'corto', sombrero: 0x2a0a3a, tunica: true, ojos: 0xd0a0ff }, def);
    case 'centinela':
      return modeloHumanoideEnemigo({ piel: 0x6f7486, pelo: 0x4a4e5a, ropa: 0x5a5e6c, acento: 0x5affd0, arma: 'martillo', peinado: 'casco', yelmo: 0x4a4e5a, armadura: 0x7a7e8c, ojos: 0x5affd0, escala: 1.45 }, def);
    case 'varek':
      return modeloHumanoideEnemigo({ piel: 0xd9b8a0, pelo: 0xe8e8e8, ropa: 0x2a0a12, acento: 0xa3122a, capa: 0xa3122a, arma: 'espada', peinado: 'corto', corona: true, armadura: 0x3a3a44, ojos: 0xff2a3a, escala: 1.4 }, def);
    case 'morvaine': {
      const h = humanoide({ piel: 0xe8e0f0, pelo: 0x120d1e, ropa: 0x1d1b3a, acento: 0xc59cff, arma: 'baculo', peinado: 'recogido', tunica: true, capa: 0x2a1850, ojos: 0xc59cff, escala: 1.5 });
      for (let i = 0; i < 3; i++) {
        const anillo = malla(G.toro(1.2 + i * 0.25, 0.025), brilla(0xc59cff), 0, 1.6, 0);
        anillo.userData.sinBorde = true; anillo.rotation.set(Math.PI / 2 + i * 0.4, i, 0); anillo.userData.gira = 0.6 + i * 0.3; h.add(anillo);
      }
      for (let i = 0; i < 4; i++) {
        const libro = malla(new THREE.BoxGeometry(0.3, 0.05, 0.4), toon(0xe8d8b0), Math.cos(i * 1.6) * 1.5, 2.2, Math.sin(i * 1.6) * 1.5);
        libro.userData.orbita = i * 1.6; h.add(libro);
      }
      h.rotation.y = Math.PI / 2; const w = new THREE.Group(); w.add(h); w.userData = { ...h.userData, alto: 3.2, interno: h };
      return w;
    }
    case 'lobo': {
      const cu = malla(G.capsula(0.35, 0.9), mc, 0, 0.75, 0); cu.rotation.z = Math.PI / 2; g.add(cu);
      const ca = malla(G.esfera(0.32), mc, 0.85, 1.05, 0); g.add(ca);
      const ho = malla(G.cono(0.16, 0.45, 10), md, 1.2, 0.98, 0); ho.rotation.z = -Math.PI / 2; g.add(ho);
      for (const s of [-1, 1]) {
        const o = malla(G.cono(0.1, 0.3, 6), md, 0.8, 1.38, s * 0.16); g.add(o);
        g.add(malla(G.capsula(0.08, 0.45), md, 0.5, 0.3, s * 0.2)); g.add(malla(G.capsula(0.08, 0.45), md, -0.5, 0.3, s * 0.2));
      }
      const cola = malla(G.cono(0.14, 0.8, 10), toon(0xffe14a), -0.95, 1.0, 0); cola.rotation.z = 2.2; g.add(cola);
      for (let i = 0; i < 4; i++) { const r = malla(G.cono(0.06, 0.3, 5), brilla(0xffe14a), -0.4 + i * 0.25, 1.15, 0); r.userData.sinBorde = true; g.add(r); }
      ojos(g, 1.08, 1.12, 0, 0.13, 0.05, 0xffe14a); alto = 1.6; break;
    }
    case 'ave': case 'grifo': {
      const k = def.forma === 'grifo' ? 1.9 : 1;
      const cu = malla(G.esfera(0.45 * k), mc, 0, 1.4 * k, 0); cu.scale.set(1.3, 1, 0.9); g.add(cu);
      const ca = malla(G.esfera(0.28 * k), def.forma === 'grifo' ? toon(0xf5f0e0) : mc, 0.55 * k, 1.75 * k, 0); g.add(ca);
      const pico = malla(G.cono(0.09 * k, 0.32 * k, 8), toon(0xf0a020), 0.85 * k, 1.72 * k, 0); pico.rotation.z = -Math.PI / 2; g.add(pico);
      ojos(g, 0.72 * k, 1.82 * k, 0, 0.12 * k, 0.045 * k, def.forma === 'grifo' ? 0x66ccff : 0xff4444);
      for (const s of [-1, 1]) {
        const ala = new THREE.Group(); ala.position.set(0, 1.55 * k, s * 0.3 * k);
        const pl = malla(G.esfera(0.5 * k), def.forma === 'grifo' ? toon(0xf5f0e0) : md, 0, 0, s * 0.6 * k); pl.scale.set(0.8, 0.15, 1.6); ala.add(pl);
        ala.userData.lado = s; g.add(ala); (g.userData.alas ||= []).push(ala);
      }
      const cola = malla(G.cono(0.25 * k, 0.6 * k, 8), md, -0.65 * k, 1.35 * k, 0); cola.rotation.z = Math.PI / 2; g.add(cola);
      if (def.forma === 'grifo') for (const s of [-1, 1]) { g.add(malla(G.capsula(0.12, 0.8), mc, 0.4, 0.6, s * 0.4)); g.add(malla(G.capsula(0.12, 0.8), mc, -0.5, 0.6, s * 0.4)); }
      else g.userData.vuela = true;
      alto = 2.3 * k; break;
    }
    case 'espectro': {
      const m = new THREE.MeshToonMaterial({ color: c, gradientMap: grad, transparent: true, opacity: 0.75, emissive: 0x3a2a6a });
      const cu = malla(G.cono(0.55, 1.5, 20), m, 0, 1.1, 0); cu.rotation.x = Math.PI; g.add(cu);
      g.add(malla(G.esfera(0.35), m, 0, 1.95, 0));
      ojos(g, 0.28, 2.0, 0, 0.12, 0.06, 0xffffff);
      for (const s of [-1, 1]) { const b = malla(G.capsula(0.08, 0.7), m, 0.2, 1.4, s * 0.5); b.rotation.x = s * 0.6; g.add(b); }
      g.userData.vuela = true; alto = 2.4; break;
    }
    case 'quimera': {
      const cm = cristal(c, 0.85);
      const cu = malla(G.capsula(0.55, 1.1), cm, 0, 1.0, 0); cu.rotation.z = Math.PI / 2; g.add(cu);
      for (let i = -1; i <= 1; i++) {
        const cuello = malla(G.capsula(0.13, 0.6), cm, 0.9, 1.5, i * 0.45); cuello.rotation.z = -0.7; cuello.rotation.x = i * 0.4; g.add(cuello);
        const ca = malla(new THREE.OctahedronGeometry(0.3), cm, 1.25, 1.85, i * 0.55); g.add(ca);
        ojos(g, 1.45, 1.9, i * 0.55, 0.08, 0.04, 0xff3366);
      }
      for (const s of [-1, 1]) { g.add(malla(G.capsula(0.13, 0.6), md, 0.6, 0.35, s * 0.4)); g.add(malla(G.capsula(0.13, 0.6), md, -0.6, 0.35, s * 0.4)); }
      for (let i = 0; i < 5; i++) g.add(malla(G.cono(0.12, 0.5, 5), cm, -0.6 + i * 0.3, 1.65, 0));
      alto = 2.4; break;
    }
    case 'vacio': {
      const nucleo = malla(new THREE.IcosahedronGeometry(1.4, 1), toon(0x0a0618, { emissive: 0x1a0a3a }), 0, 3, 0); g.add(nucleo);
      const alambre = new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 1), new THREE.MeshBasicMaterial({ color: 0xb69cff, wireframe: true, transparent: true, opacity: 0.6 }));
      alambre.position.y = 3; alambre.userData.sinBorde = true; alambre.userData.gira = 0.4; g.add(alambre);
      const ojo = malla(G.esfera(0.45), brilla(0xffffff), 1.2, 3, 0); ojo.userData.sinBorde = true; g.add(ojo);
      const pupila = malla(G.esfera(0.22), brilla(0x000000), 1.55, 3, 0); pupila.userData.sinBorde = true; g.add(pupila);
      for (let i = 0; i < 4; i++) {
        const a = malla(G.toro(2.2 + i * 0.35, 0.04), brilla(i % 2 ? 0xb69cff : 0xff5aa0), 0, 3, 0);
        a.userData.sinBorde = true; a.rotation.set(i * 0.7, i * 0.5, 0); a.userData.gira = 0.3 + i * 0.25; g.add(a);
      }
      for (let i = 0; i < 6; i++) {
        const t = malla(G.capsula(0.12, 1.6), toon(0x1a0a2a), Math.cos(i) * 0.9, 1.2, Math.sin(i) * 0.9);
        t.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5); g.add(t);
      }
      g.userData.vuela = true; alto = 5; break;
    }
  }
  g.rotation.y = 0;
  const w = new THREE.Group(); w.add(contorno(g)); sombras(w);
  w.userData = { alto, interno: g, alas: g.userData.alas, vuela: g.userData.vuela };
  return w;
}

function modeloHumanoideEnemigo(o, def) {
  const h = humanoide(o);
  h.rotation.y = Math.PI / 2;
  const w = new THREE.Group(); w.add(h);
  w.userData = { alto: h.userData.alto, interno: h, p: h.userData.p, humano: true };
  return w;
}

// ---------- Ecos (invocaciones) ----------
export function modeloEco(id) {
  const g = new THREE.Group();
  if (id === 'ignar') {
    const m = toon(0xff5a1f, { emissive: 0x551a00 }), c = toon(0xffb347);
    for (let i = 0; i < 7; i++) { const s = malla(G.esfera(0.7 - Math.abs(i - 2) * 0.08), m, 1.6 - i * 0.6, 1.2 + Math.sin(i * 0.9) * 0.2, 0); s.scale.set(1.2, 0.8, 0.9); g.add(s); }
    const ca = malla(G.esfera(0.65), m, 2.4, 1.6, 0); ca.scale.set(1.4, 0.8, 1); g.add(ca);
    for (const s of [-1, 1]) { const o = malla(G.esfera(0.12), brilla(0xfff3a0), 2.9, 1.8, s * 0.35); o.userData.sinBorde = true; g.add(o); }
    for (let i = 0; i < 6; i++) { const f = malla(G.cono(0.22, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xffd23a }), 1.4 - i * 0.6, 1.9, 0); f.userData.sinBorde = true; f.userData.llama = i; g.add(f); }
    for (const s of [-1, 1]) for (const x of [1, -1.2]) g.add(malla(G.capsula(0.17, 0.6), c, x, 0.4, s * 0.6));
    g.userData.elem = 'fuego';
  } else if (id === 'volt') {
    const m = toon(0xffe14a, { emissive: 0x443300 }), d = toon(0xe0a800);
    const cu = malla(G.esfera(0.8), m, 0, 2.5, 0); cu.scale.set(1.5, 1, 1); g.add(cu);
    g.add(malla(G.esfera(0.55), m, 1.2, 2.9, 0));
    const pi = malla(G.cono(0.18, 0.6, 8), toon(0x332200), 1.8, 2.8, 0); pi.rotation.z = -Math.PI / 2; g.add(pi);
    for (const s of [-1, 1]) {
      const ala = new THREE.Group(); ala.position.set(0, 2.8, s * 0.5);
      for (let k = 0; k < 4; k++) { const p = malla(G.esfera(0.6), k % 2 ? m : d, -k * 0.25, 0, s * (0.8 + k * 0.8)); p.scale.set(0.9, 0.12, 0.7); ala.add(p); }
      ala.userData.lado = s; g.add(ala); (g.userData.alas ||= []).push(ala);
      const o = malla(G.esfera(0.09), brilla(0x111111), 1.55, 3.05, s * 0.22); o.userData.sinBorde = true; g.add(o);
    }
    g.userData.elem = 'rayo';
  } else if (id === 'nivalis') {
    const m = toon(0xe8fbff, { emissive: 0x113344 }), a = cristal(0x5cc8f0, 0.9);
    const cu = malla(G.capsula(0.6, 1.6), m, 0, 2.0, 0); cu.rotation.z = Math.PI / 2; g.add(cu);
    const cuello = malla(G.capsula(0.3, 0.8), m, 1.3, 2.8, 0); cuello.rotation.z = -0.6; g.add(cuello);
    const ca = malla(G.esfera(0.42), m, 1.7, 3.4, 0); ca.scale.set(1.4, 0.9, 0.9); g.add(ca);
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) { const r = malla(G.cil(0.04, 0.07, 0.7, 6), a, 1.6 - k * 0.15, 4.0 + k * 0.3, s * (0.3 + k * 0.2)); r.rotation.x = s * (0.5 + k * 0.15); g.add(r); }
      for (const x of [0.9, -0.9]) g.add(malla(G.capsula(0.13, 1.4), m, x, 0.85, s * 0.35));
      const o = malla(G.esfera(0.07), brilla(0x1a3a6a), 2.05, 3.5, s * 0.2); o.userData.sinBorde = true; g.add(o);
    }
    for (let i = 0; i < 8; i++) { const c = malla(new THREE.OctahedronGeometry(0.2), a, Math.cos(i) * 2, 1 + i * 0.4, Math.sin(i) * 2); c.userData.orbita = i; g.add(c); }
    g.userData.elem = 'hielo';
  } else if (id === 'terragon') {
    const m = toon(0x9c7a46), cs = toon(0x5a4020);
    const ca = malla(new THREE.SphereGeometry(2.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cs, 0, 0.9, 0); ca.scale.set(1.3, 0.9, 1.1); g.add(ca);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const p = malla(new THREE.DodecahedronGeometry(0.45), toon(0x7a6a5a), Math.cos(a) * 1.5, 2.4, Math.sin(a) * 1.2); g.add(p); }
    g.add(malla(new THREE.DodecahedronGeometry(0.7), toon(0x6a5a4a), 0, 2.9, 0));
    const cu = malla(G.capsula(0.45, 0.8), m, 2.6, 1.3, 0); cu.rotation.z = -1.2; g.add(cu);
    g.add(malla(G.esfera(0.55), m, 3.2, 1.7, 0));
    for (const s of [-1, 1]) {
      const o = malla(G.esfera(0.1), brilla(0xffe08a), 3.65, 1.85, s * 0.25); o.userData.sinBorde = true; g.add(o);
      for (const x of [1.6, -1.6]) g.add(malla(G.capsula(0.4, 0.5), m, x, 0.45, s * 1.6));
    }
    g.userData.elem = 'tierra';
  }
  const w = new THREE.Group(); w.add(contorno(g, 1.05)); w.userData = { interno: g, alas: g.userData.alas };
  return w;
}

// ---------- Animación genérica de enemigos/ecos ----------
export function animarCriatura(m, t) {
  const i = m.userData.interno; if (!i) return;
  if (m.userData.humano) { animarHumanoide(i, t, 0); return; }
  if (m.userData.vuela) i.position.y = Math.sin(t * 2) * 0.18 + 0.2;
  else i.scale.y = 1 + Math.sin(t * 3) * 0.02;
  if (m.userData.alas) for (const a of m.userData.alas) a.rotation.x = a.userData.lado * Math.sin(t * 8) * 0.5;
  i.traverse(o => {
    if (o.userData.gira) o.rotation.z += o.userData.gira * 0.016;
    if (o.userData.orbita !== undefined) { const a = t * 0.8 + o.userData.orbita; const r = Math.hypot(o.position.x, o.position.z) || 1.5; o.position.x = Math.cos(a) * r; o.position.z = Math.sin(a) * r; o.rotation.y += 0.02; }
    if (o.userData.llama !== undefined) o.scale.y = 1 + Math.sin(t * 12 + o.userData.llama) * 0.3;
  });
}
