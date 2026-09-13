# Dashboard operacional do Mini Market POS

Redesenhar o início como uma visão operacional mobile-first, mantendo o PDV, scanner, estoque, vendas, Pix, PDF e dados já salvos.

## Estrutura

- A rota inicial vira **Início**, com cabeçalho compacto, situação do caixa, configurações e os principais números de hoje.
- O caixa atual passa integralmente para **Vender**, sem mudanças na lógica de leitura, carrinho ou pagamento.
- A barra inferior terá **Início, Vender, Estoque e Mais**, com Vender visualmente dominante.
- **Mais** reunirá os acessos já existentes a vendas, relatórios e configurações.

## Conteúdo do início

- Faturamento, número de vendas e ticket médio de hoje, calculados das vendas já registradas.
- Comparação percentual com ontem e gráfico compacto por hora, também derivados do histórico local existente.
- Ações rápidas para vender, estoque e abrir/fechar caixa.
- Alertas reais de estoque baixo e sem estoque.
- Últimas vendas com horário, itens, pagamento e total.
- Resumo de caixa usando as informações disponíveis: vendas de hoje como entradas e saldo atual; saídas permanecem zeradas e identificadas como não registradas.
- Estados vazios claros quando ainda não houver produtos ou vendas.

## Visual

- Inter em toda a interface, números com hierarquia forte, fundo claro sofisticado e superfícies brancas.
- Verde profundo para operação e venda, amarelo apenas para atenção e vermelho apenas para perigo.
- Bordas discretas, raio de 12–16 px, sombras sutis, alvos de toque amplos e foco de teclado visível.
- Dark mode equivalente, sem perder contraste ou significado das cores.

## Detalhes técnicos

- Criar uma tela de dashboard em `/` e mover o PDV existente para `/vender`, preservando seu código funcional.
- Derivar métricas, comparativo, série horária, alertas e últimas vendas com seletores/memos sobre `sales` e `products` já persistidos.
- Acrescentar somente o estado necessário de caixa aberto/fechado ao mesmo armazenamento local, com migração compatível para não perder dados existentes.
- Criar `/mais` como menu de navegação para as telas já existentes.
- Atualizar a navegação global, tokens visuais e páginas estáticas do Android/PWA.
- Validar Início e Vender em celular e desktop, modo claro/escuro e ausência de regressões no fluxo de venda.
