/* Faiit home: post-Wrapped setup (what matters → 3 goals → limits), the dashboard, Wraps and Profile.
   Core promise: understand what matters to you, and make room for it.
   Everything is stored on this device (localStorage key faiit-plan-v1). */
(() => {
  const KEY = 'faiit-plan-v1';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,.8,.24,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
  const SAVE_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 9.5 17 19 7.5"/></svg>';
  const cents = v => { const n = Math.round(parseFloat(String(v).replace(/[^0-9.]/g, '')) * 100); return Number.isFinite(n) && n > 0 ? n : 0; };

  // ---------- what people protect ----------
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const VALUES = [
    { id: 'friends', label: 'Seeing friends', icon: I('<circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5M14.5 14.2c2.6-.4 5 1.2 6 4.3"/>'), cats: ['Dining', 'Cafés'], goal: ['Trips with friends', 600] },
    { id: 'family', label: 'Supporting family', icon: I('<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M12 17.2s-3-1.8-3-3.8a1.7 1.7 0 0 1 3-1.1 1.7 1.7 0 0 1 3 1.1c0 2-3 3.8-3 3.8z"/>'), cats: [], goal: ['Support for family', 500] },
    { id: 'hobbies', label: 'My hobbies', icon: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>'), cats: ['Shopping', 'Subscriptions'], goal: ['Gear for my hobby', 300] },
    { id: 'travel', label: 'Travel', icon: I('<path d="M10.5 13.5 3 11l1.5-1.5 8 1 4-4.5c1-1 2.6-1.4 3.2-.8s.2 2.2-.8 3.2l-4.5 4 1 8L14 21.5 11.5 14"/>'), cats: ['Travel', 'Transport'], goal: ['A trip I’ve been planning', 1200] },
    { id: 'convenience', label: 'Easy busy weeks', icon: I('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>'), cats: ['Food delivery', 'Transport'], goal: ['A busy-week buffer', 200] },
    { id: 'health', label: 'Health & fitness', icon: I('<path d="M12 20s-7-4.3-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.7 12 20 12 20z"/>'), cats: ['Health'], goal: ['Gym and wellness', 300] },
    { id: 'learning', label: 'Learning', icon: I('<path d="M4 6.5C6.5 5 9.5 5 12 6.8 14.5 5 17.5 5 20 6.5V19c-2.5-1.5-5.5-1.5-8 .3-2.5-1.8-5.5-1.8-8-.3z"/><path d="M12 6.8V19"/>'), cats: ['Education'], goal: ['A course or class', 400] },
    { id: 'home', label: 'Home comforts', icon: I('<path d="M4 20V10l8-6 8 6v10z"/><path d="M9.5 20v-5.5h5V20"/>'), cats: ['Groceries'], goal: ['Something for home', 500] }
  ];
  const valueById = id => VALUES.find(v => v.id === id);
  const protects = (plan, cat) => (plan.values || []).filter(id => valueById(id)?.cats.includes(cat)).map(id => valueById(id).label);

  // ---------- storage ----------
  const blank = () => ({ done: false, values: [], goals: [], limits: {}, contributions: [], manual: [], joinedAt: new Date().toISOString() });
  const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const monthName = (d = new Date()) => d.toLocaleDateString('en-US', { month: 'long' });
  const load = () => { try { return { ...blank(), ...(JSON.parse(localStorage.getItem(KEY)) || {}) }; } catch { return blank(); } };
  const store = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} };
  const savedFor = (plan, goalId) => plan.contributions.filter(c => c.goalId === goalId).reduce((s, c) => s + c.cents, 0);
  const savedTotal = plan => plan.contributions.reduce((s, c) => s + c.cents, 0);
  /* chala v3: a goal is done once it has its target; done and archived goals live under Past goals */
  const isDone = (plan, g) => !!g.target && savedFor(plan, g.id) >= g.target;
  const doneOn = (plan, g) => g.doneAt || plan.contributions.filter(c => c.goalId === g.id).map(c => c.date).sort().pop() || '';

  // ---------- shared motion ----------
  // Jelly: squish on press, overshoot and settle on release. Gentle wobble on hover is CSS.
  /* chala v3: restrained press feedback (was a squish-and-overshoot "jelly") */
  function jelly(el) {
    if (!el || el.dataset.jelly) return; el.dataset.jelly = '1';
    let a = null;
    el.addEventListener('pointerdown', () => { if (reduce()) return; a?.cancel(); a = el.animate([{ transform: 'scale(1)' }, { transform: 'scale(.985)' }], { duration: 160, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'forwards' }); });
    const release = () => {
      if (reduce() || !a) return; a.cancel();
      a = el.animate([{ transform: 'scale(.985)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.25,.1,.25,1)' });
      a.finished.then(() => { a = null; }, () => {});
    };
    el.addEventListener('pointerup', release); el.addEventListener('pointerleave', release); el.addEventListener('pointercancel', release);
  }
  function rise(root) {
    if (reduce()) return;
    [...root.querySelectorAll('[data-rise]')].forEach((n, k) => n.animate(
      [{ opacity: 0, transform: 'translateY(16px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 620, delay: 80 + k * 70, easing: EASE, fill: 'backwards' }));
  }
  function countUp(el, to, fmt) {
    if (!el) return;
    if (reduce() || !to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), d = 900;
    const tick = now => { const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const sky = () => '<div class="fw-sky" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';

  // ---------- bottom sheet ----------
  // Full-screen overlay: the page behind blurs, content sits centered on frosted glass.
  function sheet(html, handlers = {}, kind = '') {
    const prev = document.activeElement;
    const wrap = document.createElement('div'); wrap.className = `fh-sheet-wrap ${kind}`;
    wrap.innerHTML = `<div class="fw-sky fh-ov-sky" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="fh-sheet" role="dialog" aria-modal="true" aria-labelledby="fh-sheet-title">
      <div class="fh-sheet-head"><button class="fx-gc fh-close" data-s="close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="fh-sheet-body">${html}</div></div>`;
    // Open and close with one easing: the backdrop fades while the panel glides up, then eases back down.
    let closing = false;
    const close = () => {
      if (closing) return; closing = true;
      document.removeEventListener('keydown', key, true); document.documentElement.classList.remove('fh-locked');
      prev?.focus?.({ preventScroll: true });
      if (reduce()) { wrap.remove(); return; }
      const panel = wrap.querySelector('.fh-sheet');
      panel.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(28px) scale(.985)', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      wrap.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 340, delay: 40, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished.then(() => wrap.remove(), () => wrap.remove());
    };
    const key = e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { const f = [...wrap.querySelectorAll('button,input,select,textarea')].filter(n => !n.disabled && n.offsetParent); if (!f.length) return; const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    };
    wrap.addEventListener('click', e => { if (!e.target.closest('.fh-sheet')) { close(); return; } const t = e.target.closest('[data-s]'); if (!t || t.disabled) return; const k = t.dataset.s; if (k === 'close') close(); else handlers[k]?.(t, close, wrap); });
    wrap.addEventListener('submit', e => { e.preventDefault(); handlers.submit?.(e.target, close, wrap); });
    wrap.addEventListener('input', e => handlers.input?.(e.target, wrap));
    document.addEventListener('keydown', key, true);
    document.documentElement.classList.add('fh-locked');
    document.body.append(wrap);
    if (!reduce()) {
      wrap.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' });
      wrap.querySelector('.fh-sheet').animate([{ transform: 'translateY(44px) scale(.98)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.22,1,.36,1)' });
    }
    const first = wrap.querySelector('.fh-sheet-body input:not([type=range]),.fh-sheet-body select');
    (first || wrap.querySelector('.fh-close')).focus({ preventScroll: true });
    return { close, el: wrap };
  }

  // =====================================================================
  // Setup after the first Wrapped: what matters → 3 goals → limits
  // =====================================================================
  function plan(el, api) {
    const p = load();
    const st = { step: 'values', values: [...p.values], goals: p.goals.length ? p.goals.map(g => ({ ...g })) : [] };
    const spend = api.spend();
    const steps = ['values', 'goals', 'limits'];

    const head = () => `<header class="fw-top fp-top">${st.step === 'values' ? '<span></span>' : `<button class="fw-icon-btn" data-p="back" aria-label="Back">${I('<path d="M15 5l-7 7 7 7"/>')}</button>`}<span class="fp-count">${steps.indexOf(st.step) + 1} of 3</span></header>`;

    function suggestGoals() {
      const picked = st.values.map(valueById).filter(Boolean);
      const out = picked.map(v => ({ id: uid(), title: v.goal[0], value: v.id, target: v.goal[1] * 100 }));
      const fill = [['A cushion for surprises', 1000], ['Something just for me', 250], ['Paying down a card', 800]];
      for (const [t, amt] of fill) { if (out.length >= 3) break; out.push({ id: uid(), title: t, value: '', target: amt * 100 }); }
      return out.slice(0, 3);
    }
    function topCats() { return spend.categories.filter(c => c.name !== 'Rent & bills' && c.name !== 'Other').slice(0, 3); }
    function limitDefault(c) { const keep = protects({ values: st.values }, c.name).length > 0; return { keep, cents: Math.max(1000, Math.round((keep ? c.cents : c.cents * .85) / 1000) * 1000) }; }

    function body() {
      if (st.step === 'values') return `
<div class="fp-body">
  <h1 class="fw-title fp-title" data-rise>What do you want to make <em>room</em> for?</h1>
  <p class="fw-lead fp-lead" data-rise>Pick up to 3. chala protects the spending behind them.</p>
  <div class="fp-chips" role="group" aria-label="What matters to you" data-rise>
    ${VALUES.map(v => `<button class="fp-chip fj" data-p="value" data-id="${v.id}" aria-pressed="${st.values.includes(v.id)}">${v.icon}<span>${v.label}</span></button>`).join('')}
  </div>
</div>
<div class="fh-cta"><button class="fh-unwrap fj" data-p="next" ${st.values.length ? '' : 'disabled'}>Continue</button></div>`;
      if (st.step === 'goals') {
        if (!st.goals.length) st.goals = suggestGoals();
        return `
<div class="fp-body">
  <h1 class="fw-title fp-title" data-rise>Your three <em>goals</em></h1>
  <p class="fw-lead fp-lead" data-rise>What should your money make possible? Edit anything.</p>
  <div class="fp-goals">
    ${st.goals.map((g, i) => `
    <div class="fp-goal" data-rise>
      <span class="fp-goal-ico" aria-hidden="true">${valueById(g.value)?.icon || I('<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>')}</span>
      <label class="fp-goal-name"><span class="fw-sr">Goal ${i + 1} name</span>
        <input class="fp-goal-title" id="fp-gt-${i}" data-g="${i}" data-f="title" value="${esc(g.title)}" maxlength="40" placeholder="Name this goal" autocapitalize="sentences" enterkeyhint="next">
        <span class="fp-pen" aria-hidden="true">${I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>')}</span></label>
      <div class="fp-goal-amt"><span class="fp-amt-k" id="fp-ak-${i}">Save</span>
        <div class="fp-step" role="group" aria-labelledby="fp-ak-${i}">
          <button type="button" class="fp-step-btn" data-p="step" data-g="${i}" data-d="-50" aria-label="$50 less">${I('<path d="M6 12h12"/>')}</button>
          <span class="fp-money"><i>$</i><input inputmode="numeric" data-g="${i}" data-f="target" value="${Math.round(g.target / 100)}" aria-label="Amount for goal ${i + 1}"></span>
          <button type="button" class="fp-step-btn" data-p="step" data-g="${i}" data-d="50" aria-label="$50 more">${I('<path d="M12 6v12M6 12h12"/>')}</button>
        </div></div>
    </div>`).join('')}
  </div>
</div>
<div class="fh-cta"><button class="fh-unwrap fj" data-p="next">Continue</button></div>`;
      }
      const cats = topCats();
      cats.forEach(c => { if (!(c.name in st.limits)) st.limits[c.name] = limitDefault(c).cents; });
      return `
<div class="fp-body">
  <h1 class="fw-title fp-title" data-rise>Set your <em>limits</em></h1>
  <p class="fw-lead fp-lead" data-rise>Your top spending in ${esc(spend.periodLabel)}. What matters to you keeps its room.</p>
  <div class="fp-limits">
    ${cats.map((c, i) => { const prot = protects({ values: st.values }, c.name); const lim = st.limits[c.name]; const max = Math.max(c.cents * 2, 5000); return `
    <div class="fp-limit ${prot.length ? 'is-protected' : ''}" data-rise>
      <div class="fp-limit-top"><b>${esc(c.name)}</b>${prot.length ? `<span class="fp-protect">${I('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>')}Protected · ${esc(prot[0])}</span>` : ''}</div>
      <div class="fp-limit-val"><output id="fp-lv-${i}">${api.money(lim)}</output><span>a month</span></div>
      <input type="range" min="0" max="${max}" step="1000" value="${lim}" data-c="${esc(c.name)}" data-i="${i}" aria-label="${esc(c.name)} monthly limit" aria-describedby="fp-ld-${i}">
      <p class="fp-limit-note" id="fp-ld-${i}">${note(c, lim)}</p>
    </div>`; }).join('')}
  </div>
</div>
<div class="fh-cta"><button class="fh-unwrap fj" data-p="finish">Finish</button></div>`;
    }
    function note(c, lim) {
      const diff = c.cents - lim;
      if (Math.abs(diff) < 1000) return `About what you spent: ${api.money(c.cents)}`;
      return diff > 0 ? `${api.money(diff)} less than last month (${api.money(c.cents)})` : `${api.money(-diff)} more room than last month`;
    }
    st.limits = { ...p.limits };

    function paint(dir = 1) {
      const old = el.querySelector('.fp');
      const html = `<section class="fw fw-screen fp">${sky()}${head()}${body()}</section>`;
      el.innerHTML = html;
      el.querySelectorAll('.fj').forEach(jelly);
      rise(el);
      if (old && !reduce()) el.querySelector('.fp-title')?.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
      el.querySelector('h1')?.setAttribute('tabindex', '-1'); el.querySelector('h1')?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
    el.onclick = e => {
      const t = e.target.closest('[data-p]'); if (!t || t.disabled) return;
      const k = t.dataset.p;
      if (k === 'value') {
        const id = t.dataset.id, on = st.values.includes(id);
        if (!on && st.values.length >= 3) { api.toast('Pick up to 3. Tap one to swap it out.'); return; }
        st.values = on ? st.values.filter(v => v !== id) : [...st.values, id];
        t.setAttribute('aria-pressed', String(!on));
        el.querySelector('[data-p="next"]').disabled = !st.values.length;
        st.goals = [];
      }
      if (k === 'step') {
        const g = st.goals[+t.dataset.g]; const v = Math.max(0, Math.round(g.target / 100) + +t.dataset.d); g.target = v * 100;
        const inp = el.querySelector(`input[data-f="target"][data-g="${t.dataset.g}"]`); inp.value = v;
        if (!reduce()) inp.animate([{ transform: 'scale(1.08)' }, { transform: 'none' }], { duration: 260, easing: EASE });
        return;
      }
      if (k === 'next') { st.step = st.step === 'values' ? 'goals' : 'limits'; paint(1); }
      if (k === 'back') { st.step = st.step === 'limits' ? 'goals' : 'values'; paint(-1); }
      if (k === 'finish') {
        const goals = st.goals.filter(g => g.title.trim()).map(g => ({ ...g, title: g.title.trim(), target: g.target || 10000 }));
        store({ ...load(), done: true, values: st.values, goals, limits: st.limits, joinedAt: load().joinedAt || new Date().toISOString() });
        api.done();
      }
    };
    el.oninput = e => {
      const t = e.target;
      if (t.dataset.g !== undefined) { const g = st.goals[+t.dataset.g]; if (t.dataset.f === 'title') g.title = t.value; else g.target = cents(t.value); }
      if (t.dataset.c) { const v = +t.value; st.limits[t.dataset.c] = v; el.querySelector(`#fp-lv-${t.dataset.i}`).textContent = api.money(v); const c = spend.categories.find(x => x.name === t.dataset.c); el.querySelector(`#fp-ld-${t.dataset.i}`).textContent = note(c, v); }
    };
    paint();
  }

  // =====================================================================
  // Dashboard, Wraps, Profile
  // =====================================================================
  const NAV = [
    ['home', 'Home', I('<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>')],
    ['wraps', 'Wraps', I('<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M12 8v12M4 12.5h16M12 8c-1.5-3.5-5.5-3.5-5 0M12 8c1.5-3.5 5.5-3.5 5 0"/>')],
    ['cards', 'Cards', I('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>')],
    ['profile', 'Profile', I('<circle cx="12" cy="8.5" r="3.6"/><path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5"/>')]
  ];

  function status(p, spentOf) {
    const lim = Object.entries(p.limits).filter(([, v]) => v > 0);
    if (!lim.length) return { key: 'calm', label: 'No plan yet', line: 'Set a limit to see how this month compares.' };
    let spent = 0, total = 0, worst = null;
    for (const [name, l] of lim) { const s = spentOf(name); spent += s; total += l; const r = s / l; if (!worst || r > worst.r) worst = { name, r, over: s - l, left: l - s }; }
    if (spent > total || worst.r > 1) return { key: 'over', label: 'Over budget', line: '', worst, spent, total };
    if (spent / total >= .8 || worst.r >= .85) return { key: 'near', label: 'Close to your limits', line: '', worst, spent, total };
    return { key: 'ok', label: 'On track', line: '', worst, spent, total };
  }

  // ---------- dotted visuals (ink on glass) ----------
  function jarSVG(ratio) {
    const R = 118, gap = 10, dots = [];
    for (let y = -R; y <= R; y += gap) for (let x = -R; x <= R; x += gap) {
      const d = Math.hypot(x, y); if (d > R - 2) continue;
      dots.push(`<circle cx="${x + R}" cy="${y + R}" r="${(2.3 - d / R * .9).toFixed(2)}"/>`);
    }
    const lvl = Math.max(0, Math.min(1, ratio));
    return `<svg class="fz-jar" viewBox="0 0 ${R * 2} ${R * 2}" aria-hidden="true">
  <defs><clipPath id="fz-fill"><rect class="fz-level" x="0" y="${R * 2 * (1 - lvl)}" width="${R * 2}" height="${R * 2 * lvl}"/></clipPath></defs>
  <g class="fz-dim">${dots.join('')}</g><g class="fz-lit" clip-path="url(#fz-fill)">${dots.join('')}</g></svg>`;
  }
  function arcSVG(ratio) {
    const n = 19, out = [], r = 50, cx = 60, cy = 60, on = Math.min(1, ratio);
    for (let i = 0; i < n; i++) { const a = Math.PI * (1 - i / (n - 1)), lit = i / (n - 1) <= on && ratio > 0; out.push(`<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy - r * Math.sin(a)).toFixed(1)}" r="${lit ? 3.1 : 2.1}" class="${lit ? 'on' : ''}"/>`); }
    return `<svg class="fz-arc" viewBox="0 0 120 66" aria-hidden="true">${out.join('')}</svg>`;
  }
  const FLOWER = `<svg viewBox="0 0 60 90" aria-hidden="true"><path d="M30 88 C 27 70 33 52 30 34" stroke="#86b98f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M30 64 q 14 -9 20 -2 q -9 10 -20 2z" fill="#a9d6a0"/><path d="M30 52 q -14 -9 -20 -2 q 9 10 20 2z" fill="#93c98d"/><g transform="translate(30 26)">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="7.5" ry="12" transform="rotate(${a}) translate(0 -11)" fill="#f3cfdc"/>`).join('')}<circle r="6.5" fill="#e9c35c"/></g></svg>`;
  const NOUN = { Dining: ['meal out', 'meals out'], 'Cafés': ['café visit', 'café visits'], 'Food delivery': ['delivery', 'deliveries'], Travel: ['booking', 'bookings'],
    Transport: ['ride', 'rides'], Shopping: ['purchase', 'purchases'], Subscriptions: ['subscription', 'subscriptions'], Health: ['health buy', 'health buys'],
    Education: ['class', 'classes'], Groceries: ['grocery run', 'grocery runs'] };

  function jarFX(ratio) {
    const R = 118, gap = 10, dots = [];
    for (let y = -R; y <= R; y += gap) for (let x = -R; x <= R; x += gap) {
      const d = Math.hypot(x, y); if (d > R - 2) continue;
      dots.push(`<circle cx="${x + R}" cy="${y + R}" r="${(2.2 - d / R * .8).toFixed(2)}"/>`);
    }
    const lvl = Math.max(0, Math.min(1, ratio));
    return `<svg class="fx-jar" viewBox="0 0 ${R * 2} ${R * 2}" aria-hidden="true">
  <defs><clipPath id="fx-fill"><rect class="fx-level" x="0" y="${R * 2 * (1 - lvl)}" width="${R * 2}" height="${R * 2 * lvl}" style="--lvl:${lvl}"/></clipPath></defs>
  <g class="fx-dim">${dots.join('')}</g>
  <g class="fx-lit" clip-path="url(#fx-fill)">${dots.join('')}</g>
  <line x1="6" x2="${R * 2 - 6}" y1="${R * 2 * (1 - lvl)}" y2="${R * 2 * (1 - lvl)}" class="fx-levelline"/>
</svg>`;
  }
  function arcFX(ratio) {
    const n = 21, out = [], r = 54, cx = 64, cy = 64;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (1 - i / (n - 1)), x = cx + r * Math.cos(a), y = cy - r * Math.sin(a);
      out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i / (n - 1) <= Math.min(1, ratio) ? 3 : 2}" class="${i / (n - 1) <= Math.min(1, ratio) ? 'on' : ''}"/>`);
    }
    return `<svg class="fx-arc" viewBox="0 0 128 72" aria-hidden="true">${out.join('')}</svg>`;
  }
  function home(el, api, tab = 'home') {
    const p = load(), spend = api.spend(), user = api.user() || {}, first = (user.name || '').split(' ')[0];
    const m = api.money;
    const nowKey = monthKey(), nowName = monthName();
    const fromData = api.spendIn(nowKey);
    const spentNow = n => (fromData[n] || 0) + p.manual.filter(x => x.cat === n && x.month === nowKey).reduce((t, x) => t + x.cents, 0);
    const lastMonthName = spend.periodLabel.split(' ')[0];
    const today = new Date(), dim = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(), daysLeft = dim - today.getDate();
    const health = r => r > 1 ? 'over' : r >= .8 ? 'near' : 'ok';
    const plus = I('<path d="M12 5v14M5 12h14"/>');

    const glassCircle = (h, label, icon) => `<button class="fx-gc fj" data-h="${h}" aria-label="${label}">${icon}</button>`;
    // ----- recap card: month switcher, amount spent, and a field of dots that rises with spending -----
    const sampleKey = (() => { const d = new Date(`${spend.periodLabel} 1`); return isNaN(d) ? '' : monthKey(d); })();
    const recapMonths = () => { const set = new Set(api.months ? api.months() : []); if (!api.hasData?.() && sampleKey) set.add(sampleKey); set.add(nowKey); return [...set].sort(); };
    const keyDate = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1);
    function spentInMonth(k) {
      const by = api.spendIn(k); let t = Object.values(by).reduce((a, b) => a + b, 0);
      t += p.manual.filter(x => x.month === k).reduce((a, x) => a + x.cents, 0);
      if (!api.hasData?.() && k === sampleKey) t = spend.total;
      return t;
    }
    // A seeded random so the same month always draws the same field.
    const seeded = str => { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
    function dotField(k, ratio) {
      const COLS = 23, ROWS = 7, W = 300, H = 78, gx = W / (COLS - 1), gy = H / (ROWS - 1);
      const d = keyDate(k), days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const isNow = k === nowKey, today = isNow ? new Date().getDate() : days;
      const daily = api.daily ? api.daily(k).slice(0, days) : [];
      const rnd = seeded(k + ':dots');
      // Shape: real daily spending when there is enough of it, otherwise a few soft seeded hills.
      let shape = new Array(COLS).fill(0);
      const real = daily.filter(v => v > 0).length >= 4;
      if (real) for (let c = 0; c < COLS; c++) { const a = Math.floor(c / COLS * days), b = Math.max(a + 1, Math.floor((c + 1) / COLS * days)); shape[c] = daily.slice(a, b).reduce((s, v) => s + v, 0); }
      else { const hills = [0, 1, 2].map(() => ({ at: .15 + rnd() * .75, w: .1 + rnd() * .14, h: .45 + rnd() * .55 }));
        for (let c = 0; c < COLS; c++) { const x = c / (COLS - 1); shape[c] = .18 + hills.reduce((t, q) => t + q.h * Math.exp(-((x - q.at) ** 2) / (2 * q.w * q.w)), 0); } }
      for (let pass = 0; pass < 2; pass++) shape = shape.map((v, i) => (shape[i - 1] ?? v) * .25 + v * .5 + (shape[i + 1] ?? v) * .25);
      // How high the hill climbs says low, moderate or high spending.
      const max = Math.max(...shape) || 1, amp = Math.min(1, .22 + .7 * Math.min(ratio, 1.15) / 1.15);
      const out = [];
      for (let c = 0; c < COLS; c++) {
        const future = isNow && (c / (COLS - 1)) * days > today;
        const top = future || !ratio ? 0 : Math.max(.6, (shape[c] / max) * amp * ROWS);
        for (let r = 0; r < ROWS; r++) {
          const x = c * gx + (rnd() - .5) * 7, y = H - r * gy + (rnd() - .5) * 7;
          // Dots thin out toward the top edge of the hill, like loose ink.
          const edge = (top - r) / 2.2, on = r < top && (edge >= 1 || rnd() < edge * .9 + .1);
          if (on) out.push(`<circle class="on" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 - r / ROWS).toFixed(2)}" style="--d:${c * 30 + r * 16}ms"/>`);
          else if (rnd() < .55) out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3"/>`);
        }
      }
      return `<svg class="fx-dots" viewBox="-8 -8 ${W + 16} ${H + 16}" aria-hidden="true">${out.join('')}</svg>`;
    }
    let recapKey = nowKey;
    function heroFX() {
      const months = recapMonths(); if (!months.includes(recapKey)) recapKey = nowKey;
      const i = months.indexOf(recapKey), k = recapKey, d = keyDate(k);
      const limTotal = Object.values(p.limits).reduce((a, b) => a + (b > 0 ? b : 0), 0);
      const spent = spentInMonth(k);
      const ratio = limTotal ? spent / limTotal : (spent ? .6 : 0);
      const lvl = ratio > 1 ? 'over' : ratio >= .8 ? 'near' : 'ok';
      const word = !spent ? 'Nothing spent yet' : ratio > 1 ? 'Over your limits' : ratio >= .8 ? 'High spending' : ratio >= .45 ? 'Moderate spending' : 'Low spending';
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', ', ');
      const arrow = dir => I(dir < 0 ? '<path d="M14.5 6 8.5 12l6 6"/>' : '<path d="M9.5 6l6 6-6 6"/>');
      return `
<section class="fx-hero fx-recap fj is-${lvl}" aria-label="Your recap for ${esc(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))}">
  <span class="fx-hero-bg" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
  <div class="fx-recap-top">
    <p class="fx-recap-k" aria-live="polite">Your recap · ${esc(label)}</p>
    <span class="fx-recap-arrows">
      <button class="fx-gc fj" data-h="month" data-d="-1" aria-label="Previous month" ${i > 0 ? '' : 'disabled'}>${arrow(-1)}</button>
      <button class="fx-gc fj" data-h="month" data-d="1" aria-label="Next month" ${i < months.length - 1 ? '' : 'disabled'}>${arrow(1)}</button>
    </span>
  </div>
  <p class="fx-recap-n"><b data-count="${spent}">${m(spent)}</b><span>spent</span></p>
  <p class="fx-recap-w">${word}</p>
  ${dotField(k, ratio)}
  <div class="fx-hero-acts">${k === nowKey || k === '2026-09' ? `<button class="fx-review ch-play fj" data-h="playmonth">${I('<path d="M7 4.5v15l12-7.5z"/>')}${k === nowKey ? 'Play recap' : 'Replay Wrapped'}</button>` : ''}<button class="fx-review fj" data-h="breakdown">See the breakdown</button></div>
</section>`;
    }

    const TONES = ['teal', 'sunset', 'iris', 'meadow'];
    const LT_ICON = n => I(({
      'Food delivery': '<circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/><path d="M9 17.5h6M3.5 13.5h7l2.5 4M14 7h3l3.5 10.5"/><rect x="3.5" y="7.5" width="6" height="6" rx="1"/>',
      Shopping: '<path d="M3 7.2 12 3l9 4.2v9.6L12 21l-9-4.2z"/><path d="M3 7.2 12 11.4l9-4.2M12 11.4V21"/>',
      'Cafés': '<path d="M4.5 9h12v4.5A5.5 5.5 0 0 1 11 19h-1a5.5 5.5 0 0 1-5.5-5.5z"/><path d="M16.5 10.5h1.2a2.6 2.6 0 0 1 0 5.2h-1.6"/>',
      Dining: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 13v8"/><path d="M17 3c-2 0-3 3-3 6s1 4 3 4v8"/>',
      Groceries: '<path d="M3 9h18l-2 11H5z"/><path d="M8 9l4-6 4 6"/>',
      Transport: '<rect x="5.5" y="3" width="13" height="14" rx="3"/><path d="M5.5 10.5h13M9 21l1.2-4M15 21l-1.2-4"/>',
      Subscriptions: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
      Travel: '<path d="M21.5 2.5 10.8 13.2"/><path d="M21.5 2.5 14.8 21.5l-4-8.3-8.3-4z"/>',
      Health: '<path d="M12 20s-7-4.3-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.7 12 20 12 20z"/>',
      Education: '<path d="M4 6.5C6.5 5 9.5 5 12 6.8 14.5 5 17.5 5 20 6.5V19c-2.5-1.5-5.5-1.5-8 .3-2.5-1.8-5.5-1.8-8-.3z"/>'
    })[n] || '<circle cx="12" cy="12" r="8"/>');
    function limitTiles() {
      const names = Object.keys(p.limits);
      return `
<section class="fx-sec fz-glowsec" aria-labelledby="fx-lim-h">
  <span class="fz-glow fz-glow-lim" aria-hidden="true"><i></i><i></i><i></i></span>
  <h2 class="fx-h" id="fx-lim-h" data-rise>Limits</h2>
  <div class="fx-tiles">
    ${names.map((n, i) => {
      /* chala v3: chala's "left to spend" card layout */
      const lim = p.limits[n], sp = spentNow(n), r = lim ? sp / lim : 0, k = r > 1 ? 'over' : r >= .8 ? 'near' : 'ok', prot = protects(p, n).length > 0;
      const left = lim - sp, whole = c => m(Math.round(Math.abs(c) / 100) * 100), perDay = left > 0 ? `${m(Math.floor(left / Math.max(1, daysLeft + 1)))}/day` : 'pause it';
      return `<button class="lt fj is-${k}" data-h="limit" data-c="${esc(n)}" data-rise
        aria-label="${esc(n)}: ${k === 'over' ? `${m(-left)} over` : `${m(left)} left`} of ${m(lim)}${prot ? ', protected' : ''}">
        <span class="lt-k">${left >= 0 ? 'Left to spend' : 'Over by'}</span>
        <span class="lt-n">${LT_ICON(n)}<span>${esc(n)}</span>${prot ? `<span class="lt-shield" aria-hidden="true">${I('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>')}</span>` : ''}</span>
        <b class="lt-num">${whole(left)}</b>
        <span class="lt-of">of ${whole(lim)} · ${perDay}</span>
        <span class="lt-bar"><i style="width:${Math.max(0, Math.min(100, (1 - r) * 100)).toFixed(1)}%"></i></span>
      </button>`; }).join('')}
    <button class="lt lt-add fj" data-h="addlimit" data-rise><span class="lt-plus">${I('<path d="M12 5v14M5 12h14"/>')}</span><span>Add a limit</span></button>
  </div>
</section>`;
    }

    function savingsBlob() {
      const total = savedTotal(p), since = new Date(p.joinedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      return `
<section class="fx-sec" data-rise>
  <div class="fx-save fj">
    <span class="fx-save-bg" aria-hidden="true"><i></i><i></i></span>
    <p class="fx-save-k">Since you started using chala, you’ve saved</p>
    <p class="fx-save-n"><b data-count="${total}">${m(total)}</b></p>
    <p class="fx-save-sub">${total ? `Money you set aside since ${since}.` : 'Only money you actually set aside counts.'}</p>
  </div>
</section>`;
    }

    // ----- making room for: frosted cards with what you've actually done -----
    function evidence(g) {
      const out = [], s = savedFor(p, g.id), cats = valueById(g.value)?.cats || [];
      if (s) out.push({ k: 'save', t: `${m(s)} set aside` });
      for (const c of cats) {
        const d = spend.categories.find(x => x.name === c);
        if (d?.cents) { const n = d.count || 0, w = NOUN[c] || [c, c]; out.push({ k: 'spend', t: n ? `${n} ${n === 1 ? w[0] : w[1]}` : esc(c) }); }
        if (p.limits[c] && p.limits[c] - spentNow(c) >= 0) out.push({ k: 'prot', t: `${c} protected` });
      }
      return out.slice(0, 3);
    }
    function room() {
      const goals = p.goals.filter(g => !g.archived);
      return `
<section class="fz-sec fz-glowsec" aria-labelledby="fz-room">
  <span class="fz-glow" aria-hidden="true"><i></i><i></i><i></i></span>
  <div class="fz-sec-h"><h2 id="fz-room">Making room for</h2><p class="fz-promise">Understand what matters to you, and make room for it.</p></div>
  <div class="fz-grid">
    ${goals.map(g => { const s = savedFor(p, g.id), r = g.target ? Math.min(1, s / g.target) : 0, ev = evidence(g); return `
    <button class="fz-goal fz-glass fj ${r >= 1 ? 'is-done' : ''}" data-h="goal" data-id="${g.id}" aria-label="${esc(g.title)}: ${m(s)} of ${m(g.target)}">
      <span class="fz-goal-top"><span class="fz-goal-t">${esc(g.title)}</span>
        <svg class="fz-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" pathLength="100"/>${r > 0 ? `<circle class="on" cx="18" cy="18" r="15" pathLength="100" stroke-dasharray="${(r * 100).toFixed(1)} 100"/>` : ''}</svg></span>
      <span class="fz-goal-s">${m(s)} of ${m(g.target)}</span>
      ${r >= 1 ? `<span class="fz-flower">${FLOWER}</span>` : `<span class="fz-chips">${ev.map(e => `<span class="fz-chip is-${e.k}">${e.t}</span>`).join('')}</span>`}
    </button>`; }).join('')}
    <button class="fz-goal fz-glass fz-new fj" data-h="addgoal"><span class="fz-goal-t">New goal</span><span class="fz-plus fz-plus-end" aria-hidden="true">${plus}</span></button>
  </div>
</section>`;
    }

    /* ===== chala v3: Home laid out like the wireframe ===== */
    // money tree data: spending in limited categories against the limits, for a week or a month
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const treeRows = (api.wrapRows?.() || []).filter(r => r.kind === 'expense' && r.include !== false && r.date);
    /* chala v3: the sample statement ends in September; the budget card and the shell chart slide it forward
       three whole weeks (weekdays stay put) so this week and month have days to show. Real statements aren't moved. */
    const addDays = (d0, n) => { const d = new Date(d0 + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
    const shShift = api.isSample?.() ? 21 : 0;
    const todayIso = iso(today);
    const nowRows = shShift ? treeRows.map(r => ({ ...r, date: addDays(r.date, shShift) })).filter(r => r.date <= todayIso) : treeRows;
    const firstDay = nowRows.reduce((a, r) => (r.date < a ? r.date : a), iso(today));
    function treeData(mode, off) {
      if (off > 0) return null;
      const cats = Object.keys(p.limits).filter(n => p.limits[n] > 0), budgetM = cats.reduce((s, n) => s + p.limits[n], 0);
      let start, end, label, elapsed, budget, extra = 0;
      if (mode === 'M') {
        start = new Date(today.getFullYear(), today.getMonth() + off, 1); end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        label = start.toLocaleDateString('en-US', start.getFullYear() === today.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' });
        budget = budgetM; elapsed = off === 0 ? today.getDate() / end.getDate() : 1;
        const k = monthKey(start); extra = p.manual.filter(x => x.month === k && cats.includes(x.cat)).reduce((s, x) => s + x.cents, 0);
      } else {
        const dow = (today.getDay() + 6) % 7;
        start = new Date(today); start.setDate(today.getDate() - dow + off * 7); end = new Date(start); end.setDate(start.getDate() + 6);
        budget = budgetM * 7 / new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        const a = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const yr = end.getFullYear() === today.getFullYear() ? '' : `, ${end.getFullYear()}`;
        label = start.getMonth() === end.getMonth() ? `${a}–${end.getDate()}${yr}` : `${a} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${yr}`;
        elapsed = off === 0 ? (dow + 1) / 7 : 1;
      }
      if (off < 0 && iso(end) < firstDay) return null;
      const s0 = iso(start), e0 = iso(end);
      const spent = nowRows.filter(r => r.date >= s0 && r.date <= e0 && cats.includes(r.category)).reduce((s, r) => s + r.cents, 0) + extra;
      const saved = savedTotal(p);
      const prevEnd = mode === 'M' ? new Date(start.getFullYear(), start.getMonth(), 0) : new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
      const unit = mode === 'M' ? 'month' : 'week';
      const when = off === 0 ? `This ${unit}` : off === -1 ? `Last ${unit}` : label;
      const range = mode === 'M' ? `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–${end.getDate()}, ${end.getFullYear()}` : label;
      const daysLeft = off === 0 ? Math.max(0, Math.round((end - today) / 864e5)) : 0;
      const SHORTN = { 'Food delivery': 'delivery', 'Cafés': 'cafés', Shopping: 'shopping', Subscriptions: 'subscriptions', Dining: 'eating out', Transport: 'rides', Travel: 'travel', Groceries: 'groceries', Health: 'health', Education: 'education' };
      const base = { label, saved, hasNext: off < 0, hasPrev: iso(prevEnd) >= firstDay, spent, budget, elapsed, when, range, daysLeft, cats: cats.map(c => SHORTN[c] || c.toLowerCase()) };
      if (!budget) return { ...base, health: .66, caption: 'Set a limit to grow your tree', tip: 'Add a spending limit to see how it grows' };
      const u = spent / Math.max(1, budget * elapsed);
      let health = u <= .6 ? 1 : u <= 1 ? 1 - (u - .6) / .4 * .42 : Math.max(.05, .58 - (u - 1) * .9);
      if (saved > 0) health = Math.min(1, health + .05);
      const left = budget - spent, w = c => m(Math.round(Math.abs(c) / 100) * 100);
      return { ...base, health, caption: left >= 0 ? `${w(left)} left of ${w(budget)}` : `${w(left)} over ${w(budget)}`,
        tip: `${Math.round(spent / budget * 100)}% of your ${mode === 'M' ? 'monthly' : 'weekly'} limits used${elapsed < 1 ? `, ${Math.round(elapsed * 100)}% of the ${mode === 'M' ? 'month' : 'week'} gone` : ''}` };
    }

    /* chala v3: shell chart data — everyday (flexible) spending by day and category, for a week or a month.
       Rent, bills and subscriptions are left out: the chart is about habits, not fixed costs. */
    const SH_GROUPS = [['food', ['Food delivery', 'Groceries', 'Restaurants', 'Dining']], ['cafe', ['Cafés']], ['shop', ['Shopping']], ['move', ['Transport', 'Rides', 'Gas']]];
    const SH_FIXED = ['Rent & bills', 'Subscriptions'];
    const shGroup = c => (SH_GROUPS.find(([, cs]) => cs.includes(c)) || ['other'])[0];
    // same purchases as the budget card above it: what you set limits for, or all everyday spending when there are none
    const shCats = Object.keys(p.limits).filter(c => p.limits[c] > 0);
    const shRows = nowRows.filter(r => shCats.length ? shCats.includes(r.category) : !SH_FIXED.includes(r.category)).map(r => ({ date: r.date, cents: r.cents, g: shGroup(r.category) }));
    const shFirst = shRows.reduce((a, r) => (r.date < a ? r.date : a), todayIso);
    const shByDay = {}; shRows.forEach(r => { const d = shByDay[r.date] || (shByDay[r.date] = { total: 0, cats: {} }); d.total += r.cents; d.cats[r.g] = (d.cats[r.g] || 0) + r.cents; });
    function shellData(mode, off) {
      if (off > 0) return null;
      let start, end, label;
      if (mode === 'M') {
        start = new Date(today.getFullYear(), today.getMonth() + off, 1); end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        label = start.toLocaleDateString('en-US', start.getFullYear() === today.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' });
      } else {
        const dow = (today.getDay() + 6) % 7;
        start = new Date(today); start.setDate(today.getDate() - dow + off * 7); end = new Date(start); end.setDate(start.getDate() + 6);
        const a = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), yr = end.getFullYear() === today.getFullYear() ? '' : `, ${end.getFullYear()}`;
        label = start.getMonth() === end.getMonth() ? `${a}–${end.getDate()}${yr}` : `${a} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${yr}`;
      }
      const s0 = iso(start), e0 = iso(end);
      if (off < 0 && e0 < shFirst) return null;
      // a usual day: the average over the last eight weeks up to the end of this period, else what the limits allow per day
      const upto = e0 < todayIso ? e0 : todayIso;
      let sum = 0, n = 0; for (let k = 0; k < 56; k++) { const d = addDays(upto, -k); if (d < shFirst) break; sum += shByDay[d]?.total || 0; n++; }
      const lim = shCats.reduce((t, c) => t + p.limits[c], 0);
      const usual = n >= 7 && sum ? sum / n : lim ? lim / new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate() : 2500;
      const days = []; for (let d = s0; d <= e0; d = addDays(d, 1)) { const x = shByDay[d]; days.push({ iso: d, n: +d.slice(8), dow: (new Date(d + 'T12:00:00').getDay() + 6) % 7, total: x?.total || 0, cats: x?.cats || {}, future: d > todayIso, today: d === todayIso }); }
      const prevEnd = addDays(s0, -1);
      // one scale for every week: the biggest day in the last twelve weeks, so stacks and grid lines don't jump as you page
      let scaleMax = 0; for (let k = 0; k < 84; k++) { const d = addDays(todayIso, -k); if (d < shFirst) break; scaleMax = Math.max(scaleMax, shByDay[d]?.total || 0); }
      return { label, days, usual, scaleMax, total: days.reduce((t, d) => t + d.total, 0), hasNext: off < 0, hasPrev: prevEnd >= shFirst, money: c => m(Math.round(c / 100) * 100) };
    }

    // Recap page data: earned, spent, saved, by day and category, for a week or a month
    const flowRows = (api.wrapRows?.() || []).filter(r => r.include !== false && r.date && r.cents > 0);
    function insightData(mode, off) {
      if (off > 0) return null;
      const cats = Object.keys(p.limits).filter(n => p.limits[n] > 0), budgetM = cats.reduce((s, n) => s + p.limits[n], 0);
      let start, end, label, budget, mk = null;
      if (mode === 'M') {
        start = new Date(today.getFullYear(), today.getMonth() + off, 1); end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        label = start.toLocaleDateString('en-US', start.getFullYear() === today.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' }); budget = budgetM; mk = monthKey(start);
      } else {
        const dow = (today.getDay() + 6) % 7;
        start = new Date(today); start.setDate(today.getDate() - dow + off * 7); end = new Date(start); end.setDate(start.getDate() + 6);
        budget = budgetM * 7 / new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
        const a = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const yr = end.getFullYear() === today.getFullYear() ? '' : `, ${end.getFullYear()}`;
        label = start.getMonth() === end.getMonth() ? `${a}–${end.getDate()}${yr}` : `${a} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${yr}`;
      }
      if (off < 0 && iso(end) < firstDay) return null;
      const s0 = iso(start), e0 = iso(end), todayIso = iso(today);
      const inP = flowRows.filter(r => r.date >= s0 && r.date <= e0);
      const exp = inP.filter(r => r.kind === 'expense'), manual = mk ? p.manual.filter(x => x.month === mk) : [];
      const spent = exp.reduce((s, r) => s + r.cents, 0) + manual.reduce((s, x) => s + x.cents, 0);
      const earned = inP.filter(r => r.kind === 'credit').reduce((s, r) => s + r.cents, 0);
      const saved = p.contributions.filter(c => { const d = (c.date || '').slice(0, 10); return d >= s0 && d <= e0; }).reduce((s, c) => s + c.cents, 0);
      const byCat = {}; exp.forEach(r => { byCat[r.category] = (byCat[r.category] || 0) + r.cents; }); manual.forEach(x => { byCat[x.cat] = (byCat[x.cat] || 0) + x.cents; });
      const days = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = iso(d), list = exp.filter(r => r.date === k);
        days.push({ date: k, cents: list.reduce((s, r) => s + r.cents, 0), limited: list.filter(r => cats.includes(r.category)).reduce((s, r) => s + r.cents, 0),
          short: mode === 'W' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          long: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), future: k > todayIso });
      }
      const prevEnd = mode === 'M' ? new Date(start.getFullYear(), start.getMonth(), 0) : new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
      const wrapMonth = window.MW?.PERSONA?.wrapMonth;
      const storyKey = mode === 'M' && (mk === nowKey || mk === wrapMonth) ? mk : null;
      return { label, earned, spent, saved, budget, days, cats: Object.entries(byCat).map(([name, cents]) => ({ name, cents })).sort((a, b) => b.cents - a.cents),
        hasPrev: iso(prevEnd) >= firstDay, hasNext: off < 0, storyKey, storyName: mk === nowKey ? `${start.toLocaleDateString('en-US', { month: 'long' })} so far` : `${start.toLocaleDateString('en-US', { month: 'long' })} Wrapped` };
    }


    /* chala v3: achievements — badges you catch from what you actually did */
    const SEEN_KEY = 'chala-badges-seen-v1';
    function badgeList() {
      const sv = savedTotal(p), lims = Object.entries(p.limits), goals = p.goals.filter(g => !g.archived);
      const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1), prevKey = monthKey(prev), prevBy = api.spendIn(prevKey);
      const prevHasData = (api.months?.() || []).includes(prevKey);
      const pace = today.getDate() / dim;
      const B = (id, name, how, done, icon) => ({ id, name, how, done: !!done, icon });
      return [
        B('plan', 'Planted', 'Made your first plan', p.done, '<path d="M12 21v-9"/><path d="M12 13c0-4 2.6-6.6 7-7 .2 4.4-2.6 7-7 7z"/><path d="M12 15.5c0-3.2-2.2-5.4-6-5.6-.2 3.4 2 5.6 6 5.6z"/>'),
        B('first', 'First save', 'Set money aside for the first time', sv > 0, '<path d="M12 3v12m-4.5-4.5L12 15l4.5-4.5"/><path d="M4.5 17.5v1.8c0 .9.7 1.7 1.7 1.7h11.6c.9 0 1.7-.8 1.7-1.7v-1.8"/>'),
        B('c100', '$100 club', 'Saved $100 in total', sv >= 10000, '<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1.1 1.7 2.6 2.1 2.7.9 2.7 2.2-1.2 2.1-2.7 2.1c-1.2 0-2.3-.6-2.8-1.6M12 6v1.8m0 8.4V18"/>'),
        B('c500', '$500 club', 'Saved $500 in total', sv >= 50000, '<path d="M5 20h14M7 20V10m5 10V6m5 14v-7"/>'),
        B('c1k', 'Four figures', 'Saved $1,000 in total', sv >= 100000, '<path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6-4.5-4.1 6-.7z"/>'),
        B('goal', 'Goal reached', 'Finished saving for a goal', goals.some(g => g.target && savedFor(p, g.id) >= g.target), '<path d="M6 21V4"/><path d="M6 4.5h11l-2.2 3.6L17 11.7H6"/>'),
        B('ontrack', 'On track', 'Every limit on pace this month', lims.length && lims.every(([n, l]) => spentNow(n) <= l * pace), '<path d="M4 17 9.5 11.5l3.5 3.5L20 8"/><path d="M15 8h5v5"/>'),
        B('under', 'Under the line', 'Ended a month under every limit', prevHasData && lims.length && lims.every(([n, l]) => (prevBy[n] || 0) <= l), '<path d="M4 12.5 9 17.5 20 6.5"/>'),
        B('values', 'Knows what matters', 'Picked what you care about', p.values.length, '<path d="M12 20s-7-4.3-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.7 12 20 12 20z"/>'),
        B('habit', 'Habit forming', 'Saved three separate times', p.contributions.length >= 3, '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>'),
        B('dreamer', 'Big dreamer', 'Have three goals going', goals.length >= 3, '<path d="M12 3.5 14 9l5.5.4-4.2 3.5 1.3 5.4L12 15.4l-4.6 2.9 1.3-5.4L4.5 9.4 10 9z"/><path d="M19 3v3m-1.5-1.5h3"/>'),
        B('data', 'Money in', 'Brought in a statement or bank', api.hasData?.(), '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7 14.5h3"/>')
      ];
    }
    function badgesCard() {
      const list = badgeList(), got = list.filter(b => b.done);
      let seen = []; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch {}
      const tints = ['#F6E0D6', '#E7E1F5', '#F6E3E8', '#E1EEDA'];
      return `
<section class="bd" data-rise aria-label="Achievements">
  <div class="bd-top">
    <div><p class="pf-k">Achievements</p><p class="bd-sum"><b>${got.length}</b> of ${list.length} earned</p></div>
  </div>
  <div class="bd-grid">
    ${list.map((b, i) => `<button class="bd-b ${b.done ? 'is-got' : 'is-locked'}${b.done && !seen.includes(b.id) ? ' is-new' : ''}" data-h="badge" data-id="${b.id}" style="--tint:${tints[i % 4]};--i:${i}" aria-label="${esc(b.name)}: ${b.done ? 'earned' : 'locked'}. ${esc(b.how)}">
      <span class="bd-m">${I(b.icon)}</span><span class="bd-n">${esc(b.name)}</span></button>`).join('')}
  </div>
  <p class="bd-note" aria-live="polite">Tap a badge to see how to earn it.</p>
</section>`;
    }
    function catchNewBadges() {
      const fresh = [...el.querySelectorAll('.bd-b.is-new')];
      if (!fresh.length) return;
      let seen = []; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY)) || []; } catch {}
      fresh.forEach(n => seen.push(n.dataset.id));
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch {}
      const note = el.querySelector('.bd-note');
      if (note) note.textContent = fresh.length === 1 ? `New badge: ${fresh[0].querySelector('.bd-n').textContent}` : `${fresh.length} new badges`;
      if (reduce()) { fresh.forEach(n => n.classList.remove('is-new')); return; }
      fresh.forEach((n, j) => {
        const md = n.querySelector('.bd-m');
        md.animate([{ transform: 'translateY(-40px) scale(.3) rotate(-30deg)', opacity: 0 }, { transform: 'translateY(4px) scale(1.18) rotate(8deg)', opacity: 1, offset: .55 }, { transform: 'translateY(-2px) scale(.95) rotate(-4deg)', offset: .78 }, { transform: 'none', opacity: 1 }],
          { duration: 900, delay: 350 + j * 180, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'backwards' });
        setTimeout(() => { n.classList.add('is-shine'); setTimeout(() => n.classList.remove('is-new', 'is-shine'), 1200); }, 1000 + j * 180);
      });
    }


    /* chala v3: a small line icon for each spending category */
    const CAT_ICONS = {
      'food delivery': '<path d="M4.5 9.5h15l-1.7 9.9a1.6 1.6 0 0 1-1.6 1.3H7.8a1.6 1.6 0 0 1-1.6-1.3z"/><path d="m4.5 9.5 2.3-5h10.4l2.3 5"/><path d="m10 4.5-.8 5M14 4.5l.8 5"/>',
      'shopping': '<path d="M6 7.5h12l-1 12.5H7z"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10"/>',
      'cafés': '<path d="M5 9h11v5.5a4.5 4.5 0 0 1-4.5 4.5h-2A4.5 4.5 0 0 1 5 14.5z"/><path d="M16 10.5h1.2a2.3 2.3 0 0 1 0 4.6H16"/><path d="M8.5 3.5c-.6.9.6 1.6 0 2.5M12 3.5c-.6.9.6 1.6 0 2.5"/>',
      'cafes': 'cafés',
      'coffee & matcha': 'cafés',
      'groceries': '<path d="M3.5 5h2.2l2.1 10.2h9.6l1.9-7.2H7"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="16.5" cy="19" r="1.3"/>',
      'rideshare': '<path d="M5 15.5V12l1.8-4.6A1.8 1.8 0 0 1 8.5 6.3h7a1.8 1.8 0 0 1 1.7 1.1L19 12v3.5"/><path d="M4 15.5h16v2.5H4z"/><path d="M5 12h14"/><circle cx="7.8" cy="18" r=".2"/>',
      'entertainment': '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>',
      'subscriptions': '<path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4.5h-4.5"/>',
      'buy now, pay later': '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><path d="M3.5 10h17M7 14.5h3"/>',
      'travel': '<path d="M10.5 13.5 4 11l1.4-1.4 7.4.8 3.7-3.7a1.8 1.8 0 0 1 2.6 2.6l-3.7 3.7.8 7.4-1.4 1.4-2.5-6.5-3 3v2.2L8 21.8l-1.4-3.3-3.3-1.4 1.3-1.3h2.2z"/>',
      'rent & bills': '<path d="M4 11 12 4.5 20 11"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
      'transport': 'rideshare',
      'dining': '<path d="M7 3.5v7a2 2 0 0 0 2 2v8M5 3.5v5a2 2 0 0 0 2 2h0M9 3.5v5"/><path d="M17 20.5V3.5c-2 1-3 3.5-3 6.5v3h3"/>',
      'health': '<path d="M12 20s-7-4.3-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.7 12 20 12 20z"/><path d="M9 12.5h1.8l1-2 1.5 3.5 1-1.5H16"/>',
      'education': '<path d="m3 9 9-4.5L21 9l-9 4.5z"/><path d="M7 11v4.5c1.4 1.3 3 2 5 2s3.6-.7 5-2V11M21 9v5"/>',
      'drinks & nights out': '<path d="M6 4h12l-6 8z"/><path d="M12 12v7.5M8.5 19.5h7"/>'
    };
    const catIcon = n => { let v = CAT_ICONS[String(n).toLowerCase()]; if (v && !v.startsWith('<')) v = CAT_ICONS[v];
      return v || '<path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1.4 1.4 0 0 1 0 2l-6.6 6.6a1.4 1.4 0 0 1-2 0z"/><circle cx="8" cy="8" r="1.3"/>'; };
    const logoBtn = () => `<button class="hm-logo" data-logo aria-label="chala">${window.chalaWord ? chalaWord() : 'chala'}</button>`;
    function homeTab() {
      const goals = p.goals.filter(g => !g.archived), saved = savedTotal(p);
      const goalSum = goals.reduce((t, g) => t + (g.target || 0), 0); // the saving shell fills toward every open goal
      // with the sample statement and nothing saved yet, show a sample goal so the shell has something in it (display only)
      const demoSave = !!api.isSample?.() && !goals.length && !saved;
      const svShown = demoSave ? 21000 : saved, glShown = demoSave ? 50000 : goalSum;
      const since = new Date(p.joinedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const names = Object.keys(p.limits);
      // same rule as the spending jar, so the greeting and the jar always agree
      /* chala v3: the greeting says what this week actually looks like against your usual day, without judging it */
      const paceLine = () => {
        const W = shellData('W', 0); if (!W) return '';
        const past = W.days.filter(x => !x.future), avg = past.length ? W.total / past.length : 0;
        if (!W.total) return 'Nothing spent yet this week.';
        const r = W.usual ? avg / W.usual : 1, per = m(Math.round(avg / 100) * 100);
        return r < .8 ? `About ${per} a day this week, lighter than your usual.` : r <= 1.2 ? `About ${per} a day this week, close to your usual.` : `About ${per} a day this week, a little more than your usual.`;
      };
      const dNow = treeData('M', 0), paceNow = dNow?.budget ? dNow.spent / Math.max(1, dNow.budget * dNow.elapsed) : 0;
      const moodNow = !dNow?.budget ? 'none' : dNow.spent > dNow.budget ? 'wilting' : paceNow > 1.1 ? 'thirsty' : paceNow > .85 ? 'growing' : 'flourishing';
      const NUDGE = { flourishing: 'Spending is comfortably below budget this month.', growing: 'Spending is on pace with your budget this month.', thirsty: 'Spending is running high this month.', wilting: 'You’re over budget this month.', none: 'Set a spending limit to see how your month is going.' };
      const addBtn = (h, label) => `<button class="hm-add" data-h="${h}" aria-label="${label}">${I('<path d="M12 5v14M5 12h14"/>')}</button>`;
      return `
<header class="hm-head" data-mood="${moodNow}" data-rise>
  ${logoBtn()}
  <h1 class="hm-hello"><span class="hm-wb">Welcome back,</span> <span class="hm-who">${esc(first || 'friend')}</span><span class="hm-dot">.</span></h1>
</header>
<section class="mt" aria-label="Your spending, day by day"></section>

<h2 class="hm-k" data-rise>Saving</h2>
<div class="hm-save hm-save-static hm-save-shell" data-rise>
  <span class="hm-save-txt">
    <span class="hm-save-k">So far, you’ve saved</span>
    <b class="hm-save-n" data-count="${svShown}">${m(svShown)}</b>
    <span class="hm-save-s">${demoSave ? `of ${m(glShown)} toward a weekend away <i class="hm-sample">Sample</i>` : goalSum ? `of ${m(goalSum)} toward your ${goals.length === 1 ? 'goal' : 'goals'}` : `since ${esc(since)}`}</span>
  </span>
  <span class="hm-save-meter" data-meter="${svShown}|${glShown}"></span>
</div>

<div class="hm-kh" data-rise><h2 class="hm-k">My spending limits</h2>${addBtn('addlimit', 'Add a limit')}</div>
<div class="hm-limits">
  ${names.map(n => {
    const lim = p.limits[n], sp = spentNow(n), r = lim ? sp / lim : 0, k = r > 1 ? 'over' : r >= .7 ? 'near' : 'ok';
    return `<button class="lc is-${k}" data-h="limit" data-c="${esc(n)}" data-rise aria-label="${esc(n)}: ${m(sp)} spent of ${m(lim)}${k === 'over' ? ', over limit' : ''}">
      <span class="lc-top"><span class="lc-ic" aria-hidden="true">${I(catIcon(n))}</span><i class="lc-dot" aria-hidden="true"></i></span>
      <span class="lc-n">${esc(n)}</span>
      <b class="lc-num">${m(Math.round(sp / 100) * 100)}</b>
      <span class="lc-of">of ${m(lim)}</span>
      <span class="lc-bar"><i style="width:${Math.min(100, r * 100).toFixed(1)}%"></i></span>
    </button>`; }).join('') || '<button class="lc lc-empty" data-h="addlimit"><span>Add your first limit</span></button>'}
</div>

${names.length ? `<div class="hm-kh" data-rise><h2 class="hm-k">Left to spend</h2></div>
<div class="lt" data-rise>
  ${names.map(n => {
    const lim = p.limits[n], sp = spentNow(n), left = lim - sp, f = lim ? Math.max(0, Math.min(1, left / lim)) : 0, k = left <= 0 ? 'over' : f <= .3 ? 'near' : 'ok';
    return `<button class="lt-row is-${k}" data-h="limit" data-c="${esc(n)}" aria-label="${esc(n)}: ${left > 0 ? `${m(left)} left of ${m(lim)}` : left === 0 ? `nothing left of ${m(lim)}` : `${m(-left)} over the ${m(lim)} limit`}">
      <span class="lt-ic" aria-hidden="true">${I(catIcon(n))}</span>
      <span class="lt-main">
        <span class="lt-top"><span class="lt-n">${esc(n)}</span><b class="lt-num">${left > 0 ? `${m(Math.round(left / 100) * 100)} <small>left</small>` : left === 0 ? '$0 <small>left</small>' : `${m(Math.round(-left / 100) * 100)} <small>over</small>`}</b></span>
        <span class="lt-bar"><i style="width:${(f * 100).toFixed(1)}%"></i></span>
      </span>
    </button>`; }).join('')}
</div>` : ''}

<div class="hm-kh" data-rise><h2 class="hm-k">My goals</h2>${addBtn('addgoal', 'Add a goal')}</div>
<div class="hm-goals">
  ${goals.filter(g => !isDone(p, g)).map(g => { const s = savedFor(p, g.id), r = g.target ? Math.min(1, s / g.target) : 0; return `
  <button class="gc" data-h="goal" data-id="${g.id}" data-rise aria-label="${esc(g.title)}: ${m(s)} of ${m(g.target)}">
    <span class="gc-t">${esc(g.title)}</span>
    <span class="gc-n"><b>${m(s)}</b> of ${m(g.target)}</span>
    <span class="gc-bar"><i style="width:${Math.max(2, r * 100).toFixed(1)}%"></i></span>
    <span class="gc-f"><span>${Math.round(r * 100)}% there</span><span>Tap to add funds</span></span>
  </button>`; }).join('') || '<button class="gc gc-empty" data-h="addgoal"><span class="gc-t">Pick a goal</span><span class="gc-n">Something to save toward</span></button>'}
</div>
${(() => { const past = p.goals.filter(g => g.archived || isDone(p, g)); return past.length ? `<button class="gc-past" data-h="pastgoals" data-rise><span class="gc-past-ic">${I('<path d="M4 12.5 9 17.5 20 6.5"/>')}</span><span class="gc-past-t">View past goals</span><span class="gc-past-n">${past.length}</span>${I('<path d="M9.5 6l6 6-6 6"/>')}</button>` : ''; })()}`;
    }
    function wrapsTab() {
      return `
<header class="pf-head" data-rise>${logoBtn()}<p class="pf-k">Wraps</p><h1 class="pf-title">Your recaps.</h1></header>
<div class="wg-host"></div>
<label class="fz-addstmt fz-pdf">${I('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>')}<span class="fz-pdf-t">Add a PDF statement</span><input class="fw-sr" type="file" accept="application/pdf,.pdf" data-pdf aria-label="Choose a PDF statement"></label>
<p class="fz-pdf-st" role="status" aria-live="polite"></p>`;
    }
    function cardsTab() {
      return `
<header class="pf-head" data-rise>${logoBtn()}<p class="pf-k">Cards</p><h1 class="pf-title">Your cards.</h1></header>
<div class="cf" aria-label="Your cards. Tap a card to see its balance, swipe to flip through them."></div>`;
    }
    /* chala v3: profile is just your details, like Faiit's */
    function profileTab() {
      const pen = I('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>');
      const row = (h, title, value, cls = '') => `<button class="pf-row pf-row-simple ${cls}" data-h="${h}"><span class="pf-t">${title}${value ? `<small>${value}</small>` : ''}</span>${cls ? '' : `<span class="pf-go">${pen}</span>`}</button>`;
      return `
<header class="pf-head" data-rise>
  ${logoBtn()}
  <p class="pf-k">Profile</p>
  <h1 class="pf-title">Hi, ${esc(first || 'you')}.</h1>
</header>
<div class="pf-rows">
  ${row('rename', 'Name', esc(user.name || 'Add your name'))}
  ${row('phone', 'Phone number', esc(api.phone() || 'Add your number'))}
</div>
<div class="pf-rows pf-rows-out">${row('signout', 'Sign out', '', 'is-danger')}</div>
`;
    }
    const navHTML = () => `<nav class="fh-nav" aria-label="Main">${NAV.map(([id, label, ic]) => `<button class="fh-nav-btn fj ${id === tab ? 'is-on' : ''}" data-tab="${id}" aria-label="${label}" ${id === tab ? 'aria-current="page"' : ''}>${ic}<span>${label}</span></button>`).join('')}</nav>`;

    function paint() {
      const body = tab === 'wraps' ? wrapsTab() : tab === 'cards' ? cardsTab() : tab === 'profile' ? profileTab() : homeTab();
      el.innerHTML = `<section class="fz fz-tab-${tab}" aria-label="${tab}"><div class="fz-sky" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="fz-page">${body}</div></section>${navHTML()}`;
      el.querySelectorAll('.fj').forEach(jelly);
      el.querySelectorAll('[data-count]').forEach(n => countUp(n, +n.dataset.count, m));
      /* chala v3: logo — tap the shell to open it to its pearl */
      el.querySelector('[data-logo]')?.addEventListener('click', e => {
        const a = e.currentTarget.querySelector('.ch-a'); if (!a || reduce()) return;
        a.classList.remove('ch-open'); void a.offsetWidth; a.classList.add('ch-open');
        clearTimeout(a._t); a._t = setTimeout(() => a.classList.remove('ch-open'), 2800);
      });
      /* chala v3: saving shell — a radial meter of what you've saved toward your goals */
      el.querySelectorAll('[data-meter]').forEach(n => { const [sv, gl] = n.dataset.meter.split('|').map(Number); window.ChalaShells?.meter(n, sv, gl, { money: m }); });
      if (tab === 'profile') catchNewBadges();
      /* chala v3: Recap opens the period the tree is showing: the month, or the week (Monday start) */
      const recapMonth = (md, off) => { if (md === 'M') return monthKey(new Date(today.getFullYear(), today.getMonth() + off, 1)); const s0 = new Date(today); s0.setDate(today.getDate() - (today.getDay() + 6) % 7 + off * 7); return `W:${s0.getFullYear()}-${String(s0.getMonth() + 1).padStart(2, '0')}-${String(s0.getDate()).padStart(2, '0')}`; };
      /* chala v3: money tree on Home */
      if (tab === 'home' && window.ChalaSpend && !window.ChalaTree) ChalaSpend.mount(el.querySelector('.mt'), { mode: home.treeMode, onMode: md => { home.treeMode = md; }, getData: treeData,
        onWrap: () => api.openRecap(null, 'home'), onRecap: (md, off) => api.openBreakdown(recapMonth(md, off), 'home') });
      else if (tab === 'home' && window.ChalaTree) ChalaTree.mount(el.querySelector('.mt'), { mode: home.treeMode, onMode: md => { home.treeMode = md; }, getData: treeData, getShells: shellData,
        onWrapped: () => api.openRecap(null, 'home'), onRecap: (md, off) => api.openBreakdown(recapMonth(md, off), 'home'),
        getStats: (md, off) => insightData(md, off),
        coinText: () => `${m(savedTotal(p))} set aside so far` });
      /* chala v3: swipe-up-to-pay cards */
      if (tab === 'cards' && window.ChalaCards) ChalaCards.mount(el.querySelector('.cf'), { holder: user.name || '' });
      if (tab === 'wraps') {
        const inp = el.querySelector('[data-pdf]'), lab = inp?.closest('.fz-pdf'), stEl = el.querySelector('.fz-pdf-st');
        inp?.addEventListener('change', async () => {
          const f = inp.files?.[0]; inp.value = ''; if (!f || !api.addPdf) return;
          lab.classList.add('is-busy'); inp.disabled = true; stEl.textContent = '';
          const label = lab.querySelector('.fz-pdf-t');
          const res = await api.addPdf(f, x => { label.textContent = `Reading ${f.name.length > 22 ? 'your statement' : f.name}… ${Math.round(x * 100)}%`; });
          lab.classList.remove('is-busy'); inp.disabled = false; label.textContent = 'Add a PDF statement';
          if (res.error) { api.toast(res.error, 'error'); return; }
          api.toast(res.added ? `Added ${res.added} ${res.added === 1 ? 'purchase' : 'purchases'} from ${f.name}${res.dupes ? `. ${res.dupes} already here were skipped` : ''}.` : 'Everything in that PDF was already here.');
          home(el, api, 'wraps');
        });
      }
      if (tab === 'wraps' && window.FaiitGallery) FaiitGallery.render(el.querySelector('.wg-host'), { rows: api.wrapRows?.() || [], sample: api.isSample?.(), tab: home.wrapsView, onTab: t => { home.wrapsView = t; }, onWrap: k => api.openRecap(k, 'wraps'), onBreakdown: k => api.openBreakdown(k, 'wraps') });
      if (!reduce()) el.querySelector('.fz-page')?.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: EASE });
    }

    function swapHero() {
      const old = el.querySelector('.fx-recap'); if (!old) return;
      const tmp = document.createElement('div'); tmp.innerHTML = heroFX().trim(); const nu = tmp.firstElementChild;
      old.replaceWith(nu); nu.querySelectorAll('.fj').forEach(jelly); if (nu.classList.contains('fj')) jelly(nu);
      nu.querySelectorAll('[data-count]').forEach(n => countUp(n, +n.dataset.count, m));
      nu.querySelector(`[data-h="month"]:not([disabled])`)?.focus({ preventScroll: true });
    }

    // ----- popups: a title, one control, one action -----
    const chipsOf = (list, sel, name) => `<div class="fz-choose" role="radiogroup">${list.map(v => `<button type="button" class="fp-chip" role="radio" data-s="pick-${name}" data-v="${v.id}" aria-checked="${v.id === sel}" aria-pressed="${v.id === sel}">${v.icon || ''}<span>${esc(v.label)}</span></button>`).join('')}</div>`;

    /* past purchases in one category: date, vendor, amount, grouped by month */
    function txList(name) {
      const rows = treeRows.filter(r => r.category === name).sort((a, b) => (a.date < b.date ? 1 : -1));
      if (!rows.length) return '';
      const SHOW = 8, months = [];
      rows.forEach((r, i) => { const k = r.date.slice(0, 7); let g = months[months.length - 1]; if (!g || g.k !== k) months.push(g = { k, rows: [], total: 0 }); g.rows.push({ ...r, i }); g.total += r.cents; });
      const mName = k => { const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1); return d.toLocaleDateString('en-US', d.getFullYear() === today.getFullYear() ? { month: 'long' } : { month: 'long', year: 'numeric' }); };
      const day = d => new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `<section class="tx" aria-label="Past ${esc(name.toLowerCase())} purchases">
  <h3 class="tx-h">Past purchases</h3>
  ${months.map(g => `<div class="tx-m${g.rows[0].i >= SHOW ? ' tx-more' : ''}"><p class="tx-mh"><span>${esc(mName(g.k))}</span><span>${m(g.total)} · ${g.rows.length} ${g.rows.length === 1 ? 'purchase' : 'purchases'}</span></p>
    <ul class="tx-list">${g.rows.map(r => `<li class="tx-r${r.i >= SHOW ? ' tx-more' : ''}"><span class="tx-v">${esc(r.merchant || 'Purchase')}<small>${esc(day(r.date))}</small></span><b class="tx-a">${m(r.cents)}</b></li>`).join('')}</ul></div>`).join('')}
  ${rows.length > SHOW ? `<button class="tx-all" type="button" data-s="txmore">Show all ${rows.length}</button>` : ''}
</section>`;
    }
    function editLimit(name) {
      let saved = p.limits[name] || 0;
      const prot = protects(p, name).length > 0;
      const now = () => saved ? `Your limit: <b>${m(saved)}</b> a month` : 'No limit set yet';
      /* chala v3: one field; the save button lives inside it and wakes up only for a new, valid amount */
      const ov = sheet(`<p class="ls-k">Monthly limit</p>
<h2 id="fh-sheet-title" class="fh-sh-title ls-title">${esc(name)}</h2>
<p class="ls-sub">How much do you want to spend on ${esc(name.toLowerCase())} each month?${prot ? ' <span class="fz-tag">Protected</span>' : ''}</p>
<form class="fz-form ls-form" novalidate>
  <div class="ls-field" data-s="focus"><span class="ls-cur">$</span><input id="ls-type" class="ls-type" name="typed" inputmode="numeric" autocomplete="off" value="${saved ? (saved / 100).toFixed(0) : ''}" placeholder="0" aria-label="Monthly limit in dollars for ${esc(name)}" aria-describedby="ls-now" size="5" style="width:${Math.max(1, saved ? String(Math.round(saved / 100)).length : 1) * .62 + .08}em"><span class="ls-per">/ month</span>
    <button class="ms-save" type="submit" aria-label="Save limit" disabled>${SAVE_IC}</button></div>
  <p class="ls-now" id="ls-now" aria-live="polite">${now()}</p>
</form>
<button class="fz-danger" type="button" data-s="remove" ${saved ? '' : 'hidden'}>${I('<path d="M4.5 7h15M9.5 7V4.8c0-.7.5-1.3 1.2-1.3h2.6c.7 0 1.2.6 1.2 1.3V7M6.5 7l.9 12.2c.1.8.7 1.3 1.5 1.3h6.2c.8 0 1.4-.5 1.5-1.3L17.5 7"/><path d="M10 11v5.5M14 11v5.5"/>')}Remove limit</button>
${txList(name)}`, {
        focus: (t, close, w) => { if (!t.closest('.ms-save')) w.querySelector('#ls-type').focus(); },
        input: (t, w) => {
          if (t.name !== 'typed') return;
          t.value = t.value.replace(/[^0-9]/g, '').slice(0, 6); t.style.width = `${Math.max(1, t.value.length) * .62 + .08}em`;
          const v = (+t.value || 0) * 100; w.querySelector('.ms-save').disabled = !(v > 0 && v !== saved);
        },
        submit: (f, close, w) => {
          const btn = w.querySelector('.ms-save'); if (btn.disabled) return;
          const v = (+f.typed.value || 0) * 100; if (!(v > 0)) return;
          p.limits[name] = v; store(p); saved = v; paint();
          f.typed.value = String(v / 100); btn.disabled = true; f.typed.blur();
          w.querySelector('.ls-now').innerHTML = now(); w.querySelector('[data-s="remove"]').hidden = false;
          if (!reduce()) w.querySelector('.ls-now b').animate([{ transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.3,1.4,.5,1)' });
          api.toast(`${name} limit saved: ${m(v)} a month`);
        },
        remove: (t, close) => { delete p.limits[name]; store(p); close(); paint(); api.toast(`${name} limit removed`); },
        txmore: (t, close, w) => { w.querySelector('.tx').classList.add('is-all'); t.remove(); }
      });
      ov.el.querySelectorAll('.fj').forEach(jelly);
    }
    /* chala v3: new limit — pick from what you already spend on (with icons), or write your own */
    function addLimit() {
      const unused = spend.categories.filter(c => !(c.name in p.limits));
      const when = spend.periodLabel ? `in ${esc(spend.periodLabel.split(' ')[0])}` : 'last month';
      const chev = I('<path d="M9.5 6l6 6-6 6"/>');
      const ov = sheet(`<p class="ls-k">Spending limit</p>
<h2 id="fh-sheet-title" class="fh-sh-title nl-title">New limit</h2>
<p class="nl-sub">Set a monthly cap for something you spend on. chala lets you know as you get close.</p>
${unused.length ? `<p class="nl-h">From your spending</p>
<div class="nl-list">${unused.map(c => `<button class="nl-row fj" type="button" data-s="pick" data-c="${esc(c.name)}">
  <span class="nl-ic" aria-hidden="true">${I(catIcon(c.name))}</span>
  <span class="nl-t"><b>${esc(c.name)}</b><small>${m(c.cents)} spent ${when}</small></span>
  <span class="nl-go" aria-hidden="true">${chev}</span></button>`).join('')}</div>` : ''}
<p class="nl-h">${unused.length ? 'Or make your own' : 'Make your own'}</p>
<form class="nl-own" novalidate>
  <div class="nl-own-row">
    <span class="nl-ic nl-ic-own" aria-hidden="true">${I('<path d="M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/><path d="M14 7l3 3"/>')}</span>
    <label class="fw-sr" for="nl-name">Limit name</label>
    <input class="nl-name" id="nl-name" name="name" maxlength="28" placeholder="Name it, like Concerts" autocomplete="off">
  </div>
  <div class="nl-own-row nl-own-amt"><span class="nl-cur">$</span>
    <label class="fw-sr" for="nl-amt">Monthly limit in dollars</label>
    <input class="nl-amt" id="nl-amt" name="amt" inputmode="numeric" placeholder="0" autocomplete="off"><span class="nl-per">a month</span>
  </div>
  <button class="fh-unwrap nl-add fj" type="submit" disabled>Add limit</button>
</form>`, {
        pick: (t, close) => { close(); setTimeout(() => editLimit(t.dataset.c), 260); },
        input: (t, w) => {
          if (t.name === 'amt') t.value = t.value.replace(/[^0-9]/g, '').slice(0, 6);
          const f = w.querySelector('.nl-own'); w.querySelector('.nl-add').disabled = !(f.name.value.trim() && +f.amt.value > 0);
        },
        submit: (f, close) => {
          const name = f.name.value.trim().replace(/\s+/g, ' '), v = (+f.amt.value || 0) * 100;
          if (!name) { f.name.focus(); return; } if (!(v > 0)) { f.amt.focus(); return; }
          const key = Object.keys(p.limits).find(k => k.toLowerCase() === name.toLowerCase()) || spend.categories.find(c => c.name.toLowerCase() === name.toLowerCase())?.name || name;
          p.limits[key] = v; store(p); close(); paint(); api.toast(`${key} limit saved: ${m(v)} a month`);
        }
      });
      ov.el.querySelectorAll('.fj').forEach(jelly);
    }
    function editGoal(id) {
      const g = p.goals.find(x => x.id === id) || { id: uid(), title: '', target: 50000, value: '' }, isNew = !p.goals.some(x => x.id === id);
      let val = g.value;
      if (isNew) {
        sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">New goal</h2>
<form class="fz-form">
  <label class="fw-sr" for="fz-gt">Goal name</label><input class="fz-name" id="fz-gt" name="title" value="" maxlength="40" placeholder="Weekend away" required>
  <label class="fz-money-big"><span class="fw-sr">Target</span><i>$</i><input name="target" inputmode="decimal" value="${g.target / 100}" aria-label="Target amount"></label>
  <p class="sa-gh fz-chips-h">What’s it for?</p>
  ${chipsOf(VALUES, val, 'val')}
  <div class="ng-own"><button type="button" class="fp-chip ng-own-chip" data-s="own" aria-expanded="false">${I('<path d="M12 5v14M5 12h14"/>')}<span>Something else</span></button>
    <label class="fw-sr" for="ng-own">Your own category</label><input class="ng-own-in" id="ng-own" name="own" maxlength="28" placeholder="Type your own, like New laptop" autocomplete="off" hidden></div>
  <button class="fh-unwrap fj" type="submit">Add goal</button>
</form>`, {
          'pick-val': (t, close, w) => { val = val === t.dataset.v ? '' : t.dataset.v; w.querySelectorAll('[data-s="pick-val"]').forEach(b => { const on = b.dataset.v === val; b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); });
            const own = w.querySelector('.ng-own-in'); if (val) { own.hidden = true; own.value = ''; w.querySelector('.ng-own-chip').setAttribute('aria-expanded', 'false'); w.querySelector('.ng-own-chip').hidden = false; } },
          // "Something else": the chip becomes a field to type your own category
          own: (t, close, w) => { t.hidden = true; t.setAttribute('aria-expanded', 'true'); const inp = w.querySelector('.ng-own-in'); inp.hidden = false; inp.focus();
            val = ''; w.querySelectorAll('[data-s="pick-val"]').forEach(b => { b.setAttribute('aria-pressed', false); b.setAttribute('aria-checked', false); }); },
          submit: (f, close) => { const title = f.title.value.trim(); if (!title) { f.title.focus(); return; } const target = cents(f.target.value) || g.target; const own = f.own.value.trim(); p.goals = [...p.goals, { ...g, title, target, value: own ? '' : val, ...(own ? { custom: own } : {}) }]; store(p); close(); paint(); api.toast(`${title} added: ${m(target)} goal`); }
        }).el.querySelectorAll('.fj').forEach(jelly);
        return;
      }
      /* an existing goal: name and target each have their own save button inside the field;
         the button wakes up only when the value is valid and different from what's saved */
      const amt = c => c % 100 ? (c / 100).toFixed(2) : String(c / 100);
      const meta = () => `Target <b>${m(g.target)}</b> · ${m(savedFor(p, g.id))} saved so far`;
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Edit goal</h2>
<p class="fz-sh-meta eg-meta" aria-live="polite">${meta()}</p>
<form class="fz-form eg-form" novalidate>
  <label class="eg-l" for="fz-gt">Goal name</label>
  <div class="ms-wrap"><input class="fz-name" id="fz-gt" name="title" value="${esc(g.title)}" maxlength="40" placeholder="Weekend away" autocomplete="off"><button class="ms-save" type="button" data-s="savetitle" aria-label="Save goal name" disabled>${SAVE_IC}</button></div>
  <label class="eg-l" for="fz-tg">Target amount</label>
  <div class="fz-money-big ms-money"><i>$</i><input id="fz-tg" name="target" inputmode="decimal" value="${amt(g.target)}" autocomplete="off" aria-label="Target amount"><button class="ms-save" type="button" data-s="savetarget" aria-label="Save target amount" disabled>${SAVE_IC}</button></div>
  <p class="sa-gh fz-chips-h">What’s it for?</p>
  ${chipsOf(VALUES, val, 'val')}
</form>
<button class="fz-danger" type="button" data-s="del">${I('<path d="M4.5 7h15M9.5 7V4.8c0-.7.5-1.3 1.2-1.3h2.6c.7 0 1.2.6 1.2 1.3V7M6.5 7l.9 12.2c.1.8.7 1.3 1.5 1.3h6.2c.8 0 1.4-.5 1.5-1.3L17.5 7"/><path d="M10 11v5.5M14 11v5.5"/>')}Delete goal</button>`, {
        input: (t, w) => {
          if (t.name === 'target') {
            let v = t.value.replace(/[^0-9.]/g, ''); const i = v.indexOf('.'); if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, '').slice(0, 2); t.value = v.slice(0, 9);
            const c = cents(t.value); w.querySelector('[data-s="savetarget"]').disabled = !(c > 0 && c !== g.target);
          }
          if (t.name === 'title') { const v = t.value.trim(); w.querySelector('[data-s="savetitle"]').disabled = !(v && v !== g.title); }
        },
        savetarget: (t, close, w) => {
          const inp = w.querySelector('[name="target"]'), c = cents(inp.value); if (!(c > 0) || c === g.target) return;
          g.target = c; delete g.doneAt; if (isDone(p, g)) g.doneAt = new Date().toISOString();
          store(p); paint(); inp.value = amt(c); t.disabled = true; inp.blur();
          w.querySelector('.eg-meta').innerHTML = meta();
          if (!reduce()) w.querySelector('.eg-meta b').animate([{ transform: 'scale(1.15)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.3,1.4,.5,1)' });
          api.toast(`Target saved: ${m(c)}`);
        },
        savetitle: (t, close, w) => {
          const inp = w.querySelector('[name="title"]'), v = inp.value.trim(); if (!v || v === g.title) return;
          g.title = v; store(p); paint(); inp.value = v; t.disabled = true; inp.blur();
          api.toast('Goal name saved');
        },
        submit: (f, close, w) => { // Enter saves the field you're in, if it has something to save
          const which = document.activeElement?.name === 'title' ? 'savetitle' : 'savetarget', btn = w.querySelector(`[data-s="${which}"]`);
          if (btn && !btn.disabled) btn.click();
        },
        'pick-val': (t, close, w) => { val = val === t.dataset.v ? '' : t.dataset.v; g.value = val; store(p); paint(); api.toast(val ? `Tagged: ${VALUES.find(v => v.id === val)?.label || val}` : 'Tag removed'); w.querySelectorAll('[data-s="pick-val"]').forEach(b => { const on = b.dataset.v === val; b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); }); },
        del: (t, close) => { p.goals = p.goals.filter(x => x.id !== g.id); p.contributions = p.contributions.filter(c => c.goalId !== g.id); store(p); close(); paint(); api.toast(`${g.title} deleted`); }
      });
    }
    /* where saved money can go: your goals, plain savings, or something else */
    const BUCKETS = [
      { group: 'Savings', id: 'savings', title: 'General savings', icon: '<path d="M5 11.5a7 6 0 0 1 12.4-3.6L20 7v4l-1.6.8A7 6 0 0 1 15 16.6V19h-2.5v-1.6a8 8 0 0 1-3 0V19H7v-2.6a6 6 0 0 1-2-4.9z"/><circle cx="15.5" cy="10.5" r=".6"/>' },
      { group: 'Savings', id: 'emergency', title: 'Emergency fund', icon: '<path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v6.5a2 2 0 0 1-4 0"/><path d="M12 3.5V2.5"/>' },
      { group: 'Other', id: 'investing', title: 'Investing', icon: '<path d="M4 17 9.5 11.5l3.5 3.5L20 8"/><path d="M15 8h5v5"/>' },
      { group: 'Other', id: 'other', title: 'Something else', icon: '<circle cx="6.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="17.5" cy="12" r="1.2"/>' }
    ];
    function logSave(pre) {
      const goals = p.goals.filter(g => !g.archived && !isDone(p, g));
      let dest = pre || goals[0]?.id || 'savings';
      const tints = ['#F6E0D6', '#E7E1F5', '#F6E3E8', '#E1EEDA'];
      const goalIc = '<path d="M6 21V4"/><path d="M6 4.5h11l-2.2 3.6L17 11.7H6"/>';
      const row = (id, title, sub, icon, tint, bar) => `<button type="button" class="sa-row" role="radio" data-s="pick-dest" data-v="${esc(id)}" aria-checked="${id === dest}">
        <span class="sa-ic" style="background:${tint}">${I(icon)}</span>
        <span class="sa-t">${esc(title)}<small>${sub}</small>${bar != null ? `<span class="sa-bar"><i style="width:${Math.max(2, bar * 100).toFixed(1)}%"></i></span>` : ''}</span>
        <span class="sa-dot" aria-hidden="true"></span></button>`;
      const goalRows = goals.map((g, i) => { const sv = savedFor(p, g.id), r = Math.min(1, sv / (g.target || 1)); return row(g.id, g.title, `${m(sv)} of ${m(g.target)}`, goalIc, tints[i % 4], r); }).join('');
      const groups = ['Savings', 'Other'].map(gr => `<p class="sa-gh">${gr}</p><div class="sa-list">${BUCKETS.filter(b => b.group === gr).map((b, i) => { const sv = savedFor(p, b.id); return row(b.id, b.title, sv ? `${m(sv)} saved` : 'Nothing yet', b.icon, gr === 'Savings' ? ['#E1EEDA', '#E3EAF4'][i] : ['#F6EBD6', '#EEEDEA'][i], null); }).join('')}</div>`).join('');
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Set money aside</h2>
<form class="fz-form sa-form">
  <label class="fz-money-big"><span class="fw-sr">Amount</span><i>$</i><input name="amt" inputmode="decimal" placeholder="0" aria-label="Amount you set aside" required></label>
  <div class="sa" role="radiogroup" aria-label="Put it toward">
    <p class="sa-gh">Personal goals</p>
    <div class="sa-list">${goalRows}<button type="button" class="sa-row sa-new" data-s="newgoal"><span class="sa-ic">${I('<path d="M12 5v14M5 12h14"/>')}</span><span class="sa-t">New goal</span></button></div>
    ${groups}
  </div>
  <button class="fh-unwrap fj" type="submit">Add</button>
</form>`, {
        'pick-dest': (t, close, w) => { dest = t.dataset.v; w.querySelectorAll('[data-s="pick-dest"]').forEach(b => b.setAttribute('aria-checked', b.dataset.v === dest)); },
        newgoal: (t, close) => { close(); setTimeout(() => editGoal('new'), 260); },
        submit: (f, close) => { const c = cents(f.amt.value); if (!c) { f.amt.focus(); return; }
          p.contributions.push({ goalId: dest, cents: c, date: new Date().toISOString() });
          const dg = p.goals.find(x => x.id === dest); if (dg && !dg.doneAt && isDone(p, dg)) dg.doneAt = new Date().toISOString();
          store(p); close(); paint();
          const name = goals.find(g => g.id === dest)?.title || BUCKETS.find(b => b.id === dest)?.title || 'savings';
          api.toast(`Added ${m(c)} to ${name}`); }
      }).el.querySelectorAll('.fj').forEach(jelly);
    }
    function editValues() {
      let sel = [...p.values];
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">What matters to you</h2>
<div class="fp-chips fz-choose">${VALUES.map(v => `<button class="fp-chip" data-s="val" data-id="${v.id}" aria-pressed="${sel.includes(v.id)}">${v.icon}<span>${v.label}</span></button>`).join('')}</div>
<button class="fh-unwrap fz-center" data-s="save">Save</button>`, {
        val: t => { const id = t.dataset.id, on = sel.includes(id); if (!on && sel.length >= 3) { api.toast('Up to 3'); return; } sel = on ? sel.filter(x => x !== id) : [...sel, id]; t.setAttribute('aria-pressed', String(!on)); },
        save: (t, close) => { p.values = sel; store(p); close(); paint(); }
      });
    }

    // ----- garden -----
    function pastGoals() {
      const past = p.goals.filter(g => g.archived || isDone(p, g)).sort((a, b) => (doneOn(p, b) > doneOn(p, a) ? 1 : -1));
      const day = d => d ? new Date(d.length === 10 ? d + 'T12:00' : d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
      const row = g => { const sv = savedFor(p, g.id), done = isDone(p, g);
        return `<div class="pg-row">
          <button type="button" class="pg-main" data-s="open" data-id="${g.id}">
            <span class="sa-ic" style="background:${done ? '#E1EEDA' : '#F0EFEC'}">${I(done ? '<path d="M4 12.5 9 17.5 20 6.5"/>' : '<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12.5h4"/>')}</span>
            <span class="sa-t">${esc(g.title)}<small>${done ? `Completed ${esc(day(doneOn(p, g)))} · ${m(sv)} saved` : `Archived · ${m(sv)} of ${m(g.target)}`}</small></span>
          </button>
          ${g.archived ? `<button type="button" class="pg-restore" data-s="restore" data-id="${g.id}">Restore</button>` : ''}
        </div>`; };
      const done = past.filter(g => isDone(p, g) && !g.archived), arch = past.filter(g => g.archived);
      const ov = sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Past goals</h2>
${done.length ? `<p class="sa-gh">Completed</p><div class="sa-list">${done.map(row).join('')}</div>` : ''}
${arch.length ? `<p class="sa-gh">Archived</p><div class="sa-list">${arch.map(row).join('')}</div>` : ''}`, {
        open: (t, close) => { close(); setTimeout(() => garden(t.dataset.id), 260); },
        restore: (t, close) => { const g = p.goals.find(x => x.id === t.dataset.id); if (g) { g.archived = false; store(p); close(); paint(); api.toast(`${g.title} is back in your goals`); } }
      });
    }
    /* chala v3: a goal is a glass jar of shells. Dashed lines mark 25 / 50 / 75%; each shell is a slice of the goal;
       adding money drops new shells in from the top. (Kept the name garden() so every caller still works.) */
    function garden(id) {
      const g = p.goals.find(x => x.id === id); if (!g) return;
      const N = 30, PER = 5, target = g.target || 1;
      const X0 = 62, X1 = 198, Y0 = 62, Y1 = 222, CW = (X1 - X0) / PER, RH = (Y1 - Y0) / (N / PER);
      const eta = n => { const d = new Date(); d.setMonth(d.getMonth() + Math.ceil(n)); return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
      const calc = () => {
        const sv = savedFor(p, g.id), r = Math.min(1, sv / target), count = sv > 0 ? Math.max(1, Math.round(r * N)) : 0;
        const days = Math.max(1, (Date.now() - new Date(p.joinedAt || Date.now())) / 864e5);
        const perMonth = Math.round((g.weekly ? g.weekly * 4.33 : sv ? sv / Math.max(1, days / 30.4) : 0) / 100) * 100;
        const left = Math.max(0, target - sv);
        const pace = left === 0 ? 'Your jar is full.' : perMonth > 0 ? `On pace for ${eta(left / perMonth)}.` : 'Drop your first shell in below.';
        return { sv, r, count, left, pace };
      };
      // a gentle pile: rows of five, every other row nudged, each shell tipped a little
      const rnd = i => { const x = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
      const TONES = ['#EC7A58', '#F2967A', '#E8673F', '#F4AE93'];
      const slot = i => { const row = Math.floor(i / PER), col = i % PER, off = row % 2 ? CW * .22 : -CW * .1;
        const cx = X0 + CW / 2 + col * CW + off + (rnd(i) - .5) * 5, cy = Y1 - RH / 2 - row * RH + (rnd(i + 99) - .5) * 4;
        return { cx, cy, rot: (rnd(i + 7) - .5) * 44, c: TONES[Math.floor(rnd(i + 3) * TONES.length)] }; };
      const shellAt = i => { const q = slot(i); return `<g class="jr-sh" data-i="${i}" style="transform: translate(${q.cx.toFixed(1)}px, ${q.cy.toFixed(1)}px) rotate(${q.rot.toFixed(1)}deg)"><use href="#jar-shell" x="-16" y="-15" width="32" height="30" fill="${q.c}"></use></g>`; };
      const marks = [.25, .5, .75].map(k => { const y = Y1 - k * (Y1 - Y0); return `<line class="jr-line" x1="${X0 - 4}" x2="${X1 + 4}" y1="${y}" y2="${y}"></line><text class="jr-lab" data-k="${k}" x="${X1 + 20}" y="${y + 4}">${m(Math.round(target * k / 100) * 100)}</text>`; }).join('');
      let st = calc(), w0 = null;
      const passed = () => w0?.querySelectorAll('.jr-lab').forEach(t => t.classList.toggle('on', st.r >= +t.dataset.k));
      const addForm = () => `<form class="fz-log fz-log-plant"><span class="fp-money"><i>$</i><input name="amt" inputmode="decimal" placeholder="0" aria-label="Amount to add"></span><button class="fz-logbtn fj" type="submit">Add</button></form>`;
      const ov = sheet(`
${window.ChalaShells ? ChalaShells.symbol('jar-shell') : ''}
<div class="fg jr">
  <h2 id="fh-sheet-title" class="fh-sh-title">${esc(g.title)}</h2>
  <p class="fz-sh-meta"><b class="fg-sv">${m(st.sv)}</b> of ${m(target)}</p>
  <div class="jr-stage" role="img" aria-label="${Math.round(st.r * 100)}% of the jar filled with shells">
    <svg viewBox="0 0 270 246" class="jr-svg">
      <defs><clipPath id="jr-in"><path d="M${X0} 58 Q${X0} 50 ${X0 + 8} 50 H${X1 - 8} Q${X1} 50 ${X1} 58 V${Y1 - 2} Q${X1} ${Y1 + 6} ${X1 - 10} ${Y1 + 6} H${X0 + 10} Q${X0} ${Y1 + 6} ${X0} ${Y1 - 2}Z"></path></clipPath></defs>
      <ellipse cx="130" cy="238" rx="84" ry="6" fill="rgba(80,50,30,.08)"></ellipse>
      <path class="jr-glass" d="M86 24 H174 V36 Q174 40 180 42 Q${X1 + 8} 48 ${X1 + 8} 64 V${Y1} Q${X1 + 8} ${Y1 + 12} ${X1 - 6} ${Y1 + 12} H${X0 + 6} Q${X0 - 8} ${Y1 + 12} ${X0 - 8} ${Y1} V64 Q${X0 - 8} 48 80 42 Q86 40 86 36Z"></path>
      <g class="jr-pile" clip-path="url(#jr-in)">${Array.from({ length: st.count }, (_, i) => shellAt(i)).join('')}</g>
      ${marks}
      <path class="jr-shine" d="M${X0 + 2} 74 V${Y1 - 30}"></path><path class="jr-shine jr-shine2" d="M${X0 + 12} 80 V100"></path>
      <rect class="jr-lid" x="80" y="12" width="100" height="16" rx="5"></rect><rect class="jr-lid2" x="80" y="22" width="100" height="3" rx="1.5"></rect>
    </svg>
  </div>
  <p class="fz-hint fz-center-t fg-pace" aria-live="polite">${st.pace}</p>
  ${st.left ? addForm() : ''}
  <div class="fg-foot"><button class="fg-btn fg-edit" type="button" data-s="edit">${I('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>')}Edit goal</button><button class="fg-btn fg-arch" type="button" data-s="archive">${I('<rect x="3.5" y="4.5" width="17" height="4" rx="1"/><path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12.5h4"/>')}Archive</button></div>
</div>`, {
        // add: new shells drop in through the mouth of the jar and settle on the pile
        submit: (f, close, w) => {
          const c = cents(f.amt.value); if (!c) { f.amt.focus(); return; }
          const before = st;
          p.contributions.push({ goalId: g.id, cents: c, date: new Date().toISOString() }); store(p); paint();
          st = calc();
          const svEl = w.querySelector('.fg-sv');
          if (reduce()) svEl.textContent = m(st.sv);
          else { const t0 = performance.now(), from = before.sv, to = st.sv; const step = now => { const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); svEl.textContent = m(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
          w.querySelector('.jr-stage').setAttribute('aria-label', `${Math.round(st.r * 100)}% of the jar filled with shells`);
          const pile = w.querySelector('.jr-pile');
          for (let i = before.count, n = 0; i < st.count; i++, n++) {
            pile.insertAdjacentHTML('beforeend', shellAt(i));
            const el = pile.lastElementChild, q = slot(i), sx = 130 + (rnd(i + 21) - .5) * 40;
            if (!reduce()) el.animate([
              { transform: `translate(${sx.toFixed(1)}px, -20px) rotate(${(q.rot - 140).toFixed(1)}deg)`, opacity: 0 },
              { opacity: 1, offset: .12 },
              { transform: `translate(${q.cx.toFixed(1)}px, ${(q.cy + 4).toFixed(1)}px) rotate(${(q.rot + 10).toFixed(1)}deg)`, offset: .78 },
              { transform: `translate(${q.cx.toFixed(1)}px, ${(q.cy - 2).toFixed(1)}px) rotate(${(q.rot - 3).toFixed(1)}deg)`, offset: .9 },
              { transform: `translate(${q.cx.toFixed(1)}px, ${q.cy.toFixed(1)}px) rotate(${q.rot.toFixed(1)}deg)`, opacity: 1 }
            ], { duration: 820, delay: n * 110, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'backwards' });
          }
          passed();
          w.querySelector('.fg-pace').textContent = st.pace;
          f.amt.value = '';
          if (!st.left) { f.remove(); g.doneAt = new Date().toISOString(); store(p); paint(); api.toast(`${g.title}: your jar is full. It’s in past goals now.`); }
          else { api.toast(`Added ${m(c)}`); f.amt.blur(); }
        },
        edit: (t, close) => { close(); setTimeout(() => editGoal(g.id), 260); },
        archive: (t, close) => { g.archived = true; store(p); close(); paint(); api.toast('Archived. It’s in past goals.'); }
      }, 'is-garden');
      w0 = ov.el; passed();
      ov.el.querySelectorAll('.fj').forEach(jelly);
    }

    el.onclick = e => {
      const nav = e.target.closest('[data-tab]');
      if (nav) { const next = nav.dataset.tab; if (next !== tab) { setTimeout(() => { tab = next; api.setTab(tab); paint(); window.scrollTo(0, 0); }, reduce() ? 0 : 160); } return; }
      const t = e.target.closest('[data-h]');
      if (!t && e.target.closest('.fx-recap')) { setTimeout(() => api.openBreakdown?.(recapKey), reduce() ? 0 : 200); return; }
      if (!t) return;
      const k = t.dataset.h;
      if (k === 'tab-profile') { tab = 'profile'; api.setTab(tab); paint(); window.scrollTo(0, 0); return; }
      if (k === 'month') { const ms = recapMonths(), j = ms.indexOf(recapKey) + +t.dataset.d; if (ms[j]) { recapKey = ms[j]; swapHero(); } return; }
      if (k === 'breakdown') { setTimeout(() => api.openBreakdown?.(recapKey), reduce() ? 0 : 200); return; }
      if (k === 'playmonth') { setTimeout(() => api.openRecap(recapKey, tab), reduce() ? 0 : 200); return; }
      if (k === 'recap') setTimeout(() => api.openRecap(), reduce() ? 0 : 220);
      else if (k === 'limit') editLimit(t.dataset.c);
      else if (k === 'addlimit') addLimit();
      else if (k === 'goal') garden(t.dataset.id);
      else if (k === 'restore') { const g = p.goals.find(x => x.id === t.dataset.id); if (g) { g.archived = false; store(p); paint(); } }
      else if (k === 'addgoal') editGoal('new');
      else if (k === 'pastgoals') pastGoals();
      else if (k === 'logsave') logSave();
      else if (k === 'badge') { const b = badgeList().find(x => x.id === t.dataset.id), note = el.querySelector('.bd-note');
        if (b && note) note.innerHTML = `<b>${esc(b.name)}</b> · ${esc(b.how)}.`;
        el.querySelectorAll('.bd-b.is-on').forEach(x => x.classList.remove('is-on')); t.classList.add('is-on');
        if (!reduce()) t.querySelector('.bd-m').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg) scale(1.08)' }, { transform: 'rotate(7deg)' }, { transform: 'none' }], { duration: 480, easing: 'ease-out' }); }
      else if (k === 'values') editValues();
      else if (k === 'chalaplan') { if (window.Chala) Chala.survey({ onExit: () => home(el, api, 'profile') }); }
      else if (k === 'addstatement') api.addStatement();
      else if (k === 'review') api.review();
      else if (k === 'rename') sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Your name</h2><form class="fz-form"><label class="fw-sr" for="fz-nm">Name</label><input class="fz-name" id="fz-nm" name="n" value="${esc(user.name || '')}" maxlength="40" autocomplete="name" required><button class="fh-unwrap fj" type="submit">Save</button></form>`, {
          submit: (f, close) => { const v = f.n.value.trim(); if (!v) return; api.setName(v); user.name = v; close(); home(el, api, tab); api.toast('Name saved'); }
        });
      else if (k === 'phone') sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Phone number</h2><p class="fz-sh-meta">You sign in with this number.</p><form class="fz-form" novalidate><label class="fw-sr" for="fz-ph">Phone number</label><input class="fz-name" id="fz-ph" name="ph" type="tel" inputmode="tel" autocomplete="tel" value="${esc(window.Faiit?.formatPhone ? Faiit.formatPhone(user.iso, user.phone || '') : (user.phone || ''))}" required><p class="cw-sheet-err" role="alert" hidden></p><button class="fh-unwrap fj" type="submit">Save</button></form>`, {
          submit: (f, close) => { const d = f.ph.value.replace(/\D/g, ''), err = f.querySelector('.cw-sheet-err'); if (d.length < 7 || d.length > 15) { err.hidden = false; err.textContent = 'Enter your full phone number.'; f.ph.focus(); return; } window.Faiit?.patch?.({ phone: d }); user.phone = d; close(); home(el, api, tab); api.toast?.('Phone number updated'); }
        });
      else if (k === 'signout') api.signout();
    };
    el.oninput = null;
    paint();
  }

  const needsPlan = () => !load().done;
  const reset = () => { try { localStorage.removeItem(KEY); } catch {} };
  window.FaiitHome = { plan, home, needsPlan, reset, jelly, sheet }; /* chala v3: sheet is shared so the Wrapped's pop-ups match the app */
  home.wrapsView = 'monthly';
  home.treeMode = 'W';
})();
