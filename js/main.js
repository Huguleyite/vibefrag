/* ================================================
   VibeFrag — Shared Utilities
   ================================================ */

const VibeFrag = {

  /* Render a single fragrance card from a release object */
  renderCard(frag) {
    const catLabel = { M: 'Masculine', F: 'Feminine', U: 'Unisex' };
    const notes = frag.notes || {};
    const top    = (notes.top    || []).join(' · ');
    const middle = (notes.middle || notes.mid || []).join(' · ');
    const base   = (notes.base   || []).join(' · ');

    const notesHTML = `
      <div class="frag-card__notes">
        ${top    ? `<div class="frag-card__note-row"><span class="frag-card__note-label">Top</span><span class="frag-card__note-text">${top}</span></div>` : ''}
        ${middle ? `<div class="frag-card__note-row"><span class="frag-card__note-label">Mid</span><span class="frag-card__note-text">${middle}</span></div>` : ''}
        ${base   ? `<div class="frag-card__note-row"><span class="frag-card__note-label">Base</span><span class="frag-card__note-text">${base}</span></div>` : ''}
      </div>`;

    const released = frag.released ? `<span class="frag-card__date">${this.formatDate(frag.released)}</span>` : '';
    const link = frag.source_url
      ? `<a href="${frag.source_url}" target="_blank" rel="noopener" class="frag-card__link">View ›</a>`
      : '';

    return `
      <article class="frag-card" data-house="${(frag.house || '').toLowerCase()}" data-category="${frag.category || 'U'}" data-family="${(frag.family || '').toLowerCase()}">
        <div class="frag-card__header">
          <span class="frag-card__house">${frag.house || ''}</span>
          <span class="frag-card__category frag-card__category--${frag.category || 'U'}">${catLabel[frag.category] || 'Unisex'}</span>
        </div>
        <h3 class="frag-card__name">${frag.name}</h3>
        ${frag.family ? `<div class="frag-card__family">${frag.family}</div>` : ''}
        ${notesHTML}
        <div class="frag-card__footer">
          ${released}
          ${link}
        </div>
      </article>`;
  },

  formatDate(str) {
    if (!str) return '';
    const [year, month] = str.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    if (month && months[parseInt(month, 10) - 1]) {
      return `${months[parseInt(month, 10) - 1]} ${year}`;
    }
    return year;
  },

  /* Fetch JSON data file */
  async fetchData(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.error('VibeFrag: failed to load', path, e);
      return null;
    }
  },

  /* Filter cards already in the DOM */
  filterCards(container, filterFn) {
    const cards = container.querySelectorAll('.frag-card');
    let visible = 0;
    cards.forEach(card => {
      const show = filterFn(card.dataset);
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    return visible;
  },

  /* Highlight active nav link */
  setActiveNav() {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav__links a').forEach(a => {
      const href = a.getAttribute('href').replace(/\/$/, '') || '/';
      if (path === href || (href !== '/' && path.startsWith(href))) {
        a.classList.add('active');
      }
    });
  }
};

/* Run on every page */
document.addEventListener('DOMContentLoaded', () => VibeFrag.setActiveNav());
