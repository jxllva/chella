/* chala v3 — Home: the shell chart, drawn inside the spending card (in place of the money tree).
   Week: a column per day, M–S, where every shell is a slice of what you spent, colored by kind of spending.
   Month: a calendar of shells, one per day, shaded from chill (light) to heavy (deep) against your usual day.
   Visual only: ChalaTree hands it the numbers (Home's shellData) on every paint. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  // an upright scallop: the logo's shell turned so the hinge sits at the bottom
  const SYMBOL = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="cs-shell" viewBox="0 0 70.4 65.4"><g transform="translate(70.4 0) rotate(90)"><path d="M 56.7 32.9 L 39.9 7.2 C 32.7 0.0 17.2 5.3 24.4 12.5 L 56.0 33.3Z"/><path d="M 55.8 33.4 L 22.7 13.4 C 14.8 10.0 4.0 18.9 12.0 22.3 L 55.3 34.1Z"/><path d="M 55.3 34.3 L 11.0 23.6 C 3.9 22.7 0.0 33.6 7.1 34.5 L 55.1 35.1Z"/><path d="M 55.1 35.3 L 7.1 35.9 C 0.0 36.8 3.9 47.7 11.0 46.8 L 55.3 36.1Z"/><path d="M 55.3 36.3 L 12.0 48.1 C 4.0 51.5 14.8 60.4 22.7 57.0 L 55.8 37.0Z"/><path d="M 56.0 37.1 L 24.4 57.9 C 17.2 65.1 32.7 70.4 39.9 63.2 L 56.7 37.5Z"/><path d="M 58.3 12.7 Q 64.1 12.7 63.8 18.2 Q 65.4 35.2 63.8 52.2 Q 64.1 57.7 58.3 57.7 Q 51.7 57.7 52.8 52.2 Q 53.6 35.2 52.8 18.2 Q 51.7 12.7 58.3 12.7Z"/></g></symbol></defs></svg>`;
  const KINDS = [['food', 'Food', '#E8643F'], ['cafe', 'Cafés', '#E3A33C'], ['shop', 'Shopping', '#9C8BD6'], ['move', 'Transport', '#4E9C8B'], ['other', 'Other', '#BDB5AA']];
  // month shades, chill to heavy, against a usual day
  const LEVELS = [[0, '#EFEBE6', 'No spending'], [.6, '#FBD5C4', 'Chill'], [1.35, '#F4A383', 'Usual'], [2.1, '#E5603C', 'Heavy'], [Infinity, '#A93A1E', 'Overspent']];
  const level = (c, usual) => !c ? 0 : LEVELS.findIndex(([t], i) => i > 0 && c / usual <= t);
  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], DOWL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shell = (fill, cls = '', style = '') => `<svg class="cs-sh ${cls}" viewBox="0 0 70.4 65.4" style="${style}" aria-hidden="true"><use href="#cs-shell" fill="${fill}"></use></svg>`;
  const UNITS = [500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
  const MAXSTACK = 9;
  const SHELL = '#EC7A58';

  // draws the chart into a card that already has .cs-stage, .cs-detail and .cs-legend
  function render(host, D, { mode = 'W', animate = true, hide = false } = {}) {
    if (!host || !D) return;
    const $ = s => host.querySelector(s);
    const money = c => hide ? '$•••' : D.money(c);
    if (host._csKey !== D.label) host._csSel = null;
    host._csKey = D.label;
    const sel = host._csSel;
    if (!host._csBound) {
      host._csBound = true;
      host.addEventListener('click', e => {
        const b = e.target.closest('[data-day]'); if (!b || !host._csLast) return;
        e.stopPropagation();
        host._csSel = host._csSel === b.dataset.day ? null : b.dataset.day;
        render(host, host._csLast.D, { ...host._csLast.o, animate: false });
      });
    }
    host._csLast = { D, o: { mode, hide } };

    const dayLine = d => {
      const name = new Date(d.iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (d.future) return `${name} · still to come`;
      if (!d.total) return `${name} · nothing spent`;
      const parts = KINDS.filter(([k]) => d.cats[k]).map(([k, n]) => `${n} ${money(d.cats[k])}`).join(', ');
      return `${name} · <b>${money(d.total)}</b> · ${LEVELS[level(d.total, D.usual)][2].toLowerCase()} day<span class="cs-parts">${parts}</span>`;
    };
    // the selected day as a small card: date and amount up front, how heavy it was, then what it went on
    const dayCard = d => {
      const wd = new Date(d.iso + 'T12:00:00'), day = wd.toLocaleDateString('en-US', { weekday: 'long' }), date = wd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const lv = d.future ? -1 : level(d.total, D.usual);
      const tag = d.future ? 'Still to come' : !d.total ? 'Nothing spent' : LEVELS[lv][2] + ' day';
      const parts = KINDS.filter(([k]) => d.cats[k]).sort((a, b) => d.cats[b[0]] - d.cats[a[0]]).map(([k, n, c]) => `<span class="cs-day-p">${n}<b>${money(d.cats[k])}</b></span>`).join('');
      return `<div class="cs-day lv-${lv}">
        <div class="cs-day-top"><span class="cs-day-when"><b>${date}</b><span>${day}</span></span>
          <span class="cs-day-r"><b class="cs-day-amt">${d.future ? '–' : money(d.total)}</b><span class="cs-day-lv">${tag}</span></span></div>
        ${parts ? `<div class="cs-day-parts">${parts}</div>` : ''}</div>`;
    };
    const label = x => esc(dayLine(x).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

    function week() {
      const past = D.days.filter(x => !x.future), avg = past.length ? past.reduce((t, x) => t + x.total, 0) / past.length : 0;
      // the same scale for every week (from Home), so a shell and a grid line always mean the same amount
      const top = Math.max(D.scaleMax || 0, ...D.days.map(x => x.total), 1);
      const unit = UNITS.find(u => Math.ceil(top / u) <= 8) || UNITS.at(-1);
      const nMax = Math.max(2, Math.ceil(top / unit)), every = nMax > 5 ? 2 : 1, SLOT = 22, H = nMax * SLOT;
      const y = v => v / unit * SLOT;
      const ticks = []; for (let k = 0; k <= nMax; k += every) ticks.push(k);
      const stackOf = x => {
        // shells per kind, by largest remainder, so the stack adds up to the day
        const n = x.total ? Math.min(nMax, Math.max(1, Math.round(x.total / unit))) : 0;
        const raw = KINDS.map(([k]) => (x.cats[k] || 0) / unit), fl = raw.map(Math.floor);
        let left = n - fl.reduce((a, b) => a + b, 0);
        raw.map((r, j) => [r - fl[j], j]).sort((a, b) => b[0] - a[0]).forEach(([, j]) => { if (left > 0 && raw[j] > 0) { fl[j]++; left--; } });
        while (fl.reduce((a, b) => a + b, 0) > n) { const j = fl.findIndex((v, k) => v > 0 && fl.slice(k + 1).every(w => !w)); fl[j]--; }
        // one colour for every shell: the stack is the amount; what it went on lives in the day card
        const st = []; KINDS.forEach((_, j) => { for (let t = 0; t < fl[j]; t++) st.push(SHELL); });
        return st;
      };
      const cols = D.days.map((x, i) => {
        const lv = level(x.total, D.usual), st = stackOf(x);
        return `<button class="cs-col${x.future ? ' is-future' : ''}${x.today ? ' is-today' : ''}${lv >= 3 ? ' is-heavy' : ''}${sel === x.iso ? ' is-sel' : ''}" data-day="${x.iso}" aria-label="${label(x)}">
          <span class="cs-stack">${st.map((c, k) => shell(c, '', `--k:${k};--i:${i}`)).join('') || (x.future ? '' : '<i class="cs-none"></i>')}</span></button>`;
      }).join('');
      const dows = D.days.map((x, i) => `<button class="cs-dow${x.future ? ' is-future' : ''}${x.today ? ' is-today' : ''}${level(x.total, D.usual) >= 3 ? ' is-heavy' : ''}" data-day="${x.iso}" tabindex="-1" aria-hidden="true">${DOW[i]}</button>`).join('');
      const tick = k => `<span class="cs-tick" style="--y:${k * SLOT}px">${hide && k ? '•••' : '$' + Math.round(k * unit / 100)}</span>`;
      const ay = Math.min(H, y(avg)), legendTop = ay < H * .55;
      const legend = KINDS.slice(0, 4).map(([k, n, c]) => `<span class="${D.days.some(x => x.cats[k]) ? '' : 'is-off'}"><i style="background:${c}"></i>${n}</span>`).join('');
      return `<div class="cs-wk" style="--h:${H}px">
        <div class="cs-axis" aria-hidden="true">${ticks.map(tick).join('')}</div>
        <div class="cs-plot">${ticks.slice(1).map(k => `<i class="cs-grid-l" style="--y:${k * SLOT}px"></i>`).join('')}
          ${avg ? `<span class="cs-avg" style="--y:${ay.toFixed(1)}px" aria-hidden="true"></span>` : ''}
          <div class="cs-cols">${cols}</div></div>
        <div class="cs-side">
          ${avg ? `<span class="cs-avg-tag" style="--y:${ay.toFixed(1)}px"><b>${money(avg)}</b>avg/day</span>` : ''}
        </div>
        <span></span><div class="cs-dows-w">${dows}</div><span></span>
      </div>
      <p class="cs-unit">${shell(SHELL, 'cs-unit-sh')} = ${money(unit)}<span class="cs-gap"></span><span class="cs-dash"></span>average day</p>`;
    }
    function month() {
      const lead = D.days[0].dow;
      const cells = D.days.map((x, i) => {
        const lv = x.future ? -1 : level(x.total, D.usual);
        return `<button class="cs-cell${x.future ? ' is-future' : ''}${x.today ? ' is-today' : ''}${sel === x.iso ? ' is-sel' : ''}" data-day="${x.iso}" style="--i:${i}" aria-label="${label(x)}">
          ${x.future ? '<i class="cs-ghost"></i>' : shell(LEVELS[lv][1], lv === 0 ? 'is-empty' : '')}<span class="cs-n">${x.n}</span></button>`;
      }).join('');
      return `<div class="cs-month"><div class="cs-dows">${DOW.map(w => `<span>${w}</span>`).join('')}</div><div class="cs-grid">${'<span></span>'.repeat(lead)}${cells}</div></div>`;
    }

    if (!host.querySelector('#cs-shell')) host.insertAdjacentHTML('afterbegin', SYMBOL);
    host.classList.add('cs');
    host.classList.toggle('is-month', mode === 'M');
    host.classList.toggle('no-anim', !animate || reduce());
    $('.cs-stage').innerHTML = mode === 'M' ? month() : week();
    const s = sel && D.days.find(x => x.iso === sel);
    $('.cs-detail').innerHTML = s ? dayCard(s) : '<span class="cs-sum">Tap a day to see spending details</span>';
    $('.cs-legend').innerHTML = mode === 'M'
      ? `<div class="cs-keybox" role="img" aria-label="Key: lighter shells are chill days, deeper shells are heavy days"><span class="cs-keyh">Key</span>${LEVELS.map(([, c, n], i) => `<span class="cs-keyi">${shell(c, 'cs-key' + (i ? '' : ' is-empty'))}<em>${['None', 'Chill', 'Usual', 'Heavy', 'Over'][i]}</em></span>`).join('')}</div>`
      : '';
  }

  /* Saving: the shell as a radial meter. It fills rib by rib, sweeping from left to right around the hinge,
     as far as what you've saved has come toward your goals. */
  function meter(el, saved, goal, { hide = false, money = c => '$' + Math.round(c / 100) } = {}) {
    if (!el) return;
    const pct = goal > 0 ? Math.max(0, Math.min(1, saved / goal)) : 0, cx = 35.2, cy = 57, R = 80;
    const wedge = t => {
      if (t <= 0) return 'M0 0Z';
      const a = Math.PI * (1 - t), x = cx + R * Math.cos(a), y = cy - R * Math.sin(a);
      return `M${cx} ${cy}L${cx - R} ${cy}A${R} ${R} 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}Z M${cx - R} ${cy}H${cx + R}V${cy + 20}H${cx - R}Z`;
    };
    const id = 'csm' + Math.random().toString(36).slice(2, 7);
    el.innerHTML = `${SYMBOL.replace('id="cs-shell"', `id="${id}s"`)}<svg class="csm-sh" viewBox="0 0 70.4 65.4" aria-hidden="true">
      <defs><linearGradient id="${id}g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#E0552F"></stop><stop offset="1" stop-color="#F4A383"></stop></linearGradient>
      <clipPath id="${id}c"><path d="${wedge(reduce() ? pct : 0)}"></path></clipPath></defs>
      <use href="#${id}s" fill="#F5E4DB"></use><use href="#${id}s" fill="url(#${id}g)" clip-path="url(#${id}c)"></use></svg>
      <span class="csm-pct">${goal > 0 ? Math.round(pct * 100) + '%' : ''}</span>`;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', goal > 0 ? `Shell ${Math.round(pct * 100)}% full: ${hide ? '' : money(saved) + ' saved of ' + money(goal)}` : 'Shell empty: no goal set yet');
    if (reduce() || !pct) return;
    const path = el.querySelector('clipPath path'), t0 = performance.now(), dur = 1100 + pct * 500;
    const tickF = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); path.setAttribute('d', wedge(pct * e)); if (k < 1 && el.isConnected) requestAnimationFrame(tickF); };
    requestAnimationFrame(tickF);
  }

  window.ChalaShells = { render, meter };
})();
