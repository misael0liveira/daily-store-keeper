# Mercadinho União — visual aprovado

## Direção

Reproduzir a proposta visual aprovada pelo usuário em 22/09/2026: interface de PDV clara, concisa e legível no celular. A identidade aprovada usa azul e vermelho; a imagem de composição é referência de layout, não fonte de dados.

## Tokens e componentes

Fonte canônica: src/styles.css. Roboto com fallback system-ui. Fundo #f5f8fb, ação azul #005BAA, assinatura vermelha #E3062D e texto #141b25; cartões brancos com borda discreta, raio 14px e margem de tela 16px. Azul identifica navegação e ações. Vermelho pertence à marca e à linha do scanner; estados semânticos preservam suas próprias cores. Tema escuro usa as variáveis existentes. Sem duplicação de tokens em JavaScript.
Logotipo oficial: “MERCADINHO” condensado em vermelho no alto à esquerda, carrinho com produtos coloridos ao lado direito e “União” grande em vermelho abaixo, com deslocamento azul. A composição completa aparece na abertura e no cabeçalho do Início. A abertura usa uma variante opaca sobre fundo fixo #ffffff para que transparência e tema escuro não alterem as cores. O ícone usa o carrinho acima de “UNIÃO”, exatamente como a referência aprovada. Uma marca-d’água central com opacidade mínima pode aparecer atrás das telas, sem competir com dados ou controles.

A abertura nativa do Android usa fundo branco e drawable transparente, sem marca e sem animação de saída. Somente AppStartup apresenta a logo com “Abrindo…” por quatro segundos. O cabeçalho do Início usa PNG com canal alfa para integrar a marca ao fundo da tela, sem retângulo branco.
Navegação do APK teste, aprovada em 04/10/2026: reproduzir o dock CODEXURE da referência 98824.jpg e da prévia clicável. Fonte canônica: src/styles.css, tokens --dock-*; proprietário compartilhado: src/components/BottomNavigation.tsx. Paleta ajustada à identidade do APK: superfície e contorno herdam --card e --border; bolha e rótulo herdam --primary; ícone ativo herda --primary-foreground; ícones inativos misturam --muted-foreground com 18% de --primary. No tema claro, barra branca, bolha azul #005BAA e ícone ativo branco. No tema escuro, a barra e a bolha acompanham as variáveis existentes. Gradiente, borda e brilho derivam da mesma cor primária; não manter laranja ou roxo da referência. Coordenadas proporcionais 550 × 140; bolha de 80, raio da barra 25, curva côncava com fundo em y=93; 5 posições entre 15% e 85%. Bolha, ícone e recorte usam o mesmo centro durante o movimento de 470ms. Apenas o rótulo ativo fica visível; todos os links mantêm nomes acessíveis. Cinco destinos existentes: Início, Histórico, Caixa, Estoque, Ajustes. Folga de 16px e safe area abaixo; pagamento e conteúdo reservam espaço acima da bolha. Movimento reduzido elimina animações. Não alterar o restante da identidade azul e vermelha para aplicar o dock.
Primitivos: Button, Input, Sheet e AlertDialog existentes. Estado: useStore. Feedback: sonner.

## Composição

Início: logotipo oficial e um único status; resumo diário com Nova venda; até três produtos de reposição; duas últimas vendas.
Caixa: título simples, câmera persistente, busca, lista com subtotal e quantidade, pagamento fixo acima da navegação.
Scanner: quatro cantos brancos independentes enquadram o código e uma linha verde atravessa a leitura; sem retângulo completo, ícone sobre a câmera, linha vermelha ou molduras sobrepostas.
Estoque: lista primeiro, busca por nome/código, filtro de saldo <=5; cadastro/edição em Sheet.
Histórico: cabeçalho e cartões com a mesma densidade das demais rotas; filtros suaves, configurações somente em Ajustes e um único estado vazio por período.
Não colocar números ilustrativos, fotos de câmera ou botões sem função na produção.

## Responsividade e acessibilidade

Coluna até 512px; composição destinada a 320–430px. Respeitar safe areas e scroll natural. A barra de status do Android usa ícones escuros sobre o fundo claro e reaplica esse contraste ao voltar da câmera. Nomes longos quebram linha. Ícones de navegação sempre têm rótulos. Modais usam os primitivos Radix com título e descrição. Tema e movimento reduzido devem manter controles acessíveis.

O aplicativo abre sem senha, PIN, padrão ou biometria. Na inicialização fria do APK, o logotipo permanece visível por cerca de quatro segundos antes da interface. A marca usa o arquivo limpo em tamanho contido para preservar nitidez.

O funcionamento operacional é local: produtos, estoque, carrinho, vendas, configurações e relatórios não dependem de internet nem enviam dados para a nuvem. A conexão é usada apenas para verificar e baixar uma atualização solicitada pelo usuário em Ajustes ou anunciada pelo verificador do aplicativo.

## Verificação

TypeScript, regressões do PDV e build web passam. A navegação tem verificação automatizada no navegador em 320, 360 e 430px, nos temas claro e escuro, incluindo cinco rotas, alinhamento da bolha, teclado, Voltar e troca rápida. Capturas são geradas pelo workflow do APK teste para revisão visual. Execução em dispositivo Android permanece pendente; não declarar fidelidade pixel a pixel no aparelho ou publicar como versão final sem essa validação.

Identidade aprovada em 02/10/2026: 98201.jpg inteira na abertura com “Abrindo…”, via public/brand/mercadinho-uniao-approved.jpg. No Início, a versão public/brand/mercadinho-uniao-logo-transparent.png mantém a composição com fundo transparente. A imagem 98202.jpg fornece o ícone Android e PWA, com margem segura nas variantes adaptativas. Os recursos são locais.
