---
version: alpha
colors:
  primary: "#005baa"
  signature: "#e3062d"
  background: "#f5f8fb"
  foreground: "#141b25"
typography:
  sans:
    fontFamily: "Roboto, system-ui, sans-serif"
rounded:
  card: "14px"
omitted:
  - section: spacing
    reason: "Mantida na implementação canônica src/styles.css."
  - section: components
    reason: "Primitivos e proprietários documentados abaixo e em UX-CONTRACT.md."
---

# Mercadinho União — visual aprovado

## Gestão local — 08/10/2026

A gestão utiliza a identidade aprovada, tokens de src/theme/palette.css, cartões pos-card e coluna mobile existente. A assinatura visual continua sendo logo e dock; novas telas priorizam dados e ações, sem nova paleta ou decoração. Ajustes dá acesso a Gestão sem adicionar abas ao dock. Painéis de entrada, inventário, caixa, custos, clientes, atendimentos, backup e equipe compartilham ManagementUI. Native select/date/month aceitam popup do Android/navegador; não prometem geometria ou idioma controlados pelo app. Campos extras do produto ficam em disclosure opcional. Documentos históricos exibem situação e valores; cancelamento não apaga a venda. Pagamento dividido usa controle discreto dentro do enquadramento aprovado, mantendo logo, quatro abas e teclado.

## Direção

Reproduzir a proposta visual aprovada pelo usuário em 22/09/2026: interface de PDV clara, concisa e legível no celular. A identidade aprovada usa azul e vermelho; a imagem de composição é referência de layout, não fonte de dados.

## Tokens e componentes

Fonte canônica de cores: src/theme/palette.css, importada e mapeada para Tailwind por src/styles.css. Roboto com fallback system-ui. Fundo #f5f8fb, ação azul #005BAA, assinatura vermelha #E3062D e texto #141b25; cartões brancos com borda discreta, raio 14px e margem de tela 16px. Azul identifica navegação e ações. Vermelho pertence à marca e aos erros; a linha de leitura usa verde conforme a aprovação mais recente. Tema escuro usa as variáveis existentes. Sem duplicação de tokens em JavaScript.
Logotipo oficial: “MERCADINHO” condensado em vermelho no alto à esquerda, carrinho com produtos coloridos ao lado direito e “União” grande em vermelho abaixo, com deslocamento azul. A composição completa aparece na abertura e no cabeçalho do Início. A abertura usa uma variante opaca sobre fundo fixo #ffffff para que transparência e tema escuro não alterem as cores. O ícone usa o carrinho acima de “UNIÃO”, exatamente como a referência aprovada. Uma marca-d’água central com opacidade mínima pode aparecer atrás das telas, sem competir com dados ou controles.

A abertura nativa do Android usa fundo branco e drawable transparente, sem marca e sem animação de saída. Somente AppStartup apresenta a logo com “Abrindo…” por dois segundos. O cabeçalho do Início usa PNG com canal alfa para integrar a marca ao fundo da tela, sem retângulo branco.
Navegação do APK teste, aprovada em 04/10/2026: reproduzir o dock CODEXURE da referência 98824.jpg e da prévia clicável. Fonte canônica: src/styles.css, tokens --dock-*; proprietário compartilhado: src/components/BottomNavigation.tsx. Paleta ajustada à identidade do APK: superfície e contorno herdam --card e --border; bolha e rótulo herdam --primary; ícone ativo herda --primary-foreground; ícones inativos misturam --muted-foreground com 18% de --primary. No tema claro, barra branca, bolha azul #005BAA e ícone ativo branco. No tema escuro, a barra e a bolha acompanham as variáveis existentes. Gradiente, borda e brilho derivam da mesma cor primária; não manter laranja ou roxo da referência. Coordenadas proporcionais 550 × 140; bolha de 80, raio da barra 25, curva côncava com fundo em y=93 e ombros suaves, sem subir acima de y=45 e sem pontas; 5 posições entre 15% e 85%. Bolha, ícone e recorte usam o mesmo centro durante o movimento de 470ms. Apenas o rótulo ativo fica visível; todos os links mantêm nomes acessíveis. Cinco destinos existentes: Início, Histórico, Caixa, Estoque, Ajustes. Folga de 16px e safe area abaixo; pagamento e conteúdo reservam espaço acima da bolha. Movimento reduzido elimina animações. Não alterar o restante da identidade azul e vermelha para aplicar o dock.
Primitivos: Button, Input, Sheet e AlertDialog existentes. Estado: useStore. Feedback: sonner.

## Composição

Início: logotipo oficial e um único status; resumo diário com Nova venda; até três produtos de reposição; duas últimas vendas.
Caixa: título simples, câmera persistente, busca, lista com subtotal e quantidade, pagamento fixo acima da navegação.
Scanner: quatro cantos brancos independentes enquadram o código e uma linha verde atravessa a leitura; sem retângulo completo, ícone sobre a câmera, linha vermelha ou molduras sobrepostas. O botão “Digitar código” foi removido por solicitação do usuário em 06/10/2026. No Caixa, o campo de busca mantém entrada por nome/código. Em falha de câmera, a entrada numérica permanece visível; no estoque, o código pode ser preenchido no editor.
Estoque: lista primeiro, busca por nome/código, filtro de saldo <=5; cadastro/edição em Sheet.
Histórico: cabeçalho e cartões com a mesma densidade das demais rotas; filtros suaves, configurações somente em Ajustes e um único estado vazio por período.
Não colocar números ilustrativos, fotos de câmera ou botões sem função na produção.

## Responsividade e acessibilidade

Coluna até 512px; composição destinada a 320–430px. Respeitar safe areas e scroll natural. A barra de status do Android usa ícones escuros sobre o fundo claro e reaplica esse contraste ao voltar da câmera. Nomes longos quebram linha. Ícones de navegação sempre têm rótulos. Modais usam os primitivos Radix com título e descrição. Tema e movimento reduzido devem manter controles acessíveis.

O aplicativo abre sem senha, PIN, padrão ou biometria. Na inicialização fria do APK, o logotipo permanece visível por cerca de dois segundos antes da interface. A marca usa o arquivo limpo em tamanho contido para preservar nitidez.

O funcionamento operacional é local: produtos, estoque, carrinho, vendas, configurações e relatórios não dependem de internet nem enviam dados para a nuvem. A conexão é usada apenas para verificar e baixar uma atualização solicitada pelo usuário em Ajustes ou anunciada pelo verificador do aplicativo.

## Verificação

TypeScript, regressões do PDV e build web passam. A navegação tem verificação automatizada no navegador em 320, 360 e 430px, nos temas claro e escuro, incluindo cinco rotas, alinhamento da bolha, teclado, Voltar e troca rápida. Capturas são geradas pelo workflow do APK teste para revisão visual. Execução em dispositivo Android permanece pendente; não declarar fidelidade pixel a pixel no aparelho ou publicar como versão final sem essa validação.

Identidade aprovada em 02/10/2026: 98201.jpg inteira na abertura com “Abrindo…”, via public/brand/mercadinho-uniao-approved.jpg. No Início, a versão public/brand/mercadinho-uniao-logo-transparent.png mantém a composição com fundo transparente. A imagem 98202.jpg fornece o ícone Android e PWA, com margem segura nas variantes adaptativas. Os recursos são locais.

## Fotos e promoções do APK teste — 06/10/2026

ProductPhoto e ProductPrice são os proprietários compartilhados das imagens e preços no Estoque, Caixa e promoções. Fotos em quadros brancos com cantos arredondados; não mudar a cor da fotografia no tema escuro. Preço vigente em verde semântico (`--product-price-green`, alias de `--success` em src/theme/palette.css); numa promoção ativa, valor original vermelho e riscado, desconto em verde ao lado. Isso não muda a cor azul das ações. Promoção fica ao lado de Todos e Estoque baixo. O modal segue Dialog/Radix, com cartões arredondados para múltiplos produtos, foto à esquerda, valor e desconto lado a lado e duração por datas ou estoque abaixo. Em telas estreitas, as datas se empilham para preservar a leitura.

## Pagamentos — referências Canva fornecidas em 07/10/2026

As três referências SVG do proprietário definem a tela Pix branca com QR real, a tela de dinheiro em cinza/preto com teclado fixo e botão verde PAGO, e a tela de cartão com gradiente azul e ilustração da maquininha. A ilustração foi extraída com sua máscara de transparência do SVG de cartão; o logo completo aprovado continua sendo reutilizado. Os controles de troca de meio e confirmação manual preservam ações do fluxo anterior.

`PaymentSheet` é a variante de pagamento do Sheet modal canônico; foco, Escape, fundo inerte e retorno de foco continuam sob Radix. O teclado ocupa uma área fixa na base; em aparelhos baixos o resumo rola sem esconder o teclado. Valores, QR e troco vêm da venda atual. `PaymentSuccess` reutiliza a animação verde existente para todos os meios durante 2 segundos, com movimento reduzido respeitado.

## Paleta organizada — 08/10/2026

A fonte única de valores é src/theme/palette.css. src/styles.css possui aliases Tailwind e aplicações por componente, sem valores hexadecimais próprios. Componentes consultam papéis semânticos; não criam uma paleta por tela. DESIGN.md registra intenção, não substitui os tokens executáveis.

| Papel              | Claro                 | Escuro                     | Aplicação                                   |
| ------------------ | --------------------- | -------------------------- | ------------------------------------------- |
| Ação principal     | #005BAA / branco      | #72B8E8 / #071725          | botões, links, seleção e dock               |
| Fundo / cartão     | #F5F8FB / branco      | #111B26 / #182634          | todas as rotas, campos e modais             |
| Texto / secundário | #141B25 / #596777     | #F3F6FA / #A8B5C2          | títulos, labels, ajuda e filtros            |
| Sucesso            | #087B3E sobre #E4F5EC | #86EFAC sobre #17392A      | preço vigente, caixa aberto e monitor ativo |
| Aviso              | #8A4B00 sobre #FFF0D5 | #FFCC70 sobre #3B2D17      | estoque baixo e toast offline               |
| Erro               | #C11C36 sobre #FFEDF0 | #FF8595 sobre #431D29      | validação, ações destrutivas e notificações |
| Informação         | azul / azul suave     | azul claro / azul profundo | toasts e orientações                        |
| Marca              | #005BAA e #E3062D     | mesma arte                 | logo e ilustração, sem recolorir pixels     |

Os pares foreground são obrigatórios para fundos sólidos. Cor de texto semântica sobre superfície suave é diferente de texto sobre botão sólido. Estado continua identificável por nome/ícone, além da cor. Bordas dos campos e foco usam tokens com contraste; ajustes nativos de datas seguem color-scheme.

Pagamentos mantêm as composições aprovadas. Cartão usa gradiente derivado do azul da marca; dinheiro mantém painel e teclado escuros, com cinzas azulados da família neutra; dados e abas acompanham o tema. PAGO e confirmação usam o mesmo verde sólido #087B3E, com texto legível. Branco fixo é reservado para a logo, fotografia e QR; a confirmação verde e os elementos da câmera também mantêm contraste independente do tema. O brilho decorativo não é usado como cor do texto secundário.

Exceções técnicas intencionais: o raster QR é #0F172A sobre #FFFFFF, valores exigidos pelo gerador; a composição da foto continua branca; as cores de arranque/manifest nativos são valores estáticos compatíveis com a identidade. Esses pixels e metadados não são cores de controles. O fallback de erro do servidor importa a mesma paleta via CSS inline, sem segunda tabela de valores. ThemeApplier lê --background para a barra do navegador; NativeThemeBars usa a API SystemBars já incluída no Capacitor após a abertura branca e ao voltar ao app.

Verificação de regressão: e2e/palette-*.spec.cjs, tests/palette-browser.cjs, testes anteriores de navegação/Pix/pagamentos/scanner/promoções e testes de unidade. Plano e bugs reproduzidos em replica/.

## Dimensões dos pagamentos — 08/10/2026

PaymentSheet continua o proprietário único dos quatro meios. A geometria compartilhada está em src/styles.css: margem de 12px, logo contida sem deformação, quatro abas de mesma largura, ícones de 18×18px acima dos nomes e card flexível até a área segura inferior. A altura da logo é clamp(96px, 16dvh, 144px); abas de 60px. Em telas de até 700px de altura, a logo ocupa 80px, as abas 56px e os intervalos 8px. Essas medidas não dependem do meio selecionado: trocar dinheiro/Pix/débito/crédito não desloca logo, abas, card ou fechar.

Os três campos monetários do dinheiro compartilham largura de 55% e alinhamento à direita; os rótulos ocupam a outra coluna. Teclado fixo com quatro linhas e botão PAGO permanece na base do card; somente o resumo pode rolar em alturas insuficientes. O QR mantém proporção quadrada e reserva espaço para fechar. Cartão contém a ilustração sem deformá-la e alinha valor/status à margem interna do card.

Pix e cartão usam rolagem no conteúdo central; confirmação manual fica em um rodapé separado dentro do mesmo card, com expansão rolável e foco acessível. Nada nesta revisão altera paleta, notificações, cálculo de troco ou confirmação verde de dois segundos. Verificação de geometria em e2e/payment-dimensions.spec.cjs e tests/payment-dimensions-browser.cjs; capturas e medidas são comparadas entre os quatro meios, nos dois temas.
