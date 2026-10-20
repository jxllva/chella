/* Faiit onboarding: type-led welcome, phone-only sign up / sign in, money source picker, and the hello screen.
   Prototype: no SMS is sent and nothing leaves the device. Any 6 digits verify.
   The name typed at sign up always wins over one found in a statement. */
(() => {
  const USER_KEY = 'faiit-user-v1';
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // [iso, name, dial code, national number length]
  const COUNTRIES = [
    ['US', 'United States', '+1', 10], ['CA', 'Canada', '+1', 10], ['NG', 'Nigeria', '+234', 10],
    ['GB', 'United Kingdom', '+44', 10], ['GH', 'Ghana', '+233', 9], ['KE', 'Kenya', '+254', 9],
    ['RW', 'Rwanda', '+250', 9], ['ZA', 'South Africa', '+27', 9], ['IN', 'India', '+91', 10],
    ['ES', 'Spain', '+34', 9]
  ];
  const country = iso => COUNTRIES.find(c => c[0] === iso) || COUNTRIES[0];
  const guessCountry = () => {
    const lang = (navigator.language || 'en-US').split('-')[1];
    return COUNTRIES.some(c => c[0] === lang) ? lang : 'US';
  };
  const formatPhone = (iso, d) => {
    const [, , , len] = country(iso);
    if (iso === 'US' || iso === 'CA') {
      if (d.length < 4) return d;
      if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    }
    const groups = len === 10 ? [3, 3, 4] : [2, 3, 4];
    const out = []; let i = 0;
    for (const g of groups) { if (i >= d.length) break; out.push(d.slice(i, i + g)); i += g; }
    return out.join(' ');
  };
  const fullPhone = s => `${country(s.iso)[2]} ${formatPhone(s.iso, s.phone)}`;

  const svg = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg class="fw-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke-width="3"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 4l9 5.5M5 10v8m4.7-8v8m4.6-8v8M19 10v8M3 20.5h18"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M10 4 8 20M16 4l-2 16M5 9h15M4 15h15"/></svg>',
    at: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.6"/><path d="M15.6 12v1.4a2.6 2.6 0 0 0 5.2 0V12a8.8 8.8 0 1 0-3.5 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>'
  };

  // ---------- persistence ----------
  // { iso, phone, name, nameSource: 'bank' | 'statement' | 'user', helloSeen, createdAt }
  const getUser = () => {
    try {
      const u = JSON.parse(localStorage.getItem(USER_KEY));
      if (!u || !u.phone) return null;
      if (!u.name && u.first) { u.name = u.first; u.nameSource = 'user'; u.helloSeen = true; } // earlier prototype accounts
      return u;
    } catch { return null; }
  };
  const setUser = u => { try { localStorage.setItem(USER_KEY, JSON.stringify(u)); } catch {} };
  const patchUser = p => { const u = getUser(); if (u) setUser({ ...u, ...p }); };
  const titleCase = n => n.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const firstName = n => (n || '').trim().split(/\s+/)[0] || '';

  // ---------- state ----------
  const S = { open: false, mode: 'up', step: 'phone', dir: 'from-right', iso: guessCountry(), phone: '', code: '', first: '', last: '', error: '', resendAt: 0, verifying: false, known: null };
  let root = null, api = null, resendTimer = null, kbBound = false;

  const stepsFor = () => (S.mode === 'in' && S.known) ? ['phone', 'code'] : ['phone', 'code', 'name'];

  // ---------- splash ----------
  const F_PATH = 'M-22 0Q-36 0 -36 10Q-36 21 -16 24L4 27Q26 30 34.5 37.5Q43 45 47 66L183 654Q188 675 183.0 682.0Q178 689 158 693L138 697Q125 700 125 708Q125 720 143 720H465Q490 720 485 697L455 531Q452 514 439 514Q425 514 427 527L429 562Q434 631 407.0 663.0Q380 695 338 695Q295 695 275.0 681.0Q255 667 248 638L194 402Q191 388 205 388H242Q285 388 306 435L329 484Q332 490 335.0 493.5Q338 497 344 497Q349 497 353.0 492.5Q357 488 355 480L303 257Q298 240 287 240Q275 240 275 253V301Q275 336 266.0 347.0Q257 358 234 358H198Q183 358 180 344L116 71Q111 50 116.0 41.5Q121 33 141 30L194 23Q206 22 206 12Q206 0 189 0Z';
  /* chala v3: a type wordmark in Faiit's serif instead of the F mark */
  /* chala v3: the wordmark's "l" is a sprout. grow = play the grow-and-shake intro */
  const chalaWord = (grow = false) => `<span class="ch-c">cha</span><span class="ch-l${grow ? ' ch-grow' : ''}" aria-hidden="true"><svg class="ch-sp" viewBox="0 0 20 36" overflow="visible"><path class="ch-sp-stem" pathLength="1" d="M10 35.4V19.6"/><g class="ch-sp-leaf ch-sp-l2"><path d="M10 20.4C9.4 16.6 7.6 13.2 4.6 11.4 3.4 10.7 2 10.3.4 10.2c-.3 3.6.4 6.6 2.6 8.4 1.6 1.3 3.6 1.7 5.4 1.6.7 0 1.2.1 1.6.2z"/><path class="ch-sp-vein" d="M9.2 19.2C7.6 15.8 5.2 13.2 2 11.4"/></g><g class="ch-sp-leaf ch-sp-l1"><path d="M10 20.4C10 15.6 11.4 10.6 14.4 7.4 15.8 5.9 17.6 4.8 19.8 4.2c.6 4.4-.1 8.4-2.6 11.2-1.8 2-4.2 3.2-6.4 3.8-.4.2-.7.6-.8 1.2z"/><path class="ch-sp-vein" d="M10.6 18.4C11.6 13.6 14.4 9 18.4 5.8"/></g></svg><i class="ch-pop" aria-hidden="true"><b></b><b></b><b></b><b></b></i></span><span class="ch-c ch-c2">a</span>`;
  window.chalaWord = chalaWord;
  const fMark = (draw = false, label = '') => `<span class="fw-mark ch-wordmark${draw ? ' ch-wordmark-grow' : ''}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${chalaWord(draw)}</span>`;
  const words = (line, start) => line.map((w, i) => `<span class="fw-w" style="--i:${start + i}">${w}</span>`).join(' ');
  // Soft moving gradient across the top half of every onboarding screen
  const sky = () => '<div class="fw-sky" aria-hidden="true"><i></i><i></i><i></i><i></i></div>';
  function splashMarkup() {
    return `
<section class="fw" aria-label="Welcome to chala">
  ${sky()}
  <header class="fw-top">${fMark(false, 'chala')}</header>
  <div class="fw-copy">
    <h1 class="fw-title"><span class="fw-line">${words(['Your', 'money,'], 0)}</span><span class="fw-line">${words(['<em>unwrapped.</em>'], 2)}</span></h1>
    <p class="fw-lead">See where it goes. Set limits that stick. Get a monthly recap worth sharing.</p>
  </div>
  <footer class="fw-actions">
    <button class="fw-btn fw-btn-primary" data-fw="start:up">Get started</button>
    <button class="fw-btn fw-btn-secondary" data-fw="start:in">I have an account</button>
    <p class="fw-legal">By continuing you agree to our <a href="#terms" data-fw="legal">Terms</a> and <a href="#privacy" data-fw="legal">Privacy Policy</a>.</p>
  </footer>
  <p class="fw-sr" aria-live="polite" id="fw-live"></p>
  <div class="fw-scrim" data-fw="close"></div>
  <div class="fw-sheet" role="dialog" aria-modal="true" aria-labelledby="fw-title" hidden></div>
</section>`;
  }

  // ---------- sheet ----------
  function stepMarkup() {
    const c = country(S.iso);
    const errId = 'fw-err';
    if (S.step === 'phone') {
      const title = S.mode === 'up' ? 'Create your <em>chala</em>' : 'Welcome <em>back</em>';
      return `
<h2 id="fw-title">${title}</h2>
${S.mode === 'in' ? '<p class="fw-sub">Enter the number you signed up with.</p>' : ''}
<form class="fw-form" data-fw-form="phone" novalidate>
  <div>
    <span class="fw-label" id="fw-phone-label">Mobile number</span>
    <div class="fw-phone">
      <div class="fw-select-wrap">
        <label class="fw-sr" for="fw-country">Country code</label>
        <select class="fw-select" id="fw-country" data-fw-field="iso" autocomplete="tel-country-code">
          ${COUNTRIES.map(([iso, name, dial]) => `<option value="${iso}" ${iso === S.iso ? 'selected' : ''} aria-label="${name} ${dial}">${iso} ${dial}</option>`).join('')}
        </select>
      </div>
      <input class="fw-input" id="fw-phone" data-fw-field="phone" type="tel" inputmode="numeric" autocomplete="tel-national" enterkeyhint="next"
        aria-labelledby="fw-phone-label" aria-describedby="${errId}" ${S.error ? 'aria-invalid="true"' : ''}
        placeholder="${esc(formatPhone(S.iso, '5551234567'.slice(0, c[3])))}" value="${esc(formatPhone(S.iso, S.phone))}">
    </div>
    <p class="fw-error" id="${errId}" role="alert">${esc(S.error)}</p>
  </div>
  <button type="submit" hidden></button>
</form>`;
    }
    if (S.step === 'code') {
      const boxes = Array.from({ length: 6 }, (_, i) => `<span class="fw-code-box ${S.code[i] ? 'filled' : ''} ${i === Math.min(S.code.length, 5) ? 'active' : ''}">${esc(S.code[i] || '')}</span>`).join('');
      return `
<h2 id="fw-title">Check your <em>texts</em></h2>
<p class="fw-sub">We sent a 6-digit code to <b>${esc(fullPhone(S))}</b></p>
<div class="fw-code ${S.error ? 'is-error' : ''} ${S.verifying ? 'is-ok' : ''}">
  ${boxes}
  <input class="fw-code-input" id="fw-code" data-fw-field="code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*"
    aria-label="6-digit code" aria-describedby="fw-err fw-code-note" value="${esc(S.code)}" ${S.verifying ? 'readonly' : ''}>
</div>
<p class="fw-error" id="fw-err" role="alert">${esc(S.error)}</p>
<p class="fw-note" id="fw-code-note">Demo: any 6 digits work.</p>`;
    }
    if (S.step === 'name') {
      return `
<h2 id="fw-title">${S.mode === 'in' ? 'New here? What’s your <em>name</em>?' : 'What’s your <em>name</em>?'}</h2>
<form class="fw-form" data-fw-form="name" novalidate>
  <div>
    <label class="fw-label" for="fw-first">First name</label>
    <input class="fw-input" id="fw-first" data-fw-field="first" type="text" autocomplete="given-name" autocapitalize="words" enterkeyhint="next" maxlength="40"
      value="${esc(S.first)}" aria-describedby="fw-err" ${S.error ? 'aria-invalid="true"' : ''}>
  </div>
  <div>
    <label class="fw-label" for="fw-last">Last name <span class="fw-optional">optional</span></label>
    <input class="fw-input" id="fw-last" data-fw-field="last" type="text" autocomplete="family-name" autocapitalize="words" enterkeyhint="done" maxlength="40"
      value="${esc(S.last)}">
  </div>
  <p class="fw-error" id="fw-err" role="alert">${esc(S.error)}</p>
  <button type="submit" hidden></button>
</form>`;
    }
    return '';
  }

  function canContinue() {
    if (S.step === 'phone') return S.phone.length === country(S.iso)[3];
    if (S.step === 'code') return S.code.length === 6 && !S.verifying;
    if (S.step === 'name') return S.first.trim().length > 0;
    return false;
  }

  function footMarkup() {
    const label = S.step === 'code' ? (S.verifying ? 'Verifying…' : 'Verify') : S.step === 'name' ? 'Done' : 'Continue';
    let extra = '';
    if (S.step === 'phone') extra = S.mode === 'up'
      ? `<button class="fw-link" type="button" data-fw="switch:in">I already have an account</button>`
      : `<button class="fw-link" type="button" data-fw="switch:up">New to chala? Create an account</button>`;
    if (S.step === 'code') {
      const wait = Math.max(0, Math.ceil((S.resendAt - Date.now()) / 1000));
      extra = `<button class="fw-link" type="button" data-fw="resend" ${wait ? 'disabled' : ''} aria-live="polite">${wait ? `Resend code in 0:${String(wait).padStart(2, '0')}` : 'Resend code'}</button>`;
    }
    return `<button class="fw-btn fw-btn-primary" data-fw="next" ${canContinue() ? '' : 'disabled'}>${label}</button>${extra}`;
  }

  // Each step gets a small icon circle at the top of the overlay: # phone, chat code, @ name
  const stepIcon = step => ({ phone: svg.hash, code: svg.chat, name: svg.at })[step] || svg.hash;
  function sheetMarkup() {
    const steps = stepsFor(), idx = steps.indexOf(S.step);
    return `
<div class="fw-sheet-top">
  <button class="fw-icon-btn" data-fw="back" aria-label="${idx > 0 ? 'Previous step' : 'Close'}">${svg.back}</button>
  <span class="fw-step-badge" aria-hidden="true">${stepIcon(S.step)}</span>
  <button class="fw-icon-btn" data-fw="close" aria-label="Close">${svg.close}</button>
</div>
<p class="fw-sr" id="fw-step-count">Step ${idx + 1} of ${steps.length}</p>
<div class="fw-sheet-body"><div class="fw-step">${stepMarkup()}</div></div>
<div class="fw-sheet-foot">${footMarkup()}</div>`;
  }

  // The sheet grows out of the button you tapped and shrinks back into it.
  // Steps cross-dissolve: old content lifts and blurs away, new content rises in line by line.
  const EASE = 'cubic-bezier(.22,.8,.24,1)';
  let originBtn = null, shownStep = null, morphAnim = null;
  function morph(sheet, opening) {
    morphAnim?.cancel();
    if (reduceMotion() || !originBtn || !sheet.animate) return null;
    const s = sheet.getBoundingClientRect(), b = originBtn.getBoundingClientRect();
    const from = `inset(${b.top - s.top}px ${s.right - b.right}px ${s.bottom - b.bottom}px ${b.left - s.left}px round ${b.height / 2}px)`;
    const to = 'inset(0px 0px 0px 0px round 32px 32px 0px 0px)';
    morphAnim = sheet.animate([{ clipPath: from, opacity: .5 }, { clipPath: to, opacity: 1 }],
      { duration: opening ? 620 : 460, easing: EASE, direction: opening ? 'normal' : 'reverse', fill: 'both' });
    return morphAnim;
  }
  function enterChildren(step, delay = 120) {
    if (reduceMotion()) return;
    [...step.children].forEach((c, k) => c.animate(
      [{ opacity: 0, transform: 'translateY(14px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 520, delay: delay + k * 60, easing: EASE, fill: 'backwards' }));
  }
  function focusField(delay) {
    const t = root.querySelector('.fw-sheet .fw-step:not(.is-leaving)')?.querySelector('#fw-phone,#fw-code,#fw-first');
    setTimeout(() => t?.focus({ preventScroll: true }), delay);
  }
  function syncChrome(sheet) {
    const steps = stepsFor(), idx = steps.indexOf(S.step);
    const badge = sheet.querySelector('.fw-step-badge');
    if (badge && badge.innerHTML !== stepIcon(S.step)) {
      badge.innerHTML = stepIcon(S.step);
      if (!reduceMotion()) badge.animate([{ transform: 'scale(.6) rotate(-20deg)', opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    }
    const count = sheet.querySelector('#fw-step-count'); if (count) count.textContent = `Step ${idx + 1} of ${steps.length}`;
    const back = sheet.querySelector('[data-fw="back"]'); if (back) back.setAttribute('aria-label', idx > 0 ? 'Previous step' : 'Close');
  }

  function renderSheet(focus = true) {
    const sheet = root.querySelector('.fw-sheet');
    const fw = root.querySelector('.fw');
    fw.classList.toggle('is-sheet', S.open);
    ['.fw-top', '.fw-copy', '.fw-actions'].forEach(sel => { const n = root.querySelector(sel); if (n) n.inert = S.open; });

    if (!S.open) {
      if (sheet.hidden) return;
      shownStep = null;
      if (!reduceMotion()) [...sheet.children].forEach(n => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
      const anim = morph(sheet, false);
      const hide = () => { if (!S.open) { sheet.hidden = true; sheet.innerHTML = ''; morphAnim?.cancel(); } };
      if (anim) anim.finished.then(hide, () => {}); else hide();
      return;
    }

    if (sheet.hidden || !sheet.firstElementChild) { // opening
      sheet.hidden = false;
      sheet.innerHTML = sheetMarkup();
      shownStep = S.step;
      morph(sheet, true);
      if (!reduceMotion()) {
        sheet.querySelectorAll('.fw-sheet-top,.fw-sheet-foot').forEach(n => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay: 220, fill: 'backwards' }));
        enterChildren(sheet.querySelector('.fw-step'), 260);
      }
      if (focus) focusField(reduceMotion() ? 0 : 520);
      return;
    }

    const body = sheet.querySelector('.fw-sheet-body');
    const old = body.querySelector('.fw-step:not(.is-leaving)');
    const fresh = document.createElement('div');
    fresh.className = 'fw-step'; fresh.innerHTML = stepMarkup();
    syncChrome(sheet);
    refreshFoot();

    if (shownStep === S.step || !old) { // same step: just refresh (e.g. an error message)
      old ? old.replaceWith(fresh) : body.append(fresh);
      if (focus) focusField(0);
      return;
    }
    shownStep = S.step;
    if (reduceMotion()) { old.replaceWith(fresh); if (focus) focusField(0); return; }
    old.classList.add('is-leaving'); old.setAttribute('aria-hidden', 'true'); old.inert = true;
    const lift = S.dir === 'from-left' ? 'translateY(14px)' : 'translateY(-14px)';
    old.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: lift, filter: 'blur(8px)' }], { duration: 320, easing: EASE, fill: 'forwards' })
      .finished.then(() => old.remove(), () => old.remove());
    body.append(fresh);
    body.scrollTop = 0;
    enterChildren(fresh, 140);
    if (focus) focusField(260);
  }

  // Patch the footer in place so a tap that's mid-flight never loses its button
  function refreshFoot() {
    const f = root?.querySelector('.fw-sheet-foot'); if (!f) return;
    const tmp = document.createElement('div'); tmp.innerHTML = footMarkup();
    const cur = [...f.children], nxt = [...tmp.children];
    if (cur.length !== nxt.length || cur.some((c, i) => c.dataset.fw !== nxt[i].dataset.fw)) { f.replaceChildren(...nxt); return; }
    cur.forEach((c, i) => { const n = nxt[i]; c.disabled = n.disabled; if (c.innerHTML !== n.innerHTML) c.innerHTML = n.innerHTML; });
  }
  function refreshCode() {
    const wrap = root.querySelector('.fw-code'); if (!wrap) return;
    wrap.classList.toggle('is-error', !!S.error); wrap.classList.toggle('is-ok', S.verifying);
    wrap.querySelectorAll('.fw-code-box').forEach((b, i) => {
      const had = b.textContent; b.textContent = S.code[i] || '';
      b.classList.toggle('filled', !!S.code[i]); if (!had && S.code[i]) { b.classList.remove('filled'); void b.offsetWidth; b.classList.add('filled'); }
      b.classList.toggle('active', i === Math.min(S.code.length, 5) && document.activeElement?.id === 'fw-code');
    });
    const err = root.querySelector('#fw-err'); if (err) err.textContent = S.error;
  }

  function setStep(step, dir = 'from-right', push = true) {
    S.step = step; S.dir = dir; S.error = '';
    if (push) history.pushState({ view: 'welcome', fauth: { open: true, step, mode: S.mode } }, '', '#' + (S.mode === 'up' ? 'sign-up' : 'sign-in'));
    renderSheet();
  }

  function open(mode) {
    originBtn = root.querySelector(`[data-fw="start:${mode}"]`);
    S.mode = mode; S.open = true; S.step = 'phone'; S.dir = ''; S.error = ''; S.code = ''; S.verifying = false;
    history.pushState({ view: 'welcome', fauth: { open: true, step: 'phone', mode } }, '', '#' + (mode === 'up' ? 'sign-up' : 'sign-in'));
    renderSheet();
  }
  function close(push = true) {
    S.open = false; S.error = '';
    if (push) history.pushState({ view: 'welcome' }, '', location.pathname);
    renderSheet(false);
    root.querySelector('[data-fw="start:up"]')?.focus({ preventScroll: true });
  }

  // Every step is a history entry, so closing walks back past all of them in one go
  function closeAll() { const depth = stepsFor().indexOf(S.step) + 1; history.go(-Math.max(1, depth)); }

  function startResend() {
    S.resendAt = Date.now() + 30000;
    clearInterval(resendTimer);
    resendTimer = setInterval(() => { if (S.step !== 'code' || !S.open) { clearInterval(resendTimer); return; } refreshFoot(); if (Date.now() > S.resendAt) clearInterval(resendTimer); }, 1000);
  }

  function next() {
    if (!canContinue()) {
      if (S.step === 'phone') S.error = `Enter a ${country(S.iso)[3]}-digit number.`;
      if (S.step === 'code') S.error = 'Enter all 6 digits.';
      if (S.step === 'name') S.error = 'Add your first name.';
      renderSheet(false); return;
    }
    if (S.step === 'phone') {
      const u = getUser();
      S.known = u && u.phone === S.phone && u.iso === S.iso ? u : null;
      S.code = ''; startResend(); setStep('code'); return;
    }
    if (S.step === 'code') {
      S.verifying = true; refreshCode(); refreshFoot();
      root.querySelector('#fw-code')?.blur();
      setTimeout(() => {
        S.verifying = false;
        if (S.known) { const done = api.done; leave(); done({ returning: true }); return; }
        setStep('name');
      }, reduceMotion() ? 50 : 650);
      return;
    }
    if (S.step === 'name') {
      const name = titleCase([S.first, S.last].map(v => v.trim().replace(/\s+/g, ' ')).filter(Boolean).join(' '));
      setUser({ iso: S.iso, phone: S.phone, name, nameSource: 'user', helloSeen: false, createdAt: new Date().toISOString() });
      const done = api.done; leave(); done({ returning: false });
    }
  }

  // ---------- events ----------
  function onClick(e) {
    const t = e.target.closest('[data-fw]'); if (!t || t.disabled) return;
    const [cmd, arg] = t.dataset.fw.split(':');
    if (cmd === 'start') open(arg);
    else if (cmd === 'close') closeAll();
    else if (cmd === 'back') history.back();
    else if (cmd === 'next') next();
    else if (cmd === 'switch') { S.mode = arg; S.error = ''; history.replaceState({ view: 'welcome', fauth: { open: true, step: 'phone', mode: arg } }, '', '#' + (arg === 'up' ? 'sign-up' : 'sign-in')); S.dir = 'from-right'; renderSheet(); }
    else if (cmd === 'resend') { if (Date.now() < S.resendAt) return; S.code = ''; S.error = ''; startResend(); refreshCode(); refreshFoot(); announce('New code sent.'); root.querySelector('#fw-code')?.focus(); }
    else if (cmd === 'legal') { e.preventDefault(); announce('Terms and Privacy Policy are coming soon.'); }
  }
  function announce(msg) { const l = root?.querySelector('#fw-live'); if (l) { l.textContent = ''; setTimeout(() => l.textContent = msg, 30); } }

  function onInput(e) {
    const f = e.target.dataset?.fwField; if (!f) return;
    if (f === 'phone') {
      let d = e.target.value.replace(/\D/g, '');
      if (S.iso !== 'US' && S.iso !== 'CA' && d.startsWith('0')) d = d.slice(1); // drop trunk 0, e.g. 0803… in Nigeria
      if ((S.iso === 'US' || S.iso === 'CA') && d.length === 11 && d.startsWith('1')) d = d.slice(1);
      S.phone = d.slice(0, country(S.iso)[3]);
      e.target.value = formatPhone(S.iso, S.phone);
      if (S.error) { S.error = ''; e.target.removeAttribute('aria-invalid'); root.querySelector('#fw-err').textContent = ''; }
      refreshFoot();
    } else if (f === 'first' || f === 'last') {
      S[f] = e.target.value;
      if (S.error) { S.error = ''; e.target.removeAttribute('aria-invalid'); root.querySelector('#fw-err').textContent = ''; }
      refreshFoot();
    } else if (f === 'iso') {
      S.iso = e.target.value; S.phone = S.phone.slice(0, country(S.iso)[3]);
      const inp = root.querySelector('#fw-phone'); inp.value = formatPhone(S.iso, S.phone);
      inp.placeholder = formatPhone(S.iso, '5551234567'.slice(0, country(S.iso)[3]));
      refreshFoot(); inp.focus();
    } else if (f === 'code') {
      S.code = e.target.value.replace(/\D/g, '').slice(0, 6); e.target.value = S.code; S.error = '';
      refreshCode(); refreshFoot();
      if (S.code.length === 6) setTimeout(() => { if (S.code.length === 6 && S.step === 'code' && !S.verifying) next(); }, 180);
    }
  }
  const onInputEv = e => { if (e.target.dataset?.fwField !== 'iso') onInput(e); };
  const onChangeEv = e => { if (e.target.dataset?.fwField === 'iso') onInput(e); };
  function onFocus(e) { if (e.target.id === 'fw-code') refreshCode(); }
  function onSubmit(e) {
    const form = e.target.closest('[data-fw-form]'); if (!form) return;
    e.preventDefault();
    if (form.dataset.fwForm === 'name' && document.activeElement?.id === 'fw-first' && S.first.trim()) { root.querySelector('#fw-last').focus(); return; }
    next();
  }
  function onKey(e) {
    if (e.key === 'Escape' && S.open) { e.preventDefault(); closeAll(); }
    if (e.key === 'Tab' && S.open) { // keep focus inside the sheet
      const items = [...root.querySelectorAll('.fw-sheet button:not([disabled]), .fw-sheet input, .fw-sheet select')].filter(n => !n.hidden && n.offsetParent);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  // Keep the sheet's button above the on-screen keyboard (iOS doesn't resize the layout viewport)
  function onViewport() {
    const vv = window.visualViewport; if (!vv) return;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--f-kb', `${kb > 80 ? kb : 0}px`);
    root?.querySelector('.fw')?.classList.toggle('has-kb', kb > 80);
  }

  // ---------- public ----------
  function render(el, hooks) {
    api = hooks;
    const st = history.state?.fauth;
    if (!el.querySelector('.fw') || root !== el) {
      el.innerHTML = splashMarkup();
      root = el;
      el.addEventListener('click', onClick);
      el.addEventListener('input', onInputEv);
      el.addEventListener('change', onChangeEv);
      el.addEventListener('submit', onSubmit);
      el.addEventListener('focusin', onFocus);
      document.addEventListener('keydown', onKey);
      if (!kbBound && window.visualViewport) { visualViewport.addEventListener('resize', onViewport); visualViewport.addEventListener('scroll', onViewport); kbBound = true; }
    }
    // sync with browser history (Android back button, swipe back)
    if (st?.open) {
      const order = ['phone', 'code', 'name'];
      const dir = order.indexOf(st.step) < order.indexOf(S.step) ? 'from-left' : 'from-right';
      const wasOpen = S.open;
      S.mode = st.mode || S.mode; S.open = true;
      if (st.step === 'name' && S.code.length < 6) st.step = 'code';
      if (st.step === 'code' && S.phone.length !== country(S.iso)[3]) st.step = 'phone';
      if (!wasOpen || st.step !== S.step) { S.step = st.step; S.dir = wasOpen ? dir : ''; S.error = ''; if (S.step === 'code') S.code = ''; renderSheet(); }
    } else if (S.open) close(false);
  }
  function leave() {
    screenOff?.();
    if (!root) return;
    clearInterval(resendTimer);
    root.removeEventListener('click', onClick); root.removeEventListener('input', onInputEv); root.removeEventListener('change', onChangeEv);
    root.removeEventListener('submit', onSubmit); root.removeEventListener('focusin', onFocus);
    document.removeEventListener('keydown', onKey);
    document.documentElement.style.setProperty('--f-kb', '0px');
    root = null; S.open = false;
  }
  // ---------- money source + hello ----------
  // Full-screen Faiit screens that live outside the welcome sheet.
  let screenOff = null;
  function mountScreen(el, html, handlers) {
    leave();
    el.innerHTML = html;
    const click = e => { const t = e.target.closest('[data-fs]'); if (!t || t.disabled) return; handlers[t.dataset.fs]?.(t, e); };
    const submit = e => { if (e.target.closest('[data-fs-form]')) { e.preventDefault(); handlers.__submit?.(e); } };
    const key = e => handlers.__key?.(e);
    el.addEventListener('click', click); el.addEventListener('submit', submit); document.addEventListener('keydown', key);
    screenOff = () => { el.removeEventListener('click', click); el.removeEventListener('submit', submit); document.removeEventListener('keydown', key); screenOff = null; handlers.__off?.(); };
    if (!reduceMotion()) [...el.querySelectorAll('[data-rise]')].forEach((n, k) => n.animate(
      [{ opacity: 0, transform: 'translateY(16px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
      { duration: 650, delay: 120 + k * 90, easing: EASE, fill: 'backwards' }));
  }

  const plaidConfig = () => window.FAIIT_CONFIG?.plaid || null;

  function source(el, hooks) {
    const accept = '.pdf,.csv,.txt,.png,.jpg,.jpeg,.webp';
    mountScreen(el, `
<section class="fw fw-screen" aria-labelledby="fs-title">${sky()}
  <header class="fw-top" data-rise>${fMark(false, 'chala')}<button class="fs-signout" data-fs="signout">Sign out</button></header>
  <div class="fs-body">
    <h1 class="fw-title fs-title" id="fs-title" data-rise>Bring your <em>money</em> in.</h1>
    <p class="fw-lead fs-lead" data-rise>Let’s create your first recap.</p>
    <div class="fs-options" data-rise>
      <button class="fs-option" data-fs="bank">
        <span class="fs-ico">${svg.bank}</span>
        <span class="fs-txt"><b>Connect your bank</b></span>
        <span class="fs-chev">${svg.chev}</span>
      </button>
      <button class="fs-option" data-fs="upload">
        <span class="fs-ico">${svg.doc}</span>
        <span class="fs-txt"><b>Upload a statement</b><span>PDF, CSV or photo</span></span>
        <span class="fs-chev">${svg.chev}</span>
      </button>
    </div>
    <div class="fs-progress" role="status" aria-live="polite" hidden>
      <div class="fs-file"><span class="fs-ico">${svg.doc}</span><span class="fs-txt"><b class="fs-fname"></b><span class="fs-pstat"></span></span></div>
      <div class="fs-bar" aria-hidden="true"><i></i></div>
      <p class="fs-err" role="alert" hidden></p>
      <div class="fs-retry" hidden><button class="fh-glass" data-fs="upload">Try another file</button><button class="fs-link" data-fs="cancel">Cancel</button></div>
    </div>
  </div>
  <input class="fw-sr" type="file" id="fs-file" accept="${accept}" multiple tabindex="-1" aria-hidden="true">
</section>`, {
      bank: () => hooks.bank(),
      upload: () => { const i = el.querySelector('#fs-file'); i.value = ''; i.click(); },
      cancel: () => showOptions(),
      signout: () => hooks.signout()
    });
    const q = s => el.querySelector(s);
    const bar = q('.fs-bar i');
    let shown = 0, busy = false;
    const setBar = f => { shown = Math.max(shown, Math.min(1, f)); bar.style.transform = `scaleX(${shown})`; };
    function showOptions() { q('.fs-progress').hidden = true; q('.fs-options').hidden = false; q('.fs-options [data-fs="upload"]').focus({ preventScroll: true }); }
    q('#fs-file').addEventListener('change', async e => {
      const files = [...e.target.files].slice(0, 10);
      if (!files.length || busy) return;
      busy = true; shown = 0; setBar(.04);
      q('.fs-options').hidden = true;
      const box = q('.fs-progress'); box.hidden = false;
      q('.fs-err').hidden = true; q('.fs-retry').hidden = true;
      q('.fs-fname').textContent = files.length > 1 ? `${files.length} files` : files[0].name;
      q('.fs-pstat').textContent = 'Uploading';
      if (!reduceMotion()) box.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE });
      const result = await hooks.importFiles(files, (f, label) => { setBar(f); if (label) q('.fs-pstat').textContent = label; });
      busy = false;
      box.classList.toggle('is-error', !!result.error);
      if (result.error) {
        q('.fs-pstat').textContent = 'Couldn’t read this file';
        q('.fs-err').textContent = result.error; q('.fs-err').hidden = false; q('.fs-retry').hidden = false;
        return;
      }
      setBar(1); q('.fs-pstat').textContent = `${result.count} purchases found`;
      setTimeout(() => hooks.done(), reduceMotion() ? 200 : 650);
    });
  }

  // Bank picker. Real institution names; the connection itself is a labelled demo that loads sample transactions.
  // No sign-in screens are shown for these banks: without a real Plaid connection that would be a fake login.
  const BANKS = ['Chase', 'Bank of America', 'Wells Fargo', 'Citi', 'Capital One', 'U.S. Bank', 'PNC', 'Truist', 'Chime', 'Ally', 'American Express', 'Discover', 'Navy Federal Credit Union', 'USAA', 'Charles Schwab', 'TD Bank', 'SoFi', 'Citizens'];
  const initials = n => n.replace(/\./g, '').split(/\s+/).filter(w => w && !/^(of|the|and)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  function bank(el, hooks) {
    mountScreen(el, `
<section class="fw fw-screen fb" aria-labelledby="fb-title">${sky()}
  <header class="fw-top fb-top"><button class="fw-icon-btn" data-fs="back" aria-label="Back">${svg.back}</button><span class="fb-demo">Demo</span></header>
  <div class="fb-pick">
    <h1 class="fw-title fs-title" id="fb-title" data-rise>Find your <em>bank</em></h1>
    <label class="fb-search" data-rise><span class="fw-sr">Search banks</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>
      <input type="search" placeholder="Search" autocomplete="off" enterkeyhint="search" class="fb-q">
    </label>
    <div class="fb-list" role="list" data-rise>
      ${BANKS.map(b => `<button class="fb-row" role="listitem" data-fs="pick" data-bank="${esc(b)}"><span class="fb-av" aria-hidden="true">${initials(b)}</span><span class="fb-name">${esc(b)}</span>${svg.chev}</button>`).join('')}
      <p class="fb-none" hidden>No banks match that search.</p>
    </div>
  </div>
  <div class="fb-connect" hidden>
    <div class="fb-spin" aria-hidden="true"></div>
    <p class="fb-status" role="status" aria-live="polite"></p>
  </div>
  <div class="fb-accounts" hidden>
    <h1 class="fw-title fs-title" tabindex="-1">Choose <em>accounts</em></h1>
    <p class="fb-bankname"></p>
    <div class="fb-acc-list">
      <label class="fb-acc"><input type="checkbox" checked value="Checking"><span><b>Checking</b><span>•• 4021</span></span></label>
      <label class="fb-acc"><input type="checkbox" checked value="Savings"><span><b>Savings</b><span>•• 7781</span></span></label>
    </div>
    <p class="fb-note" role="status" aria-live="polite"></p>
    <div class="fh-cta fb-cta"><button class="fh-unwrap" data-fs="connect">Connect</button></div>
  </div>
</section>`, {
      back: () => history.back(),
      pick: t => connect(t.dataset.bank),
      connect: () => {
        const accts = [...el.querySelectorAll('.fb-acc input:checked')].map(i => i.value);
        if (!accts.length) { el.querySelector('.fb-note').textContent = 'Choose at least one account.'; return; }
        hooks.connected(chosen, accts);
      }
    });
    let chosen = '';
    const q = s => el.querySelector(s);
    q('.fb-q').addEventListener('input', e => {
      const v = e.target.value.trim().toLowerCase(); let n = 0;
      el.querySelectorAll('.fb-row').forEach(r => { const m = r.dataset.bank.toLowerCase().includes(v); r.hidden = !m; if (m) n++; });
      q('.fb-none').hidden = n > 0;
    });
    function connect(name) {
      chosen = name;
      q('.fb-pick').hidden = true; q('.fb-connect').hidden = false;
      q('.fb-status').textContent = `Connecting to ${name}`;
      setTimeout(() => {
        if (!q('.fb-connect')) return;
        q('.fb-connect').hidden = true; q('.fb-accounts').hidden = false;
        q('.fb-bankname').textContent = name;
        const box = q('.fb-accounts');
        if (!reduceMotion()) [...box.children].forEach((c, k) => c.animate([{ opacity: 0, transform: 'translateY(12px)', filter: 'blur(5px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 500, delay: k * 70, easing: EASE, fill: 'backwards' }));
        box.querySelector('h1').focus({ preventScroll: true });
      }, reduceMotion() ? 300 : 1200);
    }
  }

  function hello(el, hooks) {
    const u = getUser() || {};
    let name = firstName(u.name), typing = 0;
    const sourceLabel = {};
    mountScreen(el, `
<section class="fw fw-screen fh" aria-labelledby="fh-title">${sky()}
  <header class="fw-top">${fMark(false, 'chala')}</header>
  <div class="fh-body">
    <p class="fh-eyebrow" data-rise>Your recap is ready</p>
    <h1 class="fw-title fh-title" id="fh-title"><span class="fh-line" data-rise>Hello,</span><span class="fh-line fh-name-line" data-rise><em class="fh-name"></em></span></h1>
    <form class="fh-edit" data-fs-form hidden>
      <label class="fw-sr" for="fh-input">Your name</label>
      <input class="fh-input" id="fh-input" maxlength="30" autocomplete="given-name" autocapitalize="words" enterkeyhint="done" placeholder="Your name">
      <button class="fh-glass fh-save" type="submit">Save</button>
    </form>
    <div class="fh-meta" data-rise>
      <button class="fh-glass" data-fs="rename">${svg.pen}<span class="fh-rename-label"></span></button>
      <span class="fh-source"></span>
    </div>
    <p class="fw-lead fh-lead" data-rise>Let’s see where your money went.</p>
  </div>
  <div class="fh-cta" data-rise><button class="fh-unwrap" data-fs="go"><span>Unwrap</span></button></div>
  <p class="fw-sr" aria-live="polite" id="fh-live"></p>
</section>`, {
      rename: () => openEdit(),
      go: () => { patchUser({ helloSeen: true }); hooks.go(); },
      __submit: () => saveEdit(),
      __key: e => { if (e.key === 'Escape' && !el.querySelector('.fh-edit').hidden) { e.preventDefault(); closeEdit(); } },
      __off: () => clearInterval(typing)
    });
    const q = s => el.querySelector(s);
    function paint(animate) {
      const shown = name ? `${esc(name)}.` : 'there.';
      q('.fh-rename-label').textContent = name ? 'Change name' : 'Add your name';
      const src = getUser()?.nameSource;
      q('.fh-source').textContent = name && sourceLabel[src] ? sourceLabel[src] : '';
      const target = q('.fh-name');
      clearInterval(typing);
      if (!animate || reduceMotion()) { target.innerHTML = shown; return; }
      const chars = [...(name ? name + '.' : 'there.')]; let i = 0;
      target.innerHTML = '<span class="fh-caret"></span>';
      typing = setInterval(() => {
        i++; target.innerHTML = esc(chars.slice(0, i).join('')) + (i < chars.length ? '<span class="fh-caret"></span>' : '');
        if (i >= chars.length) clearInterval(typing);
      }, 75);
    }
    function openEdit() {
      q('.fh-name-line').hidden = true; q('.fh-meta').hidden = true;
      const f = q('.fh-edit'); f.hidden = false;
      const input = q('#fh-input'); input.value = name; input.focus(); input.select();
      if (!reduceMotion()) f.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE });
    }
    function closeEdit() {
      q('.fh-edit').hidden = true; q('.fh-name-line').hidden = false; q('.fh-meta').hidden = false;
      q('[data-fs="rename"]').focus({ preventScroll: true });
    }
    function saveEdit() {
      const v = titleCase(q('#fh-input').value.trim().replace(/\s+/g, ' ')).slice(0, 30);
      if (v) { name = v; patchUser({ name: v, nameSource: 'user' }); }
      closeEdit(); paint(true);
      q('#fh-live').textContent = v ? `Name updated to ${v}.` : '';
    }
    paint(true);
  }

  const splash = () => `<section class="fw-splash" aria-label="Opening chala">${fMark(!reduceMotion(), 'chala')}</section>`;
  const signOut = () => { try { localStorage.removeItem(USER_KEY); } catch {} };
  // A name found in a statement or bank connection never overrides one the person typed
  const noteName = (n, from) => { const u = getUser(); if (!u || !n || u.nameSource === 'user') return; setUser({ ...u, name: titleCase(n.trim()), nameSource: from }); };
  const needsHello = () => { const u = getUser(); return !!u && !u.helloSeen; };


  // In-app confirm sheet. The hosted app runs in a sandboxed frame where window.confirm() is blocked,
  // so every "are you sure?" goes through this instead. Resolves true or false.
  function ask({ title, body = '', confirm = 'Confirm', cancel = 'Cancel', danger = false } = {}) {
    return new Promise(resolve => {
      const prev = document.activeElement;
      const wrap = document.createElement('div');
      wrap.className = 'fa-ask';
      wrap.innerHTML = `<div class="fa-ask-scrim" data-a="no"></div>
<div class="fa-ask-card" role="alertdialog" aria-modal="true" aria-labelledby="fa-ask-t" ${body ? 'aria-describedby="fa-ask-b"' : ''}>
  <h2 id="fa-ask-t">${esc(title)}</h2>${body ? `<p id="fa-ask-b">${esc(body)}</p>` : ''}
  <div class="fa-ask-actions"><button class="fa-ask-yes${danger ? ' is-danger' : ''}" data-a="yes">${esc(confirm)}</button><button class="fa-ask-no" data-a="no">${esc(cancel)}</button></div>
</div>`;
      const key = e => {
        if (e.key === 'Escape') { e.preventDefault(); done(false); }
        if (e.key === 'Tab') { const b = [...wrap.querySelectorAll('button')], i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus(); }
      };
      const done = v => {
        document.removeEventListener('keydown', key, true);
        wrap.classList.add('is-out');
        setTimeout(() => wrap.remove(), reduceMotion() ? 0 : 220);
        prev?.focus?.({ preventScroll: true });
        resolve(v);
      };
      wrap.addEventListener('click', e => { const a = e.target.closest('[data-a]')?.dataset.a; if (a) done(a === 'yes'); });
      document.addEventListener('keydown', key, true);
      document.body.append(wrap);
      wrap.querySelector('.fa-ask-no').focus({ preventScroll: true });
    });
  }

  // ---------- decoding (loading state after Unwrap) ----------
  // A flowing net of nodes. Touch or drag and nearby nodes glow and ripple. Short phrases, no percentages.
  function decoding(el, hooks) {
    const phrases = ['Decoding your spending patterns', 'Sorting cravings from essentials', 'Finding your biggest bite', 'Wrapping up your month'];
    const still = reduceMotion();
    let raf = 0, timers = [], alive = true;
    const stop = () => { alive = false; cancelAnimationFrame(raf); timers.forEach(clearTimeout); window.removeEventListener('resize', size); };
    mountScreen(el, `
<section class="fw fw-screen fd" aria-labelledby="fd-status">${sky()}
  <canvas class="fd-net" aria-hidden="true"></canvas>
  <header class="fw-top fd-top">${fMark(false, 'chala')}</header>
  <div class="fd-copy">
    <p class="fd-status" id="fd-status" role="status" aria-live="polite"><span>${phrases[0]}</span></p>
  </div>
</section>`, { __off: stop });

    const cv = el.querySelector('.fd-net'), ctx = cv.getContext('2d');
    const COLS = 12, ROWS = 16;
    const nodes = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) nodes.push({ u: c / (COLS - 1), v: r / (ROWS - 1), glow: 0, x: 0, y: 0, z: 0 });
    const pointer = { x: -1e4, y: -1e4, on: false, hit: 0 };
    let W = 0, H = 0, last = 0;
    const t0 = performance.now();

    function size() {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (still) draw(1.2, 0);
    }
    function place(t) {
      const netW = Math.min(W * 1.25, 620), netH = Math.min(H * 0.62, 640), cx = W / 2, cy = H * 0.42;
      for (const n of nodes) {
        const bx = (n.u - .5) * netW, by = (n.v - .5) * netH;
        let z = 34 * Math.sin(n.u * 5.2 + t * 1.05) * Math.cos(n.v * 4.1 - t * .75) + 20 * Math.sin((n.u + n.v) * 6.3 + t * 1.5);
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (pointer.hit > .01 && d < 150) z += (1 - d / 150) * 46 * pointer.hit * Math.sin(t * 7 - d * .06);
        // tilt the sheet back a little so it reads as a surface in depth
        const tilt = .55, y3 = by * Math.cos(tilt) - z * Math.sin(tilt), z3 = by * Math.sin(tilt) + z * Math.cos(tilt);
        const s = 700 / (700 - z3);
        n.x = cx + bx * s; n.y = cy + y3 * s; n.z = z3; n.s = s;
      }
    }
    function draw(t, dt) {
      place(t);
      ctx.clearRect(0, 0, W, H);
      const decay = Math.pow(.18, dt);
      for (const n of nodes) {
        if (pointer.on && Math.hypot(n.x - pointer.x, n.y - pointer.y) < 58) n.glow = 1;
        else n.glow *= decay;
      }
      pointer.hit *= Math.pow(.35, dt);
      ctx.lineWidth = 1;
      const link = (a, b) => {
        const depth = Math.max(0, Math.min(1, ((a.s + b.s) / 2 - .82) / .4));
        const g = Math.max(a.glow, b.glow);
        ctx.strokeStyle = g > .05 ? `rgba(120,160,230,${.2 + g * .5})` : `rgba(92,78,140,${.08 + depth * .22})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      };
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const n = nodes[r * COLS + c];
        if (c < COLS - 1) link(n, nodes[r * COLS + c + 1]);
        if (r < ROWS - 1) link(n, nodes[(r + 1) * COLS + c]);
      }
      for (const n of nodes) {
        const depth = Math.max(0, Math.min(1, (n.s - .82) / .4));
        if (n.glow > .05) {
          const R = 6 + 16 * n.glow;
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, R);
          grad.addColorStop(0, `rgba(255,255,255,${.95 * n.glow})`);
          grad.addColorStop(.35, `rgba(170,205,255,${.6 * n.glow})`);
          grad.addColorStop(1, 'rgba(170,205,255,0)');
          ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = `rgba(70,58,112,${.25 + depth * .5})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 1.2 + depth * 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
    function frame(now) {
      if (!alive) return;
      const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      draw((now - t0) / 1000, dt);
      raf = requestAnimationFrame(frame);
    }
    const toLocal = e => { const r = cv.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
    cv.addEventListener('pointerdown', e => { toLocal(e); pointer.on = true; pointer.hit = 1; cv.setPointerCapture?.(e.pointerId); if (still) draw(1.2, 0); });
    cv.addEventListener('pointermove', e => { toLocal(e); if (pointer.on) pointer.hit = 1; if (still && pointer.on) draw(1.2, 0); });
    const up = () => { pointer.on = false; if (still) setTimeout(() => draw(1.2, 1), 400); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    window.addEventListener('resize', size);
    size();
    if (!still) raf = requestAnimationFrame(frame);

    // phrases: soft lift-and-blur swap, about a second each
    const status = el.querySelector('.fd-status');
    const swap = text => {
      const old = status.firstElementChild, nu = document.createElement('span'); nu.textContent = text;
      if (still) { status.replaceChildren(nu); return; }
      old.animate([{ opacity: 1, transform: 'none', filter: 'blur(0)' }, { opacity: 0, transform: 'translateY(-10px)', filter: 'blur(6px)' }], { duration: 260, easing: EASE, fill: 'forwards' }).finished.then(() => old.remove(), () => {});
      status.append(nu);
      nu.animate([{ opacity: 0, transform: 'translateY(10px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 420, delay: 120, easing: EASE, fill: 'backwards' });
    };
    const step = still ? 700 : 1050;
    phrases.slice(1).forEach((p, i) => timers.push(setTimeout(() => alive && swap(p), step * (i + 1))));
    timers.push(setTimeout(() => {
      if (!alive) return;
      const sec = el.querySelector('.fd');
      const go = () => { if (!alive) return; const done = hooks.done; stop(); done(); };
      if (still || !sec.animate) go();
      else sec.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 280, fill: 'forwards' }).finished.then(go, go);
    }, step * phrases.length + 250));
  }

  window.Faiit = { patch: patchUser, setName: n => patchUser({ name: n, nameSource: 'user' }), ask, decoding, bank, render, leave, splash, source, hello, user: getUser, noteName, needsHello, plaidConfig, signOut, formatPhone };
})();
