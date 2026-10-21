/* chala v3 — the bridge between Faiit's shell (onboarding, nav, home) and chala's stories
   (roast Wrapped, Real talk, the plan survey, the monthly recap).

   - chala's screens live in #chala-layer, a full-screen overlay above Faiit's app.
   - Both halves read the same money: the demo bank loads chala's persona statement into Faiit.
   - Limits have one home, Faiit's plan (faiit-plan-v1). chala's survey writes into it, and
     every chala story reads it back first, so a limit edited on the dashboard shows up in the recap. */
(() => {
  const FPLAN = 'faiit-plan-v1';
  // chala habit ↔ Faiit category
  const C2F = { delivery: 'Food delivery', online: 'Shopping', shopping: 'Shopping', beauty: 'Shopping', coffee: 'Cafés', boba: 'Cafés', dining: 'Dining', bars: 'Dining', subs: 'Subscriptions', rides: 'Transport', transport: 'Transport', travel: 'Travel', groceries: 'Groceries', rent: 'Rent & bills', bills: 'Rent & bills', fitness: 'Health' };
  const F2C = { 'Food delivery': 'delivery', Shopping: 'online', 'Cafés': 'coffee', Dining: 'dining', Subscriptions: 'subs', Transport: 'rides', Travel: 'travel' };

  const layer = () => document.getElementById('chala-layer');
  const readF = () => { try { return JSON.parse(localStorage.getItem(FPLAN)) || {}; } catch { return {}; } };
  const writeF = p => { try { localStorage.setItem(FPLAN, JSON.stringify(p)); } catch {} };
  let exitFn = null, planStamp = '', prevTheme = null;

  /* ---------- data ---------- */
  function boot() {
    if (MW.state.txns) return;
    if (!MW.load()) {
      const tx = MW.personaTxns();
      // Match Faiit's coarser buckets so a limit means the same thing on both sides.
      tx.forEach(t => { if (t.cat === 'shopping' || t.cat === 'beauty') t.cat = 'online'; if (t.cat === 'boba') t.cat = 'coffee'; });
      MW.detectEssentials(tx);
      MW.state.txns = tx;
      MW.save();
    }
    MW.state.A = MW.analyze(MW.state.txns.filter(t => t.date.slice(0, 7) === MW.PERSONA.wrapMonth));
  }

  /* The persona's statement as Faiit import rows (what the demo bank "connects"). */
  function faiitImport() {
    boot();
    const name = t => {
      const dd = /^DOORDASH\*(.+)$/i.exec(t.desc);
      if (dd) return 'DoorDash · ' + dd[1].toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
      return t.merchant;
    };
    const rows = MW.state.txns.map(t => ({
      date: t.date, merchant: name(t), cents: Math.round(t.amount * 100),
      category: t.dir === 'in' ? 'Other' : (C2F[t.cat] || 'Other'), kind: t.dir === 'in' ? 'credit' : 'expense',
      currency: 'USD', include: true, source: 'Demo bank',
    }));
    return { rows, currency: 'USD', hashes: [], period: '' };
  }

  /* ---------- plan: Faiit's limits are the source of truth ---------- */
  function pull() {
    boot();
    const fp = readF();
    if (!fp.done) return;
    const prev = MW.state.plan || { goal: 'less', intensity: 'real', tone: 'honest', joys: [], goalName: '', goalAmount: 0, createdAt: MW.todayISO() };
    const habits = [], limits = {}, baseline = {};
    Object.entries(fp.limits || {}).forEach(([cat, c]) => { const k = F2C[cat]; if (k && c > 0 && !habits.includes(k)) { habits.push(k); limits[k] = Math.round(c / 100); } });
    const cands = MW.planCandidates(MW.state.A);
    habits.forEach(k => { const c = cands.find(x => x.key === k); baseline[k] = Math.round(c ? c.monthly : limits[k]); });
    const g = (fp.goals || []).find(x => !x.archived);
    MW.state.plan = Object.assign({}, prev, { habits, limits, baseline }, g && prev.goal === 'save' ? { goalName: g.title, goalAmount: Math.round(g.target / 100) } : {});
  }
  function push() {
    const P = MW.state.plan; if (!P) return;
    const fp = readF(), limits = {};
    // Keep Faiit-only limits (groceries, health…); chala's survey owns the rest.
    Object.entries(fp.done ? fp.limits || {} : {}).forEach(([cat, c]) => { if (!F2C[cat]) limits[cat] = c; });
    P.habits.forEach(k => { const cat = C2F[k] || 'Other'; limits[cat] = (limits[cat] || 0) + Math.round((P.limits[k] || 0) * 100); });
    let goals = (fp.goals || []).slice();
    if (P.goal === 'save' && P.goalName) {
      const g = { id: 'chala-goal', title: P.goalName, target: Math.round((P.goalAmount || 0) * 100) || 10000 };
      const i = goals.findIndex(x => x.id === g.id);
      i >= 0 ? (goals[i] = Object.assign({}, goals[i], g)) : goals.unshift(g);
    }
    writeF(Object.assign({ values: [], contributions: [], manual: [], joinedAt: new Date().toISOString() }, fp, { done: true, limits, goals }));
  }

  /* ---------- overlay ---------- */
  function open(onExit) {
    boot();
    exitFn = onExit || null;
    planStamp = JSON.stringify(MW.state.plan || null);
  }
  MW.show = function (id) {
    const l = layer();
    if (l.hidden) {
      l.hidden = false;
      document.documentElement.classList.add('ch-open');
      const m = document.querySelector('meta[name=theme-color]');
      if (prevTheme === null && m) prevTheme = m.content;
    }
    l.querySelectorAll('.ch-screen').forEach(s => s.classList.toggle('active', s.id === id));
    document.body.dataset.screen = id;
    l.scrollTop = 0;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = id === 'realtalk' ? '#22201d' : '#f7f5f1';
  };
  function exit() {
    MW.story.stop();
    const l = layer();
    l.hidden = true;
    l.querySelectorAll('.ch-screen').forEach(s => s.classList.remove('active'));
    document.documentElement.classList.remove('ch-open');
    delete document.body.dataset.screen;
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta && prevTheme !== null) meta.content = prevTheme;
    prevTheme = null;
    const f = exitFn; exitFn = null;
    if (f) f();
  }
  // Everything in chala that used to "go to the dashboard" now hands back to Faiit.
  MW.dash.open = function () {
    if (JSON.stringify(MW.state.plan || null) !== planStamp) push();
    exit();
  };
  MW.toast = msg => {
    const text = String(msg).replace(/<[^>]+>/g, '');
    if (window.FaiitApp?.toast) window.FaiitApp.toast(text);
  };
  MW.confetti = function () {
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('span');
      s.className = 'ch-confetti'; s.textContent = ['✦', '✧', '•', '·'][i % 4];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.animationDelay = Math.random() * 0.3 + 's';
      s.style.fontSize = 16 + Math.random() * 18 + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1900);
    }
  };

  /* ---------- what Faiit calls ---------- */
  function playWrapped({ first = false, onExit } = {}) {
    open(onExit); pull();
    MW.state.plays = (MW.state.plays || 0) + 1; MW.save();
    // First time through there's no way out but forward: roast → real talk → plan.
    MW.story.play(MW.buildRoasts(MW.state.A), first ? { kind: 'wrapped' } : { kind: 'wrapped', skipLabel: 'Close', onSkip: exit });
  }
  function playRecap({ onExit } = {}) {
    open(onExit); pull();
    if (!MW.state.plan || !MW.state.plan.habits.length) { exitFn = onExit; return playWrapped({ onExit }); }
    MW.recap.start();
  }
  function survey({ onExit } = {}) { open(onExit); pull(); MW.survey.open(); }

  /* Which story a month gets: this month, mid-way → chala's live recap. Everything else → the
     Wrapped in chala-wrap.js. Returns false when the Wrapped should handle it. */
  function route(key, { first = false, onExit } = {}) {
    boot();
    // The Wrapped itself now lives in chala-wrap.js. chala keeps only the live mid-month recap.
    if (!window.ChalaWrap && (first || !key || key === MW.PERSONA.wrapMonth)) { playWrapped({ first, onExit }); return true; }
    if (!first && key && key === MW.dash.info.monthInfo().key) { playRecap({ onExit }); return true; }
    return false;
  }
  function reset() { MW.wipe(); }

  window.Chala = { route, playWrapped, playRecap, survey, faiitImport, reset, pull, push };
})();
