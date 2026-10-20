/* chala v3 — the Wrapped, rebuilt on Faiit's interactive episode.
   First the story, told only from what the statement shows (counts, dates, merchants, amounts):
   DoorDash as a case file and a binge-watched season, matcha math, the subscription lineup.
   Then the plan, inside the same story: what next month should feel like, spending limits you drag,
   what you're making room for, goals tailored to the statement, and an envelope you seal them in.

   Every screen keeps its own state in S, so Back and Next never lose a guess, a pick or an amount.
   Navigation lives in its own bar at the bottom. Controls never move the story; only the bar,
   the arrow keys, and taps on the two quiet narration screens do. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const PLAN = 'faiit-plan-v1', EP = 'faiit-episodes-v1', OBJ = 'faiit-objections-v1';
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const uid = () => Math.random().toString(36).slice(2, 9);
  const dayOf = d => new Date(d + 'T12:00:00').getDay();
  const dateLabel = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const usd = c => '$' + Math.round(c / 100).toLocaleString('en-US');
  const round5 = c => Math.max(500, Math.round(c / 500) * 500);
  const sum = list => list.reduce((s, r) => s + r.cents, 0);
  const listJoin = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1);

  const RX = {
    delivery: /doordash|door dash|uber ?eats|grubhub|postmates|caviar|seamless/i,
    matcha: /matcha|kettl|cha cha/i,
    streaming: /netflix|hulu|disney|\bmax\b|hbo|spotify|youtube|apple tv|peacock|paramount|crunchyroll|twitch|prime video|audible|apple music|tidal|pandora/i,
    subs: /snapchat|capcut|icloud|apple subscriptions|apple\.com|chatgpt|openai|adobe|notion|canva|duolingo|patreon|substack|bereal|vsco|grammarly|dropbox|microsoft 365|linkedin premium|tinder|hinge|bumble|game pass|playstation plus|nintendo online/i,
    fees: /overdraft|\bnsf\b|insufficient|late fee|atm fee|service fee|maintenance fee/i,
    bnpl: /afterpay|klarna|affirm|sezzle|quadpay/i
  };
  // Categories a limit makes sense for (not rent, bills or groceries)
  const WANTS = ['Food delivery', 'Cafés', 'Shopping', 'Subscriptions', 'Dining', 'Transport', 'Travel'];
  const SHORT = { 'Food delivery': 'Delivery', 'Cafés': 'Cafés', Shopping: 'Shopping', Subscriptions: 'Subscriptions', Dining: 'Eating out', Transport: 'Rides', Travel: 'Travel' };
  const LIQ = { 'Food delivery': 'var(--coral)', 'Cafés': '#a9cf78', Shopping: 'var(--peri)', Subscriptions: 'var(--lilac)', Dining: '#f2c46b', Transport: '#8fd0c4', Travel: '#9cc3f2' };
  const PACE = { gentle: .2, real: .35, cold: .6 };

  // ---------- reading the month ----------
  function analyse(month) {
    const ex = month.rows.filter(r => r.kind === 'expense' && r.cents > 0 && r.include !== false);
    const days = month.days || new Date(+month.key.slice(0, 4), +month.key.slice(5, 7), 0).getDate();
    const del = ex.filter(r => r.category === 'Food delivery' || RX.delivery.test(r.merchant || ''));
    const cafes = ex.filter(r => r.category === 'Cafés');
    const matcha = ex.filter(r => RX.matcha.test(r.merchant || ''));
    const shop = ex.filter(r => r.category === 'Shopping');
    const gro = ex.filter(r => r.category === 'Groceries');
    const isSub = r => r.category === 'Subscriptions' || RX.streaming.test(r.merchant || '') || RX.subs.test(r.merchant || '');
    const subRows = ex.filter(isSub);
    const subs = Object.values(subRows.reduce((o, r) => { const k = r.merchant; if (!o[k] || o[k].date < r.date) o[k] = { name: k, cents: r.cents, date: r.date, streaming: RX.streaming.test(k) }; return o; }, {})).sort((a, b) => b.cents - a.cents);
    const fees = ex.filter(r => RX.fees.test(r.merchant || ''));
    const bnpl = ex.filter(r => RX.bnpl.test(r.merchant || ''));
    const cats = Object.values(ex.reduce((o, r) => { if (r.category === 'Rent & bills') return o; (o[r.category] ??= { name: r.category, cents: 0, n: 0 }); o[r.category].cents += r.cents; o[r.category].n++; return o; }, {})).sort((a, b) => b.cents - a.cents);
    const count = (list, f) => { const o = {}; list.forEach(r => { const k = f(r); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
    const spendDays = new Set(ex.filter(r => r.category !== 'Rent & bills').map(r => r.date));
    return { ex, days, del, cafes, matcha, shop, gro, subs, fees, bnpl, cats, count, noSpend: days - spendDays.size };
  }
  // Longest run of consecutive days with at least one order
  function longestRun(list, key) {
    const ds = [...new Set(list.map(r => r.date))].sort();
    let best = { start: null, end: null, len: 0 }, s = 0;
    for (let k = 0; k < ds.length; k++) {
      if (k > 0 && (new Date(ds[k] + 'T12:00') - new Date(ds[k - 1] + 'T12:00')) / 864e5 !== 1) s = k;
      if (k - s + 1 > best.len) best = { start: ds[s], end: ds[k], len: k - s + 1 };
    }
    return best;
  }
  const restaurant = r => (r.merchant || '').split(' · ')[1] || r.merchant;
  const appOf = r => (r.merchant || '').split(' · ')[0];

  // ---------- the episode ----------
  function play(el, api) {
    const month = api.month || window.FaiitWrap.sampleMonth();
    const A = analyse(month), m = api.money;
    // A month ("September") or, for the first Wrapped, the whole statement ("the last 7 weeks", "the past year")
    const short = month.short || month.label.split(' ')[0], title = month.title || short;
    const single = !month.range;
    const perMonth = c => single ? c : Math.round(c / Math.max(1, A.days / 30.44));
    const eps = read(EP), prevKey = Object.keys(eps).filter(k => k < month.key).sort().pop(), prev = prevKey ? eps[prevKey] : null;
    const objections = read(OBJ);
    const plan0 = (() => { const p = read(PLAN); return { done: false, values: [], goals: [], limits: {}, contributions: [], manual: [], ...p }; })();
    const memo = { key: month.key, label: month.label, delivery: A.del.length };
    const S = {}; // every screen's state, keyed by beat id

    const app = A.del.length ? A.count(A.del, appOf)[0][0] : 'Delivery';
    const brand = /uber/i.test(app) ? '#06C167' : /grubhub/i.test(app) ? '#FF8000' : /postmates/i.test(app) ? '#111111' : '#FF3008';
    const appName = `<span class="cw-brand">${esc(app)}</span>`;
    const run = longestRun(A.del);
    const cafeWord = A.matcha.length >= 3 ? 'matcha' : 'coffee';
    const outlier = (() => { if (A.del.length < 3) return null; const s = [...A.del].sort((a, b) => a.cents - b.cents), med = s[Math.floor(s.length / 2)].cents, top = s.at(-1); return top.cents >= med * 2.2 ? top : null; })();

    // Which stories this month can tell
    const beats = [];
    const B = (id, fn, o = {}) => beats.push({ id, fn, ...o });
    B('cold', cold);
    if (A.cats.length >= 2) B('bite', bite);
    if (A.del.length >= 3) B('case', caseFile);
    if (outlier) B('objection', objection);
    if (run.len >= 3) B('binge', binge);
    if (A.matcha.length >= 3 || A.cafes.length >= 3) B('matcha', matchaMath);
    if (A.shop.length >= 2) B('box', unboxing);
    if (A.subs.length >= 2) B('lineup', lineup);
    if (beats.length < 3) B('top', topMerchant);
    B('turn', turn);
    B('mode', mode);
    B('limits', limits);
    B('goals', goals);
    B('finale', finale);
    const at = id => beats.findIndex(b => b.id === id);
    // What each screen asks for before the story moves on (Back always works)
    const GATE = {
      bite: ['Pick one to continue', '[data-a="bite"]'], case: ['Lock in your guess to continue', '[data-a="lock"]'],
      objection: ['Object, or let it stand, to continue', '.ew-court-act'], binge: ['Tap an episode to continue', '[data-a="ep"]'],
      matcha: ['Lock in your guess to continue', '[data-a="lock"]'], box: ['Press and hold the box to continue', '.ew-parcel'],
      lineup: ['Make a guess to continue', '[data-a="guess"]'], mode: ['Pick one to continue', '[data-a="mode"]'],
      goals: ['Pick a goal, then tap the seal', '.cw-gpills,.ew-seal']
    };

    let i = 0, cleanup = [];
    el.innerHTML = `<section class="ew cw" aria-label="Your ${esc(month.label)} Wrapped">
  <header class="ew-top">
    <div class="ew-bars" aria-hidden="true">${beats.map(() => '<span><i></i></span>').join('')}</div>
    <div class="ew-row"><span class="ew-brand">${esc(month.brand || `${short} Wrapped`)}${month.sample ? ' · sample data' : ''}</span>
      <button class="ew-x" data-w="close" aria-label="Close Wrapped">${I('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>
  </header>
  <main class="ew-stage" aria-live="polite"></main>
  <p class="cw-sr" aria-live="polite"></p>
  <p class="cw-gate" aria-live="polite"></p>
</section>`;
    const root = el.querySelector('.cw'), stage = el.querySelector('.ew-stage');
    document.documentElement.classList.add('fh-locked');

    // ----- helpers -----
    const after = (ms, fn) => { const id = setTimeout(() => { if (root.isConnected) fn(); }, ms); cleanup.push(() => clearTimeout(id)); };
    function fit(node, max) {
      if (!node) return; const box = node.parentElement; let size = max; node.style.fontSize = size + 'px';
      while (size > 18 && (node.scrollWidth > box.clientWidth || node.getBoundingClientRect().right > window.innerWidth - 8)) { size -= 2; node.style.fontSize = size + 'px'; }
    }
    function countTo(node, to, fmt, ms = 1100) {
      if (reduce()) { node.textContent = fmt(to); return; }
      const t0 = performance.now(); const step = now => { if (!node.isConnected) return; const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3); node.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
    }
    const rise = (nodes, gap = 90, base = 0) => { if (reduce()) return; [...nodes].filter(Boolean).forEach((n, k) => n.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: base + k * gap, easing: EASE, fill: 'backwards' })); };
    const reveal = (n, sel) => { const x = n.querySelector(sel); if (x) x.hidden = false; return x; };

    function bars() { root.querySelectorAll('.ew-bars span').forEach((s, k) => { s.classList.toggle('is-done', k < i); s.classList.toggle('is-on', k === i); }); }
    function navState() {
      root.querySelector('.cw-sr').textContent = `Screen ${i + 1} of ${beats.length}`;
      const g = GATE[beats[i].id], blocked = !!(g && current && !current.ready), last = i === beats.length - 1;
      const gate = root.querySelector('.cw-gate');
      gate.classList.toggle('is-blocked', blocked); gate.hidden = last;
      gate.innerHTML = blocked ? `<span>${g[0]}</span>` : `<span>Tap right to continue</span>${I('<path d="M9.5 6l6 6-6 6"/>')}`;
    }
    function nudge() {
      const g = GATE[beats[i].id], gate = root.querySelector('.cw-gate');
      if (reduce()) return;
      gate.animate([{ transform: 'translateX(-50%)' }, { transform: 'translateX(calc(-50% - 8px))' }, { transform: 'translateX(calc(-50% + 8px))' }, { transform: 'translateX(calc(-50% - 4px))' }, { transform: 'translateX(-50%)' }], { duration: 360 });
      stage.querySelector('.ew-scene:last-child')?.querySelectorAll(g[1]).forEach(t => { if (t.offsetParent) t.animate([{ transform: 'none' }, { transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 420, easing: EASE }); });
    }
    let current = null;
    function show(n, dir = 1) {
      if (n < 0) return;
      if (n >= beats.length) { exit(); return; }
      cleanup.forEach(f => f()); cleanup = [];
      i = n; bars();
      const def = beats[i], s = (S[def.id] ??= {});
      const restored = !!s.seen; s.seen = true;
      const beat = def.fn(s); current = beat; beat.ready = false;
      root.dataset.genre = beat.genre; root.classList.toggle('is-dark', !!beat.dark); root.style.setProperty('--brand', brand);
      const old = stage.firstElementChild;
      const node = document.createElement('div'); node.className = `ew-scene is-${beat.genre}`; node.innerHTML = beat.scene;
      if (old && !reduce()) old.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-24 * dir}px)` }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove());
      else old?.remove();
      stage.append(node);
      if (!reduce()) node.animate([{ opacity: 0, transform: `translateX(${28 * dir}px)` }, { opacity: 1, transform: 'none' }], { duration: 480, delay: old ? 140 : 0, easing: EASE, fill: 'backwards' });
      node.querySelectorAll('[data-fit]').forEach(x => fit(x, +x.dataset.fit));
      node.querySelectorAll('.ew-range').forEach(r => { const set = () => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); set(); r.addEventListener('input', set); });
      beat.mount?.(node, restored);
      navState();
      const h = node.querySelector('h1,h2'); h?.setAttribute('tabindex', '-1'); h?.focus({ preventScroll: true });
    }
    const ready = () => { if (!current || current.ready) return; current.ready = true; navState(); };
    const next = () => { if (GATE[beats[i].id] && current && !current.ready) { nudge(); return; } show(i + 1, 1); }, back = () => show(i - 1, -1);

    function exit() {
      cleanup.forEach(f => f());
      commit();
      write(EP, { ...read(EP), [month.key]: memo });
      document.documentElement.classList.remove('fh-locked');
      if (reduce()) { api.onExit(); return; }
      root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' }).finished.then(api.onExit, api.onExit);
    }

    // ----- input: like a story. Tap the right side for the next screen, the left side to go back.
    // Taps on a control (a chip, a jar, an envelope, a field) only work that control. -----
    const isControl = t => t.closest('button,input,select,textarea,label,a,[role=slider],[data-ctl],form,.sh-rail');
    let dragged = false, x0 = 0, y0 = 0;
    root.addEventListener('pointerdown', e => { dragged = false; x0 = e.clientX; y0 = e.clientY; });
    root.addEventListener('pointermove', e => { if (Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 12) dragged = true; });
    root.addEventListener('click', e => {
      if (e.target.closest('[data-w="close"]')) { exit(); return; }
      if (e.target.closest('[data-w="next"]')) { next(); return; }
      if (dragged || isControl(e.target) || !e.target.closest('.ew-stage')) return;
      if (String(getSelection?.() || '').length) return;
      (e.clientX < window.innerWidth * .33 ? back : next)();
    });
    // A screenshot (keyboard shortcuts on a computer: Print Screen, Cmd+Shift+3/4/5, Win+Shift+S) brings up
    // the share card for the screen they're on. Phones don't tell web pages about screenshots.
    const SHOT_CARD = { crime: 'orders', court: 'orders', stream: 'orders', matcha: 'coffees', box: 'cart', receipt: 'pie', lineup: 'pie', letter: 'note', turn: 'note', limits: 'pie', question: 'pie', cold: 'orders', finale: 'orders' };
    let shotT = 0;
    const isShot = e => e.key === 'PrintScreen' || (e.shiftKey && (e.metaKey || e.ctrlKey) && ['3', '4', '5', '#', '$', '%', 's', 'S'].includes(e.key));
    const onShot = () => {
      if (Date.now() - shotT < 1500 || document.querySelector('.sh-view,.fh-sheet-wrap,.sh-save') || !window.FaiitShare?.open) return; shotT = Date.now();
      setTimeout(() => { if (!root.isConnected) return; FaiitShare.open(shareCtx(), SHOT_CARD[root.dataset.genre] || 'orders', { toast: api.toast }, { title: 'Got a screenshot? Share the poster version.' }); }, 600);
    };
    const onKeyUp = e => { if (!root.isConnected) { document.removeEventListener('keyup', onKeyUp); return; } if (e.key === 'PrintScreen') onShot(); };
    document.addEventListener('keyup', onKeyUp);
    const onKey = e => {
      if (!root.isConnected) { document.removeEventListener('keydown', onKey); return; }
      if (isShot(e)) { onShot(); return; }
      if (document.querySelector('.sh-view,.fh-sheet-wrap,.sh-save')) return;
      if (e.key === 'Escape') { exit(); return; }
      if (e.target.closest?.('input,textarea,select,[role=slider],[contenteditable]')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    };
    document.addEventListener('keydown', onKey);

    // =================================================================
    // The story
    // =================================================================
    function cold() {
      const lines = A.ex.slice(0, 7);
      const spend = sum(A.ex.filter(r => r.category !== 'Rent & bills'));
      const callback = prev?.note ? `Last episode you sealed “${prev.note}.” Let’s see how it went.` : '';
      return { genre: 'cold', scene: `
<div class="ew-cold">
  <p class="ew-kicker">Previously, on your bank statement</p>
  <h1 class="ew-h">${esc(title)}.<br><em>${A.ex.length} purchases.</em><br>One main character.</h1>
  <div class="ew-printer" aria-hidden="true"><span class="ew-slot"></span><div class="ew-paper">${lines.map(r => `<p><span>${esc(dateLabel(r.date))}</span><span>${esc(r.merchant)}</span><b>${m(r.cents)}</b></p>`).join('')}<p class="ew-cut">· · ·</p></div></div>
  <p class="ew-sub">You spent <b>${m(spend)}</b> ${single ? `in ${esc(short)}` : `over ${esc(short)}`}, not counting rent and bills. Here’s where it went.${callback ? ' ' + esc(callback) : ''}</p>
  <p class="ew-hint">Tap the right side to keep going, the left side to go back.</p>
</div>`, mount: (n, restored) => { if (restored) n.querySelector('.ew-paper').style.animation = 'none'; else rise(n.querySelectorAll('.ew-kicker,.ew-h,.ew-sub,.ew-hint'), 140); } };
    }

    // ----- The receipt: guess what took the biggest bite -----
    function bite(s) {
      const cats = A.cats.slice(0, 4), max = cats[0].cents, tones = ['coral', 'peri', 'lilac', 'lime'];
      return { genre: 'receipt', scene: `
<div class="ew-bite">
  <p class="ew-kicker">The receipt</p>
  <h1 class="ew-h">What took <em>the biggest bite?</em></h1>
  <div class="ew-opts" role="radiogroup" aria-label="Pick one">${[...cats].sort((a, b) => a.name.localeCompare(b.name)).map(c => `<button class="ew-chip" role="radio" aria-checked="false" data-a="bite" data-c="${esc(c.name)}">${esc(c.name)}</button>`).join('')}</div>
  <article class="ew-receipt" hidden>
    <p class="ew-receipt-h">${esc(title)}</p>
    ${cats.map((c, k) => `<div class="ew-rrow${k === 0 ? ' is-top' : ''}" style="--w:${Math.max(6, c.cents / max * 100)}%;--k:${k}"><span>${esc(c.name)}</span><b>${m(c.cents)}</b><i class="t-${tones[k]}"></i></div>`).join('')}
    <span class="ew-barcode" aria-hidden="true"></span>
  </article>
  <p class="ew-verdict" hidden></p>
</div>`, mount: (n, restored) => {
        const answer = (pick, anim) => {
          n.querySelectorAll('[data-a="bite"]').forEach(x => { x.setAttribute('aria-checked', String(x.dataset.c === pick)); x.disabled = true; if (x.dataset.c === cats[0].name) x.classList.add('is-answer'); });
          const r = reveal(n, '.ew-receipt'); if (anim) r.classList.add('is-printing'); else r.querySelectorAll('i').forEach(x => { x.style.animation = 'none'; });
          after(anim && !reduce() ? 1300 : 0, () => { const v = reveal(n, '.ew-verdict'); v.innerHTML = pick === cats[0].name ? `Called it. <b>${esc(cats[0].name)}</b> led the month at ${m(cats[0].cents)}.` : `Plot twist. It was <b>${esc(cats[0].name)}</b>, not ${esc(pick)}.`; if (anim) rise([v]); ready(); });
        };
        if (s.pick) answer(s.pick, false);
        n.addEventListener('click', e => { const b = e.target.closest('[data-a="bite"]'); if (!b || s.pick) return; s.pick = b.dataset.c; answer(s.pick, true); });
      } };
    }

    // ----- True crime: DoorDash -----
    function caseFile(s) {
      const del = A.del, orders = del.length, max = Math.max(40, Math.ceil(orders * 1.8 / 10) * 10);
      const days = A.count(del, r => dayOf(r.date)), places = A.count(del, restaurant);
      const evidence = [
        { k: 'Most active day', v: `${DAYS[days[0][0]]}s`, s: `${days[0][1]} orders` },
        { k: 'Longest streak', v: `${run.len} ${run.len === 1 ? 'day' : 'days'}`, s: run.len > 1 ? `${dateLabel(run.start)}–${run.end.slice(0, 7) === run.start.slice(0, 7) ? +run.end.slice(8) : dateLabel(run.end)}` : 'in a row' },
        { k: 'Prime suspect', v: places[0][0], s: `${places[0][1]} of ${orders} orders` }
      ];
      s.guess ??= Math.round(max / 3); s.opened ??= [];
      return { genre: 'crime', dark: true, scene: `
<div class="ew-crime">
  <p class="ew-kicker">Case file · ${esc(app)}</p>
  <h1 class="ew-h">The kitchen<br><em>that never gets used.</em></h1>
  <div class="ew-q">
    <p class="ew-ask">How many times did you order ${esc(app)} in ${esc(short)}?</p>
    <output class="ew-guess"><b data-fit="96">${s.guess}</b><span>times</span></output>
    <input class="ew-range" type="range" min="0" max="${max}" value="${s.guess}" aria-label="Your guess">
    <button class="ew-go" data-a="lock">Lock it in</button>
  </div>
  <div class="ew-reveal" hidden>
    <div class="ew-pile" aria-hidden="true"></div>
    <p class="ew-big"><b data-fit="104">${orders}</b><span>orders, ${m(sum(del))}</span></p>
    <p class="ew-verdict"></p>
    <div class="ew-evid" role="list">${evidence.map((e, k) => `<button class="ew-env" role="listitem" data-a="open" data-k="${k}" aria-label="Open evidence ${k + 1}"><span class="ew-env-front">${I('<path d="M4 7h16v10H4z"/><path d="m4 7 8 6 8-6"/>')}<span>Evidence ${k + 1}</span></span><span class="ew-env-back"><small>${esc(e.k)}</small><b>${esc(e.v)}</b><small>${esc(e.s)}</small></span></button>`).join('')}</div>
    <p class="ew-hint">Tap each envelope</p>
  </div>
</div>`, mount: (n, restored) => {
        const range = n.querySelector('.ew-range'), out = n.querySelector('.ew-guess b');
        range.addEventListener('input', () => { s.guess = +range.value; out.textContent = range.value; });
        const open = (b, anim) => { b.classList.add('is-open'); b.setAttribute('aria-label', b.querySelector('.ew-env-back').textContent.trim()); if (!anim) b.querySelectorAll('span').forEach(x => { x.style.transition = 'none'; }); };
        const lock = anim => {
          const g = s.guess; memo.deliveryGuess = g;
          n.querySelector('.ew-q').hidden = true; const rv = reveal(n, '.ew-reveal');
          fit(rv.querySelector('.ew-big b'), 104);
          const pile = rv.querySelector('.ew-pile'), shown = Math.min(orders, 24);
          pile.innerHTML = Array.from({ length: shown }, (_, k) => `<i style="--k:${k};--r:${((k * 37) % 31) - 15}deg;--x:${((k * 53) % 200) - 100}px${anim ? '' : ';animation:none'}"></i>`).join('');
          if (anim) countTo(rv.querySelector('.ew-big b'), orders, String, 1300);
          const off = Math.abs(g - orders);
          const v = rv.querySelector('.ew-verdict');
          v.textContent = off === 0 ? 'Exactly right. You know yourself.' : off <= 3 ? `You guessed ${g}. Close. Suspiciously close.` : g < orders ? `You guessed ${g}. The receipts say ${orders}.` : `You guessed ${g}. You’re harder on yourself than the evidence.`;
          if (anim) { v.style.opacity = 0; after(reduce() ? 0 : 1400, () => { v.style.opacity = ''; rise([v, rv.querySelector('.ew-evid'), rv.querySelector('.ew-hint')], 120); }); }
          s.opened.forEach(k => open(n.querySelectorAll('[data-a="open"]')[k], false));
          if (s.opened.length === 3) n.querySelector('.ew-reveal .ew-hint').textContent = 'Case closed.';
          ready();
        };
        if (s.locked) lock(false);
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a]'); if (!b) return;
          if (b.dataset.a === 'lock' && !s.locked) { s.locked = true; lock(true); }
          if (b.dataset.a === 'open' && !b.classList.contains('is-open')) {
            open(b, true); s.opened.push(+b.dataset.k);
            if (s.opened.length === 3) n.querySelector('.ew-reveal .ew-hint').textContent = 'Case closed.';
          }
        });
      } };
    }

    // ----- Objection: one specific, unusual order -----
    function objection(s) {
      const o = outlier, id = `${o.date}|${o.merchant}|${o.cents}`;
      const avg = sum(A.del) / A.del.length;
      const reasons = [['group', 'It was for a group', 'Sustained. Logged as a group order.'], ['work', 'Work. I’ll be paid back', 'Sustained. Marked as a work expense.'], ['treat', 'It was a planned treat', 'Sustained. A treat, on purpose.']];
      return { genre: 'court', scene: `
<div class="ew-court">
  <p class="ew-kicker">Exhibit A</p>
  <article class="ew-exhibit"><span>${esc(dateLabel(o.date))}</span><b data-fit="72">${m(o.cents)}</b><span>${esc(restaurant(o))}</span></article>
  <h2 class="ew-h ew-h-sm">One order, ${Math.round(o.cents / avg)}× your usual.<br><em>Dinner for one?</em></h2>
  <div class="ew-court-act">
    <button class="ew-objection" data-a="object">Objection!</button>
    <button class="ew-quiet" data-a="none">No objection</button>
  </div>
  <div class="ew-reasons" hidden role="group" aria-label="What was it?">${reasons.map(r => `<button class="ew-chip" data-a="reason" data-r="${r[0]}">${esc(r[1])}</button>`).join('')}</div>
  <p class="ew-ruling" hidden></p>
</div>`, mount: n => {
        const ruling = t => { n.querySelector('.ew-court-act').hidden = true; n.querySelector('.ew-reasons').hidden = true; const p = reveal(n, '.ew-ruling'); p.textContent = t; ready(); };
        const prior = s.ruling || reasons.find(x => x[0] === objections[id])?.[2];
        if (prior) { if (objections[id]) n.querySelector('.ew-exhibit').classList.add('is-stamped'); ruling(prior); }
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a]'); if (!b) return;
          if (b.dataset.a === 'object') { n.querySelector('.ew-court-act').hidden = true; const r = reveal(n, '.ew-reasons'); rise(r.children, 70); }
          if (b.dataset.a === 'none') { s.ruling = 'Noted. It stays on the record.'; ruling(s.ruling); }
          if (b.dataset.a === 'reason') { const r = reasons.find(x => x[0] === b.dataset.r); objections[id] = r[0]; write(OBJ, objections); s.ruling = r[2]; n.querySelector('.ew-exhibit').classList.add('is-stamped'); ruling(r[2]); }
        });
      } };
    }

    // ----- Now streaming: the longest delivery run as a season you binge-watched -----
    function binge(s) {
      const inRun = A.del.filter(r => r.date >= run.start && r.date <= run.end).sort((a, b) => a.date.localeCompare(b.date));
      const show8 = inRun.slice(0, 8), total = sum(inRun);
      const perDay = A.count(inRun, r => r.date), twoParts = perDay.filter(x => x[1] > 1).length;
      s.flipped ??= [];
      const rng = `${dateLabel(run.start)}–${run.end.slice(0, 7) === run.start.slice(0, 7) ? +run.end.slice(8) : dateLabel(run.end)}`;
      return { genre: 'stream', scene: `
<div class="cw-binge">
  <p class="ew-kicker">Now streaming</p>
  <h1 class="ew-h">${appName}:<br><em>the series.</em></h1>
  <p class="ew-sub">${run.len} nights in a row, ${esc(rng)}: <b>${inRun.length} orders, ${m(total)}</b>${twoParts ? `. ${twoParts} nights had two orders` : ''}.</p>
  <div class="cw-eps" role="list">${show8.map((r, k) => `<button class="cw-ep" role="listitem" data-a="ep" data-k="${k}" aria-pressed="false" aria-label="Episode ${k + 1}, ${esc(dateLabel(r.date))}. Tap to see what aired.">
    <span class="f"><small>EP ${k + 1}</small><i class="cw-play" aria-hidden="true"></i><b>${esc(dateLabel(r.date))}</b></span>
    <span class="b"><small>${esc(DAYS[dayOf(r.date)].slice(0, 3))} ${esc(dateLabel(r.date))}</small><b>${esc(restaurant(r))}</b><em>${m(r.cents)}</em></span></button>`).join('')}</div>
  <p class="ew-hint">Tap an episode to see what aired</p>
  <p class="ew-verdict" hidden>That one run cost <b>${m(total)}</b>, about <b>${m(Math.round(total / run.len))}</b> a night.</p>
</div>`, mount: n => {
        const flip = (b, anim) => { b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); b.setAttribute('aria-label', b.querySelector('.b').textContent.replace(/\s+/g, ' ').trim()); if (!anim) b.querySelectorAll('span').forEach(x => { x.style.transition = 'none'; }); };
        const progress = () => { const h = n.querySelector('.ew-hint'); h.textContent = s.flipped.length >= show8.length ? 'Season watched.' : `${s.flipped.length} of ${show8.length} watched`; if (s.flipped.length) { const v = n.querySelector('.ew-verdict'); if (v.hidden) { v.hidden = false; rise([v]); } ready(); } };
        s.flipped.forEach(k => flip(n.querySelectorAll('[data-a="ep"]')[k], false));
        if (s.flipped.length) progress();
        n.addEventListener('click', e => { const b = e.target.closest('[data-a="ep"]'); if (!b || b.classList.contains('is-on')) return; flip(b, true); s.flipped.push(+b.dataset.k); progress(); });
      } };
    }

    // ----- Matcha math: guess the total, then the cups line up -----
    function matchaMath(s) {
      const list = (cafeWord === 'matcha' ? A.matcha : A.cafes).slice().sort((a, b) => a.date.localeCompare(b.date));
      const total = sum(list), avg = total / list.length, top = A.count(list, r => r.merchant)[0];
      const byDay = A.count(list, r => r.date).filter(x => x[1] > 1).map(x => x[0]).sort();
      const hi = Math.max(5000, Math.ceil(total * 2 / 1000) * 1000);
      const yearly = total / A.days * 365;
      s.guess ??= Math.round(hi / 3 / 500) * 500;
      const cup = k => `<button class="cw-cup" data-a="cup" data-k="${k}" style="--k:${k}" aria-label="${esc(dateLabel(list[k].date))}, ${esc(list[k].merchant)}, ${m(list[k].cents)}"><svg viewBox="0 0 40 52" aria-hidden="true"><path d="M7.5 21h25l-2.4 27.2a3 3 0 0 1-3 2.8H12.9a3 3 0 0 1-3-2.8z" fill="var(--liq)"/><path d="M6 10h28l-3.6 38.2a3 3 0 0 1-3 2.8H12.6a3 3 0 0 1-3-2.8z" fill="none" stroke="rgba(34,32,29,.55)" stroke-width="1.6"/><rect x="3.5" y="5.5" width="33" height="6" rx="3" fill="#fff" stroke="rgba(34,32,29,.55)" stroke-width="1.6"/><path d="M23 5.5 27.5 .8" stroke="#2b2730" stroke-width="2.4" stroke-linecap="round"/></svg></button>`;
      return { genre: 'matcha', scene: `
<div class="cw-matcha" style="--liq:${cafeWord === 'matcha' ? '#9cc56a' : '#b98058'}">
  <p class="ew-kicker">${cafeWord === 'matcha' ? 'Matcha math' : 'Coffee math'}</p>
  <h1 class="ew-h">How much went to <em>${cafeWord}?</em></h1>
  <div class="ew-q">
    <div class="ew-guessrow"><output class="ew-guess"><b>${usd(s.guess)}</b><span>my guess</span></output></div>
    <input class="ew-range" type="range" min="0" max="${hi}" step="500" value="${s.guess}" aria-label="Your guess for ${cafeWord} in ${esc(short)}">
    <button class="ew-go" data-a="lock">Lock it in</button>
  </div>
  <div class="ew-reveal" hidden>
    <p class="ew-big"><b data-fit="96">${m(total)}</b><span>${list.length} cups</span></p>
    <div class="cw-cups" role="list">${list.map((_, k) => cup(k)).join('')}</div>
    <p class="cw-cupnote" aria-live="polite">Tap a cup to see when you bought it</p>
    <p class="ew-verdict"></p>
    <ul class="cw-facts">
      <li><b>${m(Math.round(avg))}</b><span>a cup</span></li>
      <li><b>${top[1]}×</b><span>${esc(top[0])}</span></li>
      <li><b>${usd(yearly)}</b><span>a year at this pace</span></li>
    </ul>
    ${byDay.length ? `<p class="ew-sub">Two in one day on ${esc(listJoin(byDay.slice(0, 3).map(dateLabel)))}.</p>` : ''}
  </div>
</div>`, mount: n => {
        const range = n.querySelector('.ew-range'), out = n.querySelector('.ew-guess b');
        range.addEventListener('input', () => { s.guess = +range.value; out.textContent = usd(s.guess); });
        const lock = anim => {
          n.querySelector('.ew-q').hidden = true; const rv = reveal(n, '.ew-reveal');
          fit(rv.querySelector('.ew-big b'), 96); if (anim) countTo(rv.querySelector('.ew-big b'), total, m, 1100);
          if (!anim) rv.querySelectorAll('.cw-cup').forEach(c => { c.style.animation = 'none'; });
          const off = Math.abs(s.guess - total);
          rv.querySelector('.ew-verdict').innerHTML = off <= 1000 ? `You guessed ${usd(s.guess)}. Barista-level accuracy.` : s.guess < total ? `You guessed ${usd(s.guess)}. It was <b>${usd(total - s.guess)}</b> more than you thought.` : `You guessed ${usd(s.guess)}. Less than you feared.`;
          if (anim) rise([...rv.children].filter(x => !x.classList.contains('cw-cups')), 120, 300);
          if (s.cup != null) pickCup(s.cup);
          ready();
        };
        const pickCup = k => { const r = list[k]; n.querySelectorAll('.cw-cup').forEach((c, j) => c.classList.toggle('is-on', j === k)); n.querySelector('.cw-cupnote').innerHTML = `<b>${esc(DAYS[dayOf(r.date)])}, ${esc(dateLabel(r.date))}</b> · ${esc(r.merchant)} · ${m(r.cents)}`; };
        if (s.locked) lock(false);
        n.addEventListener('click', e => {
          if (e.target.closest('[data-a="lock"]') && !s.locked) { s.locked = true; lock(true); return; }
          const c = e.target.closest('[data-a="cup"]'); if (c) { s.cup = +c.dataset.k; pickCup(s.cup); }
        });
      } };
    }

    // ----- Unboxing: shopping, hold to open -----
    function unboxing(s) {
      const big = [...A.shop].sort((a, b) => b.cents - a.cents)[0];
      return { genre: 'box', scene: `
<div class="ew-box">
  <p class="ew-kicker">A package arrived</p>
  <h1 class="ew-h">Shopping, <em>sealed.</em></h1>
  <button class="ew-parcel" data-hold aria-label="Press and hold to open the package">
    <svg class="ew-ring" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54"/><circle class="on" cx="60" cy="60" r="54" pathLength="100"/></svg>
    <span class="ew-carton" aria-hidden="true"><i class="lid"></i><i class="tape"></i></span>
  </button>
  <p class="ew-hint">Press and hold to open</p>
  <div class="ew-reveal" hidden>
    <p class="ew-big"><b data-fit="104">${A.shop.length}</b><span>orders, ${m(sum(A.shop))}</span></p>
    <p class="ew-verdict">The biggest one: <b>${m(big.cents)}</b> at ${esc(big.merchant)} on ${esc(dateLabel(big.date))}.</p>
  </div>
</div>`, mount: n => {
        const p = n.querySelector('.ew-parcel'), ring = n.querySelector('.ew-ring .on'); let t0 = 0, raf = 0;
        const DUR = reduce() ? 300 : 1000;
        const open = anim => { s.open = true; cancelAnimationFrame(raf); p.classList.add('is-open'); p.disabled = true; n.querySelector('.ew-hint').style.visibility = 'hidden'; const rv = reveal(n, '.ew-reveal'); fit(rv.querySelector('.ew-big b'), 104); if (anim) { countTo(rv.querySelector('.ew-big b'), A.shop.length, String, 700); rise(rv.children, 140, 200); } ready(); };
        const tick = now => { const k = Math.min(1, (now - t0) / DUR); ring.style.strokeDasharray = `${k * 100} 100`; p.style.setProperty('--shake', k); if (k >= 1) open(true); else raf = requestAnimationFrame(tick); };
        const start = e => { if (s.open) return; e.preventDefault(); t0 = performance.now(); p.classList.add('is-pressing'); raf = requestAnimationFrame(tick); };
        const stop = () => { if (s.open) return; cancelAnimationFrame(raf); p.classList.remove('is-pressing'); ring.style.strokeDasharray = '0 100'; };
        p.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => p.addEventListener(t, stop));
        p.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !s.open) { e.preventDefault(); open(true); } });
        cleanup.push(() => cancelAnimationFrame(raf));
        if (s.open) open(false);
      } };
    }

    // ----- The lineup: streaming and subscriptions, keep or cut each one -----
    const SUBC = [[/netflix/i, '#E50914', '#fff'], [/spotify/i, '#1DB954', '#000'], [/hulu/i, '#1CE783', '#000'], [/disney/i, '#113CCF', '#fff'], [/youtube/i, '#FF0000', '#fff'], [/\bmax\b|hbo/i, '#002BE7', '#fff'], [/snapchat/i, '#FFFC00', '#000'], [/capcut/i, '#000000', '#fff'], [/apple|icloud/i, '#E8E8ED', '#000'], [/chatgpt|openai/i, '#10A37F', '#fff'], [/amazon|prime/i, '#00A8E1', '#fff'], [/peacock/i, '#000', '#fff'], [/paramount/i, '#0064FF', '#fff']];
    const subColor = n => { const c = SUBC.find(x => x[0].test(n)); return c ? `background:${c[1]};color:${c[2]}` : ''; };
    const subsCut = () => A.subs.filter(x => (S.lineup?.cut || []).includes(x.name));
    function lineup(s) {
      const n0 = A.subs.length, monthly = sum(A.subs), streaming = A.subs.filter(x => x.streaming);
      const opts = [...new Set([Math.max(1, n0 - 2), n0, n0 + 2, n0 + 4])].sort((a, b) => a - b);
      s.cut ??= [];
      const tally = () => { const cut = subsCut(), keep = monthly - sum(cut); return cut.length ? `Keeping <b>${m(keep)}</b> a month. Cutting ${cut.length} saves <b>${usd(sum(cut) * 12)}</b> a year.` : `All kept: <b>${m(monthly)}</b> a month, <b>${usd(monthly * 12)}</b> a year.`; };
      return { genre: 'lineup', dark: true, scene: `
<div class="cw-lineup">
  <p class="ew-kicker">Tonight’s lineup</p>
  <h1 class="ew-h">Streaming and <em>everything that renews.</em></h1>
  <div class="ew-q">
    <p class="ew-ask">How many subscriptions charged you in ${esc(short)}?</p>
    <div class="ew-opts" role="radiogroup" aria-label="Your guess">${opts.map(v => `<button class="ew-chip" role="radio" aria-checked="false" data-a="guess" data-v="${v}">${v}</button>`).join('')}</div>
  </div>
  <div class="ew-reveal" hidden>
    <p class="ew-verdict"></p>
    <ul class="cw-guide">${A.subs.map(x => `<li class="cw-ch" data-n="${esc(x.name)}">
      <span class="cw-ch-ic${x.streaming ? ' is-tv' : ''}" style="${subColor(x.name)}" aria-hidden="true">${x.streaming ? I('<rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M8 20.5h8"/><path d="m10.5 9 4 2-4 2z"/>') : I('<path d="M17 2.5l3 3-3 3"/><path d="M4 11V9.5a4 4 0 0 1 4-4h12"/><path d="M7 21.5l-3-3 3-3"/><path d="M20 13v1.5a4 4 0 0 1-4 4H4"/>')}</span>
      <span class="cw-ch-t"><b>${esc(x.name)}</b><small>${x.streaming ? 'Streaming' : 'App'} · renewed ${esc(dateLabel(x.date))}</small></span>
      <span class="cw-ch-p">${m(x.cents)}</span>
      <span class="cw-kc" role="group" aria-label="${esc(x.name)}"><button data-a="keep" aria-pressed="true">Keep</button><button data-a="cut" aria-pressed="false">Cut</button></span>
    </li>`).join('')}</ul>
    <p class="cw-tally" aria-live="polite">${tally()}</p>
    ${streaming.length ? `<p class="ew-sub">Streaming alone: ${esc(listJoin(streaming.map(x => x.name)))}, ${m(sum(streaming))} a month.</p>` : ''}
  </div>
</div>`, mount: n => {
        const paint = () => { n.querySelectorAll('.cw-ch').forEach(li => { const cut = s.cut.includes(li.dataset.n); li.classList.toggle('is-cut', cut); li.querySelector('[data-a="keep"]').setAttribute('aria-pressed', String(!cut)); li.querySelector('[data-a="cut"]').setAttribute('aria-pressed', String(cut)); }); n.querySelector('.cw-tally').innerHTML = tally(); };
        const answer = anim => {
          n.querySelectorAll('[data-a="guess"]').forEach(x => { x.setAttribute('aria-checked', String(+x.dataset.v === s.guess)); x.disabled = true; if (+x.dataset.v === n0) x.classList.add('is-answer'); });
          const rv = reveal(n, '.ew-reveal');
          rv.querySelector('.ew-verdict').innerHTML = `${s.guess === n0 ? 'Exactly.' : `Not ${s.guess}.`} <b>${n0}</b> renewals, <b>${m(monthly)}</b> a month. Tap Cut on anything you forgot you had.`;
          if (anim) rise([rv.querySelector('.ew-verdict'), ...rv.querySelectorAll('.cw-ch'), rv.querySelector('.cw-tally'), rv.querySelector('.ew-sub')], 70);
          paint(); ready();
        };
        if (s.guess != null) answer(false);
        n.addEventListener('click', e => {
          const g = e.target.closest('[data-a="guess"]'); if (g && s.guess == null) { s.guess = +g.dataset.v; answer(true); return; }
          const k = e.target.closest('[data-a="keep"],[data-a="cut"]'); if (!k) return;
          const name = k.closest('.cw-ch').dataset.n; s.cut = s.cut.filter(x => x !== name); if (k.dataset.a === 'cut') s.cut.push(name);
          paint();
        });
      } };
    }

    function topMerchant() {
      const merch = A.count(A.ex, r => r.merchant)[0];
      return { genre: 'sitcom', scene: `
<div class="ew-sitcom">
  <p class="ew-kicker">Recurring character</p>
  <p class="ew-big"><b data-fit="104">${merch[1]}×</b></p>
  <h1 class="ew-h">${esc(merch[0])}.<br><em>You two talk a lot.</em></h1>
</div>`, mount: () => ready() };
    }

    // ----- The turn: the jokes stop, the plan starts -----
    function turn() {
      const facts = [];
      if (A.noSpend > 0) facts.push(`<b>${A.noSpend}</b> ${A.noSpend === 1 ? 'day' : 'days'} you spent nothing at all.`);
      if (A.gro.length) facts.push(`<b>${A.gro.length}</b> grocery ${A.gro.length === 1 ? 'run' : 'runs'}. You kept feeding yourself.`);
      if (A.fees.length) facts.push(`<b>${m(sum(A.fees))}</b> in bank fees. That one’s fixable.`);
      if (!facts.length) facts.push(`<b>${A.ex.length}</b> purchases, and you made it through every one.`);
      return { genre: 'turn', dark: true, scene: `
<div class="ew-turn">
  <p class="ew-kicker">Okay. The jokes are done.</p>
  <h1 class="ew-h">What would you like to <em>make room for?</em></h1>
  <p class="ew-sub">Three quick steps turn what you just saw into your plan.</p>
  <ol class="cw-steps">
    <li><b>How next month should feel</b><span>One tap</span></li>
    <li><b>Your monthly limits</b><span>Suggested from your spending</span></li>
    <li><b>What you’re saving for</b><span>Up to three goals, sealed</span></li>
  </ol>
</div>`, mount: (n, restored) => { if (!restored && !reduce()) [...n.querySelectorAll('.ew-kicker,.ew-h,.ew-sub,.cw-steps li')].forEach((x, k) => x.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 700, delay: 150 + k * 260, easing: EASE, fill: 'backwards' })); } };
    }

    // =================================================================
    // The plan
    // =================================================================
    const MODES = [
      { k: 'less', t: 'Less on autopilot', d: 'Same life, fewer taps.', ic: '<path d="M5 12h9"/><path d="m11 8 4 4-4 4"/><path d="M19 5v14"/>' },
      { k: 'save', t: 'Saving for something', d: 'Money with a job before it’s spent.', ic: '<path d="M6 21V4"/><path d="M6 4.5h11l-2.2 3.6L17 11.7H6"/>' },
      { k: 'love', t: 'More on what I love', d: 'Spend on purpose, cut the rest.', ic: '<path d="M12 20s-7-4.3-7-9.4A4 4 0 0 1 12 8a4 4 0 0 1 7 2.6C19 15.7 12 20 12 20z"/>' }
    ];
    const PACES = [['gentle', 'Ease in', 'about 20% less'], ['real', 'Real change', 'about 35% less'], ['cold', 'Cold turkey', 'about 60% less']];
    function mode(s) {
      s.pace ??= 'real';
      const topWant = A.cats.find(c => WANTS.includes(c.name));
      const reply = k => k === 'less' ? (A.del.length ? `Then ${appName} is the one to watch: ${A.del.length} orders in ${esc(short)}.` : topWant ? `Then ${esc(topWant.name)} is the one to watch: ${m(topWant.cents)} in ${esc(short)}.` : '')
        : k === 'save' ? 'Then your limits will save money, and your goals will give it a job.'
          : 'Then we’ll protect what you love and trim what you don’t notice.';
      return { genre: 'question', scene: `
<div class="cw-mode">
  <p class="ew-kicker">Your turn</p>
  <h1 class="ew-h ew-h-sm">What should your next month <em>feel like?</em></h1>
  <div class="cw-opts" role="radiogroup" aria-label="What should next month feel like">${MODES.map(o => `<button class="cw-opt" role="radio" aria-checked="false" data-a="mode" data-k="${o.k}"><span class="cw-opt-ic">${I(o.ic)}</span><span><b>${esc(o.t)}</b><small>${esc(o.d)}</small></span></button>`).join('')}</div>
  <p class="cw-reply" aria-live="polite"></p>
  <p class="ew-ask">How big a change?</p>
  <div class="cw-seg" role="radiogroup" aria-label="How big a change">${PACES.map(p => `<button role="radio" aria-checked="false" data-a="pace" data-k="${p[0]}"><b>${p[1]}</b><small>${p[2]}</small></button>`).join('')}</div>
</div>`, mount: n => {
        const paint = () => {
          n.querySelectorAll('[data-a="mode"]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.k === s.mode)));
          n.querySelectorAll('[data-a="pace"]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.k === s.pace)));
          n.querySelector('.cw-reply').innerHTML = s.mode ? reply(s.mode) : '';
          if (s.mode) ready();
        };
        paint();
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a="mode"],[data-a="pace"]'); if (!b) return;
          if (b.dataset.a === 'mode') { s.mode = b.dataset.k; const r = n.querySelector('.cw-reply'); paint(); rise([r]); }
          else { s.pace = b.dataset.k; paint(); }
        });
      } };
    }

    // ----- Limits: drag each jar to the amount you want -----
    const limitCands = (() => {
      // the biggest wants, and subscriptions whenever the lineup showed them
      const cats = A.cats.filter(c => WANTS.includes(c.name) && c.name !== 'Subscriptions').map(c => ({ ...c, cents: perMonth(c.cents) })).filter(c => c.cents >= 1000).sort((a, b) => b.cents - a.cents);
      const subs = A.subs.length >= 2 ? [{ name: 'Subscriptions', cents: sum(A.subs), n: A.subs.length }] : [];
      return [...cats.slice(0, 4 - subs.length), ...subs];
    })();
    const suggestLimit = c => {
      const cut = PACE[S.mode?.pace || 'real'];
      if (c.name === 'Subscriptions' && S.lineup?.cut?.length) return Math.max(100, sum(A.subs) - sum(subsCut()));
      return round5(c.cents * (1 - cut));
    };
    function limitItems() {
      const s = (S.limits ??= {});
      s.items ??= {};
      limitCands.forEach((c, k) => {
        const ex = s.items[c.name], had = plan0.done ? plan0.limits[c.name] : undefined;
        if (!ex) s.items[c.name] = { on: plan0.done ? had != null : (k < 2 || c.name === 'Subscriptions'), cents: had ?? suggestLimit(c), touched: had != null };
        else if (!ex.touched) ex.cents = suggestLimit(c); // the pace or the lineup changed since
      });
      return s.items;
    }
    function limits(s) {
      const items = limitItems();
      const max = c => Math.max(2000, Math.ceil(c.cents * 1.6 / 1000) * 1000);
      const frees = () => limitCands.reduce((t, c) => t + (items[c.name].on ? Math.max(0, c.cents - items[c.name].cents) : 0), 0);
      const jar = c => { const it = items[c.name], mx = max(c);
        return `<div class="cw-jarcard${it.on ? '' : ' is-off'}" data-c="${esc(c.name)}" style="--liq:${LIQ[c.name] || 'var(--peri)'}">
    <div class="cw-jar-h"><b>${esc(SHORT[c.name] || c.name)}</b><button class="cw-track" data-a="track" aria-pressed="${it.on}" aria-label="Track ${esc(c.name)}">${it.on ? 'On' : 'Off'}</button></div>
    <div class="cw-jar" role="slider" tabindex="${it.on ? 0 : -1}" aria-label="${esc(c.name)} limit" aria-valuemin="0" aria-valuemax="${mx / 100}" aria-valuenow="${it.cents / 100}" aria-valuetext="${usd(it.cents)} a month">
      <span class="cw-liq" style="--h:${(it.cents / mx * 100).toFixed(1)}%"><svg viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 5 Q15 0 30 5 T60 5 T90 5 T120 5 V10 H0z"/></svg></span>
      <i class="cw-usual" style="--u:${(c.cents / mx * 100).toFixed(1)}%"><span>${single ? 'Spent' : 'Avg'} ${usd(c.cents)}</span></i>
      <output>${usd(it.cents)}</output>
    </div>
    <div class="cw-step"><button data-a="dn" aria-label="Lower ${esc(c.name)} limit by $5">−</button><span class="cw-free"></span><button data-a="up" aria-label="Raise ${esc(c.name)} limit by $5">+</button></div>
  </div>`; };
      return { genre: 'limits', scene: `
<div class="cw-limits">
  <h1 class="ew-h ew-h-sm">Set your <em>monthly limits</em></h1>
  <p class="ew-sub">Drag a jar, or tap − and +.</p>
  <div class="cw-jars">${limitCands.map(jar).join('')}</div>
  <p class="cw-tally cw-freed" aria-live="polite"></p>
</div>`, mount: n => {
        const paintOne = (card, bounce) => {
          const c = limitCands.find(x => x.name === card.dataset.c), it = items[c.name], mx = max(c);
          card.classList.toggle('is-off', !it.on);
          const tr = card.querySelector('.cw-track'); tr.setAttribute('aria-pressed', String(it.on)); tr.textContent = it.on ? 'On' : 'Off';
          const j = card.querySelector('.cw-jar'); j.tabIndex = it.on ? 0 : -1;
          j.setAttribute('aria-valuenow', it.cents / 100); j.setAttribute('aria-valuetext', `${usd(it.cents)} a month`);
          card.querySelector('.cw-liq').style.setProperty('--h', (it.cents / mx * 100).toFixed(1) + '%');
          card.querySelector('output').textContent = usd(it.cents);
          const d = c.cents - it.cents, f = card.querySelector('.cw-free');
          f.textContent = !it.on ? 'Not tracking' : d > 0 ? `saves ${usd(d)}` : d < 0 ? 'above usual' : 'same as usual';
          f.classList.toggle('is-up', it.on && d > 0);
          if (bounce && !reduce()) f.animate([{ transform: 'scale(1.12)' }, { transform: 'none' }], { duration: 260, easing: EASE });
        };
        const total = () => { const f = frees(), on = limitCands.filter(c => items[c.name].on).length; n.querySelector('.cw-freed').innerHTML = on ? (f > 0 ? `Saves <b>${usd(f)}</b> a month` : 'Lower a jar to save') : 'Turn on a jar to set a limit.'; };
        n.querySelectorAll('.cw-jarcard').forEach(c => paintOne(c)); total();
        const set = (card, cents, bounce) => { const c = limitCands.find(x => x.name === card.dataset.c), it = items[c.name]; it.cents = Math.max(0, Math.min(max(c), Math.round(cents / 500) * 500)); it.touched = true; paintOne(card, bounce); total(); };
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a]'); if (!b) return; const card = b.closest('.cw-jarcard'); if (!card) return; const it = items[card.dataset.c];
          if (b.dataset.a === 'track') { it.on = !it.on; paintOne(card); total(); }
          if (b.dataset.a === 'up' || b.dataset.a === 'dn') { if (!it.on) { it.on = true; } set(card, it.cents + (b.dataset.a === 'up' ? 500 : -500), true); }
        });
        n.querySelectorAll('.cw-jar').forEach(j => {
          const card = j.closest('.cw-jarcard'); let drag = false;
          const at = y => { const r = j.getBoundingClientRect(), c = limitCands.find(x => x.name === card.dataset.c); return (1 - Math.max(0, Math.min(1, (y - r.top) / r.height))) * max(c); };
          j.addEventListener('pointerdown', e => { const it = items[card.dataset.c]; if (!it.on) { it.on = true; } drag = true; j.setPointerCapture(e.pointerId); j.classList.add('is-drag'); set(card, at(e.clientY)); });
          j.addEventListener('pointermove', e => { if (drag) set(card, at(e.clientY)); });
          const up = () => { if (!drag) return; drag = false; j.classList.remove('is-drag'); paintOne(card, true); };
          j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up);
          j.addEventListener('keydown', e => {
            const it = items[card.dataset.c], step = { ArrowUp: 500, ArrowRight: 500, ArrowDown: -500, ArrowLeft: -500, PageUp: 2500, PageDown: -2500 }[e.key];
            if (step) { e.preventDefault(); set(card, it.cents + step, true); }
          });
        });
      } };
    }

    // ----- Goals: up to three, written on the letter, then sealed (Faiit's note-to-self envelope) -----
    const freedNow = () => { const it = S.limits?.items || {}; return limitCands.reduce((t, c) => t + (it[c.name]?.on ? Math.max(0, c.cents - it[c.name].cents) : 0), 0); };
    function suggestions() {
      const out = [], add = g => { if (!out.some(x => x.id === g.id)) out.push(g); };
      const freed = freedNow();
      plan0.goals.filter(g => !g.archived).forEach(g => add({ id: 'have-' + g.id, gid: g.id, title: g.title, target: g.target || 10000, have: true }));
      if (A.fees.length) add({ id: 'cushion', title: 'Overdraft cushion', target: 30000 });
      if (freed > 0) add({ id: 'freed', title: 'Money my limits save', target: round5(freed * 3) });
      const cut = subsCut(); if (cut.length) add({ id: 'subs', title: 'Saved from cut subs', target: round5(sum(cut) * 12) });
      if (A.bnpl.length) { const name = A.bnpl[0].merchant.split(/\s+/)[0]; add({ id: 'bnpl', title: `Clear ${name.charAt(0) + name.slice(1).toLowerCase()}`, target: round5(sum(A.bnpl)) }); }
      if (!A.fees.length) add({ id: 'cushion', title: 'Emergency cushion', target: 50000 });
      add({ id: 'trip', title: 'A trip', target: 120000 });
      add({ id: 'friends', title: 'Plans with friends', target: 60000 });
      return out.slice(0, 4);
    }
    const pickedGoals = () => {
      const g = S.goals; if (!g) return [];
      const all = [...suggestions(), ...(g.custom || [])];
      return (g.sel || []).map(id => all.find(x => x.id === id)).filter(Boolean);
    };
    const pickedLimits = () => { const it = S.limits?.items || {}; return limitCands.filter(c => it[c.name]?.on).map(c => ({ name: c.name, cents: it[c.name].cents })); };
    function goals(s) {
      const sug = suggestions();
      s.sel ??= sug.filter(g => g.have).map(g => g.id).slice(0, 3);
      s.custom ??= [];
      const all = () => [...sug, ...s.custom];
      const pill = g => `<button class="ew-chip cw-gpill" data-a="goal" data-id="${esc(g.id)}" aria-pressed="false"><span>${esc(g.title)}</span><small>${usd(g.target)}</small></button>`;
      return { genre: 'letter', scene: `
<div class="ew-letter cw-goals">
  <p class="ew-kicker">Your goals</p>
  <h1 class="ew-h ew-h-sm">What are you <em>saving for?</em></h1>
  <p class="ew-sub">Short term or long term. Pick up to three.</p>
  <div class="cw-pills cw-gpills" role="group" aria-label="Pick up to three goals">${sug.map(pill).join('')}<span class="cw-customs">${s.custom.map(pill).join('')}</span><button class="ew-chip cw-add" data-a="add" aria-haspopup="dialog">${I('<path d="M12 5v14M5 12h14"/>')}<span>Add yours</span></button></div>
  <div class="ew-env2 cw-env2">
    <span class="back" aria-hidden="true"></span>
    <article class="paper"><small>Dear future me, I’m saving for</small><ul class="cw-goallist"></ul></article>
    <span class="front" aria-hidden="true"></span>
    <button class="ew-seal" data-a="seal" aria-label="Seal your goals" disabled>c</button>
  </div>
  <p class="ew-hint" aria-live="polite">Pick up to 3, then tap the seal</p>
</div>`, mount: n => {
        const env = n.querySelector('.ew-env2'), sealBtn = n.querySelector('[data-a="seal"]'), hint = n.querySelector('.ew-hint');
        const paint = () => {
          n.querySelectorAll('[data-a="goal"]').forEach(b => { b.setAttribute('aria-pressed', String(s.sel.includes(b.dataset.id))); b.disabled = !!s.sealed; });
          n.querySelector('[data-a="add"]').disabled = !!s.sealed;
          const picked = s.sel.map(id => all().find(x => x.id === id)).filter(Boolean);
          n.querySelector('.cw-goallist').innerHTML = picked.length ? picked.map(g => `<li><span>${esc(g.title)}</span><b>${usd(g.target)}</b></li>`).join('') : '<li class="is-empty">…</li>';
          env.classList.toggle('is-writing', picked.length > 0);
          env.classList.toggle('is-sealed', !!s.sealed);
          sealBtn.disabled = !picked.length || !!s.sealed;
          if (s.sealed) ready();
          hint.textContent = s.sealed ? 'Sealed. Your goals are on your Home screen.' : picked.length ? `${picked.length} of 3. Tap the seal when you’re ready.` : 'Pick up to 3, then tap the seal';
        };
        paint();
        const addGoal = () => {
          if (!window.FaiitHome?.sheet) return;
          FaiitHome.sheet(`<h2 id="fh-sheet-title" class="fh-sh-title">Add your goal</h2>
<p class="fz-sh-meta">Anything you’re saving for, now or years from now.</p>
<form class="fz-form" novalidate>
  <label class="fw-sr" for="cw-gt">Goal name</label><input class="fz-name" id="cw-gt" name="title" maxlength="32" placeholder="A new laptop" autocomplete="off" required>
  <label class="fz-money-big"><span class="fw-sr">Target amount</span><i>$</i><input name="target" inputmode="numeric" placeholder="500" aria-label="Target amount" autocomplete="off"></label>
  <p class="cw-sheet-err" role="alert" hidden></p>
  <button class="fh-unwrap fj" type="submit">Add goal</button>
</form>`, {
            input: t => { if (t.name === 'target') t.value = t.value.replace(/[^0-9]/g, '').slice(0, 7); },
            submit: (f, close) => {
              const t = f.title.value.trim(), a = +f.target.value || 0, err = f.querySelector('.cw-sheet-err');
              if (!t) { err.hidden = false; err.textContent = 'Give your goal a name.'; f.title.focus(); return; }
              if (!a) { err.hidden = false; err.textContent = 'Add a target amount.'; f.target.focus(); return; }
              const g = { id: 'mine-' + uid(), title: t, target: a * 100, mine: true };
              s.custom.push(g); s.sel.push(g.id);
              n.querySelector('.cw-customs').insertAdjacentHTML('beforeend', pill(g));
              close(); paint(); api.toast?.(`Added ${t}`);
            }
          });
          setTimeout(() => document.getElementById('cw-gt')?.focus(), 80);
          const relock = setInterval(() => { if (!document.querySelector('.fh-sheet-wrap')) { clearInterval(relock); if (root.isConnected) document.documentElement.classList.add('fh-locked'); } }, 200);
        };
        const full = () => { hint.textContent = 'Three is the limit. Tap one to swap it out.'; if (!reduce()) hint.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 240 }); };
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a]'); if (!b || s.sealed) return;
          if (b.dataset.a === 'goal') { const id = b.dataset.id; if (s.sel.includes(id)) s.sel = s.sel.filter(x => x !== id); else if (s.sel.length >= 3) { full(); return; } else s.sel.push(id); paint(); }
          if (b.dataset.a === 'add') { if (s.sel.length >= 3) { full(); return; } addGoal(); }
          if (b.dataset.a === 'seal' && s.sel.length) { s.sealed = true; commit(); paint(); api.toast?.(`Sealed. ${s.sel.length} ${s.sel.length === 1 ? 'goal' : 'goals'} and your limits are saved.`); if (!reduce()) sealBtn.animate([{ transform: 'scale(1.8)', opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
        });
      } };
    }

    // ----- Finale: the share cards -----
    function shareCtx() {
      const merch = A.count(A.ex, r => r.merchant)[0] || ['Your card', A.ex.length];
      const gs = S.goals?.sealed ? pickedGoals().map(g => g.title) : [];
      const note = gs[0] ? (gs[0].length > 28 ? gs[0].slice(0, 27) + '…' : gs[0]) : '';
      return { month: month.card || short, year: month.years || month.key.slice(0, 4), del: A.del.length, caf: A.cafes.length, shop: A.shop.length, gro: A.gro.length, noSpend: A.noSpend, purchases: A.ex.length, villain: { name: merch[0], n: merch[1] }, note, goals: gs, cafDay: A.cafes.length ? +A.count(A.cafes, r => dayOf(r.date))[0][0] : null };
    }
    function finale() {
      const ctx = shareCtx(); memo.note = ctx.note;
      return { genre: 'finale', scene: `<div class="ew-finale"><div class="sh-host"></div></div>`, mount: n => { window.FaiitShare.mount(n.querySelector('.sh-host'), ctx, { toast: api.toast }); ready('Done'); } };
    }

    // ---------- saving the plan: limits, goals and what you're making room for ----------
    function commit(force) {
      const p = { done: false, values: [], goals: [], limits: {}, contributions: [], manual: [], ...read(PLAN) };
      if (S.limits || force) {
        const it = limitItems();
        limitCands.forEach(c => { if (it[c.name].on && it[c.name].cents > 0) p.limits[c.name] = it[c.name].cents; else delete p.limits[c.name]; });
      }
      if (S.goals) {
        const picked = pickedGoals(), sug = suggestions();
        picked.forEach(g => {
          if (g.gid) { const ex = p.goals.find(x => x.id === g.gid); if (ex) { ex.target = g.target; ex.archived = false; } return; }
          const id = g.mine ? g.id : `${g.id}-${month.key}`;
          const ex = p.goals.find(x => x.id === id);
          if (ex) { ex.title = g.title; ex.target = g.target; ex.archived = false; }
          else p.goals.push({ id, title: g.title, target: g.target, value: '' });
        });
        // goals you had and chose not to seal this time move to Past goals
        sug.filter(g => g.have && !picked.some(x => x.id === g.id)).forEach(g => { const ex = p.goals.find(x => x.id === g.gid); if (ex) ex.archived = true; });
      }
      p.done = true; p.joinedAt ||= new Date().toISOString();
      write(PLAN, p);
      memo.goals = pickedGoals().map(g => g.title);
      if (window.Chala?.pull) try { Chala.pull(); } catch {}
    }

    show(0);
  }

  // The first Wrapped covers everything the statement or bank shared, up to the most recent 12 months.
  function periodOf(rows) {
    const ok = rows.filter(r => r.date && r.include !== false);
    const ds = ok.map(r => r.date).sort(); if (!ds.length) return null;
    const end = ds.at(-1), e = new Date(end + 'T12:00'), s0 = new Date(e); s0.setDate(s0.getDate() - 364);
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const start = ds[0] > iso(s0) ? ds[0] : iso(s0);
    const inR = ok.filter(r => r.date >= start && r.date <= end);
    const days = Math.round((e - new Date(start + 'T12:00')) / 864e5) + 1;
    const mk = [...new Set(inR.map(r => r.date.slice(0, 7)))].sort();
    const monthLabel = k => new Date(k + '-02T12:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (mk.length === 1) return { key: mk[0], label: monthLabel(mk[0]), rows: inR, sample: false };
    const weeks = Math.round(days / 7), months = Math.round(days / 30.44);
    const short = days >= 350 ? 'the past year' : months >= 3 ? `the last ${months} months` : `the last ${weeks} weeks`;
    const title = short.charAt(0).toUpperCase() + short.slice(1);
    const mon = k => new Date(k + '-02T12:00').toLocaleDateString('en-US', { month: 'short' });
    const y0 = mk[0].slice(0, 4), y1 = mk.at(-1).slice(0, 4);
    return { key: mk.at(-1), range: true, start, end, days, rows: inR, sample: false, short, title,
      label: `${title} (${mon(mk[0])} ${y0 === y1 ? '' : y0 + ' '}to ${mon(mk.at(-1))} ${y1})`,
      brand: days >= 350 ? 'Your year, Wrapped' : `${title}, Wrapped`,
      card: days >= 330 ? 'my year' : `${mon(mk[0])}–${mon(mk.at(-1))}`, years: y0 === y1 ? y1 : `${y0}–${y1}` };
  }

  window.ChalaWrap = { play, periodOf };
})();
