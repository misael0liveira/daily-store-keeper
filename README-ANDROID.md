# Mini Market POS — app Android (Capacitor)

Este projeto continua sendo o mesmo site/PWA de sempre. Além disso, agora ele
está preparado para virar um app Android instalável (APK ou AAB) usando o
Capacitor.

- Nome do app: **Mini Market POS**
- Identificador (package): **app.minimarket.pos**
- Versão inicial: `versionCode 1`, `versionName 1.0` (em `android/app/build.gradle`)
- Telas do app são pré-geradas em HTML, então o app abre sem internet e os dados
  continuam salvos no próprio aparelho.

## 1. O que instalar no seu computador

1. **Node.js 20+** (ou Bun) — para rodar o projeto.
2. **Android Studio** (última versão): https://developer.android.com/studio
   - Na primeira abertura, aceite instalar o **Android SDK**, o
     **Android SDK Platform-Tools** e um **Android SDK Build-Tools**.
   - Em *Settings → Languages & Frameworks → Android SDK*, marque uma
     plataforma API **34 ou superior**.
3. **JDK 21** — o Android Studio já vem com um JDK embutido; se rodar pelo
   terminal, defina `JAVA_HOME` para esse JDK.

## 2. Baixar o projeto e preparar o app

No terminal, na pasta do projeto:

```sh
npm install            # ou: bun install
npm run android:sync   # gera as telas e copia tudo para a pasta android/
npm run android:open   # abre o projeto no Android Studio
```

- `android:sync` = `vite build` + `cap sync android`.
  **Rode sempre depois de mudar qualquer coisa no app**, senão o Android
  continua com a versão antiga das telas.
- `android:open` abre a pasta `android/` no Android Studio.

## 3. Gerar um APK de teste (para instalar no seu celular)

No Android Studio, com o projeto aberto:

1. Espere terminar o *Gradle Sync* (barra de progresso no rodapé).
2. Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. Ao terminar, clique em **locate** na notificação, ou pegue o arquivo em:
   `android/app/build/outputs/apk/debug/app-debug.apk`
4. Copie esse `.apk` para o celular (cabo USB, Google Drive, WhatsApp Web...),
   abra o arquivo no celular e autorize **"Instalar apps de fontes desconhecidas"**.

Alternativa mais rápida (celular ligado no cabo USB, com **Depuração USB**
ativada nas Opções do desenvolvedor): clique no botão ▶ **Run** do Android
Studio, ou rode `npm run android:run`.

## 4. Gerar o AAB assinado (para publicar na Google Play)

1. Menu **Build → Generate Signed App Bundle / APK…**
2. Escolha **Android App Bundle** → **Next**.
3. Em *Key store path*, clique em **Create new…** e preencha:
   - caminho do arquivo (ex.: `~/keys/minimarket.jks`)
   - senha do keystore, alias da chave (ex.: `minimarket`) e senha da chave
   - nome/organização (pode ser qualquer coisa coerente)
   > **Guarde esse arquivo e as senhas.** Sem eles você não consegue publicar
   > atualizações do app na Play Store.
4. **Next** → variante **release** → **Create**.
5. O arquivo sai em: `android/app/build/outputs/bundle/release/app-release.aab`

Antes de publicar, suba o `versionCode` (número inteiro, +1 a cada envio) e o
`versionName` em `android/app/build.gradle`.

## 5. Permissões

Já configuradas em `android/app/src/main/AndroidManifest.xml`:

| Permissão | Para quê |
| --- | --- |
| `INTERNET` | exigida pelo Capacitor (o app funciona offline mesmo assim) |
| `CAMERA` | leitura do código de barras |
| `VIBRATE` | vibração ao ler um código |
| `uses-feature camera` (`required="false"`) | permite instalar em aparelhos sem câmera |

A permissão de câmera é pedida **na hora** em que a pessoa abre o leitor
(Android 6+). Se ela negar:

- o app mostra um aviso e mantém o campo para **digitar o código ou o nome**
  do produto, sem travar a venda;
- para liberar depois: *Configurações do Android → Apps → Mini Market POS →
  Permissões → Câmera → Permitir*.

## 6. Leitor de código de barras

O mesmo componente atende os dois mundos:

- **No navegador / PWA**: leitor `html5-qrcode` pela câmera do navegador (como
  antes, nada mudou).
- **No app Android**: leitor nativo do Google ML Kit
  (`@capacitor-mlkit/barcode-scanning`) — mais rápido e confiável para EAN/UPC
  dentro do WebView, com o diálogo de permissão do próprio Android.

A escolha é automática (`src/lib/platform.ts` → `isNativeApp()`).

## 7. Atualizar o app depois de mexer no projeto

```sh
npm run android:sync
```

Depois gere o APK/AAB de novo (passos 3 ou 4). A pasta `android/` pode ficar
versionada no Git; as saídas de build (`android/app/build`) já são ignoradas.

## 8. Problemas comuns

| Sintoma | Solução |
| --- | --- |
| Tela branca no app | rodou `npm run android:sync` depois da última mudança? |
| *SDK location not found* | abra a pasta `android/` pelo Android Studio uma vez; ele cria o `local.properties` |
| Gradle falha por causa do Java | use o JDK embutido: *Settings → Build Tools → Gradle → Gradle JDK* |
| Câmera não abre | confira a permissão de Câmera nas configurações do app |
| Emulador não lê código | emulador não tem câmera real; use um celular de verdade ou o campo de digitação |
