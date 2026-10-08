# Tasks: Fiados e clientes

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/ui.md

## Phase 1 — Setup

- [x] T001 Especificar escopo e validar critérios em specs/001-fiados-clientes/spec.md.
- [x] T002 Resolver plano e domínio em specs/001-fiados-clientes/plan.md.

## Phase 2 — Foundation

- [x] T003 Escrever regressões monetárias/migração em tests/fiados.test.mjs.
- [x] T004 Ampliar cliente, normalização e validação de crédito em src/store/useStore.ts.
- [x] T005 Preservar campos/relações no backup em src/lib/managementBackup.ts.

## Phase 3 — US1

- [x] T006 [US1] Cadastro/código/CPF/limite opcional >=0/dia inteiro 1–31 em src/components/CustomersPanel.tsx.
- [x] T007 [US1] Busca/extrato/cartão QR e recebimento em src/components/CustomersPanel.tsx.
- [x] T008 [US1] Fiados inicial/resumo acessível em src/routes/index.tsx e src/routes/resumo.tsx.

## Phase 4 — US2

- [x] T009 [US2] Picker por busca/QR com confirmação e câmera única em src/components/CustomerPicker.tsx.
- [x] T010 [US2] Contexto da cobrança e entrada sem sucesso de venda em src/components/PaymentSheet.tsx.
- [x] T011 [US2] Entrada/fiado com resumo e confirmação explícita em src/routes/vender.tsx.

## Phase 5 — US3

- [x] T012 [US3] Recebimento agrupado atômico/idempotente em src/store/useStore.ts.
- [x] T013 [US3] Quatro meios e valor parcial/integral em src/components/CustomerDebtPayment.tsx.
- [x] T014 [US3] Comprovante e recibo em src/lib/customerDocuments.ts.

## Phase 6 — Verification

- [x] T015 Executar plano replica em replica/fiados-test-plan.md e e2e/fiados.spec.cjs.
- [x] T016 Atualizar contratos/resultados em DESIGN.md, UX-CONTRACT.md e replica/bugs.md.
- [x] T017 Reconciliar Spec Kit em specs/001-fiados-clientes/verification.md e gerar APK teste pelo workflow.

## Dependencies and parallel opportunities

Foundation → US1 → US2/US3 → verificação. Backup/testes são arquivos independentes após domínio.
US1 valida cadastro sem vendas; US2 valida compra100/entrada50; US3 valida receber50 sem nova venda.
Entrega incremental completa os três fluxos antes do APK; nenhuma tarefa fora do escopo aprovado.

## Phase 7: Convergence

- [x] T018 Conter a confirmação de fiado no Sheet canônico, cobrindo controles de fundo e bloqueando fechamento durante os dois segundos, per US2 (partial).
- [x] T019 Ajustar os alvos das ações de cliente para pelo menos44px, preservando geometria e scroll, per plan: touch targets (partial).
- [x] T020 Verificar o workflow Android, assinatura e release publicado e registrar a evidência em verification.md, per FR009/T017 (partial).
