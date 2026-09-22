# Mercado — visual aprovado

## Direção
Reproduzir a proposta visual aprovada pelo usuário em 22/09/2026: interface de PDV clara, verde, concisa e legível no celular. A imagem é referência de composição, não fonte de dados.

## Tokens e componentes
Fonte canônica: src/styles.css. Roboto com fallback system-ui. Fundo #f5f8f7, ação #087d49, texto #141b25; cartões brancos com borda discreta, raio 14px e margem de tela 16px. Tema escuro usa as variáveis existentes. Sem duplicação de tokens em JavaScript.
Navegação: __root.tsx. Cinco destinos: Início, Histórico, Caixa, Estoque, Ajustes. Círculo ativo móvel e recorte côncavo na superfície. Configurações pertencem a Ajustes. Animação reduzida respeitada.
Primitivos: Button, Input, Sheet e AlertDialog existentes. Estado: useStore. Feedback: sonner.

## Composição
Início: nome configurado e um único status; resumo diário com Nova venda; até três produtos de reposição; duas últimas vendas.
Caixa: título simples, câmera persistente, busca, lista com subtotal e quantidade, pagamento fixo acima da navegação.
Estoque: lista primeiro, busca por nome/código, filtro de saldo <=5; cadastro/edição em Sheet.
Não colocar números ilustrativos, fotos de câmera ou botões sem função na produção.

## Responsividade e acessibilidade
Coluna até 512px; composição destinada a 320–430px. Respeitar safe areas e scroll natural. Nomes longos quebram linha. Ícones de navegação sempre têm rótulos. Modais usam os primitivos Radix com título e descrição. Tema e movimento reduzido devem manter controles acessíveis.

## Verificação
TypeScript e build web passam. Verificação visual no navegador e execução Android permanecem pendentes: navegador remoto recusou localhost e não há dispositivo Android conectado. Não declarar fidelidade pixel a pixel ou publicar como versão final sem essa validação.
