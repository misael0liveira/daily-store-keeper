# Plan

React/TS/Zustand/Capacitor existentes. Estender folha de fiado em vender.tsx com escolha total/parcial, resumo e disclosure de data.
PaymentSheet recebe chooseBeforePayment (default true); entrada inicia cobrança, opção secundária abre editor de primeira parte existente.
Proprietários: Sheet/Button/Field/PaymentSheet/useStore/suggestedDueDate. Não duplicar cobrança, persistência ou data.
Teste: adaptar e2e/fiados e acrescentar aceites no mesmo runner. Regressões normais via payment-choice/payments e CI existente.
Constituição III: escolher um/dois antes de cobrança é regra do Pagamento normal; entrada tem valor já informado e exceção explicitamente aprovada.
Sem alteração nativa/schema/dependência. Mesma chave APK. Conferência física distinta da automação.

Correção da verificação legada: e2e/replenishment.spec.cjs deve esperar a restituição assíncrona real do foco ao Selecionar cliente (2s), mantendo a assertion. Falha reproduzida no CI após todos os 61 casos Fiados passarem.

Workflow inclui e2e/** no filtro de push, para que correções dos cenários de navegador executem a verificação e geração do APK.
