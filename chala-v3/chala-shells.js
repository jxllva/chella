/* chala v3 — Home: the shell chart (replaces the money tree).
   Week: a column per day, M–S, where every shell is a slice of what you spent, colored by kind of spending.
   Month: a calendar of shells, one per day, shaded from chill (light) to heavy (deep) against your usual day.
   Visual only: all numbers come from Home through getData(mode, offset). */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  // an upright scallop: the logo's shell turned so the hinge sits at the bottom
  const SYMBOL = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="cs-shell" viewBox="0 0 70.4 65.4"><g transform="translate(70.4 0) rotate(90)"><path d="M 56.7 32.9 L 39.9 7.2 C 32.7 0.0 17.2 5.3 24.4 12.5 L 56.0 33.3Z"/><path d="M 55.8 33.4 L 22.7 13.4 C 14.8 10.0 4.0 18.9 12.0 22.3 L 55.3 34.1Z"/><path d="M 55.3 34.3 L 11.0 23.6 C 3.9 22.7 0.0 33.6 7.1 34.5 L 55.1 35.1Z"/><path d="M 55.1 35.3 L 7.1 35.9 C 0.0 36.8 3.9 47.7 11.0 46.8 L 55.3 36.1Z"/><path d="M 55.3 36.3 L 12.0 48.1 C 4.0 51.5 14.8 60.4 22.7 57.0 L 55.8 37.0Z"/><path d="M 56.0 37.1 L 24.4 57.9 C 17.2 65.1 32.7 70.4 39.9 63.2 L 56.7 37.5Z"/><path d="M 58.3 12.7 Q 64.1 12.7 63.8 18.2 Q 65.4 35.2 63.8 52.2 Q 64.1 57.7 58.3 57.7 Q 51.7 57.7 52.8 52.2 Q 53.6 35.2 52.8 18.2 Q 51.7 12.7 58.3 12.7Z"/></g></symbol></defs></svg>`;
  const KINDS = [['food', 'Food', '#E8643F'], ['cafe', 'Cafés', '#E3A33C'], ['shop', 'Shopping', '#9C8BD6'], ['move', 'Getting around', '#4E9C8B'], ['other', 'Other', '#BDB5AA']];
  // month shades, chill to heavy, against a usual day
  const LEVELS = [[0, '#EFEBE6', 'No spending'], [.6, '#FBD5C4', 'Chill'], [1.35, '#F4A383', 'Usual'], [2.1, '#E5603C', 'Heavy'], [Infinity, '#A93A1E', 'Overspent']];
  const level = (c, usual) => !c ? 0 : LEVELS.findIndex(([t], i) => i > 0 && c / usual <= t);
  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], DOWL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shell = (fill, cls = '', style = '') => `<svg class="cs-sh ${cls}" viewBox="0 0 70.4 65.4" style="${style}" aria-hidden="true"><use href="#cs-shell" fill="${fill}"></use></svg>`;
  const UNITS = [500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
  const MAXSTACK = 9;

  function mount(host, opts) {
    if (!host) return;
    const st = { mode: opts.mode || 'W', offset: 0, sel: null };
    host.innerHTML = `${SYMBOL}
      <div class="mt-top cs-top">
        <div class="cs-head"><span class="cs-k"></span><b class="cs-total"></b></div>
        <div class="mt-seg" role="tablist" aria-label="Period">
          <button role="tab" data-m="W" aria-label="Week">W</button><button role="tab" data-m="M" aria-label="Month">M</button>
        </div>
      </div>
      <div class="mt-stage cs-stage"></div>
      <p class="cs-detail" aria-live="polite"></p>
      <div class="cs-legend"></div>
      <div class="mt-pagerwrap"><div class="mt-pager">
        <button class="mt-arrow" data-d="-1" aria-label="Previous">${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button>
        <span class="mt-range" aria-live="polite"></span>
        <button class="mt-arrow" data-d="1" aria-label="Next">${I('<path d="M9.5 6l6 6-6 6"/>')}</button>
      </div></div>
      <div class="mt-actions">
        <button class="mt-wrapped" aria-label="Play your Wrapped">${I('<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8c-1.5-3.5-5.5-3.5-5.5-1S10 8 12 8zM12 8c1.5-3.5 5.5-3.5 5.5-1S14 8 12 8z"/>')}</button>
        <button class="mt-recap">Recap</button>
      </div>`;
    const $ = s => host.querySelector(s), $$ = s => [...host.querySelectorAll(s)];
    let D = null;

    const dayLine = d => {
      const name = new Date(d.iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (d.future) return `${name} · still to come`;
      if (!d.total) return `${name} · nothing spent`;
      const parts = KINDS.filter(([k]) => d.cats[k]).map(([k, n]) => `${n} ${D.money(d.cats[k])}`).join(', ');
      return `${name} · <b>${D.money(d.total)}</b> · ${LEVELS[level(d.total, D.usual)][2].toLowerCase()} day<span class="cs-parts">${parts}</span>`;
    };

    function week(d) {
      const max = Math.max(...d.days.map(x => x.total), d.usual);
      const unit = UNITS.find(u => Math.ceil(max / u) <= MAXSTACK) || UNITS.at(-1);
      const STEP = 15, usualY = Math.min(MAXSTACK, d.usual / unit) * STEP;
      const cols = d.days.map((x, i) => {
        // shells per kind, by largest remainder, so the stack adds up to the day
        const n = x.total ? Math.max(1, Math.round(x.total / unit)) : 0;
        const raw = KINDS.map(([k]) => (x.cats[k] || 0) / unit), fl = raw.map(Math.floor);
        let left = n - fl.reduce((a, b) => a + b, 0);
        raw.map((r, j) => [r - fl[j], j]).sort((a, b) => b[0] - a[0]).forEach(([, j]) => { if (left > 0 && raw[j] > 0) { fl[j]++; left--; } });
        while (fl.reduce((a, b) => a + b, 0) > n) { const j = fl.findIndex((v, k) => v > 0 && fl.slice(k + 1).every(w => !w)); fl[j]--; }
        const stack = []; KINDS.forEach(([, , c], j) => { for (let t = 0; t < fl[j]; t++) stack.push(c); });
        const lv = level(x.total, d.usual);
        return `<button class="cs-col${x.future ? ' is-future' : ''}${x.today ? ' is-today' : ''}${lv >= 3 ? ' is-heavy' : ''}${st.sel === x.iso ? ' is-sel' : ''}" data-day="${x.iso}" aria-label="${esc(dayLine(x).replace(/<[^>]+>/g, ' '))}">
          <span class="cs-stack">${stack.map((c, k) => shell(c, '', `--k:${k};--i:${i}`)).join('') || (x.future ? '' : '<i class="cs-none"></i>')}</span>
          <span class="cs-dow">${DOW[i]}</span></button>`;
      }).join('');
      return `<div class="cs-week" style="--usual:${usualY.toFixed(1)}px"><span class="cs-usual" aria-hidden="true"></span>${cols}</div>
        <p class="cs-unit"><span class="cs-dash"></span>usual day<span class="cs-gap"></span>${shell('#E8643F', 'cs-unit-sh')} = ${D.money(unit)}</p>`;
    }

    function month(d) {
      const lead = d.days[0].dow;
      const cells = d.days.map((x, i) => {
        const lv = x.future ? -1 : level(x.total, d.usual);
        return `<button class="cs-cell${x.future ? ' is-future' : ''}${x.today ? ' is-today' : ''}${st.sel === x.iso ? ' is-sel' : ''}" data-day="${x.iso}" style="--i:${i}" aria-label="${esc(dayLine(x).replace(/<[^>]+>/g, ' '))}">
          ${x.future ? '<i class="cs-ghost"></i>' : shell(LEVELS[lv][1], lv === 0 ? 'is-empty' : '')}<span class="cs-n">${x.n}</span></button>`;
      }).join('');
      return `<div class="cs-month"><div class="cs-dows">${DOW.map(w => `<span>${w}</span>`).join('')}</div>
        <div class="cs-grid">${'<span></span>'.repeat(lead)}${cells}</div></div>`;
    }

    function paint(animate) {
      D = opts.getData(st.mode, st.offset);
      $$('.mt-seg button').forEach(b => { const on = b.dataset.m === st.mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      $('.mt-range').textContent = D.label;
      $('[data-d="-1"]').disabled = !D.hasPrev; $('[data-d="1"]').disabled = !D.hasNext;
      const past = D.days.filter(x => !x.future), heavy = past.filter(x => level(x.total, D.usual) >= 3).length, chill = past.filter(x => level(x.total, D.usual) <= 1).length;
      $('.cs-k').textContent = st.offset === 0 ? (st.mode === 'W' ? 'This week' : 'This month') : D.label;
      $('.cs-total').textContent = D.money(D.total);
      host.classList.toggle('is-month', st.mode === 'M');
      host.classList.toggle('no-anim', !animate || reduce());
      $('.cs-stage').innerHTML = st.mode === 'W' ? week(D) : month(D);
      const sel = st.sel && D.days.find(x => x.iso === st.sel);
      $('.cs-detail').innerHTML = sel ? dayLine(sel) : `<span class="cs-sum">${chill} chill · ${heavy} heavy ${heavy === 1 ? 'day' : 'days'}</span>`;
      $('.cs-legend').innerHTML = st.mode === 'W'
        ? KINDS.filter(([k]) => D.days.some(x => x.cats[k])).map(([, n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('')
        : `<span class="cs-scale">Chill ${LEVELS.slice(1).map(([, c]) => shell(c, 'cs-key')).join('')} Heavy</span>`;
    }

    const go = dir => { if (!opts.getData(st.mode, st.offset + dir)) return; st.offset += dir; st.sel = null; paint(true); };
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m && b.dataset.m !== st.mode) { st.mode = b.dataset.m; st.offset = 0; st.sel = null; opts.onMode?.(st.mode); paint(true); return; }
      if (b.dataset.d) { go(+b.dataset.d); return; }
      if (b.dataset.day) { st.sel = st.sel === b.dataset.day ? null : b.dataset.day; paint(false); return; }
      if (b.classList.contains('mt-wrapped')) { opts.onWrapped?.(); return; }
      if (b.classList.contains('mt-recap')) { opts.onRecap?.(st.mode === 'W' ? 'W' : 'M', st.offset); return; }
    });
    // swipe across the chart to move between periods
    let sx = null, sy = 0;
    const stage = $('.cs-stage');
    stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', e => {
      if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { host.dataset.swiped = '1'; go(dx < 0 ? 1 : -1); setTimeout(() => delete host.dataset.swiped, 50); }
    });
    stage.addEventListener('click', e => { if (host.dataset.swiped) e.stopImmediatePropagation(); }, true);
    paint(true);
  }

  window.ChalaShells = { mount };
})();
