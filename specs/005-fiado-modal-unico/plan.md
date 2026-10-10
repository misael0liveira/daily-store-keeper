# Implementation Plan: Fiado em um único modal
**Branch**: `fix/fiado-modal-unico` | **Date**: 2026-10-10 | **Spec**: [spec.md](spec.md)

## Summary
Unir escolha e resumo em vender.tsx. Dois estados total/parcial, reutilizando Sheet, RadioGroup/Label, Field, Button, tokens e checkout existentes. Não criar outro modal ou persistir estado de escolha.

## Technical Context
TypeScript/React 19, Radix, Zustand, Capacitor 8; armazenamento local existente; Android e navegador. Testes Node/Playwright/axe, tsc, ESLint e build web/Android. Escopo: modal de fiado e testes/contratos associados; sem dependência ou migração.

## Constitution Check
I: sem alteração de storage/dados. II: scanner/nativo/assinatura preservados. III: componentes e confirmação explícita, entrada segue direto aos meios. IV: menor mudança no fluxo aprovado. V: replica-test/checks/build e evidência física separada. Gates aprovados antes/depois do desenho.

## Project Structure
- src/routes/vender.tsx: remover estado nulo e ramificação de etapa; RadioGroup seleciona sem executar; resumo único; rascunho parcial só conta no modo parcial; X canônico.
- e2e/fiados.spec.cjs e tests/fiados-browser.cjs: adaptar seletores; verificar ausência de gravação, alternância, teclado, foco, cancelamento/retomada, limite e duplo clique.
- DESIGN.md e UX-CONTRACT.md: atualizar consequência de UI; política comercial permanece.
- replica/: plano, bugs reproduzidos e evidências.
- specs/005-fiado-modal-unico/: documentos proporcionais.
- .github/workflows/build-layout-test.yml: descrição da entrega; processo de assinatura existente.

## Risks and Verification
A opção total precisa ignorar entrada digitada antes de alternar. Parcela já recebida não pode sumir nem entrar em nova cobrança. Seleção não dispara checkout. Inspecionar em 320px e teclado; executar suíte Fiados e escolha de pagamento, checks estáticos e CI Android.
