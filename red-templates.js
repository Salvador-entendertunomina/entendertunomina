(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.RedTemplates = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));

  // Las rutas de assets en red-data.js son relativas a la raíz del repo
  // (ej. "assets/red-screenshots/foo.png"). Las fichas propias viven en
  // /biblioteca-red/, así que se resuelven como absolutas desde la raíz.
  const assetUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return '/' + String(url).replace(/^\/+/, '');
  };

  // Algunos textos de origen (celdas de tabla) traen enlaces en formato Markdown
  // [texto](url) sin convertir. Los pasa a <a> reales; el resto del texto se escapa igual que esc().
  const MD_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  const richText = (value) => {
    const str = String(value ?? '');
    if (!MD_LINK_RE.test(str)) return esc(str);
    MD_LINK_RE.lastIndex = 0;
    let out = '';
    let lastIndex = 0;
    let m;
    while ((m = MD_LINK_RE.exec(str))) {
      out += esc(str.slice(lastIndex, m.index));
      out += `<a class="r-inline-link" target="_blank" rel="noreferrer" href="${esc(m[2])}">${esc(m[1])}</a>`;
      lastIndex = MD_LINK_RE.lastIndex;
    }
    out += esc(str.slice(lastIndex));
    return out;
  };

  const officialUrl = (DATA, url) => url || DATA.official_home;
  const sourceLink = (DATA, url, label = 'Consultar fuente oficial') =>
    `<a class="r-source" target="_blank" rel="noreferrer" href="${esc(officialUrl(DATA, url))}">${esc(label)} ↗</a>`;

  const block = (id, title, tag, body, open = false) =>
    `<details class="block" data-block="${esc(id)}" ${open ? 'open' : ''}><summary><span class="block-code mono">${esc(tag || 'Consulta')}</span><span class="block-summary-text"><h3>${esc(title)}</h3></span><svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="block-content">${body}</div></details>`;

  const table = (t) => {
    const rows = t.rows || [];
    const body = `<div class="r-table-wrap"><table class="r-table"><thead><tr>${(t.columns || []).map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${richText(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if (rows.length > 15) {
      return `<div class="r-block"><details class="r-table-details"><summary><h4>${esc(t.title)}</h4><span class="r-table-count mono">${rows.length} filas · ver tabla</span></summary>${body}</details></div>`;
    }
    return `<div class="r-block"><h4>${esc(t.title)}</h4>${body}</div>`;
  };

  const sections = (p) => (p.sections || []).map(s => `<div class="r-block"><h4>${esc(s.heading)}</h4>${(s.paragraphs || []).map(x => `<p>${esc(x)}</p>`).join('')}${s.bullets?.length ? `<ul>${s.bullets.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>`).join('');

  const steps = (p) => p.steps?.length ? `<div class="r-block"><h4>Procedimiento paso a paso</h4><div class="r-tiles">${p.steps.map(s => `<div class="r-tile"><span class="num mono">Paso ${esc(s.order)}</span><strong>${esc(s.title)}</strong><p>${esc(s.detail)}</p></div>`).join('')}</div></div>` : '';

  const images = (p) => p.image_urls?.length ? `<div class="r-block"><h4>Imágenes del proceso</h4><div class="r-images">${p.image_urls.map((url, i) => `<img src="${esc(assetUrl(url))}" alt="${esc(p.title)} — Sistema RED, paso ${i + 1} de ${p.image_urls.length}" loading="lazy">`).join('')}</div></div>` : '';

  const warnings = (p) => p.warnings?.length ? `<div class="r-warning"><strong>Advertencias y validaciones</strong><ul>${p.warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';

  const fullPageBody = (DATA, p) => {
    const update = p.official_update ? `<div class="r-notice"><span class="r-badge">${esc(p.official_update.badge)}</span><strong>${esc(p.official_update.title)}</strong><p>${esc(p.official_update.text)}</p><div class="r-source-row">${sourceLink(DATA, p.official_update.url, 'Consultar Real Decreto 643/2026 en el BOE')}</div></div>` : '';
    return `<p class="r-summary">${esc(p.summary)}</p>${update}${sections(p)}${steps(p)}${(p.tables || []).map(table).join('')}${images(p)}${warnings(p)}<div class="r-source-row">${sourceLink(DATA, p.source_url)}</div>`;
  };

  const altaGuideBody = (DATA) => {
    const p = DATA.pages.find(x => x.id === '001');
    const sec = (heading) => p?.sections?.find(s => s.heading === heading);
    const tbl = (title) => p?.tables?.find(t => t.title === title);
    const sectionBody = (s) => s ? `<div class="r-block"><h4>${esc(s.heading)}</h4>${(s.paragraphs || []).map(x => `<p>${esc(x)}</p>`).join('')}${s.bullets?.length ? `<ul>${s.bullets.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>` : '';
    const tableBody = (title) => { const t = tbl(title); return t ? table(t) : ''; };
    const extraByStep = [
      sectionBody(sec('Alcance y requisitos')) + tableBody('Requisitos previos visibles'),
      sectionBody(sec('Navegación')),
      '',
      tableBody('Campos de identificación de la pantalla de altas/bajas'),
      sectionBody(sec('Criterios de cumplimentación')) + tableBody('Campos visibles del alta indefinida ordinaria') + tableBody('Campos de mecanización del alta ordinaria')
    ];
    const stepsHtml = DATA.alta_steps.map((s, i) => block(`alta-step-${i}`, s[0], s[1], `<div class="r-step"><div><p>${esc(s[3])}</p>${sourceLink(DATA, s[4], 'Consultar fuente oficial del procedimiento')}</div><img src="${esc(assetUrl(s[2]))}" alt="${esc(s[0])}" loading="lazy"></div>${extraByStep[i] || ''}`, i === 0)).join('');
    const requisitos = [['Autorizado RED', 'Autorización activa para operar.'], ['CCC asignado', 'Código de cuenta del cliente vinculado.'], ['Identificación', 'DNI, NIE o pasaporte y NAF.'], ['Datos laborales', 'Contrato, jornada, grupo, convenio y ocupación.']];
    return `<div class="r-block"><h4>Requisitos previos</h4><div class="r-tiles">${requisitos.map(x => `<div class="r-tile"><strong>${esc(x[0])}</strong><p>${esc(x[1])}</p></div>`).join('')}</div></div><div class="block-list">${stepsHtml}</div>`;
  };

  const bajaCatalogBody = (DATA) => {
    const p = DATA.pages.find(x => x.id === 'baja');
    const codes = DATA.baja_pdf_codes;
    const cards = codes.map((x, i) => block(`baja-${x.code}`, `${x.code} · ${x.title}`, 'Clave de baja', `<div class="r-code-grid"><div><p><strong>Explicación:</strong> ${esc(x.explanation)}</p><p><strong>Nota operativa:</strong> ${esc(x.note)}</p></div><div class="r-tile r-tile-code"><span class="num mono">Código</span><strong class="mono">${esc(x.code)}</strong><p>Elegir solo cuando el supuesto y la documentación coincidan.</p></div></div><div class="r-source-row">${sourceLink(DATA, 'https://www.seg-social.es/wps/wcm/connect/wss/fbd24b0c-7534-4c13-b5dd-db369ffac742/2012-08.pdf?MOD=AJPERES', 'Consultar PDF oficial de claves de baja')}</div>`, i === 0)).join('');
    const bajaImg = p?.image_urls?.[0];
    const bajaImgBlock = bajaImg ? `<div class="r-block"><h4>Así se ve el formulario de baja</h4><div class="r-step"><p>Dentro de <strong>Altas y Bajas de Trabajadores</strong>, al elegir la acción Baja se abre este formulario: la clave va en <strong>Situación</strong>, junto con la fecha real de baja y, según el caso, los campos de fin de vacaciones, días trabajados o fin de contrato temporal.</p><img src="${esc(assetUrl(bajaImg))}" alt="Formulario de baja en Altas y Bajas de Trabajadores" loading="lazy"></div></div>` : '';
    const notice = `<div class="r-notice"><span class="r-badge">${codes.length} claves</span><strong>Catálogo ampliado con el PDF oficial de la Seguridad Social.</strong><p>La clave debe corresponder a la causa real y más específica del cese.</p></div>`;
    const warn = p?.warnings?.length ? `<div class="r-warning"><strong>Advertencias del catálogo</strong><ul>${p.warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
    return `${notice}${bajaImgBlock}<div class="block-list">${cards}</div>${warn}`;
  };

  const becariosBody = (DATA) => {
    const b = DATA.becarios_official;
    const notice = `<div class="r-notice"><strong>Regla general desde el 1 de enero de 2024</strong><p>${esc(b.scope)}</p><div class="r-source-row">${b.sources.map(s => sourceLink(DATA, s[1], s[0])).join('')}</div></div>`;
    const sectionsHtml = b.sections.map((s, i) => block(`becario-${i}`, s[0], 'Información oficial ampliada', `<p>${esc(s[1])}</p>`, i === 0)).join('');
    const tablesHtml = b.tables.map(t => table({ title: t[0], columns: t[1], rows: t[2] })).join('');
    const warn = `<div class="r-warning"><strong>Controles y advertencias</strong><ul>${b.warnings.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
    return `${notice}<div class="block-list">${sectionsHtml}</div>${tablesHtml}${warn}`;
  };

  // Catálogo de las 21 fichas indexables: 20 de DATA.pages + becarios_official.
  // groups[] son las etiquetas de filtro (además de "Todos") bajo las que debe
  // aparecer cada ficha en la portada. Único punto de verdad para portada y generador.
  const ENTRY_GROUPS = {
    '001': ['Altas'],
    'baja': ['Bajas'],
    'cee': ['Biblioteca'],
    'cno': ['CNO', 'Biblioteca'],
    'varcno': ['CNO', 'Biblioteca'],
    'empresa': ['Identidad', 'Biblioteca'],
    'nss': ['Identidad', 'Biblioteca'],
    'nie': ['Identidad', 'Biblioteca'],
    'ccc': ['Identidad', 'Biblioteca'],
    'desempleado': ['Claves', 'Biblioteca'],
    'inactividad': ['Claves', 'Biblioteca'],
    'grupo': ['Claves', 'Biblioteca'],
    'regimen': ['Claves', 'Biblioteca'],
    'pago': ['Biblioteca'],
    'autorizado': ['Biblioteca'],
    'diferencias': ['Biblioteca'],
    'obligados': ['Biblioteca'],
    'casia': ['Biblioteca'],
    'plazos': ['Biblioteca'],
    'rlc': ['Biblioteca']
  };

  const CUSTOM_BODY = { '001': altaGuideBody, 'baja': bajaCatalogBody };

  const truncate = (text, max) => {
    const t = String(text || '');
    if (t.length <= max) return t;
    return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
  };

  // Texto amplio solo para el buscador en memoria de la portada (no se imprime
  // en el DOM), para poder localizar una ficha por un dato que vive dentro de
  // ella (ej. una clave de baja concreta) aunque no aparezca en el resumen.
  const pageSearchText = (p) => [
    p.title, p.category, p.summary,
    ...(p.sections || []).flatMap(s => [s.heading, ...(s.paragraphs || []), ...(s.bullets || [])]),
    ...(p.steps || []).flatMap(s => [s.title, s.detail]),
    ...(p.tables || []).flatMap(t => [t.title, ...(t.columns || []), ...(t.rows || []).flat()]),
    ...(p.warnings || [])
  ].join(' ');

  const buildEntries = (DATA) => {
    const entries = DATA.pages.map(p => {
      const extra = { '001': DATA.alta_steps.flatMap(s => [s[0], s[1], s[3]]), 'baja': DATA.baja_pdf_codes.flatMap(c => [c.code, c.title, c.explanation, c.note]) }[p.id] || [];
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        category: p.category,
        summary: p.summary,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        teaser: truncate(p.summary, 130),
        groups: ENTRY_GROUPS[p.id] || ['Biblioteca'],
        searchText: [pageSearchText(p), ...extra].join(' ').toLowerCase(),
        bodyHtml: (DATA) => (CUSTOM_BODY[p.id] || ((DATA) => fullPageBody(DATA, p)))(DATA)
      };
    });
    const b = DATA.becarios_official;
    entries.push({
      id: 'becarios',
      slug: b.slug,
      title: 'Becarios y prácticas formativas',
      category: 'afiliación > becarios',
      summary: b.scope,
      teaser: truncate(b.scope, 130),
      groups: ['Becarios'],
      searchText: [b.scope, ...b.sections.flatMap(s => s), ...b.tables.flatMap(t => [t[0], ...t[1], ...t[2].flat()]), ...b.warnings].join(' ').toLowerCase(),
      bodyHtml: (DATA) => becariosBody(DATA)
    });
    return entries;
  };

  return { esc, richText, assetUrl, officialUrl, sourceLink, block, table, sections, steps, images, warnings, fullPageBody, altaGuideBody, bajaCatalogBody, becariosBody, buildEntries, truncate };
});
