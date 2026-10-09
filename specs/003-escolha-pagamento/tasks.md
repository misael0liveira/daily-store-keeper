# Tasks: Escolha de pagamento

## Phase 1: Setup

- [x] T001 Registrar especificação/plano/modelo/contrato/checklist em specs/003-escolha-pagamento.

## Phase 2: Foundation

- [x] T002 Atualizar cláusula de posição de Dividir em .specify/memory/constitution.md e contratos DESIGN.md/UX-CONTRACT.md.

## Phase 3: US1

- [x] T003 [US1] Criar reprodução e cobertura de escolha/cancelar em e2e/payment-choice.spec.cjs.
- [x] T004 [US1] Renomear botão em src/routes/vender.tsx e criar escolha no src/components/PaymentSheet.tsx.

## Phase 4: US2

- [x] T005 [US2] Validar primeira parte, cobrar saldo e retomar em src/components/PaymentSheet.tsx e src/routes/vender.tsx.
- [x] T006 [US2] Adaptar fluxos existentes em tests/ e e2e/ e validar dados, troco, Fiados, notificações e geometria.

## Phase 5: Verify and delivery

- [x] T007 Executar checks, atualizar replica/test-plan.md/bugs.md e specs/003-escolha-pagamento/verification.md.
- [x] T008 Reconciliar requisitos/tarefas e publicar APK teste assinado com .github/workflows/build-layout-test.yml.

## Dependencies

T001→T002→T003→T004→T005→T006→T007→T008. Mesmo componente: execução sequencial.

## Implementation strategy

Proprietário único PaymentSheet, sem mudanças em domínio. Dois meios reutiliza parcelas existentes.
