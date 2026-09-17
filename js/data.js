/* Aurils — estado inicial: lista de preços padrão do mercado. */
(function () {
  'use strict';

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  const ITEMS = [
    { name: 'Pão e água',                 priceCopos: 2,      icon: '🍞' },
    { name: 'Cerveja (jarra)',            priceCopos: 5,      icon: '🍺' },
    { name: 'Refeição de estalagem',      priceCopos: 10,     icon: '🍖' },
    { name: 'Corda (15 m)',               priceCopos: 100,    icon: '🪢' },
    { name: 'Tochas (x10)',               priceCopos: 200,    icon: '🕯️' },
    { name: 'Noite em estalagem',         priceCopos: 100,    icon: '🛏️' },
    { name: 'Poção de vida',              priceCopos: 200,    icon: '🧪' },
    { name: 'Lâmina curta',               priceCopos: 800,    icon: '🗡️' },
    { name: 'Antídoto',                   priceCopos: 500,    icon: '🧴' },
    { name: 'Escudo de madeira',          priceCopos: 2000,   icon: '🛡️' },
    { name: 'Arco curto',                 priceCopos: 2500,   icon: '🏹' },
    { name: 'Herbário (componentes)',     priceCopos: 1500,   icon: '🌿' },
    { name: 'Armadura de couro',          priceCopos: 3000,   icon: '🧥' },
    { name: 'Informações (espião)',       priceCopos: 5000,   icon: '👁️' },
    { name: 'Carroça (dia de aluguel)',   priceCopos: 500,    icon: '🚚' },
    { name: 'Cota de malha',              priceCopos: 12000,  icon: '⛓️' },
    { name: 'Cavalo de montaria',         priceCopos: 15000,  icon: '🐴' }
  ];

  window.AURILS_DATA = {
    defaultState: function () {
      return {
        version: 1,
        party: [],
        items: ITEMS.map(function (i) {
          return { id: uid(), name: i.name, icon: i.icon, priceCopos: i.priceCopos };
        }),
        log: []
      };
    }
  };
})();
