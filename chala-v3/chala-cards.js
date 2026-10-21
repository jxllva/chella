/* chala v3 — Cards tab, after the "editorial flip" reference (no pay step, no Face ID).
   - The chosen card sits up top; the rest peek out of a wallet at the bottom.
   - Tap the card to flip it: the back shows what's available, against the limit.
   - Swipe up (or tap) a card in the wallet to bring it up; swipe the top card down to put it back. Both follow your finger. Sideways swipes still flip through them.
   - Minimal faces: no balance tags; the bar on the back turns red when a card runs low.
   - The + by the title adds a card (name, last 4, limit, available, color); added cards are kept on this device. */
(() => {
  const EASE = 'cubic-bezier(.2,.8,.2,1)';
  const LOW = .25, MID = .5;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let hintDone = false; // the hint shows once, until the first flip
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '$' + Math.max(0, n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const whole = n => '$' + Math.max(0, n).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const BASE = [
    { id: 'a', name: 'Everyday', last4: '4021', limit: 3000, pct: 62, bg: '#F5C6B1', ink: '#2A1A14' },
    { id: 'b', name: 'Travel', last4: '7716', limit: 5000, pct: 48, bg: '#1D1C20', ink: '#F7F3EF', dark: true },
    { id: 'c', name: 'Groceries', last4: '0388', limit: 800, pct: 9, bg: '#D5CBEF', ink: '#211A33' }
  ];
  // cards the person added, kept on this device
  const STORE = 'chala-cards-v1';
  const loadAdded = () => { try { const l = JSON.parse(localStorage.getItem(STORE)); return Array.isArray(l) ? l : []; } catch { return []; } };
  const saveAdded = l => { try { localStorage.setItem(STORE, JSON.stringify(l)); } catch {} };
  let CARDS = [...BASE, ...loadAdded()];
  const SWATCHES = [['#F5C6B1', '#2A1A14'], ['#D5CBEF', '#211A33'], ['#CFE3D4', '#16271C'], ['#F3DDA6', '#2B220F'], ['#1D1C20', '#F7F3EF', true]];
  const CHIP = '<svg class="cf-chip" viewBox="0 0 40 30" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x=".6" y=".6" width="38.8" height="28.8" rx="6"/><path d="M14 .6v8.4M26 .6v8.4M14 21v8.4M26 21v8.4M.6 10.5H11M29 10.5h10.4M.6 19.5H11M29 19.5h10.4"/><rect x="11" y="9" width="18" height="12" rx="4"/></svg>';
  const level = r => r >= MID ? ['high', 'High balance'] : r >= LOW ? ['mid', 'Medium balance'] : ['low', 'Low balance'];

  function mount(host, opts = {}) {
    if (!host) return;
    const { holder = '', first: firstId } = opts;
    CARDS = [...BASE, ...loadAdded()];
    const first = (holder || 'Card holder').trim().split(/\s+/), hFirst = first[0], hRest = first.slice(1).join(' ');
    const s = { order: firstId ? [firstId, ...CARDS.map(d => d.id).filter(x => x !== firstId)] : CARDS.map(d => d.id), flip: false, dx: 0, drag: false, stowed: false }; // stowed: every card is back in the wallet
    let G = null;

    host.innerHTML = `${CARDS.map(d => {
      const avail = d.limit * d.pct / 100, r = avail / d.limit, [lk, lt] = level(r);
      return `
      <div class="cf-card${d.dark ? ' is-dark' : ''}" data-card="${d.id}" role="button" tabindex="0" style="--bg:${d.bg};--ink:${d.ink}">
        <div class="cf-face cf-front">
          <div class="cf-row"><span class="cf-name">${esc(d.name)}</span></div>
          ${CHIP}
          <div class="cf-row cf-foot"><span class="cf-holder"><b>${esc(hFirst)}</b>${hRest ? ' ' + esc(hRest) : ''}</span><span class="cf-last">•••• ${d.last4}</span></div>
        </div>
        <div class="cf-face cf-back">
          <div class="cf-row"><span class="cf-k">Available</span><span class="cf-last cf-last-s">•••• ${d.last4}</span></div>
          <div class="cf-amt"><b>${money(avail)}</b><span>of ${whole(d.limit)} limit</span></div>
          <div class="cf-bar is-${lk}"><span><i style="--w:${(r * 100).toFixed(1)}%"></i></span><em>${Math.round(r * 100)}%</em></div>
        </div>
      </div>`; }).join('')}
      <div class="cf-under"><p class="cf-hint" aria-live="polite"></p></div>`;
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
      const act = s.stowed ? null : s.order[0], rest = s.stowed ? [...s.order.slice(1), s.order[0]] : s.order.slice(1), ms = v => (reduce() ? '0ms' : v);
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
        el.style.transition = s.drag && isA ? 'transform 0ms' : `transform ${ms('560ms')} ${EASE}, translate ${ms('560ms')} ${EASE}`;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${rz.toFixed(2)}deg) scale(${sc})`;
        el.querySelector('.cf-front').style.transform = `rotateY(${ry}deg)`;
        el.querySelector('.cf-back').style.transform = `rotateY(${ry - 180}deg)`;
        el.classList.toggle('is-up', isA); el.classList.toggle('is-flipped', isA && s.flip);
        const d = CARDS.find(c => c.id === id), avail = d.limit * d.pct / 100;
        el.setAttribute('aria-label', `${d.name} card ending ${d.last4}, ${money(avail)} of ${whole(d.limit)} available. ${isA ? (s.flip ? 'Tap to flip back.' : 'Tap to see the balance.') : 'Tap to bring it up.'}`);
      });
      if (s.flip) hintDone = true;
      const hint = $('.cf-hint'); hint.textContent = s.stowed ? 'Swipe up a card to see it' : 'Tap to see your balance'; hint.classList.toggle('is-stowed', s.stowed); hint.style.visibility = hintDone && !s.stowed ? 'hidden' : '';
    }

    const bring = id => { if (!s.stowed && id === s.order[0]) return; s.order = [id, ...s.order.filter(x => x !== id)]; s.stowed = false; s.flip = false; render(); };
    const stow = () => { s.stowed = true; s.flip = false; render(); };
    // flip through the cards in their own order, whatever the wallet shows
    const step = dir => { if (s.stowed) { bring(s.order[0]); return; } const ids = CARDS.map(d => d.id), i = ids.indexOf(s.order[0]); bring(ids[(i + dir + ids.length) % ids.length]); };

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
      const isTop = !s.stowed && down === s.order[0];
      if (axis === 'x' && isTop) { s.drag = true; s.dx = dx; render(); }
      // the top card follows a swipe down; wallet cards follow a swipe up
      if (axis === 'y' && isTop) { const el = card(down); el.style.transition = 'none'; el.style.translate = `0 ${Math.max(0, Math.min(260, dy))}px`; }
      if (axis === 'y' && !isTop) { const el = card(down); el.style.transition = 'none'; el.style.translate = `0 ${Math.max(-160, Math.min(0, dy)) }px`; }
    });
    const up = e => {
      if (!down) return;
      const id = down, dx = e.clientX - sx, dy = e.clientY - sy; down = null;
      const wasDrag = s.drag; s.drag = false; s.dx = 0;
      const lifted = card(id); if (lifted?.style.translate) lifted.style.translate = '';
      if (!s.stowed && id === s.order[0]) {
        if (axis === 'y' && dy > 50) { stow(); return; }
        if (axis === 'x' && Math.abs(dx) > 60) { step(dx < 0 ? 1 : -1); return; }
        if (!axis) { s.flip = !s.flip; }
        render(); return;
      }
      if (!axis || (axis === 'y' && dy < -24)) bring(id); else if (axis === 'y') render(); else if (wasDrag) render();
    };
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', () => { down = null; s.drag = false; s.dx = 0; render(); });
    host.addEventListener('keydown', e => {
      const el = e.target.closest('.cf-card'); if (!el) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!s.stowed && el.dataset.card === s.order[0]) { s.flip = !s.flip; render(); } else bring(el.dataset.card); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); card(s.order[0]).focus({ preventScroll: true }); }
    });
    host.addEventListener('scroll', () => { host.scrollTop = 0; host.scrollLeft = 0; });
    const onResize = () => { if (!host.isConnected) { removeEventListener('resize', onResize); return; } measure(); render(); };
    addEventListener('resize', onResize);
    const add = document.querySelector('[data-cf-add]');
    if (add) add.onclick = () => addSheet(card => {
      saveAdded([...loadAdded(), card]);
      const fresh = host.cloneNode(false); host.replaceWith(fresh); // drop this mount's listeners
      mount(fresh, { ...opts, first: card.id });
    });
    measure(); render();
    requestAnimationFrame(() => { if (host.isConnected) { measure(); render(); } });
  }

  // ---------- add a card: a bottom sheet ----------
  function addSheet(done) {
    let tone = 0;
    const w = document.createElement('div');
    w.className = 'cfa'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'cfa-h');
    w.innerHTML = `<div class="cfa-scrim" data-x></div>
      <form class="cfa-panel" novalidate>
        <div class="cfa-grab" aria-hidden="true"></div>
        <div class="cfa-top"><h2 id="cfa-h">Add a card</h2><button type="button" class="cfa-x" data-x aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
        <div class="cfa-prev" aria-hidden="true"><span class="cfa-pn">New card</span><span class="cfa-pl">•••• 0000</span></div>
        <label class="cfa-f"><span>Card name</span><input id="cfa-name" name="name" maxlength="18" placeholder="Dining" autocomplete="off"></label>
        <label class="cfa-f"><span>Last 4 digits</span><input id="cfa-last4" name="last4" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off"></label>
        <div class="cfa-row">
          <label class="cfa-f"><span>Limit</span><span class="cfa-money"><i>$</i><input id="cfa-limit" name="limit" inputmode="decimal" placeholder="1,000"></span></label>
          <label class="cfa-f"><span>Available now</span><span class="cfa-money"><i>$</i><input id="cfa-avail" name="avail" inputmode="decimal" placeholder="Same as limit"></span></label>
        </div>
        <div class="cfa-f"><span>Color</span><div class="cfa-sw" role="radiogroup" aria-label="Card color">${SWATCHES.map((c, i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="Color ${i + 1}" data-t="${i}" style="background:${c[0]}"></button>`).join('')}</div></div>
        <p class="cfa-err" aria-live="polite"></p>
        <button class="cfa-go" type="submit">Add card</button>
      </form>`;
    document.body.appendChild(w);
    const f = w.querySelector('form'), prev = w.querySelector('.cfa-prev'), err = w.querySelector('.cfa-err');
    const num = v => parseFloat(String(v).replace(/[^0-9.]/g, ''));
    const paint = () => {
      const [bg, ink] = SWATCHES[tone]; prev.style.background = bg; prev.style.color = ink;
      prev.querySelector('.cfa-pn').textContent = f.name.value.trim() || 'New card';
      prev.querySelector('.cfa-pl').textContent = '•••• ' + (f.last4.value.replace(/\D/g, '').padEnd(4, '0').slice(0, 4));
    };
    const close = () => { if (!w.isConnected) return; document.removeEventListener('keydown', onKey, true);
      if (reduce()) { w.remove(); return; }
      w.querySelector('.cfa-panel').animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
      w.querySelector('.cfa-scrim').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => w.remove(), () => w.remove()); };
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey, true);
    w.addEventListener('click', e => {
      if (e.target.closest('[data-x]')) { close(); return; }
      const t = e.target.closest('[data-t]'); if (t) { tone = +t.dataset.t; w.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-checked', String(b === t))); paint(); }
    });
    f.addEventListener('input', e => { if (e.target === f.last4) f.last4.value = f.last4.value.replace(/\D/g, ''); err.textContent = ''; paint(); });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const name = f.name.value.trim(), last4 = f.last4.value, limit = num(f.limit.value), availRaw = f.avail.value.trim(), avail = availRaw ? num(availRaw) : limit;
      if (!name) { err.textContent = 'Give the card a name.'; f.name.focus(); return; }
      if (!/^\d{4}$/.test(last4)) { err.textContent = 'Enter the last 4 digits of the card number.'; f.last4.focus(); return; }
      if (!(limit > 0)) { err.textContent = 'Enter the card’s limit.'; f.limit.focus(); return; }
      if (!(avail >= 0)) { err.textContent = 'Enter what’s available, or leave it blank.'; f.avail.focus(); return; }
      const [bg, ink, dark] = SWATCHES[tone];
      close();
      done({ id: 'u' + Date.now().toString(36), name, last4, limit, pct: Math.min(100, avail / limit * 100), bg, ink, ...(dark ? { dark: true } : {}) });
    });
    paint();
    if (!reduce()) { w.querySelector('.cfa-panel').animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }); w.querySelector('.cfa-scrim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); }
    setTimeout(() => f.name.focus({ preventScroll: true }), 50);
  }

  window.ChalaCards = { mount };
})();
