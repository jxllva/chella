/* Faiit share cards: 1080 × 1920 story cards, one object per card carrying the data.
   Share-safe by default: counts and shares only, never a dollar amount or a name.
   Each card is one SVG, used for the on-screen preview and for the saved image. */
(() => {
  const W = 1080, H = 1920;
  const INK = '#1d1b2e', CREAM = '#F6EBD9';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seeded = seed => { let h = seed >>> 0 || 1; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  const foot = (fill, y = 1560, x = 540, anchor = 'middle') => `<text x="${x}" y="${y}" font-family="Courier Prime" font-weight="700" font-size="26" fill="${fill}" text-anchor="${anchor}" letter-spacing="2" opacity=".75">faiit · make yours</text>`;
  const svgOpen = (bg, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs>${extra}</defs><rect width="${W}" height="${H}" fill="${bg}"/>`;

  // ---------- 01 · Orders: a field of little takeout boxes, one per order ----------
  function orders(d, s) {
    const n = d.orders.n, show = Math.min(n, 48), rnd = seeded(n * 7 + 3);
    const cols = show > 30 ? 7 : show > 16 ? 6 : 5, rows = Math.ceil(show / cols);
    const gx = 900 / cols, gy = Math.min(150, 840 / rows), sc = Math.min(1.25, gx / 120);
    const boxes = Array.from({ length: show }, (_, k) => {
      const c = k % cols, r = Math.floor(k / cols), x = 90 + gx * (c + .5) + (rnd() - .5) * 26, y = 720 + gy * (r + .5) + (rnd() - .5) * 22, rot = (rnd() - .5) * 34;
      const wink = s.wink && k % 3 === 0;
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(2)})"><g class="bx" style="--k:${k}">
        <path d="M-40 -26 L40 -26 L30 40 L-30 40 Z" fill="#D7F25A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-40 -26 L-30 -40 L30 -40 L40 -26" fill="#C3E24A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-12 -40 C-12 -58 12 -58 12 -40" fill="none" stroke="${INK}" stroke-width="3"/>
        ${wink ? `<path d="M-16 4 L-6 4" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` : `<circle cx="-11" cy="4" r="4.5" fill="${INK}"/>`}<circle cx="11" cy="4" r="4.5" fill="${INK}"/>
        <path d="M-10 16 Q0 26 10 16" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/></g></g>`;
    }).join('');
    return `${svgOpen('#9AA6F7')}
  <text x="90" y="300" font-family="Courier Prime" font-weight="700" font-size="28" fill="${INK}" letter-spacing="3">${esc(d.year)} · ${esc(d.monthUpper)}</text>
  <text x="80" y="560" font-family="Bricolage Grotesque" font-weight="800" font-size="300" fill="${INK}" letter-spacing="-18">${n}</text>
  <text x="${100 + String(n).length * 165}" y="555" font-family="Bricolage Grotesque" font-weight="700" font-size="48" fill="${INK}">${esc(d.orders.unit)}</text>
  <text x="90" y="640" font-family="Bricolage Grotesque" font-weight="600" font-size="40" fill="${INK}">${esc(d.orders.line)}</text>
  ${boxes}
  ${n > show ? `<text x="990" y="1520" font-family="Courier Prime" font-weight="700" font-size="28" fill="${INK}" text-anchor="end">+${n - show} more</text>` : ''}
  ${foot(INK)}
</svg>`;
  }

  // ---------- 02 · Coffees: the brown folder and a cup carrier ----------
  function coffees(d, s) {
    const cup = (x, lid) => `<g transform="translate(${x} 0)">
        <path d="M-58 -150 L58 -150 L46 40 L-46 40 Z" fill="${CREAM}" stroke="#3b2414" stroke-width="4"/>
        <rect x="-50" y="-92" width="100" height="56" fill="#C98B52"/>
        <rect x="-66" y="-176" width="132" height="30" rx="8" fill="${lid}" stroke="#3b2414" stroke-width="4"/>
        <rect x="-44" y="-190" width="88" height="16" rx="6" fill="${lid}" stroke="#3b2414" stroke-width="4"/></g>`;
    const steam = s.steam ? [-170, -55, 60, 175].map(x => `<path class="st" d="M${x} -230 c-18 -30 18 -50 0 -80 c-18 -30 18 -50 0 -80" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" opacity=".8"/>`).join('') : '';
    return `${svgOpen('#171210')}
  <path d="M70 330 H560 L600 280 H1010 V1590 H70 Z" fill="#8B5224"/>
  <path d="M600 280 H880 L905 320 H580 Z" fill="#A86A33"/>
  <text x="745" y="312" font-family="Courier Prime" font-weight="700" font-size="24" fill="${CREAM}" text-anchor="middle" letter-spacing="4">CAFFEINE</text>
  <text x="540" y="520" font-family="Courier Prime" font-weight="700" font-size="28" fill="${CREAM}" text-anchor="middle" letter-spacing="5">I'VE HAD AT LEAST</text>
  <text x="540" y="740" font-family="Instrument Serif" font-size="220" fill="${CREAM}" text-anchor="middle">${d.coffees.n} Coffees</text>
  <g transform="translate(540 1180)">
    <path d="M-330 40 L330 40 L300 120 L-300 120 Z" fill="#B88A5A" stroke="#3b2414" stroke-width="4"/>
    ${steam}${cup(-170, '#6B3E22')}${cup(-55, '#E9D7BF')}${cup(60, '#6B3E22')}${cup(175, '#E9D7BF')}
  </g>
  <text x="540" y="1420" font-family="Instrument Serif" font-style="italic" font-size="46" fill="${CREAM}" text-anchor="middle">${esc(d.coffees.line)}</text>
  ${foot(CREAM, 1540)}
</svg>`;
  }

  // ---------- 03 · Cart: receipts piled into a shopping cart, one per order ----------
  function cart(d, s) {
    const n = Math.min(d.cart.n, 16), rnd = seeded(d.cart.n * 13 + 5);
    const grid = `<pattern id="gp" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#8C6CC9" stroke-width="2" opacity=".55"/></pattern>`;
    const papers = Array.from({ length: n }, (_, k) => {
      const x = 340 + rnd() * 440, y = 860 + rnd() * 200 - (k / n) * 120, r = (rnd() - .5) * 70;
      return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${r.toFixed(0)})"><g class="rc" style="--k:${k}"><rect x="-90" y="-120" width="180" height="240" fill="#E6DAFA"/><rect x="-90" y="-120" width="180" height="240" fill="url(#gp)"/></g></g>`;
    }).join('');
    const top = `<g transform="translate(590 640) rotate(-6)"><g class="rc" style="--k:${n}"><rect x="-230" y="-120" width="460" height="230" fill="#F1EAFE"/><rect x="-230" y="-120" width="460" height="230" fill="url(#gp)"/>
      <text x="0" y="-10" font-family="Instrument Serif" font-style="italic" font-size="78" fill="${INK}" text-anchor="middle">${d.cart.n} ${esc(d.cart.unit)}</text>
      <text x="0" y="66" font-family="Instrument Serif" font-style="italic" font-size="60" fill="${INK}" text-anchor="middle">in here</text></g></g>`;
    return `${svgOpen('#CFE3F2', grid)}
  <text x="90" y="300" font-family="Courier Prime" font-weight="700" font-size="28" fill="${INK}" letter-spacing="3">${esc(d.year)} · ${esc(d.monthUpper)}</text>
  <text x="90" y="400" font-family="Bricolage Grotesque" font-weight="800" font-size="76" fill="${INK}">Just browsing.</text>
  ${s.dropped ? papers : ''}
  <g fill="none" stroke="#E23B2E" stroke-width="16" stroke-linejoin="round" stroke-linecap="round">
    <path d="M150 640 L230 640 L300 1180 L860 1180 L930 760 L262 760"/>
    <path d="M300 1180 L280 1300 L880 1300"/>
  </g>
  <g fill="none" stroke="#E23B2E" stroke-width="8" opacity=".85">${Array.from({ length: 7 }, (_, k) => `<line x1="${340 + k * 82}" y1="770" x2="${335 + k * 78}" y2="1172"/>`).join('')}<line x1="282" y1="920" x2="905" y2="920"/><line x1="296" y1="1060" x2="885" y2="1060"/></g>
  ${s.dropped ? top : ''}
  <circle cx="360" cy="1380" r="44" fill="${INK}"/><circle cx="800" cy="1380" r="44" fill="${INK}"/>
  ${s.dropped ? '' : `<text x="580" y="980" font-family="Bricolage Grotesque" font-weight="700" font-size="40" fill="${INK}" text-anchor="middle">tap to fill the cart</text>`}
  ${foot(INK)}
</svg>`;
  }

  // ---------- 04 · Pie: what the month was made of, drawn like a cake ----------
  const SLICE = ['#E0483C', '#F3C74A', '#4FA35E', '#8A5BD6', '#2F6FE0', '#F6E7CC'];
  function pie(d, s) {
    const cx = 540, cy = 1000, r = 330, depth = 70; let a0 = -Math.PI / 2;
    const parts = d.pie.map((p, k) => { const a1 = a0 + p.share * Math.PI * 2, o = { ...p, a0, a1, c: SLICE[k % SLICE.length] }; a0 = a1; return o; });
    const arc = (p, rr, oy = 0) => { const x0 = cx + rr * Math.cos(p.a0), y0 = cy + oy + rr * Math.sin(p.a0) * .62, x1 = cx + rr * Math.cos(p.a1), y1 = cy + oy + rr * Math.sin(p.a1) * .62; return `M${cx} ${cy + oy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${rr} ${rr * .62} 0 ${p.a1 - p.a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`; };
    const order = parts.map((p, k) => k).sort((a, b) => (a === s.slice) - (b === s.slice));
    const slices = order.map(k => {
      const p = parts[k], mid = (p.a0 + p.a1) / 2, pop = s.slice === k ? 60 : 0, tx = Math.cos(mid) * pop, ty = Math.sin(mid) * pop * .62;
      const dots = Array.from({ length: Math.max(2, Math.round(p.share * 18)) }, (_, j) => { const rr = 80 + ((j * 97) % 220), aa = p.a0 + (p.a1 - p.a0) * (.1 + .8 * (((j * 53) % 100) / 100)); return `<circle cx="${(cx + rr * Math.cos(aa)).toFixed(1)}" cy="${(cy + rr * Math.sin(aa) * .62).toFixed(1)}" r="7" fill="${p.c === '#F6E7CC' ? '#6B3E2E' : '#fff'}" opacity=".8"/>`; }).join('');
      return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})"><path d="${arc(p, r, depth)}" fill="#6B3E2E" stroke="${INK}" stroke-width="3"/><path d="${arc(p, r)}" fill="${p.c}" stroke="${INK}" stroke-width="3"/>${dots}</g>`;
    }).join('');
    const pick = parts[s.slice];
    return `${svgOpen('#F4A7B9')}
  <text x="90" y="330" font-family="Bricolage Grotesque" font-weight="800" font-size="84" fill="${INK}">What was</text>
  <text x="90" y="420" font-family="Bricolage Grotesque" font-weight="800" font-size="84" fill="${INK}">${esc(d.month)} made of?</text>
  <text x="90" y="490" font-family="Bricolage Grotesque" font-weight="600" font-size="44" fill="#fff">Mostly ${esc(d.pie[0].label.toLowerCase())}.</text>
  <ellipse cx="${cx}" cy="${cy + depth + 16}" rx="${r + 30}" ry="${(r + 30) * .62}" fill="${INK}" opacity=".12"/>
  ${slices}
  ${pick ? `<g transform="translate(540 1430)"><rect x="-280" y="-56" width="560" height="92" rx="46" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="-226" cy="-10" r="18" fill="${pick.c}" stroke="${INK}" stroke-width="3"/><text x="20" y="4" font-family="Bricolage Grotesque" font-weight="800" font-size="40" fill="${INK}" text-anchor="middle">${esc(pick.label)} · ${Math.round(pick.share * 100)}%</text></g>` : ''}
  <text x="990" y="1540" font-family="Bricolage Grotesque" font-weight="700" font-size="26" fill="${INK}" text-anchor="end">share of purchases, by count</text>
  ${foot(INK, 1540, 90, 'start')}
</svg>`;
  }

  // ---------- 05 · The turn: a maroon note with a red envelope ----------
  function note(d, s) {
    const up = s.open ? -250 : 0;
    return `${svgOpen('#6E0F14')}
  <g font-family="Instrument Serif" font-size="118" fill="${CREAM}" text-anchor="middle"><text x="540" y="420">Not everything</text><text x="540" y="540">was a</text><text x="540" y="660" font-style="italic">plot twist.</text></g>
  <g transform="translate(0 ${up})"><rect x="250" y="1010" width="580" height="420" fill="${CREAM}"/>
    <text x="540" y="1090" font-family="Courier Prime" font-weight="700" font-size="26" fill="#6E0F14" text-anchor="middle" letter-spacing="4">NOTE TO SELF</text>
    <text x="540" y="1170" font-family="Instrument Serif" font-style="italic" font-size="${d.note.length > 24 ? 44 : 54}" fill="${INK}" text-anchor="middle">${esc(d.note)}.</text>
    <text x="540" y="1240" font-family="Bricolage Grotesque" font-weight="600" font-size="32" fill="${INK}" text-anchor="middle">${esc(d.calm)}</text></g>
  <path d="M190 1180 H890 V1560 H190 Z" fill="#B71C25"/>
  <path d="M190 1180 L540 1420 L890 1180" fill="#D1232E"/>
  <path d="M190 1560 L470 1360 M890 1560 L610 1360" stroke="#8E1219" stroke-width="5"/>
  ${s.open ? '' : `<circle cx="540" cy="1400" r="46" fill="${CREAM}"/><text x="540" y="1418" font-family="Instrument Serif" font-style="italic" font-size="52" fill="#B71C25" text-anchor="middle">f</text>`}
  ${foot(CREAM, 1640)}
</svg>`;
  }

  const CARDS = [
    { id: 'orders', label: 'Orders', hint: 'Tap the card. They wink back.', draw: orders, has: d => d.orders.n > 0 },
    { id: 'coffees', label: 'Coffees', hint: 'Tap the cups for a fresh pour.', draw: coffees, has: d => d.coffees.n >= 3 },
    { id: 'cart', label: 'Cart', hint: 'Tap to fill the cart.', draw: cart, has: d => d.cart.n >= 2 },
    { id: 'pie', label: 'The mix', hint: 'Tap a slice to pull it out.', draw: pie, has: d => d.pie.length >= 2 },
    { id: 'note', label: 'The turn', hint: 'Tap the seal to open it.', draw: note, has: () => true }
  ];

  // ---------- month → card data ----------
  function data(ctx) {
    const days = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    const total = ctx.purchases || 1;
    const pie = [['Delivery', ctx.del], ['Cafés', ctx.caf], ['Shopping', ctx.shop], ['Groceries', ctx.gro]].filter(p => p[1] > 0);
    const rest = total - pie.reduce((s, p) => s + p[1], 0); if (rest > 0) pie.push(['Everything else', rest]);
    pie.sort((a, b) => b[1] - a[1]);
    const delivery = ctx.del >= 3;
    return {
      month: ctx.month, monthUpper: ctx.month.toUpperCase(), year: ctx.year,
      orders: delivery ? { n: ctx.del, unit: 'orders', line: `I ordered delivery ${ctx.del} times in ${ctx.month}.` } : { n: ctx.villain.n, unit: 'visits', line: `${ctx.villain.name} saw me ${ctx.villain.n} times.` },
      coffees: { n: ctx.caf, line: ctx.cafDay != null ? `Mostly on ${days[ctx.cafDay]}. The barista knows.` : 'The barista knows.' },
      cart: { n: ctx.shop, unit: ctx.shop === 1 ? 'package' : 'packages' },
      pie: pie.map(([label, n]) => ({ label, share: n / total })),
      note: ctx.note || 'Same energy. It was a good month',
      calm: ctx.noSpend ? `${ctx.noSpend} ${ctx.noSpend === 1 ? 'day' : 'days'} I spent nothing.` : 'An ordinary month. That counts too.'
    };
  }

  // ---------- saving: embed fonts so the PNG matches the preview ----------
  const FONTS = [['Courier Prime', 'normal', 700, 'fonts/courier-prime-latin-700-normal.woff2'], ['Instrument Serif', 'normal', 400, 'fonts/instrument-serif-latin-400-normal.woff2'], ['Instrument Serif', 'italic', 400, 'fonts/instrument-serif-latin-400-italic.woff2'], ['Bricolage Grotesque', 'normal', '200 800', 'fonts/bricolage-grotesque-latin-opsz-normal.woff2']];
  let fontCSS = null;
  async function embedFonts() {
    if (fontCSS) return fontCSS;
    const parts = await Promise.all(FONTS.map(async ([fam, style, wt, url]) => {
      const buf = await (await fetch(url)).arrayBuffer(); let bin = ''; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i += 8192) bin += String.fromCharCode(...b.subarray(i, i + 8192));
      return `@font-face{font-family:'${fam}';font-style:${style};font-weight:${wt};src:url(data:font/woff2;base64,${btoa(bin)}) format('woff2')}`;
    }));
    return (fontCSS = parts.join(''));
  }
  async function toPNG(svg) {
    const css = await embedFonts();
    const full = svg.replace('<defs>', `<defs><style>${css}</style>`);
    const url = URL.createObjectURL(new Blob([full], { type: 'image/svg+xml' }));
    try {
      const img = new Image(); img.decoding = 'async';
      await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = url; });
      await new Promise(r => setTimeout(r, 60));
      const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(img, 0, 0, W, H);
      return await new Promise(r => c.toBlob(r, 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }

  // ---------- the share screen ----------
  function mount(root, ctx, api) {
    const d = data(ctx), cards = CARDS.filter(c => c.has(d));
    const st = { orders: { wink: false }, coffees: { steam: true }, cart: { dropped: false }, pie: { slice: 0 }, note: { open: false } };
    let at = 0;
    root.innerHTML = `
<div class="sh-wrap" data-phase="wrapped">
  <div class="sh-gift">
    <p class="ew-kicker">Your ${esc(ctx.month)}, ready to post</p>
    <h1 class="ew-h ew-h-sm">${cards.length} cards. <em>Zero dollar signs.</em></h1>
    <div class="sh-parcel" aria-hidden="true"><span class="sh-string h"></span><span class="sh-string v"></span><svg class="sh-bow" viewBox="0 0 120 80"><path d="M60 40 C40 8 8 10 12 34 C16 56 44 52 60 40 Z M60 40 C80 8 112 10 108 34 C104 56 76 52 60 40 Z" fill="none" stroke="#E8352E" stroke-width="7" stroke-linejoin="round"/><path d="M56 44 L40 76 M64 44 L80 76" stroke="#E8352E" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="40" r="9" fill="#E8352E"/></svg><span class="sh-tag">From: ${esc(ctx.month)}<br>To: you</span></div>
    <div class="sh-slide" role="slider" tabindex="0" aria-label="Slide to unwrap" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <span class="sh-slide-label">Slide to <em>unwrap</em></span><span class="sh-knob" aria-hidden="true">→</span>
    </div>
  </div>
  <div class="sh-deck" hidden>
    <div class="sh-rail" role="list">${cards.map((c, k) => `<figure class="sh-card is-${c.id}" role="listitem" data-k="${k}"><button class="sh-tilt" aria-label="${esc(c.label)} card. ${esc(c.hint)}"><div class="sh-svg"></div></button><figcaption>${esc(c.label)}</figcaption></figure>`).join('')}</div>
    <div class="sh-dots" aria-hidden="true">${cards.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    <p class="sh-hint" aria-live="polite"></p>
    <p class="sh-safe">Counts only. Dollar amounts and names never appear on shared cards.</p>
    <div class="sh-acts"><button class="ew-quiet" data-s="save">Save image</button><button class="ew-go" data-s="share">Share</button></div>
    <button class="ew-quiet sh-done" data-w="next">Done</button>
  </div>
</div>`;
    const wrap = root.querySelector('.sh-wrap'), rail = root.querySelector('.sh-rail');
    const paint = k => { const c = cards[k], host = rail.querySelectorAll('.sh-svg')[k]; host.innerHTML = c.draw(d, st[c.id]); const svg = host.firstElementChild; svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `${c.label} card for ${ctx.month}`); };
    const paintAll = () => cards.forEach((_, k) => paint(k));
    const setAt = k => { at = k; root.querySelectorAll('.sh-dots i').forEach((x, j) => x.classList.toggle('is-on', j === k)); root.querySelector('.sh-hint').textContent = cards[k].hint; };

    // Slide to unwrap
    const slide = root.querySelector('.sh-slide'), knob = root.querySelector('.sh-knob'); let x0 = null, max = 0;
    const unwrap = () => {
      if (wrap.dataset.phase !== 'wrapped') return; wrap.dataset.phase = 'open';
      const gift = root.querySelector('.sh-gift'), deck = root.querySelector('.sh-deck');
      const show = () => { gift.hidden = true; deck.hidden = false; paintAll(); setAt(0); if (!reduce()) [...rail.children].forEach((c, k) => c.animate([{ opacity: 0, transform: 'translateY(40px) rotate(-4deg) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 640, delay: k * 90, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' })); };
      if (reduce()) show(); else { root.querySelector('.sh-parcel').classList.add('is-open'); setTimeout(show, 520); }
    };
    slide.addEventListener('pointerdown', e => { x0 = e.clientX; max = slide.clientWidth - knob.offsetWidth - 8; slide.setPointerCapture(e.pointerId); knob.style.transition = 'none'; });
    slide.addEventListener('pointermove', e => { if (x0 === null) return; const dx = Math.max(0, Math.min(max, e.clientX - x0)); knob.style.transform = `translateX(${dx}px)`; slide.setAttribute('aria-valuenow', String(Math.round(dx / max * 100))); root.querySelector('.sh-parcel').style.setProperty('--pull', dx / max); if (dx >= max - 4) { x0 = null; unwrap(); } });
    const letGo = () => { if (x0 === null) return; x0 = null; knob.style.transition = ''; knob.style.transform = ''; root.querySelector('.sh-parcel').style.setProperty('--pull', 0); };
    slide.addEventListener('pointerup', letGo); slide.addEventListener('pointercancel', letGo);
    slide.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); unwrap(); } });

    // Carousel
    rail.addEventListener('scroll', () => { const w = rail.firstElementChild.getBoundingClientRect().width + 16; setAt(Math.max(0, Math.min(cards.length - 1, Math.round(rail.scrollLeft / w)))); }, { passive: true });
    root.querySelectorAll('.sh-dots i').forEach((dot, k) => dot.addEventListener('click', () => rail.children[k].scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', inline: 'center', block: 'nearest' })));
    rail.querySelectorAll('.sh-tilt').forEach(t => {
      t.addEventListener('pointermove', e => { if (reduce() || e.pointerType === 'touch') return; const r = t.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; t.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg)`; });
      t.addEventListener('pointerleave', () => { t.style.transform = ''; });
    });

    // One interaction per card
    rail.addEventListener('click', e => {
      const fig = e.target.closest('.sh-card'); if (!fig) return; const k = +fig.dataset.k, c = cards[k], s = st[c.id];
      const host = fig.querySelector('.sh-svg'), box = host.getBoundingClientRect(), x = (e.clientX - box.left) / box.width * W, y = (e.clientY - box.top) / box.height * H;
      const replay = cls => { host.classList.remove(cls); void host.offsetWidth; host.classList.add(cls); };
      if (c.id === 'orders') { s.wink = !s.wink; paint(k); replay('is-hop'); }
      if (c.id === 'coffees') { paint(k); replay('is-pour'); }
      if (c.id === 'cart' && !s.dropped) { s.dropped = true; paint(k); replay('is-drop'); root.querySelector('.sh-hint').textContent = 'Full cart. It saves this way.'; }
      if (c.id === 'pie') {
        const dx = x - 540, dy = (y - 1000) / .62;
        if (Math.hypot(dx, dy) < 380) { let a = Math.atan2(dy, dx) + Math.PI / 2; if (a < 0) a += Math.PI * 2; let acc = 0; const j = d.pie.findIndex(p => (acc += p.share * Math.PI * 2) >= a); s.slice = j < 0 ? 0 : j; paint(k); root.querySelector('.sh-hint').textContent = `${d.pie[s.slice].label}: ${Math.round(d.pie[s.slice].share * 100)}% of my purchases.`; }
      }
      if (c.id === 'note') { s.open = !s.open; paint(k); root.querySelector('.sh-hint').textContent = s.open ? 'Opened. It saves this way.' : c.hint; }
    });

    // Save and share the card in view, in its current state
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      b.disabled = true;
      try {
        const c = cards[at], blob = await toPNG(c.draw(d, st[c.id]));
        const file = new File([blob], `faiit-${ctx.month.toLowerCase()}-${c.id}.png`, { type: 'image/png' });
        if (b.dataset.s === 'share' && navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: `My ${ctx.month} on Faiit` }); }
        else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); api.toast(b.dataset.s === 'share' ? 'Sharing isn’t available here, so the image was saved.' : 'Image saved'); }
      } catch (err) { if (err?.name !== 'AbortError') api.toast('Couldn’t make the image here. Try again.'); }
      finally { b.disabled = false; }
    });
  }

  window.FaiitShare = { mount, data, cards: CARDS, toPNG };
})();
