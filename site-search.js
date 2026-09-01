(() => {
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>';
  const modalIcon = '<svg class="d411-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>';
  let searchIndex = null;

  function esc(s){ return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim(); }

  async function loadIndex(){
    if (searchIndex) return searchIndex;
    const res = await fetch('/search-index.json', {cache:'no-store'});
    if (!res.ok) throw new Error('Search index unavailable');
    searchIndex = await res.json();
    return searchIndex;
  }

  function score(entry, query){
    const q = norm(query);
    const terms = q.split(/\s+/).filter(Boolean);
    const title = norm(entry.title);
    const page = norm(entry.page);
    const text = norm(entry.searchText || entry.excerpt || '');
    const hay = `${title} ${page} ${text}`;
    if (!terms.every(t => hay.includes(t))) return 0;
    let points = 0;
    if (title === q) points += 180;
    if (title.includes(q)) points += 100;
    if (page.includes(q)) points += 50;
    terms.forEach(t => {
      if (title.includes(t)) points += 30;
      if (page.includes(t)) points += 12;
      const hits = text.split(t).length - 1;
      points += Math.min(hits, 6) * 4;
    });
    return points;
  }

  function buildUI(){
    if (document.querySelector('.d411-search-overlay')) return;

    const chromeSearch = document.querySelector('nav [data-open-search]');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'd411-search-toggle';
    toggle.setAttribute('aria-label','Search Documentary411');
    toggle.setAttribute('title','Search Documentary411');
    toggle.innerHTML = icon;

    const homeNav = document.querySelector('.nav-inner');
    const navCta = homeNav?.querySelector('.nav-cta');
    const siteHeader = document.querySelector('.site-header .wrap');
    const directoryNav = document.querySelector('.d411-nav-inner');
    const directoryCta = directoryNav?.querySelector('.d411-cta');
    if (!chromeSearch) {
      if (homeNav) {
        if (navCta) homeNav.insertBefore(toggle, navCta);
        else homeNav.appendChild(toggle);
      } else if (directoryNav) {
        if (directoryCta) directoryNav.insertBefore(toggle, directoryCta);
        else directoryNav.appendChild(toggle);
      } else if (siteHeader) {
        siteHeader.appendChild(toggle);
      } else {
        toggle.style.position='fixed'; toggle.style.right='18px'; toggle.style.top='18px'; toggle.style.zIndex='9000'; toggle.style.background='#073f45';
        document.body.appendChild(toggle);
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'd411-search-overlay';
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Search Documentary411');
    overlay.innerHTML = `
      <div class="d411-search-panel">
        <div class="d411-search-head">
          ${modalIcon}
          <input class="d411-search-input" type="search" autocomplete="off" placeholder="Search grants, festivals, legal, funding, tools…" aria-label="Search Documentary411">
          <button class="d411-search-close" type="button" aria-label="Close search">×</button>
        </div>
        <div class="d411-search-body">
          <div class="d411-search-hint">Search the entire public Documentary411 site. Try <strong>environmental grants</strong>, <strong>E&amp;O insurance</strong>, <strong>festival budget</strong>, <strong>distribution</strong>, or <strong>brand funding</strong>.</div>
          <div class="d411-search-results"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    let topSearch = null;
    if (!chromeSearch) {
      topSearch = document.createElement('div');
      topSearch.className = 'd411-top-search';
      topSearch.innerHTML = `<div class="d411-top-search-inner"><button class="d411-top-search-button" type="button" aria-label="Search Documentary411">${icon}<span>Search Documentary411 — grants, festivals, legal, funding, tools…</span><span class="d411-top-search-kbd">⌘K</span></button></div>`;
      const primaryNav = document.querySelector('nav');
      const primaryHeader = document.querySelector('.site-header');
      if (primaryNav && primaryNav.parentNode) primaryNav.insertAdjacentElement('afterend', topSearch);
      else if (primaryHeader && primaryHeader.parentNode) primaryHeader.insertAdjacentElement('afterend', topSearch);
      else document.body.insertBefore(topSearch, document.body.firstChild);
    }

    const input = overlay.querySelector('.d411-search-input');
    const results = overlay.querySelector('.d411-search-results');
    const hint = overlay.querySelector('.d411-search-hint');
    const closeBtn = overlay.querySelector('.d411-search-close');
    const topSearchButton = topSearch ? topSearch.querySelector('.d411-top-search-button') : null;

    async function openSearch(){
      overlay.classList.add('open');
      document.body.classList.add('d411-search-lock');
      setTimeout(() => input.focus(), 20);
      try { await loadIndex(); }
      catch(e){ hint.textContent = 'Search is temporarily unavailable. Please try again shortly.'; }
    }
    function closeSearch(){
      overlay.classList.remove('open');
      document.body.classList.remove('d411-search-lock');
      const fallback = document.querySelector('nav [data-open-search]') || topSearchButton;
      if (document.activeElement === closeBtn || overlay.contains(document.activeElement)) fallback && fallback.focus && fallback.focus();
    }

    function render(query){
      const q = query.trim();
      results.innerHTML = '';
      if (q.length < 2){ hint.style.display='block'; return; }
      hint.style.display='none';
      if (!searchIndex){ results.innerHTML='<div class="d411-search-empty">Loading search…</div>'; return; }
      const matches = searchIndex.map(entry => ({entry, points:score(entry,q)})).filter(x => x.points>0).sort((a,b)=>b.points-a.points).slice(0,12);
      if (!matches.length){ results.innerHTML='<div class="d411-search-empty">No matching Documentary411 content found. Try a broader term.</div>'; return; }
      results.innerHTML = matches.map(({entry}) => `
        <a class="d411-search-result" href="${esc(entry.url)}">
          <div class="d411-search-result-page">${esc(entry.page)}</div>
          <div class="d411-search-result-title">${esc(entry.title)}</div>
          <div class="d411-search-result-excerpt">${esc(entry.excerpt)}</div>
        </a>`).join('');
    }

    if (!chromeSearch) toggle.addEventListener('click', openSearch);
    if (topSearchButton) topSearchButton.addEventListener('click', openSearch);
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-open-search]');
      if (!trigger) return;
      e.preventDefault();
      openSearch();
    });
    closeBtn.addEventListener('click', closeSearch);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
    input.addEventListener('input', async () => { if (!searchIndex) { try{ await loadIndex(); }catch(e){} } render(input.value); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeSearch();
      if ((e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase()==='k')) {
        e.preventDefault(); openSearch();
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI); else buildUI();
})();
