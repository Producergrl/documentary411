(() => {
  function normalize(text) {
    return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function grantMatches(card, filter) {
    if (filter === 'all grants') return true;

    const meta = normalize(card.querySelector('.card-meta')?.textContent);
    const desc = normalize(card.querySelector('.card-desc')?.textContent);
    const title = normalize(card.querySelector('.card-title')?.textContent);
    const haystack = `${title} ${meta} ${desc}`;

    if (filter === 'development') {
      return /\bdevelopment\b|\bearly development\b|\bidea stage\b/.test(haystack);
    }

    if (filter === 'production') {
      const productionText = haystack
        .replace(/post[- ]production/g, '')
        .replace(/production\s*&\s*post/g, 'production')
        .replace(/production\s*and\s*post/g, 'production');
      return /\bproduction\b/.test(productionText);
    }

    if (filter === 'post-production') {
      return /post[- ]production|production\s*&\s*post|production\s*and\s*post|\bpost\b/.test(haystack);
    }

    if (filter === 'environmental') {
      return /environment|climate|conservation|adventure/.test(haystack);
    }

    if (filter === 'social impact') {
      return /social impact|social justice|social consciousness|activism|human rights|community/.test(haystack);
    }

    return true;
  }

  function initGrantFilters() {
    const section = document.getElementById('grants');
    if (!section) return;

    const buttons = Array.from(section.querySelectorAll('.filter-row .filter-btn'));
    const cards = Array.from(section.querySelectorAll('.cards > .card'));
    if (!buttons.length || !cards.length) return;

    buttons.forEach((button) => {
      button.type = 'button';
      button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');

      button.addEventListener('click', () => {
        const filter = normalize(button.textContent);

        buttons.forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-pressed', active ? 'true' : 'false');
        });

        cards.forEach((card) => {
          card.style.display = grantMatches(card, filter) ? '' : 'none';
        });
      });
    });
  }

  /* -----------------------------------------------------------------------
     Fest Near Me
     - resolves a US town/city or ZIP code to coordinates
     - returns ONLY festivals within a 50-mile radius
     - never pads results with distant festivals
  ------------------------------------------------------------------------ */
  const FEST_RADIUS_MILES = 50;

  function festDistanceMiles(a, b) {
    const toRad = (n) => n * Math.PI / 180;
    const earthMiles = 3958.8;
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return earthMiles * 2 * Math.asin(Math.sqrt(h));
  }

  function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, '&#96;');
  }

  function parseTownState(query) {
    const zipMatch = String(query || '').match(/\b(\d{5})(?:-\d{4})?\b/);
    const zip = zipMatch ? zipMatch[1] : '';
    let text = String(query || '')
      .replace(/\b\d{5}(?:-\d{4})?\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const stateMatch = text.match(/(?:,|\s)\s*([A-Za-z]{2})\s*$/);
    const state = stateMatch ? stateMatch[1].toUpperCase() : '';
    if (stateMatch) text = text.slice(0, stateMatch.index).replace(/[,\s]+$/g, '').trim();

    const town = text.split(',')[0].trim();
    return { town, state, zip };
  }

  async function geocodeZip(zip) {
    if (!zip) return null;
    const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
    if (!response.ok) return null;
    const data = await response.json();
    const place = data?.places?.[0];
    if (!place) return null;
    return {
      ll: [Number(place.latitude), Number(place.longitude)],
      label: `${place['place name']}, ${place['state abbreviation']} ${zip}`
    };
  }

  async function geocodeTown(town, state) {
    if (!town) return null;

    const key = town.toLowerCase().replace(/\s+/g, ' ').trim();
    if (window.US_CITIES?.[key]) {
      return { ll: window.US_CITIES[key], label: `${town}${state ? `, ${state}` : ''}` };
    }

    const cacheKey = `d411-geocode:${key}:${state || ''}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    try {
      const q = `${town}${state ? `, ${state}` : ''}, USA`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&addressdetails=1&q=${encodeURIComponent(q)}`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) return null;
      const rows = await response.json();
      if (!rows?.length) return null;
      const result = {
        ll: [Number(rows[0].lat), Number(rows[0].lon)],
        label: `${town}${state ? `, ${state}` : ''}`
      };
      try { sessionStorage.setItem(cacheKey, JSON.stringify(result)); } catch (_) {}
      return result;
    } catch (_) {
      return null;
    }
  }

  async function resolveFestivalSearchLocation(query) {
    const parsed = parseTownState(query);

    // If the visitor supplied a town, prefer it over a ZIP. This also handles
    // accidental town/ZIP mismatches gracefully.
    if (parsed.town && /[A-Za-z]/.test(parsed.town)) {
      const townResult = await geocodeTown(parsed.town, parsed.state);
      if (townResult) return townResult;
    }

    if (parsed.zip) {
      try {
        const zipResult = await geocodeZip(parsed.zip);
        if (zipResult) return zipResult;
      } catch (_) {}
    }

    // Keep compatibility with the site's built-in city/state resolver.
    if (typeof window.festResolveLocation === 'function') {
      const fallback = window.festResolveLocation(query);
      if (fallback?.ll) return fallback;
    }

    return null;
  }

  function festivalCoordinates(festival) {
    if (window.FEST_LL?.[festival.city]) return window.FEST_LL[festival.city];
    const town = String(festival.city || '').split(',')[0].trim().toLowerCase();
    return window.US_CITIES?.[town] || null;
  }

  function renderFestivalsWithinRadius(ll, label) {
    const results = document.getElementById('qfResults');
    const note = document.getElementById('qfNote');
    if (!results || !note || !Array.isArray(window.FESTIVALS)) return;

    const selectedRegion = document.getElementById('qfregion')?.value || '';
    const nearby = window.FESTIVALS
      .filter((festival) => !selectedRegion || festival.region === selectedRegion)
      .map((festival) => {
        const coords = festivalCoordinates(festival);
        return coords ? { festival, miles: festDistanceMiles(ll, coords) } : null;
      })
      .filter(Boolean)
      .filter((item) => item.miles <= FEST_RADIUS_MILES)
      .sort((a, b) => a.miles - b.miles);

    note.style.display = 'block';

    if (!nearby.length) {
      results.innerHTML = '';
      note.innerHTML = `No festivals in the Documentary411 database are currently within <strong>${FEST_RADIUS_MILES} miles</strong> of ${escapeHTML(label)}. Try the full searchable festival database below.`;
      return;
    }

    results.innerHTML = nearby.map(({ festival: f, miles }) => `
      <div class="card">
        <span class="card-badge badge-listing">~${Math.round(miles)} miles</span>
        <div class="card-title">${escapeHTML(f.name)}</div>
        <div class="card-meta">${[f.city, f.dates, f.fee].filter(Boolean).map(escapeHTML).join(' · ')}</div>
        <div class="card-desc">${escapeHTML(f.desc)}</div>
        <a class="card-link" href="${escapeAttr(f.url)}" target="_blank" rel="noopener">View →</a>
      </div>`).join('');

    note.innerHTML = `<strong>${nearby.length}</strong> festival${nearby.length === 1 ? '' : 's'} within <strong>${FEST_RADIUS_MILES} miles</strong> of ${escapeHTML(label)}, closest first.`;
  }

  async function fixedQuickFestSearch() {
    const input = document.getElementById('qfsearch');
    const note = document.getElementById('qfNote');
    const results = document.getElementById('qfResults');
    if (!input || !note || !results) return;

    const query = input.value.trim();
    if (!query) {
      note.style.display = 'block';
      note.textContent = 'Enter a US town/city or ZIP code to find festivals within 50 miles.';
      results.innerHTML = '';
      return;
    }

    note.style.display = 'block';
    note.textContent = 'Finding festivals within 50 miles…';
    results.innerHTML = '';

    const location = await resolveFestivalSearchLocation(query);
    if (!location) {
      note.textContent = 'We could not locate that town or ZIP code. Try a format such as “Pittsboro, NC” or “27312”.';
      return;
    }

    renderFestivalsWithinRadius(location.ll, location.label);
  }

  function fixedFestNearMe() {
    const note = document.getElementById('qfNote');
    const results = document.getElementById('qfResults');
    if (!note || !results) return;

    note.style.display = 'block';
    results.innerHTML = '';
    if (!navigator.geolocation) {
      note.textContent = 'Location is not available in this browser. Type your town or ZIP code instead.';
      return;
    }

    note.textContent = 'Finding festivals within 50 miles of your location…';
    navigator.geolocation.getCurrentPosition(
      (pos) => renderFestivalsWithinRadius([pos.coords.latitude, pos.coords.longitude], 'your location'),
      () => { note.textContent = 'We could not get your location. Type your town or ZIP code instead.'; },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  function initFestivalNearMeFix() {
    const input = document.getElementById('qfsearch');
    const finder = document.querySelector('#festfinder .fest-finder');
    if (!input || !finder) return;

    input.placeholder = 'Town/city or ZIP code (e.g. Pittsboro, NC or 27312)…';
    const help = finder.querySelector('p');
    if (help) {
      help.textContent = 'Enter a US town/city or ZIP code and we’ll show documentary festivals in our database within a 50-mile radius, closest first.';
    }

    window.quickFestSearch = fixedQuickFestSearch;
    window.festNearMe = fixedFestNearMe;

    // Replace the inline Enter handler with the corrected search.
    input.onkeydown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        fixedQuickFestSearch();
      }
    };
  }

  function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    const nav = toggle.closest('nav') || document.querySelector('nav');

    function setOpen(open) {
      links.classList.toggle('nav-open', open);
      if (nav) nav.classList.toggle('nav-menu-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', () => {
      setOpen(!links.classList.contains('nav-open'));
    });

    links.addEventListener('click', (event) => {
      if (event.target.tagName === 'A') setOpen(false);
    });
  }

  function initAllFixes() {
    initGrantFilters();
    initFestivalNearMeFix();
    initMobileNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllFixes);
  } else {
    initAllFixes();
  }
})();
