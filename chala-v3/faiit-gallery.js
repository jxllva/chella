/* Faiit Wraps gallery.
   Monthly: a garden of month cards scattered on a canvas you drag or scroll through.
   Tap a month to watch its Wrap.
   Yearly: one bordered deck per year. Tap a deck and it opens into its months;
   tap a month for the full breakdown. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const seeded = seed => { let h = seed >>> 0 || 1; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  // Flat colors from the moodboard, each with the ink that reads on it.
  const TONES = [['#DCD3EF', '#191919'], ['#ECCBBD', '#191919'], ['#ECD0D6', '#191919'], ['#191919', '#F7F7F5'], ['#E8E3DC', '#191919'], ['#C9BCE5', '#191919'], ['#F3E1D8', '#191919'], ['#3A3A3A', '#F7F7F5'], ['#E9BBA9', '#191919'], ['#EFEAF6', '#191919'], ['#F4E5E8', '#191919'], ['#D8D6D1', '#191919']]; /* chala v3: muted premium palette */
  const HABITS = { 'Food delivery': ['orders', 'box'], 'Cafés': ['coffees', 'cup'], 'Shopping': ['packages', 'bag'], 'Groceries': ['grocery runs', 'basket'] };
  const mName = (k, o = { month: 'long' }) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1).toLocaleDateString('en-US', o);

  // Small flat motif for the month's biggest habit.
  const motif = (kind, ink) => ({
    box: `<path d="M8 16h32l-4 26H12z" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M8 16l5-7h22l5 7M19 9c0-7 10-7 10 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
    cup: `<path d="M12 14h24l-3 30H15z" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><rect x="9" y="7" width="30" height="7" rx="2" fill="none" stroke="${ink}" stroke-width="3"/><path d="M14 26h20" stroke="${ink}" stroke-width="3"/>`,
    bag: `<path d="M9 16h30l-3 28H12z" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M17 16c0-10 14-10 14 0" fill="none" stroke="${ink}" stroke-width="3"/>`,
    basket: `<path d="M6 20h36l-5 22H11z" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M14 20l8-12M34 20l-8-12M17 28v8M24 28v8M31 28v8" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`
  })[kind] || '';

  function monthsFrom(rows) {
    const by = {};
    rows.forEach(r => { if (r.kind !== 'expense' || !r.date || !(r.cents > 0)) return; const k = r.date.slice(0, 7); (by[k] ??= { key: k, n: 0, cats: {} }); by[k].n++; by[k].cats[r.category] = (by[k].cats[r.category] || 0) + 1; });
    return Object.values(by).sort((a, b) => a.key.localeCompare(b.key)).map((m, i) => {
      const top = Object.entries(m.cats).filter(([c]) => HABITS[c]).sort((a, b) => b[1] - a[1])[0];
      const tone = TONES[(+m.key.slice(5, 7) - 1) % TONES.length];
      return { ...m, idx: i, tone, stat: top ? `${top[1]} ${HABITS[top[0]][0]}` : `${m.n} purchases`, glyph: top ? HABITS[top[0]][1] : 'bag' };
    });
  }

  const card = (m, extra = '') => `<button class="wg-card ${extra}" data-g="${extra.includes('is-year') ? 'mbreak' : 'mwrap'}" data-k="${m.key}" style="--bg:${m.tone[0]};--ink:${m.tone[1]}" aria-label="${esc(mName(m.key, { month: 'long', year: 'numeric' }))}, ${esc(m.stat)}">
    <span class="wg-y">${esc(mName(m.key, { month: 'short' }).toUpperCase())} · ${m.key.slice(0, 4)}</span>
    <b class="wg-m">${esc(mName(m.key, { month: 'short' }))}</b>
    <svg class="wg-g" viewBox="0 0 48 48" aria-hidden="true">${motif(m.glyph, m.tone[1])}</svg>
    <span class="wg-s">${esc(m.stat)}</span></button>`;

  function render(host, api) {
    const months = monthsFrom(api.rows || []);
    let tab = api.tab || 'monthly';
    host.innerHTML = `<div class="wg">
  <div class="wg-tabs" role="tablist" aria-label="Wraps by"><button role="tab" data-g="tab" data-t="monthly">Monthly</button><button role="tab" data-g="tab" data-t="yearly">Yearly</button><i class="wg-tab-ind" aria-hidden="true"></i></div>
  <div class="wg-panel"></div>
  ${api.sample ? '<p class="wg-note">Sample months. Add your statements and your own wraps appear here.</p>' : ''}
</div>`;
    const panel = host.querySelector('.wg-panel');
    if (!months.length) { panel.innerHTML = '<p class="wg-empty">Your wraps appear here once a month of purchases is in.</p>'; return; }

    function setTab(t) {
      tab = t; api.onTab?.(t);
      host.querySelectorAll('[data-g="tab"]').forEach(b => { const on = b.dataset.t === t; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      host.querySelector('.wg').dataset.view = t;
      t === 'monthly' ? garden() : decks();
    }

    // ---------- monthly: the garden ----------
    function garden() {
      const rnd = seeded(months.length * 31 + 7), list = [...months].reverse();
      const cols = Math.max(3, Math.ceil(Math.sqrt(list.length * 1.4))), rows = Math.ceil(list.length / cols);
      const cw = 190, ch = 240, W = cols * cw + 80, H = rows * ch + 80;
      panel.innerHTML = `<p class="wg-hint">Drag around. Tap a month to watch it.</p><div class="wg-garden" tabindex="0" aria-label="Months, scattered. Scroll or drag to explore."><div class="wg-canvas" style="width:${W}px;height:${H}px">${list.map((m, i) => {
        const c = i % cols, r = Math.floor(i / cols), x = 40 + c * cw + (rnd() - .5) * 60 + (r % 2 ? cw * .35 : 0), y = 40 + r * ch + (rnd() - .5) * 50, rot = (rnd() - .5) * 22;
        return `<div class="wg-spot" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--r:${rot.toFixed(1)}deg;--f:${(5 + rnd() * 4).toFixed(1)}s;--d:${(-rnd() * 5).toFixed(1)}s;--i:${i}">${card(m)}</div>`;
      }).join('')}</div></div>`;
      const g = panel.querySelector('.wg-garden');
      // Start with the newest month in view, slightly in from the edge.
      g.scrollLeft = 0; g.scrollTop = 0;
      if (!reduce()) panel.querySelectorAll('.wg-spot').forEach(s => s.animate([{ opacity: 0, transform: `translateY(30px) rotate(var(--r)) scale(.85)` }, { opacity: 1, transform: 'rotate(var(--r))' }], { duration: 700, delay: 60 * +s.style.getPropertyValue('--i'), easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' }));
      // Drag to pan with a mouse; touch scrolls natively.
      let sx = null, sy = 0, sl = 0, st = 0, moved = false;
      g.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; sx = e.clientX; sy = e.clientY; sl = g.scrollLeft; st = g.scrollTop; moved = false; });
      g.addEventListener('pointermove', e => { if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (Math.abs(dx) + Math.abs(dy) > 6) { moved = true; g.classList.add('is-drag'); } g.scrollLeft = sl - dx; g.scrollTop = st - dy; });
      const end = () => { sx = null; g.classList.remove('is-drag'); };
      g.addEventListener('pointerup', end); g.addEventListener('pointerleave', end);
      g.addEventListener('click', e => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);
    }

    // ---------- yearly: decks ----------
    function decks() {
      const years = Object.values(months.reduce((o, m) => { const y = m.key.slice(0, 4); (o[y] ??= { y, months: [] }).months.push(m); return o; }, {})).sort((a, b) => b.y.localeCompare(a.y));
      panel.innerHTML = `<div class="wg-decks">${years.map(Y => { const n = Y.months.reduce((s, m) => s + m.n, 0); return `<button class="wg-deck" data-g="deck" data-y="${Y.y}" aria-label="${Y.y}: ${Y.months.length} months. Open the deck.">
    <span class="wg-layer l3" aria-hidden="true"></span><span class="wg-layer l2" aria-hidden="true"></span>
    <span class="wg-front"><span class="wg-yr">${Y.y}</span><span class="wg-strip" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => { const m = Y.months.find(x => +x.key.slice(5, 7) === i + 1); return `<i style="background:${m ? m.tone[0] : 'transparent'}"></i>`; }).join('')}</span><span class="wg-meta">${Y.months.length} ${Y.months.length === 1 ? 'month' : 'months'} · ${n} purchases</span><span class="wg-open">Open the deck</span></span>
  </button>`; }).join('')}</div>`;
      host._years = years;
      if (!reduce()) panel.querySelectorAll('.wg-deck').forEach((d, i) => d.animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: i * 90, easing: EASE, fill: 'backwards' }));
    }
    function openDeck(y, from) {
      const Y = host._years.find(x => x.y === y); if (!Y) return;
      const ov = document.createElement('div'); ov.className = 'wg-open-deck';
      ov.innerHTML = `<div class="wg-od-h"><div><p class="wg-od-k">Your year</p><h2 class="wg-od-t">${y}</h2></div><button class="wg-x" data-g="close" aria-label="Close the deck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <p class="wg-od-s">Tap a month for the full breakdown.</p>
  <div class="wg-grid">${[...Y.months].reverse().map(m => card(m, 'is-year')).join('')}</div>`;
      host.querySelector('.wg').append(ov);
      document.querySelector('.fh-nav')?.classList.add('is-hidden');
      const r = from.getBoundingClientRect();
      if (!reduce()) {
        ov.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
        ov.querySelectorAll('.wg-grid .wg-card').forEach((c, i) => { const b = c.getBoundingClientRect(), dx = r.left + r.width / 2 - (b.left + b.width / 2), dy = r.top + r.height / 2 - (b.top + b.height / 2); c.animate([{ transform: `translate(${dx}px,${dy}px) rotate(${(i % 3 - 1) * 6}deg) scale(.8)`, opacity: .4 }, { transform: 'none', opacity: 1 }], { duration: 700, delay: i * 45, easing: 'cubic-bezier(.3,1.2,.5,1)', fill: 'backwards' }); });
      }
      ov.querySelector('.wg-od-t').setAttribute('tabindex', '-1'); ov.querySelector('.wg-od-t').focus({ preventScroll: true });
      const close = () => { document.querySelector('.fh-nav')?.classList.remove('is-hidden'); if (reduce()) { ov.remove(); from.focus(); return; } ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => { ov.remove(); from.focus({ preventScroll: true }); }); };
      ov.addEventListener('click', e => { if (e.target.closest('[data-g="close"]')) close(); });
      ov.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    // ---------- clicks ----------
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      const g = b.dataset.g;
      if (g === 'tab') { if (b.dataset.t !== tab) setTab(b.dataset.t); return; }
      if (g === 'deck') { openDeck(b.dataset.y, b); return; }
      if (g === 'mwrap' || g === 'mbreak') {
        const go = () => (g === 'mwrap' ? api.onWrap : api.onBreakdown)(b.dataset.k);
        document.querySelector('.fh-nav')?.classList.remove('is-hidden');
        if (reduce()) { go(); return; }
        b.animate([{ transform: 'none' }, { transform: 'scale(1.12) rotate(0deg)' }], { duration: 260, easing: EASE, fill: 'forwards' });
        setTimeout(go, 220);
      }
    });
    host.addEventListener('keydown', e => { const t = e.target.closest('[data-g="tab"]'); if (t && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); setTab(tab === 'monthly' ? 'yearly' : 'monthly'); host.querySelector(`[data-t="${tab}"]`).focus(); } });
    setTab(tab);
  }

  window.FaiitGallery = { render, monthsFrom };
})();
