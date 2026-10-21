/* chala v3 — Cards tab, after the "editorial flip" reference (no pay step, no Face ID).
   - The chosen card sits up top; the rest peek out of a wallet at the bottom.
   - Tap the card to flip it: the back shows what's available, against the limit.
   - Swipe it sideways to flip through your cards, or tap / swipe up a card in the wallet to bring it up.
   - Every card carries a high / medium / low balance tag. */
(() => {
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const LOW = .25, MID = .5;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Math.max(0, n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const whole = n => '$' + Math.max(0, n).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const CARDS = [
    { id: 'a', name: 'Everyday', last4: '4021', limit: 3000, pct: 62, bg: '#F5C6B1', ink: '#2A1A14' },
    { id: 'b', name: 'Travel', last4: '7716', limit: 5000, pct: 48, bg: '#1D1C20', ink: '#F7F3EF', dark: true },
    { id: 'c', name: 'Groceries', last4: '0388', limit: 800, pct: 9, bg: '#D5CBEF', ink: '#211A33' }
  ];
  const CHIP = '<svg class="cf-chip" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x=".6" y=".6" width="38.8" height="28.8" rx="6"/><path d="M14 .6v8.4M26 .6v8.4M14 21v8.4M26 21v8.4M.6 10.5H11M29 10.5h10.4M.6 19.5H11M29 19.5h10.4"/><rect x="11" y="9" width="18" height="12" rx="4"/></svg>';
  const level = r => r >= MID ? ['high', 'High balance'] : r >= LOW ? ['mid', 'Medium balance'] : ['low', 'Low balance'];

  function mount(host, { holder = '' } = {}) {
    if (!host) return;
    const first = (holder || 'Card holder').trim().split(/\s+/), hFirst = first[0], hRest = first.slice(1).join(' ');
    const s = { order: CARDS.map(d => d.id), flip: false, dx: 0, drag: false };
    let G = null;

    host.innerHTML = `${CARDS.map(d => {
      const avail = d.limit * d.pct / 100, r = avail / d.limit, [lk, lt] = level(r);
      return `
      <div class="cf-card${d.dark ? ' is-dark' : ''}" data-card="${d.id}" role="button" tabindex="0" style="--bg:${d.bg};--ink:${d.ink}">
        <div class="cf-face cf-front">
          <div class="cf-row"><span class="cf-name">${esc(d.name)}</span><span class="cf-lvl is-${lk}"><i></i>${lt}</span></div>
          ${CHIP}
          <div class="cf-row cf-foot"><span class="cf-holder"><b>${esc(hFirst)}</b>${hRest ? ' ' + esc(hRest) : ''}</span><span class="cf-last">•••• ${d.last4}</span></div>
        </div>
        <div class="cf-face cf-back">
          <div class="cf-row"><span class="cf-k">Available</span><span class="cf-last cf-last-s">•••• ${d.last4}</span></div>
          <div class="cf-amt"><b>${money(avail)}</b><span>of ${whole(d.limit)} limit</span></div>
          <div class="cf-bar is-${lk}"><span><i style="--w:${(r * 100).toFixed(1)}%"></i></span><em>${Math.round(r * 100)}%</em></div>
        </div>
      </div>`; }).join('')}
      <div class="cf-under"><div class="cf-dots" aria-hidden="true">${CARDS.map(d => `<i data-dot="${d.id}"></i>`).join('')}</div><p class="cf-hint" aria-live="polite"></p></div>`;
    const card = id => host.querySelector(`[data-card="${id}"]`), $ = q => host.querySelector(q);

    // fit the stage between the header and the nav
    function measure() {
      const nav = document.querySelector('.fh-nav');
      const top = host.getBoundingClientRect().top + window.scrollY;
      const navTop = nav ? nav.getBoundingClientRect().top + window.scrollY : window.innerHeight;
      const H = Math.max(470, navTop - top - 6), W = host.clientWidth;
      const cw = Math.min(340, W - 8), ch = Math.round(cw / 1.586);
      host.style.height = H + 'px';
      host.style.setProperty('--cf-w', cw + 'px'); host.style.setProperty('--cf-h', ch + 'px');
      host.style.setProperty('--cf-under', (12 + ch + 18) + 'px');
      G = { H, W, cw, ch };
    }

    function render() {
      if (!G) measure();
      const [act, ...rest] = s.order, ms = v => (reduce() ? '0ms' : v);
      s.order.forEach(id => {
        const el = card(id), isA = id === act;
        let y, x = 0, rz = 0, sc = 1, z, ry = 0;
        if (isA) {
          y = 12; x = s.dx; rz = s.dx / 40; z = 30; ry = s.flip ? 180 : 0;
        } else {
          // the wallet: cards peek out of the bottom edge, the next one up front and lowest
          const k = rest.indexOf(id), n = rest.length;
          y = G.H - 70 + k * 56 - (n - 1) * 56; sc = .94 - (n - 1 - k) * .03; z = 10 + k;
        }
        el.style.zIndex = z;
        el.style.transition = s.drag && isA ? 'transform 0ms' : `transform ${ms('560ms')} ${EASE}`;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${rz.toFixed(2)}deg) scale(${sc})`;
        el.querySelector('.cf-front').style.transform = `rotateY(${ry}deg)`;
        el.querySelector('.cf-back').style.transform = `rotateY(${ry - 180}deg)`;
        el.classList.toggle('is-up', isA); el.classList.toggle('is-flipped', isA && s.flip);
        const d = CARDS.find(c => c.id === id), avail = d.limit * d.pct / 100;
        el.setAttribute('aria-label', `${d.name} card ending ${d.last4}, ${money(avail)} of ${whole(d.limit)} available. ${level(avail / d.limit)[1]}. ${isA ? (s.flip ? 'Tap to flip back.' : 'Tap to see the balance.') : 'Tap to bring it up.'}`);
      });
      host.querySelectorAll('[data-dot]').forEach(i => i.classList.toggle('on', i.dataset.dot === act));
      $('.cf-hint').textContent = s.flip ? 'Tap to flip back · swipe for your next card' : 'Tap to see your balance · swipe for your next card';
    }

    const bring = id => { if (id === s.order[0]) return; s.order = [id, ...s.order.filter(x => x !== id)]; s.flip = false; render(); };
    // flip through the cards in their own order, whatever the wallet shows
    const step = dir => { const ids = CARDS.map(d => d.id), i = ids.indexOf(s.order[0]); bring(ids[(i + dir + ids.length) % ids.length]); };

    let sx = 0, sy = 0, down = null, axis = null;
    host.addEventListener('pointerdown', e => {
      const el = e.target.closest('.cf-card'); if (!el) return;
      down = el.dataset.card; axis = null; sx = e.clientX; sy = e.clientY;
      try { el.setPointerCapture(e.pointerId); } catch {}
    });
    host.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!axis) { if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return; axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; }
      if (axis === 'x' && down === s.order[0]) { s.drag = true; s.dx = dx; render(); }
    });
    const up = e => {
      if (!down) return;
      const id = down, dx = e.clientX - sx, dy = e.clientY - sy; down = null;
      const wasDrag = s.drag; s.drag = false; s.dx = 0;
      if (id === s.order[0]) {
        if (axis === 'x' && Math.abs(dx) > 60) { step(dx < 0 ? 1 : -1); return; }
        if (!axis) { s.flip = !s.flip; }
        render(); return;
      }
      if (!axis || (axis === 'y' && dy < -24)) bring(id); else if (wasDrag) render();
    };
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', () => { down = null; s.drag = false; s.dx = 0; render(); });
    host.addEventListener('keydown', e => {
      const el = e.target.closest('.cf-card'); if (!el) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (el.dataset.card === s.order[0]) { s.flip = !s.flip; render(); } else bring(el.dataset.card); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); card(s.order[0]).focus({ preventScroll: true }); }
    });
    host.addEventListener('scroll', () => { host.scrollTop = 0; host.scrollLeft = 0; });
    const onResize = () => { if (!host.isConnected) { removeEventListener('resize', onResize); return; } measure(); render(); };
    addEventListener('resize', onResize);
    measure(); render();
    requestAnimationFrame(() => { if (host.isConnected) { measure(); render(); } });
  }

  window.ChalaCards = { mount };
})();
