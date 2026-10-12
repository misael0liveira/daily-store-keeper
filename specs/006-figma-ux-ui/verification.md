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

## Android

Pendente: workflow canônico,Gradle unit/assembleRelease,apksigner e cache da chave. O APK não é entregue antes de sucesso.

## Physical verification

Não executada: câmera/lanterna física,tecladoAndroid,notificações bancárias reais,insets do aparelho e instalação sobreteste anterior comdados.
