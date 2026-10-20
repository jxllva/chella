/* chala v3 — Cards tab: your cards with a balance bar, and the balance on the back.
   Rebuilt from the "Swipe-up pay with balance bar" design mockup (v2), in plain JS and the app's
   look. The mockup's pay and Face ID steps are left out on purpose: this tab is for checking cards.

   - At rest the cards sit as a fanned stack. Tap a card, or drag the front one up, to bring it up.
   - The light strip on the front is the balance bar; the card warms to peach when it runs low.
   - Tap the raised card, or swipe it sideways, to flip it: the back shows what's available.
   - A card under 25% of its limit shows a "Low balance" tag.
   - Tap a card in the stack below to switch. Drag the raised card down to put it back. */
(() => {
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const REST_TILT = 10;
  const LOW = .25; // under 25% of the limit left → "Low balance" // a little depth at rest, without hiding the card face
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, fixed) => { const v = Math.max(0, n), d = fixed || v % 1 ? 2 : 0; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };

  const CARDS = [
    { id: 'a', name: 'Everyday', last4: '4021', limit: 3000, pct: 62,
      base: 'linear-gradient(118deg, #E6E0F3 0%, #DCD3EF 45%, #EFEAF6 100%)',
      light: 'rgba(120,230,235,.75)' },
    { id: 'b', name: 'Travel', last4: '7716', limit: 5000, pct: 48,
      base: 'linear-gradient(118deg, #F3E1D8 0%, #ECCBBD 50%, #F6E9E2 100%)',
      light: 'rgba(140,235,160,.8)' },
    { id: 'c', name: 'Groceries', last4: '0388', limit: 800, pct: 9,
      base: 'linear-gradient(118deg, #F4E5E8 0%, #ECD0D6 50%, #F7ECEE 100%)',
      light: 'rgba(170,200,255,.75)' }
  ];
  const WARM = 'linear-gradient(118deg, rgba(233,187,169,.55) 0%, rgba(240,210,196,.45) 50%, rgba(233,187,169,.5) 100%)';

  const CHIP = '<svg class="cc-chip" width="46" height="36" viewBox="0 0 46 36" fill="none" stroke="rgba(150,110,90,.6)" stroke-width="1.1" stroke-linecap="round" aria-hidden="true"><rect x=".75" y=".75" width="44.5" height="34.5" rx="7" fill="#E6C6B0"/><rect x="15" y="7" width="16" height="22" rx="4" fill="#EDD3C1"/><path d="M23 .75V7"/><path d="M23 29v6.25"/><path d="M15 18h16"/><path d="M.75 12H11c2.2 0 4 1.8 4 4"/><path d="M.75 24H11c2.2 0 4-1.8 4-4"/><path d="M45.25 12H35c-2.2 0-4 1.8-4 4"/><path d="M45.25 24H35c-2.2 0-4-1.8-4-4"/><path d="M.75 18H8"/><path d="M38 18h7.25"/></svg>';

  function mount(host, { holder = '' } = {}) {
    if (!host) return;
    const s = { open: false, dragging: false, dy: 0, xdrag: false, dx: 0, flip: 0, active: 'a', spent: { a: 0, b: 0, c: 0 } };
    let startX = 0, startY = 0, axis = null, pDown = false, G = null;
    const set = patch => { Object.assign(s, patch); if (host.isConnected) render(); };
    const def = id => CARDS.find(d => d.id === id);
    const availOf = (d, spent) => Math.max(0, d.limit * d.pct / 100 - spent);
    const flipped = () => Math.round(s.flip / 180) % 2 !== 0;

    host.innerHTML = `
      ${CARDS.map(d => `
      <div class="cc-card" data-card="${d.id}" role="button" tabindex="0">
        <div class="cc-face cc-front">
          <div class="cc-layer" style="background:${d.base}"></div>
          <div class="cc-layer cc-warm" style="background:${WARM}"></div>
          <div class="cc-sheen"></div>
          <div class="cc-strip"><i></i></div>
          <span class="cc-name">${esc(d.name)}</span>
          <span class="cc-low" hidden><i></i>Low balance</span>
          ${CHIP}
          <span class="cc-holder">${esc(holder || 'Card holder')}</span>
          <span class="cc-last4">•••• ${d.last4}</span>
        </div>
        <div class="cc-face cc-back">
          <div class="cc-layer" style="background:${d.base}"></div>
          <div class="cc-layer cc-warm" style="background:${WARM}"></div>
          <div class="cc-sheen cc-sheen-b"></div>
          <div class="cc-back-in">
            <div class="cc-back-top"><span>Available</span><span>•••• ${d.last4}</span></div>
            <div><b class="cc-back-num"></b><span class="cc-back-of">of ${money(d.limit)} limit</span></div>
            <div class="cc-back-bar"><span><i></i></span><em></em></div>
          </div>
        </div>
      </div>`).join('')}
      <div class="cc-info"><p class="cc-note"></p></div>`;
    const $ = sel => host.querySelector(sel);
    const cardEl = id => host.querySelector(`[data-card="${id}"]`);

    /* Fit the layout into whatever room sits between the header and the nav. */
    function measure() {
      const nav = document.querySelector('.fh-nav');
      const top = host.getBoundingClientRect().top + window.scrollY;
      const navTop = nav ? nav.getBoundingClientRect().top + window.scrollY : window.innerHeight;
      const H = Math.max(500, navTop - top - 10), W = host.clientWidth;
      const cw = Math.min(330, W - 32), ch = Math.round(cw * 202 / 320), T = 104;
      host.style.height = H + 'px';
      // At rest the front card sits fully in view near the bottom, the others stacked behind it.
      G = { H, W, cw, ch, T, HIDE: Math.max(150, H - T - ch - 22), peek: H - T - 104 };
      host.style.setProperty('--cc-w', cw + 'px'); host.style.setProperty('--cc-h', ch + 'px'); host.style.setProperty('--cc-t', T + 'px');
      host.style.setProperty('--cc-info', (T + ch + 24) + 'px');
    }

    const openUp = () => set({ open: true, dragging: false, dy: 0 });
    const closeDown = () => set({ open: false, dragging: false, dy: 0, xdrag: false, dx: 0, flip: 0 });
    const turn = dir => set({ flip: s.flip + (dir < 0 ? -180 : 180) });
    function select(id) { set({ active: id, flip: 0 }); if (!s.open) openUp(); }

    function render() {
      if (!G) measure();
      const others = CARDS.filter(d => d.id !== s.active);
      const base = s.open ? 0 : G.HIDE;
      const pos = s.dragging ? Math.min(G.HIDE, Math.max(0, base + s.dy)) : base;
      const p = 1 - pos / G.HIDE, settled = s.open && !s.dragging && !s.xdrag;
      const ms = v => reduce() ? '0ms' : v;

      CARDS.forEach(d => {
        const el = cardEl(d.id), spent = s.spent[d.id] || 0, avail = availOf(d, spent);
        const ratio = d.limit > 0 ? Math.min(1, avail / d.limit) : 0;
        const warmth = Math.min(1, Math.max(0, (.4 - ratio) / .3));
        const light = ratio > .4 ? d.light : ratio > .2 ? 'rgba(255,214,170,.75)' : 'rgba(255,186,150,.75)';
        const isA = d.id === s.active;
        const glowLine = `0 0 6px rgba(255,255,255,.95), 0 0 14px ${light}, 0 0 26px ${light}`;
        let y, tilt, rot = 0, scale, z, tr, fill = '0%';
        if (isA) {
          y = pos; tilt = (1 - p) * REST_TILT; scale = 1; z = 20;
          rot = s.flip + (s.xdrag ? Math.max(-180, Math.min(180, s.dx * .6)) : 0);
          fill = settled ? (ratio * 100).toFixed(1) + '%' : '0%';
          tr = s.dragging || s.xdrag ? 'transform 0ms' : `transform ${ms('480ms')} ${EASE}`;
        } else {
          const k = others.indexOf(d);
          if (s.open) { y = G.peek + k * 44; tilt = 0; scale = .94; z = 10 + k; }
          else { y = G.HIDE - (others.length - k) * 54; tilt = REST_TILT; scale = 1 - (others.length - k) * .04; z = 5 + k; } // fanned so every card's name shows
          tr = `transform ${ms('420ms')} ${EASE}`;
        }
        el.style.zIndex = z;
        el.style.transition = tr;
        el.style.transform = `translateY(${y}px) rotateX(${tilt.toFixed(1)}deg) rotateY(${rot}deg) scale(${scale})`;
        el.querySelectorAll('.cc-warm').forEach(w => { w.style.opacity = warmth.toFixed(2); });
        const strip = el.querySelector('.cc-strip'), bar = strip.firstElementChild;
        strip.style.opacity = isA && settled ? 1 : 0;
        bar.style.width = fill;
        bar.style.transition = `width 600ms ${EASE} 300ms`;
        bar.style.boxShadow = glowLine;
        el.querySelector('.cc-low').hidden = ratio >= LOW;
        el.querySelector('.cc-back-num').textContent = money(avail, true);
        const bb = el.querySelector('.cc-back-bar i');
        bb.style.width = (ratio * 100).toFixed(1) + '%'; bb.style.boxShadow = glowLine;
        el.querySelector('.cc-back-bar em').textContent = Math.round(ratio * 100) + '%';
        el.setAttribute('aria-label', `${d.name} card, ${money(avail, true)} of ${money(d.limit)} available. ${ratio < LOW ? 'Low balance. ' : ''}${isA ? (s.open ? (flipped() ? 'Activate to flip back.' : 'Activate to see the balance.') : 'Activate to bring up.') : 'Activate to switch to this card.'}`);
      });

      $('.cc-info').classList.toggle('is-on', settled);
      const note = $('.cc-note'), aAvail = availOf(def(s.active), s.spent[s.active] || 0), aLow = aAvail / def(s.active).limit < LOW;
      if (aLow) { note.textContent = `Low balance · ${money(aAvail, true)} left`; note.className = 'cc-note is-low'; }
      else { note.textContent = flipped() ? 'Tap to flip back' : 'Tap the card to see your balance'; note.className = 'cc-note is-hint'; }
    }

    // ---------- input: vertical drag raises/lowers, horizontal swipe flips ----------
    function release(id) {
      if (!pDown) return; pDown = false;
      const st = s, ax = axis; axis = null;
      if (id !== st.active) { select(id); return; }
      if (ax === 'x') { const t = Math.abs(st.dx) > 60 ? (st.dx > 0 ? 180 : -180) : 0; set({ xdrag: false, dx: 0, flip: st.flip + t }); return; }
      const dy = ax === 'y' ? st.dy : 0;
      if (Math.abs(dy) < 6) {
        set({ dragging: false, dy: 0 });
        if (!st.open) openUp(); else turn(1);
        return;
      }
      const openNow = ((st.open ? 0 : G.HIDE) + dy) < G.HIDE * .6;
      if (openNow && !st.open) openUp(); else if (!openNow) closeDown(); else set({ dragging: false, dy: 0 });
    }
    CARDS.forEach(d => {
      const el = cardEl(d.id);
      el.addEventListener('pointerdown', e => {
        pDown = true; axis = null; startX = e.clientX; startY = e.clientY;
        try { el.setPointerCapture(e.pointerId); } catch {}
      });
      el.addEventListener('pointermove', e => {
        if (!pDown || d.id !== s.active) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!axis) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
          axis = Math.abs(dx) > Math.abs(dy) && s.open ? 'x' : 'y';
        }
        axis === 'x' ? set({ xdrag: true, dx }) : set({ dragging: true, dy });
      });
      el.addEventListener('pointerup', () => release(d.id));
      el.addEventListener('pointercancel', () => release(d.id));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pDown = true; axis = null; release(d.id); }
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && s.open && d.id === s.active) { e.preventDefault(); turn(e.key === 'ArrowRight' ? 1 : -1); }
        if (e.key === 'Escape' && s.open) closeDown();
      });
    });
    // Focusing a card must never scroll the clipped stage.
    host.addEventListener('scroll', () => { host.scrollTop = 0; host.scrollLeft = 0; });
    const onResize = () => { if (!host.isConnected) { removeEventListener('resize', onResize); return; } measure(); render(); };
    addEventListener('resize', onResize);
    measure(); render();
    requestAnimationFrame(() => { if (host.isConnected) { measure(); render(); } });
  }

  window.ChalaCards = { mount };
})();
