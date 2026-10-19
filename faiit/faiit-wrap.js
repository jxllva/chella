/* Faiit Wrapped: a monthly recap told as an interactive episode.
   Each habit gets its own genre. People guess before a reveal, tap to open evidence,
   hold to pause, and object to specific charges. The story only claims what the
   statement can show (counts, amounts, dates, merchants). People, gifts and transfers
   stay out unless the person turns them on. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const EP_KEY = 'faiit-episodes-v1', OBJ_KEY = 'faiit-objections-v1';
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const dayOf = d => new Date(d + 'T12:00:00').getDay();
  const dateLabel = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const SENSITIVE = /venmo|zelle|cash ?app|paypal|gofundme|donat|charity|church|mosque|temple|tithe|red cross|unicef/i;

  // ---------- sample month, so the demo has real-looking rows to tell a story from ----------
  function seeded(seed) { let h = seed >>> 0; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  // Sample months for the demo: June 2025 to September 2026. September 2026 is the
  // reference month; the others vary from a seed so each month tells a different story.
  const SAMPLE_KEYS = ['2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  function sampleMonth(key = '2026-09') {
    const ref = key === '2026-09', hash = [...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
    const rnd = seeded(ref ? 926 : hash), rows = [];
    const days = new Date(+key.slice(0, 4), +key.slice(5, 7), 0).getDate();
    const day = n => `${key}-${String(n).padStart(2, '0')}`;
    const pick = (weights) => { let t = rnd() * weights.reduce((a, b) => a + b, 0); for (let i = 0; i < weights.length; i++) { t -= weights[i]; if (t <= 0) return i; } return weights.length - 1; };
    // Days of the month by weekday, so habits cluster believably.
    const byDow = Array.from({ length: 7 }, () => []); for (let d = 1; d <= days; d++) byDow[dayOf(day(d))].push(d);
    const add = (cat, merchant, n, total, dowWeights, fixed = []) => {
      const list = [...fixed];
      while (list.length < n) { const dow = pick(dowWeights), ds = byDow[dow]; list.push({ d: ds[Math.floor(rnd() * ds.length)], c: 0 }); }
      const free = list.filter(x => !x.c), fixedSum = list.reduce((s, x) => s + x.c, 0);
      const raw = free.map(() => .6 + rnd()), rs = raw.reduce((a, b) => a + b, 0);
      let left = total - fixedSum;
      free.forEach((x, i) => { x.c = i === free.length - 1 ? left : Math.round((total - fixedSum) * raw[i] / rs / 10) * 10; left -= i === free.length - 1 ? 0 : x.c; });
      list.forEach(x => rows.push({ date: day(x.d), merchant: typeof merchant === 'function' ? merchant() : merchant, cents: x.c, category: cat, kind: 'expense' }));
    };
    const m = (a, b, p) => () => (rnd() < p ? a : b);
    const vary = (base, lo, hi) => ref ? base : Math.round(lo + rnd() * (hi - lo));
    const nDel = vary(28, 9, 32), nCaf = vary(22, 8, 26), nShop = vary(8, 2, 11), nGro = vary(11, 6, 15);
    add('Food delivery', m('DoorDash', 'Uber Eats', .72), nDel, nDel * vary(2321, 1900, 2700), [1, 1, 1, 1.4, 1.6, 3.2, 2], ref || rnd() < .4 ? [{ d: ref ? 14 : 1 + Math.floor(rnd() * days), c: ref ? 8400 : 6000 + Math.round(rnd() * 40) * 100 }] : []);
    add('Cafés', m('Blue Bottle', 'Philz Coffee', .64), nCaf, nCaf * vary(818, 650, 950), [.4, 1.2, 1.3, 1.3, 1.4, 2.6, .6]);
    add('Shopping', m('Amazon', 'Target', .75), nShop, nShop * vary(3750, 2400, 5200), [1, 1, 1, 1, 1, 1, 1.4]);
    if (ref) rows.push({ date: day(21), merchant: 'Zara', cents: 12000, category: 'Shopping', kind: 'expense' });
    add('Groceries', m("Trader Joe's", 'Safeway', .7), nGro, nGro * vary(3273, 2600, 3900), [2.4, .6, .6, .8, .6, .8, 2]);
    rows.sort((a, b) => a.date.localeCompare(b.date));
    return { key, label: new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), rows, sample: true };
  }

  // ---------- reading the month ----------
  function analyse(month) {
    const ex = month.rows.filter(r => r.kind === 'expense' && r.cents > 0);
    const by = cat => ex.filter(r => r.category === cat);
    const days = new Date(+month.key.slice(0, 4), +month.key.slice(5, 7), 0).getDate();
    const spendDays = new Set(ex.map(r => r.date));
    const people = month.rows.filter(r => r.kind === 'transfer' || SENSITIVE.test(r.merchant || ''));
    const count = (list, f) => { const o = {}; list.forEach(r => { const k = f(r); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
    const streak = list => { const set = new Set(list.map(r => +r.date.slice(8, 10))); let best = 0, run = 0; for (let d = 1; d <= days; d++) { run = set.has(d) ? run + 1 : 0; best = Math.max(best, run); } return best; };
    return { ex, by, days, total: ex.reduce((s, r) => s + r.cents, 0), noSpend: days - spendDays.size, people, count, streak };
  }

  // ---------- the episode ----------
  function play(el, api) {
    const month = api.month || sampleMonth();
    const A = analyse(month), m = api.money;
    const eps = read(EP_KEY), prevKey = Object.keys(eps).filter(k => k < month.key).sort().pop(), prev = prevKey ? eps[prevKey] : null;
    const objections = read(OBJ_KEY);
    const memo = { key: month.key, label: month.label };
    const shortMonth = month.label.split(' ')[0];

    // Pick beats from what the month actually holds.
    const del = A.by('Food delivery'), caf = A.by('Cafés'), shop = A.by('Shopping'), gro = A.by('Groceries');
    const saved = savedThisMonth();
    const beats = [cold];
    if (new Set(A.ex.map(r => r.category)).size >= 2) beats.push(biggestBite);
    if (del.length >= 3) beats.push(caseFile);
    if (del.length >= 3 && outlier(del)) beats.push(objection);
    if (A.ex.length >= 8) beats.push(weekPlot);
    if (caf.length >= 3) beats.push(sitcom, coffeeCost);
    if (shop.length >= 2) beats.push(unboxing);
    if (A.ex.filter(r => r.cents < 1000).length >= 3) beats.push(treats);
    if (gro.length >= 2) beats.push(groupChat);
    if (saved.n) beats.push(highlights);
    if (beats.length < 3) beats.push(topMerchant);
    beats.push(turn, noteToSelf, finale);

    let i = 0, held = false, cleanup = [];
    el.innerHTML = `<section class="ew" aria-label="Your ${esc(month.label)} Wrapped">
  <div class="ew-bg" aria-hidden="true"><i></i><i></i><i></i></div>
  <header class="ew-top">
    <div class="ew-bars" aria-hidden="true">${beats.map(() => '<span><i></i></span>').join('')}</div>
    <div class="ew-row"><span class="ew-brand">${esc(shortMonth)} Wrapped${month.sample ? ' · sample data' : ''}</span>
      <button class="ew-x" data-w="close" aria-label="Close Wrapped">${I('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>
  </header>
  <main class="ew-stage" aria-live="polite"></main>
  <p class="ew-paused" aria-hidden="true">Paused</p>
</section>`;
    const root = el.querySelector('.ew'), stage = el.querySelector('.ew-stage');
    document.documentElement.classList.add('fh-locked');

    // ----- helpers -----
    const after = (ms, fn) => { let t0 = performance.now(), left = ms, id; const tick = () => { if (!root.isConnected) return; if (held) { t0 = performance.now(); id = requestAnimationFrame(tick); return; } const now = performance.now(); left -= now - t0; t0 = now; if (left <= 0) fn(); else id = requestAnimationFrame(tick); }; id = requestAnimationFrame(tick); cleanup.push(() => cancelAnimationFrame(id)); };
    function fit(node, max) {
      if (!node) return; const box = node.parentElement; let size = max; node.style.fontSize = size + 'px';
      while (size > 18 && (node.scrollWidth > box.clientWidth || node.getBoundingClientRect().right > window.innerWidth - 8)) { size -= 2; node.style.fontSize = size + 'px'; }
    }
    function countTo(node, to, fmt, ms = 1100) {
      if (reduce()) { node.textContent = fmt(to); return; }
      const t0 = performance.now(); const step = now => { if (!root.isConnected) return; const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3); node.textContent = fmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
    }
    const rise = (nodes, gap = 90, base = 0) => { if (reduce()) return; [...nodes].forEach((n, k) => n.animate([{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 620, delay: base + k * gap, easing: EASE, fill: 'backwards' })); };
    const next = () => show(i + 1), back = () => show(i - 1);
    const cont = (label = 'Continue') => `<button class="ew-go" data-w="next">${label}</button>`;
    function bars() { root.querySelectorAll('.ew-bars span').forEach((s, k) => { s.classList.toggle('is-done', k < i); s.classList.toggle('is-on', k === i); }); }

    function show(n) {
      if (n < 0) n = 0;
      if (n >= beats.length) { exit(); return; }
      cleanup.forEach(f => f()); cleanup = [];
      i = n; bars();
      const beat = beats[i](), scene = beat.scene;
      root.dataset.genre = beat.genre; root.classList.toggle('is-passive', !!beat.passive);
      const old = stage.firstElementChild;
      const node = document.createElement('div'); node.className = `ew-scene is-${beat.genre}`; node.innerHTML = scene;
      if (old && !reduce()) { old.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.98)' }], { duration: 260, easing: 'ease-in', fill: 'forwards' }).finished.then(() => old.remove(), () => old.remove()); }
      else old?.remove();
      stage.append(node);
      if (!reduce()) node.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: old ? 180 : 0, easing: EASE, fill: 'backwards' });
      node.querySelectorAll('[data-fit]').forEach(x => fit(x, +x.dataset.fit));
      beat.mount?.(node);
      node.querySelector('h1,h2')?.setAttribute('tabindex', '-1'); node.querySelector('h1,h2')?.focus({ preventScroll: true });
    }
    function exit() {
      cleanup.forEach(f => f()); write(EP_KEY, { ...read(EP_KEY), [month.key]: memo });
      document.documentElement.classList.remove('fh-locked');
      if (reduce()) { api.onExit(); return; }
      root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards' }).finished.then(api.onExit, api.onExit);
    }

    // ----- input: tap zones on passive beats, buttons everywhere, hold anywhere to pause -----
    let downAt = 0, holdTimer = null, wasHeld = false;
    root.addEventListener('pointerdown', e => {
      if (e.target.closest('button,input,label,[data-hold]')) return;
      downAt = Date.now(); wasHeld = false;
      holdTimer = setTimeout(() => { held = true; wasHeld = true; root.classList.add('is-held'); }, 260);
    });
    const release = () => { clearTimeout(holdTimer); if (held) { held = false; root.classList.remove('is-held'); } };
    root.addEventListener('pointerup', release); root.addEventListener('pointercancel', release); root.addEventListener('pointerleave', release);
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-w]');
      if (b) { const k = b.dataset.w; if (k === 'close') exit(); else if (k === 'next') next(); return; }
      if (wasHeld || e.target.closest('button,input,label,[data-hold]')) return;
      if (!root.classList.contains('is-passive')) return;
      (e.clientX < window.innerWidth * .3 ? back : next)();
    });
    const onKey = e => { if (!root.isConnected) { document.removeEventListener('keydown', onKey); return; } if (e.key === 'Escape') exit(); if (root.classList.contains('is-passive') && (e.key === 'ArrowRight' || e.key === ' ')) { e.preventDefault(); next(); } if (e.key === 'ArrowLeft') back(); };
    document.addEventListener('keydown', onKey);

    // =================================================================
    // Beats
    // =================================================================
    function cold() {
      const lines = A.ex.slice(0, 7);
      const callback = prev?.note ? `Last episode you left a note: “${prev.note}.” Let’s see how it went.` : prev?.delivery ? `Last episode: ${prev.delivery} delivery orders. Let’s see what happened next.` : 'Every tap of your card left a clue.';
      return { genre: 'cold', passive: true, scene: `
<div class="ew-cold">
  <p class="ew-kicker">Previously, on your bank statement</p>
  <h1 class="ew-h">${esc(shortMonth)}.<br><em>${A.ex.length} purchases.</em><br>One main character.</h1>
  <div class="ew-printer" aria-hidden="true"><span class="ew-slot"></span><div class="ew-paper">${lines.map(r => `<p><span>${esc(dateLabel(r.date))}</span><span>${esc(r.merchant)}</span><b>${m(r.cents)}</b></p>`).join('')}<p class="ew-cut">· · ·</p></div></div>
  <p class="ew-sub">${esc(callback)}</p>
  <p class="ew-hint">Tap to start · hold to pause</p>
</div>`, mount: n => rise(n.querySelectorAll('.ew-kicker,.ew-h,.ew-sub,.ew-hint'), 140) };
    }

    // ----- True crime: delivery -----
    function caseFile() {
      const orders = del.length, max = Math.max(40, Math.ceil(orders * 1.8 / 10) * 10);
      const days = A.count(del, r => dayOf(r.date)), merch = A.count(del, r => r.merchant);
      const evidence = [
        { k: 'Most active day', v: `${DAYS[days[0][0]]}s`, s: `${days[0][1]} orders` },
        { k: 'Longest streak', v: `${A.streak(del)} days`, s: 'in a row' },
        { k: 'Prime suspect', v: merch[0][0], s: `${merch[0][1]} of ${orders} orders` }
      ];
      memo.delivery = orders;
      return { genre: 'crime', scene: `
<div class="ew-crime">
  <p class="ew-kicker">Case file · ${esc(shortMonth)}</p>
  <h1 class="ew-h">The kitchen<br><em>that never gets used.</em></h1>
  <div class="ew-q" data-step="guess">
    <p class="ew-ask">How many times did you order delivery?</p>
    <output class="ew-guess"><b data-fit="96">${Math.round(max / 3)}</b><span>times</span></output>
    <input class="ew-range" type="range" min="0" max="${max}" value="${Math.round(max / 3)}" aria-label="Your guess">
    <button class="ew-go" data-a="lock">Lock it in</button>
  </div>
  <div class="ew-reveal" hidden>
    <div class="ew-pile" aria-hidden="true"></div>
    <p class="ew-big"><b data-fit="104">0</b><span>orders</span></p>
    <p class="ew-verdict"></p>
    <div class="ew-evid" role="list">${evidence.map((e, k) => `<button class="ew-env" role="listitem" data-a="open" data-k="${k}" aria-label="Open evidence ${k + 1}"><span class="ew-env-front">${I('<path d="M4 7h16v10H4z"/><path d="m4 7 8 6 8-6"/>')}<span>Evidence ${k + 1}</span></span><span class="ew-env-back"><small>${esc(e.k)}</small><b>${esc(e.v)}</b><small>${esc(e.s)}</small></span></button>`).join('')}</div>
    <p class="ew-hint">Tap each envelope</p>
    <div class="ew-foot" hidden>${cont()}</div>
  </div>
</div>`, mount: n => {
        const range = n.querySelector('.ew-range'), out = n.querySelector('.ew-guess b');
        range.addEventListener('input', () => { out.textContent = range.value; });
        let opened = 0;
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a]'); if (!b) return;
          if (b.dataset.a === 'lock') {
            const g = +range.value; memo.deliveryGuess = g;
            n.querySelector('.ew-q').hidden = true; const rv = n.querySelector('.ew-reveal'); rv.hidden = false;
            fit(rv.querySelector('.ew-big b'), 104);
            const pile = rv.querySelector('.ew-pile'), shown = Math.min(orders, 24);
            pile.innerHTML = Array.from({ length: shown }, (_, k) => `<i style="--k:${k};--r:${((k * 37) % 31) - 15}deg;--x:${((k * 53) % 200) - 100}px"></i>`).join('');
            countTo(rv.querySelector('.ew-big b'), orders, v => String(v), 1300);
            const off = Math.abs(g - orders);
            const verdict = off === 0 ? 'Exactly right. You know yourself.' : off <= 3 ? `You guessed ${g}. Close. Suspiciously close.` : g < orders ? `You guessed ${g}. The receipts say otherwise.` : `You guessed ${g}. You’re harder on yourself than the evidence.`;
            after(reduce() ? 0 : 1400, () => { const v = rv.querySelector('.ew-verdict'); v.textContent = verdict; rise([v, rv.querySelector('.ew-evid'), rv.querySelector('.ew-hint')], 120); });
          }
          if (b.dataset.a === 'open' && !b.classList.contains('is-open')) {
            b.classList.add('is-open'); b.setAttribute('aria-label', b.querySelector('.ew-env-back').textContent.trim());
            if (++opened === 1) { const f = n.querySelector('.ew-foot'); f.hidden = false; rise([f]); }
            if (opened === 3) n.querySelector('.ew-reveal .ew-hint').textContent = 'Case closed.';
          }
        });
      } };
    }

    // ----- Objection: only for one specific, unusual charge -----
    function outlier(list) {
      const sorted = [...list].sort((a, b) => a.cents - b.cents), med = sorted[Math.floor(sorted.length / 2)].cents, top = sorted.at(-1);
      return top.cents >= med * 2.2 ? top : null;
    }
    function objection() {
      const o = outlier(del), id = `${o.date}|${o.merchant}|${o.cents}`, prior = objections[id];
      const reasons = [['group', 'It was for a group', 'Sustained. Logged as a group order.'], ['work', 'Work. I’ll be paid back', 'Sustained. Marked as a work expense.'], ['treat', 'It was a planned treat', 'Sustained. A treat, on purpose.']];
      return { genre: 'court', scene: `
<div class="ew-court">
  <p class="ew-kicker">Exhibit A</p>
  <article class="ew-exhibit"><span>${esc(dateLabel(o.date))}</span><b data-fit="72">${m(o.cents)}</b><span>${esc(o.merchant)}</span></article>
  <h2 class="ew-h ew-h-sm">One order, ${Math.round(o.cents / (A.by('Food delivery').reduce((s, r) => s + r.cents, 0) / del.length))}× your usual.<br><em>Dinner for one?</em></h2>
  <div class="ew-court-act">
    <button class="ew-objection" data-a="object">Objection!</button>
    <button class="ew-quiet" data-a="none">No objection</button>
  </div>
  <div class="ew-reasons" hidden role="group" aria-label="What was it?">${reasons.map(r => `<button class="ew-chip" data-a="reason" data-r="${r[0]}">${esc(r[1])}</button>`).join('')}</div>
  <p class="ew-ruling" hidden></p>
  <div class="ew-foot" hidden>${cont()}</div>
</div>`, mount: n => {
        if (prior) { const r = reasons.find(x => x[0] === prior); if (r) { n.querySelector('.ew-court-act').hidden = true; ruling(r[2] + ' (from your last objection)'); } }
        function ruling(t) { const p = n.querySelector('.ew-ruling'); p.hidden = false; p.textContent = t; const f = n.querySelector('.ew-foot'); f.hidden = false; rise([p, f], 120); }
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a]'); if (!b) return;
          if (b.dataset.a === 'object') { n.querySelector('.ew-court-act').hidden = true; const r = n.querySelector('.ew-reasons'); r.hidden = false; rise(r.children, 70); if (!reduce()) n.querySelector('.ew-exhibit').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2deg)' }, { transform: 'rotate(1.5deg)' }, { transform: 'none' }], { duration: 420, easing: EASE }); }
          if (b.dataset.a === 'none') { n.querySelector('.ew-court-act').hidden = true; ruling('Noted. It stays on the record.'); }
          if (b.dataset.a === 'reason') { const r = reasons.find(x => x[0] === b.dataset.r); objections[id] = r[0]; write(OBJ_KEY, objections); memo.objected = r[0]; n.querySelector('.ew-reasons').hidden = true; n.querySelector('.ew-exhibit').classList.add('is-stamped'); ruling(r[2]); }
        });
      } };
    }

    // ----- Sitcom: cafés -----
    function sitcom() {
      const days = A.count(caf, r => dayOf(r.date)), topDow = +days[0][0];
      const first = new Date(+month.key.slice(0, 4), +month.key.slice(5, 7) - 1, 1).getDay();
      const visits = {}; caf.forEach(r => { const d = +r.date.slice(8, 10); visits[d] = (visits[d] || 0) + 1; });
      const cells = Array.from({ length: first }, () => '<span class="is-blank"></span>').concat(Array.from({ length: A.days }, (_, k) => `<span data-d="${k + 1}" data-dow="${(first + k) % 7}"><i>${k + 1}</i></span>`)).join('');
      memo.cafes = caf.length;
      return { genre: 'sitcom', scene: `
<div class="ew-sitcom">
  <p class="ew-kicker">Season 1 · Episode ${caf.length}</p>
  <h1 class="ew-h">The <em>regular.</em></h1>
  <p class="ew-ask">Which day are you most likely at a café?</p>
  <div class="ew-dows" role="radiogroup" aria-label="Pick a day">${DAYS.map((d, k) => `<button class="ew-chip" role="radio" aria-checked="false" data-a="dow" data-k="${k}">${d.slice(0, 3)}</button>`).join('')}</div>
  <div class="ew-cal" aria-hidden="true"><div class="ew-cal-h">${DAYS.map(d => `<b>${d[0]}</b>`).join('')}</div><div class="ew-cal-g">${cells}</div></div>
  <p class="ew-verdict" hidden></p>
  <div class="ew-foot" hidden>${cont()}</div>
</div>`, mount: n => {
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a="dow"]'); if (!b || n.dataset.done) return; n.dataset.done = 1;
          n.querySelectorAll('[data-a="dow"]').forEach(x => { x.setAttribute('aria-checked', String(x === b)); x.disabled = true; });
          const pickDow = +b.dataset.k;
          const grid = n.querySelectorAll('.ew-cal-g [data-d]');
          grid.forEach((c, k) => { const v = visits[+c.dataset.d]; if (!v) return; after(reduce() ? 0 : 60 * k * .5, () => { c.classList.add('is-hit'); c.style.setProperty('--v', v); }); });
          after(reduce() ? 0 : 1300, () => {
            grid.forEach(c => c.classList.toggle('is-col', +c.dataset.dow === topDow));
            n.querySelectorAll('[data-a="dow"]')[topDow].classList.add('is-answer');
            const v = n.querySelector('.ew-verdict'); v.hidden = false;
            v.innerHTML = `${pickDow === topDow ? 'Called it.' : `Not ${DAYS[pickDow]}s.`} <b>${DAYS[topDow]}s</b> are your café day, with ${days[0][1]} of your ${caf.length} visits. <span class="ew-laugh">(audience laughs)</span>`;
            const f = n.querySelector('.ew-foot'); f.hidden = false; rise([v, f], 140);
          });
        });
      } };
    }

    // ----- Unboxing: shopping, hold to open -----
    function unboxing() {
      const big = [...shop].sort((a, b) => b.cents - a.cents)[0];
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
    <p class="ew-big"><b data-fit="104">${shop.length}</b><span>orders</span></p>
    <p class="ew-verdict">The biggest one: <b>${m(big.cents)}</b> at ${esc(big.merchant)} on ${esc(dateLabel(big.date))}.</p>
    <div class="ew-foot">${cont()}</div>
  </div>
</div>`, mount: n => {
        const p = n.querySelector('.ew-parcel'), ring = n.querySelector('.ew-ring .on'); let t0 = 0, raf = 0, done = false;
        const DUR = reduce() ? 300 : 1100;
        const tick = now => { const k = Math.min(1, (now - t0) / DUR); ring.style.strokeDasharray = `${k * 100} 100`; p.style.setProperty('--shake', k); if (k >= 1) open(); else raf = requestAnimationFrame(tick); };
        const start = e => { if (done) return; e.preventDefault(); t0 = performance.now(); p.classList.add('is-pressing'); raf = requestAnimationFrame(tick); };
        const stop = () => { if (done) return; cancelAnimationFrame(raf); p.classList.remove('is-pressing'); ring.style.strokeDasharray = '0 100'; };
        function open() { done = true; cancelAnimationFrame(raf); p.classList.add('is-open'); p.disabled = true; n.querySelector('.ew-hint').style.visibility = 'hidden'; const rv = n.querySelector('.ew-reveal'); rv.hidden = false; fit(rv.querySelector('.ew-big b'), 104); countTo(rv.querySelector('.ew-big b'), shop.length, String, 700); rise(rv.children, 140, 200); }
        p.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => p.addEventListener(t, stop));
        p.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !done) { e.preventDefault(); open(); } });
      } };
    }

    // ----- Group chat: groceries -----
    function groupChat() {
      const stores = A.count(gro, r => r.merchant), total = gro.reduce((s, r) => s + r.cents, 0);
      const msgs = [
        `hey 👋 it’s your fridge`,
        `you came by ${gro.length} times this month`,
        `mostly ${stores[0][0]} (${stores[0][1]}×)`,
        `${m(total)} on actual food. i’m so proud`
      ];
      return { genre: 'chat', passive: false, scene: `
<div class="ew-chat">
  <p class="ew-kicker">New messages</p>
  <div class="ew-phone">
    <header class="ew-phone-h"><span class="ew-ava" aria-hidden="true">🧊</span><b>Fridge</b></header>
    <div class="ew-thread" role="log" aria-live="polite"></div>
    <div class="ew-replies" hidden><button class="ew-chip" data-a="reply">see you saturday 🥬</button><button class="ew-chip" data-a="reply">don’t tell DoorDash</button></div>
  </div>
  <div class="ew-foot" hidden>${cont()}</div>
</div>`, mount: n => {
        const th = n.querySelector('.ew-thread');
        const bubble = (t, me) => { const b = document.createElement('p'); b.className = `ew-msg${me ? ' is-me' : ''}`; b.textContent = t; th.append(b); if (!reduce()) b.animate([{ opacity: 0, transform: 'translateY(8px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE }); th.scrollTop = th.scrollHeight; };
        const typing = () => { const d = document.createElement('p'); d.className = 'ew-msg ew-typing'; d.innerHTML = '<i></i><i></i><i></i>'; d.setAttribute('aria-label', 'Fridge is typing'); th.append(d); return d; };
        let k = 0;
        const step = () => { if (k >= msgs.length) { const r = n.querySelector('.ew-replies'); r.hidden = false; rise(r.children, 80); return; } const d = typing(); after(reduce() ? 0 : 900, () => { d.remove(); bubble(msgs[k++]); after(reduce() ? 0 : 450, step); }); };
        after(400, step);
        n.addEventListener('click', e => { const b = e.target.closest('[data-a="reply"]'); if (!b) return; n.querySelector('.ew-replies').hidden = true; bubble(b.textContent, true); const f = n.querySelector('.ew-foot'); f.hidden = false; rise([f]); });
      } };
    }

    // ----- Sports highlights: money actually set aside -----
    function savedThisMonth() { try { const p = JSON.parse(localStorage.getItem('faiit-plan-v1')) || {}; const c = (p.contributions || []).filter(x => (x.date || '').startsWith(month.key)); return { n: c.length, cents: c.reduce((s, x) => s + x.cents, 0) }; } catch { return { n: 0, cents: 0 }; } }
    function highlights() {
      return { genre: 'sport', scene: `
<div class="ew-sport">
  <p class="ew-kicker">Tonight’s highlights</p>
  <h1 class="ew-h">And the crowd<br><em>goes mild.</em></h1>
  <div class="ew-score"><span>Savings</span><b data-fit="88">${m(saved.cents)}</b><span>${saved.n} ${saved.n === 1 ? 'play' : 'plays'}</span></div>
  <p class="ew-sub">Every one you logged counts. Nothing you didn’t.</p>
  <div class="ew-foot">${cont()}</div>
</div>`, mount: n => { const b = n.querySelector('.ew-score b'); countTo(b, saved.cents, m, 1200); } };
    }

    function topMerchant() {
      const merch = A.count(A.ex, r => r.merchant)[0];
      return { genre: 'sitcom', scene: `
<div class="ew-sitcom">
  <p class="ew-kicker">Recurring character</p>
  <p class="ew-big"><b data-fit="104">${merch[1]}×</b></p>
  <h1 class="ew-h">${esc(merch[0])}.<br><em>You two talk a lot.</em></h1>
  <div class="ew-foot">${cont()}</div>
</div>` };
    }

    // ----- The turn: the pace slows down -----
    function turn() {
      const facts = [];
      if (A.noSpend > 0) facts.push(`<b>${A.noSpend}</b> days you spent nothing at all.`);
      if (gro.length) facts.push(`<b>${gro.length}</b> grocery runs. You kept feeding yourself.`);
      if (saved.cents) facts.push(`<b>${m(saved.cents)}</b> set aside for later you.`);
      if (!facts.length) facts.push(`<b>${A.ex.length}</b> purchases, and you made it through every one.`);
      const hasPeople = A.people.length > 0;
      return { genre: 'turn', passive: true, scene: `
<div class="ew-turn">
  <p class="ew-kicker">Okay. The jokes are done.</p>
  <h1 class="ew-h">Not everything<br><em>was a plot twist.</em></h1>
  <ul class="ew-facts">${facts.map(f => `<li>${f}</li>`).join('')}</ul>
  ${hasPeople ? `<label class="ew-opt"><input type="checkbox" data-a="people"><span>Include money you sent to people</span></label><p class="ew-opt-out" hidden></p>` : ''}
  <p class="ew-end">An ordinary month. That counts too.</p>
  <p class="ew-hint">Tap to continue</p>
</div>`, mount: n => {
        if (!reduce()) [...n.querySelectorAll('.ew-kicker,.ew-h,.ew-facts li,.ew-opt,.ew-end,.ew-hint')].forEach((x, k) => x.animate([{ opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0)' }], { duration: 1200, delay: 300 + k * 650, easing: 'ease-out', fill: 'backwards' }));
        n.querySelector('[data-a="people"]')?.addEventListener('change', e => { const o = n.querySelector('.ew-opt-out'); o.hidden = !e.target.checked; o.textContent = `You sent money to people ${A.people.length} ${A.people.length === 1 ? 'time' : 'times'}. That stays between you and them.`; });
      } };
    }

    // ----- Finale: next episode and a poster -----
    // ----- Finale: unwrap the share cards -----
    function finale() {
      const merch = A.count(A.ex, r => r.merchant)[0] || ['Your card', A.ex.length];
      const ctx = { month: shortMonth, year: month.key.slice(0, 4), del: del.length, caf: caf.length, shop: shop.length, gro: gro.length, noSpend: A.noSpend, purchases: A.ex.length, villain: { name: merch[0], n: merch[1] }, note: memo.note || '', cafDay: caf.length ? +A.count(caf, r => dayOf(r.date))[0][0] : null };
      return { genre: 'finale', scene: `<div class="ew-finale"><div class="sh-host"></div></div>`, mount: n => window.FaiitShare.mount(n.querySelector('.sh-host'), ctx, { toast: api.toast }) };
    }
    // =================================================================
    // Illustrated stories, each with its own interaction
    // =================================================================
    const sum = list => list.reduce((s, r) => s + r.cents, 0);
    const done = n => { const f = n.querySelector('.ew-foot'); if (!f) return; f.hidden = false; rise([f]); after(reduce() ? 0 : 200, () => f.scrollIntoView({ block: 'nearest', behavior: reduce() ? 'auto' : 'smooth' })); };

    // ----- The receipt: guess what took the biggest bite, then it prints -----
    function biggestBite() {
      const cats = Object.values(A.ex.reduce((o, r) => { (o[r.category] ??= { name: r.category, cents: 0 }); o[r.category].cents += r.cents; return o; }, {})).sort((a, b) => b.cents - a.cents).slice(0, 4);
      const max = cats[0].cents, tones = ['coral', 'peri', 'lilac', 'lime'];
      return { genre: 'receipt', scene: `
<div class="ew-bite">
  <p class="ew-kicker">The receipt</p>
  <h1 class="ew-h">What took <em>the biggest bite?</em></h1>
  <div class="ew-opts" role="radiogroup" aria-label="Pick one">${[...cats].sort((a, b) => a.name.localeCompare(b.name)).map(c => `<button class="ew-chip" role="radio" aria-checked="false" data-a="bite" data-c="${esc(c.name)}">${esc(c.name)}</button>`).join('')}</div>
  <article class="ew-receipt" hidden>
    <p class="ew-receipt-h">${esc(shortMonth)}</p>
    ${cats.map((c, k) => `<div class="ew-rrow${k === 0 ? ' is-top' : ''}" style="--w:${Math.max(6, c.cents / max * 100)}%;--k:${k}"><span>${esc(c.name)}</span><b>${m(c.cents)}</b><i class="t-${tones[k]}"></i></div>`).join('')}
    <span class="ew-barcode" aria-hidden="true"></span>
  </article>
  <p class="ew-verdict" hidden></p>
  <div class="ew-foot" hidden>${cont()}</div>
</div>`, mount: n => {
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a="bite"]'); if (!b || n.dataset.done) return; n.dataset.done = 1;
          n.querySelectorAll('[data-a="bite"]').forEach(x => { x.setAttribute('aria-checked', String(x === b)); x.disabled = true; if (x.dataset.c === cats[0].name) x.classList.add('is-answer'); });
          const r = n.querySelector('.ew-receipt'); r.hidden = false; r.classList.add('is-printing');
          after(reduce() ? 0 : 1300, () => { const v = n.querySelector('.ew-verdict'); v.hidden = false; v.innerHTML = b.dataset.c === cats[0].name ? `Called it. <b>${esc(cats[0].name)}</b> led the month.` : `Plot twist. It was <b>${esc(cats[0].name)}</b>, not ${esc(b.dataset.c)}.`; rise([v]); done(n); });
        });
      } };
    }

    // ----- The plot-twist week: guess the week, then the graph draws itself -----
    function weekPlot() {
      const weeks = []; for (let s = 1; s <= A.days; s += 7) weeks.push({ s, e: Math.min(A.days, s + 6), cents: 0 });
      A.ex.forEach(r => { const d = +r.date.slice(8, 10); weeks[Math.floor((d - 1) / 7)].cents += r.cents; });
      const top = weeks.reduce((a, w, k) => w.cents > weeks[a].cents ? k : a, 0), max = weeks[top].cents || 1;
      const W = 300, H = 140, gx = W / (weeks.length - 1);
      const pts = weeks.map((w, k) => [k * gx, H - 10 - (w.cents / max) * (H - 30)]);
      const path = pts.map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      const mon = shortMonth.slice(0, 3);
      return { genre: 'graph', scene: `
<div class="ew-week">
  <p class="ew-kicker">Every month has one</p>
  <h1 class="ew-h">The plot-twist <em>week.</em></h1>
  <p class="ew-ask">Which week did you spend the most?</p>
  <div class="ew-opts" role="radiogroup" aria-label="Pick a week">${weeks.map((w, k) => `<button class="ew-chip" role="radio" aria-checked="false" data-a="week" data-k="${k}">${mon} ${w.s}–${w.e}</button>`).join('')}</div>
  <div class="ew-graph" hidden>
    <svg viewBox="-12 -12 ${W + 24} ${H + 40}" aria-hidden="true"><path class="ln" d="${path}" pathLength="100"/>${pts.map((p, k) => `<circle class="${k === top ? 'pk' : ''}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${k === top ? 8 : 5}" style="--k:${k}"/>`).join('')}${weeks.map((w, k) => `<text x="${(k * gx).toFixed(1)}" y="${H + 22}" text-anchor="middle">${w.s}–${w.e}</text>`).join('')}</svg>
  </div>
  <p class="ew-verdict" hidden></p>
  <div class="ew-foot" hidden>${cont()}</div>
</div>`, mount: n => {
        n.addEventListener('click', e => {
          const b = e.target.closest('[data-a="week"]'); if (!b || n.dataset.done) return; n.dataset.done = 1;
          n.querySelectorAll('[data-a="week"]').forEach((x, k) => { x.setAttribute('aria-checked', String(x === b)); x.disabled = true; if (k === top) x.classList.add('is-answer'); });
          const g = n.querySelector('.ew-graph'); g.hidden = false; g.classList.add('is-drawing');
          after(reduce() ? 0 : 1500, () => { const v = n.querySelector('.ew-verdict'); v.hidden = false; const w = weeks[top]; v.innerHTML = `${+b.dataset.k === top ? 'You felt that one.' : 'Twist.'} <b>${mon} ${w.s}–${w.e}</b> was the big week: ${m(w.cents)}.`; rise([v]); done(n); });
        });
      } };
    }

    // ----- The coffee cups: guess what your usual coffee costs -----
    function coffeeCost() {
      const avg = Math.round(sum(caf) / caf.length), lo = 200, hi = Math.max(1200, Math.ceil(avg * 1.6 / 100) * 100);
      const start = Math.round((lo + hi) / 2 / 25) * 25;
      return { genre: 'coffee', scene: `
<div class="ew-coffee">
  <div class="ew-cups" aria-hidden="true"><img src="assets/wrapped-coffee.png" alt="" width="1312" height="1199"></div>
  <p class="ew-kicker">Powered by coffee</p>
  <h1 class="ew-h">What does your <em>usual cost?</em></h1>
  <div class="ew-q">
    <div class="ew-guessrow"><output class="ew-guess"><b>${m(start)}</b><span>a cup</span></output></div>
    <input class="ew-range" type="range" min="${lo}" max="${hi}" step="25" value="${start}" aria-label="Your guess for one café visit">
    <button class="ew-go" data-a="lock">Lock it in</button>
  </div>
  <div class="ew-reveal" hidden>
    <p class="ew-big"><b data-fit="96">${m(avg)}</b><span>per visit</span></p>
    <p class="ew-verdict"></p>
    <div class="ew-foot">${cont()}</div>
  </div>
</div>`, mount: n => {
        const range = n.querySelector('.ew-range'), out = n.querySelector('.ew-guess b');
        range.addEventListener('input', () => { out.textContent = m(+range.value); });
        n.addEventListener('click', e => {
          if (!e.target.closest('[data-a="lock"]')) return;
          const g = +range.value; n.querySelector('.ew-q').hidden = true;
          const rv = n.querySelector('.ew-reveal'); rv.hidden = false; fit(rv.querySelector('.ew-big b'), 96); countTo(rv.querySelector('.ew-big b'), avg, m, 1000);
          if (!reduce()) n.querySelector('.ew-cups img').animate([{ transform: 'none' }, { transform: 'rotate(-7deg) translateY(-8px)' }, { transform: 'rotate(5deg)' }, { transform: 'none' }], { duration: 800, easing: EASE });
          const off = Math.abs(g - avg);
          rv.querySelector('.ew-verdict').innerHTML = off <= 50 ? `You guessed ${m(g)}. Barista-level accuracy.` : g < avg ? `You guessed ${m(g)}. Your coffee is fancier than you think. ${caf.length} visits, ${m(sum(caf))} in all.` : `You guessed ${m(g)}. Cheaper than you feared. ${caf.length} visits, ${m(sum(caf))} in all.`;
          rise(rv.children, 140, 200);
        });
      } };
    }

    // ----- The price tag: pull it off to count the little treats -----
    function treats() {
      const small = A.ex.filter(r => r.cents < 1000), total = sum(small);
      return { genre: 'tag', scene: `
<div class="ew-tagscene">
  <p class="ew-kicker">Small but mighty</p>
  <h1 class="ew-h">Little treats <em>add up.</em></h1>
  <div class="ew-tagstage">
    <span class="ew-check" aria-hidden="true"></span>
    <div class="ew-under" aria-hidden="true"><b>${small.length}</b><span>under $10</span></div>
    <button class="ew-tag" data-hold aria-label="Pull the tag down to tear it off"><i class="hole"></i><b>UNDER<br>$10.</b><span class="ew-barcode"></span></button>
  </div>
  <p class="ew-hint">Pull the tag down</p>
  <div class="ew-reveal" hidden>
    <p class="ew-verdict"><b>${small.length}</b> purchases under $10. Together: <b>${m(total)}</b>.</p>
    <div class="ew-foot">${cont()}</div>
  </div>
</div>`, mount: n => {
        const tag = n.querySelector('.ew-tag'); let y0 = null, dy = 0, torn = false;
        const set = d => { tag.style.transform = `translateY(${d}px) rotate(${Math.min(14, d / 8)}deg)`; };
        const tear = () => {
          if (torn) return; torn = true; tag.disabled = true; n.querySelector('.ew-hint').style.visibility = 'hidden';
          const fly = reduce() ? null : tag.animate([{ transform: tag.style.transform || 'none', opacity: 1 }, { transform: 'translate(40px, 420px) rotate(40deg)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
          const show = () => { tag.style.visibility = 'hidden'; n.querySelector('.ew-under').classList.add('is-on'); const rv = n.querySelector('.ew-reveal'); rv.hidden = false; rise(rv.children, 140); };
          fly ? fly.finished.then(show, show) : show();
        };
        tag.addEventListener('pointerdown', e => { if (torn) return; y0 = e.clientY; dy = 0; tag.setPointerCapture(e.pointerId); tag.classList.add('is-drag'); });
        tag.addEventListener('pointermove', e => { if (y0 === null || torn) return; dy = Math.max(0, Math.min(140, e.clientY - y0)); set(dy); if (dy > 110) tear(); });
        const up = () => { if (y0 === null) return; y0 = null; tag.classList.remove('is-drag'); if (!torn) { if (dy < 8) tear(); else { set(0); dy = 0; } } };
        tag.addEventListener('pointerup', up); tag.addEventListener('pointercancel', up);
        tag.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tear(); } });
      } };
    }

    // ----- Note to self: pick a note for next month and seal it -----
    function noteToSelf() {
      const notes = [];
      if (del.length >= 3) notes.push('Cook at home twice a week');
      if (caf.length >= 3) notes.push('Keep Fridays for coffee');
      if (shop.length >= 2) notes.push('Sleep on it before checkout');
      notes.push('Same energy. It was a good month');
      return { genre: 'letter', scene: `
<div class="ew-letter">
  <p class="ew-kicker">Note to self</p>
  <h1 class="ew-h ew-h-sm">What should next month <em>remember?</em></h1>
  <div class="ew-opts" role="radiogroup" aria-label="Pick a note">${notes.map((t, k) => `<button class="ew-chip" role="radio" aria-checked="false" data-a="note" data-k="${k}">${esc(t)}</button>`).join('')}</div>
  <div class="ew-env2">
    <span class="back" aria-hidden="true"></span>
    <article class="paper"><small>Dear ${esc(new Date(+month.key.slice(0, 4), +month.key.slice(5, 7), 1).toLocaleDateString('en-US', { month: 'long' }))} me,</small><p class="ew-note-t">…</p></article>
    <span class="front" aria-hidden="true"></span>
    <button class="ew-seal" data-a="seal" aria-label="Seal the note" disabled>F</button>
  </div>
  <p class="ew-hint">Pick a note, then tap the seal</p>
  <div class="ew-foot" hidden>${cont()}</div>
</div>`, mount: n => {
        let pick = null;
        n.addEventListener('click', e => {
          const c = e.target.closest('[data-a="note"]');
          if (c && !n.dataset.sealed) { pick = notes[+c.dataset.k]; n.querySelectorAll('[data-a="note"]').forEach(x => x.setAttribute('aria-checked', String(x === c))); n.querySelector('.ew-note-t').textContent = pick + '.'; n.querySelector('.ew-env2').classList.add('is-writing'); n.querySelector('.ew-seal').disabled = false; }
          const s = e.target.closest('[data-a="seal"]');
          if (s && pick && !n.dataset.sealed) { n.dataset.sealed = 1; memo.note = pick; n.querySelectorAll('[data-a="note"]').forEach(x => { x.disabled = true; }); n.querySelector('.ew-env2').classList.add('is-sealed'); n.querySelector('.ew-hint').textContent = 'Sealed. It opens next episode.'; after(reduce() ? 0 : 700, () => done(n)); }
        });
      } };
    }

    async function savePoster(s, hide) {
      try {
        await document.fonts.ready;
        const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
        x.fillStyle = '#fffdf8'; x.fillRect(0, 0, W, H);
        const blob = (cx, cy, r, col) => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, W, H); };
        
        x.fillStyle = '#22201d'; x.font = `600 44px 'Bricolage Grotesque', sans-serif`; x.fillText(`${shortMonth} on Faiit`, 90, 150);
        x.font = `800 112px 'Bricolage Grotesque', sans-serif`; const words = s.t.split(' '); let line = '', y = 520;
        for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > W - 180) { x.fillText(line, 90, y); line = w; y += 120; } else line = t; } x.fillText(line, 90, y);
        x.font = `italic 400 76px 'Instrument Serif', serif`; x.fillText(s.n, 90, y + 140);
        if (!hide && s.a) { x.font = `800 96px 'Bricolage Grotesque', sans-serif`; x.fillText(s.a, 90, y + 270); }
        x.font = `italic 400 120px 'Instrument Serif', serif`; x.fillText('F', W - 160, H - 110);
        const blobOut = await new Promise(r => c.toBlob(r, 'image/png'));
        const file = new File([blobOut], `faiit-${month.key}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'My Faiit Wrapped' }); return true; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(blobOut); a.download = file.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return true;
      } catch { return false; }
    }

    show(0);
  }

  window.FaiitWrap = { play, sampleMonth, SAMPLE_KEYS };
})();
