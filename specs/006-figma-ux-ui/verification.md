# Verification — UX/UI Figma

## Source and authorization

Figma GHzHMsVXHvcj9U0JEvWPg2, aprovado em12/10/2026. Usuário autorizou implementação pelas capturas/especificações após limite Starter impedir nova extração. Worktree feat/figma-apk54 isolado; publicação na branch canônica feat/fotos-promocoes-curva-suave conserva cache/chave de teste.

## Implementation

PageHeader e navegação plana compartilhados; câmeras e busca originais; cliente compacto com remoção acessível; cartões, totais e fontes WOFF2 locais; PaymentSheet e fiado reutilizados; fotos/QR/valores reais. Histórico/estoque/clientes/ajustes seguem mesma hierarquia. Sem schema ou regra de dinheiro/estoque modificada. Aquecimento inicial da PWA corrige reload offline reproduzido, somente recursos estáticos same-origin.

## Local verification

- TypeScript --noEmit: passou.
- Node tests/*.test.mjs:49passaram.
- Vite build: passou, shell SPA presente.
- ESLint dos arquivos de produção alterados:0erros;1aviso legado de react-refresh emButton.
- Lint geral:242erros/6avisos; mesmos totais na base sem mudança. Pendências anteriores (principalmente formatação) não foram ampliadas; não se declara lint global limpo.
- Auditoria premium strict:0achados.
- Navegação:5destinos,3larguras,temas,teclado/Voltar e labels permanentes passaram.
- Geometria de pagamentos:48combinações,4meios,temas,320×568a414×896,insets24px e valor grande passaram.
- Figma-layout:21estados/larguras com screenshots,axe,controles44px e rascunho sem gravação passaram.
- Escolha:39casos passaram, agora X único fecha a escolha.
- Fiados:69casos passaram, inclusive entrada,limite,recibos,parcelas,reload offline,CPF e backup.
- Reposição:42casos passaram.
- Gestão:48casos passaram.
- Palette:14combinações com axe e console/5xx limpos passaram.
- Pix:duas vendas de valor idêntico,referências/QR/cópia distintos,offline e persistência passaram.
- Scanner:abertura explícita,câmera simulada,permissão negada,busca e zeros à esquerda passaram.
- Pagamentos:notificações sintéticas de quatro provedores,respostas obsoletas,troco e sucesso2s passaram.
- Promoções/fotos:CRUD,atômico,datas,persistência,depleção e venda offline passaram.

## Fix loop

Ver replica/bugs-figma.md. Seis defeitos reproduzidos,corrigidos e verificados. Nenhum S1/S2 aberto.

## Android and publication

- Code commit: a2fe30099fe0c57a83391c35620652557add9c18, tree bb78c50535b248dd648b28742ce3d099b3d96e3a identical to the tested local tree.
- Workflow APK54: https://github.com/misael0liveira/daily-store-keeper/actions/runs/38305806619 — success. Job114999446126.
- Canonical CI repeated navigation,Figma21,unit49,Pix,payments,scanner,promotions,palette14,dimensions48,management48,fiados69,replenishment42 andchoice39 successfully.
- Gradle testDebugUnitTest/assembleRelease: BUILD SUCCESSFUL in2m2s.
- apksigner verify and APK inspection: success.
- Signing cache: Cache hit for mercadinho-vision-test-signing-v1; restored successfully. Same test signing cache asAPK53, no replacement key.
- Separate preview applicationId and version54 preserved by the existing workflow.
- Download: https://github.com/misael0liveira/daily-store-keeper/releases/download/layout-test-54/Mercadinho-Uniao-Teste.apk
- SHA256: 406bda8c531242b5487fab7facd0f85a1b739b43169cf8ac546799682a7899be.
- Size30321683bytes. Source tree is unchanged after release; the closing commit only records evidence.

## Physical verification

Não executada: câmera/lanterna física,tecladoAndroid,notificações bancárias reais,insets do aparelho e instalação sobreteste anterior comdados.
