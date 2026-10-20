/* chala v3 — Cards tab: tap-to-pay cards with a balance bar, and a balance on the back.
   Rebuilt from the "Swipe-up pay with balance bar" design mockup (v2), in plain JS and the app's
   look (Bricolage Grotesque, ink, Faiit's paper + sky). Prototype only: no real payment.

   - At rest the cards sit as a visible stack. Tap the front card, or drag it up, to bring it up to pay.
   - Face ID → "Hold near reader". Tap the card to pay the demo charge.
   - The light strip on the front is the balance bar: it drains as you spend, and the card warms to
     peach when less than 40% of its limit is left. Not enough left → declined.
   - Swipe the raised card sideways to flip it: the back shows what's available. Tap to flip back.
   - Tap a card in the stack below to switch. Drag the raised card down to put it back. */
(() => {
  const CHARGE = 186.40;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const REST_TILT = 10; // a little depth at rest, without hiding the card face
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, fixed) => { const v = Math.max(0, n), d = fixed || v % 1 ? 2 : 0; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };

  const CARDS = [
    { id: 'a', name: 'Everyday', last4: '4021', limit: 3000, pct: 62,
      base: 'linear-gradient(118deg, rgba(186,238,222,.82) 0%, rgba(214,224,252,.62) 42%, rgba(252,236,212,.74) 78%, rgba(220,240,236,.66) 100%)',
      light: 'rgba(120,230,235,.75)' },
    { id: 'b', name: 'Travel', last4: '7716', limit: 5000, pct: 48,
      base: 'linear-gradient(118deg, rgba(150,214,168,.9) 0%, rgba(196,232,200,.72) 45%, rgba(122,190,150,.88) 100%)',
      light: 'rgba(140,235,160,.8)' },
    { id: 'c', name: 'Groceries', last4: '0388', limit: 800, pct: 9,
      base: 'linear-gradient(118deg, rgba(214,226,246,.8) 0%, rgba(236,228,250,.65) 50%, rgba(250,232,222,.75) 100%)',
      light: 'rgba(170,200,255,.75)' }
  ];
  const WARM = 'linear-gradient(118deg, rgba(240,192,166,.78) 0%, rgba(248,220,200,.66) 48%, rgba(236,184,158,.74) 100%)';

  const ICON = {
    face: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 13V9a5 5 0 0 1 5-5h4"/><path d="M31 4h4a5 5 0 0 1 5 5v4"/><path d="M40 31v4a5 5 0 0 1-5 5h-4"/><path d="M13 40H9a5 5 0 0 1-5-5v-4"/><path d="M15 16v3"/><path d="M29 16v3"/><path d="M22 16v8h-2"/><path d="M16 29c3.5 3 8.5 3 12 0"/></svg>',
    tap: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8.5 7.5a6 6 0 0 1 0 9"/><path d="M12 5a9.5 9.5 0 0 1 0 14"/><path d="M15.5 2.5a13 13 0 0 1 0 19"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>',
    chip: '<svg class="cc-chip" width="46" height="36" viewBox="0 0 46 36" fill="none" stroke="rgba(150,110,90,.6)" stroke-width="1.1" stroke-linecap="round" aria-hidden="true"><rect x=".75" y=".75" width="44.5" height="34.5" rx="7" fill="#E6C6B0"/><rect x="15" y="7" width="16" height="22" rx="4" fill="#EDD3C1"/><path d="M23 .75V7"/><path d="M23 29v6.25"/><path d="M15 18h16"/><path d="M.75 12H11c2.2 0 4 1.8 4 4"/><path d="M.75 24H11c2.2 0 4-1.8 4-4"/><path d="M45.25 12H35c-2.2 0-4 1.8-4 4"/><path d="M45.25 24H35c-2.2 0-4-1.8-4-4"/><path d="M.75 18H8"/><path d="M38 18h7.25"/></svg>'
  };
  const STATUS = {
    faceid: `<div class="cc-st-ico cc-scan">${ICON.face}</div><p>Face ID</p>`,
    ready: `<div class="cc-st-ico cc-tap"><i class="cc-ring"></i><i class="cc-ring cc-ring2"></i>${ICON.tap}</div><p>Hold near reader</p>`,
    sending: '<div class="cc-st-ico"><i class="cc-spin"></i></div><p>Processing</p>',
    done: `<div class="cc-st-ico cc-done">${ICON.check}</div><p>Done</p>`,
    declined: `<div class="cc-st-ico cc-declined">${ICON.x}</div><p class="cc-bad">Declined</p>`
  };

  function mount(host, { holder = '' } = {}) {
    if (!host) return;
    const s = { open: false, dragging: false, dy: 0, xdrag: false, dx: 0, flip: 0, active: 'a', phase: 'idle', spent: { a: 0, b: 0, c: 0 }, tx: 0, bump: false, pulse: false, shake: false };
    let timers = [], raf = 0, startX = 0, startY = 0, axis = null, pDown = false, G = null;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(() => { if (host.isConnected) fn(); }, ms));
    const set = patch => { Object.assign(s, patch); if (host.isConnected) render(); };
    const def = id => CARDS.find(d => d.id === id);
    const availOf = (d, spent) => Math.max(0, d.limit * d.pct / 100 - spent);
    const flipped = () => Math.round(s.flip / 180) % 2 !== 0;

    host.innerHTML = `
      <div class="cc-status" aria-live="polite"></div>
      ${CARDS.map(d => `
      <div class="cc-card" data-card="${d.id}" role="button" tabindex="0">
        <div class="cc-face cc-front">
          <div class="cc-layer" style="background:${d.base}"></div>
          <div class="cc-layer cc-warm" style="background:${WARM}"></div>
          <div class="cc-sheen"></div>
          <div class="cc-strip"><i></i></div>
          <span class="cc-name">${esc(d.name)}</span>
          ${ICON.chip}
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

    function startFaceId() {
      stop();
      set({ phase: 'faceid', tx: 0, shake: false, pulse: true });
      later(() => set({ pulse: false }), 900);
      later(() => { if (s.phase === 'faceid') set({ phase: 'ready' }); }, reduce() ? 200 : 700);
    }
    const openUp = () => { set({ open: true, dragging: false, dy: 0 }); startFaceId(); };
    const closeDown = () => { stop(); set({ open: false, dragging: false, dy: 0, xdrag: false, dx: 0, flip: 0, phase: 'idle', tx: 0, pulse: false, bump: false, shake: false }); };
    function select(id) { set({ active: id, flip: 0 }); s.open ? startFaceId() : openUp(); }
    function pay() {
      const id = s.active, prev = s.spent[id] || 0;
      stop();
      set({ phase: 'sending', bump: true, tx: 0 });
      later(() => set({ bump: false }), 170);
      if (CHARGE > availOf(def(id), prev)) {
        later(() => { set({ phase: 'declined', shake: true }); later(() => set({ shake: false }), 500); }, 550);
        return;
      }
      later(() => {
        set({ phase: 'done', spent: { ...s.spent, [id]: prev + CHARGE }, pulse: true, tx: 0 });
        later(() => set({ pulse: false }), 700);
        const t0 = performance.now(), dur = reduce() ? 1 : 800;
        const step = now => {
          if (!host.isConnected) return;
          const t = Math.min(1, (now - t0) / dur);
          set({ tx: CHARGE * (1 - Math.pow(1 - t, 3)) });
          raf = t < 1 ? requestAnimationFrame(step) : 0;
        };
        raf = requestAnimationFrame(step);
      }, 550);
    }

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
        const isA = d.id === s.active, pulse = isA && s.pulse;
        const glowLine = pulse ? `0 0 10px #fff, 0 0 26px ${light}, 0 0 48px ${light}` : `0 0 6px rgba(255,255,255,.95), 0 0 14px ${light}, 0 0 26px ${light}`;
        let y, tilt, rot = 0, scale, z, tr, fill = '0%';
        if (isA) {
          y = pos; tilt = (1 - p) * REST_TILT; scale = s.bump ? .965 : 1; z = 20;
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
        const done = isA && s.phase === 'done';
        bar.style.transition = `width ${done ? '800ms' : '600ms'} ${EASE} ${done ? '0ms' : '300ms'}, box-shadow 500ms ease`;
        bar.style.boxShadow = glowLine;
        el.querySelector('.cc-back-num').textContent = money(avail, true);
        const bb = el.querySelector('.cc-back-bar i');
        bb.style.width = (ratio * 100).toFixed(1) + '%'; bb.style.boxShadow = glowLine;
        el.querySelector('.cc-back-bar em').textContent = Math.round(ratio * 100) + '%';
        el.setAttribute('aria-label', `${d.name} card, ${money(avail, true)} of ${money(d.limit)} available. ${isA ? (s.open ? (flipped() ? 'Activate to flip back.' : s.phase === 'ready' ? 'Activate to pay.' : '') : 'Activate to bring up.') : 'Activate to switch to this card.'}`);
      });

      const status = $('.cc-status'), key = settled ? s.phase : 'idle';
      if (status.dataset.phase !== key) { status.dataset.phase = key; status.innerHTML = STATUS[key] ? `<div class="cc-st cc-pop">${STATUS[key]}</div>` : ''; }

      $('.cc-info').classList.toggle('is-on', settled);
      const note = $('.cc-note');
      let txt = '', cls = '';
      if (settled && s.phase === 'done') { txt = `−${money(s.tx, true)} paid`; cls = 'is-done cc-breathe'; }
      if (settled && s.phase === 'declined') { txt = 'Not enough available'; cls = 'is-bad'; }
      note.textContent = txt; note.className = 'cc-note ' + cls;
      note.classList.toggle('cc-shake', s.shake);
    }

    // ---------- input: vertical drag raises/lowers, horizontal swipe flips ----------
    function release(id) {
      if (!pDown) return; pDown = false;
      const st = s, ax = axis; axis = null;
      if (id !== st.active) { select(id); return; }
      if (ax === 'x') { const turn = Math.abs(st.dx) > 60 ? (st.dx > 0 ? 180 : -180) : 0; set({ xdrag: false, dx: 0, flip: st.flip + turn }); return; }
      const dy = ax === 'y' ? st.dy : 0;
      if (Math.abs(dy) < 6) {
        set({ dragging: false, dy: 0 });
        if (!st.open) openUp();
        else if (flipped()) set({ flip: st.flip + 180 });
        else if (st.phase === 'ready') pay();
        else if (st.phase === 'done' || st.phase === 'declined') startFaceId();
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
          axis = Math.abs(dx) > Math.abs(dy) && s.open && s.phase !== 'sending' ? 'x' : 'y';
        }
        axis === 'x' ? set({ xdrag: true, dx }) : set({ dragging: true, dy });
      });
      el.addEventListener('pointerup', () => release(d.id));
      el.addEventListener('pointercancel', () => release(d.id));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pDown = true; axis = null; release(d.id); }
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && s.open && d.id === s.active) { e.preventDefault(); set({ flip: s.flip + (e.key === 'ArrowRight' ? 180 : -180) }); }
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
