'use strict';

// ── Paleta ───────────────────────────────────────────────────────────────────
const PALETTE = [
  { name: 'verde',   hex: '#00e5a0' },
  { name: 'ámbar',   hex: '#f5a623' },
  { name: 'rojo',    hex: '#ff4560' },
  { name: 'azul',    hex: '#457BFF' },
  { name: 'púrpura', hex: '#9B6DFF' },
  { name: 'naranja', hex: '#FF7A30' },
  { name: 'blanco',  hex: '#f0f0f0' },
  { name: 'gris cl', hex: '#888888' },
  { name: 'gris',    hex: '#444444' },
];

// ── Estado ───────────────────────────────────────────────────────────────────
let COLS = 12, ROWS = 12;
let CELL = 24, GAP = 3;
let grid = [];
let currentColor     = PALETTE[0].hex;
let currentColorName = PALETTE[0].name;
let currentBrightness = 1.0;
let mode = 'paint';
let isDown = false;
let library = {};
let activeGlyphId = null;

// ── Canvas ───────────────────────────────────────────────────────────────────
const canvas = document.getElementById('glyphCanvas');
const ctx    = canvas.getContext('2d');

function recalcCanvas() {
  CELL = COLS <= 5  ? 40
       : COLS <= 7  ? 36
       : COLS <= 9  ? 30
       : COLS <= 12 ? 26
       : COLS <= 16 ? 20
       : COLS <= 20 ? 16 : 12;
  GAP = COLS <= 16 ? 3 : 2;

  const W = COLS * (CELL + GAP) - GAP;
  const H = ROWS * (CELL + GAP) - GAP;
  canvas.width  = W;
  canvas.height = H;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  canvas.style.maxWidth  = '';
  canvas.style.maxHeight = '';

  document.getElementById('gridLabel').textContent = `${COLS}×${ROWS}`;
  document.getElementById('dotTotal').textContent  = ROWS * COLS;
}

function initGrid(preserveData) {
  const oldGrid = preserveData ? grid.map(r => [...r]) : [];
  const oldCols = preserveData ? (grid[0]?.length || 0) : 0;
  const oldRows = preserveData ? grid.length : 0;

  recalcCanvas();
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  if (preserveData && oldGrid.length) {
    const minR = Math.min(ROWS, oldRows);
    const minC = Math.min(COLS, oldCols);
    for (let r = 0; r < minR; r++)
      for (let c = 0; c < minC; c++)
        grid[r][c] = oldGrid[r][c] || null;
  }

  draw(); updateStats(); updateJSON();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x   = c * (CELL + GAP);
      const y   = r * (CELL + GAP);
      const val = grid[r][c];
      if (val) {
        ctx.fillStyle = val;
        rr(ctx, x, y, CELL, CELL, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        rr(ctx, x, y, CELL, CELL * 0.4, 3);
        ctx.fill();
      } else {
        ctx.fillStyle = '#111';
        rr(ctx, x, y, CELL, CELL, 3);
        ctx.fill();
        ctx.fillStyle = '#161616';
        rr(ctx, x + 1, y + 1, CELL - 2, CELL - 2, 2);
        ctx.fill();
      }
    }
  }
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w,     y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x,     y + h, x,         y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x,     y,     x + r,     y, r);
  ctx.closePath();
}

// ── Interacción ──────────────────────────────────────────────────────────────
function getCell(e) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  const mx = (src.clientX - rect.left) * scaleX;
  const my = (src.clientY - rect.top)  * scaleY;
  const c  = Math.floor(mx / (CELL + GAP));
  const r  = Math.floor(my / (CELL + GAP));
  return (r >= 0 && r < ROWS && c >= 0 && c < COLS) ? { r, c } : null;
}

function applyCell(e) {
  const cell  = getCell(e);
  if (!cell) return;
  const erase = mode === 'erase' || e.button === 2;
  grid[cell.r][cell.c] = erase ? null : applyBrightness(currentColor, currentBrightness);
  draw(); updateStats(); updateJSON();
}

canvas.addEventListener('mousedown',   e => { e.preventDefault(); isDown = true; applyCell(e); });
canvas.addEventListener('mousemove',   e => { if (isDown) applyCell(e); });
canvas.addEventListener('mouseup',     () => isDown = false);
canvas.addEventListener('mouseleave',  () => isDown = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('touchstart',  e => { e.preventDefault(); isDown = true; applyCell(e); }, { passive: false });
canvas.addEventListener('touchmove',   e => { e.preventDefault(); if (isDown) applyCell(e); }, { passive: false });
canvas.addEventListener('touchend',    () => isDown = false);

// ── Herramientas ─────────────────────────────────────────────────────────────
function setMode(m) {
  mode = m;
  document.getElementById('btnPaint').classList.toggle('active', m === 'paint');
  document.getElementById('btnErase').classList.toggle('active', m === 'erase');
}

function clearAll() {
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  draw(); updateStats(); updateJSON();
}

function fillAll() {
  const col = applyBrightness(currentColor, currentBrightness);
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(col));
  draw(); updateStats(); updateJSON();
}

function invertAll() {
  const col = applyBrightness(currentColor, currentBrightness);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      grid[r][c] = grid[r][c] ? null : col;
  draw(); updateStats(); updateJSON();
}

function shiftGrid(dir) {
  const ng = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    let nr = r, nc = c;
    if (dir === 'up')    nr = (r - 1 + ROWS) % ROWS;
    if (dir === 'down')  nr = (r + 1) % ROWS;
    if (dir === 'left')  nc = (c - 1 + COLS) % COLS;
    if (dir === 'right') nc = (c + 1) % COLS;
    ng[nr][nc] = grid[r][c];
  }
  grid = ng; draw(); updateJSON();
}

function flipH() { grid = grid.map(row => [...row].reverse()); draw(); updateJSON(); }
function flipV() { grid = [...grid].reverse(); draw(); updateJSON(); }

function changeSize() {
  COLS = ROWS = parseInt(document.getElementById('gridSize').value);
  grid = [];
  initGrid(false);
}

function updateBrightness(val) {
  currentBrightness = val / 100;
  document.getElementById('brightnessVal').textContent = val + '%';
}

// ── Importar imagen → average pooling → paleta ────────────────────────────────
function importImage() {
  document.getElementById('imageFile').click();
}

function handleImageImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    const img = new Image();
    img.onload = () => poolImageToGrid(img);
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function poolImageToGrid(img) {
  // Canvas offscreen del tamaño original
  const offscreen   = document.createElement('canvas');
  offscreen.width   = img.width;
  offscreen.height  = img.height;
  const offCtx      = offscreen.getContext('2d');
  offCtx.drawImage(img, 0, 0);

  const threshold   = parseInt(document.getElementById('darkThreshold').value);
  const pixelData   = offCtx.getImageData(0, 0, img.width, img.height).data;

  // Tamaño de cada bloque de la imagen que mapea a 1 celda
  const blockW = img.width  / COLS;
  const blockH = img.height / ROWS;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const { r, g, b, a } = sampleBlock(pixelData, img.width, col, row, blockW, blockH);

      // Píxel muy transparente o muy oscuro → celda vacía
      if (a < 30 || (r + g + b) < threshold * 3) {
        grid[row][col] = null;
        continue;
      }

      grid[row][col] = closestPaletteColor(r, g, b);
    }
  }

  draw(); updateStats(); updateJSON();
  showNotif('imagen importada');
}

function sampleBlock(data, imgWidth, col, row, blockW, blockH) {
  // Average pooling — promedia todos los píxeles del bloque
  let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;

  const x0 = Math.floor(col * blockW);
  const y0 = Math.floor(row * blockH);
  const x1 = Math.min(Math.ceil((col + 1) * blockW), imgWidth);
  const y1 = Math.min(Math.ceil((row + 1) * blockH), Math.floor(data.length / 4 / imgWidth));

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * imgWidth + x) * 4;
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
      aSum += data[i + 3];
      count++;
    }
  }

  return count === 0
    ? { r: 0, g: 0, b: 0, a: 0 }
    : { r: rSum / count, g: gSum / count, b: bSum / count, a: aSum / count };
}

function closestPaletteColor(r, g, b) {
  let minDist = Infinity;
  let closest = PALETTE[0].hex;

  PALETTE.forEach(col => {
    const pr = parseInt(col.hex.slice(1, 3), 16);
    const pg = parseInt(col.hex.slice(3, 5), 16);
    const pb = parseInt(col.hex.slice(5, 7), 16);
    // Distancia euclidiana en RGB con pesos perceptuales
    const dist = 0.299 * (r - pr) ** 2
               + 0.587 * (g - pg) ** 2
               + 0.114 * (b - pb) ** 2;
    if (dist < minDist) { minDist = dist; closest = col.hex; }
  });

  return closest;
}

function applyBrightness(hex, b) {
  if (b >= 1) return hex;
  const r  = parseInt(hex.slice(1, 3), 16);
  const g  = parseInt(hex.slice(3, 5), 16);
  const bl = parseInt(hex.slice(5, 7), 16);
  const mix = ch => Math.round(ch * b + 0x11 * (1 - b));
  return '#' + [mix(r), mix(g), mix(bl)].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ── Paleta de colores ─────────────────────────────────────────────────────────
function buildPalette() {
  const container = document.getElementById('colorPalette');
  PALETTE.forEach((col, i) => {
    const dot = document.createElement('div');
    dot.className = 'color-dot' + (i === 0 ? ' selected' : '');
    dot.style.background = col.hex;
    dot.title = col.name;
    dot.addEventListener('click', () => {
      currentColor     = col.hex;
      currentColorName = col.name;
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      document.getElementById('colorName').textContent          = `${col.name} · ${col.hex}`;
      document.getElementById('currentColorLabel').textContent  = col.name;
      document.getElementById('currentColorLabel').style.color  = col.hex;
      if (mode === 'erase') setMode('paint');
    });
    container.appendChild(dot);
  });
}

// ── Stats & JSON ──────────────────────────────────────────────────────────────
function updateStats() {
  let on = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) on++;
  document.getElementById('dotCount').textContent = on;
}

function gridToData() {
  return grid.map(row => row.map(v => {
    if (!v) return null;
    const idx = PALETTE.findIndex(p => p.hex === v);
    return idx >= 0 ? idx : { custom: v };
  }));
}

function updateJSON() {
  const name     = document.getElementById('glyphName').value || 'sin_nombre';
  const category = document.getElementById('category').value;
  const data     = gridToData();
  const obj      = { name, category, cols: COLS, rows: ROWS, palette: PALETTE.map(p => p.hex), data };
  document.getElementById('jsonOut').value = JSON.stringify(obj, null, 2);
  renderPreviews(data);
}

function renderPreviews(data) {
  const strip = document.getElementById('previewStrip');
  strip.innerHTML = '';
  [1, 2, 3].forEach(scale => {
    const sz  = Math.max(2, Math.round(3 * scale * (12 / COLS)));
    const gap = 1;
    const c2  = document.createElement('canvas');
    c2.width  = COLS * (sz + gap) - gap;
    c2.height = ROWS * (sz + gap) - gap;
    c2.style.imageRendering = 'pixelated';
    const cx  = c2.getContext('2d');
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const val = data[r][c];
      cx.fillStyle = val !== null
        ? (typeof val === 'number' ? PALETTE[val].hex : val.custom)
        : '#141414';
      cx.fillRect(c * (sz + gap), r * (sz + gap), sz, sz);
    }
    const wrap = document.createElement('div');
    wrap.className = 'preview-item';
    const lbl = document.createElement('div');
    lbl.className = 'preview-label';
    lbl.textContent = `${scale}×`;
    wrap.appendChild(c2);
    wrap.appendChild(lbl);
    strip.appendChild(wrap);
  });
}

// ── Guardar / cargar ──────────────────────────────────────────────────────────
function saveGlyph() {
  const name = document.getElementById('glyphName').value.trim();
  if (!name) { showNotif('ponle nombre al glifo', true); return; }
  const category = document.getElementById('category').value;
  const id = `${category}::${name}`;
  library[id] = {
    id, name, category,
    cols: COLS, rows: ROWS,
    palette: PALETTE.map(p => p.hex),
    data: gridToData(),
    updatedAt: new Date().toISOString()
  };
  activeGlyphId = id;
  renderLibrary();
  updateLibCount();
  showNotif(`"${name}" guardado`);
  saveToLocalStorage();
}

function loadGlyph(id) {
  const g = library[id];
  if (!g) return;
  activeGlyphId = id;
  document.getElementById('glyphName').value = g.name;
  document.getElementById('category').value  = g.category;
  COLS = g.cols; ROWS = g.rows;
  document.getElementById('gridSize').value = String(COLS);
  recalcCanvas();
  grid = g.data.map(row => row.map(v => {
    if (v === null) return null;
    if (typeof v === 'number') return PALETTE[v]?.hex || null;
    return v.custom || null;
  }));
  draw(); updateStats();
  updateJSON();
  renderLibrary();
}

function newGlyph() {
  activeGlyphId = null;
  document.getElementById('glyphName').value = '';
  clearAll();
  document.querySelectorAll('.glyph-card').forEach(c => c.classList.remove('active'));
}

function deleteGlyph(id, e) {
  e.stopPropagation();
  if (!confirm(`¿Borrar "${library[id]?.name}"?`)) return;
  delete library[id];
  if (activeGlyphId === id) newGlyph();
  renderLibrary();
  updateLibCount();
  saveToLocalStorage();
  showNotif('glifo eliminado');
}

// ── Biblioteca ────────────────────────────────────────────────────────────────
function renderLibrary() {
  const grid2   = document.getElementById('glyphGrid');
  const filter  = document.getElementById('filterCat').value;
  const entries = Object.values(library).filter(g => !filter || g.category === filter);

  if (!entries.length) {
    grid2.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;font-family:'Space Mono',monospace;font-size:10px;color:var(--text3)">${filter ? 'sin resultados' : 'vacío — empieza a dibujar'}</div>`;
    return;
  }

  grid2.innerHTML = '';
  entries.sort((a, b) => a.name.localeCompare(b.name)).forEach(g => {
    const card = document.createElement('div');
    card.className = 'glyph-card' + (g.id === activeGlyphId ? ' active' : '');
    card.onclick = () => loadGlyph(g.id);

    const mini = makeMiniCanvas(g, 40);
    const name = document.createElement('div');
    name.className   = 'glyph-name';
    name.textContent = g.name;
    const meta = document.createElement('div');
    meta.className   = 'glyph-meta';
    meta.textContent = `${g.cols}×${g.rows}`;
    const del  = document.createElement('button');
    del.className    = 'btn danger';
    del.style.cssText = 'padding:2px 6px;font-size:8px;margin-top:2px';
    del.textContent  = '✕';
    del.onclick = e => deleteGlyph(g.id, e);

    card.appendChild(mini);
    card.appendChild(name);
    card.appendChild(meta);
    card.appendChild(del);
    grid2.appendChild(card);
  });
}

function makeMiniCanvas(g, maxSize) {
  const sz  = Math.max(1, Math.floor(maxSize / Math.max(g.cols, g.rows)));
  const gap = sz > 2 ? 1 : 0;
  const c   = document.createElement('canvas');
  c.width   = g.cols * (sz + gap) - gap;
  c.height  = g.rows * (sz + gap) - gap;
  c.style.imageRendering = 'pixelated';
  const cx  = c.getContext('2d');
  g.data.forEach((row, r) => row.forEach((val, col) => {
    cx.fillStyle = val !== null
      ? (typeof val === 'number' ? (g.palette?.[val] || PALETTE[val]?.hex || '#fff') : val.custom || '#fff')
      : '#141414';
    cx.fillRect(col * (sz + gap), r * (sz + gap), sz, sz);
  }));
  return c;
}

function updateLibCount() {
  const n = Object.keys(library).length;
  document.getElementById('savedCount').textContent = n;
  document.getElementById('libCount').textContent   = n;
}

// ── Export / Import ───────────────────────────────────────────────────────────
function exportLibrary() {
  const payload = {
    meta: {
      version: '1.0',
      app: 'GlyphFactory',
      exportedAt: new Date().toISOString(),
      palette: PALETTE
    },
    glyphs: library
  };
  download('glyphfactory_library.json', JSON.stringify(payload, null, 2));
  showNotif(`${Object.keys(library).length} glifos exportados`);
}

function exportSingle() {
  const name = document.getElementById('glyphName').value || 'glifo';
  download(`${name}.json`, document.getElementById('jsonOut').value);
}

function copyJSON() {
  navigator.clipboard.writeText(document.getElementById('jsonOut').value)
    .then(()  => showNotif('JSON copiado'))
    .catch(()  => showNotif('error al copiar', true));
}

function importLibrary() {
  document.getElementById('importFile').click();
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const parsed = JSON.parse(evt.target.result);
      const glyphs = parsed.glyphs || parsed;
      let count = 0;
      Object.values(glyphs).forEach(g => {
        if (g.id && g.data) { library[g.id] = g; count++; }
      });
      renderLibrary();
      updateLibCount();
      saveToLocalStorage();
      showNotif(`${count} glifos importados`);
    } catch { showNotif('JSON inválido', true); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

function clearLibrary() {
  if (!confirm('¿Borrar toda la biblioteca?')) return;
  library = {};
  newGlyph();
  renderLibrary();
  updateLibCount();
  saveToLocalStorage();
  showNotif('biblioteca limpiada');
}

function download(filename, text) {
  const a  = document.createElement('a');
  a.href   = 'data:application/json;charset=utf-8,' + encodeURIComponent(text);
  a.download = filename;
  a.click();
}

// ── LocalStorage ──────────────────────────────────────────────────────────────
function saveToLocalStorage() {
  try { localStorage.setItem('gf_library', JSON.stringify(library)); } catch {}
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('gf_library');
    if (raw) library = JSON.parse(raw);
  } catch {}
}

// ── Notificaciones ────────────────────────────────────────────────────────────
let notifTimer = null;
function showNotif(msg, isError) {
  const el   = document.getElementById('notif');
  el.textContent = msg;
  el.className   = 'notif show' + (isError ? ' error' : '');
  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Teclado ───────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'p' || e.key === 'P') setMode('paint');
  if (e.key === 'e' || e.key === 'E') setMode('erase');
  if (e.key === 'c' || e.key === 'C') clearAll();
  if (e.key === 'i' || e.key === 'I') invertAll();
  if (e.key === 's' || e.key === 'S') saveGlyph();
  if (e.key === 'ArrowUp')    { e.preventDefault(); shiftGrid('up'); }
  if (e.key === 'ArrowDown')  { e.preventDefault(); shiftGrid('down'); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); shiftGrid('left'); }
  if (e.key === 'ArrowRight') { e.preventDefault(); shiftGrid('right'); }
});

document.getElementById('glyphName').addEventListener('input',  updateJSON);
document.getElementById('category').addEventListener('change', updateJSON);

// ── Init ──────────────────────────────────────────────────────────────────────
buildPalette();
loadFromLocalStorage();
initGrid(false);
renderLibrary();
updateLibCount();