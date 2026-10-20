/* chala v3 — stories (ported from chala.html; original left untouched). */

/* Money Wrapped — the roast. Reference layout: label · huge number · sub · two-line punch · illustration. */
window.MW = window.MW || {};

(function () {
  const $ = MW.money;

  /* ---------- the 10 styles ---------- */
  MW.STYLES = [
    { key: 'blend',     name: 'Soft Glass',   font: 'Unbounded + Figtree',            note: 'Your pick: Soft Serve colour on a Clean Glass base. Every slide shares one calm backdrop, tinted by its hue.' },
    { key: 'blend-soft', name: 'Soft Glass · lighter tint', font: 'Unbounded + Figtree',  note: 'Same mix, the hue barely there. The most uniform from slide to slide.' },
    { key: 'blend-bold', name: 'Soft Glass · stronger tint', font: 'Unbounded + Figtree', note: 'Same mix, closer to Soft Serve. More colour change between slides.' },
    { key: 'soft',      name: 'Soft Serve',   font: 'Unbounded + Figtree',            note: 'Your reference, upgraded: deep pastel gradients, grain, tonal ink.' },
    { key: 'editorial', name: 'Gloss Mag',    font: 'Instrument Serif + Inter Tight', note: 'Magazine cover energy. Giant italic numbers on warm paper.' },
    { key: 'chrome',    name: 'Y2K Chrome',   font: 'Dela Gothic One + Figtree',      note: 'Holographic background, chrome numbers, a shimmer pass.' },
    { key: 'sticker',   name: 'Sticker Bomb', font: 'Bagel Fat One + Figtree',        note: 'Puffy outlined numbers that stamp onto the screen.' },
    { key: 'receipt',   name: 'Receipt',      font: 'JetBrains Mono',                 note: 'Printed-receipt look. Numbers type themselves out.' },
    { key: 'club',      name: 'Country Club', font: 'Fraunces + Figtree',             note: 'Gingham, soft serif, preppy pastels.' },
    { key: 'night',     name: 'Afterhours',   font: 'Syne + Figtree',                 note: 'Dark, glowy, neon. Numbers flicker on like a sign.' },
    { key: 'riso',      name: 'Riso Zine',    font: 'Archivo Black + Archivo',        note: 'Grainy print, overprinted ink that snaps into register.' },
    { key: 'jelly',     name: 'Jelly',        font: 'Gasoek One + Figtree',           note: 'Candy gradients and squishy, bouncy numbers.' },
    { key: 'glass',     name: 'Clean Glass',  font: 'Geist',                          note: 'Your Tap-to-Pay prototype look: calm, glassy, glowing lines.' },
  ];
  MW.getStyle = function () {
    const q = new URLSearchParams(location.search).get('style');
    if (q && MW.STYLES.some(s => s.key === q)) { try { localStorage.setItem('mw-style', q); } catch (e) {} return q; }
    try { const s = localStorage.getItem('mw-style'); if (s && MW.STYLES.some(x => x.key === s)) return s; } catch (e) {}
    return 'blend';
  };

  const words = (s, start) => s.split(' ').map((w, i) => `<span class="w"><span style="--i:${start + i}">${w}</span></span>`).join(' ');
  const ARCH = {
    delivery: ['Delivery Royalty', 'Your driver knows', 'your order by heart.', 'DASH'],
    coffee: ['Matcha Main Character', 'Green drink.', 'Red bank account.', 'MATCHA'],
    boba: ['Boba Baddie', 'Fifty percent sugar.', 'Full commitment.', 'BOBA'],
    bars: ['Happy Hour Hero', 'Thursday is', 'the new Friday.', 'BAR'],
    online: ['Add-to-Cart Athlete', 'Your porch is', 'basically a warehouse.', 'CART'],
    shopping: ['Retail Therapist', 'Feelings?', 'Checkout.', 'SHOP'],
    beauty: ['Glow-Up Investor', 'The glow is real.', 'So is the bill.', 'GLOW'],
    subs: ['Subscription Hoarder', 'Five apps.', 'Watches TikTok.', 'APPS'],
    rides: ['Uber Aristocrat', 'Walking is', 'a rumour to you.', 'UBER'],
    dining: ['Restaurant Regular', 'The host said', '"the usual?"', 'EATS'],
    fun: ['Main Event Energy', 'Never missed a plan.', 'Or a charge.', 'FOMO'],
  };
  MW.ARCH_LINES = ARCH;

  /* ---------- the September Wrapped script ----------
     Each slide: kicker / big / LINE 1 (sub) / LINE 2 (punch, 3 versions: main, alt A, alt B).
     Replays rotate through the alts so the second watch isn't a rerun. */
  MW.PERSONALITY = { name: 'The Sequel Spender', lines: ['You don’t make purchases. You order another season.', 'A one-time purchase. In several instalments.', 'Nothing is a one-off if you believe in it.'] };
  MW.splitPunch = function (t) {
    if (/^[“"]/.test(t)) return ['', t];
    const m = t.match(/^(.+?[.?])\s+(.+)$/);
    return m ? [m[1], m[2]] : ['', t];
  };
  MW.pickLine = function (arr, v) { return arr[Math.min(arr.length - 1, v || 0)]; };

  MW.buildRoasts = function (A) {
    const H = A.habits, W = MW.ART2, v = Math.max(0, (MW.state.plays || 1) - 1) % 3;
    const wrap = MW.state.txns.filter(t => t.dir === 'out' && t.date.slice(0, 7) === MW.PERSONA.wrapMonth);
    const dd = wrap.filter(t => t.cat === 'delivery'), ddDays = new Set(dd.map(t => t.date)).size;
    const sumOf = a => a.reduce((x, t) => x + t.amount, 0);
    const matcha = wrap.filter(t => t.matcha), amazon = wrap.filter(t => /AMAZON/.test(t.desc));
    const subs = H.subs ? H.subs.monthly : 31, bnpl = H.bnpl ? H.bnpl.total : 44, fee = H.fees ? H.fees.total : 35;
    const big = A.biggestDay || { total: 174, date: '2026-09-13' };
    const S = [];
    const add = (o, l2s) => { const [a, b] = MW.splitPunch(MW.pickLine(l2s, v)); S.push(Object.assign(o, { l1: a, l2: b })); };

    add({ hue: 'lav', kicker: 'September, apparently', num: { v: Math.round(A.spend), pre: '$' }, sub: '“I didn’t even buy anything big.”', art: W.classPhoto() },
      ['Correct. This was a group project.', 'It’s the little things. All of them, apparently.', 'Several little treats sharing a very large coat.']);
    add({ hue: 'peri', kicker: 'Your month in three tabs', num: { v: A.taps }, sub: 'Delivery. Shopping. Drinks.', art: W.thumbBadges(A.taps) },
      ['Your thumb has three extracurriculars.', 'A tasting menu of things you can tap.', 'Your bank statement has a very small vocabulary.']);
    add({ hue: 'peach', kicker: 'Your top merchant', num: { v: Math.round(sumOf(dd)), pre: '$' }, sub: `DoorDash. ${dd.length} orders. ${ddDays} days.`, art: W.drawer() },
      ['At this point, give them a drawer.', 'The app should ask where this is going.', 'A situationship with a service fee.']);
    add({ hue: 'mint', kicker: 'Special handling', num: { v: dd.filter(t => /SWEETGREEN/.test(t.desc)).length }, sub: 'Sweetgreen. Delivered. Four times.', art: W.redCarpet() },
      ['You paid someone to escort leaves to your door.', 'Your lettuce has a chauffeur.', 'The salad needed a ride. Apparently.']);
    add({ hue: 'butter', kicker: 'Now streaming', num: { v: H.delivery ? H.delivery.streak : 6, suf: ' days' }, sub: 'DoorDash, September 25–30.', art: W.episodes() },
      ['Renewed for six nights. No plot development.', 'A limited series about not getting up.', 'Every episode ends with a bag at the door.']);
    add({ hue: 'lime', kicker: 'Employee of the month', num: { v: Math.round(sumOf(matcha)), pre: '$' }, sub: `${matcha.length} Cha Cha Matchas. You work at a café.`, art: W.trophy(String(matcha.length)) },
      ['Clock in. Clock out. Fund the competition.', 'Cha Cha Matcha thanks you for your outside employment.', 'Your paycheck has a layover.']);
    add({ hue: 'mint', kicker: 'A follow-up question', word: 'TWICE', sub: 'Two matchas on Sep 8. Two more on Sep 16.', art: W.twoCups() },
      ['Did the first one not believe in you?', 'The emotional support drink needed backup.', 'Was the first one a free trial?']);
    add({ hue: 'pink', kicker: 'Your Amazon review', num: { v: amazon.length }, sub: `Amazon orders. ${MW.money(sumOf(amazon))}.`, art: W.stars() },
      ['“Five stars. Something to look forward to.”', 'Nine separate occasions to say “oh, this?”', 'The tracking page is your slowest mobile game.']);
    add({ hue: 'sky', kicker: 'Your subscription budget', num: { v: Math.round(subs), pre: '$' }, sub: 'Snapchat+ and CapCut Pro. Among others.', art: W.vipPhone() },
      ['Your phone has a VIP section. You pay to stand in it.', 'Even being on your phone has a cover charge.', 'The front camera is on payroll.']);
    add({ hue: 'lav', kicker: 'Best supporting payment', num: { v: Math.round(bnpl), pre: '$' }, sub: 'Princess Polly. Afterpay. $22 twice.', art: W.outfitCredits([['PAYMENT 1', '$22'], ['PAYMENT 2', '$22'], ['THE END', '?']]) },
      ['A concert outfit with a post-credit scene.', 'Even the outfit wanted to take things slowly.', 'The concert outfit came with a sequel.']);
    const bd = MW.toDate(big.date);
    add({ hue: 'butter', kicker: 'Your most expensive day', num: { v: Math.round(big.total), pre: '$' }, sub: `${bd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: tickets, Sephora, DoorDash.`, art: W.sundayCard(bd.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(), bd.getDate()) },
      ['Sunday was unsupervised.', 'A quiet Sunday. Financially, a heist.', 'This could have been several Sundays.']);
    add({ hue: 'peri', kicker: 'September 29', num: { v: Math.round(fee), pre: '$' }, sub: 'Overdraft fee. Also DoorDash.', art: W.bouncer('FEE $' + Math.round(fee)) },
      ['The bank charged admission. You ordered catering.', 'Even the plot twist came with dinner.', 'There was a fee. There was still dinner.']);
    add({ hue: 'peach', kicker: 'September 30', num: { v: dd.filter(t => t.date === '2026-09-30').length || 2 }, sub: 'DoorDash. Then DoorDash again.', art: W.finale() },
      ['The season finale was a two-parter.', 'Yesterday’s cliffhanger resolved nothing.', 'The bank had notes. You ordered a second episode.']);
    add({ hue: 'mint', id: 'card', noAuto: true, kicker: 'Your money personality', title: MW.PERSONALITY.name, art: W.replay('AGAIN'), buttons: true }, MW.PERSONALITY.lines);
    S.push({ hue: 'night', id: 'pause', noAuto: true, pause: true });
    return S;
  };

  /* ---------- rendering ---------- */
  function fmt(n) { return (n.pre || '') + Number(n.v).toLocaleString('en-US', { minimumFractionDigits: n.dec || 0, maximumFractionDigits: n.dec || 0 }) + (n.suf || ''); }
  function sizeClass(str) { const L = str.replace(/[ ,.]/g, '').length; return L <= 3 ? 'n-s' : L <= 4 ? 'n-m' : L <= 6 ? 'n-l' : 'n-xl'; }

  MW.slideHTML = function (s, i, total) {
    if (s.pause) return `<div class="slide hue-night is-pause">
      <div class="bg"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="grain"></i></div>
      <div class="s-body pause-body">
        <h2 class="s-punch"><span class="l1">${words('Okay.', 0)}</span><span class="l2">${words('Jokes aside.', 1)}</span></h2>
        <p class="s-sub late">You laughed. Good. The next part is the one that actually matters.</p>
        <button class="btn btn-light late2" data-realtalk>Show me</button>
      </div></div>`;
    const numStr = s.num ? fmt(s.num) : '';
    const l1n = s.l1 ? s.l1.split(' ').length : 0;
    const l1h = s.l1 ? `<span class="l1">${words(s.l1, 0)}</span>` : '';
    return `<div class="slide hue-${s.hue}${s.chart ? ' has-chart' : ''}${s.title ? ' has-title' : ''}">
      <div class="bg"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="grain"></i></div>
      <div class="s-body">
        <p class="s-kicker">${s.kicker}</p>
        ${s.num ? `<div class="s-num ${sizeClass(numStr)}" data-txt="${MW.esc(numStr)}"><span class="count" data-v="${s.num.v}" data-pre="${s.num.pre || ''}" data-suf="${s.num.suf || ''}" data-dec="${s.num.dec || 0}">${numStr}</span></div>` : ''}
        ${s.word ? `<div class="s-num s-word ${sizeClass(s.word)}" data-txt="${MW.esc(s.word)}"><span>${s.word}</span></div>` : ''}
        ${s.title ? `<div class="s-num s-title" data-txt="${MW.esc(s.title)}"><span>${s.title}</span></div>` : ''}
        ${s.sub ? `<p class="s-sub">${s.sub}</p>` : ''}
        <h2 class="s-punch">${l1h}<span class="l2">${words(s.l2, l1n)}</span></h2>
        ${s.chips ? `<div class="s-chips">${s.chips.map((c, k) => `<span style="--k:${k}">${MW.esc(c)}</span>`).join('')}</div>` : ''}
        ${s.buttons === true ? '<div class="s-btns"><button class="btn s-btn" data-share>Share my card</button><button class="btn s-btn alt" data-next>Keep going</button></div>' : ''}
        ${Array.isArray(s.buttons) ? `<div class="s-btns${s.buttons.length === 1 ? ' one' : ''}">${s.buttons.map(b => `<button class="btn s-btn${b.alt ? ' alt' : ''}" ${b.attr}>${b.label}</button>`).join('')}</div>` : ''}
        ${s.chart ? `<div class="s-chart">${s.chart.map((c, k) => `<div class="bar" style="--k:${k}"><div class="bar-top"><span>${MW.esc(c.label)}</span><b>${$(c.v)}</b></div><i style="--w:${Math.max(10, (c.v / c.max) * 100)}%"></i></div>`).join('')}</div>` : ''}
        ${s.art ? `<div class="s-art">${s.art}</div>` : ''}
      </div>
      <div class="s-foot"><button class="s-share" data-share aria-label="Share">${MW.icon('share', 20)}</button><span>${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span></div>
    </div>`;
  };

  /* Shrink any number that would be wider than the screen (fonts differ a lot in width). */
  MW.fitNums = function (root) {
    root.querySelectorAll('.s-num').forEach(el => {
      el.style.fontSize = '';
      const span = el.firstElementChild, keep = span.textContent;
      span.textContent = el.dataset.txt || keep;
      const avail = el.clientWidth, need = el.scrollWidth;
      if (need > avail && avail > 0) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * (avail / need) * 0.97) + 'px';
      span.textContent = keep;
    });
  };

  MW.animateCounts = function (root) {
    root.querySelectorAll('.count').forEach(el => {
      const v = +el.dataset.v, dec = +el.dataset.dec, pre = el.dataset.pre, suf = el.dataset.suf;
      const t0 = performance.now() + 380, dur = 1000;
      el.textContent = pre + '0' + suf;
      const step = now => {
        const p = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - Math.pow(1 - p, 4);
        el.textContent = pre + (v * e).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  /* ---------- player ---------- */
  const DUR = 6500;
  let slides = [], idx = 0, timer = null, startT = 0, elapsed = 0, paused = false, manual = false, ctx = {};

  function render() {
    const stage = document.getElementById('story-stage');
    const frame = document.querySelector('#story .story-frame');
    const s = slides[idx];
    const realCount = slides.filter(x => !x.pause).length;
    stage.innerHTML = MW.slideHTML(s, idx, realCount);
    MW.fitNums(stage);
    frame.className = 'story-frame t-' + MW.getStyle() + ' hue-' + s.hue;
    MW.animateCounts(stage);
    document.querySelectorAll('#story-progress i').forEach((b, i) => b.style.setProperty('--p', i < idx ? 1 : 0));
    const sk = document.getElementById('story-skip'); sk.hidden = !!s.pause || (ctx.kind === 'recap' && idx === slides.length - 1); sk.textContent = ctx.skipLabel || 'Skip';
    elapsed = 0; manual = false; play();
  }
  function tick() {
    if (paused) return;
    const s = slides[idx];
    const p = Math.min(1, (elapsed + performance.now() - startT) / DUR);
    const bar = document.querySelectorAll('#story-progress i')[idx];
    if (bar) bar.style.setProperty('--p', s.noAuto ? 1 : p);
    if (!s.noAuto && p >= 1) return next();
    timer = requestAnimationFrame(tick);
  }
  function play() { paused = false; startT = performance.now(); cancelAnimationFrame(timer); timer = requestAnimationFrame(tick); setPauseIcon(); }
  function pause() { if (paused) return; elapsed += performance.now() - startT; paused = true; cancelAnimationFrame(timer); setPauseIcon(); }
  function setPauseIcon() { const b = document.getElementById('story-mute'); if (b) { b.innerHTML = paused ? MW.icon('play', 18) : MW.icon('pause', 18); b.setAttribute('aria-label', paused ? 'Play' : 'Pause'); } }
  function next() { if (idx < slides.length - 1) { idx++; render(); } }
  function prev() { if (idx > 0) { idx--; render(); } }
  function goTo(id) { const i = slides.findIndex(s => s.id === id); if (i >= 0) { idx = i; render(); } }

  function begin(list, opts, at) {
      ctx = opts || {}; slides = list; idx = 0;
      const frame = document.querySelector('#story .story-frame');
      frame.className = 'story-frame t-' + MW.getStyle();
      frame.style.setProperty('--tx', '50%'); frame.style.setProperty('--ty', '50%');
      document.getElementById('story-progress').innerHTML = slides.map(() => '<i></i>').join('');
      MW.show('story');
      if (at) goTo(at); else render();
  }
  MW.story = {
    start(A, at) {
      if (!at) { MW.state.plays = (MW.state.plays || 0) + 1; MW.save(); }
      begin(MW.buildRoasts(A), { kind: 'wrapped' }, at);
    },
    play(list, opts) { begin(list, opts); },
    stop() { cancelAnimationFrame(timer); paused = true; },
  };

  document.addEventListener('DOMContentLoaded', () => {
    const stage = document.getElementById('story-stage');
    if (!stage) return;
    const frame = document.querySelector('#story .story-frame');
    let downAt = 0, holdT, holding = false;
    stage.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      downAt = performance.now();
      holdT = setTimeout(() => { if (!paused) { holding = true; pause(); } }, 220);
    });
    stage.addEventListener('pointerup', e => {
      clearTimeout(holdT);
      if (e.target.closest('button')) return;
      if (holding) { holding = false; if (!manual) play(); return; }
      if (performance.now() - downAt > 220) return;
      const r = frame.getBoundingClientRect();
      frame.style.setProperty('--tx', (e.clientX - r.left) + 'px'); frame.style.setProperty('--ty', (e.clientY - r.top) + 'px');
      if (slides[idx] && slides[idx].pause) return;
      (e.clientX - r.left < r.width * 0.3) ? prev() : next();
    });
    stage.addEventListener('pointerleave', () => { clearTimeout(holdT); if (holding) { holding = false; if (!manual) play(); } });
    stage.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-next')) next();
      if (b.hasAttribute('data-share')) MW.shareCard(MW.state.A);
      if (b.hasAttribute('data-realtalk')) { MW.story.stop(); MW.realtalk.open(); }
      if (b.hasAttribute('data-home')) { MW.story.stop(); MW.dash.open('home'); }
      if (b.hasAttribute('data-again')) { idx = 0; render(); }
    });
    document.getElementById('story-skip').addEventListener('click', () => { if (ctx.onSkip) { MW.story.stop(); ctx.onSkip(); } else goTo('pause'); });
    document.getElementById('story-mute').addEventListener('click', () => { manual = !paused; paused ? play() : pause(); });
    document.addEventListener('keydown', e => {
      if (document.body.dataset.screen !== 'story') return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); if (!slides[idx].pause) next(); }
      if (e.key === 'Escape' && ctx.onSkip) { MW.story.stop(); ctx.onSkip(); }
      if (e.key === 'ArrowLeft') prev();
    });
  });

  /* ---------- share card (1080×1920 PNG in the current style's colours) ---------- */
  MW.shareCard = async function (A) {
    const frame = document.querySelector('#story .story-frame');
    const el = frame.querySelector('.slide') || frame;
    const cs = getComputedStyle(el);
    const v = n => cs.getPropertyValue(n).trim();
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920;
    const x = c.getContext('2d');
    await (document.fonts && document.fonts.ready);
    const FN = v('--f-num') || 'system-ui', FT = v('--f-text') || 'system-ui';
    const g = x.createLinearGradient(0, 0, 1080, 1920); g.addColorStop(0, v('--p') || '#EEE6FF'); g.addColorStop(1, v('--m') || '#C9B6FF');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
    x.globalAlpha = .55; x.fillStyle = v('--n') || '#8B5CFF'; x.beginPath(); x.arc(960, 260, 420, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
    const pl = MW.splitPunch(MW.PERSONALITY.lines[0]); const a = [MW.PERSONALITY.name, pl[0] || pl[1], pl[0] ? pl[1] : ''];
    const ink = v('--d') || '#2B1A5A';
    x.fillStyle = ink; x.font = `700 40px ${FT}`; x.fillText('chala', 90, 150);
    x.font = `600 40px ${FT}`; x.fillText('My money personality', 90, 720);
    x.font = `900 116px ${FN}`;
    const y = wrap(x, a[0], 90, 860, 900, 124);
    x.font = `700 58px ${FT}`; x.fillText(a[1], 90, y + 110);
    x.fillStyle = v('--acc') || ink; x.fillText(a[2], 90, y + 180);
    x.fillStyle = ink;
    [[String(A.taps), 'taps'], [MW.money(A.spend), 'spent'], [A.topWantMerchant ? A.topWantMerchant.name : '—', '#1 artist']].forEach((s, i) => {
      x.font = `900 64px ${FN}`; x.fillText(s[0].slice(0, 12), 90, 1440 + i * 130);
      x.font = `600 34px ${FT}`; x.fillText(s[1], 90, 1482 + i * 130);
    });
    x.font = `600 32px ${FT}`; x.fillText('get roasted · chala', 90, 1860);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = new File([blob], 'my-money-wrapped.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'My Money Wrapped' }); return; } } catch (e) { if (e.name === 'AbortError') return; }
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = file.name; link.click();
    MW.toast('Card saved. Post it before you change your mind.');
  };
  function wrap(ctx, text, x, y, maxW, lh) {
    const ws = String(text).split(' '); let line = '';
    ws.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = w; } else line = t; });
    ctx.fillText(line, x, y); return y;
  }
})();



/* Money Wrapped — Real talk: one-line shock facts, one per screen. */
window.MW = window.MW || {};

(function () {
  const $ = MW.money;

  // Turn a yearly number into something you can picture.
  function relatable(amount, A) {
    if (A.rent.monthly > 0 && amount >= A.rent.monthly * 0.9) {
      const m = amount / A.rent.monthly;
      return `${m >= 10 ? Math.round(m) : m.toFixed(1)} months of your rent`;
    }
    const things = [[1400, 'a round-trip flight to Tokyo'], [999, 'a brand new iPhone'], [600, 'a weekend trip with your friends'], [250, 'a pair of AirPods'], [120, 'a really nice dinner for two'], [0, 'more than you think']];
    return things.find(t => amount >= t[0])[1];
  }

  MW.buildFacts = function (A) {
    const H = A.habits, F = [];
    if (H.delivery && H.delivery.count >= 3) {
      const h = H.delivery;
      F.push({ cost: h.yearly, stat: $(h.yearly), unit: 'a year on food delivery', line: `That's ${relatable(h.yearly, A)}. For food you ate on your couch.`, why: 'Fees are split into four tiny lines so none of them feels like much.' });
      if (h.dayShare >= 35) F.push({ cost: h.yearly * 0.5, stat: `${h.daysWith}/${A.days}`, unit: 'days', line: `You ordered delivery on ${h.dayShare}% of days. Your kitchen is a storage unit.`, why: 'One-tap reorder skips the moment you would normally decide.' });
    }
    if (H.bars && H.bars.hangoverNights >= 2) {
      const h = H.bars;
      F.push({ cost: h.yearly, stat: h.hangoverShare + '%', unit: 'of nights out', line: 'ended with delivery the next morning. The hangover has a delivery fee.', why: `The bar, the Uber home and the recovery food land on different days, so you never see the real price: ${$(h.trueNight)} a night.` });
    } else if (H.bars && H.bars.nights >= 2) {
      F.push({ cost: H.bars.yearly, stat: $(H.bars.yearly), unit: 'a year at the bar', line: `That's ${relatable(H.bars.yearly, A)}.`, why: 'Open tabs hide the total, and every round gets decided after the last one.' });
    }
    if (H.coffee && H.coffee.count >= 4) {
      const h = H.coffee, isM = h.matchaCount >= h.coffeeCount;
      F.push({ cost: h.yearly, stat: $(h.yearly), unit: `a year on ${isM ? 'matcha and coffee' : 'coffee'}`, line: `That's ${relatable(h.yearly, A)}, one ${$(h.avg, true)} cup at a time.`, why: "Mobile ordering means you've paid before you've even decided." });
      if (h.doubleDays >= 3) F.push({ cost: h.yearly * 0.2, stat: String(h.doubleDays), unit: 'days', line: 'you bought a second drink. Nobody needs two. You wanted a break.', why: 'Loyalty stars keep pulling you back so you don\'t "waste" them.' });
    }
    if (H.small && H.small.count >= 10) F.push({ cost: H.small.yearly, stat: H.small.shareCount + '%', unit: 'of your taps', line: `were under $15. Together they cost you ${$(H.small.total)}.`, why: "Tap-to-pay removed the sting of paying. Small numbers don't feel real." });
    if (H.payday && H.payday.ratio >= 1.25) F.push({ cost: (H.payday.perDayIn - H.payday.perDayOut) * 3 * H.payday.count / A.days * 365, stat: H.payday.ratio.toFixed(1) + '×', unit: 'after payday', line: "more spending in the 3 days after you get paid. You're rich for 72 hours.", why: 'A big balance makes everything feel affordable, until it doesn\'t.' });
    if (H.subs && H.subs.list.length >= 2) F.push({ cost: H.subs.yearly, stat: $(H.subs.yearly), unit: 'a year', line: `on ${new Set(H.subs.list.map(s => s.name)).size} subscriptions. Name them all without looking. We'll wait.`, why: 'Free trials turn paid on their own, and cancelling is buried on purpose.' });
    if (H.shopping && H.shopping.count >= 4) F.push({ cost: H.shopping.yearly, stat: String(H.shopping.count), unit: 'packages', line: `in ${A.days} days. That's ${$(H.shopping.yearly)} a year on stuff that came in a box.`, why: '"Free shipping over $35" makes you add things you never wanted.' });
    if (H.bnpl) F.push({ cost: H.bnpl.yearly, stat: $(H.bnpl.total), unit: 'pay-later', line: "of this month's money was spent months ago.", why: 'Splitting a price into 4 makes it feel 4 times smaller. It isn\'t.' });
    if (H.fees) F.push({ cost: H.fees.yearly + 600, stat: $(H.fees.total, true), unit: 'in bank fees', line: 'paid to your bank for having no money.', why: 'You can usually switch overdraft off so the card just declines instead.' });
    if (A.weekendShare >= 52) F.push({ cost: 100, stat: A.weekendShare + '%', unit: 'Fri–Sun', line: 'of your fun money disappears between Friday and Sunday.', why: 'Tired brains say yes. Apps know it and drop deals on Friday nights.' });
    if (H.p2p && H.p2p.total > 60) F.push({ cost: H.p2p.yearly, stat: $(H.p2p.total), unit: 'on Venmo & Zelle', line: "and you couldn't say what half of it was for.", why: 'Payment apps show who you paid, never what for.' });

    const facts = F.sort((a, b) => b.cost - a.cost).slice(0, 8);
    const bp = A.bigPicture;
    if (bp && bp.yearly > 0) facts.push({ final: true, stat: $(bp.yearly), unit: 'a year', line: `on your top ${bp.top3.length} habits. Invested for 10 years instead, that's about ${$(bp.invested10)}.`, why: 'Not financial advice. Just math you weren\'t supposed to do.' });
    return facts;
  };

  MW.realtalk = {
    open() {
      const A = MW.state.A;
      const facts = MW.buildFacts(A);
      const total = facts.length;
      document.getElementById('rt-wrap').innerHTML = `
        <div class="rt-snap" id="rt-snap">
          <section class="rt-slide rt-intro">
            <p class="rt-eyebrow">Real talk</p>
            <h1>${total} things your bank statement says about you.</h1>
            <p class="rt-sub">No jokes this time. Just facts.</p>
            <div class="rt-swipe" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 14l6-6 6 6"/></svg>Swipe up</div>
          </section>
          ${facts.map((f, i) => `
          <section class="rt-slide ${f.final ? 'rt-final' : ''}">
            <p class="rt-count">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
            <div class="rt-stat">${f.stat}</div>
            <p class="rt-unit">${f.unit}</p>
            <p class="rt-line">${f.line}</p>
            <div class="rt-why"><span>Why it happens</span>${f.why}</div>
          </section>`).join('')}
          <section class="rt-slide rt-end">
            <h2>You don't have to quit everything.</h2>
            <p class="rt-sub">Just the stuff you do on autopilot. Four quick questions and we'll build your plan.</p>
            <button class="btn btn-light btn-lg" id="rt-next">${MW.state.plan ? 'Back to my dashboard' : 'Help me do better'}</button>
          </section>
        </div>`;
      MW.show('realtalk');
      document.getElementById('rt-next').onclick = () => MW.state.plan ? MW.dash.open() : MW.survey.open();
      // fade each fact in as it snaps into view
      const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { threshold: 0.55 });
      document.querySelectorAll('.rt-slide').forEach(s => io.observe(s));
    },
  };
})();



/* Money Wrapped — the short survey that turns insight into a plan. */
window.MW = window.MW || {};

(function () {
  const $ = MW.money;
  const CUTS = { gentle: 0.2, real: 0.35, cold: 0.6 };
  const round10 = v => Math.max(0, Math.round(v / 10) * 10);
  let ans, step, cands;

  const GOALS = [
    { k: 'less', e: 'receipt', t: 'Spend less', d: 'Cut the leaks. Same life, fewer taps.' },
    { k: 'save', e: 'bank', t: 'Save more', d: 'Put money toward something specific.' },
    { k: 'smarter', e: 'sparkle', t: 'Spend smarter', d: 'Spend more on what I love and less on autopilot.' },
  ];
  const JOYS = ['Friends & experiences', 'Travel', 'Health & fitness', 'Learning', 'Hobbies', 'Family & gifts', 'Investing in me'];
  const TONES = [
    { k: 'bestie', e: 'gift', t: 'Gentle bestie', d: '"It\'s okay! Tomorrow\'s a new day."' },
    { k: 'honest', e: 'eyes', t: 'Honest friend', d: '"You\'re at 82%. Slow down."' },
    { k: 'roast', e: 'flame', t: 'Roast me', d: '"DoorDash is texting u up? Don\'t answer."' },
  ];

  const STEPS = ['goal', 'habits', 'how', 'limits'];

  function frame(title, sub, body, opts = {}) {
    return `
      <div class="sv-card">
        <p class="sv-count">Step ${step + 1} of ${STEPS.length}${step === STEPS.length - 1 ? ' · last one' : ''}</p>
        <h2 class="sv-title">${title}</h2>
        ${sub ? `<p class="sv-sub">${sub}</p>` : ''}
        ${body}
        <p class="error" id="sv-err" role="alert" hidden></p>
        <div class="sv-nav">
          ${step > 0 ? '<button class="btn btn-ghost" id="sv-back">← Back</button>' : '<span></span>'}
          <button class="btn btn-primary" id="sv-next">${opts.next || 'Next →'}</button>
        </div>
      </div>`;
  }

  function render() {
    const main = document.getElementById('survey-main');
    document.getElementById('survey-steps').innerHTML = STEPS.map((s, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('');
    const s = STEPS[step];
    let html = '';

    if (s === 'goal') {
      html = frame('What do you want your money to do next month?', 'Pick one. You can change it any time.',
        `<div class="opt-grid">${GOALS.map(g => `
          <button class="opt ${ans.goal === g.k ? 'sel' : ''}" data-goal="${g.k}" aria-pressed="${ans.goal === g.k}">
            <span class="opt-e">${MW.icon(g.e, 24)}</span><span class="opt-t">${g.t}</span><span class="opt-d">${g.d}</span>
          </button>`).join('')}</div>`);
    }

    if (s === 'habits') {
      const title = { less: 'Which habits are we taking on?', save: 'Where should the savings come from?', smarter: "Which of these are on autopilot?" }[ans.goal];
      html = frame(title, 'These are your biggest "wants" by monthly spend. Pick up to 3. Each one gets its own card on your dashboard.',
        cands.length ? `<div class="chip-list">${cands.slice(0, 8).map(c => `
          <button class="hchip ${ans.habits.includes(c.key) ? 'sel' : ''}" data-habit="${c.key}" aria-pressed="${ans.habits.includes(c.key)}">
            <span>${MW.icon(MW.ICONS[c.key] ? c.key : "other", 16)} ${c.label}</span><b>${$(c.monthly)}/mo</b>
          </button>`).join('')}</div>` : '<p class="sv-sub">We couldn\'t find clear habits in this statement. You can still set an overall goal.</p>');
    }

    if (s === 'how') {
      let extra = '';
      if (ans.goal === 'save') extra = `
        <div class="field-row">
          <label class="field"><span>What are you saving for?</span><input id="goal-name" maxlength="40" placeholder="e.g. Japan trip, emergency fund" value="${MW.esc(ans.goalName || '')}" /></label>
          <label class="field"><span>How much?</span><div class="money-input"><i>$</i><input id="goal-amt" type="number" inputmode="decimal" min="1" placeholder="1500" value="${ans.goalAmount || ''}" /></div></label>
        </div>`;
      if (ans.goal === 'smarter') extra = `
        <p class="sv-label">What deserves more of your money?</p>
        <div class="chip-list wrap">${JOYS.map(j => `<button class="jchip ${ans.joys.includes(j) ? 'sel' : ''}" data-joy="${MW.esc(j)}" aria-pressed="${ans.joys.includes(j)}">${j}</button>`).join('')}</div>`;
      html = frame(ans.goal === 'save' ? 'Give your savings a job' : ans.goal === 'smarter' ? 'Point your money somewhere better' : 'How hard do we go?',
        ans.goal === 'less' ? 'This sets your starting limits. You can drag them in the next step.' : 'Money with a named goal is much harder to spend on autopilot.',
        `${extra}
        <p class="sv-label">How big a change?</p>
        <div class="opt-row">${[['gentle', 'moon', 'Ease in', 'About 20% less'], ['real', 'target', 'Real change', 'About 35% less'], ['cold', 'lock', 'Cold turkey', 'About 60% less']].map(o => `
          <button class="opt small ${ans.intensity === o[0] ? 'sel' : ''}" data-int="${o[0]}" aria-pressed="${ans.intensity === o[0]}">
            <span class="opt-e">${MW.icon(o[1], 24)}</span><span class="opt-t">${o[2]}</span><span class="opt-d">${o[3]}</span>
          </button>`).join('')}</div>`);
    }

    if (s === 'tone') {
      html = frame('When you slip, how should we tell you?', "You'll slip. Everyone does. This is how we'll talk to you when you're close to a limit.",
        `<div class="opt-grid">${TONES.map(t => `
          <button class="opt ${ans.tone === t.k ? 'sel' : ''}" data-tone="${t.k}" aria-pressed="${ans.tone === t.k}">
            <span class="opt-e">${MW.icon(t.e, 24)}</span><span class="opt-t">${t.t}</span><span class="opt-d">${t.d}</span>
          </button>`).join('')}</div>`);
    }

    if (s === 'limits') {
      const cut = CUTS[ans.intensity];
      ans.habits.forEach(k => { if (ans.limits[k] == null) { const c = cands.find(x => x.key === k); ans.limits[k] = round10(c.monthly * (1 - cut)); } });
      html = frame('Set your monthly limits', 'Drag to adjust. Each bar on your dashboard starts at this number and drains as you spend.',
        `<div class="ch-limits">${ans.habits.map(k => {
          const c = cands.find(x => x.key === k), max = Math.max(50, Math.ceil(c.monthly * 1.3 / 10) * 10);
          return `<div class="limit-row">
            <div class="lr-top"><span>${MW.icon(MW.ICONS[c.key] ? c.key : "other", 16)} ${c.label}</span><b class="lr-val" id="lv-${k}">${$(ans.limits[k])}</b></div>
            <div class="lr-track"><input type="range" min="0" max="${max}" step="10" value="${ans.limits[k]}" data-limit="${k}" aria-label="${c.label} monthly limit" /><i class="lr-usual" style="left:calc(${(c.monthly / max * 100).toFixed(1)}% + ${(13 - c.monthly / max * 26).toFixed(1)}px)"><span>usual</span></i></div>
            <p class="lr-sub">You usually spend about ${$(c.monthly)}/mo · <span id="ls-${k}"></span></p>
          </div>`;
        }).join('')}</div>
        <div class="limit-sum" id="limit-sum"></div>`, { next: 'Build my dashboard →' });
    }

    main.innerHTML = html;
    bind(main);
    if (s === 'limits') updateSum();
    paintRanges(main);
  }
  /* slider fill: the part left of the thumb is filled in brand brown */
  function paintRanges(root) { root.querySelectorAll('input[type=range]').forEach(r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%')); }

  function updateSum() {
    let freed = 0;
    ans.habits.forEach(k => {
      const c = cands.find(x => x.key === k), diff = c.monthly - ans.limits[k];
      freed += Math.max(0, diff);
      const el = document.getElementById('ls-' + k);
      if (el) { el.className = diff > 0 ? 'lr-free' : ''; } if (el) el.textContent = diff > 0 ? `frees ${$(diff)}/mo` : ans.limits[k] > c.monthly ? 'higher than usual, so this won\'t change much' : 'same as usual';
      const v = document.getElementById('lv-' + k); if (v) v.textContent = $(ans.limits[k]);
    });
    let line = `That's about <b>${$(freed)} a month</b> back in your pocket, or <b>${$(freed * 12)} a year</b>.`;
    if (ans.goal === 'save' && ans.goalAmount && freed > 0) line += ` Enough for ${MW.esc(ans.goalName || 'your goal')} in about <b>${Math.ceil(ans.goalAmount / freed)} month${Math.ceil(ans.goalAmount / freed) > 1 ? 's' : ''}</b>.`;
    if (ans.goal === 'smarter' && freed > 0) line += ` It goes into your Joy Fund for ${ans.joys.length ? MW.esc(ans.joys.slice(0, 2).join(' and ').toLowerCase()) : 'the things you love'}.`;
    if (freed === 0) line = 'These limits are at or above what you usually spend. That works for tracking, but nothing gets freed up.';
    document.getElementById('limit-sum').innerHTML = line;
  }

  function err(msg) { const e = document.getElementById('sv-err'); e.textContent = msg; e.hidden = !msg; }

  function bind(root) {
    root.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => { ans.goal = b.dataset.goal; render(); });
    root.querySelectorAll('[data-tone]').forEach(b => b.onclick = () => { ans.tone = b.dataset.tone; render(); });
    root.querySelectorAll('[data-int]').forEach(b => b.onclick = () => {
      readFields(); ans.intensity = b.dataset.int; ans.limits = {}; render();
    });
    root.querySelectorAll('[data-habit]').forEach(b => b.onclick = () => {
      const k = b.dataset.habit, i = ans.habits.indexOf(k);
      if (i >= 0) ans.habits.splice(i, 1);
      else if (ans.habits.length >= 3) return err('Three is plenty. Unpick one first.');
      else ans.habits.push(k);
      render();
    });
    root.querySelectorAll('[data-joy]').forEach(b => b.onclick = () => {
      readFields(); const j = b.dataset.joy, i = ans.joys.indexOf(j); i >= 0 ? ans.joys.splice(i, 1) : ans.joys.push(j); render();
    });
    root.querySelectorAll('[data-limit]').forEach(r => r.oninput = () => { ans.limits[r.dataset.limit] = +r.value; updateSum(); paintRanges(root); });
    const back = root.querySelector('#sv-back'); if (back) back.onclick = () => { readFields(); step--; render(); };
    root.querySelector('#sv-next').onclick = () => {
      readFields();
      const s = STEPS[step];
      if (s === 'goal' && !ans.goal) return err('Pick one to keep going.');
      if (s === 'habits' && cands.length && !ans.habits.length) return err('Pick at least one habit to track.');
      if (s === 'how' && ans.goal === 'save' && (!ans.goalName || !(ans.goalAmount > 0))) return err('Name your goal and give it an amount. A goal with a name is harder to raid.');
      if (s === 'how' && ans.goal === 'smarter' && !ans.joys.length) return err('Pick at least one thing that deserves more of your money.');
      if (s === 'limits') return finish();
      step++; render();
    };
  }

  function readFields() {
    const n = document.getElementById('goal-name'), a = document.getElementById('goal-amt');
    if (n) ans.goalName = n.value.trim();
    if (a) ans.goalAmount = parseFloat(a.value) || 0;
  }

  function finish() {
    const plan = Object.assign({}, ans, {
      baseline: Object.fromEntries(ans.habits.map(k => [k, Math.round(cands.find(c => c.key === k).monthly)])),
      createdAt: MW.todayISO(),
    });
    MW.state.plan = plan; MW.save();
    MW.confetti();
    MW.dash.open('home');
    MW.toast('Your plan is live. Every tap counts from here.');
  }

  MW.survey = {
    open(at) {
      const A = MW.state.A, prev = MW.state.plan;
      cands = MW.planCandidates(A);
      ans = prev ? JSON.parse(JSON.stringify(prev)) : { goal: null, habits: cands.slice(0, 3).map(c => c.key), intensity: 'real', tone: 'honest', joys: [], limits: {}, goalName: '', goalAmount: 0 };
      ans.habits = ans.habits.filter(k => cands.some(c => c.key === k));
      step = at === 'limits' && prev ? STEPS.indexOf('limits') : 0; MW.show('survey'); render();
    },
  };
})();



/* Money Wrapped — the dashboard + "Check yourself" friction loop. */
window.MW = window.MW || {};

(function () {
  const $ = MW.money;
  const TONE = {
    bestie: {
      ok: ['You\'re doing so good', 'Look at you, being responsible.'],
      warn: ['Heads up babe, you\'re getting close.', 'Maybe one fewer this week?'],
      over: ['It\'s okay! Tomorrow\'s a new day. Maybe skip the next one?', 'Over, but not out. Reset and go again'],
      skip: ['Proud of you', 'Future you just sent a thank-you note.'],
    },
    honest: {
      ok: ['On track.', 'Under pace. Keep it there.'],
      warn: ['Ahead of pace. Slow down.', 'Most of this budget is gone and the month isn\'t.'],
      over: ['You\'re over. Every tap now comes out of your goal.', 'Over limit. Pause this one until next month.'],
      skip: ['Skipped. That money stays yours.', 'Good call.'],
    },
    roast: {
      ok: ['Shockingly responsible. Who are you?', 'Not bad. Suspicious, but not bad.'],
      warn: ['{label} is texting you "u up?". Don\'t answer.', 'Easy there, big spender.'],
      over: ['Over budget. Your wallet has filed a restraining order.', 'You and this limit are no longer on speaking terms.'],
      skip: ['Look who grew a spine', 'Skipped?? Character development.'],
    },
  };
  const line = (tone, kind, label, off) => {
    const arr = (TONE[tone] || TONE.honest)[kind];
    return arr[(Math.floor(Date.now() / 60000) + (off || 0)) % arr.length].replace('{label}', label || 'Your habit');
  };

  /* ---------- numbers ---------- */
  function monthInfo() {
    const d = MW.toDate(MW.todayISO()), y = d.getFullYear(), m = d.getMonth();
    const dim = new Date(y, m + 1, 0).getDate(), dom = d.getDate();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const pd = new Date(y, m - 1, 1);
    const prevKey = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
    return { y, m, dim, dom, key, prevKey, daysLeft: dim - dom + 1, elapsed: dom / dim,
      name: d.toLocaleDateString('en-US', { month: 'long' }), prevName: pd.toLocaleDateString('en-US', { month: 'long' }),
      next: new Date(y, m + 1, 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) };
  }
  function entries(monthKey) {
    const S = MW.state;
    const st = S.txns.filter(t => t.dir === 'out' && !['rent', 'bills'].includes(t.cat) && t.date.slice(0, 7) === monthKey);
    const lg = S.logs.filter(l => l.date.slice(0, 7) === monthKey);
    return st.concat(lg);
  }
  function spentFor(cat, monthKey) { return entries(monthKey).filter(e => e.cat === cat).reduce((t, e) => t + e.amount, 0); }
  function budget(cat, M) {
    const P = MW.state.plan, limit = P.limits[cat] || 0;
    const list = entries(M.key).filter(e => e.cat === cat);
    const spent = list.reduce((t, e) => t + e.amount, 0);
    const left = limit - spent, used = limit ? spent / limit : (spent ? 1.01 : 0);
    let status = 'ok';
    if (spent > limit) status = 'over';
    else if (used >= 0.8 || used > M.elapsed + 0.12) status = 'warn';
    return { cat, limit, spent, left, used, status, count: list.length, perDay: Math.max(0, left) / M.daysLeft, c: MW.CATEGORIES[cat] };
  }
  const sumAmt = a => a.reduce((t, x) => t + x.amount, 0);
  const ICON = k => MW.icon(MW.ICONS[k] ? k : 'other', 18);

  /* ---------- look & copy per category (same hues as the story) ---------- */
  const HUE = { delivery: 'peach', online: 'peri', shopping: 'sky', coffee: 'lime', boba: 'lav', beauty: 'pink', subs: 'sky', rides: 'butter', bnpl: 'lav', dining: 'butter', fun: 'pink', bars: 'lav', travel: 'sky', groceries: 'mint', other: 'mint' };
  const isMatcha = () => { const h = MW.state.A && MW.state.A.habits.coffee; return h && h.matchaCount >= h.coffeeCount; };
  const TITLE = k => ({ delivery: 'Take out.', online: 'Add to cart.', shopping: 'Shopping.', coffee: isMatcha() ? 'Matcha.' : 'Coffee.', boba: 'Boba.', beauty: 'Glow up.', subs: 'Subs.', rides: 'Rides.', bnpl: 'Pay later.', dining: 'Eating out.', fun: 'Going out.', bars: 'Nights out.', travel: 'Trips.' }[k] || 'Other.');
  const ART = k => {
    const W = MW.ART;
    if (k === 'delivery') return W.delivery();
    if (k === 'online' || k === 'shopping') return W.tag(k === 'online' ? 'ADD TO CART.' : 'SALE');
    if (k === 'coffee' || k === 'boba') return W.matcha();
    if (k === 'subs') return W.phone();
    if (k === 'bnpl') return W.split();
    if (k === 'beauty' || k === 'fun') return W.ribbon('GLOW');
    return W.receipts();
  };
  const ICONK = k => ({ delivery: 'delivery', online: 'online', shopping: 'shopping', coffee: isMatcha() ? 'matcha' : 'coffee' }[k] || (MW.ICONS[k] ? k : 'other'));
  const topMerchant = (k, monthKey) => {
    const by = {}; entries(monthKey).filter(e => e.cat === k).forEach(e => { const n = e.merchant || e.note; if (n) by[n] = (by[n] || 0) + e.amount; });
    const best = Object.entries(by).sort((x, y) => y[1] - x[1])[0];
    return best ? best[0] : MW.CATEGORIES[k].label;
  };
  const monthTag = M => `${M.name} ${M.y}`.toUpperCase();
  let tab = 'home', actFilter = 'all';

  function habitCard(b, M, i) {
    const remainPct = b.limit ? Math.max(0, Math.min(100, (1 - b.used) * 100)) : 0;
    const v = i % 2 === 0 ? 'v-bold' : 'v-pastel';
    return `
      <article class="hcard2 hue-${HUE[b.cat] || 'mint'} ${v} st-${b.status}" data-open="${b.cat}" style="--k:${i}">
        <div class="hc2-bg"><i class="grain"></i></div>
        <div class="hc2-art">${ART(b.cat)}</div>
        <div class="hc2-top"><span class="hc2-label">${MW.esc(topMerchant(b.cat, M.key))}</span><span class="hc2-ic">${MW.icon(ICONK(b.cat), 26)}</span></div>
        <h3 class="hc2-title">${TITLE(b.cat)}</h3>
        <div class="hc2-bottom">
          <div class="hc2-money">
            <div class="hc2-amt"><b>${$(Math.abs(b.left))}</b> ${b.left >= 0 ? 'left' : 'over'}</div>
            <div class="hc2-bar"><i style="width:${remainPct}%"></i></div>
          </div>
          <button class="hc2-go" data-open="${b.cat}" aria-label="Open ${MW.esc(b.c.label)}">${MW.icon('arrow', 22)}</button>
        </div>
      </article>`;
  }
  const row = (id, icon, text, sub) => `<button class="d-row" id="${id}"><span class="d-row-ic">${MW.icon(icon, 22)}</span><span class="d-row-t">${text}${sub ? `<small>${sub}</small>` : ''}</span><span class="d-row-go">${MW.icon('arrow', 22)}</span></button>`;
  const head = (pill, title, side) => `<header class="d-head"><span class="d-pill">${pill}</span><div class="d-title-row"><h1 class="d-title">${title}</h1>${side || ''}</div></header>`;

  /* ---------- tabs ---------- */
  function render() {
    document.querySelectorAll('.tabbar button').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    const main = document.getElementById('dash-main');
    main.innerHTML = ({ home: renderHome, activity: renderActivity, wrapped: renderWrapped, profile: renderProfile })[tab]();
    main.className = 'dash-main d-' + tab;
    document.getElementById('dash').dataset.tab = tab;
    bind();
  }

  function leftBox(b, M, i) {
    const remainPct = b.limit ? Math.max(0, Math.min(100, (1 - b.used) * 100)) : 0;
    const label = b.cat === 'online' ? 'Online shopping' : b.cat === 'delivery' ? 'DoorDash' : topMerchant(b.cat, M.key);
    return `<button class="lts hue-${HUE[b.cat] || 'peach'} st-${b.status}" data-open="${b.cat}" style="--k:${i}">
      <span class="lts-k">${b.left >= 0 ? 'Left to spend' : 'Over by'}</span>
      <span class="lts-n">${MW.icon(ICONK(b.cat), 16)} ${MW.esc(label)}</span>
      <span class="lts-num" data-to="${Math.round(Math.abs(b.left))}">${$(Math.abs(b.left))}</span>
      <span class="lts-of">of ${$(b.limit)} · ${b.left > 0 ? '$' + MW.perDay(b.left, M.daysLeft).toFixed(2) + '/day' : 'pause it'}</span>
      <span class="lts-bar"><i style="width:${remainPct}%"></i></span>
    </button>`;
  }

  /* this week (Mon–Sun around today): only the habit-type spending, not groceries or transit */
  function weekData() {
    const today = MW.toDate(MW.todayISO()), dow = (today.getDay() + 6) % 7;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() - dow + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const list = MW.state.txns.filter(t => t.dir === 'out' && t.date === iso && (MW.CATEGORIES[t.cat] || {}).want).concat(MW.state.logs.filter(l => l.date === iso));
      days.push({ iso, name: d.toLocaleDateString('en-US', { weekday: 'long' }), letter: d.toLocaleDateString('en-US', { weekday: 'narrow' }), total: list.reduce((t, e) => t + e.amount, 0), future: i > dow, today: i === dow });
    }
    return days;
  }

  function renderHome() {
    const S = MW.state, P = S.plan, M = monthInfo();
    const pickKeys = ['delivery', 'online'].filter(k => P.habits.includes(k));
    const keys = pickKeys.concat(P.habits.filter(k => !pickKeys.includes(k))).slice(0, 2);
    const B = keys.map(k => budget(k, M));
    const W = weekData(), past = W.filter(d => !d.future && !d.today), seen = W.filter(d => !d.future);
    const worst = seen.slice().sort((a, b) => b.total - a.total)[0];
    const best = (past.length ? past : seen).filter(d => d !== worst).sort((a, b) => a.total - b.total)[0];
    const max = Math.max(1, ...W.map(d => d.total)), wkTotal = seen.reduce((t, d) => t + d.total, 0);
    const title = !worst || worst.total === 0 ? `Nothing spent yet.<br><span>Suspiciously calm.</span>`
      : best ? `${best.name} was fine.<br><span>${worst.name} was not.</span>` : `${worst.name} happened.<br><span>The week is young.</span>`;
    const lines = MW.dashLines();
    return `<div class="h2-top"><span class="h2-brand">chala</span><span class="h2-date">${M.name.slice(0, 3)} · day ${M.dom}</span></div>
      <section class="wk">
        <p class="wk-k">This week</p>
        <h1 class="wk-t">${title}</h1>
        <div class="wk-bars" role="img" aria-label="Spending by day this week">${W.map((d, i) => `<div class="wk-col${d.future ? ' fut' : ''}${d.today ? ' now' : ''}${d === worst && d.total ? ' worst' : ''}" style="--k:${i}">
          <span class="wk-amt">${!d.future && d.total ? '$' + Math.round(d.total) : ''}</span>
          <i style="--h:${d.future ? 6 : Math.max(6, d.total / max * 100)}%"></i><b>${d.letter}</b></div>`).join('')}</div>
        <p class="wk-sum">${$(wkTotal)} this week${worst && worst.total ? ` · ${$(worst.total)} on ${worst.name} alone` : ''}</p>
        <button class="wk-recap" id="recap-btn"><span>View monthly recap</span>${MW.icon('arrow', 18)}</button>
      </section>
      <div class="lts-row">${B.map((b, i) => leftBox(b, M, i)).join('')}</div>
      <button class="lts-line" id="lts-line" data-i="0" aria-label="Next comment">${MW.esc(lines[0])}</button>`;
  }

  /* ---------- clean page header ---------- */
  const pageHead = (kicker, title, sub) => `<header class="pg-head"><p class="pg-k">${kicker}</p><h1 class="pg-t">${title}</h1>${sub ? `<p class="pg-s">${sub}</p>` : ''}</header>`;

  function renderActivity() {
    const S = MW.state, P = S.plan, M = monthInfo();
    const all = entries(M.key);
    let list = all.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));
    if (actFilter !== 'all') list = list.filter(e => e.cat === actFilter);
    const total = list.reduce((t, e) => t + e.amount, 0);
    const byDay = {}; list.forEach(e => (byDay[e.date] = byDay[e.date] || []).push(e));
    const today = MW.todayISO(), yest = (() => { const d = MW.toDate(today); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();
    const dayName = d => d === today ? 'Today' : d === yest ? 'Yesterday' : MW.toDate(d).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const chips = [['all', 'All']].concat(P.habits.map(k => [k, TITLE(k).replace('.', '')]));
    return `${pageHead(M.name + ' ' + M.y, 'Activity')}
      <section class="act-sum">
        <div><span class="act-n">${$(total)}</span><span class="act-l">${actFilter === 'all' ? 'spent this month' : 'on ' + TITLE(actFilter).replace('.', '').toLowerCase()}</span></div>
        <div class="act-side"><b>${list.length}</b><span>${list.length === 1 ? 'tap' : 'taps'}</span></div>
      </section>
      <p class="act-note">Rent, pay and bills are left out.</p>
      <div class="seg" role="tablist">${chips.map(([k, l]) => `<button role="tab" class="${actFilter === k ? 'on' : ''}" data-f="${k}" aria-selected="${actFilter === k}">${l}</button>`).join('')}</div>
      <div class="act-days">${Object.entries(byDay).map(([d, items]) => `
        <section class="act-day">
          <h4><span>${dayName(d)}</span><span>${$(items.reduce((t, e) => t + e.amount, 0), true)}</span></h4>
          <div class="act-list">${items.map(e => {
            const tracked = P.habits.includes(e.cat), cat = MW.CATEGORIES[e.cat] ? MW.CATEGORIES[e.cat].label : '';
            return `<div class="act-row${tracked ? ' tracked' : ''}">
              <span class="act-ic">${MW.icon(ICONK(e.cat), 19)}</span>
              <span class="act-m"><b>${MW.esc(e.merchant || e.note || cat)}</b><small>${cat}${e.src === 'log' ? ' · added by you' : ''}</small></span>
              <span class="act-a">−${$(e.amount, true)}</span>
              ${e.src === 'log' ? `<button class="act-x" data-del="${e.id}" aria-label="Delete">${MW.icon('plus', 16)}</button>` : ''}
            </div>`; }).join('')}</div>
        </section>`).join('') || '<p class="act-empty">Nothing here yet.</p>'}</div>`;
  }

  function renderWrapped() {
    const M = monthInfo(), A = MW.state.A;
    const top = A.topWantMerchant ? A.topWantMerchant.name : 'DoorDash';
    const pct = Math.round(M.dom / M.dim * 100);
    return `${pageHead('Your Wrapped', 'Wrapped')}
      <article class="wr-card" id="w-last">
        <div class="wr-top"><span class="pg-k">${M.prevName} ${M.y}</span><span class="wr-badge">${MW.icon('gift', 16)} Ready</span></div>
        <p class="wr-pk">Your money personality</p>
        <h2 class="wr-name">${MW.PERSONALITY.name}</h2>
        <div class="wr-stats">
          <div><b>${A.taps}</b><span>taps</span></div>
          <div><b>${$(A.spend)}</b><span>spent</span></div>
          <div><b>${MW.esc(top)}</b><span>top merchant</span></div>
        </div>
        <div class="wr-actions"><button class="btn btn-primary" id="w-play">${MW.icon('play', 16)} Replay ${M.prevName}</button><button class="btn btn-ghost" id="w-share">${MW.icon('share', 16)} Share</button></div>
      </article>
      <article class="wr-next" id="w-next">
        <div class="wr-top"><span class="pg-k">${M.name} ${M.y}</span><span class="wr-badge soft">${MW.icon('lock', 15)} ${M.next}</span></div>
        <h3>Your ${M.name} Wrapped is still being written.</h3>
        <div class="wr-prog"><i style="width:${pct}%"></i></div>
        <p class="wr-pm"><span>Day ${M.dom} of ${M.dim}</span><span>${M.daysLeft} days to go</span></p>
        <button class="wr-link" id="w-recap">See ${M.name} so far ${MW.icon('arrow', 16)}</button>
      </article>
      <div class="d-rows">${row('w-real', 'eyes', 'Real talk', 'The facts, minus the jokes')}</div>`;
  }

  function renderProfile() {
    const S = MW.state, P = S.plan, Pe = MW.PERSONA;
    const saved = sumAmt(S.skips) + sumAmt(S.moves);
    const target = P.goal === 'save' ? P.goalAmount : Math.max(100, P.habits.reduce((t, k) => t + Math.max(0, (P.baseline[k] || 0) - (P.limits[k] || 0)), 0) * 3);
    const pct = Math.min(100, Math.round(saved / Math.max(1, target) * 100));
    const toneName = { bestie: 'Gentle bestie', honest: 'Honest friend', roast: 'Roast me' }[P.tone];
    const goalTitle = P.goal === 'save' ? (P.goalName || 'Savings') : P.goal === 'smarter' ? 'Joy Fund' : 'Spend less';
    return `${pageHead('Profile', `Hi, ${MW.esc(Pe.name)}.`, `${Pe.age} · ${MW.esc(Pe.about)}`)}
      <article class="goal-card" id="p-goal">
        <div class="wr-top"><span class="pg-k">${P.goal === 'save' ? 'Saving for' : 'Your goal'}</span><span class="goal-add">${MW.icon('plus', 18)}</span></div>
        <h2 class="goal-t">${MW.esc(goalTitle)}</h2>
        <p class="goal-n"><b>${$(saved)}</b> of ${$(target)}</p>
        <div class="wr-prog green"><i style="width:${Math.max(2, pct)}%"></i></div>
        <p class="wr-pm"><span>${pct}% there</span><span>Tap to add money</span></p>
      </article>
      <div class="d-rows">
        ${row('p-plan', 'target', 'Change my plan', 'Goal, habits and limits')}
        ${row('p-tone', 'question', 'How we talk to you', toneName)}
        ${row('p-bills', 'bills', 'Bills we never roast', 'Pay, rent and the usual monthly stuff')}
        ${row('p-reset', 'other', 'Reset the prototype')}
      </div>`;
  }

  function bind() {
    const main = document.getElementById('dash-main');
    const on = (sel, fn) => { const el = main.querySelector(sel); if (el) el.onclick = fn; };
    main.querySelectorAll('[data-open]').forEach(el => el.onclick = e => { e.stopPropagation(); openHabit(el.dataset.open); });
    on('#recap-btn', () => MW.recap.start());
    on('#lts-line', () => { const el = main.querySelector('#lts-line'), L = MW.dashLines(), i = (+el.dataset.i + 1) % L.length; el.dataset.i = i; el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip'); el.textContent = L[i]; });
    on('#edit-targets', () => MW.survey.open('limits'));
    on('#add-purchase', () => openCheck());
    main.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { actFilter = b.dataset.f; render(); });
    main.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { MW.state.logs = MW.state.logs.filter(l => l.id !== b.dataset.del); MW.save(); render(); MW.toast('Removed.'); });
    on('#w-play', () => MW.story.start(MW.state.A));
    on('#w-share', () => MW.shareCard(MW.state.A));
    on('#w-real', () => MW.realtalk.open());
    on('#w-recap', () => MW.recap.start());
    on('#p-goal', openMove);
    on('#p-plan', () => MW.survey.open());
    on('#p-tone', () => { const order = ['bestie', 'honest', 'roast']; const P = MW.state.plan; P.tone = order[(order.indexOf(P.tone) + 1) % 3]; MW.save(); render(); MW.toast(line(P.tone, 'ok')); });
    on('#p-bills', openBills);
    on('#p-reset', () => MW.menuAction('delete'));
    requestAnimationFrame(() => main.querySelectorAll('.ring-day').forEach(c => c.classList.add('go')));
    // shrink long card titles so no word is ever cut off
    main.querySelectorAll('.hc2-title').forEach(el => {
      el.style.fontSize = ''; let s = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && s > 14) { s -= 1; el.style.fontSize = s + 'px'; }
    });
  }

  /* ---------- sheets ---------- */
  function openHabit(cat) {
    const S = MW.state, P = S.plan, M = monthInfo(), b = budget(cat, M);
    const last = spentFor(cat, M.prevKey), pace = b.spent / Math.max(.05, M.elapsed);
    const recent = entries(M.key).filter(e => e.cat === cat).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 6);
    const remainPct = b.limit ? Math.max(0, Math.min(100, (1 - b.used) * 100)) : 0;
    MW.modal.open(`
      <div class="sheet-hero hue-${HUE[cat] || 'mint'}">
        <p class="s-kicker">${MW.esc(topMerchant(cat, M.key))} · ${M.name}</p>
        <h2 id="modal-title" class="sheet-num">${$(Math.abs(b.left))}</h2>
        <p class="sheet-sub">${b.left >= 0 ? 'left' : 'over'} of your ${$(b.limit)} target</p>
        <div class="hc2-bar dark"><i style="width:${remainPct}%"></i><em style="left:${(1 - M.elapsed) * 100}%"></em></div>
      </div>
      <p class="sheet-line">${line(P.tone, b.status, b.c.label, 3)}</p>
      <div class="sheet-stats">
        <div><b>${$(b.spent)}</b><span>spent so far</span></div>
        <div><b>${b.left > 0 ? $(b.perDay) : '$0'}</b><span>a day for ${M.daysLeft} days</span></div>
        <div><b>${$(pace)}</b><span>at this pace</span></div>
        <div><b>${$(last)}</b><span>in ${M.prevName}</span></div>
      </div>
      <ul class="sheet-list">${recent.map(e => `<li><span>${MW.esc(e.merchant || e.note || b.c.label)}<small>${MW.fmtDate(e.date)}</small></span><b>${$(e.amount, true)}</b></li>`).join('') || '<li><span>No taps yet</span></li>'}</ul>
      <div class="m-actions"><button class="btn btn-primary" id="h-add">Add purchase</button><button class="btn btn-ghost" id="h-edit">Edit target</button></div>`, root => {
      root.querySelector('#h-add').onclick = () => { MW.modal.close(); setTimeout(() => openCheck(cat), 220); };
      root.querySelector('#h-edit').onclick = () => { MW.modal.close(); MW.survey.open('limits'); };
    });
  }

  function openRecap() {
    const S = MW.state, P = S.plan, M = monthInfo(), A = S.A;
    const rows = P.habits.map(k => {
      const last = spentFor(k, M.prevKey), now = spentFor(k, M.key), lim = P.limits[k];
      const pace = now / Math.max(.05, M.elapsed);
      return `<li><span class="rc-ic">${MW.icon(ICONK(k), 18)}</span><span class="rc-name">${TITLE(k)}<small>${M.prevName}: ${$(last)} · target ${$(lim)}</small></span><span class="rc-now"><b>${$(now)}</b><small>heading for ${$(pace)}</small></span></li>`;
    }).join('');
    const tapsNow = entries(M.key).length, tapsLast = entries(M.prevKey).length;
    MW.modal.open(`
      <p class="s-kicker">Day ${M.dom} of ${M.dim}</p>
      <h2 id="modal-title" class="m-title">Monthly recap.</h2>
      <p class="muted">${M.name} so far vs. your ${M.prevName} Wrapped.</p>
      <ul class="recap-list">${rows}</ul>
      <div class="recap-taps"><div><b>${tapsNow}</b><span>taps in ${M.name}</span></div><div><b>${tapsLast}</b><span>taps in ${M.prevName}</span></div></div>
      <p class="muted small">Your ${M.name} Wrapped drops ${M.next}. That's where we find out if the plan worked.</p>
      <div class="m-actions"><button class="btn btn-primary" id="rc-replay">Replay ${M.prevName} Wrapped</button><button class="btn btn-ghost" id="rc-plan">Edit targets</button></div>`, root => {
      root.querySelector('#rc-replay').onclick = () => { MW.modal.close(); MW.story.start(A); };
      root.querySelector('#rc-plan').onclick = () => { MW.modal.close(); MW.survey.open('limits'); };
    });
  }

  function openBills() {
    const ess = MW.state.txns.filter(t => t.dir === 'out' && ['rent', 'bills'].includes(t.cat) && t.date.slice(0, 7) === MW.PERSONA.wrapMonth);
    MW.modal.open(`
      <h2 id="modal-title" class="m-title">Never roasted.</h2>
      <p class="muted">Rent and regular bills stay out of the story and out of your targets.</p>
      <ul class="sheet-list">${ess.map(t => `<li><span>${MW.esc(t.desc.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))}<small>${t.cat === 'rent' ? 'Rent' : 'Bill'}</small></span><b>${$(t.amount)}</b></li>`).join('')}</ul>`);
  }

  /* ---------- Check yourself: positive friction before a purchase ---------- */
  function openCheck(preCat, logOnly) {
    const P = MW.state.plan;
    const opts = P.habits.concat(['other']);
    let cat = preCat || P.habits[0] || 'other';
    const html = `
      <h2 id="modal-title" class="m-title">${logOnly ? 'Add purchase' : 'Check yourself.'}</h2>
      <p class="muted">${logOnly ? 'Already bought it? Log it so your bars stay honest.' : 'About to tap? Tell us what it is first. That pause is the point.'}</p>
      <div id="cy-form">
      <p class="sv-label">What is it?</p>
      <div class="chip-list wrap" id="cy-cats">${opts.map(k => `<button class="jchip ${k === cat ? 'sel' : ''}" data-c="${k}" aria-pressed="${k === cat}">${MW.icon(MW.ICONS[k] ? k : "other", 16)} ${k === 'other' ? 'Something else' : MW.CATEGORIES[k].label}</button>`).join('')}</div>
      <div class="field-row">
        <label class="field"><span>How much?</span><div class="money-input"><i>$</i><input id="cy-amt" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="0.00" /></div></label>
        <label class="field"><span>Where? <em class="muted">(optional)</em></span><input id="cy-note" maxlength="40" placeholder="e.g. DoorDash, Blue Bottle" /></label>
      </div>
      </div>
      <p class="error" id="cy-err" hidden></p>
      <div id="cy-verdict"></div>
      <div class="m-actions" id="cy-actions">
        ${logOnly ? '<button class="btn btn-primary" id="cy-log">Log it</button>' : '<button class="btn btn-primary" id="cy-go">Check it →</button><button class="link-btn" id="cy-already">Already bought it? Just log it</button>'}
      </div>`;
    MW.modal.open(html, root => {
      const amt = root.querySelector('#cy-amt');
      setTimeout(() => amt.focus(), 200);
      root.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
        cat = b.dataset.c;
        root.querySelectorAll('[data-c]').forEach(x => { x.classList.toggle('sel', x === b); x.setAttribute('aria-pressed', x === b); });
      });
      const read = () => {
        const v = parseFloat(amt.value);
        if (!(v > 0)) { const e = root.querySelector('#cy-err'); e.textContent = 'Enter an amount first.'; e.hidden = false; return null; }
        root.querySelector('#cy-err').hidden = true;
        return { amount: Math.round(v * 100) / 100, note: root.querySelector('#cy-note').value.trim(), cat };
      };
      const log = root.querySelector('#cy-log'); if (log) log.onclick = () => { const r = read(); if (r) commit(r); };
      const al = root.querySelector('#cy-already'); if (al) al.onclick = () => { const r = read(); if (r) commit(r); };
      const go = root.querySelector('#cy-go'); if (go) go.onclick = () => { const r = read(); if (r) verdict(root, r); };
    });
  }

  function verdict(root, r) {
    const P = MW.state.plan, M = monthInfo();
    const isHabit = P.habits.includes(r.cat);
    const b = isHabit ? budget(r.cat, M) : null;
    const after = b ? b.left - r.amount : null;
    const goalName = P.goal === 'save' ? (P.goalName || 'your savings') : P.goal === 'smarter' ? 'your Joy Fund' : 'your pocket';
    let head, body, kind;
    if (!b) { kind = 'ok'; head = 'Not one of your tracked habits.'; body = `Still worth asking: will you remember this in a week? Skipping it puts ${$(r.amount, true)} toward ${MW.esc(goalName)}.`; }
    else if (after < 0) { kind = 'over'; head = b.left > 0 ? `This puts you ${$(-after, true)} over your ${b.c.label.toLowerCase()} limit.` : `You're already over your ${b.c.label.toLowerCase()} limit.`; body = `${M.daysLeft - 1} days left in ${M.name}. ${line(P.tone, 'over', b.c.label)}`; }
    else {
      kind = after / b.limit < 0.2 || (b.spent + r.amount) / b.limit > M.elapsed + 0.12 ? 'warn' : 'ok';
      head = `This leaves ${$(after, true)} for the next ${M.daysLeft} days.`;
      body = `That's ${$(after / M.daysLeft, true)} a day. ${line(P.tone, kind, b.c.label)}`;
    }
    const nowPct = b && b.limit ? Math.max(0, Math.min(100, (b.left / b.limit) * 100)) : 0;
    const afterPct = b && b.limit ? Math.max(0, Math.min(100, (after / b.limit) * 100)) : 0;
    root.querySelector('#cy-verdict').innerHTML = `
      ${b ? `<div class="gcard mini ${kind === 'ok' ? 'g-iris' : kind === 'warn' ? 'g-peri' : 'g-peach'}">
        <div class="gc-line"><span id="cy-line" style="width:${nowPct}%"></span></div>
        <p class="bc-kicker">After this</p>
        <div class="bc-left"><b>${$(Math.abs(after))}</b><span>${after >= 0 ? 'left' : 'over'} of ${$(b.limit)}</span></div>
      </div>` : ''}
      <div class="verdict v-${kind}">
        <p class="v-head">${head}</p>
        <p>${body}</p>
        <p class="muted small">Skip one of these a week and that's ${$(r.amount * 52)} a year.</p>
      </div>
      <div class="breathe" id="breathe"><span></span><p>Take 5 seconds. Do you actually want it, or is it just easy?</p></div>`;
    root.querySelector('#cy-actions').innerHTML = `
      <button class="btn btn-primary" id="cy-skip">Skip it, keep ${$(r.amount, true)}</button>
      <button class="btn btn-ghost" id="cy-buy" disabled>Buy it anyway (5)</button>`;
    root.querySelector('#cy-form').innerHTML = `<p class="cy-summary">${MW.icon(MW.ICONS[r.cat] ? r.cat : "other", 16)} ${r.cat === 'other' ? 'Something else' : MW.CATEGORIES[r.cat].label}${r.note ? ' · ' + MW.esc(r.note) : ''} · <b>${$(r.amount, true)}</b></p>`;
    setTimeout(() => { const l = root.querySelector('#cy-line'); if (l) l.style.width = afterPct + '%'; }, 350);
    let n = 5; const buy = root.querySelector('#cy-buy');
    MW.modal._t = setInterval(() => {
      n--; buy.textContent = n > 0 ? `Buy it anyway (${n})` : 'Buy it anyway';
      if (n <= 0) { clearInterval(MW.modal._t); buy.disabled = false; }
    }, 1000);
    root.querySelector('#cy-skip').onclick = () => {
      MW.state.skips.push({ id: MW.uid(), date: MW.todayISO(), cat: r.cat, amount: r.amount, ts: Date.now() });
      MW.save(); MW.modal.close(); MW.confetti(); render();
      MW.toast(`${line(P.tone, 'skip')} ${$(r.amount, true)} kept.`);
    };
    buy.onclick = () => commit(r);
  }

  function commit(r) {
    const P = MW.state.plan;
    MW.state.logs.push({ id: MW.uid(), date: MW.todayISO(), cat: r.cat, amount: r.amount, note: r.note, merchant: r.note, src: 'log', ts: Date.now() });
    MW.save(); MW.modal.close(); render();
    const b = P.habits.includes(r.cat) ? budget(r.cat, monthInfo()) : null;
    MW.toast(b ? (b.left >= 0 ? `Logged. ${$(b.left)} left for ${b.c.label.toLowerCase()}.` : `Logged. You're ${$(-b.left)} over on ${b.c.label.toLowerCase()}.`) : 'Logged.');
  }

  function openMove() {
    const P = MW.state.plan;
    const freed = P.habits.reduce((t, k) => t + Math.max(0, (P.baseline[k] || 0) - (P.limits[k] || 0)), 0);
    MW.modal.open(`
      <h2 id="modal-title" class="m-title">Move money in</h2>
      <p class="muted">Did you move money into savings? Log it here so your jar reflects it. (We can't move money for you. This is the honour system.)</p>
      <label class="field"><span>Amount</span><div class="money-input"><i>$</i><input id="mv-amt" type="number" inputmode="decimal" min="1" value="${Math.round(freed) || ''}" /></div></label>
      <p class="error" id="mv-err" hidden></p>
      <div class="m-actions"><button class="btn btn-primary" id="mv-go">Add to jar</button></div>`, root => {
      root.querySelector('#mv-go').onclick = () => {
        const v = parseFloat(root.querySelector('#mv-amt').value);
        if (!(v > 0)) { const e = root.querySelector('#mv-err'); e.textContent = 'Enter an amount.'; e.hidden = false; return; }
        MW.state.moves.push({ id: MW.uid(), date: MW.todayISO(), amount: Math.round(v * 100) / 100 });
        MW.save(); MW.modal.close(); MW.confetti(); render(); MW.toast('Added. That money has a job now.');
      };
    });
  }

  MW.dash = {
    open(t) { if (t) tab = t; MW.show('dash'); render(); },
    tab(t) { tab = t; render(); window.scrollTo(0, 0); },
    render, openCheck,
    info: { monthInfo, budget, entries },
  };
})();



/* Money Wrapped — the Monthly Recap story (behind "View monthly recap").
   Mid-month check-in. Every number is live: it changes as Zoe logs or skips purchases.
   Slides only appear when they're true (no "0 double orders" slide if she double-ordered). */
window.MW = window.MW || {};

(function () {
  const $ = MW.money;
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const word = n => (NUM[n] || String(n));
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  /* daily allowance: whole-dollar balance ÷ days, rounded down to the cent (matches what the boxes show) */
  MW.perDay = (left, days) => Math.max(0, Math.floor(Math.round(Math.max(0, left)) / Math.max(1, days) * 100) / 100);
  const cents = n => '$' + n.toFixed(2);
  const SHORT = { delivery: 'DD', online: 'shopping', coffee: 'coffee', shopping: 'shopping' };
  const POTNAME = { delivery: 'delivery', online: 'shopping', coffee: 'coffee', shopping: 'shopping' };

  MW.buildRecap = function () {
    const D = MW.dash.info, M = D.monthInfo(), P = MW.state.plan, W = MW.ART2;
    const v = Math.max(0, (MW.state.recapPlays || 1) - 1) % 3;
    const pick = arr => MW.splitPunch(MW.pickLine(arr, v));
    const S = [];
    const add = (o, l2s) => { const [a, b] = pick(l2s); S.push(Object.assign(o, { l1: a, l2: b })); };
    const sameDays = (cat, key) => D.entries(key).filter(e => e.cat === cat && +e.date.slice(8) <= M.dom);
    const sum = a => a.reduce((t, e) => t + e.amount, 0);
    const has = k => P.habits.includes(k);
    const B = {}; P.habits.forEach(k => { B[k] = D.budget(k, M); });
    const payday = MW.state.txns.some(t => t.dir === 'in' && t.cat === 'income' && t.date === MW.todayISO() && !/ZELLE/.test(t.desc));

    /* 1. The check-in */
    if (has('delivery')) {
      const now = B.delivery.spent, prev = sum(sameDays('delivery', M.prevKey)), delta = Math.round(now) - Math.round(prev);
      add({ hue: 'peach', kicker: `${M.name} ${M.dom}${payday ? ' · payday' : ''}`, num: { v: Math.abs(delta), pre: delta >= 0 ? '+$' : '−$' }, sub: `DoorDash: ${$(now)}. Last month by now: ${$(prev)}.`, art: W.ropeHop() },
        delta > 0 ? ['You gave it a limit. It heard a suggestion.', 'Same relationship. Now with written boundaries.', 'The progress bar is working. That’s the awkward bit.']
          : ['Less than last month. Someone read the limit.', 'Same relationship. Healthier texting schedule.', 'The bag noticed. It’s taking it well.']);

      /* 2. The pace check */
      const pace = Math.round(now / Math.max(.05, M.elapsed)), lim = B.delivery.limit;
      add({ hue: 'butter', kicker: 'The current trajectory', num: { v: pace, pre: '~$' }, sub: `Projected DoorDash spend. Your limit: ${$(lim)}.`, art: pace > lim ? W.nameBadge($(lim)) : W.onTrack() },
        pace > lim ? ['September’s plot. Now with a progress bar.', 'DoorDash has not read the terms and conditions.', `The limit is ${$(lim)}. The bag has other plans.`]
          : ['Landing under the limit. No drama.', 'The bag has accepted the terms.', 'September would not recognise you.']);

      /* 3. An earned win: no double-order days */
      const byDay = {}; D.entries(M.key).filter(e => e.cat === 'delivery').forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + 1; });
      const doubles = Object.values(byDay).filter(n => n > 1).length;
      if (doubles === 0 && B.delivery.count > 0) add({ hue: 'mint', kicker: 'One actual improvement', num: { v: 0 }, sub: `Double-order days. ${cap(word(B.delivery.count))} orders so far.`, art: W.stageDoor() },
        ['The two-part finale has not been renewed.', 'One delivery at a time. That is a real change.', 'The sequel department has been unusually quiet.']);
    }

    /* 4. The shopping situation */
    const shopK = has('online') ? 'online' : has('shopping') ? 'shopping' : null;
    if (shopK) {
      const b = B[shopK], low = b.left / Math.max(1, b.limit) < .25;
      add({ hue: 'peri', kicker: `Shopping · ${b.left >= 0 ? 'left' : 'over'}`, num: { v: Math.round(Math.abs(b.left)), pre: '$' }, sub: `Spent ${$(b.spent)} of ${$(b.limit)}. ${cap(word(M.daysLeft))} days left.`, art: W.framedCart($(Math.max(0, b.left))) },
        b.left < 0 ? ['Over the limit. The cart has gone freelance.', 'The haul outlived the budget.', 'Your wishlist has started paying rent.']
          : low ? ['The cart is now a vision board.', 'The haul has entered its short-story era.', 'Your wishlist is about to do some unpaid work.']
            : ['Plenty left. Suspiciously plenty.', 'The cart is behaving. For now.', 'Your wishlist is on standby.']);
    }

    /* 5. The small win: fewer matchas than last month by now */
    if (has('coffee')) {
      const n = D.entries(M.key).filter(e => e.matcha && +e.date.slice(8) <= M.dom).length;
      const p = sameDays('coffee', M.prevKey).filter(e => e.matcha).length;
      if (p > n) add({ hue: 'lime', kicker: 'Matcha + coffee · left', num: { v: Math.round(Math.max(0, B.coffee.left)), pre: '$' }, sub: `${n} matchas vs ${p} last month by day ${M.dom}.`, art: W.tally(Math.min(10, p), Math.min(10, p) - Math.min(10, n)) },
        [`${cap(word(p - n))} fewer. Small, but we’re counting.`, 'The competition noticed your reduced hours.', 'A smaller supporting role for the second café.']);
    }

    /* 6. The missing character: overdraft fees gone */
    const feesNow = sum(D.entries(M.key).filter(e => e.cat === 'fees')), feesPrev = sum(D.entries(M.prevKey).filter(e => e.cat === 'fees'));
    if (feesNow === 0 && feesPrev > 0) add({ hue: 'sky', kicker: 'A welcome no-show', num: { v: 0, pre: '$' }, sub: 'Overdraft fees so far.', art: W.closedBooth('FEE ' + $(feesPrev)) },
      ['September’s admission charge did not return.', 'This recurring character can stay unemployed.', 'No fee cameo. An actual improvement.']);

    /* 7. The outfit returns: BNPL still running */
    const bn = D.entries(M.key).filter(e => e.cat === 'bnpl');
    if (bn.length) {
      const all = MW.state.txns.filter(t => t.cat === 'bnpl' && t.date <= MW.todayISO());
      add({ hue: 'lav', kicker: 'Meanwhile, in the credits', num: { v: Math.round(sum(bn)), pre: '$' }, sub: 'Princess Polly. Still paying for the outfit.',
        art: W.outfitCredits(all.slice(-4).map((t, i) => ['PAYMENT ' + (i + 1), $(t.amount)]), 'STILL RUNNING') },
        ['The post-credit scene has a post-credit scene.', 'The outfit is still making monthly appearances.', 'That concert outfit has a very long goodbye.']);
    }

    /* 8. What's actually left */
    const keys = P.habits.slice(0, 3), lefts = keys.map(k => Math.round(Math.max(0, B[k].left)));
    const total = lefts.reduce((a, b) => a + b, 0);
    add({ hue: 'pink', kicker: `Left in these ${word(keys.length)} limits`, num: { v: total, pre: '$' }, sub: keys.map((k, i) => `${$(lefts[i])} ${POTNAME[k] || MW.CATEGORIES[k].label.toLowerCase()}`).join('. ') + '.',
      art: W.pots(lefts.map(x => $(x))) },
      ['Three separate pots. Shopping’s is more of a lid.', 'Shopping has requested a smaller font.', 'The shopping budget is mostly atmosphere now.']);

    /* 9. The ending: on track or off track */
    const daily = keys.map(k => MW.perDay(B[k].left, M.daysLeft)), dsum = Math.round(daily.reduce((a, b) => a + b, 0) * 100) / 100;
    const onTrack = keys.every(k => B[k].spent / Math.max(.05, M.elapsed) <= B[k].limit);
    const endBtns = [{ label: 'Back to dashboard', attr: 'data-home' }, { label: 'Watch again', attr: 'data-again', alt: true }];
    const perLine = keys.map((k, i) => `${cents(daily[i])} ${SHORT[k] || k}`).join(' / ');
    if (onTrack) add({ hue: 'mint', id: 'end', noAuto: true, kicker: `On track · ${M.daysLeft} days`, num: { v: dsum, pre: '$', dec: 2 }, sub: 'Per day left. Your pace fits your limits.', art: W.onTrack(), buttons: endBtns },
      ['See you tomorrow. We can get used to this.', 'Back tomorrow. Quiet progress gets another episode.', 'No dramatic ending needed. Same time tomorrow.']);
    else add({ hue: 'butter', id: 'end', noAuto: true, kicker: `Off track · ${M.daysLeft} days left`, num: { v: dsum, pre: '$', dec: 2 }, sub: perLine, art: W.openEnding(), buttons: endBtns },
      ['The ending’s still open. Check back tomorrow.', 'Back tomorrow. There’s still time to edit this.', 'Tomorrow gets a new scene. Let’s see what happens.']);
    return S;
  };

  MW.recap = {
    start() {
      MW.state.recapPlays = (MW.state.recapPlays || 0) + 1; MW.save();
      MW.story.play(MW.buildRecap(), { kind: 'recap', skipLabel: 'Close', onSkip: () => MW.dash.open('home') });
    },
  };

  /* ---------- dashboard one-liners (under the Left to spend boxes) ---------- */
  MW.dashLines = function () {
    const D = MW.dash.info, M = D.monthInfo(), P = MW.state.plan, out = [];
    const B = {}; P.habits.forEach(k => { B[k] = D.budget(k, M); });
    const shopK = B.online ? 'online' : B.shopping ? 'shopping' : null;
    if (shopK && B[shopK].left >= 0 && B[shopK].left / B[shopK].limit < .2) out.push(`${$(B[shopK].left)} left. The cart is now a vision board.`);
    if (B.delivery && B.delivery.spent / Math.max(.05, M.elapsed) > B.delivery.limit) out.push('The bar is moving. Sadly, toward the limit.');
    if (B.delivery) {
      const byDay = {}; D.entries(M.key).filter(e => e.cat === 'delivery').forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + 1; });
      if (!Object.values(byDay).some(n => n > 1)) out.push('No double orders. The sequel remains cancelled.');
      if (B.delivery.left > 0) out.push(`${$(B.delivery.left)} left. The salad’s entourage may need a break.`);
    }
    if (B.coffee && B.coffee.left > 0) out.push(`${$(B.coffee.left)} left. The second café has reduced hours.`);
    P.habits.forEach(k => { if (B[k].left > 0 && B[k].left / B[k].limit < .2 && k !== shopK) out.push(`${$(B[k].left)} left. ${M.daysLeft} days. A very small subplot.`); });
    return out.length ? out : ['Everything’s under the limit. Suspicious, but nice.'];
  };
})();

