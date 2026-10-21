/* chala v3 — Recap. One idea per full screen; the scroll snaps from one to the next.
   Light screens, each on its own soft colour wash, with a graphic that plays as it arrives:
     1 Money in and out: what you spent, and two bars that show the gap between in and out
     2 Where it came from: pay stubs that fan in
     3 Where it went: a donut you can tap, one slice per category
     4 Needs vs. everything else
     5 Your days: a wall calendar that fills in
     6 Your week: weekdays and weekends, sized by what they cost
     7 Your regulars
   Then a dark run of screens: up to 5 spending patterns, each with its own small graphic, plain
   words, why it happens and one thing to try, and a total that counts each purchase once.
   Tap a slice, a stub, a day, a regular or a pattern to see the purchases behind it. */
(() => {
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const ESSENTIAL = new Set(['Rent & bills', 'Groceries', 'Health', 'Transport', 'Education']);
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOf = d => new Date(d + 'T12:00:00').getDay();
  const dLabel = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const mName = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  const mLabel = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysIn = k => new Date(+k.slice(0, 4), +k.slice(5, 7), 0).getDate();
  // a period is a month ('2026-09') or a week ('W:2026-09-14', Monday to Sunday)
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const addDays = (x, n) => { const d = new Date(x + 'T12:00:00'); d.setDate(d.getDate() + +n); return iso(d); };
  const monday = x => { const d = new Date(x + 'T12:00:00'); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); };
  function period(key) {
    if (key.startsWith('W:')) {
      const start = key.slice(2), end = addDays(start, 6), a = new Date(start + 'T12:00:00'), b = new Date(end + 'T12:00:00');
      const label = a.getMonth() === b.getMonth() ? `${dLabel(start)} – ${b.getDate()}, ${b.getFullYear()}` : `${dLabel(start)} – ${dLabel(end)}, ${b.getFullYear()}`;
      return { kind: 'W', key, start, end, days: 7, label, short: label.replace(/, \d{4}$/, ''), name: `the week of ${dLabel(start)}`, unit: 'week', perYear: 52, full: 7 };
    }
    const days = daysIn(key);
    return { kind: 'M', key, start: `${key}-01`, end: `${key}-${String(days).padStart(2, '0')}`, days, label: mLabel(key),
      short: new Date(+key.slice(0, 4), +key.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), name: mName(key), unit: 'month', perYear: 12, full: 30.4 };
  }
  const sum = l => l.reduce((s, t) => s + t.cents, 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const RX = {
    bnpl: /afterpay|klarna|affirm|sezzle|quadpay|zip pay/i,
    fees: /overdraft|\bnsf\b|insufficient|late fee|atm fee|service fee|maintenance fee|monthly fee/i,
    streaming: /netflix|hulu|disney|\bmax\b|hbo|spotify|youtube|apple tv|peacock|paramount|crunchyroll|prime video|audible|apple music/i
  };
  const PLAIN = { 'Food delivery': 'Food delivery', Dining: 'Eating out', 'Cafés': 'Coffee & cafés', Groceries: 'Groceries', Shopping: 'Shopping', Transport: 'Getting around', Subscriptions: 'Subscriptions', Travel: 'Travel', Health: 'Health', 'Rent & bills': 'Rent & bills', Education: 'School', Other: 'Other' };
  const PIE = ['#B9A8E0', '#E3A994', '#8FB9A0', '#9CB5E0', '#EBC3CB', '#D7C9A8', '#C9C4BC'];

  // ---------- every row as a money flow ----------
  function classify(rows) {
    const seen = new Set(), out = [];
    const merchants = new Set(rows.filter(r => r.kind === 'expense').map(r => (r.merchant || '').toLowerCase().split(/\s+/)[0]));
    rows.forEach(r => {
      if (!r || !r.date || !(r.cents > 0) || r.include === false) return;
      const key = `${r.date}|${(r.merchant || '').toLowerCase()}|${r.cents}|${r.kind}|${r.source || ''}`;
      if (seen.has(key)) return; seen.add(key);
      const m = (r.merchant || '').toLowerCase();
      let flow;
      if (/savings/.test(m)) flow = r.kind === 'credit' ? 'saveIn' : 'saveOut';
      else if (r.kind === 'transfer') flow = 'own';
      else if (r.kind === 'credit') {
        if (/payroll|salary|direct dep|stipend|wages|paycheck|\badp\b|gusto|employer|fellowship/.test(m)) flow = 'income';
        else if (/refund|return|reversal/.test(m) || merchants.has(m.split(/\s+/)[0])) flow = 'refund';
        else if (/venmo|zelle|cash ?app|paypal/.test(m)) flow = 'reimb';
        else if (/transfer|from chk|from checking|online banking/.test(m)) flow = 'own';
        else flow = 'otherIn';
      } else flow = 'spend';
      out.push({ date: r.date, merchant: r.merchant || 'Unknown', cents: r.cents, category: r.category || 'Other', flow, essential: ESSENTIAL.has(r.category) });
    });
    return out;
  }
  function summarize(all, key) {
    const pd = period(key), t0 = new Date(pd.start + 'T12:00:00');
    const ix = d => Math.round((new Date(d + 'T12:00:00') - t0) / 864e5) + 1, at = k => addDays(pd.start, k - 1);
    const tx = all.filter(t => t.date >= pd.start && t.date <= pd.end), spendT = tx.filter(t => t.flow === 'spend');
    const inc = tx.filter(t => t.flow === 'income'), refunds = tx.filter(t => t.flow === 'refund'), reimb = tx.filter(t => t.flow === 'reimb'), otherIn = tx.filter(t => t.flow === 'otherIn');
    const sOut = tx.filter(t => t.flow === 'saveOut'), sIn = tx.filter(t => t.flow === 'saveIn'), own = tx.filter(t => t.flow === 'own');
    const days = pd.days, dates = tx.map(t => ix(t.date));
    const first = dates.length ? Math.min(...dates) : 1, last = dates.length ? Math.max(...dates) : days;
    const cats = Object.values(spendT.reduce((o, t) => { (o[t.category] ??= { name: t.category, cents: 0, n: 0, tx: [] }); o[t.category].cents += t.cents; o[t.category].n++; o[t.category].tx.push(t); return o; }, {})).sort((a, b) => b.cents - a.cents);
    const moneyIn = sum(inc) + sum(refunds) + sum(reimb) + sum(otherIn);
    return { key, pd, ix, at, tx, spendT, habit: spendT.filter(t => !t.essential), inc, refunds, reimb, otherIn, sOut, sIn, own, days, first, last, cats, spent: sum(spendT), moneyIn, hasIncome: moneyIn > 0, complete: pd.kind === 'W' ? first <= 2 && last >= days - 1 : first <= 3 && last >= days - 3 };
  }
  // how often a pay source arrives
  const freq = list => {
    if (list.length < 2) return 'Once this month';
    const ds = list.map(t => Math.round(Date.parse(t.date) / 864e5)).sort((a, b) => a - b), gaps = ds.slice(1).map((d, k) => d - ds[k]), g = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    return g >= 12 && g <= 16 ? `Every 2 weeks · ${list.length} deposits` : g >= 6 && g <= 8 ? `Weekly · ${list.length} deposits` : `${list.length} deposits`;
  };

  // ---------- the patterns: plain words, only when this month shows them ----------
  function patterns(S, M) {
    const out = [], H = S.habit, span = Math.max(1, S.last - S.first + 1);
    const del = S.spendT.filter(t => t.category === 'Food delivery');
    if (del.length >= 3) out.push({ title: 'Food delivery', cost: sum(del), tx: del, vis: { kind: 'boxes', n: del.length }, stat: plural(del.length, 'order'),
      line: `You ordered food delivery ${del.length} times. That cost ${M(sum(del))}, about ${M(sum(del) / del.length)} an order.`,
      why: 'The app shows the food price first. The service fee, delivery fee and tip come later, on separate lines, so you never see the full price in one place.',
      tip: 'Pick two nights a week for delivery. Cook or pick up on the rest.' });
    const small = H.filter(t => t.cents < 1000);
    if (small.length >= 6) out.push({ title: 'Small buys', cost: sum(small), tx: small, vis: { kind: 'coins', n: small.length }, stat: plural(small.length, 'small buy'),
      line: `Each one cost under $10. Together they added up to ${M(sum(small))}.`,
      why: 'Tapping a card or phone to pay doesn’t feel like spending. A few dollars at a time slips past without a second thought.',
      tip: 'Look at your total once a week. Seeing the sum is what makes small buys feel real.' });
    const subs = Object.values(S.spendT.filter(t => t.category === 'Subscriptions' || RX.streaming.test(t.merchant)).reduce((o, t) => { o[t.merchant] = t; return o; }, {})).sort((a, b) => b.cents - a.cents);
    if (subs.length >= 2) out.push({ title: 'Subscriptions', cost: sum(subs), tx: subs, vis: { kind: 'slip', rows: subs.slice(0, 5), total: sum(subs) }, stat: `${M(sum(subs))} a month`,
      line: `${plural(subs.length, 'subscription')} renewed on their own. That’s ${M(sum(subs) * 12)} a year.`,
      why: 'Free trials turn into paid plans automatically, and the cancel button is often hard to find on purpose.',
      tip: `Cancel one you didn’t use this ${S.pd.unit}. ${subs[0].merchant} is the biggest.` });
    const paydays = [...new Set(S.inc.map(t => S.ix(t.date)))].sort((a, b) => a - b);
    if (paydays.length >= 2 && H.length >= 10) {
      const win = new Set(); paydays.forEach(p => { for (let d = p; d < p + 3 && d <= S.days; d++) win.add(d); });
      const inWin = H.filter(t => win.has(S.ix(t.date))), share = sum(inWin) / (sum(H) || 1), expect = win.size / span;
      if (share >= expect * 1.3 && share >= .2) out.push({ title: 'Right after payday', cost: sum(inWin) - sum(H) * expect, tx: inWin, vis: { kind: 'timeline', win: [...win] }, stat: `${Math.round(share * 100)}%`,
        line: `of your everyday spending happened in the 3 days after you got paid. Those days are only ${Math.round(expect * 100)}% of the ${S.pd.unit}.`,
        why: 'A full account makes everything feel affordable, so money goes faster right after payday.',
        tip: 'Move money to savings on payday, before you have a chance to spend it.' });
    }
    const allD = Array.from({ length: span }, (_, k) => dayOf(`${S.at(S.first + k)}`));
    const nWe = allD.filter(d => d === 0 || d === 6).length, nWd = span - nWe, we = H.filter(t => [0, 6].includes(dayOf(t.date)));
    const weAvg = sum(we) / (nWe || 1), wdAvg = (sum(H) - sum(we)) / (nWd || 1);
    if (H.length >= 10 && nWe >= 2 && weAvg >= wdAvg * 1.3) out.push({ title: 'Weekends', cost: (weAvg - wdAvg) * nWe, tx: we, vis: { kind: 'bars', a: wdAvg, b: weAvg }, stat: `${(weAvg / (wdAvg || 1)).toFixed(1)}×`,
      line: `On a weekend day you spent ${M(weAvg)}. On a weekday, ${M(wdAvg)}.`,
      why: 'On weekends you have free time and you’re tired from the week. Apps know this and send their best deals on Friday nights.',
      tip: 'Plan one free thing for the weekend before Friday comes.' });
    const bnpl = S.spendT.filter(t => RX.bnpl.test(t.merchant));
    if (bnpl.length) out.push({ title: 'Pay later', cost: sum(bnpl), tx: bnpl, vis: { kind: 'split', total: sum(bnpl) }, stat: M(sum(bnpl)),
      line: `went to pay-later plans this ${S.pd.unit}. That’s money for things you bought earlier.`,
      why: 'Splitting a price into 4 payments makes it look 4 times smaller. You still pay the full price.',
      tip: 'Before you split a payment, ask: would I buy this if I paid it all today?' });
    const fees = S.spendT.filter(t => RX.fees.test(t.merchant));
    if (fees.length) out.push({ title: 'Bank fees', cost: sum(fees) + 2500, tx: fees, vis: { kind: 'below', total: sum(fees) }, stat: M(sum(fees)),
      line: 'in bank fees. You paid your bank because your balance ran low.',
      why: 'Many banks let a payment go through when there isn’t enough money, then charge you a fee for it.',
      tip: 'Ask your bank to turn off overdraft, so the card is declined instead of charging a fee.' });
    const reps = Object.entries(H.reduce((o, t) => { o[t.merchant] = (o[t.merchant] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
    if (reps[0] && reps[0][1] >= 6) {
      const list = H.filter(t => t.merchant === reps[0][0]);
      out.push({ title: 'Your go-to', cost: sum(list) * .5, tx: list, vis: { kind: 'dots', n: reps[0][1] }, stat: `${reps[0][1]}×`,
        line: `at ${reps[0][0]}. That’s about ${(reps[0][1] / span * 7).toFixed(1)} times a week, ${M(sum(list))} in total.`,
        why: 'A saved card and a one-tap reorder skip the moment where you’d normally stop and decide.',
        tip: 'Remove your saved card from that app, so each order takes a few more taps.' });
    }
    const pairs = S.sOut.map(o => ({ o, i: S.sIn.find(x => x.date >= o.date) })).filter(p => p.i);
    if (pairs.length) { const p = pairs[0]; out.push({ title: 'Savings that came back', cost: p.i.cents, tx: [p.o, p.i], vis: { kind: 'pair', a: p.o, b: p.i }, stat: M(p.i.cents),
      line: `came back out of savings on ${dLabel(p.i.date)}, after you put ${M(p.o.cents)} in on ${dLabel(p.o.date)}.`,
      why: 'When savings sits one tap away from your spending money, it’s easy to move it back.',
      tip: 'Keep savings at a different bank, so moving it back takes a day.' }); }
    return out.sort((a, b) => b.cost - a.cost).slice(0, 5);
  }

  // =================================================================
  function render(el, api) {
    const rawM = api.money, M = c => rawM(Math.round(c / 100) * 100).replace(/\.00$/, '');
    const raw = api.rows && api.rows.length ? api.rows : (window.FaiitRecap?.sampleRows?.() || []), isSample = !(api.rows && api.rows.length);
    const all = classify(raw);
    const spendDates = all.filter(t => t.flow === 'spend').map(t => t.date);
    const LISTS = { M: [...new Set(spendDates.map(d => d.slice(0, 7)))].sort(), W: [...new Set(spendDates.map(d => 'W:' + monday(d)))].sort() };
    let mode = String(api.key || '').startsWith('W:') ? 'W' : 'M';
    let key = LISTS[mode].includes(api.key) ? api.key : LISTS[mode].at(-1);
    const still = reduce();

    el.innerHTML = `<section class="cr" aria-label="Recap">
  <header class="cr-top">
    <button class="cr-gb" data-r="back" aria-label="Back">${I('<path d="M15 5l-7 7 7 7"/>')}</button>
    <div class="cr-mode" role="tablist" aria-label="Period"><button role="tab" data-r="mode" data-m="W">Week</button><button role="tab" data-r="mode" data-m="M">Month</button></div>
    <div class="cr-month"><button class="cr-pg" data-r="prev">${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button><b aria-live="polite"></b><button class="cr-pg" data-r="next">${I('<path d="M9.5 6l6 6-6 6"/>')}</button></div>
    <span class="cr-prog" aria-hidden="true"><i></i></span>
  </header>
  <div class="cr-scroll" tabindex="-1"></div>
</section>`;
    const page = el.querySelector('.cr'), sc = el.querySelector('.cr-scroll');
    document.documentElement.classList.add('fh-locked');
    let S, P, io = null, pick = 0;

    const r = (html, d = 0, cls = '') => `<div class="cr-r ${cls}" style="--d:${d}">${html}</div>`;
    const slide = (tone, label, inner, extra = '') => `<section class="cr-s cr-${tone}" data-tone="${tone === 'dark' || tone === 'night' ? 'dark' : 'light'}" aria-label="${esc(label)}" ${extra}><div class="cr-in">${inner}</div></section>`;

    // ---------- the pattern graphics ----------
    function vis(v) {
      if (v.kind === 'boxes' || v.kind === 'coins' || v.kind === 'dots') { const n = Math.min(v.n, v.kind === 'coins' ? 60 : 40); return `<div class="pv pv-${v.kind}" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i style="--k:${k}"></i>`).join('')}${v.n > n ? `<span>+${v.n - n}</span>` : ''}</div>`; }
      if (v.kind === 'slip') return `<div class="pv pv-slip">${v.rows.map((t, k) => `<p style="--k:${k}"><span>↻ ${esc(t.merchant)}</span><b>${M(t.cents)}</b></p>`).join('')}<p class="pv-tot"><span>Every month</span><b>${M(v.total)}</b></p></div>`;
      if (v.kind === 'timeline') { const set = new Set(v.win); return `<svg class="pv pv-time" viewBox="0 0 300 70" aria-hidden="true">${Array.from({ length: S.days }, (_, k) => { const d = k + 1, val = S.habit.filter(t => S.ix(t.date) === d).reduce((s, t) => s + t.cents, 0), h = Math.min(56, val / 900); return `<rect style="--k:${k}" x="${k * (300 / S.days)}" y="${62 - h}" width="${300 / S.days - 2}" height="${h + 2}" rx="1.5" class="${set.has(d) ? 'hot' : ''}"/>`; }).join('')}<line x1="0" x2="300" y1="64.5" y2="64.5"/></svg><p class="pv-key"><i class="hot"></i>3 days after payday</p>`; }
      if (v.kind === 'bars') { const mx = Math.max(v.a, v.b) || 1; return `<div class="pv pv-bars"><p><span>Weekday</span><i style="--w:${(v.a / mx * 100).toFixed(1)}%"></i><b>${M(v.a)}</b></p><p><span>Weekend</span><i class="hot" style="--w:${(v.b / mx * 100).toFixed(1)}%"></i><b>${M(v.b)}</b></p></div>`; }
      if (v.kind === 'split') return `<div class="pv pv-split" aria-hidden="true">${[0, 1, 2, 3].map(k => `<i style="--k:${k}">${M(v.total / 4)}</i>`).join('')}</div><p class="pv-key">Four small payments. Same full price: ${M(v.total)}.</p>`;
      if (v.kind === 'below') return `<svg class="pv pv-below" viewBox="0 0 300 80" aria-hidden="true"><line class="zero" x1="0" x2="300" y1="40" y2="40"/><path d="M0 18 L90 26 L150 34 L190 58 L230 50 L300 30"/><circle cx="190" cy="58" r="6"/><text x="196" y="76">${esc(M(v.total))} fee</text><text x="4" y="34" class="z">$0</text></svg>`;
      if (v.kind === 'pair') return `<p class="pv-pair"><span>${M(v.a.cents)}<small>in · ${dLabel(v.a.date)}</small></span><i>→</i><span>${M(v.b.cents)}<small>back out · ${dLabel(v.b.date)}</small></span></p>`;
      return '';
    }

    // ---------- the donut ----------
    function donut(rows) {
      const total = rows.reduce((s, c) => s + c.cents, 0) || 1, R = 70, gap = rows.length > 1 ? .8 : 0;
      let acc = 0;
      const segs = rows.map((c, k) => { const len = c.cents / total * 100, s = `<circle class="cr-seg" data-r="slice" data-k="${k}" cx="100" cy="100" r="${R}" pathLength="100" stroke="${PIE[k % PIE.length]}" style="--len:${Math.max(.01, len - gap).toFixed(2)};--off:${(-acc).toFixed(2)};--k:${k}" role="button" tabindex="0" aria-label="${esc(PLAIN[c.name] || c.name)}, ${M(c.cents)}, ${Math.round(c.cents / total * 100)}%"/>`; acc += len; return s; }).join('');
      return `<div class="cr-donut"><svg viewBox="0 0 200 200" role="group" aria-label="Where your money went, by category"><circle cx="100" cy="100" r="${R}" class="cr-ring"/>${segs}</svg>
        <div class="cr-mid" aria-live="polite"><small></small><b></b><span></span></div></div>
        <div class="cr-legend" role="group" aria-label="Categories">${rows.map((c, k) => `<button data-r="slice" data-k="${k}" aria-pressed="false"><i style="background:${PIE[k % PIE.length]}"></i><span>${esc(PLAIN[c.name] || c.name)}</span><b>${Math.round(c.cents / total * 100)}%</b></button>`).join('')}</div>`;
    }
    function pickSlice(k) {
      pick = k; const rows = sc._cats, c = rows[k], total = rows.reduce((s, x) => s + x.cents, 0) || 1, node = sc.querySelector('.cr-blush');
      if (!node || !c) return;
      node.querySelectorAll('.cr-seg').forEach((g, j) => g.classList.toggle('is-on', j === k));
      node.querySelectorAll('.cr-legend button').forEach((b, j) => b.setAttribute('aria-pressed', String(j === k)));
      node.querySelector('.cr-mid small').textContent = PLAIN[c.name] || c.name;
      node.querySelector('.cr-mid b').textContent = M(c.cents);
      node.querySelector('.cr-mid span').textContent = `${Math.round(c.cents / total * 100)}% · ${plural(c.n, 'purchase')}`;
      node.querySelector('.cr-see').textContent = `See the ${plural(c.n, 'purchase')}`;
      if (!still) node.querySelector('.cr-mid').animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
    }

    function screens() {
      const list = [], partial = !S.complete;
      const kicker = S.pd.label;
      const left = S.moneyIn - S.spent, saved = sum(S.sOut) - sum(S.sIn);

      // 1 · money in and out
      const mx = Math.max(S.moneyIn, S.spent) || 1, lo = Math.min(S.moneyIn, S.spent);
      const io = S.hasIncome ? `<div class="cr-io" role="img" aria-label="Came in ${M(S.moneyIn)}, went out ${M(S.spent)}. ${left >= 0 ? `${M(left)} left over` : `${M(-left)} more went out than came in`}.">
          <div class="io-row io-in"><span class="io-l">Came in</span><span class="io-bar"><i style="--w:${(S.moneyIn / mx * 100).toFixed(1)}%">${left > 0 ? `<em class="io-gap" style="--g:${((S.moneyIn - lo) / S.moneyIn * 100).toFixed(1)}%"></em>` : ''}</i></span><b>${M(S.moneyIn)}</b></div>
          <div class="io-row io-out"><span class="io-l">Went out</span><span class="io-bar"><i style="--w:${(S.spent / mx * 100).toFixed(1)}%">${left < 0 ? `<em class="io-gap" style="--g:${((S.spent - lo) / S.spent * 100).toFixed(1)}%"></em>` : ''}</i></span><b>${M(S.spent)}</b></div>
          <p class="io-note ${left >= 0 ? 'is-up' : 'is-down'}"><i></i>${left >= 0 ? `<b>${M(left)}</b> left over` : `<b>${M(-left)}</b> more went out than came in`}</p>
        </div>` : '';
      list.push(slide('lav', 'Money in and out', `
        ${r(`<p class="cr-k">${esc(kicker)}</p>`, 0)}
        ${r(`<h1 class="cr-h">You spent <b class="cr-big" data-to="${S.spent}">${M(S.spent)}</b></h1>`, 1)}
        ${r(`<p class="cr-p">${plural(S.spendT.length, 'purchase')}${partial ? ` so far this ${S.pd.unit}` : ''}. Moving money to savings or between your own accounts isn’t counted.</p>`, 2)}
        ${S.hasIncome ? r(io, 3) : r(`<p class="cr-fine">This data shows purchases only, so money coming in isn’t shown.</p>`, 3)}
        ${saved > 0 ? r(`<p class="cr-fine">You also moved <b>${M(saved)}</b> into savings.</p>`, 4) : ''}
        <p class="cr-cue" aria-hidden="true">${I('<path d="M6 10l6 6 6-6"/>')}Scroll</p>`));

      // 2 · where it came from: pay stubs
      if (S.hasIncome) {
        const group = (l, type) => Object.values(l.reduce((o, t) => { (o[t.merchant] ??= { name: t.merchant, type, tx: [] }).tx.push(t); return o; }, {}));
        const srcs = [...group(S.inc, 'Pay'), ...group(S.reimb, 'Paid back to you'), ...group(S.refunds, 'Refund'), ...group(S.otherIn, 'Other money in')].slice(0, 4);
        sc._srcs = srcs;
        list.push(slide('peach', 'Where your money came from', `
          ${r(`<p class="cr-k">Money in</p>`, 0)}
          ${r(`<h2 class="cr-h2">Where it <em>came from</em></h2>`, 1)}
          <div class="cr-stubs">${srcs.map((s, k) => `<button class="cr-stub" data-r="src" data-k="${k}" style="--k:${k}"><span class="st-a">${esc(s.type)}</span><span class="st-t">${esc(s.name)}</span><span class="st-f">${esc(s.type === 'Pay' ? freq(s.tx) : plural(s.tx.length, 'payment'))}</span><b class="st-v">${M(sum(s.tx))}</b><span class="st-zig" aria-hidden="true"></span></button>`).join('')}</div>
          ${S.own.length ? r(`<p class="cr-fine">${M(sum(S.own))} moved between your own accounts. That isn’t income, so it’s not counted.</p>`, 6) : ''}`));
      }

      // 3 · where it went: the donut
      const top = S.cats.slice(0, 5), restC = S.cats.slice(5);
      const rows = restC.length ? [...top, { name: 'Everything else', cents: sum(restC.flatMap(c => c.tx)), n: restC.reduce((s, c) => s + c.n, 0), tx: restC.flatMap(c => c.tx) }] : top;
      sc._cats = rows;
      list.push(slide('blush', 'Where it went', `
        ${r(`<p class="cr-k">Where it went</p>`, 0)}
        ${r(`<h2 class="cr-h2">Most went to <em>${esc((PLAIN[top[0]?.name] || top[0]?.name || 'nothing').toLowerCase())}</em></h2>`, 1)}
        ${r(donut(rows), 2)}
        ${r(`<button class="cr-pill cr-see" data-r="seeslice">See the purchases</button>`, 3)}`));

      // 4 · needs vs. everything else
      const needs = sum(S.spendT.filter(t => t.essential)), wants = S.spent - needs, nShare = needs / (S.spent || 1);
      list.push(slide('mint', 'Needs and everything else', `
        ${r(`<p class="cr-k">Needs vs. everything else</p>`, 0)}
        ${r(`<h2 class="cr-h2"><b>${Math.round((1 - nShare) * 100)}%</b> went to <em>things you chose</em></h2>`, 1)}
        ${r(`<div class="cr-split" role="img" aria-label="Needs ${M(needs)}, everything else ${M(wants)}"><i class="n" style="--w:${(nShare * 100).toFixed(1)}%"></i><i class="w" style="--w:${((1 - nShare) * 100).toFixed(1)}%"></i></div>`, 2)}
        ${r(`<div class="cr-duo"><p><span><i class="sw n"></i>Needs</span><b>${M(needs)}</b><small>Rent, bills, groceries, getting around, health</small></p><p><span><i class="sw w"></i>Everything else</span><b>${M(wants)}</b><small>Eating out, delivery, shopping, coffee, subscriptions</small></p></div>`, 3)}
        ${r(`<p class="cr-p">Needs are hard to cut. The “everything else” part is where small changes add up.</p>`, 4)}`));

      // 5 · your days: the wall calendar
      const wk = S.pd.kind === 'W', firstDow = wk ? 0 : dayOf(S.at(1)), heads = wk ? [...DAYS.slice(1), DAYS[0]] : DAYS, byDay = Array.from({ length: S.days }, () => 0);
      S.habit.forEach(t => { byDay[S.ix(t.date) - 1] += t.cents; });
      const dmax = Math.max(...byDay) || 1, inRange = d => d >= S.first && d <= S.last;
      const zero = byDay.filter((v, k) => !v && inRange(k + 1)).length, big = byDay.indexOf(Math.max(...byDay)) + 1, bigDate = `${S.at(big)}`;
      let streak = 0, run = 0; byDay.forEach((v, k) => { run = !v && inRange(k + 1) ? run + 1 : 0; streak = Math.max(streak, run); });
      list.push(slide('sky', 'Your days', `
        ${r(`<p class="cr-k">Your days</p>`, 0)}
        ${r(`<h2 class="cr-h2"><b>${zero}</b> ${zero === 1 ? 'day' : 'days'} you spent <em>nothing</em></h2>`, 1)}
        ${r(`<div class="cr-wall"><div class="cr-wall-h"><span>${S.pd.start.slice(0, 4)}</span><b>${esc(S.pd.kind === 'W' ? 'Week of ' + dLabel(S.pd.start) : S.pd.name)}</b><i>${+S.pd.start.slice(5, 7)}</i></div>
          <div class="cr-wall-d">${heads.map(d => `<b>${d[0]}</b>`).join('')}</div>
          <div class="cr-wall-g">${'<span></span>'.repeat(firstDow)}${byDay.map((v, k) => `<button class="cr-day${!inRange(k + 1) ? ' is-out' : !v ? ' is-zero' : ''}${v / dmax > .5 ? ' is-dark' : ''}" data-r="day" data-d="${k + 1}" style="--a:${v ? (.18 + .82 * v / dmax).toFixed(2) : 0};--i:${k}" aria-label="${dLabel(`${S.at(k + 1)}`)}: ${v ? M(v) : 'nothing spent'}" ${inRange(k + 1) ? '' : 'disabled'}>${+S.at(k + 1).slice(8, 10)}</button>`).join('')}</div></div>`, 2)}
        ${r(`<p class="cr-p">Darker days cost more. Your biggest was <b>${DAYS_LONG[dayOf(bigDate)]}, ${dLabel(bigDate)}</b>: ${M(byDay[big - 1])}.${streak > 1 ? ` Your longest run with no spending: ${streak} days.` : ''}</p>`, 3)}
        ${r(`<p class="cr-fine">Rent, bills and other needs are left out. Tap a day.</p>`, 4)}`));

      // 6 · your week, side by side: an average day for each day of the week, weekends highlighted
      const span = Math.max(1, S.last - S.first + 1), dows = Array.from({ length: span }, (_, k) => dayOf(`${S.at(S.first + k)}`));
      const perDow = [1, 2, 3, 4, 5, 6, 0].map(d => { const n = dows.filter(x => x === d).length, tot = sum(S.habit.filter(t => dayOf(t.date) === d)); return { d, avg: n ? tot / n : 0, n }; });
      const nWe = dows.filter(d => d === 0 || d === 6).length, we = S.habit.filter(t => [0, 6].includes(dayOf(t.date)));
      const weAvg = sum(we) / (nWe || 1), wdAvg = (sum(S.habit) - sum(we)) / ((span - nWe) || 1), dmx = Math.max(...perDow.map(x => x.avg)) || 1;
      const ratio = weAvg / (wdAvg || 1), topDow = perDow.reduce((a, x) => (x.avg > a.avg ? x : a), perDow[0]);
      if (S.habit.length >= 6 && nWe && span - nWe) list.push(slide('peach2', 'Your week', `
        ${r(`<p class="cr-k">Your week</p>`, 0)}
        ${r(`<h2 class="cr-h2">${ratio >= 1.1 ? `Weekends cost <em>${ratio.toFixed(1)}× a weekday</em>` : ratio <= .9 ? `Weekdays cost <em>more than weekends</em>` : `Weekdays and weekends <em>cost about the same</em>`}</h2>`, 1)}
        ${r(`<div class="cr-dow" role="img" aria-label="Average spending by day of the week: ${perDow.map(x => `${DAYS_LONG[x.d]} ${M(x.avg)}`).join(', ')}">${perDow.map((x, k) => `<div class="${x.d === 0 || x.d === 6 ? 'is-we' : ''}${x.d === topDow.d ? ' is-top' : ''}" style="--h:${Math.max(4, x.avg / dmx * 100).toFixed(1)}%;--k:${k}"><b>${x.avg ? M(x.avg) : '$0'}</b><i></i><span>${DAYS[x.d]}</span></div>`).join('')}</div>`, 2)}
        ${r(`<div class="cr-duo cr-vs"><p><span><i class="sw wd"></i>A weekday</span><b>${M(wdAvg)}</b><small>average, Monday to Friday</small></p><p><span><i class="sw we"></i>A weekend day</span><b>${M(weAvg)}</b><small>average, Saturday and Sunday</small></p></div>`, 3)}
        ${r(`<p class="cr-fine">Your priciest day is usually ${DAYS_LONG[topDow.d]}. Everyday spending only, so rent and bills are left out.</p>`, 4)}`));

      // 7 · your regulars
      const reps = Object.entries(S.habit.reduce((o, t) => { (o[t.merchant] ??= []).push(t); return o; }, {})).filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length || sum(b[1]) - sum(a[1])).slice(0, 4);
      if (reps.length) {
        sc._reps = reps;
        list.push(slide('lav2', 'Your regulars', `
          ${r(`<p class="cr-k">Your regulars</p>`, 0)}
          ${r(`<h2 class="cr-h2">The places you <em>kept going back to</em></h2>`, 1)}
          <ul class="cr-list cr-regs">${reps.map(([name, l], k) => r(`<li><button data-r="rep" data-k="${k}"><span class="cr-x">×${l.length}</span><span><b>${esc(name)}</b><small>${M(sum(l))} in total</small></span>${I('<path d="M9.5 6l6 6-6 6"/>')}</button></li>`, 2 + k * .6)).join('')}</ul>`));
      }

      // the dark run: patterns, in plain words, each with its own graphic
      if (P.length) {
        list.push(slide('dark', 'The patterns', `
          ${r(`<p class="cr-k">The part apps don’t tell you</p>`, 0)}
          ${r(`<h2 class="cr-h2">${P.length} ${P.length === 1 ? 'pattern' : 'patterns'} in how you <em>spent</em></h2>`, 1)}
          ${r(`<p class="cr-p">Each one: what happened, why it happens, and one small thing to try.</p>`, 2)}
          <p class="cr-cue" aria-hidden="true">${I('<path d="M6 10l6 6 6-6"/>')}Keep scrolling</p>`));
        P.forEach((f, k) => list.push(slide('night', f.title, `
          ${r(`<p class="cr-n">${String(k + 1).padStart(2, '0')} / ${String(P.length).padStart(2, '0')} · ${esc(f.title)}</p>`, 0)}
          ${r(vis(f.vis), 1)}
          ${r(`<p class="cr-stat">${esc(f.stat)}</p>`, 2)}
          ${r(`<p class="cr-line">${esc(f.line)}</p>`, 3)}
          ${r(`<div class="cr-why"><span>Why it happens</span>${esc(f.why)}</div>`, 4)}
          ${r(`<div class="cr-why cr-try"><span>Try this</span>${esc(f.tip)}</div>`, 5)}
          ${r(`<button class="cr-link" data-r="pat" data-k="${k}">See the ${plural(f.tx.length, 'purchase')} ${I('<path d="M9.5 6l6 6-6 6"/>')}</button>`, 6)}`)));
        const uniq = [...new Set(P.flatMap(f => f.tx))].filter(t => t.flow === 'spend'), got = sum(uniq), scale = partial ? S.pd.full / Math.max(1, S.last - S.first + 1) : 1;
        list.push(slide('night', 'Adding it up', `
          ${r(`<p class="cr-k">Adding it up</p>`, 0)}
          ${r(`<p class="cr-stat">${M(got)}</p>`, 1)}
          ${r(`<p class="cr-line">went to these patterns ${partial ? `so far this ${S.pd.unit}` : `in ${esc(S.pd.name)}`}, across ${plural(uniq.length, 'purchase')}. ${partial ? 'At this pace that’s' : `Every ${S.pd.unit} like this is`} about ${M(got * scale * S.pd.perYear)} a year.</p>`, 2)}
          ${r(`<p class="cr-p">You don’t have to stop all of them. Changing one is a real start.</p>`, 3)}
          ${r(`<p class="cr-fine">Not financial advice. Just the math from your own purchases.</p>`, 4)}`));
      }

      list.push(slide('lav', 'The end', `
        ${r(`<h2 class="cr-h2">That was <em>${esc(partial ? `${S.pd.kind === 'W' ? 'this week' : S.pd.name} so far` : S.pd.name)}.</em></h2>`, 0)}
        ${r(`<p class="cr-p">${isSample ? 'Built from a sample statement. Add yours to see your own month.' : 'Built from your own purchases, on this device.'}</p>`, 1)}
        ${r(`<div class="cr-acts">${api.openWrap ? '<button class="cr-go" data-r="wrap">Watch your wrap</button>' : ''}<button class="cr-ghost" data-r="back">Back to home</button></div>`, 2)}`));
      return list;
    }

    // ---------- paint + scroll ----------
    function paint() {
      S = summarize(all, key); P = patterns(S, M);
      const list = LISTS[mode], i = list.indexOf(key), unit = mode === 'W' ? 'week' : 'month';
      page.querySelector('.cr-month b').textContent = matchMedia('(max-width: 360px)').matches ? S.pd.short : S.pd.label;
      page.querySelectorAll('[data-r="mode"]').forEach(b => { const on = b.dataset.m === mode; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); });
      const pv = page.querySelector('[data-r="prev"]'), nx = page.querySelector('[data-r="next"]');
      pv.disabled = i <= 0; nx.disabled = i >= list.length - 1; pv.setAttribute('aria-label', `Previous ${unit}`); nx.setAttribute('aria-label', `Next ${unit}`);
      sc.innerHTML = screens().join('');
      sc.scrollTop = 0; pickSlice(0);
      watch(); tick();
    }
    function countUp(b) {
      if (b._done) return; b._done = true; if (still) return;
      const to = +b.dataset.to, t0 = performance.now();
      const step = now => { const q = Math.min(1, (now - t0) / 1000); b.textContent = M(to * (1 - Math.pow(1 - q, 3))); if (q < 1 && b.isConnected) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    function watch() {
      io?.disconnect();
      const slides = sc.querySelectorAll('.cr-s');
      if (!('IntersectionObserver' in window)) { slides.forEach(s => s.classList.add('in')); return; }
      io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); e.target.querySelectorAll('[data-to]').forEach(countUp); }
        else if (!still) e.target.classList.remove('in');
      }), { root: sc, threshold: .5 });
      slides.forEach(s => io.observe(s));
    }
    let raf = 0;
    const tick = () => {
      raf = 0; const h = sc.clientHeight, doc = sc.scrollHeight - h;
      page.querySelector('.cr-prog i').style.transform = `scaleX(${doc > 0 ? Math.min(1, sc.scrollTop / doc) : 1})`;
      const at = Math.round(sc.scrollTop / Math.max(1, h)), cur = sc.children[at];
      page.dataset.tone = cur?.dataset.tone || 'light';
    };
    sc.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });

    // ---------- purchases behind a number ----------
    function txSheet(title, sub, list) {
      page.querySelector('.cr-sheet')?.remove();
      const w = document.createElement('div'); w.className = 'cr-sheet';
      const rows = [...list].sort((a, b) => a.date.localeCompare(b.date));
      w.innerHTML = `<div class="cr-scrim" data-x></div><div class="cr-panel" role="dialog" aria-modal="true" aria-labelledby="cr-sh-t"><span class="cr-grab" aria-hidden="true"></span>
        <div class="cr-sh-h"><div><h2 id="cr-sh-t">${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div><button class="cr-gb cr-sm" data-x aria-label="Close">${I('<path d="M6 6l12 12M18 6 6 18"/>')}</button></div>
        <ul class="cr-tx">${rows.map(t => `<li><span><b>${esc(t.merchant)}</b><small>${DAYS[dayOf(t.date)]} ${dLabel(t.date)}</small></span><b>${['income', 'refund', 'reimb', 'otherIn', 'saveIn'].includes(t.flow) ? '+' : ''}${rawM(t.cents)}</b></li>`).join('') || '<li class="cr-none">Nothing here. A quiet day.</li>'}</ul></div>`;
      page.append(w);
      const prev = document.activeElement, panel = w.querySelector('.cr-panel');
      const close = () => { if (!w.isConnected) return; document.removeEventListener('keydown', key, true); prev?.focus?.({ preventScroll: true }); if (still) { w.remove(); return; } panel.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: 260, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }); w.querySelector('.cr-scrim').animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => w.remove(), () => w.remove()); };
      const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
      document.addEventListener('keydown', key, true);
      w.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); });
      if (!still) { panel.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' }); w.querySelector('.cr-scrim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); }
      w.querySelector('.cr-sh-h button').focus({ preventScroll: true });
    }
    const catSheet = k => { const c = sc._cats[k]; txSheet(PLAIN[c.name] || c.name, `${plural(c.n, 'purchase')} · ${M(c.cents)}`, c.tx); };

    // ---------- taps ----------
    const leave = () => { io?.disconnect(); document.documentElement.classList.remove('fh-locked'); };
    page.addEventListener('click', e => {
      const b = e.target.closest('[data-r]'); if (!b || b.closest('.cr-sheet')) return;
      const what = b.dataset.r, k = +b.dataset.k;
      if (what === 'back') { leave(); api.back(); return; }
      if (what === 'wrap') { leave(); api.openWrap(); return; }
      if (what === 'prev' || what === 'next') { const l = LISTS[mode], j = l.indexOf(key) + (what === 'next' ? 1 : -1); if (l[j]) { key = l[j]; paint(); } return; }
      if (what === 'mode') {
        const m2 = b.dataset.m; if (m2 === mode) return;
        const pd = period(key), l = LISTS[m2];
        // Month to Week: the last week that falls in that month. Week to Month: the month the week starts in.
        const want = m2 === 'W' ? [...l].reverse().find(w => w.slice(2) <= pd.end && addDays(w.slice(2), 6) >= pd.start) : pd.start.slice(0, 7);
        mode = m2; key = l.includes(want) ? want : l.at(-1); paint(); return;
      }
      if (what === 'slice') { if (pick === k && b.tagName !== 'circle') { catSheet(k); return; } pickSlice(k); return; }
      if (what === 'seeslice') { catSheet(pick); return; }
      if (what === 'src') { const s = sc._srcs[k]; txSheet(s.name, `${plural(s.tx.length, 'payment')} · ${M(sum(s.tx))}`, s.tx); return; }
      if (what === 'rep') { const [name, l] = sc._reps[k]; txSheet(name, `${plural(l.length, 'visit')} · ${M(sum(l))}`, l); return; }
      if (what === 'pat') { const f = P[k]; txSheet(f.title, `${plural(f.tx.length, 'purchase')} behind this`, f.tx); return; }
      if (what === 'day') { const d = `${S.at(b.dataset.d)}`, l = S.tx.filter(t => t.date === d && t.flow === 'spend'); txSheet(new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), l.length ? `${plural(l.length, 'purchase')} · ${M(sum(l))}` : 'Nothing spent', l); }
    });
    page.addEventListener('keydown', e => { const g = e.target.closest('.cr-seg'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickSlice(+g.dataset.k); } });
    // arrow keys and Page Up/Down move one screen at a time
    sc.addEventListener('keydown', e => {
      const step = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key]; if (!step || e.target.closest('input')) return;
      e.preventDefault(); sc.scrollBy({ top: step * sc.clientHeight, behavior: still ? 'auto' : 'smooth' });
    });

    paint();
    sc.focus({ preventScroll: true });
  }

  window.ChalaRecap = { render };
})();
