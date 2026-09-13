# Vendas, formas de pagamento e Pix

Depois de finalizar a compra, o app passa a registrar a venda com a forma de pagamento e ganha uma aba de Vendas com resumos e exportação em PDF.

## Finalizar compra com forma de pagamento

Ao tocar em "Finalizar Compra", abre uma tela de pagamento:

- Escolha da forma: **Dinheiro**, **Débito**, **Crédito** ou **Pix** (botões grandes).
- Dinheiro: mantém o campo de valor pago e o troco como hoje.
- Pix: mostra um **QR Code** com o valor da compra, gerado a partir da chave Pix cadastrada, mais o código para copiar e colar.
- Botão "Confirmar pagamento" grava a venda, baixa o estoque e limpa o carrinho.

Cada venda guarda: data e hora, itens (nome, preço, quantidade), total, forma de pagamento e, no dinheiro, valor pago e troco.

## Nova aba Vendas

Barra inferior passa a ter três abas: Caixa, Estoque e **Vendas**.

```text
┌──────────────────────────┐
│  Vendas   [⚙ Config]     │
│  Semana │ 15 dias │ Mês  │
│  Total R$ 1.240,00       │
│  Dinheiro 480 · Pix 500  │
│  Débito 160 · Crédito100 │
│  ─── lista de vendas ─── │
│  13/09 14:22  R$ 42,90   │
│  Pix · 3 itens           │
├──────────────────────────┤
│  🛒 Caixa 📦 Estoque 💰 Vendas│
└──────────────────────────┘
```

- Filtros rápidos: **Semanal**, **Quinzenal**, **Mensal** e **Período** (escolher data inicial e final).
- Resumo do período: total vendido, número de vendas e total por forma de pagamento.
- Lista das vendas do período; tocar numa venda mostra os itens.
- Botão **Gerar PDF**: exporta todas as vendas do período escolhido (ou tudo), com cabeçalho, tabela de vendas, forma de pagamento e totais.

## Configurações do Pix (dentro de Vendas)

Tela de configurações acessível pela aba Vendas:

- Nome do recebedor, cidade e **chave Pix** (CPF/CNPJ, telefone, e-mail ou aleatória).
- Nome do mercado para o cabeçalho do PDF.
- Prévia do QR Code para conferir se a chave está certa.
- Se a chave não estiver cadastrada e o atendente escolher Pix, aparece aviso com atalho para cadastrar.

## Detalhes técnicos

- `src/store/useStore.ts`: novos tipos `PaymentMethod` e `Sale` (id, timestamp, itens congelados com nome/preço, total, método, paidAmount/change), array `sales`, `settings` (pixKey, merchantName, city, storeName); `checkout(payload)` passa a receber a forma de pagamento e a gravar a venda. Persistência segue no `localStorage` (mesma chave, com `version`/`migrate` para dados existentes).
- Pix: gerar o **BR Code (EMV) estático** com valor em `src/lib/pix.ts` (payload + CRC16-CCITT), renderizado com `qrcode` (canvas/data URL) em `src/components/PixQr.tsx`.
- PDF: `jspdf` + `jspdf-autotable`, gerado no cliente em `src/lib/salesPdf.ts`.
- Novas rotas: `src/routes/vendas.tsx` (layout `<Outlet />` não necessário — rotas irmãs), `src/routes/vendas.index.tsx` não usado; usar `src/routes/vendas.tsx` (lista/resumos) e `src/routes/vendas.configuracoes.tsx` (Pix e loja), cada uma com `head()` próprio.
- Pagamento no Caixa via `Dialog`/`Sheet` do shadcn; `BottomNav` no `__root.tsx` ganha o terceiro item (ícone `Receipt`).
- Agrupamento por período com utilitários de data em `src/lib/periods.ts` (sem dependência extra).
