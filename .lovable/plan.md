# Mini Market POS como app Android (Capacitor)

Preparar o projeto para gerar um app Android instalável (APK/AAB), sem mexer em nada do que já funciona no site/PWA.

## O que muda para você

- O app continua igual na web: Caixa, Estoque, Vendas, Pix, PDF, tema claro/escuro e instalação pelo navegador seguem intactos.
- Passa a existir uma pasta do projeto Android que você abre no Android Studio para gerar o APK (teste) ou o AAB (Play Store).
- Nome do app: **Mini Market POS**. Identificador: **app.minimarket.pos**. Ícone e cor de tema iguais aos do app atual (loja azul, fundo claro).
- No Android, o leitor de código de barras passa a usar a câmera nativa do celular: leitura mais rápida e confiável que dentro do navegador, com pedido de permissão de câmera do próprio Android. Se a pessoa negar, continua funcionando a digitação do código ou nome, como hoje.
- Os dados continuam salvos no próprio aparelho.

## O que eu não consigo fazer aqui

Não é possível compilar o APK/AAB dentro do Lovable (isso exige Android Studio/SDK na sua máquina). Eu preparo tudo e escrevo o passo a passo; a geração do arquivo final você roda no Android Studio.

## Passo a passo da preparação

1. **Gerar as páginas estáticas do app**: ativar a pré-geração das telas (`/`, `/estoque`, `/vendas`, `/vendas/configuracoes`) para que o app abra sem servidor, direto do aparelho. O build web atual continua o mesmo.
2. **Adicionar o Capacitor** (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`) com `capacitor.config.ts` apontando para a pasta do build web, nome e identificador definidos.
3. **Criar a pasta `android/`** com o projeto nativo, permissão de câmera no manifesto, ícones e cor de tema.
4. **Scanner nativo no Android**: usar `@capacitor-mlkit/barcode-scanning` quando o app roda como app nativo, mantendo o leitor atual no navegador. Um único componente decide qual usar; permissão pedida na hora de abrir a câmera, com aviso claro se for negada.
5. **Scripts de apoio** no `package.json`: preparar o build e sincronizar com o Android.
6. **README-ANDROID.md**: instruções exatas de como abrir no Android Studio, gerar APK de teste, gerar AAB assinado para a Play Store, onde ficam as permissões e como atualizar o app depois de mudanças.
7. **Verificação**: rodar o build web completo e conferir que as telas continuam funcionando na prévia.

## Detalhes técnicos

- `tanstackStart.pages` (ou `prerender`) no `vite.config.ts` para emitir HTML estático das rotas em `dist/client`; `capacitor.config.ts` com `webDir: "dist/client"`, `appId: "app.minimarket.pos"`, `appName: "Mini Market POS"`, `android.allowMixedContent` e `backgroundColor` do tema.
- `src/lib/platform.ts` com `isNativeApp()` via `Capacitor.isNativePlatform()`; `BarcodeScanner.tsx` mantém o caminho `html5-qrcode` e ganha um caminho nativo (`BarcodeScanner.requestPermissions()` + `startScan`/`stopScan` do MLKit) atrás de import dinâmico, para não afetar o bundle web nem o SSR.
- `registerPWA()` não roda em plataforma nativa (o Capacitor já serve local); nada mais muda em `__root.tsx`.
- `android/app/src/main/AndroidManifest.xml`: `<uses-permission android:name="android.permission.CAMERA" />` e `<uses-feature android:name="android.hardware.camera" android:required="false" />`.
- Scripts: `"android:sync": "vite build && cap sync android"`, `"android:open": "cap open android"`.
