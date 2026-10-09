# Implementation Plan: Escolha de pagamento
## Summary
Estender PaymentSheet com etapa inicial de escolha, reutilizando Sheet/Button/Input/Label e tokens.
## Technical Context
React/TS, Zustand local, TanStack, Capacitor8. Português brasileiro, Android e prévia web.
Sem dependência, migração, alteração nativa ou rede. Testes Node, Playwright/axe e pipeline Android existente.
## Constitution Check
I dados/offline: nenhuma mudança no store. II assinatura/scanner: preservar.
III: instrução explícita do proprietário substitui posição do Dividir; atualizar cláusula e contratos.
IV Spec Kit/Ponytail: mudança limitada ao proprietário compartilhado e chamadores.
V: verificar cancelamento, recebimentos, retomada, temas/geometria e APK assinado.
## Phase 0: Research
PaymentSheet já controla parcelas e valores; useStore persiste pendingPayments/pendingQuote.
CustomerDebtPayment recebe saldo no mesmo proprietário. Reutilizar, sem novo motor de pagamentos.
## Phase 1: Design
Etapas choice → firstAmount → payment → remainingPayment → success.
Prop previousMethod permite retomada e bloqueio de meio já recebido. On partial mantém saldo vindo do chamador.
Remover toggle/editor CSS antigos. Aplicar foco ao trocar etapa. Escolha usa customer-sheet, cobrança mantém geometria.
Arquivos: src/components/PaymentSheet.tsx, src/routes/vender.tsx, src/styles.css, tests/e2e existentes,
e2e/payment-choice.spec.cjs, tests/payment-choice-browser.cjs, workflow, contratos e replica.
## Verification
Regressões de pagamentos/Pix/Fiados/Gestão e dimensões, mais escolha/validação/retomada/keyboard/offline.
Build web, tsc, ESLint, Node, auditoria premium strict; pipeline Android com mesma chave de teste.
