/* Real Plaid Link for Faiit.
   Turns on only when faiit-config.js sets FAIIT_CONFIG.plaid and the app is served by server/plaid-server.mjs
   (or any backend exposing the same two endpoints). Without that, "Connect your bank" runs the labelled demo. */
(() => {
  const cfg = () => window.FAIIT_CONFIG?.plaid || null;
  let loading = null;
  const loadLink = () => window.Plaid ? Promise.resolve() : (loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    s.onload = resolve;
    s.onerror = () => { loading = null; reject(Error('Could not load Plaid. Check your connection and try again.')); };
    document.head.append(s);
  }));
  const post = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Error(j.error || 'The bank connection failed. Try again.');
    return j;
  };

  // Plaid personal_finance_category -> Faiit categories
  const PRIMARY = {
    FOOD_AND_DRINK: 'Dining', GENERAL_MERCHANDISE: 'Shopping', HOME_IMPROVEMENT: 'Shopping', TRANSPORTATION: 'Transport',
    TRAVEL: 'Travel', RENT_AND_UTILITIES: 'Rent & bills', MEDICAL: 'Health', PERSONAL_CARE: 'Health',
    ENTERTAINMENT: 'Subscriptions', GENERAL_SERVICES: 'Other', GOVERNMENT_AND_NON_PROFIT: 'Other', BANK_FEES: 'Other'
  };
  const CURRENCIES = ['USD', 'GBP', 'EUR', 'NGN', 'CAD'];
  function toRow(t) {
    const merchant = String(t.merchant_name || t.name || 'Unknown').slice(0, 160);
    const primary = t.personal_finance_category?.primary || '', detailed = t.personal_finance_category?.detailed || '';
    // Plaid: positive amount = money leaving the account
    let kind = t.amount > 0 ? 'expense' : 'credit';
    if (primary === 'TRANSFER_IN' || primary === 'TRANSFER_OUT' || primary === 'LOAN_PAYMENTS') kind = 'transfer';
    if (primary === 'INCOME') kind = 'credit';
    let category = MWData.category(merchant, PRIMARY[primary] || '');
    if (/COFFEE/.test(detailed)) category = 'Cafés';
    else if (/GROCERIES/.test(detailed)) category = 'Groceries';
    else if (/doordash|uber\s?eats|grubhub|postmates|deliveroo/i.test(merchant)) category = 'Food delivery';
    const currency = String(t.iso_currency_code || 'USD').toUpperCase();
    return {
      date: t.date, merchant, cents: Math.round(Math.abs(Number(t.amount) || 0) * 100), category, kind,
      currency: CURRENCIES.includes(currency) ? currency : 'USD', include: kind === 'expense', source: 'Bank connection', note: ''
    };
  }

  async function open() {
    const c = cfg();
    if (!c) return;
    try {
      await loadLink();
      const { link_token } = await post(c.linkTokenUrl, {});
      const handler = window.Plaid.create({
        token: link_token,
        onSuccess: async (public_token, metadata) => {
          FaiitApp.toast('Reading your transactions…');
          try {
            const data = await post(c.exchangeUrl, { public_token });
            if (data.name) Faiit.noteName(data.name, 'bank');
            const rows = (data.transactions || []).map(toRow).filter(r => r.date && r.cents > 0);
            if (!rows.length) { FaiitApp.toast('Connected, but no transactions came through yet. Try again in a minute.'); return; }
            FaiitApp.importRows(rows, metadata?.institution?.name || 'Bank connection');
          } catch (e) { FaiitApp.toast(e.message); }
        },
        onExit: err => { if (err) FaiitApp.toast(err.display_message || 'The bank connection was closed.'); }
      });
      handler.open();
    } catch (e) { FaiitApp.toast(e.message); }
  }

  window.FaiitPlaid = { ready: () => !!cfg()?.linkTokenUrl, open, toRow };
})();
