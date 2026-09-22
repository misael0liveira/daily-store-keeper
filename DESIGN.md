# Mercadinho União — visual aprovado

## Direção

Reproduzir a proposta visual aprovada pelo usuário em 22/09/2026: interface de PDV clara, concisa e legível no celular. A identidade aprovada usa azul e vermelho; a imagem de composição é referência de layout, não fonte de dados.

## Tokens e componentes

Fonte canônica: src/styles.css. Roboto com fallback system-ui. Fundo #f5f8fb, ação azul #005BAA, assinatura vermelha #E3062D e texto #141b25; cartões brancos com borda discreta, raio 14px e margem de tela 16px. Azul identifica navegação e ações. Vermelho pertence à marca e à linha do scanner; estados semânticos preservam suas próprias cores. Tema escuro usa as variáveis existentes. Sem duplicação de tokens em JavaScript.
Logotipo oficial: carrinho bicolor à esquerda, “MERCADINHO” em vermelho e “UNIÃO” em vermelho com assinatura azul. A composição completa aparece na abertura e na autenticação; em ícones pequenos, usar somente o símbolo compacto para preservar a leitura.
Navegação: __root.tsx. Cinco destinos: Início, Histórico, Caixa, Estoque, Ajustes. Círculo ativo móvel com sombra neutra, folga visível e recorte côncavo cúbico, estreito e de entrada suave na superfície. O ícone ativo fica dentro do círculo e seu rótulo logo abaixo. Configurações pertencem a Ajustes. Movimento horizontal de 240ms; animação reduzida respeitada.
Primitivos: Button, Input, Sheet e AlertDialog existentes. Estado: useStore. Feedback: sonner.

## Composição

Início: nome configurado e um único status; resumo diário com Nova venda; até três produtos de reposição; duas últimas vendas.
Caixa: título simples, câmera persistente, busca, lista com subtotal e quantidade, pagamento fixo acima da navegação.
Scanner: quatro cantos brancos independentes enquadram o código e uma linha verde atravessa a leitura; sem retângulo completo, ícone sobre a câmera, linha vermelha ou molduras sobrepostas.
Estoque: lista primeiro, busca por nome/código, filtro de saldo <=5; cadastro/edição em Sheet.
Histórico: cabeçalho e cartões com a mesma densidade das demais rotas; filtros suaves, configurações somente em Ajustes e um único estado vazio por período.
Não colocar números ilustrativos, fotos de câmera ou botões sem função na produção.

## Responsividade e acessibilidade

Coluna até 512px; composição destinada a 320–430px. Respeitar safe areas e scroll natural. A barra de status do Android usa ícones escuros sobre o fundo claro e reaplica esse contraste ao voltar da câmera. Nomes longos quebram linha. Ícones de navegação sempre têm rótulos. Modais usam os primitivos Radix com título e descrição. Tema e movimento reduzido devem manter controles acessíveis.

## Verificação

TypeScript e build web passam. Verificação visual no navegador e execução Android permanecem pendentes: navegador remoto recusou localhost e não há dispositivo Android conectado. Não declarar fidelidade pixel a pixel ou publicar como versão final sem essa validação.
