/* Aurils — persistência local (localStorage). */
(function () {
  'use strict';

  const KEY = 'aurils-campanha-v1';

  window.AURILS_STORAGE = {
    load: function () {
      try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    },
    save: function (state) {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        /* armazenamento indisponível (modo anônimo etc.) — segue sem persistir */
      }
    },
    clear: function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {
        /* ignore */
      }
    }
  };
})();
