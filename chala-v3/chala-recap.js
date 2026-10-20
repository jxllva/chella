/* chala v3 — Recap. Faiit's month breakdown, retold in chala's look.
   One full screen per idea, and the scroll snaps from one to the next (the way chala's first
   "Real talk" screens did), so it never stops halfway between two thoughts.
   - Light screens, each on its own soft gradient: what you spent, where it came from, where it
     went, needs vs. everything else, your days, your regulars.
   - Then a dark section: 4–5 spending patterns from this month, each in plain words, with why it
     happens and one thing to try. Only patterns the data actually shows.
   - Tap a category, a day or a pattern's "See purchases" to see the purchases behind it.
   Built from the person's rows (or the sample statement), for one month at a time. */
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
  const sum = l => l.reduce((s, t) => s + t.cents, 0);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const RX = {
    bnpl: /afterpay|klarna|affirm|sezzle|quadpay|zip pay/i,
    fees: /overdraft|\bnsf\b|insufficient|late fee|atm fee|service fee|maintenance fee|monthly fee/i,
    streaming: /netflix|hulu|disney|\bmax\b|hbo|spotify|youtube|apple tv|peacock|paramount|crunchyroll|prime video|audible|apple music/i
  };
  // The words people use, not bank categories
  const PLAIN = { 'Food delivery': 'Food delivery', Dining: 'Eating out', 'Cafés': 'Coffee & cafés', Groceries: 'Groceries', Shopping: 'Shopping', Transport: 'Getting around', Subscriptions: 'Subscriptions', Travel: 'Travel', Health: 'Health', 'Rent & bills': 'Rent & bills', Education: 'School', Other: 'Other' };

  // ---------- every row as a money flow (same rules as Faiit's breakdown) ----------
  function classify(rows) {
    const seen = new Set(), out = [];
    const merchants = new Set(rows.filter(r => r.kind === 'expense').map(r => (r.merchant || '').toLowerCase().split(/\s+/)[0]));
    rows.forEach(r => {
      if (!r || !r.date || !(r.cents > 0) || r.include === false) return;
      const key = `${r.date}|${(r.merchant || '').toLowerCase()}|${r.cents}|${r.kind}|${r.source || ''}`;
      if (seen.has(key + '#dup')) return; // the very same line twice in one file is one purchase
      seen.add(key + '#dup');
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
    const tx = all.filter(t => t.date.startsWith(key)), spendT = tx.filter(t => t.flow === 'spend');
    const inc = tx.filter(t => t.flow === 'income'), refunds = tx.filter(t => t.flow === 'refund'), reimb = tx.filter(t => t.flow === 'reimb'), otherIn = tx.filter(t => t.flow === 'otherIn');
    const sOut = tx.filter(t => t.flow === 'saveOut'), sIn = tx.filter(t => t.flow === 'saveIn'), own = tx.filter(t => t.flow === 'own');
    const days = daysIn(key), dates = tx.map(t => +t.date.slice(8, 10));
    const first = dates.length ? Math.min(...dates) : 1, last = dates.length ? Math.max(...dates) : days;
    const cats = Object.values(spendT.reduce((o, t) => { (o[t.category] ??= { name: t.category, cents: 0, n: 0, tx: [] }); o[t.category].cents += t.cents; o[t.category].n++; o[t.category].tx.push(t); return o; }, {})).sort((a, b) => b.cents - a.cents);
    const habit = spendT.filter(t => !t.essential);
    const moneyIn = sum(inc) + sum(refunds) + sum(reimb) + sum(otherIn);
    return { key, tx, spendT, habit, inc, refunds, reimb, otherIn, sOut, sIn, own, days, first, last, cats, spent: sum(spendT), moneyIn, hasIncome: moneyIn > 0, complete: first <= 3 && last >= days - 3 };
  }

  // ---------- the patterns: plain words, only when this month shows them ----------
  function patterns(S, M) {
    const out = [], H = S.habit, span = Math.max(1, S.last - S.first + 1);
    const del = S.spendT.filter(t => t.category === 'Food delivery');
    if (del.length >= 3) out.push({ k: 'Food delivery', cost: sum(del), tx: del, stat: plural(del.length, 'order'),
      line: `You ordered food delivery ${del.length} times. That cost ${M(sum(del))}, about ${M(sum(del) / del.length)} an order.`,
      why: 'The app shows the food price first. The service fee, delivery fee and tip come later, on separate lines, so you never see the full price in one place.',
      tip: 'Pick two nights a week for delivery. Cook or pick up on the rest.' });
    const small = H.filter(t => t.cents < 1000);
    if (small.length >= 6) out.push({ k: 'Small buys', cost: sum(small), tx: small, stat: plural(small.length, 'small buy'),
      line: `Each one cost under $10. Together they added up to ${M(sum(small))}.`,
      why: 'Tapping a card or phone to pay doesn’t feel like spending. A few dollars at a time slips past without a second thought.',
      tip: 'Look at your total once a week. Seeing the sum is what makes small buys feel real.' });
    const subs = Object.values(S.spendT.filter(t => t.category === 'Subscriptions' || RX.streaming.test(t.merchant)).reduce((o, t) => { o[t.merchant] = t; return o; }, {}));
    if (subs.length >= 2) out.push({ k: 'Subscriptions', cost: sum(subs), tx: subs, stat: `${M(sum(subs))} a month`,
      line: `${plural(subs.length, 'subscription')} renewed on their own. That’s ${M(sum(subs) * 12)} a year.`,
      why: 'Free trials turn into paid plans automatically, and the cancel button is often hard to find on purpose.',
      tip: `Cancel one you didn’t use this month. ${subs.sort((a, b) => b.cents - a.cents)[0].merchant} is the biggest.` });
    const paydays = [...new Set(S.inc.map(t => +t.date.slice(8, 10)))].sort((a, b) => a - b);
    if (paydays.length >= 2 && H.length >= 10) {
      const win = new Set(); paydays.forEach(p => { for (let d = p; d < p + 3 && d <= S.days; d++) win.add(d); });
      const inWin = H.filter(t => win.has(+t.date.slice(8, 10))), share = sum(inWin) / (sum(H) || 1), expect = win.size / span;
      if (share >= expect * 1.3 && share >= .2) out.push({ k: 'Right after payday', cost: sum(inWin) - sum(H) * expect, tx: inWin, stat: `${Math.round(share * 100)}%`,
        line: `of your everyday spending happened in the 3 days after you got paid. Those days are only ${Math.round(expect * 100)}% of the month.`,
        why: 'A full account makes everything feel affordable, so money goes faster right after payday.',
        tip: 'Move money to savings on payday, before you have a chance to spend it.' });
    }
    const all = Array.from({ length: span }, (_, k) => dayOf(`${S.key}-${String(S.first + k).padStart(2, '0')}`));
    const nWe = all.filter(d => d === 0 || d === 6).length, nWd = span - nWe, we = H.filter(t => [0, 6].includes(dayOf(t.date)));
    const weAvg = sum(we) / (nWe || 1), wdAvg = (sum(H) - sum(we)) / (nWd || 1);
    if (H.length >= 10 && nWe >= 2 && weAvg >= wdAvg * 1.3) out.push({ k: 'Weekends', cost: (weAvg - wdAvg) * nWe, tx: we, stat: `${(weAvg / (wdAvg || 1)).toFixed(1)}×`,
      line: `On a weekend day you spent ${M(weAvg)}. On a weekday, ${M(wdAvg)}.`,
      why: 'On weekends you have free time and you’re tired from the week. Apps know this and send their best deals on Friday nights.',
      tip: 'Plan one free thing for the weekend before Friday comes.' });
    const bnpl = S.spendT.filter(t => RX.bnpl.test(t.merchant));
    if (bnpl.length) out.push({ k: 'Pay later', cost: sum(bnpl), tx: bnpl, stat: M(sum(bnpl)),
      line: `went to pay-later plans this month. That’s money for things you bought in an earlier month.`,
      why: 'Splitting a price into 4 payments makes it look 4 times smaller. You still pay the full price.',
      tip: 'Before you split a payment, ask: would I buy this if I paid it all today?' });
    const fees = S.spendT.filter(t => RX.fees.test(t.merchant));
    if (fees.length) out.push({ k: 'Bank fees', cost: sum(fees) + 2500, tx: fees, stat: M(sum(fees)),
      line: `in bank fees. You paid your bank because your balance ran low.`,
      why: 'Many banks let a payment go through when there isn’t enough money, then charge you a fee for it.',
      tip: 'Ask your bank to turn off overdraft, so the card is declined instead of charging a fee.' });
    const reps = Object.entries(H.reduce((o, t) => { o[t.merchant] = (o[t.merchant] || 0) + 1; return o; }, {})).sort((a, b) => b[1] - a[1]);
    if (reps[0] && reps[0][1] >= 6 && !out.some(p => p.k === 'Food delivery' && /doordash|uber ?eats|grubhub/i.test(reps[0][0]))) {
      const list = H.filter(t => t.merchant === reps[0][0]);
      out.push({ k: 'Your go-to', cost: sum(list) * .5, tx: list, stat: `${reps[0][1]}×`,
        line: `at ${reps[0][0]}. That’s about ${(reps[0][1] / span * 7).toFixed(1)} times a week, ${M(sum(list))} in total.`,
        why: 'A saved card and a one-tap reorder skip the moment where you’d normally stop and decide.',
        tip: 'Remove your saved card from that app, so each order takes a few more taps.' });
    }
    const pairs = S.sOut.map(o => ({ o, i: S.sIn.find(x => x.date >= o.date) })).filter(p => p.i);
    if (pairs.length) { const p = pairs[0]; out.push({ k: 'Savings that came back', cost: p.i.cents, tx: [p.o, p.i], stat: M(p.i.cents),
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
    const months = [...new Set(all.filter(t => t.flow === 'spend').map(t => t.date.slice(0, 7)))].sort();
    let key = months.includes(api.key) ? api.key : months.at(-1);
    const still = reduce();

    el.innerHTML = `<section class="cr" aria-label="Recap">
  <header class="cr-top">
    <button class="cr-gb" data-r="back" aria-label="Back">${I('<path d="M15 5l-7 7 7 7"/>')}</button>
    <div class="cr-month"><button class="cr-gb cr-sm" data-r="prev" aria-label="Previous month">${I('<path d="M14.5 6 8.5 12l6 6"/>')}</button><b aria-live="polite"></b><button class="cr-gb cr-sm" data-r="next" aria-label="Next month">${I('<path d="M9.5 6l6 6-6 6"/>')}</button></div>
    <span class="cr-prog" aria-hidden="true"><i></i></span>
  </header>
  <div class="cr-scroll" tabindex="-1"></div>
</section>`;
    const page = el.querySelector('.cr'), sc = el.querySelector('.cr-scroll');
    document.documentElement.classList.add('fh-locked');
    let S, P, io = null;

    // ---------- screens ----------
    const r = (html, d = 0, cls = '') => `<div class="cr-r ${cls}" style="--d:${d}">${html}</div>`;
    const slide = (tone, label, inner, extra = '') => `<section class="cr-s cr-${tone}" data-tone="${tone === 'dark' || tone === 'night' ? 'dark' : 'light'}" aria-label="${esc(label)}" ${extra}><div class="cr-in">${inner}</div></section>`;
    const sheetBtn = (label, attrs) => `<button class="cr-link" ${attrs}>${esc(label)} ${I('<path d="M9.5 6l6 6-6 6"/>')}</button>`;

    function screens() {
      const list = [], partial = !S.complete;
      const period = partial ? `${dLabel(`${S.key}-${String(S.first).padStart(2, '0')}`)}–${S.last}` : mName(S.key);
      const kicker = `${mLabel(S.key)}${partial ? ` · ${dLabel(`${S.key}-${String(S.first).padStart(2, '0')}`)} to ${dLabel(`${S.key}-${String(S.last).padStart(2, '0')}`)}` : ''}`;
      const left = S.moneyIn - S.spent, saved = sum(S.sOut) - sum(S.sIn);

      // 1 · what you spent
      list.push(slide('lav', 'What you spent', `
        ${r(`<p class="cr-k">${esc(kicker)}</p>`, 0)}
        ${r(`<h1 class="cr-h">You spent <b class="cr-big" data-to="${S.spent}">${M(S.spent)}</b></h1>`, 1)}
        ${r(`<p class="cr-p">${plural(S.spendT.length, 'purchase')}${partial ? ', so far this month' : ''}. Money you moved to savings or between your own accounts isn’t counted.</p>`, 2)}
        ${S.hasIncome ? r(`<div class="cr-duo"><p><span>Came in</span><b>${M(S.moneyIn)}</b></p><p><span>${left >= 0 ? 'Left over' : 'Spent more than came in'}</span><b class="${left >= 0 ? 'is-up' : 'is-down'}">${M(Math.abs(left))}</b></p></div>`, 3) : r(`<p class="cr-fine">This data shows purchases only, so money coming in isn’t shown.</p>`, 3)}
        ${saved > 0 ? r(`<p class="cr-fine">You also moved <b>${M(saved)}</b> into savings.</p>`, 4) : ''}
        <p class="cr-cue" aria-hidden="true">${I('<path d="M6 10l6 6 6-6"/>')}Scroll</p>`));

      // 2 · where it came from
      if (S.hasIncome) {
        const groups = [['Pay', S.inc], ['Paid back to you', S.reimb], ['Refunds', S.refunds], ['Other money in', S.otherIn]].filter(g => g[1].length);
        list.push(slide('peach', 'Where your money came from', `
          ${r(`<p class="cr-k">Money in</p>`, 0)}
          ${r(`<h2 class="cr-h2">Where it <em>came from</em></h2>`, 1)}
          <ul class="cr-list">${groups.map(([name, tx], k) => r(`<li><button data-r="tx" data-g="in${k}"><span><b>${esc(name)}</b><small>${plural(tx.length, 'payment')}${name === 'Pay' && tx.length >= 2 ? ' · usually every 2 weeks' : ''}</small></span><b>${M(sum(tx))}</b></button></li>`, 2 + k)).join('')}</ul>
          ${S.own.length ? r(`<p class="cr-fine">${M(sum(S.own))} moved between your own accounts. That isn’t income, so it’s not counted.</p>`, 6) : ''}`, ''));
        sc._groups = groups;
      }

      // 3 · where it went
      const top = S.cats.slice(0, 5), restC = S.cats.slice(5), max = top[0]?.cents || 1;
      const rows = restC.length ? [...top, { name: 'Everything else', cents: sum(restC.flatMap(c => c.tx)), n: restC.reduce((s, c) => s + c.n, 0), tx: restC.flatMap(c => c.tx) }] : top;
      sc._cats = rows;
      list.push(slide('blush', 'Where it went', `
        ${r(`<p class="cr-k">Where it went</p>`, 0)}
        ${r(`<h2 class="cr-h2">Most went to <em>${esc((PLAIN[top[0]?.name] || top[0]?.name || 'nothing').toLowerCase())}</em></h2>`, 1)}
        ${r(`<p class="cr-p">${esc(PLAIN[top[0]?.name] || top[0]?.name || '')} was ${Math.round((top[0]?.cents || 0) / (S.spent || 1) * 100)}% of everything you spent.</p>`, 2)}
        <ul class="cr-bars">${rows.map((c, k) => r(`<li><button data-r="cat" data-k="${k}" aria-label="${esc(PLAIN[c.name] || c.name)}, ${M(c.cents)}, ${plural(c.n, 'purchase')}. See purchases."><span class="cr-bar-n">${esc(PLAIN[c.name] || c.name)}${ESSENTIAL.has(c.name) ? '<small>need</small>' : ''}</span><span class="cr-bar-t"><i style="--w:${Math.max(3, c.cents / max * 100).toFixed(1)}%"></i></span><b>${M(c.cents)}</b></button></li>`, 3 + k * .5)).join('')}</ul>
        ${r(`<p class="cr-fine">Tap a row to see the purchases.</p>`, 6)}`));

      // 4 · needs vs. everything else
      const needs = sum(S.spendT.filter(t => t.essential)), wants = S.spent - needs, nShare = needs / (S.spent || 1);
      list.push(slide('mint', 'Needs and everything else', `
        ${r(`<p class="cr-k">Needs vs. everything else</p>`, 0)}
        ${r(`<h2 class="cr-h2"><b>${Math.round((1 - nShare) * 100)}%</b> went to <em>things you chose</em></h2>`, 1)}
        ${r(`<div class="cr-split" role="img" aria-label="Needs ${M(needs)}, everything else ${M(wants)}"><i class="n" style="--w:${(nShare * 100).toFixed(1)}%"></i><i class="w" style="--w:${((1 - nShare) * 100).toFixed(1)}%"></i></div>`, 2)}
        ${r(`<div class="cr-duo"><p><span><i class="sw n"></i>Needs</span><b>${M(needs)}</b><small>Rent, bills, groceries, getting around, health</small></p><p><span><i class="sw w"></i>Everything else</span><b>${M(wants)}</b><small>Eating out, delivery, shopping, coffee, subscriptions</small></p></div>`, 3)}
        ${r(`<p class="cr-p">Needs are hard to cut. The “everything else” part is where small changes add up.</p>`, 4)}`));

      // 5 · your days
      const firstDow = new Date(+S.key.slice(0, 4), +S.key.slice(5, 7) - 1, 1).getDay(), byDay = Array.from({ length: S.days }, () => 0);
      S.habit.forEach(t => { byDay[+t.date.slice(8, 10) - 1] += t.cents; });
      const dmax = Math.max(...byDay) || 1, inRange = d => d >= S.first && d <= S.last;
      const zero = byDay.filter((v, k) => !v && inRange(k + 1)).length, big = byDay.indexOf(Math.max(...byDay)) + 1;
      const bigDate = `${S.key}-${String(big).padStart(2, '0')}`;
      list.push(slide('sky', 'Your days', `
        ${r(`<p class="cr-k">Your days</p>`, 0)}
        ${r(`<h2 class="cr-h2"><b>${zero}</b> ${zero === 1 ? 'day' : 'days'} you spent <em>nothing</em></h2>`, 1)}
        ${r(`<div class="cr-cal"><div class="cr-cal-d">${DAYS.map(d => `<b>${d[0]}</b>`).join('')}</div><div class="cr-cal-g">${'<span></span>'.repeat(firstDow)}${byDay.map((v, k) => `<button class="${!inRange(k + 1) ? 'is-out' : !v ? 'is-zero' : ''}${v / dmax > .5 ? ' is-dark' : ''}" data-r="day" data-d="${k + 1}" style="--a:${v ? (.18 + .82 * v / dmax).toFixed(2) : 0}" aria-label="${dLabel(`${S.key}-${String(k + 1).padStart(2, '0')}`)}: ${v ? M(v) : 'nothing spent'}" ${inRange(k + 1) ? '' : 'disabled'}>${k + 1}</button>`).join('')}</div></div>`, 2)}
        ${r(`<p class="cr-p">Darker days cost more. Your biggest was <b>${DAYS_LONG[dayOf(bigDate)]}, ${dLabel(bigDate)}</b>: ${M(byDay[big - 1])}.</p>`, 3)}
        ${r(`<p class="cr-fine">Rent, bills and other needs are left out, so this shows your everyday spending. Tap a day.</p>`, 4)}`));

      // 6 · your regulars
      const reps = Object.entries(S.habit.reduce((o, t) => { (o[t.merchant] ??= []).push(t); return o; }, {})).filter(([, l]) => l.length >= 2).sort((a, b) => b[1].length - a[1].length || sum(b[1]) - sum(a[1])).slice(0, 4);
      if (reps.length) {
        sc._reps = reps;
        list.push(slide('lav2', 'Your regulars', `
          ${r(`<p class="cr-k">Your regulars</p>`, 0)}
          ${r(`<h2 class="cr-h2">The places you <em>kept going back to</em></h2>`, 1)}
          <ul class="cr-list cr-regs">${reps.map(([name, l], k) => r(`<li><button data-r="rep" data-k="${k}"><span class="cr-x">×${l.length}</span><span><b>${esc(name)}</b><small>${M(sum(l))} in total</small></span>${I('<path d="M9.5 6l6 6-6 6"/>')}</button></li>`, 2 + k * .6)).join('')}</ul>`));
      }

      // 7–12 · the dark section: patterns, in plain words
      if (P.length) {
        list.push(slide('dark', 'The patterns', `
          ${r(`<p class="cr-k">The part apps don’t tell you</p>`, 0)}
          ${r(`<h2 class="cr-h2">${P.length} ${P.length === 1 ? 'pattern' : 'patterns'} in how you <em>spent</em></h2>`, 1)}
          ${r(`<p class="cr-p">Each one is something your spending shows, why it happens, and one small thing to try.</p>`, 2)}
          <p class="cr-cue" aria-hidden="true">${I('<path d="M6 10l6 6 6-6"/>')}Keep scrolling</p>`, 'data-first-dark'));
        P.forEach((f, k) => list.push(slide('night', f.k, `
          ${r(`<p class="cr-n">${String(k + 1).padStart(2, '0')} / ${String(P.length).padStart(2, '0')} · ${esc(f.k)}</p>`, 0)}
          ${r(`<p class="cr-stat">${esc(f.stat)}</p>`, 1)}
          ${r(`<p class="cr-line">${esc(f.line)}</p>`, 2)}
          ${r(`<div class="cr-why"><span>Why it happens</span>${esc(f.why)}</div>`, 3)}
          ${r(`<div class="cr-why cr-try"><span>Try this</span>${esc(f.tip)}</div>`, 4)}
          ${r(sheetBtn(`See the ${plural(f.tx.length, 'purchase')}`, `data-r="pat" data-k="${k}"`), 5)}`)));
        // each purchase counted once, even if it shows up in two patterns
        const uniq = [...new Set(P.flatMap(f => f.tx))].filter(t => t.flow === 'spend'), got = sum(uniq);
        const scale = partial ? 30.4 / Math.max(1, S.last - S.first + 1) : 1;
        list.push(slide('night', 'Adding it up', `
          ${r(`<p class="cr-k">Adding it up</p>`, 0)}
          ${r(`<p class="cr-stat">${M(got)}</p>`, 1)}
          ${r(`<p class="cr-line">went to these patterns ${partial ? 'so far this month' : `in ${esc(mName(S.key))}`}, across ${plural(uniq.length, 'purchase')}. ${partial ? 'At this pace that’s' : 'Every month like this is'} about ${M(got * scale * 12)} a year.</p>`, 2)}
          ${r(`<p class="cr-p">You don’t have to stop all of them. Changing one is a real start.</p>`, 3)}
          ${r(`<p class="cr-fine">Not financial advice. Just the math from your own purchases.</p>`, 4)}`));
      }

      // the end
      list.push(slide('lav', 'The end', `
        ${r(`<h2 class="cr-h2">That was <em>${esc(partial ? `${mName(S.key)} so far` : mName(S.key))}.</em></h2>`, 0)}
        ${r(`<p class="cr-p">${isSample ? 'Built from a sample statement. Add yours to see your own month.' : 'Built from your own purchases, on this device.'}</p>`, 1)}
        ${r(`<div class="cr-acts">${api.openWrap ? '<button class="cr-go" data-r="wrap">Watch your wrap</button>' : ''}<button class="cr-ghost" data-r="back">Back to home</button></div>`, 2)}`));
      return list;
    }

    // ---------- paint + scroll ----------
    function paint() {
      S = summarize(all, key); P = patterns(S, M);
      const i = months.indexOf(key);
      page.querySelector('.cr-month b').textContent = mLabel(key);
      page.querySelector('[data-r="prev"]').disabled = i <= 0; page.querySelector('[data-r="next"]').disabled = i >= months.length - 1;
      sc.innerHTML = screens().join('');
      sc.scrollTop = 0;
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
      // the header follows the screen under it: light on the light screens, light-on-dark on the dark ones
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

    // ---------- taps ----------
    const leave = () => { io?.disconnect(); document.documentElement.classList.remove('fh-locked'); };
    page.addEventListener('click', e => {
      const b = e.target.closest('[data-r]'); if (!b || b.closest('.cr-sheet')) return;
      const what = b.dataset.r, k = +b.dataset.k;
      if (what === 'back') { leave(); api.back(); return; }
      if (what === 'wrap') { leave(); api.openWrap(); return; }
      if (what === 'prev' || what === 'next') { const j = months.indexOf(key) + (what === 'next' ? 1 : -1); if (months[j]) { key = months[j]; paint(); } return; }
      if (what === 'cat') { const c = sc._cats[k]; txSheet(PLAIN[c.name] || c.name, `${plural(c.n, 'purchase')} · ${M(c.cents)}`, c.tx); return; }
      if (what === 'tx') { const g = sc._groups[+b.dataset.g.slice(2)]; txSheet(g[0], `${plural(g[1].length, 'payment')} · ${M(sum(g[1]))}`, g[1]); return; }
      if (what === 'rep') { const [name, l] = sc._reps[k]; txSheet(name, `${plural(l.length, 'visit')} · ${M(sum(l))}`, l); return; }
      if (what === 'pat') { const f = P[k]; txSheet(f.k, `${plural(f.tx.length, 'purchase')} behind this`, f.tx); return; }
      if (what === 'day') { const d = `${S.key}-${String(b.dataset.d).padStart(2, '0')}`, l = S.tx.filter(t => t.date === d && t.flow === 'spend'); txSheet(new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }), l.length ? `${plural(l.length, 'purchase')} · ${M(sum(l))}` : 'Nothing spent', l); }
    });
    // arrow keys and Page Up/Down move one screen at a time
    sc.addEventListener('keydown', e => {
      const step = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key]; if (!step || e.target.closest('input')) return;
      e.preventDefault(); sc.scrollBy({ top: step * sc.clientHeight, behavior: still ? 'auto' : 'smooth' });
    });

    paint();
    sc.focus({ preventScroll: true });
  }

  window.ChalaRecap = { render, patterns: (rows, key, money) => { const all = classify(rows); return patterns(summarize(all, key), c => money(Math.round(c / 100) * 100)); } };
})();
