/* Aurils — sistema de moedas para campanhas de RPG.
   app.js: estado, renderização e interações. */
(function () {
  'use strict';

  const C = window.AURILS_CURRENCY;
  const S = window.AURILS_STORAGE;
  const D = window.AURILS_DATA;

  const $ = function (sel) { return document.querySelector(sel); };

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------------- Estado ---------------- */

  function normalize(data) {
    const base = D.defaultState();
    return {
      version: 1,
      party: Array.isArray(data.party)
        ? data.party
            .filter(function (p) { return p && typeof p.name === 'string'; })
            .map(function (p) {
              return {
                id: p.id || uid(),
                name: p.name,
                copos: Math.max(0, Math.round(Number(p.copos) || 0))
              };
            })
        : [],
      items: Array.isArray(data.items)
        ? data.items
            .filter(function (i) { return i && typeof i.name === 'string'; })
            .map(function (i) {
              return {
                id: i.id || uid(),
                name: i.name,
                icon: i.icon || '📦',
                priceCopos: Math.max(1, Math.round(Number(i.priceCopos) || 0))
              };
            })
        : base.items,
      log: Array.isArray(data.log) ? data.log.slice(0, 300) : []
    };
  }

  let state = S.load() ? normalize(S.load()) : D.defaultState();

  function save() { S.save(state); }

  /* ---------------- Toast ---------------- */

  let toastTimer = null;
  function toast(msg, type) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'toast'; }, 2800);
  }

  /* ---------------- Abas ---------------- */

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        document.querySelectorAll('.tab').forEach(function (t) {
          t.classList.toggle('active', t.id === 'tab-' + btn.dataset.tab);
        });
      });
    });
  }

  /* ---------------- Seletores de jogador ---------------- */

  function refreshPlayerSelects() {
    ['tx-player', 'mkt-player'].forEach(function (id) {
      const sel = document.getElementById(id);
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = state.party.length
        ? state.party.map(function (p) {
            return '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>';
          }).join('')
        : '<option value="">— recrute um aventureiro —</option>';
      if (state.party.some(function (p) { return p.id === prev; })) sel.value = prev;
    });
  }

  function playerFromSelect(selId) {
    const sel = document.getElementById(selId);
    return state.party.find(function (p) { return p.id === sel.value; }) || null;
  }

  /* ---------------- Registro de transações ---------------- */

  function pushLog(p, type, copos, extra) {
    const entry = Object.assign(
      { id: uid(), ts: Date.now(), playerId: p.id, playerName: p.name, type: type, copos: copos },
      extra || {}
    );
    state.log.unshift(entry);
    state.log = state.log.slice(0, 300);
  }

  /* ---------------- Aba: Tesouro ---------------- */

  function renderParty() {
    const grid = $('#party-grid');
    grid.innerHTML = '';
    const total = state.party.reduce(function (acc, p) { return acc + p.copos; }, 0);
    $('#group-total').textContent = state.party.length
      ? 'Tesouro do grupo: ' + C.formatAurils(total)
      : '';
    if (!state.party.length) {
      grid.innerHTML = '<div class="empty">Nenhum aventureiro na campanha ainda.<br>Use o formulário acima para recrutar o primeiro. 🗡️</div>';
      return;
    }
    state.party.forEach(function (p) { grid.appendChild(playerCard(p)); });
  }

  function playerCard(p) {
    const card = document.createElement('article');
    card.className = 'player-card';
    const b = C.breakdown(p.copos);
    card.innerHTML =
      '<div class="player-head">' +
        '<h3>' + escapeHtml(p.name) + '</h3>' +
        '<span class="total">' + C.formatAurils(p.copos) + '</span>' +
      '</div>' +
      '<ul class="coins">' +
        C.DENOMS.map(function (d) {
          return (
            '<li class="coin-row">' +
              '<span class="coin ' + d.css + '" data-sym="' + d.sym + '"></span>' +
              '<span class="coin-name">' + d.name + '</span>' +
              '<button type="button" class="step" data-act="minus" data-denom="' + d.id + '" title="Tirar 1 ' + d.name + '">−</button>' +
              '<span class="qty">' + b[d.id] + '</span>' +
              '<button type="button" class="step" data-act="plus" data-denom="' + d.id + '" title="Dar 1 ' + d.name + '">+</button>' +
            '</li>'
          );
        }).join('') +
      '</ul>' +
      '<div class="player-foot">' +
        '<button type="button" class="icon-btn" data-act="rename" title="Renomear">✎ renomear</button>' +
        '<button type="button" class="icon-btn danger" data-act="remove" title="Remover da campanha">🗑 remover</button>' +
      '</div>';

    card.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === 'rename') {
        const n = window.prompt('Novo nome do personagem:', p.name);
        if (n && n.trim()) { p.name = n.trim(); save(); renderAll(); }
      } else if (act === 'remove') {
        if (window.confirm('Remover ' + p.name + ' da campanha?')) {
          state.party = state.party.filter(function (x) { return x.id !== p.id; });
          save(); renderAll();
          toast(p.name + ' deixou a campanha.', 'warn');
        }
      } else if (act === 'plus' || act === 'minus') {
        const d = C.byId(btn.dataset.denom);
        p.copos = Math.max(0, p.copos + (act === 'plus' ? d.per : -d.per));
        save(); renderAll();
      }
    });
    return card;
  }

  function initPlayerForm() {
    $('#form-player').addEventListener('submit', function (e) {
      e.preventDefault();
      const name = $('#p-name').value.trim();
      const startA = Number(String($('#p-start').value).replace(',', '.')) || 0;
      if (!name) { toast('Dê um nome ao aventureiro.', 'warn'); return; }
      state.party.push({ id: uid(), name: name, copos: Math.max(0, Math.round(startA * 100)) });
      $('#p-name').value = '';
      save(); renderAll();
      toast('⚔️ ' + name + ' entrou na campanha!');
    });
  }

  /* ---------------- Aba: Transações ---------------- */

  function initTxForm() {
    $('#form-tx').addEventListener('submit', function (e) {
      e.preventDefault();
      const p = playerFromSelect('tx-player');
      if (!p) { toast('Recrute um aventureiro antes de registrar transações.', 'warn'); return; }
      const type = document.querySelector('input[name="tx-type"]:checked').value;
      const d = C.byId($('#tx-denom').value);
      const qty = Math.floor(Number($('#tx-qty').value));
      if (!qty || qty < 1) { toast('Quantidade mínima: 1 moeda.', 'warn'); return; }
      const copos = qty * d.per;
      if (type === 'out' && p.copos < copos) {
        toast(p.name + ' tem apenas ' + C.formatAurils(p.copos) + ' — não dá para pagar ' + C.formatAurils(copos) + '.', 'warn');
        return;
      }
      p.copos += type === 'in' ? copos : -copos;
      pushLog(p, type, copos, { denom: d.id, qty: qty, note: $('#tx-note').value.trim() });
      save(); renderAll();
      toast((type === 'in' ? '💰 ' : '💸 ') + p.name + ': ' + (type === 'in' ? '+' : '−') + ' ' + qty + ' ' + d.name + ' (' + C.formatAurils(copos) + ')');
      e.target.reset();
      document.querySelector('input[name="tx-type"][value="in"]').checked = true;
    });
  }

  function renderLog() {
    const list = $('#log-list');
    list.innerHTML = '';
    if (!state.log.length) {
      list.innerHTML = '<li class="log-empty">Nenhuma transação ainda. Ganho ou gasto aparecem aqui.</li>';
      return;
    }
    state.log.forEach(function (entry) {
      const d = entry.denom ? C.byId(entry.denom) : null;
      const li = document.createElement('li');
      li.className = 'log-item ' + (entry.type === 'in' ? 'in' : 'out');
      const dt = new Date(entry.ts);
      const when = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
                   dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const amountLabel = d ? entry.qty + ' ' + d.name : C.formatAurils(entry.copos);
      li.innerHTML =
        '<span class="log-icon">' + (entry.type === 'in' ? '💰' : '💸') + '</span>' +
        '<div class="log-main">' +
          '<strong>' + escapeHtml(entry.playerName) + '</strong>' +
          '<span class="log-amount">' + (entry.type === 'in' ? '+' : '−') + ' ' + amountLabel + '</span>' +
          (d ? '<small class="muted">(' + C.formatAurils(entry.copos) + ')</small>' : '') +
          (entry.note ? '<span class="log-note">— ' + escapeHtml(entry.note) + '</span>' : '') +
        '</div>' +
        '<span class="log-when">' + when + '</span>' +
        '<button type="button" class="icon-btn danger" data-del="' + entry.id + '" title="Desfazer transação">✖</button>';
      li.querySelector('[data-del]').addEventListener('click', function () {
        const p = state.party.find(function (x) { return x.id === entry.playerId; });
        if (p) p.copos = Math.max(0, p.copos + (entry.type === 'in' ? -entry.copos : entry.copos));
        state.log = state.log.filter(function (x) { return x.id !== entry.id; });
        save(); renderAll();
        toast('Transação desfeita.', 'warn');
      });
      list.appendChild(li);
    });
  }

  /* ---------------- Aba: Mercado ---------------- */

  function updateMktSummary() {
    const p = playerFromSelect('mkt-player');
    $('#mkt-summary').textContent = p ? 'Tesouro de ' + p.name + ': ' + C.formatAurils(p.copos) : '';
  }

  function renderMarket() {
    const wrap = $('#market-items');
    wrap.innerHTML = '';
    if (!state.items.length) {
      wrap.innerHTML = '<li class="log-empty">Mercado vazio. Adicione um item abaixo. 🏪</li>';
    }
    state.items.forEach(function (item) {
      const row = document.createElement('li');
      row.className = 'item-row';
      row.innerHTML =
        '<span class="item-icon">' + (item.icon || '📦') + '</span>' +
        '<div class="item-info">' +
          '<strong>' + escapeHtml(item.name) + '</strong><br>' +
          '<small>' + C.formatCoins(item.priceCopos) + ' · ' + C.formatAurils(item.priceCopos) + '</small>' +
        '</div>' +
        '<div class="item-controls">' +
          '<button type="button" class="step" data-m="-1" aria-label="Diminuir quantidade">−</button>' +
          '<span class="qty">1</span>' +
          '<button type="button" class="step" data-m="1" aria-label="Aumentar quantidade">+</button>' +
          '<button type="button" class="btn buy">Comprar</button>' +
          '<button type="button" class="btn sell">Vender</button>' +
          '<button type="button" class="icon-btn danger" data-rm title="Remover do mercado">🗑</button>' +
        '</div>';
      let qty = 1;
      const qEl = row.querySelector('.qty');
      row.querySelectorAll('[data-m]').forEach(function (b) {
        b.addEventListener('click', function () {
          qty = Math.min(99, Math.max(1, qty + Number(b.dataset.m)));
          qEl.textContent = qty;
        });
      });
      row.querySelector('.buy').addEventListener('click', function () { buyItem(item, qty); });
      row.querySelector('.sell').addEventListener('click', function () { sellItem(item, qty); });
      row.querySelector('[data-rm]').addEventListener('click', function () {
        if (window.confirm('Remover "' + item.name + '" do mercado?')) {
          state.items = state.items.filter(function (x) { return x.id !== item.id; });
          save(); renderMarket();
        }
      });
      wrap.appendChild(row);
    });
    updateMktSummary();
  }

  function buyItem(item, qty) {
    const p = playerFromSelect('mkt-player');
    if (!p) { toast('Escolha quem vai comprar no mercado.', 'warn'); return; }
    const cost = item.priceCopos * qty;
    if (p.copos < cost) {
      toast(p.name + ' não tem ' + C.formatAurils(cost) + ' para pagar.', 'warn');
      return;
    }
    p.copos -= cost;
    pushLog(p, 'out', cost, { denom: null, qty: qty, note: 'Comprou ' + qty + '× ' + item.name + ' (mercado)' });
    save(); renderAll();
    toast('💸 ' + p.name + ' comprou ' + qty + '× ' + item.name + ' por ' + C.formatAurils(cost) + '.');
  }

  function sellItem(item, qty) {
    const p = playerFromSelect('mkt-player');
    if (!p) { toast('Escolha quem vai vender no mercado.', 'warn'); return; }
    const gain = Math.floor(item.priceCopos * qty * 0.5);
    if (gain <= 0) { toast('Este item vale menos de 1 copo na venda.', 'warn'); return; }
    p.copos += gain;
    pushLog(p, 'in', gain, { denom: null, qty: qty, note: 'Vendeu ' + qty + '× ' + item.name + ' (50% — mercado)' });
    save(); renderAll();
    toast('💰 ' + p.name + ' vendeu ' + qty + '× ' + item.name + ' por ' + C.formatAurils(gain) + '.');
  }

  function initItemForm() {
    $('#form-item').addEventListener('submit', function (e) {
      e.preventDefault();
      const name = $('#i-name').value.trim();
      const priceA = Number(String($('#i-price').value).replace(',', '.'));
      if (!name) { toast('Dê um nome ao item.', 'warn'); return; }
      if (!(priceA > 0)) { toast('Preço deve ser maior que zero (em A).', 'warn'); return; }
      const priceCopos = Math.max(1, Math.round(priceA * 100));
      state.items.push({ id: uid(), name: name, icon: $('#i-icon').value.trim() || '📦', priceCopos: priceCopos });
      save(); renderMarket();
      e.target.reset();
      toast('🏪 ' + name + ' entrou no mercado por ' + C.formatAurils(priceCopos) + '.');
    });
  }

  /* ---------------- Aba: Conversor ---------------- */

  function renderConverter() {
    const denom = C.byId($('#cv-denom').value);
    const val = Number(String($('#cv-value').value).replace(',', '.')) || 0;
    const copos = Math.max(0, Math.round(val * denom.per));
    const b = C.breakdown(copos);
    $('#cv-result').innerHTML =
      C.DENOMS.map(function (d) {
        return (
          '<div class="cv-row">' +
            '<span class="coin ' + d.css + '" data-sym="' + d.sym + '"></span>' +
            '<span class="coin-name">' + d.name + '</span>' +
            '<span class="cv-qty">' + b[d.id].toLocaleString('pt-BR') + '</span>' +
          '</div>'
        );
      }).join('') +
      '<div class="cv-total">= ' + C.formatAurils(copos) + '</div>';
  }

  function initConverter() {
    $('#cv-value').addEventListener('input', renderConverter);
    $('#cv-denom').addEventListener('change', renderConverter);
    renderConverter();
  }

  /* ---------------- Aba: Sistema (backup) ---------------- */

  function initSystem() {
    $('#btn-export').addEventListener('click', function () {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aurils-campanha-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('⬇️ Backup exportado!');
    });

    $('#import-file').addEventListener('change', function (e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !Array.isArray(data.party) || !Array.isArray(data.items)) throw new Error('formato inválido');
          if (!window.confirm('Importar esse backup? A campanha atual será substituída.')) return;
          state = normalize(data);
          save(); renderAll();
          toast('⬆️ Campanha importada!');
        } catch (err) {
          toast('Arquivo inválido — use um backup exportado do Aurils.', 'warn');
        }
      };
      reader.readAsText(file);
    });

    $('#btn-reset').addEventListener('click', function () {
      if (window.confirm('Recomeçar a campanha? Todo o tesouro e o histórico serão apagados.')) {
        state = D.defaultState();
        save(); renderAll();
        toast('🔥 Campanha recomeçada.', 'warn');
      }
    });
  }

  /* ---------------- Inicialização ---------------- */

  function renderAll() {
    refreshPlayerSelects();
    renderParty();
    renderLog();
    renderMarket();
  }

  function fillDenomSelects() {
    const opts = C.DENOMS.map(function (d) {
      return '<option value="' + d.id + '">' + d.name + ' (' + d.sym + ')</option>';
    }).join('');
    $('#tx-denom').innerHTML = opts;
    $('#tx-denom').value = 'auril';
    $('#cv-denom').innerHTML = opts;
    $('#cv-denom').value = 'auril';
  }

  function init() {
    initTabs();
    initPlayerForm();
    initTxForm();
    initItemForm();
    initConverter();
    initSystem();
    fillDenomSelects();
    $('#mkt-player').addEventListener('change', updateMktSummary);
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
