// Botón "Descargar PDF" para las tablas de fichas concretas de la Biblioteca RED
// (por ahora: claves de contrato y bonificaciones). No carga jsPDF hasta que el
// usuario pulsa el botón por primera vez, para no penalizar la carga de la página.
(function () {
  const VENDOR_SCRIPTS = ['/vendor/jspdf.umd.min.js', '/vendor/jspdf.plugin.autotable.min.js'];
  let libsPromise = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar ' + src));
      document.body.appendChild(s);
    });
  }

  function ensureLibs() {
    if (!libsPromise) {
      libsPromise = VENDOR_SCRIPTS.reduce((p, src) => p.then(() => loadScript(src)), Promise.resolve());
    }
    return libsPromise;
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  // La fuente base (Helvetica/WinAnsi) de jsPDF no incluye símbolos matemáticos
  // Unicode como ≥/≤: sin normalizar, el PDF muestra glifos rotos en vez del
  // carácter. Se sustituyen por su equivalente ASCII solo en el PDF exportado.
  const PDF_SAFE_REPLACEMENTS = [[/≥/g, '>='], [/≤/g, '<=']];
  function pdfSafeText(text) {
    return PDF_SAFE_REPLACEMENTS.reduce((t, [re, rep]) => t.replace(re, rep), String(text));
  }

  function extractTable(tableEl) {
    const columns = Array.from(tableEl.querySelectorAll('thead th')).map(th => pdfSafeText(th.textContent.trim()));
    const rows = Array.from(tableEl.querySelectorAll('tbody tr')).map(tr =>
      Array.from(tr.querySelectorAll('td')).map(td => pdfSafeText(td.textContent.trim()))
    );
    return { columns, rows };
  }

  function drawLetterhead(doc, pageWidth, margin) {
    doc.setFillColor(47, 93, 80);
    doc.roundedRect(margin, 26, 32, 32, 6, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('ETN', margin + 16, 26 + 20, { align: 'center' });

    doc.setTextColor(24, 43, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text('EntenderTuNómina', margin + 42, 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(62, 81, 100);
    doc.text('Salvador Fernández · www.entendertunomina.com', margin + 42, 52);

    doc.setFontSize(8.5);
    doc.setTextColor(62, 81, 100);
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    doc.text(dateStr, pageWidth - margin, 40, { align: 'right' });

    doc.setDrawColor(199, 154, 69);
    doc.setLineWidth(1.1);
    doc.line(margin, 70, pageWidth - margin, 70);
  }

  function drawFooters(doc, pageWidth, pageHeight, margin) {
    // Se dibuja en una pasada final (no en didDrawPage) porque el número total
    // de páginas no se conoce hasta que autoTable termina de paginar.
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(62, 81, 100);
      doc.text('Fuente: Sistema RED / Tesorería General de la Seguridad Social — entendertunomina.com', margin, pageHeight - 18);
      doc.text('Página ' + i + ' de ' + totalPages, pageWidth - margin, pageHeight - 18, { align: 'right' });
    }
  }

  const TABLE_STYLES = {
    styles: { font: 'helvetica', fontSize: 7.6, cellPadding: 5, textColor: [62, 81, 100], lineColor: [223, 220, 207], lineWidth: 0.5, overflow: 'linebreak' },
    headStyles: { fillColor: [47, 93, 80], textColor: 255, fontStyle: 'bold', fontSize: 7.8 },
    alternateRowStyles: { fillColor: [251, 250, 246] }
  };

  function buildPdf(title, columns, rows) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    drawLetterhead(doc, pageWidth, margin);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 43, 58);
    doc.text(title, margin, 90, { maxWidth: pageWidth - margin * 2 });

    doc.autoTable(Object.assign({ startY: 100, head: [columns], body: rows, margin: { left: margin, right: margin, bottom: 42 } }, TABLE_STYLES));

    drawFooters(doc, pageWidth, pageHeight, margin);
    doc.save('entendertunomina-' + slugify(title) + '.pdf');
  }

  function buildFullPdf(pageTitle, sections) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;

    drawLetterhead(doc, pageWidth, margin);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(24, 43, 58);
    doc.text(pageTitle, margin, 90, { maxWidth: pageWidth - margin * 2 });

    let cursorY = 102;
    sections.forEach(sec => {
      // Evita dejar un subtítulo huérfano al final de la página: si no cabe la
      // cabecera de sección más un par de filas, se pasa a la siguiente página.
      if (cursorY > pageHeight - 130) {
        doc.addPage();
        cursorY = margin + 10;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(24, 43, 58);
      doc.text(sec.title, margin, cursorY, { maxWidth: pageWidth - margin * 2 });

      doc.autoTable(Object.assign({ startY: cursorY + 8, head: [sec.columns], body: sec.rows, margin: { left: margin, right: margin, bottom: 42 } }, TABLE_STYLES));
      cursorY = doc.lastAutoTable.finalY + 26;
    });

    drawFooters(doc, pageWidth, pageHeight, margin);
    doc.save('entendertunomina-' + slugify(pageTitle) + '.pdf');
  }

  function findTitle(block, tableWrap) {
    const details = tableWrap.closest('details.r-table-details');
    const h4 = details ? details.querySelector('summary h4') : block.querySelector('h4');
    return h4 ? h4.textContent.trim() : document.title;
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'r-pdf-btn';
    btn.innerHTML = '<span aria-hidden="true">⬇</span> PDF';
    btn.setAttribute('aria-label', 'Descargar esta tabla en PDF');
    return btn;
  }

  function wireButton(btn, getData) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Generando…';
      ensureLibs()
        .then(() => {
          const { title, columns, rows } = getData();
          if (!rows.length) throw new Error('Tabla vacía');
          buildPdf(title, columns, rows);
        })
        .catch(err => {
          console.error(err);
          alert('No se ha podido generar el PDF. Inténtalo de nuevo.');
        })
        .finally(() => {
          btn.disabled = false;
          btn.innerHTML = original;
        });
    });
  }

  function findDownloadableTables() {
    const found = [];
    document.querySelectorAll('.entry-body .r-block').forEach(block => {
      const tableWrap = block.querySelector(':scope > .r-table-wrap, :scope > details.r-table-details > .r-table-wrap');
      if (!tableWrap) return;
      const table = tableWrap.querySelector('table.r-table');
      if (!table) return;
      found.push({ block, tableWrap, table, title: findTitle(block, tableWrap) });
    });
    return found;
  }

  function pageHeading() {
    const h1 = document.querySelector('.entry-hero h1');
    return h1 ? h1.textContent.trim() : document.title;
  }

  function initPerTableButtons(entries) {
    entries.forEach(({ block, tableWrap, table, title }) => {
      const btn = makeButton();
      wireButton(btn, () => {
        const { columns, rows } = extractTable(table);
        return { title: pdfSafeText(title), columns, rows };
      });

      const summary = block.querySelector(':scope > details.r-table-details > summary');
      if (summary) {
        const count = summary.querySelector('.r-table-count');
        const meta = document.createElement('span');
        meta.className = 'r-table-meta';
        summary.insertBefore(meta, count);
        if (count) meta.appendChild(count);
        meta.appendChild(btn);
      } else {
        const h4 = block.querySelector(':scope > h4');
        if (!h4) return;
        const row = document.createElement('div');
        row.className = 'r-table-head-row';
        h4.parentNode.insertBefore(row, h4);
        row.appendChild(h4);
        row.appendChild(btn);
      }
    });
  }

  function initDownloadAllButton(btn, entries) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Generando…';
      ensureLibs()
        .then(() => {
          const sections = entries.map(({ table, title }) => {
            const { columns, rows } = extractTable(table);
            return { title: pdfSafeText(title), columns, rows };
          }).filter(sec => sec.rows.length);
          if (!sections.length) throw new Error('Sin tablas');
          buildFullPdf(pdfSafeText(pageHeading()), sections);
        })
        .catch(err => {
          console.error(err);
          alert('No se ha podido generar el PDF. Inténtalo de nuevo.');
        })
        .finally(() => {
          btn.disabled = false;
          btn.innerHTML = original;
        });
    });
  }

  function init() {
    const entries = findDownloadableTables();
    if (!entries.length) return;
    const allBtn = document.querySelector('[data-download-all]');
    if (allBtn) {
      initDownloadAllButton(allBtn, entries);
    } else {
      initPerTableButtons(entries);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
