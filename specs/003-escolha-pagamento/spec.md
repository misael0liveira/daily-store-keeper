# Feature Specification: Escolha de pagamento
Created: 2026-10-09. Status: Ready. Branch: feat/fotos-promocoes-curva-suave.
Pedido: botão Pagamento abre escolha entre um ou dois meios; remover Dividir da cobrança.

## User Scenarios & Testing
### US1 — Receber pelo total (P1)
Caixa → Pagamento → Um meio de pagamento → cobrar total pelos quatro meios existentes.
AC1: cancelar escolha não registra venda/estoque/recebimento; foco retorna ao botão.
AC2: uma confirmação registra uma venda, preserva troco e sucesso de dois segundos.
### US2 — Receber em dois meios (P1)
Escolher Dois meios de pagamento, informar primeira parte, conferir restante, receber primeira e segunda.
AC1: valor vazio/zero/negativo/total/excesso ou fração de centavo não permite continuar.
AC2: primeira parte confirmada persiste, segunda usa saldo exato e meio diferente; venda só conclui ao quitar.
AC3: fechar/recarregar após recebimento mantém parcela e retoma saldo, sem duplicar venda/estoque.
### Edge Cases
Total inferior a dois centavos não pode ser dividido. Caixa fechado/carrinho vazio mantêm bloqueio.
Fiado/recebimento de dívida conservam regras e acesso aos dois meios. Sem rede, tema claro/escuro,
320px, teclado, Escape, notificações atrasadas e erro de armazenamento seguem contratos existentes.

## Requirements
FR-001: botão principal deve chamar Pagamento.
FR-002: antes de cobrar, mostrar Um meio de pagamento / Dois meios de pagamento e saldo.
FR-003: dois meios deve pedir valor da primeira parte, maior que zero, menor que saldo, até dois decimais.
FR-004: retirar Dividir do cabeçalho e editor sobreposto da cobrança.
FR-005: confirmar primeira parte deve cobrar saldo no segundo meio e impedir repetir o primeiro.
FR-006: retomada deve preservar parcelas confirmadas, cotação, estoque e histórico.
FR-007: preservar quatro meios, scanner, offline, notificações, fiado e assinatura Android.
FR-008: escolha deve respeitar foco, Escape, alvos44px, temas e viewport320px.

## Key Entities
Cotação e parcelas existentes; escolha transitória entre total e duas partes. Sem nova entidade persistida.
## Success Criteria
SC-001: cada cenário US1/US2 fecha exatamente uma venda com soma correta.
SC-002: nenhuma parcela confirmada é perdida ao reabrir/recarregar.
SC-003: escolha e quatro meios operáveis em320/360/430px nos dois temas, sem sobreposição.
## Assumptions
A alteração anterior de Marcar na Conta foi proposta, não aplicada: conservar rótulo e fluxo de fiado.
A escolha também atende entrada/recebimento de fiado pelo proprietário compartilhado de pagamentos.
