# Aurils 🪙 — Sistema de Moedas para Campanha de RPG

> Moedas, tesouro e economia para a sua campanha — 100% no navegador, sem conta e sem servidor.

**Aurils** é um sistema de moedas completo + rastreador de tesouro para campanhas de RPG.
Tudo roda no navegador e fica salvo localmente (`localStorage`), com **exportar/importar (JSON)**
para levar a campanha de um dispositivo para outro.

---

## 💰 O sistema de moedas Aurils

| Moeda | Equivalência | Em aurils |
|---|---|---|
| 🔵 Platina | 1 platina = 10 aurils | 10 A |
| 🟡 **Auril** (moeda-base) | 1 auril = 10 pratas | 1 A |
| ⚪ Prata | 1 prata = 10 copos | 0,10 A |
| 🟤 Copo | moeda menor | 0,01 A |

**Lore sugerida:** *O Auril, cunhado nas forjas da Casa Auriana, é a moeda de referência do
reino — dez pratas por auril, dez aurils por platina. Uma noite em estalagem custa 1 A; uma
lâmina boa, 8 A; um cavalo de guerra, 150 A.*

> A cotação é sempre a "oficial": o troco segue 10 cp = 1 pt, 10 pt = 1 A, 10 A = 1 Pl.

## ✨ Funcionalidades

- 🏆 **Tesouro** — recrute personagens, veja a cotação em moedas (Pl / A / pt / cp) e o total em aurils de cada um e do grupo; botões rápidos de +/− por moeda.
- 📜 **Transações** — registre ganhos e gastos em qualquer moeda, com histórico datado e desfazer.
- ⚖️ **Mercado** — lista de preços pronta (poções, armaduras, montarias…); comprar e vender (venda a 50%); adicione seus próprios itens.
- 🔁 **Conversor** — qualquer valor, em qualquer moeda, convertido em todas as outras.
- ⚙️ **Sistema** — regras da moeda, backup da campanha (exportar/importar JSON) e recomeço total.

## 🚀 Rodando localmente

O site é 100% estático (sem etapa de build). Qualquer servidor de arquivos serve:

```bash
python3 -m http.server 4173
# ou: npx serve .
```

Depois abra http://localhost:4173

## 🌐 Deploy na Vercel

O repositório já está pronto para a Vercel — por ser um site estático, **não há nada para compilar**:

**Opção 1 — painel da Vercel (recomendado)**
1. Importe este repositório em [vercel.com/new](https://vercel.com/new).
2. A Vercel detecta automaticamente como site **Static** — não configure nada.
3. Clique em **Deploy**. Pronto.

**Opção 2 — CLI da Vercel**

```bash
npm i -g vercel
vercel        # gera um preview
vercel prod   # publica em produção
```

## 📁 Estrutura do projeto

```
Rpg/
├── index.html          # interface da aplicação
├── css/
│   └── styles.css      # tema fantasia dark (moedas em CSS puro)
├── js/
│   ├── currency.js     # o sistema de moedas: denominações e conversões
│   ├── data.js         # lista de preços padrão e estado inicial
│   ├── storage.js      # persistência (localStorage)
│   └── app.js          # lógica, renderização e interações
├── vercel.json         # configuração Vercel
└── README.md
```

## 🔧 Personalizando

- **Preços do mercado:** edite `js/data.js` (ou adicione itens direto na aba Mercado).
- **Taxa de venda:** função `sellItem` em `js/app.js` (padrão 50%).
- **Moedas/valores:** todas as conversões estão centralizadas em `js/currency.js`.
