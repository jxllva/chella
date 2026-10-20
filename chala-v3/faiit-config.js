/* Faiit runtime config.
   Leave plaid as null to use the labelled demo bank connection.
   To use real Plaid, run server/plaid-server.mjs (it serves this app) and set:
     window.FAIIT_CONFIG = { plaid: { linkTokenUrl: '/api/plaid/link-token', exchangeUrl: '/api/plaid/exchange' } };
*/
window.FAIIT_CONFIG = { plaid: null };
