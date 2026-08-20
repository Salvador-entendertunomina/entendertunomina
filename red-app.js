(() => {
  const DATA = window.SISTEMA_RED_DATA;
  const T = window.RedTemplates;
  const state = { filter: 'Todos', query: '' };
  const q = (sel) => document.querySelector(sel);

  // El grid de fichas ya viene renderizado como HTML estático (para que
  // los crawlers vean el contenido real sin ejecutar JS). Aquí solo se
  // construye el índice de búsqueda (texto completo de cada ficha) y se
  // filtran/ocultan las tarjetas ya existentes en el DOM.
  const entries = T.buildEntries(DATA);
  const searchIndex = new Map(entries.map(e => [e.slug, e.searchText]));

  const cards = Array.from(document.querySelectorAll('#red-card-grid .block-link'));
  const emptyEl = q('#red-empty');

  const matches = (card) => {
    const groups = (card.dataset.groups || '').split(' ');
    if (state.filter !== 'Todos' && !groups.includes(state.filter)) return false;
    if (!state.query) return true;
    return (searchIndex.get(card.dataset.slug) || '').includes(state.query);
  };

  function render() {
    let visible = 0;
    cards.forEach(card => {
      const show = matches(card);
      card.hidden = !show;
      if (show) visible++;
    });
    if (emptyEl) emptyEl.hidden = visible !== 0;
  }

  q('#red-filters').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    state.filter = b.dataset.filter;
    q('#red-filters').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b));
    render();
  }));

  q('#red-search').addEventListener('input', e => { state.query = e.target.value.trim().toLowerCase(); render(); });
})();
