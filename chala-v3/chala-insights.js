/* chala v3 — Recap: a graphical look at money earned, spent and saved for a week or a month.
   Opened from the Recap button under the money tree. Full-screen page with:
   - the headline (what you kept, or how far spending ran past what came in)
   - Earned / Spent / Saved
   - one stacked bar: where this period's money went (spent · saved · left)
   - spending by day (columns, tap or hover for the day)
   - pace against your limits (cumulative spending vs. an even pace to the limit)
   - where it went by category
   Colours: spent #D9693B, saved #12A089, left #E3A33C (validated for colour-blind separation);
   every mark is labelled or in the legend, so colour is never the only cue.
   Data comes from Home through getData(mode, offset). */
(() => {
  const C = { spent: '#D9693B', saved: '#12A089', left: '#E3A33C', pace: '#B9B5AE' };
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const usd = (c, dec) => { const v = Math.abs(c) / 100; return '$' + v.toLocaleString('en-US', { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 }); };
  const compact = c => { const v = c / 100; return v >= 1000 ? '$' + (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K' : '$' + Math.round(v); };
  const niceMax = v => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };

  function open(opts) {
    const st = { mode: opts.mode || 'M', offset: opts.offset || 0 };
    const page = document.createElement('section');
    page.className = 'ri'; page.setAttribute('role', 'dialog'); page.setAttribute('aria-modal', 'true'); page.setAttribute('aria-label', 'Recap');
    document.body.appendChild(page);
    document.documentElement.classList.add('ri-open');
    const close = () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.classList.remove('ri-open');
      if (reduce()) { page.remove(); return; }
      page.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px)' }], { duration: 260, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'forwards' }).finished.then(() => page.remove(), () => page.remove());
      opts.onClose?.();
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);

    function render() {
      const d = opts.getData(st.mode, st.offset);
      const kept = d.earned - d.spent - d.saved;
      const head = d.earned ? (kept >= 0 ? `You kept <b>${usd(kept)}</b> of what came in.` : `You spent <b>${usd(-kept)}</b> more than came in.`) : `You spent <b>${usd(d.spent)}</b>.`;
      page.innerHTML = `
        <header class="ri-top">
          <button class="ri-back" data-a="close" aria-label="Back">${I('<path d="M15 5l-7 7 7 7"/>')}</button>
          <div class="mt-seg ri-seg" role="tablist" aria-label="Period">
            <button role="tab" data-m="M" class="${st.mode === 'M' ? 'is-on' : ''}" aria-selected="${st.mode === 'M'}">M</button><button role="tab" data-m="W" class="${st.mode === 'W' ? 'is-on' : ''}" aria-selected="${st.mode === 'W'}">W</button>
          </div>
        </header>
        <div class="ri-body">
          <p class="ri-k">Recap</p>
          <div class="ri-pager">
            <button class="mt-arrow" data-d="-1" aria-label="Previous" ${d.hasPrev ? '' : 'disabled'}>${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button>
            <h1 class="ri-title">${esc(d.label).replace(/\s*–\s*/g, '<span class="ri-dash">–</span>')}</h1>
            <button class="mt-arrow" data-d="1" aria-label="Next" ${d.hasNext ? '' : 'disabled'}>${I('<path d="M9.5 6l6 6-6 6"/>')}</button>
          </div>
          <p class="ri-head">${head}</p>

          <div class="ri-stats">
            ${[['Earned', d.earned, 'earned'], ['Spent', d.spent, 'spent'], ['Saved', d.saved, 'saved']].map(([l, v, k]) => `
            <div class="ri-stat"><span class="ri-stat-k"><i class="sw sw-${k}"></i>${l}</span><b>${usd(v)}</b></div>`).join('')}
          </div>

          ${flowCard(d, kept)}
          ${dailyCard(d)}
          ${d.budget ? paceCard(d) : ''}
          ${catCard(d)}

          ${opts.onStory && d.storyKey ? `<button class="ri-story" data-a="story">${I('<path d="M7 4.5v15l12-7.5z"/>')}<span>Play the ${esc(d.storyName)} story</span></button>` : ''}
        </div>
        <div class="ri-tip" role="status" aria-live="polite"></div>`;
      wire(d);
    }

    /* ---------- cards ---------- */
    function flowCard(d, kept) {
      const base = Math.max(d.earned, d.spent + d.saved, 1);
      const segs = [['spent', d.spent, 'Spent'], ['saved', d.saved, 'Saved'], ['left', Math.max(0, kept), 'Left over']].filter(s => s[1] > 0);
      const over = d.earned && kept < 0;
      return `<section class="ri-card">
        <h2 class="ri-h">Where the money went</h2>
        <p class="ri-sub">${d.earned ? `Out of ${usd(d.earned)} that came in` : 'Nothing came in this period'}</p>
        <div class="ri-flow" role="img" aria-label="${segs.map(s => `${s[2]} ${usd(s[1])}`).join(', ')}">
          ${segs.map(([k, v, l]) => `<span class="ri-seg-${k}" style="flex:${v / base}" data-tip="${l}: ${usd(v, true)}"></span>`).join('')}
        </div>
        ${over ? `<p class="ri-note">Spending and saving ran ${usd(-kept)} past what came in.</p>` : ''}
        <ul class="ri-legend">${segs.map(([k, v, l]) => `<li><i class="sw sw-${k}"></i>${l}<b>${usd(v)}</b></li>`).join('')}</ul>
      </section>`;
    }

    function dailyCard(d) {
      const W = 320, H = 150, pad = { l: 34, r: 6, t: 10, b: 22 };
      const n = d.days.length, max = niceMax(Math.max(...d.days.map(x => x.cents), 1));
      const bw = Math.min(24, (W - pad.l - pad.r) / n - 2), step = (W - pad.l - pad.r) / n;
      const y = v => pad.t + (H - pad.t - pad.b) * (1 - v / max);
      const peak = d.days.reduce((a, x) => (x.cents > a.cents ? x : a), d.days[0] || { cents: 0 });
      const ticks = [0, max / 2, max];
      const lab = n <= 7 ? i => d.days[i].short : i => (i === 0 || (i + 1) % 7 === 0 || i === n - 1) ? String(i + 1) : '';
      return `<section class="ri-card">
        <h2 class="ri-h">Spending by day</h2>
        <p class="ri-sub">Biggest day: ${peak.cents ? `${esc(peak.long)}, ${usd(peak.cents)}` : 'none yet'}</p>
        <svg class="ri-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Spending by day">
          ${ticks.map(t => `<line class="ri-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="ri-ax" x="${pad.l - 6}" y="${y(t) + 3}" text-anchor="end">${compact(t)}</text>`).join('')}
          ${d.days.map((x, i) => { const cx = pad.l + step * i + (step - bw) / 2, top = y(x.cents), h = H - pad.b - top;
            return `<g class="ri-col${x.future ? ' is-future' : ''}" data-tip="${esc(x.long)}: ${x.future ? 'still to come' : usd(x.cents, true)}">
              <rect class="ri-hit" x="${pad.l + step * i}" y="${pad.t}" width="${step}" height="${H - pad.t - pad.b}"/>
              ${h > 0.5 ? `<path d="M${cx} ${H - pad.b} V${top + Math.min(4, h)} q0 -${Math.min(4, h)} ${Math.min(4, bw / 2)} -${Math.min(4, h)} H${cx + bw - Math.min(4, bw / 2)} q${Math.min(4, bw / 2)} 0 ${Math.min(4, bw / 2)} ${Math.min(4, h)} V${H - pad.b} Z" fill="${C.spent}"/>` : ''}
              <text class="ri-ax" x="${cx + bw / 2}" y="${H - 6}" text-anchor="middle">${lab(i)}</text></g>`; }).join('')}
        </svg>
        ${table('Spending by day', ['Day', 'Spent'], d.days.filter(x => !x.future).map(x => [x.long, usd(x.cents, true)]))}
      </section>`;
    }

    function paceCard(d) {
      const W = 320, H = 150, pad = { l: 34, r: 10, t: 10, b: 22 };
      const n = d.days.length, upto = d.days.filter(x => !x.future).length;
      let run = 0; const cum = d.days.slice(0, upto).map(x => (run += x.limited));
      const max = niceMax(Math.max(d.budget, run, 1));
      const x = i => pad.l + (W - pad.l - pad.r) * (i / Math.max(1, n - 1)), y = v => pad.t + (H - pad.t - pad.b) * (1 - v / max);
      const line = cum.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
      const area = cum.length ? `${line} L${x(cum.length - 1).toFixed(1)} ${H - pad.b} L${x(0).toFixed(1)} ${H - pad.b} Z` : '';
      const ahead = run - d.budget * (upto / n);
      return `<section class="ri-card">
        <h2 class="ri-h">Pace against your limits</h2>
        <p class="ri-sub">${ahead > 0 ? `${usd(ahead)} ahead of an even pace` : `${usd(-ahead)} under an even pace`} · limit ${usd(d.budget)}</p>
        <svg class="ri-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Cumulative spending in limited categories against an even pace to the limit">
          ${[0, max / 2, max].map(t => `<line class="ri-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}"/><text class="ri-ax" x="${pad.l - 6}" y="${y(t) + 3}" text-anchor="end">${compact(t)}</text>`).join('')}
          <path d="M${x(0)} ${y(0)} L${x(n - 1)} ${y(d.budget)}" stroke="${C.pace}" stroke-width="2" fill="none" stroke-linecap="round"/>
          ${area ? `<path d="${area}" fill="${C.spent}" opacity=".1"/><path d="${line}" stroke="${C.spent}" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
          ${cum.length ? `<circle cx="${x(cum.length - 1)}" cy="${y(run)}" r="4.5" fill="${C.spent}" stroke="#fff" stroke-width="2"/>` : ''}
          ${d.days.map((dd, i) => `<rect class="ri-hit" x="${x(i) - (W - pad.l - pad.r) / n / 2}" y="${pad.t}" width="${(W - pad.l - pad.r) / n}" height="${H - pad.t - pad.b}" data-tip="${esc(dd.long)}: ${i < upto ? `${usd(cum[i], true)} so far` : 'still to come'} · even pace ${usd(d.budget * (i + 1) / n)}"/>`).join('')}
          <text class="ri-ax" x="${pad.l}" y="${H - 6}">${esc(d.days[0]?.short || '')}</text><text class="ri-ax" x="${W - pad.r}" y="${H - 6}" text-anchor="end">${esc(d.days[n - 1]?.short || '')}</text>
        </svg>
        <ul class="ri-legend"><li><i class="sw sw-line"></i>Your spending<b>${usd(run)}</b></li><li><i class="sw sw-pace"></i>Even pace to limit</li></ul>
      </section>`;
    }

    function catCard(d) {
      const top = d.cats.slice(0, 6), rest = d.cats.slice(6).reduce((s, c) => s + c.cents, 0);
      const list = rest ? [...top, { name: 'Everything else', cents: rest }] : top;
      const max = Math.max(...list.map(c => c.cents), 1);
      return `<section class="ri-card">
        <h2 class="ri-h">Where it went</h2>
        <p class="ri-sub">${list.length ? `${esc(list[0].name)} was the biggest share` : 'No spending yet'}</p>
        <ul class="ri-bars">${list.map(c => `<li data-tip="${esc(c.name)}: ${usd(c.cents, true)} · ${Math.round(c.cents / Math.max(1, d.spent) * 100)}%">
          <span class="ri-bar-n">${esc(c.name)}</span><span class="ri-bar-t"><i style="--w:${(c.cents / max * 100).toFixed(1)}%"></i></span><b>${usd(c.cents)}</b></li>`).join('')}</ul>
      </section>`;
    }

    function table(caption, cols, rows) {
      if (!rows.length) return '';
      return `<details class="ri-table"><summary>View as table</summary><table><caption class="fw-sr">${esc(caption)}</caption><thead><tr>${cols.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
    }

    /* ---------- interaction ---------- */
    function wire() {
      const tip = page.querySelector('.ri-tip');
      let t;
      const show = (txt, ev) => {
        tip.textContent = txt; tip.classList.add('on');
        const r = page.getBoundingClientRect(), hw = tip.offsetWidth / 2 + 10;
        tip.style.left = Math.min(r.width - hw, Math.max(hw, ev.clientX - r.left)) + 'px';
        tip.style.top = (ev.clientY - r.top + page.scrollTop - 14) + 'px';
        clearTimeout(t); t = setTimeout(() => tip.classList.remove('on'), 2400);
      };
      page.addEventListener('scroll', () => tip.classList.remove('on'), { passive: true });
      page.querySelectorAll('[data-tip]').forEach(n => {
        n.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') show(n.dataset.tip, e); });
        n.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') tip.classList.remove('on'); });
        n.addEventListener('click', e => show(n.dataset.tip, e));
      });
      // grow-in, quietly
      if (!reduce()) page.querySelectorAll('.ri-card, .ri-stat').forEach((n, i) => n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 40 * i, easing: 'cubic-bezier(.25,.1,.25,1)', fill: 'backwards' }));
    }
    page.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.a === 'close') return close();
      if (b.dataset.a === 'story') { const d = opts.getData(st.mode, st.offset); close(); setTimeout(() => opts.onStory(d.storyKey), 280); return; }
      if (b.dataset.m && b.dataset.m !== st.mode) { st.mode = b.dataset.m; st.offset = 0; render(); return; }
      if (b.dataset.d) { const nx = st.offset + +b.dataset.d; if (opts.getData(st.mode, nx)) { st.offset = nx; render(); page.scrollTo(0, 0); } }
    });
    render();
    if (!reduce()) page.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.25,.1,.25,1)' });
    page.querySelector('.ri-back').focus({ preventScroll: true });
  }

  window.ChalaInsights = { open };
})();
