/* chala v3 — Cards tab: swipe up to pay, with a balance bar on each card.
   Rebuilt from the "Swipe-up pay with balance bar" design mockup (Main.dc.html), in plain JS and
   the app's look (Bricolage Grotesque, ink, Faiit's paper + sky). Prototype only: no real payment.

   Interaction (same as the mockup):
   - Cards rest tilted at the bottom. Drag the front card up (or tap it) to open.
   - Face ID → "Hold near reader". Tap the card to pay the demo charge.
   - The light strip along the top of the card is the balance bar: it drains as you spend, and the
     card warms to peach when less than 40% of its limit is left. Not enough left → declined.
   - Tap a card peeking at the bottom to switch. Drag the open card down to put it away. */
(() => {
  const CHARGE = 186.40;
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n, fixed) => { const v = Math.max(0, n), d = fixed || v % 1 ? 2 : 0; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };

  const CARDS = [
    { id: 'a', name: 'Everyday', last4: '4021', limit: 3000, pct: 62,
      base: 'linear-gradient(118deg, rgba(186,238,222,.82) 0%, rgba(214,224,252,.62) 42%, rgba(252,236,212,.74) 78%, rgba(220,240,236,.66) 100%)',
      light: 'rgba(120,230,235,.75)', glow: 'rgba(150,220,215,.55)' },
    { id: 'b', name: 'Travel', last4: '7716', limit: 5000, pct: 48,
      base: 'linear-gradient(118deg, rgba(150,214,168,.9) 0%, rgba(196,232,200,.72) 45%, rgba(122,190,150,.88) 100%)',
      light: 'rgba(140,235,160,.8)', glow: 'rgba(120,200,140,.55)' },
    { id: 'c', name: 'Groceries', last4: '0388', limit: 800, pct: 9,
      base: 'linear-gradient(118deg, rgba(214,226,246,.8) 0%, rgba(236,228,250,.65) 50%, rgba(250,232,222,.75) 100%)',
      light: 'rgba(170,200,255,.75)', glow: 'rgba(170,190,240,.5)' }
  ];
  const WARM = 'linear-gradient(118deg, rgba(240,192,166,.78) 0%, rgba(248,220,200,.66) 48%, rgba(236,184,158,.74) 100%)';

  const ICON = {
    face: '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 13V9a5 5 0 0 1 5-5h4"/><path d="M31 4h4a5 5 0 0 1 5 5v4"/><path d="M40 31v4a5 5 0 0 1-5 5h-4"/><path d="M13 40H9a5 5 0 0 1-5-5v-4"/><path d="M15 16v3"/><path d="M29 16v3"/><path d="M22 16v8h-2"/><path d="M16 29c3.5 3 8.5 3 12 0"/></svg>',
    tap: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8.5 7.5a6 6 0 0 1 0 9"/><path d="M12 5a9.5 9.5 0 0 1 0 14"/><path d="M15.5 2.5a13 13 0 0 1 0 19"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>',
    up: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg>'
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
    const s = { open: false, dragging: false, dy: 0, active: 'a', phase: 'idle', spent: { a: 0, b: 0, c: 0 }, disp: 0, tx: 0, bump: false, pulse: false, shake: false };
    let timers = [], raf = 0, startY = 0, pDown = false, G = null;
    const stop = () => { cancelAnimationFrame(raf); raf = 0; timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(() => { if (host.isConnected) fn(); }, ms));
    const set = patch => { Object.assign(s, patch); if (host.isConnected) render(); };
    const def = id => CARDS.find(d => d.id === id);
    const availOf = (d, spent) => Math.max(0, d.limit * d.pct / 100 - spent);

    host.innerHTML = `
      <div class="cc-status" aria-live="polite"></div>
      <div class="cc-hint">${ICON.up}<span>Swipe up to pay</span></div>
      <div class="cc-glow" aria-hidden="true"></div>
      ${CARDS.map(d => `
      <div class="cc-card" data-card="${d.id}" role="button" tabindex="0">
        <div class="cc-layer" style="background:${d.base}"></div>
        <div class="cc-layer cc-warm" style="background:${WARM}"></div>
        <div class="cc-sheen"></div>
        <div class="cc-strip"><i></i></div>
        <span class="cc-name">${esc(d.name)}</span>
        <div class="cc-chip"></div>
        <span class="cc-holder">${esc(holder || 'Card holder')}</span>
        <span class="cc-last4">•••• ${d.last4}</span>
      </div>`).join('')}
      <div class="cc-info">
        <div class="cc-avail-wrap"><span class="cc-k">Available</span><b class="cc-avail"></b><span class="cc-of"></span></div>
        <p class="cc-note"></p>
      </div>
      <button class="cc-reset" type="button">Reset</button>`;
    const $ = sel => host.querySelector(sel);
    const cardEl = id => host.querySelector(`[data-card="${id}"]`);

    /* Fit the mockup's 390×844 layout into whatever room sits between the header and the nav. */
    function measure() {
      const nav = document.querySelector('.fh-nav');
      const top = host.getBoundingClientRect().top + window.scrollY;
      const navTop = nav ? nav.getBoundingClientRect().top + window.scrollY : window.innerHeight;
      const H = Math.max(470, navTop - top - 10), W = host.clientWidth;
      const cw = Math.min(320, W - 32), ch = Math.round(cw * 202 / 320), T = 104;
      host.style.height = H + 'px';
      G = { H, W, cw, ch, T, left: (W - cw) / 2, HIDE: H - T - Math.round(ch * .78), peek: H - T - 64 };
      host.style.setProperty('--cc-w', cw + 'px'); host.style.setProperty('--cc-h', ch + 'px'); host.style.setProperty('--cc-t', T + 'px'); host.style.setProperty('--cc-l', G.left + 'px');
      host.style.setProperty('--cc-info', (T + ch + 30) + 'px');
      host.style.setProperty('--cc-hint', (T + G.HIDE - 70) + 'px');
    }

    function startFaceId() {
      stop();
      set({ phase: 'faceid', tx: 0, shake: false, pulse: true });
      later(() => set({ pulse: false }), 900);
      later(() => { if (s.phase === 'faceid') set({ phase: 'ready' }); }, reduce() ? 200 : 700);
    }
    const openUp = () => { set({ open: true, dragging: false, dy: 0 }); startFaceId(); };
    const closeDown = () => { stop(); set({ open: false, dragging: false, dy: 0, phase: 'idle', tx: 0, pulse: false, bump: false, shake: false }); };
    function select(id) { set({ active: id, disp: s.spent[id] || 0 }); s.open ? startFaceId() : openUp(); }
    function pay() {
      const id = s.active, d = def(id), prev = s.spent[id] || 0, avail = availOf(d, prev);
      stop();
      set({ phase: 'sending', bump: true, tx: 0 });
      later(() => set({ bump: false }), 170);
      if (CHARGE > avail) {
        later(() => { set({ phase: 'declined', shake: true }); later(() => set({ shake: false }), 500); }, 550);
        return;
      }
      later(() => {
        const sp = { ...s.spent, [id]: prev + CHARGE };
        set({ phase: 'done', spent: sp, pulse: true, disp: prev, tx: 0 });
        later(() => set({ pulse: false }), 700);
        const t0 = performance.now(), dur = reduce() ? 1 : 800;
        const step = now => {
          if (!host.isConnected) return;
          const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
          set({ disp: prev + CHARGE * e, tx: CHARGE * e });
          raf = t < 1 ? requestAnimationFrame(step) : 0;
        };
        raf = requestAnimationFrame(step);
      }, 550);
    }

    function render() {
      if (!G) measure();
      const others = CARDS.filter(d => d.id !== s.active), A = def(s.active);
      const base = s.open ? 0 : G.HIDE;
      const pos = s.dragging ? Math.min(G.HIDE, Math.max(0, base + s.dy)) : base;
      const p = 1 - pos / G.HIDE, settled = s.open && !s.dragging;
      const quick = reduce() ? '0ms' : null;

      CARDS.forEach(d => {
        const el = cardEl(d.id), spent = s.spent[d.id] || 0;
        const ratio = d.limit > 0 ? Math.min(1, availOf(d, spent) / d.limit) : 0;
        const warmth = Math.min(1, Math.max(0, (.4 - ratio) / .3));
        const light = ratio > .4 ? d.light : ratio > .2 ? 'rgba(255,214,170,.75)' : 'rgba(255,186,150,.75)';
        const isA = d.id === s.active, pulse = isA && s.pulse;
        let y, tilt, scale, z, tr, fill = '0%';
        if (isA) {
          y = pos; tilt = (1 - p) * 46; scale = s.bump ? .965 : 1; z = 20;
          fill = settled ? (ratio * 100).toFixed(1) + '%' : '0%';
          tr = s.dragging ? 'transform 0ms' : `transform ${quick || '380ms'} ${EASE}`;
        } else {
          const k = others.indexOf(d);
          if (s.open) { y = G.peek + k * 30; tilt = 0; scale = .92; z = 10 + k; }
          else { y = G.HIDE - (others.length - k) * 16; tilt = 46; scale = .95; z = 5 + k; }
          tr = `transform ${quick || '420ms'} ${EASE}`;
        }
        el.style.zIndex = z;
        el.style.transition = tr;
        el.style.transform = `translateY(${y}px) rotateX(${tilt.toFixed(1)}deg) scale(${scale})`;
        el.querySelector('.cc-warm').style.opacity = warmth.toFixed(2);
        const strip = el.querySelector('.cc-strip'), bar = strip.firstElementChild;
        strip.style.opacity = isA && settled ? 1 : 0;
        bar.style.width = fill;
        const done = isA && s.phase === 'done';
        bar.style.transition = `width ${done ? '800ms' : '600ms'} ${EASE} ${done ? '0ms' : '300ms'}, box-shadow 500ms ease`;
        bar.style.boxShadow = pulse ? `0 0 10px #fff, 0 0 26px ${light}, 0 0 48px ${light}` : `0 0 6px rgba(255,255,255,.95), 0 0 14px ${light}, 0 0 26px ${light}`;
        el.setAttribute('aria-label', `${d.name} card, ${Math.round(ratio * 100)} percent of limit available. ${isA ? (s.open ? (s.phase === 'ready' ? 'Activate to pay.' : '') : 'Activate to open.') : 'Activate to switch to this card.'}`);
      });

      const realSpent = s.spent[s.active] || 0;
      const shownSpent = s.phase === 'done' ? s.disp : realSpent;
      const aRatio = availOf(A, realSpent) / A.limit, aWarm = Math.min(1, Math.max(0, (.4 - aRatio) / .3));
      const glow = $('.cc-glow');
      glow.style.background = aWarm > .5 ? 'rgba(240,180,150,.45)' : A.glow;
      glow.style.opacity = (.3 + p * .5).toFixed(2);
      glow.style.transform = `translateY(${pos}px)`;
      glow.style.transition = `${s.dragging ? 'transform 0ms' : `transform 380ms ${EASE}`}, background 600ms ease`;

      $('.cc-hint').style.opacity = (1 - p).toFixed(2);
      const status = $('.cc-status'), key = settled ? s.phase : 'idle';
      if (status.dataset.phase !== key) { status.dataset.phase = key; status.innerHTML = STATUS[key] ? `<div class="cc-st cc-pop">${STATUS[key]}</div>` : ''; }

      const info = $('.cc-info');
      info.classList.toggle('is-on', settled);
      $('.cc-avail-wrap').classList.toggle('cc-shake', s.shake);
      $('.cc-avail').textContent = money(availOf(A, shownSpent), realSpent > 0);
      $('.cc-of').textContent = 'of ' + money(A.limit);
      const note = $('.cc-note');
      let txt = '', cls = '';
      if (settled && s.phase === 'ready') txt = `Tap card to pay ${money(CHARGE, true)}`;
      if (settled && s.phase === 'sending') txt = `Sending ${money(CHARGE, true)}`;
      if (settled && s.phase === 'done') { txt = `−${money(s.tx, true)} just now`; cls = 'is-done'; }
      if (settled && s.phase === 'declined') { txt = `Not enough available for ${money(CHARGE, true)}`; cls = 'is-bad'; }
      note.textContent = txt; note.className = 'cc-note ' + cls;
    }

    // ---------- input ----------
    function release(id) {
      if (!pDown) return; pDown = false;
      if (id !== s.active) { select(id); return; }
      const dy = s.dragging ? s.dy : 0;
      if (Math.abs(dy) < 6) {
        set({ dragging: false, dy: 0 });
        if (!s.open) openUp();
        else if (s.phase === 'ready') pay();
        else if (s.phase === 'done' || s.phase === 'declined') startFaceId();
        return;
      }
      const openNow = ((s.open ? 0 : G.HIDE) + dy) < G.HIDE * .6;
      if (openNow && !s.open) openUp(); else if (!openNow) closeDown(); else set({ dragging: false, dy: 0 });
    }
    CARDS.forEach(d => {
      const el = cardEl(d.id);
      el.addEventListener('pointerdown', e => {
        pDown = true; startY = e.clientY;
        try { el.setPointerCapture(e.pointerId); } catch {}
        if (d.id === s.active) set({ dragging: true, dy: 0 });
      });
      el.addEventListener('pointermove', e => { if (s.dragging && pDown) set({ dy: e.clientY - startY }); });
      el.addEventListener('pointerup', () => release(d.id));
      el.addEventListener('pointercancel', () => release(d.id));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pDown = true; release(d.id); }
        if (e.key === 'Escape' && s.open) closeDown();
      });
    });
    $('.cc-reset').addEventListener('click', () => { closeDown(); set({ spent: { a: 0, b: 0, c: 0 }, disp: 0, active: 'a' }); });
    // Focusing a card must never scroll the clipped stage (it would shift the whole layout).
    host.addEventListener('scroll', () => { host.scrollTop = 0; host.scrollLeft = 0; });
    const onResize = () => { if (!host.isConnected) { removeEventListener('resize', onResize); return; } measure(); render(); };
    addEventListener('resize', onResize);
    requestAnimationFrame(() => { measure(); render(); });
    measure(); render();
  }

  window.ChalaCards = { mount };
})();
