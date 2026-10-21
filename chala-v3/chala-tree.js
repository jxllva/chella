/* chala v3 — the money tree on Home.
   One tree stands for overall spending in a week or a month:
   - Leaves fill in when you're pacing well under your limits, thin out as you overspend.
   - Over budget, some leaves turn amber and rust, and a few lie fallen on the ground.
   - The leaves are banknotes. Tap the tree for a ring of spent / saved / left.
   Interaction: tap the tree to shake it (leaves drift down, coins swing), swipe left/right
   (or use the arrows) to move between periods, and switch Month / Week.
   Visual only: all numbers come from Home through getData(mode, offset). */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;

  // deterministic randomness so the tree keeps its shape between renders
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- the shape: trunk, branches, a canopy of candidate leaves ---------- */
  function grow() {
    const r = rng(1906), branches = [], tips = [];
    function branch(x, y, ang, len, w, depth) {
      const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
      const cx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * len * (r() - .5) * .25, cy = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * len * (r() - .5) * .25;
      branches.push({ d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, w });
      if (depth === 0) { tips.push([x2, y2]); return; }
      const n = depth > 2 ? 2 : 2 + (r() > .55 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const spread = (k - (n - 1) / 2) * (.62 + r() * .2);
        branch(x2, y2, ang + spread + (r() - .5) * .25, len * (.68 + r() * .12), w * .66, depth - 1);
      }
      tips.push([x2, y2]);
    }
    branch(150, 196, -Math.PI / 2 + .04, 46, 6.5, 4);
    // leaves: clustered around tips and along the crown, each with a fixed rank
    const leaves = [];
    tips.forEach(([tx, ty], ti) => {
      const n = 9 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 22;
        const x = tx + Math.cos(a) * d, y = ty + Math.sin(a) * d * .82 - 4;
        if (y > 176) continue;
        leaves.push({ x, y, s: 4.2 + r() * 6.2, hue: r(), rank: r(), tilt: (r() - .5) * 70, ti });
      }
    });
    leaves.sort((a, b) => a.rank - b.rank);
    // coin spots: near the outer tips, spread around the crown
    const coinSpots = tips.filter(([, y]) => y < 140).sort((a, b) => a[0] - b[0]);
    const pick = [], step = Math.max(1, Math.floor(coinSpots.length / 7));
    for (let i = 1; i < coinSpots.length && pick.length < 7; i += step) pick.push(coinSpots[i]);
    // ground leaves
    const fallen = Array.from({ length: 18 }, () => ({ x: 92 + r() * 116, y: 206 + r() * 10, s: 3.6 + r() * 3.2, tilt: r() * 180, hue: r() }));
    return { branches, leaves, coins: pick, fallen };
  }
  const SHAPE = grow();

  // the leaves are banknotes: money greens when healthy, faded tan when spending runs hot
  const GREENS = ['#3F7350', '#4F8660', '#639A6F', '#7AAE80', '#96C297', '#B4D6AE'];
  const AUTUMN = ['#D6C08E', '#C7A76C', '#B38D52'];
  const leafPath = (x, y, s, tilt) => { const w = s * 1.7, h = s * .92;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${tilt.toFixed(0)})"><rect class="mt-b" x="${(-w / 2).toFixed(2)}" y="${(-h / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="${(h * .14).toFixed(2)}"/><rect class="mt-bi" x="${(-w / 2 + h * .16).toFixed(2)}" y="${(-h / 2 + h * .16).toFixed(2)}" width="${(w - h * .32).toFixed(2)}" height="${(h * .68).toFixed(2)}" rx="${(h * .08).toFixed(2)}"/><circle class="mt-bc" r="${(h * .24).toFixed(2)}"/></g>`; };

  function treeSVG() {
    return `<svg class="mt-svg" viewBox="40 20 220 205" role="img" aria-hidden="true">
      <defs><radialGradient id="mt-coin" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FFF1BF"/><stop offset=".55" stop-color="#EBC35E"/><stop offset="1" stop-color="#C99A35"/></radialGradient></defs>
      <ellipse class="mt-ground" cx="150" cy="212" rx="78" ry="9"/>
      <g class="mt-fallen">${SHAPE.fallen.map((f, i) => `<g class="mt-fl" data-i="${i}" style="--c:${AUTUMN[Math.floor(f.hue * 3)]}">${leafPath(f.x, f.y, f.s, f.tilt)}</g>`).join('')}</g>
      <g class="mt-tree">
        <path class="mt-trunk" d="M144 214 C146 200 146 196 147 186 L153 186 C154 196 154 200 157 214 Z"/>
        <g class="mt-branches">${SHAPE.branches.map(b => `<path d="${b.d}" stroke-width="${b.w.toFixed(2)}"/>`).join('')}</g>
        <g class="mt-leaves">${SHAPE.leaves.map((l, i) => `<g class="mt-leaf" data-i="${i}" style="--c:${GREENS[Math.floor(l.hue * GREENS.length)]};--a:${AUTUMN[Math.floor(l.hue * 3)]};--d:${(i % 40) * 9}ms">${leafPath(l.x, l.y, l.s, l.tilt)}</g>`).join('')}</g>
<g class="mt-coins"></g>
      </g>
    </svg>`;
  }

  const MOOD = [[.8, 'Flourishing'], [.58, 'Growing'], [.34, 'Thirsty'], [0, 'Wilting']];
  const usd = c => '$' + Math.round(Math.abs(c) / 100).toLocaleString('en-US');
  const HIDE = 'chala-hide-amounts-v1';
  const hidden = () => { try { return localStorage.getItem(HIDE) === '1'; } catch { return false; } };
  const EYE = I('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>');
  const EYE_OFF = I('<path d="M3 3l18 18"/><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>');
  const listJoin = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1);
  // high, moderate or comfortably below: against an even pace through the period (same rule as Home's greeting)
  function status(d) {
    if (!d.budget) return { k: 'none', t: 'No budget set yet', s: 'Add a spending limit to see how you’re doing.' };
    const pace = d.spent / Math.max(1, d.budget * d.elapsed), left = d.budget - d.spent;
    const tail = d.daysLeft > 0 ? ` · ${d.daysLeft} ${d.daysLeft === 1 ? 'day' : 'days'} to go` : '';
    if (left < 0) return { k: 'high', t: 'High: over budget', s: `${usd(-left)} over${tail}` };
    if (pace > 1.1) return { k: 'high', t: 'High: ahead of budget', s: `${usd(left)} left${tail}` };
    if (pace > .85) return { k: 'mid', t: 'Moderate: on pace', s: `${usd(left)} left${tail}` };
    return { k: 'low', t: 'Comfortably below budget', s: `${usd(left)} left${tail}` };
  }

  function mount(host, opts) {
    if (!host) return;
    const st = { mode: opts.mode || 'M', offset: 0 };
    host.classList.add('sp', 'mt-v2');
    host.innerHTML = `
      <div class="sp-top">
        <div class="sp-seg" role="tablist" aria-label="Period"><button role="tab" data-m="W">Week</button><button role="tab" data-m="M">Month</button></div>
        <span class="sp-tools"><button class="sp-info" data-a="info" aria-label="How to read this card" aria-expanded="false" aria-controls="sp-pop">${I('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.6h.01"/>')}</button><button class="sp-eye" data-a="eye"></button></span>
      </div>
      <div class="sp-pop" id="sp-pop" role="dialog" aria-label="How to read this card" hidden></div>
      <div class="sp-period">
        <button class="sp-arrow mt-arrow" data-d="-1" aria-label="Previous period">${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button>
        <p class="sp-when" aria-live="polite"><b></b><span></span></p>
        <button class="sp-arrow mt-arrow" data-d="1" aria-label="Next period">${I('<path d="M9.5 6l6 6-6 6"/>')}</button>
      </div>
      <div class="mt-sum">
        <span class="sp-k">Spent</span>
        <b class="sp-amt"></b>
        <span class="sp-of"></span>
        <span class="sp-status"><i aria-hidden="true"></i><span></span></span>
        <span class="sp-left"></span>
      </div>
      <div class="mt-stage cs-stage" role="group" aria-label="Your spending, day by day"></div>
      <p class="cs-detail" aria-live="polite"></p>
      <div class="cs-legend"></div>
      <span class="mt-tip" aria-hidden="true" hidden></span><span class="mt-pop" aria-hidden="true" hidden></span>
      <p class="mt-mood" aria-live="polite"><b></b><span></span></p>
      <p class="sp-cats"></p>
      <div class="sp-acts"><button class="sp-recap mt-recap" data-a="recap">${I('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>')}<span>Recap</span></button></div>`;
    const $ = s => host.querySelector(s), $$ = s => [...host.querySelectorAll(s)];
    const leaves = $$('.mt-leaf'), coins = $$('.mt-coin'), fallen = $$('.mt-fl');

    // How to read the card: the key, the shell's value and the tap hint live in a small popup
    const infoPop = $('.sp-pop'), infoBtn = $('.sp-info');
    function closePop() { if (infoPop.hidden) return; infoPop.hidden = true; infoBtn.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', outside, true); document.removeEventListener('keydown', esc, true); }
    const outside = e => { if (!infoPop.contains(e.target) && !infoBtn.contains(e.target)) closePop(); };
    const esc = e => { if (e.key === 'Escape') { e.stopPropagation(); closePop(); infoBtn.focus(); } };
    function togglePop() {
      if (!infoPop.hidden) { closePop(); return; }
      const month = host.classList.contains('is-month'), unit = $('.cs-unit'), key = $('.cs-keybox');
      infoPop.innerHTML = month
        ? `<p class="sp-pop-lead">Each shell is a day. Deeper shells are days you spent more than usual.</p>
          <p class="sp-pop-sub">Tap a day to see what you spent.</p>
          ${key ? `<div class="sp-pop-key">${key.outerHTML}</div>` : ''}`
        : `<p class="sp-pop-lead">Each column is a day. Stacked shells show what you spent.</p>
          <p class="sp-pop-sub">Tap a day to see what you spent.</p>
          ${unit ? `<p class="sp-pop-unit">${unit.innerHTML}</p>` : ''}`;
      infoPop.hidden = false; infoBtn.setAttribute('aria-expanded', 'true');
      if (!reduce()) infoPop.animate([{ opacity: 0, transform: 'translateY(-6px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)' });
      setTimeout(() => { document.addEventListener('pointerdown', outside, true); document.addEventListener('keydown', esc, true); });
    }

    function paint(animate) {
      closePop();
      const d = opts.getData(st.mode, st.offset);
      $$('.sp-seg button').forEach(b => { const on = b.dataset.m === st.mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
      const hide = hidden(), sx = status(d);
      host.dataset.status = sx.k;
      $('.sp-when b').textContent = d.when || d.label; $('.sp-when span').textContent = d.range || '';
      $('.sp-amt').textContent = hide ? '$•••' : usd(d.spent || 0);
      $('.sp-of').textContent = d.budget ? `of ${hide ? '$•••' : usd(d.budget)} ${st.mode === 'W' ? 'weekly' : 'monthly'} budget` : 'No limits set';
      $('.sp-status span').textContent = sx.t;
      $('.sp-left').textContent = hide && d.budget ? (d.daysLeft > 0 ? `${d.daysLeft} ${d.daysLeft === 1 ? 'day' : 'days'} to go` : '') : sx.s;
      $('.sp-cats').innerHTML = d.cats?.length ? `Counts what you set limits for: ${esc(listJoin(d.cats))}.` : '<button class="sp-addlimit" data-h="addlimit">Add a spending limit</button>';
      const eye = $('.sp-eye'); eye.innerHTML = hide ? EYE_OFF : EYE; eye.setAttribute('aria-pressed', String(hide)); eye.setAttribute('aria-label', hide ? 'Show amounts' : 'Hide amounts');
      $('[data-d="-1"]').disabled = !d.hasPrev; $('[data-d="1"]').disabled = !d.hasNext;
      const h = Math.max(0, Math.min(1, d.health));
      const shown = Math.round(18 + (leaves.length - 18) * Math.pow(h, 1.7)); // thins out quickly as health drops
      const autumn = h < .58 ? Math.round(shown * (.58 - h) * 1.1) : 0;
      leaves.forEach((el, i) => {
        const on = i < shown;
        el.classList.toggle('on', on);
        el.classList.toggle('dry', on && i >= shown - autumn);
        el.style.setProperty('--d', animate ? `${(i % 50) * 8}ms` : '0ms');
      });
      const nFallen = Math.round(Math.max(0, .7 - h) * 26);
      fallen.forEach((el, i) => el.classList.toggle('on', i < nFallen));
      const nCoins = d.saved > 0 ? Math.min(coins.length, Math.max(1, Math.round(d.saved / 6000))) : 0;
      // coins removed: the tree is leaves only
      const mood = MOOD.find(([t]) => h >= t)[1];
      host.dataset.mood = mood.toLowerCase();
      $('.mt-mood b').textContent = mood;

      /* chala v3: the shell chart sits where the tree was: stacks by kind for a week, a calendar of shells for a month */
      if (window.ChalaShells && opts.getShells) {
        const S = opts.getShells(st.mode, st.offset);
        // the amount is everything the shells show; the month view leaves the number to the calendar
        if (S) $('.sp-amt').textContent = hide ? '$•••' : usd(S.total);
        ChalaShells.render(host, S, { mode: st.mode, animate, hide });
      }
    }

    function shake() {
      if (reduce()) return;
      const tree = $('.mt-tree'); if (!tree) return;
      tree.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-2.2deg)' }, { transform: 'rotate(1.6deg)' }, { transform: 'rotate(-.8deg)' }, { transform: 'rotate(0)' }], { duration: 900, easing: 'cubic-bezier(.25,.1,.25,1)' });
      coins.filter(c => c.classList.contains('on')).forEach((c, i) => c.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(10deg)' }, { transform: 'rotate(-7deg)' }, { transform: 'rotate(0)' }], { duration: 1100, delay: i * 40, easing: 'ease-out' }));
      // a few leaves drift off; more when the tree is struggling
      const mood = host.dataset.mood, drop = mood === 'flourishing' ? 2 : mood === 'growing' ? 3 : 6;
      const on = leaves.filter(l => l.classList.contains('on'));
      for (let k = 0; k < drop && on.length; k++) {
        const src = on[Math.floor(Math.random() * on.length)], ly = SHAPE.leaves[+src.dataset.i].y;
        const ghost = src.cloneNode(true); ghost.classList.add('mt-drift'); ghost.removeAttribute('data-i');
        $('.mt-leaves').appendChild(ghost);
        const dx = (Math.random() - .5) * 60, dy = 206 - ly + Math.random() * 8;
        ghost.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${dx * .5}px,${dy * .5}px) rotate(120deg)`, opacity: 1, offset: .5 }, { transform: `translate(${dx}px,${dy}px) rotate(240deg)`, opacity: 0 }], { duration: 1500 + Math.random() * 700, delay: k * 90, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }).finished.then(() => ghost.remove(), () => ghost.remove());
      }
    }

    /* tap: a ring of what came in, split into spent, saved and what's left */
    const C = { spent: '#D9693B', saved: '#12A089', left: '#E3A33C' };
    function pop() {
      const box = $('.mt-pop'), d = opts.getStats?.(st.mode, st.offset);
      if (!d) return false;
      const spent = Math.max(0, d.spent), saved = Math.max(0, d.saved), earned = Math.max(0, d.earned);
      const base = earned > 0 ? Math.max(earned, spent + saved) : spent + saved;
      const ofWhat = !base ? 'Nothing in or out yet' : earned > 0 ? 'of what came in' : 'of what went out';
      const pct = v => base ? Math.round(v / (earned || base) * 100) : 0;
      const segs = [['spent', spent], ['saved', saved], ['left', Math.max(0, base - spent - saved)]].filter(([, v]) => v > 0);
      const R = 38, L = 2 * Math.PI * R, gap = segs.length > 1 ? 3 : 0;
      let acc = 0;
      const arcs = segs.map(([k, v]) => { const len = Math.max(0, v / base * L - gap); const o = `<circle class="mt-arc" r="${R}" cx="50" cy="50" stroke="${C[k]}" stroke-dasharray="${len.toFixed(2)} ${L.toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" style="--len:${len.toFixed(2)}"/>`; acc += v / base * L; return o; }).join('');
      box.innerHTML = `<span class="mt-pop-card">
        <svg class="mt-ring" viewBox="0 0 100 100"><circle r="${R}" cx="50" cy="50" class="mt-ring-bg"/><g transform="rotate(-90 50 50)">${arcs}</g>
          <text x="50" y="49" class="mt-ring-n">${pct(spent)}%</text><text x="50" y="62" class="mt-ring-k">spent</text></svg>
        <span class="mt-pop-rows">
          <span class="mt-pop-r"><i style="background:${C.spent}"></i>Spent<b>${pct(spent)}%</b></span>
          <span class="mt-pop-r"><i style="background:${C.saved}"></i>Saved<b>${pct(saved)}%</b></span>
          ${earned > 0 ? `<span class="mt-pop-r"><i style="background:${C.left}"></i>Left<b>${Math.max(0, 100 - pct(spent) - pct(saved))}%</b></span>` : ''}
          <span class="mt-pop-s">${ofWhat}, ${esc(d.label)}</span>
        </span></span>`;
      box.classList.remove('on'); void box.offsetWidth; box.classList.add('on');
      $('.mt-stage').setAttribute('aria-description', `Spent ${pct(spent)}%, saved ${pct(saved)}% ${ofWhat}.`);
      clearTimeout(box._t); box._t = setTimeout(() => box.classList.remove('on'), 4200);
      return true;
    }

    function tip(text) {
      const t = $('.mt-tip'); t.textContent = text; t.classList.add('on');
      clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200);
    }

    const go = dir => { const d = opts.getData(st.mode, st.offset + dir); if (!d) return; st.offset += dir; $('.mt-pop').classList.remove('on'); paint(true); };
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m && b.dataset.m !== st.mode) { st.mode = b.dataset.m; st.offset = 0; $('.mt-pop').classList.remove('on'); opts.onMode?.(st.mode); paint(true); return; }
      if (b.dataset.d) { go(+b.dataset.d); return; }
      if (b.dataset.a === 'eye') { try { localStorage.setItem(HIDE, hidden() ? '0' : '1'); } catch {} paint(false); return; }
      if (b.dataset.a === 'info') { togglePop(); return; }
      if (b.classList.contains('mt-wrapped')) { opts.onWrapped?.(); return; }
      if (b.classList.contains('mt-recap')) { opts.onRecap?.(st.mode, st.offset); return; }
      if (b.classList.contains('mt-stage')) {
        if (e.target.closest('.mt-coin.on')) { tip(opts.coinText?.() || ''); shake(); return; }
        shake(); // tap just shakes the tree; the numbers live on the Recap page
      }
    });
    // swipe across the tree to move between periods
    let sx = null, sy = 0;
    $('.mt-stage').addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    $('.mt-stage').addEventListener('pointerup', e => {
      if (sx === null) return; const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { e.preventDefault(); go(dx < 0 ? 1 : -1); host.dataset.swiped = '1'; setTimeout(() => delete host.dataset.swiped, 50); }
    });
    $('.mt-stage').addEventListener('click', e => { if (host.dataset.swiped) e.stopImmediatePropagation(); }, true);
    paint(true);
  }

  window.ChalaTree = { mount };
})();
