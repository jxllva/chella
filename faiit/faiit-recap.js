/* Faiit month breakdown: the details behind the Wrap.
   Built only from what the data supports. Income, savings and payday patterns appear only
   when the rows show them. People can add context or correct anything, and every total
   and insight is recalculated from their corrections. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.22,1,.36,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const FLAG = I('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>');
  const CORR_KEY = 'faiit-corrections-v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(CORR_KEY)) || {}; } catch { return {}; } };
  const write = v => { try { localStorage.setItem(CORR_KEY, JSON.stringify(v)); } catch {} };
  const ESSENTIAL = new Set(['Rent & bills', 'Groceries', 'Health', 'Transport', 'Education']);
  const NEVER_COMMENT = new Set(['Health', 'Rent & bills']);
  const CATS = ['Food delivery', 'Dining', 'Cafés', 'Groceries', 'Shopping', 'Transport', 'Subscriptions', 'Travel', 'Health', 'Rent & bills', 'Education', 'Other'];
  const COLORS = ['#E0483C', '#2F6FE0', '#F3C74A', '#4FA35E', '#8A5BD6', '#F08A4B', '#1d1b2e', '#E77FA6', '#60B7C9', '#A88A5A', '#9AA6F7', '#C9C2B4'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOf = d => new Date(d + 'T12:00:00').getDay();
  const dLabel = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mLabel = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysIn = k => new Date(+k.slice(0, 4), +k.slice(5, 7), 0).getDate();

  // ---------- sample month: the Wrap's purchases plus income, bills and savings moves ----------
  function sampleRows() {
    const W = window.FaiitWrap, keys = W?.SAMPLE_KEYS || ['2026-09'], out = [];
    keys.forEach(k => {
      const base = (W?.sampleMonth?.(k).rows || []).map(r => ({ ...r }));
      const days = daysIn(k), day = n => `${k}-${String(Math.min(days, n)).padStart(2, '0')}`, ref = k === '2026-09';
      const add = (d, merchant, cents, category, kind) => base.push({ date: day(d), merchant, cents, category, kind });
      // Paychecks every two weeks, bills on the same days each month.
      const p1 = ref ? 4 : 2 + (+k.slice(5, 7) % 3); add(p1, 'Acme Lab Payroll', 130000, 'Other', 'credit'); add(p1 + 14, 'Acme Lab Payroll', 130000, 'Other', 'credit');
      add(1, 'Oakwood Apartments rent', 120000, 'Rent & bills', 'expense');
      add(15, 'PG&E', ref ? 6400 : 5200 + (+k.slice(5, 7) * 137) % 2400, 'Rent & bills', 'expense');
      add(20, 'T-Mobile', 4500, 'Rent & bills', 'expense');
      add(3, 'Spotify', 1199, 'Subscriptions', 'expense'); add(11, 'Netflix', 1549, 'Subscriptions', 'expense'); add(26, 'iCloud+', 299, 'Subscriptions', 'expense');
      [2, 9, 16, 23, 30].forEach(d => d <= days && add(d, 'Clipper', 250, 'Transport', 'expense'));
      if (ref) { add(12, 'Venmo from Jordan', 4200, 'Other', 'credit'); add(23, 'Amazon refund', 3600, 'Shopping', 'credit'); add(5, 'Transfer to Savings', 30000, 'Other', 'transfer'); add(11, 'Transfer from Savings', 20000, 'Other', 'credit'); add(17, 'SQ *STALL 22', 1800, 'Other', 'expense'); }
      else if (+k.slice(5, 7) % 2) add(6, 'Transfer to Savings', 15000 + (+k.slice(5, 7) * 1000), 'Other', 'transfer');
      out.push(...base.map(r => ({ source: 'Sample statement', ...r })));
    });
    return out;
  }

  // ---------- classify every row into a money flow ----------
  function classify(rows, corr) {
    const seen = new Map(), out = []; let dupes = 0;
    const merchants = new Set(rows.filter(r => r.kind === 'expense').map(r => (r.merchant || '').toLowerCase().split(/\s+/)[0]));
    rows.forEach((r, i) => {
      if (!r || !r.date || !(r.cents > 0)) return;
      const key = `${r.date}|${(r.merchant || '').toLowerCase()}|${r.cents}|${r.kind}`;
      // The same purchase in two different uploads is counted once.
      const prev = seen.get(key);
      if (prev && prev.source !== (r.source || '') ) { dupes++; return; }
      const n = (seen.get(key + '#n') || 0) + 1; seen.set(key + '#n', n); seen.set(key, { source: r.source || '' });
      const id = `${key}|${n}`, m = (r.merchant || '').toLowerCase();
      let flow;
      if (/savings/.test(m)) flow = r.kind === 'credit' ? 'saveIn' : 'saveOut';
      else if (r.kind === 'transfer') flow = 'own';
      else if (r.kind === 'credit') {
        if (/payroll|salary|direct dep|stipend|wages|paycheck|\badp\b|gusto|employer|fellowship/.test(m)) flow = 'income';
        else if (/refund|return|reversal/.test(m) || merchants.has(m.split(/\s+/)[0])) flow = 'refund';
        else if (/venmo|zelle|cash ?app|paypal/.test(m)) flow = 'reimb';
        else if (/transfer|from chk|from checking|online banking/.test(m)) flow = 'own';
        else flow = 'creditUnclear';
      } else flow = (r.category === 'Other' || !r.category) ? 'unclear' : 'spend';
      const t = { id, date: r.date, merchant: r.merchant || 'Unknown', cents: r.cents, category: r.category || 'Other', flow, source: r.source || '', tags: [] };
      const c = corr[id];
      if (c) {
        if (c.type === 'own') t.flow = 'own';
        if (c.type === 'edit') { if (c.category) { t.category = c.category; if (t.flow === 'unclear' && c.category !== 'Other') t.flow = 'spend'; } if (c.cents > 0) t.cents = c.cents; }
        if (['emergency', 'onetime', 'exclude', 'reimbursed'].includes(c.type)) t.noHabit = true;
        t.tags.push({ emergency: 'Emergency', onetime: 'One-time', own: 'Own transfer', reimbursed: 'Reimbursed', edit: 'Edited', exclude: 'Left out of habits' }[c.type]);
        if (c.note) t.note = c.note;
      }
      t.essential = ESSENTIAL.has(t.category);
      out.push(t);
    });
    return { list: out, dupes };
  }

  // ---------- numbers for one month ----------
  function summarize(all, key) {
    const tx = all.filter(t => t.date.startsWith(key));
    const spendT = tx.filter(t => t.flow === 'spend' || t.flow === 'unclear');
    const sum = l => l.reduce((s, t) => s + t.cents, 0);
    const inc = tx.filter(t => t.flow === 'income'), refunds = tx.filter(t => t.flow === 'refund'), reimb = tx.filter(t => t.flow === 'reimb'), cu = tx.filter(t => t.flow === 'creditUnclear');
    const own = tx.filter(t => t.flow === 'own'), sOut = tx.filter(t => t.flow === 'saveOut'), sIn = tx.filter(t => t.flow === 'saveIn');
    const moneyIn = sum(inc) + sum(refunds) + sum(reimb) + sum(cu), spent = sum(spendT);
    const days = daysIn(key), dates = tx.map(t => +t.date.slice(8, 10)), first = Math.min(...dates), last = Math.max(...dates);
    const hasIncome = inc.length + refunds.length + reimb.length + cu.length > 0;
    const complete = dates.length && first <= 3 && last >= days - 3;
    const cats = Object.values(spendT.reduce((o, t) => { (o[t.category] ??= { name: t.category, cents: 0, n: 0, tx: [] }); o[t.category].cents += t.cents; o[t.category].n++; o[t.category].tx.push(t); return o; }, {})).sort((a, b) => b.cents - a.cents);
    const habit = spendT.filter(t => !t.noHabit && !t.essential && !NEVER_COMMENT.has(t.category));
    return { key, tx, spendT, habit, inc, refunds, reimb, cu, own, sOut, sIn, moneyIn, spent, days, first, last, hasIncome, complete, cats, sum };
  }

  // ---------- findings: a few specific patterns, only when the data supports them ----------
  function findings(S, m) {
    const out = [], sum = S.sum, H = S.habit;
    const paydays = [...new Set(S.inc.map(t => +t.date.slice(8, 10)))].sort((a, b) => a - b);
    if (paydays.length >= 2 && H.length >= 10) {
      const win = new Set(); paydays.forEach(p => { for (let d = p; d < p + 3 && d <= S.days; d++) win.add(d); });
      const inWin = H.filter(t => win.has(+t.date.slice(8, 10))), share = sum(inWin) / (sum(H) || 1), expect = win.size / S.days;
      if (share >= expect * 1.4 && share >= .2) out.push({ id: 'payday', score: 3, title: 'The first three days after payday', body: `${Math.round(share * 100)}% of your everyday spending landed in the three days after each paycheck. Those days are ${Math.round(expect * 100)}% of the month.`, tx: inWin, chart: { kind: 'timeline', win: [...win], paydays } });
    }
    const pairs = S.sOut.map(o => ({ o, i: S.sIn.find(x => +x.date.slice(8, 10) - +o.date.slice(8, 10) >= 0 && +x.date.slice(8, 10) - +o.date.slice(8, 10) <= 10) })).filter(p => p.i);
    if (pairs.length) { const p = pairs[0]; out.push({ id: 'boomerang', score: 2.6, title: 'Into savings, then partly back out', body: `You moved ${m(p.o.cents)} into savings on ${dLabel(p.o.date)} and ${m(p.i.cents)} back on ${dLabel(p.i.date)}. Net saved from that move: ${m(p.o.cents - p.i.cents)}.`, tx: [p.o, p.i], chart: { kind: 'pair', a: p.o, b: p.i } }); }
    const small = H.filter(t => t.cents < 1000);
    if (small.length >= 8) out.push({ id: 'small', score: 2.2, title: 'Small purchases, bigger total', body: `${small.length} purchases under $10 added up to ${m(sum(small))}. None of them felt big on its own.`, tx: small, chart: { kind: 'dots', n: small.length } });
    const wkd = H.filter(t => [0, 6].includes(dayOf(t.date))), wkdays = Array.from({ length: S.days }, (_, k) => dayOf(`${S.key}-${String(k + 1).padStart(2, '0')}`)), nWe = wkdays.filter(d => d === 0 || d === 6).length, nWd = S.days - nWe;
    const weAvg = sum(wkd) / (nWe || 1), wdAvg = (sum(H) - sum(wkd)) / (nWd || 1);
    if (H.length >= 10 && weAvg >= wdAvg * 1.4) out.push({ id: 'weekend', score: 1.6, title: 'Weekends run higher', body: `On an average weekend day you spent ${m(weAvg)}. On a weekday, ${m(wdAvg)}.`, tx: wkd, chart: { kind: 'bars', a: wdAvg, b: weAvg } });
    const reps = Object.entries(H.reduce((o, t) => { o[t.merchant] = (o[t.merchant] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
    if (reps[0] && reps[0][1] >= 12) out.push({ id: 'regular', score: 1.2, title: `${reps[0][0]}, ${reps[0][1]} times`, body: `Your most visited place this month. That’s about ${(reps[0][1] / S.days * 7).toFixed(1)} visits a week.`, tx: H.filter(t => t.merchant === reps[0][0]), chart: { kind: 'dots', n: reps[0][1] } });
    // Anything the person asked us to leave out stays out of the patterns.
    return out.filter(f => f.tx.some(t => !t.noHabit)).sort((a, b) => b.score - a.score).slice(0, 3);
  }

  // ---------- frequency of a repeated income source ----------
  const freq = list => {
    if (list.length < 2) return 'Once this month';
    const ds = list.map(t => +t.date.slice(8, 10)).sort((a, b) => a - b), gaps = ds.slice(1).map((d, k) => d - ds[k]), g = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return g >= 12 && g <= 16 ? `Every 2 weeks · ${list.length} deposits` : g >= 6 && g <= 8 ? `Weekly · ${list.length} deposits` : `${list.length} deposits`;
  };

  // =================================================================
  function render(el, api) {
    const m = api.money, raw = api.rows && api.rows.length ? api.rows : sampleRows(), isSample = !(api.rows && api.rows.length);
    let corr = read(), undo = null;
    let C = classify(raw, corr);
    const months = () => [...new Set(C.list.map(t => t.date.slice(0, 7)))].sort();
    let key = months().includes(api.key) ? api.key : months().at(-1);
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const still = reduce();

    el.innerHTML = `<section class="rc-page${still ? ' is-still' : ''}" aria-label="Month breakdown"><header class="rc-top"><button class="rc-gc" data-r="back" aria-label="Back to dashboard">${I('<path d="M15 5l-7 7 7 7"/>')}</button>
  <div class="rc-month"><button class="rc-gc rc-sm" data-r="prev" aria-label="Previous month">${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button><b aria-live="polite"></b><button class="rc-gc rc-sm" data-r="next" aria-label="Next month">${I('<path d="M9.5 6l6 6-6 6"/>')}</button></div>
  <span class="rc-prog" aria-hidden="true"><i></i></span></header>
  <main class="rc-body"></main><div class="rc-toast" role="status" aria-live="polite" hidden></div></section>`;
    const page = el.querySelector('.rc-page'), body = el.querySelector('.rc-body');
    document.documentElement.classList.add('fh-locked');

    const flag = id => `<button class="rc-flag" data-r="flag" data-i="${esc(id)}" aria-label="Add context or correct this">${FLAG}</button>`;
    function txRow(t, extra = '') {
      const tags = [...(t.essential ? ['Essential'] : []), ...t.tags, ...(extra ? [extra] : [])];
      return `<div class="rc-tx"><span class="rc-tx-t"><b>${esc(t.merchant)}</b><small>${dLabel(t.date)} · ${esc(t.flow === 'unclear' ? 'Needs context' : t.category)}${tags.map(x => ` · ${esc(x)}`).join('')}${t.note ? ` · “${esc(t.note)}”` : ''}</small></span><b class="rc-tx-v">${['income', 'refund', 'reimb', 'saveIn', 'creditUnclear'].includes(t.flow) ? '+' : ''}${m(t.cents)}</b><button class="rc-flag" data-r="flagtx" data-id="${esc(t.id)}" aria-label="Add context or correct this">${FLAG}</button></div>`;
    }

    // =========================== scenes ===========================
    let S, F, scenes = [];

    // 01 · two circles: what came in and what went out
    function sceneGlance() {
      const diff = S.moneyIn - S.spent, out = S.sum(S.sOut), back = S.sum(S.sIn), net = out - back;
      const max = Math.max(S.moneyIn, S.spent) || 1, rIn = Math.sqrt(S.moneyIn / max), rOut = Math.sqrt(S.spent / max);
      const cov = !S.hasIncome ? 'Only purchases are in this data, so money in and what’s left over aren’t shown.' : S.complete ? `From ${dLabel(`${S.key}-01`)} to ${dLabel(`${S.key}-${S.days}`)}.` : `Only ${dLabel(`${S.key}-${String(S.first).padStart(2, '0')}`)} to ${dLabel(`${S.key}-${String(S.last).padStart(2, '0')}`)} is in this data. Totals may be partial.`;
      const html = `<section class="sc sc1" style="--vh:${S.hasIncome ? 230 : 160}"><div class="sc-pin">
  <div class="g-orbs" aria-hidden="true">${S.hasIncome ? `<i class="o-in" style="--s:${rIn.toFixed(3)}"></i>` : ''}<i class="o-out" style="--s:${rOut.toFixed(3)}"></i></div>
  <div class="g-text">
    <p class="sc-k">${esc(mLabel(S.key))}</p>
    ${S.hasIncome ? `<p class="g-line l1"><b data-to="${S.moneyIn}">${m(S.moneyIn)}</b><span>came in</span></p>` : ''}
    <p class="g-line l2"><b data-to="${S.spent}">${m(S.spent)}</b><span>went out</span></p>
    ${S.hasIncome ? `<p class="g-verdict">${diff >= 0 ? `<em>${m(diff)}</em> was left over.` : `<em>${m(-diff)}</em> more went out than came in.`}</p>` : ''}
    ${out || back ? `<p class="g-save"><b>${m(net)}</b> actually saved<span>You moved ${m(out)} into savings${back ? ` and ${m(back)} back out` : ''}. Left over isn’t the same as saved.</span></p>` : ''}
    <p class="g-cov">${esc(cov)}${C.dupes ? ` ${C.dupes} overlapping ${C.dupes === 1 ? 'entry was' : 'entries were'} counted once.` : ''}</p>
  </div>
  <p class="sc-cue" aria-hidden="true">Scroll</p>
</div></section>`;
      const update = (n, p) => {
        n.style.setProperty('--p', p.toFixed(3));
        n.classList.add('st1'); n.classList.toggle('st2', p > .22); n.classList.toggle('st3', p > .42); n.classList.toggle('st4', p > .6); n.classList.toggle('st5', p > .76);
        n.querySelectorAll('[data-to]').forEach((b, k) => { if (k === 0 && b.parentElement.classList.contains('l1')) return; const t = clamp((p - .22) / .2); b.textContent = m(Math.round(+b.dataset.to * (1 - Math.pow(1 - t, 3)))); });
      };
      return { html, update };
    }

    // 02 · pay stubs fan in, one per source
    function sceneIn() {
      if (!S.hasIncome && !S.own.length) return { html: `<section class="sc sc2 is-flow"><div class="sc-pin"><p class="sc-k">Money coming in</p><h2 class="sc-h">Not in <em>this data.</em></h2><p class="sc-p">Receipts show what you bought, not what you earned. Add a bank statement to see money coming in.</p></div></section>`, update() {} };
      const group = (list, type) => Object.values(list.reduce((o, t) => { (o[t.merchant] ??= { name: t.merchant, type, tx: [] }).tx.push(t); return o; }, {}));
      const srcs = [...group(S.inc, 'Earnings'), ...group(S.reimb, 'Paid back'), ...group(S.refunds, 'Refund'), ...group(S.cu, 'Needs context')];
      body._srcs = srcs;
      const html = `<section class="sc sc2" style="--vh:${150 + srcs.length * 35}"><div class="sc-pin">
  <p class="sc-k">Money coming in</p><h2 class="sc-h">Where it <em>came from.</em></h2>
  <div class="stubs">${srcs.map((s, k) => { const amt = S.sum(s.tx); return `<button class="stub" data-r="src" data-k="${k}" style="--k:${k};--n:${srcs.length}"><span class="stub-a">${esc(s.type.toUpperCase())}</span><span class="stub-t">${esc(s.name)}</span><span class="stub-f">${esc(s.type === 'Earnings' ? freq(s.tx) : s.tx.length === 1 ? 'Once this month' : s.tx.length + ' payments')}</span><b class="stub-v">${m(amt)}</b><span class="stub-zig" aria-hidden="true"></span></button>`; }).join('')}</div>
  ${S.own.length ? `<button class="sc-pill" data-r="own">${m(S.sum(S.own))} moved between your own accounts. Not counted.</button>` : ''}
</div></section>`;
      const update = (n, p) => n.querySelectorAll('.stub').forEach((s, k) => s.classList.toggle('is-on', p > .08 + k * (.6 / srcs.length)));
      return { html, update };
    }

    // 03 · the cake: scrolling serves one slice at a time
    const CAKE = ['#E0483C', '#2F6FE0', '#F3C74A', '#4FA35E', '#8A5BD6', '#F08A4B', '#F6E7CC', '#E77FA6', '#60B7C9', '#A88A5A', '#9AA6F7', '#1d1b2e'];
    function sceneCake() {
      if (!S.cats.length) return { html: `<section class="sc sc3 is-flow"><div class="sc-pin"><p class="sc-k">Where it went</p><h2 class="sc-h">No purchases <em>this month.</em></h2></div></section>`, update() {} };
      const big = S.cats.filter((c, k) => k < 7 && c.cents / (S.spent || 1) >= .03), cats = big.length ? big : S.cats.slice(0, 1), rest = S.cats.filter(c => !cats.includes(c));
      if (rest.length) cats.push({ name: 'Everything else', cents: rest.reduce((s, c) => s + c.cents, 0), n: rest.reduce((s, c) => s + c.n, 0), tx: rest.flatMap(c => c.tx) });
      body._cake = cats;
      const total = S.spent || 1, cx = 180, cy = 150, r = 150, depth = 34; let a0 = -Math.PI / 2;
      const parts = cats.map((c, k) => { const a1 = a0 + c.cents / total * Math.PI * 2, o = { a0, a1, c: CAKE[k % CAKE.length] }; a0 = a1; return o; });
      const arc = (p, oy) => { const x0 = cx + r * Math.cos(p.a0), y0 = cy + oy + r * Math.sin(p.a0) * .6, x1 = cx + r * Math.cos(p.a1), y1 = cy + oy + r * Math.sin(p.a1) * .6; return `M${cx} ${cy + oy} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r * .6} 0 ${p.a1 - p.a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`; };
      const unclear = S.spendT.filter(t => t.flow === 'unclear');
      const html = `<section class="sc sc3" style="--vh:${120 + cats.length * 40}"><div class="sc-pin">
  <p class="sc-k">Where it went</p>
  <h2 class="sc-h"><span>${m(S.spent)}</span> <em>across ${S.spendT.length} purchases.</em></h2>
  <div class="cake"><svg viewBox="0 0 360 360" role="group" aria-label="Spending by category">${parts.map((p, k) => { const mid = (p.a0 + p.a1) / 2; return `<g class="slice" data-r="cat" data-k="${k}" style="--dx:${(Math.cos(mid) * 26).toFixed(1)}px;--dy:${(Math.sin(mid) * 16).toFixed(1)}px" role="button" tabindex="0" aria-label="${esc(cats[k].name)}, ${Math.round(cats[k].cents / total * 100)}%"><path d="${arc(p, depth)}" fill="#6B3E2E" stroke="#1d1b2e" stroke-width="1.6"/><path d="${arc(p, 0)}" fill="${p.c}" stroke="#1d1b2e" stroke-width="1.6"/></g>`; }).join('')}</svg></div>
  <div class="cake-l" aria-live="polite"><span class="cl-sw"></span><b class="cl-n"></b><span class="cl-v"></span><span class="cl-m"></span></div>
  <div class="cake-links"><button class="sc-pill" data-r="slice">See these purchases</button><button class="sc-link" data-r="allcats">All categories</button>${unclear.length ? `<button class="sc-link" data-r="unclear">${unclear.length} ${unclear.length === 1 ? 'needs' : 'need'} context</button>` : ''}</div>
</div></section>`;
      let cur = -1;
      const show = (n, k) => {
        if (k === cur) return; cur = k; body._slice = k; const c = cats[k];
        n.querySelectorAll('.slice').forEach((g, j) => g.classList.toggle('is-on', j === k));
        n.querySelector('.cl-sw').style.background = CAKE[k % CAKE.length];
        n.querySelector('.cl-n').textContent = c.name;
        n.querySelector('.cl-v').textContent = `${m(c.cents)} · ${Math.round(c.cents / total * 100)}%`;
        n.querySelector('.cl-m').textContent = ESSENTIAL.has(c.name) ? 'Essential. A need, not a habit, so no commentary.' : `${c.n} ${c.n === 1 ? 'purchase' : 'purchases'}`;
        if (!still) n.querySelector('.cake-l').animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE });
      };
      const update = (n, p) => show(n, Math.min(cats.length - 1, Math.floor(clamp((p - .05) / .9) * cats.length)));
      return { html, update, pick: (n, k) => show(n, k) };
    }

    // 04 · the wall calendar fills in as you scroll
    function sceneCal() {
      const firstDow = new Date(+S.key.slice(0, 4), +S.key.slice(5, 7) - 1, 1).getDay();
      const byDay = Array.from({ length: S.days }, () => 0); S.spendT.forEach(t => { byDay[+t.date.slice(8, 10) - 1] += t.cents; });
      const mx = Math.max(...byDay) || 1, zero = byDay.map((v, k) => !v && k + 1 >= S.first && k + 1 <= S.last), nZero = zero.filter(Boolean).length;
      let streak = 0, run = 0; zero.forEach(z => { run = z ? run + 1 : 0; streak = Math.max(streak, run); });
      const cells = Array.from({ length: firstDow }, () => '<span></span>').join('') + byDay.map((v, k) => `<button class="day${zero[k] ? ' is-zero' : ''}${v / mx > .45 ? ' is-dark' : ''}" data-r="day" data-d="${k + 1}" style="--a:${v ? (.16 + .84 * v / mx).toFixed(2) : 0}" aria-label="${dLabel(`${S.key}-${String(k + 1).padStart(2, '0')}`)}: ${v ? m(v) : 'nothing spent'}">${k + 1}</button>`).join('');
      const html = `<section class="sc sc4" style="--vh:190"><div class="sc-pin">
  <p class="sc-k">Your everyday habits</p>
  <div class="wall"><div class="wall-h"><span>${S.key.slice(0, 4)}</span><b>${esc(new Date(+S.key.slice(0, 4), +S.key.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long' }))}</b><i>${+S.key.slice(5, 7)}</i></div>
    <div class="wall-d">${DAYS.map(d => `<b>${d}</b>`).join('')}</div><div class="wall-g">${cells}</div></div>
  <div class="wall-c"><p>${nZero ? `<b>${nZero}</b> ${nZero === 1 ? 'day' : 'days'} with no spending${streak > 1 ? `, ${streak} in a row at best` : ''}.` : 'Darker days cost more.'} Tap a day.</p>${flag('cal')}</div>
</div></section>`;
      const update = (n, p) => { const lit = Math.round(clamp((p - .05) / .7) * S.days); n.querySelectorAll('.day').forEach((d, k) => d.classList.toggle('is-lit', k < lit)); };
      return { html, update };
    }

    // 05 · habits in type: the words themselves carry the size
    function sceneHabits() {
      const H = S.habit, nWe = Array.from({ length: S.days }, (_, k) => dayOf(`${S.key}-${String(k + 1).padStart(2, '0')}`)).filter(d => d === 0 || d === 6).length;
      const we = H.filter(t => [0, 6].includes(dayOf(t.date))), weAvg = S.sum(we) / (nWe || 1), wdAvg = (S.sum(H) - S.sum(we)) / ((S.days - nWe) || 1), mx = Math.max(weAvg, wdAvg) || 1;
      const reps = Object.entries(H.reduce((o, t) => { o[t.merchant] = (o[t.merchant] || 0) + 1; return o; }, {})).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const small = H.filter(t => t.cents < 1000), subs = S.spendT.filter(t => t.category === 'Subscriptions'), multi = months().length >= 2;
      const html = `<section class="sc sc4b is-flow"><div class="sc-pin">
  ${H.length >= 6 ? `<div class="duo rv">${flag('week')}<p class="duo-a" style="--f:${(.45 + .55 * wdAvg / mx).toFixed(2)}">Weekdays<span>${m(wdAvg)} a day</span></p><p class="duo-b" style="--f:${(.45 + .55 * weAvg / mx).toFixed(2)}">Weekends<span>${m(weAvg)} a day</span></p><p class="sc-fine">Everyday spending only. Rent, bills and essentials stay out of it.</p></div>` : ''}
  ${reps.length ? `<div class="regs rv"><div class="rv-h"><h3 class="sc-h3">Your regulars</h3>${flag('reps')}</div>${reps.map(([name, n], k) => `<p class="reg" style="--k:${k}"><span>${esc(name)}</span><b>×${n}</b></p>`).join('')}</div>` : ''}
  ${small.length >= 3 ? `<div class="smalls rv"><div class="rv-h"><h3 class="sc-h3">Little things</h3>${flag('small')}</div><p class="smalls-l"><b>${small.length}</b> purchases under $10 came to <em>${m(S.sum(small))}</em>.</p></div>` : ''}
  ${subs.length ? `<div class="subs rv"><h3 class="sc-h3">${multi ? 'Charges that come back' : 'Subscriptions this month'}</h3><div class="slip">${subs.map(t => `<p><span>${esc(t.merchant)}</span><b>${m(t.cents)}</b></p>`).join('')}<p class="slip-t"><span>Total</span><b>${m(S.sum(subs))}</b></p></div>${!multi ? '<p class="sc-fine">One month can’t show what repeats. Add another month to see recurring charges.</p>' : ''}</div>` : ''}
</div></section>`;
      return { html, update() {} };
    }

    // 06 · patterns slide sideways while you scroll down
    function scenePatterns() {
      if (!F.length) return { html: `<section class="sc sc5 is-flow"><div class="sc-pin"><p class="sc-k">Patterns worth a closer look</p><h2 class="sc-h">Nothing <em>stood out.</em></h2><p class="sc-p">No pattern strong enough to call one. A quiet month. Honestly? That’s a good sign.</p></div></section>`, update() {} };
      const vis = f => {
        const c = f.chart;
        if (c.kind === 'timeline') { const set = new Set(c.win); return `<svg class="pt-v" viewBox="0 0 300 60" aria-hidden="true">${Array.from({ length: S.days }, (_, k) => { const d = k + 1, v = S.habit.filter(t => +t.date.slice(8, 10) === d).reduce((s, t) => s + t.cents, 0), h = Math.min(50, v / 1200); return `<rect x="${k * (300 / S.days)}" y="${56 - h}" width="${300 / S.days - 2}" height="${h + 2}" rx="1.5" class="${set.has(d) ? 'hot' : ''}"/>`; }).join('')}</svg>`; }
        if (c.kind === 'pair') return `<p class="pt-big"><span>${m(c.a.cents)}<small>in · ${dLabel(c.a.date)}</small></span><i>→</i><span>${m(c.b.cents)}<small>back · ${dLabel(c.b.date)}</small></span></p>`;
        if (f.id === 'small') return `<p class="pt-big"><span>${c.n}<small>little purchases</small></span><i>=</i><span>${m(S.sum(f.tx))}<small>in total</small></span></p>`;
        if (c.kind === 'dots') return `<p class="pt-big"><span>×${c.n}<small>this month</small></span></p>`;
        if (c.kind === 'bars') return `<p class="pt-big"><span>${m(c.a)}<small>weekday</small></span><i>/</i><span>${m(c.b)}<small>weekend</small></span></p>`;
        return '';
      };
      const html = `<section class="sc sc5" style="--vh:${100 + F.length * 70}"><div class="sc-pin">
  <p class="sc-k">Patterns worth a closer look</p>
  <div class="pt-view"><div class="pt-track">${F.map((f, k) => `<article class="pt" style="--k:${k}"><span class="pt-n">${String(k + 1).padStart(2, '0')} / ${String(F.length).padStart(2, '0')}</span><h3 class="pt-h">${esc(f.title)}</h3>${vis(f)}<p class="pt-p">${esc(f.body)}</p><div class="pt-a"><button class="sc-pill" data-r="ftx" data-k="${k}">See the ${f.tx.length} ${f.tx.length === 1 ? 'purchase' : 'transactions'}</button>${flag('f' + k)}</div></article>`).join('')}</div></div>
</div></section>`;
      const update = (n, p) => { const t = n.querySelector('.pt-track'), card = t.firstElementChild; if (!card) return; const step = card.offsetWidth + 16; t.style.transform = `translateX(${(-clamp((p - .08) / .84) * (F.length - 1) * step).toFixed(1)}px)`; };
      return { html, update };
    }

    function sceneEnd() {
      return { html: `<section class="sc sc6 is-flow"><div class="sc-pin"><h2 class="sc-h">That was <em>${esc(new Date(+S.key.slice(0, 4), +S.key.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long' }))}.</em></h2><p class="sc-p">${isSample ? 'Built from a sample statement. Upload yours to see your own month.' : 'Built from your uploads, on this device.'}</p><div class="end-a">${api.openWrap ? '<button class="end-go" data-r="wrap">Watch the Wrap</button>' : ''}<button class="sc-link" data-r="back">Back to dashboard</button></div></div></section>`, update() {} };
    }

    // =========================== paint + scroll ===========================
    function paint(keepScroll) {
      const y = page.scrollTop;
      S = summarize(C.list, key); F = findings(S, m);
      const ms = months(), i = ms.indexOf(key);
      el.querySelector('.rc-month b').textContent = mLabel(key);
      el.querySelector('[data-r="prev"]').disabled = i <= 0; el.querySelector('[data-r="next"]').disabled = i >= ms.length - 1;
      const list = [sceneGlance(), sceneIn(), sceneCake(), sceneCal(), sceneHabits(), scenePatterns(), sceneEnd()];
      body.innerHTML = list.map(s => s.html).join('');
      const nodes = [...body.querySelectorAll('.sc')];
      scenes = nodes.map((n, k) => ({ n, s: list[k] }));
      body._cakeScene = scenes.find(x => x.n.classList.contains('sc3'));
      if (keepScroll) page.scrollTop = y;
      revealObs(); tick();
      const first = body.querySelector('.sc1 .l1 b'); if (first && !still) { const to = +first.dataset.to, t0 = performance.now(); const step = now => { const q = Math.min(1, (now - t0) / 1100); first.textContent = m(Math.round(to * (1 - Math.pow(1 - q, 3)))); if (q < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    }
    let raf = 0;
    const tick = () => {
      raf = 0; const vh = page.clientHeight;
      const doc = page.scrollHeight - vh; page.querySelector('.rc-prog i').style.transform = `scaleX(${doc > 0 ? clamp(page.scrollTop / doc) : 1})`;
      scenes.forEach(({ n, s }) => { if (n.classList.contains('is-flow')) return; const r = n.getBoundingClientRect(), span = n.offsetHeight - vh; const p = still ? 1 : span > 0 ? clamp(-r.top / span) : (r.top < vh ? 1 : 0); if (n._p !== p) { n._p = p; s.update(n, p); } });
    };
    page.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    window.addEventListener('resize', () => { if (page.isConnected && !raf) raf = requestAnimationFrame(tick); });
    let io = null;
    function revealObs() {
      io?.disconnect(); const items = body.querySelectorAll('.rv');
      if (still || !('IntersectionObserver' in window)) { items.forEach(x => x.classList.add('is-in')); return; }
      io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { root: page, threshold: .25 });
      items.forEach(x => io.observe(x));
    }

    // =========================== sheets + corrections ===========================
    function sheet(html, onClick) {
      el.querySelector('.rc-sheet')?.remove();
      const w = document.createElement('div'); w.className = 'rc-sheet';
      w.innerHTML = `<div class="rc-scrim" data-x="close"></div><div class="rc-panel" role="dialog" aria-modal="true" aria-labelledby="rc-sh-t"><span class="rc-grab" aria-hidden="true"></span><button class="rc-gc rc-sm rc-x" data-x="close" aria-label="Close">${I('<path d="M6 6l12 12M18 6 6 18"/>')}</button>${html}</div>`;
      page.append(w);
      const prev = document.activeElement, panel = w.querySelector('.rc-panel');
      const close = () => { if (!w.isConnected) return; if (still) w.remove(); else { panel.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }); w.querySelector('.rc-scrim').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => w.remove()); } prev?.focus?.({ preventScroll: true }); };
      if (!still) { panel.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 380, easing: EASE }); w.querySelector('.rc-scrim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); }
      w.addEventListener('click', e => { if (e.target.closest('[data-x="close"]')) { close(); return; } onClick?.(e, close, w); });
      w.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
      const h = w.querySelector('h2') || panel; h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
      return { close, w };
    }
    function txSheet(title, sub, list) {
      sheet(`<h2 class="rc-sh-t" id="rc-sh-t">${esc(title)}</h2>${sub ? `<p class="rc-sh-s">${esc(sub)}</p>` : ''}<div class="rc-sh-list">${[...list].sort((a, b) => a.date.localeCompare(b.date)).map(t => txRow(t)).join('') || '<p class="rc-sh-s">Nothing here.</p>'}</div>`, e => {
        const f = e.target.closest('[data-r="flagtx"]'); if (f) { const t = C.list.find(x => x.id === f.dataset.id); if (t) correct([t], `${t.merchant} · ${dLabel(t.date)}`); }
      });
    }
    function catSheet() {
      sheet(`<h2 class="rc-sh-t" id="rc-sh-t">All categories</h2><p class="rc-sh-s">${m(S.spent)} across ${S.spendT.length} purchases</p><div class="rc-sh-list">${S.cats.map((c, k) => `<button class="rc-catrow" data-c="${k}"><span>${esc(c.name)}${ESSENTIAL.has(c.name) ? ' · Essential' : ''}</span><small>${c.n} · ${Math.round(c.cents / (S.spent || 1) * 100)}%</small><b>${m(c.cents)}</b></button>`).join('')}</div>`, e => {
        const b = e.target.closest('[data-c]'); if (b) { const c = S.cats[+b.dataset.c]; txSheet(c.name, `${c.n} ${c.n === 1 ? 'purchase' : 'purchases'} · ${m(c.cents)}`, c.tx); }
      });
    }
    const CHOICES = [['emergency', 'This was an emergency.'], ['onetime', 'This was a one-time expense.'], ['own', 'This was a transfer between my accounts.'], ['reimbursed', 'I was reimbursed.'], ['edit', 'The category or amount is incorrect.'], ['exclude', 'Leave this out of my habit insights.']];
    function correct(list, label) {
      const one = list.length === 1 ? list[0] : null;
      sheet(`<h2 class="rc-sh-t" id="rc-sh-t">Add context</h2><p class="rc-sh-s">${esc(label)}${list.length > 1 ? ` · applies to ${list.length} transactions` : ''}</p>
  <form class="rc-form"><fieldset><legend class="fw-sr">What should we know?</legend>${CHOICES.filter(c => one || c[0] !== 'edit').map(([v, t], k) => `<label class="rc-opt"><input type="radio" name="c" value="${v}" ${k === 0 ? 'required' : ''}><span>${esc(t)}</span></label>`).join('')}</fieldset>
  ${one ? `<div class="rc-edit" hidden><label><span>Category</span><select name="cat">${CATS.map(c => `<option ${c === one.category ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><label><span>Amount</span><span class="rc-amt"><i>$</i><input name="amt" inputmode="decimal" value="${(one.cents / 100).toFixed(2)}"></span></label></div>` : ''}
  <label class="rc-notef"><span>Note (optional)</span><input name="note" maxlength="80" placeholder="A few words"></label>
  <button class="rc-submit" type="submit">Save</button></form>`);
      const w = el.querySelector('.rc-sheet'), form = w.querySelector('form');
      form.addEventListener('change', () => { const e = w.querySelector('.rc-edit'); if (e) e.hidden = form.c.value !== 'edit'; });
      form.addEventListener('submit', e => {
        e.preventDefault(); const type = form.c.value; if (!type) return;
        const before = JSON.stringify(corr);
        list.forEach(t => { const c = { type, note: form.note.value.trim() || undefined }; if (type === 'edit') { c.category = form.cat.value; const v = Math.round(parseFloat(String(form.amt.value).replace(/[^0-9.]/g, '')) * 100); if (v > 0) c.cents = v; } corr[t.id] = c; });
        write(corr); C = classify(raw, corr); w.remove(); paint(true);
        const msg = type === 'own' ? `Counted as a move between your accounts. Spending is now ${m(S.spent)}.` : type === 'edit' ? `Updated. Spending is now ${m(S.spent)}.` : type === 'reimbursed' ? 'Marked as reimbursed and left out of habit insights. It still counts as money spent.' : `Left out of habit insights. Spending stays ${m(S.spent)}.`;
        toast(msg, () => { corr = JSON.parse(before); write(corr); C = classify(raw, corr); paint(true); toast('Change undone.'); });
      });
    }
    let tt = 0;
    function toast(text, onUndo) {
      const t = el.querySelector('.rc-toast'); clearTimeout(tt);
      t.innerHTML = `<span>${esc(text)}</span>${onUndo ? '<button data-r="undo">Undo</button>' : ''}`; t.hidden = false; undo = onUndo || null;
      if (!still) t.animate([{ opacity: 0, transform: 'translate(-50%,12px)' }, { opacity: 1, transform: 'translate(-50%,0)' }], { duration: 300, easing: EASE });
      tt = setTimeout(() => { t.hidden = true; undo = null; }, 7000);
    }

    // =========================== clicks ===========================
    const leave = () => { io?.disconnect(); document.documentElement.classList.remove('fh-locked'); };
    page.addEventListener('click', e => {
      const b = e.target.closest('[data-r]'); if (!b || b.closest('.rc-sheet')) return;
      const k = +b.dataset.k, r = b.dataset.r;
      if (r === 'back') { leave(); api.back(); return; }
      if (r === 'wrap') { leave(); api.openWrap(); return; }
      if (r === 'prev' || r === 'next') { const ms = months(), j = ms.indexOf(key) + (r === 'next' ? 1 : -1); if (ms[j]) { key = ms[j]; page.scrollTop = 0; paint(); } return; }
      if (r === 'undo') { const u = undo; el.querySelector('.rc-toast').hidden = true; u?.(); return; }
      if (r === 'src') { const s = body._srcs[k]; txSheet(s.name, `${s.tx.length} ${s.tx.length === 1 ? 'payment' : 'payments'} · ${m(S.sum(s.tx))}`, s.tx); return; }
      if (r === 'own') { txSheet('Moves between your accounts', 'Not counted as money in or spending.', S.own); return; }
      if (r === 'cat' || r === 'slice') { const j = r === 'cat' ? k : body._slice ?? 0, c = body._cake[j]; body._cakeScene?.s.pick?.(body._cakeScene.n, j); txSheet(c.name, `${c.n} ${c.n === 1 ? 'purchase' : 'purchases'} · ${m(c.cents)}${ESSENTIAL.has(c.name) ? ' · Essential' : ''}`, c.tx); return; }
      if (r === 'allcats') { catSheet(); return; }
      if (r === 'unclear') { txSheet('Needs context', 'We couldn’t tell what these were, so they count as spending without a category.', S.spendT.filter(t => t.flow === 'unclear')); return; }
      if (r === 'day') { const d = `${S.key}-${String(b.dataset.d).padStart(2, '0')}`, list = S.tx.filter(t => t.date === d); txSheet(new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), list.length ? `${list.length} ${list.length === 1 ? 'transaction' : 'transactions'}` : 'Nothing spent. A quiet day.', list); return; }
      if (r === 'ftx') { const f = F[k]; txSheet(f.title, `${f.tx.length} transactions behind this`, f.tx); return; }
      if (r === 'flagtx') { const t = C.list.find(x => x.id === b.dataset.id); if (t) correct([t], `${t.merchant} · ${dLabel(t.date)}`); return; }
      if (r === 'flag') {
        const id = b.dataset.i, H = S.habit; let list = [], label = '';
        if (id === 'cal') { list = H; label = 'Spending by day'; } else if (id === 'week') { list = H.filter(t => [0, 6].includes(dayOf(t.date))); label = 'Weekdays and weekends'; }
        else if (id === 'reps') { const names = new Set(Object.entries(H.reduce((o, t) => { o[t.merchant] = (o[t.merchant] || 0) + 1; return o; }, {})).filter(([, n]) => n >= 3).map(([n]) => n)); list = H.filter(t => names.has(t.merchant)); label = 'Your regulars'; }
        else if (id === 'small') { list = H.filter(t => t.cents < 1000); label = 'Little things'; }
        else if (id[0] === 'f') { const f = F[+id.slice(1)]; list = f.tx; label = f.title; }
        if (list.length) correct(list, label);
      }
    });
    page.addEventListener('keydown', e => { const g = e.target.closest('.slice'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });

    paint();
  }

  window.FaiitRecap = { render, sampleRows };
})();
