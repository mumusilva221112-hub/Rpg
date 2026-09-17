/* Aurils — o sistema de moedas.
   Denominações e conversões (base 10, auril como unidade de referência). */
(function () {
  'use strict';

  // da maior para a menor
  const DENOMS = [
    { id: 'platina', name: 'Platina', per: 1000, sym: 'Pl', css: 'coin-platina' },
    { id: 'auril',   name: 'Auril',   per: 100,  sym: 'A',  css: 'coin-auril' },
    { id: 'prata',   name: 'Prata',   per: 10,   sym: 'pt', css: 'coin-prata' },
    { id: 'copo',    name: 'Copo',    per: 1,    sym: 'cp', css: 'coin-copo' }
  ];

  function byId(id) {
    return DENOMS.find(function (d) { return d.id === id; }) || DENOMS[1];
  }

  // Total em copos -> quantidades em cada moeda (troco "padrão": 10 cp = 1 pt, etc.)
  function breakdown(copos) {
    copos = Math.max(0, Math.round(copos));
    const b = { platina: Math.floor(copos / 1000) };
    let r = copos % 1000;
    b.auril = Math.floor(r / 100);
    r %= 100;
    b.prata = Math.floor(r / 10);
    r %= 10;
    b.copo = r;
    return b;
  }

  // "1 Pl · 2 A · 5 pt · 7 cp" (zeros omitidos)
  function formatCoins(copos) {
    const b = breakdown(copos);
    const parts = [];
    DENOMS.forEach(function (d) {
      if (b[d.id] > 0) parts.push(b[d.id] + ' ' + d.sym);
    });
    return parts.length ? parts.join(' · ') : '0 cp';
  }

  // Total em aurils (2 casas): "12,35 A"
  function formatAurils(copos) {
    let s = (Math.max(0, Math.round(copos)) / 100).toFixed(2).replace('.', ',');
    s = s.replace(/,00$/, '');
    return s + ' A';
  }

  window.AURILS_CURRENCY = {
    DENOMS: DENOMS,
    byId: byId,
    breakdown: breakdown,
    formatCoins: formatCoins,
    formatAurils: formatAurils
  };
})();
