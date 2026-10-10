# Feature Specification: Fiado em um único modal

**Feature Branch**: `fix/fiado-modal-unico`
**Created**: 2026-10-10
**Status**: Approved
**Input**: Análise das telas 101507/101509 e aprovação do proprietário: unir escolha e resumo, remover retornos duplicados e preservar confirmação explícita.

## User Scenarios & Testing

### User Story 1 — Marcar o saldo na conta (Priority: P1)
O lojista vê total, escolha e resumo juntos e confirma uma única vez.
**Why this priority**: remove uma etapa sem lançar dívida por engano.
**Independent Test**: abrir Marcar na Conta, conferir resumo, alternar opções e confirmar total.
**Acceptance Scenarios**:
1. Ao abrir sem entrada recebida, valor total está selecionado e resumo aparece imediatamente, sem nova tela.
2. Alternar opções não registra venda, estoque, dívida ou pagamento; confirmar fiado registra uma única venda.
3. X ou Escape retorna ao carrinho sem registro e sem perder parcelas recebidas; não existem Voltar à escolha ou Voltar ao carrinho no modal.

### User Story 2 — Receber entrada (Priority: P1)
O lojista seleciona receber uma parte, informa o valor no mesmo modal e segue aos meios existentes.
**Why this priority**: conserva recebimento parcial e resumo honesto.
**Independent Test**: receber entrada, fechar/reabrir, conferir saldo e confirmar fiado.
**Acceptance Scenarios**:
1. Entrada válida atualiza saldo previsto e Receber entrada cobra somente esse valor pelos quatro meios existentes.
2. Depois do recebimento, o modal mostra valor já recebido e saldo a marcar; reabrir conserva parcelas.
3. Entrada vazia, não positiva, excessiva, mais de dois decimais ou saldo acima do limite não inicia cobrança.

### Edge Cases
- Compra com parcelas recebidas: opção total chama-se Marcar saldo restante, sem sugerir cobrança novamente.
- Compra totalmente paga: confirma venda paga, sem criar dívida.
- Alternar parcial para total ignora rascunho de entrada; vencimento por compra permanece e não altera cadastro.
- Offline, temas claro/escuro, teclado, 320–430px, nomes longos e duplo clique conservam operação e dados.

## Requirements
### Functional Requirements
- **FR-001**: Escolha e resumo DEVEM ocupar um modal, com total selecionado inicialmente e confirmação explícita.
- **FR-002**: Receber uma parte agora DEVE revelar campo e atualizar saldo previsto; alternar opções não persiste nada.
- **FR-003**: Modal DEVE ter só X como saída visível; Escape também fecha e devolve foco ao acionador.
- **FR-004**: Total, recebido quando positivo, saldo a marcar, saldo anterior, novo saldo e vencimento DEVEM refletir a compra; pago zero não aparece.
- **FR-005**: Vencimento cadastral DEVE ser automático; alteração por compra é discreta/opcional e preserva cadastro.
- **FR-006**: Pagamentos, limites, confirmação única, retomada, estoque, dados offline e pagamento normal DEVEM conservar regras existentes.
### Key Entities
- Compra atual: total, cotação, cliente e parcelas recebidas.
- Fiado: saldo previsto e vencimento; só nasce na confirmação final.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Fiado integral conclui com abrir modal e confirmar, sem passagem por outra tela de resumo.
- **SC-002**: Zero botões de retorno duplicados e zero registros antes da confirmação/recebimento explícito.
- **SC-003**: Todos os cenários afetados passam em navegador, incluindo cancelamento, alternância e retomada; APK compila e assinatura é verificada.

## Assumptions
- Total selecionado inicialmente é apenas proposta; Confirmar fiado executa registro.
- Receber entrada conserva retorno ao resumo e confirmação final existentes.
- Não alterar banco, dependências, scanner, pagamento normal ou recebimento de dívida.
