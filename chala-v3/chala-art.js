/* chala v3 — illustrations (ported from chala.html; original left untouched). */

/* Money Wrapped — flat, hand-built SVG illustrations (no stock, no AI renders).
   Colours: fixed "object" colours + the slide's hue via CSS variables (--m mid, --d deep, --n neon, --acc). */
window.MW = window.MW || {};

(function () {
  const INK = '#2B2233', PAPER = '#FFFDF6', CREAM = '#FFF4E2', LINE = '#E3D8C8', KRAFT = '#D9A56B', KRAFT2 = '#C08A4E';
  const shadow = (cx, w, y) => `<ellipse class="art-shadow" cx="${cx}" cy="${y || 288}" rx="${w}" ry="10" fill="rgba(30,20,40,.14)"/>`;
  const zig = (x, y, w, h, t = 7) => {
    let p = `M${x} ${y} h${w} v${h}`;
    const n = Math.round(w / (t * 2));
    const s = w / n;
    for (let i = 0; i < n; i++) p += ` l${-s / 2} ${t} l${-s / 2} ${-t}`;
    return p + ' Z';
  };
  const barcode = (x, y, w, h, c) => {
    let out = '', cx = x, i = 0;
    while (cx < x + w) { const bw = [1.2, 2.4, 1.2, 3.2, 1.6][i % 5]; out += `<rect x="${cx}" y="${y}" width="${bw}" height="${h}" fill="${c}"/>`; cx += bw + [1.6, 1.2, 2.2, 1.4][i % 4]; i++; }
    return out;
  };
  const lines = (x, y, w, rows, gap = 12) => rows.map((r, i) => `<rect x="${x}" y="${y + i * gap}" width="${w * r}" height="4" rx="2" fill="${LINE}"/>`).join('');
  const checker = (x, y, cols, rows, s, a, b) => {
    let o = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) o += `<rect x="${x + c * s}" y="${y + r * s}" width="${s}" height="${s}" style="fill:${(r + c) % 2 ? a : b}"/>`;
    return o;
  };
  const svg = (body, vb) => `<svg class="art" viewBox="${vb || '0 0 320 300'}" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${body}</svg>`;

  MW.ART = {
    receipts() {
      const r = (x, rot, d, extra) => `<g class="a-fan" style="--r:${rot}deg;--d:${d}s">
        <path d="${zig(x, 40, 112, 178)}" fill="${PAPER}" stroke="#EADFCF" stroke-width="1.5"/>
        ${lines(x + 14, 62, 84, [.5, .9, .7, .8, .6, .85])}
        <rect x="${x + 14}" y="140" width="84" height="2" fill="${LINE}"/>
        <rect x="${x + 14}" y="150" width="40" height="7" rx="2" fill="#CDBFAD"/><rect x="${x + 70}" y="150" width="28" height="7" rx="2" fill="#CDBFAD"/>
        ${barcode(x + 16, 170, 80, 22, '#3A3140')}${extra || ''}</g>`;
      return svg(`${shadow(160, 118)}
        ${r(54, -16, .05)}${r(168, 14, .12)}${r(104, -2, .2, `<path d="M${180} 30 q16 -4 18 14 l2 46 q1 12 -10 12 q-11 0 -11 -12 l-1 -40" fill="none" stroke="#A891FF" stroke-width="5" stroke-linecap="round"/>`)}
        <g class="a-slide" style="--d:.5s"><g transform="rotate(-8 130 238)">
          <rect x="62" y="190" width="150" height="94" rx="12" style="fill:var(--n)"/>
          <rect x="62" y="210" width="150" height="14" style="fill:var(--d);opacity:.35"/>
          <rect x="78" y="236" width="26" height="20" rx="4" fill="#F4C96B"/><path d="M78 246h26M91 236v20" stroke="#C99A3C" stroke-width="1.4"/>
          <rect x="150" y="262" width="46" height="6" rx="3" fill="rgba(255,255,255,.7)"/></g></g>
        <g class="a-slide" style="--d:.62s"><g transform="rotate(10 236 250)">
          <rect x="186" y="214" width="112" height="70" rx="10" fill="#F7A6A0"/>
          <circle cx="212" cy="249" r="7" fill="#D9534F" opacity=".75"/><circle cx="231" cy="249" r="7" fill="#D9534F" opacity=".75"/><circle cx="250" cy="249" r="7" fill="#D9534F" opacity=".75"/>
          <rect x="266" y="238" width="18" height="22" rx="3" fill="#A33C38" opacity=".8"/></g></g>`);
    },

    delivery(n) {
      return svg(`${shadow(160, 132)}
        <g class="a-drop" style="--d:.1s">
          <path d="M70 120 L190 120 L198 284 L62 284 Z" fill="${KRAFT}"/>
          <path d="M70 120 L190 120 L186 146 L74 146 Z" fill="${KRAFT2}"/>
          <path d="M74 146 L186 146 L182 162 L78 162 Z" fill="${KRAFT}" opacity=".9"/>
          <path d="M96 120 q34 -40 68 0" fill="none" stroke="${KRAFT2}" stroke-width="7" stroke-linecap="round"/>
          <path d="M70 120 L62 284" stroke="rgba(0,0,0,.08)" stroke-width="10"/>
          <g transform="rotate(-6 128 214)"><rect x="98" y="176" width="62" height="78" fill="${PAPER}"/>${lines(106, 190, 46, [.8, .55, .9, .6], 11)}<rect x="106" y="236" width="46" height="5" fill="#CDBFAD"/></g>
          <rect x="120" y="170" width="16" height="4" rx="1" fill="#9C9AA8"/>
          <circle cx="94" cy="262" r="16" style="fill:var(--n)"/><path d="M88 255v14M94 255v14M100 255v14M87 262h14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g class="a-drop" style="--d:.3s">
          <path d="M206 196 L284 196 L276 284 L214 284 Z" fill="#FFFFFF"/>
          <path d="M206 196 L284 196 L278 212 L212 212 Z" fill="#EFE9F7"/>
          <path d="M230 196 L245 176 L260 196" fill="none" stroke="#D9D2E4" stroke-width="3"/>
          <rect x="212" y="232" width="66" height="12" style="fill:var(--m)"/>
        </g>
        <g class="a-pop" style="--d:.75s">
          <rect x="150" y="44" width="160" height="56" rx="16" fill="#FFFFFF" stroke="rgba(0,0,0,.06)"/>
          <circle cx="176" cy="72" r="13" style="fill:var(--n)"/><path d="M170 72l4 4 8 -8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="196" y="68" font-size="12" font-weight="700" fill="${INK}" style="font-family:var(--f-text)">Order #${n || 24}</text>
          <text x="196" y="84" font-size="11" fill="#7A7186" style="font-family:var(--f-text)">is 2 min away</text>
        </g>`);
    },

    matcha() {
      return svg(`${shadow(160, 130)}
        <g class="a-drop" style="--d:.1s">
          <path d="M84 96 L190 96 L178 284 L96 284 Z" fill="rgba(255,255,255,.5)" stroke="rgba(255,255,255,.95)" stroke-width="3"/>
          <path d="M92 178 L182 178 L178 284 L96 284 Z" fill="#8DBA59"/>
          <path d="M90 150 L184 150 L182 182 L92 182 Z" fill="#F3EFDF"/>
          <path d="M92 182 q20 -14 44 0 t46 0" fill="#B4D27E" opacity=".9"/>
          <path d="M100 210 q18 10 30 -4 q14 -12 30 6" fill="none" stroke="#E9F3D8" stroke-width="5" stroke-linecap="round" opacity=".6"/>
          <g class="a-bob" style="--d:0s"><rect x="104" y="122" width="30" height="30" rx="7" fill="rgba(255,255,255,.75)" transform="rotate(-12 119 137)"/></g>
          <g class="a-bob" style="--d:.6s"><rect x="142" y="114" width="28" height="28" rx="7" fill="rgba(255,255,255,.7)" transform="rotate(16 156 128)"/></g>
          <path d="M76 96 q61 -44 122 0 Z" fill="rgba(255,255,255,.65)" stroke="rgba(255,255,255,.95)" stroke-width="3"/>
          <rect x="74" y="92" width="126" height="10" rx="5" fill="rgba(255,255,255,.95)"/>
          <g class="a-wiggle" style="--d:.4s"><rect x="150" y="18" width="12" height="96" rx="6" style="fill:var(--n)" transform="rotate(14 156 66)"/></g>
        </g>
        <g class="a-drop" style="--d:.28s">
          <path d="M206 150 L292 150 L282 284 L216 284 Z" fill="${CREAM}"/>
          <path d="M209 186 L289 186 L285 246 L213 246 Z" style="fill:var(--m)"/>
          <path d="M210 206 q20 -12 40 0 t38 0" fill="none" stroke="${CREAM}" stroke-width="7" opacity=".8"/>
          <path d="M212 228 q20 -12 40 0 t36 0" fill="none" stroke="${CREAM}" stroke-width="7" opacity=".6"/>
          <rect x="200" y="136" width="98" height="18" rx="8" fill="#3A2B3F"/>
          <path d="M212 136 q37 -22 74 0" fill="#4A3950"/>
          <g class="a-steam" style="--d:0s"><path d="M236 116 q-8 -14 0 -26 q8 -12 0 -24" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="4" stroke-linecap="round"/></g>
          <g class="a-steam" style="--d:.9s"><path d="M258 118 q-8 -14 0 -26 q8 -12 0 -24" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="4" stroke-linecap="round"/></g>
        </g>
        <g class="a-pop" style="--d:.8s"><path d="M48 252 q10 -26 34 -26 q-2 24 -34 26 z" fill="#7FAF4E"/><path d="M50 250 q14 -12 28 -20" stroke="#5E8C36" stroke-width="2" fill="none"/></g>`);
    },

    tag(text) {
      const t = (text || 'ADD TO CART.').split(' ');
      return svg(`${shadow(160, 126)}
        <g class="a-slide" style="--d:.05s"><g transform="rotate(-4 160 190)">${checker(40, 96, 12, 10, 20, 'var(--m)', 'color-mix(in srgb, var(--m) 35%, white)')}</g></g>
        <g class="a-swing" style="--d:.25s">
          <path d="M160 10 L160 70" stroke="#E9E2F5" stroke-width="3"/>
          <path d="M96 92 L128 62 L192 62 L224 92 L224 282 L96 282 Z" style="fill:var(--n)"/>
          <circle cx="160" cy="84" r="8" fill="${PAPER}"/><circle cx="160" cy="84" r="4" style="fill:var(--m)"/>
          ${t.map((w, i) => `<text x="160" y="${150 + i * 36}" text-anchor="middle" font-size="32" font-weight="900" fill="${PAPER}" textLength="${Math.min(104, w.length * 22)}" lengthAdjust="spacingAndGlyphs" style="font-family:var(--f-num)">${w}</text>`).join('')}
          ${barcode(116, 254, 88, 14, PAPER)}
        </g>`);
    },

    phone() {
      const cols = ['#FF8FB8', 'var(--n)', '#FFD25E', '#7ED7B5', '#9FB4FF', '#FF9E6B', '#C7A6FF', '#5ED0F2', '#FFB3C9'];
      const glyph = ['<circle cx="0" cy="0" r="7" fill="#fff"/>', '<path d="M-5 -7 L7 0 L-5 7 Z" fill="#fff"/>', '<path d="M-6 4 V-6 L6 -8 V2" stroke="#fff" stroke-width="2.5" fill="none"/><circle cx="-6" cy="4" r="3" fill="#fff"/><circle cx="6" cy="2" r="3" fill="#fff"/>',
        '<rect x="-7" y="-7" width="14" height="14" rx="3" fill="none" stroke="#fff" stroke-width="2.5"/>', '<path d="M-7 3 a7 7 0 0 1 14 0" stroke="#fff" stroke-width="2.5" fill="none"/>', '<path d="M0 -8 L2 -2 L8 -2 L3 2 L5 8 L0 4 L-5 8 L-3 2 L-8 -2 L-2 -2 Z" fill="#fff"/>',
        '<circle cx="0" cy="0" r="7" fill="none" stroke="#fff" stroke-width="2.5"/>', '<path d="M-7 0 h14 M0 -7 v14" stroke="#fff" stroke-width="2.5"/>', '<path d="M-6 -6 L6 6 M6 -6 L-6 6" stroke="#fff" stroke-width="2.5"/>'];
      let tiles = '';
      for (let i = 0; i < 9; i++) {
        const x = 112 + (i % 3) * 34, y = 92 + Math.floor(i / 3) * 40;
        tiles += `<g transform="translate(${x + 13} ${y + 13})"><rect x="-13" y="-13" width="26" height="26" rx="7" style="fill:${cols[i]}"/>${glyph[i]}</g>`;
        if (i < 5) tiles += `<g class="a-pop" style="--d:${.6 + i * .12}s"><circle cx="${x + 26}" cy="${y}" r="7" fill="#FF3B30"/><text x="${x + 26}" y="${y + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" style="font-family:var(--f-text)">1</text></g>`;
      }
      return svg(`${shadow(160, 92)}
        <g class="a-drop" style="--d:.1s">
          <rect x="96" y="30" width="128" height="254" rx="26" fill="#1E1A24"/>
          <rect x="103" y="37" width="114" height="240" rx="20" fill="#F6F3FF"/>
          <rect x="140" y="44" width="40" height="9" rx="4.5" fill="#1E1A24"/>
          ${tiles}
          <rect x="112" y="222" width="96" height="40" rx="10" fill="#fff"/>
          <text x="122" y="238" font-size="9" font-weight="700" fill="${INK}" style="font-family:var(--f-text)">Subscription renewed</text>
          <text x="122" y="252" font-size="8.5" fill="#7A7186" style="font-family:var(--f-text)">You were charged again</text>
        </g>`);
    },

    wallet() {
      return svg(`${shadow(160, 120)}
        <g class="a-drop" style="--d:.1s">
          <rect x="60" y="150" width="200" height="132" rx="20" style="fill:var(--d)"/>
          <rect x="60" y="150" width="200" height="40" rx="20" style="fill:var(--n)"/>
          <rect x="70" y="126" width="120" height="54" rx="6" fill="${PAPER}" transform="rotate(-6 130 153)"/>
          <text x="86" y="150" font-size="12" font-weight="700" fill="#9A8FA6" transform="rotate(-6 130 153)" style="font-family:var(--f-text)">IOU: everything</text>
          <rect x="196" y="200" width="78" height="46" rx="12" style="fill:var(--n)"/>
          <circle cx="222" cy="223" r="9" fill="${PAPER}"/>
        </g>
        <g class="a-flutter" style="--d:.7s">
          <ellipse cx="200" cy="86" rx="20" ry="14" fill="#E9DCC9" transform="rotate(-24 200 86)"/>
          <ellipse cx="228" cy="86" rx="20" ry="14" fill="#DCCBB3" transform="rotate(24 228 86)"/>
          <ellipse cx="214" cy="90" rx="5" ry="13" fill="#8C7A66"/>
          <path d="M211 78 q-6 -10 -12 -12 M217 78 q6 -10 12 -12" stroke="#8C7A66" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>
        <g class="a-spin" style="--d:.9s"><circle cx="92" cy="272" r="14" fill="#F4C96B"/><circle cx="92" cy="272" r="9" fill="none" stroke="#D9A53E" stroke-width="2"/></g>`);
    },

    stove() {
      return svg(`${shadow(160, 128)}
        <g class="a-drop" style="--d:.1s">
          <rect x="54" y="96" width="212" height="188" rx="12" fill="#F2EEF6"/>
          <rect x="54" y="96" width="212" height="44" rx="12" fill="#2E2836"/>
          <circle cx="104" cy="118" r="14" fill="none" stroke="#5A5164" stroke-width="5"/><circle cx="160" cy="118" r="10" fill="none" stroke="#5A5164" stroke-width="5"/><circle cx="214" cy="118" r="14" fill="none" stroke="#5A5164" stroke-width="5"/>
          <circle cx="86" cy="160" r="7" fill="#C9C1D4"/><circle cx="112" cy="160" r="7" fill="#C9C1D4"/><circle cx="208" cy="160" r="7" fill="#C9C1D4"/><circle cx="234" cy="160" r="7" fill="#C9C1D4"/>
          <rect x="78" y="180" width="164" height="86" rx="10" fill="#2E2836"/>
          <rect x="92" y="194" width="136" height="58" rx="8" style="fill:var(--m);opacity:.55"/>
          <rect x="120" y="170" width="80" height="6" rx="3" fill="#C9C1D4"/>
          <g class="a-pop" style="--d:.7s"><rect x="186" y="200" width="60" height="44" rx="4" fill="#FFE97A" transform="rotate(8 216 222)"/><text x="216" y="220" text-anchor="middle" font-size="9" font-weight="800" fill="${INK}" transform="rotate(8 216 222)" style="font-family:var(--f-text)">who is</text><text x="216" y="232" text-anchor="middle" font-size="9" font-weight="800" fill="${INK}" transform="rotate(8 216 222)" style="font-family:var(--f-text)">she?</text></g>
        </g>
        <g class="a-pop" style="--d:.5s" stroke="rgba(255,255,255,.95)" stroke-width="1.6" fill="none">
          <path d="M266 96 L218 96 M266 96 L266 50 M266 96 L230 60 M266 96 L248 52 M266 96 L224 78"/>
          <path d="M226 96 q8 -6 6 -16 q8 2 14 -6 q4 8 12 8 q-2 8 4 14"/><path d="M240 96 q4 -4 3 -9 q5 1 8 -4 q3 5 7 5"/>
        </g>
        <g class="a-swing" style="--d:.9s"><path d="M244 60 V20" stroke="rgba(255,255,255,.9)" stroke-width="1.2"/><circle cx="244" cy="64" r="5" fill="#2E2836"/><path d="M238 61l-5 -3 M238 65l-6 0 M250 61l5 -3 M250 65l6 0" stroke="#2E2836" stroke-width="1.4"/></g>`);
    },

    split() {
      const p = (x, y, w, h, dx, dy, d, lbl) => `<g class="a-split" style="--dx:${dx}px;--dy:${dy}px;--d:${d}s"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" style="fill:var(--n)"/><text x="${x + w / 2}" y="${y + h / 2 + 7}" text-anchor="middle" font-size="20" font-weight="900" fill="rgba(255,255,255,.95)" style="font-family:var(--f-num)">${lbl}</text></g>`;
      return svg(`${shadow(160, 120)}
        <g transform="rotate(-6 160 190)">
          ${p(70, 110, 88, 76, -10, -10, .3, '1/4')}${p(162, 110, 88, 76, 10, -10, .42, '2/4')}${p(70, 190, 88, 76, -10, 10, .54, '3/4')}${p(162, 190, 88, 76, 10, 10, .66, '4/4')}
          <rect x="84" y="128" width="26" height="20" rx="4" fill="#F4C96B" class="a-split" style="--dx:-10px;--dy:-10px;--d:.3s"/>
        </g>
        <g class="a-pop" style="--d:.9s"><rect x="196" y="40" width="96" height="40" rx="20" fill="#fff"/><text x="244" y="65" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" style="font-family:var(--f-text)">due Friday</text></g>`);
    },

    piggy() {
      return svg(`${shadow(160, 112)}
        <g class="a-wobble" style="--d:.2s">
          <ellipse cx="160" cy="192" rx="98" ry="72" style="fill:var(--m)"/>
          <ellipse cx="250" cy="190" rx="22" ry="20" style="fill:var(--n)"/><circle cx="244" cy="188" r="3.5" fill="${INK}" opacity=".6"/><circle cx="256" cy="188" r="3.5" fill="${INK}" opacity=".6"/>
          <path d="M196 128 l14 -28 l14 34 z" style="fill:var(--n)"/>
          <circle cx="212" cy="168" r="5" fill="${INK}"/>
          <path d="M206 154 q6 -4 12 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          <rect x="128" y="122" width="44" height="8" rx="4" style="fill:var(--d)"/>
          <rect x="96" y="246" width="22" height="30" rx="8" style="fill:var(--n)"/><rect x="190" y="246" width="22" height="30" rx="8" style="fill:var(--n)"/>
          <path d="M62 184 q-22 -10 -14 -28 q8 -12 18 0" stroke="var(--n)" style="stroke:var(--n)" stroke-width="6" fill="none" stroke-linecap="round"/>
          <g transform="rotate(-24 128 196)"><rect x="96" y="184" width="66" height="24" rx="6" fill="#FFE1C7"/><circle cx="114" cy="196" r="2" fill="#E2B591"/><circle cx="124" cy="196" r="2" fill="#E2B591"/><circle cx="134" cy="196" r="2" fill="#E2B591"/><circle cx="144" cy="196" r="2" fill="#E2B591"/></g>
          <g transform="rotate(30 128 196)"><rect x="96" y="184" width="66" height="24" rx="6" fill="#FFE1C7" opacity=".95"/></g>
        </g>
        <g class="a-fall" style="--d:.8s"><circle cx="72" cy="120" r="12" fill="#F4C96B"/><text x="72" y="125" text-anchor="middle" font-size="13" font-weight="900" fill="#B9862C" style="font-family:var(--f-text)">$</text></g>`);
    },

    calendar(day, date) {
      return svg(`${shadow(160, 110)}
        <g class="a-drop" style="--d:.1s">
          <rect x="70" y="70" width="180" height="210" rx="18" fill="${PAPER}"/>
          <rect x="70" y="70" width="180" height="58" rx="18" style="fill:var(--n)"/><rect x="70" y="110" width="180" height="18" style="fill:var(--n)"/>
          <circle cx="112" cy="70" r="7" fill="#3A2B3F"/><circle cx="208" cy="70" r="7" fill="#3A2B3F"/>
          <rect x="108" y="54" width="8" height="24" rx="4" fill="#B9AFC6"/><rect x="204" y="54" width="8" height="24" rx="4" fill="#B9AFC6"/>
          <text x="160" y="110" text-anchor="middle" font-size="22" font-weight="800" fill="#fff" style="font-family:var(--f-text);letter-spacing:.1em">${day}</text>
          <text x="160" y="232" text-anchor="middle" font-size="96" font-weight="900" style="fill:var(--d);font-family:var(--f-num)">${date}</text>
        </g>
        <g class="a-flip" style="--d:.7s"><rect x="70" y="128" width="180" height="152" rx="10" fill="#F1EADF"/><text x="160" y="232" text-anchor="middle" font-size="96" font-weight="900" fill="#D9CFBF" style="font-family:var(--f-num)">${date - 1 || 31}</text></g>`);
    },

    ribbon(label) {
      let star = '';
      const n = 28, cx = 160, cy = 130;
      for (let i = 0; i < n * 2; i++) { const r = i % 2 ? 78 : 92, a = (Math.PI * i) / n; star += `${i ? 'L' : 'M'}${cx + r * Math.cos(a)} ${cy + r * Math.sin(a)} `; }
      return svg(`${shadow(160, 80)}
        <g class="a-swing" style="--d:.15s">
          <path d="M120 180 L96 284 L126 268 L146 292 L160 196 Z" style="fill:var(--d)"/>
          <path d="M200 180 L224 284 L194 268 L174 292 L160 196 Z" style="fill:var(--n)"/>
          <path d="${star}Z" style="fill:var(--n)"/>
          <circle cx="${cx}" cy="${cy}" r="66" style="fill:var(--d)"/>
          <circle cx="${cx}" cy="${cy}" r="56" fill="${PAPER}"/>
          <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="13" font-weight="800" fill="#8E8499" style="font-family:var(--f-text);letter-spacing:.14em">BEST IN</text>
          <text x="${cx}" y="${cy + 26}" text-anchor="middle" font-size="${(label || 'SHOW').length > 4 ? 25 : 32}" textLength="${Math.min(96, (label || 'SHOW').length * 22)}" lengthAdjust="spacingAndGlyphs" font-weight="900" style="fill:var(--d);font-family:var(--f-num)">${label || 'SHOW'}</text>
          <clipPath id="mw-rib-clip"><circle cx="${cx}" cy="${cy}" r="66"/></clipPath>
          <g clip-path="url(#mw-rib-clip)"><path class="a-shine" d="M100 40 L134 40 L94 220 L60 220 Z" fill="rgba(255,255,255,.4)"/></g>
        </g>`);
    },
  };
})();



/* Money Wrapped — scene illustrations for the Wrapped + Monthly Recap scripts.
   Flat colours, simple shapes, one idea per picture. Slide hue comes in through --m / --d / --n. */
window.MW = window.MW || {};

(function () {
  const INK = '#2B2233', PAPER = '#FFFDF6', LINE = '#E3D8C8', KRAFT = '#D9A56B', KRAFT2 = '#C08A4E',
    RED = '#E2453C', RED2 = '#B52F2A', GOLD = '#F2C14E', GOLD2 = '#C9962A', SKIN = '#F1C3A5', SKIN2 = '#E2A585', GREEN = '#8DBA59', GREEN2 = '#5F8F35';
  const svg = b => `<svg class="art" viewBox="0 0 320 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${b}</svg>`;
  const shadow = (cx, w, y) => `<ellipse class="art-shadow" cx="${cx}" cy="${y || 288}" rx="${w}" ry="9" fill="rgba(30,20,40,.14)"/>`;
  const T = (x, y, s, size, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.w || 800}" fill="${o.f || INK}" text-anchor="${o.a || 'middle'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.len ? ` textLength="${o.len}" lengthAdjust="spacingAndGlyphs"` : ''} style="font-family:var(--f-text)">${s}</text>`;
  const lines = (x, y, w, rows, gap = 12, c = LINE) => rows.map((r, i) => `<rect x="${x}" y="${y + i * gap}" width="${w * r}" height="4" rx="2" fill="${c}"/>`).join('');
  const zig = (x, y, w, h, t = 7) => { let p = `M${x} ${y} h${w} v${h}`; const n = Math.round(w / (t * 2)), s = w / n; for (let i = 0; i < n; i++) p += ` l${-s / 2} ${t} l${-s / 2} ${-t}`; return p + ' Z'; };
  /* wrap: animation lives on the outer <g>, placement on the inner one (CSS transforms override SVG transforms) */
  const A = (cls, d, inner, extra) => `<g class="${cls}" style="--d:${d || 0}s${extra ? ';' + extra : ''}">${inner}</g>`;
  const at = (x, y, s, inner, rot) => `<g transform="translate(${x} ${y}) scale(${s})${rot ? ` rotate(${rot})` : ''}">${inner}</g>`;

  /* ---------- reusable parts (drawn around bottom-centre 0,0) ---------- */
  const BAG = `<path d="M-60 -164 L60 -164 L68 0 L-68 0 Z" fill="${KRAFT}"/>
    <path d="M-60 -164 L60 -164 L56 -138 L-56 -138 Z" fill="${KRAFT2}"/>
    <path d="M-34 -164 q34 -40 68 0" fill="none" stroke="${KRAFT2}" stroke-width="7" stroke-linecap="round"/>
    <path d="M-60 -164 L-68 0" stroke="rgba(0,0,0,.07)" stroke-width="10"/>
    <g transform="rotate(-6 -2 -70)"><rect x="-32" y="-108" width="60" height="74" fill="${PAPER}"/>${lines(-24, -94, 44, [.8, .55, .9, .6], 11)}</g>
    <circle cx="-36" cy="-22" r="15" style="fill:var(--n)"/><path d="M-41 -29v14M-36 -29v14M-31 -29v14" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
  const CUP = `<path d="M-53 -188 L53 -188 L41 0 L-41 0 Z" fill="rgba(255,255,255,.55)" stroke="#fff" stroke-width="3"/>
    <path d="M-46 -104 L46 -104 L41 0 L-41 0 Z" fill="${GREEN}"/>
    <path d="M-48 -134 L48 -134 L46 -100 L-46 -100 Z" fill="#F3EFDF"/>
    <rect x="-60" y="-202" width="120" height="16" rx="7" fill="#fff"/>
    <path d="M10 -202 L26 -262" stroke="${GREEN2}" stroke-width="9" stroke-linecap="round"/>
    <rect x="-41" y="-74" width="82" height="22" fill="${INK}" opacity=".85"/>`;
  const BOX = (w = 120, h = 90) => `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx="4" fill="${KRAFT}"/>
    <rect x="${-w / 2}" y="${-h}" width="${w}" height="16" fill="${KRAFT2}" opacity=".7"/>
    <rect x="-9" y="${-h}" width="18" height="${h}" fill="#E8C089" opacity=".8"/>
    <rect x="${w / 2 - 38}" y="-30" width="28" height="18" rx="2" fill="${PAPER}"/>`;
  const POST = (x, h = 86) => `<rect x="${x - 4}" y="${288 - h}" width="8" height="${h}" rx="3" fill="${GOLD2}"/><circle cx="${x}" cy="${288 - h}" r="9" fill="${GOLD}"/><ellipse cx="${x}" cy="286" rx="18" ry="5" fill="${GOLD2}"/>`;
  const ROPE = (x1, x2, y, sag = 26) => `<path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + sag} ${x2} ${y}" fill="none" stroke="${RED}" stroke-width="9" stroke-linecap="round"/><path d="M${x1} ${y} Q${(x1 + x2) / 2} ${y + sag} ${x2} ${y}" fill="none" stroke="${RED2}" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"/>`;
  const STAR = (cx, cy, r, f) => { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; p += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return `<path d="${p}Z" fill="${f || GOLD}" stroke="${GOLD2}" stroke-width="2" stroke-linejoin="round"/>`; };
  const SPARK = (x, y, s) => `<path d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="#fff"/>`;
  const THUMB = `<rect x="-46" y="-230" width="92" height="250" rx="46" fill="${SKIN}"/><rect x="-32" y="-218" width="64" height="70" rx="30" fill="#FBE3D6"/><path d="M-30 -120 q30 10 60 0" stroke="${SKIN2}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const DRESS = `<path d="M0 -196 q0 -14 10 -14" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M-46 -170 L0 -192 L46 -170" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-22 -176 L22 -176 L28 -120 L62 0 L-62 0 L-28 -120 Z" style="fill:var(--n)"/><path d="M-28 -120 L28 -120" stroke="rgba(255,255,255,.7)" stroke-width="5"/>
    <path d="M-22 -176 Q0 -160 22 -176" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="3"/>${SPARK(-20, -60, 7)}${SPARK(24, -30, 5)}${SPARK(8, -92, 5)}`;
  const credits = (x, y, w, rows, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${rows.length * 26 + 30}" rx="12" fill="${INK}"/>
    <g class="${cls || ''}">${rows.map((r, i) => `${T(x + 16, y + 30 + i * 26, r[0], 11, { a: 'start', f: '#fff', w: 700, ls: 1 })}${T(x + w - 16, y + 30 + i * 26, r[1], 11, { a: 'end', f: GOLD, w: 800 })}`).join('')}</g>`;
  const ENV = (label, amt) => `<rect x="-46" y="-64" width="92" height="64" rx="6" fill="${PAPER}" stroke="${LINE}" stroke-width="2"/>
    <path d="M-46 -64 L0 -30 L46 -64" fill="none" stroke="${LINE}" stroke-width="2"/>
    <circle cx="22" cy="-70" r="13" fill="${GOLD}" stroke="${GOLD2}" stroke-width="2"/>
    ${T(0, -10, label, 10, { w: 800, ls: 1 })}${T(0, 26, amt, 17)}`;
  const POT = (depth, label, amt) => `<path d="M-46 ${-depth} L46 ${-depth} L38 0 L-38 0 Z" style="fill:var(--n)"/><path d="M-46 ${-depth} L-38 0" stroke="rgba(0,0,0,.12)" stroke-width="8"/><rect x="-52" y="${-depth - 8}" width="104" height="12" rx="6" fill="${INK}" opacity=".85"/>
    <g class="a-drop" style="--d:.5s"><ellipse cx="-8" cy="${-depth - 10}" rx="14" ry="6" fill="${GOLD}" stroke="${GOLD2}" stroke-width="2"/><ellipse cx="10" cy="${-depth - 16}" rx="14" ry="6" fill="${GOLD}" stroke="${GOLD2}" stroke-width="2"/></g>
    ${T(0, 22, label, 11, { w: 800, ls: 1 })}${T(0, -depth - 32, amt, 18)}`;

  const mini = (vb, body) => `<svg viewBox="${vb}" aria-hidden="true">${body}</svg>`;
  MW.MINI = {
    cup: () => mini('-66 -266 132 272', CUP),
    bag: () => mini('-76 -212 152 218', BAG),
    box: () => mini('-66 -96 132 102', BOX(120, 90)),
    pencil: () => `<svg viewBox="0 0 120 40" aria-hidden="true"><g transform="rotate(-28 60 20)"><path d="M14 20 L30 11 L30 29 Z" fill="#F3D9B1"/><path d="M14 20 L20 16.6 L20 23.4 Z" fill="${INK}"/><rect x="30" y="11" width="66" height="18" fill="${GOLD}"/><rect x="30" y="11" width="66" height="6" fill="#F7D57A"/><rect x="96" y="11" width="8" height="18" fill="#B9B4C4"/><rect x="104" y="11" width="12" height="18" rx="4" fill="#F49AB0"/></g></svg>`,
  };

  MW.ART2 = {
    /* 1. Tiny purchases posing for a very expensive class photo */
    classPhoto() {
      const corner = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 26} V${y} H${x + dx * 26}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
      const items = [
        [70, 172, .34, BAG], [160, 172, .42, CUP], [250, 172, .5, BOX(110, 84)],
        [96, 262, .5, `<rect x="-26" y="-60" width="52" height="60" rx="6" fill="#fff"/><rect x="-26" y="-60" width="52" height="14" rx="6" style="fill:var(--n)"/>${T(0, -20, 'ADMIT', 10, { w: 900 })}`],
        [160, 262, .6, `<rect x="-14" y="-86" width="28" height="40" rx="6" fill="${RED}"/><rect x="-18" y="-50" width="36" height="50" rx="5" fill="${INK}"/>`],
        [226, 262, .62, `<rect x="-42" y="-54" width="84" height="54" rx="8" style="fill:var(--n)"/><rect x="-30" y="-40" width="18" height="14" rx="3" fill="${GOLD}"/>`],
      ];
      return svg(`${shadow(160, 130)}
        <rect x="30" y="176" width="260" height="10" rx="5" fill="rgba(255,255,255,.65)"/><rect x="30" y="266" width="260" height="10" rx="5" fill="rgba(255,255,255,.65)"/>
        ${items.map((it, i) => A('a-pop', .1 + i * .12, at(it[0], it[1], it[2], it[3]))).join('')}
        ${corner(22, 36, 1, 1)}${corner(298, 36, -1, 1)}${corner(22, 290, 1, -1)}${corner(298, 290, -1, -1)}
        ${A('a-pop', 1.1, `<circle cx="276" cy="58" r="20" fill="#fff" opacity=".9"/>${SPARK(276, 58, 16)}`)}`);
    },

    /* 2. A thumb wearing three tiny club badges */
    thumbBadges(taps) {
      const badge = (x, y, c, glyph) => A('a-pop', .5 + x / 600, `<circle cx="${x}" cy="${y}" r="24" fill="${c}" stroke="#fff" stroke-width="4"/>${glyph}`);
      const g1 = (x, y) => `<path d="M${x - 10} ${y - 8} h20 l3 18 h-26 z" fill="#fff"/><path d="M${x - 5} ${y - 8} q5 -9 10 0" stroke="#fff" stroke-width="2.5" fill="none"/>`;
      const g2 = (x, y) => `<path d="M${x - 13} ${y - 9} h4 l4 14 h14 l3 -10 h-19" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round"/><circle cx="${x - 2}" cy="${y + 10}" r="2.6" fill="#fff"/><circle cx="${x + 8}" cy="${y + 10}" r="2.6" fill="#fff"/>`;
      const g3 = (x, y) => `<path d="M${x - 9} ${y - 10} h18 l-3 21 h-12 z" fill="#fff"/><path d="M${x + 2} ${y - 10} l4 -8" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
      return svg(`${shadow(160, 80)}
        ${A('a-drop', 0, at(160, 300, 1, THUMB))}
        ${badge(128, 176, KRAFT2, g1(128, 176))}${badge(190, 212, 'var(--d)', g2(190, 212))}${badge(136, 250, GREEN2, g3(136, 250))}
        ${A('a-pop', .9, `<rect x="212" y="54" width="92" height="40" rx="20" fill="#fff"/>${T(258, 80, taps + ' taps', 15)}`)}`);
    },

    /* 3. A takeout bag moving a toothbrush into a bedside drawer */
    drawer() {
      return svg(`${shadow(150, 140)}
        <rect x="34" y="120" width="160" height="168" rx="8" fill="#E6B48A"/><rect x="34" y="120" width="160" height="12" rx="6" fill="#D29C70"/>
        <rect x="46" y="226" width="136" height="48" rx="6" fill="#D9A47A"/><circle cx="114" cy="250" r="5" fill="#9C6B45"/>
        ${A('a-slide', .1, `<rect x="22" y="160" width="184" height="54" rx="6" fill="#F0C39C"/><rect x="30" y="160" width="168" height="12" fill="#B9835A"/><circle cx="114" cy="190" r="5" fill="#9C6B45"/>
          <g transform="rotate(-24 120 160)"><rect x="112" y="92" width="11" height="78" rx="5" style="fill:var(--n)"/><rect x="110" y="78" width="15" height="22" rx="4" fill="#fff" stroke="${LINE}" stroke-width="2"/></g>`)}
        <rect x="60" y="80" width="10" height="40" fill="${INK}" opacity=".8"/><path d="M36 82 L94 82 L82 42 L48 42 Z" fill="${GOLD}"/>
        ${A('a-slide', .4, at(258, 288, .62, BAG, -6))}`);
    },

    /* 4. A lettuce leaf arriving on a tiny red carpet */
    redCarpet() {
      const leaf = `<path d="M0 0 C-58 -20 -62 -96 -6 -132 C22 -110 60 -70 40 -24 C30 -4 14 2 0 0Z" fill="${GREEN}"/><path d="M0 0 C-4 -40 -6 -80 -6 -128" stroke="${GREEN2}" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M-4 -40 L-28 -56 M-4 -70 L-30 -88 M-2 -54 L22 -66 M-4 -90 L16 -102" stroke="${GREEN2}" stroke-width="3" stroke-linecap="round"/>`;
      return svg(`${A('a-unroll', 0, `<path d="M40 292 L280 292 L206 176 L114 176 Z" fill="${RED}"/><path d="M114 176 L206 176 L210 182 L110 182 Z" fill="${RED2}"/>`)}
        ${POST(30, 64)}${POST(92, 64)}${ROPE(30, 92, 232, 16)}${POST(228, 64)}${POST(290, 64)}${ROPE(228, 290, 232, 16)}
        ${A('a-drop', .7, at(160, 214, .82, leaf, 6))}
        ${A('a-pop', 1, SPARK(64, 96, 12))}${A('a-pop', 1.15, SPARK(262, 70, 15))}${A('a-pop', 1.3, SPARK(232, 132, 9))}`);
    },

    /* 5. Six episode thumbnails, each starring the same takeout bag */
    episodes() {
      const tile = (k) => { const x = 22 + (k % 3) * 96, y = 50 + Math.floor(k / 3) * 118;
        return A('a-pop', .1 + k * .1, `<rect x="${x}" y="${y}" width="84" height="104" rx="12" fill="${INK}"/>
          ${at(x + 42, y + 72, .3, BAG)}
          ${T(x + 12, y + 92, 'EP ' + (k + 1), 10, { a: 'start', f: '#fff', ls: 1 })}
          <rect x="${x + 8}" y="${y + 97}" width="68" height="3" rx="1.5" fill="rgba(255,255,255,.25)"/>
          <rect class="a-fill" style="--d:${1 + k * .45}s" x="${x + 8}" y="${y + 97}" width="68" height="3" rx="1.5" fill="${RED}"/>`); };
      return svg(`${[0, 1, 2, 3, 4, 5].map(tile).join('')}`);
    },

    /* 6. A café apron presenting a trophy to a matcha cup */
    trophy(n) {
      const apron = `<path d="M-30 -150 q30 -26 60 0" fill="none" stroke="${INK}" stroke-width="5"/><path d="M-36 -150 L36 -150 L46 0 L-46 0 Z" style="fill:var(--d)"/>
        <path d="M-46 -88 L-78 -100 M46 -88 L78 -100" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><rect x="-24" y="-66" width="48" height="34" rx="4" fill="rgba(255,255,255,.3)"/>`;
      const cup = `<path d="M-36 -96 L36 -96 Q36 -50 0 -42 Q-36 -50 -36 -96Z" fill="${GOLD}"/><path d="M-36 -88 q-22 0 -18 20 q4 14 20 10 M36 -88 q22 0 18 20 q-4 14 -20 10" fill="none" stroke="${GOLD2}" stroke-width="5"/>
        <rect x="-6" y="-44" width="12" height="22" fill="${GOLD2}"/><rect x="-26" y="-24" width="52" height="24" rx="4" fill="${INK}"/>${T(0, -70, n, 22, { f: INK })}`;
      return svg(`${shadow(160, 130)}${A('a-slide', 0, at(80, 288, .9, apron))}${A('a-pop', .45, at(160, 228, 1, cup))}${A('a-drop', .2, at(248, 288, .6, CUP))}`);
    },

    /* 7. Two matcha cups, one holding the other's hand */
    twoCups() {
      return svg(`${shadow(160, 120)}${A('a-drop', 0, at(110, 288, .66, CUP))}
        ${A('a-slide', .5, `${at(216, 288, .66, CUP)}<path d="M138 196 Q163 214 188 196" fill="none" stroke="${GREEN2}" stroke-width="7" stroke-linecap="round"/><circle cx="163" cy="208" r="8" fill="${GREEN}"/>`)}`);
    },

    /* 8. A box opens and five stars tumble out */
    stars() {
      const pos = [[96, 120], [128, 82], [160, 66], [192, 82], [224, 120]];
      return svg(`${shadow(160, 110)}
        ${A('a-drop', 0, `${at(160, 288, 1.1, BOX(140, 96))}<path d="M83 183 L50 150 L94 140 Z" fill="${KRAFT2}"/><path d="M237 183 L270 150 L226 140 Z" fill="${KRAFT2}"/>`)}
        ${pos.map((p, i) => A('a-pop', .6 + i * .12, `<g class="a-bob" style="--d:${i * .2}s">${STAR(p[0], p[1], 18)}</g>`)).join('')}`);
    },

    /* 9. A phone with a velvet rope across the screen */
    vipPhone() {
      return svg(`${shadow(160, 110)}
        ${A('a-drop', 0, `<rect x="104" y="36" width="112" height="252" rx="24" fill="${INK}"/><rect x="112" y="46" width="96" height="232" rx="18" style="fill:var(--m)"/><rect x="140" y="54" width="40" height="11" rx="5.5" fill="${INK}"/>
          ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${124 + (i % 3) * 26}" y="${90 + Math.floor(i / 3) * 30}" width="20" height="20" rx="6" fill="rgba(255,255,255,.6)"/>`).join('')}`)}
        ${A('a-pop', .4, POST(70, 120) + POST(250, 120))}
        ${A('a-drop', .7, ROPE(70, 250, 168, 34) + `<g class="a-swing" style="--d:.9s"><rect x="138" y="196" width="44" height="26" rx="5" fill="${GOLD}"/>${T(160, 214, 'VIP', 13)}</g>`)}`);
    },

    /* 10 / R7. A concert outfit beside rolling credits */
    outfitCredits(rows, extra) {
      return svg(`${shadow(150, 140)}${A('a-drop', 0, at(84, 284, .95, DRESS))}
        ${A('a-slide', .3, `<g>${credits(160, 70, 146, rows, 'a-credits')}</g>`)}
        ${extra ? A('a-pop', 1.6, `<g transform="rotate(4 230 250)"><rect x="168" y="226" width="130" height="40" rx="10" fill="#fff"/>${T(233, 251, extra, 11, { w: 800 })}</g>`) : ''}`);
    },

    /* 11. A Sunday calendar square holding a smoking bank card */
    sundayCard(day, date) {
      return svg(`${shadow(160, 130)}
        ${A('a-drop', 0, `<rect x="44" y="96" width="150" height="180" rx="16" fill="#fff"/><rect x="44" y="96" width="150" height="44" rx="16" fill="${RED}"/><rect x="44" y="124" width="150" height="16" fill="${RED}"/>
          ${T(119, 126, day, 20, { f: '#fff', ls: 3 })}${T(119, 238, date, 84, { f: INK })}<circle cx="80" cy="96" r="7" fill="${INK}"/><circle cx="158" cy="96" r="7" fill="${INK}"/>`)}
        ${A('a-slide', .4, `<g transform="rotate(14 250 220)"><rect x="192" y="178" width="118" height="78" rx="10" style="fill:var(--n)"/><rect x="192" y="194" width="118" height="12" fill="rgba(0,0,0,.25)"/><rect x="206" y="220" width="22" height="16" rx="3" fill="${GOLD}"/></g>`)}
        ${[0, 1, 2].map(i => `<path class="a-steam" style="--d:${.9 + i * .5}s" d="M${238 + i * 18} 168 q-10 -16 0 -30 q10 -14 0 -30" fill="none" stroke="#9A93A6" stroke-width="5" stroke-linecap="round"/>`).join('')}`);
    },

    /* 12. A tiny bank bouncer waving a takeout bag past the rope */
    bouncer(fee) {
      const guy = `<rect x="-40" y="-170" width="80" height="170" rx="30" fill="${INK}"/><circle cx="0" cy="-196" r="28" fill="${SKIN}"/><rect x="-24" y="-204" width="48" height="12" rx="5" fill="${INK}"/>
        <rect x="-26" y="-130" width="52" height="26" rx="5" fill="#fff"/>${T(0, -112, fee, 13)}<path d="M-38 -150 L-82 -176" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><circle cx="-86" cy="-180" r="10" fill="${SKIN}"/>`;
      return svg(`${shadow(170, 140)}${POST(36, 80)}${POST(150, 80)}${ROPE(36, 150, 214, 22)}
        ${A('a-drop', 0, at(236, 288, .95, guy))}${A('a-slide', .7, at(92, 196, .38, BAG, -10))}`);
    },

    /* 13. Two takeout bags bowing beneath a tiny END curtain */
    finale() {
      const drape = (x, dir) => `<path d="M${x} 20 Q${x + dir * 70} 120 ${x + dir * 10} 290 L${x} 290 Z" fill="${RED}"/><path d="M${x + dir * 18} 30 Q${x + dir * 52} 140 ${x + dir * 22} 290" stroke="${RED2}" stroke-width="4" fill="none"/>`;
      return svg(`${shadow(160, 110)}${drape(0, 1)}${drape(320, -1)}<rect x="0" y="12" width="320" height="30" fill="${RED2}"/>
        ${A('a-pop', .2, T(160, 98, 'THE END', 30, { f: INK, ls: 4 }))}
        ${A('a-drop', .4, at(118, 288, .5, BAG, 10))}${A('a-slide', 1, at(204, 288, .5, BAG, 10))}`);
    },

    /* 14. A thumb pressing replay on a receipt */
    replay(word) {
      return svg(`${shadow(150, 120)}
        ${A('a-drop', 0, `<g transform="rotate(-4 140 160)"><path d="${zig(76, 40, 132, 220)}" fill="${PAPER}" stroke="#EADFCF" stroke-width="1.5"/>${lines(94, 66, 96, [.6, .9, .7, .8, .5, .85, .6], 13)}
          <rect x="94" y="170" width="64" height="22" rx="11" style="fill:var(--n)"/>${T(126, 186, word, 11, { f: '#fff', ls: 1.5 })}</g>`)}
        ${A('a-pop', .5, `<circle cx="196" cy="226" r="40" style="fill:var(--d)"/><path d="M180 214 a20 20 0 1 1 -2 22" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M172 204 L180 216 L192 208" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`)}
        ${A('a-press', 1, at(262, 330, .62, THUMB, -38))}`);
    },

    /* R1. A takeout bag casually stepping over a velvet rope */
    ropeHop() {
      return svg(`${shadow(160, 140)}${POST(60, 92)}${POST(260, 92)}${ROPE(60, 260, 196, 30)}
        ${A('a-hop', .3, at(176, 192, .62, BAG, 16))}`);
    },

    /* R2. September's bag wearing an October name badge, line past the limit */
    nameBadge(limit) {
      return svg(`${shadow(150, 110)}
        <path d="M20 118 H300" stroke="${INK}" stroke-width="3" stroke-dasharray="8 7"/>${T(300, 108, limit + ' LIMIT', 11, { a: 'end', ls: 1 })}
        <path class="a-draw" d="M24 248 C90 230 140 170 190 124 S270 60 300 44" fill="none" stroke="${RED}" stroke-width="6" stroke-linecap="round" pathLength="1"/>
        ${A('a-drop', .2, at(132, 288, .78, BAG + `<rect x="-6" y="-60" width="68" height="44" rx="6" fill="#fff" stroke="${LINE}" stroke-width="2"/><rect x="-6" y="-60" width="68" height="15" rx="6" fill="${RED}"/>${T(28, -49, 'HELLO I\'M', 8, { f: '#fff', len: 54 })}${T(28, -24, 'OCTOBER', 11, { len: 56 })}`, -3))}`);
    },

    /* R3. A second takeout bag waiting outside a closed stage door */
    stageDoor() {
      return svg(`${shadow(170, 140)}
        <rect x="46" y="54" width="132" height="234" rx="8" fill="#8A6BB8"/><rect x="58" y="66" width="108" height="222" rx="4" style="fill:var(--d)"/><circle cx="150" cy="186" r="7" fill="${GOLD}"/>
        ${A('a-pop', .3, `${STAR(112, 112, 26, '#fff')}${T(112, 156, 'STAGE', 12, { f: '#fff', ls: 2 })}`)}
        ${A('a-swing', .6, `<path d="M84 196 L112 176 L140 196" fill="none" stroke="${INK}" stroke-width="2"/><rect x="76" y="194" width="72" height="26" rx="5" fill="#fff"/>${T(112, 212, 'CLOSED', 12, { ls: 1 })}`)}
        ${A('a-slide', .2, at(248, 288, .55, BAG + `<circle cx="44" cy="-150" r="22" fill="#fff" stroke="${LINE}" stroke-width="3"/>${T(44, -141, '2', 26)}`))}`);
    },

    /* R4. A shopping cart framed on a wall like unattainable art */
    framedCart(left) {
      return svg(`${A('a-drop', 0, `<rect x="54" y="40" width="212" height="174" rx="6" fill="${GOLD}"/><rect x="66" y="52" width="188" height="150" fill="${GOLD2}"/><rect x="74" y="60" width="172" height="134" fill="${PAPER}"/>
          <path d="M108 96 h16 l14 52 h66 l12 -40 h-84" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="148" cy="166" r="8" fill="${INK}"/><circle cx="196" cy="166" r="8" fill="${INK}"/>`)}
        ${A('a-pop', .7, `<rect x="198" y="234" width="92" height="44" rx="4" fill="#fff"/>${T(244, 252, 'CART, 2026', 9, { ls: 1 })}${T(244, 270, left, 13)}`)}
        <path d="M160 40 L160 14" stroke="${INK}" stroke-width="2"/><circle cx="160" cy="12" r="4" fill="${INK}"/>`);
    },

    /* R5. Ten cup outlines, two fading away */
    tally(n, fewer) {
      const cups = [];
      for (let i = 0; i < n; i++) {
        const x = 52 + (i % 5) * 54, y = 150 + Math.floor(i / 5) * 116, gone = i >= n - fewer;
        const c = `<path d="M${x - 18} ${y - 70} L${x + 18} ${y - 70} L${x + 13} ${y} L${x - 13} ${y} Z" fill="${gone ? 'none' : GREEN}" stroke="${gone ? INK : '#fff'}" stroke-width="3"${gone ? ' stroke-dasharray="5 5"' : ''}/><rect x="${x - 22}" y="${y - 78}" width="44" height="9" rx="4" fill="${gone ? 'none' : '#fff'}" stroke="${gone ? INK : 'none'}" stroke-width="2"/>`;
        cups.push(gone ? A('a-fade', 1.2, A('a-pop', .1 + i * .07, c)) : A('a-pop', .1 + i * .07, c));
      }
      return svg(cups.join('') + A('a-pop', 1.6, `<path d="M${52 + 3 * 54 - 28} 222 l100 -60" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>`));
    },

    /* R6. The bank's admission booth, closed, nobody waiting */
    closedBooth(fee) {
      return svg(`${shadow(150, 140)}
        <rect x="70" y="80" width="160" height="208" rx="10" fill="#fff"/><path d="M58 84 L150 34 L242 84 Z" fill="var(--d)" style="fill:var(--d)"/>
        <rect x="92" y="108" width="116" height="74" rx="6" fill="${INK}" opacity=".85"/><rect x="70" y="196" width="160" height="10" fill="${LINE}"/>
        ${A('a-swing', .4, `<path d="M122 130 L150 112 L178 130" fill="none" stroke="#fff" stroke-width="2"/><rect x="112" y="128" width="76" height="28" rx="5" fill="${RED}"/>${T(150, 147, 'CLOSED', 13, { f: '#fff', ls: 1 })}`)}
        ${POST(36, 70)}${POST(284, 70)}
        ${A('a-flip', 1, `<g transform="rotate(-8 268 262)"><rect x="236" y="246" width="70" height="34" rx="5" fill="${GOLD}"/>${T(271, 268, fee, 12)}</g>`)}`);
    },

    /* R8. Three pots; the shopping one is comically shallow */
    pots(vals) {
      return svg(`${shadow(160, 150, 276)}
        ${A('a-drop', 0, at(62, 258, 1, POT(92, 'DELIVERY', vals[0])))}${A('a-drop', .15, at(160, 258, 1, POT(14, 'SHOPPING', vals[1])))}${A('a-drop', .3, at(258, 258, 1, POT(56, 'COFFEE', vals[2])))}`);
    },

    /* R9. Three labelled envelopes, each with its own coins */
    envelopes(vals) {
      return svg(`${A('a-drop', 0, at(62, 230, 1, ENV('DELIVERY', vals[0]), -4))}${A('a-drop', .15, at(160, 230, 1, ENV('SHOPPING', vals[1])))}${A('a-drop', .3, at(258, 230, 1, ENV('COFFEE', vals[2]), 4))}
        ${A('a-slide', .9, `<rect x="104" y="40" width="112" height="44" rx="22" fill="#fff"/>${T(160, 68, 'TOMORROW', 13, { ls: 2 })}`)}`);
    },

    /* On track: three lines comfortably below their limits */
    onTrack() {
      const col = (x, h, d) => `<path d="M${x - 34} 92 H${x + 34}" stroke="${INK}" stroke-width="3" stroke-dasharray="6 6"/>${A('a-grow', d, `<rect x="${x - 22}" y="${288 - h}" width="44" height="${h}" rx="10" style="fill:var(--d)"/>`)}`;
      return svg(col(70, 120, .2) + col(160, 150, .35) + col(250, 96, .5) + T(160, 76, 'LIMITS', 11, { ls: 2 }));
    },

    /* Off track: a receipt with its final lines still blank */
    openEnding() {
      return svg(`${shadow(160, 110)}${A('a-drop', 0, `<path d="${zig(92, 24, 136, 258)}" fill="${PAPER}" stroke="#EADFCF" stroke-width="1.5"/>${lines(110, 50, 100, [.7, .9, .6, .85, .5, .8], 14)}
        ${[0, 1, 2].map(i => `<path d="M110 ${158 + i * 26} H210" stroke="${INK}" stroke-width="2.5" stroke-dasharray="6 6" opacity=".5"/>`).join('')}
        ${T(160, 254, 'TO BE CONTINUED', 11, { ls: 1.5, len: 108 })}`)}
        ${A('a-pop', .8, `<g transform="rotate(-12 244 120)"><rect x="210" y="100" width="76" height="36" rx="6" fill="none" stroke="${RED}" stroke-width="4"/>${T(248, 125, 'OPEN', 15, { f: RED, ls: 2 })}</g>`)}`);
    },
  };
})();

