/* Faiit home: post-Wrapped setup (what matters → 3 goals → limits), the dashboard, Wraps and Profile.
   Core promise: understand what matters to you, and make room for it.
   Everything is stored on this device (localStorage key faiit-plan-v1). */
(() => {
  const KEY = 'faiit-plan-v1';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,.8,.24,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9);
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

  // ---------- shared motion ----------
  // Jelly: squish on press, overshoot and settle on release. Gentle wobble on hover is CSS.
  function jelly(el) {
    if (!el || el.dataset.jelly) return; el.dataset.jelly = '1';
    let a = null;
    el.addEventListener('pointerdown', () => { if (reduce()) return; a?.cancel(); a = el.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.018,.975)' }], { duration: 260, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' }); });
    const release = () => {
      if (reduce() || !a) return; a.cancel();
      a = el.animate([{ transform: 'scale(1.018,.975)' }, { transform: 'scale(.99,1.012)' }, { transform: 'scale(1.004,.997)' }, { transform: 'scale(1,1)' }], { duration: 1100, easing: 'cubic-bezier(.25,.8,.3,1)' });
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
    wrap.addEventListener('click', e => { const t = e.target.closest('[data-s]'); if (!t || t.disabled) return; const k = t.dataset.s; if (k === 'close') close(); else handlers[k]?.(t, close, wrap); });
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
    function limitTiles() {
      const names = Object.keys(p.limits);
      return `
<section class="fx-sec fz-glowsec" aria-labelledby="fx-lim-h">
  <span class="fz-glow fz-glow-lim" aria-hidden="true"><i></i><i></i><i></i></span>
  <h2 class="fx-h" id="fx-lim-h" data-rise>Limits</h2>
  <div class="fx-tiles">
    ${names.map((n, i) => {
      const lim = p.limits[n], sp = spentNow(n), r = lim ? sp / lim : 0, k = r > 1 ? 'over' : r >= .8 ? 'near' : 'ok', prot = protects(p, n).length > 0;
      return `<button class="fx-tile fj tone-${TONES[i % 4]} is-${k}${r >= 1 ? ' is-out' : ''}" data-h="limit" data-c="${esc(n)}" data-rise
        aria-label="${esc(n)}: ${k === 'over' ? `${m(sp - lim)} over` : `${m(lim - sp)} left`} of ${m(lim)}${prot ? ', protected' : ''}">
        <span class="fx-tile-bg" aria-hidden="true"><i></i><i></i></span>
        <span class="fx-tile-name">${esc(n)}${prot ? `<span class="fx-shield" aria-hidden="true">${I('<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>')}</span>` : ''}</span>
        <span class="fx-gauge">${arcFX(r)}<span class="fx-tile-num"><b>${m(Math.abs(lim - sp))}</b><i>${k === 'over' ? 'over' : 'left'}</i></span></span>
      </button>`; }).join('')}
    <button class="fx-tile fx-add fj" data-h="addlimit" data-rise>${I('<path d="M12 5v14M5 12h14"/>')}<span>Add a limit</span></button>
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

    function homeTab() {
      return `
<div class="fx-colors">${heroFX()}${limitTiles()}${savingsBlob()}</div>${room()}`;
    }
    function wrapsTab() {
      return `
<header class="fz-top"><h1 class="fz-title">Wraps</h1></header>
<div class="wg-host"></div>
<button class="fz-addstmt" data-h="addstatement">${I('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>')}Add a statement</button>`;
    }
    function cardsTab() {
      return `
<header class="fz-top"><h1 class="fz-title">Cards</h1></header>
<div class="cc" aria-label="Swipe up to pay"></div>`;
    }
    function profileTab() {
      const vals = p.values.map(valueById).filter(Boolean), arch = p.goals.filter(g => g.archived);
      return `
<header class="fz-top"><h1 class="fz-title">${esc(first || 'You')}</h1></header>
<section class="fz-glass fz-values fz-glowsec">
  <span class="fz-k">What matters to you</span>
  <div class="fx-valchips">${vals.length ? vals.map(v => `<span class="fx-valchip">${v.icon}${esc(v.label)}</span>`).join('') : '<span class="fz-k">Nothing picked yet</span>'}</div>
  <button class="fz-edit fj" data-h="values">Edit</button>
</section>
<section class="fz-glass fz-list">
  <button class="fz-li" data-h="rename"><span>Name</span><b>${esc(user.name || 'Add')}</b></button>
  <div class="fz-li"><span>Phone</span><b>${esc(api.phone())}</b></div>
  <button class="fz-li" data-h="addstatement"><span>Add a statement</span></button>
  <button class="fz-li" data-h="review"><span>Review purchases</span></button>
  <button class="fz-li is-danger" data-h="signout"><span>Sign out</span></button>
</section>
${arch.length ? `<section class="fz-glass fz-list"><h2 class="fz-card-h fz-pad">Archived goals</h2>${arch.map(g => `<div class="fz-li"><span>${esc(g.title)}</span><button class="fz-pill" data-h="restore" data-id="${g.id}">Restore</button></div>`).join('')}</section>` : ''}`;
    }
    const navHTML = () => `<nav class="fh-nav" aria-label="Main">${NAV.map(([id, label, ic]) => `<button class="fh-nav-btn fj ${id === tab ? 'is-on' : ''}" data-tab="${id}" aria-label="${label}" ${id === tab ? 'aria-current="page"' : ''}>${ic}<span>${label}</span></button>`).join('')}</nav>`;

    function paint() {
      const body = tab === 'wraps' ? wrapsTab() : tab === 'cards' ? cardsTab() : tab === 'profile' ? profileTab() : homeTab();
      el.innerHTML = `<section class="fz" aria-label="${tab}"><div class="fz-sky" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="fz-page">${body}</div></section>${navHTML()}`;
      el.querySelectorAll('.fj').forEach(jelly);
      el.querySelectorAll('[data-count]').forEach(n => countUp(n, +n.dataset.count, m));
      /* chala v3: swipe-up-to-pay cards */
      if (tab === 'cards' && window.ChalaCards) ChalaCards.mount(el.querySelector('.cc'), { holder: user.name || '' });
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

    function editLimit(name) {
      const cur = p.limits[name] || 0, last = spend.categories.find(c => c.name === name)?.cents || 0, now = spentNow(name), prot = protects(p, name).length > 0;
      const max = Math.max(last * 2, cur * 1.5, 20000);
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">${esc(name)}</h2>
<p class="fz-sh-meta">${m(now)} spent this month${prot ? '<span class="fz-tag">Protected</span>' : ''}</p>
<form class="fz-form"><output class="fz-big" id="fz-lv">${m(cur)}</output>
<input type="range" name="v" min="0" max="${max}" step="1000" value="${cur}" aria-label="Monthly limit for ${esc(name)}">
<p class="fz-hint" id="fz-ln">${last ? `${m(last)} in ${esc(lastMonthName)}` : ''}</p>
<button class="fh-unwrap fj" type="submit">Save</button></form>
<div class="fz-log"><span class="fp-money"><i>$</i><input name="buy" inputmode="decimal" placeholder="0" aria-label="Purchase amount"></span><button class="fz-logbtn fj" type="button" data-s="buy">Log purchase</button></div>
${p.limits[name] ? '<button class="fz-quiet" type="button" data-s="remove">Remove limit</button>' : ''}`, {
        input: (t, w) => { if (t.name === 'v') w.querySelector('#fz-lv').textContent = m(+t.value); },
        submit: (f, close) => { const v = +f.v.value; if (v > 0) p.limits[name] = v; else delete p.limits[name]; store(p); close(); paint(); },
        remove: (t, close) => { delete p.limits[name]; store(p); close(); paint(); },
        buy: (t, close, w) => { const c = cents(w.querySelector('[name=buy]').value); if (!c) { w.querySelector('[name=buy]').focus(); return; } if (!p.limits[name]) p.limits[name] = cur || last || c; p.manual.push({ cat: name, cents: c, month: nowKey, date: new Date().toISOString() }); store(p); close(); paint(); api.toast(`Logged ${m(c)}`); }
      }).el.querySelectorAll('.fj').forEach(jelly);
    }
    function addLimit() {
      const unused = spend.categories.filter(c => !(c.name in p.limits));
      if (!unused.length) { api.toast('Every category already has a limit'); return; }
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">New limit</h2>
<div class="fz-picklist">${unused.map(c => `<button class="fz-li" data-s="pick" data-c="${esc(c.name)}"><span>${esc(c.name)}</span><b>${m(c.cents)}</b></button>`).join('')}</div>`, {
        pick: (t, close) => { close(); setTimeout(() => editLimit(t.dataset.c), 260); }
      });
    }
    function editGoal(id) {
      const g = p.goals.find(x => x.id === id) || { id: uid(), title: '', target: 50000, value: '' }, isNew = !p.goals.some(x => x.id === id);
      let val = g.value;
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">${isNew ? 'New goal' : 'Edit goal'}</h2>
<form class="fz-form">
  <label class="fw-sr" for="fz-gt">Goal name</label><input class="fz-name" id="fz-gt" name="title" value="${esc(g.title)}" maxlength="40" placeholder="Weekend away" required>
  <label class="fz-money-big"><span class="fw-sr">Target</span><i>$</i><input name="target" inputmode="decimal" value="${g.target / 100}" aria-label="Target amount"></label>
  ${chipsOf(VALUES, val, 'val')}
  <button class="fh-unwrap fj" type="submit">${isNew ? 'Add goal' : 'Save'}</button>
</form>
${isNew ? '' : '<button class="fz-quiet" type="button" data-s="del">Delete goal</button>'}`, {
        'pick-val': (t, close, w) => { val = val === t.dataset.v ? '' : t.dataset.v; w.querySelectorAll('[data-s="pick-val"]').forEach(b => { const on = b.dataset.v === val; b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); }); },
        submit: (f, close) => { const title = f.title.value.trim(); if (!title) { f.title.focus(); return; } const upd = { ...g, title, target: cents(f.target.value) || g.target, value: val }; p.goals = isNew ? [...p.goals, upd] : p.goals.map(x => x.id === g.id ? upd : x); store(p); close(); paint(); },
        del: (t, close) => { p.goals = p.goals.filter(x => x.id !== g.id); p.contributions = p.contributions.filter(c => c.goalId !== g.id); store(p); close(); paint(); }
      }).el.querySelectorAll('.fj').forEach(jelly);
    }
    function logSave() {
      const goals = p.goals.filter(g => !g.archived);
      if (!goals.length) { editGoal('new'); return; }
      let gid = goals[0].id;
      sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Set money aside</h2>
<form class="fz-form">
  <label class="fz-money-big"><span class="fw-sr">Amount</span><i>$</i><input name="amt" inputmode="decimal" placeholder="0" aria-label="Amount you set aside" required></label>
  ${chipsOf(goals.map(g => ({ id: g.id, label: g.title })), gid, 'goal')}
  <button class="fh-unwrap fj" type="submit">Add</button>
</form>`, {
        'pick-goal': (t, close, w) => { gid = t.dataset.v; w.querySelectorAll('[data-s="pick-goal"]').forEach(b => { const on = b.dataset.v === gid; b.setAttribute('aria-pressed', on); b.setAttribute('aria-checked', on); }); },
        submit: (f, close) => { const c = cents(f.amt.value); if (!c) { f.amt.focus(); return; } p.contributions.push({ goalId: gid, cents: c, date: new Date().toISOString() }); store(p); close(); paint(); api.toast(`Added ${m(c)}`); }
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
    function garden(id) {
      const g = p.goals.find(x => x.id === id); if (!g) return;
      const sv = savedFor(p, g.id), target = g.target || 1, r = Math.min(1, sv / target);
      const SLOTS = 10, grown = Math.floor(r * SLOTS), partial = r * SLOTS - grown;
      const days = Math.max(1, (Date.now() - new Date(p.joinedAt || Date.now())) / 864e5);
      const perMonth = Math.round((g.weekly ? g.weekly * 4.33 : sv ? sv / Math.max(1, days / 30.4) : 0) / 100) * 100;
      const left = Math.max(0, target - sv);
      const eta = n => { const d = new Date(); d.setMonth(d.getMonth() + Math.ceil(n)); return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
      const pace = left === 0 ? 'Fully grown.' : perMonth > 0 ? `On pace for ${eta(left / perMonth)}.` : 'Plant your first seed below.';
      const plantSVG = (stage, i) => {
        const x = 18 + i * 32, h = [0, 34, 66, 100][stage], sway = (i % 3) - 1;
        if (!stage) return `<ellipse cx="${x}" cy="150" rx="5.5" ry="3.4" fill="rgba(120,150,120,.32)"/>`;
        const flower = stage === 3 ? `<g transform="translate(0 ${-h})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="6" ry="10" transform="rotate(${a}) translate(0 -9)" fill="${['#f3cfdc', '#f2e3a8', '#cfdcf5', '#f2d5c4'][i % 4]}"/>`).join('')}<circle r="5" fill="#e9c35c"/></g>` : '';
        const bud = stage === 2 ? `<ellipse cy="${-h}" rx="5" ry="7" fill="#bfe3b4"/>` : '';
        return `<g class="fg-plant" style="--d:${i * 60}ms" transform="translate(${x} 150)"><path d="M0 0 C ${sway * 4} ${-h * .4} ${-sway * 4} ${-h * .7} 0 ${-h}" stroke="#86b98f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M0 ${-h * .45} q 13 -8 19 -2 q -9 9 -19 2z" fill="#a9d6a0"/>${stage > 1 ? `<path d="M0 ${-h * .68} q -13 -8 -19 -2 q 9 9 19 2z" fill="#93c98d"/>` : ''}${bud}${flower}</g>`;
      };
      const plants = Array.from({ length: SLOTS }, (_, i) => i < grown ? 3 : i === grown && partial > 0 ? Math.max(1, Math.round(partial * 3)) : 0);
      const cutCat = spend.categories.filter(c => !protects(p, c.name).length && c.name !== 'Rent & bills').sort((a, b) => b.cents - a.cents)[0];
      const cut = cutCat ? Math.max(500, Math.round(cutCat.cents * .15 / 500) * 500) : 0;
      const weekly = Math.max(500, Math.round(left / 12 / 500) * 500);
      const ideas = [];
      if (left && cut) ideas.push({ k: 'cut', t: `Trim ${esc(cutCat.name)} by ${m(cut)} a month`, a: 'Set limit' });
      if (left) ideas.push({ k: 'plan', t: `Set aside ${m(weekly)} a week`, a: g.weekly === weekly ? 'Active' : 'Start' });
      const ev = evidence(g);
      const ov = sheet(`
<div class="fg">
  <h2 id="fh-sheet-title" class="fh-sh-title">${esc(g.title)}</h2>
  <p class="fz-sh-meta"><b>${m(sv)}</b> of ${m(target)}</p>
  <div class="fg-bed" role="img" aria-label="${grown} of ${SLOTS} plants grown, each one 10% of the goal">
    <svg viewBox="0 0 330 166" class="fg-svg"><path d="M0 151 Q 165 140 330 151 V166 H0z" fill="rgba(150,180,140,.18)"/>${plants.map(plantSVG).join('')}</svg>
    <span class="fg-count">${grown}/${SLOTS}</span>
  </div>
  <p class="fz-hint fz-center-t">${pace}</p>
  ${ev.length ? `<div class="fz-chips fz-chips-row">${ev.map(e => `<span class="fz-chip is-${e.k}">${e.t}</span>`).join('')}</div>` : ''}
  ${left ? `<form class="fz-log fz-log-plant"><span class="fp-money"><i>$</i><input name="amt" inputmode="decimal" placeholder="0" aria-label="Amount to plant"></span><button class="fz-logbtn fj" type="submit">Plant</button></form>` : ''}
  ${ideas.length ? `<div class="fz-ideas">${ideas.map(i => `<div class="fz-idea fz-glass"><span>${i.t}</span><button class="fz-pill" type="button" data-s="idea-${i.k}" ${i.a === 'Active' ? 'disabled' : ''}>${i.a}</button></div>`).join('')}</div>` : ''}
  <div class="fz-foot"><button class="fz-quiet" type="button" data-s="edit">Edit</button><button class="fz-quiet" type="button" data-s="archive">Archive</button></div>
</div>`, {
        submit: (f, close) => { const c = cents(f.amt.value); if (!c) { f.amt.focus(); return; } p.contributions.push({ goalId: g.id, cents: c, date: new Date().toISOString() }); store(p); close(); paint(); api.toast(`Planted ${m(c)}`); setTimeout(() => garden(g.id), 280); },
        edit: (t, close) => { close(); setTimeout(() => editGoal(g.id), 260); },
        archive: (t, close) => { g.archived = true; store(p); close(); paint(); api.toast('Archived. It’s in Profile.'); },
        'idea-cut': (t, close) => { const cur = p.limits[cutCat.name]; p.limits[cutCat.name] = Math.max(1000, (cur || cutCat.cents) - cut); store(p); close(); paint(); api.toast(`${cutCat.name} limit set to ${m(p.limits[cutCat.name])}`); },
        'idea-plan': (t, close) => { g.weekly = weekly; store(p); close(); paint(); api.toast(`${m(weekly)} a week toward ${g.title}`); setTimeout(() => garden(g.id), 280); }
      }, 'is-garden');
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
      else if (k === 'logsave') logSave();
      else if (k === 'values') editValues();
      else if (k === 'addstatement') api.addStatement();
      else if (k === 'review') api.review();
      else if (k === 'rename') sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Your name</h2><form class="fz-form"><label class="fw-sr" for="fz-nm">Name</label><input class="fz-name" id="fz-nm" name="n" value="${esc(user.name || '')}" maxlength="40" autocomplete="name" required><button class="fh-unwrap fj" type="submit">Save</button></form>`, {
          submit: (f, close) => { const v = f.n.value.trim(); if (!v) return; api.setName(v); user.name = v; close(); home(el, api, tab); }
        });
      else if (k === 'signout') api.signout();
    };
    el.oninput = null;
    paint();
  }

  const needsPlan = () => !load().done;
  const reset = () => { try { localStorage.removeItem(KEY); } catch {} };
  window.FaiitHome = { plan, home, needsPlan, reset, jelly };
  home.wrapsView = 'monthly';
})();
