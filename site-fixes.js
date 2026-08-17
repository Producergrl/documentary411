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
      // Remove post-production phrases first so a post-only grant does not
      // incorrectly match the Production filter.
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGrantFilters);
  } else {
    initGrantFilters();
  }
})();
