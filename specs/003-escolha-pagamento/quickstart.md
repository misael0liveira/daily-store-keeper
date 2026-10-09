# Validation
npm install; npx tsc --noEmit; node --test tests/*.test.mjs; npm run build.
Servir dist/client com tests/serve-preview.py; usar PLAYWRIGHT_MODULE e AXE_MODULE com tests/payment-choice-browser.cjs.
Verificar pagamento simples, dois meios, inválidos, cancelar, refresh após primeira parcela e Fiados.
Publicação: workflow build-layout-test.yml após push, conferir release e assinatura; aparelho pendente.
