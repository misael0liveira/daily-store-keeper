# Implementation Plan: Fiados e clientes

**Branch**: feat/fiados-clientes | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

## Summary

Ampliar Customer/Receivable e seus commits locais; reusar PaymentSheet com contexto e retorno
recebido sem concluir venda; Fiados como rota inicial, resumo separado; CustomerPicker compartilhado.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19. **Dependencies**: Zustand, TanStack Router,
Radix, qrcode, jsPDF, html5-qrcode/Capacitor existentes. **Storage**: localStorage/IndexedDB.
**Testing**: Node unit, Playwright/axe, build web e workflow Android.
**Platform**: Android/WebView e navegador. **Project Type**: mobile PDV offline.
**Constraints**: manter identidade, scanner/câmera atual, assinatura, sem novas APIs/segredos.
**Performance Goals**: busca local paginada 20 registros, alvos 44px, coluna 320–430px.
**Scope**: cadastro/consulta, venda parcial e recebimento, sem sincronização ou emissão fiscal.

## Constitution Check

Cinco princípios satisfeitos antes/depois do desenho: offline, migração aditiva, scanner reusado,
interface canônica e verificação funcional. Nenhuma violação. Hooks inexistentes.

## Project Structure

Documentos em specs/001-fiados-clientes; domínio e helpers de crédito exportados em src/store/useStore.ts;
backup src/lib/managementBackup.ts; UI src/components/CustomersPanel.tsx, CustomerPicker.tsx,
PaymentSheet.tsx, CustomerDebtPayment.tsx; rotas index/vender/resumo/mais; testes tests/ e e2e/.

## Implementation strategy

Testar domínio primeiro, ampliar store/backup, criar UI compartilhada de cliente/recebimento,
integrar câmera e entrada com venda, revalidar regressões, gerar APK pelo workflow teste existente.

## Esclarecimento do scanner existente

O scanner vigente usa html5-qrcode embutido na área retangular aprovada. O plugin ML Kit continua instalado, sem mudanças nativas, mas não é chamado por esse componente. Preservar a câmera atual (pedido do usuário) exige reaproveitar esse componente nos dois modos, em vez de substituir sua apresentação por tela cheia. A constituição 1.0.1 esclarece esse caminho vigente, corrigindo a referência inicial a ML Kit sem alterar a obrigação de preservar o scanner.
