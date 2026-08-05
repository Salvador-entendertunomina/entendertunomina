(() => {
  const DATA = window.SISTEMA_RED_DATA;
  const state = { filter: 'Todos', query: '' };
  const officialHome = DATA.official_home;
  const q = (sel) => document.querySelector(sel);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const officialUrl = (url) => url || officialHome;
  const sourceLink = (url, label='Consultar fuente oficial') => `<a class="r-source" target="_blank" rel="noreferrer" href="${esc(officialUrl(url))}">${esc(label)} ↗</a>`;
  const matches = (text) => !state.query || String(text).toLowerCase().includes(state.query.toLowerCase());
  const page = (id) => DATA.pages.find(p => p.id === id);
  const allPages = () => DATA.pages;
  const pageText = (p) => [p.title,p.category,p.summary,...(p.sections||[]).flatMap(s=>[s.heading,...(s.paragraphs||[]),...(s.bullets||[])]),...(p.steps||[]).flatMap(s=>[s.title,s.detail]),...(p.tables||[]).flatMap(t=>[t.title,...t.columns,...t.rows.flat()]),...(p.warnings||[])].join(' ');
  const visiblePages = () => allPages().filter(p => matches(pageText(p)));

  const block = (id, title, tag, body, open=false) => `<details class="block" data-block="${esc(id)}" ${open?'open':''}><summary><span class="block-code mono">${esc(tag||'Consulta')}</span><span class="block-summary-text"><h3>${esc(title)}</h3></span><svg class="chevron" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></summary><div class="block-content">${body}</div></details>`;

  const table = (t) => `<div class="r-block"><h4>${esc(t.title)}</h4><div class="r-table-wrap"><table class="r-table"><thead><tr>${(t.columns||[]).map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${(t.rows||[]).map(row=>`<tr>${row.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;

  const sections = (p) => (p.sections||[]).map(s=>`<div class="r-block"><h4>${esc(s.heading)}</h4>${(s.paragraphs||[]).map(x=>`<p>${esc(x)}</p>`).join('')}${s.bullets?.length?`<ul>${s.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>`).join('');

  const steps = (p) => p.steps?.length ? `<div class="r-block"><h4>Procedimiento paso a paso</h4><div class="r-tiles">${p.steps.map(s=>`<div class="r-tile"><span class="num mono">Paso ${esc(s.order)}</span><strong>${esc(s.title)}</strong><p>${esc(s.detail)}</p></div>`).join('')}</div></div>` : '';

  const images = (p) => p.image_urls?.length ? `<div class="r-block"><h4>Imágenes del proceso</h4><div class="r-images">${p.image_urls.map(url=>`<img src="${esc(url)}" alt="Imagen del proceso" loading="lazy">`).join('')}</div></div>` : '';

  const warnings = (p) => p.warnings?.length ? `<div class="r-warning"><strong>Advertencias y validaciones</strong><ul>${p.warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>` : '';

  const fullPageBody = (p) => {
    const update = p.official_update ? `<div class="r-notice"><span class="r-badge">${esc(p.official_update.badge)}</span><strong>${esc(p.official_update.title)}</strong><p>${esc(p.official_update.text)}</p><div class="r-source-row">${sourceLink(p.official_update.url,'Consultar Real Decreto 643/2026 en el BOE')}</div></div>` : '';
    return `<p class="r-summary">${esc(p.summary)}</p>${update}${sections(p)}${steps(p)}${(p.tables||[]).map(table).join('')}${images(p)}${warnings(p)}<div class="r-source-row">${sourceLink(p.source_url)}</div>`;
  };

  const stats = () => {
    const cards = [[''+DATA.pages.length,'fichas documentales'],[''+DATA.baja_pdf_codes.length,'claves de baja'],[''+DATA.pages.filter(p=>p.image_urls?.length).length,'fuentes con imágenes'],['22','códigos de baja detallados']];
    q('#red-stats').innerHTML = cards.map(([a,b])=>`<div class="rb-stat"><strong class="mono">${esc(a)}</strong><span>${esc(b)}</span></div>`).join('');
  };

  const filters = () => {
    const names=['Todos','Altas','Bajas','CNO','Identidad','Claves','Biblioteca','Becarios'];
    q('#red-filters').innerHTML=names.map(n=>`<button type="button" class="rb-filter ${state.filter===n?'active':''}" data-filter="${n}">${n}</button>`).join('');
    q('#red-filters').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.filter; render();}));
  };

  const altaSection = () => {
    if(!['Todos','Altas'].includes(state.filter)) return '';
    const p=page('001');
    const sec = (heading) => p?.sections?.find(s=>s.heading===heading);
    const tbl = (title) => p?.tables?.find(t=>t.title===title);
    const sectionBody = (s) => s ? `<div class="r-block"><h4>${esc(s.heading)}</h4>${(s.paragraphs||[]).map(x=>`<p>${esc(x)}</p>`).join('')}${s.bullets?.length?`<ul>${s.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</div>` : '';
    const tableBody = (title) => { const t=tbl(title); return t ? table(t) : ''; };
    // Contenido ampliado de cada paso, tomado de las secciones y tablas de la ficha 001
    const extraByStep = [
      sectionBody(sec('Alcance y requisitos')) + tableBody('Requisitos previos visibles'),
      sectionBody(sec('Navegación')),
      '',
      tableBody('Campos de identificación de la pantalla de altas/bajas'),
      sectionBody(sec('Criterios de cumplimentación')) + tableBody('Campos visibles del alta indefinida ordinaria') + tableBody('Campos de mecanización del alta ordinaria')
    ];
    const stepsHtml=DATA.alta_steps.map((s,i)=>block(`alta-step-${i}`,s[0],s[1],`<div class="r-step"><div><p>${esc(s[3])}</p>${sourceLink(s[4],'Consultar fuente oficial del procedimiento')}</div><img src="${esc(s[2])}" alt="${esc(s[0])}" loading="lazy"></div>${extraByStep[i]||''}`,i===0)).join('');
    return `<section class="section" id="altas"><div class="wrap"><div class="eyebrow">01 · Guía visual</div><h2>Alta de trabajador con contrato indefinido ordinario</h2><p class="section-intro">Recorrido completo desde los requisitos y el acceso hasta los campos de identificación y la tabla de mecanización.</p><div class="r-block"><h4>Requisitos previos</h4><div class="r-tiles">${[['Autorizado RED','Autorización activa para operar.'],['CCC asignado','Código de cuenta del cliente vinculado.'],['Identificación','DNI, NIE o pasaporte y NAF.'],['Datos laborales','Contrato, jornada, grupo, convenio y ocupación.']].map(x=>`<div class="r-tile"><strong>${esc(x[0])}</strong><p>${esc(x[1])}</p></div>`).join('')}</div></div><div class="block-list">${stepsHtml}</div></div></section>`;
  };

  const bajasSection = () => {
    if(!['Todos','Bajas'].includes(state.filter)) return '';
    const p=page('baja');
    const codes=DATA.baja_pdf_codes.filter(x=>matches(`${x.code} ${x.title} ${x.explanation} ${x.note}`));
    const cards=codes.map((x,i)=>block(`baja-${x.code}`,`${x.code} · ${x.title}`,'Clave de baja',`<div class="r-code-grid"><div><p><strong>Explicación:</strong> ${esc(x.explanation)}</p><p><strong>Nota operativa:</strong> ${esc(x.note)}</p></div><div class="r-tile r-tile-code"><span class="num mono">Código</span><strong class="mono">${esc(x.code)}</strong><p>Elegir solo cuando el supuesto y la documentación coincidan.</p></div></div><div class="r-source-row">${sourceLink('https://www.seg-social.es/wps/wcm/connect/wss/fbd24b0c-7534-4c13-b5dd-db369ffac742/2012-08.pdf?MOD=AJPERES','Consultar PDF oficial de claves de baja')}</div>`,i===0)).join('');
    return `<section class="section" id="bajas" style="background:var(--card);border-top:1px solid var(--line);border-bottom:1px solid var(--line);"><div class="wrap"><div class="eyebrow">02 · Catálogo oficial</div><h2>Claves de baja en la Seguridad Social</h2><p class="section-intro">Cada código tiene su propio desplegable con explicación, límites y criterios de uso.</p><div class="r-notice"><span class="r-badge">${DATA.baja_pdf_codes.length} claves</span><strong>Catálogo ampliado con el PDF oficial de la Seguridad Social.</strong><p>La clave debe corresponder a la causa real y más específica del cese.</p></div>${p?images(p):''}<div class="block-list">${cards}</div>${p?.warnings?.length?`<div class="r-warning"><strong>Advertencias del catálogo</strong><ul>${p.warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}</div></section>`;
  };

  const becariosSection = () => {
    if(!['Todos','Becarios'].includes(state.filter)) return '';
    const b=DATA.becarios_official;
    return `<section class="section" id="becarios" style="background:var(--card);border-top:1px solid var(--line);"><div class="wrap"><div class="eyebrow">05 · Afiliación y cotización</div><h2>Becarios y prácticas formativas</h2><p class="section-intro">Información oficial sobre prácticas remuneradas y no remuneradas, responsabilidad, altas, bajas y cotización.</p><div class="r-notice"><strong>Regla general desde el 1 de enero de 2024</strong><p>${esc(b.scope)}</p><div class="r-source-row">${b.sources.map(s=>sourceLink(s[1],s[0])).join('')}</div></div><div class="block-list">${b.sections.map((s,i)=>block(`becario-${i}`,s[0],'Información oficial ampliada',`<p>${esc(s[1])}</p>`,i===0)).join('')}</div>${b.tables.map(t=>table({title:t[0],columns:t[1],rows:t[2]})).join('')}<div class="r-warning"><strong>Controles y advertencias</strong><ul>${b.warnings.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></section>`;
  };

  const librarySection = () => {
    if(!['Todos','Biblioteca','CNO','Identidad','Claves'].includes(state.filter)) return '';
    let list=visiblePages();
    if(state.filter==='CNO') list=list.filter(p=>['cno','varcno'].includes(p.id));
    if(state.filter==='Identidad') list=list.filter(p=>['nie','empresa','nss','ccc'].includes(p.id));
    if(state.filter==='Claves') list=list.filter(p=>['desempleado','inactividad','grupo','regimen'].includes(p.id));
    if(state.filter==='Biblioteca') list=list.filter(p=>!['001','baja','plazos'].includes(p.id));
    return `<section class="section" id="biblioteca"><div class="wrap"><div class="eyebrow">06 · Consulta completa</div><h2>Biblioteca del Sistema RED</h2><p class="section-intro">Fichas documentales con secciones, procedimientos, tablas, imágenes, advertencias y enlaces oficiales.</p><div class="block-list">${list.length?list.map((p,i)=>block(`page-${p.id}`,p.title,p.category,fullPageBody(p),i===0)).join(''):'<div class="rb-empty">No hay fichas que coincidan con la búsqueda.</div>'}</div></div></section>`;
  };

  function render(){
    filters(); stats();
    q('#red-content').innerHTML=altaSection()+bajasSection()+librarySection()+becariosSection();
  }

  q('#red-search').addEventListener('input',e=>{state.query=e.target.value.trim().toLowerCase();render();});
  render();
})();
