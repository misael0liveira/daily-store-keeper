# Digitação manual no Caixa (código ou nome do produto)

Hoje o Caixa só permite digitar o código quando a câmera é negada. Vamos ter um campo de digitação sempre disponível na tela do Caixa, que aceita **código de barras ou nome do produto**.

## Mudanças

1. **Campo de busca sempre visível** na tela do Caixa, logo abaixo do botão/leitor: "Digitar código ou nome do produto".
2. **Busca inteligente**:
   - Se o texto for exatamente um código de barras cadastrado, o produto entra direto no carrinho (com bipe, vibração e aviso), e o campo limpa.
   - Enquanto digita, mostra uma lista de produtos cadastrados cujo nome ou código contenha o texto; tocar num produto adiciona ao carrinho com o mesmo feedback do leitor.
   - Se não houver nenhum resultado, mostra "Nenhum produto encontrado" discreto.
3. **Integração com o leitor**: o campo funciona com o leitor aberto ou fechado — serve justamente para quando o leitor não consegue identificar o código (embalagem amassada, código ilegível).
4. Mantém tudo o resto igual: carrinho, total, formas de pagamento.

## Detalhes técnicos

- Apenas `src/routes/index.tsx`: novo estado `query`, input com ícone de teclado/lupa, lista de sugestões filtrada de `products` (por código exato ou nome/código contendo o texto, case-insensitive), limitada a ~6 resultados; ao adicionar, limpa o campo e reusa `handleScan`-like add com `addToCart`, `beep`, `vibrate`, `toast`.
- Enter no teclado do celular (`onKeyDown` / form submit) adiciona o primeiro resultado ou o código exato.
- Verificação: Playwright na prévia testando digitação de nome parcial, código exato e texto sem resultado.
