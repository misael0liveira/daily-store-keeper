# Bugs reproduzidos na aplicação do Figma

## UXFIG-001 — S3 — Troco oculto no aparelho curto

Passos: pagamento/dinheiro em320×568. Esperado: resumo e teclado utilizáveis. Atual: última linha encoberta.
Causa: cabeçalho/total grande consumiam o resumo. Correção: variante de cabeçalho56px, total28px e resumo compacto. Evidência: payment-dimensions;48casos passaram após correção.

## UXFIG-002 — S3 — Contraste da assinatura no escuro

Passos: dark360 abrir escolha. Vermelho de marca pequeno falhou3,58:1. Correção: papel brand-label em palette.css usa vermelho legível no escuro, preservando arte original. Evidência: axe/payment-choice39casos passaram.

## UXFIG-003 — S3 — Vencidos no resumo azul

Passos: Fiados lista. Foreground herdado branco sobre fundo do erro suave falhoucontraste. Correção: tirar fundo/padding/borda de erro na variante do total, mantendo rótulo. Evidência: axe e fiados.

## UXFIG-004 — S3 — Troco no tema escuro

Passos: dinheiro dark320. Verde sólido sobre success-soft escuro falhoucontraste. Correção: foreground semântico success acompanha tema; confirmação continua sólido independente.

## UXFIG-005 — S3 — Grid legado do tema escuro

Passos: dark430 Histórico ou dark360 Fiados; clicar cliente perto da navegação. Esperado: largura da tela e item alcançável. Atual: Histórico511px em430px; nav interceptava item.
Causa reproduzida: seletor .dark .m3-app-content compartilhava display:grid/place-items:center/padding:0 com .stage de uma composição antiga. Correção: limitar essas propriedades à .stage e manter owner comum de conteúdo com reserva da navegação. Verificado: 21casos Figma,14combinações palette e69casos fiados passaram.

## Limitações

Não simular confirmação bancária real. Dados dos fixtures não são inseridos no aplicativo de produção. Teste físico permanece separado.

## UXFIG-006 — S2 — Primeiro reload offline da PWA sem CSS

Passos: contexto novo, compra e recebimento Pix, offline e reload sem navegar documentos completos antes. Atual: somente links de navegação, sem CSS e sem rota. Reproduzido emfiados-failure-Pix.png.
Causa: CSS/módulos/fontes da primeira carga chegaram antes de o service worker controlar a página; warmPagesCache aquecia HTML, sem os recursos iniciais. Correção: aquecer recursos estáticos same-origin já carregados após document.fonts.ready em assets-v1; não inclui dados/blob/API ou recursos externos. Não muda comportamento do APK nativo, que serve recursos locais. Verificado:69casos fiados, incluindo reload offline, passaram.

Todos os seis bugs reproduzidos foram corrigidos e verificados antes da publicação. Nenhum S1/S2 aberto.
