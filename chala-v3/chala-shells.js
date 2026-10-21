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
  const KINDS = [['food', 'Food', '#E8643F'], ['cafe', 'Cafés', '#E3A33C'], ['shop', 'Shopping', '#9C8BD6'], ['move', 'Getting around', '#4E9C8B'], ['other', 'Other', '#BDB5AA']];
  // month shades, chill to heavy, against a usual day
  const LEVELS = [[0, '#EFEBE6', 'No spending'], [.6, '#FBD5C4', 'Chill'], [1.35, '#F4A383', 'Usual'], [2.1, '#E5603C', 'Heavy'], [Infinity, '#A93A1E', 'Overspent']];
  const level = (c, usual) => !c ? 0 : LEVELS.findIndex(([t], i) => i > 0 && c / usual <= t);
  const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], DOWL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shell = (fill, cls = '', style = '') => `<svg class="cs-sh ${cls}" viewBox="0 0 70.4 65.4" style="${style}" aria-hidden="true"><use href="#cs-shell" fill="${fill}"></use></svg>`;
  const UNITS = [500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
  const MAXSTACK = 9;

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
    const label = x => esc(dayLine(x).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));

    function week() {
      const max = Math.max(...D.days.map(x => x.total), D.usual);
      const unit = UNITS.find(u => Math.ceil(max / u) <= MAXSTACK) || UNITS.at(-1);
      const STEP = 15, usualY = Math.min(MAXSTACK, D.usual / unit) * STEP;
      const cols = D.days.map((x, i) => {
        // shells per kind, by largest remainder, so the stack adds up to the day
        const n = x.total ? Math.max(1, Math.round(x.total / unit)) : 0;
        const raw = KINDS.map(([k]) => (x.cats[k] || 0) / unit), fl = raw.map(Math.floor);
        let left = n - fl.reduce((a, b) => a + b, 0);
        raw.map((r, j) => [r - fl[j], j]).sort((a, b) => b[0] - a[0]).forEach(([, j]) => { if (left > 0 && raw[j] > 0) { fl[j]++; left--; } });
        while (fl.reduce((a, b) => a + b, 0) > n) { const j = fl.findIndex((v, k) => v > 0 && fl.slice(k + 1).every(w => !w)); fl[j]--; }
        const stack = []; KINDS.forEach(([, , c], j) => { for (let t = 0; t < fl[j]; t++) stack.push(c); });
        const lv = level(x.total, D.usual);
        return `<button class="cs-col${x.future ? ' is-future' : ''}${x.today ? ' is-today' : ''}${lv >= 3 ? ' is-heavy' : ''}${sel === x.iso ? ' is-sel' : ''}" data-day="${x.iso}" aria-label="${label(x)}">
          <span class="cs-stack">${stack.map((c, k) => shell(c, '', `--k:${k};--i:${i}`)).join('') || (x.future ? '' : '<i class="cs-none"></i>')}</span>
          <span class="cs-dow">${DOW[i]}</span></button>`;
      }).join('');
      return `<div class="cs-week" style="--usual:${usualY.toFixed(1)}px"><span class="cs-usual" aria-hidden="true"></span>${cols}</div>
        <p class="cs-unit"><span class="cs-dash"></span>usual day<span class="cs-gap"></span>${shell('#E8643F', 'cs-unit-sh')} = ${money(unit)}</p>`;
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
    const past = D.days.filter(x => !x.future), heavy = past.filter(x => level(x.total, D.usual) >= 3).length, chill = past.filter(x => level(x.total, D.usual) <= 1).length;
    const s = sel && D.days.find(x => x.iso === sel);
    $('.cs-detail').innerHTML = s ? dayLine(s) : `<span class="cs-sum">${chill} chill · ${heavy} heavy ${heavy === 1 ? 'day' : 'days'} · tap a day</span>`;
    $('.cs-legend').innerHTML = mode === 'M'
      ? `<span class="cs-scale">Chill ${LEVELS.slice(1).map(([, c]) => shell(c, 'cs-key')).join('')} Heavy</span>`
      : KINDS.filter(([k]) => D.days.some(x => x.cats[k])).map(([, n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join('');
  }

  window.ChalaShells = { render };
})();
