# Edge no Android instala como atalho, não como app

Conferi o app publicado: o instalador em segundo plano, o manifesto e os três ícones estão todos no ar e corretos. Então o motivo mais provável do Edge criar só um atalho é o Android ainda estar reaproveitando o registro antigo do site (de antes de o instalador existir), somado a um detalhe do manifesto que ajuda o Android a reconhecer que é o "mesmo app".

## O que fazer

1. **Dar uma identidade fixa ao app no manifesto** (campo de identificação próprio, mais o campo de compatibilidade com Android). Sem isso, o Android pode tratar a instalação como um site qualquer e cair no modo atalho.
2. **Garantir que o instalador realmente liga no site publicado** — vou abrir o endereço publicado num navegador de teste e confirmar que o serviço em segundo plano fica ativo e que o navegador considera o app "instalável". Se não estiver ativando, corrijo a causa.
3. **Adicionar as capturas de tela do app no manifesto** (uma da tela do Caixa e uma do Estoque). O Chrome e o Edge no Android usam isso para mostrar a janela rica de instalação, que é justamente a que instala como app de verdade em vez de atalho.
4. **Publicar de novo** ao final.

## Do seu lado, depois de publicar

- Remova o ícone atual da tela inicial.
- No Edge, abra o menu e use **Limpar dados do site** para `daily-store-keeper.lovable.app` (ou aguarde alguns minutos).
- Abra o endereço de novo, espere 3–5 segundos na tela e então use **Adicionar ao telefone / Instalar**.

Se ainda assim o Edge insistir no atalho, o Chrome do Android é o caminho mais confiável — ele mostra "Instalar app". Isso é uma limitação do próprio Edge, não do app.

## Detalhes técnicos

- `vite.config.ts` → bloco `manifest` do `VitePWA`: adicionar `id: "/"`, `prefer_related_applications: false`, e `screenshots` com `form_factor: "narrow"` (PNG em `public/screenshots/`, referenciadas com `sizes` e `type`).
- Gerar as duas capturas de tela via Playwright na prévia local (390x844) ou por geração de imagem, salvando em `public/screenshots/`.
- Verificação: build, conferir `dist/client/manifest.webmanifest` com os novos campos e `dist/client/sw.js` presente; Playwright na URL publicada checando `navigator.serviceWorker.getRegistrations()` e ausência de erros no console.
