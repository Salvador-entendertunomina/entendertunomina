#!/usr/bin/env node
// Genera una página HTML estática e indexable por cada ficha de la Biblioteca RED,
// a partir de red-data.js + red-templates.js. Volver a ejecutar tras editar red-data.js.
// Uso: node scripts/build-red-pages.js

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'biblioteca-red');
const SITE = 'https://www.entendertunomina.com';

global.window = {};
require(path.join(ROOT, 'red-data.js'));
const DATA = global.window.SISTEMA_RED_DATA;
const T = require(path.join(ROOT, 'red-templates.js'));

const entries = T.buildEntries(DATA);
const bySlug = Object.fromEntries(entries.map(e => [e.id, e]));

// Fichas relacionadas manuales para las 3 entradas "especiales" (guía de alta,
// catálogo de bajas, becarios), que no comparten grupo de filtro con nadie más.
// Fichas con botón de descarga en PDF para sus tablas (carga red-table-download.js,
// que a su vez solo carga jsPDF al pulsar el botón por primera vez).
const TABLE_DOWNLOAD_IDS = ['contrato', 'bonificaciones'];

const RELATED_OVERRIDE = {
  '001': ['nss', 'cno', 'ccc', 'empresa'],
  'baja': ['plazos', 'obligados', 'casia', 'diferencias'],
  'becarios': ['obligados', 'plazos', 'casia'],
  'contrato': ['bonificaciones', 'grupo', 'regimen', 'desempleado'],
  'bonificaciones': ['contrato', 'desempleado', 'plazos', 'grupo']
};

function relatedFor(entry) {
  if (RELATED_OVERRIDE[entry.id]) {
    return RELATED_OVERRIDE[entry.id].map(id => bySlug[id]).filter(Boolean);
  }
  const shared = entries.filter(e => e.id !== entry.id && e.groups.some(g => entry.groups.includes(g)));
  return shared.slice(0, 4);
}

function relatedBlock(entry) {
  const items = relatedFor(entry);
  if (!items.length) return '';
  const links = items.map(e => `<a href="/biblioteca-red/${T.esc(e.slug)}.html">${T.esc(e.title)}</a>`).join('');
  return `<div class="rb-related"><h4>Fichas relacionadas</h4><div class="rb-related-list">${links}</div></div>`;
}

function pageHtml(entry) {
  const title = entry.metaTitle || `${entry.title} — Biblioteca Sistema RED | EntenderTuNomina`;
  const description = entry.metaDescription || T.truncate(entry.summary, 155);
  const canonical = `${SITE}/biblioteca-red/${entry.slug}.html`;
  const body = entry.bodyHtml(DATA);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<title>${T.esc(title)}</title>
<meta name="description" content="${T.esc(description)}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/red-library.css">
<link rel="preload" href="/fonts/fonts.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/fonts/fonts.css"></noscript>
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${T.esc(title)}">
<meta property="og:description" content="${T.esc(description)}">
<meta property="og:image" content="${SITE}/og-image.png">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${T.esc(title)}">
<meta name="twitter:description" content="${T.esc(description)}">
<meta name="twitter:image" content="${SITE}/og-image.png">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": ${JSON.stringify(entry.title)},
  "description": ${JSON.stringify(description)},
  "url": ${JSON.stringify(canonical)},
  "inLanguage": "es",
  "learningResourceType": "Ficha de consulta",
  "about": "Sistema RED de la Seguridad Social española",
  "isPartOf": {
    "@type": "LearningResource",
    "name": "Biblioteca Sistema RED",
    "url": "${SITE}/biblioteca-red.html"
  },
  "author": { "@type": "Person", "name": "Salvador Fernández Martínez" },
  "publisher": { "@type": "Person", "name": "Salvador Fernández Martínez" }
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type":"ListItem","position":1,"name":"Inicio","item":"${SITE}/"},
    {"@type":"ListItem","position":2,"name":"Biblioteca RED","item":"${SITE}/biblioteca-red.html"},
    {"@type":"ListItem","position":3,"name":${JSON.stringify(entry.title)},"item":"${canonical}"}
  ]
}
</script>
</head>
<body>
<header>
  <div class="nav">
    <a href="/" style="text-decoration:none;">
      <div class="brand">Entender<span style="color:var(--gold)">TuNómina</span> <span class="tag">S.F.</span></div>
    </a>
    <nav class="links">
      <a href="/">Inicio</a>
      <a href="/#servicios">Servicios</a>
      <a href="/cursos.html">Cursos</a>
      <a href="/herramientas.html">Herramientas</a>
      <a href="/biblioteca-red.html" class="active">Biblioteca RED</a>
      <a href="/divulgacion.html">Divulgación</a>
      <a href="/#sobre">Sobre mí</a>
      <a href="/#medios">En medios</a>
      <a href="/#contacto">Contacto</a>
    </nav>
    <a class="btn btn-primary" href="/#contacto">Consultar caso</a>
    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú">☰</button>
  </div>
</header>

<div class="mobile-overlay" id="mobileOverlay"></div>
<div class="mobile-panel" id="mobilePanel">
  <div class="mobile-panel-head">
    <div class="brand" style="font-size:1rem;">Menú</div>
    <button class="mobile-panel-close" id="mobileClose" aria-label="Cerrar menú">✕</button>
  </div>
  <nav>
    <a href="/">Inicio</a>
    <a href="/#servicios">Servicios</a>
    <a href="/cursos.html">Cursos</a>
    <a href="/herramientas.html">Herramientas</a>
    <a href="/biblioteca-red.html" class="active">Biblioteca RED</a>
    <a href="/divulgacion.html">Divulgación</a>
    <a href="/#sobre">Sobre mí</a>
    <a href="/#medios">En medios</a>
    <a href="/#contacto">Contacto</a>
  </nav>
  <a class="btn btn-primary" href="/#contacto">Consultar caso</a>
</div>

<div class="wrap">
  <nav class="rb-breadcrumb" aria-label="Migas de pan">
    <a href="/">Inicio</a><span class="sep">/</span><a href="/biblioteca-red.html">Biblioteca RED</a><span class="sep">/</span><span class="current">${T.esc(entry.title)}</span>
  </nav>
</div>

<section class="entry-hero">
  <div class="wrap">
    <div class="eyebrow">${T.esc(entry.category)}</div>
    <h1>${T.esc(entry.title)}</h1>
    <p class="lead">${T.esc(entry.summary)}</p>
  </div>
</section>

<main>
  <div class="wrap">
    <div class="entry-body">${body}</div>
    ${relatedBlock(entry)}
    <a class="rb-back" href="/biblioteca-red.html">← Volver a la Biblioteca RED</a>
  </div>
</main>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Imagen ampliada">
  <button class="lightbox-close" id="lightboxClose" aria-label="Cerrar imagen">✕</button>
  <img id="lightboxImg" src="" alt="">
  <div class="lightbox-hint">Clic fuera de la imagen o Esc para cerrar</div>
</div>

<footer>
  <div class="wrap" style="display:flex;flex-direction:column;gap:14px;width:100%;">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <span>© 2026 EntenderTuNomina — Salvador Fernández</span>
      <span class="mono">Fuentes oficiales: Seguridad Social · BOE · INE · SEPE</span>
    </div>
    <div style="display:flex;gap:18px;flex-wrap:wrap;font-size:.82rem;">
      <a href="/aviso-legal.html" style="color:var(--ink-soft);text-decoration:underline;">Aviso legal</a>
      <a href="/privacidad.html" style="color:var(--ink-soft);text-decoration:underline;">Privacidad</a>
      <a href="/cookies.html" style="color:var(--ink-soft);text-decoration:underline;">Cookies</a>
      <a href="/condiciones.html" style="color:var(--ink-soft);text-decoration:underline;">Condiciones de uso</a>
    </div>
  </div>
</footer>

<!-- Botón flotante de reservas — Zoho Bookings -->
<script src="https://bookings.nimbuspop.com/assets/embed.js"></script>
<script>
  function initZohoBooking(){
    if (window.__zohoBookingInit) return;
    window.__zohoBookingInit = true;
    Bookings.buttonModal({
      url: "https://entendertunomina.zohobookings.eu/portal-embed#/entendertunomina",
      text: "Reservar ahora",
      color: "#2F5D50",
      textColor: "#ffffff",
      position: "bottom-right"
    });
  }
</script>

<script>
  const menuToggle = document.getElementById('menuToggle');
  const mobilePanel = document.getElementById('mobilePanel');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileClose = document.getElementById('mobileClose');
  function openMenu(){mobilePanel.classList.add('open');mobileOverlay.classList.add('open');document.body.style.overflow='hidden';}
  function closeMenu(){mobilePanel.classList.remove('open');mobileOverlay.classList.remove('open');document.body.style.overflow='';}
  menuToggle.addEventListener('click', openMenu);
  mobileClose.addEventListener('click', closeMenu);
  mobileOverlay.addEventListener('click', closeMenu);
  mobilePanel.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
</script>

<script>
  if (typeof initZohoBooking === 'function') initZohoBooking();
</script>

<script>
  (function(){
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    var entryBody = document.querySelector('.entry-body');
    function openLightbox(src, alt){
      lightboxImg.src = src; lightboxImg.alt = alt || '';
      lightbox.classList.add('open'); document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      lightbox.classList.remove('open'); document.body.style.overflow = ''; lightboxImg.src = '';
    }
    if (entryBody) entryBody.addEventListener('click', function(e){
      var img = e.target.closest('.r-step img, .r-images img');
      if (img) openLightbox(img.src, img.alt);
    });
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e){ if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLightbox(); });
  })();
</script>
${TABLE_DOWNLOAD_IDS.includes(entry.id) ? '<script src="/red-table-download.js"></script>\n' : ''}</body>
</html>
`;
}

// Fecha de última modificación real de un fichero: se usa la fecha del
// último commit que lo tocó (más fiable que el mtime, que solo refleja
// el momento del checkout). Si el fichero es nuevo/sin historial, cae al mtime.
function lastMod(relPath) {
  const absPath = path.join(ROOT, relPath);
  try {
    // Un fichero con cambios sin commitear (por ejemplo, recién regenerado
    // en este mismo build) cuenta como modificado hoy; si no, usamos la
    // fecha del último commit que lo tocó.
    const status = execSync(`git status --porcelain -- ${JSON.stringify(relPath)}`, { cwd: ROOT, encoding: 'utf8' }).trim();
    if (status) return new Date().toISOString().slice(0, 10);
    const out = execSync(`git log -1 --format=%cI -- ${JSON.stringify(relPath)}`, { cwd: ROOT, encoding: 'utf8' }).trim();
    if (out) return out.slice(0, 10);
  } catch (e) { /* git no disponible o fichero sin historial: seguimos al fallback */ }
  try {
    return fs.statSync(absPath).mtime.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function buildSitemap() {
  const mainUrls = [
    ['/', 'weekly', '1.0'],
    ['/biblioteca-red.html', 'weekly', '0.9'],
    ['/cursos.html', 'weekly', '0.8'],
    ['/empresas.html', 'monthly', '0.7'],
    ['/consulta.html', 'monthly', '0.7'],
    ['/clases.html', 'monthly', '0.7'],
    ['/herramientas.html', 'monthly', '0.9'],
    ['/calculadora-vacaciones-pendientes.html', 'monthly', '0.95'],
    ['/divulgacion.html', 'weekly', '0.8'],
    ['/divulgacion/como-se-calcula-el-irpf-de-tu-nomina.html', 'monthly', '0.7'],
    ['/divulgacion/por-que-me-descuentan-tanto-de-la-nomina.html', 'monthly', '0.7'],
    ['/divulgacion/como-se-calcula-la-paga-extra.html', 'monthly', '0.7'],
    ['/divulgacion/deuda-vacaciones.html', 'monthly', '0.7'],
    ['/divulgacion/que-cotizo-cada-mes-para-que-sirve.html', 'monthly', '0.7'],
    ['/divulgacion/por-que-cambia-el-irpf-cada-ano.html', 'monthly', '0.7']
  ];
  const entryUrls = entries.map(e => [`/biblioteca-red/${e.slug}.html`, 'monthly', '0.6']);
  const rows = [...mainUrls, ...entryUrls].map(([loc, freq, prio]) => {
    const relPath = loc === '/' ? 'index.html' : loc.replace(/^\//, '');
    const mod = lastMod(relPath);
    return `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
entries.forEach(entry => {
  const html = pageHtml(entry);
  fs.writeFileSync(path.join(OUT_DIR, `${entry.slug}.html`), html);
});
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), buildSitemap());

console.log(`Generadas ${entries.length} fichas en ${path.relative(ROOT, OUT_DIR)}/`);
console.log('sitemap.xml actualizado.');
