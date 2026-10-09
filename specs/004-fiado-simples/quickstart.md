# Verify

npx tsc --noEmit; ESLint arquivos alterados; node --test tests/*.test.mjs; npm run build.
Navegador: tests/fiados-browser.cjs e tests/payment-choice-browser.cjs, Playwright/axe com preview local.
Auditoria premium strict, formatter/diff-check. Pipeline existente testa regressões, Android e assinatura.
