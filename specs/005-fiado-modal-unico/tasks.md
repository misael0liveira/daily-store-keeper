# Tasks: Fiado em um único modal
## Phase 1: Setup
- [x] T001 Inspecionar regras/chamadores e registrar spec/plan/research/data-model/contracts/quickstart em specs/005-fiado-modal-unico/.
## Phase 2: US1 — Total e cancelamento
- [x] T002 [US1] Unir escolha/resumo com RadioGroup e eliminar saídas duplicadas em src/routes/vender.tsx (FR-001/003/004/005).
- [x] T003 [US1] Verificar seleção sem registro, cancelamento/foco, teclado, data e confirmação única em e2e/fiados.spec.cjs.
## Phase 3: US2 — Entrada e retomada
- [x] T004 [US2] Preservar saldo/parcelas e ignorar entrada no modo total em src/routes/vender.tsx; verificar alternância/retomada em e2e/fiados.spec.cjs (FR-002/006).
## Phase 4: Verification and Delivery
- [ ] T005 Atualizar DESIGN.md, UX-CONTRACT.md, replica/ e descrição .github/workflows/build-layout-test.yml; executar checks, navegador e CI Android.
- [ ] T006 Reconciliar requisitos/evidências em specs/005-fiado-modal-unico/verification.md e entregar APK teste assinado.

Dependências: T001 → T002 → T003/T004 → T005 → T006. Sem delegação necessária; arquivos compartilhados exigem execução sequencial. MVP é US1; entrega inclui US2 para preservar fluxo completo.
