/* chala v3 — engine (ported from chala.html; original left untouched). */

/* Money Wrapped — merchant categorisation.
   Everything runs in the browser. Rules are checked top to bottom; first match wins. */
window.MW = window.MW || {};

MW.CATEGORIES = {
  delivery:  { label: 'Food delivery',       emoji: '🛵', want: true,  color: 'var(--pink)' },
  coffee:    { label: 'Coffee & matcha',     emoji: '🍵', want: true,  color: 'var(--lime)' },
  boba:      { label: 'Boba & tea',          emoji: '🧋', want: true,  color: 'var(--lilac)' },
  bars:      { label: 'Bars & nights out',   emoji: '🍸', want: true,  color: 'var(--orange)' },
  dining:    { label: 'Eating out',          emoji: '🍔', want: true,  color: 'var(--yellow)' },
  online:    { label: 'Shopping',     emoji: '📦', want: true,  color: 'var(--blue)' },
  shopping:  { label: 'Shopping',            emoji: '🛍️', want: true,  color: 'var(--mint)' },
  beauty:    { label: 'Beauty & self-care',  emoji: '💅', want: true,  color: 'var(--pink)' },
  subs:      { label: 'Subscriptions',       emoji: '🔁', want: true,  color: 'var(--lilac)' },
  rides:     { label: 'Rideshare',           emoji: '🚗', want: true,  color: 'var(--yellow)' },
  fun:       { label: 'Entertainment',       emoji: '🎟️', want: true,  color: 'var(--orange)' },
  travel:    { label: 'Travel',              emoji: '✈️', want: true,  color: 'var(--blue)' },
  bnpl:      { label: 'Buy now, pay later',  emoji: '🪤', want: true,  color: 'var(--red)' },
  p2p:       { label: 'Venmo / Zelle / Cash App', emoji: '💸', want: true, color: 'var(--mint)' },
  groceries: { label: 'Groceries',           emoji: '🥦', want: false, color: 'var(--mint)' },
  transport: { label: 'Transit & gas',       emoji: '🚇', want: false, color: 'var(--blue)' },
  fitness:   { label: 'Fitness',             emoji: '🏋️', want: false, color: 'var(--lime)' },
  rent:      { label: 'Rent',                emoji: '🏠', want: false, color: 'var(--ink-soft)' },
  bills:     { label: 'Bills',        emoji: '🏠', want: false, color: 'var(--ink-soft)' },
  fees:      { label: 'Bank fees',           emoji: '🚨', want: false, color: 'var(--red)' },
  income:    { label: 'Money in',            emoji: '💰', want: false, color: 'var(--ink-soft)' },
  other:     { label: 'Everything else',     emoji: '🌀', want: true,  color: 'var(--ink-soft)' },
};

/* Order matters: specific before generic (e.g. "uber eats" before "uber"). */
MW.RULES = [
  ['ignore',   /payment\s*-?\s*thank|autopay|auto pay|online payment|credit card payment|card payment|pymt|epay|transfer (to|from) (sav|chk|check)|internal transfer|^transfer\b/],
  ['fees',     /overdraft|\bnsf\b|insufficient|late fee|atm fee|non-?network|foreign transaction|service fee|maintenance fee|monthly fee|interest charge|returned item/],
  ['bnpl',     /afterpay|klarna|affirm|sezzle|zip\.co|\bzip pay\b|quadpay|pay in 4|paypal pay ?later/],
  ['delivery', /doordash|door dash|uber\s*\*?\s*eats|ubereats|grubhub|postmates|caviar|seamless|gopuff|instacart|dd \*|dd doordash/],
  ['coffee',   /matcha|starbucks|blue bottle|philz|peet'?s|dunkin|dutch bros|coffee|espresso|caf[eé]\b|latte|la colombe|verve|sightglass|ritual roasters|cafe|tim hortons|kettl/],
  ['boba',     /boba|bubble tea|sharetea|kung fu tea|tpumps|tiger sugar|yi fang|gong cha|chatime|teaspoon|boba guys|\btea\b|tealive|happy lemon|ding tea|molly tea/],
  ['bars',     /\bbar\b|\bpub\b|brewery|brewing|tavern|saloon|lounge|taproom|tap room|cocktail|speakeasy|liquor|bevmo|total wine|nightclub|\bclub\b|beer|wine bar|tiki|cantina/],
  ['subs',     /snapchat|capcut|bereal|vsco|netflix|spotify|hulu|disney ?\+|disneyplus|hbo|\bmax\.com|apple\.com\/bill|apple com bill|itunes|youtube|google \*youtube|chatgpt|openai|anthropic|claude\.ai|adobe|icloud|prime video|amazon prime|audible|patreon|duolingo|notion|canva|paramount|peacock|crunchyroll|twitch|substack|linkedin premium|tinder|hinge|bumble|grammarly|dropbox|microsoft 365|xbox game pass|playstation plus|nintendo online/],
  ['online',   /amazon|amzn|shein|temu|etsy|ebay|aliexpress|wayfair|shopify|shop pay|mktp|depop|poshmark/],
  ['beauty',   /sephora|ulta|glossier|nail|salon|spa\b|barber|lush|bath & body|aesop|rare beauty|fenty/],
  ['shopping', /target|walmart|zara|h&m|h & m|uniqlo|nordstrom|urban outfitters|aritzia|lululemon|best buy|apple store|ikea|tj ?maxx|marshalls|ross|old navy|gap\b|macy|forever 21|brandy|skims|nike|adidas|cvs|walgreens|daiso|muji/],
  ['rides',    /\buber\b|uber trip|uber \*trip|lyft|waymo|\blime\b|bird ride|revel/],
  ['transport',/clipper|bart|\bmta\b|caltrain|muni|metro|transit|chevron|shell oil|\bshell\b|exxon|arco|76 |valero|parking|toll|fastrak|amtrak/],
  ['groceries',/trader joe|whole foods|wholefds|safeway|costco|kroger|sprouts|berkeley bowl|aldi|grocery|grocer|h mart|99 ranch|lucky|ralphs|vons|publix|wegmans|food 4 less|market\b|mart\b/],
  ['fun',      /ticketmaster|stubhub|seatgeek|eventbrite|\bamc\b|cinema|regal|movie|theater|theatre|steam|playstation|xbox|nintendo|bowling|concert|museum|dice\.fm|live nation|axs/],
  ['travel',   /airline|airlines|delta|united|southwest|alaska air|jetblue|airbnb|hotel|marriott|hilton|expedia|booking\.com|hostel|vrbo|frontier/],
  ['fitness',  /gym|fitness|equinox|planet fit|24 hour|classpass|peloton|yoga|pilates|corepower|orangetheory|barry|crossfit|climbing|rsf/],
  ['rent',     /\brent\b|landlord|property m(gm|an)|prop mgmt|apartments?\b|leasing|residences|housing|realty|lease pmt|\bhoa\b/],
  ['bills',    /property|pg&e|pge|comcast|xfinity|verizon|t-mobile|tmobile|at&t|att\*|mint mobile|insurance|geico|state farm|progressive|tuition|utility|utilities|electric|water bill|internet|student loan|navient|sallie mae|mohela/],
  ['p2p',      /venmo|zelle|cash app|cashapp|square cash|paypal/],
  ['dining',   /restaurant|grill|kitchen|pizza|sushi|taco|taqueria|chipotle|mcdonald|sweetgreen|cava\b|shake shack|in-n-out|in n out|chick-fil-a|panda express|burger|ramen|thai|pho|diner|bistro|eatery|noodle|dumpling|bbq|wingstop|subway|domino|popeyes|kfc|wendy|taco bell|jack in the box|five guys|panera|halal|curry|kitchen|cafeteria|bakery|donut|bagel|dessert|ice cream|creamery|crepe|poke|deli|sq \*|tst\*|toast/],
];

MW.categorize = function (desc) {
  const d = (desc || '').toLowerCase();
  for (const [cat, re] of MW.RULES) if (re.test(d)) return cat;
  return 'other';
};

MW.isMatcha = d => /matcha|kettl|cha cha/.test((d || '').toLowerCase());

/* Turn "SQ *BLUE BOTTLE COFFEE 0423 OAKLAND CA" into "Blue Bottle Coffee". */
MW.cleanMerchant = function (desc) {
  let s = (desc || '').replace(/\s+/g, ' ').trim();
  const known = [
    [/doordash|door dash|dd \*/i, 'DoorDash'], [/uber\s*\*?\s*eats|ubereats/i, 'Uber Eats'], [/grubhub/i, 'Grubhub'],
    [/instacart/i, 'Instacart'], [/postmates/i, 'Postmates'], [/starbucks/i, 'Starbucks'], [/blue bottle/i, 'Blue Bottle'],
    [/philz/i, 'Philz Coffee'], [/peet/i, "Peet's Coffee"], [/amazon|amzn/i, 'Amazon'], [/shein/i, 'SHEIN'], [/temu/i, 'Temu'],
    [/target/i, 'Target'], [/sephora/i, 'Sephora'], [/ulta/i, 'Ulta'], [/netflix/i, 'Netflix'], [/spotify/i, 'Spotify'],
    [/hulu/i, 'Hulu'], [/apple\.com\/bill|apple com bill|itunes/i, 'Apple subscriptions'], [/youtube/i, 'YouTube Premium'],
    [/chatgpt|openai/i, 'ChatGPT'], [/\blyft/i, 'Lyft'], [/\buber\b/i, 'Uber'], [/venmo/i, 'Venmo'], [/zelle/i, 'Zelle'],
    [/cash ?app|square cash/i, 'Cash App'], [/afterpay/i, 'Afterpay'], [/klarna/i, 'Klarna'], [/affirm/i, 'Affirm'],
    [/trader joe/i, "Trader Joe's"], [/whole ?f/i, 'Whole Foods'], [/safeway/i, 'Safeway'], [/costco/i, 'Costco'],
    [/chipotle/i, 'Chipotle'], [/sweetgreen/i, 'Sweetgreen'], [/mcdonald/i, "McDonald's"], [/dunkin/i, "Dunkin'"],
  ];
  for (const [re, name] of known) if (re.test(s)) return name;
  s = s.replace(/\*/g, ' ').replace(/^(sq|tst|sp|pp|py|dd|ck|pos|debit card purchase|purchase authorized on \d+\/\d+|recurring payment|card purchase|checkcard \d*)\s*\*?\s*/i, '')
       .replace(/\b(x{2,}\d+|#\d+|\d{3,}|[A-Z]{2}\s*\d{5})\b/gi, '')
       .replace(/\s+[A-Z]{2}$/,'')                       // trailing state code
       .replace(/\s{2,}/g, ' ').trim();
  s = s.split(/\s{2,}| - /)[0];
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).slice(0, 28) || 'Mystery merchant';
};



/* Money Wrapped — the analysis engine. Turns transactions into roasts, real talk and a plan. */
window.MW = window.MW || {};

MW.money = (n, cents) => {
  const v = Math.abs(n);
  const s = cents ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Math.round(v).toLocaleString('en-US');
  return (n < 0 ? '-$' : '$') + s;
};
MW.DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
MW.toDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
MW.dayNum = s => Math.round(MW.toDate(s).getTime() / 86400000);
MW.fmtDate = s => MW.toDate(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
MW.monthKey = s => s.slice(0, 7);
const sum = (a, f) => a.reduce((t, x) => t + (f ? f(x) : x), 0);
const pct = (a, b) => b ? Math.round((a / b) * 100) : 0;
const groupBy = (a, f) => a.reduce((m, x) => ((m[f(x)] = m[f(x)] || []).push(x), m), {});

MW.analyze = function (txns) {
  // Rent is never "spending" for the roast. It's tracked on its own.
  const ESS = ['rent', 'bills'];
  const rentTx = txns.filter(t => t.dir === 'out' && t.cat === 'rent');
  const billTx = txns.filter(t => t.dir === 'out' && t.cat === 'bills');
  const out = txns.filter(t => t.dir === 'out' && !ESS.includes(t.cat));
  const inc = txns.filter(t => t.dir === 'in');
  const start = txns[0].date, end = txns[txns.length - 1].date;
  const days = Math.max(1, MW.dayNum(end) - MW.dayNum(start) + 1);
  const months = Math.max(days / 30.44, 0.25);
  const perMonth = v => v / months;
  const perYear = v => (v / days) * 365;

  const spend = sum(out, t => t.amount);
  const rent = { total: sum(rentTx, t => t.amount), count: rentTx.length, monthly: 0, list: rentTx };
  rent.monthly = rentTx.length ? rent.total / Math.max(1, new Set(rentTx.map(t => t.date.slice(0, 7))).size) : 0;
  const income = sum(inc.filter(t => /payroll|direct dep|salary|stipend|paycheck|deposit|gusto|adp|wage/i.test(t.desc) || t.amount > 300), t => t.amount);

  // categories
  const byCat = groupBy(out, t => t.cat);
  const cats = Object.entries(byCat).map(([key, list]) => {
    const total = sum(list, t => t.amount);
    const c = MW.CATEGORIES[key] || MW.CATEGORIES.other;
    return { key, label: c.label, emoji: c.emoji, want: c.want, total, count: list.length, monthly: perMonth(total), avg: total / list.length, list };
  }).sort((a, b) => b.total - a.total);
  const cat = k => cats.find(c => c.key === k);
  const wants = cats.filter(c => c.want && c.key !== 'other');
  const wantsTotal = sum(wants, c => c.total);

  // merchants
  const byM = groupBy(out, t => t.merchant);
  const merchants = Object.entries(byM).map(([name, list]) => ({ name, total: sum(list, t => t.amount), count: list.length, cat: list[0].cat }))
    .sort((a, b) => b.total - a.total);
  const topWantMerchant = merchants.filter(m => (MW.CATEGORIES[m.cat] || {}).want && !['p2p', 'other'].includes(m.cat)).sort((a, b) => b.count - a.count)[0];

  // by day
  const byDay = groupBy(out, t => t.date);
  const dayTotals = Object.entries(byDay).map(([date, list]) => ({ date, total: sum(list, t => t.amount), list }));
  const biggestDay = dayTotals.filter(d => !d.list.some(t => t.cat === 'bills')).sort((a, b) => b.total - a.total)[0] || dayTotals[0];
  const wantTx = out.filter(t => (MW.CATEGORIES[t.cat] || {}).want);
  const dow = [0, 0, 0, 0, 0, 0, 0];
  wantTx.forEach(t => dow[MW.toDate(t.date).getDay()] += t.amount);
  const spendiestDow = dow.indexOf(Math.max(...dow));
  const weekendShare = pct(sum([dow[5], dow[6], dow[0]]), sum(dow));

  const dowProfile = list => {
    const c = [0, 0, 0, 0, 0, 0, 0]; list.forEach(t => c[MW.toDate(t.date).getDay()]++);
    const top = c.indexOf(Math.max(...c));
    return { counts: c, top, topShare: pct(c[top], list.length), lateWeek: pct(c[4] + c[5] + c[6] + c[0], list.length) };
  };
  const longestStreak = list => {
    const ds = [...new Set(list.map(t => MW.dayNum(t.date)))].sort((a, b) => a - b);
    let best = ds.length ? 1 : 0, cur = 1;
    for (let i = 1; i < ds.length; i++) { cur = ds[i] === ds[i - 1] + 1 ? cur + 1 : 1; best = Math.max(best, cur); }
    return best;
  };

  // ---------- habits ----------
  const H = {};
  const del = cat('delivery');
  if (del) {
    const daysWith = new Set(del.list.map(t => t.date)).size;
    H.delivery = {
      total: del.total, count: del.count, avg: del.avg, monthly: del.monthly, yearly: perYear(del.total),
      perWeek: del.count / (days / 7), daysWith, dayShare: pct(daysWith, days), streak: longestStreak(del.list),
      dow: dowProfile(del.list), hiddenYearly: perYear(del.total) * 0.25,
      top: merchants.filter(m => m.cat === 'delivery')[0],
      multiDays: Object.values(groupBy(del.list, t => t.date)).filter(l => l.length > 1).length,
    };
  }
  const cof = cat('coffee');
  if (cof) {
    const matcha = cof.list.filter(t => t.matcha);
    const perDay = groupBy(cof.list, t => t.date);
    H.coffee = {
      total: cof.total, count: cof.count, avg: cof.avg, monthly: cof.monthly, yearly: perYear(cof.total),
      matchaCount: matcha.length, matchaTotal: sum(matcha, t => t.amount), coffeeCount: cof.count - matcha.length,
      perWeek: cof.count / (days / 7), doubleDays: Object.values(perDay).filter(l => l.length > 1).length,
      dow: dowProfile(cof.list), top: merchants.filter(m => m.cat === 'coffee')[0],
    };
  }
  const bar = cat('bars');
  if (bar) {
    const nights = groupBy(bar.list, t => t.date);
    const nightKeys = Object.keys(nights);
    const delDays = new Set((del ? del.list : []).map(t => MW.dayNum(t.date)));
    const nextDayDel = nightKeys.filter(d => delDays.has(MW.dayNum(d) + 1));
    const nextDayDelCost = sum((del ? del.list : []).filter(t => nightKeys.some(n => MW.dayNum(n) + 1 === MW.dayNum(t.date))), t => t.amount);
    const ridesOnNights = sum(out.filter(t => t.cat === 'rides' && nights[t.date]), t => t.amount);
    const biggest = Object.entries(nights).map(([d, l]) => ({ date: d, total: sum(l, t => t.amount), stops: l.length })).sort((a, b) => b.total - a.total)[0];
    H.bars = {
      total: bar.total, count: bar.count, monthly: bar.monthly, yearly: perYear(bar.total), nights: nightKeys.length,
      perNight: bar.total / nightKeys.length, biggest, multiStop: Object.values(nights).filter(l => l.length > 1).length,
      hangoverNights: nextDayDel.length, hangoverShare: pct(nextDayDel.length, nightKeys.length), hangoverCost: nextDayDelCost,
      rides: ridesOnNights, trueNight: (bar.total + ridesOnNights + nextDayDelCost) / nightKeys.length, dow: dowProfile(bar.list),
    };
  }
  const onl = cat('online'), shp = cat('shopping');
  if (onl || shp) {
    const list = [...(onl ? onl.list : []), ...(shp ? shp.list : [])];
    const amazon = list.filter(t => t.merchant === 'Amazon');
    H.shopping = {
      total: sum(list, t => t.amount), count: list.length, monthly: perMonth(sum(list, t => t.amount)), yearly: perYear(sum(list, t => t.amount)),
      amazonCount: amazon.length, amazonTotal: sum(amazon, t => t.amount), everyDays: days / Math.max(1, list.length),
      under25: list.filter(t => t.amount < 25).length, dow: dowProfile(list),
    };
  }

  // recurring charges (subscriptions, whatever their category)
  const recurring = [];
  Object.entries(byM).forEach(([name, list]) => {
    const isSub = list.some(t => t.cat === 'subs');
    if (['bills', 'groceries', 'delivery', 'coffee', 'bars', 'p2p', 'dining', 'boba', 'transport', 'bnpl', 'fees'].includes(list[0].cat)) return;
    const amts = groupBy(list, t => Math.round(t.amount));
    Object.values(amts).forEach(l => {
      if (l.length >= 2) {
        const gaps = l.slice(1).map((t, i) => MW.dayNum(t.date) - MW.dayNum(l[i].date));
        if (gaps.every(g => g >= 25 && g <= 35)) recurring.push({ name, amount: l[l.length - 1].amount, count: l.length, cat: l[0].cat });
      } else if (isSub) recurring.push({ name, amount: l[0].amount, count: 1, cat: l[0].cat });
    });
  });
  const seen = new Set();
  const subs = recurring.filter(r => { const k = r.name + r.amount; if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => b.amount - a.amount);
  if (subs.length) H.subs = { list: subs, monthly: sum(subs, s => s.amount), yearly: sum(subs, s => s.amount) * 12 };

  const bn = cat('bnpl');
  if (bn) H.bnpl = { total: bn.total, count: bn.count, monthly: bn.monthly, yearly: perYear(bn.total), merchants: [...new Set(bn.list.map(t => t.merchant))] };
  const p2 = cat('p2p');
  if (p2) H.p2p = { total: p2.total, count: p2.count, monthly: p2.monthly, yearly: perYear(p2.total) };
  const fe = cat('fees');
  if (fe) H.fees = { total: fe.total, count: fe.count, yearly: perYear(fe.total), list: fe.list };
  const rd = cat('rides');
  if (rd) H.rides = { total: rd.total, count: rd.count, monthly: rd.monthly, yearly: perYear(rd.total), avg: rd.avg, short: rd.list.filter(t => t.amount < 15).length };

  // small taps
  const small = out.filter(t => t.amount < 15 && t.cat !== 'subs' && t.cat !== 'fees');
  H.small = { count: small.length, total: sum(small, t => t.amount), shareCount: pct(small.length, out.length), shareTotal: pct(sum(small, t => t.amount), spend), yearly: perYear(sum(small, t => t.amount)) };

  // payday effect
  const paydays = inc.filter(t => t.amount > 300 || /payroll|direct dep|salary|stipend/i.test(t.desc)).map(t => MW.dayNum(t.date));
  if (paydays.length && wantTx.length) {
    const inWindow = t => paydays.some(p => { const d = MW.dayNum(t.date) - p; return d >= 0 && d <= 2; });
    const windowDays = new Set(); paydays.forEach(p => [0, 1, 2].forEach(k => windowDays.add(p + k)));
    const wIn = sum(wantTx.filter(inWindow), t => t.amount), nIn = windowDays.size;
    const wOut = sum(wantTx.filter(t => !inWindow(t)), t => t.amount), nOut = Math.max(1, days - nIn);
    const ratio = (wIn / nIn) / (wOut / nOut);
    if (isFinite(ratio)) H.payday = { ratio, perDayIn: wIn / nIn, perDayOut: wOut / nOut, count: paydays.length };
  }

  // creep: wants per day, first half vs second half
  const mid = MW.dayNum(start) + days / 2;
  const w1 = sum(wantTx.filter(t => MW.dayNum(t.date) < mid), t => t.amount), w2 = sum(wantTx.filter(t => MW.dayNum(t.date) >= mid), t => t.amount);
  const creep = w1 > 0 && days >= 20 ? Math.round(((w2 - w1) / w1) * 100) : 0;

  // ---------- archetype ----------
  const isMatcha = H.coffee && H.coffee.matchaCount >= H.coffee.coffeeCount;
  const ARCH = {
    delivery: ['Delivery Royalty', 'delivery', 'Your couch has a loyalty program.'],
    coffee: isMatcha ? ['Matcha Main Character', 'matcha', 'Green drink. Red bank account.'] : ['Oat Milk Loyalist', 'coffee', 'Sleep is free. You chose violence.'],
    boba: ['Boba Baddie', 'boba', 'Fifty percent sugar. One hundred percent commitment.'],
    bars: ['Happy Hour Hero', 'bars', 'Thursday is the new Friday, apparently.'],
    online: ['Add-to-Cart Athlete', 'online', 'Your porch is a fulfilment centre.'],
    shopping: ['Retail Therapist', 'shopping', 'Feelings? Checkout.'],
    beauty: ['Glow-Up Investor', 'beauty', 'The glow is real. So is the bill.'],
    subs: ['Subscription Hoarder', 'subs', 'Four streaming apps. Watches TikTok.'],
    rides: ['Uber Aristocrat', 'rides', 'Walking is a rumour to you.'],
    dining: ['Restaurant Regular', 'dining', 'The host already said "the usual?"'],
    fun: ['Main Event Energy', 'fun', 'Never missed a plan. Or a charge.'],
    travel: ['Jetsetter', 'travel', 'Your passport is doing better than your savings.'],
    bnpl: ["Future You's Problem", 'bnpl', 'Pay in 4. Regret in 1.'],
  };
  const topWant = wants.filter(c => ARCH[c.key] && c.key !== 'p2p').sort((a, b) => b.total - a.total)[0];
  const a = topWant ? ARCH[topWant.key] : ['Suspiciously Responsible', 'sparkle', 'We checked twice. Annoyingly fine.'];
  const archetype = { name: a[0], icon: a[1], line: a[2], cat: topWant && topWant.key };

  const A = {
    txns, out, rent, bills: { total: sum(billTx, t => t.amount), list: billTx }, start, end, days, months, spend, income, taps: out.length, tapsPerDay: out.length / days,
    cats, wants, wantsTotal, merchants, topWantMerchant, biggestDay, dow, spendiestDow, weekendShare, creep,
    habits: H, archetype, perMonth, perYear,
  };
  A.insights = MW.buildInsights(A);
  return A;
};

/* ---------- Real talk: the serious analysis ---------- */
MW.buildInsights = function (A) {
  const H = A.habits, $ = MW.money, list = [];
  const D = MW.DOW;

  if (H.delivery && H.delivery.count >= 3) {
    const h = H.delivery;
    list.push({
      id: 'delivery', cat: 'delivery', title: 'Delivery is replacing your kitchen, not your hunger',
      stat: $(h.monthly), statLabel: 'a month on delivery',
      what: [
        `You ordered on <b>${h.daysWith} of ${A.days} days</b> (${h.dayShare}%). That's ${h.perWeek.toFixed(1)} orders a week at about ${$(h.avg)} each.`,
        `<b>${h.dow.lateWeek}%</b> of orders land Thursday to Sunday, and ${D[h.dow.top]} is your peak. That pattern usually tracks how tired you are, not how hungry.`,
        h.streak >= 3 ? `Your longest run was <b>${h.streak} days in a row</b>. Streaks are how a treat turns into a default.` : null,
        h.multiDays ? `On ${h.multiDays} day${h.multiDays > 1 ? 's' : ''} you ordered more than once.` : null,
      ],
      trick: 'Fees are split into small lines (service fee, delivery fee, small-order fee, then a tip prompt) so none of them feels big. Menu prices in the app are often higher than at the counter. Memberships make each order feel "free", and the Reorder button skips the moment where you would normally decide.',
      cost: h.yearly, costLine: `${$(h.yearly)} a year at this pace. Roughly ${$(h.hiddenYearly)} of that is estimated markup, fees and tips you'd skip by picking up.`,
      fix: `Make ${D[h.dow.top]}s pickup-only, and set a delivery cap on your dashboard.`,
    });
  }
  if (H.coffee && H.coffee.count >= 4) {
    const h = H.coffee;
    const drink = h.matchaCount >= h.coffeeCount ? 'matcha' : 'coffee';
    list.push({
      id: 'coffee', cat: 'coffee', title: `Your ${drink} isn't a treat anymore. It's a subscription you pay by hand`,
      stat: h.perWeek.toFixed(1), statLabel: `drinks a week (${$(h.avg, true)} avg)`,
      what: [
        `${h.count} drinks in ${A.days} days${h.matchaCount ? `, ${h.matchaCount} of them matcha (${$(h.matchaTotal)})` : ''}. One drink never feels like money. Together they're ${$(h.monthly)} a month.`,
        h.doubleDays ? `On <b>${h.doubleDays} days you bought two or more</b>. The second one is rarely about caffeine. It's usually boredom, a break from work, or a reason to walk somewhere.` : null,
        h.top ? `${h.top.name} alone got ${$(h.top.total)} from you across ${h.top.count} visits.` : null,
      ],
      trick: "Mobile ordering moves the purchase ahead of the decision: you've paid before you've asked yourself if you want it. Loyalty stars bring you back so you don't \"waste\" them. And because it feels like a ritual, your brain files it under self-care instead of spending.",
      cost: h.yearly, costLine: `${$(h.yearly)} a year. Making half of them at home would keep about ${$(h.yearly * 0.4)}.`,
      fix: 'Keep the ritual but cap the count. Pick your favourite days and skip the second drink.',
    });
  }
  if (H.bars && H.bars.nights >= 2) {
    const h = H.bars;
    list.push({
      id: 'bars', cat: 'bars', title: "A night out costs more than the bar tab",
      stat: $(h.trueNight), statLabel: 'true cost of one night out',
      what: [
        `${h.nights} nights out, about ${$(h.perNight)} at the bar each time. Your biggest was ${$(h.biggest.total)} on ${MW.fmtDate(h.biggest.date)}${h.biggest.stops > 1 ? ` across ${h.biggest.stops} stops` : ''}.`,
        h.rides ? `Add ${$(h.rides)} in rides home on those same nights.` : null,
        h.hangoverNights ? `Then the hangover tax: <b>${h.hangoverShare}% of nights out were followed by delivery the next day</b>, another ${$(h.hangoverCost)}.` : null,
        h.multiStop ? `${h.multiStop} night${h.multiStop > 1 ? 's' : ''} had more than one stop. Plans made after the second drink are the expensive ones.` : null,
      ],
      trick: "Open tabs hide the running total, and every round is decided after the last one. The bar is only part of the cost. The ride home and the next day's recovery food are part of the same night, but they show up on different days, so you never see the full price together.",
      cost: h.yearly, costLine: `${$(h.yearly)} a year at the bar alone. ${$(h.yearly + (h.rides + h.hangoverCost) / A.days * 365)} once rides home and recovery food are counted.`,
      fix: 'Decide your number before you leave, close the tab after the first stop, and plan tomorrow\'s food tonight.',
    });
  }
  if (H.shopping && H.shopping.count >= 3) {
    const h = H.shopping;
    list.push({
      id: 'shopping', cat: 'online', title: 'Lots of small orders, so it never feels like shopping',
      stat: String(h.count), statLabel: `orders, one every ${h.everyDays.toFixed(1)} days`,
      what: [
        `${$(h.total)} across ${h.count} orders${h.amazonCount ? `, ${h.amazonCount} of them on Amazon` : ''}.`,
        h.under25 ? `<b>${h.under25} were under $25</b>. Small orders don't feel like decisions, which is exactly why there are so many.` : null,
        H.payday && H.payday.ratio > 1.2 ? 'A lot of these happen in the days right after you get paid.' : null,
      ],
      trick: '"Free shipping over $35" nudges you to add things to reach the threshold. One-click checkout and saved cards remove the pause. "Buy again", countdown deals and "only 3 left" make small orders feel urgent.',
      cost: h.yearly, costLine: `${$(h.yearly)} a year at this pace.`,
      fix: 'Leave things in your cart for 48 hours before you buy. Most of them you\'ll forget about.',
    });
  }
  if (H.subs && H.subs.list.length >= 2) {
    const h = H.subs;
    list.push({
      id: 'subs', cat: 'subs', title: 'Subscriptions renew because you stop noticing them',
      stat: $(h.monthly, true), statLabel: `a month across ${h.list.length} recurring charges`,
      what: [
        `Could you name all ${h.list.length} without looking? Here they are: ${h.list.map(s => `${s.name} (${$(s.amount, true)})`).join(', ')}.`,
        `That's <b>${$(h.yearly)} a year</b> without you lifting a finger.`,
      ],
      trick: 'Free trials turn into paid plans automatically. Cancelling is often buried several screens deep. Monthly prices are set low enough that they sit under the amount you would notice, so they keep renewing quietly.',
      cost: h.yearly, costLine: `${$(h.yearly)} a year. Cancelling the two you use least would save around ${$((h.list.slice(-2).reduce((t, s) => t + s.amount, 0)) * 12)}.`,
      fix: 'Cancel anything you haven\'t opened this month. You can always resubscribe.',
    });
  }
  if (H.small && H.small.count >= 10) {
    const h = H.small;
    list.push({
      id: 'small', cat: null, title: 'Death by a thousand taps',
      stat: h.shareCount + '%', statLabel: 'of your purchases were under $15',
      what: [
        `${h.count} small taps added up to <b>${$(h.total)}</b>, which is ${h.shareTotal}% of everything you spent.`,
        `You made ${A.taps} purchases in ${A.days} days, about ${A.tapsPerDay.toFixed(1)} a day. Most people guess about half their real number.`,
      ],
      trick: 'Tap-to-pay and saved cards took away the "pain of paying" that handing over cash used to cause. Behavioural economists have studied this effect for decades. The smaller the amount, the less your brain registers it, so the biggest leak hides in the smallest numbers.',
      cost: h.yearly, costLine: `${$(h.yearly)} a year in purchases you probably can't remember.`,
      fix: 'Use Check Yourself before every tap this month. Counting your taps is enough to bring the friction back.',
    });
  }
  if (H.bnpl) {
    const h = H.bnpl;
    list.push({
      id: 'bnpl', cat: 'bnpl', title: "Buy now, pay later means you've already spent next month",
      stat: $(h.total), statLabel: `in ${h.count} instalments`,
      what: [`${h.count} payments to ${h.merchants.join(', ')}. Each one is money from a past decision coming out of your current month.`],
      trick: 'Splitting $138 into four payments of $34.50 makes it feel like $34.50. Each plan looks small; together they add up to a bill you committed future-you to without seeing the total. Missed payments can bring late fees.',
      cost: h.yearly, costLine: 'Before you start a new plan, add up the payments you already have.',
      fix: 'No new pay-later plans until the current ones are finished.',
    });
  }
  if (H.payday && H.payday.ratio >= 1.25) {
    const h = H.payday;
    list.push({
      id: 'payday', cat: null, title: "You're rich for three days after payday",
      stat: h.ratio.toFixed(1) + '×', statLabel: 'more spending per day right after you get paid',
      what: [`In the 3 days after money lands you spend about <b>${$(h.perDayIn)} a day</b> on wants. The rest of the time it's ${$(h.perDayOut)}.`, 'That leaves the end of the month tighter, which is when overdrafts and pay-later plans tend to show up.'],
      trick: "A bigger balance makes everything feel affordable. It's called mental accounting: if the money doesn't have a job the moment it arrives, it gets spent before it gets one.",
      cost: (h.perDayIn - h.perDayOut) * 3 * h.count / A.days * 365, costLine: `About ${$((h.perDayIn - h.perDayOut) * 3 * h.count / A.days * 365)} a year in post-payday splurging.`,
      fix: 'Move your savings amount out the day you get paid, before you see the full balance.',
    });
  }
  if (A.weekendShare >= 52) {
    list.push({
      id: 'weekend', cat: null, title: 'Your weekend is doing most of the spending',
      stat: A.weekendShare + '%', statLabel: 'of fun spending happens Friday to Sunday',
      what: [`Three days of the week take ${A.weekendShare}% of what you spend on wants. ${MW.DOW[A.spendiestDow]} is your most expensive day.`],
      trick: 'By the end of the week you have less energy for decisions, and social plans add pressure to say yes. Apps know this: promos and "weekend specials" land on Friday afternoons.',
      cost: 0, costLine: 'Plan the weekend on Thursday and give it a fixed amount.',
      fix: 'Set a weekend amount on Thursday, before you\'re tired.',
    });
  }
  if (H.p2p && H.p2p.total > 40) {
    const h = H.p2p;
    list.push({
      id: 'p2p', cat: 'p2p', title: 'Money with no memory',
      stat: $(h.total), statLabel: `sent on Venmo, Zelle or Cash App (${h.count} times)`,
      what: ["Your statement only shows who you paid, not what it was for. That makes it the hardest spending to look back on."],
      trick: 'Payment apps leave out the "what". Group splits create social pressure to just pay, and the social feed makes spending look normal.',
      cost: h.yearly, costLine: `${$(h.yearly)} a year that your future self can't explain.`,
      fix: 'Add a real note to every Venmo, like "dinner with Priya", not "🍕".',
    });
  }
  if (H.fees) {
    const h = H.fees;
    list.push({
      id: 'fees', cat: 'fees', title: 'You paid your bank for being broke',
      stat: $(h.total, true), statLabel: 'in bank fees',
      what: [`${h.list.map(t => `${t.merchant} (${$(t.amount, true)})`).join(', ')}. Overdraft fees often come from one small purchase on a low-balance day.`],
      trick: 'Overdraft and ATM fees mostly hit people with the smallest buffer. Many banks let you turn overdraft "protection" off, so the card gets declined instead of charging you.',
      cost: h.yearly, costLine: 'This is the easiest money to get back.',
      fix: 'Turn on low-balance alerts and opt out of overdraft coverage in your banking app.',
    });
  }
  if (A.creep >= 15) {
    list.push({
      id: 'creep', cat: null, title: 'Your spending is creeping up',
      stat: '+' + A.creep + '%', statLabel: 'more on wants in the second half of this period',
      what: ['Habits rarely jump. They creep. What felt like a splurge a few weeks ago is now normal.'],
      trick: 'Every time you spend at a new level, that level starts to feel normal. Apps reinforce it with "your usual" and personalised suggestions.',
      cost: 0, costLine: 'Lock in limits now, before the new normal sets.',
      fix: 'Use your dashboard limits to set a ceiling.',
    });
  }
  const sev = c => c >= 1500 ? 'high' : c >= 500 ? 'med' : 'low';
  list.forEach(i => i.severity = sev(i.cost));
  list.sort((a, b) => b.cost - a.cost);

  const top3 = list.filter(i => i.cat && i.cost).slice(0, 3);
  const top3Yearly = top3.reduce((t, i) => t + i.cost, 0);
  A.bigPicture = { top3, yearly: top3Yearly, invested10: top3Yearly * 13.816 };
  return list;
};

/* Monthly averages per want-category, used for the plan. */
MW.planCandidates = function (A) {
  return A.wants.filter(c => !['other', 'p2p'].includes(c.key) && c.monthly >= 10)
    .map(c => ({ key: c.key, label: c.label, emoji: c.emoji, monthly: c.monthly, count: c.count / A.months }))
    .sort((a, b) => b.monthly - a.monthly);
};



/* Money Wrapped — hand-drawn-ish line icons (no emojis in the story). */
window.MW = window.MW || {};

MW.ICONS = {
  delivery: '<circle cx="6" cy="17.5" r="2.5"/><circle cx="18" cy="17.5" r="2.5"/><path d="M8.5 17.5h7M3 13.5h7l2.5 4M14 7h3.2L21 17"/><rect x="3" y="7.5" width="6.5" height="6" rx="1.2"/>',
  coffee: '<path d="M4.5 9h12v4.5A5.5 5.5 0 0 1 11 19h-1a5.5 5.5 0 0 1-5.5-5.5z"/><path d="M16.5 10.5h1.2a2.6 2.6 0 0 1 0 5.2h-1.6"/><path d="M8 2.8c0 1.6 1.6 1.6 1.6 3.4M12.2 2.8c0 1.6 1.6 1.6 1.6 3.4"/><path d="M4 21.5h14"/>',
  matcha: '<path d="M2.5 11.5h19a9.5 9 0 0 1-19 0z"/><path d="M12 11.5c.2-4.2 3.2-7 7.5-7-.2 4.3-3.2 7-7.5 7z"/><path d="M12 11.5c1.6-2 3.4-3.4 5.2-4.4"/>',
  boba: '<path d="M5.5 8h13l-1.6 12.2a2 2 0 0 1-2 1.8H9.1a2 2 0 0 1-2-1.8z"/><path d="M13 8l2.2-6.2h3.3"/><path d="M5 8h14"/><circle cx="9.6" cy="17.4" r="1.1"/><circle cx="14.2" cy="18" r="1.1"/><circle cx="12" cy="14.8" r="1.1"/>',
  bars: '<path d="M3.5 3.5h17L12 13z"/><path d="M12 13v7.5M7.5 20.5h9"/><path d="M15.5 3.5l3.5-2"/><circle cx="16.5" cy="6.5" r="0.6"/>',
  dining: '<path d="M7 2.5v8a2.2 2.2 0 0 0 4.4 0v-8M9.2 12.7v8.8"/><path d="M17.5 2.5c-2.2 0-3.4 3-3.4 6.4s1.2 4.2 3.4 4.2v8.4"/>',
  online: '<path d="M3 7.2 12 3l9 4.2v9.6L12 21l-9-4.2z"/><path d="M3 7.2 12 11.4l9-4.2M12 11.4V21M7.5 5.1l9 4.2"/>',
  shopping: '<path d="M4.5 8h15l-1.2 13.2H5.7z"/><path d="M8.8 8V6.2a3.2 3.2 0 0 1 6.4 0V8"/>',
  beauty: '<path d="M8.5 21.5h7v-9.5h-7z"/><path d="M9.8 12V6.5L14.2 3v9"/><path d="M8.5 16h7"/>',
  subs: '<path d="M17 1.8l3.2 3.2L17 8.2"/><path d="M3.8 11V9.2A4.2 4.2 0 0 1 8 5h12.2"/><path d="M7 22.2 3.8 19 7 15.8"/><path d="M20.2 13v1.8A4.2 4.2 0 0 1 16 19H3.8"/>',
  rides: '<path d="M4.5 15.5v-4.2L6.8 6h10.4l2.3 5.3v4.2"/><path d="M2.5 15.5h19v3.5h-19z"/><path d="M5 19v2M19 19v2"/><circle cx="7.6" cy="12.6" r="1"/><circle cx="16.4" cy="12.6" r="1"/>',
  fun: '<path d="M2.5 7h19v3.2a1.8 1.8 0 0 0 0 3.6V17h-19v-3.2a1.8 1.8 0 0 0 0-3.6z"/><path d="M14.5 7.5v2M14.5 11v2M14.5 14.5v2"/>',
  travel: '<path d="M21.5 2.5 10.8 13.2"/><path d="M21.5 2.5 14.8 21.5l-4-8.3-8.3-4z"/>',
  bnpl: '<circle cx="12" cy="12" r="9.2"/><path d="M12 2.8V12h9.2"/><path d="M12 12l-6.5 6.5"/>',
  p2p: '<path d="M6.5 7.5h14l-3.4-3.4"/><path d="M17.5 16.5h-14l3.4 3.4"/>',
  groceries: '<path d="M2.8 9h18.4l-2 11.2H4.8z"/><path d="M7.5 9l4.5-6.3L16.5 9"/><path d="M9 13v3.5M15 13v3.5M12 13v3.5"/>',
  transport: '<rect x="5.5" y="2.5" width="13" height="14.5" rx="3"/><path d="M5.5 10.5h13M9 21.5l1.2-4.5M15 21.5l-1.2-4.5"/><circle cx="9" cy="13.8" r=".6"/><circle cx="15" cy="13.8" r=".6"/>',
  fitness: '<path d="M6.5 6v12M17.5 6v12M3 9v6M21 9v6M6.5 12h11"/>',
  bills: '<path d="M5 2.5h14v19l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  rent: '<path d="M2.8 11 12 3l9.2 8"/><path d="M5 9.5v11h14v-11"/><path d="M10 20.5v-6h4v6"/>',
  fees: '<path d="M12 2.8 22 20.5H2z"/><path d="M12 10v5M12 17.8v.1"/>',
  other: '<circle cx="12" cy="12" r="9.2"/><path d="M8 12h.1M12 12h.1M16 12h.1"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20M6 15h4.5"/>',
  tap: '<path d="M7.5 7.5a6.5 6.5 0 0 1 0 9M11.5 4.5a11 11 0 0 1 0 15M15.5 2a15 15 0 0 1 0 20"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-7 0-5-5-7-5-12.5-3 2-4.2 5-4.2 7.5-1-.8-2-2-2.3-3.8C5.6 8 4.8 11 4.8 14.8 4.8 19.2 8 22 12 22z"/><path d="M12 22c-1.8 0-3-1.3-3-3.2 0-2.2 2-3.2 3-5.3 1 2.1 3 3.1 3 5.3 0 1.9-1.2 3.2-3 3.2z"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="M7.5 13.5h.1M12 13.5h.1M16.5 13.5h.1M7.5 17.5h.1M12 17.5h.1"/>',
  crown: '<path d="M2.8 7.5 7.5 12l4.5-7.5L16.5 12l4.7-4.5-2 12H4.8z"/><path d="M4.8 22h14.4"/>',
  receipt: '<path d="M5 2.5h14v19l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4"/>',
  moon: '<path d="M20.5 14.5A8.6 8.6 0 1 1 9.5 3.5a6.8 6.8 0 0 0 11 11z"/><path d="M17 3l.6 1.4L19 5l-1.4.6L17 7l-.6-1.4L15 5l1.4-.6z"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2.2"/><circle cx="12" cy="12" r="3"/><path d="M5.5 9.5v.1M18.5 14.5v.1"/>',
  question: '<circle cx="12" cy="12" r="9.2"/><path d="M9.4 9.2a2.7 2.7 0 1 1 3.7 2.5c-.8.3-1.1 1-1.1 1.8M12 16.8v.1"/>',
  eyes: '<ellipse cx="7.5" cy="12" rx="4.5" ry="6"/><ellipse cx="16.5" cy="12" rx="4.5" ry="6"/><circle cx="8.5" cy="13" r="1.6"/><circle cx="17.5" cy="13" r="1.6"/>',
  sparkle: '<path d="M12 2.5c.8 4.6 2.9 6.7 7.5 7.5-4.6.8-6.7 2.9-7.5 7.5-.8-4.6-2.9-6.7-7.5-7.5 4.6-.8 6.7-2.9 7.5-7.5z"/><path d="M19 15.5c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3z"/>',
  target: '<rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M12 9.5v5M9.5 12h5"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  arrow: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  swap: '<path d="M5 8h14l-3.5-3.5M19 16H5l3.5 3.5"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5"/><path d="M12 8c-1.5-3.5-5.5-3.5-5.5-1S10 8 12 8zM12 8c1.5-3.5 5.5-3.5 5.5-1S14 8 12 8z"/>',
  user: '<rect x="8" y="3.5" width="8" height="7" rx="1"/><path d="M4.5 20.5v-3a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  cart: '<path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  share: '<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12.5v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-6.5"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M8 4.5v15M16 4.5v15"/>',
  bank: '<path d="M2.5 9 12 3.2 21.5 9"/><path d="M4.5 9.5v8M9.5 9.5v8M14.5 9.5v8M19.5 9.5v8M2.5 20.5h19"/>',
};

MW.icon = function (name, size, extra) {
  const p = MW.ICONS[name] || MW.ICONS.other;
  return `<svg class="ic ${extra || ''}" width="${size || 24}" height="${size || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
};
MW.catIcon = function (cat, matcha) { return cat === 'coffee' && matcha ? 'matcha' : (MW.ICONS[cat] ? cat : 'other'); };



/* Money Wrapped — the prototype persona.
   Zoe, 19, college sophomore. Part-time campus job + money from mom.
   Spends around $550 a month on DoorDash.
   Statement covers Sep 1 – Oct 17, 2026. The story wraps September; the dashboard tracks October. */
window.MW = window.MW || {};

MW.PERSONA = { name: 'Zoe', age: 19, about: 'Sophomore · campus café job', wrapMonth: '2026-09', trackMonth: '2026-10', today: '2026-10-17' };
/* Follow the real calendar while it's inside the persona's October, so chala and Faiit agree on "today". */
(() => { const d = new Date(), iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; if (iso > MW.PERSONA.today && iso <= '2026-10-31') MW.PERSONA.today = iso; })();

MW.personaTxns = function () {
  const rows = [];
  const add = (date, desc, amount, dir) => rows.push({ date, desc, amount, dir: dir || 'out' });
  const S = d => `2026-09-${String(d).padStart(2, '0')}`;
  const O = d => `2026-10-${String(d).padStart(2, '0')}`;

  /* ---------- money in ---------- */
  [[S, 1], [O, 1]].forEach(([m, d]) => add(m(d), 'ZELLE FROM JENNIFER (MOM)', 500, 'in'));
  [[S, 5], [S, 19], [O, 3], [O, 17]].forEach(([m, d]) => add(m(d), 'CAL DINING PAYROLL DIRECT DEP', 486.20, 'in'));

  /* ---------- the boring stuff (never roasted) ---------- */
  [S, O].forEach(m => {
    add(m(1), 'BERKELEY STUDENT HOUSING RENT', 950);
    add(m(3), 'LEMONADE INSURANCE', 9);
    add(m(6), 'PG&E WEB ONLINE', m === S ? 38.42 : 41.10);
    add(m(12), 'XFINITY INTERNET', 35);
  });
  add(S(20), 'MINT MOBILE', 15);

  /* ---------- September: the fun stuff ---------- */
  // DoorDash: 24 orders, 5-day streak (17–21), two lunch+dinner days
  const dd = [[2, 'SWEETGREEN', 18.40], [4, 'CHIPOTLE', 16.85], [6, 'IPPUDO RAMEN', 31.20], [7, 'CREAM BERKELEY', 14.60], [9, 'THAI BASIL', 24.10],
    [11, 'HALAL GUYS', 19.75], [12, 'SLIVER PIZZA', 27.30], [13, 'SHAKE SHACK', 23.95], [14, 'POKE BAR', 21.40], [15, 'SWEETGREEN', 21.85], [17, 'CHIPOTLE', 17.10],
    [18, 'SWEETGREEN', 19.20], [19, 'IPPUDO RAMEN', 32.65], [20, 'SLIVER PIZZA', 25.80], [21, 'CREAM BERKELEY', 15.25], [21, 'THAI BASIL', 26.40],
    [23, 'POKE BAR', 22.10], [25, 'HALAL GUYS', 20.35], [26, 'SHAKE SHACK', 28.90], [26, 'BOBA GUYS', 12.85], [27, 'SWEETGREEN', 18.95],
    [28, 'CHIPOTLE', 16.40], [29, 'IPPUDO RAMEN', 34.10], [30, 'THAI BASIL', 23.70], [30, 'SLIVER PIZZA', 18.60]];
  dd.forEach(([d, r, a]) => add(S(d), `DOORDASH*${r}`, a));

  // Matcha + coffee (15 matcha, 5 coffee, some doubles)
  [[2, 7.75], [3, 8.25], [5, 7.75], [8, 8.50], [8, 7.75], [10, 7.75], [12, 8.25], [15, 7.75], [16, 8.50], [16, 7.75], [19, 8.25], [22, 7.75], [24, 8.25], [27, 8.50], [29, 7.75]]
    .forEach(([d, a]) => add(S(d), 'SQ *CHA CHA MATCHA', a));
  [[4, 6.45], [11, 5.95], [18, 6.45], [23, 6.95], [25, 6.45]].forEach(([d, a]) => add(S(d), 'STARBUCKS STORE 05721', a));
  [[7, 7.25], [20, 7.50], [28, 7.25]].forEach(([d, a]) => add(S(d), 'BOBA GUYS BERKELEY', a));

  // Shopping
  [[3, 18.99], [6, 12.49], [9, 34.20], [11, 15.99], [15, 22.75], [18, 13.49], [20, 27.80], [24, 9.99], [27, 31.40]]
    .forEach(([d, a]) => add(S(d), 'AMAZON MKTPL*' + (1000 + d * 37), a));
  add(S(10), 'SHEIN.COM', 64.30);
  add(S(14), 'TARGET 00027', 38.12);
  add(S(26), 'TARGET 00027', 27.40);
  add(S(13), 'SEPHORA 0412', 42.00);
  add(S(24), 'SEPHORA 0412', 38.50);
  add(S(5), 'URBAN OUTFITTERS 214', 58.00);

  // Subscriptions
  add(S(4), 'SPOTIFY USA STUDENT', 5.99);
  add(S(9), 'NETFLIX.COM', 7.99);
  add(S(14), 'APPLE.COM/BILL ICLOUD', 2.99);
  add(S(17), 'SNAPCHAT+ SUBSCRIPTION', 3.99);
  add(S(22), 'CAPCUT PRO', 9.99);

  // Buy now pay later (concert fit)
  add(S(8), 'AFTERPAY PRINCESS POLLY', 22.00);
  add(S(22), 'AFTERPAY PRINCESS POLLY', 22.00);

  // Going out
  add(S(13), 'TICKETMASTER', 68.00);
  [[6, 11.40], [13, 18.90], [13, 21.35], [20, 14.80], [27, 16.20]].forEach(([d, a]) => add(S(d), 'UBER   *TRIP', a));
  add(S(19), 'LYFT   *RIDE', 12.60);

  // Groceries, transit, friends
  [[1, 36.40], [10, 28.15], [24, 31.90]].forEach(([d, a]) => add(S(d), "TRADER JOE'S #187", a));
  add(S(1), 'CLIPPER SERVICE', 20);
  [[7, 14.00], [14, 26.50], [21, 18.00], [28, 12.00]].forEach(([d, a]) => add(S(d), 'VENMO PAYMENT ' + (4400 + d), a));

  // The overdraft (two days before mom's money lands)
  add(S(29), 'OVERDRAFT ITEM FEE', 35);

  /* ---------- October so far (for the dashboard) ---------- */
  [[1, 'CHIPOTLE', 17.40], [2, 'SWEETGREEN', 19.80], [3, 'THAI BASIL', 24.60], [4, 'IPPUDO RAMEN', 31.90], [6, 'POKE BAR', 22.30], [8, 'HALAL GUYS', 20.10],
    [9, 'SLIVER PIZZA', 26.40], [10, 'SHAKE SHACK', 24.70], [11, 'CREAM BERKELEY', 14.20], [13, 'CHIPOTLE', 16.95], [15, 'SWEETGREEN', 18.60], [16, 'THAI BASIL', 25.10]]
    .forEach(([d, r, a]) => add(O(d), `DOORDASH*${r}`, a));
  [[1, 7.75], [3, 8.25], [6, 7.75], [7, 8.50], [9, 7.75], [13, 8.25], [14, 7.75], [16, 8.50]].forEach(([d, a]) => add(O(d), 'SQ *CHA CHA MATCHA', a));
  [[2, 6.45], [10, 5.95]].forEach(([d, a]) => add(O(d), 'STARBUCKS STORE 05721', a));
  [[2, 24.99], [5, 13.49], [9, 19.20], [12, 41.80], [15, 11.99]].forEach(([d, a]) => add(O(d), 'AMAZON MKTPL*' + (2000 + d * 41), a));
  add(O(11), 'SHEIN.COM', 47.60);
  add(O(4), 'SPOTIFY USA STUDENT', 5.99);
  add(O(9), 'NETFLIX.COM', 7.99);
  add(O(14), 'APPLE.COM/BILL ICLOUD', 2.99);
  add(O(6), 'AFTERPAY PRINCESS POLLY', 22.00);
  [[4, 15.60], [11, 19.40]].forEach(([d, a]) => add(O(d), 'UBER   *TRIP', a));
  [[5, 33.20], [12, 29.75]].forEach(([d, a]) => add(O(d), "TRADER JOE'S #187", a));
  add(O(1), 'CLIPPER SERVICE', 20);

  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows.map((r, i) => {
    const cat = MW.categorize(r.desc);
    return { id: 'p' + i, date: r.date, desc: r.desc, amount: r.amount, dir: r.dir, cat: r.dir === 'in' ? 'income' : cat, merchant: MW.cleanMerchant(r.desc), matcha: MW.isMatcha(r.desc), src: 'statement' };
  });
};



/* Money Wrapped — local persistence + small UI helpers. */
window.MW = window.MW || {};

const KEY = 'chala-v3-state';
MW.state = { txns: null, A: null, plan: null, logs: [], skips: [], moves: [], isDemo: false };

MW.save = function () {
  try {
    const { txns, plan, logs, skips, moves, isDemo, rentKeys, rentAsked, plays, recapPlays } = MW.state;
    localStorage.setItem(KEY, JSON.stringify({ txns, plan, logs, skips, moves, isDemo, rentKeys, rentAsked, plays, recapPlays, savedAt: Date.now() }));
  } catch (e) { /* private mode or storage full: app still works for this visit */ }
};
MW.load = function () {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    if (!d.txns || !d.txns.length) return false;
    Object.assign(MW.state, { logs: [], skips: [], moves: [] }, d);
    MW.state.A = MW.analyze(d.txns.filter(t => t.date.slice(0, 7) === MW.PERSONA.wrapMonth));
    return true;
  } catch (e) { return false; }
};
MW.wipe = function () {
  try { localStorage.removeItem(KEY); } catch (e) {}
  MW.state = { txns: null, A: null, plan: null, logs: [], skips: [], moves: [], isDemo: false };
};

MW.todayISO = function () {
  if (MW.PERSONA && MW.PERSONA.today) return MW.PERSONA.today;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
MW.uid = () => Math.random().toString(36).slice(2, 9);
MW.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

MW._showOriginal = function (id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.body.dataset.screen = id;
  window.scrollTo(0, 0);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = id === 'realtalk' ? '#14171C' : id === 'story' ? '#E8ECF1' : '#DCE2E9';
};

let toastT;
MW.toast = function (msg) {
  const t = document.getElementById('toast');
  t.innerHTML = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
};

MW.modal = {
  open(html, onMount) {
    const m = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = html;
    m.hidden = false; document.body.classList.add('noscroll');
    requestAnimationFrame(() => m.classList.add('on'));
    if (onMount) onMount(document.getElementById('modal-body'));
  },
  close() {
    const m = document.getElementById('modal');
    m.classList.remove('on'); document.body.classList.remove('noscroll');
    if (MW.modal._t) clearInterval(MW.modal._t);
    setTimeout(() => { m.hidden = true; document.getElementById('modal-body').innerHTML = ''; }, 180);
  },
};

MW.confetti = function (emoji) {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'confetti'; s.textContent = emoji || ['✦', '✧', '•', '·'][i % 4];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDelay = Math.random() * 0.3 + 's';
    s.style.fontSize = 16 + Math.random() * 18 + 'px';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1900);
  }
};



/* Money Wrapped — find pay, rent and the usual monthly bills so they never get roasted. */
window.MW = window.MW || {};

(function () {
  const $ = MW.money;
  const keyOf = d => (d || '').toLowerCase().replace(/[0-9#*()]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 32);
  const ROASTABLE = ['delivery', 'coffee', 'boba', 'bars', 'dining', 'online', 'shopping', 'beauty', 'subs', 'rides', 'fun', 'travel', 'bnpl', 'fees'];
  const BILL_WORDS = /pg&e|pge|electric|edison|power|energy|gas co|water|utility|utilities|xfinity|comcast|spectrum|internet|wifi|verizon|t-mobile|tmobile|at&t|mint mobile|visible|cricket|phone|insurance|lemonade|geico|progressive|state farm|tuition|student loan|navient|nelnet|mohela|sallie|daycare|hoa/;
  const LABEL = { rent: 'Rent', bills: 'Bill', income: 'Money in' };

  const pretty = d => (d || '').replace(/\b(DIRECT DEP|WEB ONLINE|PMT|PAYMENT)\b/gi, '').replace(/[#*]\S*/g, '').replace(/\s{2,}/g, ' ').trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase()).replace(/\bPg&e\b/i, 'PG&E').replace(/\(Mom\)/i, '(Mom)').slice(0, 34);
  function group(list) {
    const g = {};
    list.forEach(t => { const k = keyOf(t.desc); (g[k] = g[k] || []).push(t); });
    return Object.entries(g).map(([key, items]) => ({
      key, items, label: pretty(items[0].desc),
      total: items.reduce((s, t) => s + t.amount, 0), months: new Set(items.map(t => t.date.slice(0, 7))).size,
      avg: items.reduce((s, t) => s + t.amount, 0) / items.length,
    })).sort((a, b) => b.avg - a.avg);
  }

  /* Tag essentials. Keyword match OR a steady charge that repeats every month and isn't a "fun" category. */
  MW.detectEssentials = function (txns) {
    txns.forEach(t => {
      if (t.dir === 'in') { t.cat = 'income'; return; }
      if (t._userKept) return;
      if (t.cat === 'rent' || t.cat === 'bills') return;
      if (BILL_WORDS.test((t.desc || '').toLowerCase()) && !ROASTABLE.includes(t.cat)) { t._origCat = t.cat; t.cat = 'bills'; }
    });
    // repeating, steady, non-fun payments → bill
    group(txns.filter(t => t.dir === 'out' && !ROASTABLE.includes(t.cat) && !['rent', 'bills', 'groceries', 'transport'].includes(t.cat))).forEach(g => {
      if (g.months < 2) return;
      const steady = g.items.every(t => Math.abs(t.amount - g.avg) / g.avg < 0.12);
      if (steady && g.avg >= 15) g.items.forEach(t => { t._origCat = t.cat; t.cat = g.avg >= 400 ? 'rent' : 'bills'; });
    });
    return {
      income: group(txns.filter(t => t.dir === 'in')),
      rent: group(txns.filter(t => t.dir === 'out' && t.cat === 'rent')),
      bills: group(txns.filter(t => t.dir === 'out' && t.cat === 'bills')),
    };
  };

  /* "Not roasting these" screen. Tap a row to put it back in the roast. */
  MW.askEssentials = function (txns, monthKey) {
    return new Promise(resolve => {
      const found = MW.detectEssentials(txns);
      const off = new Set();
      const inMonth = g => g.items.filter(t => t.date.slice(0, 7) === monthKey).reduce((s, t) => s + t.amount, 0) || g.avg;
      const row = (g, kind) => `
        <button class="ess-row ${off.has(g.key) ? 'off' : ''}" data-key="${MW.esc(g.key)}" ${kind === 'income' ? 'data-fixed' : ''} aria-pressed="${!off.has(g.key)}">
          <span class="ess-ic">${MW.icon(kind === 'income' ? 'money' : kind === 'rent' ? 'rent' : 'bills', 18)}</span>
          <span class="ess-main"><b>${MW.esc(g.label)}</b><small>${kind === 'income' ? 'Money in' : kind === 'rent' ? 'Rent' : g.months > 1 ? 'Bill · every month' : 'Bill'}</small></span>
          <span class="ess-amt">${kind === 'income' ? '+' : ''}${$(inMonth(g))}</span>
        </button>`;
      function render() {
        const essTotal = [...found.rent, ...found.bills].filter(g => !off.has(g.key)).reduce((s, g) => s + inMonth(g), 0);
        const inTotal = found.income.reduce((s, g) => s + inMonth(g), 0);
        document.getElementById('ess-main').innerHTML = `
          <p class="sv-count">Before the roast</p>
          <h1 class="sv-title">Not roasting these.</h1>
          <p class="sv-sub">Pay, rent and bills are life, not habits. We found them and left them out. Tap anything we got wrong.</p>
          <p class="sv-label">Money in · ${$(inTotal)}</p>
          <div class="ess-list">${found.income.map(g => row(g, 'income')).join('')}</div>
          <p class="sv-label">Rent & bills · ${$(essTotal)}</p>
          <div class="ess-list">${found.rent.map(g => row(g, 'rent')).join('')}${found.bills.map(g => row(g, 'bills')).join('')}</div>
          <p class="ess-note">Everything else is fair game.</p>
          <div class="sv-nav single"><button class="btn btn-primary" id="ess-go">Roast the rest</button></div>`;
        document.querySelectorAll('#ess-main .ess-row:not([data-fixed])').forEach(b => b.onclick = () => {
          const k = b.dataset.key; off.has(k) ? off.delete(k) : off.add(k); render();
        });
        document.getElementById('ess-go').onclick = () => {
          txns.forEach(t => { if (t.dir === 'out' && off.has(keyOf(t.desc))) { t.cat = t._origCat && !['rent', 'bills'].includes(t._origCat) ? t._origCat : 'other'; t._userKept = true; } });
          resolve();
        };
      }
      MW.show('essentials');
      render();
    });
  };
})();

