/* ArtPic redesign prototype — photo first, true-scale room preview, nothing locked. */
(() => {
const C = window.CATALOG;
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const money = n => n.toLocaleString('he-IL', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' ₪';
const D = (a, b) => `\u2066${a}×${b}\u2069`;
const MAT = id => C.materials.find(m => m.id === id);
const store = { get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch {} } };

const BY_SLUG = new Map();
C.materials.forEach(m => m.sizes.forEach(s => BY_SLUG.set(`${m.id}-${s.key}`, { m, s })));

/* ---------- sample photo (stands in until the buyer uploads) ---------- */
function makeSample() {
  const W = 2400, H = 1600, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, H * .7);
  sky.addColorStop(0, '#f3c9a0'); sky.addColorStop(.55, '#f7dcc0'); sky.addColorStop(1, '#fbeedd');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff3e2'; g.beginPath(); g.arc(W * .63, H * .42, 120, 0, 7); g.fill();
  const hill = (col, base, amp, f, ph) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) g.lineTo(x, base + Math.sin(x / W * f + ph) * amp + Math.sin(x / W * f * 2.7) * amp * .35);
    g.lineTo(W, H); g.fill(); };
  hill('#c9a58f', H * .55, 60, 5, 1); hill('#a98673', H * .63, 70, 4, 2.2); hill('#7f6a5b', H * .72, 55, 6, .4);
  hill('#5c5148', H * .82, 40, 3, 1.7); hill('#3f3934', H * .92, 25, 8, .9);
  return { url: c.toDataURL('image/jpeg', .86), w: W, h: H, name: 'תמונה לדוגמה', sample: true };
}

/* ---------- state ---------- */
const state = {
  photo: null,
  material: 'canvas', shape: 'rect', orient: 'land', sizeKey: '60-40',
  scene: 'sofa', view: 'wall',
  frame: { type: 'none', color: 'black', wrap: 'noituf' },
  spacer: 'silver', stand: false,
  cart: [], sheet: null, toast: '',
  wall: { id: 'trio', vi: 1, photos: [], target: -1, frame: 'none', color: 'black', premium: false },
};

/* ---------- sizes & shapes ---------- */
const ratio = s => Math.max(s.w, s.h) / Math.min(s.w, s.h);
const shapeOf = s => ratio(s) < 1.05 ? 'square' : ratio(s) >= 1.9 ? 'pano' : 'rect';
const SHAPES = { rect: 'מלבן', square: 'ריבוע', pano: 'פנורמה' };
const shapesFor = m => ['rect', 'square', 'pano'].filter(sh => m.sizes.some(s => shapeOf(s) === sh));
const sizesFor = (m, sh) => m.sizes.filter(s => shapeOf(s) === sh).sort((a, b) => a.w * a.h - b.w * b.h);
const curMat = () => MAT(state.material);
const curSize = () => curMat().sizes.find(s => s.key === state.sizeKey);
const dims = s => (state.orient === 'port' && s.w !== s.h) ? [s.h, s.w] : [s.w, s.h];

function nearest(list, area) { return list.reduce((b, s) => Math.abs(Math.log(s.w * s.h / area)) < Math.abs(Math.log(b.w * b.h / area)) ? s : b, list[0]); }
function ensureSelection() {
  const m = curMat();
  if (!shapesFor(m).includes(state.shape)) state.shape = shapesFor(m)[0];
  const list = sizesFor(m, state.shape);
  if (!list.find(s => s.key === state.sizeKey)) state.sizeKey = nearest(list, m.standing ? 300 : 2400).key;
  if (m.standing) state.scene = 'desk'; else if (state.scene === 'desk') state.scene = 'sofa';
}
function selectMaterial(id) {
  const prev = curSize(), area = prev ? prev.w * prev.h : 2400;
  state.material = id;
  const m = curMat();
  if (!shapesFor(m).includes(state.shape)) state.shape = shapesFor(m)[0];
  state.sizeKey = nearest(sizesFor(m, state.shape), m.standing ? Math.min(area, 400) : area).key;
  ensureSelection();
}
function selectShape(sh) {
  const prev = curSize(); state.shape = sh;
  state.sizeKey = nearest(sizesFor(curMat(), sh), prev.w * prev.h).key;
}

/* ---------- photo quality ---------- */
function quality(photo, w, h) {
  const ppc = Math.min(Math.max(photo.w, photo.h) / Math.max(w, h), Math.min(photo.w, photo.h) / Math.min(w, h));
  if (ppc >= 35) return { k: 'good', t: 'איכות מעולה' };
  if (ppc >= 20) return { k: 'good', t: 'איכות טובה' };
  if (ppc >= 12) return { k: 'ok', t: 'איכות סבירה' };
  return { k: 'low', t: 'איכות נמוכה לגודל הזה' };
}

/* ---------- pricing ---------- */
const FRAME_RATE = { frame: 30, float: 55 }; // ₪ per metre of perimeter, on list price (artpic-private duplicate-product.ts)
function finishExtra(m, s) {
  if ((m.id === 'canvas' || m.id === 'pcanvas') && state.frame.type !== 'none') {
    const list = 2 * (s.w + s.h) / 100 * FRAME_RATE[state.frame.type];
    return { list, sale: list * s.sale / s.list };
  }
  return { list: 0, sale: 0 };
}
function priceNow() { const m = curMat(), s = curSize(), x = finishExtra(m, s); return { sale: s.sale + x.sale, list: s.list + x.list, off: Math.round((1 - s.sale / s.list) * 100) }; }

const FRAME_COLORS = { black: ['שחורה', '#1d1d1d'], white: ['לבנה', '#f3f2ee'], silver: ['כסופה', '#b9bcc0'], gold: ['מוזהבת', '#b8954a'], wood: ['דמוי עץ', '#9a6b43'] };
const FLOAT_COLORS = ['black', 'white', 'gold', 'wood'];
const SPACERS = { silver: ['כסוף', '#c7c9cc'], black: ['שחור', '#1d1d1d'], gold: ['מוזהב', '#c4a25a'] };
function finishLabel() {
  const m = curMat();
  if (m.id === 'canvas' || m.id === 'pcanvas') {
    const f = state.frame;
    if (f.type === 'none') return f.wrap === 'itufmale' ? 'ללא מסגרת · עיטוף מלא' : 'ללא מסגרת';
    return `${f.type === 'float' ? 'מסגרת צפה' : 'מסגרת'} ${FRAME_COLORS[f.color][0]}`;
  }
  if (m.id === 'glass') return `ספייסר ${SPACERS[state.spacer][0]}${state.stand ? ' · מעמד' : ''}`;
  if (m.id === 'perspex') return 'תלייה נסתרת';
  return '';
}

/* ---------- SVG drawing (all units are cm) ---------- */
const FLOOR = 12;
const SCENES = {
  sofa:    { label: 'סלון', top: 85, gap: 25, minW: 360, ref: 'ספה · 210 ס״מ' },
  bed:     { label: 'חדר שינה', top: 115, gap: 20, minW: 360, ref: 'מיטה זוגית · 160 ס״מ' },
  kitchen: { label: 'מטבח', top: 75, gap: 40, minW: 340, ref: 'שולחן · 160 ס״מ' },
  desk:    { label: 'שידה', top: 70, gap: 0, minW: 150, standing: true, ref: 'שידה · 120 ס״מ' },
  stairs:  { label: 'מדרגות', top: 0, gap: 100, minW: 360, ref: 'גרם מדרגות' },
  narrow:  { label: 'מסדרון', top: 0, gap: 100, minW: 220, ref: 'קיר צר · 120 ס״מ' },
};
const defs = () => `<defs>
  <filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.3" flood-color="#000" flood-opacity=".28"/></filter>
  <linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <pattern id="tex" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 .7h1.4" stroke="#000" stroke-opacity=".12" stroke-width=".35"/></pattern>
</defs>`;

function printSVG(p) {
  // p: {x,y,w,h,mat,photo,align,frame:{type,color},spacer,empty,idx}
  const { x, y, w, h } = p;
  if (p.empty) return `<g class="slot-empty" data-slot="${p.idx}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="var(--surface)" fill-opacity=".7" stroke="var(--text)" stroke-width=".5" stroke-dasharray="2 1.5"/>
    <text x="${x + w / 2}" y="${y + h / 2 + Math.min(w, h) * .15}" text-anchor="middle" font-size="${Math.min(w, h) * .42}" fill="var(--text)">+</text></g>`;
  const img = `<image href="${p.photo.url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="${p.align || 'xMidYMid'} slice"/>`;
  let out = '';
  const f = p.frame || { type: 'none' };
  if ((p.mat === 'canvas' || p.mat === 'pcanvas') && f.type === 'frame') {
    const t = Math.max(2.2, Math.min(w, h) * .045);
    out += `<rect x="${x - t}" y="${y - t}" width="${w + 2 * t}" height="${h + 2 * t}" fill="${FRAME_COLORS[f.color][1]}" filter="url(#sh)"/>`;
  } else if ((p.mat === 'canvas' || p.mat === 'pcanvas') && f.type === 'float') {
    const g = 1.2, t = 1.6;
    out += `<rect x="${x - g - t}" y="${y - g - t}" width="${w + 2 * (g + t)}" height="${h + 2 * (g + t)}" fill="${FRAME_COLORS[f.color][1]}" filter="url(#sh)"/><rect x="${x - g}" y="${y - g}" width="${w + 2 * g}" height="${h + 2 * g}" fill="#1a1a1a"/>`;
  } else {
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ddd" filter="url(#sh)"/>`;
  }
  out += img;
  if (p.mat === 'pcanvas') out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#tex)"/>`;
  if (p.mat === 'canvas' || p.mat === 'pcanvas') out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#000" stroke-opacity=".12" stroke-width=".3"/>`;
  if (p.mat === 'glass' || p.mat === 'perspex' || p.mat === 'story') {
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gloss)"/>`;
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#e8f3f1" stroke-opacity=".9" stroke-width="${p.mat === 'glass' ? .5 : .3}"/>`;
  }
  if (p.mat === 'glass' && w >= 30) {
    const r = Math.max(.8, Math.min(w, h) * .018), i = r * 2.4, col = SPACERS[p.spacer || 'silver'][1];
    [[x + i, y + i], [x + w - i, y + i], [x + i, y + h - i], [x + w - i, y + h - i]].forEach(([a, b]) => { out += `<circle cx="${a}" cy="${b}" r="${r}" fill="${col}" stroke="#000" stroke-opacity=".25" stroke-width=".15"/>`; });
  }
  if (p.mat === 'story') {
    const d = Math.max(1.6, w * .07);
    out += `<polygon points="${x + w},${y} ${x + w + d},${y + d * .5} ${x + w + d},${y + h} ${x + w},${y + h}" fill="#bcd6d2" fill-opacity=".85"/>`;
  }
  return `<g>${out}</g>`;
}

function furnitureSVG(id, cx, fy, W, g) {
  switch (id) {
    case 'sofa': return `<g>
      <rect x="${cx - 95}" y="${fy - 85}" width="190" height="45" rx="9" fill="var(--furniture)"/>
      <rect x="${cx - 105}" y="${fy - 47}" width="210" height="30" rx="5" fill="var(--furniture-2)"/>
      <rect x="${cx - 88}" y="${fy - 53}" width="87" height="14" rx="5" fill="var(--furniture)"/><rect x="${cx + 1}" y="${fy - 53}" width="87" height="14" rx="5" fill="var(--furniture)"/>
      <rect x="${cx - 105}" y="${fy - 63}" width="18" height="46" rx="7" fill="var(--furniture)"/><rect x="${cx + 87}" y="${fy - 63}" width="18" height="46" rx="7" fill="var(--furniture)"/>
      <rect x="${cx - 98}" y="${fy - 17}" width="4" height="17" fill="var(--wood)"/><rect x="${cx + 94}" y="${fy - 17}" width="4" height="17" fill="var(--wood)"/>
      <rect x="${cx + 125}" y="${fy - 52}" width="42" height="4" fill="var(--wood)"/><rect x="${cx + 144}" y="${fy - 48}" width="4" height="48" fill="var(--wood)"/>
      <path d="M${cx + 135} ${fy - 52} q-6 -22 6 -38 q4 14 -2 38z M${cx + 140} ${fy - 52} q10 -18 22 -26 q-4 16 -16 26z" fill="var(--accent)" opacity=".8"/>
      <rect x="${cx - 165}" y="${fy - 150}" width="2.5" height="150" fill="var(--ink)" opacity=".75"/><path d="M${cx - 176} ${fy - 150} h25 l-5 -20 h-15z" fill="var(--surface)" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".5"/></g>`;
    case 'bed': return `<g>
      <rect x="${cx - 85}" y="${fy - 115}" width="170" height="115" rx="6" fill="var(--furniture)"/>
      <rect x="${cx - 78}" y="${fy - 74}" width="62" height="18" rx="6" fill="var(--surface)" stroke="var(--border)" stroke-width=".5"/><rect x="${cx + 16}" y="${fy - 74}" width="62" height="18" rx="6" fill="var(--surface)" stroke="var(--border)" stroke-width=".5"/>
      <rect x="${cx - 82}" y="${fy - 60}" width="164" height="40" rx="5" fill="var(--surface-2)"/>
      <rect x="${cx - 82}" y="${fy - 20}" width="164" height="20" fill="var(--furniture-2)"/>
      ${[-1, 1].map(sd => { const nx = cx + sd * 120 - 22; return `<rect x="${nx}" y="${fy - 55}" width="44" height="55" fill="var(--wood)"/><rect x="${nx + 4}" y="${fy - 30}" width="36" height="1" fill="#000" opacity=".2"/><rect x="${nx + 20}" y="${fy - 75}" width="3" height="20" fill="var(--ink)" opacity=".6"/><path d="M${nx + 11} ${fy - 75} h21 l-4 -16 h-13z" fill="var(--surface)" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".5"/>`; }).join('')}</g>`;
    case 'kitchen': return `<g>
      ${[-48, 12].map(o => `<rect x="${cx + o}" y="${fy - 98}" width="38" height="26" rx="4" fill="var(--furniture)"/><rect x="${cx + o + 2}" y="${fy - 45}" width="3" height="45" fill="var(--furniture-2)"/><rect x="${cx + o + 33}" y="${fy - 45}" width="3" height="45" fill="var(--furniture-2)"/>`).join('')}
      <rect x="${cx - 80}" y="${fy - 77}" width="160" height="5" fill="var(--wood)"/>
      <rect x="${cx - 74}" y="${fy - 72}" width="4" height="72" fill="var(--wood)"/><rect x="${cx + 70}" y="${fy - 72}" width="4" height="72" fill="var(--wood)"/>
      <ellipse cx="${cx + 35}" cy="${fy - 80}" rx="13" ry="4" fill="var(--surface)" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".5"/>
      <circle cx="${cx + 30}" cy="${fy - 84}" r="4" fill="var(--accent)"/><circle cx="${cx + 38}" cy="${fy - 85}" r="4" fill="var(--sale)" opacity=".8"/>
      <path d="M${cx - 150} ${fy} l6 -40 h22 l6 40z" fill="var(--wood)"/><path d="M${cx - 139} ${fy - 40} q-14 -40 0 -70 q12 30 0 70z M${cx - 139} ${fy - 40} q16 -30 30 -40 q-6 24 -30 40z" fill="var(--accent)" opacity=".8"/></g>`;
    case 'desk': return `<g>
      <rect x="${cx - 60}" y="${fy - 70}" width="120" height="70" fill="var(--wood)"/>
      <rect x="${cx - 60}" y="${fy - 70}" width="120" height="2.5" fill="#000" opacity=".15"/>
      <rect x="${cx - 0.3}" y="${fy - 64}" width=".6" height="58" fill="#000" opacity=".2"/>
      <circle cx="${cx - 6}" cy="${fy - 35}" r="1.2" fill="#000" opacity=".3"/><circle cx="${cx + 6}" cy="${fy - 35}" r="1.2" fill="#000" opacity=".3"/>
      <path d="M${cx + 38} ${fy - 70} q-6 -10 0 -24 h8 q6 14 0 24z" fill="var(--surface)" stroke="var(--ink)" stroke-opacity=".3" stroke-width=".4"/>
      <path d="M${cx + 42} ${fy - 94} q-8 -16 -2 -26 M${cx + 42} ${fy - 94} q6 -14 12 -18" stroke="var(--accent)" stroke-width="1.2" fill="none"/></g>`;
    case 'stairs': {
      let d = `M${g.x - 60} ${fy}`, x = g.x - 60, hf = 0;
      while (x < g.x + g.w + 40) { hf += 15; d += ` V${fy - hf}`; x += 30; d += ` H${x}`; }
      d += ` V${fy} Z`;
      return `<path d="${d}" fill="var(--wood)" opacity=".85"/><path d="M${g.x - 60} ${fy - 90} L${x} ${fy - 90 - (x - g.x + 60) * .5}" stroke="var(--ink)" stroke-width="2" opacity=".6"/>`;
    }
    case 'narrow': return `<g><rect x="0" y="0" width="${cx - 70}" height="${fy}" fill="var(--wall-2)"/><rect x="${cx + 70}" y="0" width="${W - cx - 70}" height="${fy}" fill="var(--wall-2)"/>
      <rect x="${cx - 74}" y="${fy - 210}" width="4" height="210" fill="var(--wood)"/><rect x="${cx + 70}" y="${fy - 210}" width="4" height="210" fill="var(--wood)"/></g>`;
  }
  return '';
}

function roomSVG(sceneId, items, opts = {}) {
  const S = SCENES[sceneId];
  const minX = Math.min(...items.map(i => i.x)), minY = Math.min(...items.map(i => i.y));
  const gw = Math.max(...items.map(i => i.x + i.w)) - minX, gh = Math.max(...items.map(i => i.y + i.h)) - minY;
  const bottom = S.top + S.gap;
  let W = Math.max(S.minW, gw / .74), H = W * .75;
  const need = bottom + gh + (S.standing ? 30 : 22) + FLOOR;
  if (H < need) { H = need; W = H / .75; }
  const fy = H - FLOOR, cx = W / 2, k = W / 360;
  const gx = cx - gw / 2, gy = fy - bottom - gh;
  const g = { x: gx, y: gy, w: gw, h: gh };
  const prints = items.map(i => printSVG({ ...i, x: gx + i.x - minX, y: gy + i.y - minY })).join('');
  const label = opts.label ?? `${D(Math.round(gw), Math.round(gh))} ס״מ`;
  const dy = gy - 7 * k;
  const dim = opts.noDim ? '' : `<g stroke="var(--ink)" stroke-width="${.5 * k}" opacity=".7"><path d="M${gx} ${dy} H${gx + gw} M${gx} ${dy - 2 * k} v${4 * k} M${gx + gw} ${dy - 2 * k} v${4 * k}"/></g>
    <text x="${cx}" y="${dy - 3 * k}" text-anchor="middle" font-size="${10 * k}" font-weight="600" fill="var(--ink)" font-family="var(--font-body)">${label}</text>`;
  return `<svg viewBox="0 0 ${W.toFixed(1)} ${H.toFixed(1)}" role="img" aria-label="${esc(label)} ב${S.label}" xmlns="http://www.w3.org/2000/svg">${defs()}
    <rect width="${W}" height="${H}" fill="var(--wall)"/>
    <rect y="${fy}" width="${W}" height="${FLOOR}" fill="var(--floor)"/><rect y="${fy - 6}" width="${W}" height="6" fill="var(--surface)" opacity=".7"/>
    ${sceneId === 'stairs' || sceneId === 'narrow' ? furnitureSVG(sceneId, cx, fy, W, g) : ''}
    ${S.standing ? '' : prints}
    ${sceneId !== 'stairs' && sceneId !== 'narrow' ? furnitureSVG(sceneId, cx, fy, W, g) : ''}
    ${S.standing ? prints : ''}
    ${dim}
    <text x="${cx}" y="${H - 3.5 * k}" text-anchor="middle" font-size="${6.5 * k}" fill="var(--ink)" opacity=".75" font-family="var(--font-body)">${S.ref}</text>
  </svg>`;
}

function closeupSVG(p) {
  const pad = Math.max(p.w, p.h) * .22, W = p.w + 2 * pad, H = Math.max(p.h + 2 * pad, W * .75);
  const Wf = Math.max(W, H / .75);
  const x = (Wf - p.w) / 2, y = (H - p.h) / 2;
  return `<svg viewBox="0 0 ${Wf} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="תקריב">${defs()}<rect width="${Wf}" height="${H}" fill="var(--wall)"/>${printSVG({ ...p, x, y })}</svg>`;
}

// Real close-up photo of each material (edge, surface, fixings), so canvas and glass look different.
const matPhoto = m => `<img src="img/mat-${m.id}.jpg" alt="${m.name}, צילום מקרוב" loading="lazy" width="600" height="600">`;

function matThumb(mid, photo) {
  const st = mid === 'story';
  const p = st ? { x: 30, y: 40, w: 36, h: 36 * 2 / 3 } : { x: 18, y: 24, w: 64, h: 64 * 2 / 3 };
  const frame = (mid === 'canvas' || mid === 'pcanvas') ? { type: 'none' } : undefined;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${defs()}<rect width="100" height="100" fill="var(--wall)"/>
    ${st ? '<rect y="64" width="100" height="36" fill="var(--wood)"/>' : ''}
    ${printSVG({ ...p, mat: mid, photo, frame })}
    ${(mid === 'canvas' || mid === 'pcanvas') ? `<polygon points="${p.x + p.w},${p.y} ${p.x + p.w + 3.5},${p.y + 2} ${p.x + p.w + 3.5},${p.y + p.h + 2} ${p.x + p.w},${p.y + p.h}" fill="#000" opacity=".35"/>` : ''}
  </svg>`;
}

/* ---------- views ---------- */
const photo = () => state.photo || (state.photo = makeSample());
const fromPrice = m => Math.min(...m.sizes.map(s => s.sale));

function header() {
  return `<div class="promo">${C.promo} · משלוח חינם מעל ${C.freeShippingFrom} ₪</div>
  <header class="header"><div class="wrap">
    <button class="icon-btn menu-btn" data-act="menu" aria-label="תפריט"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    <a class="logo" href="#home">Art<b>Pic</b></a>
    <nav class="nav-desktop">${C.materials.map(m => `<a href="#m-${m.id}">${m.name}</a>`).join('')}<a href="#walls">קיר תמונות</a></nav>
    <button class="icon-btn" data-act="cart" aria-label="סל קניות, ${state.cart.length} פריטים"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>${state.cart.length ? `<span class="cart-count">${state.cart.length}</span>` : ''}</button>
  </div></header>`;
}

function uploadBtn(label = 'העלו תמונה והתחילו', cls = 'btn btn-primary') {
  return `<button class="${cls}" data-act="upload"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>${label}</button>`;
}

function viewHome() {
  const ph = photo();
  return `${header()}<main>
  <section class="hero">
    <picture class="hero-bg">
      <source media="(min-width:900px)" srcset="img/gallery-wall-wide.jpg">
      <img src="img/gallery-wall.jpg" alt="קיר בסלון עם הדפסות קנבס של תמונות משפחתיות והדפסת זכוכית אחת" fetchpriority="high">
    </picture>
    <div class="wrap hero-copy"><div class="hero-text">
      <h1>התמונות שלכם, בגודל אמיתי, על הקיר שלכם.</h1>
      <p class="lead">מעלים תמונה, רואים אותה בסלון בקנה מידה אמיתי, ובוחרים חומר וגודל במסך אחד.</p>
      <div class="ctas">${uploadBtn()}</div>
      <div class="reassure"><span>בדיקת איכות לכל תמונה</span><span>משלוח חינם מעל ${C.freeShippingFrom} ₪</span><span>${C.promo}</span></div>
    </div></div>
  </section>

  <section class="section" id="materials"><div class="wrap">
    <div class="section-head"><div><h2>על מה להדפיס?</h2><p>${ph.sample ? 'כך תיראה תמונה על כל חומר.' : 'כך תיראה התמונה שלכם על כל חומר.'}</p></div></div>
    <div class="mat-list">
      ${C.materials.map(m => `<a class="mat-row" href="#m-${m.id}"><div class="thumb">${matPhoto(m)}</div><div><h3>${m.name}</h3><p>${m.note}</p><div class="from num">החל מ־<b>${money(fromPrice(m))}</b></div></div></a>`).join('')}
      <a class="mat-row feature" href="#walls"><div class="thumb" style="background:var(--wall)">${roomSVG('sofa', expandWall('grid', 1).map((s, i) => ({ ...s, mat: 'canvas', photo: ph, align: ALIGNS[i % ALIGNS.length], frame: { type: 'frame', color: 'black' } })), { noDim: true })}</div>
        <div><h3>קיר תמונות קנבס <span class="tag">חדש</span></h3><p>14 סידורים מוכנים לסלון, למדרגות ולמסדרון. מעלים כמה תמונות ורואים את הקיר מוכן.</p><div class="from num">סט החל מ־<b>${money(Math.min(...C.walls.flatMap(w => w.variants.map(v => v.price[0]))))}</b></div></div></a>
    </div>
  </div></section>

  <section class="section band"><div class="wrap">
    <div class="section-head"><h2>שלושה צעדים, מסך אחד</h2></div>
    <ol class="steps">
      <li><div><h3>מעלים תמונה</h3><p>מהטלפון או מהמחשב. אנחנו בודקים מיד באיזה גודל היא תודפס הכי טוב.</p></div></li>
      <li><div><h3>בוחרים חדר וגודל</h3><p>סלון, חדר שינה או מטבח. מזיזים בין הגדלים ורואים את התמונה ליד ספה, מיטה ושולחן אמיתיים.</p></div></li>
      <li><div><h3>מחליפים חומר בלחיצה</h3><p>קנבס, זכוכית, אקריליק או בלוק סטורי. המחיר מתעדכן מיד, בלי לחזור אחורה.</p></div></li>
    </ol>
  </div></section>

  <section class="section"><div class="wrap split">
    <div class="stage-card">${roomSVG('bed', [{ x: 0, y: 0, w: 120, h: 60, mat: 'perspex', photo: ph }], { label: 'אקריליק 120×60 ס״מ' })}</div>
    <div style="display:grid;gap:14px"><h2 style="font-size:30px;line-height:1.15">לא בטוחים בגודל? רואים לפני שמזמינים.</h2>
      <p style="color:var(--muted)">כל גודל מוצג בקנה מידה אמיתי מעל ספה של 210 ס״מ, מיטה זוגית או שולחן אוכל. אם התמונה קטנה מדי לגודל שבחרתם, נגיד לכם לפני ההזמנה.</p>
      <div>${uploadBtn('נסו עם התמונה שלכם')}</div></div>
  </div></section>

  <section class="section band"><div class="wrap">
    <div class="section-head"><h2>למה ArtPic</h2></div>
    <div class="trust">
      <div><b>משלוח חינם</b><span>בהזמנה מעל ${C.freeShippingFrom} ₪</span></div>
      <div><b>בדיקת איכות</b><span>לכל תמונה, לפני ההדפסה</span></div>
      <div><b>[זמן ייצור]</b><span>[למלא: ימי עסקים עד משלוח]</span></div>
      <div><b>שירות אישי</b><span>בטלפון ובוואטסאפ ${C.phone}</span></div>
    </div>
    <div class="placeholder" style="margin-top:16px">[כאן יופיעו ביקורות אמיתיות של לקוחות מגוגל — לא להמציא]</div>
  </div></section>

  <section class="section faq"><div class="wrap" style="max-width:760px">
    <div class="section-head"><h2>שאלות נפוצות</h2></div>
    <details><summary>איזה חומר מתאים לי?</summary><p>קנבס חם ובלי השתקפות, טוב לסלון ולחדר שינה. זכוכית נותנת צבעים עמוקים ומראה יוקרתי. זכוכית אקרילית קלה ומודרנית. בלוק סטורי עומד לבד על מדף, מושלם למתנה.</p></details>
    <details><summary>איך אדע שהתמונה שלי מספיק איכותית?</summary><p>מיד אחרי ההעלאה אנחנו מסמנים לכל גודל אם האיכות מעולה, טובה, סבירה או נמוכה. גדלים עם נקודה כתומה לא מומלצים לתמונה הזו.</p></details>
    <details><summary>איך תולים זכוכית?</summary><p>הזכוכית מחוסמת בעובי 6 מ״מ ומגיעה עם חורים וספייסרים לתלייה, הכלולים במחיר.</p></details>
    <details><summary>מה זה עיטוף מלא בקנבס?</summary><p>בעיטוף מלא ההדפסה ממשיכה גם לצדדי המסגרת. בלי עיטוף, צדי הקנבס לבנים.</p></details>
    <details><summary>כמה זמן לוקח המשלוח?</summary><p>[למלא: זמני ייצור ומשלוח]</p></details>
  </div></section>
  </main>${footer()}`;
}

function footer() {
  return `<footer class="footer"><div class="wrap"><div class="cols">
    <div><h3>הדפסות</h3>${C.materials.map(m => `<a href="#m-${m.id}">הדפסה על ${m.name}</a>`).join('')}</div>
    <div><h3>קירות</h3><a href="#walls">קיר תמונות קנבס</a>${C.walls.slice(0, 4).map(w => `<a href="#wall-${w.id}">${w.name}</a>`).join('')}</div>
    <div><h3>מידע</h3><a href="#home">משלוחים</a><a href="#home">שאלות נפוצות</a><a href="#home">תקנון</a><a href="#home">הצהרת נגישות</a></div>
    <div><h3>צרו קשר</h3><a href="tel:${C.phone}">${C.phone}</a></div>
  </div></div></footer>`;
}

function viewCategory(id) {
  const m = MAT(id); if (!m) return viewHome();
  const ph = photo();
  const groups = shapesFor(m).map(sh => `<h3 class="group-title">${SHAPES[sh]}</h3>
    <table class="price-table num"><thead><tr><th>גודל (ס״מ)</th><th>מחיר</th><th>לפני הנחה</th></tr></thead><tbody>
    ${sizesFor(m, sh).map(s => `<tr><td><a href="#p-${s.mid}-${s.key}">${D(s.w, s.h)}</a></td><td>${money(s.sale)}</td><td><s>${money(s.list)}</s></td></tr>`).join('')}
    </tbody></table>`).join('');
  const s = nearest(sizesFor(m, shapesFor(m)[0]), m.standing ? 300 : 4000);
  return `${header()}<main class="wrap">
    <nav class="crumbs"><a href="#home">ראשי</a> › ${m.name}</nav>
    <section class="cat-hero"><h1>הדפסת תמונות על ${m.name}</h1><p>${m.about}</p>${m.estimate ? '<p class="hint">מחירי קנבס פרימיום באב־טיפוס הם הערכה.</p>' : ''}
      <div class="stage-card" style="border-radius:var(--r-l);overflow:hidden;background:var(--wall);border:var(--card-border)">${roomSVG(m.standing ? 'desk' : 'sofa', [{ x: 0, y: 0, w: s.w, h: s.h, mat: m.id, photo: ph, frame: { type: 'none' } }], { label: `${m.name} ${D(s.w, s.h)} ס״מ` })}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${uploadBtn()}<a class="btn btn-secondary" href="#p-${s.mid}-${s.key}">לבחירת גודל</a></div>
    </section>
    <section class="section" style="padding-top:24px"><h2 style="font-size:24px">כל הגדלים והמחירים</h2>${groups}</section>
  </main>${footer()}`;
}

function viewStudio() {
  ensureSelection();
  return `${header()}<main class="wrap"><nav class="crumbs" id="crumbs"></nav>
    <div class="studio"><div class="stage" id="stage"></div><div class="panel" id="panel"></div></div></main>
    <div class="buybar" id="buybar"></div>`;
}

function updateStudio(scrollSel) {
  ensureSelection();
  const m = curMat(), s = curSize(), [dw, dh] = dims(s), ph = photo(), pr = priceNow();
  const title = m.title(s.w, s.h);
  document.title = `${title} | ArtPic`;
  try { history.replaceState(null, '', `#p-${m.id}-${s.key}`); } catch {}
  $('#crumbs').innerHTML = `<a href="#home">ראשי</a> › <a href="#m-${m.id}">${m.name}</a> › <span class="num">${D(s.w, s.h)}</span>`;

  const item = { x: 0, y: 0, w: dw, h: dh, mat: m.id, photo: ph, frame: state.frame, spacer: state.spacer };
  const scenes = m.standing ? ['desk'] : ['sofa', 'bed', 'kitchen'];
  $('#stage').innerHTML = (state.view === 'wall' ? roomSVG(state.scene, [item], { label: `${D(dw, dh)} ס״מ` }) : closeupSVG(item)) +
    `<div class="stage-tools"><div class="seg" role="group" aria-label="חדר">${scenes.map(sc => `<button data-act="scene" data-v="${sc}" aria-pressed="${state.view === 'wall' && state.scene === sc}">${SCENES[sc].label}</button>`).join('')}</div>
     <div class="seg"><button data-act="view" aria-pressed="${state.view === 'close'}">תקריב</button></div></div>`;

  const scrolls = {}; document.querySelectorAll('[data-rail]').forEach(r => { scrolls[r.dataset.rail] = r.scrollLeft; });
  const q = quality(ph, dw, dh);
  const shapes = shapesFor(m);
  const sizes = sizesFor(m, state.shape);
  const maxA = Math.max(...sizes.map(z => Math.max(z.w, z.h)));
  $('#panel').innerHTML = `
    <div class="prod-head"><h1>${title}</h1>
      <div class="price-line num"><span class="now">${money(pr.sale)}</span><s>${money(pr.list)}</s><span class="off">${pr.off}% הנחה</span><span class="promo-note">${C.promo}</span></div></div>

    <div class="photo-row"><img src="${ph.url}" alt=""><div class="meta"><b>${esc(ph.name)}</b><span class="q ${q.k}">${ph.sample ? 'העלו תמונה כדי לבדוק איכות' : `${q.t} ב־${D(dw, dh)}`}</span></div>
      ${uploadBtn(ph.sample ? 'העלאה' : 'החלפה', ph.sample ? 'btn btn-primary' : 'btn btn-secondary')}</div>

    <div class="field"><h2>חומר</h2><div class="rail" data-rail="mat">
      ${C.materials.map(x => `<button class="mat" data-act="mat" data-v="${x.id}" aria-pressed="${x.id === m.id}"><div class="thumb">${matPhoto(x)}</div><b>${x.name}</b><span class="num">מ־${money(fromPrice(x))}</span></button>`).join('')}
    </div></div>

    <div class="field"><h2>צורה</h2><div class="chips">
      ${shapes.map(sh => `<button class="chip" data-act="shape" data-v="${sh}" aria-pressed="${sh === state.shape}">${SHAPES[sh]}</button>`).join('')}
      ${state.shape !== "square" ? `<span class="chips" style="flex-wrap:nowrap">${['land', 'port'].map(o => `<button class="chip" data-act="orient" data-v="${o}" aria-pressed="${state.orient === o}">${o === 'land' ? 'לרוחב' : 'לאורך'}</button>`).join("")}</span>` : ""}
    </div></div>

    <div class="field"><h2>גודל <span class="num">${D(dw, dh)} ס״מ</span></h2><div class="rail" data-rail="size">
      ${sizes.map(z => { const [a, b] = dims(z), qq = quality(ph, a, b), sc = 36 / maxA; return `<button class="size ${!ph.sample && qq.k === 'low' ? 'lowq' : ''}" data-act="size" data-v="${z.key}" aria-pressed="${z.key === s.key}" aria-label="${a} על ${b} ס״מ, ${money(z.sale)}${!ph.sample && qq.k === 'low' ? ', איכות נמוכה' : ''}">
        <span class="box"><i style="width:${Math.max(6, a * sc)}px;height:${Math.max(6, b * sc)}px"></i></span><b class="num">${D(a, b)}</b><span class="num">${money(z.sale)}</span></button>`; }).join('')}
    </div><p class="hint">${m.standing ? 'מוצג על שידה ברוחב 120 ס״מ.' : `מוצג בקנה מידה אמיתי. ${SCENES[state.scene].ref}.`}</p></div>

    ${finishHTML(m, s)}

    <div class="about">
      <details><summary>על ה${m.name}</summary><p>${m.about}</p></details>
      <details><summary>משלוח ואחריות</summary><p>משלוח חינם בהזמנה מעל ${C.freeShippingFrom} ₪. [למלא: זמני ייצור, משלוח ואחריות]</p></details>
      <details><summary>איך נקבעת איכות התמונה?</summary><p>לפי מספר הפיקסלים לכל ס״מ בהדפסה. בגודל שמסומן בנקודה כתומה התמונה עלולה להיראות מטושטשת.</p></details>
    </div>`;
  document.querySelectorAll('[data-rail]').forEach(r => { r.scrollLeft = scrolls[r.dataset.rail] || 0; });
  if (scrollSel) document.querySelectorAll('[data-rail] [aria-pressed="true"]').forEach(el => el.scrollIntoView({ inline: 'center', block: 'nearest' }));

  $('#buybar').innerHTML = `<div class="wrap"><div class="p num"><b>${money(pr.sale)}</b><s>${money(pr.list)}</s><small>${m.name} ${D(dw, dh)}${finishLabel() ? ' · ' + finishLabel() : ''}</small></div>
    <button class="btn btn-primary" data-act="add">הוספה לסל</button></div>`;
}

function finishHTML(m, s) {
  if (m.id === 'canvas' || m.id === 'pcanvas') {
    const f = state.frame, ex = t => { const l = 2 * (s.w + s.h) / 100 * FRAME_RATE[t]; return money(Math.round(l * s.sale / s.list * 100) / 100); };
    const colors = f.type === 'frame' ? Object.keys(FRAME_COLORS) : f.type === 'float' ? FLOAT_COLORS : null;
    return `<div class="field"><h2>גימור</h2><div class="chips">
      <button class="chip" data-act="ftype" data-v="none" aria-pressed="${f.type === 'none'}">ללא מסגרת</button>
      <button class="chip" data-act="ftype" data-v="frame" aria-pressed="${f.type === 'frame'}">מסגרת <small class="num">+${ex('frame')}</small></button>
      <button class="chip" data-act="ftype" data-v="float" aria-pressed="${f.type === 'float'}">מסגרת צפה <small class="num">+${ex('float')}</small></button></div>
      ${colors ? `<div class="swatches" role="group" aria-label="צבע מסגרת">${colors.map(c => `<button class="sw" data-act="fcolor" data-v="${c}" aria-pressed="${f.color === c}" aria-label="${FRAME_COLORS[c][0]}" title="${FRAME_COLORS[c][0]}"><i style="background:${FRAME_COLORS[c][1]}"></i></button>`).join('')}</div>`
        : `<div class="chips" style="margin-top:10px"><button class="chip" data-act="wrap" data-v="noituf" aria-pressed="${f.wrap === 'noituf'}">צדדים לבנים</button><button class="chip" data-act="wrap" data-v="itufmale" aria-pressed="${f.wrap === 'itufmale'}">עיטוף מלא</button></div>`}
      ${m.id === 'canvas' ? `<p class="hint">רוצים מראה של ציור שמן? <button class="btn-quiet btn" style="min-height:0;padding:0" data-act="mat" data-v="pcanvas">שדרוג לקנבס פרימיום</button></p>` : ''}</div>`;
  }
  if (m.id === 'glass') {
    const small = Math.max(s.w, s.h) <= 30;
    return `<div class="field"><h2>ספייסרים לתלייה <span>כלולים במחיר</span></h2><div class="swatches">${Object.keys(SPACERS).map(c => `<button class="sw" data-act="spacer" data-v="${c}" aria-pressed="${state.spacer === c}" aria-label="${SPACERS[c][0]}" title="${SPACERS[c][0]}"><i style="background:${SPACERS[c][1]}"></i></button>`).join('')}</div>
      ${small ? `<div class="chips" style="margin-top:10px"><button class="chip" data-act="stand" aria-pressed="${state.stand}">עם מעמד שולחני</button></div>` : ''}<p class="hint">[מחיר ספייסר צבעוני: לאמת מול המחירון]</p></div>`;
  }
  if (m.id === 'perspex') return `<div class="field"><h2>תלייה</h2><p class="hint" style="margin:0">תלייה נסתרת מאחורי הלוח, כלולה במחיר.</p></div>`;
  return `<div class="field"><h2>הצבה</h2><p class="hint" style="margin:0">הבלוק עומד לבד על מדף או שידה. לא צריך לתלות.</p></div>`;
}

/* ---------- canvas walls ---------- */
const ALIGNS = ['xMidYMid', 'xMinYMid', 'xMaxYMid', 'xMidYMin', 'xMidYMax', 'xMinYMin', 'xMaxYMax', 'xMaxYMin', 'xMinYMax'];
const expandWall = (id, vi) => C.walls.find(w => w.id === id).variants[vi].slots;
const defaultVi = L => Math.floor((L.variants.length - 1) / 2);

function viewWallList() {
  const ph = photo();
  return `${header()}<main class="wrap"><nav class="crumbs"><a href="#home">ראשי</a> › קיר תמונות</nav>
    <section class="cat-hero"><h1>קיר תמונות קנבס</h1><p>סידורים מוכנים במידות מדויקות. בוחרים סידור, מעלים תמונות, ורואים את הקיר כולו בקנה מידה אמיתי. סט אחד, מחיר אחד, שורה אחת בסל.</p></section>
    <div class="wall-list" style="margin:16px 0 48px">
    ${C.walls.map(L => { const v = L.variants[defaultVi(L)]; const sl = v.slots;
      const W = Math.max(...sl.map(s => s.x + s.w)), H = Math.max(...sl.map(s => s.y + s.h));
      return `<a class="wall-card" href="#wall-${L.id}"><div class="thumb"><svg viewBox="-4 -4 ${W + 8} ${H + 8}" style="max-height:110px" aria-hidden="true">${defs()}${sl.map((s, i) => printSVG({ ...s, mat: 'canvas', photo: ph, align: ALIGNS[i % ALIGNS.length], frame: { type: 'none' } })).join('')}</svg></div>
        <b>${L.name}</b><span>${sl.length} תמונות · ${SCENES[L.scene].label}</span><span class="num">מ־${money(Math.min(...L.variants.map(x => x.price[0])))}</span></a>`; }).join('')}
    </div></main>${footer()}`;
}

function viewWall() {
  return `${header()}<main class="wrap"><nav class="crumbs" id="crumbs"></nav>
    <div class="studio"><div class="stage" id="stage"></div><div class="panel" id="panel"></div></div></main><div class="buybar" id="buybar"></div>`;
}
function wallPrice(L, v) {
  const mult = state.wall.premium ? 1.3 : 1;
  let [sale, list] = v.price.map(p => p * mult);
  if (state.wall.frame !== 'none') {
    const ex = v.slots.reduce((a, s) => a + 2 * (s.w + s.h) / 100 * FRAME_RATE[state.wall.frame], 0);
    list += ex; sale += ex * v.price[0] / v.price[1];
  }
  return { sale: Math.round(sale * 100) / 100, list: Math.round(list * 100) / 100, off: Math.round((1 - v.price[0] / v.price[1]) * 100) };
}
function updateWall() {
  const w = state.wall, L = C.walls.find(x => x.id === w.id); if (!L) return;
  if (w.vi >= L.variants.length) w.vi = defaultVi(L);
  const v = L.variants[w.vi], n = v.slots.length, filled = Math.min(w.photos.filter(Boolean).length, n);
  const sample = photo().sample ? photo() : makeSampleCached();
  const usingSamples = w.photos.filter(Boolean).length === 0;
  const items = v.slots.map((s, i) => {
    const p = w.photos[i];
    if (p) return { ...s, mat: w.premium ? 'pcanvas' : 'canvas', photo: p, frame: { type: w.frame, color: w.color } };
    if (usingSamples) return { ...s, mat: w.premium ? 'pcanvas' : 'canvas', photo: sample, align: ALIGNS[i % ALIGNS.length], frame: { type: w.frame, color: w.color } };
    return { ...s, empty: true, idx: i };
  });
  const pr = wallPrice(L, v);
  const title = `קיר תמונות ${w.premium ? 'קנבס פרימיום' : 'קנבס'} ${L.name}${v.key ? ' ' + v.key : ''}`;
  document.title = `${title} | ArtPic`;
  $('#crumbs').innerHTML = `<a href="#home">ראשי</a> › <a href="#walls">קיר תמונות</a> › ${L.name}`;
  $('#stage').innerHTML = roomSVG(L.scene, items, { label: `רוחב כולל ${Math.round(Math.max(...v.slots.map(s => s.x + s.w)))} ס״מ` });
  $('#panel').innerHTML = `
    <div class="prod-head"><h1>${title}</h1><div class="price-line num"><span class="now">${money(pr.sale)}</span><s>${money(pr.list)}</s><span class="off">${pr.off}% הנחה</span></div>
      <p class="hint">${L.pitch}</p></div>
    ${L.variants.length > 1 ? `<div class="field"><h2>גודל הסט</h2><div class="chips">${L.variants.map((x, i) => `<button class="chip" data-act="wvar" data-v="${i}" aria-pressed="${i === w.vi}">${x.key} <small class="num">${money(x.price[0])}</small></button>`).join('')}</div></div>` : ''}
    <div class="field"><h2>תמונות <span class="num">${filled} מתוך ${n}</span></h2>
      <div class="photo-row"><div class="meta"><b>${usingSamples ? 'מוצגות תמונות לדוגמה' : filled < n ? `חסרות עוד ${n - filled} תמונות` : 'כל התמונות במקום'}</b><span class="q ok">לחיצה על משבצת מחליפה את התמונה שלה</span></div>
      <button class="btn btn-primary" data-act="wupload">${usingSamples ? `העלאת ${n} תמונות` : 'הוספה'}</button></div></div>
    <div class="field"><h2>חומר</h2><div class="chips"><button class="chip" data-act="wprem" data-v="0" aria-pressed="${!w.premium}">קנבס</button><button class="chip" data-act="wprem" data-v="1" aria-pressed="${w.premium}">קנבס פרימיום <small>הערכה</small></button></div></div>
    <div class="field"><h2>גימור לכל הסט</h2><div class="chips">${[['none', 'ללא מסגרת'], ['frame', 'מסגרת'], ['float', 'מסגרת צפה']].map(([k, t]) => `<button class="chip" data-act="wframe" data-v="${k}" aria-pressed="${w.frame === k}">${t}</button>`).join('')}</div>
      ${w.frame !== 'none' ? `<div class="swatches">${(w.frame === 'float' ? FLOAT_COLORS : Object.keys(FRAME_COLORS)).map(c => `<button class="sw" data-act="wcolor" data-v="${c}" aria-pressed="${w.color === c}" aria-label="${FRAME_COLORS[c][0]}"><i style="background:${FRAME_COLORS[c][1]}"></i></button>`).join('')}</div>` : ''}</div>
    <div class="field"><h2>סידורים נוספים</h2><div class="chips">${C.walls.filter(x => x.id !== L.id).map(x => `<a class="chip" href="#wall-${x.id}" style="text-decoration:none">${x.name}</a>`).join('')}</div></div>`;
  const missing = n - filled;
  $('#buybar').innerHTML = `<div class="wrap"><div class="p num"><b>${money(pr.sale)}</b><s>${money(pr.list)}</s><small>${n} תמונות · סט אחד</small></div>
    <button class="btn btn-primary" data-act="wadd" ${missing ? 'disabled' : ''}>${missing ? (missing === 1 ? 'חסרה עוד תמונה אחת' : `חסרות עוד ${missing} תמונות`) : 'הוספת הסט לסל'}</button></div>`;
}
let _sample; const makeSampleCached = () => _sample || (_sample = makeSample());

/* ---------- sheets ---------- */
function renderSheet() {
  const root = $('#sheet');
  if (!state.sheet) { root.innerHTML = ''; return; }
  if (state.sheet === 'menu') {
    root.innerHTML = `<div class="sheet-backdrop" data-act="close"></div><div class="sheet menu-sheet" role="dialog" aria-label="תפריט"><div class="grab"></div>
      <a href="#home">ראשי</a>${C.materials.map(m => `<a href="#m-${m.id}">הדפסה על ${m.name}</a>`).join('')}<a href="#walls">קיר תמונות קנבס</a>
      <div style="margin-top:16px">${uploadBtn('העלו תמונה', 'btn btn-primary btn-block')}</div></div>`;
    return;
  }
  const total = state.cart.reduce((a, i) => a + i.price, 0), left = Math.max(0, C.freeShippingFrom - total);
  root.innerHTML = `<div class="sheet-backdrop" data-act="close"></div><div class="sheet" role="dialog" aria-label="סל קניות"><div class="grab"></div><h2>הסל שלכם</h2>
    ${state.cart.length ? state.cart.map((i, n) => `<div class="line"><img src="${i.thumb}" alt=""><div><b>${esc(i.title)}</b><small>${esc(i.finish || '')}</small><button class="btn-quiet btn" style="min-height:32px;padding:0" data-act="remove" data-v="${n}">הסרה</button></div><b class="num">${money(i.price)}</b></div>`).join('')
      : '<p style="color:var(--muted);padding:16px 0">הסל ריק. העלו תמונה כדי להתחיל.</p>'}
    ${state.cart.length ? `<div style="padding:14px 0"><div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px"><span>סה״כ</span><span class="num">${money(Math.round(total * 100) / 100)}</span></div>
      <div class="ship"><i style="width:${Math.min(100, total / C.freeShippingFrom * 100)}%"></i></div><small style="color:var(--muted)">${left ? `עוד ${money(Math.round(left * 100) / 100)} למשלוח חינם` : 'המשלוח חינם'}</small>
      <p class="hint" style="margin-top:8px">${C.promo} — ההנחה תחושב בקופה.</p></div>
      <button class="btn btn-primary btn-block" disabled>לתשלום (באב־טיפוס)</button>` : uploadBtn('העלו תמונה', 'btn btn-primary btn-block')}
  </div>`;
}
function toast(msg) { state.toast = msg; const t = $('#toast'); t.innerHTML = `<div class="toast" role="status">${msg}</div>`; clearTimeout(toast.t); toast.t = setTimeout(() => { t.innerHTML = ''; }, 2200); }

/* ---------- routing ---------- */
let route = '';
function render() {
  const h = location.hash.replace(/^#/, '') || 'home';
  const m = h.match(/^(p|m|wall)-(.+)$/);
  const a = m ? m[1] : h, b = m ? m[2] : '';
  state.sheet = null;
  const app = $('#app');
  if (a === 'p' && BY_SLUG.has(b)) {
    const { m, s } = BY_SLUG.get(b);
    const same = route === 'studio';
    state.material = m.id; state.shape = shapeOf(s); state.sizeKey = s.key;
    if (!same) { app.innerHTML = viewStudio(); route = 'studio'; window.scrollTo(0, 0); }
    updateStudio(!same);
  } else if (a === 'studio') {
    app.innerHTML = viewStudio(); route = 'studio'; updateStudio(true); window.scrollTo(0, 0);
  } else if (a === 'm') { app.innerHTML = viewCategory(b); route = 'cat'; window.scrollTo(0, 0); document.title = `הדפסה על ${MAT(b)?.name || ''} | ArtPic`; }
  else if (a === 'wall') {
    if (state.wall.id !== b) { state.wall.id = b; state.wall.vi = defaultVi(C.walls.find(x => x.id === b) || C.walls[0]); }
    app.innerHTML = viewWall(); route = 'wall'; updateWall(); window.scrollTo(0, 0);
  } else if (a === 'walls') { app.innerHTML = viewWallList(); route = 'walls'; window.scrollTo(0, 0); document.title = 'קיר תמונות קנבס | ArtPic'; }
  else { app.innerHTML = viewHome(); route = 'home'; window.scrollTo(0, 0); document.title = 'הדפסת תמונות על קנבס וזכוכית | ArtPic'; }
  renderSheet();
}
function refresh(scrollSel) {
  if (route === 'studio') { $('header.header')?.replaceWith(htmlEl(header()).querySelector('header')); updateStudio(scrollSel); }
  else if (route === 'wall') { $('header.header')?.replaceWith(htmlEl(header()).querySelector('header')); updateWall(); }
  else { const y = scrollY; const r = route; route = ''; render(); route = r; scrollTo(0, y); }
  renderSheet();
}
const htmlEl = html => { const d = document.createElement('div'); d.innerHTML = html; return d; };

/* ---------- photo upload ---------- */
function loadFile(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => res({ url, w: img.naturalWidth, h: img.naturalHeight, name: file.name, sample: false });
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad image')); };
    img.src = url;
  });
}
$('#file').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const p = await loadFile(f); state.photo = p;
    const r = p.w / p.h;
    state.orient = r >= 1 ? 'land' : 'port';
    const want = (r > 1.9 || r < .53) ? 'pano' : Math.abs(r - 1) < .08 ? 'square' : 'rect';
    const m = curMat();
    if (shapesFor(m).includes(want)) selectShape(want);
    // pick the largest size that still prints well, capped at a sensible default
    const list = sizesFor(curMat(), state.shape).filter(s => { const [a, b] = dims(s); return quality(p, a, b).k === 'good'; });
    if (list.length) state.sizeKey = nearest(list, Math.min(list[list.length - 1].w * list[list.length - 1].h, 4800)).key;
    if (route !== 'studio') location.hash = `#p-${curMat().id}-${curSize().key}`; else refresh(true);
    toast('התמונה נטענה. בחרו חדר וגודל.');
  } catch (err) { console.error(err); toast('לא הצלחנו לפתוח את הקובץ. נסו JPG או PNG.'); }
});
$('#files').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = ''; if (!files.length) return;
  const w = state.wall, n = C.walls.find(x => x.id === w.id).variants[w.vi].slots.length;
  const loaded = (await Promise.allSettled(files.map(loadFile))).filter(r => r.status === 'fulfilled').map(r => r.value);
  if (w.target >= 0) { w.photos[w.target] = loaded[0]; w.target = -1; }
  else { let i = 0; for (const p of loaded) { while (w.photos[i] && i < n) i++; if (i >= n) break; w.photos[i++] = p; } }
  refresh();
});

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const slot = e.target.closest('[data-slot]');
  if (slot) { state.wall.target = +slot.dataset.slot; $('#files').removeAttribute('multiple'); $('#files').click(); $('#files').setAttribute('multiple', ''); return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const v = el.dataset.v, act = el.dataset.act;
  switch (act) {
    case 'upload': $('#file').click(); return;
    case 'menu': state.sheet = 'menu'; renderSheet(); return;
    case 'cart': state.sheet = 'cart'; renderSheet(); return;
    case 'close': state.sheet = null; renderSheet(); return;
    case 'remove': state.cart.splice(+v, 1); refresh(); state.sheet = 'cart'; renderSheet(); return;
    case 'scene': state.scene = v; state.view = 'wall'; break;
    case 'view': state.view = state.view === 'close' ? 'wall' : 'close'; break;
    case 'mat': selectMaterial(v); refresh(true); return;
    case 'shape': selectShape(v); refresh(true); return;
    case 'orient': state.orient = v; break;
    case 'size': state.sizeKey = v; break;
    case 'ftype': state.frame.type = v; if (v === 'float' && !FLOAT_COLORS.includes(state.frame.color)) state.frame.color = 'black'; break;
    case 'fcolor': state.frame.color = v; break;
    case 'wrap': state.frame.wrap = v; break;
    case 'spacer': state.spacer = v; break;
    case 'stand': state.stand = !state.stand; break;
    case 'add': {
      const m = curMat(), s = curSize(), [a, b] = dims(s), pr = priceNow();
      state.cart.push({ title: `${m.name} ${D(a, b)}`, finish: finishLabel(), price: Math.round(pr.sale * 100) / 100, thumb: photo().url, slug: s.slug });
      refresh(); state.sheet = 'cart'; renderSheet(); return;
    }
    case 'wvar': state.wall.vi = +v; break;
    case 'wupload': state.wall.target = -1; $('#files').click(); return;
    case 'wprem': state.wall.premium = v === '1'; break;
    case 'wframe': state.wall.frame = v; if (v === 'float' && !FLOAT_COLORS.includes(state.wall.color)) state.wall.color = 'black'; break;
    case 'wcolor': state.wall.color = v; break;
    case 'wadd': {
      const L = C.walls.find(x => x.id === state.wall.id), vv = L.variants[state.wall.vi], pr = wallPrice(L, vv);
      state.cart.push({ title: `קיר תמונות ${L.name} ${vv.key}`, finish: `${vv.slots.length} תמונות`, price: pr.sale, thumb: state.wall.photos[0].url, slug: vv.slug });
      refresh(); state.sheet = 'cart'; renderSheet(); return;
    }
    default: return;
  }
  refresh(act === 'orient');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.sheet) { state.sheet = null; renderSheet(); } });

window.addEventListener('hashchange', render);
render();
})();
