# Marcar na Conta sem redundâncias

Pedido aprovado em 09/10/2026: simplificar compra fiada, usar vencimento cadastrado e revisar UX antes de implementar.

## User stories

US1: Marcar na Conta → Valor total → resumo com data automática → registrar uma venda/dívida.
US2: Marcar na Conta → Receber uma parte → valor → forma de pagamento → recebimento → resumo → registrar saldo.
US3: vencimento somente informativo no resumo; Alterar vencimento desta compra é opcional e não altera cadastro.

## Requirements

FR-001 Renomear ação para Marcar na Conta e oferecer total/parcial na mesma folha existente.
FR-002 Usar suggestedDueDate(customer.dueDay), preservando fallback existente para clientes sem dia.
FR-003 Entrada segue diretamente aos quatro meios; dois meios continua disponível como ação secundária opcional.
FR-004 Resumo mostra Saldo previsto após confirmar; venda/estoque/dívida só após confirmação.
FR-005 Validar entrada >0 e <saldo, em centavos, caixa, autorização e limite antes de receber.
FR-006 Preservar dados/offline, pagamentos normais, recebimento de dívidas, scanner e assinatura.

## Acceptance

AC1 Cancelar escolha/resumo não grava venda, recebimento nem dívida.
AC2 Fiado integral e parcial usam data cadastral sem campo obrigatório; alteração excepcional não muda dueDay.
AC3 Entrada não exibe escolha obrigatória um/dois meios; parcelas não duplicam venda/estoque.
AC4 Limite/valor inválido bloqueiam antes de cobrar; claro/escuro/320px/foco permanecem operáveis.

## Success criteria

SC-001 Uma confirmação salva uma venda, estoque e saldo exatos; recebimentos persistem.
SC-002 Nenhum vencimento é solicitado novamente no caminho comum, nem pop-up redundante na entrada.
SC-003 Código reutiliza PaymentSheet e folhas/componentes existentes, sem dependências/migração.
