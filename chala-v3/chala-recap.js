/* chala v3 — Recap. Faiit's month breakdown with its interactive graphics (the two circles,
   the pay stubs, the cake served a slice at a time, the wall calendar, habits in type),
   on chala's soft gradient backgrounds, one colour wash per scene.
   The patterns are a dark section of full screens (4–5 of them, like chala's first
   "real talk" scroll), each with its own small graphic, plain words, why it happens and
   one thing to try. The page settles on each scene as you scroll.
   Built only from what the data supports; people can still add context or correct
   anything, and every total and pattern is recalculated. */
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
  const COLORS = ['#191919', '#C9BCE5', '#E9BBA9', '#EBCBD1', '#8E8E8B', '#D9CFC5', '#A79FC4', '#D4A794', '#CFCFCC', '#B5ADA4', '#E4DEF2', '#EFE3DF']; /* chala v3: muted premium palette */
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

  // ---------- patterns: plain words, only when the data shows them ----------
  const RX = { bnpl: /afterpay|klarna|affirm|sezzle|quadpay|zip pay/i, fees: /overdraft|\bnsf\b|insufficient|late fee|atm fee|service fee|maintenance fee|monthly fee/i,
    streaming: /netflix|hulu|disney|\bmax\b|hbo|spotify|youtube|apple tv|peacock|paramount|crunchyroll|prime video|audible|apple music/i };
  function findings(S, money) {
    const M = c => money(Math.round(c / 100) * 100).replace(/\.00$/, ''), sum = S.sum, out = [], H = S.habit.filter(t => !t.noHabit), span = Math.max(1, S.last - S.first + 1);
    const plural = (n, a, b) => `${n} ${n === 1 ? a : (b || a + 's')}`;
    const del = S.spendT.filter(t => t.category === 'Food delivery' && !t.noHabit);
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
      tip: `Cancel one you didn’t use this month. ${subs[0].merchant} is the biggest.` });
    const paydays = [...new Set(S.inc.map(t => +t.date.slice(8, 10)))].sort((a, b) => a - b);
    if (paydays.length >= 2 && H.length >= 10) {
      const win = new Set(); paydays.forEach(p => { for (let d = p; d < p + 3 && d <= S.days; d++) win.add(d); });
      const inWin = H.filter(t => win.has(+t.date.slice(8, 10))), share = sum(inWin) / (sum(H) || 1), expect = win.size / span;
      if (share >= expect * 1.3 && share >= .2) out.push({ title: 'Right after payday', cost: sum(inWin) - sum(H) * expect, tx: inWin, vis: { kind: 'timeline', win: [...win] }, stat: `${Math.round(share * 100)}%`,
        line: `of your everyday spending happened in the 3 days after you got paid. Those days are only ${Math.round(expect * 100)}% of the month.`,
        why: 'A full account makes everything feel affordable, so money goes faster right after payday.',
        tip: 'Move money to savings on payday, before you have a chance to spend it.' });
    }
    const allD = Array.from({ length: span }, (_, k) => dayOf(`${S.key}-${String(S.first + k).padStart(2, '0')}`));
    const nWe = allD.filter(d => d === 0 || d === 6).length, nWd = span - nWe, we = H.filter(t => [0, 6].includes(dayOf(t.date)));
    const weAvg = sum(we) / (nWe || 1), wdAvg = (sum(H) - sum(we)) / (nWd || 1);
    if (H.length >= 10 && nWe >= 2 && weAvg >= wdAvg * 1.3) out.push({ title: 'Weekends', cost: (weAvg - wdAvg) * nWe, tx: we, vis: { kind: 'bars', a: wdAvg, b: weAvg }, stat: `${(weAvg / (wdAvg || 1)).toFixed(1)}×`,
      line: `On a weekend day you spent ${M(weAvg)}. On a weekday, ${M(wdAvg)}.`,
      why: 'On weekends you have free time and you’re tired from the week. Apps know this and send their best deals on Friday nights.',
      tip: 'Plan one free thing for the weekend before Friday comes.' });
    const bnpl = S.spendT.filter(t => RX.bnpl.test(t.merchant));
    if (bnpl.length) out.push({ title: 'Pay later', cost: sum(bnpl), tx: bnpl, vis: { kind: 'split', total: sum(bnpl) }, stat: M(sum(bnpl)),
      line: 'went to pay-later plans this month. That’s money for things you bought in an earlier month.',
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

    el.innerHTML = `<section class="rc-page is-chala${still ? ' is-still' : ''}" aria-label="Recap"><header class="rc-top"><button class="rc-gc" data-r="back" aria-label="Back to dashboard">${I('<path d="M15 5l-7 7 7 7"/>')}</button>
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
      const srcs = [...group(S.inc, 'Pay'), ...group(S.reimb, 'Paid back to you'), ...group(S.refunds, 'Refund'), ...group(S.cu, 'Not sure what this is')];
      body._srcs = srcs;
      const html = `<section class="sc sc2" style="--vh:${150 + srcs.length * 35}"><div class="sc-pin">
  <p class="sc-k">Money coming in</p><h2 class="sc-h">Where it <em>came from.</em></h2>
  <div class="stubs">${srcs.map((s, k) => { const amt = S.sum(s.tx); return `<button class="stub" data-r="src" data-k="${k}" style="--k:${k};--n:${srcs.length}"><span class="stub-a">${esc(s.type.toUpperCase())}</span><span class="stub-t">${esc(s.name)}</span><span class="stub-f">${esc(s.type === 'Pay' ? freq(s.tx) : s.tx.length === 1 ? 'Once this month' : s.tx.length + ' payments')}</span><b class="stub-v">${m(amt)}</b><span class="stub-zig" aria-hidden="true"></span></button>`; }).join('')}</div>
  ${S.own.length ? `<button class="sc-pill" data-r="own">${m(S.sum(S.own))} moved between your own accounts. Not counted.</button>` : ''}
</div></section>`;
      const update = (n, p) => n.querySelectorAll('.stub').forEach((s, k) => s.classList.toggle('is-on', p > .08 + k * (.6 / srcs.length)));
      return { html, update };
    }

    // 03 · the cake: scrolling serves one slice at a time
    const CAKE = ['#C9BCE5', '#E9BBA9', '#EBCBD1', '#D9CFC5', '#A79FC4', '#D4A794', '#E4DEF2', '#B5ADA4', '#CFCFCC', '#EFE3DF', '#8E8E8B', '#3A3A3A']; /* chala v3: muted premium palette */
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
  <div class="cake"><svg viewBox="0 0 360 360" role="group" aria-label="Spending by category">${parts.map((p, k) => { const mid = (p.a0 + p.a1) / 2; return `<g class="slice" data-r="cat" data-k="${k}" style="--dx:${(Math.cos(mid) * 26).toFixed(1)}px;--dy:${(Math.sin(mid) * 16).toFixed(1)}px" role="button" tabindex="0" aria-label="${esc(cats[k].name)}, ${Math.round(cats[k].cents / total * 100)}%"><path d="${arc(p, depth)}" fill="#D8D2CA" stroke="#FDFCFA" stroke-width="1.6"/><path d="${arc(p, 0)}" fill="${p.c}" stroke="#FDFCFA" stroke-width="1.6"/></g>`; }).join('')}</svg></div>
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
        n.querySelector('.cl-m').textContent = ESSENTIAL.has(c.name) ? 'A need, so no judgement here.' : `${c.n} ${c.n === 1 ? 'purchase' : 'purchases'}`;
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
  <p class="sc-k">Your days</p>
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
  ${H.length >= 6 ? `<div class="duo rv">${flag('week')}<p class="duo-a" style="--f:${(.45 + .55 * wdAvg / mx).toFixed(2)}">Weekdays<span>${m(wdAvg)} a day</span></p><p class="duo-b" style="--f:${(.45 + .55 * weAvg / mx).toFixed(2)}">Weekends<span>${m(weAvg)} a day</span></p><p class="sc-fine">Everyday spending only. Rent, bills and other needs are left out.</p></div>` : ''}
  ${reps.length ? `<div class="regs rv"><div class="rv-h"><h3 class="sc-h3">Your regulars</h3>${flag('reps')}</div>${reps.map(([name, n], k) => `<p class="reg" style="--k:${k}"><span>${esc(name)}</span><b>×${n}</b></p>`).join('')}</div>` : ''}
  ${small.length >= 3 ? `<div class="smalls rv"><div class="rv-h"><h3 class="sc-h3">Small buys</h3>${flag('small')}</div><p class="smalls-l"><b>${small.length}</b> purchases under $10 came to <em>${m(S.sum(small))}</em>.</p></div>` : ''}
  ${subs.length ? `<div class="subs rv"><h3 class="sc-h3">${multi ? 'Charges that come back' : 'Subscriptions this month'}</h3><div class="slip">${subs.map(t => `<p><span>${esc(t.merchant)}</span><b>${m(t.cents)}</b></p>`).join('')}<p class="slip-t"><span>Total</span><b>${m(S.sum(subs))}</b></p></div>${!multi ? '<p class="sc-fine">One month can’t show what repeats. Add another month to see recurring charges.</p>' : ''}</div>` : ''}
</div></section>`;
      return { html, update() {} };
    }

    // 06 · the dark section: one full screen per pattern, each with its own graphic
    function scenePatterns() {
      const M = c => m(Math.round(c / 100) * 100).replace(/\.00$/, '');
      if (!F.length) return { html: `<section class="sc scd is-slide"><div class="sc-pin"><p class="sc-k rv">The part apps don’t tell you</p><h2 class="sc-h rv" style="--d:1">Nothing sneaky <em>stood out.</em></h2><p class="sc-p rv" style="--d:2">No pattern was strong enough to call out. A quiet month is a good sign.</p></div></section>`, update() {} };
      const vis = f => {
        const v = f.vis;
        if (v.kind === 'boxes' || v.kind === 'coins' || v.kind === 'dots') { const n = Math.min(v.n, v.kind === 'coins' ? 60 : 40); return `<div class="pv pv-${v.kind}" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i style="--k:${k}"></i>`).join('')}${v.n > n ? `<span>+${v.n - n}</span>` : ''}</div>`; }
        if (v.kind === 'slip') return `<div class="pv pv-slip">${v.rows.map((t, k) => `<p style="--k:${k}"><span>↻ ${esc(t.merchant)}</span><b>${M(t.cents)}</b></p>`).join('')}<p class="pv-tot"><span>Every month</span><b>${M(v.total)}</b></p></div>`;
        if (v.kind === 'timeline') { const set = new Set(v.win); return `<svg class="pv pv-time" viewBox="0 0 300 70" aria-hidden="true">${Array.from({ length: S.days }, (_, k) => { const d = k + 1, val = S.habit.filter(t => +t.date.slice(8, 10) === d).reduce((s, t) => s + t.cents, 0), h = Math.min(56, val / 900); return `<rect style="--k:${k}" x="${k * (300 / S.days)}" y="${62 - h}" width="${300 / S.days - 2}" height="${h + 2}" rx="1.5" class="${set.has(d) ? 'hot' : ''}"/>`; }).join('')}<line x1="0" x2="300" y1="64.5" y2="64.5"/></svg><p class="pv-key"><i class="hot"></i>3 days after payday</p>`; }
        if (v.kind === 'bars') { const mx = Math.max(v.a, v.b) || 1; return `<div class="pv pv-bars"><p><span>Weekday</span><i style="--w:${(v.a / mx * 100).toFixed(1)}%"></i><b>${M(v.a)}</b></p><p><span>Weekend</span><i class="hot" style="--w:${(v.b / mx * 100).toFixed(1)}%"></i><b>${M(v.b)}</b></p></div>`; }
        if (v.kind === 'split') return `<div class="pv pv-split" aria-hidden="true">${[0, 1, 2, 3].map(k => `<i style="--k:${k}"><span>${M(v.total / 4)}</span></i>`).join('')}</div><p class="pv-key">Four small payments. Same full price: ${M(v.total)}.</p>`;
        if (v.kind === 'below') return `<svg class="pv pv-below" viewBox="0 0 300 80" aria-hidden="true"><line class="zero" x1="0" x2="300" y1="40" y2="40"/><path d="M0 18 L90 26 L150 34 L190 58 L230 50 L300 30"/><circle cx="190" cy="58" r="6"/><text x="196" y="76">${esc(M(v.total))} fee</text><text x="4" y="34" class="z">$0</text></svg>`;
        if (v.kind === 'pair') return `<p class="pt-big"><span>${M(v.a.cents)}<small>in · ${dLabel(v.a.date)}</small></span><i>→</i><span>${M(v.b.cents)}<small>back out · ${dLabel(v.b.date)}</small></span></p>`;
        return '';
      };
      const slides = F.map((f, k) => `<section class="sc scd is-slide" aria-label="${esc(f.title)}"><div class="sc-pin">
  <p class="pd-n rv">${String(k + 1).padStart(2, '0')} / ${String(F.length).padStart(2, '0')} · ${esc(f.title)}</p>
  <div class="rv" style="--d:1">${vis(f)}</div>
  <p class="pd-stat rv" style="--d:2">${esc(f.stat)}</p>
  <p class="pd-line rv" style="--d:3">${esc(f.line)}</p>
  <div class="pd-why rv" style="--d:4"><span>Why it happens</span>${esc(f.why)}</div>
  <div class="pd-why pd-try rv" style="--d:5"><span>Try this</span>${esc(f.tip)}</div>
  <div class="pt-a rv" style="--d:6"><button class="pd-link" data-r="ftx" data-k="${k}">See the ${f.tx.length} ${f.tx.length === 1 ? 'purchase' : 'purchases'}</button>${flag('f' + k)}</div>
</div></section>`).join('');
      const uniq = [...new Set(F.flatMap(f => f.tx))].filter(t => t.flow === 'spend' || t.flow === 'unclear'), got = S.sum(uniq);
      const scale = S.complete ? 1 : 30.4 / Math.max(1, S.last - S.first + 1);
      const html = `<section class="sc scd is-slide" aria-label="The patterns"><div class="sc-pin">
  <p class="sc-k rv">The part apps don’t tell you</p>
  <h2 class="sc-h rv" style="--d:1">${F.length} ${F.length === 1 ? 'pattern' : 'patterns'} in how you <em>spent.</em></h2>
  <p class="sc-p rv" style="--d:2">Each one: what happened, why it happens, and one small thing to try.</p>
  <p class="sc-cue" aria-hidden="true">Keep scrolling</p>
</div></section>${slides}<section class="sc scd is-slide" aria-label="Adding it up"><div class="sc-pin">
  <p class="sc-k rv">Adding it up</p>
  <p class="pd-stat rv" style="--d:1">${M(got)}</p>
  <p class="pd-line rv" style="--d:2">went to these patterns ${S.complete ? `in ${esc(new Date(+S.key.slice(0, 4), +S.key.slice(5, 7) - 1, 1).toLocaleDateString('en-US', { month: 'long' }))}` : 'so far this month'}, across ${uniq.length} purchases. ${S.complete ? 'Every month like this is' : 'At this pace that’s'} about ${M(got * scale * 12)} a year.</p>
  <p class="sc-p rv" style="--d:3">You don’t have to stop all of them. Changing one is a real start.</p>
  <p class="sc-fine rv" style="--d:4">Not financial advice. Just the math from your own purchases.</p>
</div></section>`;
      return { html, update() {} };
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
      // one scene can draw several screens (the dark section), so each screen remembers its scene
      body.innerHTML = list.map((x, i) => x.html.replace(/<section class="sc /g, `<section data-si="${i}" class="sc `)).join('');
      const nodes = [...body.querySelectorAll('.sc')];
      scenes = nodes.map(n => ({ n, s: list[+n.dataset.si] }));
      body._cakeScene = scenes.find(x => x.n.classList.contains('sc3'));
      if (keepScroll) page.scrollTop = y;
      revealObs(); tick();
      const first = body.querySelector('.sc1 .l1 b'); if (first && !still) { const to = +first.dataset.to, t0 = performance.now(); const step = now => { const q = Math.min(1, (now - t0) / 1100); first.textContent = m(Math.round(to * (1 - Math.pow(1 - q, 3)))); if (q < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
    }
    let raf = 0;
    const tick = () => {
      raf = 0; const vh = page.clientHeight;
      const doc = page.scrollHeight - vh; page.querySelector('.rc-prog i').style.transform = `scaleX(${doc > 0 ? clamp(page.scrollTop / doc) : 1})`;
      const mid = page.querySelector('.rc-top')?.getBoundingClientRect().bottom || 60, under = scenes.find(({ n }) => { const r = n.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      page.classList.toggle('is-dark', !!under?.n.classList.contains('scd'));
      scenes.forEach(({ n, s }) => { if (n.classList.contains('is-flow') || n.classList.contains('is-slide')) return; const r = n.getBoundingClientRect(), span = n.offsetHeight - vh; const p = still ? 1 : span > 0 ? clamp(-r.top / span) : (r.top < vh ? 1 : 0); if (n._p !== p) { n._p = p; s.update(n, p); } });
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
      if (r === 'ftx') { const f = F[k]; txSheet(f.title, `${f.tx.length} ${f.tx.length === 1 ? 'purchase' : 'purchases'} behind this`, f.tx); return; }
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

  window.ChalaRecap = { render, sampleRows };
})();
