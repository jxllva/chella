/* Faiit share cards: 1080 × 1920 story cards, one object per card carrying the data.
   Share-safe by default: counts and shares only, never a dollar amount or a name.
   Each card is one SVG, used for the on-screen preview and for the saved image. */
(() => {
  const W = 1080, H = 1920;
  const INK = '#1d1b2e', CREAM = '#F6EBD9';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seeded = seed => { let h = seed >>> 0 || 1; return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; };
  // Type sizes are for a 1080 × 1920 card that's seen at ~360px wide: nothing under 34px, body copy 52px+.
  const foot = (fill, y = 1640, x = 540, anchor = 'middle') => `<text x="${x}" y="${y}" font-family="Courier Prime" font-weight="700" font-size="34" fill="${fill}" text-anchor="${anchor}" letter-spacing="2">chala · make yours</text>`;
  const svgOpen = (bg, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><defs>${extra}</defs><rect width="${W}" height="${H}" fill="${bg}"/>`;
  const wrapWords = (t, max) => { const out = []; let l = ''; String(t).split(' ').forEach(w => { if (l && (l + ' ' + w).length > max) { out.push(l); l = w; } else l = l ? l + ' ' + w : w; }); if (l) out.push(l); return out; };
  const para = (t, { x = 90, y, size, lh = Math.round(size * 1.22), max, fill, weight = 600, family = 'Bricolage Grotesque', anchor = 'start', style = '' }) =>
    wrapWords(t, max).map((l, i) => `<text x="${x}" y="${y + i * lh}" font-family="${family}" font-weight="${weight}" ${style ? `font-style="${style}"` : ''} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
  const label = (t, fill, y = 250, x = 90, anchor = 'start') => `<text x="${x}" y="${y}" font-family="Courier Prime" font-weight="700" font-size="40" fill="${fill}" letter-spacing="3" text-anchor="${anchor}">${esc(t)}</text>`;

  // ---------- 01 · Orders: a field of little takeout boxes, one per order ----------
  function orders(d, s) {
    const n = d.orders.n, show = Math.min(n, 40), rnd = seeded(n * 7 + 3);
    const cols = show > 24 ? 6 : 5, rows = Math.ceil(show / cols);
    const gx = 900 / cols, gy = Math.min(150, 700 / rows), sc = Math.min(1.25, gx / 120);
    const boxes = Array.from({ length: show }, (_, k) => {
      const c = k % cols, r = Math.floor(k / cols), x = 90 + gx * (c + .5) + (rnd() - .5) * 22, y = 860 + gy * (r + .5) + (rnd() - .5) * 18, rot = (rnd() - .5) * 30;
      const wink = s.wink && k % 3 === 0;
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(2)})"><g class="bx" style="--k:${k}">
        <path d="M-40 -26 L40 -26 L30 40 L-30 40 Z" fill="#D7F25A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-40 -26 L-30 -40 L30 -40 L40 -26" fill="#C3E24A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-12 -40 C-12 -58 12 -58 12 -40" fill="none" stroke="${INK}" stroke-width="3"/>
        ${wink ? `<path d="M-16 4 L-6 4" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` : `<circle cx="-11" cy="4" r="4.5" fill="${INK}"/>`}<circle cx="11" cy="4" r="4.5" fill="${INK}"/>
        <path d="M-10 16 Q0 26 10 16" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/></g></g>`;
    }).join('');
    return `${svgOpen('#9AA6F7')}
  ${label(`${d.when.toUpperCase()}`, INK)}
  <text x="70" y="560" font-family="Bricolage Grotesque" font-weight="800" font-size="320" fill="${INK}" letter-spacing="-16">${n}</text>
  <text x="${90 + String(n).length * 178}" y="555" font-family="Bricolage Grotesque" font-weight="700" font-size="84" fill="${INK}">${esc(d.orders.unit)}</text>
  ${para(d.orders.line, { y: 680, size: 56, max: 30, fill: INK })}
  ${boxes}
  ${n > show ? `<text x="990" y="1580" font-family="Bricolage Grotesque" font-weight="700" font-size="40" fill="${INK}" text-anchor="end">+${n - show} more</text>` : ''}
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
    const steam = s.steam ? [-170, -55, 60, 175].map(x => `<path class="st" d="M${x} -215 c-14 -24 14 -40 0 -64 c-14 -24 14 -40 0 -64" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" opacity=".8"/>`).join('') : '';
    return `${svgOpen('#171210')}
  <path d="M60 300 H560 L600 250 H1020 V1700 H60 Z" fill="#8B5224"/>
  <path d="M600 250 H900 L925 290 H580 Z" fill="#A86A33"/>
  <text x="755" y="282" font-family="Courier Prime" font-weight="700" font-size="30" fill="${CREAM}" text-anchor="middle" letter-spacing="4">CAFFEINE</text>
  ${label(d.when.toUpperCase(), CREAM, 420, 540, 'middle')}
  <text x="540" y="740" font-family="Bricolage Grotesque" font-weight="800" font-size="320" fill="${CREAM}" text-anchor="middle" letter-spacing="-12">${d.coffees.n}</text>
  <text x="540" y="870" font-family="Bricolage Grotesque" font-weight="700" font-size="110" fill="${CREAM}" text-anchor="middle">café ${d.coffees.n === 1 ? 'visit' : 'visits'}</text>
  <g transform="translate(540 1290)">
    <path d="M-330 40 L330 40 L300 120 L-300 120 Z" fill="#B88A5A" stroke="#3b2414" stroke-width="4"/>
    ${steam}${cup(-170, '#6B3E22')}${cup(-55, '#E9D7BF')}${cup(60, '#6B3E22')}${cup(175, '#E9D7BF')}
  </g>
  ${para(d.coffees.line, { x: 540, y: 1520, size: 56, max: 28, fill: CREAM, anchor: 'middle' })}
  ${foot(CREAM, 1780)}
</svg>`;
  }

  // ---------- 03 · Cart: receipts piled into a shopping cart, one per order ----------
  function cart(d, s) {
    const n = Math.min(d.cart.n, 16), rnd = seeded(d.cart.n * 13 + 5);
    const grid = `<pattern id="gp" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="#8C6CC9" stroke-width="2" opacity=".55"/></pattern>`;
    const papers = Array.from({ length: n }, (_, k) => {
      const x = 340 + rnd() * 440, y = 960 + rnd() * 200 - (k / n) * 120, r = (rnd() - .5) * 70;
      return `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${r.toFixed(0)})"><g class="rc" style="--k:${k}"><rect x="-90" y="-120" width="180" height="240" fill="#E6DAFA"/><rect x="-90" y="-120" width="180" height="240" fill="url(#gp)"/></g></g>`;
    }).join('');
    const top = `<g transform="translate(590 760) rotate(-6)"><g class="rc" style="--k:${n}"><rect x="-260" y="-130" width="520" height="250" fill="#F1EAFE"/><rect x="-260" y="-130" width="520" height="250" fill="url(#gp)"/>
      <text x="0" y="-6" font-family="Bricolage Grotesque" font-weight="800" font-size="96" fill="${INK}" text-anchor="middle">${d.cart.n} ${esc(d.cart.unit)}</text>
      <text x="0" y="76" font-family="Bricolage Grotesque" font-weight="600" font-size="60" fill="${INK}" text-anchor="middle">in this cart</text></g></g>`;
    return `${svgOpen('#CFE3F2', grid)}
  ${label(d.when.toUpperCase(), INK)}
  <text x="90" y="400" font-family="Bricolage Grotesque" font-weight="800" font-size="120" fill="${INK}" letter-spacing="-3">Just browsing.</text>
  ${para(`${d.cart.n} online orders arrived ${d.inWhen}.`, { y: 490, size: 56, max: 30, fill: INK })}
  ${s.dropped ? papers : ''}
  <g fill="none" stroke="#E23B2E" stroke-width="16" stroke-linejoin="round" stroke-linecap="round">
    <path d="M150 740 L230 740 L300 1280 L860 1280 L930 860 L262 860"/>
    <path d="M300 1280 L280 1400 L880 1400"/>
  </g>
  <g fill="none" stroke="#E23B2E" stroke-width="8" opacity=".85">${Array.from({ length: 7 }, (_, k) => `<line x1="${340 + k * 82}" y1="870" x2="${335 + k * 78}" y2="1272"/>`).join('')}<line x1="282" y1="1020" x2="905" y2="1020"/><line x1="296" y1="1160" x2="885" y2="1160"/></g>
  ${s.dropped ? top : ''}
  <circle cx="360" cy="1480" r="44" fill="${INK}"/><circle cx="800" cy="1480" r="44" fill="${INK}"/>
  ${s.dropped ? '' : `<text x="580" y="1090" font-family="Bricolage Grotesque" font-weight="700" font-size="56" fill="${INK}" text-anchor="middle">tap to fill the cart</text>`}
  ${foot(INK)}
</svg>`;
  }

  // ---------- 04 · Pie: what the money went on, by count, drawn like a cake ----------
  const SLICE = ['#E0483C', '#F3C74A', '#4FA35E', '#8A5BD6', '#2F6FE0', '#F6E7CC'];
  function pie(d, s) {
    const cx = 540, cy = 1060, r = 340, depth = 70; let a0 = -Math.PI / 2;
    const parts = d.pie.map((p, k) => { const a1 = a0 + p.share * Math.PI * 2, o = { ...p, a0, a1, c: SLICE[k % SLICE.length] }; a0 = a1; return o; });
    const arc = (p, rr, oy = 0) => { const x0 = cx + rr * Math.cos(p.a0), y0 = cy + oy + rr * Math.sin(p.a0) * .62, x1 = cx + rr * Math.cos(p.a1), y1 = cy + oy + rr * Math.sin(p.a1) * .62; return `M${cx} ${cy + oy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${rr} ${rr * .62} 0 ${p.a1 - p.a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`; };
    const order = parts.map((p, k) => k).sort((a, b) => (a === s.slice) - (b === s.slice));
    const slices = order.map(k => {
      const p = parts[k], mid = (p.a0 + p.a1) / 2, pop = s.slice === k ? 60 : 0, tx = Math.cos(mid) * pop, ty = Math.sin(mid) * pop * .62;
      return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)})"><path d="${arc(p, r, depth)}" fill="#6B3E2E" stroke="${INK}" stroke-width="3"/><path d="${arc(p, r)}" fill="${p.c}" stroke="${INK}" stroke-width="3"/></g>`;
    }).join('');
    const pick = parts[s.slice], top = d.pie.find(p => p.label !== 'Everything else') || d.pie[0];
    return `${svgOpen('#F4A7B9')}
  ${label(d.when.toUpperCase(), INK)}
  <text x="90" y="380" font-family="Bricolage Grotesque" font-weight="800" font-size="104" fill="${INK}" letter-spacing="-2">Where my</text>
  <text x="90" y="490" font-family="Bricolage Grotesque" font-weight="800" font-size="104" fill="${INK}" letter-spacing="-2">taps went</text>
  ${para(`${top.label}: ${Math.round(top.share * 100)}% of my purchases.`, { y: 590, size: 56, max: 30, fill: INK })}
  <ellipse cx="${cx}" cy="${cy + depth + 16}" rx="${r + 30}" ry="${(r + 30) * .62}" fill="${INK}" opacity=".12"/>
  ${slices}
  ${pick ? `<g transform="translate(540 1520)"><rect x="-380" y="-66" width="760" height="120" rx="60" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="-310" cy="-6" r="26" fill="${pick.c}" stroke="${INK}" stroke-width="3"/><text x="30" y="14" font-family="Bricolage Grotesque" font-weight="800" font-size="58" fill="${INK}" text-anchor="middle">${esc(pick.label)} · ${Math.round(pick.share * 100)}%</text></g>` : ''}
  ${foot(INK, 1700)}
</svg>`;
  }

  // ---------- 05 · The sealed goals: a maroon note with a red envelope ----------
  function note(d, s) {
    const up = s.open ? -230 : 0, gs = d.goals;
    return `${svgOpen('#6E0F14')}
  ${label(d.when.toUpperCase(), CREAM, 250, 540, 'middle')}
  <g font-family="Bricolage Grotesque" font-weight="800" font-size="120" fill="${CREAM}" text-anchor="middle" letter-spacing="-3"><text x="540" y="470">${gs.length ? 'Next up,' : 'Not every'}</text><text x="540" y="600">${gs.length ? 'I’m saving' : 'month is a'}</text><text x="540" y="730">${gs.length ? 'for these.' : 'plot twist.'}</text></g>
  <g transform="translate(0 ${up})"><rect x="200" y="980" width="680" height="480" fill="${CREAM}"/>
    <text x="540" y="1060" font-family="Courier Prime" font-weight="700" font-size="36" fill="#6E0F14" text-anchor="middle" letter-spacing="3">${gs.length ? 'SEALED GOALS' : 'NOTE TO SELF'}</text>
    ${gs.length ? gs.map((g, k) => `<circle cx="262" cy="${1132 + k * 82}" r="11" fill="#B71C25"/><text x="296" y="${1150 + k * 82}" font-family="Bricolage Grotesque" font-weight="700" font-size="52" fill="${INK}" text-anchor="start">${esc(g.length > 21 ? g.slice(0, 20) + '…' : g)}</text>`).join('') : `${para(d.note + '.', { x: 540, y: 1150, size: 58, max: 22, fill: INK, anchor: 'middle' })}`}</g>
  <path d="M170 1200 H910 V1620 H170 Z" fill="#B71C25"/>
  <path d="M170 1200 L540 1450 L910 1200" fill="#D1232E"/>
  <path d="M170 1620 L470 1400 M910 1620 L610 1400" stroke="#8E1219" stroke-width="5"/>
  ${s.open ? '' : `<circle cx="540" cy="1430" r="56" fill="${CREAM}"/><text x="540" y="1452" font-family="Bricolage Grotesque" font-weight="800" font-size="60" fill="#B71C25" text-anchor="middle">c</text>`}
  ${foot(CREAM, 1740)}
</svg>`;
  }

  const CARDS = [
    { id: 'orders', label: 'Orders', hint: 'Tap the card. They wink back.', draw: orders, has: d => d.orders.n > 0 },
    { id: 'coffees', label: 'Coffees', hint: 'Tap the cups for a fresh pour.', draw: coffees, has: d => d.coffees.n >= 3 },
    { id: 'cart', label: 'Cart', hint: 'Tap to fill the cart.', draw: cart, has: d => d.cart.n >= 2 },
    { id: 'pie', label: 'Where it went', hint: 'Tap a slice to pull it out.', draw: pie, has: d => d.pie.length >= 2 },
    { id: 'note', label: 'My goals', hint: 'Tap the seal to open it.', draw: note, has: () => true }
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
      when: /^my /.test(ctx.month) ? `my year · ${ctx.year}` : `${ctx.month} ${ctx.year}`,
      inWhen: /^my /.test(ctx.month) ? 'this year' : `in ${ctx.month}`,
      orders: delivery ? { n: ctx.del, unit: 'orders', line: `I ordered delivery ${ctx.del} times in ${/^my /.test(ctx.month) ? 'a year' : ctx.month}.` } : { n: ctx.villain.n, unit: 'visits', line: `${ctx.villain.name} saw me ${ctx.villain.n} times.` },
      coffees: { n: ctx.caf, line: ctx.cafDay != null ? `Coffee, matcha and boba. Mostly on ${days[ctx.cafDay]}.` : 'Coffee, matcha and boba. The barista knows.' },
      cart: { n: ctx.shop, unit: ctx.shop === 1 ? 'package' : 'packages' },
      pie: pie.map(([label, n]) => ({ label, share: n / total })),
      note: ctx.note || 'Same energy. It was a good month', goals: (ctx.goals || []).slice(0, 3),
      calm: ctx.noSpend ? `${ctx.noSpend} ${ctx.noSpend === 1 ? 'day' : 'days'} I spent nothing.` : 'An ordinary month. That counts too.'
    };
  }

  // ---------- saving: embed fonts so the PNG matches the preview ----------
  const INTER = 'fonts/inter-latin-wght-normal.woff2';
  const FONTS = [['Courier Prime', 'normal', 700, 'fonts/courier-prime-latin-700-normal.woff2'], ['Instrument Serif', 'normal', '100 900', INTER], ['Instrument Serif', 'italic', '100 900', INTER], ['Bricolage Grotesque', 'normal', '100 900', INTER]];
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
    <p class="ew-kicker">${esc(/^my /.test(ctx.month) ? `Your year · ${ctx.year}` : `${ctx.month} ${ctx.year}`)}</p>
    <h1 class="ew-h ew-h-sm">Unwrap it. <em>Then show it off.</em></h1>
    <p class="ew-sub sh-lede">${cards.length} cards made from your ${/^my /.test(ctx.month) ? 'year' : /–/.test(ctx.month) ? 'spending' : 'month'}. They show the story, never your amounts or names.</p>
    <div class="sh-parcel" aria-hidden="true"><span class="sh-string h"></span><span class="sh-string v"></span><svg class="sh-bow" viewBox="0 0 120 80"><path d="M60 40 C40 8 8 10 12 34 C16 56 44 52 60 40 Z M60 40 C80 8 112 10 108 34 C104 56 76 52 60 40 Z" fill="none" stroke="#E8352E" stroke-width="7" stroke-linejoin="round"/><path d="M56 44 L40 76 M64 44 L80 76" stroke="#E8352E" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="40" r="9" fill="#E8352E"/></svg><span class="sh-tag">From: ${esc(ctx.month)}<br>To: you</span></div>
    <div class="sh-slide" role="slider" tabindex="0" aria-label="Slide to unwrap" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <span class="sh-slide-label">Slide to <em>unwrap</em></span><span class="sh-knob" aria-hidden="true">→</span>
    </div>
  </div>
  <div class="sh-deck" hidden>
    <div class="sh-rail" role="list">${cards.map((c, k) => `<figure class="sh-card is-${c.id}" role="listitem" data-k="${k}"><button class="sh-tilt" aria-label="${esc(c.label)} card. ${esc(c.hint)}"><div class="sh-svg"></div></button><figcaption>${esc(c.label)}</figcaption></figure>`).join('')}</div>
    <div class="sh-dots" aria-hidden="true">${cards.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div>
    <p class="sh-hint" aria-live="polite"></p>
    <p class="sh-safe">Tap a card to open it full screen. Counts only. Dollar amounts and names never appear on shared cards.</p>
    <div class="sh-acts"><button class="ew-quiet" data-s="save">Save image</button><button class="ew-go" data-s="share">Share</button></div>
    <button class="ew-go sh-done" data-w="next">Done</button>
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

    // Tap a card: it opens full screen, where it can be played with, saved or shared
    rail.addEventListener('click', e => {
      const fig = e.target.closest('.sh-card'); if (!fig) return;
      view(d, cards, st, +fig.dataset.k, api, { month: ctx.month, onClose: k => { paintAll(); rail.children[k]?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' }); setAt(k); } });
    });
    root.addEventListener('click', async e => { const b = e.target.closest('[data-s]'); if (!b) return; b.disabled = true; await exportCard(cards[at], d, st, b.dataset.s, ctx.month, api); b.disabled = false; });
  }

  // ---------- each card's own interaction ----------
  function act(c, s, d, x, y) {
    if (c.id === 'orders') { s.wink = !s.wink; return { cls: 'is-hop' }; }
    if (c.id === 'coffees') return { cls: 'is-pour' };
    if (c.id === 'cart') { if (s.dropped) return null; s.dropped = true; return { cls: 'is-drop', hint: 'Full cart. It saves this way.' }; }
    if (c.id === 'pie') {
      const dx = x - 540, dy = (y - 1000) / .62; if (Math.hypot(dx, dy) >= 380) return null;
      let a = Math.atan2(dy, dx) + Math.PI / 2; if (a < 0) a += Math.PI * 2; let acc = 0; const j = d.pie.findIndex(p => (acc += p.share * Math.PI * 2) >= a); s.slice = j < 0 ? 0 : j;
      return { hint: `${d.pie[s.slice].label}: ${Math.round(d.pie[s.slice].share * 100)}% of my purchases.` };
    }
    if (c.id === 'note') { s.open = !s.open; return { hint: s.open ? 'Opened. It saves this way.' : c.hint }; }
    return null;
  }
  // ---------- sharing and saving ----------
  const ua = () => navigator.userAgent || '';
  const isIOS = () => /iPhone|iPad|iPod/.test(ua()) || (/Macintosh/.test(ua()) && navigator.maxTouchPoints > 1);
  const isAndroid = () => /Android/.test(ua());
  const isTouch = () => isIOS() || isAndroid() || matchMedia('(pointer: coarse)').matches;
  const canShareFile = file => { try { return !!navigator.canShare?.({ files: [file] }); } catch { return false; } };
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener'; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function shareFile(file, month) {
    await navigator.share({ files: [file], title: `My ${month} on chala`, text: `My ${month}, unwrapped. Made with chala.` });
  }
  async function exportCard(c, d, st, how, month, api) {
    let blob;
    try { blob = await toPNG(c.draw(d, st[c.id])); } catch { api.toast?.('Couldn’t make the image. Try again.'); return; }
    const file = new File([blob], `chala-${String(month).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${c.id}.png`, { type: 'image/png' });
    if (how === 'share') {
      if (canShareFile(file)) {
        try { await shareFile(file, month); return; }
        catch (err) { if (err?.name === 'AbortError') return; } // cancelled by the person: nothing else to do
      }
      saveSheet(blob, file, month, api, 'share'); return;
    }
    if (isTouch()) { saveSheet(blob, file, month, api, 'save'); return; }
    download(blob, file.name); api.toast?.('Image saved to your Downloads');
  }
  // A sheet with the finished image, so saving works the way each phone expects
  function saveSheet(blob, file, month, api, why) {
    document.querySelector('.sh-save')?.remove();
    const url = URL.createObjectURL(blob);
    const ios = isIOS(), android = isAndroid(), touch = isTouch();
    const how = ios ? 'Press and hold the image, then tap <b>Save to Photos</b>.' : android ? 'Press and hold the image, then tap <b>Download image</b>. It goes to your Photos or Gallery.' : 'Right-click the image and choose <b>Save image</b>, or use Download below.';
    const shareOk = canShareFile(file), copyOk = !!(window.ClipboardItem && navigator.clipboard?.write);
    const w = document.createElement('div'); w.className = 'sh-save'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-modal', 'true'); w.setAttribute('aria-labelledby', 'sh-save-t');
    w.innerHTML = `<div class="sh-save-panel">
  <div class="sh-save-head"><h2 id="sh-save-t">${why === 'share' ? 'Share your card' : 'Save your card'}</h2><button class="sh-v-x" data-k="close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  ${why === 'share' ? `<p class="sh-save-why">This browser can’t open your share sheet. Save the image, then post it from your ${ios || android ? 'Photos' : 'computer'}.</p>` : ''}
  <img class="sh-save-img" src="${url}" alt="Your chala card for ${esc(month)}">
  <p class="sh-save-how">${how}</p>
  <div class="sh-save-acts">
    ${shareOk && touch ? `<button class="sh-save-main" data-k="share">${ios ? 'Save to Photos or share' : 'Open share options'}</button>` : ''}
    <button class="${shareOk && touch ? 'sh-save-alt' : 'sh-save-main'}" data-k="download">Download image</button>
    ${copyOk ? `<button class="sh-save-alt" data-k="copy">Copy image</button>` : ''}
  </div>
</div>`;
    const close = () => { document.removeEventListener('keydown', key, true); w.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    w.addEventListener('click', async e => {
      if (e.target === w) { close(); return; }
      const b = e.target.closest('[data-k]'); if (!b) return;
      if (b.dataset.k === 'close') close();
      if (b.dataset.k === 'download') { download(blob, file.name); api.toast?.(touch ? (ios ? 'Downloaded. Find it in Files, or press and hold the image above to save to Photos.' : 'Downloaded. It’s in your Downloads and Photos.') : 'Image saved to your Downloads'); }
      if (b.dataset.k === 'share') { try { await shareFile(file, month); close(); } catch (err) { if (err?.name !== 'AbortError') api.toast?.('Sharing didn’t open. Press and hold the image instead.'); } }
      if (b.dataset.k === 'copy') { try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); api.toast?.('Image copied. Paste it into any app.'); } catch { api.toast?.('Couldn’t copy here. Press and hold the image instead.'); } }
    });
    document.addEventListener('keydown', key, true);
    document.body.append(w);
    w.querySelector('.sh-save-acts button')?.focus({ preventScroll: true });
    if (!reduce()) w.querySelector('.sh-save-panel').animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
  }

  // ---------- full-screen card: play with it, then save or share ----------
  function view(d, cards, st, k, api, opts = {}) {
    document.querySelector('.sh-view')?.remove();
    const prevFocus = document.activeElement;
    const v = document.createElement('div'); v.className = 'sh-view'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Share card');
    v.innerHTML = `
<div class="sh-v-top"><span class="sh-v-count" aria-live="polite"></span><button class="sh-v-x" data-v="close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
${opts.title ? `<p class="sh-v-title">${esc(opts.title)}</p>` : ''}
<div class="sh-v-stage">
  <button class="sh-v-arrow" data-v="prev" aria-label="Previous card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg></button>
  <button class="sh-v-card" data-v="card"><div class="sh-svg"></div></button>
  <button class="sh-v-arrow" data-v="next" aria-label="Next card"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg></button>
</div>
<p class="sh-v-hint" aria-live="polite"></p>
<div class="sh-v-acts"><button class="sh-v-save" data-v="save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11m-5-5 5 5 5-5"/><path d="M5 19.5h14"/></svg>Save image</button><button class="sh-v-share" data-v="share"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 13v6a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6"/></svg>Share</button></div>
<p class="sh-v-safe">Counts only. No dollar amounts or names.</p>`;
    const host = v.querySelector('.sh-svg'), cardBtn = v.querySelector('.sh-v-card');
    const paint = (cls) => {
      const c = cards[k]; host.innerHTML = c.draw(d, st[c.id]); host.firstElementChild.setAttribute('aria-hidden', 'true');
      cardBtn.setAttribute('aria-label', `${c.label} card. ${c.hint}`);
      v.querySelector('.sh-v-count').textContent = `${c.label} · ${k + 1} of ${cards.length}`;
      v.querySelectorAll('[data-v="prev"],[data-v="next"]').forEach(b => { b.disabled = b.dataset.v === 'prev' ? k === 0 : k === cards.length - 1; });
      if (cls) { host.classList.remove(cls); void host.offsetWidth; host.classList.add(cls); }
    };
    const go = dir => { const n = k + dir; if (n < 0 || n >= cards.length) return; k = n; paint(); v.querySelector('.sh-v-hint').textContent = cards[k].hint; if (!reduce()) cardBtn.animate([{ opacity: 0, transform: `translateX(${dir * 40}px) scale(.96)` }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }); };
    const close = () => { document.removeEventListener('keydown', key, true); prevFocus?.focus?.({ preventScroll: true }); const done = () => { v.remove(); opts.onClose?.(k); }; if (reduce()) done(); else v.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'ease-in', fill: 'forwards' }).finished.then(done, done); };
    const key = e => { if (document.querySelector('.sh-save')) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } if (e.key === 'ArrowRight') { e.stopPropagation(); go(1); } if (e.key === 'ArrowLeft') { e.stopPropagation(); go(-1); } };
    let sx = null, moved = false;
    cardBtn.addEventListener('pointerdown', e => { sx = e.clientX; moved = false; });
    cardBtn.addEventListener('pointermove', e => { if (sx !== null && Math.abs(e.clientX - sx) > 14) moved = true; });
    cardBtn.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
    v.addEventListener('click', async e => {
      const b = e.target.closest('[data-v]'); if (!b || b.disabled) return; const kind = b.dataset.v;
      if (kind === 'close') close();
      if (kind === 'prev') go(-1); if (kind === 'next') go(1);
      if (kind === 'card' && !moved) { const c = cards[k], r = host.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H; const res = act(c, st[c.id], d, x, y); if (res) { paint(res.cls); if (res.hint) v.querySelector('.sh-v-hint').textContent = res.hint; } }
      if (kind === 'save' || kind === 'share') { b.disabled = true; await exportCard(cards[k], d, st, kind, opts.month || d.month, api); b.disabled = false; }
    });
    document.addEventListener('keydown', key, true);
    document.body.append(v); paint(); v.querySelector('.sh-v-hint').textContent = cards[k].hint;
    if (!reduce()) { v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' }); cardBtn.animate([{ transform: 'translateY(30px) scale(.94)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)' }); }
    v.querySelector('.sh-v-share').focus({ preventScroll: true });
    return v;
  }
  // Open one card full screen from anywhere (used when someone screenshots the Wrapped)
  function open(ctx, id, api, opts = {}) {
    const d = data(ctx), cards = CARDS.filter(c => c.has(d)), st = { orders: { wink: false }, coffees: { steam: true }, cart: { dropped: true }, pie: { slice: 0 }, note: { open: true } };
    const k = Math.max(0, cards.findIndex(c => c.id === id));
    return view(d, cards, st, k, api, { month: ctx.month, ...opts });
  }

  window.FaiitShare = { mount, data, cards: CARDS, toPNG, open };
})();
