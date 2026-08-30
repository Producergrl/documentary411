(function(){
  const insuranceResources = [
    {
      name:'HUB International / IDA E&O Program', resourceType:'E&O / Production Insurance', category:'Insurance — E&O & Production',
      description:'IDA-member insurance program offering documentary-specific Producer’s Errors & Omissions coverage plus production insurance through HUB International.',
      bestFor:'U.S. documentary filmmakers who are active IDA members and need distributor-ready E&O coverage', officialUrl:'https://www.documentary.org/membership/insurance', region:'United States', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; discounted member rates may apply', isFree:'paid', access:'IDA membership required for the exclusive program; underwriting and premiums apply', documentarySpecific:'yes', filmType:'documentary / factual media', projectStage:'production / post-production / distribution', experienceLevel:'beginner / intermediate / advanced', firstTimeFilmmakerFriendly:'yes', socialImpactFriendly:'yes', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Strong documentary-specific option. Coverage highlighted by IDA includes privacy, copyright, title/trademark, defamation, plagiarism and related content risks.'
    },
    {
      name:'Front Row Insurance Brokers', resourceType:'E&O / Production Insurance Broker', category:'Insurance — E&O & Production',
      description:'Entertainment-focused broker offering Producer’s E&O, production insurance, DICE coverage, short-shoot insurance, and documentary programs in the U.S. and Canada.',
      bestFor:'Documentary and independent film teams wanting a specialist broker familiar with distribution requirements', officialUrl:'https://www.frontrowinsurance.com/us/film-tv-insurance/', region:'United States / Canada', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; premiums depend on project and underwriting', isFree:'paid', access:'Public quote request; some documentary programs require partner membership', documentarySpecific:'yes', filmType:'documentary / film / television / digital media', projectStage:'production / post-production / distribution', experienceLevel:'beginner / intermediate / advanced', firstTimeFilmmakerFriendly:'yes', socialImpactFriendly:'yes', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Front Row explicitly lists documentaries and Producer’s E&O and offers specialized IDA and DOC documentary programs.'
    },
    {
      name:'Brown & Brown Entertainment', resourceType:'Entertainment Insurance Broker', category:'Insurance — E&O & Production',
      description:'Large entertainment insurance practice offering film and television production coverage, including media errors and omissions for intellectual-property, defamation, and privacy risks.',
      bestFor:'Film and television productions needing a broad entertainment insurance program with E&O included', officialUrl:'https://us.bbrown.com/industries/entertainment/insurance-risk-management-television-film-productions/', region:'United States / International', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; quote and underwriting required', isFree:'paid', access:'Public information; broker placement and underwriting apply', documentarySpecific:'mixed', filmType:'documentary / film / television / commercial', projectStage:'production / post-production / distribution', experienceLevel:'intermediate / advanced', firstTimeFilmmakerFriendly:'unknown', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Useful for productions that need more than E&O alone; Brown & Brown specifically lists E&O for film and television productions.'
    },
    {
      name:'Aon Entertainment', resourceType:'Entertainment Insurance Broker', category:'Insurance — E&O & Production',
      description:'Global entertainment risk practice serving motion-picture, television, media, and documentary clients with professional liability, E&O/media liability, production wrap-up, property, workers’ compensation, and other coverages.',
      bestFor:'Established production companies or complex projects needing broad or international entertainment risk placement', officialUrl:'https://www.aon.com/en/capabilities/risk-transfer/entertainment-insurance-and-risk-management', region:'International', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; customized placement', isFree:'paid', access:'Public information; broker consultation and underwriting required', documentarySpecific:'mixed', filmType:'documentary / film / television / media', projectStage:'production / post-production / distribution', experienceLevel:'advanced', firstTimeFilmmakerFriendly:'unknown', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Aon explicitly includes documentaries within motion-picture/television production and offers professional liability and errors & omissions including media liability.'
    },
    {
      name:'Kelly Insurance Group — Film & Media E&O', resourceType:'Film & Media E&O Insurance Broker', category:'Insurance — E&O & Production',
      description:'Specialty broker offering project-specific and distribution-ready Film & Media E&O for films, documentaries, series, production companies, distributors, and content owners.',
      bestFor:'Independent producers who need project-specific E&O matched to distributor requirements', officialUrl:'https://kellyinsurancegroup.com/insurance/film-media-errors-omissions-insurance/', region:'United States', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; quote and underwriting required', isFree:'paid', access:'Public intake and consultation; underwriting applies', documentarySpecific:'yes', filmType:'documentary / film / television / media', projectStage:'post-production / distribution', experienceLevel:'beginner / intermediate / advanced', firstTimeFilmmakerFriendly:'yes', socialImpactFriendly:'yes', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'The firm specifically addresses documentary risks such as copyright, trademark, defamation, privacy, publicity rights, music, footage, title and chain-of-title claims.'
    },
    {
      name:'Boring Insurance — Media E&O', resourceType:'Media E&O Insurance Broker', category:'Insurance — E&O & Production',
      description:'Independent commercial broker offering Media Errors & Omissions for film and entertainment, covering content-related risks including copyright, trademark, defamation, privacy, and rights-clearance failures.',
      bestFor:'Independent filmmakers seeking a broker that shops Media E&O across multiple carriers', officialUrl:'https://boring.insure/media-errors-omissions-insurance', region:'United States', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; premiums vary', isFree:'paid', access:'Public quote request; underwriting applies', documentarySpecific:'mixed', filmType:'documentary / feature film / television / media', projectStage:'post-production / distribution', experienceLevel:'beginner / intermediate / advanced', firstTimeFilmmakerFriendly:'yes', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Especially relevant before delivery; the company explicitly notes documentary-subject, copyright, and clearance exposures and distributor requirements.'
    },
    {
      name:'FilmIns / Frankel & Associates', resourceType:'Entertainment Insurance Broker', category:'Insurance — E&O & Production',
      description:'Los Angeles entertainment insurance brokerage offering Producer E&O, Distributor E&O, film production, DICE/annual production, equipment, foreign-production, and related programs.',
      bestFor:'Independent film and television producers wanting one broker for E&O plus production coverage', officialUrl:'https://filmins.com/insurance-programs/films-movie/', region:'United States / Canada / International options', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; premiums depend on production', isFree:'paid', access:'Public quote request; underwriting applies', documentarySpecific:'mixed', filmType:'documentary / film / television / events', projectStage:'production / post-production / distribution', experienceLevel:'beginner / intermediate / advanced', firstTimeFilmmakerFriendly:'yes', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'FilmIns explicitly offers Producer’s E&O protecting against allegations including breach of contract, copyright infringement, invasion of privacy, libel and defamation.'
    },
    {
      name:'Sutton Entertainment', resourceType:'Film & Entertainment Insurance', category:'Insurance — E&O & Production',
      description:'Specialized film and entertainment insurer offering Producers’ E&O, Distributors’ E&O, film-production indemnity, general liability, and other production coverages.',
      bestFor:'Film, television, DICE, animation, and post-production companies seeking specialized entertainment coverage', officialUrl:'https://www.suttonentertainment.com/solutions', region:'Canada / United States', deadlineMonth:'Rolling / application-based', rollingDeadline:true, cost:'Paid insurance; application and underwriting required', isFree:'paid', access:'Public applications and quote process; underwriting applies', documentarySpecific:'mixed', filmType:'documentary / film / television / DICE / animation', projectStage:'production / post-production / distribution', experienceLevel:'intermediate / advanced', firstTimeFilmmakerFriendly:'unknown', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Sutton states that Producers’ E&O protects against lawsuits stemming from content, including copyright infringement, defamation and unauthorized use of protected material.'
    },
    {
      name:'Aguila — Film Errors & Omissions', resourceType:'Film E&O Insurance', category:'Insurance — E&O & Production',
      description:'Film and television E&O specialist offering coverage for content-related claims such as intellectual-property infringement, privacy breaches, music and brand use, and other professional mistakes.',
      bestFor:'Producers seeking Film E&O with international distribution exposures', officialUrl:'https://www.aguilarisk.com/sectors/media-digital/film-tv/film-errors-omissions/', region:'United Kingdom / International', deadlineMonth:'Rolling / quote-based', rollingDeadline:true, cost:'Paid insurance; quote and underwriting required', isFree:'paid', access:'Public quote process; underwriting applies', documentarySpecific:'mixed', filmType:'documentary / film / television', projectStage:'post-production / distribution', experienceLevel:'intermediate / advanced', firstTimeFilmmakerFriendly:'unknown', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'Useful for projects with international exploitation; Aguila explicitly addresses worldwide content-distribution exposure and Film E&O.'
    },
    {
      name:'AXIS Media & Entertainment Liability', resourceType:'Media Liability / E&O Carrier', category:'Insurance — E&O & Production',
      description:'Specialty insurer offering media and entertainment liability solutions for film and television production companies, producers, distributors, broadcasters, and other media businesses.',
      bestFor:'Film and television companies needing carrier-level media liability or single-film/TV coverage', officialUrl:'https://www.axiscapital.com/londonmarket/insurance/cyber-technology-e-o/media-entertainment-liability', region:'International', deadlineMonth:'Rolling / broker-underwritten', rollingDeadline:true, cost:'Paid insurance; broker placement and underwriting required', isFree:'paid', access:'Typically accessed through brokers; underwriting applies', documentarySpecific:'mixed', filmType:'documentary / film / television / multimedia', projectStage:'post-production / distribution', experienceLevel:'advanced', firstTimeFilmmakerFriendly:'unknown', socialImpactFriendly:'unknown', underrepresentedFilmmakerFriendly:'unknown', status:'active', lastVerified:'2026-08-29', notes:'AXIS lists film and television production companies as target business and offers Film & Entertainment solutions, worldwide coverage, and policy periods up to 60 months for single film and television.'
    }
  ];

  const existingNames = new Set((window.D411_RESOURCES || []).map(r => r.name));
  window.D411_RESOURCES = (window.D411_RESOURCES || []).concat(insuranceResources.filter(r => !existingNames.has(r.name)));

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
  function card(res){
    const statusClass = res.status === 'active' ? 'green' : res.status === 'verify' ? 'warn' : '';
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
        <span class="d411-pill">Last verified <time datetime="${res.lastVerified}">${res.lastVerified}</time></span>
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
      if(config.category) base = base.filter(r=>r.category === config.category);
      if(config.status) base = base.filter(r=>r.status === config.status);
      if(config.openish) base = base.filter(r=>r.status === 'open');
      const state = {q:'',category:'',stage:'',status:'',access:'',doc:''};
      root.innerHTML = `<div class="d411-tools">
        <input class="d411-input" id="d411q" placeholder="Search grants, festivals, markets, insurance, fiscal sponsors…">
        <select class="d411-select" id="d411cat">${options(base.map(r=>r.category),'All categories')}</select>
        <select class="d411-select" id="d411stage">${options(['development','production','post-production','festival','market','distribution','impact'],'All stages')}</select>
        <select class="d411-select" id="d411access"><option value="">Free / paid / mixed</option><option value="free">Free</option><option value="mixed">Free + paid</option><option value="paid">Paid / member</option></select>
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
