import * as THREE from './three.module.js';
import { MAGIAS, FACTOR_VINCULO, NOMBRE_STAT, ECOS, PERSONAJES, ENEMIGOS, ZONAS, PUERTAS, CRISTALES, OBJETIVOS, EVENTOS, PROLOGO, HABLANTES } from './data.js';
import { toon, humanoide, MODELO_PJ, animarHumanoide, modeloEnemigo, modeloEco, animarCriatura, contorno } from './modelos.js';
import { retrato } from './retratos.js';

const $ = id => document.getElementById(id);
const azar = (a, b) => a + Math.random() * (b - a);
const elegir = arr => arr[Math.floor(Math.random() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const suave = t => t * t * (3 - 2 * t);
const CLAVE = 'ecosdevidrio_v1';

// ===================== Render =====================
const renderer = new THREE.WebGLRenderer({ canvas: $('lienzo'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camara = new THREE.PerspectiveCamera(55, 1, 0.1, 600);
function ajustar() {
  renderer.setSize(innerWidth, innerHeight, false);
  camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix();
}
addEventListener('resize', ajustar); ajustar();

// Cielo con degradado
function crearCielo() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { arriba: { value: new THREE.Color() }, abajo: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 arriba; uniform vec3 abajo; varying vec3 vP; void main(){ float h = clamp(vP.y*1.4+0.25,0.0,1.0); gl_FragColor = vec4(mix(abajo, arriba, h),1.0); }',
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
  m.frustumCulled = false;
  return m;
}

// ===================== Estado del juego =====================
let estado = null;
function nuevoEstado() {
  return {
    cap: 0, grupo: ['kael'],
    miembros: { kael: nuevoMiembro('kael', 1, { fuego: 5 }) },
    ecos: {}, objetos: { pocion: 6, brasa: 2 }, pos: { x: 0, z: 8 }, hechos: [],
  };
}
function nuevoMiembro(id, nivel, stock = {}) {
  const m = { nivel, xp: 0, hp: 0, stock: { fuego: 0, hielo: 0, rayo: 0, piedra: 0, cura: 0, ...stock }, vinc: {} };
  m.hp = stats(id, m).vida;
  return m;
}
function xpSiguiente(nivel) { return Math.round(40 * Math.pow(nivel, 1.6)); }
function statsPermitidos(id) {
  const s = new Set();
  for (const [e, a] of Object.entries(estado?.ecos || {})) if (a === id) ECOS[e].stats.forEach(x => s.add(x));
  return s;
}
function bonoVinculo(stat, magia, cantidad) {
  const f = FACTOR_VINCULO[stat]; return Math.floor(cantidad * (f[magia] ?? f._));
}
function stats(id, m = estado.miembros[id]) {
  const p = PERSONAJES[id], r = {}, bono = {};
  const permit = estado ? statsPermitidos(id) : new Set();
  for (const k of Object.keys(p.base)) {
    r[k] = Math.round(p.base[k] + p.crece[k] * (m.nivel - 1));
    bono[k] = 0;
    const mg = m.vinc[k];
    if (mg && permit.has(k)) { bono[k] = bonoVinculo(k, mg, m.stock[mg] || 0); r[k] += bono[k]; }
  }
  r.bono = bono;
  return r;
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify({ ...estado, pos: { x: jugador.position.x, z: jugador.position.z } })); } catch (e) {}
}
function cargar() { try { const t = localStorage.getItem(CLAVE); return t ? JSON.parse(t) : null; } catch (e) { return null; } }

// ===================== Interpolaciones =====================
const tweens = [];
function tween(dur, fn) { return new Promise(res => tweens.push({ t: 0, dur, fn, res })); }
const esperar = ms => tween(ms / 1000, () => {});
function actualizarTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i]; w.t += dt; const p = Math.min(1, w.t / w.dur);
    w.fn(p); if (p >= 1) { tweens.splice(i, 1); w.res(); }
  }
}

// ===================== Partículas =====================
const particulas = [];
const texPunto = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();
function rafaga(escena, pos, color, n = 40, o = {}) {
  const geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) {
    p[i * 3] = pos.x + azar(-0.2, 0.2) * (o.ancho || 1); p[i * 3 + 1] = pos.y + azar(-0.2, 0.2); p[i * 3 + 2] = pos.z + azar(-0.2, 0.2) * (o.ancho || 1);
    const a = Math.random() * Math.PI * 2, s = azar(0.5, 1) * (o.fuerza || 4);
    v.push(new THREE.Vector3(Math.cos(a) * s * (o.horiz ?? 1), azar(0.3, 1) * s * (o.sube ?? 1), Math.sin(a) * s * (o.horiz ?? 1)));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ color, size: o.tam || 0.45, map: texPunto, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(geo, mat); escena.add(pts);
  particulas.push({ pts, v, vida: o.vida || 0.9, t: 0, grav: o.grav ?? 6, escena });
}
function actualizarParticulas(dt) {
  for (let i = particulas.length - 1; i >= 0; i--) {
    const q = particulas[i]; q.t += dt;
    const a = q.pts.geometry.attributes.position;
    for (let k = 0; k < q.v.length; k++) {
      q.v[k].y -= q.grav * dt;
      a.array[k * 3] += q.v[k].x * dt; a.array[k * 3 + 1] += q.v[k].y * dt; a.array[k * 3 + 2] += q.v[k].z * dt;
    }
    a.needsUpdate = true;
    q.pts.material.opacity = 1 - q.t / q.vida;
    if (q.t >= q.vida) { q.escena.remove(q.pts); q.pts.geometry.dispose(); q.pts.material.dispose(); particulas.splice(i, 1); }
  }
}

// ===================== MUNDO (exploración) =====================
const campo = new THREE.Scene();
const cieloCampo = crearCielo(); campo.add(cieloCampo);
campo.fog = new THREE.Fog(0xe8b98a, 30, 120);
campo.add(new THREE.HemisphereLight(0xffffff, 0x554433, 1.1));
const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.castShadow = true; sol.shadow.mapSize.set(1024, 1024);
Object.assign(sol.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 80 });
campo.add(sol, sol.target);

function zonaEn(z) { return ZONAS.find(zz => z <= zz.desde && z > zz.hasta) || ZONAS[ZONAS.length - 1]; }
function ruido(x, z) { return Math.sin(x * 0.31 + z * 0.17) * Math.cos(z * 0.23 - x * 0.12) + Math.sin(x * 0.07 + z * 0.11) * 0.6; }
function altura(x, z) {
  const borde = Math.max(0, Math.abs(x) - 14);
  const zona = zonaEn(z).id;
  const amp = zona === 'desierto' ? 0.7 : zona === 'torre' ? 0.15 : 0.35;
  return borde * borde * 0.1 + ruido(x, z) * amp * Math.min(1, 0.3 + Math.abs(x) / 10);
}
// Suelo
(function construirSuelo() {
  const geo = new THREE.PlaneGeometry(70, 240, 70, 240); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -90);
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color(), c2 = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, altura(x, z));
    const zi = ZONAS.indexOf(zonaEn(z));
    c.setHex(ZONAS[zi].suelo);
    // mezcla suave entre zonas
    const sig = ZONAS[zi + 1];
    if (sig) { const d = z - ZONAS[zi].hasta; if (d < 5) c.lerp(c2.setHex(sig.suelo), (1 - d / 5) * 0.5); }
    const camino = Math.max(0, 1 - Math.abs(x) / 3.2);
    c.multiplyScalar(1 + ruido(x * 3, z * 3) * 0.05 - camino * 0.1 + Math.min(0.15, Math.max(0, Math.abs(x) - 15) * 0.02));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const suelo = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  suelo.receiveShadow = true; campo.add(suelo);
})();

// Decoración
const animados = [];
function semilla(s) { return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function pon(obj, x, z, sombra = true) { obj.position.set(x, altura(x, z), z); if (sombra) obj.traverse(o => { if (o.isMesh && !o.userData.esBorde) { o.castShadow = true; o.receiveShadow = true; } }); campo.add(obj); return obj; }
function arbol(r, color = 0x2f7a46) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 1.6, 8), toon(0x5a3a22))); g.children[0].position.y = 0.8;
  const h = azar(1.6, 2.6);
  for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.3 - i * 0.3, h * 0.7, 10), toon(color)); c.position.y = 1.6 + i * h * 0.35; g.add(c); }
  g.scale.setScalar(azar(0.8, 1.4) * r);
  return contorno(g, 1.04);
}
function cristalDeco(color, alto) {
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshToonMaterial({ color, transparent: true, opacity: 0.8, emissive: new THREE.Color(color).multiplyScalar(0.35) }));
  m.scale.set(azar(0.4, 0.9), alto, azar(0.4, 0.9)); m.rotation.set(azar(-0.3, 0.3), azar(0, 3), azar(-0.3, 0.3)); m.position.y = alto * 0.35;
  const g = new THREE.Group(); g.add(m); return g;
}
(function decorar() {
  const r = semilla(77);
  // montañas laterales
  for (let z = 15; z > -205; z -= 7) for (const s of [-1, 1]) {
    const zona = zonaEn(z), h = azar(8, 18);
    const c = new THREE.Color(zona.suelo).multiplyScalar(zona.id === 'bosque' ? 0.55 : 0.75).getHex();
    const m = new THREE.Mesh(new THREE.ConeGeometry(azar(5, 9), h, 7), toon(c, { flatShading: true }));
    m.position.set(s * azar(27, 34), h / 2 - 1, z + azar(-3, 3)); m.rotation.y = r() * 3; campo.add(m);
  }
  // Ferrovia: andén, estación y tren
  const anden = new THREE.Mesh(new THREE.BoxGeometry(5, 0.5, 26), toon(0x9a8a7a)); pon(anden, 11, 2); anden.position.y = 0.25;
  for (const x of [8.2, 9.4]) { const riel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 40), toon(0x5a5a62)); riel.position.set(x, 0.1, 0); campo.add(riel); }
  const est = new THREE.Group();
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.3, 3.2, 8), toon(0xd8b48a)); cuerpo.position.y = 1.6; est.add(cuerpo);
  const techo = new THREE.Mesh(new THREE.ConeGeometry(4, 2.4, 8), toon(0x9a3a2a)); techo.position.y = 4.4; est.add(techo);
  const reloj = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 20), toon(0xfff3d0)); reloj.rotation.x = Math.PI / 2; reloj.position.set(0, 2.4, 3.2); est.add(reloj);
  pon(contorno(est, 1.03), 14, -4);
  const tren = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const v = new THREE.Mesh(new THREE.CapsuleGeometry(1, 3.2, 6, 14), toon(i ? 0x2f4a7a : 0x7a2a2a)); v.rotation.x = Math.PI / 2; v.position.set(0, 1.4, -i * 5.4); tren.add(v);
    for (const s of [-1, 1]) for (const k of [-1, 1]) { const rd = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 14), toon(0x222222)); rd.rotation.z = Math.PI / 2; rd.position.set(s * 0.95, 0.5, -i * 5.4 + k * 1.3); tren.add(rd); }
  }
  const chimenea = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 1.4, 10), toon(0x333333)); chimenea.position.set(0, 2.8, 1.2); tren.add(chimenea);
  tren.position.set(8.8, 0, 10); campo.add(contorno(tren, 1.03));
  for (let i = 0; i < 6; i++) { const f = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 8), toon(0x333340)); p.position.y = 1.5; f.add(p); const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); l.position.y = 3.1; f.add(l); pon(f, i % 2 ? -4.5 : 4.5, 14 - i * 5); }
  // Desierto: dunas, cristales y ruinas
  for (let i = 0; i < 70; i++) {
    const z = azar(-15, -61), x = (r() < 0.5 ? -1 : 1) * azar(4, 22);
    if (r() < 0.55) pon(cristalDeco(elegir([0x9fe7ff, 0xb8f0ff, 0xffd59a, 0xff9ad0]), azar(1, 3.5)), x, z);
    else { const roca = new THREE.Mesh(new THREE.DodecahedronGeometry(azar(0.4, 1.3)), toon(0xc8a060, { flatShading: true })); roca.scale.y = 0.6; pon(roca, x, z); }
  }
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, x = Math.cos(a) * 7, z = -55 + Math.sin(a) * 6;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, azar(1.5, 5), 10), toon(0xd8c8a8)); col.position.y = col.geometry.parameters.height / 2;
    const g = new THREE.Group(); g.add(col); if (r() < 0.5) g.rotation.z = azar(-0.3, 0.3); pon(contorno(g, 1.04), x, z);
  }
  // Bosque
  for (let i = 0; i < 120; i++) {
    const z = azar(-63, -111), x = (r() < 0.5 ? -1 : 1) * azar(4.5, 24);
    pon(arbol(1, elegir([0x2f7a46, 0x3a8a5a, 0x2a6a4a, 0x4a7a3a])), x, z);
  }
  for (let i = 0; i < 25; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(azar(0.3, 0.6), 10, 8), toon(elegir([0xff6a9a, 0xffe14a, 0x7fd8ff]))); h.scale.y = 0.6; pon(h, azar(-12, 12), azar(-64, -110)); }
  // Fortaleza
  for (const s of [-1, 1]) {
    const muro = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 2), toon(0x6b6470)); muro.position.y = 3; const g = new THREE.Group(); g.add(muro);
    pon(contorno(g, 1.02), s * 11, -128);
    for (const z of [-128, -150]) {
      const t = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 10, 12), toon(0x5a5460)); c.position.y = 5; t.add(c);
      const tc = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.5, 12), toon(0x7a1f2b)); tc.position.y = 11.7; t.add(tc);
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), toon(0xa3122a, { side: THREE.DoubleSide })); ban.position.set(0, 6, 2.35); t.add(ban);
      pon(contorno(t, 1.02), s * 7, z);
    }
  }
  for (let i = 0; i < 18; i++) { const b = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4, 6), toon(0x333333)); p.position.y = 2; b.add(p); const f = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), toon(0x7a1f2b, { side: THREE.DoubleSide })); f.position.set(0.5, 3.2, 0); b.add(f); pon(b, (i % 2 ? -1 : 1) * azar(5, 10), azar(-113, -151)); }
  // Torre del Eco
  const torre = new THREE.Group();
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(3, 6, 40, 16), toon(0x3a3660)); tb.position.y = 20; torre.add(tb);
  for (let i = 0; i < 5; i++) { const a = new THREE.Mesh(new THREE.TorusGeometry(5 - i * 0.6, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0xb69cff })); a.rotation.x = Math.PI / 2; a.position.y = 6 + i * 7; a.userData.gira = 0.3 + i * 0.1; torre.add(a); animados.push(a); }
  pon(torre, 0, -200, false);
  for (let i = 0; i < 40; i++) { const c = cristalDeco(elegir([0xb69cff, 0x7fd8ff, 0xff9ad0]), azar(1, 3)); c.userData.flota = r() * 6; pon(c, (r() < 0.5 ? -1 : 1) * azar(4, 20), azar(-153, -196)); c.position.y += azar(0, 3); animados.push(c); }
})();

// Puertas, cristales, marcadores
const puertas = PUERTAS.map(p => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(36, 8), new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  m.position.set(0, 4, p.z); campo.add(m); return { ...p, malla: m };
});
const cristales = CRISTALES.map(c => {
  const g = new THREE.Group();
  const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.7), new THREE.MeshToonMaterial({ color: 0x5ab8ff, emissive: 0x1a4a8a, transparent: true, opacity: 0.9 }));
  cr.position.y = 1.6; cr.scale.y = 1.5; g.add(cr);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 12), toon(0x8a8aa0)); base.position.y = 0.2; g.add(base);
  const halo = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.5, 32), new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = 0.05; g.add(halo);
  pon(g, c.x, c.z); cr.userData.gira = 1; animados.push(cr);
  return { ...c, g, usado: false };
});
const marcadores = EVENTOS.map(e => {
  const g = new THREE.Group();
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: e.marca, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  col.position.y = 15; g.add(col);
  const an = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.06, 8, 40), new THREE.MeshBasicMaterial({ color: e.marca })); an.rotation.x = Math.PI / 2; an.position.y = 0.3; an.userData.pulso = true; g.add(an); animados.push(an);
  pon(g, e.x, e.z, false); return { e, g };
});

// NPC Tobías
const tobias = humanoide(MODELO_PJ.tobias); pon(tobias, 4, 0); tobias.rotation.y = -0.6;

// Jugador y seguidores
const modelos = {};
function modeloPJ(id) { if (!modelos[id]) { modelos[id] = humanoide(MODELO_PJ[id]); } return modelos[id]; }
const jugador = modeloPJ('kael'); campo.add(jugador);
const seguidores = {};
const rastro = [];

function actualizarSeguidores(vel, t) {
  estado.grupo.slice(1).forEach((id, i) => {
    if (!seguidores[id]) { seguidores[id] = humanoide(MODELO_PJ[id]); campo.add(seguidores[id]); seguidores[id].position.copy(jugador.position); }
    const m = seguidores[id], obj = rastro[Math.min(rastro.length - 1, (i + 1) * 12)];
    if (obj) {
      const dx = obj.x - m.position.x, dz = obj.z - m.position.z, d = Math.hypot(dx, dz);
      if (d > 0.05) { m.position.x += dx * 0.15; m.position.z += dz * 0.15; m.rotation.y = Math.atan2(dx, dz); }
      m.position.y = altura(m.position.x, m.position.z);
      animarHumanoide(m, t + i, d > 0.1 ? vel : 0);
    }
  });
}

// ===================== Controles =====================
const entrada = { x: 0, y: 0 }, teclas = {};
let camYaw = 0, joyId = null, joyC = [0, 0], miraId = null, miraU = [0, 0];
const lienzo = renderer.domElement;
lienzo.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth * 0.45 && joyId === null) {
      joyId = t.identifier; joyC = [t.clientX, t.clientY];
      Object.assign($('joyBase').style, { left: t.clientX + 'px', top: t.clientY + 'px', display: modo === 'campo' ? 'block' : 'none' });
    } else if (miraId === null) { miraId = t.identifier; miraU = [t.clientX, t.clientY]; }
  }
}, { passive: false });
lienzo.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) {
      let dx = t.clientX - joyC[0], dy = t.clientY - joyC[1]; const l = Math.hypot(dx, dy);
      if (l > 50) { dx *= 50 / l; dy *= 50 / l; }
      $('joyPunta').style.transform = `translate(${dx}px,${dy}px)`;
      entrada.x = dx / 50; entrada.y = dy / 50;
    } else if (t.identifier === miraId) { camYaw -= (t.clientX - miraU[0]) * 0.006; miraU = [t.clientX, t.clientY]; }
  }
}, { passive: false });
const finT = e => { for (const t of e.changedTouches) { if (t.identifier === joyId) { joyId = null; entrada.x = entrada.y = 0; $('joyBase').style.display = 'none'; } if (t.identifier === miraId) miraId = null; } };
lienzo.addEventListener('touchend', finT); lienzo.addEventListener('touchcancel', finT);
let ratonX = null;
lienzo.addEventListener('mousedown', e => { ratonX = e.clientX; });
addEventListener('mousemove', e => { if (ratonX !== null && e.buttons) { camYaw -= (e.clientX - ratonX) * 0.006; ratonX = e.clientX; } });
addEventListener('mouseup', () => ratonX = null);
addEventListener('keydown', e => { teclas[e.code] = true; if ((e.code === 'Space' || e.code === 'Enter') && !$('dialogo').classList.contains('oculto')) avanzarDialogo(); });
addEventListener('keyup', e => teclas[e.code] = false);

// ===================== UI general =====================
let tAviso = null;
function aviso(txt, ms = 2200) { const a = $('aviso'); a.textContent = txt; a.style.opacity = 1; clearTimeout(tAviso); tAviso = setTimeout(() => a.style.opacity = 0, ms); }
function mostrarCampoUI(v) { for (const id of ['hud', 'hudGrupo', 'bMenu']) $(id).classList.toggle('oculto', !v); if (!v) $('bHablar').classList.add('oculto'); }
function actualizarHUD() {
  const z = zonaEn(jugador.position.z);
  $('zona').textContent = z.nombre.toUpperCase();
  $('objetivo').textContent = OBJETIVOS[estado.cap] || '';
  $('hudGrupo').innerHTML = estado.grupo.map(id => {
    const m = estado.miembros[id], s = stats(id);
    return `<div class="mini"><b style="color:${PERSONAJES[id].color}">${PERSONAJES[id].corto} Nv${m.nivel}</b>${m.hp}/${s.vida}<div class="barra"><i style="width:${100 * m.hp / s.vida}%"></i></div></div>`;
  }).join('');
}

// Diálogos
let colaDialogo = null;
function dialogo(lineas) {
  return new Promise(res => { colaDialogo = { lineas, i: 0, res }; mostrarLinea(); $('dialogo').classList.remove('oculto'); });
}
let escribiendo = null;
function mostrarLinea() {
  const l = colaDialogo.lineas[colaDialogo.i], h = HABLANTES[l.q] || HABLANTES.narrador;
  $('dRetrato').innerHTML = h.retrato ? retrato(h.retrato, 84) : '';
  $('dRetrato').style.display = h.retrato ? '' : 'none';
  $('dNombre').textContent = h.nombre; $('dNombre').style.color = h.color;
  $('dLinea').style.fontStyle = l.q === 'narrador' ? 'italic' : 'normal';
  $('dLinea').style.color = l.q === 'sistema' ? '#ffd54a' : '#eef';
  let n = 0; clearInterval(escribiendo);
  escribiendo = setInterval(() => { n += 2; $('dLinea').textContent = l.t.slice(0, n); if (n >= l.t.length) { clearInterval(escribiendo); escribiendo = null; } }, 16);
}
function avanzarDialogo() {
  if (!colaDialogo) return;
  const l = colaDialogo.lineas[colaDialogo.i];
  if (escribiendo) { clearInterval(escribiendo); escribiendo = null; $('dLinea').textContent = l.t; return; }
  colaDialogo.i++;
  if (colaDialogo.i >= colaDialogo.lineas.length) { $('dialogo').classList.add('oculto'); const r = colaDialogo.res; colaDialogo = null; r(); }
  else mostrarLinea();
}
$('dialogo').addEventListener('pointerdown', e => { e.preventDefault(); avanzarDialogo(); });

// ===================== Bucle de exploración =====================
let modo = 'titulo', ocupado = false, pasosEncuentro = azar(16, 30), cercaCristal = -1, ultimoAvisoPuerta = 0;

function actualizarCampo(dt, t) {
  let ix = entrada.x, iy = entrada.y;
  if (teclas.KeyW || teclas.ArrowUp) iy -= 1; if (teclas.KeyS || teclas.ArrowDown) iy += 1;
  if (teclas.KeyA || teclas.ArrowLeft) ix -= 1; if (teclas.KeyD || teclas.ArrowRight) ix += 1;
  if (teclas.KeyQ) camYaw += dt * 2; if (teclas.KeyE) camYaw -= dt * 2;
  const mag = Math.min(1, Math.hypot(ix, iy));
  const libre = !ocupado && $('menu').classList.contains('oculto');
  let vel = 0;
  if (libre && mag > 0.1) {
    const ang = Math.atan2(ix, iy) + camYaw;
    const dx = Math.sin(ang) * mag * 7 * dt, dz = Math.cos(ang) * mag * 7 * dt;
    let nx = THREE.MathUtils.clamp(jugador.position.x + dx, -19, 19);
    let nz = THREE.MathUtils.clamp(jugador.position.z + dz, -196, 18);
    for (const p of puertas) if (estado.cap < p.cap && nz < p.z + 1 && jugador.position.z >= p.z + 1) {
      nz = p.z + 1;
      if (t - ultimoAvisoPuerta > 3) { aviso(p.msg); ultimoAvisoPuerta = t; }
    }
    const dist = Math.hypot(nx - jugador.position.x, nz - jugador.position.z);
    jugador.position.x = nx; jugador.position.z = nz;
    jugador.rotation.y = Math.atan2(dx, dz);
    vel = mag;
    if (dist > 0.01) { rastro.unshift({ x: nx, z: nz }); if (rastro.length > 60) rastro.pop(); }
    // encuentros aleatorios
    const zona = zonaEn(nz);
    const cercaDeAlgo = cristales.some(c => Math.hypot(c.x - nx, c.z - nz) < 9) || EVENTOS.some(e => e.cap === estado.cap && Math.hypot(e.x - nx, e.z - nz) < e.radio + 5);
    if (zona.encuentros && !cercaDeAlgo) {
      pasosEncuentro -= dist;
      if (pasosEncuentro <= 0) { pasosEncuentro = azar(18, 34); iniciarEncuentro(elegir(zona.encuentros)); }
    }
  }
  jugador.position.y = altura(jugador.position.x, jugador.position.z);
  animarHumanoide(jugador, t, vel);
  actualizarSeguidores(vel, t);
  animarHumanoide(tobias, t + 2, 0);

  // cámara en tercera persona
  const cx = jugador.position.x + Math.sin(camYaw) * 9, cz = jugador.position.z + Math.cos(camYaw) * 9;
  camara.position.lerp(new THREE.Vector3(cx, jugador.position.y + 5.5, cz), 0.12);
  camara.lookAt(jugador.position.x, jugador.position.y + 1.3, jugador.position.z);
  sol.position.set(jugador.position.x + 12, 30, jugador.position.z + 8); sol.target.position.copy(jugador.position);

  // cielo y niebla según zona
  const z = jugador.position.z, zi = ZONAS.indexOf(zonaEn(z)), zo = ZONAS[zi], sig = ZONAS[zi + 1];
  let k = 0; if (sig) { const d = z - zo.hasta; if (d < 8) k = (1 - d / 8) * 0.5; }
  const mezcla = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), k);
  cieloCampo.material.uniforms.arriba.value.copy(mezcla(zo.cielo[1], sig ? sig.cielo[1] : zo.cielo[1]));
  cieloCampo.material.uniforms.abajo.value.copy(mezcla(zo.cielo[0], sig ? sig.cielo[0] : zo.cielo[0]));
  campo.fog.color.copy(mezcla(zo.niebla, sig ? sig.niebla : zo.niebla));
  cieloCampo.position.copy(camara.position);

  for (const a of animados) {
    if (a.userData.gira) a.rotation.z += a.userData.gira * dt, a.rotation.y += a.userData.gira * dt * 0.5;
    if (a.userData.pulso) a.scale.setScalar(1 + Math.sin(t * 3) * 0.15);
    if (a.userData.flota !== undefined) a.position.y = altura(a.position.x, a.position.z) + 1.5 + Math.sin(t + a.userData.flota) * 0.6;
  }
  for (const p of puertas) { p.malla.visible = estado.cap < p.cap; p.malla.material.opacity = 0.25 + Math.sin(t * 2) * 0.1; }
  for (const m of marcadores) m.g.visible = m.e.cap === estado.cap;

  if (!libre) return;
  // cristales
  let cerca = -1;
  cristales.forEach((c, i) => { if (Math.hypot(c.x - jugador.position.x, c.z - jugador.position.z) < 2.6) cerca = i; });
  if (cerca >= 0 && cercaCristal !== cerca) {
    for (const id of estado.grupo) estado.miembros[id].hp = stats(id).vida;
    guardar(); aviso('✦ El cristal restaura al grupo. Partida guardada.'); rafaga(campo, jugador.position.clone().setY(jugador.position.y + 1), 0x7fd8ff, 50, { fuerza: 3, grav: -1 });
  }
  cercaCristal = cerca;
  // NPC
  $('bHablar').classList.toggle('oculto', jugador.position.distanceTo(tobias.position) > 3);
  // eventos
  for (const e of EVENTOS) if (e.cap === estado.cap && Math.hypot(e.x - jugador.position.x, e.z - jugador.position.z) < e.radio) { ejecutarEvento(e); break; }
  if (Math.floor(t * 4) !== Math.floor((t - dt) * 4)) actualizarHUD();
}

$('bHablar').addEventListener('click', async () => {
  if (ocupado) return; ocupado = true;
  const consejos = {
    1: '¿Viste el brillo en las ruinas del norte? Lleva Hielo: los gólems de vidrio lo odian.',
    2: 'Ese Eco te cambió la mirada, muchacho. Vincula tus magias en el MENÚ: con 30 de Fuego en Fuerza pegarás como locomotora.',
    3: 'En el bosque los lobos temen al fuego. Y los pájaros espinosos, a la piedra.',
  };
  await dialogo([{ q: 'tobias', t: consejos[estado.cap] || 'Cuídate, Kael. Ferrovia siempre tendrá una banca para ti y tus amigos.' }]);
  ocupado = false;
});

async function ejecutarEvento(e) {
  ocupado = true; entrada.x = entrada.y = 0;
  await dialogo(e.antes);
  if (e.batalla) {
    const r = await combate(e.batalla, { jefe: true, sinHuir: true });
    if (!r) return;
    if (e.batalla2) {
      await dialogo(e.medio);
      const r2 = await combate(e.batalla2, { jefe: true, sinHuir: true, continuar: true });
      if (!r2) return;
    }
  }
  if (e.premio) {
    if (e.premio.miembro) {
      const id = e.premio.miembro, nv = Math.max(...estado.grupo.map(g => estado.miembros[g].nivel)) + (id === 'doran' ? 1 : 0);
      estado.miembros[id] = nuevoMiembro(id, nv, id === 'lyra' ? { cura: 15, rayo: 10 } : { hielo: 20, piedra: 12 });
      estado.grupo.push(id);
    }
    if (e.premio.eco) estado.ecos[e.premio.eco] = e.premio.a;
  }
  await dialogo(e.despues);
  estado.cap = e.nuevoCap;
  for (const id of estado.grupo) estado.miembros[id].hp = Math.max(estado.miembros[id].hp, Math.round(stats(id).vida * 0.5));
  guardar(); actualizarHUD();
  if (e.fin) { $('fin').classList.remove('oculto'); }
  ocupado = false;
}
$('fSeguir').addEventListener('click', () => $('fin').classList.add('oculto'));

// ===================== COMBATE =====================
const arena = new THREE.Scene();
const cieloArena = crearCielo(); arena.add(cieloArena);
arena.fog = new THREE.Fog(0x000000, 18, 60);
arena.add(new THREE.HemisphereLight(0xffffff, 0x443355, 1.2));
const solA = new THREE.DirectionalLight(0xffffff, 1.7); solA.position.set(4, 12, 8); solA.castShadow = true; solA.shadow.mapSize.set(1024, 1024);
Object.assign(solA.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 }); arena.add(solA);
let decoArena = new THREE.Group(); arena.add(decoArena);

function prepararArena(zona) {
  arena.remove(decoArena); decoArena = new THREE.Group(); arena.add(decoArena);
  const piso = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshLambertMaterial({ color: zona.suelo })); piso.rotation.x = -Math.PI / 2; piso.receiveShadow = true; decoArena.add(piso);
  const circulo = new THREE.Mesh(new THREE.RingGeometry(6.5, 6.8, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })); circulo.rotation.x = -Math.PI / 2; circulo.position.y = 0.02; decoArena.add(circulo);
  cieloArena.material.uniforms.arriba.value.setHex(zona.cielo[1]); cieloArena.material.uniforms.abajo.value.setHex(zona.cielo[0]);
  arena.fog.color.setHex(zona.niebla);
  const r = semilla(zona.id.length * 99);
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + r(), d = 11 + r() * 10;
    let o;
    if (zona.id === 'bosque') o = arbol(1.2);
    else if (zona.id === 'desierto') o = cristalDeco(elegir([0x9fe7ff, 0xffd59a, 0xff9ad0]), 1 + r() * 3);
    else if (zona.id === 'torre') o = cristalDeco(elegir([0xb69cff, 0x7fd8ff]), 1 + r() * 4);
    else if (zona.id === 'fortaleza') { o = new THREE.Group(); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 2 + r() * 5, 10), toon(0x5a5460)); c.position.y = c.geometry.parameters.height / 2; o.add(contorno(c, 1.04)); }
    else { o = new THREE.Group(); const c = new THREE.Mesh(new THREE.DodecahedronGeometry(1 + r()), toon(0xb09070, { flatShading: true })); o.add(c); }
    o.position.set(Math.cos(a) * d, 0, Math.sin(a) * d - 4); decoArena.add(o);
  }
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(8, 14 + r() * 10, 7), toon(new THREE.Color(zona.suelo).multiplyScalar(0.6).getHex(), { flatShading: true })); const a = i / 10 * Math.PI - Math.PI; m.position.set(Math.cos(a) * 45, 6, Math.sin(a) * 30 - 20); decoArena.add(m); }
}

let B = null; // estado de batalla
const POS_G = [[3.4, -1.9], [3.1, 0.1], [3.7, 2.0]];
const POS_E = [[-3.2, -1.6], [-3.5, 1.4], [-2.8, 0]];

function ubicar(o, x, z) { o.position.set(x, 0, z); o.userData.casa = new THREE.Vector3(x, 0, z); }

function combate(lista, opc = {}) {
  return new Promise(async resolver => {
    modo = 'transicion'; mostrarCampoUI(false);
    await transicion();
    const zona = zonaEn(jugador.position.z);
    prepararArena(zona);
    // limpiar modelos anteriores
    B = { g: [], e: [], listos: [], ocupado: false, opc, resolver, t: 0, fin: false, turnoEnemigo: {} };
    estado.grupo.forEach((id, i) => {
      const m = humanoide(MODELO_PJ[id]); m.rotation.y = -Math.PI / 2;
      ubicar(m, POS_G[i][0], POS_G[i][1]); arena.add(m);
      const s = stats(id);
      B.g.push({ lado: 'g', id, nombre: PERSONAJES[id].corto, modelo: m, s, max: s.vida, get hp() { return estado.miembros[id].hp; }, set hp(v) { estado.miembros[id].hp = v; }, atb: azar(10, 60) });
    });
    const posE = lista.length === 1 ? [[-3.4, 0]] : lista.length === 2 ? [[-3.2, -1.5], [-3.4, 1.5]] : POS_E;
    lista.forEach((tipo, i) => {
      const d = ENEMIGOS[tipo], m = modeloEnemigo(d);
      ubicar(m, posE[i][0] - (d.jefe ? 0.6 : 0), posE[i][1]); arena.add(m);
      B.e.push({ lado: 'e', tipo, d, nombre: d.nombre + (lista.filter(x => x === tipo).length > 1 ? ' ' + 'ABC'[i] : ''), modelo: m, s: { ...d }, hp: d.vida, max: d.vida, atb: azar(0, 40), turnos: 0 });
    });
    for (const c of B.g) if (c.hp <= 0) tumbar(c, true);
    $('bPanel').classList.remove('oculto');
    modo = 'batalla';
    pintarPanel();
    camara.position.set(1.2, 3.4, 8); camara.lookAt(0, 1.1, 0);
  });
}

async function transicion() {
  const f = $('flash'); f.style.background = '#fff';
  for (let i = 0; i < 3; i++) { f.style.opacity = 0.8; await esperar(90); f.style.opacity = 0; await esperar(90); }
  f.style.background = '#000'; f.style.opacity = 1; await esperar(300); f.style.opacity = 0;
}

function vivos(lado) { return (lado === 'g' ? B.g : B.e).filter(c => c.hp > 0); }

function pintarPanel() {
  if (!B) return;
  $('bEnem').innerHTML = B.e.map(e => `<div class="eNom ${e.hp <= 0 ? 'muerto' : ''}">${e.nombre}</div>`).join('');
  $('bGrupo').innerHTML = B.g.map((c, i) => {
    const lleno = c.atb >= 100 && c.hp > 0;
    return `<div class="gFila ${B.listos[0] === c ? 'activo' : ''} ${c.hp <= 0 ? 'ko' : ''}"><span style="color:${PERSONAJES[c.id].color};font-weight:800">${c.nombre}</span><span class="hp ${c.hp < c.max * 0.3 ? 'bajo' : ''}">${c.hp}/${c.max}</span><div class="atb ${lleno ? 'lleno' : ''}"><i style="width:${Math.min(100, c.atb)}%"></i></div></div>`;
  }).join('');
}

function actualizarBatalla(dt, t) {
  if (!B) return;
  B.t += dt;
  // cámara con balanceo suave
  if (!B.camLibre) {
    const lejos = B.e.some(e => e.d.jefe) ? 1.25 : 1;
    const obj = new THREE.Vector3(1.2 + Math.sin(B.t * 0.25) * 1.2, (3.4 + Math.sin(B.t * 0.4) * 0.2) * lejos, 8 * lejos);
    camara.position.lerp(obj, 0.04); camara.lookAt(0, 1.1 * lejos, 0);
  }
  cieloArena.position.copy(camara.position);
  for (const c of B.g) if (c.hp > 0 && !c.modelo.userData.ataca) animarHumanoide(c.modelo, t + c.modelo.position.z, 0);
  for (const e of B.e) if (e.hp > 0) animarCriatura(e.modelo, t + e.modelo.position.z);
  if (B.fin) return;
  const pausa = B.ocupado || B.listos.length > 0 || !$('dialogo').classList.contains('oculto');
  if (!pausa) {
    for (const c of [...B.g, ...B.e]) if (c.hp > 0 && c.atb < 100) c.atb = Math.min(100, c.atb + dt * (18 + c.s.velocidad * 2.2));
  }
  if (!B.ocupado) for (const c of B.g) if (c.hp > 0 && c.atb >= 100 && !B.listos.includes(c)) { B.listos.push(c); if (B.listos.length === 1) abrirComandos(); }
  if (!B.ocupado && B.listos.length === 0) {
    const e = B.e.find(e => e.hp > 0 && e.atb >= 100);
    if (e) accionEnemigo(e);
  }
  if (Math.floor(t * 10) !== Math.floor((t - dt) * 10)) pintarPanel();
}

// ---------- Comandos del jugador ----------
function cmdHTML(titulo, ops) {
  $('bCmd').innerHTML = `<h3>${titulo}</h3>` + ops.map((o, i) => `<button class="op ${o.cls || ''}" data-i="${i}" ${o.off ? 'disabled' : ''}><span>${o.t}</span>${o.d ? `<small>${o.d}</small>` : ''}</button>`).join('');
  $('bCmd').classList.remove('oculto');
  $('bCmd').querySelectorAll('.op').forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); const o = ops[+b.dataset.i]; if (!o.off) o.f(); }));
}
function cerrarComandos() { $('bCmd').classList.add('oculto'); }

function abrirComandos() {
  const c = B.listos[0]; if (!c) return;
  if (c.hp <= 0) { B.listos.shift(); c.atb = 0; return abrirComandos(); }
  pintarPanel();
  const m = estado.miembros[c.id];
  const arte = c.hp <= c.max * 0.3;
  const ecosDe = Object.entries(estado.ecos).filter(([e, a]) => a === c.id).map(([e]) => e);
  const ops = [
    arte ? { t: '★ ' + PERSONAJES[c.id].arte.nombre, cls: 'arte', f: () => elegirObjetivo('e', o => ejecutar(c, () => accArte(c, o)), PERSONAJES[c.id].arte.tipo === 'magia_todos') }
         : { t: 'Atacar', f: () => elegirObjetivo('e', o => ejecutar(c, () => accAtacar(c, o))) },
    { t: 'Magia', off: !Object.values(m.stock).some(v => v > 0), f: () => menuMagia(c) },
    { t: 'Extraer', f: () => elegirObjetivo('e', o => menuExtraer(c, o)) },
    { t: 'Eco', off: ecosDe.length === 0, d: ecosDe.length ? '' : '—', f: () => menuEco(c, ecosDe) },
    { t: 'Objeto', f: () => menuObjeto(c) },
  ];
  if (!B.opc.sinHuir) ops.push({ t: 'Huir', f: () => ejecutar(c, () => accHuir(c)) });
  cmdHTML(PERSONAJES[c.id].nombre, ops);
}
function volver() { return { t: '← Volver', cls: 'sec', f: abrirComandos }; }

function elegirObjetivo(lado, alElegir, todos = false, incluirKO = false) {
  const lista = (lado === 'e' ? B.e : B.g).filter(x => incluirKO ? x.hp <= 0 : x.hp > 0);
  if (todos) return alElegir(null);
  if (lista.length === 1 && lado === 'e') return alElegir(lista[0]);
  cmdHTML('Objetivo', [...lista.map(x => ({ t: x.nombre, d: lado === 'g' ? `${x.hp}/${x.max}` : '', f: () => alElegir(x) })), volver()]);
}
function menuMagia(c) {
  const st = estado.miembros[c.id].stock;
  const ops = Object.keys(MAGIAS).filter(k => st[k] > 0).map(k => ({
    t: MAGIAS[k].nombre, d: 'x' + st[k],
    f: () => MAGIAS[k].cura ? elegirObjetivo('g', o => ejecutar(c, () => accMagia(c, k, o))) : elegirObjetivo('e', o => ejecutar(c, () => accMagia(c, k, o))),
  }));
  cmdHTML('Magia', [...ops, volver()]);
}
function menuExtraer(c, o) {
  cmdHTML('Extraer de ' + o.nombre, [...o.d.magias.map(k => ({ t: MAGIAS[k].nombre, d: 'tienes ' + estado.miembros[c.id].stock[k], f: () => ejecutar(c, () => accExtraer(c, o, k)) })), volver()]);
}
function menuEco(c, lista) {
  cmdHTML('Invocar Eco', [...lista.map(e => ({ t: ECOS[e].nombre, d: ECOS[e].elem, f: () => ejecutar(c, () => accEco(c, e)) })), volver()]);
}
function menuObjeto(c) {
  const ob = estado.objetos;
  cmdHTML('Objetos', [
    { t: 'Poción', d: 'x' + ob.pocion, off: !ob.pocion, f: () => elegirObjetivo('g', o => ejecutar(c, () => accObjeto(c, 'pocion', o))) },
    { t: 'Brasa Vital', d: 'x' + ob.brasa, off: !ob.brasa || !B.g.some(x => x.hp <= 0), f: () => elegirObjetivo('g', o => ejecutar(c, () => accObjeto(c, 'brasa', o)), false, true) },
    volver(),
  ]);
}

async function ejecutar(c, accion) {
  cerrarComandos();
  B.listos.shift(); B.ocupado = true; c.atb = 0; pintarPanel();
  await accion();
  B.ocupado = false;
  if (!B) return;
  await revisarFin();
  if (B && !B.fin && B.listos.length) abrirComandos();
}

// ---------- Utilidades de combate ----------
const vec = new THREE.Vector3();
function aPantalla(obj, alto = 1.6) {
  vec.copy(obj.modelo.position); vec.y += alto; vec.project(camara);
  return [(vec.x * 0.5 + 0.5) * innerWidth, (-vec.y * 0.5 + 0.5) * innerHeight];
}
function numero(obj, txt, cls = '') {
  const [x, y] = aPantalla(obj, (obj.modelo.userData.alto || 2) * 0.8);
  const d = document.createElement('div'); d.className = 'num ' + cls; d.textContent = txt;
  d.style.left = x + 'px'; d.style.top = y + 'px'; document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.transform = 'translate(-50%,-160%)'; setTimeout(() => d.style.opacity = 0, 600); });
  setTimeout(() => d.remove(), 1300);
}
async function banner(txt, ms = 900) { const b = $('bBanner'); b.textContent = txt; b.classList.remove('oculto'); await esperar(ms); b.classList.add('oculto'); }
function centro(o) { return o.modelo.position.clone().setY((o.modelo.userData.alto || 2) * 0.5); }
function sacudir(o, f = 0.25) { const p = o.modelo.position.clone(); return tween(0.3, k => { o.modelo.position.x = p.x + Math.sin(k * 40) * f * (1 - k); if (k >= 1) o.modelo.position.copy(p); }); }
function multElem(objetivo, elem) {
  if (!elem || objetivo.lado !== 'e') return 1;
  if (objetivo.d.debil === elem) return 2;
  return 1;
}
async function dañar(o, cant, cls = '') {
  cant = Math.max(1, Math.round(cant));
  o.hp = Math.max(0, o.hp - cant);
  numero(o, cant, cls);
  sacudir(o);
  o.modelo.traverse(m => { if (m.isMesh && m.material.emissive && !m.userData.esBorde) { const e = m.material; } });
  if (o.hp <= 0) { if (o.lado === 'e') await morirEnemigo(o); else tumbar(o); }
  pintarPanel();
}
function curar(o, cant) {
  cant = Math.round(cant); o.hp = Math.min(o.max, o.hp + cant); numero(o, '+' + cant, 'cura');
  rafaga(arena, centro(o), 0x7dffb0, 30, { fuerza: 2, grav: -2, sube: 1.5 }); pintarPanel();
}
function tumbar(c, inst = false) {
  const m = c.modelo; m.userData.ataca = true;
  if (inst) { m.rotation.z = Math.PI / 2; m.position.y = 0.2; return; }
  tween(0.4, k => { m.rotation.z = k * Math.PI / 2; m.position.y = k * 0.2; });
  c.atb = 0; B.listos = B.listos.filter(x => x !== c);
}
function levantar(c) { const m = c.modelo; m.rotation.z = 0; m.position.y = 0; m.userData.ataca = false; }
async function morirEnemigo(o) {
  rafaga(arena, centro(o), o.d.color, 60, { fuerza: 5 });
  const m = o.modelo, s0 = m.scale.x;
  await tween(0.5, k => { m.scale.setScalar(s0 * (1 - k)); m.position.y = k * 1.5; m.rotation.y += 0.2; });
  m.visible = false;
}
async function embestir(a, o, golpe) {
  const m = a.modelo, casa = m.userData.casa.clone();
  const dir = o.modelo.position.clone().sub(casa); dir.y = 0;
  const dest = casa.clone().add(dir.multiplyScalar(1 - (a.lado === 'g' ? 1.4 : 1.8) / dir.length()));
  m.userData.ataca = true;
  const p = m.userData.p || m.userData.interno?.userData?.p;
  await tween(0.28, k => { m.position.lerpVectors(casa, dest, suave(k)); if (p) animarHumanoide(m.userData.interno || m, k * 3, 1); });
  if (p) await tween(0.2, k => { p.brazoD.rotation.x = -2.6 + k * 3.2; });
  else await tween(0.15, k => { m.position.y = Math.sin(k * Math.PI) * 0.6; });
  await golpe();
  await tween(0.28, k => { m.position.lerpVectors(dest, casa, suave(k)); });
  if (p) p.brazoD.rotation.x = 0;
  m.userData.ataca = false;
}

// ---------- Efectos de magia ----------
async function efectoMagia(elem, o, color) {
  const c = centro(o);
  if (elem === 'fuego') {
    for (let i = 0; i < 3; i++) { rafaga(arena, c.clone().setY(0.3), 0xff6a2a, 40, { fuerza: 3, grav: -6, sube: 1, ancho: 2 }); rafaga(arena, c, 0xffd23a, 20, { fuerza: 2, grav: -3 }); await esperar(120); }
  } else if (elem === 'hielo') {
    const cr = [];
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(azar(0.2, 0.45)), new THREE.MeshToonMaterial({ color: 0xbff2ff, transparent: true, opacity: 0.9, emissive: 0x3a7a9a }));
      m.position.set(c.x + azar(-1, 1), 6 + i * 0.3, c.z + azar(-1, 1)); m.scale.y = 2; arena.add(m); cr.push(m);
    }
    await tween(0.45, k => cr.forEach((m, i) => { m.position.y = lerp(6 + i * 0.3, c.y + azar(-0.3, 0.3), k); m.rotation.y += 0.2; }));
    rafaga(arena, c, 0x9be8ff, 50, { fuerza: 4 });
    setTimeout(() => cr.forEach(m => arena.remove(m)), 250);
  } else if (elem === 'rayo') {
    for (let r = 0; r < 2; r++) {
      const pts = []; let x = c.x, z = c.z;
      for (let y = 12; y >= c.y; y -= 1) { pts.push(new THREE.Vector3(x, y, z)); x += azar(-0.5, 0.5); z += azar(-0.5, 0.5); }
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xfff6a0 }));
      arena.add(l); $('flash').style.background = '#fff8c0'; $('flash').style.opacity = 0.5;
      await esperar(90); $('flash').style.opacity = 0; arena.remove(l); await esperar(60);
    }
    rafaga(arena, c, 0xffe14a, 50, { fuerza: 6, grav: 2 });
  } else if (elem === 'tierra') {
    const rocas = [];
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.DodecahedronGeometry(azar(0.35, 0.6)), toon(0x9c7a46, { flatShading: true })); m.position.set(c.x + azar(-0.8, 0.8), 8 + i, c.z + azar(-0.8, 0.8)); arena.add(m); rocas.push(m); }
    await tween(0.5, k => rocas.forEach((m, i) => { m.position.y = lerp(8 + i, 0.4, k * k); m.rotation.x += 0.15; }));
    rafaga(arena, c.clone().setY(0.3), 0xc49a5a, 50, { fuerza: 4, horiz: 1.5, sube: 0.6 });
    setTimeout(() => rocas.forEach(m => arena.remove(m)), 300);
  } else {
    rafaga(arena, c, color || 0xd0a0ff, 60, { fuerza: 5, grav: 0 });
    await esperar(250);
  }
}

// ---------- Acciones ----------
function dañoFisico(a, o, mult = 1) { return (a.s.fuerza * 2.2 - o.s.defensa * 1.1) * azar(0.9, 1.1) * mult; }
function dañoMagico(a, o, poder, mult = 1) { return ((poder + a.s.magia * 2.6) * mult - o.s.magia * 0.6) * azar(0.92, 1.08); }

async function accAtacar(a, o) {
  if (o.hp <= 0) o = vivos(o.lado)[0]; if (!o) return;
  await embestir(a, o, async () => { rafaga(arena, centro(o), 0xffffff, 18, { fuerza: 3 }); await dañar(o, dañoFisico(a, o)); });
}
async function accMagia(a, k, o) {
  const mg = MAGIAS[k], st = estado.miembros[a.id].stock;
  st[k]--;
  B.camLibre = false;
  await banner(mg.nombre, 500);
  if (mg.cura) { if (o.hp <= 0) return numero(o, 'Sin efecto', 'info'); curar(o, mg.poder + a.s.magia * 3); return; }
  if (o.hp <= 0) o = vivos('e')[0]; if (!o) return;
  await efectoMagia(mg.elem, o, mg.color);
  const m = multElem(o, mg.elem);
  await dañar(o, dañoMagico(a, o, mg.poder, m), m > 1 ? 'debil' : '');
}
async function accExtraer(a, o, k) {
  if (o.hp <= 0) return;
  rafaga(arena, centro(o), MAGIAS[k].color, 40, { fuerza: 1, grav: 0 });
  // partícula que viaja hacia el personaje
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: MAGIAS[k].color }));
  const ini = centro(o), fin = centro(a); arena.add(orb);
  await tween(0.6, t => { orb.position.lerpVectors(ini, fin, suave(t)); orb.position.y += Math.sin(t * Math.PI) * 1.5; });
  arena.remove(orb);
  const st = estado.miembros[a.id].stock;
  const n = Math.min(100 - st[k], Math.max(1, Math.floor(azar(1, 3 + a.s.magia / 5))));
  st[k] += n;
  numero(a, n > 0 ? `+${n} ${MAGIAS[k].nombre}` : 'Lleno', 'info');
  rafaga(arena, fin, MAGIAS[k].color, 25, { fuerza: 2, grav: -1 });
  await esperar(300);
}
async function accEco(a, id) {
  const eco = ECOS[id];
  $('iNom').textContent = eco.nombre.toUpperCase(); $('iNom').style.color = '#' + eco.color.toString(16).padStart(6, '0');
  $('iAt').textContent = eco.ataque; $('invoca').classList.remove('oculto');
  B.camLibre = true;
  const m = modeloEco(id); m.position.set(-1, -6, -5); m.rotation.y = Math.PI; arena.add(m);
  const ini = camara.position.clone();
  rafaga(arena, new THREE.Vector3(-1, 0.5, -5), eco.color, 120, { fuerza: 6, grav: -2, ancho: 4 });
  await tween(1.4, k => {
    m.position.y = lerp(-6, id === 'volt' ? 1.5 : 0, suave(Math.min(1, k * 1.5)));
    camara.position.set(lerp(ini.x, 5, k), lerp(ini.y, 3, k), lerp(ini.z, 7, k)); camara.lookAt(-1, 2.5, -4);
    animarCriatura(m, k * 4);
  });
  $('invoca').classList.add('oculto');
  await tween(0.5, k => { m.position.x = lerp(-1, -3, k); m.position.z = lerp(-5, -3, k); animarCriatura(m, 2 + k * 4); });
  $('flash').style.background = '#fff'; $('flash').style.opacity = 0.7; await esperar(120); $('flash').style.opacity = 0;
  const objetivos = vivos('e');
  for (const o of objetivos) efectoMagia(eco.elem, o, eco.color);
  await esperar(500);
  const lvl = estado.miembros[a.id].nivel;
  for (const o of objetivos) {
    const mult = multElem(o, eco.elem);
    dañar(o, ((eco.poder + a.s.magia * 2 + lvl * 6) * mult - o.s.magia * 0.5) * azar(0.95, 1.05), mult > 1 ? 'debil' : '');
  }
  await esperar(700);
  await tween(0.5, k => { m.scale.setScalar(1 - k); m.position.y += 0.1; });
  arena.remove(m); B.camLibre = false;
  await esperar(200);
}
async function accArte(a, o) {
  const arte = PERSONAJES[a.id].arte;
  await banner('★ ' + arte.nombre, 800);
  if (arte.tipo === 'magia_todos') {
    const vs = vivos('e');
    for (let i = 0; i < 12; i++) { const e = elegir(vs); rafaga(arena, centro(e).add(new THREE.Vector3(0, 4, 0)), elegir([0xffffff, 0x7fd8ff, 0xffd54a]), 25, { fuerza: 2, grav: 14 }); await esperar(60); }
    for (const e of vs) dañar(e, (60 + a.s.magia * 3) * arte.mult - e.s.magia * 0.5);
    await esperar(500); return;
  }
  if (o.hp <= 0) o = vivos('e')[0]; if (!o) return;
  await embestir(a, o, async () => {
    for (let i = 0; i < 3; i++) { rafaga(arena, centro(o), arte.elem === 'fuego' ? 0xff8a3d : 0xc49a5a, 40, { fuerza: 5 }); await esperar(80); }
    const m = multElem(o, arte.elem);
    await dañar(o, dañoFisico(a, o, arte.mult) * m, 'debil');
  });
  if (arte.tipo === 'fisico_cura') for (const c of vivos('g')) curar(c, c.max * 0.2);
}
async function accObjeto(a, k, o) {
  estado.objetos[k]--;
  if (k === 'pocion') { if (o.hp <= 0) return numero(o, 'Sin efecto', 'info'); curar(o, 150); }
  else { levantar(o); o.hp = Math.round(o.max * 0.3); numero(o, '¡De pie!', 'cura'); rafaga(arena, centro(o), 0xffb347, 50, { fuerza: 3, grav: -3 }); pintarPanel(); }
  await esperar(500);
}
async function accHuir(a) {
  if (Math.random() < 0.65) { await banner('¡Escaparon!', 700); terminarBatalla('huida'); }
  else await banner('¡No pudieron escapar!', 800);
}

// ---------- IA enemiga ----------
async function accionEnemigo(e) {
  B.ocupado = true; e.atb = 0; e.turnos++;
  const vs = vivos('g'); if (!vs.length) { B.ocupado = false; return; }
  const o = elegir(vs);
  const esp = e.d.especial;
  if (e.d.magias.includes('cura') && e.hp < e.max * 0.35 && Math.random() < 0.35) {
    await banner(e.nombre + ': Cura', 500); curar(e, e.d.jefe ? e.max * 0.08 : 40 + e.s.magia * 2);
  } else if (esp && e.turnos % esp.cada === 0) {
    await banner(esp.nombre, 900);
    if (esp.magico) {
      const elemColor = { fuego: 0xff6a2a, hielo: 0x9be8ff, rayo: 0xffe14a, tierra: 0xc49a5a }[esp.elem] || 0xb69cff;
      $('flash').style.background = '#' + elemColor.toString(16).padStart(6, '0'); $('flash').style.opacity = 0.45; await esperar(150); $('flash').style.opacity = 0;
      for (const c of vs) { rafaga(arena, centro(c), elemColor, 30, { fuerza: 4 }); dañar(c, (esp.poder + e.s.magia * 2.2) - c.s.magia * 0.8); }
      if (esp.olvido) { const c = elegir(vs); c.atb = 0; setTimeout(() => numero(c, 'Olvido', 'info'), 300); }
      await esperar(700);
    } else if (esp.todos) {
      await tween(0.3, k => e.modelo.position.y = Math.sin(k * Math.PI) * 1.5);
      $('flash').style.background = '#fff'; $('flash').style.opacity = 0.4; await esperar(100); $('flash').style.opacity = 0;
      for (const c of vs) { rafaga(arena, c.modelo.position.clone().setY(0.2), 0xc8b090, 30, { fuerza: 4, horiz: 1.5, sube: 0.5 }); dañar(c, dañoFisico(e, c, esp.mult)); }
      await esperar(600);
    } else {
      await embestir(e, o, async () => { rafaga(arena, centro(o), 0xffffff, 30, { fuerza: 4 }); await dañar(o, dañoFisico(e, o, esp.mult)); });
    }
  } else if (e.s.magia >= 14 && Math.random() < 0.4) {
    const k = elegir(e.d.magias.filter(x => x !== 'cura')) || 'fuego';
    await banner(e.nombre + ': ' + MAGIAS[k].nombre, 500);
    await efectoMagia(MAGIAS[k].elem, o, MAGIAS[k].color);
    await dañar(o, (MAGIAS[k].poder + e.s.magia * 2.2) - o.s.magia * 0.8);
  } else {
    await embestir(e, o, async () => { rafaga(arena, centro(o), 0xffffff, 18, { fuerza: 3 }); await dañar(o, dañoFisico(e, o)); });
  }
  B.ocupado = false;
  await revisarFin();
}

// ---------- Fin de batalla ----------
async function revisarFin() {
  if (!B || B.fin) return;
  if (vivos('e').length === 0) { B.fin = true; cerrarComandos(); await victoria(); }
  else if (vivos('g').length === 0) { B.fin = true; cerrarComandos(); await derrota(); }
}
async function victoria() {
  await esperar(500);
  const xp = B.e.reduce((s, e) => s + e.d.xp, 0);
  const lineas = [`<p>Experiencia: <b>+${xp}</b></p>`];
  for (const c of B.g) {
    const m = estado.miembros[c.id];
    if (c.hp <= 0) { c.hp = 1; }
    m.xp += xp;
    while (m.xp >= xpSiguiente(m.nivel)) {
      m.xp -= xpSiguiente(m.nivel); const antes = stats(c.id).vida; m.nivel++;
      m.hp += stats(c.id).vida - antes;
      lineas.push(`<p style="color:${PERSONAJES[c.id].color}">¡${c.nombre} sube a nivel ${m.nivel}!</p>`);
    }
    m.hp = Math.min(m.hp, stats(c.id).vida);
  }
  let poc = 0, bra = 0;
  for (const e of B.e) { if (e.d.jefe) { poc += 2; bra += 1; } else if (Math.random() < 0.35) poc++; }
  if (poc) { estado.objetos.pocion += poc; lineas.push(`<p>Obtuviste ${poc} Poción${poc > 1 ? 'es' : ''}</p>`); }
  if (bra) { estado.objetos.brasa += bra; lineas.push(`<p>Obtuviste ${bra} Brasa Vital</p>`); }
  for (const c of B.g) if (c.hp > 0) { c.modelo.userData.ataca = true; tween(0.6, k => { const p = c.modelo.userData.p; if (p) p.brazoD.rotation.x = -k * 2.8; }); }
  $('resultado').innerHTML = `<h2>VICTORIA</h2>${lineas.join('')}<p style="opacity:.6;margin-top:10px">Toca para continuar</p>`;
  $('resultado').classList.remove('oculto');
  await new Promise(r => $('resultado').addEventListener('pointerdown', r, { once: true }));
  $('resultado').classList.add('oculto');
  terminarBatalla('victoria');
}
async function derrota() {
  await esperar(600);
  $('resultado').innerHTML = `<h2 style="color:#ff6a7a">DERROTA</h2><p>Los recuerdos del grupo se desvanecen…</p><p style="margin-top:12px"><button class="btn" id="rReint">Volver al último cristal</button></p>`;
  $('resultado').classList.remove('oculto');
  await new Promise(r => $('rReint').addEventListener('click', r, { once: true }));
  $('resultado').classList.add('oculto');
  const g = cargar();
  if (g) { estado = g; } else { estado = nuevoEstado(); estado.cap = 1; }
  for (const id of estado.grupo) estado.miembros[id].hp = stats(id).vida;
  jugador.position.set(estado.pos.x, 0, estado.pos.z); rastro.length = 0;
  for (const k in seguidores) { campo.remove(seguidores[k]); delete seguidores[k]; }
  const res = B.resolver; limpiarArena(); B = null;
  volverAlCampo(); ocupado = false;
  res(false);
}
function limpiarArena() {
  for (const c of [...B.g, ...B.e]) arena.remove(c.modelo);
  $('bPanel').classList.add('oculto'); cerrarComandos();
}
async function terminarBatalla(como) {
  const res = B.resolver, cont = B.opc.continuar;
  limpiarArena(); B = null;
  if (!cont || true) volverAlCampo();
  res(como !== 'derrota');
}
function volverAlCampo() {
  modo = 'campo'; mostrarCampoUI(true); actualizarHUD();
  const f = $('flash'); f.style.background = '#000'; f.style.opacity = 1; setTimeout(() => f.style.opacity = 0, 50);
}
async function iniciarEncuentro(lista) {
  ocupado = true; entrada.x = entrada.y = 0;
  await combate(lista);
  ocupado = false;
}

// ===================== MENÚ =====================
let pestaña = 'grupo', selV = 'kael';
$('bMenu').addEventListener('click', () => { if (ocupado) return; $('menu').classList.remove('oculto'); pintarMenu(); });
$('mCerrar').addEventListener('click', () => { $('menu').classList.add('oculto'); actualizarHUD(); guardarSilencioso(); });
document.querySelectorAll('#mTabs [data-tab]').forEach(b => b.addEventListener('click', () => { pestaña = b.dataset.tab; pintarMenu(); }));
function guardarSilencioso() { /* los cambios se guardan en los cristales */ }

function pintarMenu() {
  document.querySelectorAll('#mTabs [data-tab]').forEach(b => b.classList.toggle('activo', b.dataset.tab === pestaña));
  const cu = $('mCuerpo');
  if (pestaña === 'grupo') {
    cu.innerHTML = estado.grupo.map(id => {
      const m = estado.miembros[id], s = stats(id), p = PERSONAJES[id];
      const st = Object.keys(NOMBRE_STAT).map(k => `<div>${NOMBRE_STAT[k]}: <b>${s[k]}</b> ${s.bono[k] ? `<span class="mas">(+${s.bono[k]})</span>` : ''}</div>`).join('');
      const mg = Object.keys(MAGIAS).filter(k => m.stock[k]).map(k => `${MAGIAS[k].nombre} x${m.stock[k]}`).join(' · ') || 'Sin magias — usa Extraer en combate';
      return `<div class="tarjeta">${retrato(id, 76)}<div style="flex:1"><h3 style="color:${p.color}">${p.nombre} <small style="color:#fff;opacity:.7">Nv ${m.nivel}</small></h3>
      <div>Vida ${m.hp}/${s.vida} · XP ${m.xp}/${xpSiguiente(m.nivel)}</div><div class="stats">${st}</div>
      <div class="nota" style="margin-top:6px">Magias: ${mg}</div><div class="nota">★ Arte final: <b>${p.arte.nombre}</b> — ${p.arte.desc} (con vida baja)</div></div></div>`;
    }).join('');
  } else if (pestaña === 'ecos') {
    const lista = Object.keys(estado.ecos);
    cu.innerHTML = lista.length ? `<p class="nota">Asigna cada Eco a un personaje. El Eco le permite invocarlo y desbloquea vínculos.</p>` + lista.map(e => {
      const d = ECOS[e];
      return `<div class="tarjeta">${retrato(e, 76)}<div style="flex:1"><h3>${d.nombre} <small style="opacity:.7">${d.titulo}</small></h3>
      <div class="nota">Elemento: ${d.elem} · Ataque: ${d.ataque} · Desbloquea: ${d.stats.map(s => NOMBRE_STAT[s]).join(', ')}</div>
      <div class="chips">${estado.grupo.map(id => `<button class="chip ${estado.ecos[e] === id ? 'sel' : ''}" data-eco="${e}" data-a="${id}">${PERSONAJES[id].corto}</button>`).join('')}</div></div></div>`;
    }).join('') : '<p class="nota">Aún no tienes Ecos. Investiga las ruinas del desierto.</p>';
    cu.querySelectorAll('[data-eco]').forEach(b => b.addEventListener('click', () => { estado.ecos[b.dataset.eco] = b.dataset.a; ajustarVida(); pintarMenu(); }));
  } else if (pestaña === 'vinculos') {
    if (!estado.grupo.includes(selV)) selV = estado.grupo[0];
    const m = estado.miembros[selV], permit = statsPermitidos(selV);
    let h = `<div class="chips">${estado.grupo.map(id => `<button class="chip ${id === selV ? 'sel' : ''}" data-sel="${id}">${PERSONAJES[id].corto}</button>`).join('')}<button class="chip" id="vAuto">⚡ Auto-vincular</button></div>`;
    h += `<p class="nota">Vincula una magia almacenada a una estadística: mientras más cantidad tengas, mayor el bono. Cada magia solo puede estar en una estadística. Usarla en combate reduce el bono.</p>`;
    for (const k of Object.keys(NOMBRE_STAT)) {
      const ok = permit.has(k), mg = m.vinc[k];
      const bono = mg && ok ? bonoVinculo(k, mg, m.stock[mg]) : 0;
      h += `<div class="vfila ${ok ? '' : 'bloq'}"><span><b>${NOMBRE_STAT[k]}</b></span><span>${ok ? (mg ? `${MAGIAS[mg].nombre} x${m.stock[mg]} <span class="mas">+${bono}</span>` : '<i>vacío</i>') : 'Requiere un Eco'}</span>${ok ? `<button class="chip" data-st="${k}">Cambiar</button>` : '<span></span>'}</div>`;
    }
    h += `<div id="vElegir"></div>`;
    cu.innerHTML = h;
    cu.querySelectorAll('[data-sel]').forEach(b => b.addEventListener('click', () => { selV = b.dataset.sel; pintarMenu(); }));
    cu.querySelectorAll('[data-st]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.st, usadas = Object.entries(m.vinc).filter(([s]) => s !== k).map(([, v]) => v);
      const op = Object.keys(MAGIAS).filter(g => m.stock[g] > 0 && !usadas.includes(g));
      $('vElegir').innerHTML = `<div class="tarjeta" style="display:block"><b>${NOMBRE_STAT[k]}:</b><div class="chips">${op.map(g => `<button class="chip" data-g="${g}">${MAGIAS[g].nombre} x${m.stock[g]} → +${bonoVinculo(k, g, m.stock[g])}</button>`).join('') || '<span class="nota">No tienes magias libres. Extrae más en combate.</span>'}<button class="chip" data-g="">Quitar</button></div></div>`;
      $('vElegir').querySelectorAll('[data-g]').forEach(c => c.addEventListener('click', () => { if (c.dataset.g) m.vinc[k] = c.dataset.g; else delete m.vinc[k]; ajustarVida(); pintarMenu(); }));
    }));
    $('vAuto').addEventListener('click', () => { autoVincular(selV); ajustarVida(); pintarMenu(); });
  } else if (pestaña === 'objetos') {
    const o = estado.objetos;
    cu.innerHTML = `<div class="tarjeta" style="display:block"><h3>Poción x${o.pocion}</h3><div class="nota">Recupera 150 de vida.</div><div class="chips">${estado.grupo.map(id => `<button class="chip" data-p="${id}" ${o.pocion ? '' : 'disabled'}>Usar en ${PERSONAJES[id].corto} (${estado.miembros[id].hp}/${stats(id).vida})</button>`).join('')}</div></div>
    <div class="tarjeta" style="display:block"><h3>Brasa Vital x${o.brasa}</h3><div class="nota">Revive a un aliado caído en combate.</div></div>`;
    cu.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { if (!o.pocion) return; const m = estado.miembros[b.dataset.p]; m.hp = Math.min(stats(b.dataset.p).vida, m.hp + 150); o.pocion--; pintarMenu(); }));
  }
}
function ajustarVida() { for (const id of estado.grupo) estado.miembros[id].hp = Math.min(estado.miembros[id].hp, stats(id).vida); }
function autoVincular(id) {
  const m = estado.miembros[id], permit = [...statsPermitidos(id)];
  m.vinc = {};
  const usadas = new Set();
  const pares = [];
  for (const k of permit) for (const g of Object.keys(MAGIAS)) if (m.stock[g] > 0) pares.push({ k, g, v: bonoVinculo(k, g, m.stock[g]) / (k === 'vida' ? 8 : 1) });
  pares.sort((a, b) => b.v - a.v);
  for (const p of pares) if (!m.vinc[p.k] && !usadas.has(p.g)) { m.vinc[p.k] = p.g; usadas.add(p.g); }
}

// ===================== Título y arranque =====================
const guardada = cargar();
if (guardada) $('tSeguir').classList.remove('oculto');
function empezar(g) {
  estado = g;
  jugador.position.set(estado.pos.x, 0, estado.pos.z);
  camara.position.set(estado.pos.x, 6, estado.pos.z + 9);
  $('titulo').classList.add('oculto');
  modo = 'campo'; mostrarCampoUI(true); actualizarHUD();
}
$('tNueva').addEventListener('click', async () => {
  empezar(nuevoEstado());
  ocupado = true;
  await dialogo(PROLOGO);
  estado.cap = 1; guardar(); actualizarHUD(); ocupado = false;
});
$('tSeguir').addEventListener('click', () => empezar(guardada));
document.addEventListener('visibilitychange', () => { if (document.hidden && estado && modo === 'campo' && !ocupado) guardar(); });

// ===================== Bucle principal =====================
const reloj = new THREE.Clock();
let tt = 0;
function bucle() {
  requestAnimationFrame(bucle);
  const dt = Math.min(reloj.getDelta(), 0.05); tt += dt;
  actualizarTweens(dt); actualizarParticulas(dt);
  if (modo === 'titulo') {
    const a = tt * 0.08;
    camara.position.set(Math.sin(a) * 14, 7, 6 + Math.cos(a) * 14); camara.lookAt(0, 2, -6);
    cieloCampo.material.uniforms.arriba.value.setHex(ZONAS[0].cielo[1]); cieloCampo.material.uniforms.abajo.value.setHex(ZONAS[0].cielo[0]);
    cieloCampo.position.copy(camara.position);
    jugador.position.set(0, altura(0, 4), 4); animarHumanoide(jugador, tt, 0); animarHumanoide(tobias, tt + 1, 0);
    for (const a of animados) if (a.userData.gira) a.rotation.y += dt;
    renderer.render(campo, camara);
  } else if (modo === 'campo') {
    actualizarCampo(dt, tt); renderer.render(campo, camara);
  } else if (modo === 'batalla') {
    actualizarBatalla(dt, tt); renderer.render(arena, camara);
  } else renderer.render(campo, camara);
}
bucle();
window.__eco = { get estado() { return estado; }, get B() { return B; }, jugador, combate, iniciarEncuentro, stats };
