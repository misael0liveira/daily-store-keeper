# DevMasterIA — Lessons Learned

## 2026-09-19 — UI precisa estar ligada ao comportamento real
O dashboard já teve controles visuais que não executavam nenhuma ação. O problema não era aparência: era integração entre UI, rotas, scanner e store.

### Regra adicionada
Todo controle funcional precisa ter uma ação verificável. Uma tela que apenas parece um PDV não é suficiente.

## 2026-09-19 — Scanner
O leitor de código de barras é uma funcionalidade crítica. O fluxo Android nativo e o fallback manual devem ser preservados.

## 2026-09-19 — Atualização do APK
O mecanismo de atualização interna depende do APK publicado como `Mini-Market-PDV.apk` e da versão do aplicativo. Mudanças de release devem preservar essa compatibilidade.
