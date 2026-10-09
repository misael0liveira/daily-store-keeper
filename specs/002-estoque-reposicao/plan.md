# Implementation Plan: Reposição local

**Branch**: `feat/estoque-reposicao` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

## Summary

Opção A adaptada ao storage real: função pura uma passagem com índices por ID/código, hook memoizado e atualização temporal/retomada. Sem SQLite, servidor, colunas derivadas ou nova dependência. Settings aditivos com migração9 e backup compatível. Texto/PDF local em Sheet existente. Fix CSS no proprietário customer-sheet.

## Technical Context

**Language/Version**: TypeScript5.8/React19.
**Primary Dependencies**: Zustand persist, Radix Sheet, Sonner, jsPDF/autotable existentes.
**Storage**: localStorage pdv-mercado versão8→9; fotos IndexedDB intactas.
**Testing**: Node assert, Playwright+axe, tsc/lint/build; GitHub Actions Android testDebugUnitTest/assembleRelease/apksigner.
**Target Platform**: Capacitor8 Android e navegador.
**Performance Goals**: O(produtos+vendas+itens+componentes);10mil vendas/2mil produtos<200ms medidos.
**Constraints**: Offline; mesma assinatura/permissões; no tratamento do checkout.
**Scale/Scope**: Estoque, reposição Resumo/Gestão e folha de cliente.

## Constitution Check

Offline/dados: passa, migração aditiva e backup. Continuidade: passa, scanner/pagamento/Android não mudam. UI: passa, tokens/Sheet/Button/LocalForm canônicos. Escopo: passa, requisitos registrados. Evidência: testes e build exigidos. Pós-design: mesmos gates, sem desvios.

## Project Structure

- src/lib/stockReplenishment.ts: agregado puro e formatação de quantidades.
- src/hooks/useReplenishment.ts: cálculo memoizado com relógio/retomada.
- src/store/useStore.ts + src/lib/managementBackup.ts: dias, defaults, migração e validação.
- src/routes/estoque.tsx + src/components/ReplenishmentSettings.tsx + src/components/ReplenishmentExport.tsx: filtro/cards, controles e exportação.
- src/lib/replenishmentDocuments.ts: texto/PDF.
- src/routes/resumo.tsx + src/routes/gestao.tsx: consumidores do mesmo resultado.
- src/components/ProductManagementFields.tsx: orientar sobre configuração global em vez de limite estático.
- src/styles.css: botão de fechar cliente44px circular centralizado.
- src/components/ui/sheet.tsx: restaurar foco ao controle de origem para folhas montadas por estado; respeitar callbacks existentes.
- src/components/ManagementUI.tsx: Field aceita flag de invalidez sem duplicar formulário.
- tests/replenishment.test.mjs, e2e/replenishment.spec.cjs, tests/replenishment-browser.cjs e replica/: evidência.

## Complexity Tracking

Nenhuma violação. Não adicionar cache persistido, jobs ou plugin de compartilhamento.
