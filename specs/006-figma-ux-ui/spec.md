# Feature Specification: UX/UI aprovada no Figma

**Feature Branch**: `feat/figma-apk54`
**Created**: 2026-10-12
**Status**: Approved
**Input**: Aplicar e testar a proposta de 25 telas. O proprietário autorizou usar as capturas e especificações existentes após o limite Starter bloquear get_design_context.

## User Scenarios & Testing

### User Story 1 — Operar Caixa e navegar (P1)

O lojista identifica os cinco destinos, busca produtos e usa a câmera compacta sem perder ações.
**Independent Test**: Navegar cinco rotas em 320–430px, adicionar/alterar produtos, abrir/fechar scanner e pagamento.
**Acceptance**: rótulos sempre visíveis; quantidades com alvo44px; scanner só liga quando aberto; dados reais e botão de pagamento acima da navegação.

### User Story 2 — Receber e marcar na conta (P1)

Preservar um/dois meios, troco, Pix real, monitor, limite, parcelas e vencimento cadastrado com nova composição.
**Independent Test**: Dinheiro, Pix, cartões, fiado total/entrada, cancelamento e retomada offline.
**Acceptance**: folha com cabeçalho/fechar separados; parcelas não somem; entrada segue direto aos meios; confirmação única e dívida correta.

### User Story 3 — Consultar gestão comercial (P2)

Estoque, Fiados, extrato, Histórico e Ajustes compartilham hierarquia, cartões e estados.
**Independent Test**: filtros, cadastro/edição, reposição/exportação, clientes/recebimento, relatórios e tema.

## Requirements

- FR-001: aplicar navegação plana, cabeçalhos e cartões da referência, sem valores demonstrativos em produção.
- FR-002: scanner embutido vigente, busca e permissões preservados; abertura compacta explícita no Caixa.
- FR-003: PaymentSheet continua proprietário dos quatro meios, escolhas, teclado, troco, QR e confirmação.
- FR-004: fiado usa cadastro, resumo junto das opções e saldo previsto; fechar preserva recebimentos.
- FR-005: listas, filtros, fotos reais, ações administrativas e relatórios continuam funcionais.
- FR-006: claro/escuro, safe areas, teclado, foco, nomes longos, estados vazios/erro e movimento reduzido permanecem legíveis.
- FR-007: mesma aplicação e chave de teste, sem schema/migração ou mudança de domínio.

## Success Criteria

- SC-001: cinco rótulos visíveis, sem overflow horizontal em 320,360,390,430px.
- SC-002: nenhum S1/S2 nos fluxos cobertos; regressões de pagamentos, fiados e reposição passam.
- SC-003: TypeScript, lint aplicável, build web/Android e assinatura verificados antes de entregar.

## Edge Cases

Carrinho vazio, câmera negada, Pix sem chave, entrada inválida, limite ultrapassado, parcelas após reload, valor monetário longo, campos com teclado, venda cancelada, aparelho curto.

## Key Entities

Produtos, clientes, vendas, cotação e parcelas existentes. Nenhuma entidade nova.

## Assumptions

Referência: https://www.figma.com/design/GHzHMsVXHvcj9U0JEvWPg2. Capturas aprovadas substituem nova extração por autorização explícita. A marca de produção e as fotografias reais prevalecem sobre ícones e valores demonstrativos do protótipo. Câmera física e notificações reais exigem aparelho.
