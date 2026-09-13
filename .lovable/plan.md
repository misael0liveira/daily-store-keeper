# Gerar o APK e instalar no seu celular

## Contexto

O projeto já tem a pasta `android/` completa (Capacitor, nome "Mini Market POS", ID `app.minimarket.pos`, ícones, permissões de câmera). O que falta é compilar o APK — e isso só é possível no **seu computador com o Android Studio**, não aqui no Lovable. Este plano deixa tudo pronto da nossa parte e resume o que você faz no seu computador.

## O que eu faço aqui

1. **Corrigir antes a navegação "Nova venda" → `/vender`** (pendência do dashboard: na validação, clicar em "Nova venda" mudava a URL mas a tela de venda não aparecia). Investigo a causa e valido com teste no navegador de teste.
2. **Atualizar as telas do app Android** (`npm run android:sync`) para que a versão Android contenha o dashboard novo e todas as últimas melhorias — sem isso o APK sairia com telas antigas.
3. **Conferir o README-ANDROID.md** e atualizá-lo se algo mudou, deixando o passo a passo do APK no ponto.
4. Publicar o site (para que o PWA no Chrome e o APK fiquem na mesma versão, facilitando sua comparação).

## O que você faz no seu computador (resumo)

1. Baixar o projeto (botão GitHub do Lovable, ou Clone/Download).
2. Instalar **Android Studio** (ele já vem com o JDK necessário).
3. No terminal, na pasta do projeto: `npm install` e depois `npm run android:open`.
4. No Android Studio: menu **Build → Build APK(s)**.
5. O arquivo sai em `android/app/build/outputs/apk/debug/app-debug.apk` — copie para o celular (cabo USB, Drive ou WhatsApp Web) e instale autorizando "fontes desconhecidas".

Alternativa sem cópia manual: conectar o celular por USB com a depuração USB ativada e tocar no botão ▶ Run do Android Studio — ele instala direto.

## Para comparar com o PWA

Abra no Chrome do celular o endereço publicado (daily-store-keeper.lovable.app) e instale pelo "Instalar app". Você terá os dois ícones: o PWA (Chrome) e o Mini Market POS (APK). Os dados ficam salvos separadamente em cada um, então cadastre os produtos em ambos para comparar.

## Detalhes técnicos

- Correção da rota `/vender`: investigar `src/routes/vender.tsx` e o link em `src/routes/index.tsx`; validar com Playwright (clique em "Nova venda" deve mostrar "Abrir leitor de código").
- `android:sync` = `vite build` + `cap sync android` (copia `dist/client` para `android/app/src/main/assets/public`).
- O APK de debug já serve para testar; o AAB assinado só é necessário para a Play Store.
