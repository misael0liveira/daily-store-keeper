# Instalação real do PWA ("Instalar app" no celular)

Hoje o app tem manifesto e ícones, então o navegador só oferece "Adicionar à tela inicial" como atalho. Para o Chrome do Android (e o Edge) mostrarem **"Instalar app"** — com ícone na gaveta de apps, abrindo em janela própria e funcionando sem internet — falta um service worker. O manifesto e os ícones já estão corretos (192 e 512 px, `display: standalone`), então não precisam mudar.

## Mudanças

1. **Service worker gerado automaticamente** com `vite-plugin-pwa`: o app inteiro (telas, fontes, ícones) fica salvo no celular e abre mesmo sem internet. As páginas sempre tentam a rede primeiro e só usam o cache quando offline, para nunca mostrar versão velha.
2. **Registro seguro**: o service worker só ativa no app publicado — nunca na prévia do editor — e aceita o desligamento com `?sw=off` se um dia precisarmos limpar o cache.
3. **Ícone "maskable"**: versão do ícone com área de segurança para o Android cortar em círculo/quadrado sem deformar, deixando o ícone igual aos apps nativos.
4. **Atualização automática**: quando você publicar uma novidade, o app instalado se atualiza sozinho na próxima abertura.

Depois de publicado: no Chrome do Android vai aparecer **"Instalar app"** (em vez de só o atalho); no iPhone o caminho continua sendo Safari → Compartilhar → "Adicionar à Tela de Início" (o iOS não tem botão "Instalar", mas o app abre em tela cheia igual).

## Detalhes técnicos

- `bun add -D vite-plugin-pwa`; em `vite.config.ts`: `VitePWA({ registerType: "autoUpdate", injectRegister: null, devOptions: { enabled: false }, manifest: <conteúdo do manifest.webmanifest>, workbox: { navigateFallback com NetworkFirst, CacheFirst só para assets hasheados, exclusão de /~oauth } })`.
- `src/lib/pwa-register.ts`: wrapper único de registro que recusa dev, iframe, hosts `id-preview--*`/`preview--*`/`*.lovableproject.com`/`*.beta.lovable.dev` e `?sw=off`, desregistrando SWs antigos nesses contextos; importado uma vez no `src/routes/__root.tsx` (lado cliente).
- `manifest.webmanifest` ganha entradas `purpose: "maskable"`; gero `public/icons/icon-maskable-512.png` com o ícone centrado sobre fundo azul #3b82f6.
- Verificação: build, conferência de `dist/sw.js` gerado, e Playwright na prévia confirmando que **não** registra service worker (contexto de prévia) e que o app continua funcionando.
- Atenção: quem já instalou o atalho antigo deve remover e instalar de novo para pegar o modo "app instalado".
