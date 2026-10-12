# Implementation Plan: UX/UI Figma

**Branch**: feat/figma-apk54 | **Date**: 2026-10-12 | **Spec**: spec.md

## Summary

Adaptar composição aprovada aos proprietários existentes, preservando o domínio. Layout flexível real em vez de reproduzir coordenadas de demonstração.

## Technical Context

React19, TS5, TanStack, Tailwind, Radix, Zustand, Capacitor8. Storage local existente. Node unit tests, Playwright/axe e GitHub Actions Android.

## Constitution Check

Dados/offline/schema: preservados. Scanner vigente: preservado, abertura explícita aprovada. Recebimentos e confirmação: preservados. Novo design autorizado substitui geometria CODEXURE, logo grande e composições antigas. Mesma assinatura/applicationId de teste; nenhum arquivo nativo de domínio alterado.

## Source Structure

src/components/BottomNavigation.tsx; PageHeader.tsx; PaymentSheet.tsx; CustomersPanel.tsx; rotas vender/estoque/vendas/mais; src/styles.css; DESIGN.md e UX-CONTRACT.md; tests/navigation-browser.cjs e testes Figma; workflow build-layout-test.yml.

## Phases

1. Especificação e referências.
2. Cabeçalho, navegação, componentes e telas.
3. Modais e cobrança; preservação dos chamadores.
4. Regressões/browser e comparação de capturas.
5. Build assinado pelo workflow existente, entrega e convergência.

## Risk

Testes de geometria antigos contêm expectativas da bolha/logo: substituir somente essas expectativas pela aprovação Figma e preservar checks comportamentais. Pequenas telas devem rolar conteúdo sem cortar confirmação.

Fix loop: o gate offline reproduziu CSS/rota ausentes no primeiro reload da PWA. warmAssetsCache em src/lib/pwa-register.ts complementa o aquecimento inicial existente; somente recursos estáticos locais. Dados e domínio não mudam.
