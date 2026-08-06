(() => {
  const DATA = window.SISTEMA_RED_DATA;
  const T = window.RedTemplates;
  const state = { filter: 'Todos', query: '' };
  const q = (sel) => document.querySelector(sel);
  const esc = T.esc;

  const entries = T.buildEntries(DATA);

  const matches = (entry) => !state.query || entry.searchText.includes(state.query.toLowerCase());
  const inFilter = (entry) => state.filter === 'Todos' || entry.groups.includes(state.filter);
  const visibleEntries = () => entries.filter(e => inFilter(e) && matches(e));

  const stats = () => {
    const cards = [
      ['' + entries.length, 'fichas indexables'],
      ['' + DATA.baja_pdf_codes.length, 'claves de baja'],
      ['' + DATA.pages.filter(p => p.image_urls?.length).length, 'fuentes con imágenes'],
      ['22', 'códigos de baja detallados']
    ];
    q('#red-stats').innerHTML = cards.map(([a, b]) => `<div class="rb-stat"><strong class="mono">${esc(a)}</strong><span>${esc(b)}</span></div>`).join('');
  };

  const filters = () => {
    const names = ['Todos', 'Altas', 'Bajas', 'CNO', 'Identidad', 'Claves', 'Biblioteca', 'Becarios'];
    q('#red-filters').innerHTML = names.map(n => `<button type="button" class="rb-filter ${state.filter === n ? 'active' : ''}" data-filter="${n}">${n}</button>`).join('');
    q('#red-filters').querySelectorAll('button').forEach(b => b.addEventListener('click', () => { state.filter = b.dataset.filter; render(); }));
  };

  const jump = () => {
    q('#red-jump').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state.filter = b.dataset.filter; render();
      q('#red-content').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };

  const card = (entry) => `<a class="block-link" href="biblioteca-red/${esc(entry.slug)}.html"><div class="block-link-head"><span class="block-code mono">${esc(entry.category)}</span></div><h3>${esc(entry.title)}</h3><p>${esc(entry.teaser)}</p><span class="block-link-cta">Ver ficha completa →</span></a>`;

  const librarySection = () => {
    const list = visibleEntries();
    return `<section class="section" id="biblioteca"><div class="wrap"><div class="eyebrow">Consulta completa</div><h2>Biblioteca del Sistema RED</h2><p class="section-intro">Cada ficha tiene su propia página, con procedimiento, tablas, imágenes, advertencias y enlace a la fuente oficial.</p><div class="card-grid">${list.length ? list.map(card).join('') : '<div class="rb-empty">No hay fichas que coincidan con la búsqueda.</div>'}</div></div></section>`;
  };

  function render() {
    filters(); stats();
    q('#red-content').innerHTML = librarySection();
  }

  q('#red-search').addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); render(); });
  jump();
  render();
})();
