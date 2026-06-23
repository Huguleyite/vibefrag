/**
 * VibeFrag Global Search — search.js
 * Spotlight-style search overlay for vibefrag.com
 * Usage: <script src="/js/search.js"></script> before </body>
 * Phase 4: also add class="vf-search-offset" to the <nav> element on each page.
 */

(function () {
  'use strict';

  /* ─── CONSTANTS ─── */
  const DATA_URL    = '/data/fragrance-library.json';
  const BAR_HEIGHT  = 38; // px — height of the top trigger bar
  const MAX_RESULTS = 12;

  /* ─── STYLES ─── */
  const CSS = `
    /* ── Search trigger bar ── */
    #vf-search-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: ${BAR_HEIGHT}px;
      background: rgba(9,9,11,0.92);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }
    #vf-search-bar:hover {
      background: rgba(14,14,17,0.97);
    }
    .vf-bar-inner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0 1rem;
      width: 100%;
      max-width: 480px;
    }
    .vf-bar-icon {
      flex-shrink: 0;
      opacity: 0.45;
      color: #c8c8d0;
    }
    .vf-bar-text {
      font-family: 'Inter', sans-serif;
      font-size: 0.68rem;
      font-weight: 300;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #878790;
      flex: 1;
    }
    .vf-bar-hint {
      font-family: 'Inter', sans-serif;
      font-size: 0.6rem;
      font-weight: 300;
      letter-spacing: 0.1em;
      color: #4a4a55;
      flex-shrink: 0;
      white-space: nowrap;
    }

    /* ── Offset nav so it sits below the bar ── */
    nav.vf-search-offset {
      top: ${BAR_HEIGHT}px !important;
    }

    /* ── Overlay backdrop ── */
    #vf-search-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: rgba(5,5,7,0.88);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      align-items: flex-start;
      justify-content: center;
      padding-top: 14vh;
    }
    #vf-search-overlay.vf-open {
      display: flex;
    }

    /* ── Search modal ── */
    .vf-modal {
      width: 100%;
      max-width: 620px;
      margin: 0 1.5rem;
    }

    /* ── Input wrapper ── */
    .vf-input-wrap {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0 1.2rem;
      border: 1px solid rgba(255,255,255,0.10);
      background: rgba(15,15,18,0.95);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }
    .vf-input-icon {
      flex-shrink: 0;
      color: #d4a878;
      opacity: 0.75;
    }
    #vf-search-input {
      flex: 1;
      background: none;
      border: none;
      outline: none;
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-size: 1.5rem;
      font-weight: 300;
      color: #c8c8d0;
      letter-spacing: 0.04em;
      padding: 1.1rem 0;
      caret-color: #d4a878;
    }
    #vf-search-input::placeholder {
      color: #3a3a45;
      font-style: italic;
    }
    .vf-esc-hint {
      font-family: 'Inter', sans-serif;
      font-size: 0.58rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #3a3a45;
      flex-shrink: 0;
      white-space: nowrap;
    }

    /* ── Results list ── */
    #vf-results {
      margin-top: 2px;
      max-height: 52vh;
      overflow-y: auto;
      background: rgba(12,12,15,0.97);
      border: 1px solid rgba(255,255,255,0.07);
      border-top: none;
      scrollbar-width: thin;
      scrollbar-color: rgba(176,133,88,0.25) transparent;
    }
    #vf-results::-webkit-scrollbar { width: 4px; }
    #vf-results::-webkit-scrollbar-track { background: transparent; }
    #vf-results::-webkit-scrollbar-thumb { background: rgba(176,133,88,0.25); border-radius: 2px; }

    .vf-result {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.95rem 1.2rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
      cursor: default;
    }
    .vf-result:last-child { border-bottom: none; }
    .vf-result:hover, .vf-result.vf-focused {
      background: rgba(176,133,88,0.07);
    }
    .vf-result-body { flex: 1; min-width: 0; }
    .vf-result-brand {
      font-family: 'Inter', sans-serif;
      font-size: 0.55rem;
      font-weight: 300;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: #d4a878;
      margin-bottom: 0.2rem;
    }
    .vf-result-name {
      font-family: 'Cormorant Garamond', 'Georgia', serif;
      font-size: 1.05rem;
      font-weight: 300;
      color: #c8c8d0;
      letter-spacing: 0.02em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.25rem;
    }
    .vf-result-notes {
      font-family: 'Inter', sans-serif;
      font-size: 0.65rem;
      font-weight: 300;
      letter-spacing: 0.04em;
      color: #52525e;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    em.vf-match {
      font-style: normal;
      color: #d4a878;
    }
    .vf-result-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    .vf-gender {
      font-family: 'Inter', sans-serif;
      font-size: 0.55rem;
      font-weight: 300;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #878790;
      border: 1px solid rgba(255,255,255,0.10);
      padding: 0.2rem 0.5rem;
      min-width: 28px;
      text-align: center;
    }
    .vf-code {
      font-family: 'Inter', sans-serif;
      font-size: 0.58rem;
      font-weight: 300;
      letter-spacing: 0.12em;
      color: #d4a878;
      cursor: pointer;
      border: 1px solid rgba(212,168,120,0.25);
      padding: 0.2rem 0.55rem;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .vf-code:hover {
      background: rgba(212,168,120,0.10);
      border-color: rgba(212,168,120,0.50);
    }
    .vf-code.vf-copied {
      color: #7a9e7e;
      border-color: rgba(122,158,126,0.35);
    }

    /* ── Empty / loading states ── */
    .vf-state {
      padding: 2rem 1.2rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.7rem;
      font-weight: 300;
      letter-spacing: 0.12em;
      color: #3a3a45;
      text-align: center;
    }

    /* ── Mobile ── */
    @media (max-width: 640px) {
      .vf-bar-hint { display: none; }
      #vf-search-overlay { padding-top: 8vh; }
      .vf-modal { margin: 0 0.75rem; }
      .vf-esc-hint { display: none; }
      #vf-search-input { font-size: 1.15rem; }
    }
  `;

  /* ─── HTML TEMPLATES ─── */
  const SEARCH_ICON = `<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.3"/>
    <line x1="10.2" y1="10.2" x2="13.5" y2="13.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`;

  /* ─── STATE ─── */
  let library = [];
  let activeIndex = -1;
  let overlay, input, results;

  /* ─── INIT ─── */
  function init() {
    injectStyles();
    injectHTML();
    bindEvents();
    loadLibrary();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function injectHTML() {
    // Trigger bar
    const bar = document.createElement('div');
    bar.id = 'vf-search-bar';
    bar.setAttribute('role', 'button');
    bar.setAttribute('aria-label', 'Search fragrances');
    bar.innerHTML = `
      <div class="vf-bar-inner">
        <span class="vf-bar-icon">${SEARCH_ICON}</span>
        <span class="vf-bar-text">Search fragrances, notes, or brands</span>
        <span class="vf-bar-hint">⌘K</span>
      </div>`;
    document.body.insertBefore(bar, document.body.firstChild);

    // Overlay
    overlay = document.createElement('div');
    overlay.id = 'vf-search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Fragrance search');
    overlay.innerHTML = `
      <div class="vf-modal">
        <div class="vf-input-wrap">
          <span class="vf-input-icon">${SEARCH_ICON.replace('15" height="15"', '18" height="18"').replace('stroke-width="1.3"', 'stroke-width="1.2"')}</span>
          <input id="vf-search-input" type="search" placeholder="bergamot, oud, florals…" autocomplete="off" spellcheck="false" aria-label="Search fragrances" />
          <span class="vf-esc-hint">esc to close</span>
        </div>
        <div id="vf-results" role="listbox" aria-label="Search results"></div>
      </div>`;
    document.body.appendChild(overlay);

    input   = document.getElementById('vf-search-input');
    results = document.getElementById('vf-results');
  }

  /* ─── EVENTS ─── */
  function bindEvents() {
    // Open via bar click
    document.getElementById('vf-search-bar').addEventListener('click', open);

    // Cmd/Ctrl+K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen() ? close() : open();
      }
      if (e.key === 'Escape' && isOpen()) close();
      if (e.key === 'ArrowDown' && isOpen()) { e.preventDefault(); moveActive(1); }
      if (e.key === 'ArrowUp'   && isOpen()) { e.preventDefault(); moveActive(-1); }
    });

    // Close on backdrop click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    // Live search
    input.addEventListener('input', function () {
      activeIndex = -1;
      render(input.value.trim());
    });
  }

  function isOpen() { return overlay.classList.contains('vf-open'); }

  function open() {
    overlay.classList.add('vf-open');
    setTimeout(function () { input.focus(); }, 50);
    render('');
  }

  function close() {
    overlay.classList.remove('vf-open');
    input.value = '';
    results.innerHTML = '';
    activeIndex = -1;
  }

  function moveActive(dir) {
    const items = results.querySelectorAll('.vf-result');
    if (!items.length) return;
    items.forEach(function (el) { el.classList.remove('vf-focused'); });
    activeIndex = Math.max(0, Math.min(items.length - 1, activeIndex + dir));
    items[activeIndex].classList.add('vf-focused');
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  /* ─── DATA ─── */
  function loadLibrary() {
    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) { library = data; })
      .catch(function () { library = []; });
  }

  /* ─── SEARCH ─── */
  function search(query) {
    if (!query) return library.slice(0, MAX_RESULTS);
    const q = query.toLowerCase();
    const scored = library.map(function (entry) {
      const brand = entry.brand.toLowerCase();
      const name  = entry.name.toLowerCase();
      const notes = entry.notes.map(function (n) { return n.toLowerCase(); });

      let score = 0;
      if (brand === q || name === q)                    score = 100;
      else if (brand.startsWith(q) || name.startsWith(q)) score = 80;
      else if (brand.includes(q) || name.includes(q))     score = 60;
      else if (notes.some(function (n) { return n.startsWith(q); })) score = 40;
      else if (notes.some(function (n) { return n.includes(q); }))   score = 20;

      return { entry: entry, score: score };
    });

    return scored
      .filter(function (s) { return s.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, MAX_RESULTS)
      .map(function (s) { return s.entry; });
  }

  /* ─── RENDER ─── */
  function highlight(text, query) {
    if (!query) return escHtml(text);
    const re = new RegExp('(' + escRegex(query) + ')', 'gi');
    return escHtml(text).replace(re, '<em class="vf-match">$1</em>');
  }

  function render(query) {
    if (!library.length) {
      results.innerHTML = '<div class="vf-state">Loading…</div>';
      return;
    }

    const hits = search(query);

    if (!query) {
      results.innerHTML = '<div class="vf-state">Type a brand, fragrance name, or note</div>';
      return;
    }

    if (!hits.length) {
      results.innerHTML = '<div class="vf-state">No matches — try a different note or brand</div>';
      return;
    }

    const q = query.toLowerCase();
    results.innerHTML = hits.map(function (e) {
      const notesStr = e.notes.join(', ');
      const codeHTML = e.discount_code
        ? `<span class="vf-code" data-code="${escHtml(e.discount_code)}" title="Click to copy">${escHtml(e.discount_code)}</span>`
        : '';

      return `<div class="vf-result" role="option">
        <div class="vf-result-body">
          <div class="vf-result-brand">${highlight(e.brand, q)}</div>
          <div class="vf-result-name">${highlight(e.name, q)}</div>
          <div class="vf-result-notes">${highlight(notesStr, q)}</div>
        </div>
        <div class="vf-result-meta">
          <span class="vf-gender">${escHtml(e.gender)}</span>
          ${codeHTML}
        </div>
      </div>`;
    }).join('');

    // Copy-to-clipboard for code chips
    results.querySelectorAll('.vf-code').forEach(function (chip) {
      chip.addEventListener('click', function () {
        const code = chip.dataset.code;
        navigator.clipboard.writeText(code).then(function () {
          chip.textContent = 'Copied!';
          chip.classList.add('vf-copied');
          setTimeout(function () {
            chip.textContent = code;
            chip.classList.remove('vf-copied');
          }, 1800);
        });
      });
    });
  }

  /* ─── UTILS ─── */
  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ─── BOOT ─── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
