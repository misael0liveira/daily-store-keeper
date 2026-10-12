# Tasks: UX/UI Figma

## Setup

- [x] T001 Inspecionar regras, proprietários e referência em specs/006-figma-ux-ui/.
- [x] T002 Atualizar contratos em DESIGN.md e UX-CONTRACT.md.

## US1 — Caixa e navegação

- [x] T003 [US1] Aplicar PageHeader/BottomNavigation e geometria em src/styles.css.
- [x] T004 [US1] Integrar cliente, busca, scanner compacto e lista em src/routes/vender.tsx.
- [x] T005 [US1] Verificar navegação/scanner em tests/navigation-browser.cjs e tests/scanner-browser.cjs.

## US2 — Cobrança e fiado

- [x] T006 [US2] Reorganizar PaymentSheet.tsx e resumo do fiado em vender.tsx.
- [x] T007 [US2] Verificar dinheiro/Pix/cartão/parcelas, fiado e foco com suites existentes.

## US3 — Gestão comercial

- [x] T008 [US3] Aplicar cartões e hierarquia em estoque, CustomersPanel, histórico e ajustes.
- [x] T009 [US3] Verificar filtros/CRUD/exportações/gestão/claro/escuro e acessibilidade.

## Final

- [x] T010 Verificar build, auditoria premium, screenshots e documentar replica/.
- [ ] T011 Publicar código e acompanhar workflow build-layout-test.yml até APK assinado.
- [ ] T012 Reconciliar tarefas e evidências em specs/006-figma-ux-ui/verification.md.

## Dependencies

T001 → T002 → T003/T004/T006/T008 → T005/T007/T009 → T010 → T011 → T012. Sem delegação necessária; mesmo proprietário de CSS exige edições sequenciais.
