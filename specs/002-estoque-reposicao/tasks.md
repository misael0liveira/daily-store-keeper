# Tasks: Reposição local

## Phase 1: Setup

- [x] T001 Inspecionar storage e consumidores em src/store/useStore.ts e src/routes/estoque.tsx; registrar specs/002-estoque-reposicao/spec.md.

## Phase 2: Foundation

- [x] T002 Adicionar settings DC inteiro1–365/MS inteiro0–365 padrão7/2, migração9 e backup em src/store/useStore.ts e src/lib/managementBackup.ts.

## Phase 3: US1 Estoque dinâmico

- [x] T003 [US1] Escrever testes de fórmula, fronteiras, legado, combo, devolução, migração e desempenho em tests/replenishment.test.mjs.
- [x] T004 [US1] Implementar agregado puro em src/lib/stockReplenishment.ts e hook memoizado em src/hooks/useReplenishment.ts.
- [x] T005 [US1] Integrar filtro/card/configuração em src/routes/estoque.tsx e src/components/ReplenishmentSettings.tsx.
- [x] T006 [US1] Reutilizar cálculo em src/routes/resumo.tsx e src/routes/gestao.tsx; ajustar orientação em src/components/ProductManagementFields.tsx.

## Phase 4: US2 Exportar

- [x] T007 [US2] Implementar texto/PDF de resultados visíveis em src/lib/replenishmentDocuments.ts e src/components/ReplenishmentExport.tsx.

## Phase 5: US3 Fechar cliente

- [x] T008 [US3] Reproduzir geometria e corrigir X no proprietário customer-sheet em src/styles.css.

## Phase 6: Verification and delivery

- [x] T009 Verificar fluxos/offline/a11y/tema/geometria/exportação/backup em e2e/replenishment.spec.cjs e tests/replenishment-browser.cjs, usando replica-test.
- [x] T010 Atualizar DESIGN.md, UX-CONTRACT.md, MANAGEMENT-POLICY.md e replica/test-plan.md/bugs.md; executar lint/tsc/tests/build/auditoria e regressões.
- [x] T011 Reconciliar specs/002-estoque-reposicao com evidências; versionar e publicar APK teste assinado pela .github/workflows/build-layout-test.yml.

## Dependencies & execution order

T001→T002→T003→T004→T005→T006; T007 depende de T004/T005; T008 é independente da regra comercial; T009/T010 após implementação, T011 após checks. Exemplos de paralelismo: pesquisa de T008 e testes T003 não compartilham arquivos. Implementar incrementalmente US1→US2→US3; entregar o escopo completo.
