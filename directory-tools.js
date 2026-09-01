(function(){
    function norm(v){return String(v||'').toLowerCase();}
  function money(v){return (v||'').replace(/</g,'&lt;');}
  function matches(res, state){
    const q = norm(state.q);
    const hay = norm(Object.values(res).join(' '));
    if(q && !hay.includes(q)) return false;
    if(state.category && res.category !== state.category) return false;
    if(state.stage && !norm(res.projectStage).includes(norm(state.stage))) return false;
    if(state.status && res.status !== state.status) return false;
    if(state.access && res.isFree !== state.access) return false;
    if(state.doc && res.documentarySpecific !== state.doc) return false;
    return true;
  }
  function isOpenish(res){
    const s = String(res.status || '').toLowerCase();
    return s === 'open' || s === 'rolling';
  }
  function statusClassName(status){
    const s = String(status || '').toLowerCase();
    if (s === 'open' || s === 'rolling') return 'green';
    if (s === 'verify' || s === 'upcoming') return 'warn';
    return '';
  }
  function card(res){
    const statusClass = statusClassName(res.status);
    const access = res.access || (res.isFree === 'paid' ? 'Paid / membership may apply' : res.isFree === 'mixed' ? 'Free + paid elements' : 'Free');
    return `<article class="d411-card">
      <div class="d411-meta"><span class="d411-pill gold">${res.resourceType}</span><span class="d411-pill ${statusClass}">${res.status}</span></div>
      <h3>${res.name}</h3>
      <small>${res.category} · ${res.region}</small>
      <p>${res.description}</p>
      <p><strong>Best for:</strong> ${res.bestFor}</p>
      <div class="d411-meta">
        <span class="d411-pill">${res.projectStage}</span>
        <span class="d411-pill">${money(access)}</span>
        ${res.lastVerified ? `<span class="d411-pill">Last verified <time datetime="${res.lastVerified}">${res.lastVerified}</time></span>` : '<span class="d411-pill">Confirm dates on the official site</span>'}
      </div>
      <p><strong>Why this matters:</strong> ${res.notes}</p>
      <a class="d411-link" href="${res.officialUrl}" target="_blank" rel="noopener">Visit Official Site →</a>
      <a class="d411-link" href="/submit-resource?correction=${encodeURIComponent(res.name)}">Suggest correction →</a>
    </article>`;
  }
  function options(values, label){
    return `<option value="">${label}</option>` + [...new Set(values.filter(Boolean))].sort().map(v=>`<option value="${v}">${v}</option>`).join('');
  }
  window.D411 = {
    renderDirectory(config){
      const resources = window.D411_RESOURCES || [];
      const root = document.querySelector(config.target || '#directoryApp');
      if(!root) return;
      let base = resources.slice();
      if(config.category && config.includeHomepageSection) {
        const sections = config.includeHomepageSection;
        base = base.filter(r => r.category === config.category || (r.homepage && sections.indexOf(r.homepage.section) !== -1));
      } else if(config.category) base = base.filter(r=>r.category === config.category);
      if(config.status) base = base.filter(r=>r.status === config.status);
      if(config.openish) base = base.filter(r=>r.status === 'open' || r.status === 'rolling');
      const state = {q:'',category:'',stage:'',status:'',access:'',doc:''};
      root.innerHTML = `<div class="d411-tools">
        <label class="visually-hidden" for="d411q">Search the directory</label>
        <input class="d411-input" id="d411q" type="search" aria-label="Search grants, festivals, markets, insurance, fiscal sponsors, distribution, legal, music, gear" placeholder="Search grants, festivals, markets, insurance, fiscal sponsors, distribution, legal, music, gear…">
        <label class="visually-hidden" for="d411cat">Filter by category</label>
        <select class="d411-select" id="d411cat" aria-label="Filter by category">${options(base.map(r=>r.category),'All categories')}</select>
        <label class="visually-hidden" for="d411stage">Filter by project stage</label>
        <select class="d411-select" id="d411stage" aria-label="Filter by project stage">${options(['development','production','post-production','festival','market','distribution','impact'],'All stages')}</select>
        <label class="visually-hidden" for="d411access">Filter by access</label>
        <select class="d411-select" id="d411access" aria-label="Filter by free, paid, or mixed access"><option value="">Free / paid / mixed</option><option value="free">Free</option><option value="mixed">Free + paid</option><option value="paid">Paid / member</option></select>
      </div><div id="d411count" class="d411-copy"></div><div id="d411cards" class="d411-grid"></div>`;
      function draw(){
        const filtered = base.filter(r=>matches(r,state));
        root.querySelector('#d411count').textContent = `${filtered.length} resource${filtered.length===1?'':'s'} shown. Use Suggest correction if a deadline, fee, or status has changed.`;
        root.querySelector('#d411cards').innerHTML = filtered.length ? filtered.map(card).join('') : '<div class="d411-empty">No resources match those filters yet. Try fewer filters or submit a resource we should add.</div>';
      }
      root.querySelector('#d411q').addEventListener('input', e=>{state.q=e.target.value; draw();});
      root.querySelector('#d411cat').addEventListener('change', e=>{state.category=e.target.value; draw();});
      root.querySelector('#d411stage').addEventListener('change', e=>{state.stage=e.target.value; draw();});
      root.querySelector('#d411access').addEventListener('change', e=>{state.access=e.target.value; draw();});
      draw();
    }
  };
})();
