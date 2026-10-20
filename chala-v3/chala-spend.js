/* chala v3 — Home's spending jar (replaces the money tree).
   One jar for this week or this month: how much went out against the budget your limits add up to.
   - The amount and an eye button to hide it (remembered on this device).
   - A plain-language status: comfortably below budget, moderate, or high.
   - The dashed "Today" line is where an even pace would put you, so the jar reads at a glance.
   - Week / Month, and arrows for earlier periods. Tap the jar to give it a slosh.
   All numbers come from Home through getData(mode, offset). */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const usd = c => '$' + Math.round(Math.abs(c) / 100).toLocaleString('en-US');
  const HIDE = 'chala-hide-amounts-v1';
  const hidden = () => { try { return localStorage.getItem(HIDE) === '1'; } catch { return false; } };
  const EYE = I('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>');
  const EYE_OFF = I('<path d="M3 3l18 18"/><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.7M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>');
  const listJoin = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a.at(-1);

  // high, moderate or comfortably below: measured against an even pace through the period
  function status(d) {
    if (!d.budget) return { k: 'none', t: 'No budget set yet', s: 'Add a spending limit to see how you’re doing.' };
    const pace = d.spent / Math.max(1, d.budget * d.elapsed), left = d.budget - d.spent;
    const tail = d.daysLeft > 0 ? ` · ${d.daysLeft} ${d.daysLeft === 1 ? 'day' : 'days'} to go` : '';
    if (left < 0) return { k: 'high', t: 'High: over budget', s: `${usd(-left)} over${tail}` };
    if (pace > 1.1) return { k: 'high', t: 'High: ahead of budget', s: `${usd(left)} left${tail}` };
    if (pace > .85) return { k: 'mid', t: 'Moderate: on pace', s: `${usd(left)} left${tail}` };
    return { k: 'low', t: 'Comfortably below budget', s: `${usd(left)} left${tail}` };
  }

  function jarSVG() {
    return `<svg class="sp-svg" viewBox="0 0 120 160" aria-hidden="true">
      <defs><clipPath id="sp-clip"><path d="M18 26h84v112a14 14 0 0 1-14 14H32a14 14 0 0 1-14-14z"/></clipPath></defs>
      <rect x="26" y="8" width="68" height="14" rx="5" class="sp-lid"/>
      <path d="M18 26h84v112a14 14 0 0 1-14 14H32a14 14 0 0 1-14-14z" class="sp-glass"/>
      <g clip-path="url(#sp-clip)"><g class="sp-liq"><path class="sp-wave" d="M-120 0 Q-105 -6 -90 0 T-60 0 T-30 0 T0 0 T30 0 T60 0 T90 0 T120 0 T150 0 T180 0 T210 0 T240 0 V200 H-120z"/>
        <circle class="sp-bub" cx="44" cy="40" r="3"/><circle class="sp-bub b2" cx="74" cy="60" r="2.4"/><circle class="sp-bub b3" cx="58" cy="80" r="2"/></g></g>
      <path d="M18 26h84v112a14 14 0 0 1-14 14H32a14 14 0 0 1-14-14z" class="sp-rim"/>
      <g class="sp-pace"><line x1="12" x2="108" y1="0" y2="0"/><text x="106" y="-5" text-anchor="end">Today</text></g>
      <text class="sp-pct" x="60" y="96" text-anchor="middle"></text>
    </svg>`;
  }

  function mount(host, opts) {
    if (!host) return;
    const st = { mode: opts.mode || 'M', offset: 0 };
    host.classList.add('sp');
    host.innerHTML = `
  <div class="sp-top">
    <div class="sp-seg" role="tablist" aria-label="Period"><button role="tab" data-m="W">Week</button><button role="tab" data-m="M">Month</button></div>
    <button class="sp-eye" data-a="eye"></button>
  </div>
  <div class="sp-period">
    <button class="sp-arrow" data-d="-1" aria-label="Previous period">${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button>
    <p class="sp-when" aria-live="polite"><b></b><span></span></p>
    <button class="sp-arrow" data-d="1" aria-label="Next period">${I('<path d="M9.5 6l6 6-6 6"/>')}</button>
  </div>
  <div class="sp-main">
    <button class="sp-jar" data-a="jar">${jarSVG()}</button>
    <div class="sp-nums">
      <span class="sp-k">Spent</span>
      <b class="sp-amt"></b>
      <span class="sp-of"></span>
      <span class="sp-status"><i aria-hidden="true"></i><span></span></span>
      <span class="sp-left"></span>
    </div>
  </div>
  <p class="sp-cats"></p>
  <div class="sp-acts"><button class="sp-wrap" data-a="wrap">${I('<path d="M5 4.5h11l3 3V19.5H5z"/><path d="M8.5 10h7M8.5 13.5h7M8.5 17h4"/>')}<span>Your wrap</span></button><button class="sp-recap" data-a="recap">${I('<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15v-4M12 15V8M16 15v-6"/>')}<span>Recap</span></button></div>`;
    const $ = s => host.querySelector(s);
    let shownAmt = null;

    function paint(animate) {
      const d = opts.getData(st.mode, st.offset); if (!d) return;
      const hide = hidden(), sx = status(d);
      host.querySelectorAll('.sp-seg button').forEach(b => { const on = b.dataset.m === st.mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
      $('[data-d="-1"]').disabled = !d.hasPrev; $('[data-d="1"]').disabled = !d.hasNext;
      $('.sp-when b').textContent = d.when; $('.sp-when span').textContent = d.range;
      host.dataset.status = sx.k;
      // the amount, or dots when hidden
      const amt = $('.sp-amt');
      if (hide) amt.textContent = '$•••';
      else if (animate && !reduce() && shownAmt !== d.spent) { const from = shownAmt ?? 0, to = d.spent, t0 = performance.now(); const step = now => { const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); amt.textContent = usd(from + (to - from) * e); if (k < 1 && host.isConnected) requestAnimationFrame(step); }; requestAnimationFrame(step); }
      else amt.textContent = usd(d.spent);
      shownAmt = d.spent;
      $('.sp-of').textContent = d.budget ? `of ${hide ? '$•••' : usd(d.budget)} ${st.mode === 'W' ? 'weekly' : 'monthly'} budget` : 'No limits set';
      $('.sp-status span').textContent = sx.t;
      $('.sp-left').textContent = hide && d.budget ? (d.daysLeft > 0 ? `${d.daysLeft} ${d.daysLeft === 1 ? 'day' : 'days'} to go` : '') : sx.s;
      $('.sp-cats').innerHTML = d.cats.length ? `Counts what you set limits for: ${esc(listJoin(d.cats))}.` : '<button class="sp-addlimit" data-h="addlimit">Add a spending limit</button>';
      const eye = $('.sp-eye'); eye.innerHTML = hide ? EYE_OFF : EYE; eye.setAttribute('aria-pressed', String(hide)); eye.setAttribute('aria-label', hide ? 'Show amounts' : 'Hide amounts');
      // the jar: liquid to spent ÷ budget, the dashed line where an even pace would be today
      const r = d.budget ? d.spent / d.budget : 0, fill = Math.min(1.04, r);
      const top = 152 - fill * 126;
      const liq = $('.sp-liq'); liq.style.transform = `translateY(${top.toFixed(1)}px)`;
      const pace = $('.sp-pace'); pace.style.display = d.budget && d.elapsed < 1 ? '' : 'none'; pace.setAttribute('transform', `translate(0 ${(152 - d.elapsed * 126).toFixed(1)})`);
      $('.sp-pct').textContent = d.budget && !hide ? `${Math.round(r * 100)}%` : '';
      // the percentage sits in the middle of the liquid, or just above it when the jar is nearly empty
      $('.sp-pct').setAttribute('y', (152 - top > 44 ? Math.max(top + 30, (top + 152) / 2 + 8) : top - 8).toFixed(0));
      $('.sp-jar').setAttribute('aria-label', d.budget ? `${d.when}: ${hide ? '' : `${usd(d.spent)} spent of ${usd(d.budget)}, `}${Math.round(r * 100)}% of your budget. ${sx.t}.` : `${d.when}: ${hide ? 'amount hidden' : usd(d.spent) + ' spent'}. No budget set.`);
    }

    const go = dir => { const n = st.offset + dir; if (!opts.getData(st.mode, n)) return; st.offset = n; paint(true); };
    host.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m && b.dataset.m !== st.mode) { st.mode = b.dataset.m; st.offset = 0; opts.onMode?.(st.mode); paint(true); return; }
      if (b.dataset.d) { go(+b.dataset.d); return; }
      const a = b.dataset.a;
      if (a === 'eye') { try { localStorage.setItem(HIDE, hidden() ? '0' : '1'); } catch {} paint(false); return; }
      if (a === 'wrap') { opts.onWrap?.(); return; }
      if (a === 'recap') { opts.onRecap?.(st.mode, st.offset); return; }
      if (a === 'jar' && !reduce()) { const w = $('.sp-wave'); w.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: 'translateY(-4px) rotate(-4deg)' }, { transform: 'translateY(2px) rotate(3deg)' }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.25,.1,.25,1)' }); }
    });
    paint(true);
  }

  window.ChalaSpend = { mount };
})();
